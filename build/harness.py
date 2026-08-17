#!/usr/bin/env python3
"""
webOS CE Doctor — Phase 0 repack harness.

Pipeline: unpack the OEM Doctor JAR -> apply an overlay of file changes to the
rootfs -> regenerate the ipkg md5sum database for the changes -> verify with a
faithful re-implementation of the on-device `integcheck ... ipkg` check ->
repack into a flashable JAR, with the FlasherThread `checkToFlash` gate patched
off and the JAR unsigned.

No device required. Nothing here changes the OS behaviour beyond the overlay you
supply; with no overlay it produces a functionally-identical (re-signed-off,
gate-patched) Doctor.

Subcommands:
  extract       JAR -> work/webos/ (webOS.tar members incl. rootfs.tar.gz on disk)
  integcheck    Faithful `integcheck ... ipkg` dry-run over a rootfs tar.gz
  build         extract (if needed) -> apply overlay -> regen md5 -> integcheck ->
                repack -> patched, unsigned CE Doctor JAR
  patch-flasher Show/verify the FlasherThread checkToFlash patch on a class file

See build/README.md for the model and the overlay format.
"""

import argparse
import fnmatch
import gzip
import hashlib
import io
import json
import os
import shutil
import sys
import tarfile
import time
import zipfile

# ---- Constants tied to this Doctor / device (topaz) -------------------------

WEBOS_TAR_ENTRY = "resources/webOS.tar"
ROOTFS_MEMBER = "./nova-cust-image-topaz.rootfs.tar.gz"
FLASHER_CLASS = "com/palm/nova/installer/core/FlasherThread.class"
MAIN_CLASS = "com.palm.nova.installer.recoverytool.RecoveryTool"
IPKG_INFO_DIR = "./usr/lib/ipkg/info"

# integcheck ipkg-mode semantics, copied verbatim from /usr/sbin/integcheck.
IGNORE_IPKG_PREFIXES = ("./dev", "./media/internal", "./var")
FS_EXCLUDE_PREFIXES = ("./usr/lib/ipkg", "./dev", "./media/internal", "./var")
IPKG_ROOTFS_EXTRA_FILES = (
    "./etc/passwd", "./etc/group", "./etc/version", "./etc/ipkg/arch.conf",
)
# ROOTFS_EXTRA_FILES: files that may exist yet are in no md5sums list. Globs allowed.
ROOTFS_EXTRA_FILES = (
    "./usr/share/omadm/internal", "./usr/share/omadm/beta",
    "./usr/share/omadm/carrier", "./usr/share/omadm/production",
    "./usr/share/omadm/none", "./etc/ld.so.cache", "./usr/bin/PmUpdater.save",
    "./usr/lib/libipkg.so.0.0.0.save", "./usr/update-save-lib/*", "./.reboot",
    "./etc/.rootfs_RW", "./etc/modules", "./etc/modules.conf",
    "./etc/modules.conf.old", "./lib/modules/*/modules.*",
    "./etc/ppp/connect-errors", "./etc/.configured", "./boot/lib", "./boot/usr",
    "./boot/bin", "./boot/sbin", "./etc/fstab", "./etc/fs.d/*",
    "./usr/share/omadm/sdk", "./md5sums", "./md5sums.gz",
)

BLOCK = 1 << 20


def log(msg):
    print(f"[ce-harness] {msg}", file=sys.stderr, flush=True)


def norm(path):
    """Normalize a member/overlay path to integcheck's './...' form."""
    p = path.replace("\\", "/")
    if p.startswith("/"):
        p = "." + p
    elif not p.startswith("./"):
        p = "./" + p.lstrip("./") if not p.startswith(".") else p
    return p


def md5_stream(fileobj):
    h = hashlib.md5()
    while True:
        b = fileobj.read(BLOCK)
        if not b:
            break
        h.update(b)
    return h.hexdigest()


def md5_file(path):
    with open(path, "rb") as f:
        return md5_stream(f)


# ---- extract ----------------------------------------------------------------

