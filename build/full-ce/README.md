# Full CE overlay

The complete CE Doctor: the community first-use swap **plus** every tiered
component, baked into one rootfs overlay. `bake.py` generates
`../overlays/full-ce/`; then `../build-ce-doctor.sh overlays/full-ce` produces
the Doctor JAR.

```
python3 bake.py
../build-ce-doctor.sh overlays/full-ce      # -> out/webosdoctorp305hstnh-3.1CE-full.jar
```

## What it layers in

1. **Community first-use** — the entire `../community-firstuse` overlay, verbatim
   (account OOBE + palmprofile backend + curl/TLS transport + CA bundle +
   `novacom_enabled`). `bake.py` regenerates it from pristine and copies it in.
2. **browser-tls13** — `/usr/lib/ssl11` OpenSSL 1.1.1w stack (libssl/libcrypto/
   libssl_compat/libcurl + `.0.9.8`→`.1.1` compat symlinks) and the RPATH'd
   `BrowserServer` (RPATH `/usr/lib/ssl11`, NEEDs `libssl.so.0.9.8` etc. — served
   by those symlinks). This is what makes the **browser** do modern TLS.
3. **downloadmgr-tls13** — `/usr/lib/ssl11dl` libcurl + RPATH'd `LunaDownloadMgr`.
4. **luna-tls13** — patches the `LunaSysMgr` **upstart** job (adds
   `libssl_compat.so` to `LD_PRELOAD`, `LD_LIBRARY_PATH=/usr/lib/ssl11`,
   `LD_BIND_NOW=1`) so app WebKit/XHR uses ssl11; installs the env-scrub wrappers
   for `media-pipeline` and `setcpushares-{pdk,task}` (each stock binary moved to
   `.real`, which the wrapper execs; `media-pipeline` also gets a derived
   `com.palm.mediad.pipeline.real.json` LS2 role for prv+pub).
5. **mail-tls13** — `/usr/lib/ssl11mail` stack + env prefix on the four mojomail
   dbus launchers (`eas/imap/pop/smtp`); `imap/pop/smtp` additionally get
   `OPENSSL_CONF=…/mailssl.cnf` (TLS 1.2 + RSA, the Gmail/ECDSA-leaf fix).
