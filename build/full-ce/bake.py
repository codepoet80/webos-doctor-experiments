#!/usr/bin/env python3
"""
bake.py — generate build/overlays/full-ce/ : the COMPLETE CE Doctor overlay.

Layers, on top of the community first-use swap (which this reuses verbatim from
../community-firstuse/make-overlay.sh), the remaining tiered CE components by
REPLAYING each webOS-internals ipk's postinst file-effects into the offline
rootfs. We can't run the ARM postinsts on the build host, and they write to
absolute system paths (they're built for on-device offline-root installs), so
we reproduce their FINAL file placement here and let the harness regen md5 +
integcheck it.

Tiers folded in (hard order — browser lays down /usr/lib/ssl11 that the rest need):
  1. browser-tls13   -> /usr/lib/ssl11 OpenSSL 1.1.1w stack + RPATH'd BrowserServer
  2. downloadmgr-tls13-> /usr/lib/ssl11dl libcurl + RPATH'd LunaDownloadMgr
  3. luna-tls13      -> LunaSysMgr upstart env (ssl11 + LD_BIND_NOW), media-pipeline
                       + setcpushares-{pdk,task} env-scrub wrappers (+ .real targets,
                       + derived LS2 roles)
  4. mail-tls13      -> /usr/lib/ssl11mail stack + mojomail imap/pop/smtp/eas launcher
                       env + Gmail/ECDSA OPENSSL_CONF (imap/pop/smtp)
  5. mojomail-imap-tagfix -> one-byte IMAP-tag patch to /usr/bin/mojomail-imap
  6. LunaCE          -> prebuilt LunaSysMgr binary + launcher3 tab images
  7. App Catalog     -> swap staged enyo-findapps 5.0.2900 ipk -> 6.0.2900

Rollback-only backups (*.tls13-orig) are DROPPED: a CE device recovers by
re-Doctoring (locked decision), so there is no on-device uninstall to restore to.
The *.real exec targets ARE kept — the wrappers exec them, so they're functional.

Usage:  python3 bake.py        (from build/full-ce/)
"""
import hashlib
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
TLS_IPKS = os.path.join(SIBLINGS, "OpenSSL-legacyWebOS", "ipks")
LUNACE = os.path.join(SIBLINGS, "LunaCE")
# App Catalog: grab the NEWEST enyo-findapps ipk dropped into the project root
# (webos-doctor-ce/). Newest-by-mtime, not by version — a corrected rebuild can
# reuse the same version string, so the freshest file is the source of truth.
def _latest_catalog():
    import glob
    cands = glob.glob(os.path.join(PROJ, "com.palm.app.enyo-findapps_*_all.ipk"))
    return max(cands, key=os.path.getmtime) if cands else None
CATALOG_IPK = _latest_catalog()
KERNEL_IPK = os.path.expanduser(
    "~/Downloads/org.webosinternals.kernels.uber-kernel-touchpad_3.0.5-93_arm.ipk")

# Apps staged into /usr/palm/ipkgs/ -> app-install runs `ipkg -o /media/cryptofs/apps
# install` for each on first boot, which unpacks the app AND runs its control-postinst
# (so BT gamepad / USB settings do their system integration). Preware is the exception:
# its ipkgservice bootstrap lives in the DATA payload, not control.tar.gz, so ipkg never
# runs it -> a separate first-boot job (below) runs it once.
HW = os.path.join(SIBLINGS, "webos-hardware-tests", "ipks")
PREWARE_IPK = os.path.expanduser("~/Downloads/org.webosinternals.preware_1.9.18_arm.ipk")
BUNDLED_APP_IPKS = [
    os.path.expanduser("~/Downloads/com.palm.app.maps_4.0.1_all.ipk"),
    os.path.expanduser("~/Downloads/org.webosarchive.accountsapp_3.1.0_all.ipk"),
    os.path.join(HW, "com.webosarchive.usbsettings_1.1.8_all.ipk"),
    os.path.join(HW, "org.webosarchive.btgamepad_1.1.0_armv7.ipk"),
    PREWARE_IPK,
]

CF_OVERLAY = os.path.join(BUILD, "overlays", "community-firstuse")
OUT = os.path.join(BUILD, "overlays", "full-ce")
OUT_ROOT = os.path.join(OUT, "rootfs")

CE_PACKAGE = "org.webosarchive.ce-files"

