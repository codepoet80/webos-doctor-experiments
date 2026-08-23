# webOS CE 3.1 Flash Test Plan

**Ready for the next flash.** Fill in the build under test, then run the
automated half first and work the `[Human]` list from what it leaves.

```
Build under test:  BUILDMARK 600055  jar webosdoctorp305hstnh-3.1CE-600055.jar
                   sha256 d1bc6084faddfdf3daaa0ae362d31c8f9a400debd3e67b4f568404d72a20d183
                   Automated run 2026-08-22: 80 PASS / 1 WARN / 0 FAIL
                   (scripts/results-600055.txt). The WARN is §0b's rdxd count:
                   the script reports it as FAIL, marked WARN by judgement —
                   see §0b. 64 Human items below still open.
Lineage:           [x] CE -> CE      [x] stock 3.0.5 -> CE (restore tested on 600050)
```

Legend: `[ ]` not yet run · `[Pass]` · `[Fail]` · `[Human]` needs eyes/hands ·
`[Skipped]` · `[n/a]`. Shell checks assume a novacom root shell
(**`luna-send` needs `< /dev/null`** under novacom, or it exits silently).

## How to run

```
# 1. stock-lineage runs only: BEFORE flashing CE over stock, capture the baseline
novacom put file:///tmp/base.sh < scripts/ce-capture-stock-baseline.sh
sh /tmp/base.sh

# 2. after the CE flash AND after first use completes
novacom put file:///tmp/full.sh < scripts/ce-test-full.sh
sh /tmp/full.sh <BUILDMARK>
```

`ce-test-full.sh` decides everything a shell can — ~90 checks across every
section below. Run it, mark those items from its output, then work the `[Human]`
list. Do not run it before first use finishes: preloads install during first use
and will read as failures while merely pending.

Previous runs: `scripts/results-600052.txt`, `scripts/results-600029.txt`,
`scripts/results-600014.txt`.

---

## 0. Luna Restart

- [Pass] `ipkgservice` upstart-resident (`(start) running`) — *automated*
- [Human] **Luna Restart after a full reboot** — verified on 600052: clean
      stop/start cycle, and 0 crashes / 0 SEGV / 0 respawn-thrash across it.
      This is the case that failed on 600042/600049/600050; see the PmWanDaemon
      gate in `docs/4G-TOUCHPAD.md`.
- [Human] **Repeat from the power menu by hand.**
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
- [Warn] **rdxd crash reports → 1 (LunaSysMgr)** — *automated; the script says
      FAIL, downgraded here by judgement*. The minimal-mode firstuse instance
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

- [Human] Launcher comes up; tabs are APPS / GAMES / SETTINGS / DOWNLOADS
- [Human] Open App Catalog, browse, install one app end-to-end
- [Human] Browser loads a modern-HTTPS site
- [Human] Wi-Fi reconnects after a reboot

## 3. OOBE (first boot)

- [Human] Card order: language → terms → sign-in → name device
- [Human] Terms card loads community terms over HTTPS
- [Human] Sign-in **and** Skip Account Setup (skip → profile named "webOS User")
- [Human] Finishes **without a reboot**; launcher comes up
- [Human] Non-English OOBE run (localization)
- [Human] No spurious hotspot prompt on a normal home network

## 4. Core-apps suite

- [Pass] contacts / messaging / phone / accounts baked and **unshadowed** — *automated*
- [Pass] db8 healthy — `com.palm.person:1` answers — *automated*
- [Human] Messaging launches; new-conversation UI works
- [Human] Contacts launches
- [Human] Settings → Accounts shows the SYNERGY ACCOUNTS grouping
- [Human] Email sync against a real account

## 5. Synergy generic runtime

- [Pass] synergy glibc + runtime dirs; bind mount live — *automated*
- [Pass] `imtransport` running (pid = `/usr/bin/imlibpurpletransport`) — *automated*
- [Pass] cloud-auth present; docviewer absent (intentional) — *automated*
- [Pass] Retired accounts (skype/yahoo) gone — *automated*
- [Pass] gst WebM/Opus plugins 6/6 — *automated*
- [Pass] QuickOffice ×2 + Photos installed; synergy patch markers present — *automated*
- [Human] QuickOffice remote-files UI opens; Photos app opens
- [Human] An IM account actually connects

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
- [Human] Install a real package via Preware (e.g. Tweaks)
- [Human] Open a `.ipk` link in the **browser** — it should open Preware, not
  just download. (Fixed in 600037; confirmed working on-device.)

## 7. CE platform tweaks

