/* The restore engine.
 *
 * Ported from com.palm.service.backup/handlers/restore2.js. The protocol is
 * unchanged, and it is the mirror of backup:
 *
 *     for each service in the manifest
 *         preRestore(version)   -> may decline via { proceed: false }
 *         fetch its files back into the temp dir
 *         postRestore(files, tempDir)
 *     then restoreFinished() on every registered service
 *
 * That final fan-out matters and is easy to miss: services like
 * com.palm.service.accounts and com.palm.messaging.chatthreader register only a
 * restoreFinished callback. They contribute nothing to a backup but must be
 * told when one has been laid down, or accounts stay stale until a reboot.
 *
 * What changed from stock: files come from a target instead of the cloud, there
 * is no decryption pass, and files whose home is outside the jail are written
 * back through the root helper.
 */
/*global Future, FILES_PATH, MANIFEST_ROOT, PalmCall, packageOpWrapperBudget,
  serviceCallTimeout, STAGE_ROOT, backup, dateUtil, fileUtil, getParent, isEmpty,
  logger, mapFuture, prefs, privileged, require, system, targets, tolerate,
  userData, withDeadline, withTimeout */

// A fresh RestoreAssistant is constructed per call, so this has to live
// outside it to be visible to the next one. Set for the duration of a
// restore; see the guard in run() for why a second concurrent call must
// never reach doRestore() at all.
var restoreInProgress = false;
var restoreStartedAt = 0;

// After this long, a set restoreInProgress is taken as stuck rather than
// running. Every settled path clears the flag, so this only matters when the
// chain never settles at all — and it used to mean every later restore was
// rejected until the service process happened to exit, with the app reporting
// "a restore is already in progress" for one that had long since stopped
// existing. Matched to startBackup/restore's own 7200s commandTimeout: past
// that the bus has given up on the call regardless.
var RESTORE_STUCK_MS = 7200 * 1000;

