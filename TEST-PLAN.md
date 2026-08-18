# webOS CE 3.1 Flash Test Plan

Marked up against **BUILDMARK 600020** (flashed 2026-08-18, `BUILDTIME=20260818105945`).
Legend: `[Pass]` verified this run · `[Fail]` verified broken · `[Human]` needs
eyes/hands on the device · `[n/a]` not applicable to this build.
Shell checks assume a novacom root shell (**`luna-send` needs `< /dev/null`** under
novacom, or it exits silently with no output).

---

## RESULTS SUMMARY — 600020

**Two bugs found, both already fixed in bake.py (not yet built/flashed). Everything
else passes.**

### BUG 1 — App Catalog is shadowed by the OLD stock 5.0.2900  *(fixed in bake.py)*

The image bakes community catalog **6.1.2901** to the rootfs, but stock also ships a
**flat-path staged ipk** `/usr/palm/ipkgs/com.palm.app.enyo-findapps_5.0.2900_all.ipk`
(14.9MB + `findapps-icon.png`). app-install installed it to cryptofs at 15:14:47 on
first boot, and cryptofs shadows the rootfs — so the catalog actually running is
**5.0.2900**.

It slipped through because `remove_staged_ipk()` only matches per-app *subdirs*
(like maps), and a previous session read that mismatch as proof that "there is no
staged findapps ipk" and deleted the removal. The ipk is plainly in the stock
tarball. The deshadow pass can't save us either — it ran clean at 08:14:44, one
minute *before* the install.

**Consequence: every App Catalog test from 600014 through 600020 — including this
run's passing install test — exercised the OLD catalog.** Re-test after the next
flash. Verify with:
`grep -o '"version":[^,]*' /media/cryptofs/apps/usr/palm/applications/com.palm.app.enyo-findapps/appinfo.json`
→ should be **absent** (no cryptofs copy at all).

### BUG 2 — `ce-cryptofs-seed` hangs forever on `initctl start`  *(fix pending)*

`kick_ipkg` calls `/sbin/initctl start org.webosinternals.ipkgservice` synchronously.
Since `respawn` was removed (600019), the service's process exits immediately (the
hub owns the bus name), the job never reaches a state `initctl start` returns on,
and the call **blocks in `__skb_recv_datagram` indefinitely**. `|| true` does not
help a hang.

Observed: seed job ran 7+ minutes having copied **nothing**, blocked in `do_wait` on
child `initctl`. Feeds were fine (the pre-start had already run), but the 31MB
synergy payload never started. Killing the stuck `initctl` let it finish in ~90s
(`seed verified complete on attempt 1`).

