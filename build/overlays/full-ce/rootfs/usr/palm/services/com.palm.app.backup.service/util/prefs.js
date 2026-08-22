/* Service preferences, stored in db8.
 *
 * Mirrors com.palm.service.backup/util/prefs.js. The kind is ours
 * (com.palm.backup.prefs:1) and the UI watches it with a db8 watch query
 * exactly the way the stock Backup app watched com.palm.service.backup.prefs:1
 * — that is how the toggle stays in sync when the service changes it.
 *
 * One deliberate difference: userEnabled defaults to false. The stock service
 * defaulted to true because backup was part of HP account setup and the user
 * had already consented there. A freshly installed third-party app has no such
 * consent, so it must not start scheduling daily backups on its own.
 */
/*global DB, Future, logger, isEmpty, LOCAL_TARGET_ROOT */

var prefs = (function () {
    var that = {};

    var DB_KIND  = "com.palm.backup.prefs:1";
    var DB_OWNER = "com.palm.app.backup.service";

    // Categories of user files under /media/internal. These ride the same
    // preBackup/postRestore contract as a real service — see util/user-data.js.
    var DEFAULT_USER_DATA = {
        photos:    false,
        videos:    false,
        music:     false,
        documents: false,
        downloads: false,
        ringtones: false
    };

    var DEFAULTS = {
        userEnabled:       false,
        targetId:          "local",
        localRoot:         null,     // null means "use the built-in default"
        userData:          DEFAULT_USER_DATA,
        includePackages:   true,     // record installed apps in the manifest
        archivePackages:   false,    // also copy the .ipk files (privileged only)
        manifestsToKeep:   10,
        restoreUserApps:   false
    };

    var cached;   // the prefs row, cached for this service lifetime
    var kindReady = false;

    /**
     * Creates the kind if it does not exist. Needed because a third-party
     * service has no Configurator entry to do it at install time.
     */
    var ensureKind = function () {
        if (kindReady) {
            return new Future(true);
        }

        // Straight to putKind. Checking Kind:1 first would be the obvious
        // thing, but a third-party caller cannot read it — mojodb answers
        // "permission denied for caller ... on kind 'Kind:1'". putKind is
        // idempotent (it logs UpdatingKind for one that already exists), so the
        // check bought nothing except a logged error on every service start.
        logger.log("Ensuring db8 kind", DB_KIND);
        var future = DB.putKind(DB_KIND, DB_OWNER, []);
        future.then(this, function (f) {
            if (f.exception) {
                // A concurrent putKind, or the kind already existing under a
                // different owner, is survivable — reads will tell us.
                logger.warn("putKind failed:", f.exception.message);
            }
            kindReady = true;
            f.result = true;
        });
        return future;
    };

    var applyDefaults = function (row) {
        var ret = {};
        for (var key in DEFAULTS) {
            if (DEFAULTS.hasOwnProperty(key)) {
                ret[key] = (row && row[key] !== undefined) ? row[key] : DEFAULTS[key];
            }
        }
        // Fill in any category added by a later version.
        var userData = {};
        for (var cat in DEFAULT_USER_DATA) {
            if (DEFAULT_USER_DATA.hasOwnProperty(cat)) {
                userData[cat] = (ret.userData && ret.userData[cat] !== undefined)
                    ? ret.userData[cat]
                    : DEFAULT_USER_DATA[cat];
            }
        }
        ret.userData = userData;
        ret._id = row ? row._id : undefined;
        return ret;
    };

    /**
     * The full preferences object, with defaults filled in.
     */
    that.get = function () {
        if (cached) {
            return new Future(cached);
        }

        var future = ensureKind();
        future.then(this, function (f) {
            var result = f.result;
            f.nest(DB.find({ from: DB_KIND, limit: 2 }));
        });
        future.then(this, function (f) {
            var row = null;
            if (f.exception) {
                logger.warn("Unable to read prefs, using defaults:", f.exception.message);
            } else {
                var results = f.result.results;
                if (results && results.length > 0) {
                    row = results[0];
                }
            }
            cached = applyDefaults(row);
            f.result = cached;
        });
        return future;
    };

    /**
     * Merges the given properties into the stored preferences, resolving with
     * the resulting preferences object.
     *
     * The result is built here rather than re-read afterwards. Two reasons: it
     * saves a round trip, and — more importantly — it guarantees a defined
     * object. Chaining a second get() through nest() left the caller holding
     * `undefined` in some paths, and every caller does `result.something`.
     */
    that.set = function (props) {
        var updated;

        var future = that.get();
        future.then(this, function (f) {
            var current = f.result;
            var record = {};
            var key;

            for (key in current) {
                if (current.hasOwnProperty(key) && key !== "_id") {
                    record[key] = current[key];
                }
            }
            for (key in props) {
                if (props.hasOwnProperty(key)) {
                    record[key] = props[key];
                }
            }
            record._kind = DB_KIND;
            if (current._id) {
                record._id = current._id;
            }

            updated = applyDefaults(record);
            updated._id = current._id;

            // Drop the cache before writing, so a failed write cannot leave us
            // serving a value that was never stored.
            cached = undefined;

            if (current._id) {
                // merge, not put. mojodb rejects a put against an existing
                // object without its current _rev ("_rev must be specified for
                // existing objects"), and caching a _rev only moves the problem
                // — it goes stale the moment anything else writes. merge by
                // query needs neither, and it is what the stock service used.
                f.nest(DB.merge({ from: DB_KIND }, props));
            } else {
                f.nest(DB.put([record]));
            }
        });
        future.then(this, function (f) {
            if (f.exception) {
                // Report it loudly — the setting did not persist — but still
                // hand back a usable object so callers do not fault.
                logger.error("Unable to save prefs:", f.exception.message);
            } else {
                var result = f.result;
                if (result && result.results && result.results[0] && result.results[0].id) {
                    updated._id = result.results[0].id;
                }
                cached = updated;
            }
            f.result = updated;
        });
        return future;
    };

    that.isEnabled = function () {
        var future = that.get();
        future.then(this, function (f) {
            var result = f.result;
            f.result = result.userEnabled === true;
        });
        return future;
    };

    that.setUserEnabled = function (userEnabled) {
        logger.log("Setting userEnabled to", userEnabled);
        return that.set({ userEnabled: userEnabled === true });
    };

    that.getTargetId = function () {
        var future = that.get();
        future.then(this, function (f) {
            var result = f.result;
            f.result = result.targetId || "local";
        });
        return future;
    };

    that.setTargetId = function (targetId) {
        return that.set({ targetId: targetId });
    };

    that.getUserData = function () {
        var future = that.get();
        future.then(this, function (f) {
            var result = f.result;
            f.result = result.userData;
        });
        return future;
    };

    that.setUserData = function (userData) {
        return that.set({ userData: userData });
    };

    /**
     * Drops the in-process cache. Called after an external write (the UI can
     * change prefs through db8 directly) so the next read re-fetches.
     */
    that.invalidate = function () {
        cached = undefined;
    };

    that.KIND = DB_KIND;
    that.DEFAULT_USER_DATA = DEFAULT_USER_DATA;

    return that;
}());
