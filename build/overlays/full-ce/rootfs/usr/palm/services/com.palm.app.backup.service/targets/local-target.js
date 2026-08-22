/* Local storage target — writes backups to a directory on the device.
 *
 * The default root is /media/internal/webos-backups, chosen because it is
 * mounted rw inside the triton jail and shows up as an ordinary folder when the
 * device is plugged in as USB mass storage. A user can copy a backup off the
 * device, or drop one back on, with no tooling at all.
 *
 * Layout mirrors what the stock service kept on Palm's storage server:
 *
 *     webos-backups/
 *       manifests/000001-<nduId>      one JSON manifest per backup
 *       files/<md5>[.gz]              content-addressed file store
 *
 * Content addressing is what makes incremental backups work: a file whose
 * contents have not changed hashes to a name that is already present, so it is
 * recorded in the new manifest and never copied again.
 */
/*global Future, TargetBase, failedFuture, fileUtil, logger, mapFuture, dateUtil,
  require, LOCAL_TARGET_ROOT, getParent, zeroPad */

var LocalTarget = function (root) {
    TargetBase.call(this, "local", "This device");
    this.root = root || LOCAL_TARGET_ROOT;
    if (this.root.charAt(this.root.length - 1) !== '/') {
        this.root += '/';
    }
};

LocalTarget.prototype = new TargetBase();
LocalTarget.prototype.constructor = LocalTarget;

LocalTarget.prototype.getDescription = function () {
    return this.root;
};

/**
 * Resolves a target-relative path to an absolute one, refusing anything that
 * would escape the root.
 */
LocalTarget.prototype.resolve = function (remotePath) {
    var path = require('path');
    // Forward slashes throughout. On device this is a no-op; off device it
    // keeps path.normalize from handing back separators that getParent (which
    // splits on '/') cannot read.
    var toPosix = function (p) { return path.normalize(p).replace(/\\/g, "/"); };

    var root = toPosix(this.root);
    var full = toPosix(this.root + (remotePath || ""));
    if (full.indexOf(root) !== 0) {
        throw new Error("Path escapes the backup root: " + remotePath);
    }
    return full;
};

LocalTarget.prototype.isAvailable = function () {
    var self = this;
    var future = fileUtil.mkdirs(self.root);
    future.then(this, function (f) {
        if (f.exception) {
            logger.error("Backup root is not writable:", f.exception.message);
            f.result = false;
        } else {
            var result = f.result;
            f.result = true;
        }
    });
    return future;
};

/**
 * Free and total bytes on the volume holding the root, via df.
 *
 * BusyBox df has no --output, so this parses the plain listing: the second
 * line's fields are  filesystem, 1k-blocks, used, available, use%, mount.
 */
LocalTarget.prototype.getSpace = function () {
    var exec = require('child_process').exec;
    var self = this;
    var future = new Future();

    exec("df -k " + self.root.shellQuote(), function (error, stdout) {
        if (error || !stdout) {
            future.result = { free: null, total: null };
            return;
        }
        var lines = stdout.split("\n");
        if (lines.length < 2) {
            future.result = { free: null, total: null };
            return;
        }
        var fields = lines[1].split(/\s+/);
        // A long device name wraps onto its own line, shifting the columns.
        var offset = fields.length >= 6 ? 0 : -1;
        var total = parseInt(fields[1 + offset], 10);
        var free  = parseInt(fields[3 + offset], 10);
        future.result = {
            free:  isNaN(free)  ? null : free  * 1024,
            total: isNaN(total) ? null : total * 1024
        };
    });
    return future;
};

LocalTarget.prototype.list = function (dirPath) {
    var self = this;
    var fs = require('fs');
    var path = require('path');
    var dir;

    try {
        dir = self.resolve(dirPath);
    } catch (err) {
        return new Future([]);
    }

    var future = fileUtil.listFiles(dir);
    future.then(this, function (f) {
        var names = f.result;
        var entries = [];
        names.forEach(function (name) {
            var full = path.join(dir, name);
            var stat;
            try {
                stat = fs.statSync(full);
            } catch (err) {
                return;   // removed underneath us
            }
            entries.push({
                Name: name,
                "Is-Folder": stat.isDirectory(),
                "Content-Length": stat.size,
                // Files are content-addressed, so the name is the checksum.
                // Manifests are not, so they report none.
                Etag: dirPath === "files/" ? stripSuffixes(name) : undefined,
                "Last-Modified": dateUtil.formatDateRfc1123(new Date(stat.mtime))
            });
        });
        entries.sort(function (a, b) {
            return a.Name < b.Name ? -1 : (a.Name > b.Name ? 1 : 0);
        });
        f.result = entries;
    });
    return future;
};

