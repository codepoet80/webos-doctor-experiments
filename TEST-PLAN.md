# webOS CE 3.1 Flash Test Plan

For the BUILDMARK 600000 image (`out/webosdoctorp305hstnh-3.1CE.jar`).
Items marked **(regression)** were verified on earlier flashes; everything else
is new in this build. Shell checks assume a novacom/novaterm root shell.

## OOBE (first boot)

- [ ] First use boots into the community webOS Account flow (not stock HP)
- [ ] Card order: language → terms → sign-in → name device (no restore/google/updates cards)
- [ ] Wi-Fi join popup appears and connects (`dataConnection` delta applied)
- [ ] **No spurious "log in to hotspot" prompt** on a normal home network (connectivity-probe patch)
- [ ] Terms card loads the community terms over HTTPS
- [ ] Sign-in (or Skip Account Setup) works; completion card shows "Tap Done to finish…"
- [ ] Done reboots the device on its own; next boot lands in the launcher (no minimal-mode loop)
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
- [ ] `grep BUILD /etc/palm-build-info` → `BUILDTIME=20260817…`, `BUILDMARK=600000`
- [ ] **Developer mode on** after flash; toggle it off, reboot → it is back **on** (`turnOnNovacomAtStart`); `novacom -l` sees the device throughout
- [ ] **Keyboard comes up small** by default; resizing via keyboard key persists across hide/show and reboot
- [ ] Install **Tweaks** via Preware → LunaCE toggles appear (mini cards, wave launcher, gestures, …) and at least one (e.g. mini cards) works when enabled
- [ ] Hotspot check: join a real captive-portal network (if available) → portal login page loads from the archive-pointed webview

## Regressions from earlier validated flashes

- [ ] Browser loads modern-HTTPS sites; App Catalog works; Maps 4.0.1 opens
- [ ] Email syncs (mail TLS stack); Help app points at webosarchive.org
- [ ] BT gamepad pairs; USB Settings works and sits on the Settings tab; Govnah on Settings tab
- [ ] Wallpapers 12–16 + Treo ringtones in `/media/internal` after OOBE; default wallpaper is 12.jpg on a fresh device
- [ ] Advanced reset options in the power menu, in the chosen OOBE language; Luna Restart button works
- [ ] Kindle/Facebook/YouTube preloads absent
- [ ] `ls-hubd` clean: no "Service not listed in service files" in `/var/log/messages`
- [ ] Trust store intact: ~190 certs in `/etc/ssl/certs/trustedcerts`, `/var/ssl/trustedcerts` populated

## If something is off — first places to look

- `/var/log/messages` (upstart job output, ls-hubd rejections, app-install)
- `/media/cryptofs/imstdout.log` (Synergy transport)
- `initctl list | grep ce-` and `ls /var/luna/preferences/ce-*` (which CE jobs ran)
- Before any `tellbootie recover`: **run `sync` first** (cryptofs corruption hazard)
