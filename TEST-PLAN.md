# webOS CE 3.1 Flash Test Plan

For the BUILDMARK 600013 image (`out/webosdoctorp305hstnh-3.1CE.jar`).
Items marked **(regression)** were verified on earlier flashes; everything else
is new in this build. Shell checks assume a novacom/novaterm root shell.

## Automated pass — BUILDMARK 600011, 2026-08-17 (no second boot)

**40 checks pass, 0 real failures.** Run with
`scratchpad/ce-test-600011.sh` over novacom. This was the first flash to reach
a fully working state on a **single boot** — no reboot repaired anything.

Verified automatically: build identity; cryptofs seed verified in its own log;
Synergy glibc + runtime + bind mounts + transport running; **zero** crash
reports (the imtransport SIGBUS is gone); Preware feeds (13) + all three seeded
stanzas on first boot; skip-setup profile named **webOS User**; no software
reboot (tripwire log absent); 22.png wallpaper; GAMES designator; no launcher
race; carrier string, small keyboard, dev mode; webOS Account appinfo + locale
removal; BT byte patch; slim Thai font; gst plugins; 190-cert trust store;
connectivity-probe patch; legacy junk and stale staged ipks gone.

Two reported failures, both dismissed with evidence:
- *db8 profile query* — test-script bug (`where` on an unindexed prop). The
  direct query returns `"username":"webOS User"`.
- *ls-hubd: 96 unlisted-service errors* — all one service,
  `com.palm.wifi.carrierhotspot`, requested by stock `PmWiFiService`. That
  service file is **absent from the stock image too**, so this is stock noise
  on a Wi-Fi-only TouchPad, not a CE regression.

Still needs a human: App Catalog install, controller pairing, LunaCE tweak
toggles, .ipk tap-to-install, email sync, QuickOffice, Maps.

**Do not tap the webOS Account launcher icon on this build** — it replays the
OOBE language card, which deletes the palm profile, and Done can power the
device off. See NEXT-SESSION-PLAN.md.

## Pre-flash review additions (BUILDMARK 600013)

A top-to-bottom audit before this flash found issues that no earlier test would
have caught, because they all live on the **launcher launch** of webOS Account —
a path that only became reachable once that icon was added.

- [ ] **Start Over must be gone standalone.** Open the webOS Account icon; the
  bottom-left "Start Over" button must NOT be there. (It deletes the *connected*
  Wi-Fi network's saved profile, password included. Under OOBE it is still
  present and still works — that is correct.)
- [ ] **Power button over the account app** — with webOS Account open from the
  launcher, press the power key: you should get the normal system power menu,
  NOT a first-use "Turn Off" dialog.
- [ ] **Screen still dims** while webOS Account sits open from the launcher
  (under OOBE it correctly stays awake).
- [ ] **OOBE regression** — the whole first-use flow must be unchanged:
  language → terms → sign-in → Done finishes setup. Start Over during OOBE still
  offers to forget Wi-Fi and restart.
- [ ] **Deshadow on a dirty device** (only testable by flashing over an install
  that has Preware/Govnah in cryptofs): after first boot,
  `/var/log/ce-firstboot-tweaks.log` says "deshadow verified clean", and Preware
  reports the baked version rather than an older shadowed copy.

## 10-minute smoke test

Fast, high-signal checks that our bits landed — no accounts, no sync setup.

1. [Fail - but Claude has a fix] **OOBE ran and finished on its own** — community account flow appeared,
   Done rebooted the device, launcher comes up (no minimal-mode loop).
2. [Pass] **No hotspot login prompt** on your normal Wi-Fi during/after OOBE
   (the connectivity-probe patch).
3. [Pass] **Open HTTPS Webpage** browse to github.com in the old browser,
   it won't render, but if it connects, you're good.
4. [Pass] **Build identity** — Device Info says *webOS CE 3.1.0*; shell:
   `grep BUILD /etc/palm-build-info` → `BUILDTIME=20260817…`, `BUILDMARK=600011`.