def cmd_extract(jar_path, work):
    webos_dir = os.path.join(work, "webos")
    os.makedirs(webos_dir, exist_ok=True)
    meta = {"order": [], "members": {}}
    log(f"opening {jar_path}")
    with zipfile.ZipFile(jar_path) as z:
        with z.open(WEBOS_TAR_ENTRY) as wf:
            tf = tarfile.open(fileobj=wf, mode="r|")
            for m in tf:
                meta["order"].append(m.name)
                meta["members"][m.name] = {
                    "mode": m.mode, "uid": m.uid, "gid": m.gid,
                    "uname": m.uname, "gname": m.gname, "mtime": int(m.mtime),
                    "type": m.type.decode() if isinstance(m.type, bytes) else m.type,
                    "size": m.size,
                }
                out = os.path.join(webos_dir, os.path.basename(m.name))
                if m.isfile():
                    log(f"  extract {m.name} ({m.size} bytes)")
                    src = tf.extractfile(m)
                    with open(out, "wb") as o:
                        shutil.copyfileobj(src, o, BLOCK)
                # dirs/other webOS.tar members: recorded in meta, no content
    with open(os.path.join(webos_dir, ".tarmeta.json"), "w") as f:
        json.dump(meta, f, indent=2)
    log(f"extracted webOS.tar members -> {webos_dir}")
    rootfs = os.path.join(webos_dir, os.path.basename(ROOTFS_MEMBER))
    if not os.path.exists(rootfs):
        raise SystemExit(f"ERROR: rootfs member not found: {ROOTFS_MEMBER}")
    log(f"base rootfs: {rootfs}")
    return webos_dir


# ---- overlay + md5 regeneration ---------------------------------------------

def load_overlay(overlay_dir):
    """Return (adds_replaces, removes, symlinks, changes_cfg).

    adds_replaces: {normpath: local_file_path} regular files from overlay/rootfs/**
    removes:       [normpath, ...] from changes.json
    symlinks:      {normpath: target} — symlinks found in overlay/rootfs/** (their
                   link target is read with os.readlink; NOT followed). integcheck
                   treats symlinks as invisible (-type f), so these carry no md5.
    changes_cfg:   parsed changes.json (may declare a ce_package name, adds' owners)
    """
    adds = {}
    removes = []
    symlinks = {}
    cfg = {}
    if not overlay_dir:
        return adds, removes, symlinks, cfg
    cfg_path = os.path.join(overlay_dir, "changes.json")
    if os.path.exists(cfg_path):
        with open(cfg_path) as f:
            cfg = json.load(f)
        removes = [norm(p) for p in cfg.get("remove", [])]
    root = os.path.join(overlay_dir, "rootfs")
    if os.path.isdir(root):
        for dirpath, _dirs, files in os.walk(root):
            for name in files:
                full = os.path.join(dirpath, name)
                rel = os.path.relpath(full, root)
                if os.path.islink(full):
                    symlinks[norm(rel)] = os.readlink(full)
                else:
                    adds[norm(rel)] = full
    return adds, removes, symlinks, cfg


def read_base_metadata(rootfs_tar):
    """One streaming pass over the base rootfs tar.

    Collects: member path set, the raw bytes of every *.md5sums under the ipkg
    info dir, and each member's TarInfo (for edit-in-place of tracked files).
    """
    present = set()
    md5sums_files = {}   # './usr/lib/ipkg/info/<pkg>.md5sums' -> text
    log(f"pass A (metadata): scanning {rootfs_tar}")
    tf = tarfile.open(rootfs_tar, mode="r|gz")
    for m in tf:
        name = norm(m.name)
        present.add(name)
        if name.startswith(IPKG_INFO_DIR + "/") and name.endswith(".md5sums"):
            md5sums_files[name] = tf.extractfile(m).read().decode("utf-8", "replace")
    tf.close()
    log(f"  {len(present)} members, {len(md5sums_files)} .md5sums files")
    return present, md5sums_files


def find_owner(path, md5sums_files):
    """Which package's .md5sums lists `path` (normpath). Returns member name or None."""
    needle_suffixes = (" *" + path + "\n", " *" + path)
    for member, text in md5sums_files.items():
        for line in text.splitlines():
            # format: "<md5> *./path"
            parts = line.split(" *", 1)
            if len(parts) == 2 and norm(parts[1].strip()) == path:
                return member
    return None


