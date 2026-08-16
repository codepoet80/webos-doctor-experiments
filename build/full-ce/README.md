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
  App Catalog, Maps, community Accounts, help-redirect, rootcertsupdate,
  curl/ntpdate (consumed by the community-firstuse layer), and the
  language-variant patches (`…---xx_` suffix = language, no suffix = english).
  `org.webosarchive.tls-updates` is a meta-package and is ignored.
- **`NewApps/`** — brand-new apps to pre-install: Preware, Govnah,
  USB Settings, BT gamepad.
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
