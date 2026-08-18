# webOS Doctor — Community Edition (3.1 CE)

Building a community webOS Doctor and update path for the **HP TouchPad**
(`topaz`, Wi-Fi), starting from the OEM **HP webOS 3.0.5** Doctor and layering in
14 years of community improvements — modern TLS, the LunaCE launcher, Bluetooth
gamepad and USB support, a working App Catalog, modern mail — delivered both as a
**clean-flash Doctor** and as an **over-the-air upgrade** from stock devices.

Trying it out: Download the pre-built Doctor .jar from the latest [Release](https://github.com/codepoet80/webos-doctor-experiments/releases).
Read how to run a Doctor: [docs.webosarchive.org/doctor/#running-the-doctor](https://docs.webosarchive.org/doctor/#running-the-doctor)

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
| **[RELEASE-NOTES.md](RELEASE-NOTES.md)** | What ships in the current release candidate, what changed, and the known issues. Start here if you are testing a build. |
| **KNOWN-ISSUE-*.md** | Per-issue notes written for testers: what you'd see, whether it matters, and exactly which logs to capture. Currently: [empty launcher](KNOWN-ISSUE-EMPTY-LAUNCHER.md), [random reboot](KNOWN-ISSUE-RANDOM-REBOOT.md), [.ipk prompt](KNOWN-ISSUE-IPK-BROWSER-PROMPT.md). |
| **[TEST-PLAN.md](TEST-PLAN.md)** | The verification run for the current build: what has been checked, what still needs a human, and how to capture evidence when something misbehaves. |
| **[build/README.md](build/README.md)** | The **Phase 0 repack harness** (built): unpack → overlay → md5-regen → `integcheck` dry-run → repack + gate-patch. Run `build/build-ce-doctor.sh`. |

## Source projects (siblings)

The CE image and OTA payload are assembled from work in adjacent repos:

| Project | Contributes |
|---------|-------------|
| `../OpenSSL-legacyWebOS` | Modern TLS 1.1.1w stack (browser, download mgr, **mail**), env wrappers, `ntpdate-sync`, CA bundle |
| `../LunaCE` | LunaSysMgr launcher replacement (app groups, tabs, wave launcher, stability) |
| `../webos-hardware-tests` | Bluetooth gamepad shim, USB OTG/power/mass-storage (all userspace) |
| `../webos-update-exploration` | OTA mechanism + server, Updates reroute / OTA Ready, fingerprint/baseline model, rdxd fix |
| `AddToImage/` | Every ipk baked into the image (the statement of intent for image contents) — App Catalog, core apps, Synergy, Preware, Govnah, kernel, TLS tiers |

## Locked decisions (see SCOPE §9)

`topaz` Wi-Fi only · modern TLS incl. mail · LunaCE launcher · BT gamepad + USB ·
App Catalog 6.1.2901 · **no** QupZilla · keep the OTA path (bootstrap + ongoing) ·
version string **`webOS CE 3.1.0`** with `BUILDNAME` unchanged · keep `verifyRom` + regenerate md5sums · no on-device
rollback (recover by re-Doctoring) · BT input-jail shipped as-is.

*Mandatory regardless:* patch `checkToFlash=false` (the OEM Doctor's online build
check targets a dead Palm server).

## Status

**Release candidate: BUILDMARK 600024** —
`out/webosdoctorp305hstnh-3.1CE-600024-rc.jar`, sha256 `ec30762f…`.
See **[RELEASE-NOTES.md](RELEASE-NOTES.md)** for what ships and
**[TEST-PLAN.md](TEST-PLAN.md)** for the current verification run.

The full CE Doctor is built, flash-tested and working on real `topaz` hardware.
Every flash passes the on-device ROM Verifyer
(`integcheck IPKG VERIFICATION SUCCEEDED`), and the current build boots, runs its
OOBE without a reboot, and comes up with the CE launcher, modern HTTPS, Preware
with feeds, and `webOS CE 3.1.0` in Device Info.

**Everything is BAKED.** Every app, patch and file is placed at its final rootfs
path at build time — no staged ipks, no first-boot installs, no postinsts. Each
package's postinst file-effects are replayed on the build host by
`build/full-ce/bake.py`, then the harness regenerates the ipkg md5 database and
integchecks the result. (An earlier design staged the bundled apps as ipks and
relied on their postinsts running on-device; that broke USB Settings, BT gamepad
and Preware, and is gone.)

### What the image contains

Modern TLS for browser/WebKit/download-manager/mail · LunaCE launcher · community
first-use (skippable) · Preware, Govnah, App Catalog 6.1.2901, Maps 4.0.1, USB
Settings, BT gamepad, Synergy Revival runtime · community core apps (Accounts
3.1.1, Contacts, Messaging, Phone) · UberKernel 3.0.5-93 · full Mozilla trust
store · `webOS CE 3.1.0` identity · HP preloads removed. Full detail in
`build/full-ce/README.md`.

### Build reproducibility

`build/full-ce/manifests/<BUILDMARK>.json` records, for every build: the git
revision, the sha256 of the OEM JAR, the LunaCE binary, every consumed ipk, and
the output JAR. The rootfs is written with fixed mtimes and a normalised gzip
header, ipks are selected by version (not mtime), and the staged ipks the build
repacks are produced deterministically — so two builds of the same inputs differ
only in `BUILDTIME`/`BUILDMARK`.

## Working artifacts

- `webosdoctorp305hstnhwifi.jar` — the OEM 3.0.5 Doctor (the repack base; not in git).
- `out/webosdoctorp305hstnh-3.1CE-600024-rc.jar` — **the release candidate**.
- `out/webosdoctorp305hstnh-3.1CE-600023.jar` — the previous candidate, kept as a
  fallback.

`out/` is gitignored; rebuild with `build/full-ce/bake.py` then
`build/build-ce-doctor.sh overlays/full-ce`.