def plan_md5_updates(adds, removes, present, md5sums_files, ce_pkg):
    """Compute the new content for every .md5sums we must rewrite, plus new
    members for a CE package covering brand-new tracked files.

    Returns (md5sums_rewrites, new_members) where:
      md5sums_rewrites: {member_name: new_text}
      new_members: {normpath: bytes}  (e.g. the CE package's .md5sums/.list/status additions)
    """
    rewrites = {name: text for name, text in md5sums_files.items()}  # start from copies
    ce_md5_member = f"{IPKG_INFO_DIR}/{ce_pkg}.md5sums"
    ce_list_member = f"{IPKG_INFO_DIR}/{ce_pkg}.list"
    ce_entries = {}   # path -> md5   (new files with no existing owner)
    changed = set()

    def is_ignored(p):
        return any(p == pre or p.startswith(pre + "/") for pre in IGNORE_IPKG_PREFIXES)

    # Removals: drop the path's line from its owning .md5sums.
    for p in removes:
        owner = find_owner(p, rewrites)
        if owner:
            rewrites[owner] = "\n".join(
                ln for ln in rewrites[owner].splitlines()
                if not (ln.split(" *", 1)[-1].strip() == p.lstrip("."))
                and norm(ln.split(" *", 1)[-1].strip()) != p
            ) + ("\n" if rewrites[owner].endswith("\n") else "")
            changed.add(owner)

    # Adds/replaces: compute md5 and route to the owning package or the CE package.
    for p, local in sorted(adds.items()):
        if is_ignored(p):
            continue  # /var,/dev,/media/internal not tracked by integcheck
        digest = md5_file(local)
        owner = find_owner(p, rewrites)
        line = f"{digest} *{p}"
        if owner:
            new_lines = []
            replaced = False
            for ln in rewrites[owner].splitlines():
                cur = ln.split(" *", 1)
                if len(cur) == 2 and norm(cur[1].strip()) == p:
                    new_lines.append(line)
                    replaced = True
                else:
                    new_lines.append(ln)
            if not replaced:
                new_lines.append(line)
            rewrites[owner] = "\n".join(new_lines) + "\n"
            changed.add(owner)
        else:
            ce_entries[p] = digest

    new_members = {}
    if ce_entries:
        existing = rewrites.get(ce_md5_member, "")
        lines = [ln for ln in existing.splitlines() if ln.strip()]
        have = {norm(ln.split(" *", 1)[-1].strip()) for ln in lines if " *" in ln}
        for p, digest in sorted(ce_entries.items()):
            if p not in have:
                lines.append(f"{digest} *{p}")
        text = "\n".join(lines) + "\n"
        rewrites[ce_md5_member] = text
        changed.add(ce_md5_member)
        # a matching .list so the package looks installed to tooling
        list_text = "\n".join(sorted(p.lstrip(".") for p in ce_entries)) + "\n"
        new_members[norm(ce_list_member)] = list_text.encode()

    # Normalize every rewritten file: entry lines only, and a file whose
    # entries were ALL removed must be truly EMPTY (0 bytes, like stock's
    # genuinely empty md5sums). Serializing it as a lone "\n" leaves a blank
    # line, and the DEVICE integcheck (busybox `md5sum -c` over the
    # concatenation of every *.md5sums) counts each blank line as a failed
    # checksum — SILENTLY (the per-line error goes to stderr, which integcheck
    # discards) — failing the whole flash with "Base ROM Failed Verification,
    # CODE 1" and no visible detail. Confirmed live 2026-08-17: 14 emptied
    # packages -> 14 blank lines -> flash fail at the ROM Verifyer stage.
    for name in changed:
        if name in rewrites:
            lines = [ln for ln in rewrites[name].splitlines() if ln.strip()]
            rewrites[name] = "\n".join(lines) + "\n" if lines else ""

    # Only return the .md5sums we actually changed.
    rewrites = {k: v for k, v in rewrites.items() if k in changed}
    return rewrites, new_members, ce_entries