5. [Pass] **Keyboard is small by default** — tap any text field; the keyboard
   should come up noticeably shorter than stock.
6. [Pass] **App Catalog can install apps** — launch App Catalog and install Keen
7. [Skip] **Controller Works** test a Bluetooth or USB controller with Keen. Open
   the USB Settings app and check for errors.
8. [ ] **LunaCE installed and working** group icons, or create a tab. Install
   Tweaks, and try tweaking something.s
9. [Pass] **Preware knows what's baked** — open Preware → Installed Packages
   lists Preware 1.9.19, Govnah 1.3.9, Synergy generic 0.9.3; USB Settings
   and BT Gamepad are nowhere in its listings.
10. [Pass] **Advanced Reset Options** — hold the power button and see if there
   are options.
11. [Pass] **Core apps launch** — open Messaging, Contacts, and Accounts
   (Settings → Accounts shows the SYNERGY ACCOUNTS box). Just launching all
   three without errors is the signal.
12. [Pass] **Synergy runtime alive** — shell:
   `ls /media/cryptofs/synergy-glibc/lib/ld-linux.so.3 && ps | grep -c imlibpurple`
   (file present, transport process running; give it ~2 min after boot).
13. [Pass] **Legacy junk gone** — no Skype app in the launcher; shell:
   `ls /usr/palm/applications/com.palm.app.skype 2>&1` → No such file.
14. [Pass] **Dev mode sticks** — `novacom -l` sees the device now; reboot once,
    it still does (turnOnNovacomAtStart).
15. [Pass] **webOS Account Icon** - found in Settings

If all 15 pass, the deep sections below can wait for a slower pass.

## OOBE (first boot)

- [Pass] First use boots into the community webOS Account flow (not stock HP)
- [ ] Card order: language → terms → sign-in → name device (no restore/google/updates cards)
- [Pass] Wi-Fi join popup appears and connects (`dataConnection` delta applied)
- [Pass] **No spurious "log in to hotspot" prompt** on a normal home network (connectivity-probe patch)
- [Pass] Terms card loads the community terms over HTTPS
- [ ] Sign-in (or Skip Account Setup) works; completion card shows "Tap Done to finish…"
- [Fail] Done reboots the device on its own; next boot lands in the launcher (no minimal-mode loop)
- [ ] German (or other language) OOBE run still works end-to-end if re-testing localization

## Core-apps suite

- [ ] **Messaging** launches; conversations UI is the new build (reactions/replies UI present)
- [ ] **Contacts** launches; app runs from rootfs (`ls /media/cryptofs/apps/usr/palm/applications/com.palm.app.contacts` → absent)
- [ ] **Phone** launches without errors
- [ ] **Accounts** (Settings → Accounts) opens; SYNERGY ACCOUNTS grouping visible
- [ ] No stale stock contacts/messaging installed from staged ipks: `ls /usr/palm/ipkgs/com.palm.app.contacts /usr/palm/ipkgs/com.palm.app.messaging /usr/palm/ipkgs/com.palm.app.maps` → ipk files gone
- [ ] db8 kinds healthy: `luna-send -n 1 palm://com.palm.db/find '{"query":{"from":"com.palm.person:1","limit":1}}'` returns `returnValue: true`

## Synergy generic runtime

