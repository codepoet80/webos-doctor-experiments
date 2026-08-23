# webOS CE 3.1.0 — Release Notes

**Release candidate 2 — BUILDMARK 600056** (2026-08-23)

| | |
|---|---|
| Asset | `webosdoctorp305hstnh-3.1CE-600056-rc.jar` |
| Size | 243,412,798 bytes (233 MB) |
| sha256 | `cea207df818af710dec9349400b72a3a52bf046da9fbf63b7e7c6d645cc903f6` |
| md5 | `9f0c0823d6e7eb5d32469b7b972d990b` |

Verify before flashing:

```
sha256sum webosdoctorp305hstnh-3.1CE-600056-rc.jar
```

*(RC1 was BUILDMARK 600024, 2026-08-18, sha256 `ec30762f…`.)*

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

## New in RC2 (600056)

**Backup and Restore actually works.** The stock Backup app was a UI over Palm's
retired servers; it is replaced by an on-device backup writing content-addressed
backups to `/media/internal/webos-backups`, and it is the supported way to carry
data from webOS 3.0.5 onto CE. Verified end to end: a 115-package backup from a
3.0.5 device restored onto CE with **102 apps reinstalled and none failed**,
all 11 of their services registered and reachable on the bus after the reboot,
and a receipt naming everything it could not put back and why. The largest app
in that set was a 296MB archive.

Backup is still a **best-effort** feature — it restores applications and their
data, not Preware patches, and one package in that run was never captured at
backup time. See `BACKUP-RESTORE.md` before moving a backup between devices:
the manifest has to travel with it, and a stale one will shadow the real
backup.

**Accounts** — the Settings → Accounts list shows a single SYNERGY ACCOUNTS
group again, rather than groups nested inside a group.

**A boot-time crash is gone.** On a Wi-Fi TouchPad the stock WAN daemon
respawn-thrashed until upstart stopped it, and jobs starting in that same moment
died with SIGSEGV. Harmless in effect — the affected jobs had already done their
work — but it produced a crash report on every boot and every Luna Restart. See
`4G-TOUCHPAD.md`.

**Preware reports CE's baked packages honestly**, including the TLS and
root-certificate updates, so it no longer offers them as fresh installs and a
3.0.5 restore no longer copies their leftovers onto the device.

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

Full detail, with evidence and what a fix would have to do, is in
**[KNOWN-ISSUES.md](KNOWN-ISSUES.md)**. The ones a tester will actually meet:

- **Preware may not work until you reboot once after setup.** On roughly one
  boot in six, the package-manager service is left wedged by a first-use race.
  A reboot fixes it permanently. Until you reboot, avoid *Luna Restart* from
  the power menu — it can hang in this state.
- **Restoring a backup taken on another device?** Clear the manifest cache
  first — see `BACKUP-RESTORE.md`. Backup names are not unique across devices
  and a stale one will shadow the real backup.
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