# ---- rootfs rewrite (streaming) ---------------------------------------------

def rewrite_rootfs(base_tar, out_tar, adds, removes, md5sums_rewrites, new_members, symlinks=None):
    """Pass B: stream base rootfs -> out, substituting/removing/appending.

    Untouched members are copied verbatim (TarInfo preserved: mode, uid/gid,
    device nodes, symlinks). Edited/added members are forced to root:root (0/0).
    symlinks: {normpath: target} emitted as SYMTYPE members (replacing any base
    member at that path); invisible to integcheck, so no md5 bookkeeping.
    """
    symlinks = symlinks or {}
    sym_set = {norm(p) for p in symlinks}
    substitutions = {}          # normpath -> ('file', local) | ('bytes', b'...')
    for p, local in adds.items():
        substitutions[p] = ("file", local)
    for member, text in md5sums_rewrites.items():
        substitutions[norm(member)] = ("bytes", text.encode())
    remove_set = set(removes) | sym_set   # drop any base file we're replacing with a symlink
    appended = set()

    def make_ti(path, size, mode=0o644):
        ti = tarfile.TarInfo(name=path if path.startswith("./") else "./" + path.lstrip("./"))
        ti.size = size
        ti.mode = mode
        ti.uid = ti.gid = 0
        ti.uname = ti.gname = "root"
        ti.mtime = FIXED_MTIME
        ti.type = tarfile.REGTYPE
        return ti

    log(f"pass B (rewrite): {base_tar} -> {out_tar}")
    src = tarfile.open(base_tar, mode="r|gz")
    with tarfile.open(out_tar, mode="w:gz") as dst:
        n = 0
        for m in src:
            n += 1
            name = norm(m.name)
            if name in remove_set:
                log(f"  remove  {name}")
                continue
            if name in substitutions and m.isfile():
                kind, val = substitutions[name]
                if kind == "file":
                    size = os.path.getsize(val)
                    ti = make_ti(name, size, mode=m.mode)  # keep original mode
                    with open(val, "rb") as f:
                        dst.addfile(ti, f)
                    log(f"  replace {name} ({size} bytes)")
                else:
                    data = val
                    ti = make_ti(name, len(data), mode=m.mode)
                    dst.addfile(ti, io.BytesIO(data))
                    log(f"  update  {name} (md5sums)")
                appended.add(name)
            else:
                # verbatim passthrough (preserve all TarInfo)
                if m.isfile():
                    dst.addfile(m, src.extractfile(m))
                else:
                    dst.addfile(m)  # dirs, symlinks, hardlinks, devices
        # brand-new files not present in the base
        for name, val in substitutions.items():
            if name in appended:
                continue
            kind, v = val
            if kind == "file":
                size = os.path.getsize(v)
                # Brand-new files keep the overlay source's exec bit (0755/0644):
                # replaced files inherit the base member's mode above, but an
                # added binary (e.g. /usr/bin/curl) has no base member to copy.
                mode = 0o755 if (os.stat(v).st_mode & 0o111) else 0o644
                ti = make_ti(name, size, mode=mode)
                with open(v, "rb") as f:
                    dst.addfile(ti, f)
                log(f"  add     {name} ({size} bytes, mode {mode:o})")
            else:
                ti = make_ti(name, len(v))
                dst.addfile(ti, io.BytesIO(v))
                log(f"  add     {name}")
            appended.add(name)
        for name, data in new_members.items():
            if name in appended:
                continue
            ti = make_ti(name, len(data))
            dst.addfile(ti, io.BytesIO(data))
            log(f"  add     {name} (ipkg meta)")
        # symlinks (SYMTYPE) — invisible to integcheck, emitted verbatim
        for name, target in symlinks.items():
            nm = norm(name)
            if nm in appended:
                continue
            ti = tarfile.TarInfo(name=nm if nm.startswith("./") else "./" + nm.lstrip("./"))
            ti.type = tarfile.SYMTYPE
            ti.linkname = target
            ti.mode = 0o777
            ti.uid = ti.gid = 0
            ti.uname = ti.gname = "root"
            ti.mtime = FIXED_MTIME
            dst.addfile(ti)
            log(f"  symlink {nm} -> {target}")
            appended.add(nm)
        log(f"  {n} source members processed")


