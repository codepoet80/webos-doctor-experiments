# webOS CE 3.1.0 — Known Issues (RC2, BUILDMARK 600056)

Everything below is reproduced, measured, or traced to a specific line. Each
entry says what it costs a user, what is actually known, and what a fix would
have to do. Nothing here is speculation dressed as a diagnosis.

Ordered by what should be solved before the final release.

---

## 1. ipkgservice wedged on first boot (upstart reads a job file mid-write)

**Severity: high — first observed on 600056.** Fires during first use; **clears
on the first reboot — verified on 600056**, not assumed:

```
after reboot:  imtransport                     (start) running, process 3242
               org.webosinternals.ipkgservice  (start) running, process 2124
               synergy bind mount              present
```

Preware's postinst owns `/var/palm/event.d/org.webosinternals.ipkgservice`
(confirmed: the path is listed in `/media/cryptofs/apps/usr/lib/ipkg/info/org.webosinternals.preware.list`).
During the first-use preload pass it stops ipkgservice, rewrites that job file,
and starts it again. Upstart watches that directory and re-reads on change — and caught the file **partially written**:

```
01:49:24  app-install -install-only                          preload pass
01:49:36  Control request to stop  org.webosinternals.ipkgservice
01:49:38  upstart: /var/palm/event.d/org.webosinternals.ipkgservice:
                   unable to read: Invalid argument          <-- partial read
01:49:39  Control request to start org.webosinternals.ipkgservice   (25ms later)
```

The start request had no valid job definition to act on, so the job sits
`(stop) waiting` and further `initctl start` does nothing.

**What it costs the user.** ipkgservice is Preware's backend, so **Preware does
not work** until the device is rebooted. Worse, a power-menu Luna Restart taken
in this state can freeze the device — the failure mode that made `respawn`
non-negotiable on this job in the first place.

**Collateral, same window.** `ce-cryptofs-seed`'s `kick_imtransport` fired while the synergy interpreter was still unseeded, so imtransport's pre-start correctly declined to exec (`interpreter still absent -- not exec'ing`, 18:50:16) — but the job is left wedged in `pre-start` pointing at **pid 8565, which no longer exists**. The missing synergy bind mount is downstream of that, not a third fault. All three automated FAILs on 600056 are this one race.

**Frequency: 1 of 6 observed boots.** Zero occurrences across
600033/600037/600052/600055 (`grep -c 'ipkgservice NOT resident' scripts/results-*.txt`).
Latent since Preware became a preload (`c3eff2b`, 600037) — every earlier roll
simply won the race.

**What a fix must do.** Make the partial read *impossible*, not less likely:
write the job file to a temp path in the same directory and `mv` it into place.
`mv` within a filesystem is atomic, so upstart's inotify sees either the old
file or the complete new one. The natural home is `ce-cryptofs-seed`, which
already runs after first use and already kicks this job.

**Why a timing tweak is not acceptable here.** The race fires roughly one boot in six, so a single clean boot after a change proves nothing. Any fix has to be
justified structurally and validated as "no regression across N boots", not by
one green run.

---

## 2. Restore silently dropped apps over ~350MB (fixed in 600056, unverified)

**Severity: high — the fix ships in 600056 but has not yet run on hardware.**

On the 600055 restore, 2 of 115 packages failed: Hot Pursuit (427MB) and
Driver HD (379MB). Sandstorm (261MB) and Tiger Woods (248MB) succeeded. A cutoff falling *between* archives written the same way is the signature of a fixed budget, not a bad archive — `restoreAppDirectories` extracted with a flat
`{ timeout: 120000 }`.

600056 sizes every restore stage by the archive it is handling:

```js
listBudget    = clamp(archiveMb * 3000, 600s, 1800s)   // was flat 180s
clearBudget   = clamp(archiveMb *  500, 120s,  600s)   // was flat  30s
extractBudget = clamp(archiveMb * 3000, 600s, 1800s)   // was flat 120s  <-- the bug
```

Sizing on the *archive* while the cost is driven by *installed* bytes is the
weak spot; the 600 s floor is what covers a large, highly compressible app. At
that floor every app size seen on a device keeps a ≥3x margin.

