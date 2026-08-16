#!/usr/bin/env python3
"""
bake.py — generate build/overlays/full-ce/ : the COMPLETE CE Doctor overlay.

EVERYTHING IS BAKED. Every app, patch and file is placed at its FINAL rootfs
path at build time, so the device is fully installed the moment the flash lays
down — no staged ipks, no first-boot install, no postinst machinery. Each ipk's
postinst file-effects are REPLAYED here on the build host (we can't run the ARM
postinsts, and they write to absolute system paths anyway), then the harness
regens md5sums and integchecks the result.

Inputs come from <project>/AddToImage/ (the user's statement of intent):
  PatchOrReplace/  ipks that fix or replace an existing system component
  NewApps/         brand-new apps to pre-install
  Media-Internal/  static content for /media/internal (delivered via the stock
                   customization copy_binaries mechanism at first boot — the
                   media partition survives Doctor flashes, so first-boot copy
                   is the only route; this is exactly how HP shipped wallpapers)

Tiers (hard order — browser lays down /usr/lib/ssl11 that the rest need):
  1. browser-tls13     -> /usr/lib/ssl11 OpenSSL 1.1.1w stack + RPATH'd BrowserServer
  2. downloadmgr-tls13 -> /usr/lib/ssl11dl libcurl + RPATH'd LunaDownloadMgr
  3. luna-tls13        -> LunaSysMgr upstart env, media-pipeline/setcpushares wrappers
  4. mail-tls13        -> /usr/lib/ssl11mail stack + mojomail launcher env + ECDSA cnf
  5. mojomail-imap-tagfix -> one-byte IMAP-tag patch to /usr/bin/mojomail-imap
  6. LunaCE            -> prebuilt LunaSysMgr binary + launcher3 tab images
  7. App Catalog       -> BAKED to /usr/palm/applications (stock staged ipk removed)
  8. Maps 4.0.1        -> BAKED to /usr/palm/applications (stock staged ipk removed)
  9. Accounts app      -> community build swapped over the stock rootfs app
 10. help-redirect     -> Help app repointed at help.webosarchive.org
 11. rootcertsupdate   -> full trust-store replay: trustedcerts dir, hash links,
                          ca-certificates.crt bundle, calinks.tgz (host openssl,
                          -subject_hash_old to match the device's OpenSSL 0.9.8)
 12. UberKernel        -> /boot kernel + shipped /lib/modules subset
 13. Preware           -> BAKED app + ipkgservice in /usr/sbin + static dbus/ls2/
                          upstart (feed seeding runs from the job's pre-start)
 14. USB settings      -> BAKED app + service + /usr/bin daemons + upstart + roles
 15. BT gamepad        -> shim lib + udev rule + jail/bluetoothtab/upstart patches
 16. Media-Internal    -> /usr/lib/luna/customization/copy_binaries/media/internal
 17. remove HP preloads (kindle/facebook/youtube) via early upstart job
 18. version string    -> "webOS CE 3.1.0"

Rollback-only backups (*-orig) are DROPPED everywhere: a CE device recovers by
re-Doctoring (locked decision). The *.real exec targets ARE kept (wrappers exec
them, so they're functional).

Usage:  python3 bake.py        (from build/full-ce/)
"""
import glob
import gzip
import hashlib
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tarfile

HERE = os.path.dirname(os.path.abspath(__file__))          # build/full-ce
BUILD = os.path.dirname(HERE)                               # build
PROJ = os.path.dirname(BUILD)                               # webos-doctor-ce
SIBLINGS = os.path.dirname(PROJ)                            # ~/Projects

ROOTFS_TGZ = os.path.join(BUILD, "work", "webos", "nova-cust-image-topaz.rootfs.tar.gz")
LUNACE = os.path.join(SIBLINGS, "LunaCE")

ATI = os.path.join(PROJ, "AddToImage")
POR = os.path.join(ATI, "PatchOrReplace")
NEWAPPS = os.path.join(ATI, "NewApps")
MEDIA = os.path.join(ATI, "Media-Internal")


def ati_ipk(folder, pkgprefix):
    """Newest <pkgprefix>_*.ipk in an AddToImage folder (mtime, not version —
    a corrected rebuild can reuse the same version string)."""
    cands = glob.glob(os.path.join(folder, pkgprefix + "_*.ipk"))
    if not cands:
        sys.exit(f"ERROR: no {pkgprefix}_*.ipk in {folder}")
    return max(cands, key=os.path.getmtime)


IPK = {
    "browser":     ati_ipk(POR, "org.webosinternals.browser-tls13"),
    "downloadmgr": ati_ipk(POR, "org.webosinternals.downloadmgr-tls13"),
    "luna":        ati_ipk(POR, "org.webosinternals.luna-tls13"),
    "mail":        ati_ipk(POR, "org.webosinternals.mail-tls13"),
    "kernel":      ati_ipk(POR, "org.webosinternals.kernels.uber-kernel-touchpad"),
    "catalog":     ati_ipk(POR, "com.palm.app.enyo-findapps"),
    "maps":        ati_ipk(POR, "com.palm.app.maps"),
    "accounts":    ati_ipk(POR, "org.webosarchive.accountsapp"),
    # NOTE the FILENAME has an underscore: com.palm_.rootcertsupdate_*
    "rootcerts":   ati_ipk(POR, "com.palm_.rootcertsupdate"),
    "preware":     ati_ipk(NEWAPPS, "org.webosinternals.preware"),
    "govnah":      ati_ipk(NEWAPPS, "org.webosinternals.govnah"),
    "usb":         ati_ipk(NEWAPPS, "com.webosarchive.usbsettings"),
    "bt":          ati_ipk(NEWAPPS, "org.webosarchive.btgamepad"),
}
# org.webosarchive.tls-updates is a META package (README-only payload; its
# Depends list is what we bake individually) — deliberately not consumed.
# org.webosinternals.{curl-tls13,ntpdate-sync} are baked by the community-
# firstuse overlay (make-overlay.sh), which now also prefers AddToImage.
# org.webosinternals.mojomail-imap-tagfix*: the fix is a one-byte patch to the
# stock binary (md5 table below) — the ipk's payload is never read.

CF_OVERLAY = os.path.join(BUILD, "overlays", "community-firstuse")
OUT = os.path.join(BUILD, "overlays", "full-ce")
OUT_ROOT = os.path.join(OUT, "rootfs")

CE_PACKAGE = "org.webosarchive.ce-files"

# mojomail-imap tag patch: stock md5 -> (offset, patched md5). Selected by device build.
IMAP_TAGFIX = {
    "9f6489ae48fc131733c1a88a9aa1056a": (991784, "78956f6daf374a9a940e914459f234c3"),
    "df8d18e4e3bbd3dbbe2a2e1fa32c9921": (991664, "d127895e6d5d1b2c009fd11ea03cfbad"),
}

MAILSSL_CNF = (
    "openssl_conf = openssl_init\n"
    "[openssl_init]\n"
    "ssl_conf = ssl_sect\n"
    "[ssl_sect]\n"
    "system_default = system_default_sect\n"
    "[system_default_sect]\n"
    "MaxProtocol = TLSv1.2\n"
    "SignatureAlgorithms = RSA+SHA256:RSA+SHA384:RSA+SHA512\n"
)
MAIL_PFX = ("/usr/bin/env LD_BIND_NOW=1 LD_LIBRARY_PATH=/usr/lib/ssl11mail "
            "LD_PRELOAD=/usr/lib/ssl11mail/libssl_compat.so "
            "CURL_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt "
            "SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt")
MAIL_OPENSSL_CONF = "OPENSSL_CONF=/usr/lib/ssl11mail/mailssl.cnf "

CERT_EXTS = (".pem", ".cer", ".der", ".crt")


def log(m): print(f"[bake] {m}")


def md5(b):
    return hashlib.md5(b).hexdigest()


# ---- helpers ----------------------------------------------------------------

def ipk_extract_data(ipk_path, dest):
    """ar x <ipk>; tar xzf data.tar.gz -> dest. Returns dest."""
    os.makedirs(dest, exist_ok=True)
    tmp = os.path.join(dest, "_ar")
    os.makedirs(tmp, exist_ok=True)
    subprocess.run(["ar", "x", ipk_path], cwd=tmp, check=True)
    with tarfile.open(os.path.join(tmp, "data.tar.gz")) as tf:
        tf.extractall(dest, filter="data")
    return dest


