# webOS CE 3.1.0 — Release Notes

**Release candidate 3 — BUILDMARK 600067** (2026-08-29)

| | |
|---|---|
| Asset | `webosdoctorp310hstnh-ce-600067.jar` |
| Size | 242,910,109 bytes (232 MB) |
| sha256 | `eadd365feb413abb7bd37ea384472efdec3ad236e86e8d8f56349c7b0966c011` |
| md5 | `ea9369a592366e3fd1a63eb8551ec722` |

Verify before flashing:

```
sha256sum webosdoctorp310hstnh-ce-600067.jar
```

**The asset name changed.** Earlier candidates were
`webosdoctorp305hstnh-3.1CE-<mark>.jar`, carrying HP's `p305` product code for
the 3.0.5 Doctor this is repacked from. This is 3.1.0, so it is named for what it
is. The input JAR keeps its own name — that is HP's file.

*(RC2 was BUILDMARK 600056, 2026-08-23, sha256 `cea207df…`; RC1 was 600024.)*

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

## New in RC3 (600067)

Everything in RC2, plus:

**The power menu's Shut Down actually shuts down.** It rebooted instead, on every
CE build since 600011. `/sbin/halt` and `/sbin/poweroff` are symlinks to
`/sbin/reboot`, which picks its action from `basename(argv[0])`; a diagnostic
shim we had wrapped around that name could not preserve argv[0], so every
power-off — the menu, and critical-battery shutdown — came back as a reboot. The
shim is gone and the test suite now asserts those four names stay unwrapped.

**Preware's package service no longer loses its upstart job.** Two separate
faults, both fixed in Preware itself and rebuilt from source for this image:

* Its postinst copied the upstart job *into* the watched directory, so upstart
  could read it half-written and end up with no valid job — Preware then had no
  backend until you rebooted. It now writes to a temp path and renames it in.
* Its service returned success when it could **not** take the D-Bus name, which
  upstart read as a clean exit and respawned instantly — eleven times in a
  second, tripping the respawn limit and parking the job. Preware kept answering,
  so this hid for years, but a Luna Restart in that state can freeze the device.
  It now pauses and exits non-zero, so a name conflict is a paced retry.

Verified across five consecutive reboots with a five-minute soak each: the job
stayed resident every time and the fault never fired.

**A half-wiped app store is now repaired instead of hanging the boot.** If the
Doctor's app-deletion stage hits a read-only `/media/internal` — a dirty VFAT
volume, typically after a force-reboot into recovery — it fails every removal,
**reports the flash successful anyway**, and the device boots with no
`/media/cryptofs/apps`. Every preload then fails and retries forever on the
pulsing logo. First boot now rebuilds that directory and says so in the log.
*After any flash, check the Doctor's log for `AppDeletion: removed the
appDirectory` and for `Read-only file system` — its success message does not
distinguish them.*

**Backup and Restore 3.1.1.** Three fixes:

* Restores no longer read the wrong manifest. The on-device cache was reconciled
  by *name*, and names are not unique — a stale manifest from an earlier restore
  could shadow the real one, which once turned a 115-package restore into six
  files and reported success. The target is now the source of truth for content.
* Scheduled backups no longer grow without bound. Each run re-archived every app
  and `tar czf` stamps the creation time into the gzip header, so byte-identical
  content hashed differently every time and the content-addressed store kept a
  full copy per run. Measured on a real device: six copies of one 295 MB game
  across four days, `/media/internal` at 100%, backups then failing with ENOSPC.
  Verified fixed on hardware: a second backup added **336 KB** and not one
  object over 1 MB, after rebuilding and hashing every app archive on the device.
* A failed backup no longer leaks. Files are stored as the run goes and the
  manifest is written last, so a run that died left full-size files nothing
  referenced — and only the success path purged.

**Local media opens in the media apps again** — with Atlas 0.9.12, released
alongside. Atlas claimed every `file://` URL, which outranks mime and extension
handlers, so photos, videos and music opened in the browser.

**Cosmetic.** Preware's baked-in package descriptions read `(Pre-loaded)` instead
of `(baked into webOS CE)`, and the Doctor window no longer says `HP(R)`.

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

- ~~**Preware may not work until you reboot once after setup.**~~ **Fixed in
  RC3** — both causes fixed in Preware itself and verified across five reboots.
  No post-setup reboot is needed any more.
- **Restoring a backup taken on another device?** The cause is fixed in RC3 (the
  cache is now reconciled on content, not on name), but a genuine cross-device
  collision has not yet been restored through on hardware, so the workaround in
  `BACKUP-RESTORE.md` stands until it has.
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
- Logs worth capturing for any report: `/var/log/messages` and
  `/var/log/ce-*.log`. (`/var/log/reboot-tripwire.log` is gone: the tripwire
  that wrote it was retired after it was found to turn every power-off into a
  reboot — see KNOWN-ISSUES #8.)