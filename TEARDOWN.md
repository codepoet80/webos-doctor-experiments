# webOS Doctor Teardown — `webosdoctorp305hstnhwifi.jar`

A structural analysis of the HP webOS Doctor recovery image for the HP TouchPad
(Wi‑Fi), and the webOS 3.0.5 root filesystem contained inside it.

- **File:** `webosdoctorp305hstnhwifi.jar`
- **Size:** 223 MB (233,604,748 bytes)
- **Type:** Signed, executable Java archive (JAR)
- **Analyzed:** 2026-08-15

---

## 1. What it is

`webosdoctorp305hstnhwifi.jar` is the official **HP webOS Doctor** — the
signed Java desktop application that reflashes/recovers a webOS device over USB.
Despite `p305` in the filename, the internals identify the target as the
**HP TouchPad Wi‑Fi** tablet:

| Field | Value |
|-------|-------|
| Device codename | `topaz` (HP TouchPad) |
| SoC | Qualcomm `MSM8660` (dual-core Snapdragon) |
| Model class | Wi‑Fi only (no cellular modem image bundled) |
| OS version | **HP webOS 3.0.5** |
| ROM build | 86 (`RomBuildNumber=86`) |
| Recovery-tool build | 88 (`RecoveryToolBuildNumber=88`) |
| Build mark | 528667 |
| Build date | 2011-12-21 (final official TouchPad release) |

### Signing

- **Main-Class:** `com.palm.nova.installer.recoverytool.RecoveryTool`
- Signed by **Palm, Inc.** (OU=Delivery Systems) via a **VeriSign Class 3
  Code Signing 2004 CA** chain rooted at the VeriSign Class 3 Public Primary CA.
- 236 signed entries (`META-INF/MANIFEST.MF` + `JARKEY.SF` / `JARKEY.RSA`).
- **Caveats for a modern JRE:** the signer cert expired **2012-05-12**, and the
  chain uses now-disabled algorithms (MD2withRSA / SHA1withRSA, 1024-bit RSA).
  Signature verification will fail/warn on current Java.

---

## 2. JAR layout

254 entries total. Two layers: the installer application (~140 classes) and the
payload (~223 MB, essentially the whole file).

### Application code (`com/`)

| Package | Classes | Role |
|---------|--------:|------|
| `com.palm.nova.installer.core` | 46 | Flashing engine core |
| `com.palm.nova.installer.core.stages` | 31 | Per-step flash "stages" |
| `com.palm.nova.installer.recoverytool.cards` | 20 | Wizard UI (cards) |
| `com.palm.nova.installer.recoverytool` | 16 | Recovery tool UI shell |
| `com.palm.novacom.internal` | 13 | novacom USB protocol (internal) |
| `com.ice.tar` | 13 | Tar streaming library |
| `com.palm.nova.installer.recoverytool.runner` | 8 | Wizard runner |
| `com.palm.novacom` | 8 | novacom host driver (public API) |

Notable stage classes (`.../core/stages/`): `ChargeBatteryStage`,
`RamdiskLoadingStage`, `TrenchcoatStage` (the actual partition writer),
`FirmwareUpdateStage`, `ModemUpdateStage`, `VerifyRomStage`,
`CustomizationStage`, `SaveLogsBeforeFlashStage` / `RestoreLogsAfterFlashStage`,
`DataSaveStage` / `DataRestoreStage` / `DataPreCheckStage`, `BypassFirstUseStage`.
`FlasherThread.class` (33 KB) is the largest single class — the orchestrator.

### Payload (`resources/`)

| File | Size | Purpose |
|------|-----:|---------|
| `webOS.tar` | 192 MB | The OS image set (see §3) |
| `hp.tar` | 21 MB | HP customization `.ipk` packages |
| `NovacomInstaller_x64.msi` / `_x86.msi` | ~5 MB ea. | Windows novacom driver installers |
| `NovacomInstaller.pkg.tar.gz` | 58 KB | macOS novacom installer |
| `recoverytool.config` | 980 B | Build metadata + flash options |
| `desktopinstallers.config` | 20 B | `InstallerVersion=73` |
| `synthSkin.xml`, `*.png` | — | Wizard UI skin / backgrounds |
| `messages*.properties`, `EULA_*.html` | — | i18n strings + EULAs (9 locales) |
| `languagePicker.properties` | 293 B | Locale list |