def read_rootfs(tgz, exact=(), prefixes=()):
    """Single streaming pass. Returns {member_name: entry} where entry is
    {'type':'file','data':bytes} or {'type':'link','link':target}."""
    out = {}
    exact = set(exact)
    prefixes = tuple(prefixes)
    with tarfile.open(tgz, mode="r|gz") as tf:
        for m in tf:
            if m.name not in exact and not m.name.startswith(prefixes):
                continue
            if m.isfile():
                out[m.name] = {"type": "file", "data": tf.extractfile(m).read()}
            elif m.issym():
                out[m.name] = {"type": "link", "link": m.linkname}
    missing = exact - set(out)
    if missing:
        sys.exit(f"ERROR: rootfs members not found: {sorted(missing)}")
    return out


def w(relpath, data, mode=0o644):
    """Write a regular file into the overlay rootfs tree."""
    p = os.path.join(OUT_ROOT, relpath)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "wb") as f:
        f.write(data if isinstance(data, (bytes, bytearray)) else data.encode())
    os.chmod(p, mode)
    log(f"  file    /{relpath} ({len(data)} bytes, {mode:o})")


def wcopy(relpath, srcfile, mode=0o644):
    with open(srcfile, "rb") as f:
        w(relpath, f.read(), mode)


def symlink(relpath, target):
    """Create a real symlink in the overlay tree (harness reads it with readlink)."""
    p = os.path.join(OUT_ROOT, relpath)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    if os.path.lexists(p):
        os.remove(p)
    os.symlink(target, p)
    log(f"  symlink /{relpath} -> {target}")


def bake_tree(srcroot, quiet=True):
    """Bake an extracted payload tree into the overlay at identical paths.
    Skips the _ar scratch dir. Files keep exec-ness (755/644); symlinks kept."""
    n = 0
    for dp, dns, fns in os.walk(srcroot):
        dns[:] = [x for x in dns if x != "_ar"]
        for fn in fns:
            full = os.path.join(dp, fn)
            rel = os.path.relpath(full, srcroot)
            if os.path.islink(full):
                p = os.path.join(OUT_ROOT, rel)
                os.makedirs(os.path.dirname(p), exist_ok=True)
                if os.path.lexists(p):
                    os.remove(p)
                os.symlink(os.readlink(full), p)
            else:
                mode = 0o755 if (os.stat(full).st_mode & 0o111) else 0o644
                p = os.path.join(OUT_ROOT, rel)
                os.makedirs(os.path.dirname(p), exist_ok=True)
                shutil.copyfile(full, p)
                os.chmod(p, mode)
            n += 1
    if quiet:
        log(f"  baked {n} entries from {os.path.basename(srcroot)}")
    return n


def sure_replace(text, old, new, what, count=None):
    """str.replace with a loud failure if the anchor is missing (or if the
    patched form is already present — base not pristine)."""
    if new in text:
        sys.exit(f"ERROR: {what}: already patched (base not pristine)")
    c = text.count(old)
    if c == 0:
        sys.exit(f"ERROR: {what}: anchor not found: {old[:60]!r}")
    if count is not None and c != count:
        sys.exit(f"ERROR: {what}: expected {count} anchors, found {c}")
    return text.replace(old, new)


# ---- host-openssl helpers (rootcerts tier) ----------------------------------

def x509(certbytes, *args):
    inform = [] if b"CERTIFICATE" in certbytes else ["-inform", "der"]
    r = subprocess.run(["openssl", "x509", "-noout", *inform, *args],
                       input=certbytes, capture_output=True)
    return r


def cert_ok(b):
    return x509(b, "-subject").returncode == 0


def cert_expired(b):
    return x509(b, "-checkend", "0").returncode != 0


def cert_hash_old(b):
    # The device's OpenSSL is 0.9.8: its `-hash` is the OLD subject-hash
    # algorithm, so links MUST be named with -subject_hash_old.
    r = x509(b, "-subject_hash_old")
    if r.returncode != 0:
        return None
    return r.stdout.decode().strip()


def cert_fingerprint(b):
    r = x509(b, "-fingerprint", "-sha1")
    if r.returncode != 0:
        return None
    return r.stdout.decode().strip().split("=", 1)[-1].replace(":", "")


# ---- main -------------------------------------------------------------------

