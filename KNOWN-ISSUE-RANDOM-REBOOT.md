# Known issue: device may spontaneously reboot shortly after setup (rare, unconfirmed)

**Applies to:** webOS CE 3.1.0 Doctor builds from 2026-08-17 onward, including
the **600024** release candidate.

**Status:** still unreproduced. Recent builds show **zero** crash reports and no
software-initiated reboots beyond the expected ones — on 600024 the tripwire
logged only a deliberate, human-initiated restart. The tripwire ships anyway, so
one report from an affected device would settle it.

## What you might see

A few minutes after finishing first-use setup — during normal use, with no
warning — the device may restart itself on its own.

This was observed **once** on an early internal build and has **not reproduced
since**, so it may already be gone. We're documenting it anyway because a
surprise reboot is alarming, and because this build carries instrumentation
that can tell us exactly what caused it if it ever happens again.

We do have a suspect: during testing we captured webOS's init daemon
(upstart) **crashing with a segmentation fault** while it was spawning boot
jobs. In our captured case a forked copy crashed and the system survived; if
the same fault ever lands in the init process itself, the kernel reboots the
device immediately — with no warning and no software log. Builds from
BUILDMARK 600009 onward no longer let anything critical wait on upstart's
reply (which is also what fixed the "Just a Moment" first-use hang), but the
underlying upstart fragility is stock HP code from 2011.

First, two restarts that are **normal and expected** — don't report these:

- **Right after the Doctor flash finishes**, the device reboots. That's the
  flash completing.
- **At the end of first-use setup** (after you finish the webOS Account
  screens), the screen goes black and the UI restarts. That's the setup app
  handing off to the real desktop — it's a UI restart, not a full reboot.

The issue is a reboot that happens *later*, during ordinary use, when nothing
should be restarting anything.

## What this build does about it

This build ships a **reboot tripwire**: the system's reboot entry points are
wrapped so that any software-initiated reboot logs *who asked for it* (the
requesting process and its parent's command line) to a dedicated file before
the reboot proceeds. It's completely transparent — the only cost is one log
line per legitimate reboot — but it turns "it just rebooted" into a solvable
report.

## If it happens to you: please capture logs

Use the same `novacom` driver the Doctor used to flash your device.

1. After the device comes back up, connect it over USB (normal boot, not
   recovery mode).
2. From a terminal / command prompt on your computer:

   ```
   novacom get file:///var/log/reboot-tripwire.log > reboot-tripwire.log
   novacom get file:///var/log/messages > messages.log
   ```

   (If `novacom` isn't on your PATH: on Windows it's under
   `C:\Program Files\Palm, Inc\`, on Mac/Linux under `/opt/nova/bin/` or
   `/usr/local/bin/`.)

3. Post both files to the release thread, along with roughly how long after
   setup the reboot happened and what you were doing at the time.

Two things about the tripwire log:

- It records **every** software reboot, including the normal ones above — so
  the file existing, or having entries, is not by itself a problem. What we
  need is the entry (or absence of one) matching the *unexpected* reboot.
- If the device rebooted unexpectedly and the tripwire log has **no matching
  entry**, that's just as valuable — it means the reboot didn't go through
  software at all (kernel panic, power/battery event), which points the
  investigation in a completely different direction.
