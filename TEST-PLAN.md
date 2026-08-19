# webOS CE 3.1 Flash Test Plan

**Fresh run against BUILDMARK 600024** — `BUILDTIME=20260818150806`,
sha256 `ec30762fdbf2be1a0f1f36b9da87eea84870b5d99709c80d7e921b628e7202d3`.

Legend: `[ ]` not yet run · `[Pass]` · `[Fail]` · `[Skipped]` · `[Human]` needs
eyes/hands · `[n/a]`. Shell checks assume a novacom root shell
(**`luna-send` needs `< /dev/null`** under novacom, or it exits silently).

Fallback if this build is worse: **600023 is the preview RC**, preserved at
`out/webosdoctorp305hstnh-3.1CE-600023-rc.jar` (sha `97b6621f`).

---

## 0. PRIORITY TEST — Luna Restart

This is the entire reason 600024 exists. On 600023 the device froze the moment
Luna Restart was tapped from the power menu, with **no HUP signal ever
delivered** — so it wedged between the tap and the signal, inside the
service-call path.

**The change:** `respawn` is restored on the `org.webosinternals.ipkgservice`
upstart job (dropped in 600019). The power menu calls
`ipkgservice/restartLuna` from inside luna-systemui — i.e. inside LunaSysMgr —
so a service launch that blocks freezes the UI. With `respawn` back the service
is upstart-resident instead of being launched on demand at that moment.

- [Pass] **Full reboot, then tap Luna Restart** — **WORKS.** User confirmed, and
      the log proves the mechanism: **1 HUP delivered** (600023 had ZERO), then
      `killed by HUP` -> `respawning` -> `post-stop` -> `starting` -> new main
      process 3950 in ~31ms, `LunaSysMgr-ready` 23s later. The decisive difference:
      `ipkgservice` is now `(start) running` (upstart-resident), so the tap needs no
      on-demand hub launch — that blocking launch is what froze the UI on 600023.
- [n/a] **If it freezes — capture BEFORE rebooting** (kept for future runs):
```
initctl status LunaSysMgr org.webosinternals.ipkgservice
pidof LunaSysMgr; ps | grep -E "ipkgservice|node_spawner"
for p in $(pidof LunaSysMgr); do echo -n "$p "; cat /proc/$p/wchan; echo; done
grep -c "killed by HUP" /var/log/messages
tail -60 /var/log/messages
```
- [n/a] **Discriminating test (not needed — it worked):** Preware's own Luna manager — it makes the
      identical `restartLuna` call from a different UI. Freezes too → the service
      path. Only the power menu freezes → the PowerdAlerts/systemui side.

**Healthy looks like:** `killed by HUP` → `respawning` → `post-stop -> starting`
→ `running`, then `LunaSysMgr-ready` ~26s later.
**Dead looks like:** stuck at `post-stop`, or `respawning too fast, stopped`.

## 0b. REGRESSION WATCH — respawn storm

Restoring `respawn` is the one thing that could regress. It did **not** storm on
the OOBE boot (0 events), but re-check after the reboot:

- [Pass] `ipkgservice main process ended, respawning` → **0**
- [Pass] `respawning too fast` (ipkgservice) → **0**

If the storm returns, the fix is **not** to drop `respawn` again — it is to find
whatever is stop/starting the job. Both original drivers were removed in 600021
(no more `initctl stop/start` on this service, and the extra start triggers are
gone), so a storm would mean something new reintroduced that churn.

---

## 1. First-boot seeding — VERIFIED on 600024's OOBE boot (not re-testable after a reboot)

These are once-per-flash and their flags are now set; recorded here as evidence,
not to be re-run without a reflash.

- [Pass] First-use gate deferred both pre-OOBE runs
  (`first use not finished -- deferring`, 19:21:41 and 12:22:13).
- [Pass] Feeds seeded **1s** after the post-OOBE run began —
  `12:25:23 cryptofs writable` → `12:25:23 seeding Preware feeds` →
  `12:25:24 feeds seeded: 13 files`.
- [Pass] Synergy seed completed unaided — `12:26:44 seed verified complete on
  attempt 1` (81s for 31MB); glibc 11/11, runtime 13/13, plugins 11/11, flag set.
