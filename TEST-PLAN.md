# webOS CE 3.1 Flash Test Plan

**Ready for the next flash.** Fill in the build under test, then run the
automated half first and work the `[Human]` list from what it leaves.

```
Build under test:  BUILDMARK 600033  jar webosdoctorp305hstnh-3.1CE-600033.jar
                   sha256 3ebb0c066a41b24ac6c43584ca1acfccb675087afa16596a0dfd24e83c9e2f02
Lineage:           [x] CE -> CE      [ ] stock 3.0.5 -> CE
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

`ce-test-full.sh` decides everything a shell can — ~71 checks across every
section below. Run it, mark those items from its output, then work the `[Human]`
list. Do not run it before first use finishes: preloads install during first use
and will read as failures while merely pending.

Previous runs: `scripts/results-600029.txt`, `scripts/results-600014.txt`.

---

## 0. Luna Restart

- [Pass] `ipkgservice` upstart-resident (`(start) running`) — *automated*
- [Human] **Full reboot, then tap Luna Restart from the power menu.**
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
- [Pass] **rdxd crash reports → 0**, listed by component — *automated*
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
- [Pass] One well-formed stanza each: preware, govnah, synergy generic — *automated*
- [Pass] USB Settings / BT Gamepad absent from ipkg status — *automated*
- [Pass] `webos-patches` / `webos-kernels` ship **disabled** — *automated*
- [Pass] `.ipk` handler registered — *automated*
- [Human] Install a real package via Preware (e.g. Tweaks)
- **Known issue:** `application/octet-stream` is not mapped, so a browser-downloaded
  `.ipk` stops at the downloaded file. See KNOWN-ISSUE-IPK-BROWSER-PROMPT.md.

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
- [Pass] 0 crash artifacts — *automated, real assertion*
- [Pass] tripwire: no software reboot, or all UI-initiated — *automated, real assertion*
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
- [Pass] rootfs free space / % used — *automated* — **121892K free, 79% used** (600033)
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

---

## Carried-over issues (not introduced by any recent build)

- **App Catalog ipk packaging** — 76 paths exceed the 100-char ustar limit, stored
  via PAX extended headers the device's extractor mishandles, so ~21 files install
  with the tar mode bled into the name
  (`…/search-bar.png000755`). Fix at source: drop `main/mock/` and/or build with
  `--format=gnu`. Stock ipks are PAX too but have *zero* over-long paths — length
  is the trigger, not format. Also keep `Package:` matching the app id.
- Browser-downloaded `.ipk` never reaches Preware (§6)
- OTA path; post-OOBE account manager; default governor — see Things Left to Do.md
- Novacom driver for modern macOS — the Doctor untars
  `resources/NovacomInstaller.pkg.tar.gz` and runs `open -W <tmp>/NovacomInstaller.pkg`,
  so it is a resource swap, but the filename is fixed → needs ONE arch-aware pkg.
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
