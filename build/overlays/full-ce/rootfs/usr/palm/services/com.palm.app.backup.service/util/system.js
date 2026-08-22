/* Luna bus and device-information helpers.
 *
 * Ported from com.palm.service.backup/util/system.js, trimmed to what a local
 * backup needs. Gone: getCredentials, getServerUrl, getAccountToken and the
 * keymanager encrypt/decrypt pair — all of those served the dead Palm cloud.
 * Kept: the temp-dir allocation, device profile, and connection check, because
 * the file-cache temp dir is how services hand us their data and the
 * connection check is what a Synergy target will need later.
 */
/*global Future, PalmCall, logger, isEmpty, require, fileUtil, privileged, tolerate, WORK_ROOT */

var system = (function () {
    var that = {};

    var SYSTEM_SERVICE_URL     = "palm://com.palm.systemservice";
    var CONNECTION_MANAGER_URL = "palm://com.palm.connectionmanager";
    var POWER_SERVICE_URL      = "palm://com.palm.power";
    var ACTIVITY_MANAGER_URL   = "palm://com.palm.activitymanager";
    var FILE_CACHE_ID          = "com.palm.filecache";

    // The stock backup service's file cache type, registered on every webOS
    // 3.0.5 device by /etc/palm/filecache_types/backuptempdir. Reused rather
    // than defined: filecache types come from config files installed at build
    // time, and DefineType — despite existing in the binary — is not reachable
    // from the bus a third-party service calls on ("Unknown method DefineType
    // for category /"). This type is a directory type with 2MB/8MB watermarks,
    // which is exactly what it was created for.
    var TEMP_DIR_TYPE = "backuptempdir";

    /**
     * True when the error means the service could not be reached at all, as
     * opposed to the service answering with a failure.
     *
     * This service registers on the public bus, and a service with no file in
     * /usr/share/dbus-1/services cannot be launched from there — which is the
     * case for com.palm.deviceprofile, com.palm.eas, com.palm.service.contacts,
     * com.palm.service.migration and com.palm.messaging.chatthreader.
     */
    var isUnreachable = function (err) {
        var message = (err && err.message) || "";
        return message.indexOf("Service does not exist") !== -1 ||
               message.indexOf("Service not listed in service files") !== -1 ||
               // A whole *category* can be private even when the service is
               // reachable: com.palm.db answers on the public bus but exposes
               // internal/preBackup — the call the entire backup depends on —
               // only on the private one, and reports it as an unknown method.
               message.indexOf("Unknown method") !== -1;
    };

    /**
     * PalmCall.call, but a synchronous throw comes back as a failed future.
     *
     * PalmCall validates the URI before it builds anything, so a malformed one
     * throws where the caller expects a future. tolerate() and nest() both take
     * a future, so the throw escapes into whatever callback made the call and
     * can stall the chain instead of failing it.
     */
    var safeCall = function (url, cmd, args) {
        try {
            return PalmCall.call(url, cmd, args);
        } catch (err) {
            var future = new Future();
            future.exception = err;
            return future;
        }
    };

    /**
     * Calls a Luna service, tagging any thrown error with the service id so the
     * backup engine can report which service is to blame for a failure. Falls
     * back to the root helper for services the public bus cannot reach.
     */
    that.palmcall = function (serviceId, cmd, args) {
        var url = "palm://" + serviceId;
        var fullUrl = url + "/" + cmd;
        args = args !== undefined ? args : {};

        logger.log("Calling", fullUrl, "with", args);
        var future = safeCall(url, cmd, args);
        future.then(this, function (f) {
            var err;
            try {
                var result = f.result;
                f.result = result;
                return;
            } catch (caught) {
                err = caught;
            }

            if (!isUnreachable(err)) {
                logger.error("Call to", fullUrl, "failed:", err.message || err);
                err.serviceId = serviceId;
                throw err;
            }

            // Private-bus service. Retry through the root helper, which runs
            // luna-send as root — and luna-send uses the private bus by
            // default. Without the helper there is nothing more to try.
            logger.log(serviceId, "is not reachable from the public bus, trying the helper");
            var viaHelper = privileged.isAvailable();
            viaHelper.then(this, function (hf) {
                var available = hf.exception ? false : hf.result;
                if (!available) {
                    var unreachable = new Error(serviceId +
                        " is private-bus only and the root helper is not installed");
                    unreachable.serviceId = serviceId;
                    throw unreachable;
                }
                hf.nest(privileged.lunacall(serviceId, cmd, args));
            });
            f.nest(viaHelper);
        });
        return future;
    };

    that.getDeviceProfile = function () {
        var future = that.palmcall("com.palm.deviceprofile", "getDeviceProfile", {});
        future.then(this, function (f) {
            var result = f.result;
            var deviceInfo = result.deviceInfo || {};
            f.result = deviceInfo;
        });
        return future;
    };

    /**
     * This device's nduId, which manifests are named after.
     *
     * Read from /dev/nduid rather than com.palm.deviceprofile. The jail copies
     * that node in mode 444 (jail_device.conf sets do_nduid for every supported
     * device), whereas com.palm.deviceprofile is private-bus only: it has a
     * role under roles/pub but no service file in /usr/share/dbus-1/services,
     * so a public-bus caller cannot launch it and gets "Service does not
     * exist". Reading the node is both simpler and more reliable.
     */
    that.getNduId = function () {
        var fs = require('fs');
        var nduId = null;
        var fd;

        // Read with open/read/close rather than fs.readFile. /dev/nduid is a
        // character device: readFile stats it first, sees a size of 0, and
        // hands back an empty string without ever reading anything.
        try {
            fd = fs.openSync("/dev/nduid", "r");
            var buffer = new Buffer(128);
            var read = fs.readSync(fd, buffer, 0, 128, null);
            if (read > 0) {
                nduId = buffer.toString("utf8", 0, read).replace(/[^0-9a-zA-Z]/g, "");
            }
        } catch (err) {
            logger.log("Unable to read /dev/nduid:", err.message);
        } finally {
            if (fd !== undefined) {
                try { fs.closeSync(fd); } catch (ignored) {}
            }
        }

        if (nduId) {
            return new Future(nduId);
        }

        // Fall back to the device profile, for a device that does not expose
        // the node. Kept synchronous on purpose: the previous version chained
        // this inside an fs callback, where `this` is not the system object.
        // Foundations asserts its scope is an object, so it threw — and a throw
        // inside an fs callback is outside any future's reach, which took the
        // whole service process down without logging anything.
        logger.warn("No nduId from /dev/nduid, asking the device profile");
        var profile = tolerate(that.getDeviceProfile(), {});
        profile.then(this, function (f) {
            var result = f.result;
            f.result = (result && result.nduId) || null;
        });
        return profile;
    };

    that.getDeviceName = function () {
        var future = safeCall(SYSTEM_SERVICE_URL, "getPreferences", { keys: ["deviceName"] });
        future.then(this, function (f) {
            var result = f.result;
            var deviceName = result.deviceName;
            f.result = (deviceName === undefined || deviceName === null) ? "" : deviceName;
        });
        return future;
    };

    /**
     * Battery level and active connections, recorded in the manifest for
     * troubleshooting. Never fatal: a missing reading must not fail a backup.
     */
    that.getDeviceStatus = function () {
        var status = {};
        // No leading slash: the method already carries its category, and
        // "palm://com.palm.power" + "/com/palm/..." parses to "//com/palm/power"
        // which PalmCall rejects. This is the form the stock service used.
        var future = safeCall(POWER_SERVICE_URL, "com/palm/power/batteryStatusQuery", {});
        future.then(this, function (f) {
            if (f.exception) {
                status.battery = null;
            } else {
                var result = f.result;
                status.battery = result.percent_ui !== undefined ? result.percent_ui : result.percent;
            }
            return safeCall(CONNECTION_MANAGER_URL, "getstatus", {});
        });
        future.then(this, function (f) {
            status.connections = {};
            if (f.exception) {
                // Reading .exception marks it handled; a missing connection
                // list is not worth failing a backup over.
                logger.log("No connection status available");
            } else {
                var result = f.result;
                for (var name in result) {
                    if (result.hasOwnProperty(name)) {
                        var connection = result[name];
                        if (connection && "connected" === connection.state) {
                            status.connections[name] = { ipAddress: connection.ipAddress };
                        }
                    }
                }
            }
            f.result = status;
        });
        return future;
    };

    /**
     * True if any interface is connected. Only meaningful for network targets;
     * a local backup never consults it.
     */
    that.isInternetConnectionAvailable = function () {
        var future = safeCall(CONNECTION_MANAGER_URL, "getstatus", {});
        future.then(this, function (f) {
            if (f.exception) {
                f.result = false;
                return;
            }
            var result = f.result;
            var connected = false;
            for (var name in result) {
                if (result.hasOwnProperty(name)) {
                    var connection = result[name];
                    if (connection && "connected" === connection.state) {
                        connected = true;
                    }
                }
            }
            f.result = connected;
        });
        return future;
    };

    /**
     * Allocates a temp directory from the file cache and returns its path.
     *
     * This is the mechanism that makes a jailed backup possible at all: the
     * file cache lives on /var/file-cache, which is mounted rw inside the
     * triton jail and is also writable by the system services we ask for data.
     * It is the one piece of shared ground between us and them.
     *
     * The subscription must stay open for the directory to survive, so the
     * caller keeps the returned future and cancels it when finished.
     */
    that.getTempDir = function (size) {
        var future = that.palmcall(FILE_CACHE_ID, "InsertCacheObject", {
            typeName: TEMP_DIR_TYPE,
            fileName: "tmp",
            size: size,
            subscribe: true
        });
        future.then(this, function (f) {
            if (f.exception) {
                // Fall back to a directory of our own under /media/internal.
                //
                // It works for the same reason the file cache does: both sides
                // of a preBackup call have to be able to write to the temp dir,
                // and /media/internal is a FAT volume with no ownership, so
                // every service can. It is second choice only because the file
                // cache manages quota and cleanup for us.
                logger.warn("File cache unavailable (" + f.exception.message +
                    "), using a local temp directory");
                f.nest(fallbackTempDir());
            } else {
                var result = f.result;
                f.result = result.pathName + "/";
            }
        });
        return future;
    };

    /**
     * A temp directory under our own working area, used when the file cache
     * cannot be reached.
     */
    var fallbackTempDir = function () {
        var dir = WORK_ROOT + "tmp/";
        var future = fileUtil.rmFiles(dir);
        future.then(this, function (f) {
            if (f.exception) {
                logger.log("No previous temp directory to clear");
            }
            f.nest(fileUtil.mkdirs(dir));
        });
        future.then(this, function (f) {
            var result = f.result;
            f.result = dir;
        });
        return future;
    };

    /**
     * True for paths on a read-only partition. Backing them up is pointless and
     * restoring over them fails, so both directions skip these.
     */
    that.isReadOnlyPartition = function (filePath) {
        return filePath.startsWith("/usr/");
    };

    // The service or application that called us.
    that.getStartedBy = function (message) {
        var serviceName = message.senderServiceName();
        if (serviceName && !serviceName.startsWith("com.palm.luna-")) {
            return serviceName;
        }
        var ret = message.applicationID().trim();
        var i = ret.indexOf(" ");
        return i > -1 ? ret.substr(0, i) : ret;
    };

    /**
     * Creates (or replaces) the daily backup activity. Mirrors the stock
     * com.palm.service.backup.scheduled activity, under our own name.
     */
    that.createScheduledActivity = function () {
        var activity = {
            name: "com.palm.app.backup.service.scheduled",
            description: "Daily woce-backup",
            // Mirrors the stock ScheduledBackup activity. `foreground` is
            // omitted rather than set false: the Activity Manager rejects the
            // whole spec with "If present, 'foreground' should be specified as
            // 'true'". `explicit` is omitted too — an explicit activity must be
            // completed by hand, which a scheduled callback should not require.
            type: {
                background: true,
                persist: true,
                power: true
            },
            requirements: {
                battery: 25
            },
            // interval only. Adding a start time gets "Unless precise time is
            // specified, time intervals may not specify a start or end time" —
            // the stock ScheduledBackup activity carried the same bare interval.
            schedule: {
                interval: "24h"
            },
            callback: {
                method: "palm://com.palm.app.backup.service/scheduledBackup",
                params: { scheduled: true }
            }
        };

        return that.palmcall("com.palm.activitymanager", "create", {
            activity: activity,
            start: true,
            replace: true
        });
    };

    /**
     * Cancels the daily backup activity. Missing activity is not an error —
     * opting out twice must not fail.
     */
    that.cancelScheduledActivity = function () {
        var future = that.palmcall("com.palm.activitymanager", "cancel", {
            activityName: "com.palm.app.backup.service.scheduled"
        });
        future.then(this, function (f) {
            if (f.exception) {
                logger.log("No scheduled activity to cancel");
            }
            f.result = {};
        });
        return future;
    };

    return that;
}());
