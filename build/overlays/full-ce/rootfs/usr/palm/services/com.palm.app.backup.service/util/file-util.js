/* Filesystem helpers.
 *
 * Ported from com.palm.service.backup/util/file-util.js. The encryptFile /
 * decryptFile pair is gone: woce-backup stores backups unencrypted so they stay
 * restorable after a doctor, when the keymanager device key no longer exists.
 * gzip is kept — it is what makes the db8 dumps a reasonable size.
 */
/*global Future, logger, mapFuture, require */

var fileUtil = (function () {
    var that = {};
    var crypto = require('crypto');
    var exec   = require('child_process').exec;
    var path   = require('path');
    var fs     = require('fs');

    var FULL_PERMISSIONS = parseInt("0777", 8);

    /**
     * Names of the files in dir, or [] if dir does not exist.
     *
     * @param filterFunction Optional filter applied to the names.
     */
    that.listFiles = function (dir, filterFunction) {
        var future = new Future();
        path.exists(dir, function (exists) {
            if (!exists) {
                future.result = [];
            } else {
                fs.readdir(dir, function (err, files) {
                    if (err) {
                        future.exception = err;
                    } else {
                        future.result = filterFunction ? files.filter(filterFunction) : files;
                    }
                });
            }
        });
        return future;
    };

    that.normalizePath = function (filePath) {
        filePath = path.normalize(filePath);
        if (filePath.endsWith("/")) {
            filePath = filePath.substring(0, filePath.length - 1);
        }
        return filePath;
    };

    // Creates dir and any missing parents.
    that.mkdirs = function (dir) {
        dir = that.normalizePath(dir);
        var future = new Future();
        var dirExists;
        var parent = path.dirname(dir);

        path.exists(dir, function (exists) {
            dirExists = exists;
            future.result = true;
        });

        future.then(this, function (f) {
            var result = f.result;
            if (dirExists) {
                f.result = true;
            } else {
                f.nest(that.mkdirs(parent));
            }
        });

        future.then(this, function (f) {
            var result = f.result;
            if (dirExists) {
                f.result = {};
            } else {
                fs.mkdir(dir, FULL_PERMISSIONS, function (err) {
                    // EEXIST is fine: a sibling call in the same tick may have won.
                    if (err && err.code !== "EEXIST" && err.errno !== 17) {
                        f.exception = new Error(err);
                    } else {
                        f.result = {};
                    }
                });
            }
        });

        return future;
    };

    /**
     * Recursively deletes everything under dir.
     *
     * @param removeDir True to also remove dir itself.
     */
    that.rmFiles = function (dir, removeDir) {
        var future = that.listFiles(dir);
        future.then(this, function (f) {
            var files = f.result;
            f.nest(mapFuture(files, function (filename) {
                var fullpath = path.join(dir, filename);
                var stat = fs.statSync(fullpath);
                if (stat.isFile()) {
                    return that.rm(fullpath);
                } else if (stat.isDirectory()) {
                    return that.rmFiles(fullpath, true);
                }
                return new Future({});
            }));
        });
        if (removeDir) {
            future.then(this, function (f) {
                var result = f.result;
                f.nest(that.rmDir(dir));
            });
        }
        return future;
    };

    that.rm = function (filepath) {
        var future = new Future();
        fs.unlink(filepath, function (err) {
            if (err) {
                future.exception = new Error(err);
            } else {
                future.result = {};
            }
        });
        return future;
    };

    that.exists = function (filepath) {
        var future = new Future();
        path.exists(filepath, function (fileExists) {
            future.result = fileExists;
        });
        return future;
    };

    that.rmDir = function (dir) {
        var future = that.exists(dir);
        future.then(this, function (f) {
            var exists = f.result;
            if (exists) {
                fs.rmdir(dir, function (err) {
                    if (err) {
                        f.exception = new Error(err);
                    } else {
                        f.result = {};
                    }
                });
            } else {
                f.result = {};
            }
        });
        return future;
    };

    that.rmIfExists = function (filepath) {
        var future = new Future();
        path.exists(filepath, function (exists) {
            if (exists) {
                future.nest(that.rm(filepath));
            } else {
                future.result = {};
            }
        });
        return future;
    };

    that.mv = function (fromPath, toPath) {
        var future = new Future();
        fs.rename(fromPath, toPath, function (err) {
            if (err) {
                future.exception = new Error(err);
            } else {
                future.result = {};
            }
        });
        return future;
    };

    /**
     * Copies a file. Used instead of rename when source and destination may be
     * on different mounts (/var/file-cache vs /media/internal).
     *
     * Honours backpressure. Without it — write() unconditionally, ignoring its
     * return value — the read side runs as fast as the disk will go and every
     * chunk the write side has not flushed yet queues in memory. That is
     * survivable for a db8 dump and fatal for the media categories: this is the
     * copy path for every stored and restored file, and a single video is far
     * larger than the memory this device will give a jailed node 0.2 process.
     * The root helper's own copyFileSync already reads and writes in bounded
     * 64K chunks for exactly this reason; the jailed side did not.
     */
    that.cp = function (fromPath, toPath) {
        var future = new Future();
        var reader = fs.createReadStream(fromPath);
        var writer = fs.createWriteStream(toPath);
        var failed = false;
        var ended = false;

        var fail = function (err) {
            if (!failed) {
                failed = true;
                // Stop pulling more data into a copy that is already lost.
                try { reader.destroy(); } catch (ignored) {}
                try { writer.destroy(); } catch (ignored) {}
                future.exception = (err && err.message !== undefined) ? err : new Error(err);
            }
        };

        reader.on("error", fail);
        writer.on("error", fail);

        reader.on("data", function (buf) {
            // write() returns false once the write buffer is full; pause the
            // reader until drain says the queue has emptied again.
            if (writer.write(buf) === false) {
                reader.pause();
            }
        });
        writer.on("drain", function () {
            if (!failed && !ended) {
                reader.resume();
            }
        });

        reader.on("end", function () {
            ended = true;
            writer.end();
        });
        writer.on("close", function () {
            if (!failed) {
                future.result = {};
            }
        });
        return future;
    };

    // Resolves path against baseDir. Absolute paths pass through unchanged —
    // services legitimately return them (contact photos, preference files).
    that.getAbsolutePath = function (filePath, baseDir) {
        if (filePath.charAt(0) === '/') {
            return filePath;
        }
        if (baseDir.charAt(baseDir.length - 1) !== '/') {
            baseDir = baseDir + "/";
        }
        return baseDir + filePath;
    };

    /**
     * Checksum of the file at filepath, or null if it does not exist.
     */
    that.getChecksum = function (filepath, algorithm, encoding) {
        algorithm = algorithm || "md5";
        encoding  = encoding  || "hex";

        var future = that.exists(filepath);
        future.then(this, function (f) {
            var fileExists = f.result;
            if (!fileExists) {
                f.result = null;
                return;
            }

            var hash = crypto.createHash(algorithm);
            var reader = fs.createReadStream(filepath);
            var checksum;
            reader.on("data", function (buf) { hash.update(buf); });
            reader.on("end", function () { checksum = hash.digest(encoding); });
            reader.on("close", function () { f.result = checksum; });
            reader.on("error", function (exception) { future.exception = exception; });
        });
        return future;
    };

    that.getChecksums = function (filepaths, baseDir, algorithm, encoding) {
        return mapFuture(filepaths, function (filepath) {
            return that.getChecksum(that.getAbsolutePath(filepath, baseDir), algorithm, encoding);
        });
    };

    that.gzip = function (sourcepath, destpath) {
        var future = new Future();
        exec("gzip -fnc " + sourcepath.shellQuote() + " > " + destpath.shellQuote(),
            function (error) {
                if (error) {
                    future.exception = new Error(error);
                } else {
                    future.result = { success: true };
                }
            });
        return future;
    };

    // `gzip -d` rather than `gunzip`: busybox provides both on device, but only
    // gzip is reliably reachable off it, and one binary dependency is better
    // than two for identical behaviour.
    that.gunzip = function (sourcepath, destpath) {
        var future = new Future();
        exec("gzip -dfc " + sourcepath.shellQuote() + " > " + destpath.shellQuote(),
            function (error) {
                if (error) {
                    future.exception = new Error(error);
                } else {
                    future.result = { success: true };
                }
            });
        return future;
    };

    /**
     * Size of the file at filepath, or 0 if it does not exist.
     */
    that.getSize = function (filepath) {
        try {
            return fs.statSync(filepath).size;
        } catch (err) {
            return 0;
        }
    };

    that.readJson = function (filepath) {
        var future = new Future();
        fs.readFile(filepath, "utf8", function (err, data) {
            if (err) {
                future.exception = err;
            } else {
                try {
                    future.result = JSON.parse(data);
                } catch (parseErr) {
                    future.exception = parseErr;
                }
            }
        });
        return future;
    };

    that.writeJson = function (filepath, obj) {
        var future = new Future();
        fs.writeFile(filepath, JSON.stringify(obj, null, 2) + "\n", "utf8", function (err) {
            if (err) {
                future.exception = err;
            } else {
                future.result = {};
            }
        });
        return future;
    };

    return that;
}());