**`recoverytool.config` highlights:** `BaseBuild=webOS.tar`,
`CustomizationBuild=hp.tar`, `ForceModemUpdate=true`, `DeviceType=topaz`,
plus base64/gzip'd `Approval*` blobs (build-approval hashes).

> **Gotcha:** `unzip -p` returns 0 bytes for the two large tar entries. Use
> Python `zipfile` (or `jar`) to stream them — plain `unzip` chokes on the
> large deflate members here.

---

## 3. Inside `webOS.tar`

A ustar tar (owner `reviewdaemon`) containing the flashable image set:

| Entry | Size | Purpose |
|-------|-----:|---------|
| `nova-cust-image-topaz.rootfs.tar.gz` | 178 MB | **The root filesystem** (see §5) |
| `nova-installer-image-topaz.uImage` | 14 MB | On-device recovery ramdisk kernel |
| `boot-topaz.bin` | 115 KB | Bootloader image |
| `*.tga` (BootLogo, Charging, NoBatt, Panic, Disk, Weak, …) | — | Boot/charge logos written to NVRAM |
| `topaz.xml` | 5.5 KB | **Partition map / flash recipe** (see §4) |
| `installer.xml` | 368 B | Top-level installer rule |
| `topazumtsfw.tar` / `-row.tar` | 0 B | Modem firmware — **empty** (Wi‑Fi model) |

### `hp.tar` (customization layer)

Flat tar of HP `.ipk` packages layered on during flashing:
`sweatshop-hp-topaz_1.0-46_armv7.ipk` (21 MB, the bulk),
`crotest-images_1.0-12_armv7.ipk`, `palmcustomizationinfo-hp_1.0-86_all.ipk`,
`audiod-config-eu_1.2-30_topaz.ipk`, plus its own `installer.xml`.

---

## 4. The flash recipe (`topaz.xml`)

Palm's flasher format is called **"TrenchCoat"** (hence `TrenchcoatStage`). The
file completely repartitions the eMMC (`/dev/mmcblk0`, `reusePartitions=true`).

### Physical partitions

- **MBR** (512 B) + FAT (p1), then the Qualcomm bootloader chain:
  CFG_DATA/`rpmsbl`, SPBL, APPSSBL/`rpm`, QCSBL/`ssbl`, EFS2, FOTA/`emmc_appsboot`,
  APPS/`boot.img` (10 MB, `type="bootloader"`), OEMSBL/`tz`, MODEM_ST1/ST2.
- **NVRAM** (4 MB) — a `type="nvram"` region holding:
  - `env` section: sets `installer=trenchcoat`, deletes `autoboot`/`bootfile`
  - `tokens` section: `installer=trenchcoat`
  - `image` sections: all the boot logos (`.tga`) keyed by name
    (`logo-boot`, `logo-chg`, `logo-panic`, …)
- **`/boot`** — 32 MB ext3.
- **LVM PV** — everything remaining (`size="*"`), 64 MB alignment.

### LVM volume group `store`

| Volume | Size | Mount |
|--------|------|-------|
| root | 568 MB | `/` (ext3, ro) |
| var | 64 MB | `/var` |
| update | 16 MB | `/var/lib/update` |
| log | 24 MB | `/var/log` |
| mojodb | 144–512 MB (by device size) | (encrypted DB — `store-cryptodb`) |
| filecache | 136 MB | (encrypted — `store-cryptofilecache`) |
| media | `*` (rest) | `/media/internal` (FAT32, USB-exposed) |
| swap | 512 MB | — |

`mojodb` and `filecache` are mounted via `/dev/mapper/store-crypto*` (dm-crypt).
The rootfs tarball is unpacked to `/` via the `<Images>`/`${NOVATGZ}` rule, then
`PostInstall` runs `/sbin/tcpostflash.sh`.

The file's own comments are candid: *"Here is palm territory. There be dragons."*

### `installer.xml`

`target=topaz`, `version=528667`, `image=nova-cust-image`,
`ramdisk=nova-installer-image`, `bootfile=boot-topaz.bin`, root FS min
≈466 MB, a battery check, and a `ModemUpdater` slot pointing at
`topazumtsfw.tar` (empty here → no modem update on Wi‑Fi).

---

## 5. The root filesystem

Unpacked from `nova-cust-image-topaz.rootfs.tar.gz`: **393 MB, 19,085 entries**,
a complete ARM Linux root.

### Identity (`/etc/palm-build-info`)