**Diagnosability was the deeper bug.** `exec()`'s timeout kill arrives as an
Error whose message is `Command failed:` with nothing after it — indistinguishable from a real tar error, which is why this read as archive corruption for a full release cycle. 600056 names the stage, says whether the clock ran out, and carries the reason into the restore receipt.

**Constraint for anyone tempted to add more room:** `PACKAGE_OP_TIMEOUT_MAX` in
`common.js` must **not** be raised. `doRestore` spends it twice, so 60 minutes
each already equals the bus's 7200 s `commandTimeout`. Past that the caller has
given up and there is no receipt at all.

---

## 3. Manifest cache collides by name across devices

**Severity: high — cost a full day of work; documented but not fixed.**

`syncManifests` reconciles the on-device manifest cache **by name only**, and
manifest names (`NNNNNN-<nduId>`) are not unique: the counter restarts when a
store is cleared. `/media/internal` survives a Doctor flash, so a stale
`000001-19Q` from an earlier restore outlives the reflash and shadows the real
one from the backup being restored.

Observed: restore failed with "Error restoring data" / "No such file or
directory" and reported `restored 6 file(s), 0 skipped` for a 115-package
backup. The host copy of the backup was verified perfect (128/128 files, 0
corrupt) — the device was reading a different manifest of the same name
(md5 `3f601e2a…` on device vs `8213e447…` in the backup).

**Workaround** is in `BACKUP-RESTORE.md`: clear the manifest cache before
restoring a backup that came from another device or another store.

**What a fix must do.** Reconcile on content, not name — compare the manifest's
hash (or `backedUpFrom.nduId` + creation time) and prefer the copy that belongs
to the backup being restored. A "restored N files" count wildly below the
package count should also be treated as a failure, not reported as success.

---

## 4. LunaSysMgr SIGSEGV at OOBE teardown

**Severity: low — did NOT recur on 600056.**

The minimal-mode first-use instance (`LunaSysMgr -s -u minimal -a com.palm.app.firstuse`) faulted in `PrvLogThread` on a freed GLib async queue while tearing down at OOBE handoff. Seen on 600052 and 600055; **0 rdxd crash reports on 600056** — the first clean OOBE of the cycle.

A process that was exiting anyway, on a path that runs once per device. One
clean run does not retire a race, so this stays on the list until it survives
several flashes.

---

## 5. `com.palm.appDataBackup` does not answer `postRestore`

**Severity: medium — recorded honestly, not silently swallowed.**

Seen on both the 600055 and earlier restores:

```
com.palm.appDataBackup/postRestore did not answer within 60000ms
```

The service is registered and the restore records it in the receipt's `skipped`
list rather than failing the run. Consequence: HTML5 app data and the launcher
page layout are not restored. It has appeared on every large restore so far and
has not been investigated.

---

## 6. Preware patch packages restore as inert payload directories

**Severity: low.**

Two Preware-installed *patches* come back from a directory restore as their
payload directories rather than as applied patches — the files land, but nothing re-applies them. Patches are outside what `ipkg` can reinstall from an archive.
Not investigated further; recorded so it is not rediscovered as a restore bug.

---

## 7. First-boot housekeeping window (~90 s) looks like breakage

**Severity: cosmetic, already documented for testers.**

Preware shows no packages and the IM transport is absent for roughly 90 seconds
after setup completes, because the feeds are seeded only after the 31MB cryptofs
copy finishes. Working as designed; called out in RELEASE-NOTES so testers do
not report it.

---

## Carried over from earlier builds

- **LunaDownloadMgr SIGSEGV** (`curl_multi_remove_handle`). The 1.1.0 patch
  *reduces* but does not eliminate it; recurred on 600033 on the first download
  after boot. webOS 3.x only. Trigger still not understood.
- **"Not Enough Storage" popup** after leaving USB drive mode — an MSM-exit
  remount race, not a real disk condition.
- **No post-setup account manager.** The sign-in app is first-use only in this
  build; managing the account afterwards ships as a separate App Catalog app.
- **No on-device rollback.** Recovery is re-Doctoring, by design.

---

## How these were found

`scripts/ce-test-full.sh` decides ~90 checks a shell can decide; results land in `scripts/results-<BUILDMARK>.txt` and are marked into `TEST-PLAN.md`. Comparing runs across builds is what surfaced #1 — the check had passed in four prior runs and failed in the fifth, which is the only reason it was recognised as new rather than assumed to be longstanding.
