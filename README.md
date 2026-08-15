# webOS Doctor — Community Edition (3.1 CE)

Building a community webOS Doctor and update path for the **HP TouchPad**
(`topaz`, Wi-Fi), starting from the OEM **HP webOS 3.0.5** Doctor and layering in
14 years of community improvements — modern TLS, the LunaCE launcher, Bluetooth
gamepad and USB support, a working App Catalog, modern mail — delivered both as a
**clean-flash Doctor** and as an **over-the-air upgrade** from stock devices.

## The plan in one paragraph

Repack the OEM Doctor JAR (no recompile) with a modified rootfs branded **"webOS
3.1 Community Edition"**, neutralizing the dead-server flash gate and keeping the
on-device integrity check honest via regenerated md5sums. Ship every improvement
in two forms — baked into the Doctor rootfs, and as signed ipks — so the same
component set can be flashed or delivered OTA. Because we run the update server,
support a one-time **bootstrap OTA** that carries stock OEM 3.0.5 devices up to CE
3.1, then **ongoing OTAs** for CE 3.1 and beyond.

## Documents

| Doc | What it covers |
|-----|----------------|
| **[TEARDOWN.md](TEARDOWN.md)** | Full analysis of the OEM 3.0.5 Doctor JAR: structure, signing, the "TrenchCoat" flash recipe, and the webOS rootfs (security posture, stack, secrets). The starting point. |
| **[SCOPE-3.1-CE.md](SCOPE-3.1-CE.md)** | The CE Doctor build: feasibility (repack + integrity gates), the tiered feature set, branding/identity, size budget, integration risks, assembly recipe, the **locked decisions**, and a phased effort estimate. |
| **[OTA-STRATEGY.md](OTA-STRATEGY.md)** | How devices reach and stay on CE: the **bootstrap OTA** (OEM 3.0.5 → CE 3.1, incl. the TLS chicken-and-egg and the chained two-session upgrade), **ongoing 3.1+ OTAs**, the server-side design, and payload signing. |
| **[build/README.md](build/README.md)** | The **Phase 0 repack harness** (built): unpack → overlay → md5-regen → `integcheck` dry-run → repack + gate-patch. Run `build/build-ce-doctor.sh`. |

## Source projects (siblings)

The CE image and OTA payload are assembled from work in adjacent repos:

| Project | Contributes |
|---------|-------------|
| `../OpenSSL-legacyWebOS` | Modern TLS 1.1.1w stack (browser, download mgr, **mail**), env wrappers, `ntpdate-sync`, CA bundle |
| `../LunaCE` | LunaSysMgr launcher replacement (app groups, tabs, wave launcher, stability) |
| `../webos-hardware-tests` | Bluetooth gamepad shim, USB OTG/power/mass-storage (all userspace) |
| `../webos-update-exploration` | OTA mechanism + server, Updates reroute / OTA Ready, fingerprint/baseline model, rdxd fix |
| `~/Downloads/…enyo-findapps_6.0.2900` | App Catalog replacement (swaps the staged 5.0.2900 catalog) |

## Locked decisions (see SCOPE §9)

`topaz` Wi-Fi only · modern TLS incl. mail · LunaCE launcher · BT gamepad + USB ·
App Catalog 6.0.2900 · **no** QupZilla · keep the OTA path (bootstrap + ongoing) ·
version-string rename to "webOS 3.1 Community Edition (3.0.5 base)" with
`BUILDNAME` unchanged · keep `verifyRom` + regenerate md5sums · no on-device
rollback (recover by re-Doctoring) · BT input-jail shipped as-is.

*Mandatory regardless:* patch `checkToFlash=false` (the OEM Doctor's online build
check targets a dead Palm server).

## Status

**Phase 0 repack harness is built and self-tested** (`build/`): it produces a
patched, unsigned CE Doctor from the OEM JAR, keeps the ipkg md5 database
consistent, and verifies with a faithful `integcheck` dry-run.

**Phase 1 (in progress): community first-use swap is built and integ-clean.**
`build/community-firstuse/` replaces stock first-use in place with the
`webos-community-account` sign-in flow adapted as the real OOBE (Wi-Fi join,
`markFirstUseDone` + reboot completion, trimmed card list), and bakes in its
transport prerequisites (modern curl/TLS 1.3, ntpdate-sync, current CA bundle)
plus `/var/gadget/novacom_enabled`. `make-overlay.sh` generates the overlay from
the OEM rootfs + community diffs; the full build passes integcheck
(0 missing/failed/added). **Flash-tested on real `topaz` hardware (2026-08-15):
the on-device ROM Verifyer reported `integcheck IPKG VERIFICATION SUCCEEDED`,
all flash stages completed, and the device rebooted into the community OOBE.**
The OOBE was then verified end-to-end on that device (terms card served the
community terms → sign-in → Restart, no wipe).