/**
 * Strips the .gz that getServerFilename appends, recovering the raw checksum.
 */
function stripSuffixes(name) {
    return name.endsWith(".gz") ? name.substring(0, name.length - 3) : name;
}

/**
 * Copies a stored file out to localPath.
 */
LocalTarget.prototype.get = function (remotePath, localPath, notifyProgress, checksum) {
    var self = this;
    var source;
    try {
        source = self.resolve(remotePath);
    } catch (err) {
        // failedFuture, not `new Future(err)`: the latter is a *successful*
        // future carrying an Error, so the caller would treat a rejected path
        // as a completed fetch. See common.js.
        return failedFuture(err);
    }

    var future = fileUtil.mkdirs(getParent(localPath));
    future.then(this, function (f) {
        var result = f.result;
        f.nest(fileUtil.exists(source));
    });
    future.then(this, function (f) {
        var exists = f.result;
        if (!exists) {
            throw new Error("Not found in backup: " + remotePath);
        }
        f.nest(fileUtil.cp(source, localPath));
    });
    return future;
};

/**
 * Stores localPath at remotePath.
 *
 * Writes to a .part file and renames into place, so an interrupted backup
 * cannot leave a truncated file sitting under a name that claims to be the
 * checksum of its full contents — which would silently poison every later
 * incremental backup that deduped against it.
 */
LocalTarget.prototype.putFile = function (remotePath, localPath, checksum) {
    var self = this;
    var dest, partial;
    try {
        dest = self.resolve(remotePath);
        partial = dest + ".part";
    } catch (err) {
        // See get() above: a successful future carrying an Error would have
        // this file recorded in storedFileMap and the manifest as stored,
        // poisoning every later incremental backup that deduped against it.
        return failedFuture(err);
    }

    var future = fileUtil.mkdirs(getParent(dest));
    future.then(this, function (f) {
        var result = f.result;
        f.nest(fileUtil.rmIfExists(partial));
    });
    future.then(this, function (f) {
        var result = f.result;
        f.nest(fileUtil.cp(localPath, partial));
    });
    future.then(this, function (f) {
        var result = f.result;
        f.nest(fileUtil.mv(partial, dest));
    });
    future.then(this, function (f) {
        if (f.exception) {
            // Drop the partial file, then fail with the original error. The
            // error must travel on the cleanup future: nest() has already
            // queued its callback behind ours, and it would overwrite f with
            // the cleanup's successful result and lose the failure.
            var err = f.exception;
            var cleanup = fileUtil.rmIfExists(partial);
            cleanup.then(this, function (cf) {
                if (cf.exception) {
                    logger.warn("Could not remove the partial file:", cf.exception.message);
                }
                cf.exception = err;
            });
            f.nest(cleanup);
        } else {
            var result = f.result;
            f.result = {};
        }
    });
    return future;
};

/**
 * Stores localPath under a name this target chooses, returning { Name }.
 *
 * The stock service used POST for manifests so the server could allocate the
 * next sequence number. Locally we allocate it ourselves from the existing
 * manifest names.
 */
LocalTarget.prototype.postFile = function (remotePath, params, localPath, checksum) {
    var self = this;
    var name;

    var future = self.list(remotePath);
    future.then(this, function (f) {
        var entries = f.result;
        var highest = 0;
        entries.forEach(function (entry) {
            var n = parseInt(entry.Name, 10);
            if (!isNaN(n) && n > highest) {
                highest = n;
            }
        });
        name = zeroPad(highest + 1, 6) + (params && params.suffix ? params.suffix : "");
        f.nest(self.putFile(remotePath + name, localPath, checksum));
    });
    future.then(this, function (f) {
        var result = f.result;
        f.result = { Name: name };
    });
    return future;
};

LocalTarget.prototype.del = function (remotePath) {
    var self = this;
    var target;
    try {
        target = self.resolve(remotePath);
    } catch (err) {
        return new Future({});
    }
    return fileUtil.rmIfExists(target);
};

LocalTarget.prototype.batchDel = function (dirPath, names) {
    var self = this;
    var future = mapFuture(names, function (name) {
        return self.del(dirPath + name);
    });
    future.then(this, function (f) {
        var result = f.result;
        f.result = {};
    });
    return future;
};

LocalTarget.prototype.exists = function (remotePath) {
    var self = this;
    try {
        return fileUtil.exists(self.resolve(remotePath));
    } catch (err) {
        return new Future(false);
    }
};
