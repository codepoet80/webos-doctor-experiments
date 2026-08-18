# webOS CE 3.1.0 — Release Notes

**Release candidate: BUILDMARK 600024** (2026-08-18)
`out/webosdoctorp305hstnh-3.1CE-600024-rc.jar`
sha256 `ec30762fdbf2be1a0f1f36b9da87eea84870b5d99709c80d7e921b628e7202d3`

A community Doctor for the **HP TouchPad** (`topaz`, Wi-Fi), built by repacking
the OEM HP webOS 3.0.5 Doctor with 14 years of community work baked directly
into the rootfs. Flashing it wipes the device, exactly like the OEM Doctor.

---

## What's in it

**Modern TLS everywhere.** OpenSSL 1.1.1w stacks for the browser, app WebKit,
download manager and mail, so HTTPS sites and mail servers work again. Current
Mozilla root certificates (190), with expired ones dropped.

**LunaCE launcher** — app groups, tabs, wave launcher, gestures, and a small
default keyboard. LunaCE's Tweaks definitions ship pre-seeded (inert until you
install Tweaks from Preware).

**Community sign-in.** First-use runs the webOS Archive account flow instead of
HP's dead activation servers, and **account setup is skippable**.

**Pre-installed, baked into the image** — no first-boot installs, no postinsts:
Preware 1.9.19, Govnah 1.3.9, App Catalog 6.1.2901, Maps 4.0.1, USB Settings,
BT Gamepad support, and the Synergy Revival shared runtime. Preware knows they
are installed and offers Preware feeds out of the box.

**Community core apps** — Accounts 3.1.1 (with a Synergy Accounts grouping and a
Delete Account Data page), Contacts, Messaging, Phone, and the supporting
frameworks.

**Synergy Revival** — the modernised libpurple 2.14 IM runtime, with the dead
Skype / Yahoo / legacy-Google stacks retired.

**Hardware and platform fixes** — UberKernel 3.0.5-93, Bluetooth gamepads and
mice, USB OTG/power/mass-storage, Bluetooth hands-free, extra media codecs
(opus/ogg/vpx/matroska/speex), a slim Thai font, and working connectivity
detection (the old check pointed at dead HP servers and demanded a hotspot
login on ordinary Wi-Fi).

**Identity** — Device Info reports **webOS CE 3.1.0**, and apps see a clean
`3.1.0` platform version. Developer mode is on out of the box and stays on.

**Removed** — Kindle, Facebook and YouTube preloads.

---

## Fixed since the 600023 candidate

- **Luna Restart no longer freezes the device.** Restoring `respawn` on Preware's
  ipkgservice keeps it resident, so the power-menu restart doesn't have to launch
  it on demand from inside the UI process — the launch that used to block.

## Fixed since 600020

- **App Catalog is now the community 6.1.2901.** A stock staged catalog ipk was
  being installed over it at first boot, so earlier builds silently ran the old
  5.0.2900.
- **Synergy runtime seeds reliably.** A blocking `initctl` call could stall the
  seeding job indefinitely, leaving the IM transport unable to start.
- **Preware has its feeds immediately after setup**, seeded from Preware's own
  postinst rather than a hand-maintained copy — so the version-specific feeds
  that have no 3.1 content ship correctly disabled instead of failing on every
  update.

---

## Known issues

- **Launcher may come up empty on the first boot (rare).** Restart once and it
  is fixed permanently. See [KNOWN-ISSUE-EMPTY-LAUNCHER.md](KNOWN-ISSUE-EMPTY-LAUNCHER.md).
- **Possible spontaneous reboot shortly after setup (rare, unconfirmed).** Not
  observed on recent builds; instrumentation ships to identify it if it recurs.
  See [KNOWN-ISSUE-RANDOM-REBOOT.md](KNOWN-ISSUE-RANDOM-REBOOT.md).
- **A `.ipk` downloaded in the browser isn't handed to Preware** — it downloads
  and stops (webOS has no "open with" prompt to fall back on). Installing from
  the App Catalog or Preware's own feeds is unaffected. See
  [KNOWN-ISSUE-IPK-BROWSER-PROMPT.md](KNOWN-ISSUE-IPK-BROWSER-PROMPT.md).
- **No post-setup account manager yet.** The sign-in app is first-use only in
  this build; managing your account afterwards will come as a separate App
  Catalog app.
- **No on-device rollback.** Recovery is re-Doctoring — by design.

## Notes for testers

- The Doctor is **unsigned** and the OEM flash gate is patched off, so your
  Java runtime may warn about the missing signature.
- The first boot does housekeeping for about 90 seconds after setup completes
  (seeding the IM runtime and Preware's feeds). If the IM transport or Preware
  feeds look absent immediately after setup, give it a minute.
- Logs worth capturing for any report: `/var/log/messages`,
  `/var/log/ce-*.log`, and `/var/log/reboot-tripwire.log`.