- [Pass] `imtransport` came up on its own; its gate correctly refused to exec at
  12:23 while the interpreter was absent, then started after the seed landed.
- [Pass] No ipkgservice respawn storm on that boot (0 events).

## 2. Ten-minute smoke test

1. [Pass] OOBE ran and finished on its own; launcher came up (no minimal-mode loop)
2. [Pass] No hotspot login prompt on normal Wi-Fi
3. [Pass] HTTPS browsing works (github.com connects)
4. [Pass] Build identity — `BUILDMARK=600024`, `BUILDTIME=20260818150806`
5. [Pass] Keyboard small by default
6. [Pass 600025 / Human] App Catalog 6.1.2901 **installed in cryptofs** (600025 change: PRELOAD, not
   baked) — present under `/media/cryptofs/apps/usr/palm/applications/`, absent from
   `/usr/palm/applications/`; staged `com.palm.app.enyo-findapps_6.1.2901_all.ipk` in
   `/usr/palm/ipkgs/`; stock 5.0.2900 ipk absent. The copy must SURVIVE first boot
   (ce-firstboot-tweaks no longer lists it — a deleted copy here means the de-shadow
   list regressed). *Installing an app still needs a human.*
   **Result 600025 (RC1 -> 600025, 2026-08-19):** PASS. Catalog 6.1.2901 and Maps
   4.0.1 both installed to `/media/cryptofs/apps/`, registered with the app manager
   (launchable, `main`/`icon` resolve into cryptofs), ipkg status `install user
   installed`. Neither baked; both stock ipks (5.0.2900 / 3.0.1) absent. Rootfs 93%,
   38.3 MB free (RC1 shipped 26.8 MB).
   *Caveat — the de-shadow race was NOT exercised on this run:* ce-firstboot-tweaks
   completed 10:49:18, app-install began the catalog at 10:49:48 and installed at
   10:51:19, so de-shadow saw an empty cryptofs and reported "0 stale copies" 30s
   before the install started. It found nothing because nothing was there yet, not
   because the ids are off the list. Both once-per-flash flags are now set, so the job
   cannot re-run and these copies are safe for this flash. The `BAKED_APP_IDS` removal
   still matters for the boot where cryptofs is not writable at `stopped configurator`
   and the job retries on `first-use-finished` — i.e. AFTER the preload install. To
   exercise that deliberately: clear `/var/luna/preferences/ce-cryptofs-deshadowed`
   after first use and restart the job; with the ids removed the copies must survive.
   **Result 600028 (600025 -> 600028, 2026-08-19):** PASS, and the space work landed.
   Rootfs **122 MB free / 79% used — parity with stock 3.0.5 (115 MB / 79%)**, up from
   26.8 MB on RC1. App Catalog is now a 1.6 MB ipk (magazine removed; it hydrates from
   appcatalog.webosarchive.org after install) and registers as
   `com.palm.app.enyo-findapps 6.1.2901`.
   `ce-reclaim-customization-media` ran UNATTENDED on its own triggers for the first
   time and behaved exactly as designed — it fired early on `stopped finish`, found the
   customization service unfinished, DEFERRED instead of deleting, then ran on
   `first-use-finished`, verified, and reclaimed:
       customization service not finished -- deferring to the next trigger
       verified wallpapers: staged=27 live=40 / ringtones: staged=40 live=40
       reclaimed staged media: / free 93212K -> 122072K      (+28.2 MB)
   Note the verify is `live < staged`, not equality: live is the MERGE of hp.tar's
   wallpapers and CE's, so an equality check would have blocked the reclaim.
   Human-checked this run: GAMES reads SPIELE in German; Exhibition looks right.
   *Known, accepted:* `/media/internal` accumulates — 13 orphaned `NN.png` wallpapers
   from earlier builds remain beside the new `.jpg` set, so 17-27 appear twice in the
   picker and 28/29 persist after being dropped from the build. Decision was not to
   delete from the user's media volume.
   *Packaging defect found in the supplied ipk:* its control said
   `Package: org.webosarchive.appcatalog` while appinfo.json, the payload path and the
   install target all said `com.palm.app.enyo-findapps`. Corrected at bake-prep time
   (payload byte-identical, one control line). MUST be fixed at source: ipkg registers
   by `Package:`, so uncorrected it would install ALONGSIDE stock's registered
   `com.palm.app.enyo-findapps` 5.0.2900 rather than upgrading it — i.e. it would break
   precisely the stock-lineage test below.

   **Upgrade path (needs a stock-flashed device):** flash 600028 over a device coming from
   stock 3.0.5, where cryptofs already holds catalog 5.0.2900 + maps 3.0.1 with ipkg
   status stanzas — cryptofs SURVIVES the Doctor. Verify first boot upgrades both to the
   staged versions (plain `ipkg install` should upgrade; unverified). This is the one
   path the old baked scheme handled that the preload scheme has not yet proven.
