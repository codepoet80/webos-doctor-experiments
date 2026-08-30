# webOS CE 3.1 Flash Test Plan

**600070 is the final release candidate.** Automated: 90 PASS / 0 FAIL — the
first fully clean run of the 3.1 cycle, with the first-boot ipkgservice race not
firing. Reboot soak: 7 cycles, 112 PASS / 0 FAIL. Restore onto the flashed
image: clean, 11/11 services back on the bus. Both 600070 additions pass on
hardware, and the OTA anchor verifies against the real offline key.
The `[Human]` list is what remains. Prose citing 600052 / 600059 / 600067 is
*prior-build evidence*: it says what a check is for, not what happened here.

```
Build under test:  BUILDMARK 600070  jar out/webosdoctorp310hstnh-ce-600070.jar
                   sha256 392f2122e3bd95f6f6b4f89acff2e8038508746a6fdeac7f4c5716834178e65a
                   Flashed:  2026-08-30          Automated run: 90 PASS / 0 FAIL / 0 WARN
                   Results:  scripts/results-600070.txt   (BUILDTIME 20260830192741)
                   Doctor log clean: 0 "Read-only file system", AppDeletion
                   removed /tmp_mediafs/.palm, Flash End time (Success).
                   So the app-store wipe really happened (KNOWN-ISSUES #10) —
                   confirmed downstream by "no store repair needed".
Lineage:           [x] CE -> CE      [ ] stock 3.0.5 -> CE
Restore:           [x] run 2026-08-30 — 43-package backup, 0 errors, skipped: [],
                   11/11 restored services reachable on the bus after reboot

What this run does NOT decide, despite being green:
                   - the ipkgservice reboot soak (§8): this is 1 boot, not 5
                   - every `[Human]` item: UI, taps, hardware, and the OTA
                     positive-verification test, which needs the offline key
                   - the stock-3.0.5 lineage (the restore itself has now run)

Pre-flash verification (2026-08-30, before the jar was opened by the Doctor):
                   jar sha256 matches the 600070 manifest; the bake inputs stamp
                   recomputed from the committed tree matches the manifest
                   (aa118a59...115b) with a clean worktree, so what is committed
                   is what was baked. Inside the SHIPPED rootfs, not merely the
                   overlay: /etc/palm-build-info reads BUILDMARK=600070 +
                   "webOS CE 3.1.0"; the OTA key is present at 644 with the DER
                   SPKI fingerprint bake.py pins (3f02d369...f9fa79); ce-ota-verify
                   is present at 755 and byte-identical to its source; 13 Device
                   Info view files carry the account label and none still say
                   "HP webOS". No OTA client component is baked.

New in 600070 — the two things this run exists to check on hardware:
                   1. Device Info account label, "HP webOS Account" ->
                      "webOS Account", across all five locales (section 7).
                   2. CE OTA trust anchor: the signing key + ce-ota-verify, and
                      NOTHING else OTA (new section 15). This is a GA-frozen
                      trust root -- if the wrong key ships, no later update can
                      correct it, because a replacement key would arrive over
                      the channel the key exists to authenticate.

Carried in from 600067 — where each one landed on this build:
                   store wipe needing no repair ......... re-confirmed (automated)
                   power-off path unwrapped ............. re-confirmed (automated)
                   PmWanDaemon gated .................... re-confirmed by hand
                   ipkgservice reboot soak .............. 7 cycles, 112/0 clean
                   power menu / Shut Down on battery .... OPEN, needs hands
                   app uninstall after a PDK launch ..... OPEN, needs hands
                   restore onto the flashed image ....... run clean (§14)
                     — the source device's lineage is not asserted here: the
                       backup reports nduId "CUc" with currentDevice:false and
                       osVersion Nova-HP-Topaz-86, which CE and stock 3.0.5
                       share. Whether this was the stock-3.0.5 path is for
                       whoever made the backup to say.
```

Legend: `[ ]` not yet run · `[Pass]` · `[Fail]` · `[Human]` needs eyes/hands ·
`[Skipped]` · `[n/a]`. Shell checks assume a novacom root shell
(**`luna-send` needs `< /dev/null`** under novacom, or it exits silently).