**On an untouched device the Synergy transport would never come up.** The same
hazard applies to `kick_imtransport` (imtransport's pre-start can wait ~180s).
Fix: run both kicks backgrounded with a bounded wait, the same pattern the
wallpaper job's `lsq()` already uses.

### Stale expectations corrected in this document
- Thai font is **37KB**, not "~600KB" — upstream now ships a smaller Noto. The
  point of the check (not the stock **9.5MB** font) holds.

---

## Automated pass — BUILDMARK 600011, 2026-08-17 (historical, kept for reference)

40 checks passed, 0 real failures (`scripts/ce-test-600011.sh`). First flash to
reach a working state on a **single boot**. Two reported failures dismissed with
evidence: a test-script db8 query bug, and 96 `ls-hubd` errors that were all stock
`com.palm.wifi.carrierhotspot` noise, absent from the stock image too.

---

## First-boot seeding (NEW — the 600019/600020 fixes)

- [Pass] **First-use gate defers the pre-OOBE runs.** `ce-cryptofs-seed.log`:
  `first use not finished -- deferring` at 15:14:13 and again at 08:14:42, then the
  real run at 08:18:45. Before this fix the early run occupied the job for minutes
  and upstart silently DROPPED the `first-use-finished` trigger, leaving 600019 with
  nothing seeded at all.
- [Pass] **Feeds seed in the same second as the post-OOBE run** (08:18:45 →
  08:18:45), not 86s later behind the synergy copy.
- [Pass] **Preware has its feeds out of the box** — 9 enabled + 4 disabled configs,
  no user action, no relaunch needed.
- [Pass] **No ipkgservice respawn storm** — 0 respawns all boot (was 11 → job
  permanently stopped). The 3 `respawning too fast` events this boot are
  `PmWanDaemon`, a stock daemon unrelated to CE.
- [Fail] **Synergy seed does not complete unaided** — see BUG 2. After manual
  unblocking: glibc 11/11, runtime 13/13, plugins 11/11, flag set.

## 10-minute smoke test

1. [Pass] **OOBE ran and finished** — community flow; no reboot needed; launcher came up.
2. [Human] **No hotspot login prompt** — *user reported normal Wi-Fi behaviour; not
   explicitly re-checked.*
3. [Pass] **HTTPS browsing** — user confirmed github.com loads.
4. [Pass] **Build identity** — `PRODUCT_VERSION_STRING=webOS CE 3.1.0`,
   `BUILDTIME=20260818105945`, `BUILDMARK=600020`.
5. [Pass] **Keyboard small by default** — user confirmed.
6. [Fail] **App Catalog install** — the install itself worked (user confirmed) but it
   was the shadowed **5.0.2900**, not baked 6.1.2901. See BUG 1. Re-test next flash.
7. [Human] **Controller works** — Bluetooth/USB controller with a game. USB Settings
   app itself confirmed happy by user.
8. [Pass] **LunaCE installed and working** — user confirmed present; Tweaks test passed.
9. [Pass] **Preware knows what's baked** — Preware 1.9.19, Govnah 1.3.9, Synergy
   generic 0.9.3 all `Status: install ok installed`; USB Settings and BT Gamepad
   absent from ipkg (0 hits each), as intended.
10. [Pass] **Advanced Reset Options** — user confirmed present.
11. [Human] **Core apps launch** — Messaging / Contacts / Accounts. All three are
    baked in rootfs and unshadowed, db8 answers, but *launching* them needs eyes.
12. [Pass] **Synergy runtime alive** — `ld-linux.so.3` present, 1 `imlibpurple`
    process, 1 bind mount **(only after BUG 2 was manually unblocked)**.
13. [Pass] **Legacy junk gone** — skype app, `skypem`, `com.palm.yahoo`, kindle all absent.
14. [Pass] **Dev mode sticks** — `turnOnNovacomAtStart=true`, `/var/gadget/novacom_enabled`
    present, novacom reachable throughout.
15. [n/a] **webOS Account icon in Settings** — deliberately removed this build
    (`visible:false`); the app is OOBE-only now. Post-OOBE account management moves
    to a separate catalog app.

## OOBE (first boot)

- [Pass] First use boots into the community webOS Account flow (not stock HP)
- [Human] Card order: language → terms → sign-in → name device
- [Human] Wi-Fi join popup appears and connects
- [Human] No spurious hotspot prompt on a normal home network
- [Human] Terms card loads community terms over HTTPS
- [Human] Sign-in (or Skip Account Setup) works; completion card shows "Tap Done…"
- [Pass] **Done finishes setup without a reboot** — no software reboot occurred at
  all this boot (`/var/log/reboot-tripwire.log` absent). *Note: the old plan line
  said "Done reboots the device"; the no-reboot OOBE is the intended behaviour now.*
- [Human] Non-English OOBE run (localization)

## Core-apps suite

- [Human] Messaging launches; new conversations UI
- [Pass] Contacts runs from rootfs — cryptofs copy absent
- [Human] Phone launches without errors
- [Human] Accounts (Settings → Accounts) shows SYNERGY ACCOUNTS grouping
- [Pass] No stale stock contacts/messaging/maps staged ipks — all three gone
- [Pass] db8 kinds healthy — `com.palm.person:1` query returns `returnValue: true`
- [Pass] accounts app baked at **3.1.1** (version-sort picked it over 3.1.0)

## Synergy generic runtime

- [Pass] Cryptofs seed present — glibc/runtime/purple-plugins all full *(after BUG 2 unblock)*
- [Pass] Seed flag `/var/luna/preferences/ce-cryptofs-seeded` exists
- [Pass] `imtransport` running — 1 `imlibpurple` process
- [Pass] Bind mount live — `mount | grep synergy` → 1
- [Pass] cloud-auth app present; docviewer intentionally excluded
- [Pass] Skype/Yahoo/legacy-Google gone
- [Pass] BT hands-free byte patch — `31 00 00 ea` at offset 119792
- [Pass] Thai font swapped — 37,744 bytes (stock was 9,496,100)
- [Pass] gst plugins present — `libgstopus.so`, `libgstvpx.so`
- [Pass] QuickOffice ×2 + Photos installed from the repacked staged ipks;
  `RemoteFileService.js` integration file present in the installed QuickOffice
- [Pass] Photos service patch marker present in rootfs `Utils.js`
- [Human] QuickOffice remote-files UI actually opens; Photos app opens

## Preware / Govnah / status seeding

- [Pass] ipkgservice answers — `version` → `1.9.18` in ~1s; `getConfigs` → 12 configs, 8 enabled
- [Pass] Preware 1.9.19 seeded as installed
- [Pass] Govnah 1.3.9 seeded as installed
- [Pass] Synergy generic 0.9.3 seeded as installed
- [Pass] USB Settings and BT Gamepad absent from ipkg status
- [Pass] Status stanzas well-formed, one each, valid `Installed-Time` epochs
- [Human] **.ipk handler** — download an .ipk in the browser → installs via Preware
  with no association prompt
- [Pass] Installing a real package via Preware works — user installed Tweaks
  successfully (its stanza joined the seeded ones cleanly)
- [ ] **Next build only:** `webos-patches` / `webos-kernels` should ship
  **disabled**. On 600020 they are enabled with a bogus 3.0.5 pin, so they fail on
  every feed update. 600021 replaces our hand-copied feed list with Preware's own
  postinst logic, which disables them on 3.1.

## CE platform tweaks

- [Pass] Device Info shows webOS CE 3.1.0
- [Pass] `BUILDTIME=20260818105945`, `BUILDMARK=600020`
- [Pass] Developer mode on; `turnOnNovacomAtStart=true`
- [Pass] Keyboard small by default (user confirmed)
- [Pass] Tweaks installs and LunaCE toggles work (user confirmed)
- [Human] Captive-portal network → portal page loads from the archive-pointed webview

## Regressions from earlier validated flashes

- [Pass] Browser loads modern HTTPS (user confirmed)
- [Fail] App Catalog — works, but the shadowed old version. See BUG 1.
- [Human] Maps 4.0.1 opens (baked in rootfs, staged 3.0.1 ipk removed)
- [Human] Email syncs (mail TLS stack)
- [Pass] Help app repointed at help.webosarchive.org
- [Human] BT gamepad pairs
- [Pass] USB Settings works (user confirmed); Govnah/USB on the Settings tab
- [Pass] Wallpapers + ringtones in `/media/internal` — 34 wallpapers, 40 ringtones;
  default wallpaper correct (user confirmed)
- [Pass] Advanced reset options present (user confirmed); [Human] Luna Restart button
- [Pass] Kindle/Facebook/YouTube preloads absent; 0 staged customization ipks left
- [Pass] `ls-hubd` — 12 unlisted-service errors, all benign: 10 ×
  `com.palm.wifi.carrierhotspot` (stock noise, absent from the stock image too),
  2 × `org.webosinternals.tweaks.prefs` (from the Tweaks install this run)
- [Pass] Trust store intact — 190 `.pem` + 380 total entries in
  `/etc/ssl/certs/trustedcerts`, `/var/ssl/trustedcerts` populated (190),
  `ca-certificates.crt` 289,320 bytes
- [Pass] Version-prefix patch — zero `"HP webOS "` left in LunaSysMgr,
  libWebKitLuna.so, mediaserver, media-pipeline.real
- [Pass] No software reboot this boot; **0 crash reports**

## Still needs a human (short list for the next session)

1. **Re-test App Catalog after the next flash** — confirm no cryptofs copy exists and
   the running catalog is 6.1.2901 (BUG 1).
2. **Confirm the Synergy transport comes up unaided** after the BUG 2 fix — on an
   untouched device, no manual `kill`.
3. Core apps launch: Messaging, Contacts, Phone, Accounts (SYNERGY ACCOUNTS box).
4. Controller pairing (BT/USB) with a game.
5. `.ipk` tap-to-install with no association prompt.
6. Email sync, QuickOffice remote files, Photos, Maps.
7. Luna Restart button from the power menu (was left hung once on 600014 — still
   un-root-caused).

## If something is off — first places to look

- `/var/log/messages` (upstart output, ls-hubd rejections, app-install)
- `/var/log/ce-*.log` (every CE job logs; absence of a log is itself a signal)
- `/media/cryptofs/imstdout.log` (Synergy transport)
- `initctl list | grep ce-` and `ls /var/luna/preferences/ce-*` (which CE jobs ran)
- A job stuck in `(start) running` for minutes: check its children for a blocked
  `initctl` — see BUG 2
- Before any `tellbootie recover`: **run `sync` first** (cryptofs corruption hazard)