FIXED_MTIME = 1324497600  # 2011-12-21, stable so rebuilds are reproducible


# ---- integcheck (faithful ipkg-mode dry-run) --------------------------------

def _allowlisted(path):
    for pat in ROOTFS_EXTRA_FILES:
        if pat == path or fnmatch.fnmatch(path, pat):
            return True
    return False


def cmd_integcheck(rootfs_tar, quiet=False):
    """Re-implementation of `integcheck -r <root> ipkg` (a_opt=s_opt=q_opt=0)."""
    md5_of = {}
    fsfiles = set()
    md5sums_texts = {}
    root_manifest = None  # md5sums.gz contents (text)

    log(f"integcheck: reading {rootfs_tar}")
    tf = tarfile.open(rootfs_tar, mode="r|gz")
    for m in tf:
        name = norm(m.name)
        if name.startswith(IPKG_INFO_DIR + "/") and name.endswith(".md5sums"):
            md5sums_texts[name] = tf.extractfile(m).read().decode("utf-8", "replace")
            continue
        if name == "./md5sums.gz":
            try:
                root_manifest = gzip.decompress(tf.extractfile(m).read()).decode("utf-8", "replace")
            except Exception:
                root_manifest = None
            continue
        if m.isfile() or m.islnk():
            # regular file (or hardlink -> a regular file on device): -type f
            if not any(name == p or name.startswith(p + "/") for p in FS_EXCLUDE_PREFIXES):
                fsfiles.add(name)
            if m.isfile():
                md5_of[name] = md5_stream(tf.extractfile(m))
    tf.close()

    # expected[path] = md5, from all package md5sums minus IGNORE_IPKG paths.
    # Malformed lines — including BLANK ones — are counted as failures: the
    # device's real integcheck runs busybox `md5sum -c` over the concatenation
    # of every *.md5sums, and each such line is a (silent, stderr-only) failed
    # checksum there. Skipping them here let a lone-"\n" md5sums file pass the
    # build and fail the flash at the ROM Verifyer (confirmed live 2026-08-17).
    expected = {}
    malformed = []
    for member, text in md5sums_texts.items():
        for line in text.splitlines():
            parts = line.split(" *", 1)
            if len(parts) != 2:
                malformed.append((member, line))
                continue
            digest = parts[0].strip()
            path = norm(parts[1].strip())
            if any(path == pre or path.startswith(pre + "/") for pre in IGNORE_IPKG_PREFIXES):
                continue
            expected[path] = digest

    # borrow the 4 rootfs-extra files from the root manifest (as integcheck does)
    borrowed = set()
    if root_manifest:
        for line in root_manifest.splitlines():
            parts = line.split(" *", 1)
            if len(parts) != 2:
                continue
            path = norm(parts[1].strip())
            if path in IPKG_ROOTFS_EXTRA_FILES:
                expected[path] = parts[0].strip()
                borrowed.add(path)

    # corrupt / missing
    missing, failed = [], []
    for path, digest in expected.items():
        if path not in md5_of:
            if path not in fsfiles:  # a hardlink target may lack md5_of but exist
                missing.append(path)
        elif md5_of[path] != digest:
            failed.append(path)

    # ADDED: files on disk absent from the md5 list and not allowlisted
    md5files = set(expected.keys()) | borrowed | {"./md5sums", "./md5sums.gz"}
    added = []
    for f in sorted(fsfiles):
        if f in md5files or _allowlisted(f):
            continue
        added.append(f)

    status = 0
    if failed or missing or malformed:
        status += 1
    if added:
        status += 16

    if not quiet:
        for p in sorted(missing):
            print(f"{p}: MISSING")
        for p in sorted(failed):
            print(f"{p}: FAILED")
        for p in added:
            print(f"{p}: ADDED")
        for member, line in malformed:
            print(f"{member}: MALFORMED LINE {line!r} (would fail device md5sum -c)")
        if status == 0:
            print("integcheck IPKG VERIFICATION SUCCEEDED")
        else:
            print(f"integcheck IPKG VERIFICATION FAILED, CODE {status}")
        print(f"  checked={len(expected)} fsfiles={len(fsfiles)} "
              f"missing={len(missing)} failed={len(failed)} added={len(added)} "
              f"malformed={len(malformed)}")
    return status