def main():
    for req in (ROOTFS_TGZ, os.path.join(LUNACE, "bin", "LunaSysMgr-LunaCE-topaz"),
                *IPK.values()):
        if not os.path.exists(req):
            sys.exit(f"ERROR: missing required input: {req}")
    if not os.path.isdir(MEDIA):
        sys.exit(f"ERROR: missing {MEDIA}")
    for k, v in sorted(IPK.items()):
        log(f"input {k:12s} {os.path.basename(v)}")

    # 0) re-extract a PRISTINE OEM rootfs. build-ce-doctor.sh's build step copies
    # the CE rootfs over work/'s base (harness cmd_build), so a prior build leaves
    # the base already-patched; the community patches would then fail to re-apply.
    log("re-extracting pristine OEM rootfs")
    jar = os.path.join(PROJ, "webosdoctorp305hstnhwifi.jar")
    subprocess.run([sys.executable, os.path.join(BUILD, "harness.py"),
                    "extract", "--jar", jar, "--work", os.path.join(BUILD, "work")],
                   check=True, stdout=subprocess.DEVNULL)

    # 1) base = the community first-use overlay (regenerate from pristine rootfs)
    log("regenerating community-firstuse overlay (base layer)")
    subprocess.run([os.path.join(BUILD, "community-firstuse", "make-overlay.sh")],
                   check=True, stdout=subprocess.DEVNULL)
    if os.path.exists(OUT):
        shutil.rmtree(OUT)
    shutil.copytree(CF_OVERLAY, OUT, symlinks=True)
    log("copied community-firstuse -> full-ce")

    tmp = os.path.join(HERE, ".work")
    if os.path.exists(tmp):
        shutil.rmtree(tmp)
    os.makedirs(tmp)

    # stock files needed for the replays — ONE streaming pass over the tarball
    ACCOUNTS_PFX = "./usr/palm/applications/com.palm.app.accounts/"
    TRUSTED_PFX = "./etc/ssl/certs/trustedcerts/"
    HELP_SRC = "./usr/palm/applications/com.palm.app.help/help/source/"
    BT_MODEL = "./usr/palm/applications/com.palm.app.bluetoothtab/app/models/Bluetooth.js"
    BT_ASSIST = ("./usr/palm/applications/com.palm.app.bluetoothtab/app/controllers/"
                 "bluetooth-assistant.js")
    stock = read_rootfs(ROOTFS_TGZ, exact=[
        "./usr/bin/media-pipeline",
        "./usr/sbin/setcpushares-pdk",
        "./usr/sbin/setcpushares-task",
        "./usr/bin/mojomail-imap",
        "./etc/event.d/LunaSysMgr",
        "./etc/jail_pdk.conf",
        "./etc/palm-build-info",
        HELP_SRC + "UrlManager.js",
        HELP_SRC + "HelpApp.js",
        BT_MODEL,
        BT_ASSIST,
        "./usr/share/ls2/roles/prv/com.palm.mediad.pipeline.json",
        "./usr/share/ls2/roles/pub/com.palm.mediad.pipeline.json",
        "./usr/share/dbus-1/system-services/com.palm.eas.service",
        "./usr/share/dbus-1/system-services/com.palm.imap.service",
        "./usr/share/dbus-1/system-services/com.palm.pop.service",
        "./usr/share/dbus-1/system-services/com.palm.smtp.service",
    ], prefixes=[ACCOUNTS_PFX, TRUSTED_PFX])

    def sdata(name):
        return stock[name]["data"]

    removes = []

    # 2) browser-tls13 : /usr/lib/ssl11 stack + RPATH'd BrowserServer
    log("tier: browser-tls13")
    d = ipk_extract_data(IPK["browser"], os.path.join(tmp, "browser"))
    bf = os.path.join(d, "usr/palm/applications/org.webosinternals.browser-tls13/files")
    for lib in ("libssl.so.1.1", "libcrypto.so.1.1", "libssl_compat.so", "libcurl.so.4.8.0"):
        wcopy(f"usr/lib/ssl11/{lib}", os.path.join(bf, "ssl11", lib), 0o755)
    symlink("usr/lib/ssl11/libcurl.so.4", "libcurl.so.4.8.0")
    symlink("usr/lib/ssl11/libssl.so.0.9.8", "libssl.so.1.1")
    symlink("usr/lib/ssl11/libcrypto.so.0.9.8", "libcrypto.so.1.1")
    wcopy("usr/bin/BrowserServer", os.path.join(bf, "BrowserServer.rpath"), 0o755)

    # 3) downloadmgr-tls13 : /usr/lib/ssl11dl libcurl + RPATH'd LunaDownloadMgr
    log("tier: downloadmgr-tls13")
    d = ipk_extract_data(IPK["downloadmgr"], os.path.join(tmp, "dl"))
    df = os.path.join(d, "usr/palm/applications/org.webosinternals.downloadmgr-tls13/files")
    wcopy("usr/lib/ssl11dl/libcurl.so.4.5.0", os.path.join(df, "ssl11dl", "libcurl.so.4.5.0"), 0o755)
    symlink("usr/lib/ssl11dl/libcurl.so.4", "libcurl.so.4.5.0")
    wcopy("usr/bin/LunaDownloadMgr", os.path.join(df, "LunaDownloadMgr.rpath"), 0o750)

    # 4) luna-tls13 : upstart env, media-pipeline + setcpushares wrappers, LS2 roles
    log("tier: luna-tls13")
    d = ipk_extract_data(IPK["luna"], os.path.join(tmp, "luna"))
    lf = os.path.join(d, "usr/palm/applications/org.webosinternals.luna-tls13/files")
    # 4a. LunaSysMgr upstart: append ssl11 to LD_PRELOAD, add LD_LIBRARY_PATH + LD_BIND_NOW
    up = sdata("./etc/event.d/LunaSysMgr").decode()
    if "ssl11/libssl_compat.so" in up:
        sys.exit("ERROR: base LunaSysMgr upstart already ssl11-patched (base not pristine)")
    lines, done = [], False
    for ln in up.splitlines(keepends=True):
        if not done and re.search(r'export LD_PRELOAD="', ln):
            nl = ln[:-1] if ln.endswith("\n") else ln
            nl = re.sub(r'"[ \t]*$', ' /usr/lib/ssl11/libssl_compat.so"', nl)
            lines.append(nl + "\n")
            lines.append("\texport LD_LIBRARY_PATH=/usr/lib/ssl11\n")
            lines.append("\texport LD_BIND_NOW=1\n")
            done = True
        else:
            lines.append(ln)
    if not done:
        sys.exit("ERROR: LD_PRELOAD anchor not found in stock LunaSysMgr upstart")
    w("etc/event.d/LunaSysMgr", "".join(lines), 0o644)
    # 4b. media-pipeline env-scrub wrapper (+ .real target + derived LS2 roles)
    wcopy("usr/bin/media-pipeline", os.path.join(lf, "media-pipeline.wrap"), 0o755)
    w("usr/bin/media-pipeline.real", sdata("./usr/bin/media-pipeline"), 0o755)
    for scope in ("prv", "pub"):
        role = sdata(f"./usr/share/ls2/roles/{scope}/com.palm.mediad.pipeline.json").decode()
        real = role.replace("/usr/bin/media-pipeline", "/usr/bin/media-pipeline.real")
        w(f"usr/share/ls2/roles/{scope}/com.palm.mediad.pipeline.real.json", real, 0o644)
    # 4c. setcpushares-{pdk,task} env-scrub wrappers (+ .real targets)
    for name, wrapf in (("setcpushares-pdk", "setcpushares-pdk.wrap"),
                        ("setcpushares-task", "setcpushares-task.wrap")):
        wcopy(f"usr/sbin/{name}", os.path.join(lf, wrapf), 0o755)
        w(f"usr/sbin/{name}.real", sdata(f"./usr/sbin/{name}"), 0o755)

    # 5) mail-tls13 : /usr/lib/ssl11mail + mojomail launcher env + ECDSA config
    log("tier: mail-tls13")
    d = ipk_extract_data(IPK["mail"], os.path.join(tmp, "mail"))
    mf = os.path.join(d, "usr/palm/applications/org.webosinternals.mail-tls13/files/ssl11mail")
    wcopy("usr/lib/ssl11mail/libcurl.so.4.5.0", os.path.join(mf, "libcurl.so.4.5.0"), 0o755)
    symlink("usr/lib/ssl11mail/libcurl.so.4", "libcurl.so.4.5.0")
    symlink("usr/lib/ssl11mail/libssl.so.1.1", "/usr/lib/ssl11/libssl.so.1.1")
    symlink("usr/lib/ssl11mail/libcrypto.so.1.1", "/usr/lib/ssl11/libcrypto.so.1.1")
    symlink("usr/lib/ssl11mail/libssl.so.0.9.8", "/usr/lib/ssl11/libssl.so.1.1")
    symlink("usr/lib/ssl11mail/libcrypto.so.0.9.8", "/usr/lib/ssl11/libcrypto.so.1.1")
    wcopy("usr/lib/ssl11mail/libssl_compat.so", os.path.join(mf, "libssl_compat.so"), 0o755)
    w("usr/lib/ssl11mail/mailssl.cnf", MAILSSL_CNF, 0o644)
    # patch the four mojomail dbus launchers
    for svc in ("eas", "imap", "pop", "smtp"):
        key = f"./usr/share/dbus-1/system-services/com.palm.{svc}.service"
        txt = sdata(key).decode()
        out = []
        for ln in txt.splitlines(keepends=True):
            if re.match(r'^Exec=/usr/bin/mojomail-', ln) and "ssl11mail" not in ln:
                ln = "Exec=" + MAIL_PFX + " " + ln[len("Exec="):]
                if svc in ("imap", "pop", "smtp"):   # ECDSA/Gmail: TLS1.2+RSA config
                    ln = ln.replace("LD_BIND_NOW=1 ", "LD_BIND_NOW=1 " + MAIL_OPENSSL_CONF, 1)
            out.append(ln)
        w(f"usr/share/dbus-1/system-services/com.palm.{svc}.service", "".join(out), 0o644)

    # 6) mojomail-imap-tagfix : one-byte IMAP-tag patch
    log("tier: mojomail-imap-tagfix")
    imap = bytearray(sdata("./usr/bin/mojomail-imap"))
    im_md5 = md5(bytes(imap))
    if im_md5 not in IMAP_TAGFIX:
        sys.exit(f"ERROR: mojomail-imap md5 {im_md5} not a known tagfix variant")
    off, want_md5 = IMAP_TAGFIX[im_md5]
    imap[off] = ord("A")
    if md5(bytes(imap)) != want_md5:
        sys.exit(f"ERROR: mojomail-imap patch produced {md5(bytes(imap))}, expected {want_md5}")
    w("usr/bin/mojomail-imap", bytes(imap), 0o755)
    log(f"  imap tag patched at offset {off} (md5 {im_md5[:8]} -> {want_md5[:8]})")

    # 7) LunaCE : prebuilt LunaSysMgr binary + launcher3 tab images
    log("tier: LunaCE")
    wcopy("usr/bin/LunaSysMgr", os.path.join(LUNACE, "bin", "LunaSysMgr-LunaCE-topaz"), 0o755)
    for img in ("tab-add-icon.png", "tab-delete-icon.png"):
        src = os.path.join(LUNACE, "images", "launcher3", img)
        if os.path.exists(src):
            wcopy(f"usr/palm/sysmgr/images/launcher3/{img}", src, 0o644)

    # 8) App Catalog : BAKE the community enyo-findapps into the rootfs as a
    # system app, and remove the stock staged 5.0.2900 ipk so first-boot
    # app-install can't put an old copy in cryptofs that would shadow ours.
    log(f"tier: App Catalog BAKED ({os.path.basename(IPK['catalog'])})")
    d = ipk_extract_data(IPK["catalog"], os.path.join(tmp, "catalog"))
    bake_tree(d)
    removes.append("/usr/palm/ipkgs/com.palm.app.enyo-findapps_5.0.2900_all.ipk")

    # 9) Maps : BAKE 4.0.1 as a system app; remove the stock staged 3.0.1 ipk.
    log(f"tier: Maps BAKED ({os.path.basename(IPK['maps'])})")
    d = ipk_extract_data(IPK["maps"], os.path.join(tmp, "maps"))
    bake_tree(d)
    removes.append("/usr/palm/ipkgs/com.palm.app.maps_3.0.1_all.ipk")

    # 10) Accounts : the community build REPLACES the stock rootfs app. Its
    # payload ships as one tarball (postinst extracts it over the app dir after
    # an rm -rf) — replay: bake every payload file, remove stock files the new
    # build no longer has.
    log(f"tier: Accounts app swap ({os.path.basename(IPK['accounts'])})")
    d = ipk_extract_data(IPK["accounts"], os.path.join(tmp, "accounts"))
    pay = os.path.join(d, "media/cryptofs/webosarchive-accounts-overwrite/payload.tar.gz")
    appdst = os.path.join(tmp, "accounts_app")
    os.makedirs(appdst)
    with tarfile.open(pay) as tf:
        tf.extractall(appdst, filter="data")
    baked_acc = set()
    for dp, _dn, fns in os.walk(appdst):
        for fn in fns:
            full = os.path.join(dp, fn)
            rel = os.path.relpath(full, appdst)
            tgt = f"usr/palm/applications/com.palm.app.accounts/{rel}"
            mode = 0o755 if (os.stat(full).st_mode & 0o111) else 0o644
            p = os.path.join(OUT_ROOT, tgt)
            os.makedirs(os.path.dirname(p), exist_ok=True)
            shutil.copyfile(full, p)
            os.chmod(p, mode)
            baked_acc.add("./" + tgt)
    if not any(n.endswith("/appinfo.json") for n in baked_acc):
        sys.exit("ERROR: accounts payload has no appinfo.json — wrong payload?")
    acc_removes = [n[1:] for n in stock
                   if n.startswith(ACCOUNTS_PFX) and n not in baked_acc]
    removes.extend(acc_removes)
    log(f"  {len(baked_acc)} files baked, {len(acc_removes)} stock files removed")

    # 11) help-redirect : replay the postinst seds on the stock Help app source.
    # Base URL (drives tips/clips/featured/search) + device.do link + the
    # palm.com external-link domain check. No *-orig backups (re-Doctor to undo).
    log("tier: help-redirect (help.palm.com -> help.webosarchive.org)")
    um = sdata(HELP_SRC + "UrlManager.js").decode()
    um = sure_replace(um, "http://help.palm.com", "http://help.webosarchive.org",
                      "UrlManager.js base URL")
    w("usr/palm/applications/com.palm.app.help/help/source/UrlManager.js", um, 0o644)
    ha = sdata(HELP_SRC + "HelpApp.js").decode()
    ha = sure_replace(ha, "http://help.palm.com", "http://help.webosarchive.org",
                      "HelpApp.js device.do link")
    ha = sure_replace(ha, 'endsWith("palm.com")', 'endsWith("webosarchive.org")',
                      "HelpApp.js domain check")
    w("usr/palm/applications/com.palm.app.help/help/source/HelpApp.js", ha, 0o644)

    # 12) rootcertsupdate : FULL build-time replay of the trust-store update.
    # postinst (3.x path): install scripts to /etc/ssl/scripts, then deploycerts:
    # drop expired certs + dead links from /etc/ssl/certs/trustedcerts, move the
    # new Mozilla roots in with hash links, rebuild ca-certificates.crt from the
    # final *.pem set, and regenerate calinks.tgz (unpacked into
    # /var/ssl/trustedcerts by /etc/event.d/certstoreinit on a fresh /var).
    # Host openssl stands in for the device's 0.9.8: link names use
    # -subject_hash_old (0.9.8's `-hash` algorithm).
    log(f"tier: rootcertsupdate replay ({os.path.basename(IPK['rootcerts'])})")
    d = ipk_extract_data(IPK["rootcerts"], os.path.join(tmp, "rootcerts"))
    S = os.path.join(d, "usr/palm/applications/com.palm.rootcertsupdate/scripts")
    for sh in ("cleancerts.sh", "deploycerts.sh", "movecerts.sh", "verifylinks.sh"):
        wcopy(f"etc/ssl/scripts/{sh}", os.path.join(S, sh), 0o755)
    wcopy("etc/ssl/scripts/root-certs.tar.gz", os.path.join(S, "root-certs.tar.gz"), 0o644)
    newdir = os.path.join(tmp, "newcerts")
    os.makedirs(newdir)
    with tarfile.open(os.path.join(S, "root-certs.tar.gz")) as tf:
        tf.extractall(newdir, filter="data")

    kept = {}      # certname -> bytes (stock certs that survive)
    final = set()  # every member name (relative to trustedcerts/) that will exist
    stock_trusted = {n[len(TRUSTED_PFX):]: e for n, e in stock.items()
                     if n.startswith(TRUSTED_PFX) and n != TRUSTED_PFX.rstrip("/")}
    n_exp = 0
    for name, e in sorted(stock_trusted.items()):
        if e["type"] == "link":
            continue                       # all hash links are regenerated below
        if not name.lower().endswith(CERT_EXTS) or not cert_ok(e["data"]):
            final.add(name)                # non-cert file: keep untouched
            continue
        if cert_expired(e["data"]):
            n_exp += 1
            continue                       # dropped -> lands in removes
        kept[name] = e["data"]
        final.add(name)
    kept_fps = {cert_fingerprint(b) for b in kept.values()}
    n_new = n_dup = 0
    for fn in sorted(os.listdir(newdir)):
        full = os.path.join(newdir, fn)
        if not os.path.isfile(full) or not fn.lower().endswith(CERT_EXTS):
            continue
        b = open(full, "rb").read()
        if not cert_ok(b) or cert_expired(b):
            continue
        if cert_fingerprint(b) in kept_fps:
            n_dup += 1
            final.add(fn) if fn in stock_trusted else None
            continue
        w(f"etc/ssl/certs/trustedcerts/{fn}", b, 0o644)
        kept[fn] = b
        final.add(fn)
        n_new += 1
    # regenerate ALL hash links (deterministic: certs sorted by name)
    by_hash = {}
    for name in sorted(k for k in kept):
        h = cert_hash_old(kept[name])
        if h is None:
            sys.exit(f"ERROR: cannot hash cert {name}")
        by_hash.setdefault(h, []).append(name)
    links = {}   # linkname -> certname
    for h, names in by_hash.items():
        for i, name in enumerate(names):
            links[f"{h}.{i}"] = name
    for ln, name in sorted(links.items()):
        symlink(f"etc/ssl/certs/trustedcerts/{ln}", name)
    final |= set(links)
    removes += [f"/etc/ssl/certs/trustedcerts/{n}" for n in sorted(stock_trusted)
                if n not in final and n not in links]
    # ca-certificates.crt = concatenation of the final *.pem set (postinst: cat *.pem)
    bundle = b"".join(kept[n] if kept[n].endswith(b"\n") else kept[n] + b"\n"
                      for n in sorted(kept) if n.lower().endswith(".pem"))
    w("etc/ssl/certs/ca-certificates.crt", bundle, 0o644)
    # calinks.tgz: hash links pointing back into /etc — certstoreinit unpacks
    # this into /var/ssl/trustedcerts on first boot (fresh /var after a flash)
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w") as tf:
        for ln, name in sorted(links.items()):
            ti = tarfile.TarInfo(ln)
            ti.type = tarfile.SYMTYPE
            ti.linkname = f"../../../etc/ssl/certs/trustedcerts/{name}"
            ti.mtime = 0
            tf.addfile(ti)
    gz = io.BytesIO()
    with gzip.GzipFile(fileobj=gz, mode="wb", mtime=0) as g:
        g.write(buf.getvalue())
    w("etc/ssl/certs/calinks.tgz", gz.getvalue(), 0o644)
    log(f"  certs: {len(kept)} final ({n_new} new, {n_dup} already present, "
        f"{n_exp} expired dropped), {len(links)} hash links, "
        f"bundle {len(bundle)//1024}KB")

    # 13) UberKernel : replace the /boot kernel files + /lib/modules kernel
    # modules. /boot is populated from the rootfs tarball's ./boot/ entries at
    # flash time (boot-images.tar.gz holds only logos), so replacing
    # ./boot/uImage-* here is what the device boots. Kept vermagic
    # (2.6.35-palm-tenderloin) means stock modules still load; only the shipped
    # subset is replaced. Owned by kernel-image-* -> harness regens that md5sums.
    log(f"tier: UberKernel ({os.path.basename(IPK['kernel'])})")
    d = ipk_extract_data(IPK["kernel"], os.path.join(tmp, "uber"))
    kbase = os.path.join(
        d, "usr/palm/applications/org.webosinternals.kernels.uber-kernel-touchpad/additional_files")
    kn = 0
    for sub in ("boot", "lib/modules"):
        base = os.path.join(kbase, sub)
        for dp, _dn, fns in os.walk(base):
            for fn in fns:
                full = os.path.join(dp, fn)
                rel = os.path.relpath(full, kbase)
                wcopy(rel, full, 0o644)
                kn += 1
    log(f"  {kn} kernel files (uImage/System.map/config + modules)")

    # 14) Preware : BAKED. App to /usr/palm/applications; its ipkgservice gets
    # the static-system treatment its postinst does dynamically under /var:
    # binary -> /usr/sbin, dbus service + ls2 roles -> /usr/share, upstart ->
    # /etc/event.d, all with /var/usr/sbin rewritten to /usr/sbin. The ipkg
    # feed/config seeding the postinst did is replayed by the job's pre-start
    # on first boot (cryptofs paths can't exist in the rootfs image).
    log(f"tier: Preware BAKED ({os.path.basename(IPK['preware'])})")
    d = ipk_extract_data(IPK["preware"], os.path.join(tmp, "preware"))
    bake_tree(d)
    papp = os.path.join(d, "usr/palm/applications/org.webosinternals.preware")
    SID = "org.webosinternals.ipkgservice"
    wcopy(f"usr/sbin/{SID}", os.path.join(papp, "bin", SID), 0o755)
    dbus_svc = open(os.path.join(papp, "dbus", f"{SID}.service")).read()
    dbus_svc = sure_replace(dbus_svc, "Exec=/var/usr/sbin/", "Exec=/usr/sbin/",
                            "ipkgservice dbus", count=1)
    # BOTH hubs need the service file, in DIFFERENT static dirs (per
    # /etc/ls2/ls-{private,public}.conf): private reads dbus-1/system-services,
    # public reads dbus-1/services. A service missing from the public list is
    # refused pub-bus registration ("Service not listed in service files") and
    # apps call services over the PUBLIC bus — runtime installs got both via
    # /var/palm/system-services, which is on both hubs' lists.
    w(f"usr/share/dbus-1/system-services/{SID}.service", dbus_svc, 0o644)
    w(f"usr/share/dbus-1/services/{SID}.service", dbus_svc, 0o644)
    role = open(os.path.join(papp, "dbus", f"{SID}.json")).read()
    role = sure_replace(role, '"exeName":"/var/usr/sbin/', '"exeName":"/usr/sbin/',
                        "ipkgservice role", count=1)
    for scope in ("prv", "pub"):
        w(f"usr/share/ls2/roles/{scope}/{SID}.json", role, 0o644)
    upst = open(os.path.join(papp, "upstart", SID)).read()
    upst = sure_replace(upst, "exec /var/usr/sbin/", "exec /usr/sbin/", "ipkgservice upstart")
    # The shipped pre-start re-derives VERSION from palm-build-info with a sed
    # that breaks on our "webOS CE 3.1.0" string (and would corrupt the
    # patches/kernels feed confs every boot) — pin it.
    upst = re.sub(r"^\s*VERSION=`grep PRODUCT_VERSION_STRING[^\n]*$",
                  "   VERSION=3.0.5", upst, count=1, flags=re.M)
    if "VERSION=3.0.5" not in upst:
        sys.exit("ERROR: VERSION anchor not found in ipkgservice upstart")
    seed = (
        "   # webOS CE: seed the ipkg config on first boot (the baked install\n"
        "   # replays what Preware's postinst would have written to cryptofs)\n"
        "   if [ -d /media/cryptofs/apps ] && [ ! -f $APPS/etc/ipkg/arch.conf ] ; then\n"
        "      mkdir -p $APPS/etc/ipkg $APPS/usr/lib/ipkg/cache $APPS/usr/lib/ipkg/lists\n"
        "      cp /etc/ipkg/arch.conf $APPS/etc/ipkg/arch.conf\n"
        "      echo \"src/gz optware http://ipkg.preware.net/feeds/optware/all\" > $APPS/etc/ipkg/optware.conf\n"
        "      echo \"src/gz optware-armv7 http://ipkg.preware.net/feeds/optware/armv7\" >> $APPS/etc/ipkg/optware.conf\n"
        "      echo \"src/gz precentral http://weboslives.eu/feeds/precentral\" > $APPS/etc/ipkg/precentral-weboslives.conf\n"
        "      echo \"src/gz precentral http://weboslives.eu/feeds/wosa\" > $APPS/etc/ipkg/wosa-appmuseum.conf.disabled\n"
        "      echo \"src/gz precentral-themes http://ipkg.preware.net/feeds/precentral-themes\" > $APPS/etc/ipkg/precentral-themes.conf.disabled\n"
        "      echo \"src/gz pivotce http://feed.pivotce.com\" > $APPS/etc/ipkg/pivotce.conf\n"
        "      echo \"src/gz prethemer http://www.prethemer.com/feeds/preware/themes\" > $APPS/etc/ipkg/prethemer.conf.disabled\n"
        "      echo \"src/gz clock-themes http://webos-clock-themer.googlecode.com/svn/trunk/WebOS%20Clock%20Theme%20Builder/feed\" > $APPS/etc/ipkg/clock-themes.conf.disabled\n"
        "      echo \"src/gz webosinternals http://ipkg.preware.net/feeds/webos-internals/all\" > $APPS/etc/ipkg/webos-internals.conf\n"
        "      echo \"src/gz webosinternals-armv7 http://ipkg.preware.net/feeds/webos-internals/armv7\" >> $APPS/etc/ipkg/webos-internals.conf\n"
        "      echo \"src/gz webos-patches http://ipkg.preware.net/feeds/webos-patches/3.0.5\" > $APPS/etc/ipkg/webos-patches.conf\n"
        "      echo \"src/gz webos-kernels http://ipkg.preware.net/feeds/webos-kernels/3.0.5\" > $APPS/etc/ipkg/webos-kernels.conf\n"
        "      echo \"src/gz woce http://ipkg.preware.net/feeds/woce\" > $APPS/etc/ipkg/woce.conf\n"
        "      echo \"src/gz modernize http://stacks.webosarchive.org/feeds/modernize/ipkgs\" > $APPS/etc/ipkg/modernize.conf\n"
        "   fi\n"
    )
    upst = sure_replace(upst, "   APPS=/media/cryptofs/apps\n",
                        "   APPS=/media/cryptofs/apps\n\n" + seed,
                        "ipkgservice upstart APPS anchor", count=1)
    # guard the stock lists-cleanup: the dir may not exist before first seeding
    # (upstart runs scripts with sh -e, so the guard must not return nonzero)
    upst = upst.replace("find $APPS/usr/lib/ipkg/lists",
                        "[ ! -d $APPS/usr/lib/ipkg/lists ] || find $APPS/usr/lib/ipkg/lists")
    w(f"etc/event.d/{SID}", upst, 0o644)

    # 14c) Govnah : BAKED, same shape as Preware — app dir plus a root service
    # its postinst normally installs under /var (binary, dbus service, ls2
    # roles, upstart job); replay all of it statically. Pairs with the baked
    # UberKernel (governors/profiles UI).
    log(f"tier: Govnah BAKED ({os.path.basename(IPK['govnah'])})")
    d = ipk_extract_data(IPK["govnah"], os.path.join(tmp, "govnah"))
    bake_tree(d)
    gapp = os.path.join(d, "usr/palm/applications/org.webosinternals.govnah")
    GID = "org.webosinternals.govnah"
    wcopy(f"usr/sbin/{GID}", os.path.join(gapp, "bin", GID), 0o755)
    gdbus = open(os.path.join(gapp, "dbus", f"{GID}.service")).read()
    gdbus = sure_replace(gdbus, "Exec=/var/usr/sbin/", "Exec=/usr/sbin/",
                         "govnah dbus", count=1)
    w(f"usr/share/dbus-1/system-services/{GID}.service", gdbus, 0o644)
    w(f"usr/share/dbus-1/services/{GID}.service", gdbus, 0o644)
    grole = open(os.path.join(gapp, "dbus", f"{GID}.json")).read()
    grole = sure_replace(grole, '"exeName":"/var/usr/sbin/', '"exeName":"/usr/sbin/',
                         "govnah role", count=1)
    for scope in ("prv", "pub"):
        w(f"usr/share/ls2/roles/{scope}/{GID}.json", grole, 0o644)
    gup = open(os.path.join(gapp, "upstart", GID)).read()
    gup = sure_replace(gup, "exec /var/usr/sbin/", "exec /usr/sbin/",
                       "govnah upstart", count=1)
    w(f"etc/event.d/{GID}", gup, 0o644)
    # Settings-tab placement, same keyword mechanism as USB Settings (15b)
    ginfo = json.loads(open(os.path.join(gapp, "appinfo.json")).read())
    ginfo.setdefault("keywords", [])
    if "wosa-settings" not in ginfo["keywords"]:
        ginfo["keywords"].append("wosa-settings")
    w(f"usr/palm/applications/{GID}/appinfo.json",
      json.dumps(ginfo, indent=4) + "\n", 0o644)

    # 15) USB settings : BAKED. App/package/service trees as shipped, plus the
    # postinst's system integration replayed statically: daemons to /usr/bin,
    # upstart job to /etc/event.d, JS-service role + dbus launcher to the
    # static /usr/share locations (postinst used /var/palm — runtime equivalents).
    # The OTG-arm write is skipped: usbctl-watchd arms at first idle boot.
    log(f"tier: USB settings BAKED ({os.path.basename(IPK['usb'])})")
    d = ipk_extract_data(IPK["usb"], os.path.join(tmp, "usb"))
    bake_tree(d)
    uapp = os.path.join(d, "usr/palm/applications/com.webosarchive.usbsettings")
    USVC = "com.webosarchive.usbsettings.service"
    wcopy("usr/bin/usbctl-jsservice", os.path.join(uapp, "usbctl-jsservice.sh"), 0o755)
    wcopy("usr/bin/usbctl-watchd", os.path.join(uapp, "usbctl-watchd.sh"), 0o755)
    wcopy("usr/bin/usbdevmon", os.path.join(uapp, "usbdevmon"), 0o755)
    wcopy("etc/event.d/usbctl-watchd", os.path.join(uapp, "usbctl-watchd.conf"), 0o644)
    urole = json.dumps({
        "role": {"exeName": "js", "type": "regular", "allowedNames": [USVC]},
        "permissions": [{"service": USVC, "inbound": ["*"], "outbound": ["*"]}],
    })
    for scope in ("prv", "pub"):
        w(f"usr/share/ls2/roles/{scope}/{USVC}.json", urole, 0o644)
    usb_svcfile = (f"[D-BUS Service]\nName={USVC}\n"
                   f"Exec=/usr/bin/usbctl-jsservice /usr/palm/services/{USVC}\n")
    # both hubs, different static dirs — see the ipkgservice comment above
    w(f"usr/share/dbus-1/system-services/{USVC}.service", usb_svcfile, 0o644)
    w(f"usr/share/dbus-1/services/{USVC}.service", usb_svcfile, 0o644)

    # 15b) launcher placement: USB Settings belongs on the Settings tab. The
    # launcher's predefined-designator marshal sends every non-"com.palm.*
    # +Palm/HP-vendor" app to the 'User' (Downloads) page, so third-party ids
    # can never reach Settings that way. The keyword mechanism can: enable
    # PreferAppKeywordsForAppPlacement (its conf file doesn't exist stock, so
    # this ADDS a file, changing nothing else — apps without a mapped keyword
    # fall back to the predefined marshal exactly as before), map the private
    # keyword "wosa-settings" to the 'prefs' page designator, and stamp that
    # keyword into the baked USB appinfo.json.
    w("etc/palm/launcher3/launcher_operational_settings.conf",
      "[Main]\nPreferAppKeywordsForAppPlacement=true\n", 0o644)
    w("etc/palm/launcher3/app-keywords-to-designator-map.txt",
      "[designators]\n"
      "1\\designator=apps\n"
      "2\\designator=downloads\n"
      "3\\designator=prefs\n"
      "3\\name=settings\n"
      "size=3\n"
      "\n"
      "[keywords]\n"
      "1\\keyword=wosa-settings\n"
      "1\\designator=prefs\n"
      "size=1\n", 0o644)
    uinfo = json.loads(open(os.path.join(uapp, "appinfo.json")).read())
    uinfo.setdefault("keywords", [])
    if "wosa-settings" not in uinfo["keywords"]:
        uinfo["keywords"].append("wosa-settings")
    w("usr/palm/applications/com.webosarchive.usbsettings/appinfo.json",
      json.dumps(uinfo, indent=4) + "\n", 0o644)

    # 16) BT gamepad : payload is just the shim + udev rule (no app UI) — bake
    # those and replay the postinst's stock-file patches.
    log(f"tier: BT gamepad BAKED ({os.path.basename(IPK['bt'])})")
    d = ipk_extract_data(IPK["bt"], os.path.join(tmp, "bt"))
    btf = os.path.join(d, "usr/palm/applications/org.webosarchive.btgamepad/files")
    wcopy("usr/lib/libpmbtgamepad.so", os.path.join(btf, "libpmbtgamepad.so"), 0o644)
    wcopy("etc/udev/rules.d/99-bt-gamepad.rules",
          os.path.join(btf, "99-bt-gamepad.rules"), 0o644)
    # jail_pdk.conf: expose /dev/input inside the PDK jail (awk replay: insert
    # after the `mkdir /dev` line)
    jail = sdata("./etc/jail_pdk.conf").decode()
    jail = sure_replace(jail, "\nmkdir /dev\n",
                        "\nmkdir /dev\nmkdir /dev/input\nmount ro /dev/input\n",
                        "jail_pdk.conf mkdir /dev anchor", count=1)
    w("etc/jail_pdk.conf", jail, 0o644)
    # bluetoothtab: let gamepads/mice HID-connect (3 sed replays)
    btm = sdata(BT_MODEL).decode()
    btm = sure_replace(
        btm, "if( isKeyboard(device.cod)) {",
        "if( isKeyboard(device.cod) || isGamepad(device.cod) || isMouse(device.cod)) {",
        "Bluetooth.js connectHid", count=1)
    btm = sure_replace(
        btm, "if(isKeyboard(this.deviceCoD[payload.address])){",
        "if(isKeyboard(this.deviceCoD[payload.address]) || "
        "isGamepad(this.deviceCoD[payload.address]) || "
        "isMouse(this.deviceCoD[payload.address])){",
        "Bluetooth.js inbound reconnect", count=1)
    w("usr/palm/applications/com.palm.app.bluetoothtab/app/models/Bluetooth.js", btm, 0o644)
    bta = sdata(BT_ASSIST).decode()
    bta = sure_replace(
        bta, '!= "Audio" && device.DEVICETYPE != "Phone" && ',
        '!= "Audio" && device.DEVICETYPE != "Phone" && '
        'device.DEVICETYPE != "Gamepad" && device.DEVICETYPE != "Mouse" && ',
        "bluetooth-assistant.js tap handler", count=1)
    w("usr/palm/applications/com.palm.app.bluetoothtab/app/controllers/"
      "bluetooth-assistant.js", bta, 0o644)
    # upstart: LD_PRELOAD the shim into BluetoothMonitor (+ sysrq off), exactly
    # as the postinst writes it. No backup (re-Doctor to undo).
    w("etc/event.d/bluetooth",
      'description "Palm Bluetooth"\n'
      "\n"
      "start on stopped finish\n"
      "\n"
      "respawn\n"
      "exec /bin/sh -c 'echo 0 > /proc/sys/kernel/sysrq; "
      "export LD_PRELOAD=/usr/lib/libpmbtgamepad.so; "
      "export WEBOS_BT_SHIM_LOG=/var/log/btshim.log; "
      "export WEBOS_BT_SHIM_DUMP=0; "
      "exec /usr/bin/BluetoothMonitor'\n",
      0o644)

    # 16b) Language-aligned patch: notifications-advanced-reset-options.
    # The variants all patch the same system file but carry translated UI
    # strings; the right one depends on the language the USER picks in the
    # firstuse language picker — unknowable at build time. So: apply every
    # variant to the pristine stock file HERE (host `patch`, build fails if any
    # doesn't apply), bake the english result as the rootfs default, ship every
    # language's patched tree under /usr/palm/ce-patches/lang/<lang>/, and let
    # a boot job align the live file with the selected locale (exact language
    # match, else english). A later language change realigns on the next boot.
    log("tier: language-aligned patch (notifications-advanced-reset-options)")
    PATCH_BASE = "org.webosinternals.patches.notifications-advanced-reset-options"
    variants = {}
    for p in glob.glob(os.path.join(POR, PATCH_BASE + "*_*.ipk")):
        rest = os.path.basename(p)[len(PATCH_BASE):]
        if rest.startswith("_"):
            vlang = "en"
        elif rest.startswith("---"):
            vlang = rest[3:].split("_", 1)[0].lower()
        else:
            continue
        if vlang not in variants or os.path.getmtime(p) > os.path.getmtime(variants[vlang]):
            variants[vlang] = p
    if "en" not in variants:
        sys.exit(f"ERROR: no english (no-suffix) {PATCH_BASE} ipk in {POR}")
    diffs = {}
    for vlang, ipk in sorted(variants.items()):
        d = ipk_extract_data(ipk, os.path.join(tmp, f"nap-{vlang}"))
        pd = glob.glob(os.path.join(d, "usr/palm/applications",
                                    PATCH_BASE + "*", "unified_diff.patch"))
        if len(pd) != 1:
            sys.exit(f"ERROR: {os.path.basename(ipk)}: expected exactly one "
                     f"unified_diff.patch, found {len(pd)}")
        diffs[vlang] = open(pd[0]).read()
    targets = sorted({ln[len("+++ b/"):].strip() for txt in diffs.values()
                      for ln in txt.splitlines() if ln.startswith("+++ b/")})
    log(f"  variants: {', '.join(sorted(diffs))}; target(s): "
        + ", ".join("/" + t for t in targets))
    pstock = read_rootfs(ROOTFS_TGZ, exact=["./" + t for t in targets])
    for vlang in sorted(diffs):
        work = os.path.join(tmp, f"nap-apply-{vlang}")
        for t in targets:
            pth = os.path.join(work, t)
            os.makedirs(os.path.dirname(pth), exist_ok=True)
            with open(pth, "wb") as f:
                f.write(pstock["./" + t]["data"])
        r = subprocess.run(["patch", "-p1", "--batch"],
                           input=diffs[vlang].encode(), cwd=work, capture_output=True)
        if r.returncode != 0:
            sys.exit(f"ERROR: {PATCH_BASE} ({vlang}) does not apply to stock:\n"
                     + r.stdout.decode() + r.stderr.decode())
        for t in targets:
            data = open(os.path.join(work, t), "rb").read()
            w(f"usr/palm/ce-patches/lang/{vlang}/{t}", data, 0o644)
            if vlang == "en":
                w(t, data, 0o644)
    lang_job = (
        "# ce-language-patches — webOS CE: keep language-specific patched system files\n"
        "# aligned with the selected locale (exact language match, else english — which\n"
        "# is what the rootfs ships). Runs each boot after first use; no-op when the\n"
        "# files already match. Trees live in /usr/palm/ce-patches/lang/<lang>/.\n"
        "\n"
        "start on stopped finish\n"
        "\n"
        "console none\n"
        "\n"
        "script\n"
        "    [ -f /var/luna/preferences/ran-first-use ] || exit 0\n"
        "    BASE=/usr/palm/ce-patches/lang\n"
        "    [ -d \"$BASE\" ] || exit 0\n"
        "    LCODE=\"\"\n"
        "    i=0\n"
        "    while [ $i -lt 12 ]; do\n"
        "        R=$(luna-send -n 1 palm://com.palm.systemservice/getPreferences '{\"keys\":[\"locale\"]}' 2>/dev/null) || true\n"
        "        LCODE=$(echo \"$R\" | sed -n 's/.*\"languageCode\"[^\"]*\"\\([a-zA-Z]*\\)\".*/\\1/p')\n"
        "        if [ -n \"$LCODE\" ]; then break; fi\n"
        "        sleep 5; i=$((i+1))\n"
        "    done\n"
        "    [ -n \"$LCODE\" ] || exit 0\n"
        "    SRC=\"$BASE/$LCODE\"\n"
        "    if [ ! -d \"$SRC\" ]; then SRC=\"$BASE/en\"; fi\n"
        "    changed=0\n"
        "    cd \"$SRC\"\n"
        "    for f in $(find . -type f); do\n"
        "        rel=${f#./}\n"
        "        if ! cmp -s \"$f\" \"/$rel\"; then\n"
        "            mount -o remount,rw / 2>/dev/null || true\n"
        "            cp \"$f\" \"/$rel\"\n"
        "            changed=1\n"
        "        fi\n"
        "    done\n"
        "    if [ $changed -eq 1 ]; then\n"
        "        mount -o remount,ro / 2>/dev/null || true\n"
        "        # the UI loaded the old file this boot — one restart picks it up\n"
        "        stop LunaSysMgr 2>/dev/null || true\n"
        "        start LunaSysMgr 2>/dev/null || true\n"
        "    fi\n"
        "end script\n"
    )
    w("etc/event.d/ce-language-patches", lang_job, 0o644)

    # 17) Media-Internal : ride the stock customization copy_binaries mechanism.
    # com.palm.service.customization runs `cp -r <custo>/copy_binaries/* /` at
    # first boot (this is exactly how HP delivered wallpapers/ringtones — the
    # media partition survives flashes, so a first-boot copy is the only route).
    # sweatshop-hp-topaz (hp.tar) merges its own files into the same tree at
    # the customization stage; distinct filenames coexist.
    log("tier: Media-Internal -> copy_binaries")
    mn = 0
    for dp, _dn, fns in os.walk(MEDIA):
        for fn in fns:
            full = os.path.join(dp, fn)
            rel = os.path.relpath(full, MEDIA)
            wcopy(f"usr/lib/luna/customization/copy_binaries/media/internal/{rel}",
                  full, 0o644)
            mn += 1
    log(f"  {mn} media files staged for first-boot copy to /media/internal")

    # 17b) first-boot tweaks job: default wallpaper + cryptofs de-shadowing.
    # (a) Default wallpaper: hp.tar's customization.json (laid down at the flash
    # custo stage — we can't overlay it) imports and sets 01.jpg. This job seds
    # it to one of OUR wallpapers before com.palm.service.customization consumes
    # it (same early trigger as ce-remove-preloads, which is proven to win that
    # race). Renaming our files can't work: sweatshop extracts its own 01-11.jpg
    # over the same copy_binaries tree AFTER the rootfs lands.
    # (b) cryptofs de-shadow: /media/cryptofs SURVIVES Doctor flashes, so a
    # device upgrading from stock/older CE can carry a stale cryptofs copy of an
    # app we now bake (seen live: Maps 3.0.1 shadowing baked 4.0.1). Once per
    # flash (/var is wiped by the Doctor, so a /var flag = once), remove the
    # cryptofs copies of the baked ids — dirs, ipkg info files and status
    # stanzas. Plain rm, NEVER `ipkg remove`: those prerms delete shared
    # /usr/bin//usr/share files that our baked install owns.
    wp_dir = os.path.join(MEDIA, "wallpapers")
    wps = sorted(fn for fn in os.listdir(wp_dir)
                 if fn.lower().endswith((".jpg", ".jpeg", ".png"))) if os.path.isdir(wp_dir) else []
    default_wp = next((f for f in wps if f.lower().startswith("default-wallpaper")),
                      wps[0] if wps else None)
    BAKED_APP_IDS = ("com.palm.app.maps com.palm.app.enyo-findapps "
                     "org.webosinternals.preware com.webosarchive.usbsettings "
                     "org.webosarchive.btgamepad")
    wp_block = ""
    if default_wp:
        log(f"tier: first-boot tweaks (default wallpaper {default_wp} + cryptofs de-shadow)")
        wp_block = (
            "    CUSTO=/usr/lib/luna/customization/customization.json\n"
            "    if [ -f \"$CUSTO\" ] && grep -q 'wallpapers/01.jpg' \"$CUSTO\"; then\n"
            "        mount -o remount,rw / 2>/dev/null || true\n"
            f"        sed -i 's|/01\\.jpg|/{default_wp}|g; s|\"01\\.jpg\"|\"{default_wp}\"|g' \"$CUSTO\"\n"
            "        mount -o remount,ro / 2>/dev/null || true\n"
            "    fi\n")
    else:
        log("tier: first-boot tweaks (cryptofs de-shadow; no wallpapers found)")
    tweaks_job = (
        "# ce-firstboot-tweaks — webOS CE: (a) point the default-wallpaper entries in\n"
        "# hp.tar's customization.json at a CE wallpaper before the customization\n"
        "# service runs them; (b) once per flash, drop stale /media/cryptofs copies of\n"
        "# apps this image bakes into the rootfs (cryptofs survives Doctor flashes and\n"
        "# a stale copy shadows the baked app).\n"
        "\n"
        "start on stopped configurator\n"
        "\n"
        "console none\n"
        "\n"
        "script\n"
        + wp_block +
        "    FLAG=/var/luna/preferences/ce-cryptofs-deshadowed\n"
        "    if [ ! -f \"$FLAG\" ]; then\n"
        "        APPS=/media/cryptofs/apps\n"
        f"        for app in {BAKED_APP_IDS}; do\n"
        "            [ -d \"$APPS/usr/palm/applications/$app\" ] || continue\n"
        "            rm -rf \"$APPS/usr/palm/applications/$app\"\n"
        "            rm -f \"$APPS/usr/lib/ipkg/info/$app\".*\n"
        "            [ -f \"$APPS/usr/lib/ipkg/status\" ] && sed -i \"/^Package: $app\\$/,/^\\$/d\" \"$APPS/usr/lib/ipkg/status\" || true\n"
        "        done\n"
        "        mkdir -p /var/luna/preferences && touch \"$FLAG\"\n"
        "    fi\n"
        "end script\n"
    )
    w("etc/event.d/ce-firstboot-tweaks", tweaks_job, 0o644)

    # 17c) default wallpaper, the DEFINITIVE path. The customization.json sed
    # above races the customization service (both fire on `stopped
    # configurator`, upstart order between them is undefined — the race was
    # LOST on a real flash). This job wins regardless: on the first boot AFTER
    # first use (custo's nonloc pass long done), if the wallpaper pref is still
    # the factory 01.jpg, import ours and set it via the same systemservice
    # calls customization.json uses. One-shot per flash; a user-chosen
    # wallpaper (anything but 01.jpg) is never touched. luna-send calls use the
    # background+kill pattern — luna-send -n 1 blocks forever if the service
    # never answers.
    if default_wp:
        wp_pref = (f'{{"wallpaper":{{"wallpaperName":"{default_wp}",'
                   f'"wallpaperFile":"/media/internal/.wallpapers/{default_wp}",'
                   f'"wallpaperThumbFile":"/media/internal/.wallpapers/thumbs/{default_wp}"}}}}')
        wp_job = (
            "# ce-default-wallpaper — webOS CE: make the CE wallpaper the out-of-box\n"
            "# default. Only replaces the factory 01.jpg; any user choice is left alone.\n"
            "\n"
            "start on stopped finish\n"
            "\n"
            "console none\n"
            "\n"
            "script\n"
            "    [ -f /var/luna/preferences/ran-first-use ] || exit 0\n"
            "    FLAG=/var/luna/preferences/ce-default-wallpaper\n"
            "    if [ -f \"$FLAG\" ]; then exit 0; fi\n"
            "    lsq() {\n"
            "        luna-send -n 1 \"$1\" \"$2\" > /tmp/ce-wp.out 2>/dev/null &\n"
            "        P=$!\n"
            "        sleep 4\n"
            "        kill $P 2>/dev/null || true\n"
            "        cat /tmp/ce-wp.out 2>/dev/null || true\n"
            "    }\n"
            "    R=\"\"\n"
            "    i=0\n"
            "    while [ $i -lt 30 ]; do\n"
            "        R=$(lsq palm://com.palm.systemservice/getPreferences '{\"keys\":[\"wallpaper\"]}')\n"
            "        if echo \"$R\" | grep -q wallpaperName; then break; fi\n"
            "        sleep 4; i=$((i+1))\n"
            "    done\n"
            "    rm -f /tmp/ce-wp.out\n"
            "    echo \"$R\" | grep -q wallpaperName || exit 0\n"
            "    if echo \"$R\" | grep -q '\"01.jpg\"'; then\n"
            f"        lsq palm://com.palm.systemservice/wallpaper/importWallpaper '{{\"target\":\"/media/internal/wallpapers/{default_wp}\",\"scale\":1.0}}' >/dev/null\n"
            f"        lsq palm://com.palm.systemservice/setPreferences '{wp_pref}' >/dev/null\n"
            "    fi\n"
            "    mkdir -p /var/luna/preferences && touch \"$FLAG\"\n"
            "end script\n"
        )
        w("etc/event.d/ce-default-wallpaper", wp_job, 0o644)

    # 18) drop HP preloads we don't ship (Kindle, Facebook, YouTube).
    # These aren't in this (webOS.tar) rootfs at build time — sweatshop-hp-topaz
    # (hp.tar) stages them as customization ipks under /usr/lib/luna/customization/
    # apps, and com.palm.service.customization installs them to /media/cryptofs/apps
    # on first boot (postFirstUseInstall). We can't remove them via the overlay;
    # instead ship an early upstart job that deletes the staged ipks before the
    # customization service can install them (runs on `stopped configurator`,
    # strictly before LunaSysMgr/LunaReady/customization), and clears any dir
    # already placed. Editing hp.tar is avoided (Doctor approval hashes).
    log("tier: remove HP preloads (kindle / enyo-facebook / youtube)")
    preload_job = (
        "# ce-remove-preloads — webOS CE: HP preloads we don't ship.\n"
        "# Staged by sweatshop-hp-topaz into /usr/lib/luna/customization/apps and\n"
        "# installed to /media/cryptofs/apps on first boot by com.palm.service.customization.\n"
        "# Delete the staged ipks before that install runs; also clear any dir already placed.\n"
        "\n"
        "start on stopped configurator\n"
        "\n"
        "console none\n"
        "\n"
        "script\n"
        "    mount -o remount,rw / 2>/dev/null || true\n"
        "    for app in com.palm.app.kindle com.palm.app.enyo-facebook com.palm.app.youtube; do\n"
        "        rm -f  /usr/lib/luna/customization/apps/${app}_*.ipk\n"
        "        rm -rf /media/cryptofs/apps/usr/palm/applications/${app}\n"
        "    done\n"
        "    mount -o remount,ro / 2>/dev/null || true\n"
        "end script\n"
    )
    w("etc/event.d/ce-remove-preloads", preload_job, 0o644)

    # 19) Version string : Device Info shows com.palm.properties.version, sourced
    # from /etc/palm-build-info PRODUCT_VERSION_STRING. BUILDNAME stays
    # Nova-HP-Topaz (the OTA fingerprint's model gate keys on it).
    log("tier: version string -> webOS CE 3.1.0")
    bi = sdata("./etc/palm-build-info").decode()
    bi2 = re.sub(r'^PRODUCT_VERSION_STRING=.*$',
                 'PRODUCT_VERSION_STRING=webOS CE 3.1.0', bi, count=1, flags=re.M)
    if bi2 == bi:
        sys.exit("ERROR: PRODUCT_VERSION_STRING not found in /etc/palm-build-info")
    w("etc/palm-build-info", bi2, 0o644)

    # 20) merge changes.json (carry over community-firstuse removals, add ours)
    cf_cfg = {}
    cf_json = os.path.join(CF_OVERLAY, "changes.json")
    if os.path.exists(cf_json):
        cf_cfg = json.load(open(cf_json))
    all_removes = sorted(set(cf_cfg.get("remove", [])) | set(removes))
    changes = {
        "description": ("Full CE overlay, everything BAKED at final rootfs paths: "
                        "community first-use swap + modern TLS (browser/luna/"
                        "downloadmgr/mail ssl11 stacks + mojomail patches) + LunaCE "
                        "+ App Catalog + Maps 4.0.1 + community Accounts + "
                        "help-redirect + full root-cert trust-store replay + "
                        "UberKernel + Preware/USB-settings/BT-gamepad pre-installed "
                        "+ Media-Internal via copy_binaries + 'webOS CE 3.1.0' "
                        "version string, minus HP preloads. Generated by "
                        "full-ce/bake.py from AddToImage/ - do not edit by hand."),
        "ce_package": CE_PACKAGE,
        "remove": all_removes,
    }
    with open(os.path.join(OUT, "changes.json"), "w") as f:
        json.dump(changes, f, indent=2)
        f.write("\n")

    shutil.rmtree(tmp)
    log(f"done: {OUT}")
    nf = sum(len(files) for _, _, files in os.walk(OUT_ROOT))
    sz = sum(os.path.getsize(os.path.join(dp, f))
             for dp, _dn, fns in os.walk(OUT_ROOT) for f in fns
             if not os.path.islink(os.path.join(dp, f)))
    log(f"overlay rootfs contains {nf} entries ({sz//1048576} MB); "
        f"removals: {len(all_removes)}")


if __name__ == "__main__":
    main()
