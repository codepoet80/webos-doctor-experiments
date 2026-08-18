> **SUPERSEDED for the 600014 flash — read `SESSION-NOTES-2026-08-18.md` first.**
> It records what 600014 actually fixed, three open bugs (two of them mine), and
> the recommendation to hide the webOS Account icon for the preview release.

# Next session plan — after flash 600011, Doctor 600012 built (2026-08-17)

## The one-line story of tonight

Nothing regressed. **The extra reboot was repairing a first-boot bug we never
knew we had.** Fixing the OOBE hang removed that reboot, so the first boot is
now the only boot, and everything that silently failed during early boot now
*stays* failed. Every symptom below has the same shape.

## The class of bug (read this before writing any boot job)

`/media/cryptofs` appears in `/proc/mounts` roughly **100 seconds before the
store actually accepts writes**. On 600009 the two jobs that fire on
`stopped finish` both ran inside that window:

| job | ran | wrote | exit |
|---|---|---|---|
| `ce-cryptofs-seed` | 23:48:48–23:49:09 | nothing (mkdir/cp failed) | 0, flag set |
| `org.webosinternals.ipkgservice` pre-start | 23:48:48–23:48:54 | nothing | 0 |

Writes made from ~23:49:10 on (app-install's stock apps) all survived, so the
store was fine seconds later. Both jobs polled for the **mount** and treated
that as readiness.

**The invariant, three ways:**

1. *A resource being present is not the same as the resource being usable.*
   Mounted ≠ writable. File exists ≠ file fully readable (the same bug bit
   `imtransport`: it SIGBUS'd mmapping seeded libs that cryptofs could not yet
   serve). Job started ≠ job succeeded.
2. **Verify, then record.** Never set a "done" flag on the strength of having
   *attempted* the work. Check the result and retry; only then flag it.
3. **Never `console none` without a log file.** Both failures were invisible
   for months because the jobs discarded their own output.

Also: any job whose work must survive first-use should trigger on **both**
`stopped finish` *and* `first-use-finished`. That list is now
`ce-cryptofs-seed`, `ce-default-wallpaper`, `ce-language-patches`. Audit
`ce-firstboot-tweaks` and `ce-remove-preloads` next session — they run on
`stopped configurator` and have never been checked against a no-reboot OOBE.

## Fixed and baked (BUILDMARK 600010, not yet flashed)

- `ce-cryptofs-seed`: write-probe instead of mount-probe; copies then
  **verifies every seed file**, retries up to 5×; only flags on success; logs
  to `/var/log/ce-cryptofs-seed.log`; also triggers on `first-use-finished`;
  restarts `ipkgservice` if the ipkg config is missing so its (idempotent)
  seeding re-runs.
- `imtransport` pre-start: full-reads every synergy runtime lib until two
  passes agree before launching (fixes ~2 SIGBUS crash reports per boot).
- `harness.py`: FATALs on a missing/empty `--overlay` dir (a cwd-relative typo
  silently built a **stock** jar earlier today).
- LunaCE `markFirstUseDone`: emit is backgrounded — **validated on 600009**,
  where upstart segfaulted at the exact same moment as on 600008 and the
  handoff completed anyway.

## FIXED — webOS Account app (in 600012, live-verified on the 600011 device)

Both bugs are in the OOBE app tree. **Do not edit the overlay copies** under
`build/overlays/*/rootfs/.../com.palm.app.firstuse/` — they are generated.
Sources: `build/community-firstuse/oobe/{FirstUse-oobe.patch,Palm-oobe.patch,config.js}`,
`build/community-firstuse/make-overlay.sh`, and `~/Projects/webos-community-account`.

### 1. Launcher launch re-runs OOBE and deletes the account — FIXED

`FirstUse.js` has **no way to tell an OOBE launch from a launcher launch** — no
`isMinimal`, no `uiType`, no `ran-first-use` check anywhere in the app. It
infers mode from a `?locale=` URL param that only the *language card itself*
sets (`source/language/Language.js:199`), so a cold OOBE launch and a launcher
launch look identical: `step` stays `-1` → `config[0]` → the Language card.

`source/language/Language.js:63-67` calls `deleteAnyExistingPalmProfileAccounts()`
**unconditionally from its constructor** — rendering that card *is* the delete
(`:245`). The blue screen is the same card: `$.mainbox` starts empty and is
only filled by the async language-list response, which never arrived.

**Landmine found while investigating:** `FirstUse.js:976` treats "has locale
param" as "we are OOBE" and calls `PalmSystem.shutdown()`. The comment claims
LunaSysMgr passes locale/country on the URL — **it does not**. So a launcher
launch that walks through the language card will *power the device off* on
Done. Fix this even if we do nothing else.

Recommended fix: detect non-OOBE mode properly (`ran-first-use` preference, or
have LunaCE pass a launch param), then swap `FirstUse.config` to the standalone
two-card list (`palm`, `signin`) — the standalone build never had this bug
precisely because its config has no `language` entry. Independently, guard
`Language.js`'s delete: it is the only destructive call in the app.

**How it was fixed (600012).** `PalmSystem.isMinimal` already existed in
LunaSysMgr (`JsSysObject.cpp:155`, returns `uiType == UI_MINIMAL`) — true only
while LunaSysMgr runs the app AS first use. That is the honest signal the app
was missing; no LunaCE rebuild needed. Changes, all in
`build/community-firstuse/oobe/` (regenerated patches, never the overlay):

- `FirstUse.js create()` sets `this.wosaIsOobe` from `isMinimal` (unknown ⇒
  OOBE, since skipping first use is worse than replaying it) and starts a
  standalone launch past the language card.
- `closeApp()` gates `PalmSystem.shutdown()` on `wosaIsOobe` instead of
  `inLocale` — this is the power-off landmine.
- `done()` no longer pushes empty language/country into `setCustomization` on a
  standalone finish; `wosaSafeClose()` skips the restart popup.
- `Language.js` guards the account delete on `isMinimal` too — second lock on
  the same door, because the cost of being wrong is the user's account.
- `make-overlay.sh` applies the new `Language-oobe.patch` and now **fails the
  build** if any of these deltas go missing on a future app rebase, or if
  `closeApp` ever gates on `inLocale` again.

**Live-verified on the 600011 device** (patched files pushed, no flash):
`WOSA: launch mode = standalone` → `nextStep(): 0` → terms card (the language
card never rendered) → no delete line → account still `webOS User` → zero
shutdown attempts → device still up.

**Does this need upstreaming? No — checked.** `webos-community-account`'s own
`app/config.js` is `[palm, signin]`: the standalone build has **no language
card**, so it never renders the destructive constructor and `inLocale` is never
set there (so its `closeApp` always took the `window.close()` branch). The bug
exists only because the CE OOBE config adds the language card, which makes the
CE patch tree exactly the right home for the fix. Nothing to sync upstream —
but if the app ever gains a language card of its own, it inherits the bug, so
`Language.js`'s guard is the one worth contributing back.

### 2. "Skip Account Setup" creates "Dr. Skipped Firstuse" — FIXED in 600011

The app never sets that name — it only closes. The profile is created on the
**next boot** by `/etc/event.d/firstuse-createDefaultAccount`, which calls the
stock `CreateProfileCommandAssistant.js:16`:
`PalmProfileUtil.createLocalAccount("Dr. Skipped Firstuse", …)`. On a
palmprofile account, `username` *is* the display name.

Changing it to "webOS User" must touch **all three** together or the rename
guard breaks:
- `CreateProfileCommandAssistant.js:16` — the literal (not currently in any
  overlay; needs adding to `make-overlay.sh`'s service copy step and the
  `webos-community-account` side + `ipk/postinst`).
- `palm_profile_util.js:332` — the sentinel `username === "Dr. Skipped Firstuse"`.
- Consider unifying with `SignOutCommandAssistant.js`, which already renames to
  `"Local User"` on sign-out.

Note there is now a **second, parallel** local-account creator in the image:
`com.palm.service.accounts/handlers/create-local-account.js:33` uses
`"Open webOS"`. Decide which one actually runs before changing strings.

## Tomorrow

1. Flash **600012** (built, unflashed): carries the app fix on top of everything
   600011 proved. First boot should need no intervention at all.
2. Re-run `scripts/ce-test-600011.sh`, then tap the **webOS Account** icon —
   this build is the first where that is safe.
3. Audit `ce-firstboot-tweaks` and `ce-remove-preloads` against a no-reboot OOBE
   (they still trigger only on `stopped configurator`).
4. Remaining human tests: QuickOffice, email sync, controller pairing.

## Device state as of tonight

Flashed 600009, first-use complete, healed live: cryptofs re-seeded by hand,
Preware feeds + seeded stanzas restored (`ipkgservice` restarted), Synergy
content in place. The webOS account was deleted by the launcher-launch bug, so
account state is not representative. Known good this flash: GAMES tab, LunaCE
launcher, App Catalog, 22.png wallpaper, no spontaneous reboot, no hang.

## Test-plan additions

- First boot must reach a working state **without a second boot** — that is now
  a first-class requirement, not an implementation detail.
- After OOBE with **no reboot**: Preware feeds load, seeded stanzas present,
  `/media/cryptofs/synergy-glibc/lib/ld-linux.so.3` exists, transport running,
  `/var/log/ce-cryptofs-seed.log` says "seed verified complete".
- Launch **webOS Account from the launcher** after OOBE: must show sign-in, must
  NOT delete the account, must NOT power off on Done.
- Skip Account Setup: profile is named "webOS User".