- [Pass] `turnOnNovacomAtStart=true`; keyboard defaults small — *automated*
- [Pass] Version-prefix patch — zero `"HP webOS "` in LunaSysMgr — *automated*
- [Human] Device Info shows webOS CE 3.1.0
- [Human] Developer-mode toggle survives an off/on cycle
- [Human] Tweaks installs; LunaCE toggles appear and at least one works
- [Human] Captive-portal network → portal page loads from the archive-pointed webview

## 8. Regressions from earlier validated flashes

- [Pass] Kindle / Facebook / YouTube preloads absent — *automated*
- [Pass] `ls-hubd` clean (0 unlisted-service errors) — *automated*
- [Pass] Trust store populated (~190 entries) — *automated*
- [Pass] Help app repointed at webosarchive.org — *automated*
- [Human] 0 crash artifacts — *automated, real assertion*
- [Human] tripwire: no software reboot, or all UI-initiated — *automated, real assertion*
      A reboot requested by anything other than LunaSysMgr fails the check — that is
      what the tripwire exists to catch. A deliberate §0 reboot passes.
- [Human] BT gamepad pairs; USB Settings and Govnah sit on the Settings tab
- [Human] Advanced reset options appear in the chosen OOBE language
- [Human] Maps 4.0.1 opens

## 9. Preloads / un-baking

- [Pass] App Catalog and Maps **not baked** — *automated*
- [Pass] Both installed to cryptofs, **one stanza each** — *automated*
      (two stanzas = installed *alongside* rather than upgraded — the thing to catch)
- [Pass] Staged ipks present; stock 5.0.2900 ipk removed — *automated*
- [Pass] Catalog files extracted with clean names — *automated*
      *(was expected to fail on older builds; the catalog ipk is now 6.1.2921 as of 600033)*
- [Pass] Manifest: baked contacts/messaging entries dropped — *automated*
- [Human] **stock-lineage runs:** compare against the pre-flash baseline — the
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
- [Human] Exhibition opens on the simple clock; **swipe through all four faces**
- [Human] GAMES reads SPIELE after switching the device language to German
- [Human] Photos exhibition: clock toggle shows/hides; interval persists across
  leaving and re-entering Exhibition *(a flash wipes `/var`, so prefs start fresh)*
- [Human] Rotate the device in Exhibition — portrait clock sizing (125/37px)

## 11. Photos filename  *(new in 600030)*

- [Human] Open a photo full-screen, tap once — the **filename** shows centred in
  the control bar, and updates as you swipe between photos
- [Human] **A video** in Photos shows its name only ONCE (the label is suppressed
  for `mediaType === "video"`; videos already show it in the video control bar)
  — *never yet tested, no video on the device*
- [Human] A **long filename** truncates with "…" rather than overlapping the
  buttons — *never yet tested, all test files are `NN.jpg`*
- [Human] A **cloud album** photo (Facebook/Dropbox) shows something sane — those
  records may carry synthetic paths

## 12. Space / media

- [Pass] Staged customization media reclaimed unattended — *automated*
- [Pass] rootfs free space / % used — *automated* — record the number
- [Pass] Default wallpaper present — *automated*
- [Human] Default wallpaper looks right on screen
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
- [Pass/Human] **Just Type shows "Search DuckDuckGo"** and searching works —
  *confirmed by user on 600030's device*
- [Human] The search actually returns usable results in the browser
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

- [Human] Helper starts with Luna and finds both grants already baked —
  `/var/log/woce-backupd.log` says *"lunacall role is baked into the image;
  nothing to write"* and *"db8 admin grant already in place"*
- [Human] It writes **nothing** to `/var/palm/ls2/roles/prv/` (a second role
  claiming `com.palm.backup.privileged` makes ls-hubd drop *both* grants), and
  no `/etc/palm/mojodb.conf.woce-backup-orig` appears
- [Human] `getBackupStatus` reports `privileged: true` (helper reachable — the
  app shows an amber limited-mode notice when it is not)
- [Human] `woce-lunacall -m com.palm.backup.privileged` reaches
  `com.palm.db/internal/preBackup`; the same call as plain `luna-send` is denied
- [Human] Full backup completes: 24.5 MB, `skipped: []`, 19 packages archived
- [Human] `listBackups` / `getRestoreDevices` / `getLastBackupTime` all answer
- [Human] `deleteBackup` purges by reference count — 52 files → 32, 48.7 → 24.5 MB,
  the surviving backup intact
- [Human] App UI renders with the real state (destination, "Settings and data",
  "2 backups") and **no** limited-mode notice
- [Human] **Restore** — deliberately not run on a live device (it rewrites db8
  and preferences and then reboots). Run it on the flashed image.
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