7. [Pass] Controller works (BT or USB) with a game; USB Settings app has no errors
8. [Pass] LunaCE working — group icons / create a tab; Tweaks toggles something
9. [Pass] All three seeded as installed (1 stanza each); USB Settings and BT Gamepad
   absent from ipkg status (0/0)
10. [Pass] Advanced Reset Options present in the power menu
11. [Pass] Core apps launch — Messaging, Contacts, Accounts (SYNERGY ACCOUNTS box)
12. [Pass] Synergy runtime alive — seed 11/13/11, flag set, imtransport running,
    1 imlibpurple process, 1 bind mount
13. [Pass] Legacy junk gone — skype app + /usr/bin/skypem + com.palm.yahoo absent
14. [Pass] Dev mode sticks across the reboot — `turnOnNovacomAtStart=true`,
    `/var/gadget/novacom_enabled` present, novacom reachable throughout
15. [Pass] webOS Account launcher icon — deliberately removed (`visible:false`);
    the app is OOBE-only now, post-OOBE account management moves to a catalog app

## 3. OOBE (first boot)

- [Pass] Boots into the community webOS Account flow (not stock HP)
- [Pass] Card order: language → terms → sign-in → name device
- [Pass] Wi-Fi join popup appears and connects
- [Pass] No spurious hotspot prompt on a normal home network
- [Pass] Terms card loads community terms over HTTPS
- [Pass] Sign-in (or Skip Account Setup) works; completion card shows "Tap Done…"
- [Pass] Done finishes setup **without a reboot**; launcher comes up
- [ ] Non-English OOBE run (localization)

## 4. Core-apps suite

- [ ] Messaging launches; new conversations UI
- [Pass/Human] Contacts runs from rootfs, unshadowed. *Launching needs eyes.*
- [Pass] Phone launches without errors
- [Pass] Accounts (Settings → Accounts) shows the SYNERGY ACCOUNTS grouping
- [Pass] No stale stock contacts/messaging/maps staged ipks (0/0)
- [Pass] db8 healthy — `com.palm.person:1` query answers
- [Pass] accounts app is 3.1.1

## 5. Synergy generic runtime

- [Pass] Cryptofs seed present — 11/11, 13/13, 11/11
- [Pass] Seed flag exists
- [Pass] `imtransport` running — 1 imlibpurple process
- [Pass] Bind mount live
- [Pass] cloud-auth present; docviewer absent (intentionally excluded)
- [Pass] Skype/Yahoo/legacy-Google gone
- [Pass] BT hands-free byte patch — `31 00 00 ea` at offset 119792
- [Pass] Thai font swapped — 37,744 bytes
- [Pass] gst plugins present (2/2)
- [Pass] QuickOffice ×2 + Photos installed (3/3); `RemoteFileService.js` present
- [Pass] Photos service patch marker present
- [ ] QuickOffice remote-files UI opens; Photos app opens

## 6. Preware / Govnah / status seeding

- [Pass] ipkgservice answers in ~1s — version 1.9.18
- [Pass] Preware 1.9.19 / Govnah 1.3.9 / Synergy generic 0.9.3 all seeded
- [Pass] USB Settings and BT Gamepad absent from ipkg status
- [Pass] Status stanzas well-formed, one each, valid epochs (1787081124)
- [Pass] `webos-patches` / `webos-kernels` ship **disabled** (7 enabled / 6 disabled)
- [Fail] `.ipk` handler — download an .ipk in the browser → installs via Preware with
  no association prompt