```
PRODUCT_VERSION_STRING=HP webOS 3.0.5
BUILDNAME=Nova-HP-Topaz
BUILDNUMBER=86
BUILDTIME=20111221110520
BUILDMARK=528667
```

- `/etc/issue`: **"Rockhopper"** (webOS 3.x line codename)
- Arch: **ARM EABI5**, glibc (`/lib/ld-linux.so.3`), **BusyBox** userland
  (`/bin/sh` → busybox)

### Security posture — open by design

- **`root` has an EMPTY password** (`root::0:0:...:/home/root:/bin/sh`) and there
  is **no `/etc/shadow`**. A novacom shell lands you as root immediately. This is
  the well-known webOS trait that made the TouchPad a homebrew / Android-port
  favorite.
- Real access control lives in **luna-service2 (LS2)**, not Unix perms. Bus
  policy is declared per-service under `usr/share/ls2/roles/{pub,prv}/*.json`:
  each role pins an `exeName` and `allowedNames`, plus inbound/outbound
  permission globs. The service-bus allow-list is the actual security boundary.

### Third-party secrets — handled correctly

- Cloud-service credentials ship **encrypted**, not in cleartext. Dropbox
  (`api_key` + `api_secret`) and Box.net (`api_key`) live under each service's
  `keys/` dir as **AES‑128‑CBC wrapped blobs** keyed to a `com.palm` master key
  (`master.1`) held by the on-device keymanager.
- Swept Facebook, Photobucket, YouTube, and the Google/Yahoo/LinkedIn sync
  services: **no plaintext OAuth consumer keys or API secrets** are embedded.
- Net: the OS is trivially rootable, but partner API keys are **not** readable
  from the image.

### The webOS stack

| Component | Detail |
|-----------|--------|
| Compositor / WM | `LunaSysMgr` (5.2 MB, not stripped), built on **Qt 4.8** |
| Web engine | `libWebKitLuna.so` (12.8 MB) — **WebKit 534.6**; browser UA version 234.83 |
| JS engine | **V8** (`libv8.so`; `d8` shell shipped) |
| i18n | ICU 36 (`libicudata.so.36.0`, 9 MB) |
| App frameworks | **Enyo 0.10** (modern) alongside legacy **Mojo**; foundations, media, globalization |
| Telephony | Full `libTelephonyInterfaceLayer.so` (6.8 MB) present even on Wi‑Fi |
| Comms | Skype media stack (`skypekit`), Bluetooth (`PmBtStack`) |

### Built-in apps & services

~35 built-in apps under `usr/palm/applications/` (browser, phone, contacts,
tasks, wifi, network, vpn, deviceinfo, updates, swmanager, skype, videoplayer,
streamingmusicplayer, firstuse, devmodeswitcher, …) and ~40 Luna services under
`usr/palm/services/` (accounts, appcatalog, backup, contacts/calendar sync for
Google/Yahoo/Facebook/LinkedIn, dropbox, boxnet, palmprofile, photos, music,
migration, …).

### Baked-in endpoints (all now dead)

Everything phones home to `*.palm.com` — `help.palm.com` (per-app help pages),
`developer.palm.com` (app redirects), and the Palm profile/app-catalog servers.
These are long offline, which is why these devices are cloud-orphaned today.

---

## 6. Reproduction notes

Extract the rootfs without touching the huge tar via `unzip` (which fails on the
large entries):

```python
import zipfile, tarfile
z = zipfile.ZipFile('webosdoctorp305hstnhwifi.jar')
with z.open('resources/webOS.tar') as f:
    tf = tarfile.open(fileobj=f, mode='r|')       # streaming
    for m in tf:
        if m.name.endswith('nova-cust-image-topaz.rootfs.tar.gz'):
            with open('rootfs.tar.gz', 'wb') as o:
                o.write(tf.extractfile(m).read())
            break
# then: tar xzf rootfs.tar.gz
```

Inspect signing with `keytool -printcert -file META-INF/JARKEY.RSA`.

---

## 7. Summary

A well-formed, Palm-signed recovery tool: a Java/Swing wizard driving a
staged, novacom-based flasher, wrapped around a "TrenchCoat" partition recipe
and a full HP webOS 3.0.5 (`topaz`, build 86) system image. Two security stories
sit side by side — a deliberately wide-open root account (no password, no
shadow), and genuinely careful handling of third-party API secrets (all
AES-wrapped under an on-device master key). The device's security model rests on
the luna-service2 bus policy rather than Unix permissions, and all of its cloud
touchpoints target Palm servers that no longer exist.