# ---- FlasherThread bytecode patch -------------------------------------------

def _find_fieldref_index(data, field_name):
    """Parse the class constant pool; return the Fieldref cp-index whose
    NameAndType name == field_name. Robust to constant-pool renumbering."""
    if data[:4] != b"\xca\xfe\xba\xbe":
        raise SystemExit("ERROR: not a Java class file")
    n = int.from_bytes(data[8:10], "big")  # constant_pool_count
    p = 10
    utf8 = {}          # idx -> str
    nameandtype = {}   # idx -> (name_idx, desc_idx)
    fieldref = {}      # idx -> (class_idx, nat_idx)
    i = 1
    while i < n:
        tag = data[p]; p += 1
        if tag == 1:  # Utf8
            ln = int.from_bytes(data[p:p+2], "big"); p += 2
            utf8[i] = data[p:p+ln].decode("utf-8", "replace"); p += ln
        elif tag in (7, 8, 16):        # Class, String, MethodType: u2
            p += 2
        elif tag in (9, 10, 11, 12, 18, 17, 19, 20):  # *ref/NAT/(Invoke)Dynamic: u2 u2
            a = int.from_bytes(data[p:p+2], "big")
            b = int.from_bytes(data[p+2:p+4], "big")
            if tag == 9:
                fieldref[i] = (a, b)
            elif tag == 12:
                nameandtype[i] = (a, b)
            p += 4
        elif tag in (3, 4):            # Integer, Float: u4
            p += 4
        elif tag in (5, 6):            # Long, Double: u8, occupies TWO slots
            p += 8; i += 1
        elif tag == 15:                # MethodHandle: u1 u2
            p += 3
        else:
            raise SystemExit(f"ERROR: unknown constant pool tag {tag} at slot {i}")
        i += 1
    name_utf8_idx = next((k for k, v in utf8.items() if v == field_name), None)
    if name_utf8_idx is None:
        raise SystemExit(f"ERROR: field name {field_name!r} not in constant pool")
    nat_idxs = {k for k, (nm, _d) in nameandtype.items() if nm == name_utf8_idx}
    fr = [k for k, (_c, nat) in fieldref.items() if nat in nat_idxs]
    if len(fr) != 1:
        raise SystemExit(f"ERROR: expected 1 Fieldref for {field_name}, found {len(fr)}: {fr}")
    return fr[0]


def patch_flasher_bytes(data):
    """Force checkToFlash=false by neutralizing setCheckFlash():
    aload_0; iload_1; putfield #idx; return  ->  aload_0; iconst_0; putfield ...

    Length-preserving (iload_1=0x1b -> iconst_0=0x03), stack-safe, verifier-clean.
    The 2-arg constructor already defaults checkToFlash=false, so the setter is
    the only path that flips it true. The target putfield is disambiguated by the
    exact constant-pool Fieldref index for checkToFlash (not a hardcoded value).
    """
    import re
    idx = _find_fieldref_index(data, "checkToFlash")
    idx_bytes = idx.to_bytes(2, "big")
    # setter shape: aload_0(2A) iload_1(1B) putfield(B5) <idx> return(B1)
    pat = re.compile(rb"\x2a\x1b\xb5" + re.escape(idx_bytes) + rb"\xb1", re.DOTALL)
    hits = list(pat.finditer(data))
    if len(hits) != 1:
        raise SystemExit(f"ERROR: expected exactly 1 setCheckFlash(#{idx}) pattern, "
                         f"found {len(hits)}")
    off = hits[0].start()
    patched = data[:off + 1] + b"\x03" + data[off + 2:]  # iload_1 -> iconst_0
    return patched, off, idx


