# Full CE overlay

The complete CE Doctor: the community first-use swap **plus** every CE
component, all **baked into the rootfs at final paths at build time**. Nothing
is staged for first-boot installation — the device is fully installed the
moment the flash lays down. `bake.py` generates `../overlays/full-ce/`; then
`../build-ce-doctor.sh overlays/full-ce` produces the Doctor JAR.

```
python3 bake.py
../build-ce-doctor.sh overlays/full-ce      # -> out/webosdoctorp305hstnh-3.1CE.jar
```

## Inputs: `AddToImage/` (project root)

The single statement of intent for image contents. `bake.py` resolves every
ipk by package-name prefix, newest-by-mtime (so a corrected rebuild reusing a
version string still wins — just drop the new file in):

- **`PatchOrReplace/`** — ipks that fix or replace an existing system
  component: the TLS tiers (browser/downloadmgr/luna/mail), uber-kernel,
  App Catalog, Maps, help-redirect, rootcertsupdate, curl/ntpdate (consumed by
  the community-firstuse layer), the language-variant patches (`…---xx_`
  suffix = language, no suffix = english), and the community **core-apps
  suite** of `*-overwrite` ipks (accounts, contacts, messaging, phone,
  chatthreader, service.accounts, contacts.linker, contacts.plugin.messaging,
  enyo-accounts, enyo-contactsui, messaging.library, luna-systemui). Those are
  replayed generically from their staged metadata: `dest.txt` names the
  replaced dir, `payload.tar.gz` (whole-dir) or `files.txt`+`files.tar.gz`
  (surgical) carries the files, `preserve.txt` paths keep stock content,
  `symlinks.txt` links are recreated, and `db8-kinds/`/`db8-permissions/`
  files replace their stock `/etc/palm/db` counterparts wherever those
  actually live (several sit in per-owner subdirs). A dest under
  `/media/cryptofs/apps/` (contacts, messaging) is baked as a **rootfs** app
  instead and the stock staged ipk subdir under `/usr/palm/ipkgs/` is removed.
  `org.webosarchive.tls-updates` is a meta-package and is ignored.
  Also here: **`com.palm.synergy.generic`** (Synergy Revival shared runtime).
  Its rootfs-overwrite tree bakes at real paths (imlibpurpletransport, the
  `/var` launch scripts, libpurple 2.14 + plugins, db8 kinds/permissions/
  activities, ls2 roles, `_cloudcore`); cloud-auth/docviewer bake as rootfs
  apps; the **cryptofs-only** pieces (synergy-glibc — the transport's
  hardcoded ELF interpreter —, synergy-runtime and the purple plugins that
  `imwrap.sh` bind-mounts over `/usr/lib` — a contract Preware-installed
  connectors rely on) ship under `/usr/palm/ce-seed/cryptofs/` and
  `ce-cryptofs-seed` copies them into `/media/cryptofs` once per flash. Its
  device-setup fixes are replayed at build time (PmBtEngine BT-HFG and
  libWebKitLuna webm-MIME byte patches, mediastream webm reroute, Thai font,
  gst codec plugins, bt-a2dp-fix job, db8-clean tool), the defunct
  skype/legacy-IM/google-legacy stacks become image removals, and the stock
  staged QuickOffice/Photos ipks are repacked with the integration patches
  applied (webOS ipkg doesn't verify ipk signatures). The baked `imtransport`
  job gains a pre-start gate that waits for the seeded glibc (cryptofs mounts
  late in boot; without it the respawn limit burns on doomed launches).
- **`NewApps/`** — brand-new apps to pre-install: Preware, Govnah,
  USB Settings, BT gamepad. Preware and Govnah also get an ipkg **status
  stanza seeded** by the ipkgservice job's pre-start (idempotent, every boot)
  so Preware shows them as installed at the baked version; USB Settings and
  BT gamepad deliberately stay unlisted.
- **`LunaCE-Tweaks/`** — Tweaks-framework preference definitions for LunaCE's
  extra features (mini cards, gestures, wave launcher, …). Seeded into the
  cryptofs `org.webosinternals.tweaks.prefs` preferences dir by
  `ce-cryptofs-seed`; inert until the user installs Tweaks via Preware.
- **`OOBE/`** — the firstuse replacement: the community webosaccount ipk (full
  app + service source). `community-firstuse/make-overlay.sh` lays it over
  `com.palm.app.firstuse` / `com.palm.service.palmprofile` (every
  `appinfo.json` excluded — the stock firstuse identity must survive) and
  applies the `oobe/` deltas on top (the ipk is the standalone build; the
  deltas restore the Wi-Fi join, OOBE card list, and
  markFirstUseDone+reboot completion).
- **`Media-Internal/`** — static content for `/media/internal` (wallpapers,
  ringtones). Delivered via the stock customization `copy_binaries` mechanism
  (the media partition survives flashes, so first-boot copy is the only
  route — the same one HP used). The default wallpaper is the
  alphabetically-first image, or a file named `default-wallpaper.*`.

## How it bakes

Each ipk's postinst file-effects are **replayed on the build host**: payloads
extracted to their final paths, sed/awk edits applied to pristine stock files,
binaries relocated from `/var/usr/sbin` to `/usr/sbin`, services registered
statically. The harness regenerates the affected packages' md5sums and
integchecks the result (0 missing / 0 failed / 0 added, verified by the
on-device ROM Verifyer at flash time).

Tier order matters only for the ssl11 stack (browser first). Highlights:

- **TLS tiers + LunaCE + kernel + version string** — unchanged design, see
  bake.py comments. LunaCE binary comes from the sibling `LunaCE` repo
  (`bin/LunaSysMgr-LunaCE-topaz`) and includes the minimal-mode gesture guard
  (edge taps during firstuse crashed stock LunaCE).
- **rootcertsupdate** — full trust-store replay with host openssl: expired
  stock certs dropped, modern Mozilla roots added, hash links regenerated with
  `-subject_hash_old` (the device's OpenSSL 0.9.8 `-hash`), bundle rebuilt,
  `calinks.tgz` regenerated (certstoreinit rebuilds `/var/ssl` from it).
- **Services (ipkgservice, govnah, usbsettings.service)** — dbus service files
  go in **BOTH** hub dirs: `/usr/share/dbus-1/system-services` (private hub)
  AND `/usr/share/dbus-1/services` (public hub — apps call over the public
  bus; missing there = "Service does not exist"). ls2 roles in
  `/usr/share/ls2/roles/{prv,pub}`, jobs in `/etc/event.d`.
- **Language-aligned patches** — every variant is applied to pristine stock at
  build time (build fails if one doesn't apply); english is the rootfs
  default; all variants ship under `/usr/palm/ce-patches/lang/<lang>/` and a
  boot job aligns the live file to the selected locale.
- **Launcher placement** — `PreferAppKeywordsForAppPlacement` + the
  `wosa-settings` keyword put USB Settings and Govnah on the Settings tab.
- **OOBE completion** — `closeApp` calls `markFirstUseDone()` **and**
  `machineReboot` (nothing in the OS reboots on `first-use-finished`; the
  reboot was always firstuse's own call).
- **CE platform tweaks** — `BUILDTIME`/`BUILDMARK` refreshed per build
  (`BUILDMARK` counter file here, CE marks start at 600000);
  PmNetConfigManager's connectivity-probe URL list byte-patched from dead HP
  hosts to live community ones (the spurious hotspot-login fix) plus the enyo
  captiveportal login page repointed; Preware pre-registered as the `.ipk`
  resource handler in `/usr/palm/command-resource-handlers.json`;
  `sysservice.conf [Debug] turnOnNovacomAtStart=true` re-enables developer
  mode every boot (a manual off lasts until reboot); default keyboard size
  seeded to small via `defaultPreferences.txt`
  (`x_palm_virtualkeyboard_settings`).

## First-boot jobs (`/etc/event.d/ce-*`)

Small, idempotent, and only for things that *cannot* be baked (they touch
volumes the Doctor doesn't flash, or depend on the user's OOBE choices):

- `ce-remove-preloads` — deletes the hp.tar-staged Kindle/Facebook/YouTube
  ipks before the customization service can install them.
- `ce-firstboot-tweaks` — seds the default-wallpaper entries in hp.tar's
  `customization.json`, and once per flash removes stale `/media/cryptofs`
  copies of apps this image bakes (cryptofs **survives** Doctor flashes and a
  stale copy shadows the baked app).
- `ce-default-wallpaper` — the race-proof half of the wallpaper default: on
  the first boot after first use, if the pref is still factory `01.jpg`, set
  ours. User-chosen wallpapers are never touched.
- `ce-language-patches` — aligns the language-variant patched files with the
  selected locale each boot (no-op when they already match).
- `ce-cryptofs-seed` — once per flash, merges `/usr/palm/ce-seed/cryptofs/*`
  into `/media/cryptofs` (Synergy glibc/runtime/plugins + cryptofs app-store additions like the LunaCE tweak definitions);
  every boot, kicks `imtransport` in case it exhausted its respawn limit
  before cryptofs mounted.

Upstart runs these with `sh -e`: guards must be `[ ! -d x ] || cmd` /
`if [ -f x ]; then exit 0; fi` forms — `[ -f x ] && exit 0` aborts the script
when x is absent.

## Status

Flash-tested end to end on hardware (2026-08-16, four flashes): OOBE in
English and German completes and reboots itself; every baked app and service
works on first boot; trust store, media, launcher placement, wallpaper and
language alignment all verified. Shipping artifact:
`out/webosdoctorp305hstnh-3.1CE.jar`.

Operational notes: `sync` before `tellbootie recover` (cryptofs lives on the
FAT media partition and a dirty hard reboot can wipe its contents); launch the
Doctor only after the device is already in recovery (a running instance holds
a stale novacomd session across re-enumeration and hangs at the battery
stage — kill and relaunch).
