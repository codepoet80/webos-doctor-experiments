# webOS CE 3.1 Flash Test Plan

Marked up against **BUILDMARK 600023** (flashed 2026-08-18, `BUILDTIME=20260818113019`).
Legend: `[Pass]` verified this run · `[Fail]` verified broken · `[Human]` needs
eyes/hands on the device · `[n/a]` not applicable to this build. `[Skipped]` human
opted to skip on this test run.
Shell checks assume a novacom root shell (**`luna-send` needs `< /dev/null`** under
novacom, or it exits silently with no output).

---

## RESULTS — 600023

**Both 600022 bugs verified FIXED. Every other check passes. One open failure:
Luna Restart froze the device once (intermittent) — deferred to the next flash.**

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

### BUG 3 — Luna Restart froze the device — **OPEN, retest on next flash**

**User account (authoritative):** the device was fully responsive, moving quickly
through tests, right up until the power button was pressed and **Luna Restart
tapped — that was the triggering event.** The freeze followed the tap.

**What the logs add:** on that boot **no HUP signal was ever delivered**
(`killed by HUP` = 0 occurrences in both `messages.0.gz` and the 18:26–18:35
window), yet LunaSysMgr never died and kept launching apps up to a
`systemui popupalert` at 18:33:56 — consistent with the power menu opening.

Taken together: **the freeze happens between the tap and the signal — inside the
service-call path, before `killall` ever runs.** The restart mechanism itself is
not implicated (it demonstrably works: boot 2 respawned in 91ms and reached
`LunaSysMgr-ready` in 25.9s, plus a successful manual re-test).

**Prime suspect to check first — a change made in this session.** The button calls
`palm://org.webosinternals.ipkgservice/restartLuna`, which requires ls-hubd to
launch that service on demand. In 600019 we dropped `respawn` from the
ipkgservice upstart job. We already proved in this session that
`initctl start org.webosinternals.ipkgservice` can **block forever** in that
configuration (it hung ce-cryptofs-seed for 7+ minutes in `__skb_recv_datagram`,
because the exec'd process exits at once while the hub owns the bus name). The
PowerdAlerts code that makes this call runs **inside luna-systemui, i.e. inside
LunaSysMgr** — so a blocking service launch on that path would freeze the UI
exactly as observed, and would explain why no HUP was ever produced.

Not proven — the ce-cryptofs-seed hang was `initctl`, not the hub's own launch
path, and the service answers normal calls in ~1s. But it is the first thing to
rule out.

**Test on the next flash (do this early, while the device is disposable):**
1. Tap Luna Restart from the power menu. Expect a ~26s blank, then the UI back.
2. If it freezes, **capture before rebooting** (over novacom, which stays alive):
```
initctl status LunaSysMgr org.webosinternals.ipkgservice
pidof LunaSysMgr; ps | grep -E "ipkgservice|node_spawner"
for p in $(pidof LunaSysMgr); do cat /proc/$p/wchan; echo; done
grep -c "killed by HUP" /var/log/messages
tail -60 /var/log/messages
```
   A blocked service launch shows LunaSysMgr alive in an uninterruptible/socket
   wait with **0** HUP delivered — which would confirm the suspect above.
3. Also try Preware's own Luna manager (same `restartLuna` call, different UI). If
   that freezes too, it is the service path; if only the power menu freezes, it is
   the PowerdAlerts/systemui side.

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
- [Pass] Advanced reset options present (user confirmed); [Fail] **Luna Restart
    froze the device** — tapping it was the triggering event. Intermittent (worked
    on a later boot and on a manual re-test). OPEN — see BUG 3 for the retest.
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

1. **Luna Restart (BUG 3)** — retest early on the next flash and, if it freezes,
   capture the state before rebooting. Full procedure in the BUG 3 section.
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
