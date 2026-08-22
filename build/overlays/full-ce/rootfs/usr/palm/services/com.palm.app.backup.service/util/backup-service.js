/* Shared backup state, service registration, and manifest bookkeeping.
 *
 * Ported from com.palm.service.backup/util/backup-service.js. The status model,
 * the registration protocol, the manifest naming and the content-addressed file
 * store are all kept as-is so that system services behave exactly the way they
 * did under the stock service, and so a woce-backup manifest is readable
 * alongside a legacy one.
 *
 * Removed: everything encryption-related. getServerFilename no longer appends
 * .enc and getFinalPath has no encrypted branch — see util/file-util.js for
 * why.
 */
/*global DB, Future, FILES_PATH, MANIFESTS_PATH, RECEIPTS_PATH, MANIFEST_ROOT, fileUtil,
  logger, mapFuture, privileged, removeAll, require, system, userData, isEmptyObject,
  STATIC_SERVICES_ROOT,
  zeroPad, dateUtil */

var backup = (function () {
    var that = {};
    var fs = require('fs');

    var DYNAMIC_SERVICE_ID_PREFIX = "com.palm.backup.dynamicservice/";
    var DYNAMIC_SERVICE_KIND_ID   = "com.palm.backup.dynamicservice:1";

    var PREPARING   = "Preparing";
    var IN_PROGRESS = "InProgress";
    var COMPLETE    = "Complete";
    var CANCELED    = "Canceled";
    var FAILED      = "Failed";

    // Manifest names are 000001-<nduId>, matching the stock format.
    var MANIFEST_NAME_REGEX = "^([0-9]{6})(-([0-9a-zA-Z]+))?$";

    var ERRCODE_CANCELLED = 4;

    var statusListeners = [];
    var status;
    var canceled = false;
    var progressIncrementPerByte = 0;
    var lastFiredStatusPercent;

    that.UNKNOWN_NDUID = "Unknown";

    // Kept at the stock value: a restore has to know whether the db8 dump it is
    // reading came from a compatible schema generation.
    that.DB_VERSION = 200;

    that.TEMP_DIR_SIZE = 2097152;   // 2 MB, the window services stage data in

    that.WORKING_COMPRESSED_FILENAME = "/tmp/woce-backup-working.gz";

    // When true, only REQUIRED_SERVICES have to succeed for the backup to count.
    // Left on: on a community device some stock services are patched, removed or
    // broken, and losing the whole backup because one of them failed is worse
    // than a backup missing one service. The manifest records what was skipped.
    that.TOLERANT_MODE = true;
    that.REQUIRED_SERVICES = ["com.palm.db"];

    /* ---------------------------------------------------------------- status */

    that.addStatusListener = function (listener) {
        statusListeners.push(listener);
    };

    that.removeStatusListener = function (listener) {
        for (var i = 0; i < statusListeners.length; i++) {
            if (statusListeners[i] === listener) {
                statusListeners.splice(i, 1);
                break;
            }
        }
    };

    var clearStatusListeners = function () {
        statusListeners = [];
    };

    var fireStatusChanged = function () {
        lastFiredStatusPercent = status.percent;
        statusListeners.forEach(function (listener) {
            try {
                listener(status);
            } catch (err) {
                logger.warn("Status listener threw:", err.message);
            }
        });
    };

    /**
     * A one-line note about what the run is doing right now, e.g. the app it is
     * archiving. Purely cosmetic: the app shows it instead of the generic
     * "Backing up..." while it is set, and falls back when it is not.
     *
     * Fires immediately rather than going through incrementProgress's 0.5%
     * throttle - the whole point is the phases where the percentage does NOT
     * move, so throttling on percentage would suppress exactly the updates
     * that matter.
     */
    that.setStatusDetail = function (text) {
        if (!status) {
            return;
        }
        if (text) {
            status.detail = text;
        } else {
            delete status.detail;
        }
        fireStatusChanged();
    };

    var setStatus = function (s) {
        logger.log("Status:", s);
        status = s;
        fireStatusChanged();
    };

    that.getStatus = function () {
        return status;
    };

    that.isRunning = function () {
        return status !== undefined &&
            (PREPARING === status.STATUS || IN_PROGRESS === status.STATUS);
    };

    var checkCanceled = function () {
        if (canceled) {
            var err = new Error("Backup canceled");
            err.ecode = ERRCODE_CANCELLED;
            throw err;
        }
    };

    that.isCanceled = function () {
        return canceled;
    };

    that.setStatusPreparing = function () {
        canceled = false;
        setStatus({ STATUS: PREPARING });
    };

    that.setStatusInProgress = function () {
        checkCanceled();
        setStatus({ STATUS: IN_PROGRESS, percent: 0 });
    };

    that.incrementProgress = function (increment) {
        checkCanceled();
        if (!status || status.percent === undefined) {
            return;
        }
        status.percent += increment;
        if (status.percent > 100) {
            status.percent = 100;
        }
        // Throttled: the stock UI redraws on every push, and firing on every
        // byte makes the progress bar the slowest part of a backup.
        if (lastFiredStatusPercent === undefined ||
                status.percent - lastFiredStatusPercent > 0.5) {
            fireStatusChanged();
        }
    };

    that.incrementProgressBytes = function (bytes) {
        if (progressIncrementPerByte !== 0) {
            that.incrementProgress(bytes * progressIncrementPerByte);
        }
    };

    that.setProgressIncrementPerByte = function (p) {
        progressIncrementPerByte = p;
    };

    that.setStatusComplete = function (extra) {
        checkCanceled();
        var s = { STATUS: COMPLETE };
        if (extra) {
            for (var key in extra) {
                if (extra.hasOwnProperty(key)) {
                    s[key] = extra[key];
                }
            }
        }
        setStatus(s);
        clearStatusListeners();
    };

    that.setStatusFailed = function (type, message) {
        setStatus({ STATUS: FAILED, type: type, errorText: message });
        clearStatusListeners();
    };

    that.cancel = function () {
        if (!that.isRunning()) {
            throw new Error("Unable to cancel, backup isn't running");
        }
        setStatus({ STATUS: CANCELED });
        canceled = true;
    };

    /* --------------------------------------------------- service registration */

    /**
     * Parses one registration file's contents into a service descriptor.
     */
    var parseRegistration = function (filename, text, into) {
        var regFile;
        try {
            // Trim before parsing: the stock com.palm.keymanager file ends with
            // "}" plus four spaces, and drop a UTF-8 BOM by code point.
            if (text.length > 0 && text.charCodeAt(0) === 0xFEFF) {
                text = text.substring(1);
            }
            text = text.replace(/^\s+/, "").replace(/\s+$/, "");
            regFile = JSON.parse(text);
        } catch (err) {
            logger.warn("Skipping registration file", filename + ":", err.message || err);
            return;
        }
        if (!regFile.id) {
            logger.warn("Skipping registration file with no id:", filename);
            return;
        }
        into[regFile.id] = {
            preBackup:       regFile.preBackup,
            postBackup:      regFile.postBackup,
            preRestore:      regFile.preRestore,
            postRestore:     regFile.postRestore,
            restoreFinished: regFile.restoreFinished
        };
    };

    /**
     * Reads the registration files in /etc/palm/backup.
     *
     * Most are world-readable and the jail mounts /etc/palm ro, so they are
     * read directly. com.palm.keymanager is mode 0640 root-only, though, so any
     * file the jail cannot open is fetched through the root helper — otherwise
     * the keymanager, and every credential it holds, drops out of the backup
     * with nothing but a warning.
     */
    var loadStaticServices = function () {
        var staticServices = {};
        var unreadable = [];

        var future = fileUtil.listFiles(STATIC_SERVICES_ROOT);
        future.then(this, function (f) {
            if (f.exception) {
                logger.warn("Unable to read", STATIC_SERVICES_ROOT + ":", f.exception.message);
                f.result = [];
                return;
            }
            var result = f.result;
            f.result = result;
        });
        future.then(this, function (f) {
            var filenames = f.result || [];
            if (filenames.length === 0) {
                logger.warn("No registration files in", STATIC_SERVICES_ROOT);
            }
            filenames.sort();
            filenames.forEach(function (filename) {
                var text;
                try {
                    text = fs.readFileSync(STATIC_SERVICES_ROOT + filename, "utf8");
                } catch (err) {
                    // Almost certainly a permissions problem rather than a
                    // missing file; the helper can read it.
                    unreadable.push(filename);
                    return;
                }
                parseRegistration(filename, text, staticServices);
            });

            if (unreadable.length === 0) {
                f.result = false;
            } else {
                logger.log("Asking the helper for", unreadable.length,
                    "registration file(s) the jail cannot read:", unreadable.join(", "));
                f.nest(privileged.isAvailable());
            }
        });
        future.then(this, function (f) {
            // Read .exception, never assign it. Assigning replaces _result with
            // isset:true, so the next callback fires immediately instead of
            // waiting for the nested call — which is exactly what happened here:
            // "Asking the helper" was followed 6ms later by the finished service
            // list, and the keymanager was silently dropped.
            var available = f.exception ? false : f.result;
            if (available !== true) {
                if (unreadable.length > 0) {
                    logger.warn("Cannot read", unreadable.join(", "),
                        "- those services will not be backed up");
                }
                f.result = null;
            } else {
                f.nest(privileged.readRegistrations());
            }
        });
        future.then(this, function (f) {
            if (f.exception) {
                logger.warn("Helper could not read the registration files:",
                    f.exception.message);
            } else {
                var result = f.result;
                var files = (result && result.files) || {};
                unreadable.forEach(function (filename) {
                    if (files[filename] !== undefined) {
                        parseRegistration(filename, files[filename], staticServices);
                    }
                });
            }
            f.result = staticServices;
        });
        return future;
    };

    var parseDynamicServiceObjectId = function (id) {
        return id.substr(DYNAMIC_SERVICE_ID_PREFIX.length);
    };

    var getDynamicServiceObjectId = function (service) {
        return DYNAMIC_SERVICE_ID_PREFIX + service;
    };

    /**
     * Registrations added at runtime through our register() method, so a
     * third-party app can join backup without dropping a file in /etc.
     */
    that.loadDynamicServices = function () {
        var future = DB.find({ from: DYNAMIC_SERVICE_KIND_ID });
        future.then(this, function (f) {
            if (f.exception) {
                // The kind does not exist until something registers.
                f.result = {};
                return;
            }
            var dynamicServices = {};
            var services = f.result.results;
            if (services) {
                services.forEach(function (service) {
                    dynamicServices[parseDynamicServiceObjectId(service._id)] = service;
                });
            }
            f.result = dynamicServices;
        });
        return future;
    };

    that.putDynamicService = function (service, serviceDescriptor) {
        serviceDescriptor._id   = getDynamicServiceObjectId(service);
        serviceDescriptor._kind = DYNAMIC_SERVICE_KIND_ID;

        var future = DB.find({
            from: "Kind:1",
            where: [{ prop: "id", op: "=", val: DYNAMIC_SERVICE_KIND_ID }]
        });
        future.then(this, function (f) {
            var kindExists = !f.exception && f.result.results && f.result.results.length > 0;
            if (kindExists) {
                f.nest(DB.del([serviceDescriptor._id]));
            } else {
                logger.log("Creating dynamic service kind");
                f.nest(DB.putKind(DYNAMIC_SERVICE_KIND_ID, "com.palm.app.backup.service", []));
            }
        });
        future.then(this, function (f) {
            if (f.exception) {
                // del() of a non-existent id is not an error worth failing on
            }
            f.nest(DB.put([serviceDescriptor]));
        });
        return future;
    };

    that.delDynamicServices = function (services) {
        return DB.del(services.map(getDynamicServiceObjectId));
    };

    /**
     * Static and dynamic registrations merged, plus our in-process user data
     * provider when the user has enabled any category.
     *
     * A static registration wins over a dynamic one with the same id, matching
     * the stock precedence — an app must not be able to shadow a system
     * service's backup behavior by registering over it.
     */
    that.loadRegisteredServices = function () {
        var allServices = {};
        var dynamicServices = {};
        var toDelete = [];

        var future = that.loadDynamicServices();
        future.then(this, function (f) {
            dynamicServices = f.result;
            f.nest(loadStaticServices());
        });
        future.then(this, function (f) {
            var staticServices = f.result;
            var service;

            for (service in dynamicServices) {
                if (dynamicServices.hasOwnProperty(service)) {
                    if (staticServices[service]) {
                        logger.warn("Dynamic registration for", service,
                            "conflicts with a static one; static wins");
                        toDelete.push(service);
                    } else {
                        allServices[service] = dynamicServices[service];
                    }
                }
            }
            for (service in staticServices) {
                if (staticServices.hasOwnProperty(service)) {
                    allServices[service] = staticServices[service];
                }
            }
            f.nest(userData.isEnabled());
        });
        future.then(this, function (f) {
            var userDataEnabled = f.result;
            if (userDataEnabled) {
                allServices[userData.SERVICE_ID] = {
                    preBackup:   "preBackup",
                    postRestore: "postRestore",
                    inProcess:   true
                };
            }
            if (toDelete.length > 0) {
                f.nest(that.delDynamicServices(toDelete));
            } else {
                f.result = true;
            }
        });
        future.then(this, function (f) {
            if (f.exception) {
                // Pruning a shadowed dynamic registration is best-effort; the
                // service list itself is already built. Reading .exception is
                // what marks it handled, so the chain continues.
                logger.warn("Unable to prune shadowed registrations:", f.exception.message);
            }
            logger.log("Registered services:", Object.keys ? Object.keys(allServices) : allServices);
            f.result = allServices;
        });
        return future;
    };

    /* -------------------------------------------------------- file addressing */

    /**
     * The name a file is stored under in the target. Content-addressed, so an
     * unchanged file resolves to a name that already exists and is never
     * copied twice.
     *
     * The stock version also appended .enc; woce-backup does not encrypt.
     */
    that.getServerFilename = function (fileDescriptor, compressed) {
        var ret = fileDescriptor.checksum ? fileDescriptor.checksum : fileDescriptor.origChecksum;
        if (compressed || fileDescriptor.compressed) {
            ret += ".gz";
        }
        return ret;
    };

    /**
     * Where the working copy of a file currently lives: the compression scratch
     * file if it has been gzipped, otherwise the file itself.
     */
    that.getFinalPath = function (fileDescriptor, baseDir) {
        if (fileDescriptor.compressed) {
            return that.WORKING_COMPRESSED_FILENAME;
        }
        // _source, when set, is where the file actually is right now — the
        // staged copy the root helper made because the jail cannot read the
        // original. Going back to `path` here is what made com.palm.appDataBackup
        // fail with EACCES after staging had already succeeded: the file was
        // resolved from the staged copy for the first scan and from the
        // unreadable original for the checksum and the store.
        return fileDescriptor._source ||
            fileUtil.getAbsolutePath(fileDescriptor.path, baseDir);
    };

    that.parseManifestName = function (name) {
        var match = name.match(MANIFEST_NAME_REGEX);
        if (!match) {
            return { number: 0, nduId: that.UNKNOWN_NDUID };
        }
        return {
            number: parseInt(match[1], 10),
            nduId:  match[3] ? match[3] : that.UNKNOWN_NDUID
        };
    };

    that.isManifestName = function (name) {
        return !!name.match(MANIFEST_NAME_REGEX);
    };

    /* ---------------------------------------------------------- manifest I/O */

    /**
     * Manifest names held in the local cache.
     *
     * @param thisDeviceOnly Only those created by this device.
     */
    that.listLocalManifests = function (thisDeviceOnly) {
        var future = new Future();
        if (thisDeviceOnly) {
            future.nest(system.getNduId());
            future.then(this, function (f) {
                var nduId = f.exception ? null : f.result;
                f.result = nduId ? ("^([0-9]{6})(-(" + nduId + "))$") : MANIFEST_NAME_REGEX;
            });
        } else {
            future.result = MANIFEST_NAME_REGEX;
        }
        future.then(this, function (f) {
            var regex = f.result;
            f.nest(fileUtil.listFiles(MANIFEST_ROOT, function (filename) {
                return filename.match(regex);
            }));
        });
        return future;
    };

    that.loadManifest = function (name) {
        return JSON.parse(fs.readFileSync(MANIFEST_ROOT + name, "utf8"));
    };

    var loadManifestFromFile = function (manifestName) {
        var future = new Future();
        fs.readFile(MANIFEST_ROOT + manifestName, "utf8", function (err, data) {
            if (err) {
                future.exception = err;
                return;
            }
            try {
                future.result = JSON.parse(data);
            } catch (parseErr) {
                logger.warn("Corrupted manifest:", manifestName);
                future.exception = parseErr;
            }
        });
        return future;
    };

    /**
     * Loads a manifest, re-fetching it from the target if the cached copy is
     * missing or corrupt. A corrupted cache entry repairs itself as a side
     * effect of being read.
     */
    that.robustLoadManifest = function (target, manifestName) {
        var manifest;

        var future = loadManifestFromFile(manifestName);
        future.then(this, function (f) {
            if (f.exception) {
                logger.log("Re-fetching manifest", manifestName, "from the target");
                f.nest(target.get(MANIFESTS_PATH + manifestName, MANIFEST_ROOT + manifestName));
            } else {
                manifest = f.result;
                f.result = true;
            }
        });
        future.then(this, function (f) {
            var result = f.result;
            if (manifest) {
                f.result = manifest;
            } else {
                f.nest(loadManifestFromFile(manifestName));
            }
        });
        return future;
    };

    /**
     * Writes a manifest to the target and caches it locally. Shared by backup
     * (the initial write) and restore (updating restoredCount/lastRestored on
     * an existing one) rather than duplicated - same temp-write-then-upload
     * dance, same cleanup on failure, in both directions.
     */
    that.storeManifest = function (target, manifest, name) {
        var tempManifest = MANIFEST_ROOT + "temp";
        var future = fileUtil.writeJson(tempManifest, manifest);

        future.then(this, function (f) {
            var result = f.result;
            f.nest(target.putFile(MANIFESTS_PATH + name, tempManifest));
        });
        future.then(this, function (f) {
            if (f.exception) {
                // Remove the scratch file, then fail with the original error.
                //
                // The failure has to be carried by the cleanup future itself.
                // Setting f.exception from inside the cleanup callback does not
                // work: nest() has already queued its own callback behind ours
                // on the same future, and it overwrites f with the cleanup's
                // (successful) result, losing the error entirely.
                var err = f.exception;
                var cleanup = fileUtil.rmIfExists(tempManifest);
                cleanup.then(this, function (cf) {
                    if (cf.exception) {
                        logger.warn("Could not remove the scratch manifest:",
                            cf.exception.message);
                    }
                    cf.exception = err;
                });
                f.nest(cleanup);
            } else {
                var result = f.result;
                f.nest(fileUtil.mv(tempManifest, MANIFEST_ROOT + name));
            }
        });
        future.then(this, function (f) {
            var result = f.result;
            f.result = name;
        });
        return future;
    };

    /**
     * Writes a restore receipt to the target.
     *
     * Named for the manifest it restored plus the count, so repeated restores
     * of one backup do not overwrite each other's record - "it worked the first
     * time and not the second" is exactly the kind of thing you want to be able
     * to see afterwards.
     *
     * Deliberately simpler than storeManifest: there is no local cache to keep
     * in step, and nothing reads a receipt back, so it is a straight upload.
     */
    that.storeRestoreReceipt = function (target, receipt, manifestName) {
        var name = manifestName + "-restore-" + zeroPad(receipt.restoreCount || 1, 2) + ".json";
        var temp = MANIFEST_ROOT + "receipt-temp";
        var future = fileUtil.writeJson(temp, receipt);

        future.then(this, function (f) {
            var result = f.result;
            f.nest(target.putFile(RECEIPTS_PATH + name, temp));
        });
        future.then(this, function (f) {
            var err = f.exception;
            var cleanup = fileUtil.rmIfExists(temp);
            cleanup.then(this, function (cf) {
                if (cf.exception) {
                    logger.warn("Could not remove the scratch receipt:",
                        cf.exception.message);
                }
                cf.exception = err;      // undefined on success: carries nothing
                cf.result = name;
            });
            f.nest(cleanup);
        });
        return future;
    };

    /**
     * Brings the local manifest cache in line with the target and returns the
     * name of the newest manifest, which is what the next name is derived from.
     */
    that.syncManifests = function (target) {
        var targetManifests = [];

        var future = fileUtil.mkdirs(MANIFEST_ROOT);
        future.then(this, function (f) {
            var result = f.result;
            f.nest(target.list(MANIFESTS_PATH));
        });
        future.then(this, function (f) {
            var entries = f.result;
            targetManifests = [];
            entries.forEach(function (entry) {
                if (!entry["Is-Folder"] && that.isManifestName(entry.Name)) {
                    targetManifests.push(entry.Name);
                }
            });
            f.nest(that.listLocalManifests(false));
        });
        future.then(this, function (f) {
            var localManifests = f.result;

            // Anything the target has and we do not, fetch.
            var missing = removeAll(targetManifests, localManifests);
            // Anything we have and the target does not, drop: the target is the
            // source of truth, and a stale local entry would show a backup in
            // the restore list that cannot actually be restored.
            var stale = removeAll(localManifests, targetManifests);

            var work = fileUtil.mkdirs(MANIFEST_ROOT);
            work.then(this, function (wf) {
                var result = wf.result;
                wf.nest(mapFuture(missing, function (name) {
                    logger.log("Fetching manifest", name);
                    return target.get(MANIFESTS_PATH + name, MANIFEST_ROOT + name);
                }));
            });
            work.then(this, function (wf) {
                var result = wf.result;
                wf.nest(mapFuture(stale, function (name) {
                    logger.log("Dropping stale cached manifest", name);
                    return fileUtil.rmIfExists(MANIFEST_ROOT + name);
                }));
            });
            f.nest(work);
        });
        future.then(this, function (f) {
            if (f.exception) {
                logger.warn("Manifest sync incomplete:", f.exception.message);
            }
            targetManifests.sort();
            f.result = targetManifests.length > 0 ?
                targetManifests[targetManifests.length - 1] : null;
        });
        return future;
    };

    /**
     * Map of stored filename -> entry for the target's file store. This is what
     * makes a backup incremental: any file whose checksum is already a key here
     * is recorded in the new manifest without being copied.
     */
    that.getStoredFileMap = function (target) {
        var future = target.list(FILES_PATH);
        future.then(this, function (f) {
            if (f.exception) {
                f.result = {};
                return;
            }
            var map = {};
            f.result.forEach(function (entry) {
                if (!entry["Is-Folder"]) {
                    map[entry.Name] = entry;
                }
            });
            f.result = map;
        });
        return future;
    };

    /**
     * Every stored filename referenced by a cached manifest. The complement of
     * this set is garbage and can be purged.
     */
    that.getReferencedFiles = function (thisDeviceOnly) {
        var referenced = {};

        var future = that.listLocalManifests(thisDeviceOnly);
        future.then(this, function (f) {
            var manifestNames = f.result;
            manifestNames.forEach(function (name) {
                var manifest;
                try {
                    manifest = that.loadManifest(name);
                } catch (err) {
                    logger.warn("Ignoring unreadable manifest", name);
                    return;
                }
                (manifest.services || []).forEach(function (service) {
                    (service.files || []).forEach(function (file) {
                        referenced[that.getServerFilename(file)] = true;
                    });
                });
                // Archived .ipks live in manifest.packages, not
                // manifest.services - missing them here doesn't just leave
                // them unprotected, it gets them deleted: purge runs right
                // after storeManifest in the same backup, so an unreferenced
                // package file never survives past the run that stored it.
                // dirFile (the app-directory tarball fallback) is the exact
                // same trap in a new field - added alongside file rather than
                // assuming a future field like it will remember this walk.
                (manifest.packages || []).forEach(function (pkg) {
                    if (pkg.file) {
                        referenced[that.getServerFilename(pkg.file)] = true;
                    }
                    if (pkg.dirFile) {
                        referenced[that.getServerFilename(pkg.dirFile)] = true;
                    }
                });
            });
            f.result = referenced;
        });
        return future;
    };

    /**
     * Deletes a manifest from the target and the local cache.
     */
    that.deleteManifest = function (target, manifestName) {
        var future = target.del(MANIFESTS_PATH + manifestName);
        future.then(this, function (f) {
            if (f.exception) {
                logger.warn("Unable to delete manifest from target:", f.exception.message);
            }
            f.nest(fileUtil.rmIfExists(MANIFEST_ROOT + manifestName));
        });
        return future;
    };

    /**
     * Trims old manifests and removes any stored file no manifest references.
     *
     * Trimming is scoped to THIS device's manifests; the orphan sweep below is
     * not. That asymmetry is the point. A target is shared ground — the README
     * tells people to copy backups off a device and back onto another one — and
     * with an unscoped trim, `manifestsToKeep` (10 by default) counted every
     * manifest in the target and deleted the lexicographically lowest. Import
     * ten backups from an old phone, run one backup on the new one, and the
     * imported ones are the first things deleted. The orphan sweep still reads
     * *every* manifest, so another device's files stay referenced and survive.
     *
     * If the nduId cannot be read, listLocalManifests(true) falls back to
     * matching everything, which is the old behaviour — but that is also the
     * case where this device has no manifests of its own to trim, since it
     * could not have named any.
     *
     * @param keep    How many of this device's manifests to retain. 0 removes
     *                all of them, which is what opting out does.
     */
    that.purge = function (target, keep) {
        var removedManifests = [];
        var referenced;

        var future = that.listLocalManifests(true);
        future.then(this, function (f) {
            var manifests = f.result;
            manifests.sort();

            var excess = keep > 0 ? Math.max(0, manifests.length - keep) : manifests.length;
            removedManifests = manifests.slice(0, excess);

            if (removedManifests.length === 0) {
                f.result = [];
            } else {
                logger.log("Purging", removedManifests.length, "manifest(s)");
                f.nest(mapFuture(removedManifests, function (name) {
                    return that.deleteManifest(target, name);
                }));
            }
        });
        future.then(this, function (f) {
            var result = f.result;
            // Recomputed after the trim, so files that only the just-removed
            // manifests referenced now count as orphans.
            f.nest(that.getReferencedFiles(false));
        });
        future.then(this, function (f) {
            referenced = f.result;
            f.nest(that.getStoredFileMap(target));
        });
        future.then(this, function (f) {
            var stored = f.result;
            var orphans = [];
            for (var name in stored) {
                if (stored.hasOwnProperty(name) && !referenced[name]) {
                    orphans.push(name);
                }
            }
            f.result = orphans;
        });
        future.then(this, function (f) {
            var orphans = f.result;
            if (orphans.length === 0) {
                logger.log("No orphaned files to purge");
                f.result = { manifests: removedManifests.length, files: 0 };
            } else {
                logger.log("Purging", orphans.length, "orphaned file(s)");
                var del = target.batchDel(FILES_PATH, orphans);
                del.then(this, function (df) {
                    if (df.exception) {
                        logger.warn("Purge incomplete:", df.exception.message);
                    }
                    df.result = { manifests: removedManifests.length, files: orphans.length };
                });
                f.nest(del);
            }
        });
        return future;
    };

    return that;
}());
