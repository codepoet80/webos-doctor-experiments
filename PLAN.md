# webOS Doctor — Community Edition (3.1 CE)

Building a community webOS Doctor and update path for the **HP TouchPad**
(`topaz`, Wi-Fi), starting from the OEM **HP webOS 3.0.5** Doctor and layering in
14 years of community improvements — modern TLS, the LunaCE launcher, Bluetooth
gamepad and USB support, a working App Catalog, modern mail — delivered both as a
**clean-flash Doctor** and as an **over-the-air upgrade** from stock devices.

**Trying it out:** Download the pre-built Doctor .jar from the latest [Release](https://github.com/codepoet80/webos-doctor-experiments/releases).
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

**Release candidate 2: BUILDMARK 600056** —
`out/webosdoctorp305hstnh-3.1CE-600056.jar`, sha256 `cea207df…`.
600056 differs from 600055 in the backup package alone: the restore-side `tar`
budgets are now sized by archive rather than fixed, which is what dropped the
two largest apps on the 600055 restore. Everything else is byte-identical —
verified by a full rootfs diff of the two JARs (9 files, all accounted for).

**The release gate is met.** A 115-package 3.0.5 → CE restore ran on 600056
with **102 installed, 0 failed**, counts reconciling 115/115, and both
previously-failing games recovered. Service registration for the 11 restored
cryptofs services is written and pending its reboot.
See **[KNOWN-ISSUES.md](KNOWN-ISSUES.md)** — the first-boot ipkgservice race is
the one to solve before final.
See **[RELEASE-NOTES.md](RELEASE-NOTES.md)** for what ships,
**[TEST-PLAN.md](TEST-PLAN.md)** for the current verification run, and
**[KNOWN-ISSUES.md](KNOWN-ISSUES.md)** for everything reproduced but not yet
solved — the first-boot ipkgservice race is the one to fix before final.

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

## Next (after RC2)

1. **The first-boot upstart race** — KNOWN-ISSUES #1. Preware's postinst rewrites
   ipkgservice's upstart job file during the first-use preload pass and upstart
   can read it partially written. Fix is structural: write to a temp path in the
   same directory and `mv` it into place. Fires ~1 boot in 6, so validation is
   "no regression across N boots", never a single clean run.

2. **Trim the Preware status seeds to user-facing apps only.** bake.py currently
   seeds 11 ipkg status stanzas: 3 user-facing (`govnah`, `synergy`, `backup`)
   and 8 patch packages (`browser`/`downloadmgr`/`luna`/`mail`/`curl-tls13`,
   `rootcertsupdate`, `ntpdate-sync`, `notifications-advanced-reset-options`).
   Only the first 3 should appear to the user as installed.

   **Do not simply delete the other 8.** They were added for a second reason
   that has nothing to do with Preware's display, documented at bake.py's
   `PATCH_SEED`: on a 3.0.5 → CE restore, each patch's staging directory under
   `/media/cryptofs/apps/usr/palm/applications/<id>/files` looks like an app
   directory to backup, so it gets archived and put back — ~2.5MB of dead
   payload, and `browser-tls13` carries an `appinfo.json` that can surface as a
   junk launcher icon. The stanza is what makes restore skip them. It also
   stops Preware offering a security patch as a fresh install over the baked
   one.

   So the work is to separate the two jobs, not remove one: keep restore's
   skip-and-Preware's-isInstalled behaviour for the 8, while keeping them out
   of whatever the user actually browses. Verify against TEST-PLAN §6 (which
   asserts exactly one stanza per package) and re-run a 3.0.5 → CE restore to
   confirm no patch payload comes back. Related: KNOWN-ISSUES #6.

## Working artifacts

- `webosdoctorp305hstnhwifi.jar` — the OEM 3.0.5 Doctor (the repack base; not in git).
- `out/webosdoctorp305hstnh-3.1CE-600056.jar` — **release candidate 2**.
- `out/webosdoctorp305hstnh-3.1CE-600055.jar` — identical bar the restore
  timeout fix; the build the 100/2 restore was measured on.
- `out/webosdoctorp305hstnh-3.1CE-600052.jar` — the previously built candidate,
  identical bar the de-shadow list and seed-log text; kept as a fallback.
- `out/webosdoctorp305hstnh-3.1CE-600024-rc.jar` — RC1, kept as a fallback.

600053 and 600054 are intermediate bakes, not candidates.

`out/` is gitignored; rebuild with `build/full-ce/bake.py` then
`build/build-ce-doctor.sh overlays/full-ce`.