- [ ] Cryptofs seed ran: `ls /media/cryptofs/synergy-glibc/lib/ld-linux.so.3 /media/cryptofs/synergy-runtime /media/cryptofs/synergy-purple-plugins` all present
- [ ] Seed flag exists: `ls /var/luna/preferences/ce-cryptofs-seeded`
- [ ] `imtransport` running: `ps | grep imlibpurple` shows the transport (may take a couple minutes after first boot; check `/media/cryptofs/imstdout.log` for a clean start, no crash loop)
- [ ] Bind mounts live: `mount | grep synergy` shows purple-2 and synergy-runtime
- [ ] cloud-auth + docviewer apps present in the launcher (or via Just Type)
- [ ] Skype/Yahoo/legacy-Google gone: no Skype app in launcher; `ls /usr/palm/applications/com.palm.app.skype /usr/bin/skypem /usr/palm/public/accounts/com.palm.yahoo` → all absent
- [ ] BT hands-free byte patch took: `dd if=/usr/bin/PmBtEngine bs=1 skip=119792 count=4 2>/dev/null | hexdump -C` → `31 00 00 ea`
- [ ] Thai font swap: `ls -la /usr/share/fonts/HeiT_nb.ttf` is ~600KB (not 9.5MB)
- [ ] gst plugins present: `ls /usr/lib/gstreamer-0.10/libgstopus.so /usr/lib/gstreamer-0.10/libgstvpx.so`
- [ ] QuickOffice opens after first-boot install and shows the remote-files UI (repacked staged ipk)
- [ ] Photos app opens; no JS errors in `/var/log/messages` from the patched files

## Preware / Govnah / status seeding

- [ ] **(regression)** Preware launches, feeds load, ipkgservice answers: `luna-send -n 1 palm://org.webosinternals.ipkgservice/version '{}'`
- [ ] Preware shows **Preware 1.9.19 as installed** (not offered as a plain install)
- [ ] Preware shows **Govnah 1.3.9 as installed**
- [ ] Preware shows **Synergy generic 0.9.3 as installed**
- [ ] USB Settings and BT Gamepad do **not** appear in Preware listings
- [ ] Status stanzas present: `grep -A2 "^Package: org.webosinternals" /media/cryptofs/apps/usr/lib/ipkg/status`
- [ ] **.ipk handler**: download an .ipk in the browser (or open from email) → installs via Preware with **no association prompt**
- [ ] Installing a real package via Preware works (e.g. Tweaks) and its stanza replaces/joins the seeded ones cleanly

## CE platform tweaks

- [ ] Device Info shows **webOS CE 3.1.0**
- [ ] `grep BUILD /etc/palm-build-info` → `BUILDTIME=20260817…`, `BUILDMARK=600011`
- [ ] **Developer mode on** after flash; toggle it off, reboot → it is back **on** (`turnOnNovacomAtStart`); `novacom -l` sees the device throughout
- [ ] **Keyboard comes up small** by default; resizing via keyboard key persists across hide/show and reboot
- [ ] Install **Tweaks** via Preware → LunaCE toggles appear (mini cards, wave launcher, gestures, …) and at least one (e.g. mini cards) works when enabled
- [ ] Hotspot check: join a real captive-portal network (if available) → portal login page loads from the archive-pointed webview

## Regressions from earlier validated flashes

- [ ] Browser loads modern-HTTPS sites; App Catalog works; Maps 4.0.1 opens
- [ ] Email syncs (mail TLS stack); Help app points at webosarchive.org
- [ ] BT gamepad pairs; USB Settings works and sits on the Settings tab; Govnah on Settings tab
- [ ] Wallpapers 12–29 + Treo ringtones in `/media/internal` after OOBE; default wallpaper is 22.png on a fresh device (and the wallpaper picker shows thumbnails for all of them)
- [ ] Advanced reset options in the power menu, in the chosen OOBE language; Luna Restart button works
- [ ] Kindle/Facebook/YouTube preloads absent
- [ ] `ls-hubd` clean: no "Service not listed in service files" in `/var/log/messages`
- [ ] Trust store intact: ~190 certs in `/etc/ssl/certs/trustedcerts`, `/var/ssl/trustedcerts` populated

## If something is off — first places to look

- `/var/log/messages` (upstart job output, ls-hubd rejections, app-install)
- `/media/cryptofs/imstdout.log` (Synergy transport)
- `initctl list | grep ce-` and `ls /var/luna/preferences/ce-*` (which CE jobs ran)
- Before any `tellbootie recover`: **run `sync` first** (cryptofs corruption hazard)
