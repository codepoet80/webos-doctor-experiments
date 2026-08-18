# webOS CE 3.1 Flash Test Plan

Marked up against **BUILDMARK 600023** (flashed 2026-08-18, `BUILDTIME=20260818113019`).
Legend: `[Pass]` verified this run · `[Fail]` verified broken · `[Human]` needs
eyes/hands on the device · `[n/a]` not applicable to this build. `[Skipped]` human
opted to skip on this test run.
Shell checks assume a novacom root shell (**`luna-send` needs `< /dev/null`** under
novacom, or it exits silently with no output).

---

## RESULTS — 600023

**Both 600022 bugs verified FIXED. One open failure: Luna Restart.**

### BUG 1 — App Catalog shadowed by stock 5.0.2900 — **FIXED, verified**
rootfs catalog is **6.1.2901**, there is **no cryptofs copy at all**, the flat-path
staged ipk is gone from the image, and ipkg has no `enyo-findapps` entry.

### BUG 2 — `ce-cryptofs-seed` hung on `initctl start` — **FIXED, verified**
The whole chain now runs unaided, no manual `kill`:
```
first use not finished -- deferring to first-use-finished   (x2, pre-OOBE)
11:20:35  cryptofs writable after 0s of probing
11:20:35  seeding Preware feeds (its own postinst logic)
11:20:36  feeds seeded: 13 files
11:21:56  seed verified complete on attempt 1
```
Feeds land ~1s after OOBE; the 31MB synergy copy finishes 81s later; 0 ipkgservice
respawns; `imtransport` running with a live bind mount.

### BUG 3 — **Luna Restart freezes the device** *(OPEN — root-caused, fix not yet built)*

**The patch variants are NOT the variable.** All five ipks (en 3.0.5-9, es -9,
de -14, fr -14, it -27) are the *same* 43-line patch to the same file, differing
only in translated button strings and a variable name (`lunaRestartSvc` vs
`srvRestartLuna`). Every one calls `palm://org.webosinternals.ipkgservice`
method `restartLuna`, and **none of them reference SysToolsManager**. The patch we
ship is the right one; there is no "better variant" to switch to.

**What the button actually does** (`luna_methods.c`):
```c
bool restart_luna_method(...) {
  return simple_command(message, "/usr/bin/killall -HUP LunaSysMgr 2>&1");
}
```
The service also offers only `restartJava` (`killall java`) and `restartDevice`
(`/sbin/reboot`) — there is no gentler Luna restart method to switch to.