**Full CE Doctor built, flash-tested, and largely working on hardware
(`build/full-ce/`, `bake.py` → `out/webosdoctorp305hstnh-3.1CE-full.jar`).** On
top of the first-use swap it bakes in every tiered component. Confirmed working
on a real `topaz`: CE launcher, browser modern-HTTPS, App Catalog, and
`webOS CE 3.1.0` in Device Info. The full contents (see `build/full-ce/README.md`):

- **Modern TLS** for browser, app WebKit, download manager, mail (the `ssl11`
  OpenSSL 1.1.1w stacks + RPATH'd BrowserServer/LunaDownloadMgr + mojomail
  launcher env/patches), replayed from the webOS-internals postinsts.
- **LunaCE** launcher binary + launcher images.
- **App Catalog** — auto-discovered: newest `com.palm.app.enyo-findapps_*_all.ipk`
  in the **project root** (drop a new build there; `bake.py` grabs it by mtime).
- **UberKernel 3.0.5-93** (`/boot/uImage-*` + modules).
- **`webOS CE 3.1.0`** version string.
- **Skippable OOBE** with a pre-reboot notice (from `webos-community-account`).
- **Bundled apps**: Maps 4.0.1, USB settings, BT gamepad, **Preware** (with an
  in-sequence `pmPostInstall` bootstrap for its ipkgservice — see below).
- **HP preloads removed** (Kindle, Facebook, YouTube).

The harness gained overlay **symlink** support (ssl11) and **exec-bit** handling;
every build passes integcheck (0 missing/failed/added) and is statically
link-verified (RPATH→soname closure, binary md5s).

### Known bug fixed this session
First bundled-apps flash lost ~12 stock 1P apps: a first-boot job ran Preware's
ipkgservice bootstrap concurrently with `app-install`, colliding on the ipkg DB
and aborting the rest. Fixed by moving the bootstrap into the staged ipk as a
top-level `pmPostInstall.script` (app-install runs it in-sequence). Re-flashed to
confirm all apps return.

### Known issue to fix next session — bundled apps must be PRE-INSTALLED, not staged
The bundled apps (Maps, USB settings, BT gamepad, Preware, Accounts) are currently **staged**
as ipks in `/usr/palm/ipkgs/` and installed on first boot by `app-install`, relying on their
**postinsts** running on-device. That was the wrong call for a system image and it broke:
**USB Settings** ("Helper not running") and **BT gamepad** (won't pair) both need their service
registered / rootfs changes applied with a reboot to activate, which doesn't happen cleanly
during first-boot app-install; and **Preware's** in-ipk `pmPostInstall.script` stalled
`app-install` long enough that a fast OOBE-completion reboot dropped the apps queued after it.

**The TLS tiers, LunaCE, App Catalog, kernel, and version string were never affected** because
they are **baked directly into the rootfs** (`bake.py` replays each package's final file
placement) — which is exactly what all the bundled apps should do too. There is no inherent
race with OOBE; the only problem is postinst-based install.

**Fix (next session):** rewrite the bundled-app tier in `bake.py` to **bake** each app into the
rootfs — app → `/usr/palm/applications`, service → `/usr/palm/services` (webOS auto-registers
from its own `services.json`/`roles.json`), binaries/libs/upstart/udev to their canonical
`/usr`, `/etc` paths, and replay any stock-file patches (BT's `bluetoothtab`, `jail_pdk.conf`,
`event.d/bluetooth`) — with **no postinsts, no `/usr/palm/ipkgs` staging, and no bootstrap
jobs.** Per-app placement details are recorded in project memory (`full-ce-overlay`). Watch the
568 MB root-volume budget when baking large apps.

### Then (plan)
1. **Launcher tab placement** — **USB→Settings** (and Preware→Downloads) via the launcher page
   layout (`/etc/palm/default-launcher-page-layout.json` is in the rootfs and overlay-able;
   LunaCE also ships its own `default-launcher-page-layout.json`).
2. **Default governor** — CE ships `performance`; consider seeding `ondemandtcl` at boot.
3. **Optionally bundle Govnah** so the uberkernel governors are adjustable OOTB.
4. **OTA server**: teach the fingerprint that CE-uberkernel is the expected baseline, then the
   bootstrap OTA (OEM 3.0.5 → CE).

## Working artifact

- `webosdoctorp305hstnhwifi.jar` — the OEM 3.0.5 Doctor (the repack base).