def cmd_patch_flasher(class_path, write=False):
    with open(class_path, "rb") as f:
        data = f.read()
    patched, off, idx = patch_flasher_bytes(data)
    log(f"setCheckFlash: iload_1->iconst_0 at file offset {off} (putfield #{idx})")
    if write:
        with open(class_path, "wb") as f:
            f.write(patched)
        log(f"patched in place: {class_path}")
    else:
        log("dry-run (pass --write to apply)")
    return patched


# ---- repack -----------------------------------------------------------------

def rebuild_webos_tar(webos_dir, out_path):
    """Rebuild resources/webOS.tar from work/webos/ in the original member order."""
    with open(os.path.join(webos_dir, ".tarmeta.json")) as f:
        meta = json.load(f)
    log(f"rebuilding webOS.tar -> {out_path}")
    with tarfile.open(out_path, mode="w") as tf:
        for name in meta["order"]:
            info = meta["members"][name]
            base = os.path.basename(name)
            local = os.path.join(webos_dir, base)
            ti = tarfile.TarInfo(name=name)
            ti.mode = info["mode"]
            ti.uid = info["uid"]; ti.gid = info["gid"]
            ti.uname = info["uname"]; ti.gname = info["gname"]
            ti.mtime = info["mtime"]
            t = info["type"]
            if os.path.isfile(local) and (t == "0" or t == "\x00" or t == tarfile.REGTYPE.decode() if isinstance(tarfile.REGTYPE, bytes) else True) and os.path.isfile(local):
                ti.type = tarfile.REGTYPE
                ti.size = os.path.getsize(local)
                with open(local, "rb") as fh:
                    tf.addfile(ti, fh)
            else:
                ti.type = tarfile.DIRTYPE if t == "5" else tarfile.REGTYPE
                ti.size = 0
                tf.addfile(ti)