6. **mojomail-imap-tagfix** — the one-byte IMAP-tag patch to `/usr/bin/mojomail-imap`
   (offset picked by stock md5; result md5 asserted against the package's value).
7. **LunaCE** — `bin/LunaSysMgr-LunaCE-topaz` replaces `/usr/bin/LunaSysMgr`, plus
   the `launcher3/tab-{add,delete}-icon.png` images. (Binary swap; the upstart
   patch above is a *different* file, so LunaCE and luna-tls13 compose cleanly —
   luna-tls13's PDK/task wrappers exist specifically for LunaCE.)
8. **App Catalog** — the stock staged `enyo-findapps_5.0.2900_all.ipk` is removed
   and our build added under `/usr/palm/ipkgs/`; `app-install` globs that dir on
   first boot (`ls … | grep .ipk$`), so it installs with no manifest edit. The
   source is **auto-discovered**: `bake.py` grabs the newest
   `com.palm.app.enyo-findapps_*_all.ipk` in the **project root** (by mtime, so a
   corrected rebuild reusing the same version string still wins). Drop a new
   catalog build there and the next bake picks it up.
9. **Drop HP preloads** (Kindle, Facebook, YouTube) — these aren't in the
   `webOS.tar` rootfs at build time; `sweatshop-hp-topaz` (in `hp.tar`) stages
   them as customization ipks that `com.palm.service.customization` installs to
   `/media/cryptofs/apps` on first boot. Rather than edit `hp.tar` (which the
   Doctor's approval hashes cover), an early upstart job `ce-remove-preloads`
   (`start on stopped configurator`, before LunaSysMgr/customization) deletes the
   staged ipks so the install finds nothing, and clears any dir already placed.
10. **UberKernel** (`org.webosinternals.kernels.uber-kernel-touchpad_3.0.5-93`) —
    replaces `/boot/{uImage,System.map,config}-2.6.35-palm-tenderloin` + the shipped
    kernel modules. `/boot` is flashed from the rootfs tarball's `./boot/` (the
    boot-images.tar.gz holds only logos), so replacing `./boot/uImage-*` is what
    the device boots. Kept vermagic → stock modules still load. **Note:** compiled
    default governor is `performance`; get Govnah (via Preware) to change it. Also
    makes CE devices a custom-kernel "hazard" to the stock OTA — an OTA-server
    fingerprint policy change is a follow-up.
11. **Version string** — `/etc/palm-build-info` `PRODUCT_VERSION_STRING` →
    `webOS CE 3.1.0` (what Device Info's `com.palm.properties.version` shows).
    `BUILDNAME` stays `Nova-HP-Topaz` (the OTA fingerprint's model gate keys on it).
12. **Bundled apps** (Maps 4.0.1, USB settings, BT gamepad, Preware) — **staged**
    in `/usr/palm/ipkgs/` so first-boot `app-install` (`ipkg -o /media/cryptofs/apps
    install`) installs each. That runs each ipk's control-postinst, so USB (JS
    service + `usbctl` daemon) and BT gamepad (shim, udev, jail_pdk, bluetooth
    upstart + Bluetooth-app patches) self-integrate. The stock staged Maps 3.0.1 is
    removed so only 4.0.1 installs.
    - **Preware bootstrap — the subtle one.** Preware bundles `ipkgservice` in its
      *data* payload and installs it via `<app>/control/postinst`, which `ipkg`
      doesn't run. A separate first-boot job is **wrong**: it fires the instant
      Preware appears (mid-`app-install`) and its heavy `ipkg` ops collide with
      app-install's ipkg session, aborting every app queued after Preware (this bit
      us — ~12 apps went missing). Instead `bake.py` rebuilds the Preware ipk with a
      **top-level `pmPostInstall.script`** (= its bootstrap); app-install's
      `do_postinstall` runs it **in-sequence**, right after installing Preware and
      before the next package, so no two ipkg runs overlap. (Rebuilt via `ar rc`
      dropping the cert/sig members — webOS ipkg doesn't verify them.)
      **General rule: never touch the ipkg DB from a job that races `app-install`;
      use the `pmPostInstall.script` hook for post-install work on staged ipks.**

## Why replay postinsts instead of running them

These webOS-internals ipks are "Application" packages whose **postinst does the
real install** — it reads payload from the offline root but writes to absolute
system paths (`/usr/lib/ssl11`, `/usr/bin/BrowserServer`, …). On a Doctored
device the postinst never runs and its `/media/cryptofs/apps` staging dir is
wiped by the flash, so staging the ipks would install nothing. `bake.py`
reproduces each postinst's **final file placement** into the rootfs. The
**rollback-only** backups (`*.tls13-orig`) are deliberately dropped — a CE device
recovers by re-Doctoring — but the **`.real`** exec targets are kept, because the
wrappers exec them.

## Harness support this needed

`harness.py` gained **symlink support** in overlays (`load_overlay` reads real
symlinks in `rootfs/` via `os.readlink`; `rewrite_rootfs` emits `SYMTYPE`
members). integcheck treats symlinks as invisible (`-type f`), so the ssl11
symlinks carry no md5 and never trip the ADDED check — verified: the full build
passes integcheck `0 missing/failed/added`.

## Ordering

Hard dependency: **browser-tls13 first** — it lays down `/usr/lib/ssl11`, which
downloadmgr/luna/mail all link against. `bake.py` runs the tiers in that order.

## Verification status

Built and **integ-clean** (`0 missing/failed/added`). Statically link-verified:
`BrowserServer`/`LunaDownloadMgr` RPATHs resolve their `NEEDED` sonames through
the shipped ssl11/ssl11dl symlinks; LunaSysMgr md5 == the LunaCE binary;
mojomail-imap == the package's patched md5; catalog swapped.

**Flash-tested on a real `topaz` (2026-08-15): SUCCESS.** The on-device
`ROM Verifyer` reported `integcheck IPKG VERIFICATION SUCCEEDED` over the entire
full-CE overlay (all ssl11 files + symlinks, the RPATH'd binaries, LunaCE, the
catalog swap, the patched mojomail/dbus/upstart files, and `ce-remove-preloads`);
the flash completed and the device rebooted into CE. On-device integcheck
confirms the *files* are correct; **functional** correctness of the binaries
(browser TLS handshake, LunaCE launcher, media, mail) is confirmed by using the
booted device.