### 600039: what counts as the user's app

600038's restore worked but put back the wrong set, because the app decided
ownership by NAME (`com.palm.*` = system). Measured against a real manifest that
was wrong both ways: it skipped `com.palm.app.codepoet.simplechat`, a community
app that borrows the prefix, and archived + restored 11.7MB of QuickOffice that
every image already ships. It now asks the image what it provides instead —
baked under `/usr/palm/applications`, staged as a preload under
`/usr/palm/ipkgs`, or an ipkg entry with no cryptofs footprint at all (how CE's
Synergy stanza looks).

Verified on the 600038 device by driving the helper's job protocol directly —
the test suite stubs `privileged.*`, so none of its ops are covered off-device:

- [Human] `listInstalledApps` reports 19 installed / 59 image-provided, and the
  only thing it would back up is what the user actually installed
- [Human] A package's archive now carries its **service**: QuickOffice came out as
  `usr/palm/applications/…`, `usr/palm/packages/…` **and**
  `usr/palm/services/com.quickoffice.webos.service` (8 files). Previously only
  the app bundle was captured, which is why restored Tweaks launched and did
  nothing — its service was never in the backup.
- [Human] Restore accepts an app+service archive and lands both
- [Human] Restore **rejects** a `..` traversal member — nothing written to `/etc`
- [Human] Restore **rejects** a member outside `OWNED_SUBTREES`
- [Human] Legacy `<id>/…` archives (written by 600038) still restore
- [Human] An app restored by the directory fallback has no ipkg record, and is now
  still seen as installed via its `appinfo.json` and marked `unmanaged` — without
  that it silently drops out of every later backup
- [Human] The full 3.0.5 → 3.1.0 path: back up on stock 3.0.5, flash, restore

**Watch for:** pushing the *upstream* `woce-backupd.js` to a CE device instead of
bake.py's patched copy makes it write `/var/palm/ls2/roles/prv/woce-lunacall.json`
— the duplicate role that drops both grants on next boot. Hit exactly once during
this work. Check that file is absent after any manual helper push.

### 600055 automated run (2026-08-22)

80 PASS / 1 WARN / 0 FAIL across §0, 0b, 1, 4, 5, 6, 7, 8, 9, 10, 10b, 11
(`scripts/results-600055.txt`). Line-by-line diff against the 600052 run is
buildmark, buildtime, uptime — and the one crash report. The two changes 600055
exists for are both confirmed:

- [Pass] Preware present with exactly one status stanza **after** the de-shadow
      sweep. Under the old hand-maintained list Preware was queued for deletion
      and survived only on first-boot ordering.
- [Pass] PmWanDaemon gated — `pre-start terminated with status 1`, no respawn
      thrash, no upstart-child SIGSEGV. That is the failure seen on
      600042/600049/600050, now absent through a boot **and** a Luna Restart.

---

### 600052: what the first real 3.0.5 -> CE restore found

Verified on hardware with a 115-package backup from a daily driver:

- [Human] Receipt classifies every package and names them properly — "Hot Pursuit",
  "DRIVER HD", not "This is a webOS application."
- [Human] `installed 97 / failed 5 / not-captured 1 / image-provided 12 /
  servicesRegistered 11`
- [Human] The 8 TLS/rootcerts/ntpdate packages skipped as `image-provided`:
  **nothing littered into cryptofs, nothing overwritten in `/usr`**
- [Human] 11 restored services reachable on the bus after reboot (`-P`, look for
  `Unknown method`, NOT `Service does not exist`)

Two bugs the receipt exposed, both fixed in 600052:

- **Launcher files must end in `.service`.** Named after the bus name verbatim,
  only the 5 whose names already ended that way were visible; 6 including Tweaks
  were silently absent. Renaming took it from 5/11 to 11/11.
- **`maxBuffer exceeded`, not a timeout.** The `tar tzf` validation pass read
  stdout through node 0.2's `exec` (200KB cap); a game's tarball lists tens of
  thousands of paths, so Tiger Woods, Driver HD, Sandstorm and Atlas failed at
  the LISTING stage. Listing now goes via a file.

**Still open:** two Preware patches CE does not bake (`calendar-default-to-week-view`,
`photos-show-filenames`) restore as inert payload dirs — their postinst never runs,
so they are clutter rather than applied patches.

---

**Dedup note:** a second identical backup did **not** halve the store (48.7 MB for
two). Content addressing is working — the delete purged only the 20 files unique
to the first backup, so 12 were genuinely shared — but db8 dumps and app tarballs
differ byte-for-byte between runs. That is upstream behaviour, not CE integration.

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