**Why that kills the device here** (all verified non-invasively on 600023):
1. `killall -HUP` is valid busybox syntax and does fire.
2. LunaSysMgr does **not** catch SIGHUP — `SigCgt: 0000000180010000` is only
   signals 17/32/33 (SIGCHLD + glibc's threading pair), and `SigIgn: 1004` is
   SIGQUIT/SIGPIPE. So SIGHUP takes its default action: **terminate**.
   LunaCE has no `SIGHUP` anywhere in `Src/`.
3. **WebAppMgr is a child of LunaSysMgr** (ppid 5567) but its comm is `WebAppMgr`,
   so `killall LunaSysMgr` does **not** signal it. It survives, reparented to init.
4. The `LunaSysMgr` upstart job has `respawn` but **no `post-stop` cleanup**
   (verified: 0 occurrences), so nothing reaps the orphan before the respawn.

**Hypothesis for the freeze:** upstart respawns LunaSysMgr while the old WebAppMgr
still holds the display/IPC, the new instance cannot come up, and repeated failures
exhaust the 10-respawn limit — at which point upstart sets goal=stop and gives up,
leaving the device dark for good. This matches the 600014 observation exactly
("LunaSysMgr left `(stop) waiting`, goal stop; device dead until
`initctl start LunaSysMgr`").

**Proposed fix (image-side, no recompiling):** add a `post-stop script` to
`/etc/event.d/LunaSysMgr` that reaps a surviving `WebAppMgr` before the respawn.
Upstart runs post-stop when the main process dies, so the respawned instance starts
clean. This would also help ordinary crash recovery, not just this button.
**Not yet implemented** — confirming it requires deliberately triggering the freeze
(recoverable over novacom with `initctl start LunaSysMgr`), so it needs a go-ahead.

Alternative, if preferred: give LunaCE a real SIGHUP handler that shuts down its
child and exits cleanly. That is the "proper" fix but lives in the LunaCE repo and
needs a rebuild.

### Stale expectations corrected in this document
- Thai font is **37KB**, not "~600KB" — upstream now ships a smaller Noto. The
  point of the check (not the stock **9.5MB** font) holds.
- The disabled `webos-patches`/`webos-kernels` feeds carry `/3.0.5` rather than
  `/3.1.0`, because ipkgservice's stock pre-start rewrites them with our pinned
  VERSION. Harmless — they are disabled, and 3.0.5 feeds do exist if enabled.

---

## Automated pass — BUILDMARK 600011, 2026-08-17 (historical, kept for reference)

40 checks passed, 0 real failures (`scripts/ce-test-600011.sh`). First flash to
reach a working state on a **single boot**. Two reported failures dismissed with
evidence: a test-script db8 query bug, and 96 `ls-hubd` errors that were all stock
`com.palm.wifi.carrierhotspot` noise, absent from the stock image too.

---

## First-boot seeding (NEW — the 600019/600020 fixes)

- [Pass] **First-use gate defers the pre-OOBE runs.** `ce-cryptofs-seed.log` shows
  `first use not finished -- deferring` twice (18:06:55 boot, 11:07:31), then the real
  run at 11:20:35. The trigger is no longer swallowed.
- [Pass] **Feeds seed ~1s after the post-OOBE run starts** — `11:20:35 cryptofs
  writable` → `11:20:35 seeding Preware feeds (its own postinst logic)` →
  `11:20:36 feeds seeded: 13 files`. Was 86s, then broken entirely.
- [Pass] **Preware has its feeds out of the box** — 9 enabled + 4 disabled configs,
  no user action, no relaunch needed.
- [Pass] **No ipkgservice respawn storm** — 0 respawns all boot (was 11 → job
  permanently stopped). `ce-ipkg-seed.log` is now empty by design: seeding no longer
  goes through the service's pre-start.
- [Pass] **BUG 2 FIXED — synergy seed completes unaided.** `seed verified complete on
  attempt 1` at 11:21:56 (81s for the 31MB copy), no hang, no manual `kill`.
  glibc 11/11, runtime 13/13, plugins 11/11, flag set.

## 10-minute smoke test

1. [Pass] **OOBE ran and finished** — community flow; no reboot needed; launcher came up.
2. [Pass] **No hotspot login prompt** — *user reported normal Wi-Fi behaviour; not
   explicitly re-checked.*
3. [Pass] **HTTPS browsing** — user confirmed github.com loads.
4. [Pass] **Build identity** — `PRODUCT_VERSION_STRING=webOS CE 3.1.0`,
   `BUILDTIME=20260818113019`, `BUILDMARK=600023`.
5. [Pass] **Keyboard small by default** — user confirmed.
6. [Pass] **BUG 1 FIXED — App Catalog is the baked build.** rootfs 6.1.2901, **no
   cryptofs copy at all**, staged ipk absent from the image, no ipkg status entry.
7. [Skipped] **Controller works** — Bluetooth/USB controller with a game. USB Settings
   app itself confirmed happy by user.
8. [Pass] **LunaCE installed and working** — user confirmed present; Tweaks test passed.
9. [Pass] **Preware knows what's baked** — Preware 1.9.19, Govnah 1.3.9, Synergy
   generic 0.9.3 all `Status: install ok installed`; USB Settings and BT Gamepad
   absent from ipkg (0 hits each), as intended.
10. [Pass] **Advanced Reset Options** — user confirmed present.
11. [Pass] **Core apps launch** — Messaging / Contacts / Accounts. All three are
    baked in rootfs and unshadowed, db8 answers, but *launching* them needs eyes.
12. [Pass] **Synergy runtime alive, unaided** — `ld-linux.so.3` present, 1
    `imlibpurple` process, 1 bind mount, `imtransport` running.
13. [Pass] **Legacy junk gone** — skype app, `skypem`, `com.palm.yahoo`, kindle all absent.
14. [Pass] **Dev mode sticks** — `turnOnNovacomAtStart=true`, `/var/gadget/novacom_enabled`
    present, novacom reachable throughout.
15. [Pass] **webOS Account icon in Settings** — deliberately removed this build
    (`visible:false`); the app is OOBE-only now. Post-OOBE account management moves
    to a separate catalog app.

## OOBE (first boot)

- [Pass] First use boots into the community webOS Account flow (not stock HP)
- [Pass] Card order: language → terms → sign-in → name device
- [Pass] Wi-Fi join popup appears and connects
- [Pass] No spurious hotspot prompt on a normal home network
- [Pass] Terms card loads community terms over HTTPS
- [Pass] Sign-in (or Skip Account Setup) works; completion card shows "Tap Done…"
- [Pass] **Done finishes setup without a reboot** — no software reboot occurred at
  all this boot (`/var/log/reboot-tripwire.log` absent). *Note: the old plan line
  said "Done reboots the device"; the no-reboot OOBE is the intended behaviour now.*
- [Skipped] Non-English OOBE run (localization)

## Core-apps suite

- [Skipped] Messaging launches; new conversations UI
- [Pass] Contacts runs from rootfs — cryptofs copy absent
- [Pass] Phone launches without errors
- [Pass] Accounts (Settings → Accounts) shows SYNERGY ACCOUNTS grouping
- [Pass] No stale stock contacts/messaging/maps staged ipks — all three gone
- [Pass] db8 kinds healthy — `com.palm.person:1` query returns `returnValue: true`
- [Pass] accounts app baked at **3.1.1** (version-sort picked it over 3.1.0)

## Synergy generic runtime

- [Pass] Cryptofs seed present — glibc 11/11, runtime 13/13, plugins 11/11 (unaided)
- [Pass] Seed flag `/var/luna/preferences/ce-cryptofs-seeded` exists
- [Pass] `imtransport` running — 1 `imlibpurple` process
- [Pass] Bind mount live — `mount | grep synergy` → 1
- [Pass] cloud-auth app present; docviewer intentionally excluded
- [Pass] Skype/Yahoo/legacy-Google gone
- [Pass] BT hands-free byte patch — `31 00 00 ea` at offset 119792
- [Pass] Thai font swapped — 37,744 bytes (stock was 9,496,100)
- [Pass] gst plugins present — `libgstopus.so`, `libgstvpx.so` (2/2)
- [Pass] QuickOffice ×2 + Photos installed from the repacked staged ipks;
  `RemoteFileService.js` integration file present in the installed QuickOffice
- [Pass] Photos service patch marker present in rootfs `Utils.js`
- [Skipped] QuickOffice remote-files UI actually opens; Photos app opens

## Preware / Govnah / status seeding

- [Pass] ipkgservice answers — `version` → `1.9.18` in ~1s
- [Pass] Preware 1.9.19 seeded as installed
- [Pass] Govnah 1.3.9 seeded as installed
- [Pass] Synergy generic 0.9.3 seeded as installed
- [Pass] USB Settings and BT Gamepad absent from ipkg status
- [Pass] Status stanzas well-formed, one each, valid `Installed-Time` epochs
- [Pass] **.ipk handler** — download an .ipk in the browser → installs via Preware
  with no association prompt
- [Pass] Installing a real package via Preware works — user installed Tweaks
  successfully (its stanza joined the seeded ones cleanly)
- [Pass] `webos-patches` / `webos-kernels` now ship **disabled** (7 enabled + 6
  disabled configs), so they no longer fail on every feed update. This is Preware's
  own postinst logic doing it, not our hand-copied list.
  *Minor:* the disabled feeds carry `/3.0.5` because ipkgservice's stock pre-start
  rewrites them with our pinned VERSION. Harmless (they are disabled, and 3.0.5
  feeds actually exist if a user enables them), but inconsistent with the 3.1.0 the
  seed script writes.

## CE platform tweaks

- [Pass] Device Info shows webOS CE 3.1.0
- [Pass] `BUILDTIME=20260818113019`, `BUILDMARK=600023`
- [Pass] Developer mode on; `turnOnNovacomAtStart=true`; `/var/gadget/novacom_enabled` present
- [Pass] Keyboard small by default (user confirmed)
- [Pass] Tweaks installs and LunaCE toggles work (user confirmed)
- [Skipped] Captive-portal network → portal page loads from the archive-pointed webview

## Regressions from earlier validated flashes

- [Pass] Browser loads modern HTTPS (user confirmed)
- [Pass] App Catalog — now the baked 6.1.2901, no cryptofs shadow. BUG 1 fixed.
- [Pass] Maps 4.0.1 opens (baked in rootfs, staged 3.0.1 ipk removed)
- [Skipped] Email syncs (mail TLS stack)
- [Pass] Help app repointed at help.webosarchive.org
- [Skipped] BT gamepad pairs
- [Pass] USB Settings works (user confirmed); Govnah/USB on the Settings tab
- [Pass] Wallpapers + ringtones in `/media/internal` — 34 wallpapers, 40 ringtones;
  default wallpaper correct (user confirmed)
- [Pass] Advanced reset options present (user confirmed); [Fail] Luna Restart button
    - Luna Restart freezes device!
- [Pass] Kindle/Facebook/YouTube preloads absent; 0 staged customization ipks left
- [Pass] `ls-hubd` — only 2 unlisted-service errors this boot, both
  `com.palm.wifi.carrierhotspot` (stock noise; that service file is absent from the
  stock image too, so it is not a CE regression)
- [Pass] Trust store intact — 190 `.pem` + 380 total entries in
  `/etc/ssl/certs/trustedcerts`, `/var/ssl/trustedcerts` populated (190),
  `ca-certificates.crt` 289,320 bytes
- [Pass] Version-prefix patch — zero `"HP webOS "` left in LunaSysMgr,
  libWebKitLuna.so, mediaserver, media-pipeline.real
- [Pass] No software reboot this boot (tripwire log absent); **0 crash reports**

## Still needs a human (short list for the next session)

1. **Luna Restart (BUG 3)** — decide the fix (post-stop reaper vs. LunaCE SIGHUP
   handler), then verify. Verification means deliberately triggering the freeze;
   recover with `initctl start LunaSysMgr` over novacom.
2. Controller pairing (BT/USB) with a game.
3. Email sync, QuickOffice remote-files UI, Photos app.
4. Non-English OOBE run (localization).
5. Captive-portal network → portal page from the archive-pointed webview.

Everything else in this document is verified on 600023.

## If something is off — first places to look

- `/var/log/messages` (upstart output, ls-hubd rejections, app-install)
- `/var/log/ce-*.log` (every CE job logs; absence of a log is itself a signal)
- `/media/cryptofs/imstdout.log` (Synergy transport)
- `initctl list | grep ce-` and `ls /var/luna/preferences/ce-*` (which CE jobs ran)
- A job stuck in `(start) running` for minutes: check its children for a blocked
  `initctl` — see BUG 2
- Before any `tellbootie recover`: **run `sync` first** (cryptofs corruption hazard)