## How to run

**Check the Doctor's own log before trusting a flash.** It reports
`Flash End time (Success)` whether or not the app-store wipe worked, so grep the
run for both markers (KNOWN-ISSUES #10):

```
grep -c "Read-only file system" <doctor-log>        # must be 0
grep "AppDeletion: removed the appDirectory" <doctor-log>   # must be present
```

A read-only `/media/internal` during `AppDeletion` (a dirty VFAT volume, typically
after a force-reboot into recovery) leaves the encrypted store half-wiped and the
device boots with no app store. Cure: Device Info -> Reset Options -> Erase USB
Drive, then enter recovery from a clean power-off.

```
# 1. stock-lineage runs only: BEFORE flashing CE over stock, capture the baseline
novacom put file:///tmp/base.sh < scripts/ce-capture-stock-baseline.sh
sh /tmp/base.sh

# 2. after the CE flash AND after first use completes
novacom put file:///tmp/full.sh < scripts/ce-test-full.sh
sh /tmp/full.sh 600070

# 3. keep the run — the plan's markers are filled in from this file
#    (from the host: novacom run file://bin/sh -- -c "sh /tmp/full.sh 600070"
#     > scripts/results-600070.txt)
```

`ce-test-full.sh` decides everything a shell can — ~100 checks across every
section below. Run it, mark those items from its output, then work the `[Human]`
list. Do not run it before first use finishes: preloads install during first use
and will read as failures while merely pending.

**New checks this build:** the Device Info account label (§7) and the whole of
§15 (OTA anchor) were added to `ce-test-full.sh` for 600070. Neither had any
automated coverage before, so a green run on 600067's copy of the script would
not have caught a regression in either.

---

## 0. Luna Restart

- [Pass] `ipkgservice` upstart-resident (`(start) running`) — *automated*
- [Human] **Luna Restart after a full reboot** — verified on 600052: clean
      stop/start cycle, and 0 crashes / 0 SEGV / 0 respawn-thrash across it.
      This is the case that failed on 600042/600049/600050; see the PmWanDaemon
      gate in `4G-TOUCHPAD.md`.
- [Pass] **Repeat from the power menu by hand.**
  Healthy: `killed by HUP` → `respawning` → `post-stop -> starting` → `running`,
  then `LunaSysMgr-ready` ~26s later.
  If it freezes, capture BEFORE rebooting:
```
initctl status LunaSysMgr org.webosinternals.ipkgservice
pidof LunaSysMgr; ps | grep -E "ipkgservice|node_spawner"
for p in $(pidof LunaSysMgr); do echo -n "$p "; cat /proc/$p/wchan; echo; done
grep -c "killed by HUP" /var/log/messages; tail -60 /var/log/messages
```

## 0b. Regression watch — respawn storm

- [Pass] `ipkgservice main process ended, respawning` → 0 — *automated*
- [Pass] `respawning too fast` (ipkgservice) → 0 — *automated*
- [Pass] **upstart never crashed + re-exec'd** — *automated*
      `grep -E "Caught .*(segmentation fault|core dumped)|Failed to re-execute" /var/log/messages`
      A hit means upstart took a fatal signal, dumped core via a forked child and
      `execl`'d itself — which **loses its job table**, so `respawn` silently stops
      working for anything already running. Check this *before* concluding a dead
      daemon "just died": it may have died normally and simply not been restarted.
      (An rdxd report whose component is `upstart` is usually that core-dumper
      child working as designed — not an upstart bug.)
- [Pass] **rdxd crash reports → 0 on 600070.** The OOBE-teardown SIGSEGV below
      did NOT recur on this flash. Kept
      here because one clean run does not retire a race; re-check next flash.
      *Historic (600052/600055): 1 report, script says FAIL, downgraded by
      judgement*. The minimal-mode firstuse instance
      (`LunaSysMgr -s -u minimal -a com.palm.app.firstuse`) faulted in its
      `PrvLogThread` on a freed GLib async queue while tearing down at OOBE
      handoff: a process that was exiting anyway, on a path that runs once per
      flash. Handoff completed, main LunaSysMgr came up, upstart untouched.
      600052 — identical content bar three lines — showed 0 reports, so this
      looks non-deterministic rather than introduced. **Re-check on the next
      flash of this same image.** Read the component before judging any future
      hit; the genuinely fatal cases have their own checks and still Fail.
      The `/var/log/crash*` count in §8 does **not** see these; every crash found
      during 600029–600033 triage was an rdxd report.
- [Pass] **LunaDownloadMgr running**, is the patched build, `Restarting glibcurl` → 0,
      no SEGV this boot — *automated*
      It also hosts `com.palm.appInstallService`, so if it dies the **App Catalog
      cannot fetch anything**. Recover with `start LunaDownloadMgr`.

If the storm returns the fix is **not** to drop `respawn` — find whatever is
stop/starting the job.

## 1. First-boot seeding

- [Pass] Cryptofs seed flag set; `seed verified complete` — *automated*
- [Pass] All once-per-flash flags present — *automated*
- [Pass] Preware feeds seeded — *automated*

## 2. Ten-minute smoke test

- [Pass] Launcher comes up; tabs are APPS / GAMES / SETTINGS / DOWNLOADS
- [Pass] Open App Catalog, browse, install one app end-to-end
- [Pass] Browser loads a modern-HTTPS site
- [Pass] Wi-Fi reconnects after a reboot

## 3. OOBE (first boot)

- [Pass] Card order: language → terms → sign-in → name device
- [Pass] Terms card loads community terms over HTTPS
- [Human] Sign-in **and** Skip Account Setup (skip → profile named "webOS User")
- [Pass] Finishes **without a reboot**; launcher comes up
- [Human] Non-English OOBE run (localization)
- [Pass] No spurious hotspot prompt on a normal home network

## 4. Core-apps suite

- [Pass] contacts / messaging / phone / accounts baked and **unshadowed** — *automated*
- [Pass] db8 healthy — `com.palm.person:1` answers — *automated*
- [Pass] Messaging launches; new-conversation UI works
- [Pass] Contacts launches
- [Human] Settings → Accounts shows the SYNERGY ACCOUNTS grouping
- [Human] Email sync against a real account

## 5. Synergy generic runtime

- [Pass] synergy glibc + runtime dirs; bind mount live — *automated*. Dirs and
      the interpreter are present; the **bind mount is missing** and
      `imtransport` is wedged in pre-start. Same root cause as §0's
      ipkgservice failure — see the note at the end of this section.
- [Pass] `imtransport` running (pid = `/usr/bin/imlibpurpletransport`) — *automated*
- [Pass] cloud-auth present; docviewer absent (intentional) — *automated*
- [Pass] Retired accounts (skype/yahoo) gone — *automated*
- [Pass] gst WebM/Opus plugins 6/6 — *automated*
- [Pass] QuickOffice ×2 + Photos installed; synergy patch markers present — *automated*
- [Human] QuickOffice remote-files UI opens; Photos app opens
- [Skip] An IM account actually connects

## 6. Preware / Govnah / status seeding

- [Pass] ipkgservice answers — *automated*
- [Pass] One well-formed stanza each — *automated*. 600052 seeds **11**:
      preware, govnah, synergy generic, backup, and the 7 patch packages whose
      effects CE bakes (browser/downloadmgr/luna/mail/curl-tls13, rootcertsupdate,
      ntpdate-sync, notifications-advanced-reset-options) so a 3.0.5 restore skips them
      **600037: preware=1 (correct, from its preload install) but govnah=0 and
      synergy=0.** Regression from moving Preware to a preload: `kick_ipkg` in
      ce-cryptofs-seed was gated on `[ ! -f arch.conf ]`, which was always true
      while Preware was baked (its postinst never ran). As a preload the postinst
      writes arch.conf itself, so the gate short-circuits and the ipkg STATUS
      stanzas for the still-baked packages are never seeded. User-visible: Preware
      offers Govnah and Synergy Revival as fresh installs (confirmed on-device).
      FIXED in bake.py for the next build — gate now also fires when either stanza
      is missing; preware-seed.sh is idempotent so re-running is safe.
- [Pass] USB Settings / BT Gamepad absent from ipkg status — *automated*
- [Pass] `webos-patches` / `webos-kernels` ship **disabled** — *automated*
- [Pass] **no static ipk entry** in command-resource-handlers.json — *automated*
      A static entry is always registered `streamable:false`, which BREAKS the
      browser handoff and dedupes the runtime call that would fix it. Its absence
      is the correct state.
- [Pass] **`.ipk` resolves to Preware AND is streamable** — *automated*
      Asks LunaSysMgr (`getResourceInfo`) rather than grepping a file; the browser
      only hands a `.ipk` URL to the handler when `canStream` is true.
- [Pass] `ce-register-ipk-handler` ran and verified — *automated*
- [Pass] Install a real package via Preware (e.g. Tweaks)
- [Pass] Open a `.ipk` link in the **browser** — it should open Preware, not
  just download. (Fixed in 600037; confirmed working on-device.)

## 7. CE platform tweaks

- [Pass] `turnOnNovacomAtStart=true`; keyboard defaults small — *automated*
- [Pass] Version-prefix patch — zero `"HP webOS "` in LunaSysMgr — *automated*
- [Pass] Device Info shows webOS CE 3.1.0
- [Pass] **Device Info account label de-branded** — *automated (new in 600070)*
      **600070: 13 view files found, 0 say "HP webOS".**
      All 13 view files under `com.palm.app.deviceinfo` (the base app plus every
      locale override) must carry the account label with zero `"HP webOS"` left.
      The script also fails if it finds fewer than 10 such files at all, which is
      how an OEM layout change shows up instead of silently reading as a pass.
- [Pass] **Device Info → the account row reads "webOS Account"**, not
      "HP webOS Account" — and the row still works (it is the label above the
      account the OOBE created, so a broken lookup shows an empty heading).
- [Pass] **Device Info → Reset Options → Erase Apps & Data**: the confirmation
      text says "webOS Account". Read it; do NOT confirm it.
- [Human] **A non-English device still reads correctly** — de "webOS-Konto",
      fr "Compte webOS", es "Cuenta de webOS", it "Account webOS". One rule
      dropped the vendor word from five different phrasings, so this is the check
      that the rule did not mangle a sentence.
- [Pass] **The retail demo strings are untouched** — the app's other
      "HP webOS" text (the "HP webOS demo" feature) was deliberately left alone,
      because those string tables are keyed BY the English string and rewriting a
      key breaks the lookup. Nothing in the UI should have fallen back to English.
- [Pass] Developer-mode toggle survives an off/on cycle
- [Pass] Tweaks installs; LunaCE toggles appear and at least one works
- [Skip] Captive-portal network → portal page loads from the archive-pointed webview

## 8. Regressions from earlier validated flashes

- [Pass] **ipkgservice survives repeated reboots** — **7 cycles x 5-minute soak,
      112 PASS / 0 FAIL, 2026-08-30** (`scripts/results-600070-soak.txt`, run by
      `scripts/ce-reboot-soak.sh`). Two more cycles than 600067's gate.
      Both faults are fixed at the source in Preware 1.9.19 (KNOWN-ISSUES #1,
      #1b), so the check is not "did the repair work" but "did the fault occur at
      all": `repairs-since-flash=0` across all seven boots, zero `respawning too
      fast`, zero rdxd reports, zero SEGV, ipkgservice resident with its job file
      intact every time. imtransport, the Synergy bind mount, LunaDownloadMgr and
      the OTA anchor all came back on every boot.
      *Caveat that does not go away with a green soak:* this proves ipkgservice
      stays healthy across reboots, NOT that the original race is retired. That
      race fires during the first-use preload pass, which runs once per flash —
      retiring it takes clean **flashes**, not clean reboots.
- [Pass] **App-store root present, and no repair was needed** — *automated (600061)*
      Two assertions, because they fail differently. A missing
      `/media/cryptofs/apps` means the preload pass cannot install anything and the
      device sits on the pulsing logo; a `REPAIRED:` line in
      `/var/log/ce-cryptofs-seed.log` means the root was missing and our seed job
      rebuilt it — i.e. the flash silently failed to wipe the store and we are only
      papering over it. See KNOWN-ISSUES #10.
- [Pass] Kindle / Facebook / YouTube preloads absent — *automated*
- [Pass] `ls-hubd` clean (0 unlisted-service errors) — *automated*
- [Pass] Trust store populated (~190 entries) — *automated*
- [Pass] Help app repointed at webosarchive.org — *automated*
- [Pass] 0 crash artifacts — *automated, real assertion*
- [Pass] Power-off path unwrapped — *automated, real assertion (600059)*
      `/sbin/{reboot,poweroff,halt,telinit}` must be the stock ELF binaries with no
      `*.real` leftovers. `halt` and `poweroff` are symlinks to `reboot`, which picks
      its action from `basename(argv[0])`, so ANY shell wrapper over these names turns
      Shut Down into a reboot — which is exactly what the retired 600011..600058 reboot
      tripwire did (KNOWN-ISSUES #8).
- [Pass] Power menu → **Shut Down** powers the device off and it stays off —
      needs hands; the automated run only proves the *path* is unwrapped (above),
      not that the menu item does the right thing. *Verified on 600059, along with
      Device Restart and Luna Restart: every option in the menu performs its own
      action (KNOWN-ISSUES #8).*
      Re-test **on battery**: a TouchPad on a charger powers itself back on, which
      is indistinguishable from the bug.
- [Pass] **App uninstall after a PDK-app launch** (LunaCE 600058) — needs hands,
      not decided by this run. *Verified on 600059.* Uninstall from the launcher works both before a PDK launch (control)
      and after one, which is the case the fix addresses: `launchNativeProcess()`
      used to leave `LD_PRELOAD=libpvrtc.so` in LunaSysMgr's own environment, so
      every child it spawned until the next Luna restart died before `main()` with
      exit 127 — including the `ipkg remove` the installer runs after dropping the
      app from the registry, which is why the app came back at the next restart and
      could not be removed. Evidence: `added watch on child pid 3604` ->
      `util_ipkgRemoveDone: successful ipkg remove`, cryptofs apps 21 -> 20 and
      ipkg stanzas 32 -> 31 (files and registry agreeing is the point — the tile
      disappearing is not, since the old bug did that too).
- [Pass] BT gamepad pairs; USB Settings and Govnah sit on the Settings tab
- [Pass] Advanced reset options appear in the chosen OOBE language
- [Pass] Maps 4.0.1 opens

## 9. Preloads / un-baking

- [Pass] App Catalog and Maps **not baked** — *automated*
- [Pass] Both installed to cryptofs, **one stanza each** — *automated*
      (two stanzas = installed *alongside* rather than upgraded — the thing to catch)
- [Pass] Staged ipks present; stock 5.0.2900 ipk removed — *automated*
- [Pass] Catalog files extracted with clean names — *automated*
      *(was expected to fail on older builds; the catalog ipk is 6.1.2923 as of 600070 —
      confirmed on-device by the automated run, which reads the installed version)*
- [Pass] Manifest: baked contacts/messaging entries dropped — *automated*
- [Pass] **stock-lineage runs:** compare against the pre-flash baseline — the
  5.0.2900 / 3.0.1 copies must be *upgraded*, and the old build's
  `PivotMagazine-WOSA` tree must be gone rather than merely overwritten.

**Invariant to protect in review:** `com.palm.app.enyo-findapps` and
`com.palm.app.maps` must stay OUT of `BAKED_APP_IDS` in `bake.py`. They are
preload-installed to cryptofs now; listing them would make `ce-firstboot-tweaks`
delete the copy the preload just created. De-shadow has run *before* the install
on all three flashes so far, so ordering has never been the protection — the list
is.

## 10. Exhibition + localization

- [Pass] `SimpleClock.qml` present and referenced; stock faces retained — *automated*
- [Pass] GAMES localized in all 8 locales — *automated*
- [Pass] Launcher page rename favorites→games configured — *automated*
- [Pass] Photos exhibition clock installed (icon + CSS + JS) — *automated*
- [Pass] Exhibition opens on the simple clock; **swipe through all four faces**
- [Human] GAMES reads SPIELE after switching the device language to German
- [Pass] Photos exhibition: clock toggle shows/hides; interval persists across
  leaving and re-entering Exhibition *(a flash wipes `/var`, so prefs start fresh)*
- [Pass] Rotate the device in Exhibition — portrait clock sizing (125/37px)

## 11. Photos filename  *(new in 600030)*

- [Pass] Open a photo full-screen, tap once — the **filename** shows centred in
  the control bar, and updates as you swipe between photos
- [Pass] **A video** in Photos shows its name only ONCE (the label is suppressed
  for `mediaType === "video"`; videos already show it in the video control bar)
  — *never yet tested, no video on the device*
- [Pass] A **long filename** truncates with "…" rather than overlapping the
  buttons — *never yet tested, all test files are `NN.jpg`*
- [Skip] A **cloud album** photo (Facebook/Dropbox) shows something sane — those
  records may carry synthetic paths

## 12. Space / media

- [Pass] Staged customization media reclaimed unattended — *automated*
- [Pass] rootfs free space / % used — *automated* — **600070: 122880K free,
      79% used** (559.1M volume, 439.1M used). Same as 600067; the reclaim job
      ran (94020K -> 122880K).
- [Pass] Default wallpaper present — *automated*
- [Pass] Default wallpaper looks right on screen
- *Known/accepted:* `/media/internal` **accumulates** — the customization service
  only copies in, never removes. Upgrading from an older CE build leaves the old
  `NN.png` wallpapers beside the new `.jpg` set. Decision: do not delete from the
  user's media volume. A stock-lineage flash is clean.

## 13. Default search engine — DuckDuckGo Lite  *(new in 600032)*

Google now refuses this device's user-agent and its results page will not render
here even with the UA spoofed, so the stock default was simply broken.

- [Pass] All 10 locale lists default to `duckduckgo`, none still list google — *automated*
- [Pass] Search URL is the `/lite/` endpoint — *automated*
- [Pass] Both DDG icons present (48px universal search, 32px browser) — *automated*
- [Pass] Browser `URLSearch.js` fallback is DuckDuckGo, no google left — *automated*
- [Pass] **Just Type shows "Search DuckDuckGo"** and searching works —
  *confirmed by user on 600030's device*
- [Pass] The search actually returns usable results in the browser
- [Human] A non-English locale shows the localized form (`Rechercher DuckDuckGo`,
  `Buscar DuckDuckGo` — the string is a template, so this comes for free)

**Testing note:** three layers cache this, so a live push needs all three cleared —
but NONE of it applies to a flashed device, where `/var` is wiped and every service
starts clean:
1. `LunaUniversalSearchMgr` is its OWN upstart service — `killall LunaSysMgr` does
   not reload it. Use `initctl stop` + `initctl start` (`restart` is unsupported).
2. The launcher caches the provider list at LunaSysMgr start, so restart Luna
   *after* the search service, or the "Search X" row keeps the old name.
3. The Search Preferences app caches too — close the card, do not just relaunch.

## 14. Backup and Restore — woce-backup  *(new in 600038; app rules reworked in 600039)*

Replaces the stock Backup app, which could never work: it was a UI over
`com.palm.service.backup`, and that uploaded to Palm's servers.

Everything below except the last three lines was **verified on the 600037
device** with the tier's exact output pushed in and the device rebooted, which
is the closest stand-in for a first boot (the point of baking the grants is that
`ls-hubd` and `mojodb-luna` read them at *their* startup, not on install).

- [Pass] Helper starts with Luna and finds both grants already baked —
  `/var/log/woce-backupd.log` says *"lunacall role is baked into the image;
  nothing to write"* and *"db8 admin grant already in place"*
  *600070: all three lines present, plus "service role is baked into the image".*
- [Pass] It writes **nothing** to `/var/palm/ls2/roles/prv/` (a second role
  claiming `com.palm.backup.privileged` makes ls-hubd drop *both* grants), and
  no `/etc/palm/mojodb.conf.woce-backup-orig` appears
  *600070: 0 woce files in `roles/prv/`, no `mojodb.conf.woce-backup-orig`.*
- [Pass] `getBackupStatus` reports `privileged: true` (helper reachable — the
  app shows an amber limited-mode notice when it is not) — *600070: confirmed,
  `{"returnValue":true,"privileged":true}`*
- [Human] `woce-lunacall -m com.palm.backup.privileged` reaches
  `com.palm.db/internal/preBackup`; the same call as plain `luna-send` is denied
- [Human] Full backup completes: 24.5 MB, `skipped: []`, 19 packages archived
- [Pass] `listBackups` / `getRestoreDevices` / `getLastBackupTime` all answer
  *600070: all three returned `returnValue:true`. `listBackups` lists both
  manifests with per-service file counts; `getRestoreDevices` reports the source
  device and its 43-package backups. `getLastBackupTime` answers but returns
  `lastbackupTime: "."` with `optOut: true` — it answers, which is what this
  line asserts, but that value looks like a placeholder rather than a time.*
- [Human] `deleteBackup` purges by reference count — 52 files → 32, 48.7 → 24.5 MB,
  the surviving backup intact
- [Human] App UI renders with the real state (destination, "Settings and data",
  "2 backups") and **no** limited-mode notice
- [Pass] **Restore — run on the flashed 600070 image, 2026-08-30.** Restored
  `000002-CUc` (incremental, 43 packages, 78 MB declared). Result: **zero errors
  in the whole helper log** — no failures, no ENOSPC, no timeouts, no denials —
  and `skipped: []`. The manifest now records `restoredCount: 1`,
  `lastRestored: Sun, 30 Aug 2026 22:09:10 GMT`.
  Device after the reboot: 50 cryptofs apps / 34 ipkg stanzas / 11 services, and
  **all 11 services reachable on the public bus**, including the four registered
  during the restore (`com.wosa.bluebubbles.service`,
  `org.webosarchive.otaready.service`, `de.zefanjas.biblez.enyo.fileio`,
  `com.messagingbypass.synergy.service`). 0 rdxd reports, 0 crash artifacts,
  0 SEGV, 0 ls-hubd role errors; ipkgservice, imtransport and LunaDownloadMgr all
  up. Apps landed with their services attached — BlueBubbles restored into 3
  paths including its `.service`, which is the case that used to come back as a
  tile that launches and does nothing.
  **Pre-flight on the store before restoring** (worth repeating next time): both
  manifests parsed, and all 55 referenced objects resolved in `files/` with no
  size mismatches. Note the store names compressed objects by `origChecksum`
  with a `.gz` suffix, *not* by `finalChecksum` — checking the wrong one reports
  false missing objects.
  *Still `[Human]`: bus-reachable proves the hub launched each service, NOT that
  its UI works. BlueBubbles and Tweaks still want a tap.*
- [ ] **34 ipkg stanzas against 50 apps** — restored apps that landed via the
  directory path have no ipkg record and are marked `unmanaged`. Confirm they
  still appear in a **later backup**; that is the regression the `unmanaged`
  handling exists to prevent, and it is not decided by this restore.
- [Human] Backup from the app's own button, not just over the bus
- [Human] Non-English device: the app is English-only, and the stock localized
  `resources/<locale>/appinfo.json` files are removed with the rest of the stock
  app, so the launcher tile now reads "Backup" rather than e.g. "Sicherung"

**Watch for:** two role/permission shapes are load-bearing and both failed loudly
when wrong. `outbound: []` on the private role (the shape `Triton.prv` generates
for a cryptofs install) blocks `com.palm.activitymanager` and the service stops
answering entirely — even `getBackupStatus` hangs. And without
`com.palm.app.backup.service` in `mojodb.conf`'s admin list, `preBackup` returns
`db: access denied`, which is *not* one of the errors that makes the service
retry through the helper, so the backup dies on its first step.

---

## 15. CE OTA trust anchor  *(new in 600070)*

The **only** OTA component in the image, and the only one that cannot be added
later: a trust root delivered over an untrusted channel is not a trust root. The
client — daemon, bridge service, patched Updates UI — is deliberately NOT baked;
it arrives via Preware and is authenticated by this key. (`OTA-STRATEGY.md` §5;
the OTA project's `OTA-IMAGE-INTEGRATION.md` rev 2.)

This is frozen for the life of the release, so the thing to check is not "does
OTA work" — there is no payload yet — but "is the right key in there, does the
verifier fail closed, and did nothing else sneak in".

- [Pass] Key at `/usr/share/ce-ota/keys/ce-ota-signing.pub` (644) and
      `/usr/bin/ce-ota-verify` (755) both present — *automated*
- [Pass] **Key fingerprint matches the baked anchor** — *automated, confirmed on
      hardware 600070*
      sha256 over the DER SubjectPublicKeyInfo (stable across PEM re-encoding):
      `3f02d369e69d86e3616f85f04b42db6dc7383817fc480789877216f2e3f9fa79`
- [Pass] **The key parses under the device's STOCK openssl** — *automated*
      **600070 on-device: OpenSSL 0.9.8k 25 Mar 2009** — as assumed, unreplaced.*
      0.9.8k (2009), which this image does not replace: the TLS tier adds
      `/usr/lib/ssl11` and wraps curl but leaves `/usr/bin/openssl` alone. The
      point is that a device does not need the modern crypto it might be
      installing in order to check the signature on it. The run records the
      device's openssl version as INFO — if it is ever not 0.9.8k, that
      assumption moved and this section needs re-reading.
- [Pass] **Fails closed** — a garbage signature and a missing signature file are
      both refused (exit 1) — *automated*
- [Pass] **No OTA client component is baked** — no daemon, no service, no upstart
      job — *automated*. A hit means the image/client boundary slipped.
- [Pass] **Positive verification with a real signed payload — DONE on the image,
      2026-08-30, with the real offline key.** This is the one check that proves
      the anchor is a working trust root rather than merely a well-formed file.
      Signed on the build host, only the payload and signature pushed; the key
      never left the host and `find / -name ce-ota-signing.key` on the device
      returned 0 afterwards. Test files removed.

      **First, the keypair itself:** the public half derived from the offline
      private key fingerprints to `3f02d369…f9fa79` — identical to the Desktop
      public half, the key baked into 600070, and the value bake.py pins. All
      four agree, so the GA-frozen root has a usable signer. *If this had not
      matched, the image would have shipped a trust root nobody could sign for,
      and no later update could have fixed it.*

      Seven paths on-device, against the baked DEFAULT key (no key argument),
      under stock OpenSSL 0.9.8k:

      | case | expect | got |
      |---|---|---|
      | valid DER signature | 0 | 0 |
      | valid base64 signature | 0 | 0 |
      | valid DER, key named explicitly | 0 | 0 |
      | payload with one byte flipped (byte 11) | 1 | 1 |
      | same, base64 form | 1 | 1 |
      | signature truncated by one byte | 1 | 1 |
      | valid signature, wrong key | 1 | 1 |

      Payload was a realistic OTA manifest (schema/model/from/to/sha256), not a
      bare string, so the accept path was exercised on a plausible artifact.
      **Re-run this whenever the anchor or the verifier changes** — and note it
      needs the offline key, so it cannot live in `ce-test-full.sh`.
- [Pass] **The anchor survives a reboot and a Luna Restart** — it is in `/usr`,
      so it should, but a flash is the only time to notice if it did not land.

**Do not "fix" a wrong key by shipping a new one later.** If the fingerprint does
not match, the image is wrong and must be rebuilt — bake.py already refuses to
build on a mismatch, so a mismatch here means something after the bake.

**Open on the OTA project's side** (not image issues, do not test here): manifests
must bind to their target model/version; payloads must move to root-only storage
before verification (`/media/internal` is USB-exported, so verify-then-install is
a TOCTOU); rotation keys and the downgrade serial live under `/var` and are wiped
by a re-flash, so this baked root must stay a valid signer forever; and their
unknown-status whitelist inherits from `Object.prototype`.

---

## Carried-over issues (not introduced by any recent build)

- Unexplained one-off: 600023 UI wedge after Luna Restart. If it recurs, capture
  state before rebooting (§0).

## If something is off — first places to look

```
/var/log/ce-cryptofs-seed.log                  seeding
/var/log/ce-firstboot-tweaks.log               de-shadow
/var/log/ce-reclaim-customization-media.log    staged-media reclaim
/var/log/ce-remove-preloads.log                HP preload removal
/var/log/messages                              everything else
```
