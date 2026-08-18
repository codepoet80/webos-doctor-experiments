> **HISTORICAL — notes from the 600014 flash.** All five open items here were
> resolved or superseded by the 600024 release candidate: the ipkg status
> stanzas now seed correctly, the StartOver probe and blank-card issues went away
> with the OOBE-only split, and the launcher icon was removed as recommended.
> Current state: RELEASE-NOTES.md and TEST-PLAN.md.

# Session notes — 2026-08-18, flash 600014

Written at the point we stopped. Read the "How this went wrong" section before
picking any of this up: the process problem matters more than the bug list.

## State of the device

Flashed 600014, first-use complete, currently in the launcher. LunaSysMgr had to
be restarted by hand (`initctl start LunaSysMgr`) after it ended in
`(stop) waiting` — see open item 4. The ipkg stanzas were healed by hand
(`initctl stop/start org.webosinternals.ipkgservice`), so Preware currently
shows Preware/Govnah/Synergy as installed on this device even though a fresh
flash would not.

## What 600014 genuinely fixed (evidence, not inference)

- **Seed verification by size earned its keep on this exact boot.** The log:
  ```
  attempt 1: 31 seed file(s) still missing -- retrying
  seed verified complete on attempt 2
  ```
  The old existence-only check would have passed those 31 short/missing files,
  set the flag, and left Synergy to SIGBUS on a truncated library.
- **Preware feeds seeded on first boot** (13 files) via the new write-probe in
  ipkgservice's pre-start, rather than the old mount-probe.
- **Every CE job now logs.** Every finding below was read off a log file instead
  of being inferred from symptoms over hours. That is the single biggest change.
- Deshadow logged `deshadow verified clean`; profile named **webOS User**;
  wallpaper **22.png** (and the wallpaper job correctly *stood down* — the
  customization path had already applied it, which is the intended division of
  labour); preloads gone; transport running; tripwire empty (the OOBE "reboot"
  is the intended UI restart); 39/42 automated checks pass.

## Open items, most important first

### 1. ipkg status stanzas are wiped after first-use (REGRESSION, build not fixed)
The cryptofs store is re-initialized during first-use; `app-install` then
reinstalls the stock cryptofs apps and **rewrites `usr/lib/ipkg/status`
wholesale**, dropping the three stanzas we appended minutes earlier. Confirmed:
all three present at 11:14, gone at 11:17, status mtime 11:17 with only the 14
stock packages.

`ce-cryptofs-seed`'s recovery hook only re-checks whether the *feed config*
(`arch.conf`) is missing. Feeds survived, so it never noticed the stanzas had
gone. On 600011 this didn't bite purely by timing luck.

**Fix:** broaden the `kick_dependents` condition in `bake.py` to also test
`grep -q "^Package: org.webosinternals.preware$"` in the status file, and give
it a trigger that fires *after* `app-install` goes quiet (poll for no
`app-install`/`ipkg` process, bounded). A dedicated late job is probably cleaner
than another hook inside the seed job.

### 2. StartOver mode probe throws on every launch (MY BUG, not fixed)
```
WOSA StartOver mode probe failed: TypeError: Cannot read property
'wosaIsOobe' of undefined, StartOver.js:11
```
`StartOver` is constructed during `FirstUse.create()`'s `this.inherited()`,
which runs **before** `enyo.application.FirstUse = this` is assigned — so the
probe reads a property off `undefined`. It is caught, so it fails *open*: the
button stays visible and the hide never worked at all. The delete guard in
`restartFirstUse` is unaffected (it fails safe — an undefined `wosaIsOobe`
takes the standalone branch and skips the Wi-Fi delete).

**Fix:** read the flag defensively, e.g.
`var fu = enyo.application && enyo.application.FirstUse; var isOobe = fu ? !!fu.wosaIsOobe : true;`
and set showing in `rendered()` rather than `create()`. Better: decide whether
to hide it at all — see item 5.

### 3. webOS Account standalone opens to a blank card (NOT root-caused)
Launching from the launcher shows the background and nothing else. The app
starts, logs `launch mode = standalone`, runs `start()` to completion
(`getMachineNameResponse`, `gotCarriersSucess`, ConMan subscription all fire) —
but `getRestoreInProgressFailure` never fires, so `nextStep()` is never called
and no card is ever created. Yesterday, on the same app code minus the
StartOver/power/dim changes, that handler *did* fire and the terms card
rendered.

**Unknown:** whether my changes caused it. The suspicious asymmetry is that
`getRestoreInProgress*` is a *failure* handler — it may only fire when the
`FIRSTUSE_RESTORE_IN_PROGRESS` preference is absent, which is true on the first
standalone launch and false afterwards. That would make this a pre-existing bug
that only shows up from the second launch onward, not a regression. **Do not
assume either way without checking which handler fires** — instrument both
branches first.

### 4. Luna restart from the power menu hung (NOT root-caused)
After a user-initiated Luna restart, `LunaSysMgr` was left `(stop) waiting` —
goal `stop`, so `respawn` does not apply and nothing brought it back; the device
sat dead until `initctl start LunaSysMgr`. `ce-language-patches` also does a
`stop`/`start` pair, but its log is empty (it never reported a patch), so it is
probably not the culprit. There is one `upstart SIGSEGV` crash report on this
boot, which is the recurring stock fragility and a plausible contributor.
**Needs instrumenting, not guessing.**

### 5. Decide whether the launcher icon ships at all
Every one of items 2–4 lives on the **standalone** path, which only exists
because we added the webOS Account launcher icon. That path has no automated
coverage, cannot be exercised from novacom (a `luna-send` launch does not
foreground the card the way a tap does), and therefore burns the user's time as
its only test loop.

**Recommendation:** for the preview release, set `"visible": false` on the
firstuse appinfo (one line in `make-overlay.sh`), which removes the whole
standalone path from the product. Everything else in the image is verified.
Then develop the account app's standalone mode properly, with a test loop, and
re-enable the icon when it is actually testable. The OOBE path — the one that
matters for a Doctor image — is unaffected and working.

## How this went wrong (the part worth keeping)

The bug list above is ordinary. The process failure is not:

1. **I made changes I had no way to verify, on the user's device, using the
   user's time as the test harness.** The pre-flash audit found real issues
   (the Start Over Wi-Fi wipe is genuinely destructive and genuinely reachable),
   but "found by reading code" and "verified" are different states, and I shipped
   them into a flash as though they were the same.
2. **I fixed hypothesised bugs and broke working behaviour.** Start Over was
   never reported as a problem. The audit's finding was sound, but the change
   was bigger than the finding required — I both hid the button *and* guarded
   the delete when only the guard was justified, and the hide is the half that
   broke (item 2).
3. **The verification asymmetry keeps repeating.** Twice now I have called
   something verified from logs, and once called something broken from a
   screenshot; all three conclusions were wrong. Logs prove that code ran, not
   that a user can see or use the result.

**Rule for next session:** no change to the account app ships in an image until
it has been exercised on-device by a tap, or the icon is hidden and the path is
out of the product. One change per flash on that path, not five.
