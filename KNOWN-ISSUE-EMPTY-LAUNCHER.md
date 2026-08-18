# Known issue: launcher may come up empty after first boot (rare)

**Applies to:** webOS CE 3.1.0 Doctor builds from 2026-08-17 onward, including
the **600024** release candidate.

**Status:** not observed on any build since 600014. The protection described
below still ships, so if the race does fire it is caught and a restart clears it
permanently.

## What you might see

In rare cases, after Doctoring a device and finishing the first-use setup, the
launcher comes up with **no app icons** — the pages (APPS, DOWNLOADS, FAVORITES,
SETTINGS) are there, but they're empty. The apps themselves are fine: they are
installed, Just Type finds them, and anything already on your quick-launch bar
still works. Only the launcher page layout is affected.

This is a **timing race during the very first boot** after a Doctor flash. It is
not caused by anything you did, and it does not damage the device.

## What this build does about it

This Doctor ships a hardened LunaCE that detects the broken state and refuses to
let it stick. If you hit the race:

- the launcher may look empty for **that one boot**;
- **restarting the device fixes it** — the next boot rebuilds the launcher with
  every icon in place, permanently.

So if your launcher is empty after first boot: **just restart** (hold the power
button, or Device Info → Reset Options → Restart). If it's still empty after a
restart, that's unexpected — please definitely send logs (below).

## If it happens to you: please capture logs

The hardened build writes detailed diagnostics the moment the race fires. Those
logs are the missing piece for fixing the root cause — a report from an affected
device is genuinely valuable, and logs from the affected boot are best captured
**before** lots of other use (webOS rotates its logs).

You already have everything you need: the same `novacom` driver the Doctor used
to flash your device.

1. Connect the TouchPad over USB (normal boot, not recovery mode).
2. From a terminal / command prompt on your computer:

   ```
   novacom get file:///var/log/messages > messages.log
   novacom get file:///var/log/messages.0.gz > messages.0.gz
   ```

   (If `novacom` isn't on your PATH: on Windows it's under
   `C:\Program Files\Palm, Inc\`, on Mac/Linux under `/opt/nova/bin/` or
   `/usr/local/bin/`. The second file may not exist — that's fine.)

3. Optional quick check — the interesting lines all carry one tag:

   ```
   grep LAUNCHER-LIFECYCLE messages.log
   ```

   On an affected boot you'll see a line saying a launcher instance
   `adopted ZERO icons` and another `REFUSING save`. That's the protection
   working — and the lines around it tell us what triggered the race.

4. Post both files (or at minimum the `LAUNCHER-LIFECYCLE` lines plus ~50 lines
   around them) to the release thread, along with:
   - whether the launcher was empty on first boot, and
   - whether a restart brought the icons back.

## Reports from healthy devices help too

If your first boot came up fine (expected for most people), a
`grep LAUNCHER-LIFECYCLE messages.log` from that first boot is still useful — it
tells us whether the race simply didn't fire on your device or fired and was
neutralized.

For reference, a **healthy** boot shows exactly three lines: an `init-only (0,0)
flavor` line, a `found launcher pointer NULL` line (that's the normal creation
path on every boot, despite the wording), and one `LauncherObject ... created`.
The race signature is any `DESTROYED` line, a second `created`, an
`adopted ZERO icons` line, or a `REFUSING save` line. A one-line "launcher fine,
grep shows the normal three lines" is a perfectly good report.