def rebuild_jar(src_jar, out_jar, new_webos_tar):
    """Copy every entry from src_jar into out_jar, except:
      - resources/webOS.tar   (substitute new_webos_tar)
      - META-INF/*.SF, *.RSA  (drop -> unsigned)
      - META-INF/MANIFEST.MF  (replace with a minimal Main-Class manifest)
      - FlasherThread.class   (apply the checkToFlash patch)
    """
    manifest = (
        "Manifest-Version: 1.0\r\n"
        f"Main-Class: {MAIN_CLASS}\r\n"
        "Created-By: webOS CE harness (Phase 0)\r\n"
        "\r\n"
    ).encode()
    log(f"repacking JAR -> {out_jar}")
    with zipfile.ZipFile(src_jar) as zin, \
         zipfile.ZipFile(out_jar, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            n = item.filename
            up = n.upper()
            if n == WEBOS_TAR_ENTRY:
                continue
            if up.startswith("META-INF/") and (up.endswith(".SF") or up.endswith(".RSA") or up.endswith(".DSA")):
                log(f"  drop signature {n}")
                continue
            if n == "META-INF/MANIFEST.MF":
                zi = zipfile.ZipInfo("META-INF/MANIFEST.MF", date_time=item.date_time)
                zi.compress_type = zipfile.ZIP_DEFLATED
                zi.external_attr = item.external_attr
                zout.writestr(zi, manifest)
                log("  rewrote MANIFEST.MF (unsigned, Main-Class only)")
                continue
            data = zin.read(n)
            if n == FLASHER_CLASS:
                data, off, idx = patch_flasher_bytes(data)
                log(f"  patched FlasherThread.class (checkToFlash off @ {off})")
            zi = zipfile.ZipInfo(n, date_time=item.date_time)
            zi.compress_type = zipfile.ZIP_DEFLATED if not n.endswith("/") else zipfile.ZIP_STORED
            zi.external_attr = item.external_attr
            zout.writestr(zi, data)
        # add the rebuilt webOS.tar (stored: it's already-compressed content)
        zi = zipfile.ZipInfo(WEBOS_TAR_ENTRY, date_time=(2011, 12, 21, 11, 45, 0))
        zi.compress_type = zipfile.ZIP_STORED
        with open(new_webos_tar, "rb") as f:
            zout.writestr(zi, f.read())
        log(f"  added {WEBOS_TAR_ENTRY} ({os.path.getsize(new_webos_tar)} bytes, stored)")


# ---- build orchestrator -----------------------------------------------------

def cmd_build(args):
    t0 = time.time()
    work = args.work
    os.makedirs(work, exist_ok=True)
    webos_dir = os.path.join(work, "webos")
    base_rootfs = os.path.join(webos_dir, os.path.basename(ROOTFS_MEMBER))

    if args.reextract or not os.path.exists(base_rootfs):
        cmd_extract(args.jar, work)
    else:
        log(f"reusing extracted rootfs: {base_rootfs}")

    adds, removes, symlinks, cfg = load_overlay(args.overlay)
    ce_pkg = cfg.get("ce_package", "org.webosarchive.ce-files")
    log(f"overlay: {len(adds)} add/replace, {len(removes)} remove, {len(symlinks)} symlink"
        + (f" (from {args.overlay})" if args.overlay else " (none)"))

    new_rootfs = os.path.join(webos_dir, "rootfs.ce.tar.gz")
    if adds or removes or symlinks:
        present, md5sums_files = read_base_metadata(base_rootfs)
        rewrites, new_members, ce_entries = plan_md5_updates(
            adds, removes, present, md5sums_files, ce_pkg)
        log(f"md5 regen: {len(rewrites)} .md5sums files updated, "
            f"{len(ce_entries)} new files attributed to {ce_pkg}")
        rewrite_rootfs(base_rootfs, new_rootfs, adds, removes, rewrites, new_members, symlinks)
    else:
        log("no overlay changes: rootfs passes through unchanged")
        # still round-trip so the output is produced by the same path
        rewrite_rootfs(base_rootfs, new_rootfs, {}, [], {}, {}, {})

    status = cmd_integcheck(new_rootfs, quiet=False)
    if status != 0 and not args.allow_integcheck_fail:
        raise SystemExit(f"ERROR: integcheck failed (code {status}); aborting. "
                         "Fix the overlay/md5 attribution or pass --allow-integcheck-fail.")

    # swap the new rootfs into webos_dir, rebuild webOS.tar, then the JAR
    shutil.copyfile(new_rootfs, base_rootfs)
    webos_tar = os.path.join(work, "webOS.ce.tar")
    rebuild_webos_tar(webos_dir, webos_tar)
    rebuild_jar(args.jar, args.out, webos_tar)

    log(f"DONE in {time.time()-t0:.0f}s -> {args.out} "
        f"({os.path.getsize(args.out)} bytes)")


# ---- CLI --------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description="webOS CE Doctor Phase 0 repack harness")
    sub = ap.add_subparsers(dest="cmd", required=True)

    pe = sub.add_parser("extract", help="unpack JAR -> work/webos/")
    pe.add_argument("--jar", required=True)
    pe.add_argument("--work", required=True)

    pi = sub.add_parser("integcheck", help="faithful integcheck ipkg dry-run over a rootfs tar.gz")
    pi.add_argument("rootfs_tar")
    pi.add_argument("-q", "--quiet", action="store_true")

    pp = sub.add_parser("patch-flasher", help="patch/verify FlasherThread.class")
    pp.add_argument("class_path")
    pp.add_argument("--write", action="store_true")

    pb = sub.add_parser("build", help="full pipeline -> CE Doctor JAR")
    pb.add_argument("--jar", required=True, help="OEM Doctor JAR (repack base)")
    pb.add_argument("--out", required=True, help="output CE Doctor JAR")
    pb.add_argument("--work", required=True, help="work directory")
    pb.add_argument("--overlay", help="overlay dir (rootfs/ + changes.json)")
    pb.add_argument("--reextract", action="store_true")
    pb.add_argument("--allow-integcheck-fail", action="store_true")

    args = ap.parse_args()
    if args.cmd == "extract":
        cmd_extract(args.jar, args.work)
    elif args.cmd == "integcheck":
        sys.exit(cmd_integcheck(args.rootfs_tar, quiet=args.quiet))
    elif args.cmd == "patch-flasher":
        cmd_patch_flasher(args.class_path, write=args.write)
    elif args.cmd == "build":
        cmd_build(args)


if __name__ == "__main__":
    main()