# ipk paths
IPK = {
    "browser": os.path.join(TLS_IPKS, "tablet", "org.webosinternals.browser-tls13_1.1.2_armv7.ipk"),
    "downloadmgr": os.path.join(TLS_IPKS, "tablet", "org.webosinternals.downloadmgr-tls13_1.0.0_armv7.ipk"),
    "luna": os.path.join(TLS_IPKS, "tablet", "org.webosinternals.luna-tls13_1.1.3_armv7.ipk"),
    "mail": os.path.join(TLS_IPKS, "org.webosinternals.mail-tls13_1.3.2_armv7.ipk"),
    "imaptagfix": os.path.join(TLS_IPKS, "tablet", "org.webosinternals.mojomail-imap-tagfix_1.0.0_armv7.ipk"),
}

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


def read_rootfs_members(tgz, wanted):
    """Return {norm_name: bytes} for the wanted set of './...' member names."""
    out = {}
    want = set(wanted)
    with tarfile.open(tgz, mode="r|gz") as tf:
        for m in tf:
            if m.name in want and m.isfile():
                out[m.name] = tf.extractfile(m).read()
                if len(out) == len(want):
                    break
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


# ---- main -------------------------------------------------------------------

def main():
    if CATALOG_IPK is None:
        sys.exit("ERROR: no App Catalog ipk found. Drop the latest "
                 f"com.palm.app.enyo-findapps_*_all.ipk into {PROJ}")
    log(f"App Catalog source: {os.path.basename(CATALOG_IPK)} (newest in project root)")
    for req in (ROOTFS_TGZ, IPK["browser"], IPK["luna"], IPK["mail"], CATALOG_IPK,
                KERNEL_IPK, os.path.join(LUNACE, "bin", "LunaSysMgr-LunaCE-topaz"),
                *BUNDLED_APP_IPKS):
        if not os.path.exists(req):
            sys.exit(f"ERROR: missing required input: {req}")

    # 0) re-extract a PRISTINE OEM rootfs. build-ce-doctor.sh's build step copies
    # the CE rootfs over work/'s base (harness cmd_build), so a prior build leaves
    # the base already-patched; the community patches would then fail to re-apply.
    # Always start from a clean extract.
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
    log(f"copied community-firstuse -> full-ce")

    tmp = os.path.join(HERE, ".work")
    if os.path.exists(tmp):
        shutil.rmtree(tmp)
    os.makedirs(tmp)

    # stock files we need for the luna/mail/mojomail replays
    stock = read_rootfs_members(ROOTFS_TGZ, [
        "./usr/bin/media-pipeline",
        "./usr/sbin/setcpushares-pdk",
        "./usr/sbin/setcpushares-task",
        "./usr/bin/mojomail-imap",
        "./etc/event.d/LunaSysMgr",
        "./usr/share/ls2/roles/prv/com.palm.mediad.pipeline.json",
        "./usr/share/ls2/roles/pub/com.palm.mediad.pipeline.json",
        "./usr/share/dbus-1/system-services/com.palm.eas.service",
        "./usr/share/dbus-1/system-services/com.palm.imap.service",
        "./usr/share/dbus-1/system-services/com.palm.pop.service",
        "./usr/share/dbus-1/system-services/com.palm.smtp.service",
    ])

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
    up = stock["./etc/event.d/LunaSysMgr"].decode()
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
    w("usr/bin/media-pipeline.real", stock["./usr/bin/media-pipeline"], 0o755)
    for scope in ("prv", "pub"):
        role = stock[f"./usr/share/ls2/roles/{scope}/com.palm.mediad.pipeline.json"].decode()
        real = role.replace("/usr/bin/media-pipeline", "/usr/bin/media-pipeline.real")
        w(f"usr/share/ls2/roles/{scope}/com.palm.mediad.pipeline.real.json", real, 0o644)
    # 4c. setcpushares-{pdk,task} env-scrub wrappers (+ .real targets)
    for name, wrapf in (("setcpushares-pdk", "setcpushares-pdk.wrap"),
                        ("setcpushares-task", "setcpushares-task.wrap")):
        wcopy(f"usr/sbin/{name}", os.path.join(lf, wrapf), 0o755)
        w(f"usr/sbin/{name}.real", stock[f"./usr/sbin/{name}"], 0o755)

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
        txt = stock[key].decode()
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
    imap = bytearray(stock["./usr/bin/mojomail-imap"])
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

    # 8) App Catalog : swap the stock staged enyo-findapps 5.0.2900 for our build
    # (filename derived from the ipk so it can't drift from the actual version).
    log(f"tier: App Catalog ({os.path.basename(CATALOG_IPK)})")
    wcopy(f"usr/palm/ipkgs/{os.path.basename(CATALOG_IPK)}", CATALOG_IPK, 0o644)
    removes.append("/usr/palm/ipkgs/com.palm.app.enyo-findapps_5.0.2900_all.ipk")

    # 8b) drop HP preloads we don't ship (Kindle, Facebook, YouTube).
    # These aren't in this (webOS.tar) rootfs at build time — sweatshop-hp-topaz
    # (hp.tar) stages them as customization ipks under /usr/lib/luna/customization/
    # apps during the on-device CustomizationStage, and com.palm.service.customization
    # installs them to /media/cryptofs/apps on first boot (postFirstUseInstall). So we
    # can't remove them via the overlay; instead ship an early upstart job that deletes
    # the staged ipks before the customization service can install them (runs on
    # `stopped configurator`, strictly before LunaSysMgr/LunaReady/customization), and
    # clears any dir already placed. Editing hp.tar is avoided (Doctor approval hashes).
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

    # 8c) UberKernel : replace the /boot kernel files + /lib/modules kernel modules.
    # The kernel package's postinst copies additional_files/{boot,lib/modules}/* to
    # the matching absolute paths; /boot is populated from the rootfs tarball's
    # ./boot/ entries at flash time (boot-images.tar.gz holds only logos, not the
    # uImage), so replacing ./boot/uImage-* here is what the device boots. The
    # kept vermagic (2.6.35-palm-tenderloin) means stock modules still load, so we
    # only replace the subset the package ships. kernel files are owned by
    # kernel-image-2.6.35-palm-tenderloin -> harness regens that md5sums.
    log("tier: UberKernel (org.webosinternals.kernels.uber-kernel-touchpad 3.0.5-93)")
    d = ipk_extract_data(KERNEL_IPK, os.path.join(tmp, "uber"))
    kbase = os.path.join(
        d, "usr/palm/applications/org.webosinternals.kernels.uber-kernel-touchpad/additional_files")
    kn = 0
    for sub in ("boot", "lib/modules"):
        base = os.path.join(kbase, sub)
        for dp, _dn, fns in os.walk(base):
            for fn in fns:
                full = os.path.join(dp, fn)
                rel = os.path.relpath(full, kbase)   # boot/uImage-... | lib/modules/...
                wcopy(rel, full, 0o644)
                kn += 1
    log(f"  {kn} kernel files (uImage/System.map/config + modules)")

    # 8c2) Bundled apps : stage ipks in /usr/palm/ipkgs so first-boot app-install
    # (`ipkg -o /media/cryptofs/apps install`) installs each — running its
    # control-postinst, which is how BT gamepad + USB settings do their system
    # integration (shim/udev/jail/upstart for BT; JS service + usbctl daemon for USB).
    # Maps is a plain app. Preware installs too but its bootstrap runs via the job below.
    log("tier: bundled apps (maps / usbsettings / btgamepad / preware)")
    for ipk in BUNDLED_APP_IPKS:
        wcopy(f"usr/palm/ipkgs/{os.path.basename(ipk)}", ipk, 0o644)
    # drop the stock staged Maps 3.0.1 so only our 4.0.1 installs on first boot
    removes.append("/usr/palm/ipkgs/com.palm.app.maps_3.0.1_all.ipk")

    # 8c3) Preware ipkgservice bootstrap — run AFTER app-install fully finishes.
    # Preware bundles ipkgservice in its DATA payload (<app>/control/postinst),
    # which `ipkg install` never runs. It must NOT run in app-install's critical
    # path: its heavy `ipkg` feed setup takes ~a minute, and either blocking the
    # install loop (pmPostInstall) or racing it (a job that fires when Preware
    # first appears) breaks the first-boot app install — app-install must stay
    # fast so it completes before firstuse's completion reboot. So a first-boot
    # job WAITS for app-install to be fully idle, THEN runs Preware's bootstrap
    # (no blocking, no concurrent ipkg). If firstuse reboots first, the job just
    # runs on the next boot (app-install already done) — Preware gets ipkgservice
    # before anyone opens it. Gated by a flag.
    # The stock Preware ipk carries a TOP-LEVEL pmPostInstall.script (= its
    # bootstrap), which app-install's do_postinstall runs IN-SEQUENCE — the ~1-min
    # block we must avoid. Re-stage Preware with only the 3 core members so
    # app-install just installs the app fast; the job below runs the bootstrap.
    log("tier: strip Preware pmPostInstall.script (keep app-install fast)")
    d = ipk_extract_data(PREWARE_IPK, os.path.join(tmp, "pw"))
    ar_dir = os.path.join(d, "_ar")
    staged_pw = os.path.join(OUT_ROOT, "usr/palm/ipkgs", os.path.basename(PREWARE_IPK))
    os.remove(staged_pw)
    subprocess.run(["ar", "rc", staged_pw, "debian-binary", "control.tar.gz",
                    "data.tar.gz"], check=True, cwd=ar_dir)
    log(f"  re-staged {os.path.basename(PREWARE_IPK)} without pmPostInstall.script")

    log("tier: Preware ipkgservice bootstrap job (after app-install completes)")
    preware_boot = (
        "# ce-preware-bootstrap — install Preware's ipkgservice ONCE, only after the\n"
        "# first-boot app-install has fully finished. Preware's bootstrap lives in its\n"
        "# DATA payload (control/postinst); `ipkg install` never runs it. Running it\n"
        "# in app-install's path (blocking or racing) breaks the staged-app install.\n"
        "\n"
        "start on stopped finish\n"
        "\n"
        "console none\n"
        "\n"
        "script\n"
        "    FLAG=/var/luna/preferences/ce-preware-bootstrapped\n"
        "    [ -f \"$FLAG\" ] && exit 0\n"
        "    PW=/media/cryptofs/apps/usr/palm/applications/org.webosinternals.preware\n"
        "    # wait for app-install to be idle for a sustained window (~60s), so the\n"
        "    # staged apps are done before we touch the ipkg DB.\n"
        "    quiet=0; i=0\n"
        "    while [ $i -lt 360 ]; do\n"
        "        if ps 2>/dev/null | grep -q \"[a]pp-install\"; then quiet=0; else quiet=$((quiet+1)); fi\n"
        "        [ $quiet -ge 12 ] && break\n"
        "        sleep 5; i=$((i+1))\n"
        "    done\n"
        "    [ -f \"$PW/control/postinst\" ] || exit 0\n"
        "    mount -o remount,rw / 2>/dev/null || true\n"
        "    IPKG_OFFLINE_ROOT=/media/cryptofs/apps sh \"$PW/control/postinst\" || true\n"
        "    mkdir -p /var/luna/preferences && touch \"$FLAG\"\n"
        "end script\n"
    )
    w("etc/event.d/ce-preware-bootstrap", preware_boot, 0o644)

    # 8d) Version string : Device Info shows com.palm.properties.version, sourced
    # from /etc/palm-build-info PRODUCT_VERSION_STRING. BUILDNAME stays
    # Nova-HP-Topaz (the OTA fingerprint's model gate keys on it). palm-build-info
    # is owned by the palmbuildinfo package (not a borrowed rootfs-extra), so the
    # harness md5 regen covers it — no /md5sums.gz change needed.
    log("tier: version string -> webOS CE 3.1.0")
    bi = read_rootfs_members(ROOTFS_TGZ, ["./etc/palm-build-info"])["./etc/palm-build-info"].decode()
    bi2 = re.sub(r'^PRODUCT_VERSION_STRING=.*$',
                 'PRODUCT_VERSION_STRING=webOS CE 3.1.0', bi, count=1, flags=re.M)
    if bi2 == bi:
        sys.exit("ERROR: PRODUCT_VERSION_STRING not found in /etc/palm-build-info")
    w("etc/palm-build-info", bi2, 0o644)

    # 9) merge changes.json (carry over community-firstuse removals, add ours)
    cf_cfg = {}
    cf_json = os.path.join(CF_OVERLAY, "changes.json")
    if os.path.exists(cf_json):
        cf_cfg = json.load(open(cf_json))
    all_removes = sorted(set(cf_cfg.get("remove", [])) | set(removes))
    changes = {
        "description": ("Full CE overlay: community first-use swap + modern TLS "
                        "(browser/luna/downloadmgr/mail ssl11 stacks + mojomail patches) "
                        "+ LunaCE launcher + App Catalog 6.0.2900 + UberKernel 3.0.5-93 "
                        "+ 'webOS CE 3.1.0' version string, minus HP preloads. Generated by "
                        "full-ce/bake.py - do not edit by hand."),
        "ce_package": CE_PACKAGE,
        "remove": all_removes,
    }
    with open(os.path.join(OUT, "changes.json"), "w") as f:
        json.dump(changes, f, indent=2)
        f.write("\n")

    shutil.rmtree(tmp)
    log(f"done: {OUT}")
    nf = sum(len(files) for _, _, files in os.walk(OUT_ROOT))
    log(f"overlay rootfs contains {nf} entries; removals: {len(all_removes)}")


if __name__ == "__main__":
    main()