- [Pass] Installing a real package via Preware works (e.g. Tweaks)

## 7. CE platform tweaks

- [Pass] Device Info shows webOS CE 3.1.0
- [Pass] Developer mode on and survived this reboot. *Toggle-off test needs a human.*
- [Pass] Keyboard small by default; size persists across hide/show and reboot
- [Pass] Tweaks installs; LunaCE toggles appear and at least one works
- [Pass] Captive-portal network → portal page loads from the archive-pointed webview

## 8. Regressions from earlier validated flashes

- [Human] Browser loads modern-HTTPS sites; Maps 4.0.1 opens (600025: preload-installed to
  cryptofs; staged in `/usr/palm/ipkgs/com.palm.app.maps/`, stock 3.0.1 subdir replaced)
- [Pass] Help app repointed at webosarchive.org. *Email sync needs a human.*
- [Pass] BT gamepad pairs; USB Settings and Govnah sit on the Settings tab
- [Pass] 34 wallpapers + 40 ringtones in `/media/internal`. *Default 22.png needs eyes.*
- [Pass] Advanced reset options in the chosen OOBE language
- [Pass] Kindle/Facebook/YouTube preloads absent (0 in cryptofs)
- [Pass] `ls-hubd` clean — **0** unlisted-service errors this boot
- [Pass] Trust store — 190 pem, `/var/ssl/trustedcerts` populated (190),
  bundle 289,320 bytes
- [Pass] Version-prefix patch — zero `"HP webOS "` in all four binaries
- [Pass] **0 crash reports.** The tripwire logged one reboot at 12:28:39 — the
  user's own (`parent=[/bin/sh -l]`), not a spontaneous one. No unexplained reboots.

---

## Reference — bugs fixed in 600021–600024 (re-verify, do not re-litigate)

- **App Catalog shadowing** (fixed 600024's predecessor): stock ships a *flat-path*
  staged ipk `/usr/palm/ipkgs/com.palm.app.enyo-findapps_5.0.2900_all.ipk` that
  app-install put in cryptofs, shadowing the baked 6.1.2901. `remove_staged_ipk()`
  only matches per-app subdirs, so it was missed. Now removed explicitly, and the
  build asserts the ipk is found rather than assuming absence.
- **`initctl` hang**: `initctl start` blocks until a job settles and `|| true` does
  not help a hang — it stalled `ce-cryptofs-seed` for 7+ minutes with nothing
  copied. All kicks now run backgrounded with a bounded wait (`kick_bg`).
- **Seed job swallowed its own trigger**: the pre-OOBE run occupied the job for
  minutes, so upstart silently dropped `first-use-finished` — the one run whose
  work survives. Now it exits immediately unless `ran-first-use` exists.
- **Preware feed seeding** comes from **Preware's own postinst** (extracted into
  `/usr/palm/ce-seed/preware-seed.sh`), not a hand-copied list. Do not re-transcribe
  it; upstream disables the versioned feeds on 3.1 and handles `uname -m` and the
  CE version string correctly.
- **Luna Restart mechanism** is canonical and singular: the power-menu patch,
  Preware's own Luna manager, and SysToolsManager all issue
  `killall -HUP LunaSysMgr` via `ipkgservice/restartLuna`. All five
  advanced-reset-options variants are the same patch; none use SysToolsManager.
  There is no alternative implementation to switch to.

## If something is off — first places to look

- `/var/log/messages` (upstart output, ls-hubd rejections, app-install)
- `/var/log/ce-*.log` (every CE job logs; a missing log is itself a signal)
- `/media/cryptofs/imstdout.log` (Synergy transport)
- `initctl list | grep ce-` and `ls /var/luna/preferences/ce-*` (which CE jobs ran)
- A job stuck in `(start) running` for minutes: check its children for a blocked
  `initctl` — that was the 600023 seed hang
- Before any `tellbootie recover`: **run `sync` first** (cryptofs corruption hazard)