function RestoreAssistant() {

    var fs = require('fs');

    var TOTAL_PROGRESS = 100;

    var target;
    var isPrivileged;
    var stageDir;
    var skipped;        // [{ service, path, reason }]

    /* -------------------------------------------------------- file transfers */

    /**
     * True if this path lives outside the jail and therefore needs the helper.
     */
    var needsHelper = function (path) {
        if (path.charAt(0) !== "/") {
            return false;   // relative: resolved inside the temp dir
        }
        return !isWritableHere(path);
    };

    /**
     * Whether we can write to this absolute path ourselves. The jail gives us
     * /media/internal and the file cache; everything else needs the helper.
     *
     * /tmp is NOT jail-writable, confirmed on device: com.palm.appDataBackup
     * asked for /tmp/com.palm.luna-sysmgr.cookies-html5-backup.sql and the
     * jailed process's own gunzip (a shell redirect into that path) failed
     * with EACCES. It is in the root helper's own ALLOWED_WRITE_ROOTS, so
     * routing it through the helper like any other outside-the-jail
     * destination works; assuming the jail could reach it directly does not.
     */
    var isWritableHere = function (path) {
        return path.startsWith("/media/internal/") ||
               path.startsWith("/var/file-cache/");
    };

    /**
     * Pulls one file out of the target and puts it back where it belongs.
     *
     * Files bound for the jail-visible world are written straight to their
     * destination. Files bound outside it land in the staging area first and
     * are handed to the helper afterwards, in one batch per service.
     */
    var restoreFile = function (file, tempDir, toUnstage) {
        if (system.isReadOnlyPartition(file.path)) {
            return new Future({});
        }

        var storedName = backup.getServerFilename(file);
        var destination = fileUtil.getAbsolutePath(file.path, tempDir);
        var viaHelper = needsHelper(file.path);

        if (viaHelper && !isPrivileged) {
            skipped.push({ path: file.path, reason: "not-privileged" });
            return new Future({});
        }

        // Compressed files have to be fetched to a scratch name and expanded;
        // uncompressed ones can be written directly to their destination.
        var stagedName = viaHelper ? String(toUnstage.length) + "-" + storedName : null;
        var landing = viaHelper ? (stageDir + stagedName) : destination;
        var fetchTo = file.compressed ? (landing + ".gz") : landing;

        var future = fileUtil.mkdirs(getParent(fetchTo));
        future.then(this, function (f) {
            var result = f.result;
            f.nest(target.get(FILES_PATH + storedName, fetchTo, false, file.finalChecksum));
        });
        future.then(this, function (f) {
            var result = f.result;
            if (file.compressed) {
                var gunzip = fileUtil.gunzip(fetchTo, landing);
                gunzip.then(this, function (gf) {
                    var gresult = gf.result;
                    gf.nest(fileUtil.rmIfExists(fetchTo));
                });
                f.nest(gunzip);
            } else {
                f.result = {};
            }
        });
        future.then(this, function (f) {
            if (f.exception) {
                // One missing file should not sink an entire restore — the
                // store may have been pruned, or copied incompletely off USB.
                logger.warn("Unable to restore", file.path + ":", f.exception.message);
                skipped.push({ path: file.path, reason: "fetch-failed" });
                f.result = {};
                return;
            }
            var result = f.result;
            if (viaHelper) {
                toUnstage.push({ staged: stagedName, path: file.path });
            }
            f.result = {};
        });
        return future;
    };

    var restoreFiles = function (files, tempDir, toUnstage) {
        return mapFuture(files, function (file) {
            return restoreFile(file, tempDir, toUnstage);
        });
    };

    /**
     * Fetches one archived file (a package .ipk, or an app-directory tarball)
     * out of the target and back onto disk, landing at
     * packagesDir + id + extension - inside WORK_ROOT, which is what makes
     * the matching privileged op willing to touch it (see the SECURITY note
     * in device/woce-backupd.js).
     */
    var fetchArchivedFile = function (id, fileDescriptor, packagesDir, extension) {
        var landing = packagesDir + id + extension;
        var fetchTo = fileDescriptor.compressed ? (landing + ".gz") : landing;

        var future = target.get(FILES_PATH + backup.getServerFilename(fileDescriptor),
            fetchTo, false, fileDescriptor.finalChecksum);
        future.then(this, function (f) {
            if (f.exception) {
                // One missing file should not sink the whole restore - the
                // caller checks existsSync and reports it as failed, same as
                // restoreFile does for any other file.
                logger.warn("Unable to fetch", landing + ":", f.exception.message);
                f.result = {};
                return;
            }
            if (fileDescriptor.compressed) {
                var gunzip = fileUtil.gunzip(fetchTo, landing);
                gunzip.then(this, function (gf) {
                    var gresult = gf.result;
                    gf.nest(fileUtil.rmIfExists(fetchTo));
                });
                f.nest(gunzip);
            } else {
                f.result = {};
            }
        });
        return future;
    };

    /**
     * Fetches every archived package back to disk and hands the successful
     * ones to the root helper to reinstall via ipkg - the same command, same
     * root privilege, and same postinst execution any sideloaded install goes
     * through. A package with no archived .ipk (Preware's cache didn't have it
     * at backup time) is left for the caller to report as needing a manual
     * reinstall; that is the pre-existing behaviour, unchanged here.
     */
    var installArchivedPackages = function (packages, packagesDir) {
        var candidates = packages.filter(function (pkg) {
            return pkg.archived === true && pkg.file;
        });
        if (candidates.length === 0 || !isPrivileged) {
            return new Future({ installed: [], failed: [] });
        }

        var future = fileUtil.mkdirs(packagesDir);
        future.then(this, function (f) {
            var result = f.result;
            f.nest(mapFuture(candidates, function (pkg) {
                return fetchArchivedFile(pkg.id, pkg.file, packagesDir, ".ipk");
            }));
        });
        future.then(this, function (f) {
            var toInstall = [];
            var fetchFailed = [];
            candidates.forEach(function (pkg) {
                var ipkPath = packagesDir + pkg.id + ".ipk";
                if (isReadableSync(ipkPath)) {
                    toInstall.push({ id: pkg.id, path: ipkPath });
                } else {
                    fetchFailed.push(pkg.id);
                }
            });
            if (toInstall.length === 0) {
                f.result = { installed: [], failed: fetchFailed };
                return;
            }
            var installFuture = privileged.installPackages(toInstall);
            installFuture.then(this, function (inf) {
                var installResult = inf.exception ? { installed: [], failed: toInstall.map(function (e) { return e.id; }) } : inf.result;
                inf.result = {
                    installed: installResult.installed || [],
                    failed: fetchFailed.concat(installResult.failed || [])
                };
            });
            f.nest(installFuture);
        });
        return future;
    };

    /**
     * Sibling of installArchivedPackages for a package whose .ipk was not
     * available to archive at backup time (the common case for anything
     * installed a while ago): fetches the tarred-up app directory instead and
     * hands it to the root helper to un-tar back over the app's own installed
     * directory. LunaSysMgr discovers it the same way it discovers a fresh
     * ipkg install - scanning at its own next boot - which restore already
     * prompts for. What this does not restore is ipkg's own bookkeeping for
     * the package, so Software Manager/Preware may not offer to manage it
     * even though it runs; that tradeoff is made once, in the helper, not
     * here - see device/woce-backupd.js's archivePackages.
     */
    var installArchivedAppDirectories = function (packages, packagesDir) {
        var candidates = packages.filter(function (pkg) {
            return pkg.dirBackedUp === true && pkg.dirFile;
        });
        if (candidates.length === 0 || !isPrivileged) {
            return new Future({ installed: [], failed: [] });
        }

        var future = fileUtil.mkdirs(packagesDir);
        future.then(this, function (f) {
            var result = f.result;
            f.nest(mapFuture(candidates, function (pkg) {
                return fetchArchivedFile(pkg.id, pkg.dirFile, packagesDir, "-app.tar.gz");
            }));
        });
        future.then(this, function (f) {
            var toRestore = [];
            var fetchFailed = [];
            candidates.forEach(function (pkg) {
                var tarPath = packagesDir + pkg.id + "-app.tar.gz";
                if (isReadableSync(tarPath)) {
                    toRestore.push({ id: pkg.id, path: tarPath });
                } else {
                    fetchFailed.push(pkg.id);
                }
            });
            if (toRestore.length === 0) {
                f.result = { installed: [], failed: fetchFailed };
                return;
            }
            var restoreFuture = privileged.restoreAppDirectories(toRestore);
            restoreFuture.then(this, function (rf) {
                var restoreResult = rf.exception ? { restored: [], failed: toRestore.map(function (e) { return e.id; }) } : rf.result;
                // An app put back this way had its service registered by hand
                // (the installer never ran), and that registration only takes
                // effect at the next boot - so the app works and its service
                // does not, until then. Carried up through the result rather
                // than written into doRestore's scope: this function is a
                // sibling of doRestore, not nested inside it.
                rf.result = {
                    installed: restoreResult.restored || [],
                    failed: fetchFailed.concat(restoreResult.failed || []),
                    failureReasons: restoreResult.failureReasons || {},
                    servicesRegistered: restoreResult.servicesRegistered || []
                };
            });
            f.nest(restoreFuture);
        });
        return future;
    };

    /**
     * fs.existsSync arrived in node 0.6; this device has 0.2. Same idiom as
     * device/woce-backupd.js's own existsSync, kept local since restore.js has
     * no reason to share a helper with the daemon.
     */
    var isReadableSync = function (path) {
        try {
            fs.statSync(path);
            return true;
        } catch (err) {
            return false;
        }
    };

    /* ------------------------------------------------------ service dispatch */

    var callCallback = function (serviceName, method, params, descriptor) {
        if (descriptor && descriptor.inProcess) {
            if (serviceName === userData.SERVICE_ID) {
                return userData[method](params);
            }
            throw new Error("No in-process provider for " + serviceName);
        }
        // Bounded. com.palm.browserServer accepted preBackup and never
        // answered, which parked the whole run — a service that will not talk
        // has to become a skipped service, not a stuck backup.
        return withDeadline(system.palmcall(serviceName, method, params),
            serviceCallTimeout(serviceName), serviceName + "/" + method);
    };

    /**
     * Restores one service's section of the manifest.
     */
    var restoreService = function (service, descriptor, tempDir) {
        var serviceId = service.service;
        var toUnstage = [];
        var proceed = true;

        logger.log("Restoring", serviceId, "-", (service.files || []).length, "file(s)");

        var future = fileUtil.rmFiles(tempDir);
        future.then(this, function (f) {
            var result = f.result;
            if (descriptor.preRestore) {
                f.nest(callCallback(serviceId, descriptor.preRestore,
                    { version: service.version }, descriptor));
            } else {
                f.result = { proceed: true };
            }
        });
        future.then(this, function (f) {
            var result = f.result;
            // A service can decline a backup it cannot read — an older schema
            // than it understands. Declining is not an error.
            proceed = !(result && result.proceed === false);
            if (!proceed) {
                logger.log(serviceId, "declined the restore (version",
                    service.version + ")");
                f.result = false;
            } else {
                f.nest(restoreFiles(service.files || [], tempDir, toUnstage));
            }
        });
        future.then(this, function (f) {
            var result = f.result;
            if (!proceed || toUnstage.length === 0) {
                f.result = {};
            } else {
                f.nest(privileged.unstage(toUnstage, stageDir));
            }
        });
        future.then(this, function (f) {
            if (f.exception) {
                logger.warn("Unable to write privileged files for", serviceId + ":",
                    f.exception.message);
                toUnstage.forEach(function (entry) {
                    skipped.push({ service: serviceId, path: entry.path, reason: "unstage-failed" });
                });
            } else if (f.result && f.result.skipped) {
                f.result.skipped.forEach(function (path) {
                    skipped.push({ service: serviceId, path: path, reason: "destination-refused" });
                });
            }

            if (!proceed || !descriptor.postRestore) {
                f.result = false;
                return;
            }
            var filenames = (service.files || []).map(function (file) {
                return file.path;
            });
            f.nest(callCallback(serviceId, descriptor.postRestore, {
                files:   filenames,
                tempDir: tempDir,
                version: service.version
            }, descriptor));
        });
        future.then(this, function (f) {
            var result = f.result;
            f.nest(fileUtil.rmFiles(tempDir));
        });
        future.then(this, function (f) {
            if (!f.exception) {
                var result = f.result;
                f.result = result;
                return;
            }
            var err = f.exception;
            if (backup.TOLERANT_MODE && backup.REQUIRED_SERVICES.indexOf(serviceId) === -1) {
                logger.error("Skipping restore of", serviceId + ":", err.message);
                skipped.push({ service: serviceId, reason: "failed", error: err.message });
                f.result = {};
            } else {
                logger.error("BLAME:", serviceId);
                f.exception = err;
            }
        });
        return future;
    };

    /**
     * Tells a service the restore has landed. Failures here are logged and
     * swallowed: the data is already in place, and a service that cannot
     * refresh right now will pick it up on next launch.
     */
    var notifyRestoreFinished = function (serviceId, method) {
        var future = new Future();
        future.nest(withDeadline(system.palmcall(serviceId, method, {}),
            serviceCallTimeout(serviceId), serviceId + "/" + method));
        future.then(this, function (f) {
            if (f.exception) {
                logger.warn("restoreFinished failed for", serviceId + ":", f.exception.message);
            }
            f.result = {};
        });
        return future;
    };

    /* ----------------------------------------------------------- manifest pick */

    /**
     * Chooses which manifest to restore: an explicit one if the caller named
     * it, otherwise the newest belonging to the requested device.
     */
    var selectManifest = function (args) {
        if (args.manifestName) {
            return new Future(args.manifestName);
        }

        var future = backup.listLocalManifests(false);
        future.then(this, function (f) {
            var names = f.result;
            names.sort();

            var chosen = null;
            for (var i = names.length - 1; i >= 0; i--) {
                var info = backup.parseManifestName(names[i]);
                if (!args.nduId || info.nduId === args.nduId) {
                    chosen = names[i];
                    break;
                }
            }
            if (!chosen) {
                throw new Error("No backup found" + (args.nduId ? " for device " + args.nduId : ""));
            }
            f.result = chosen;
        });
        return future;
    };

    /* ----------------------------------------------------------- the restore */

    /**
     * Runs a restore, returning its own future.
     *
     * Separate chain for the same reason as doBackup: `then` callbacks are a
     * FIFO queue, so appending to the caller's future would run the caller's
     * error handler in the middle of this chain instead of after it.
     */
    var doRestore = function (args, subscription) {
        var future = new Future();
        var manifest;
        var manifestName;
        var tempDir;
        var tempDirFuture;
        var services;
        var installedPackages = [];
        var failedPackages = [];
        var restorableCandidates = [];   // manifest.packages, minus system apps and anything already installed
        var packageOpTimedOut = false;   // a package op is still running out there
        // Why each package was left out, kept apart rather than merged: the
        // receipt below has to be able to say "you already have it" and "the
        // image provides it" separately, because they mean different things to
        // someone asking why an app did not come back.
        var presentIds = {};             // ipkg already has it on THIS device
        var imageIds = {};               // baked or preloaded by the system image
        var receipt = null;              // built at the end, written to the target
        var serviceRegisteredIds = {};   // put back by directory fallback AND had a service
        var restoreFailureReasons = {};  // id -> why the directory restore failed

        skipped = [];

        var publish = function (status) {
            if (subscription) {
                subscription.get().result = status;
            }
        };

        var progress = function (percent) {
            publish({ returnValue: true, STATUS: "InProgress", percent: percent });
        };

        future.nest(tolerate(privileged.isAvailable(), false));
        future.then(this, function (f) {
            isPrivileged = f.result === true;
            logger.log("Restore, privileged mode:", isPrivileged);
            f.nest(targets.getCurrent());
        });
        future.then(this, function (f) {
            target = f.result;
            f.nest(backup.syncManifests(target));
        });
        future.then(this, function (f) {
            var result = f.result;
            f.nest(selectManifest(args));
        });
        future.then(this, function (f) {
            manifestName = f.result;
            logger.log("Restoring from", manifestName);
            f.nest(backup.robustLoadManifest(target, manifestName));
        });
        future.then(this, function (f) {
            manifest = f.result;
            if (!manifest || !manifest.services) {
                throw new Error("Manifest " + manifestName + " is unusable");
            }
            stageDir = STAGE_ROOT + "restore-" + new Date().getTime() + "/";
            f.nest(fileUtil.mkdirs(stageDir));
        });
        future.then(this, function (f) {
            var result = f.result;
            tempDirFuture = system.getTempDir(backup.TEMP_DIR_SIZE);
            f.nest(tempDirFuture);
        });
        future.then(this, function (f) {
            tempDir = f.result;
            f.nest(backup.loadRegisteredServices());
        });
        future.then(this, function (f) {
            services = f.result;
            progress(0);

            var sections = manifest.services;
            var perService = 90.0 / Math.max(1, sections.length);
            var done = 0;

            f.nest(mapFuture(sections, function (section) {
                // A service present in the backup but no longer registered has
                // nothing to hand its files to, so skip it rather than guess.
                var descriptor = services[section.service];
                if (!descriptor) {
                    logger.warn(section.service, "is in the backup but not registered here");
                    skipped.push({ service: section.service, reason: "not-registered" });
                    done += perService;
                    progress(done);
                    return new Future({});
                }

                var work = restoreService(section, descriptor, tempDir);
                work.then(this, function (wf) {
                    var result = wf.result;
                    done += perService;
                    progress(done);
                    wf.result = {};
                });
                return work;
            }));
        });
        future.then(this, function (f) {
            var result = f.result;
            progress(85);

            // Everything in the manifest is a candidate at this point. What
            // the *restoring* device already provides is subtracted below,
            // once the helper has been asked - which is the only place that
            // question can be answered, since it is about this device and not
            // the one the backup came from.
            restorableCandidates = (manifest.packages || []);

            if (restorableCandidates.length === 0 || !isPrivileged) {
                f.result = { packages: [] };
                return;
            }
            // What's on the device right *now* - not what listInstalledApps
            // said at backup time. An app the user never uninstalled, or
            // reinstalled manually before running this restore, needs neither
            // an automatic reinstall attempt nor a "do this yourself" nag.
            // The helper's own budget for this job is 60s (ipkg enumeration is
            // genuinely slow here); plain tolerate() would have capped it at
            // 20s, the same trap already fixed on the backup side.
            f.nest(withTimeout(privileged.listInstalledApps(), 60000,
                               { packages: [], romApps: [] }));
        });
        future.then(this, function (f) {
            var result = f.result;
            var alreadyInstalled = {};
            (result.packages || []).forEach(function (pkg) {
                alreadyInstalled[pkg.id] = true;
                presentIds[pkg.id] = true;
            });
            // Anything the system image provides - baked into the rootfs, or
            // staged as a preload it installs on first boot - is already here
            // even when ipkg has no record of it, and comes back by reflashing
            // rather than from a backup. Putting a backed-up copy into cryptofs
            // on top of one does not restore it, it SHADOWS the image's own
            // copy with an older one.
            //
            // This is the whole webOS 3.0.5 -> CE 3.1 upgrade path: CE bakes
            // and preloads apps a 3.0.5 device carried as ordinary cryptofs
            // installs, so a backup taken before the upgrade names them all.
            // It replaces a com.palm.* name check that got this wrong both
            // ways - see listImageApps in device/woce-backupd.js.
            (result.romApps || []).forEach(function (id) {
                alreadyInstalled[id] = true;
                imageIds[id] = true;
            });
            restorableCandidates = restorableCandidates.filter(function (pkg) {
                return !alreadyInstalled[pkg.id];
            });

            progress(88);
            // Not tolerate(): its generic 20s covered fetching every .ipk out
            // of the target *and* running ipkg on each, against a helper job
            // that budgets 60s per package. On any real restore the wrapper won
            // and reported every application as needing a manual reinstall
            // while ipkg was still installing them.
            f.nest(withTimeout(
                installArchivedPackages(restorableCandidates, stageDir + "packages/"),
                packageOpWrapperBudget(restorableCandidates.length),
                { installed: [], failed: [], timedOut: true }));
        });
        future.then(this, function (f) {
            var result = f.result;
            installedPackages = result.installed || [];
            failedPackages = result.failed || [];
            packageOpTimedOut = packageOpTimedOut || (result.timedOut === true);
            progress(90);

            // Whatever installArchivedPackages didn't cover (no .ipk was
            // archived for it) may still have a directory backup - restorable
            // candidates is a mixed list, and each of these two functions
            // filters to only the packages relevant to it.
            f.nest(withTimeout(
                installArchivedAppDirectories(restorableCandidates, stageDir + "packages/"),
                packageOpWrapperBudget(restorableCandidates.length),
                { installed: [], failed: [], timedOut: true }));
        });
        future.then(this, function (f) {
            var result = f.result;
            installedPackages = installedPackages.concat(result.installed || []);
            failedPackages = failedPackages.concat(result.failed || []);
            (result.servicesRegistered || []).forEach(function (id) {
                serviceRegisteredIds[id] = true;
            });
            // Same carry as serviceRegisteredIds above, and for the same
            // reason: written here, in doRestore's own chain, because the
            // function that produced it is a sibling and cannot reach this
            // scope. withTimeout's fallback result has no reasons at all.
            var reasons = result.failureReasons || {};
            for (var failedId in reasons) {
                if (reasons.hasOwnProperty(failedId)) {
                    restoreFailureReasons[failedId] = reasons[failedId];
                }
            }
            packageOpTimedOut = packageOpTimedOut || (result.timedOut === true);
            progress(92);

            // Everyone registered gets the notification, including services
            // that contributed nothing to the backup.
            var toNotify = [];
            for (var serviceId in services) {
                if (services.hasOwnProperty(serviceId)) {
                    var descriptor = services[serviceId];
                    if (descriptor.restoreFinished && !descriptor.inProcess) {
                        toNotify.push({ id: serviceId, method: descriptor.restoreFinished });
                    }
                }
            }
            logger.log("Notifying", toNotify.length, "service(s) that the restore finished");
            f.nest(mapFuture(toNotify, function (entry) {
                return notifyRestoreFinished(entry.id, entry.method);
            }));
        });
        future.then(this, function (f) {
            var result = f.result;
            progress(98);
            if (packageOpTimedOut) {
                // A package op we stopped waiting for may still be mid-install
                // out in the helper, reading .ipks and tarballs straight out of
                // this directory. Deleting it now would corrupt an install that
                // is still going. Leaving scratch files behind is the lesser
                // problem, and they are named per-run so nothing later mistakes
                // them for its own.
                logger.warn("Leaving", stageDir,
                    "in place: a package operation was still running when we stopped waiting");
                f.result = null;
                return;
            }
            // The data is already in place; failing to tidy the staging area
            // must not turn a completed restore into a failed one. A generous
            // budget rather than tolerate()'s 20s: this directory can hold every
            // archived .ipk the restore fetched.
            f.nest(withTimeout(fileUtil.rmFiles(stageDir, true), 120000, null));
        });
        future.then(this, function (f) {
            var result = f.result;
            manifest.restoredCount = (manifest.restoredCount || 0) + 1;
            manifest.lastRestored = dateUtil.formatDateRfc1123(new Date());

            /* A durable receipt of what this restore actually did.
             *
             * The per-package outcome used to exist only in the reply to the
             * subscribing app: shown once, then gone. After a migration the one
             * question people ask is "what did NOT come back, and why", and
             * nothing on disk could answer it - not the manifest (it records
             * what was backed up, not what was put back), not the helper log
             * (a tally of successes). Worse, the two most common answers are
             * invisible by construction, because a package skipped as already
             * present or as image-provided is filtered out long before the
             * result is built.
             *
             * Written through the target, not to a fixed path, so it travels
             * with the backup like the manifest does; under receipts/ rather
             * than manifests/ so listLocalManifests never sees it (its regex
             * would reject it anyway, but a manifest directory holding
             * non-manifests is a trap for the next reader).
             */
            var installedSetR = {};
            installedPackages.forEach(function (id) { installedSetR[id] = true; });
            var failedSetR = {};
            failedPackages.forEach(function (id) { failedSetR[id] = true; });

            var counts = {
                installed: 0, failed: 0, notCaptured: 0,
                alreadyPresent: 0, imageProvided: 0
            };
            var receiptPackages = (manifest.packages || []).map(function (pkg) {
                var outcome;
                if (imageIds[pkg.id]) {
                    outcome = "image-provided";     // reflashing brings it back
                } else if (presentIds[pkg.id]) {
                    outcome = "already-present";    // never uninstalled here
                } else if (installedSetR[pkg.id]) {
                    outcome = "installed";
                } else if (!pkg.archived && !pkg.dirBackedUp) {
                    outcome = "not-captured";       // the backup never held it
                } else {
                    outcome = "failed";             // had it, could not put it back
                }
                counts[{
                    "installed": "installed",
                    "failed": "failed",
                    "not-captured": "notCaptured",
                    "already-present": "alreadyPresent",
                    "image-provided": "imageProvided"
                }[outcome]] += 1;
                var entry = {
                    id: pkg.id,
                    title: pkg.title,
                    version: pkg.version,
                    outcome: outcome
                };
                if (outcome === "failed" && restoreFailureReasons[pkg.id]) {
                    // "failed" on its own sent a whole release cycle looking
                    // for a corrupt archive when the real answer was a budget
                    // that ran out. Put the reason where the user reads it.
                    entry.note = restoreFailureReasons[pkg.id];
                }
                if (outcome === "not-captured" && pkg.archiveError) {
                    // Carry the backup-time reason forward: "not captured" on
                    // its own does not tell you whether the app was never
                    // there or was too big to archive in the time allowed.
                    entry.note = pkg.archiveError;
                }
                if (serviceRegisteredIds[pkg.id]) {
                    // Registered by us, not by ipkg: live only after the reboot.
                    entry.serviceRegistered = true;
                    entry.note = "service registered by restore; needs the reboot to start";
                }
                return entry;
            });

            receipt = {
                manifestName: manifestName,
                restoredAt:   manifest.lastRestored,
                restoreCount: manifest.restoredCount,
                backedUpFrom: manifest.deviceInfo,
                backedUpOs:   manifest.osVersion,
                summary:      counts,
                skipped:      skipped,
                packages:     receiptPackages
            };
            counts.servicesRegistered = Object.keys(serviceRegisteredIds).length;
            logger.log("Restore receipt:", JSON.stringify(counts));
            // Lives on the manifest, not in this device's own prefs: the
            // point is "has this backup been restored", which travels with
            // it the same way the manifest itself does, not just "restored
            // on this one device". Best-effort, same as the staging cleanup
            // above - the restore already succeeded, and a failed write-back
            // here must not turn that into a reported failure.
            f.nest(tolerate(backup.storeManifest(target, manifest, manifestName), null));
        });
        future.then(this, function (f) {
            var result = f.result;
            // Best-effort, like the manifest write-back above: a restore that
            // worked must not be reported as failed because a report about it
            // could not be written.
            f.nest(tolerate(backup.storeRestoreReceipt(target, receipt, manifestName), null));
        });
        future.then(this, function (f) {
            var result = f.result;
            try {
                logger.log("Restore complete:", manifestName + ",", skipped.length, "skipped,",
                    installedPackages.length, "package(s) reinstalled");
                if (failedPackages.length > 0) {
                    logger.warn("Could not reinstall:", failedPackages.join(", "));
                }

                // installed:true means ipkg actually put it back; false covers
                // both "never archived" (Preware's cache didn't have it at
                // backup time) and "archived but the install itself failed" -
                // either way the app tells the user the same thing: get it
                // from your own sources. restorableCandidates, not
                // manifest.packages: system apps and anything already present
                // on this device were already filtered out above and have
                // nothing to report either way.
                var installedSet = {};
                installedPackages.forEach(function (id) { installedSet[id] = true; });
                var packagesResult = restorableCandidates.map(function (pkg) {
                    return {
                        id:        pkg.id,
                        version:   pkg.version,
                        title:     pkg.title,
                        installed: installedSet[pkg.id] === true
                    };
                });

                var status = {
                    returnValue:  true,
                    STATUS:       "Complete",
                    manifestName: manifestName,
                    skipped:      skipped,
                    packages:     packagesResult,
                    // Lets the UI offer an automatic restart: only the
                    // privileged helper can actually issue one (see
                    // handlers/reboot.js), so a limited-mode restore still
                    // falls back to asking the user to do it themselves.
                    privileged:   isPrivileged
                };
                publish(status);
                f.result = status;
            } finally {
                if (tempDirFuture) {
                    PalmCall.cancel(tempDirFuture);
                }
            }
        });

        return future;
    };

    this.run = function (future, subscription) {
        var args = this.controller.args;
        logger.log("restore", args);

        // Confirmed on-device: a second restore call issued ~7s after the
        // first - well past the point where the first's own progress ticks
        // had already cleared any client-side re-entry guard - was accepted
        // and run concurrently with the first one's still-finishing
        // restoreFinished fan-out. Both need com.palm.backup.privileged for
        // their lunacall fallback at the same time, which only one live
        // process can hold - the exact "Attempted to register for a service
        // name that already exists" collision documented in
        // device/woce-backupd.js, just between two of our own invocations
        // instead of two different binaries. That collision can only be
        // closed here: whatever UI path lets two restore calls fire, this is
        // the one place guaranteed to see both of them.
        var now = new Date().getTime();
        if (restoreInProgress && (now - restoreStartedAt) < RESTORE_STUCK_MS) {
            logger.warn("Rejecting restore: one is already in progress");
            var busyStatus = { returnValue: false, STATUS: "Failed",
                errorText: "A restore is already in progress." };
            if (subscription) {
                subscription.get().result = busyStatus;
            }
            future.result = busyStatus;
            return;
        }
        if (restoreInProgress) {
            logger.warn("The previous restore never finished or failed; treating it as stuck",
                "after", Math.round((now - restoreStartedAt) / 1000) + "s and allowing this one");
        }
        restoreInProgress = true;
        restoreStartedAt = now;

        var chain = doRestore(args, subscription);
        chain.then(this, function (f) {
            if (!f.exception) {
                var result = f.result;
                restoreInProgress = false;
                f.result = result;
                return;
            }

            var err = f.exception;
            logger.error("Restore failed:", err.message);

            var status = { returnValue: false, STATUS: "Failed", errorText: err.message };
            // tolerate(): this runs on the path that clears restoreInProgress,
            // so a connection check that never answers would leave the flag set
            // for good and every later restore rejected as "already in
            // progress".
            var cleanup = tolerate(system.isInternetConnectionAvailable(), true);
            cleanup.then(this, function (cf) {
                var connected = cf.exception ? true : cf.result;
                // 408 is the stock signal for "lost the network, retry when it
                // returns"; the ported RestoringPage watches for exactly it.
                if (!connected) {
                    status.error = 408;
                }
                if (subscription) {
                    subscription.get().result = status;
                }
                restoreInProgress = false;
                cf.result = status;
            });
            f.nest(cleanup);
        });
        future.nest(chain);
    };
}
