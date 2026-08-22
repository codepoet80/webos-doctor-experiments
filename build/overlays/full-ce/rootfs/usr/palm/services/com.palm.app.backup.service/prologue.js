/* woce-backup service — global imports and logging.
 *
 * Mirrors the prologue of com.palm.service.backup, but uses a logger that
 * degrades to console.log: pmloglib is not guaranteed present for a
 * third-party service, and losing logs makes on-device debugging miserable.
 */
/*global IMPORTS, require, console */

var Foundations = IMPORTS.foundations;
var Io = IMPORTS["foundations.io"];

var DB = Foundations.Data.DB;
var Future = Foundations.Control.Future;
var PalmCall = Foundations.Comms.PalmCall;

// NOV-108635 workaround, carried over from the stock service
if (typeof require === 'undefined') {
    require = IMPORTS.require;
}

/* Log an uncaught exception before the process dies.
 *
 * Foundations catches anything thrown inside a future callback, but a throw
 * from an fs, setTimeout or child_process callback is outside its reach and
 * takes the service down with no output at all — the log simply stops, and the
 * next call reports "com.palm.app.backup.service is not running". That is a
 * miserable thing to debug on a device, so make it say something first.
 *
 * This does not swallow the crash: the process still exits, because a service
 * left running after an unknown fault is worse than one that restarts clean.
 */
if (typeof process !== "undefined" && process.on) {
    process.on("uncaughtException", function (err) {
        try {
            console.error("woce-backup: FATAL uncaught exception: " +
                (err && (err.stack || err.message || err)));
        } catch (ignored) {
            // nothing left to do if even logging fails
        }
        process.exit(1);
    });
}

var logger = (function () {
    var LOG_PREFIX = "woce-backup: ";

    var join = function (args) {
        var parts = [];
        for (var i = 0; i < args.length; i++) {
            var a = args[i];
            if (a !== null && typeof a === "object") {
                try {
                    parts.push(JSON.stringify(a));
                } catch (err) {
                    parts.push(String(a));
                }
            } else {
                parts.push(String(a));
            }
        }
        return LOG_PREFIX + parts.join(" ");
    };

    var pmlog;
    try {
        pmlog = require('pmloglib');
    } catch (err) {
        pmlog = null;
    }

    var emit = function (level, args) {
        var line = join(args);
        if (pmlog && typeof pmlog[level] === "function") {
            pmlog[level](line);
        } else {
            console.log(line);
        }
    };

    return {
        log:   function () { emit("log", arguments); },
        info:  function () { emit("info", arguments); },
        warn:  function () { emit("warn", arguments); },
        error: function () { emit("error", arguments); }
    };
}());
