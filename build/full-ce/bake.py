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
  OOBE/            the firstuse replacement app (consumed by the community-
                   firstuse overlay, which this script regenerates as its base)
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
  9. core-apps suite   -> the community *-overwrite ipks (accounts, contacts,
                          messaging, phone, chatthreader, service.accounts,
                          contacts.linker, contacts.plugin.messaging,
                          enyo-accounts, enyo-contactsui, messaging.library,
                          luna-systemui) replayed at their final rootfs paths:
                          dest.txt + payload.tar.gz (or files.txt surgical
                          mode), preserve.txt = stock wins, symlinks.txt,
                          db8-kinds/-permissions -> /etc/palm/db (replacing the
                          stock member with the same basename, wherever it is)
 9b. Synergy generic   -> imlibpurpleservice runtime + libpurple 2.14 baked at
                          real paths; cloud-auth/docviewer as rootfs apps;
                          cryptofs-only pieces (synergy-glibc, synergy-runtime,
                          purple plugins — the bind-mount contract connectors
                          rely on) seeded once per flash from
                          /usr/palm/ce-seed/synergy by ce-synergy-seed;
                          device-setup replays (PmBtEngine + webkit-webm byte
                          patches, mediastream reroute, Thai font, gst codecs,
                          bt-a2dp-fix, QuickOffice/Photos staged-ipk repack)
                          and the skype/legacy-IM/google-legacy retire lists
 10. help-redirect     -> Help app repointed at help.webosarchive.org
 11. rootcertsupdate   -> full trust-store replay: trustedcerts dir, hash links,
                          ca-certificates.crt bundle, calinks.tgz (host openssl,
                          -subject_hash_old to match the device's OpenSSL 0.9.8)
 12. UberKernel        -> /boot kernel + shipped /lib/modules subset
 13. Preware           -> BAKED app + ipkgservice in /usr/sbin + static dbus/ls2/
                          upstart (feed seeding runs from the job's pre-start,
                          which also seeds ipkg STATUS stanzas for Preware +
                          Govnah so Preware shows them as installed — USB/BT
                          deliberately stay unlisted)
 14. USB settings      -> BAKED app + service + /usr/bin daemons + upstart + roles
 15. BT gamepad        -> shim lib + udev rule + jail/bluetoothtab/upstart patches
 16. Media-Internal    -> /usr/lib/luna/customization/copy_binaries/media/internal
 17. remove HP preloads (kindle/facebook/youtube) via early upstart job
 18. version string    -> "webOS CE 3.1.0", plus a same-length "HP webOS " ->
                          "webOS CE " literal patch in the four binaries that
                          prefix-strip com.palm.properties.version (LunaSysMgr,
                          libWebKitLuna, media-pipeline.real, mediaserver) so
                          platformVersion and the UAs parse to bare "3.1.0"

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
import tempfile
import time

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


def _natkey(name):
    """Natural-sort key: digit runs compare numerically ("1.0.10" > "1.0.9")."""
    return [(0, int(t)) if t.isdigit() else (1, t)
            for t in re.split(r"(\d+)", name)]


def ati_ipk(folder, pkgprefix):
    """Highest-versioned <pkgprefix>_*.ipk in an AddToImage folder (natural
    sort of the filename). mtime was used before, but git does not preserve
    mtimes, so a fresh clone made the pick arbitrary; a corrected rebuild that
    reuses the same version string overwrites the same filename, so version
    order loses nothing."""
    cands = glob.glob(os.path.join(folder, pkgprefix + "_*.ipk"))
    if not cands:
        sys.exit(f"ERROR: no {pkgprefix}_*.ipk in {folder}")
    return max(cands, key=lambda p: _natkey(os.path.basename(p)))


IPK = {
    "browser":     ati_ipk(POR, "org.webosinternals.browser-tls13"),
    "downloadmgr": ati_ipk(POR, "org.webosinternals.downloadmgr-tls13"),
    "luna":        ati_ipk(POR, "org.webosinternals.luna-tls13"),
    "mail":        ati_ipk(POR, "org.webosinternals.mail-tls13"),
    "kernel":      ati_ipk(POR, "org.webosinternals.kernels.uber-kernel-touchpad"),
    "catalog":     ati_ipk(POR, "com.palm.app.enyo-findapps"),
    "maps":        ati_ipk(POR, "com.palm.app.maps"),
    # NOTE the FILENAME has an underscore: com.palm_.rootcertsupdate_*
    "rootcerts":   ati_ipk(POR, "com.palm_.rootcertsupdate"),
    "synergy":     ati_ipk(POR, "com.palm.synergy.generic"),
    "preware":     ati_ipk(NEWAPPS, "org.webosinternals.preware"),
    "govnah":      ati_ipk(NEWAPPS, "org.webosinternals.govnah"),
    "usb":         ati_ipk(NEWAPPS, "com.webosarchive.usbsettings"),
    "bt":          ati_ipk(NEWAPPS, "org.webosarchive.btgamepad"),
}

# The community core-apps suite: *-overwrite ipks (shared pmPostInstall.script
# family) that replace a stock app/service/framework wholesale (payload.tar.gz
# into the dir named by dest.txt) or surgically (files.txt + files.tar.gz).
# Replayed by bake_overwrite_ipk(); order is not load-bearing.
OVERWRITE_IPKS = {
    "acct-app":     ati_ipk(POR, "com.palm.app.accounts"),
    "contacts":     ati_ipk(POR, "com.palm.app.contacts"),
    "messaging":    ati_ipk(POR, "com.palm.app.messaging"),
    "phone":        ati_ipk(POR, "com.palm.app.phone"),
    "chatthreader": ati_ipk(POR, "com.palm.messaging.chatthreader"),
    "svc-accounts": ati_ipk(POR, "com.palm.service.accounts"),
    "linker":       ati_ipk(POR, "com.palm.service.contacts.linker"),
    "cpm":          ati_ipk(POR, "contacts.plugin.messaging"),
    "enyo-acct":    ati_ipk(POR, "enyo-accounts"),
    "enyo-cui":     ati_ipk(POR, "enyo-contactsui"),
    "systemui":     ati_ipk(POR, "luna-systemui"),
    "msg-lib":      ati_ipk(POR, "messaging.library"),
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

# Synergy generic's skype-disable / legacy-im-disable / google-legacy-disable
# retire lists, transcribed from its postinst. On-device these are ds_move'd to
# a cryptofs backup (reversible); CE removes them from the image (recovery is
# re-Doctoring). Entries name a file OR a directory (expanded against stock).
# DELIBERATELY absent: /usr/lib/gstreamer-0.10/libpalmgstskype.so — the
# Teams/Telegram/WhatsApp connector plugins carry a hard ELF NEEDED + RPATH on
# it, and /usr/lib/purple-2/libjabber.* stays out of the legacy-IM section
# because it's retired by the google section below (type_gtalk was its last
# consumer).
SYNERGY_RETIRE = [
    # -- skype-disable (defunct Skype stack)
    "/usr/share/dbus-1/system-services/com.palm.skype.service",
    "/usr/share/dbus-1/system-services/com.palm.skypevalidator.service",
    "/etc/palm/activities/com.palm.skype",
    "/etc/palm/activities/com.palm.skypevalidator",
    "/etc/event.d/skypekit",
    "/etc/event.d/skypekit-offport",
    "/usr/share/ls2/roles/prv/com.palm.skype.json",
    "/usr/share/ls2/roles/prv/com.palm.skypevalidator.json",
    "/etc/palm/db/kinds/com.palm.skype",
    "/etc/palm/db/permissions/com.palm.skype",
    "/etc/palm/tempdb/kinds/com.palm.skype",
    "/etc/palm/tempdb/permissions/com.palm.skype",
    "/usr/palm/public/accounts/com.palm.skype",
    "/usr/palm/applications/com.palm.app.skype",
    "/usr/bin/skypem",
    "/usr/bin/skypevalidator",
    "/usr/bin/linux-armv7-skypekit-voicepcm-videortp",
    "/var/skypekit",
    # -- legacy-im-disable: AOL/AIM
    "/usr/palm/public/accounts/com.palm.aol",
    "/usr/bin/imaccountvalidator",
    "/usr/share/ls2/roles/prv/com.palm.imaccountvalidator.json",
    "/usr/share/dbus-1/system-services/com.palm.imaccountvalidator.service",
    # -- legacy-im-disable: Yahoo! IM
    "/usr/bin/imyahootransport",
    "/usr/share/ls2/roles/prv/com.palm.imyahoo.json",
    "/usr/share/dbus-1/system-services/com.palm.imyahoo.service",
    "/etc/palm/activities/com.palm.imyahoo",
    "/etc/palm/db/kinds/com.palm.imcommand.yahoo",
    "/etc/palm/db/kinds/com.palm.imloginstate.yahoo",
    "/etc/palm/db/kinds/com.palm.immessage.yahoo",
    "/etc/palm/db/kinds/com.palm.contact.imyahoo",
    "/etc/palm/tempdb/kinds/com.palm.imbuddystatus.yahoo",
    # -- legacy-im-disable: Yahoo! contacts sync
    "/usr/palm/services/com.palm.service.contacts.yahoo",
    "/usr/share/ls2/roles/prv/com.palm.service.contacts.yahoo.json",
    "/usr/share/ls2/roles/pub/com.palm.service.contacts.yahoo.json",
    "/usr/share/dbus-1/system-services/com.palm.service.contacts.yahoo.service",
    "/etc/palm/db/kinds/com.palm.contact.yahoo",
    "/etc/palm/db/kinds/com.palm.contact.transport.yahoo",
    "/etc/palm/db/kinds/com.palm.account.contacts.yahoo",
    "/etc/palm/db/permissions/com.palm.contact.yahoo",
    "/etc/palm/db/permissions/com.palm.contact.transport.yahoo",
    "/etc/palm/db/permissions/com.palm.account.contacts.yahoo",
    # -- legacy-im-disable: Yahoo! calendar sync
    "/usr/palm/services/com.palm.service.calendar.yahoo",
    "/usr/share/ls2/roles/prv/com.palm.service.calendar.yahoo.json",
    "/usr/share/ls2/roles/pub/com.palm.service.calendar.yahoo.json",
    "/usr/share/dbus-1/system-services/com.palm.service.calendar.yahoo.service",
    "/etc/palm/db/kinds/com.palm.calendar.yahoo",
    "/etc/palm/db/kinds/com.palm.calendarevent.yahoo",
    "/etc/palm/db/kinds/com.palm.calendar.transport.yahoo",
    "/etc/palm/db/kinds/com.palm.calendarevent.transport.yahoo",
    "/etc/palm/db/kinds/com.palm.account.calendar.yahoo",
    "/etc/palm/db/permissions/com.palm.calendar.yahoo",
    "/etc/palm/db/permissions/com.palm.calendarevent.yahoo",
    # -- legacy-im-disable: Yahoo! master/auth service + account template
    "/usr/bin/yahoo-service",
    "/usr/share/ls2/roles/prv/com.palm.yahoo.json",
    "/usr/share/dbus-1/system-services/com.palm.yahoo.service",
    "/etc/palm/db/kinds/com.palm.yahoo.authservice",
    "/usr/palm/public/accounts/com.palm.yahoo",
    # -- legacy-im-disable: orphaned oscar/AIM/ICQ plugins + redundant SSL backends
    "/usr/lib/purple-2/libaim.so",
    "/usr/lib/purple-2/libicq.so",
    "/usr/lib/purple-2/liboscar.so",
    "/usr/lib/purple-2/liboscar.so.0",
    "/usr/lib/purple-2/liboscar.so.0.0.0",
    "/usr/lib/purple-2/ssl-gnutls.so",
    "/usr/lib/purple-2/ssl-nss.so",
    # -- google-legacy-disable: contacts sync
    "/usr/palm/services/com.palm.service.contacts.google",
    "/usr/share/ls2/roles/prv/com.palm.service.contacts.google.json",
    "/usr/share/ls2/roles/pub/com.palm.service.contacts.google.json",
    "/usr/share/dbus-1/system-services/com.palm.service.contacts.google.service",
    "/etc/palm/db/kinds/com.palm.contact.google",
    "/etc/palm/db/kinds/com.palm.contact.transport.google",
    "/etc/palm/db/kinds/com.palm.account.contacts.google",
    "/etc/palm/db/permissions/com.palm.contact.google",
    "/etc/palm/db/permissions/com.palm.contact.transport.google",
    "/etc/palm/db/permissions/com.palm.account.contacts.google",
    # -- google-legacy-disable: calendar sync
    "/usr/palm/services/com.palm.service.calendar.google",
    "/usr/share/ls2/roles/prv/com.palm.service.calendar.google.json",
    "/usr/share/ls2/roles/pub/com.palm.service.calendar.google.json",
    "/usr/share/dbus-1/system-services/com.palm.service.calendar.google.service",
    "/etc/palm/db/kinds/com.palm.calendar.google",
    "/etc/palm/db/kinds/com.palm.calendarevent.google",
    "/etc/palm/db/kinds/com.palm.calendar.transport.google",
    "/etc/palm/db/kinds/com.palm.calendarevent.transport.google",
    "/etc/palm/db/kinds/com.palm.account.calendar.google",
    "/etc/palm/db/permissions/com.palm.calendar.google",
    "/etc/palm/db/permissions/com.palm.calendarevent.google",
    # -- google-legacy-disable: account template + orphaned jabber/xmpp plugins
    "/usr/palm/public/accounts/com.palm.google",
    "/usr/lib/purple-2/libjabber.so",
    "/usr/lib/purple-2/libjabber.so.0",
    "/usr/lib/purple-2/libjabber.so.0.0.0",
    "/usr/lib/purple-2/libxmpp.so",
]


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


def ipk_version(path):
    """Version component of an ipk FILENAME (<pkg>_<version>_<arch>.ipk)."""
    parts = os.path.basename(path).split("_")
    if len(parts) < 3:
        sys.exit(f"ERROR: cannot parse version from ipk filename: {path}")
    return parts[-2]


def read_rootfs_names(tgz, prefixes):
    """Streaming pass collecting the NAMES of file/symlink members under the
    given prefixes (no data — cheap even for large subtrees)."""
    prefixes = tuple(prefixes)
    names = set()
    with tarfile.open(tgz, mode="r|gz") as tf:
        for m in tf:
            if (m.isfile() or m.issym()) and m.name.startswith(prefixes):
                names.add(m.name)
    return names


# Every file this script authors, so the verify pass at the end can check the
# ones whose failure mode is silent. Python syntax errors stop the build
# instantly; a busted line of shell inside one of these string literals ships
# and only surfaces on a flashed device.
WROTE = []


def w(relpath, data, mode=0o644):
    """Write a regular file into the overlay rootfs tree."""
    p = os.path.join(OUT_ROOT, relpath)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "wb") as f:
        f.write(data if isinstance(data, (bytes, bytearray)) else data.encode())
    os.chmod(p, mode)
    WROTE.append(relpath)
    log(f"  file    /{relpath} ({len(data)} bytes, {mode:o})")


UPSTART_BLOCK_RE = re.compile(
    r"^(?:pre-start |post-start |pre-stop |post-stop )?script$(.*?)^end script$",
    re.M | re.S)


def verify_generated_sources():
    """Syntax-check the code we author for the device, and fail the build if it
    is broken.

    The two languages that reach the device from here — upstart job shell and
    the account app's JavaScript — are written as string literals and patches,
    where nothing but this check stands between a typo and a flashed image. A
    Python error stops the build in the first second; a shell error inside one
    of those literals used to sail through, get flashed, and be discovered on
    a device an hour later. Cheap check, expensive failure.
    """
    sh_files, sh_blocks, js_files, problems = 0, 0, 0, []

    def sh_n(text, label):
        nonlocal sh_blocks
        sh_blocks += 1
        tmp = os.path.join(tempfile.gettempdir(), "ce-shellcheck.sh")
        with open(tmp, "w") as f:
            f.write(text)
        r = subprocess.run(["sh", "-n", tmp], capture_output=True, text=True)
        if r.returncode != 0:
            problems.append(f"{label}: {r.stderr.strip()}")

    evd = os.path.join(OUT_ROOT, "etc/event.d")
    if os.path.isdir(evd):
        for name in sorted(os.listdir(evd)):
            p = os.path.join(evd, name)
            if not os.path.isfile(p):
                continue
            body = open(p, errors="replace").read()
            blocks = UPSTART_BLOCK_RE.findall(body)
            if blocks:
                sh_files += 1
            for i, b in enumerate(blocks):
                sh_n(b, f"/etc/event.d/{name} (block {i + 1})")

    # standalone shell we generate (launch wrappers, the reboot tripwire shims)
    for rel in sorted(set(WROTE)):
        p = os.path.join(OUT_ROOT, rel)
        if not os.path.isfile(p):
            continue
        head = open(p, "rb").read(64)
        if head.startswith(b"#!") and (b"/sh" in head.split(b"\n")[0]
                                       or b"/bash" in head.split(b"\n")[0]):
            sh_files += 1
            sh_n(open(p, errors="replace").read(), f"/{rel}")

    # JavaScript we author or rewrite (the account app's patched files come via
    # the community-firstuse layer and are checked in make-overlay.sh too)
    node = shutil.which("node") or shutil.which("nodejs")
    js_targets = [r for r in sorted(set(WROTE)) if r.endswith(".js")]
    if js_targets and not node:
        problems.append(
            "node/nodejs not found — cannot syntax-check generated JavaScript. "
            "Install node, or set CE_SKIP_JS_CHECK=1 to build anyway (not "
            "recommended: a JS typo here is only discoverable on a flashed device)")
    elif node:
        for rel in js_targets:
            p = os.path.join(OUT_ROOT, rel)
            if not os.path.isfile(p):
                continue
            js_files += 1
            r = subprocess.run([node, "--check", p], capture_output=True, text=True)
            if r.returncode != 0:
                problems.append(f"/{rel}: {r.stderr.strip().splitlines()[-1] if r.stderr.strip() else 'parse error'}")

    if problems and os.environ.get("CE_SKIP_JS_CHECK") == "1":
        problems = [p for p in problems if "node/nodejs not found" not in p]
    if problems:
        sys.exit("[bake] FATAL: generated sources failed syntax check:\n  - "
                 + "\n  - ".join(problems))
    log(f"verified: {sh_blocks} shell block(s) in {sh_files} file(s), "
        f"{js_files} generated .js file(s) — all parse")


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


def bake_tree(srcroot, quiet=True, destprefix=""):
    """Bake an extracted payload tree into the overlay (at identical paths, or
    under destprefix). Skips the _ar scratch dir. Files keep exec-ness
    (755/644); symlinks kept. Returns the set of baked overlay relpaths."""
    baked = set()
    for dp, dns, fns in os.walk(srcroot):
        dns[:] = [x for x in dns if x != "_ar"]
        for fn in fns:
            full = os.path.join(dp, fn)
            rel = os.path.relpath(full, srcroot)
            if destprefix:
                rel = os.path.join(destprefix, rel)
            p = os.path.join(OUT_ROOT, rel)
            os.makedirs(os.path.dirname(p), exist_ok=True)
            if os.path.islink(full):
                if os.path.lexists(p):
                    os.remove(p)
                os.symlink(os.readlink(full), p)
            else:
                mode = 0o755 if (os.stat(full).st_mode & 0o111) else 0o644
                shutil.copyfile(full, p)
                os.chmod(p, mode)
            baked.add(rel)
    if quiet:
        log(f"  baked {len(baked)} entries from {os.path.basename(srcroot)}")
    return baked


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
                *IPK.values(), *OVERWRITE_IPKS.values()):
        if not os.path.exists(req):
            sys.exit(f"ERROR: missing required input: {req}")
    if not os.path.isdir(MEDIA):
        sys.exit(f"ERROR: missing {MEDIA}")
    for k, v in sorted(IPK.items()):
        log(f"input {k:12s} {os.path.basename(v)}")
    for k, v in sorted(OVERWRITE_IPKS.items()):
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
    TRUSTED_PFX = "./etc/ssl/certs/trustedcerts/"
    HELP_SRC = "./usr/palm/applications/com.palm.app.help/help/source/"
    BT_MODEL = "./usr/palm/applications/com.palm.app.bluetoothtab/app/models/Bluetooth.js"
    BT_ASSIST = ("./usr/palm/applications/com.palm.app.bluetoothtab/app/controllers/"
                 "bluetooth-assistant.js")
    stock = read_rootfs(ROOTFS_TGZ, exact=[
        "./usr/bin/media-pipeline",
        "./usr/bin/mediaserver",
        "./usr/lib/libWebKitLuna.so",
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
        # synergy device-setup replay targets
        "./usr/bin/PmBtEngine",
        "./usr/palm/frameworks/mediastream/submission/24mediastream.js",
        "./usr/palm/frameworks/mediastream/submission/24/concatenated.js",
        "./usr/palm/frameworks/mediastream/submission/24/javascript/StreamingPlayEngine.js",
        "./usr/palm/services/com.palm.service.photos/photos-src/base/Utils.js",
        "./usr/palm/services/com.palm.service.photos/photos-src/base/Sync-Manager.js",
        # stock staged ipks repacked with the synergy QuickOffice/Photos patches
        "./usr/palm/ipkgs/com.quickoffice.webos_2.1.2113_ARM_release-arm.ipk",
        "./usr/palm/ipkgs/com.quickoffice.ar_10.3.484_ARM_release-arm.ipk",
        "./usr/palm/ipkgs/com.palm.app.photos/com.palm.app.photos_3.0.8001_all.ipk",
        # CE platform tweaks (connectivity check, app installer, keyboard size)
        # + the JS-service launcher and the account service's dbus launcher
        "./usr/bin/run-js-service",
        "./usr/share/dbus-1/system-services/com.palm.accountservices.service",
        "./usr/bin/PmNetConfigManager",
        "./usr/palm/frameworks/enyo/0.10/framework/lib/captiveportal/CaptivePortalControl.js",
        "./usr/palm/command-resource-handlers.json",
        "./etc/palm/defaultPreferences.txt",
    ], prefixes=[TRUSTED_PFX])

    def sdata(name):
        return stock[name]["data"]

    # stock member NAMES under everything the overwrite replays diff against:
    # the replaced app/service/framework trees (to compute removals of stock
    # files the new build no longer ships), the staged-ipk store (to remove the
    # stock ipks of apps we bake — they'd install an OLD copy into cryptofs at
    # first boot, and cryptofs shadows the rootfs), and /etc/palm/db (to
    # replace stock db8 kind/permission files wherever they actually live —
    # some sit in per-owner SUBDIRS, e.g. kinds/com.palm.app.phone/).
    log("scanning stock member names for the overwrite replays")
    stock_names = read_rootfs_names(ROOTFS_TGZ, [
        "./usr/palm/applications/com.palm.app.accounts/",
        "./usr/palm/applications/com.palm.app.phone/",
        "./usr/palm/applications/com.palm.app.enyo-findapps/",
        "./usr/palm/services/com.palm.messaging.chatthreader/",
        "./usr/palm/services/com.palm.service.accounts/",
        "./usr/palm/services/com.palm.service.contacts.linker/",
        "./usr/palm/frameworks/contacts.plugin.messaging/",
        "./usr/palm/frameworks/messaging.library/",
        "./usr/palm/frameworks/enyo/0.10/framework/lib/accounts/",
        "./usr/palm/frameworks/enyo/0.10/framework/lib/contactsui/",
        "./usr/palm/ipkgs/",
        "./etc/palm/db/",
        "./etc/palm/tempdb/",
        # synergy retire-list entries (each is a file or a whole directory;
        # expanded precisely — exact member or members under <entry>/ — below)
        *("./" + e.lstrip("/") for e in SYNERGY_RETIRE),
    ])

    removes = []

    def remove_staged_ipk(appid):
        """Remove the stock staged-ipk subdir (ipk + icon + manifest) for an
        app this image bakes into the rootfs. app-install would otherwise
        install the OLD stock version into cryptofs at first boot, shadowing
        the baked app."""
        members = sorted(n for n in stock_names
                         if n.startswith(f"./usr/palm/ipkgs/{appid}/"))
        if not members:
            log(f"  note: no stock staged ipk for {appid} (nothing to remove)")
        for n in members:
            removes.append(n[1:])
            log(f"  remove staged {n[1:]}")

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

    # 8) App Catalog : BAKE the community enyo-findapps over the stock rootfs
    # app, removing stock files the new build no longer ships — AND removing
    # the stock staged catalog ipk.
    #
    # That staged ipk sits at a FLAT path
    # (/usr/palm/ipkgs/com.palm.app.enyo-findapps_5.0.2900_all.ipk, 14.9MB,
    # plus findapps-icon.png), not in a per-app subdir like maps, which is why
    # remove_staged_ipk() cannot match it. A previous session concluded from
    # that mismatch that "there is no staged findapps ipk" and deleted the
    # removal. The ipk is right there in the stock tarball, and app-install
    # duly installed it to cryptofs on first boot, where it SHADOWED the baked
    # build: confirmed live on 600020 — rootfs 6.1.2901, cryptofs 5.0.2900,
    # installed 15:14:47, i.e. after ce-firstboot-tweaks' deshadow pass had
    # already reported "verified clean". Every App Catalog test on 600014-600020
    # was therefore exercising the OLD stock catalog.
    log(f"tier: App Catalog BAKED ({os.path.basename(IPK['catalog'])})")
    d = ipk_extract_data(IPK["catalog"], os.path.join(tmp, "catalog"))
    baked_cat = bake_tree(d)
    CAT_PFX = "./usr/palm/applications/com.palm.app.enyo-findapps/"
    cat_removes = sorted(n[1:] for n in stock_names
                         if n.startswith(CAT_PFX) and n[2:] not in baked_cat)
    removes.extend(cat_removes)
    log(f"  {len(cat_removes)} stale stock catalog files removed")
    # the flat-path staged ipk + its icon (see the tier comment above)
    cat_staged = sorted(n for n in stock_names
                        if n.startswith("./usr/palm/ipkgs/")
                        and ("enyo-findapps" in n or "findapps-icon" in n))
    if not cat_staged:
        sys.exit("ERROR: no staged App Catalog ipk found under /usr/palm/ipkgs. "
                 "Stock ships com.palm.app.enyo-findapps_*.ipk there; if this "
                 "Doctor genuinely lacks it, drop this check deliberately — do "
                 "NOT assume it is absent (that assumption shipped a shadowed "
                 "catalog in 600014-600020).")
    for n in cat_staged:
        removes.append(n[1:])
        log(f"  remove staged {n[1:]}")

    # 9) Maps : BAKE 4.0.1 as a system app; remove the stock staged 3.0.1 ipk
    # (it lives in a per-app SUBDIR of /usr/palm/ipkgs — ipk + icon + manifest).
    log(f"tier: Maps BAKED ({os.path.basename(IPK['maps'])})")
    d = ipk_extract_data(IPK["maps"], os.path.join(tmp, "maps"))
    bake_tree(d)
    remove_staged_ipk("com.palm.app.maps")

    # 10) core-apps suite : replay each community *-overwrite ipk. The shared
    # pmPostInstall.script family stages ONE subdir per package under
    # /media/cryptofs/<group>-overwrite/<pkg>/ holding:
    #   dest.txt      the absolute dir the package replaces/patches
    #   payload.tar.gz  whole-dir mode: extracted INTO dest after rm -rf
    #   files.txt + files.tar.gz  surgical mode: only the listed files change
    #   preserve.txt  subpaths whose ON-DEVICE content survives the replace —
    #                 at bake time "on-device" = pristine stock, so stock wins
    #   symlinks.txt  "relpath<TAB>target" links (cryptofs can't hold symlinks)
    #   db8-kinds/ db8-permissions/  kind/permission files for /etc/palm/db —
    #                 the postinst also putKinds them live; on a Doctor-fresh
    #                 device com.palm.configurator loads /etc/palm/db itself,
    #                 so baking the files is the complete replay
    # A dest under /media/cryptofs/apps/ means the stock app was cryptofs-
    # installed from a staged ipk: bake it as a ROOTFS app instead (the proven
    # maps/catalog pattern) and remove the stock staged ipk.
    def bake_overwrite_ipk(key):
        ipk = OVERWRITE_IPKS[key]
        d = ipk_extract_data(ipk, os.path.join(tmp, f"ow-{key}"))
        dests = glob.glob(os.path.join(d, "media/cryptofs/*-overwrite/*/dest.txt"))
        if len(dests) != 1:
            sys.exit(f"ERROR: {os.path.basename(ipk)}: expected exactly one "
                     f"staged dest.txt, found {len(dests)}")
        ov = os.path.dirname(dests[0])
        dest = open(dests[0]).read().strip()
        cryptofs_app = None
        if dest.startswith("/media/cryptofs/apps/"):
            destrel = dest[len("/media/cryptofs/apps/"):]
            if not destrel.startswith("usr/palm/applications/"):
                sys.exit(f"ERROR: {key}: unexpected cryptofs dest {dest}")
            cryptofs_app = os.path.basename(destrel)
        else:
            destrel = dest.lstrip("/")
        # stock /usr/palm/frameworks/enyo/1.0 is a SYMLINK to 0.10 — bake at
        # the real path so the flash never turns the link into a directory
        destrel = destrel.replace("usr/palm/frameworks/enyo/1.0/",
                                  "usr/palm/frameworks/enyo/0.10/", 1)
        log(f"tier: overwrite replay {os.path.basename(ipk)} -> /{destrel}")

        if os.path.exists(os.path.join(ov, "files.txt")):
            # surgical mode: only the listed files change; nothing is removed
            fdir = os.path.join(tmp, f"ow-{key}-files")
            os.makedirs(fdir)
            with tarfile.open(os.path.join(ov, "files.tar.gz")) as tf:
                tf.extractall(fdir, filter="data")
            listed = [ln.strip() for ln in open(os.path.join(ov, "files.txt"))
                      if ln.strip()]
            baked = bake_tree(fdir, destprefix=destrel)
            if {os.path.join(destrel, x) for x in listed} != baked:
                sys.exit(f"ERROR: {key}: files.txt does not match files.tar.gz")
        else:
            # whole-dir mode
            pdir = os.path.join(tmp, f"ow-{key}-payload")
            os.makedirs(pdir)
            with tarfile.open(os.path.join(ov, "payload.tar.gz")) as tf:
                tf.extractall(pdir, filter="data")
            stock_pfx = "./" + destrel + "/"
            stock_under = {n for n in stock_names if n.startswith(stock_pfx)}

            preserve = []
            pv = os.path.join(ov, "preserve.txt")
            if os.path.exists(pv):
                preserve = [ln.strip() for ln in open(pv) if ln.strip()]
            # a preserve path only "wins" if stock actually has content there
            preserved = [p for p in preserve
                         if any(n == stock_pfx + p or n.startswith(stock_pfx + p + "/")
                                for n in stock_under)]

            def under_preserved(rel):
                return any(rel == p or rel.startswith(p + "/") for p in preserved)

            baked = set()
            for dp, _dn, fns in os.walk(pdir):
                for fn in fns:
                    full = os.path.join(dp, fn)
                    rel = os.path.relpath(full, pdir)
                    if under_preserved(rel):
                        continue                      # stock wins
                    p = os.path.join(OUT_ROOT, destrel, rel)
                    os.makedirs(os.path.dirname(p), exist_ok=True)
                    if os.path.islink(full):
                        if os.path.lexists(p):
                            os.remove(p)
                        os.symlink(os.readlink(full), p)
                    else:
                        mode = 0o755 if (os.stat(full).st_mode & 0o111) else 0o644
                        shutil.copyfile(full, p)
                        os.chmod(p, mode)
                    baked.add(rel)
            if not baked:
                sys.exit(f"ERROR: {key}: empty payload")
            if "applications/" in destrel and "appinfo.json" not in baked:
                sys.exit(f"ERROR: {key}: app payload has no appinfo.json")
            sl = os.path.join(ov, "symlinks.txt")
            if os.path.exists(sl) and os.path.getsize(sl):
                for ln in open(sl):
                    if not ln.strip():
                        continue
                    rel, target = ln.rstrip("\n").split("\t", 1)
                    symlink(os.path.join(destrel, rel), target)
                    baked.add(rel)
            n_rm = 0
            for n in sorted(stock_under):
                rel = n[len(stock_pfx):]
                if rel in baked or under_preserved(rel):
                    continue
                removes.append(n[1:])
                n_rm += 1
            log(f"  {len(baked)} files baked, {n_rm} stock files removed"
                + (f", stock-preserved: {', '.join(preserved)}" if preserved else ""))

        # db8 kind/permission files -> /etc/palm/db, REPLACING the stock member
        # with the same basename wherever it lives (several sit in per-owner
        # subdirs, e.g. kinds/com.palm.app.phone/com.palm.phonecall); brand-new
        # ones land flat. Copied raw, exactly like the postinst's cp — the
        # owner-injection there is only for its live putKind call.
        for sub, base in (("db8-kinds", "etc/palm/db/kinds"),
                          ("db8-permissions", "etc/palm/db/permissions")):
            kd = os.path.join(ov, sub)
            if not os.path.isdir(kd):
                continue
            for fn in sorted(os.listdir(kd)):
                full = os.path.join(kd, fn)
                if not os.path.isfile(full):
                    continue
                cands = [n for n in stock_names
                         if n.startswith(f"./{base}/") and os.path.basename(n) == fn]
                if len(cands) > 1:
                    sys.exit(f"ERROR: {key}: ambiguous stock {sub} member {fn}: {cands}")
                rel = cands[0][2:] if cands else f"{base}/{fn}"
                wcopy(rel, full, 0o644)
        return cryptofs_app

    for key in sorted(OVERWRITE_IPKS):
        appid = bake_overwrite_ipk(key)
        if appid:
            remove_staged_ipk(appid)

    # 10b) Synergy Revival generic runtime (com.palm.synergy.generic).
    # Replay of its postinst, adapted to the baked image:
    #  - rootfs-overwrite tree -> baked at its real paths (transport binary,
    #    imtransport job, /var launch scripts, libpurple 2.14 + plugins, db8
    #    kinds/permissions/activities, ls2 roles, dbus launcher, _cloudcore)
    #  - its cryptofs-app payloads (cloud-auth, docviewer) -> baked as ROOTFS
    #    apps (the maps/catalog pattern)
    #  - its cryptofs-only payloads CANNOT be baked (the transport's ELF
    #    interpreter is hardcoded to /media/cryptofs/synergy-glibc/lib/
    #    ld-linux.so.3, and imwrap.sh bind-mounts /media/cryptofs/
    #    synergy-{purple-plugins,runtime} over /usr/lib on every launch — a
    #    contract later Preware-installed connectors rely on, so it must stay).
    #    They ship under /usr/palm/ce-seed/synergy/ and /etc/event.d/
    #    ce-synergy-seed copies them into cryptofs once per flash.
    #  - device-setup fixes: PmBtEngine BT-HFG byte patch, mediastream webm
    #    reroute (their own sh/awk script run on pristine stock), Thai font,
    #    gst opus/ogg/vpx/matroska/speex/audioresample plugins, bt-a2dp-fix
    #    job, db8-clean tool, and the skype/legacy-IM/google-legacy retire
    #    lists as image removals. The libWebKitLuna webm-MIME byte patch is
    #    applied in the version-prefix tier (same file, one write).
    #  - QuickOffice/Photos integration targets apps installed at first boot
    #    from stock staged ipks — those ipks are repacked here with the
    #    patches applied (webOS ipkg does not verify signatures).
    #  Skipped on purpose: whatsapp-e164 migration (live-db8 migration for
    #  EXISTING data — a fresh flash has none), videoplayer-webm's
    #  libmp-autoplug shim (breaks mp4 playback; postinst skips it too), and
    #  the gstreamer registry-cache cleanup (no cache exists on a fresh /var).
    log(f"tier: Synergy generic ({os.path.basename(IPK['synergy'])})")
    d = ipk_extract_data(IPK["synergy"], os.path.join(tmp, "synergy"))
    SREV = os.path.join(d, "media/cryptofs/synergy-revival")
    RO = os.path.join(SREV, "rootfs-overwrite", "com.palm.synergy.generic")
    DSDIR = os.path.join(SREV, "device-setup")
    if not os.path.isdir(RO) or not os.path.isdir(DSDIR):
        sys.exit("ERROR: synergy ipk missing rootfs-overwrite/device-setup staging")
    # everything under this rootfs dir is copied into /media/cryptofs/<top>/
    # once per flash by /etc/event.d/ce-cryptofs-seed (cryptofs survives
    # flashes but is not in the image; it mounts late — finish post-start)
    SEED = "usr/palm/ce-seed/cryptofs"
    CRYPT_APP_PFX = "media/cryptofs/apps/usr/palm/applications/"
    syn_apps = []
    n_root = n_seed = 0
    for dp, _dn, fns in os.walk(RO):
        for fn in fns:
            full = os.path.join(dp, fn)
            rel = os.path.relpath(full, RO)
            if rel == ".symlinks":
                continue
            # com.palm.app.docviewer is permanently excluded (user decision
            # 2026-08-17): it was never meant to ship in the generic ipk.
            if rel.startswith(CRYPT_APP_PFX + "com.palm.app.docviewer/"):
                continue
            if rel.startswith(CRYPT_APP_PFX):
                tgt = "usr/palm/applications/" + rel[len(CRYPT_APP_PFX):]
                appid = rel[len(CRYPT_APP_PFX):].split("/", 1)[0]
                if appid not in syn_apps:
                    syn_apps.append(appid)
            elif rel.startswith("media/cryptofs/"):
                sub = rel[len("media/cryptofs/"):]
                if not sub.startswith(("synergy-glibc/", "synergy-runtime/")):
                    sys.exit(f"ERROR: synergy: unexpected cryptofs payload path {rel}")
                tgt = f"{SEED}/{sub}"
                n_seed += 1
            else:
                tgt = rel
                n_root += 1
            mode = 0o755 if (os.stat(full).st_mode & 0o111) else 0o644
            if tgt.startswith("var/") and tgt.endswith(".sh"):
                mode = 0o755          # the postinst chmods these explicitly
            wcopy(tgt, full, mode)
    log(f"  {n_root} rootfs files, {n_seed} seed files, apps baked: {', '.join(syn_apps)}")
    # .symlinks manifest: "abs-dst<TAB>target" (libpurple.so{,.0} -> 0.14.13,
    # replacing the stock links to 0.5.1)
    for ln in open(os.path.join(RO, ".symlinks")):
        if not ln.strip():
            continue
        dst, target = ln.rstrip("\n").split("\t", 1)
        symlink(dst.lstrip("/"), target)
    # seed copies of the generic purple-2 plugins: imwrap.sh bind-mounts
    # /media/cryptofs/synergy-purple-plugins OVER /usr/lib/purple-2 on every
    # transport launch, which would otherwise mask the baked plugins with an
    # empty dir. (The baked /usr/lib/purple-2 copies stay too — they are the
    # modernized stock files, and they are what a pre-mount reader sees.)
    p2 = os.path.join(RO, "usr/lib/purple-2")
    for fn in sorted(os.listdir(p2)):
        wcopy(f"{SEED}/synergy-purple-plugins/{fn}", os.path.join(p2, fn), 0o755)
    # modern glib for the transport (AddToImage/Synergy-Runtime): libpurple
    # 2.14 + imlibpurpletransport are built against the wpe glib staging
    # (needs e.g. g_malloc0_n, glib >= 2.24 — stock 3.0.5 glib lacks it). On
    # Herrie's devices the Atlas app's deviceroot supplies it via imwrap's
    # LD_LIBRARY_PATH; a CE device without Atlas gets it from the
    # synergy-runtime seed instead (readelf-verified closure: the five
    # g*-2.0 libs + libffi + libz; everything else resolves from
    # synergy-glibc or stock). Sourced from the Atlas reference deviceroot
    # wpe-252/lib with Herrie's permission.
    GLIBDIR = os.path.join(ATI, "Synergy-Runtime")
    if not os.path.isdir(GLIBDIR):
        sys.exit(f"ERROR: missing {GLIBDIR}")
    for fn in sorted(os.listdir(GLIBDIR)):
        wcopy(f"{SEED}/synergy-runtime/{fn}", os.path.join(GLIBDIR, fn), 0o755)
    # the bind-mount TARGET /usr/lib/synergy-runtime must pre-exist in the
    # rootfs: imwrap.sh's own mkdir -p fails on the read-only root (the
    # postinst created it with root remounted rw — a baked image has no
    # postinst). A placeholder file makes the flash create the dir; the bind
    # mount masks it at runtime. Confirmed live: without it the transport
    # loses libstdc++/libtidy ("cannot open shared object file").
    w("usr/lib/synergy-runtime/.keep",
      "webOS CE: bind-mount target for /media/cryptofs/synergy-runtime "
      "(see imwrap.sh); this placeholder only exists so the flash creates "
      "the directory on the read-only root.\n", 0o644)

    # imtransport starts on ls-hubd_private-ready, but cryptofs (where its
    # seeded glibc lives) mounts late in boot (finish post-start) — without a
    # gate the doomed launches burn the job's respawn limit (30/hour) before
    # the interpreter even exists. Wait in pre-start instead of failing.
    imt = open(os.path.join(RO, "etc/event.d/imtransport")).read()
    imt = sure_replace(
        imt, "exec /var/imdaemon.sh",
        "# webOS CE: cryptofs mounts late in boot (finish post-start) and the\n"
        "# transport's ELF interpreter lives there (seeded by ce-cryptofs-seed) —\n"
        "# wait for it so respawn isn't burned on launches that cannot succeed.\n"
        "pre-start script\n"
        "    i=0\n"
        "    while [ ! -f /media/cryptofs/synergy-glibc/lib/ld-linux.so.3 ] && [ $i -lt 90 ]; do\n"
        "        sleep 2\n"
        "        i=$((i+1))\n"
        "    done\n"
        "    # existence isn't enough: mapping a lib that cryptofs can't fully\n"
        "    # serve yet (mid-seed, or early after mount) SIGBUSes the transport\n"
        "    # in ld-linux. Full-read every runtime lib until two consecutive\n"
        "    # passes see the same byte count — complete and readable.\n"
        "    if [ ! -f /media/cryptofs/synergy-glibc/lib/ld-linux.so.3 ]; then\n"
        "        # exec'ing now would fail instantly and burn one of only 30 respawns\n"
        "        # per hour; with no second boot, exhausting them stops the job for\n"
        "        # good. Fail the pre-start instead and let ce-cryptofs-seed's kick\n"
        "        # restart us once the interpreter is actually there.\n"
        "        echo \"$(date 2>/dev/null) interpreter still absent -- not exec'ing\" \\\n"
        "            >> /var/log/imtransport-gate.log 2>/dev/null\n"
        "        exit 1\n"
        "    fi\n"
        "    prev=-1\n"
        "    i=0\n"
        "    while [ $i -lt 90 ]; do\n"
        "        cur=$(cat /media/cryptofs/synergy-glibc/lib/* \\\n"
        "                  /media/cryptofs/synergy-runtime/* \\\n"
        "                  /media/cryptofs/synergy-purple-plugins/* 2>/dev/null | wc -c)\n"
        "        if [ \"$cur\" -gt 0 ] && [ \"$cur\" = \"$prev\" ]; then break; fi\n"
        "        prev=$cur\n"
        "        sleep 2\n"
        "        i=$((i+1))\n"
        "    done\n"
        "end script\n"
        "\n"
        "exec /var/imdaemon.sh",
        "imtransport pre-start gate", count=1)
    w("etc/event.d/imtransport", imt, 0o644)

    # once-per-flash cryptofs seeding + an unconditional kick for imtransport.
    # Generic: every dir under /usr/palm/ce-seed/cryptofs/ is merged into
    # /media/cryptofs/<same name> (synergy-glibc/-runtime/-purple-plugins for
    # the transport's hardcoded interpreter + imwrap.sh bind-mount contract,
    # and apps/ for content merged into the cryptofs app store, e.g. the
    # LunaCE tweak definitions).
    w("etc/event.d/ce-cryptofs-seed",
      "# ce-cryptofs-seed — webOS CE: content that must live on /media/cryptofs\n"
      "# (which survives flashes but is NOT in the image): the Synergy transport's\n"
      "# glibc/runtime/plugins (hardcoded ELF interpreter path + imwrap.sh's bind\n"
      "# mounts — a contract Preware-installed connectors rely on) and additions to\n"
      "# the cryptofs app store (LunaCE tweak definitions).\n"
      "#\n"
      "# Hardened after a real failure: (a) a bare [ -d /media/cryptofs ] passes on\n"
      "# the UNMOUNTED mountpoint, so gate on /proc/mounts and poll — cryptofs\n"
      "# mounts late in boot; (b) the once-per-flash /var flag is NOT proof the\n"
      "# content exists — cryptofs can be re-initialized underneath it (a dirty\n"
      "# hard reboot makes setup_cryptofs rebuild the store), so ALSO self-heal\n"
      "# every boot by copying any seed file missing from the target (cheap: just\n"
      "# stats when nothing is missing). The flag alone still forces one full\n"
      "# overwrite per flash so a re-flash refreshes changed files. Finally, kick\n"
      "# imtransport in case it exhausted its respawn limit waiting on the seed.\n"
      "#\n"
      "# Hardened again after flash 600009 lost the ENTIRE seed on first boot:\n"
      "# on a fresh flash /media/cryptofs appears in /proc/mounts ~100s before the\n"
      "# store actually accepts writes, so every mkdir/cp in that window failed and\n"
      "# the job still exited 0 and set the flag (the ipkg seeding in\n"
      "# org.webosinternals.ipkgservice's pre-start died in the same window — that\n"
      "# is the real cause of \"Preware has no feeds until the next reboot\").\n"
      "# A second boot always repaired it, which is why this only surfaced once the\n"
      "# OOBE stopped rebooting. So: (1) probe for an actual WRITE, not just the\n"
      "# mount; (2) VERIFY every seed file landed and retry if not; (3) only set the\n"
      "# flag once verified; (4) log to $LOG — a silent job cannot be diagnosed;\n"
      "# (5) also run at first-use-finished, which is always well clear of the\n"
      "# window. Cross-check: any CE job writing to cryptofs needs this gate.\n"
      "\n"
      "start on stopped finish\n"
      "start on first-use-finished\n"
      "# Third chance on purpose: the first-use-finished emit is backgrounded from\n"
      "# a LunaSysMgr that immediately calls exit(0), so it is fire-and-forget and\n"
      "# can be lost -- and this job is the one everything else depends on.\n"
      "# `started LunaSysMgr` comes from upstart's own bookkeeping and cannot be.\n"
      "start on started LunaSysMgr\n"
      "\n"
      "console none\n"
      "\n"
      "script\n"
      "    SEED=/usr/palm/ce-seed/cryptofs\n"
      "    FLAG=/var/luna/preferences/ce-cryptofs-seeded\n"
      "    LOG=/var/log/ce-cryptofs-seed.log\n"
      "    log() { echo \"$(date 2>/dev/null) $*\" >> \"$LOG\" 2>/dev/null; }\n"
      "    # Two other jobs depend on this one and have no retry of their own, so\n"
      "    # kick them on EVERY exit path -- they used to sit after the early\n"
      "    # `exit 0`s, which silently forfeited Preware's feeds and the Synergy\n"
      "    # transport whenever the seed bailed.\n"
      "    #\n"
      "    # SPLIT (600018 live finding): these two kicks have completely\n"
      "    # different dependencies, and bundling them cost Preware 86 seconds.\n"
      "    # kick_ipkg only needs cryptofs to be WRITABLE -- the feed configs are\n"
      "    # ~1KB of echo. kick_imtransport needs the 31MB synergy payload to be\n"
      "    # fully copied (its ELF interpreter lives there). Bundled at the end of\n"
      "    # the job, the feeds were held hostage by a copy they do not depend on:\n"
      "    # on 600018 OOBE finished 14:00:09, the user opened Preware 14:00:56 to\n"
      "    # an empty feed list, and the configs were not written until 14:01:35.\n"
      "    # (Why they need rewriting at all: ipkgservice's own pre-start DID seed\n"
      "    # them at 13:55:18, but the cryptofs store is re-initialized during\n"
      "    # first-use, which wiped them -- and its job was already running, so no\n"
      "    # trigger ever re-ran that pre-start. This kick is the only repair.)\n"
      "    kick_ipkg() {\n"
      "        if [ ! -f /media/cryptofs/apps/etc/ipkg/arch.conf ]; then\n"
      "            log \"seeding Preware feeds (its own postinst logic)\"\n"
      "            sh /usr/palm/ce-seed/preware-seed.sh >> \"$LOG\" 2>&1 \\\n"
      "                || log \"preware-seed.sh FAILED\"\n"
      "            if [ -f /media/cryptofs/apps/etc/ipkg/arch.conf ]; then\n"
      "                log \"feeds seeded: $(ls /media/cryptofs/apps/etc/ipkg/ | wc -l) files\"\n"
      "            else\n"
      "                log \"feeds STILL absent after seeding\"\n"
      "            fi\n"
      "        fi\n"
      "    }\n"
      "    # initctl start BLOCKS until the job settles, and `|| true` does not\n"
      "    # help a hang. Two ways it hangs here: ipkgservice has no `respawn`\n"
      "    # any more, so its exec'd process exits at once (the hub owns the bus\n"
      "    # name) and the job never reaches a state initctl returns on; and\n"
      "    # imtransport's pre-start waits up to ~180s for the cryptofs\n"
      "    # interpreter. Seen live on 600020: this job sat in do_wait on a\n"
      "    # blocked `initctl start org.webosinternals.ipkgservice` for 7+\n"
      "    # minutes having copied NOTHING, so the Synergy runtime never seeded.\n"
      "    # Fire and forget, with a bounded wait -- same shape as the wallpaper\n"
      "    # job's lsq().\n"
      "    kick_bg() {\n"
      "        /sbin/initctl \"$@\" > /dev/null 2>&1 &\n"
      "        _kp=$!\n"
      "        _i=0\n"
      "        while [ $_i -lt 10 ] && kill -0 $_kp 2>/dev/null; do\n"
      "            sleep 1\n"
      "            _i=$((_i+1))\n"
      "        done\n"
      "        kill $_kp 2>/dev/null || true\n"
      "        return 0\n"
      "    }\n"
      "    kick_imtransport() {\n"
      "        kick_bg start imtransport\n"
      "    }\n"
      "    kick_dependents() { kick_ipkg; kick_imtransport; }\n"
      "    if [ ! -d \"$SEED\" ]; then kick_dependents; exit 0; fi\n"
      "    # Do NOTHING until first use is finished, and get out of the way FAST.\n"
      "    # The cryptofs store is re-initialized during first-use, so anything\n"
      "    # seeded before that is wiped -- the work is not merely wasted, it is\n"
      "    # actively harmful: this job's 5-attempt retry loop takes minutes, and\n"
      "    # while it runs upstart considers the job RUNNING and silently DROPS\n"
      "    # the `start on first-use-finished` trigger, which is the one run that\n"
      "    # would have stuck. Seen live on 600019: job started 14:45:45, still\n"
      "    # looping when first-use-finished fired at 14:52:54 (upstart started\n"
      "    # ce-language-patches on that event and not this job), so NOTHING was\n"
      "    # ever seeded -- no feeds, no stanzas, no synergy runtime. 600018 only\n"
      "    # escaped because its early run happened to die after 48s, leaving the\n"
      "    # job idle in time to catch the trigger. Exiting immediately makes that\n"
      "    # luck into a guarantee. On later (post-OOBE) boots the flag exists, so\n"
      "    # the ordinary `stopped finish` self-heal pass still runs.\n"
      "    if [ ! -f /var/luna/preferences/ran-first-use ]; then\n"
      "        log \"first use not finished -- deferring to first-use-finished\"\n"
      "        exit 0\n"
      "    fi\n"
      "    i=0\n"
      "    while ! grep -q \" /media/cryptofs \" /proc/mounts && [ $i -lt 60 ]; do\n"
      "        sleep 5\n"
      "        i=$((i+1))\n"
      "    done\n"
      "    if ! grep -q \" /media/cryptofs \" /proc/mounts; then\n"
      "        log \"cryptofs never mounted -- nothing seeded\"\n"
      "        kick_dependents\n"
      "        exit 0\n"
      "    fi\n"
      "    # mounted != writable: poll until the store really takes a write\n"
      "    i=0\n"
      "    while [ $i -lt 60 ]; do\n"
      "        if mkdir -p /media/cryptofs/.ce-seed-probe 2>/dev/null \\\n"
      "           && touch /media/cryptofs/.ce-seed-probe/w 2>/dev/null; then\n"
      "            rm -rf /media/cryptofs/.ce-seed-probe 2>/dev/null\n"
      "            break\n"
      "        fi\n"
      "        sleep 5\n"
      "        i=$((i+1))\n"
      "    done\n"
      "    if [ $i -ge 60 ]; then\n"
      "        log \"cryptofs mounted but never writable -- nothing seeded\"\n"
      "        kick_dependents\n"
      "        exit 0\n"
      "    fi\n"
      "    log \"cryptofs writable after $((i*5))s of probing\"\n"
      "    # FIRST, before the big copy: repair the ipkg feed config. This is the\n"
      "    # difference between Preware working the moment the user reaches the\n"
      "    # launcher and Preware looking broken for a minute and a half.\n"
      "    kick_ipkg\n"
      "    attempt=0\n"
      "    while [ $attempt -lt 5 ]; do\n"
      "        attempt=$((attempt+1))\n"
      "        if [ ! -f \"$FLAG\" ]; then\n"
      "            # fresh flash (or /var wiped): full overwrite with image content\n"
      "            for d in \"$SEED\"/*; do\n"
      "                [ -d \"$d\" ] || continue\n"
      "                b=$(basename \"$d\")\n"
      "                mkdir -p \"/media/cryptofs/$b\" || log \"mkdir failed: $b\"\n"
      "                cp -rf \"$d/.\" \"/media/cryptofs/$b/\" || log \"cp failed: $b\"\n"
      "            done\n"
      "        fi\n"
      "        # restore anything still missing, then VERIFY the whole seed landed\n"
      "        cd \"$SEED\"\n"
      "        # SIZE, not existence: a cp that dies mid-write leaves a truncated\n"
      "        # file that passes [ -f ] and then SIGBUSes the transport in\n"
      "        # ld-linux when it mmaps a library shorter than its headers claim.\n"
      "        find . -type f | while IFS= read -r f; do\n"
      "            rel=${f#./}\n"
      "            if [ \"$(wc -c < \"$f\" 2>/dev/null)\" != \"$(wc -c < \"/media/cryptofs/$rel\" 2>/dev/null)\" ]; then\n"
      "                mkdir -p \"/media/cryptofs/$(dirname \"$rel\")\" 2>/dev/null\n"
      "                cp -f \"$f\" \"/media/cryptofs/$rel\" 2>/dev/null\n"
      "            fi\n"
      "        done\n"
      "        missing=$(find . -type f | while IFS= read -r f; do\n"
      "            [ \"$(wc -c < \"$f\" 2>/dev/null)\" = \"$(wc -c < \"/media/cryptofs/${f#./}\" 2>/dev/null)\" ] || echo x\n"
      "        done | wc -l)\n"
      "        if [ \"$missing\" -eq 0 ]; then\n"
      "            log \"seed verified complete on attempt $attempt\"\n"
      "            mkdir -p /var/luna/preferences && touch \"$FLAG\"\n"
      "            break\n"
      "        fi\n"
      "        log \"attempt $attempt: $missing seed file(s) still missing -- retrying\"\n"
      "        sleep 10\n"
      "    done\n"
      "    kick_dependents\n"
      "end script\n", 0o644)

    # retire lists -> image removals (expanded precisely against stock names)
    n_ret = 0
    for e in SYNERGY_RETIRE:
        pfx = "./" + e.lstrip("/")
        members = sorted(n for n in stock_names
                         if n == pfx or n.startswith(pfx + "/"))
        if not members:
            log(f"  note: retire target has no stock file members (skipped): {e}")
            continue
        removes.extend(n[1:] for n in members)
        n_ret += len(members)
    log(f"  retired {n_ret} stock members (skype / legacy-IM / google-legacy)")

    # device-setup: PmBtEngine BT-HFG gate patch (1 byte: the Skype-transport
    # branch at 119792 becomes unconditional, 0x0a -> 0xea in the B->BAL word)
    btb = bytearray(sdata("./usr/bin/PmBtEngine"))
    if bytes(btb[119792:119796]) != b"\x31\x00\x00\x0a":
        sys.exit("ERROR: PmBtEngine bytes at 119792 are not the expected "
                 "pre-patch value — unknown build, refusing to patch")
    btb[119795] = 0xEA
    w("usr/bin/PmBtEngine", bytes(btb), 0o755)

    # device-setup: mediastream webm/mkv reroute — run their own pure-sh/awk
    # patch script against pristine stock; verify its patched markers landed
    for msrel in ("usr/palm/frameworks/mediastream/submission/24mediastream.js",
                  "usr/palm/frameworks/mediastream/submission/24/concatenated.js",
                  "usr/palm/frameworks/mediastream/submission/24/javascript/StreamingPlayEngine.js"):
        msp = os.path.join(tmp, "mediastream", os.path.basename(msrel))
        os.makedirs(os.path.dirname(msp), exist_ok=True)
        with open(msp, "wb") as f:
            f.write(sdata("./" + msrel))
        subprocess.run(["sh", os.path.join(DSDIR, "videoplayer-webm/src/patch-mediastream.sh"),
                        msp], check=True, stdout=subprocess.DEVNULL)
        msdata = open(msp, "rb").read()
        if b"video/ogg" not in msdata or b"_msrc" not in msdata:
            sys.exit(f"ERROR: mediastream patch did not take on {msrel}")
        w(msrel, msdata, 0o644)

    # device-setup: Thai font fallback, gst codec plugins, db8-clean, bt-a2dp
    wcopy("usr/share/fonts/HeiT_nb.ttf",
          os.path.join(DSDIR, "fonts/NotoSansThai-Regular.ttf"), 0o644)
    wcopy("usr/lib/libopus.so.0",
          os.path.join(DSDIR, "gst-opus-codec/prebuilt/libopus.so.0"), 0o644)
    symlink("usr/lib/libopus.so", "libopus.so.0")
    for sub, so in (("gst-opus-codec", "libgstopus.so"),
                    ("gst-opus-codec", "libgstogg.so"),
                    ("gst-plugins-base-audioresample", "libgstaudioresample.so"),
                    ("gst-video-codecs", "libgstvpx.so"),
                    ("gst-video-codecs", "libgstmatroska.so"),
                    ("gst-video-codecs", "libgstspeex.so")):
        wcopy(f"usr/lib/gstreamer-0.10/{so}",
              os.path.join(DSDIR, sub, "prebuilt", so), 0o644)
    wcopy("usr/local/bin/db8-clean.sh",
          os.path.join(DSDIR, "db8-maintenance/db8-clean.sh"), 0o755)
    wcopy("usr/sbin/bt-a2dp-fix.sh",
          os.path.join(DSDIR, "bt-a2dp-fix/bt-a2dp-fix.sh"), 0o755)
    wcopy("etc/event.d/bt-a2dp-fix",
          os.path.join(DSDIR, "bt-a2dp-fix/bt-a2dp-fix.upstart"), 0o644)

    # QuickOffice + Photos app integration: the targets are installed at first
    # boot from stock staged ipks — repack those ipks with the patches applied.
    def run_patch(cwd, patchfile, args=(), target=None):
        cmd = ["patch", "-s", "-f", *args]
        if target:
            cmd.append(target)
        else:
            cmd[1:1] = ["-p1"]
        with open(patchfile, "rb") as pf:
            r = subprocess.run(cmd, cwd=cwd, stdin=pf, capture_output=True)
        if r.returncode != 0:
            sys.exit(f"ERROR: patch {os.path.basename(patchfile)} failed in {cwd}:\n"
                     + r.stdout.decode() + r.stderr.decode())

    def repack_staged_ipk(member, appid, edit_fn):
        wd = os.path.join(tmp, "repack-" + appid)
        ar = os.path.join(wd, "ar")
        os.makedirs(ar)
        orig = os.path.join(ar, "orig.ipk")
        with open(orig, "wb") as f:
            f.write(sdata(member))
        order = subprocess.run(["ar", "t", orig], capture_output=True,
                               text=True, check=True).stdout.split()
        subprocess.run(["ar", "x", "orig.ipk"], cwd=ar, check=True)
        datadir = os.path.join(wd, "data")
        os.makedirs(datadir)
        with tarfile.open(os.path.join(ar, "data.tar.gz")) as tf:
            tf.extractall(datadir, filter="data")
        approot = os.path.join(datadir, "usr/palm/applications", appid)
        if not os.path.isdir(approot):
            sys.exit(f"ERROR: {member}: no {appid} app dir in payload")
        edit_fn(approot)
        # deterministic repack — fixed member order and mtimes (patch/copy
        # stamp build-time mtimes on the edited files), no gzip timestamp,
        # ar D-mode: the same jar + patches must yield byte-identical ipks
        subprocess.run(["tar", "--sort=name", "--mtime=@1324497600",
                        "--numeric-owner", "--owner=0", "--group=0",
                        "-cf", os.path.join(ar, "data.tar"), "."],
                       cwd=datadir, check=True)
        subprocess.run(["gzip", "-n", "-9", "-f", os.path.join(ar, "data.tar")],
                       check=True)
        newipk = os.path.join(wd, "new.ipk")
        subprocess.run(["ar", "rcD", newipk, *order], cwd=ar, check=True)
        w(member[2:], open(newipk, "rb").read(), 0o644)
        log(f"  repacked staged ipk with integration patches: {member[2:]}")

    QOI = os.path.join(DSDIR, "quickoffice-integration")

    def edit_qo(approot):
        shutil.copy(os.path.join(QOI, "source/RemoteFileService.js"),
                    os.path.join(approot, "source/"))
        shutil.copy(os.path.join(QOI, "source/FileStore.js"),
                    os.path.join(approot, "source/"))
        run_patch(approot, os.path.join(QOI, "patches/FolderContentsList.js.patch"))
        run_patch(approot, os.path.join(QOI, "patches/FolderContentsPane.js.patch"))
        shutil.copy(os.path.join(QOI, "assets/toolbar-icon-refresh.png"),
                    os.path.join(approot, "images/"))

    PHI = os.path.join(DSDIR, "photos-integration")

    def edit_photos(approot):
        run_patch(approot, os.path.join(PHI, "patches/LibraryNavigationPanel.css.patch"))
        # these two patches carry junk header paths ("a/photos-src/base/...
        # (app) modes/..." / bare filenames) — target the files directly
        run_patch(os.path.join(approot, "source/modes"),
                  os.path.join(PHI, "patches/PictureMode.js.patch"),
                  target="PictureMode.js")
        run_patch(os.path.join(approot, "source"),
                  os.path.join(PHI, "patches/AlbumModeMultiselectControls.js.patch"),
                  target="AlbumModeMultiselectControls.js")
        for png in sorted(glob.glob(os.path.join(PHI, "assets/syn-*.png"))):
            shutil.copy(png, os.path.join(approot, "images/"))

    repack_staged_ipk("./usr/palm/ipkgs/com.quickoffice.webos_2.1.2113_ARM_release-arm.ipk",
                      "com.quickoffice.webos", edit_qo)
    repack_staged_ipk("./usr/palm/ipkgs/com.quickoffice.ar_10.3.484_ARM_release-arm.ipk",
                      "com.quickoffice.ar", edit_qo)
    repack_staged_ipk("./usr/palm/ipkgs/com.palm.app.photos/com.palm.app.photos_3.0.8001_all.ipk",
                      "com.palm.app.photos", edit_photos)

    # Photos SERVICE half (rootfs): dynamic PHOTO.UPLOAD source routing +
    # remote-first deletion. Utils.js's hunk 1 context has two whitespace-only
    # lines that don't byte-match stock (blank vs tab-indented) — apply with
    # -l --fuzz=3 and hard-verify both hunks' markers landed at the right spot.
    PSVC = "usr/palm/services/com.palm.service.photos/photos-src/base"
    psdir = os.path.join(tmp, "photos-svc")
    os.makedirs(os.path.join(psdir, "photos-src/base"))
    for fn in ("Utils.js", "Sync-Manager.js"):
        with open(os.path.join(psdir, "photos-src/base", fn), "wb") as f:
            f.write(sdata(f"./{PSVC}/{fn}"))
    run_patch(psdir, os.path.join(PHI, "patches/Sync-Manager.js.patch"))
    run_patch(psdir, os.path.join(PHI, "patches/Utils.js.patch"), args=("-l", "--fuzz=3"))
    ut = open(os.path.join(psdir, "photos-src/base/Utils.js")).read()
    if "Synergy-revival: ANY PHOTO.UPLOAD" not in ut or "doLocalRemoval" not in ut:
        sys.exit("ERROR: photos-service Utils.js patch markers missing after apply")
    for fn in ("Utils.js", "Sync-Manager.js"):
        wcopy(f"{PSVC}/{fn}", os.path.join(psdir, "photos-src/base", fn), 0o644)

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
    # The shipped pre-start re-derives VERSION from palm-build-info with a sed;
    # on our "webOS CE 3.1.0" string it would yield 3.1.0 and point the
    # patches/kernels feed confs at nonexistent 3.1.0 feeds every boot — pin it.
    upst = re.sub(r"^\s*VERSION=`grep PRODUCT_VERSION_STRING[^\n]*$",
                  "   VERSION=3.0.5", upst, count=1, flags=re.M)
    if "VERSION=3.0.5" not in upst:
        sys.exit("ERROR: VERSION anchor not found in ipkgservice upstart")
    # ---- Preware feed seeding: use PREWARE'S OWN postinst, not a copy ------
    #
    # This used to be ~20 hand-transcribed `echo "src/gz ..."` lines injected
    # into ipkgservice's pre-start. That was a copy of the feed list in
    # Preware's own postinst, and it had already drifted badly: our copy wrote
    # webos-patches/webos-kernels ENABLED with the version pinned to 3.0.5,
    # while upstream deliberately ships them DISABLED on 3.1+ because no 3.1
    # content is published ("an enabled feed there just fails to download every
    # time the feeds are updated"). Upstream also derives the arch with
    # `uname -m`, honours the alpha/beta feed preference files, and carries a
    # version parser written specifically for our "webOS CE 3.1.0" string.
    #
    # So: take the postinst that already ships inside the ipk (and is already
    # baked to /usr/palm/applications/.../control/postinst) and keep only the
    # half we want. Its first half installs the service into /var and DELETES
    # /usr/share/dbus-1 + /usr/share/ls2 registrations -- exactly the static
    # install this image bakes -- so that half must not run. Cutting at
    # upstream's own section comments means the feed logic stays upstream's to
    # maintain; if they restructure it, the anchors fail loudly here rather
    # than silently shipping a stale feed list.
    post = open(os.path.join(papp, "control", "postinst")).read()
    A_VER = "# Extract the OS version"
    A_SVC = "# Remove the obsolete Package Manager Service"
    A_CFG = "# Create the ipkg config and database areas"
    for a in (A_VER, A_SVC, A_CFG):
        if post.count(a) != 1:
            sys.exit(f"ERROR: Preware postinst anchor {a!r} found {post.count(a)}x "
                     "— upstream restructured it; re-check the feed-seed extraction")
    ver_block = post[post.index(A_VER):post.index(A_SVC)]
    cfg_block = post[post.index(A_CFG):]
    if "src/gz webosinternals " not in cfg_block or "modernize" not in cfg_block:
        sys.exit("ERROR: extracted Preware feed block is missing expected feeds")
    # The postinst ends with `exit 0`; anything appended after it is DEAD CODE.
    # Caught by running the generated script in a sandbox: the feeds seeded but
    # the status stanzas below never ran. Strip the trailing exit.
    cfg_block = re.sub(r"\nexit 0\s*$", "\n", cfg_block)
    if re.search(r"^exit 0", cfg_block, re.M):
        sys.exit("ERROR: Preware feed block still contains an early `exit 0` — "
                 "anything appended after it would be dead code")

    # Our own addition: ipkg status stanzas for the three packages this image
    # BAKES into the rootfs. ipkg has no record of them, and Preware's
    # isInstalled check is a pure name match against the status file, so
    # without these it offers them as fresh installs. Description doubles as
    # Preware's display title for a package that is in no feed.
    STATUS_SEED_DESC = {
        "preware": "Preware",
        "govnah": "Govnah",
        "synergy": "Synergy Revival shared runtime",
    }
    stanzas = ""
    for skey in ("preware", "govnah", "synergy"):
        sipk = IPK[skey]
        pkg = os.path.basename(sipk).split("_")[0]
        arch = os.path.basename(sipk).rsplit("_", 1)[-1][:-len(".ipk")]
        stanzas += (
            f'if ! grep -q "^Package: {pkg}$" $APPS/usr/lib/ipkg/status 2>/dev/null ; then\n'
            "   mkdir -p $APPS/usr/lib/ipkg\n"
            "   {\n"
            '      echo ""\n'
            f'      echo "Package: {pkg}"\n'
            f'      echo "Version: {ipk_version(sipk)}"\n'
            '      echo "Depends: "\n'
            '      echo "Status: install ok installed"\n'
            f'      echo "Architecture: {arch}"\n'
            f'      echo "Description: {STATUS_SEED_DESC[skey]}"\n'
            '      echo "Installed-Time: $(date +%s)"\n'
            '      echo ""\n'
            "   } >> $APPS/usr/lib/ipkg/status\n"
            "fi\n"
        )

    w("usr/palm/ce-seed/preware-seed.sh",
      "#!/bin/sh\n"
      "# GENERATED by bake.py -- the feed half of Preware's own postinst\n"
      "# (org.webosinternals.preware/control/postinst), plus CE ipkg status\n"
      "# stanzas for the packages this image bakes. Run once per flash by\n"
      "# /etc/event.d/ce-cryptofs-seed, AFTER first use (the cryptofs store is\n"
      "# re-initialized during first-use, so anything written before is lost).\n"
      "# Do not edit: change Preware's postinst, or bake.py.\n"
      "\n"
      "APPS=/media/cryptofs/apps\n"
      '[ -d "$APPS" ] || { echo "no $APPS -- cryptofs not ready"; exit 1; }\n'
      "\n"
      + ver_block + cfg_block + "\n"
      + stanzas +
      "\nexit 0\n", 0o755)
    log("  preware-seed.sh derived from Preware's own postinst "
        f"({len(cfg_block.splitlines())} feed lines + {len(STATUS_SEED_DESC)} status stanzas)")
    # guard the stock lists-cleanup: the dir may not exist before first seeding
    # (upstart runs scripts with sh -e, so the guard must not return nonzero)
    upst = upst.replace("find $APPS/usr/lib/ipkg/lists",
                        "[ ! -d $APPS/usr/lib/ipkg/lists ] || find $APPS/usr/lib/ipkg/lists")
    # No extra start triggers: this job's pre-start no longer seeds anything
    # (see preware-seed.sh above), so it has nothing to retry. The triggers
    # we used to add here fired concurrently with ce-cryptofs-seed's kick and
    # helped drive the 600018 respawn storm.
    # Drop `respawn`. This service is ALSO hub-launchable (we bake its dbus
    # .service into both hubs above), and the two launchers fight: once
    # ls-hubd has an instance holding the bus name, every upstart-started
    # instance exits immediately, `respawn` restarts it, and the job burns
    # its 10-respawn limit in ~2 seconds and is stopped for good. Seen live on
    # 600018: the user opened Preware (hub-launching the service), the seed
    # job's kick then did stop/start, and upstart logged
    # "respawn_count: 11 > respawn_limit: 10 ... respawning too fast, stopped"
    # — with each respawn re-running the whole pre-start, so the feed seeding
    # ran 11 times too. Nothing is lost by dropping it: the job exists for its
    # pre-start seeding, and the service itself is started on demand by the
    # hub. Proven on 600018, where the service answered every call in ~1s for
    # the entire time its upstart job sat stopped.
    upst = sure_replace(upst, "\nrespawn\n", "\n# respawn: deliberately NOT set — see bake.py (hub launches this on demand)\n",
                        "ipkgservice respawn removal", count=1)
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
    # N\name renames a page: AppMonitor::pageNameFromDesignator prefers the
    # map's name over the designator and displays it .toUpper() ("games" ->
    # "GAMES"); the page-restore path renames saved pages too. The FAVORITES
    # page (a launcher built-in, designator "favorites" — not in the layout
    # json) is the one renamed to Games; Downloads keeps its stock name.
    w("etc/palm/launcher3/app-keywords-to-designator-map.txt",
      "[designators]\n"
      "1\\designator=apps\n"
      "2\\designator=downloads\n"
      "3\\designator=prefs\n"
      "3\\name=settings\n"
      "4\\designator=favorites\n"
      "4\\name=games\n"
      "size=4\n"
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
        if vlang not in variants or _natkey(os.path.basename(p)) > _natkey(
                os.path.basename(variants[vlang])):
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
        "# Also triggers at first-use completion: the OOBE finishes without a reboot,\n"
        "# so the per-boot run happens before the language is even chosen.\n"
        "\n"
        "start on stopped finish\n"
        "start on first-use-finished\n"
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
        "            # only claim a change if the copy actually landed: setting\n"
        "            # changed=1 unconditionally restarts LunaSysMgr, and if the\n"
        "            # copy keeps failing the compare keeps differing -- a Luna\n"
        "            # restart loop on every single boot.\n"
        "            if cp \"$f\" \"/$rel\" && cmp -s \"$f\" \"/$rel\"; then\n"
        "                changed=1\n"
        "            else\n"
        "                echo \"$(date 2>/dev/null) FAILED to patch /$rel\" \\\n"
        "                    >> /var/log/ce-language-patches.log 2>/dev/null\n"
        "            fi\n"
        "        fi\n"
        "    done\n"
        "    if [ $changed -eq 1 ]; then\n"
        "        mount -o remount,ro / 2>/dev/null || true\n"
        "        # the UI loaded the old file this boot — one restart picks it up.\n"
        "        # NOT at first-use completion though: LunaSysMgr is already\n"
        "        # respawning out of OOBE right then, and bouncing it into that\n"
        "        # window is how the launcher comes up empty. The per-boot trigger\n"
        "        # picks it up on the next ordinary boot instead.\n"
        "        if [ \"$UPSTART_EVENT\" = \"first-use-finished\" ]; then\n"
        "            echo \"$(date 2>/dev/null) patched at first-use; deferring Luna restart\" \\\n"
        "                >> /var/log/ce-language-patches.log 2>/dev/null\n"
        "        else\n"
        "            stop LunaSysMgr 2>/dev/null || true\n"
        "            start LunaSysMgr 2>/dev/null || true\n"
        "        fi\n"
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
    # user-designated default (2026-08-17); falls back to the older
    # default-wallpaper.* convention, then the alphabetically-first image
    DEFAULT_WP_NAME = "22.png"
    default_wp = (DEFAULT_WP_NAME if DEFAULT_WP_NAME in wps else
                  next((f for f in wps if f.lower().startswith("default-wallpaper")),
                       wps[0] if wps else None))
    BAKED_APP_IDS = ("com.palm.app.maps com.palm.app.enyo-findapps "
                     "org.webosinternals.preware org.webosinternals.govnah "
                     "com.webosarchive.usbsettings org.webosarchive.btgamepad "
                     "com.palm.app.contacts com.palm.app.messaging "
                     "com.palm.app.cloud-auth")
    wp_block = ""
    if default_wp:
        log(f"tier: first-boot tweaks (default wallpaper {default_wp} + cryptofs de-shadow)")
        wp_block = (
            "    CUSTO=/usr/lib/luna/customization/customization.json\n"
            "    if [ -f \"$CUSTO\" ] && grep -q 'wallpapers/01.jpg' \"$CUSTO\"; then\n"
            "        # ce-remove-preloads fires on this same event and also flips /\n"
            "        # rw->ro; take the shared lock so neither remounts under the other.\n"
            "        L=/tmp/.ce-rootfs-rw.lock\n"
            "        n=0\n"
            "        while ! mkdir $L 2>/dev/null && [ $n -lt 60 ]; do sleep 1; n=$((n+1)); done\n"
            "        mount -o remount,rw / 2>/dev/null || true\n"
            f"        sed -i 's|/01\\.jpg|/{default_wp}|g; s|\"01\\.jpg\"|\"{default_wp}\"|g' \"$CUSTO\"\n"
            "        mount -o remount,ro / 2>/dev/null || true\n"
            "        rmdir $L 2>/dev/null || true\n"
            f"        grep -q '{default_wp}' \"$CUSTO\" \\\n"
            "            || echo \"$(date 2>/dev/null) FAILED to patch customization.json\" \\\n"
            "                 >> /var/log/ce-firstboot-tweaks.log 2>/dev/null\n"
            "    fi\n")
    else:
        log("tier: first-boot tweaks (cryptofs de-shadow; no wallpapers found)")
    tweaks_job = (
        "# ce-firstboot-tweaks — webOS CE: (a) point the default-wallpaper entries in\n"
        "# hp.tar's customization.json at a CE wallpaper before the customization\n"
        "# service runs them; (b) once per flash, drop stale /media/cryptofs copies of\n"
        "# apps this image bakes into the rootfs (cryptofs survives Doctor flashes and\n"
        "# a stale copy shadows the baked app).\n"
        "#\n"
        "# (a) must stay EARLY and has no cryptofs dependency — the customization\n"
        "# service reads that file on this same boot. (b) writes to cryptofs, which\n"
        "# is mounted ~100s before it accepts writes on a fresh flash: this job fires\n"
        "# on `stopped configurator`, which happens inside that window (seen live on\n"
        "# 600011: flag written at 18:29, cryptofs not writable until ~18:30). Every\n"
        "# rm would then fail silently and the flag would be set anyway, leaving a\n"
        "# previous install's Preware/Govnah/core-app copies shadowing the baked ones\n"
        "# forever — and with a no-reboot OOBE there is no second boot to repair it.\n"
        "# So (b) waits for a real write, verifies each removal, and only flags when\n"
        "# the store is clean. See ce-cryptofs-seed for the same pattern.\n"
        "\n"
        "start on stopped configurator\n"
        "start on first-use-finished\n"
        "\n"
        "console none\n"
        "\n"
        "script\n"
        + wp_block +
        "    FLAG=/var/luna/preferences/ce-cryptofs-deshadowed\n"
        "    LOG=/var/log/ce-firstboot-tweaks.log\n"
        "    log() { echo \"$(date 2>/dev/null) $*\" >> \"$LOG\" 2>/dev/null; }\n"
        "    APPS=/media/cryptofs/apps\n"
        "    # Once per flash, and it MUST stay that way: after this runs, the user\n"
        "    # is free to install or update these apps from a feed, and those land in\n"
        "    # exactly the cryptofs paths swept below — a per-boot sweep would delete\n"
        "    # the user's own Preware/Govnah updates on every reboot. What changed is\n"
        "    # WHEN the flag is set: only after the sweep is verified, so a run that\n"
        "    # finds cryptofs unwritable does not burn the one chance and leave a\n"
        "    # previous install shadowing the baked apps forever.\n"
        "    if [ -f \"$FLAG\" ]; then exit 0; fi\n"
        "    i=0\n"
        "    while [ $i -lt 60 ]; do\n"
        "        grep -q \" /media/cryptofs \" /proc/mounts && \\\n"
        "           mkdir -p /media/cryptofs/.ce-deshadow-probe 2>/dev/null && \\\n"
        "           touch /media/cryptofs/.ce-deshadow-probe/w 2>/dev/null && break\n"
        "        sleep 5\n"
        "        i=$((i+1))\n"
        "    done\n"
        "    rm -rf /media/cryptofs/.ce-deshadow-probe 2>/dev/null\n"
        "    if [ $i -ge 60 ]; then\n"
        "        log \"cryptofs not writable -- deshadow deferred to the next trigger\"\n"
        "        exit 0\n"
        "    fi\n"
        "    left=0\n"
        "    found=0\n"
        f"    for app in {BAKED_APP_IDS}; do\n"
        "        [ -d \"$APPS/usr/palm/applications/$app\" ] || continue\n"
        "        found=$((found+1))\n"
        "        rm -rf \"$APPS/usr/palm/applications/$app\"\n"
        "        rm -f \"$APPS/usr/lib/ipkg/info/$app\".*\n"
        "        [ -f \"$APPS/usr/lib/ipkg/status\" ] && sed -i \"/^Package: $app\\$/,/^\\$/d\" \"$APPS/usr/lib/ipkg/status\" || true\n"
        "        if [ -d \"$APPS/usr/palm/applications/$app\" ]; then\n"
        "            log \"FAILED to deshadow $app -- it still shadows the baked app\"\n"
        "            left=$((left+1))\n"
        "        else\n"
        "            log \"deshadowed stale $app\"\n"
        "        fi\n"
        "    done\n"
        "    if [ $left -eq 0 ]; then\n"
        "        log \"deshadow verified clean ($found stale copy(ies) removed)\"\n"
        "        mkdir -p /var/luna/preferences && touch \"$FLAG\"\n"
        "    else\n"
        "        log \"$left stale copy(ies) remain -- NOT flagging, will retry\"\n"
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
            "# Triggers BOTH per boot and at first-use completion: the OOBE finishes\n"
            "# without a reboot (markFirstUseDone + LunaSysMgr respawn), so a job that\n"
            "# only ran on 'stopped finish' fired before first use and then never again\n"
            "# (seen live: factory wallpaper survived a whole no-reboot flash).\n"
            "#\n"
            "# The flag is set ONLY after re-reading the preference and seeing the CE\n"
            "# wallpaper actually stick. It used to be set unconditionally, outside the\n"
            "# `if`, with both luna-send replies discarded — so an import that failed\n"
            "# (or simply had not finished: lsq hard-kills the call after 4s, and the\n"
            "# customization pass that copies the wallpaper into /media/internal runs\n"
            "# CONCURRENTLY with this job's first-use-finished run) left the pref\n"
            "# pointing at a file that was never imported, permanently, with no second\n"
            "# boot to repair it. Also wait for the source file to exist before trying.\n"
            "# Third trigger: `started LunaSysMgr` — the first-use-finished emit is\n"
            "# fire-and-forget from a process calling exit(0), so it can be lost.\n"
            "\n"
            "start on stopped finish\n"
            "start on first-use-finished\n"
            "start on started LunaSysMgr\n"
            "\n"
            "console none\n"
            "\n"
            "script\n"
            "    [ -f /var/luna/preferences/ran-first-use ] || exit 0\n"
            "    FLAG=/var/luna/preferences/ce-default-wallpaper\n"
            "    LOG=/var/log/ce-default-wallpaper.log\n"
            "    log() { echo \"$(date 2>/dev/null) $*\" >> \"$LOG\" 2>/dev/null; }\n"
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
            "    if ! echo \"$R\" | grep -q wallpaperName; then\n"
            "        log \"systemservice never answered -- retrying on the next trigger\"\n"
            "        exit 0\n"
            "    fi\n"
            "    if ! echo \"$R\" | grep -q '\"01.jpg\"'; then\n"
            "        # not the factory default: either we already ran, or the user chose\n"
            "        # their own. Either way leave it alone and stop asking.\n"
            "        log \"wallpaper is not the factory 01.jpg -- leaving it alone\"\n"
            "        mkdir -p /var/luna/preferences && touch \"$FLAG\"\n"
            "        exit 0\n"
            "    fi\n"
            f"    SRC=/media/internal/wallpapers/{default_wp}\n"
            "    i=0\n"
            "    while [ ! -f \"$SRC\" ] && [ $i -lt 30 ]; do sleep 4; i=$((i+1)); done\n"
            "    if [ ! -f \"$SRC\" ]; then\n"
            "        log \"$SRC not present yet -- retrying on the next trigger\"\n"
            "        exit 0\n"
            "    fi\n"
            f"    lsq palm://com.palm.systemservice/wallpaper/importWallpaper '{{\"target\":\"/media/internal/wallpapers/{default_wp}\",\"scale\":1.0}}' >/dev/null\n"
            f"    lsq palm://com.palm.systemservice/setPreferences '{wp_pref}' >/dev/null\n"
            "    # verify it actually took before claiming the job is done\n"
            "    V=$(lsq palm://com.palm.systemservice/getPreferences '{\"keys\":[\"wallpaper\"]}')\n"
            "    rm -f /tmp/ce-wp.out\n"
            f"    if echo \"$V\" | grep -q '\"{default_wp}\"'; then\n"
            f"        log \"default wallpaper set to {default_wp}\"\n"
            "        mkdir -p /var/luna/preferences && touch \"$FLAG\"\n"
            "    else\n"
            f"        log \"wallpaper did NOT stick (pref: $V) -- NOT flagging, will retry\"\n"
            "    fi\n"
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
    # strictly before LunaSysMgr/LunaReady/customization), and self-heals any
    # cryptofs copy already placed by an earlier flash/boot, with the same
    # wait-for-write/verify/flag/first-use-finished-retry pattern as
    # ce-cryptofs-seed and ce-firstboot-tweaks (see the job's own comment).
    # Editing hp.tar is avoided (Doctor approval hashes).
    log("tier: remove HP preloads (kindle / enyo-facebook / youtube)")
    preload_job = (
        "# ce-remove-preloads — webOS CE: HP preloads we don't ship.\n"
        "# Staged by sweatshop-hp-topaz into /usr/lib/luna/customization/apps and\n"
        "# installed to /media/cryptofs/apps on first boot by com.palm.service.customization.\n"
        "# Delete the staged ipks before that install runs; also clear any cryptofs copy\n"
        "# already placed by an earlier flash/boot (cryptofs survives Doctor flashes).\n"
        "#\n"
        "# Two different timing needs, same shape ce-cryptofs-seed/ce-firstboot-tweaks\n"
        "# already had to learn the hard way. The staged-ipk removal must WIN A RACE\n"
        "# against the customization service, so it runs immediately, every trigger,\n"
        "# unconditionally (rm -f is idempotent -- re-running it once already clean\n"
        "# costs nothing). The cryptofs cleanup hits the SAME mounted-but-not-yet-\n"
        "# writable window documented on those jobs (cryptofs appears in /proc/mounts\n"
        "# ~100s before it accepts writes on a fresh flash), so unlike the staged-ipk\n"
        "# half it gets its own wait-for-write / verify / once-per-flash flag, plus a\n"
        "# second chance at first-use-finished in case the first attempt lost that race\n"
        "# (this job used to fire only on `stopped configurator`, inside that window,\n"
        "# with no retry and no verification -- flagged but never fixed after 600011).\n"
        "\n"
        "start on stopped configurator\n"
        "start on first-use-finished\n"
        "\n"
        "console none\n"
        "\n"
        "script\n"
        "    LOG=/var/log/ce-remove-preloads.log\n"
        "    log() { echo \"$(date 2>/dev/null) $*\" >> \"$LOG\" 2>/dev/null; }\n"
        "    PRELOADS=\"com.palm.app.kindle com.palm.app.enyo-facebook com.palm.app.youtube\"\n"
        "\n"
        "    # (a) staged ipks: must beat com.palm.service.customization, so no waiting.\n"
        "    # ce-firstboot-tweaks fires on this SAME event and also remounts / rw, then\n"
        "    # back to ro. Interleaved, one job flips the filesystem read-only while the\n"
        "    # other is still deleting -- and a surviving preload ipk gets installed.\n"
        "    # mkdir is atomic, so use it as a spinlock.\n"
        "    L=/tmp/.ce-rootfs-rw.lock\n"
        "    n=0\n"
        "    while ! mkdir $L 2>/dev/null && [ $n -lt 60 ]; do sleep 1; n=$((n+1)); done\n"
        "    mount -o remount,rw / 2>/dev/null || true\n"
        "    for app in $PRELOADS; do\n"
        "        rm -f /usr/lib/luna/customization/apps/${app}_*.ipk\n"
        "        ls /usr/lib/luna/customization/apps/${app}_*.ipk >/dev/null 2>&1 && \\\n"
        "            log \"FAILED to remove staged $app\"\n"
        "    done\n"
        "    mount -o remount,ro / 2>/dev/null || true\n"
        "    rmdir $L 2>/dev/null || true\n"
        "\n"
        "    # (b) cryptofs copy from a prior flash/boot: once per flash, verified.\n"
        "    FLAG=/var/luna/preferences/ce-preloads-deshadowed\n"
        "    if [ -f \"$FLAG\" ]; then exit 0; fi\n"
        "    i=0\n"
        "    while [ $i -lt 60 ]; do\n"
        "        grep -q \" /media/cryptofs \" /proc/mounts && \\\n"
        "           mkdir -p /media/cryptofs/.ce-preload-probe 2>/dev/null && \\\n"
        "           touch /media/cryptofs/.ce-preload-probe/w 2>/dev/null && break\n"
        "        sleep 5\n"
        "        i=$((i+1))\n"
        "    done\n"
        "    rm -rf /media/cryptofs/.ce-preload-probe 2>/dev/null\n"
        "    if [ $i -ge 60 ]; then\n"
        "        log \"cryptofs not writable -- preload deshadow deferred to the next trigger\"\n"
        "        exit 0\n"
        "    fi\n"
        "    left=0\n"
        "    found=0\n"
        "    for app in $PRELOADS; do\n"
        "        [ -d \"/media/cryptofs/apps/usr/palm/applications/$app\" ] || continue\n"
        "        found=$((found+1))\n"
        "        rm -rf \"/media/cryptofs/apps/usr/palm/applications/$app\"\n"
        "        if [ -d \"/media/cryptofs/apps/usr/palm/applications/$app\" ]; then\n"
        "            log \"FAILED to deshadow cryptofs copy of $app\"\n"
        "            left=$((left+1))\n"
        "        else\n"
        "            log \"deshadowed stale cryptofs copy of $app\"\n"
        "        fi\n"
        "    done\n"
        "    if [ $left -eq 0 ]; then\n"
        "        log \"preload deshadow verified clean ($found stale copy(ies) removed)\"\n"
        "        mkdir -p /var/luna/preferences && touch \"$FLAG\"\n"
        "    else\n"
        "        log \"$left stale preload copy(ies) remain -- NOT flagging, will retry\"\n"
        "    fi\n"
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
    # BUILDTIME = when this image was baked (stock still said 20111221110520).
    # BUILDMARK = monotonically increasing per-build counter, persisted in
    # build/full-ce/BUILDMARK (tracked in git). CE marks start at 600000 for a
    # clear separation from the legacy HP marks (stock: 528667).
    mark_file = os.path.join(HERE, "BUILDMARK")
    prev = int(open(mark_file).read().strip()) if os.path.exists(mark_file) else 599999
    mark = prev + 1
    with open(mark_file, "w") as f:
        f.write(f"{mark}\n")
    buildtime = time.strftime("%Y%m%d%H%M%S")
    bi2 = re.sub(r'^BUILDTIME=.*$', f'BUILDTIME={buildtime}', bi2, count=1, flags=re.M)
    bi2 = re.sub(r'^BUILDMARK=.*$', f'BUILDMARK={mark}', bi2, count=1, flags=re.M)
    if f"BUILDMARK={mark}" not in bi2 or f"BUILDTIME={buildtime}" not in bi2:
        sys.exit("ERROR: BUILDTIME/BUILDMARK not found in /etc/palm-build-info")
    log(f"  BUILDTIME={buildtime} BUILDMARK={mark}")
    w("etc/palm-build-info", bi2, 0o644)

    # 19b) Version-prefix binary patch. Four native binaries derive the bare
    # version number from com.palm.properties.version by finding a hardcoded
    # prefix and stripping its length: "Palm webOS " (11) or "HP webOS " (9).
    # LunaSysMgr's DeviceInfo feeds the result to every Mojo/Enyo app as
    # PalmSystem.deviceInfo platformVersion{,Major,Minor,Dot}; libWebKitLuna
    # builds the browser UA from it; media-pipeline/mediaserver build the media
    # UA. "webOS CE 3.1.0" matches neither prefix (apps would see the raw
    # string / major 0), so swap the 9-byte literal for the same-length
    # "webOS CE " — substr(9) then yields "3.1.0", exactly like stock "3.0.5".
    log('tier: version-prefix patch ("HP webOS " -> "webOS CE ") in 4 binaries')

    def patch_version_prefix(relpath, data, mode):
        n = data.count(b"HP webOS ")
        if n != 1:
            sys.exit(f"ERROR: expected exactly one 'HP webOS ' in {relpath}, found {n}")
        w(relpath, data.replace(b"HP webOS ", b"webOS CE "), mode)

    # already-baked overlay binaries: LunaCE (tier 7) + the media-pipeline
    # wrapper's exec target (tier 4b)
    for rel in ("usr/bin/LunaSysMgr", "usr/bin/media-pipeline.real"):
        patch_version_prefix(rel, open(os.path.join(OUT_ROOT, rel), "rb").read(), 0o755)
    # stock binaries not otherwise touched
    patch_version_prefix("usr/bin/mediaserver", sdata("./usr/bin/mediaserver"), 0o755)
    # libWebKitLuna also gets the synergy webkit-webm-mime byte patch (its MIME
    # table's sole "video/x-ms-wmv" entry becomes "video/webm", NUL-padded to
    # the same length) — done here so the file is written exactly once.
    wk = sdata("./usr/lib/libWebKitLuna.so")
    if wk.count(b"video/x-ms-wmv") != 1:
        sys.exit("ERROR: expected exactly one 'video/x-ms-wmv' in libWebKitLuna.so")
    wk = wk.replace(b"video/x-ms-wmv", b"video/webm\x00\x00\x00\x00", 1)
    patch_version_prefix("usr/lib/libWebKitLuna.so", wk, 0o555)

    # 19c) CE platform tweaks (the 2026-08-17 hitlist)
    log("tier: CE platform tweaks")

    # (a) Connectivity check: PmNetConfigManager's NwHealthCheckSession probes
    # a compiled-in rotating URL list (google/developer.palm/yahoo/hp/bing/
    # hpwebos/compaq) and inspects the fetched page (HTML <title>, WISPr tags)
    # to set wifi.onInternet — "captivePortal" is what makes the UI demand a
    # hotspot login. The HP-era entries are dead or parked, producing spurious
    # captive verdicts. Byte-patch them to live community hosts; each
    # replacement must fit the original string slot (string + its trailing
    # NULs), shorter is fine (NUL-terminated).
    def patch_cstring(data, old, new, what):
        ob = old.encode()
        if data.count(ob) != 1:
            sys.exit(f"ERROR: {what}: expected exactly one {old!r}")
        idx = data.index(ob)
        slot = len(ob)
        while data[idx + slot] == 0:
            slot += 1
        if len(new) + 1 > slot:
            sys.exit(f"ERROR: {what}: {new!r} ({len(new)}) does not fit slot ({slot - 1})")
        return data[:idx] + new.encode() + b"\x00" * (slot - len(new)) + data[idx + slot:]

    ncm = sdata("./usr/bin/PmNetConfigManager")
    for old, new in (("http://developer.palm.com", "http://www.webosarchive.org"),
                     ("http://www.hpwebos.com",    "http://webosarchive.org"),
                     ("http://www.compaq.com",     "http://ipkg.preware.net")):
        ncm = patch_cstring(ncm, old, new, "connectivity URL")
        log(f"  connectivity probe {old} -> {new}")
    w("usr/bin/PmNetConfigManager", ncm, 0o755)
    # the captive-portal LOGIN UI's initial page (enyo captiveportal lib) —
    # it loads this URL in its webview to surface the portal's redirect
    cpc = sdata("./usr/palm/frameworks/enyo/0.10/framework/lib/captiveportal/"
                "CaptivePortalControl.js").decode()
    cpc = sure_replace(cpc, 'urlToGoTo : "http://www.hpwebos.com/",',
                       'urlToGoTo : "http://www.webosarchive.org/",',
                       "captiveportal urlToGoTo", count=1)
    w("usr/palm/frameworks/enyo/0.10/framework/lib/captiveportal/CaptivePortalControl.js",
      cpc, 0o644)

    # (b) Preware pre-registered as the .ipk handler. LunaSysMgr's MimeSystem
    # seeds its handler table from /usr/palm/command-resource-handlers.json
    # (runtime changes go to /var/usr/palm/...-active.json, wiped by a flash);
    # stock has NO ipk entry at all, which is why Preware has to ask on first
    # launch. Add one matching Preware's own registration (app-assistant.js:
    # extension ipk, mime application/vnd.webos.ipk; not streamable —
    # download first, then hand the file to the handler).
    crh = json.loads(sdata("./usr/palm/command-resource-handlers.json"))
    if any(e.get("extn") == "ipk" for e in crh["resources"]):
        sys.exit("ERROR: base command-resource-handlers.json already has an ipk entry")
    crh["resources"].append({"extn": "ipk", "mime": "application/vnd.webos.ipk",
                             "appId": "org.webosinternals.preware", "streamable": False})
    w("usr/palm/command-resource-handlers.json", json.dumps(crh, indent=1) + "\n", 0o644)
    log("  Preware registered as the .ipk resource handler")

    # (c) LunaCE tweak definitions: Tweaks-framework preference files that
    # surface LunaCE's extra features (mini cards, gestures, wave launcher,
    # ...) in the Tweaks app. They belong in the tweaks.prefs service's
    # preferences dir on CRYPTOFS — ship via the ce-cryptofs-seed apps/ tree.
    # Inert until the user installs Tweaks via Preware; defaults are all off.
    TWEAKS = os.path.join(ATI, "LunaCE-Tweaks")
    if not os.path.isdir(TWEAKS):
        sys.exit(f"ERROR: missing {TWEAKS}")
    tn = 0
    for fn in sorted(os.listdir(TWEAKS)):
        if fn.endswith(".json"):
            wcopy(f"{SEED}/apps/usr/palm/services/org.webosinternals.tweaks.prefs/"
                  f"preferences/{fn}", os.path.join(TWEAKS, fn), 0o644)
            tn += 1
    log(f"  {tn} LunaCE tweak definitions staged for the cryptofs seed")

    # (d) Developer mode stays ON: LunaSysService reads [Debug]
    # turnOnNovacomAtStart from /etc/palm/sysservice.conf (EMPTY in stock) and
    # forces novacom on at every boot via setnovacommode — so whatever removed
    # /var/gadget/novacom_enabled post-flash gets undone at the next boot.
    # (The file itself is also still baked by the community-firstuse overlay.)
    # Caveat: a manual dev-mode-off therefore only lasts until reboot.
    w("etc/palm/sysservice.conf", "[Debug]\nturnOnNovacomAtStart=true\n", 0o644)
    log("  sysservice.conf: turnOnNovacomAtStart=true")

    # (e) Default keyboard size -> small. LunaCE's VirtualKeyboardPreferences
    # reads systemservice pref x_palm_virtualkeyboard_settings (a STRING of
    # JSON, exactly what its saveSettings writes); "keyboard size" -1 = small
    # (0 default, 1 large, -2 XS). Seeding only the size key is deliberate:
    # layout/language stay unset so the locale-driven first-use flow still
    # picks them, and the first saveSettings persists them WITH this size.
    # ... and the status-bar carrier string: LunaCE falls back to a hardcoded
    # "HP webOS" unless sysUiUseCustomCarrierString/sysUiCarrierString (the
    # same systemservice prefs the Tweaks toggles write) say otherwise — HP
    # is long gone, default to "webOS CE" out of the box.
    dp = sdata("./etc/palm/defaultPreferences.txt").decode()
    dp = sure_replace(dp, '"preferences": {',
                      '"preferences": {\n'
                      '\t\t"x_palm_virtualkeyboard_settings": '
                      '"{\\"keyboard size\\": -1}",\n'
                      '\t\t"sysUiUseCustomCarrierString": true,\n'
                      '\t\t"sysUiCarrierString": "webOS CE",',
                      "defaultPreferences preferences anchor", count=1)
    w("etc/palm/defaultPreferences.txt", dp, 0o644)
    log("  default keyboard size -> small (-1); carrier string -> webOS CE")

    # (f) com.palm.accountservices launches WITHOUT the node fork server.
    #
    # The account service (dir com.palm.service.palmprofile, bus name
    # com.palm.accountservices — the backend for the whole webOS Account /
    # OOBE flow, see build/community-firstuse) is hub-launched on demand via
    # /usr/bin/run-js-service. That script picks the node FORK SERVER whenever
    # /var/palm/node/fork exists (always, on this ROM) for any service the
    # jailer leaves alone — which is every com.palm.* ROM service.
    #
    # Diagnosed live 2026-08-18 on 600014: that fork can WEDGE. node_spawner
    # sits alive poll-waiting, the fork server never logs "Changing to
    # directory", and ls-hubd — believing a launch is still in flight — queues
    # EVERY call to the service forever, answering nothing. The account app
    # then black-screens / hangs / replays setup (its probe times out), and a
    # card launched during the wedge stays broken until it is closed. Symptom
    # to grep for: keymanager logging "com.palm.accountservices is not
    # running" every 5 minutes for a whole boot. Recovery without a reflash is
    # `kill <the stuck node_spawner>`.
    #
    # Fix: ship a copy of the launcher with fork mode hard-off and point ONLY
    # this service's dbus launcher at it. fork=off is a well-trodden path (it
    # is what every jailed third-party service already uses, and what the
    # community 3.0.5 ipk effectively ran under); startup costs one fresh node
    # process instead of a fork, and the service idle-quits either way.
    # Deliberately NOT applied to run-js-service itself: every other JS
    # service keeps the stock launcher, so the blast radius is one service.
    # Verified live on 600014 before shipping: launched by hand through this
    # script the service came up as a plain process with ZERO fork-server log
    # lines and answered getAccountToken in ~1s.
    log("tier: accountservices nofork launcher")
    rjs = sdata("./usr/bin/run-js-service")
    rjs_nofork = rjs.replace(
        b"# Set fork default based on result of upstart check\n"
        b"if [ -f /var/palm/node/fork ]; then\n"
        b"\tfork=on\n"
        b"fi\n",
        b"# webOS CE: the fork server is deliberately DISABLED in this copy.\n"
        b"# Only com.palm.accountservices launches through it (see bake.py).\n"
        b"fork=off\n")
    if rjs_nofork == rjs:
        sys.exit("ERROR: run-js-service fork-default block not found — "
                 "the launcher changed; re-check the nofork patch")
    if b"/var/palm/node/fork" in rjs_nofork:
        sys.exit("ERROR: run-js-service-nofork still references the fork flag file")
    w("usr/bin/run-js-service-nofork", rjs_nofork, 0o755)
    acsvc = sdata("./usr/share/dbus-1/system-services/"
                  "com.palm.accountservices.service").decode()
    acsvc = sure_replace(acsvc, "Exec=/usr/bin/run-js-service ",
                         "Exec=/usr/bin/run-js-service-nofork ",
                         "accountservices dbus launcher", count=1)
    w("usr/share/dbus-1/system-services/com.palm.accountservices.service",
      acsvc, 0o644)
    log("  com.palm.accountservices -> /usr/bin/run-js-service-nofork")

    # 19d) reboot tripwire (diagnostic, log-only). Post-flash devices reboot
    # "spontaneously" (once at the end of the OOBE boot — right after the A6
    # battery-firmware flashing sequence — and once ~9 min into the next
    # boot); the initiator writes NOTHING to any log before calling
    # /sbin/reboot (powerd's machineReboot path is provably not involved — its
    # "Powerd rebooting system because of" line is absent). Wrap reboot and
    # telinit with logging shims that record the caller's pid + parent cmdline
    # to /var/log/reboot-tripwire.log and syslog, then exec the real binary
    # (preserved as *.real). Behavior is unchanged; this exists purely to name
    # the rebooter on the next occurrence.
    # 19e) skip-setup profile name. Skipping account setup does NOT create the
    # profile in the OOBE app — it only closes. On the next boot
    # /etc/event.d/firstuse-createDefaultAccount calls the stock palmprofile
    # service, whose CreateProfileCommandAssistant hardcodes the placeholder
    # "Dr. Skipped Firstuse"; on a palmprofile row `username` IS the display
    # name, so that is what the user sees in Settings. Rewrite the literal in
    # BOTH files that carry it: the creator, and the community util's sentinel
    # comparison (which must keep matching or a later real sign-in stops being
    # able to rename the placeholder row).
    log('tier: skip-setup profile name ("Dr. Skipped Firstuse" -> "webOS User")')
    OLD_PN, NEW_PN = b"Dr. Skipped Firstuse", b"webOS User"
    cpa_rel = ("usr/palm/services/com.palm.service.palmprofile/handlers/"
               "CreateProfileCommandAssistant.js")
    cpa = read_rootfs(ROOTFS_TGZ, exact=["./" + cpa_rel])["./" + cpa_rel]
    if OLD_PN not in cpa["data"]:
        raise SystemExit(f"[bake] FATAL: {OLD_PN.decode()!r} not in stock {cpa_rel} "
                         "— the skip-setup profile name moved; re-check the handler")
    w(cpa_rel, cpa["data"].replace(OLD_PN, NEW_PN), cpa.get("mode", 0o644))
    # the util is already in the overlay (community-firstuse layer) — patch in place
    ppu_rel = ("usr/palm/services/com.palm.service.palmprofile/utils/"
               "palm_profile_util.js")
    ppu_path = os.path.join(OUT_ROOT, ppu_rel)
    if not os.path.exists(ppu_path):
        raise SystemExit(f"[bake] FATAL: {ppu_rel} missing from the overlay — "
                         "the community-firstuse layer should have baked it")
    with open(ppu_path, "rb") as f:
        ppu = f.read()
    if OLD_PN not in ppu:
        raise SystemExit(f"[bake] FATAL: {OLD_PN.decode()!r} not in {ppu_rel} — "
                         "the rename sentinel moved; re-check palm_profile_util.js")
    n_pn = ppu.count(OLD_PN)
    w(ppu_rel, ppu.replace(OLD_PN, NEW_PN), os.stat(ppu_path).st_mode & 0o777)
    log(f"  profile placeholder renamed in 2 files ({n_pn} sentinel occurrence(s))")

    log("tier: reboot tripwire (log-only shims for /sbin/reboot + /sbin/telinit)")
    trip_stock = read_rootfs(ROOTFS_TGZ, exact=["./sbin/reboot", "./sbin/telinit"])
    for tool in ("reboot", "telinit"):
        w(f"sbin/{tool}.real", trip_stock[f"./sbin/{tool}"]["data"], 0o755)
        w(f"sbin/{tool}",
          "#!/bin/sh\n"
          "# webOS CE tripwire: record who requests reboots (see bake.py 19d),\n"
          "# then do exactly what the real binary would have done.\n"
          "PC=$(cat /proc/$PPID/cmdline 2>/dev/null | tr '\\0' ' ')\n"
          f"echo \"$(date) {tool} pid=$$ ppid=$PPID parent=[$PC] args=[$*]\" >> /var/log/reboot-tripwire.log 2>/dev/null\n"
          f"logger -t reboot-tripwire \"{tool} ppid=$PPID parent=[$PC] args=[$*]\" 2>/dev/null\n"
          "sync\n"
          f"exec /sbin/{tool}.real \"$@\"\n", 0o755)

    # 20) merge changes.json (carry over community-firstuse removals, add ours)
    cf_cfg = {}
    cf_json = os.path.join(CF_OVERLAY, "changes.json")
    if os.path.exists(cf_json):
        cf_cfg = json.load(open(cf_json))
    all_removes = sorted(set(cf_cfg.get("remove", [])) | set(removes))
    changes = {
        "description": ("Full CE overlay, everything BAKED at final rootfs paths: "
                        "community first-use swap (AddToImage/OOBE webosaccount) "
                        "+ modern TLS (browser/luna/downloadmgr/mail ssl11 stacks "
                        "+ mojomail patches) + LunaCE + App Catalog + Maps 4.0.1 "
                        "+ the community core-apps suite (accounts/contacts/"
                        "messaging/phone/chatthreader/service.accounts/contacts."
                        "linker/contacts.plugin.messaging/enyo-accounts/enyo-"
                        "contactsui/messaging.library/luna-systemui) + Synergy "
                        "Revival generic (imlibpurple runtime baked, cryptofs "
                        "pieces seeded at first boot, device-setup fixes, "
                        "skype/legacy-IM/google-legacy stacks retired) + "
                        "help-redirect + full root-cert trust-store replay + "
                        "UberKernel + Preware/Govnah/USB-settings/BT-gamepad "
                        "pre-installed (Preware+Govnah ipkg status seeded) "
                        "+ Media-Internal via copy_binaries + 'webOS CE 3.1.0' "
                        "version string (with 'HP webOS '->'webOS CE ' parser "
                        "patch in LunaSysMgr/libWebKitLuna/media binaries), "
                        "minus HP preloads. Generated by "
                        "full-ce/bake.py from AddToImage/ - do not edit by hand."),
        "ce_package": CE_PACKAGE,
        "remove": all_removes,
    }
    with open(os.path.join(OUT, "changes.json"), "w") as f:
        json.dump(changes, f, indent=2)
        f.write("\n")

    shutil.rmtree(tmp)
    verify_generated_sources()

    # Build manifest: BUILDMARK -> the exact inputs this overlay was baked
    # from. git describe covers the tracked tree (--dirty flags uncommitted
    # edits); the OEM jar and the LunaCE binary live OUTSIDE the repo, and
    # hashing every consumed ipk makes two builds comparable without a git
    # checkout. Written only after verify_generated_sources() — a manifest
    # must never describe a build that failed. build-ce-doctor.sh appends the
    # output JAR's hash after the repack. Tracked in git (manifests/).
    def sha256_file(path):
        h = hashlib.sha256()
        with open(path, "rb") as f:
            for blk in iter(lambda: f.read(1 << 20), b""):
                h.update(blk)
        return h.hexdigest()

    gitrev = subprocess.run(["git", "describe", "--always", "--dirty", "--tags"],
                            cwd=PROJ, capture_output=True, text=True)
    lunace_bin = os.path.join(LUNACE, "bin", "LunaSysMgr-LunaCE-topaz")
    manifest = {
        "buildmark": mark,
        "buildtime": buildtime,
        "git": gitrev.stdout.strip() if gitrev.returncode == 0 else "unknown",
        "oem_jar": {"path": os.path.relpath(jar, PROJ),
                    "sha256": sha256_file(jar)},
        "lunace_binary": {"path": lunace_bin, "sha256": sha256_file(lunace_bin)},
        "ipks": {os.path.relpath(p, PROJ): sha256_file(p) for p in sorted(
            set(IPK.values()) | set(OVERWRITE_IPKS.values()) | set(variants.values()))},
    }
    mdir = os.path.join(HERE, "manifests")
    os.makedirs(mdir, exist_ok=True)
    mpath = os.path.join(mdir, f"{mark}.json")
    with open(mpath, "w") as f:
        json.dump(manifest, f, indent=2)
        f.write("\n")
    log(f"manifest: {os.path.relpath(mpath, PROJ)}")

    log(f"done: {OUT}")
    nf = sum(len(files) for _, _, files in os.walk(OUT_ROOT))
    sz = sum(os.path.getsize(os.path.join(dp, f))
             for dp, _dn, fns in os.walk(OUT_ROOT) for f in fns
             if not os.path.islink(os.path.join(dp, f)))
    log(f"overlay rootfs contains {nf} entries ({sz//1048576} MB); "
        f"removals: {len(all_removes)}")


if __name__ == "__main__":
    main()
