# webOS CE 3.1 Flash Test Plan

**Ready for the next flash.** Fill in the build under test, then run the
automated half first and work the `[Human]` list from what it leaves.

```
Build under test:  BUILDMARK ______   jar ______________________  sha256 ______
Lineage:           [ ] CE -> CE      [ ] stock 3.0.5 -> CE
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

`ce-test-full.sh` decides everything a shell can — ~65 checks across every
section below. Run it, mark those items from its output, then work the `[Human]`
list. Do not run it before first use finishes: preloads install during first use
and will read as failures while merely pending.

Previous runs: `scripts/results-600029.txt`, `scripts/results-600014.txt`.

---

## 0. Luna Restart

- [ ] `ipkgservice` upstart-resident (`(start) running`) — *automated*
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

- [ ] `ipkgservice main process ended, respawning` → 0 — *automated*
- [ ] `respawning too fast` (ipkgservice) → 0 — *automated*

If the storm returns the fix is **not** to drop `respawn` — find whatever is
stop/starting the job.

## 1. First-boot seeding

- [ ] Cryptofs seed flag set; `seed verified complete` — *automated*
- [ ] All once-per-flash flags present — *automated*
- [ ] Preware feeds seeded — *automated*

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

- [ ] contacts / messaging / phone / accounts baked and **unshadowed** — *automated*
- [ ] db8 healthy — `com.palm.person:1` answers — *automated*
- [Human] Messaging launches; new-conversation UI works
- [Human] Contacts launches
- [Human] Settings → Accounts shows the SYNERGY ACCOUNTS grouping
- [Human] Email sync against a real account

## 5. Synergy generic runtime

- [ ] synergy glibc + runtime dirs; bind mount live — *automated*
- [ ] `imtransport` running (pid = `/usr/bin/imlibpurpletransport`) — *automated*
- [ ] cloud-auth present; docviewer absent (intentional) — *automated*
- [ ] Retired accounts (skype/yahoo) gone — *automated*
- [ ] gst WebM/Opus plugins 6/6 — *automated*
- [ ] QuickOffice ×2 + Photos installed; synergy patch markers present — *automated*
- [Human] QuickOffice remote-files UI opens; Photos app opens
- [Human] An IM account actually connects

## 6. Preware / Govnah / status seeding

- [ ] ipkgservice answers — *automated*
- [ ] One well-formed stanza each: preware, govnah, synergy generic — *automated*
- [ ] USB Settings / BT Gamepad absent from ipkg status — *automated*
- [ ] `webos-patches` / `webos-kernels` ship **disabled** — *automated*
- [ ] `.ipk` handler registered — *automated*
- [Human] Install a real package via Preware (e.g. Tweaks)
- **Known issue:** `application/octet-stream` is not mapped, so a browser-downloaded
  `.ipk` stops at the downloaded file. See KNOWN-ISSUE-IPK-BROWSER-PROMPT.md.

## 7. CE platform tweaks

- [ ] `turnOnNovacomAtStart=true`; keyboard defaults small — *automated*
- [ ] Version-prefix patch — zero `"HP webOS "` in LunaSysMgr — *automated*
- [Human] Device Info shows webOS CE 3.1.0
- [Human] Developer-mode toggle survives an off/on cycle
- [Human] Tweaks installs; LunaCE toggles appear and at least one works
- [Human] Captive-portal network → portal page loads from the archive-pointed webview

## 8. Regressions from earlier validated flashes

- [ ] Kindle / Facebook / YouTube preloads absent — *automated*
- [ ] `ls-hubd` clean (0 unlisted-service errors) — *automated*
- [ ] Trust store populated (~190 entries) — *automated*
- [ ] Help app repointed at webosarchive.org — *automated*
- [ ] 0 crash artifacts; tripwire clean — *automated*
- [Human] BT gamepad pairs; USB Settings and Govnah sit on the Settings tab
- [Human] Advanced reset options appear in the chosen OOBE language
- [Human] Maps 4.0.1 opens

## 9. Preloads / un-baking

- [ ] App Catalog and Maps **not baked** — *automated*
- [ ] Both installed to cryptofs, **one stanza each** — *automated*
      (two stanzas = installed *alongside* rather than upgraded — the thing to catch)
- [ ] Staged ipks present; stock 5.0.2900 ipk removed — *automated*
- [ ] Catalog files extracted with clean names — *automated*
      **Expected to FAIL until the App Catalog ipk is rebuilt** — see below.
- [ ] Manifest: baked contacts/messaging entries dropped — *automated*
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

- [ ] `SimpleClock.qml` present and referenced; stock faces retained — *automated*
- [ ] GAMES localized in all 8 locales — *automated*
- [ ] Launcher page rename favorites→games configured — *automated*
- [ ] Photos exhibition clock installed (icon + CSS + JS) — *automated*
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

- [ ] Staged customization media reclaimed unattended — *automated*
- [ ] rootfs free space / % used — *automated, record the number*
- [ ] Default wallpaper present — *automated*
- [Human] Default wallpaper looks right on screen
- *Known/accepted:* `/media/internal` **accumulates** — the customization service
  only copies in, never removes. Upgrading from an older CE build leaves the old
  `NN.png` wallpapers beside the new `.jpg` set. Decision: do not delete from the
  user's media volume. A stock-lineage flash is clean.

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
