/* Bridge to the root helper (woce-backupd).
 *
 * Why this exists: the triton jail this service runs in mounts /etc/palm ro,
 * /media/internal rw and /var/file-cache rw — but not /var/preferences,
 * /var/palm/data or /media/cryptofs. Registered services legitimately return
 * absolute paths into those trees (com.palm.service.contacts returns contact
 * photo paths; com.palm.systemservice returns preference files), and
 * fileUtil.getAbsolutePath passes absolute paths through untouched. Without a
 * helper outside the jail those files are simply unreadable.
 *
 * The helper is optional. When it is absent every call here reports
 * unavailable and the backup engine records the affected paths as skipped
 * rather than failing — that is the "limited mode" the UI surfaces.
 *
 * IPC is a job file per request, not a command per file: one round trip covers
 * a whole service's file list, so the poll interval does not dominate runtime.
 */
/*global Future, JOB_ROOT, logger, packageOpBudget, require, setTimeout, fileUtil,
  isEmpty */

var privileged = (function () {
    var that = {};
    var fs   = require('fs');
    var path = require('path');

    var POLL_INTERVAL = 250;    // ms between checks for a result file
    var PING_TIMEOUT  = 3000;   // ms to wait for the helper to answer a ping
    var JOB_TIMEOUT   = 600000; // ms to wait for a real job (10 min)

    var available;              // undefined until probed, then true/false
    var jobCounter = 0;

    var nextJobId = function () {
        jobCounter += 1;
        return String(new Date().getTime()) + "-" + jobCounter;
    };

    /**
     * Waits for resultPath to appear, then reads and removes it.
     */
    var awaitResult = function (future, resultPath, timeout, elapsed) {
        elapsed = elapsed || 0;

        path.exists(resultPath, function (exists) {
            if (exists) {
                fs.readFile(resultPath, "utf8", function (err, data) {
                    // The result file has served its purpose either way.
                    try { fs.unlinkSync(resultPath); } catch (ignored) {}

                    if (err) {
                        future.exception = err;
                        return;
                    }
                    var parsed;
                    try {
                        parsed = JSON.parse(data);
                    } catch (parseErr) {
                        future.exception = new Error("Malformed helper result: " + data);
                        return;
                    }
                    if (parsed.returnValue === false) {
                        future.exception = new Error(parsed.errorText || "Helper job failed");
                    } else {
                        future.result = parsed;
                    }
                });
            } else if (elapsed >= timeout) {
                future.exception = new Error("Timed out waiting for the root helper");
            } else {
                setTimeout(function () {
                    awaitResult(future, resultPath, timeout, elapsed + POLL_INTERVAL);
                }, POLL_INTERVAL);
            }
        });
    };

    /**
     * Writes a job for the helper and waits for its result.
     */
    var submit = function (job, timeout) {
        var jobId      = nextJobId();
        var jobPath    = JOB_ROOT + jobId + ".job";
        var resultPath = JOB_ROOT + jobId + ".done";
        // Write to .tmp then rename, so the helper never sees a half-written job.
        var tempPath   = JOB_ROOT + jobId + ".tmp";

        var future = fileUtil.mkdirs(JOB_ROOT);
        future.then(this, function (f) {
            var result = f.result;
            job.id = jobId;
            fs.writeFile(tempPath, JSON.stringify(job), "utf8", function (err) {
                if (err) {
                    f.exception = err;
                } else {
                    fs.rename(tempPath, jobPath, function (renameErr) {
                        if (renameErr) {
                            f.exception = renameErr;
                        } else {
                            f.result = {};
                        }
                    });
                }
            });
        });
        future.then(this, function (f) {
            var result = f.result;
            awaitResult(f, resultPath, timeout || JOB_TIMEOUT);
        });
        return future;
    };

    /**
     * True if the root helper is installed and responding. Probed once per
     * service lifetime; the answer cannot change while we are running.
     */
    that.isAvailable = function () {
        if (available !== undefined) {
            return new Future(available);
        }

        var future = submit({ op: "ping" }, PING_TIMEOUT);
        future.then(this, function (f) {
            if (f.exception) {
                logger.info("Root helper unavailable, running in limited mode:",
                    f.exception.message);
                available = false;
            } else {
                var result = f.result;
                logger.info("Root helper available, version", result.version);
                available = true;
            }
            f.result = available;
        });
        return future;
    };

    /**
     * Copies files the jail cannot read into stageDir, flattened to
     * checksum-free staged names. Returns { staged: {origPath: stagedName},
     * missing: [paths] }.
     *
     * Unreadable or missing paths come back in `missing` rather than throwing:
     * a single stale path in one service's file list should not abort a backup.
     */
    that.stage = function (paths, stageDir) {
        if (!paths || paths.length === 0) {
            return new Future({ staged: {}, missing: [] });
        }
        return submit({ op: "stage", paths: paths, stageDir: stageDir });
    };

    /**
     * Writes staged files back to their absolute destinations, creating parent
     * directories as needed. `files` is [{ staged: name, path: absDest }].
     *
     * The helper enforces a destination allowlist — see woce-backupd.js. This
     * is the direction that could escalate privilege, so it is the constrained
     * one.
     */
    that.unstage = function (files, stageDir) {
        if (!files || files.length === 0) {
            return new Future({ restored: [], skipped: [] });
        }
        return submit({ op: "unstage", files: files, stageDir: stageDir });
    };

    /**
     * Makes a Luna call through the helper, which reaches the private bus.
     *
     * Resolves with the service's reply, or fails if the helper is absent or
     * the call did. See the lunacall op in device/woce-backupd.js for why this
     * is needed and what it will and will not call.
     */
    that.lunacall = function (service, method, params) {
        var future = submit({
            op: "lunacall",
            service: service,
            method: method,
            params: params || {}
        }, 120000);

        future.then(this, function (f) {
            var result = f.result;
            var reply = result.reply || {};
            // A Luna reply can carry returnValue:false, which is a failure even
            // though the transport succeeded.
            if (reply.returnValue === false) {
                var err = new Error(reply.errorText ||
                    ("Call to " + service + "/" + method + " failed"));
                err.serviceId = service;
                throw err;
            }
            f.result = reply;
        });
        return future;
    };

    /**
     * The raw contents of /etc/palm/backup, read as root.
     *
     * Needed because com.palm.keymanager's registration file is mode 0640
     * root-only. The jail can see the directory but not that file, so without
     * the helper the keymanager — and every credential it holds — is silently
     * dropped from the backup.
     */
    that.readRegistrations = function () {
        return submit({ op: "readRegistrations" }, 30000);
    };

    /**
     * The installed third-party package list, from ipkg. Recorded in the
     * manifest so a restore can report (or reinstall) what was on the device.
     */
    that.listInstalledApps = function () {
        return submit({ op: "listInstalledApps" }, 60000);
    };

    /**
     * Copies the .ipk files for the given packages into destDir, so a restore
     * can reinstall them without the App Catalog. For a package whose .ipk
     * isn't cached anywhere, the helper falls back to tarring up the app's
     * installed directory instead (archivedDirs) - see the SECURITY note in
     * device/woce-backupd.js for what that trades away.
     */
    that.archivePackages = function (packages, destDir, timeout) {
        if (!packages || packages.length === 0) {
            return new Future({ archived: [], archivedDirs: [] });
        }
        return submit({ op: "archivePackages", packages: packages, destDir: destDir },
            timeout || packageOpBudget(packages.length));
    };

    /**
     * Installs each { id, path } .ipk via the helper's ipkg. path must be
     * inside WORK_ROOT — see the SECURITY note in device/woce-backupd.js for
     * why that bound is what makes this op safe to expose at all.
     */
    that.installPackages = function (files, timeout) {
        if (!files || files.length === 0) {
            return new Future({ installed: [], failed: [] });
        }
        return submit({ op: "installPackages", files: files },
            timeout || packageOpBudget(files.length));
    };

    /**
     * Un-tars each { id, path } app-directory archive back over the app's
     * own directory. Same WORK_ROOT bound on path as installPackages; see the
     * SECURITY note in device/woce-backupd.js.
     */
    that.restoreAppDirectories = function (files, timeout) {
        if (!files || files.length === 0) {
            return new Future({ restored: [], failed: [] });
        }
        return submit({ op: "restoreAppDirectories", files: files },
            timeout || packageOpBudget(files.length));
    };

    /**
     * Reboots the device. The helper replies before it actually issues the
     * command (see the SECURITY note in device/woce-backupd.js), so this
     * resolves normally rather than timing out when the system goes down.
     */
    that.reboot = function () {
        return submit({ op: "reboot" }, 15000);
    };

    /**
     * Test seam: lets unit checks force the probe result.
     */
    that.setAvailableForTesting = function (value) {
        available = value;
    };

    /**
     * Test seam: stands in for the helper's lunacall, so the private-bus
     * fallback can be exercised without a device.
     */
    that.setLunacallForTesting = function (fn) {
        that.lunacall = fn;
    };

    /**
     * Test seam: stands in for the helper's stage op, so a file the jail
     * cannot read (e.g. one a helper-routed call wrote outside it) can be
     * exercised without a device.
     */
    that.setStageForTesting = function (fn) {
        that.stage = fn;
    };

    /**
     * Test seam: stands in for the helper's unstage op, so a restored file
     * bound for a destination the jail cannot write (e.g. /tmp) can be
     * exercised without a device.
     */
    that.setUnstageForTesting = function (fn) {
        that.unstage = fn;
    };

    return that;
}());
