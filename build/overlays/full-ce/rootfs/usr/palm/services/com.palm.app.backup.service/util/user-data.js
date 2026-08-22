/* User file categories, presented as a backup provider.
 *
 * The stock backup service never backed up media — it only ever moved what
 * registered services handed it. Rather than bolt a second code path onto the
 * engine, this exposes user files through the same contract a registered
 * service uses (preBackup returns a file list, postRestore takes one back), and
 * the engine dispatches it in-process instead of over the bus.
 *
 * No root helper is needed here: /media/internal is mounted rw inside the
 * triton jail, so these paths are directly readable and writable.
 *
 * Every category defaults to off. Media is large, and a backup written to
 * /media/internal doubles usage on the very volume it is copying from, so
 * including it has to be the user's explicit choice. getEstimate() exists so
 * the UI can show the cost before they make it.
 */
/*global Future, logger, mapFuture, fileUtil, prefs, require, getParent,
  setTimeout */

var userData = (function () {
    var that = {};
    var fs   = require('fs');
    var path = require('path');

    var MEDIA_ROOT = "/media/internal/";

    that.SERVICE_ID = "com.palm.backup.userdata";

    // Candidate directories per category. Only those that exist are used, so
    // the same list works across TouchPad, Pre 3 and Veer.
    var CATEGORIES = {
        photos:    { label: "Photos",    dirs: ["DCIM", "photos", "screencaptures", "wallpapers"] },
        videos:    { label: "Videos",    dirs: ["videos"] },
        music:     { label: "Music",     dirs: ["music"] },
        documents: { label: "Documents", dirs: ["documents"] },
        downloads: { label: "Downloads", dirs: ["downloads"] },
        ringtones: { label: "Ringtones", dirs: ["ringtones"] }
    };

    // Never worth copying: our own backup store (which would recurse), and the
    // scratch areas the platform leaves lying around.
    var EXCLUDED = [
        ".woce-backup",
        "webos-backups",
        "lost+found",
        ".Trash"
    ];

    // Directory entries examined before yielding the event loop back. The walk
    // has to be interruptible: this service is single-threaded, and
    // getUserDataCategories runs on every app launch and every window
    // activation. A synchronous recursive walk over a full media library is
    // thousands of syscalls with nothing else able to run — it stalled a
    // backup's own progress reporting and could hold the app's launch scrim
    // down long enough to look like a hang.
    var WALK_BATCH = 250;

    // How long a completed scan stays usable. refreshAll fires
    // getUserDataCategories on launch *and* on every activation; re-walking the
    // whole tree each time bought nothing.
    var SCAN_TTL = 30000;

    var scanCache;   // { at: <ms>, byId: { id: { files: [...], bytes: n } } }

    var isExcluded = function (name) {
        for (var i = 0; i < EXCLUDED.length; i++) {
            if (name === EXCLUDED[i]) {
                return true;
            }
        }
        return false;
    };

    /**
     * Collects { path, size } for every file under the given roots, yielding
     * the event loop every WALK_BATCH entries.
     *
     * Iterative rather than recursive: node 0.2 has no readdir concurrency
     * limit, so doing this with parallel async reads would open every directory
     * at once and exhaust file descriptors — but doing it synchronously blocks
     * everything else in the service. An explicit stack with a per-tick budget
     * is neither.
     *
     * Size comes from the stat the walk already does to tell a file from a
     * directory, rather than a second stat per file afterwards.
     */
    var walkAsync = function (roots) {
        var future = new Future();
        var out = [];
        var stack = roots.slice();
        var pending = null;      // { dir, names, i }

        var step = function () {
            var budget = WALK_BATCH;
            try {
                while (budget > 0) {
                    budget--;

                    if (!pending) {
                        if (stack.length === 0) {
                            future.result = out;
                            return;
                        }
                        var dir = stack.pop();
                        var names;
                        try {
                            names = fs.readdirSync(dir);
                        } catch (err) {
                            logger.warn("Unable to read", dir + ":", err.message);
                            continue;
                        }
                        pending = { dir: dir, names: names, i: 0 };
                        continue;
                    }

                    if (pending.i >= pending.names.length) {
                        pending = null;
                        continue;
                    }

                    var name = pending.names[pending.i];
                    pending.i++;
                    if (isExcluded(name)) {
                        continue;
                    }
                    var full = path.join(pending.dir, name);
                    var stat;
                    try {
                        stat = fs.statSync(full);
                    } catch (err) {
                        continue;   // vanished between readdir and stat
                    }
                    if (stat.isDirectory()) {
                        stack.push(full);
                    } else if (stat.isFile()) {
                        out.push({ path: full, size: stat.size });
                    }
                }
            } catch (err) {
                // A throw inside a setTimeout callback is outside any future's
                // reach and would take the whole service down silently.
                future.exception = err;
                return;
            }
            setTimeout(step, 0);
        };

        // Never settle synchronously: Future.nest takes its "already complete"
        // path for a settled future, which is not the path a real caller
        // exercises.
        setTimeout(step, 0);
        return future;
    };

    /**
     * The category roots that actually exist on this device.
     */
    var existingRoots = function (categoryId) {
        var category = CATEGORIES[categoryId];
        var roots = [];
        if (!category) {
            return roots;
        }
        category.dirs.forEach(function (dirName) {
            var dir = MEDIA_ROOT + dirName;
            try {
                if (fs.statSync(dir).isDirectory()) {
                    roots.push(dir);
                }
            } catch (err) {
                // category directory absent on this device, which is normal
            }
        });
        return roots;
    };

    /**
     * { id: { files: [{path, size}], bytes } } for every category.
     *
     * @param force Ignore the cache. A backup wants what is on disk now; the
     *              UI is content with a scan from the last few seconds.
     */
    var scan = function (force) {
        if (!force && scanCache && (new Date().getTime() - scanCache.at) < SCAN_TTL) {
            return new Future(scanCache.byId);
        }

        var byId = {};
        var ids = [];
        for (var id in CATEGORIES) {
            if (CATEGORIES.hasOwnProperty(id)) {
                ids.push(id);
            }
        }

        var future = mapFuture(ids, function (categoryId) {
            var work = walkAsync(existingRoots(categoryId));
            work.then(work, function (wf) {
                var files = wf.exception ? [] : wf.result;
                if (wf.exception) {
                    logger.warn("Scan of", categoryId, "failed:", wf.exception.message);
                }
                var bytes = 0;
                files.forEach(function (entry) { bytes += entry.size; });
                byId[categoryId] = { files: files, bytes: bytes };
                wf.result = {};
            });
            return work;
        });
        future.then(this, function (f) {
            var result = f.result;
            scanCache = { at: new Date().getTime(), byId: byId };
            f.result = byId;
        });
        return future;
    };

    /**
     * Absolute paths of every file in the given category that exists on device.
     * Returns a future — the walk is asynchronous, see walkAsync.
     */
    that.getCategoryFiles = function (categoryId) {
        var future = scan(false);
        future.then(this, function (f) {
            var byId = f.result;
            var entry = byId[categoryId];
            f.result = entry ? entry.files.map(function (file) { return file.path; }) : [];
        });
        return future;
    };

    /**
     * Per-category file count and total bytes, for the "what to back up" UI.
     */
    that.getEstimate = function () {
        var enabled;

        var future = prefs.getUserData();
        future.then(this, function (f) {
            enabled = f.result;
            f.nest(scan(false));
        });
        future.then(this, function (f) {
            var byId = f.result;
            var categories = [];

            for (var id in CATEGORIES) {
                if (CATEGORIES.hasOwnProperty(id)) {
                    var entry = byId[id] || { files: [], bytes: 0 };
                    categories.push({
                        id:      id,
                        label:   CATEGORIES[id].label,
                        enabled: enabled[id] === true,
                        count:   entry.files.length,
                        bytes:   entry.bytes
                    });
                }
            }
            f.result = { categories: categories };
        });
        return future;
    };

    /**
     * Total bytes the enabled categories would contribute to a backup. Used for
     * the free-space check before a run starts.
     */
    that.getEnabledBytes = function () {
        var enabled;

        var future = prefs.getUserData();
        future.then(this, function (f) {
            enabled = f.result;
            f.nest(scan(false));
        });
        future.then(this, function (f) {
            var byId = f.result;
            var bytes = 0;
            for (var id in CATEGORIES) {
                if (CATEGORIES.hasOwnProperty(id) && enabled[id] === true) {
                    bytes += (byId[id] ? byId[id].bytes : 0);
                }
            }
            f.result = bytes;
        });
        return future;
    };

    /**
     * The preBackup half of the contract: the file list for every enabled
     * category. Absolute paths, so the engine copies them straight from
     * /media/internal without staging.
     */
    that.preBackup = function () {
        var enabled;

        var future = prefs.getUserData();
        future.then(this, function (f) {
            enabled = f.result;
            // Forced: a backup records what is on disk now, not what the UI
            // happened to scan a moment ago.
            f.nest(scan(true));
        });
        future.then(this, function (f) {
            var byId = f.result;
            var files = [];
            var included = [];

            for (var id in CATEGORIES) {
                if (CATEGORIES.hasOwnProperty(id) && enabled[id] === true) {
                    var categoryFiles = (byId[id] ? byId[id].files : []).map(
                        function (file) { return file.path; });
                    logger.log("User data category", id, "contributes", categoryFiles.length, "files");
                    files = files.concat(categoryFiles);
                    included.push(id);
                }
            }

            f.result = {
                version:            1,
                description:        "User files (" + (included.join(", ") || "none") + ")",
                files:              files,
                // The category selection is the incremental key: change what is
                // selected and the engine re-evaluates instead of assuming the
                // previous file list still holds.
                incrementalKey:     { categories: included.join(",") },
                ignoreMissingFiles: true
            };
        });
        return future;
    };

    /**
     * The postRestore half. Files were backed up under their absolute paths, so
     * the engine has already written them back to /media/internal; all that is
     * left is to make sure the parent directories exist for any that did not.
     */
    that.postRestore = function (params) {
        var files = (params && params.files) || [];
        var dirs = {};
        files.forEach(function (filePath) {
            if (filePath.charAt(0) === '/') {
                dirs[getParent(filePath)] = true;
            }
        });

        var dirList = [];
        for (var dir in dirs) {
            if (dirs.hasOwnProperty(dir)) {
                dirList.push(dir);
            }
        }

        var future = mapFuture(dirList, function (dir) {
            return fileUtil.mkdirs(dir);
        });
        future.then(this, function (f) {
            var result = f.result;
            logger.log("Restored", files.length, "user files");
            // What is on disk changed, so the cached scan is now wrong.
            scanCache = undefined;
            f.result = {};
        });
        return future;
    };

    /**
     * True if any category is enabled, so the engine can skip the provider
     * entirely when there is nothing selected.
     *
     * Reads prefs only — deliberately not a scan. This is called from
     * loadRegisteredServices on every backup *and* every restore, and walking
     * the media tree just to answer "did the user tick anything" would put the
     * most expensive operation in the service on the cheapest question.
     */
    that.isEnabled = function () {
        var future = prefs.getUserData();
        future.then(this, function (f) {
            var enabled = f.result;
            var any = false;
            for (var id in CATEGORIES) {
                if (CATEGORIES.hasOwnProperty(id) && enabled[id] === true) {
                    any = true;
                }
            }
            f.result = any;
        });
        return future;
    };

    that.CATEGORIES = CATEGORIES;

    return that;
}());
