/* Backup target interface.
 *
 * This is the seam that keeps the backup and restore engines storage-agnostic.
 * The method set is deliberately the same as the stock service's Storage class
 * (com.palm.service.backup/util/storage.js), which spoke to Palm's cloud
 * storage server:
 *
 *     list(dirPath)                             -> [entry]
 *     get(remotePath, localPath, notify, sum)   -> {}
 *     putFile(remotePath, localPath, checksum)  -> {}
 *     postFile(remotePath, params, local, sum)  -> { Name }
 *     del(remotePath)                           -> {}
 *     batchDel(dirPath, names)                  -> {}
 *
 * Because the engines only ever call these, adding a Synergy cloud target later
 * means writing one more implementation of this interface and registering it in
 * targets.js — no engine change at all.
 *
 * An entry returned by list() is shaped like the storage server's, so manifest
 * bookkeeping ported over unchanged:
 *
 *     {
 *       Name:             "0a1b2c...",   // basename within the directory
 *       "Is-Folder":      false,
 *       "Content-Length": 4096,          // bytes
 *       Etag:             "0a1b2c...",   // content checksum
 *       "Last-Modified":  "Tue, 19 Aug 2025 10:18:00 GMT"
 *     }
 */
/*global Future, logger, dateUtil */

var TargetBase = function (id, label) {
    this.id = id;
    this.label = label;
};

/**
 * Human-readable description of where this target writes, shown in the UI.
 */
TargetBase.prototype.getDescription = function () {
    return this.label;
};

/**
 * Whether this target can be used right now. A local target checks that its
 * root is writable; a network target would check connectivity and credentials.
 */
TargetBase.prototype.isAvailable = function () {
    return new Future(true);
};

/**
 * Free and total bytes at the destination, or nulls when not knowable.
 * Used to warn before a backup that will not fit.
 */
TargetBase.prototype.getSpace = function () {
    return new Future({ free: null, total: null });
};

/* The storage operations below must be implemented by every target. */

TargetBase.prototype.list = function (dirPath) {
    throw new Error(this.id + " does not implement list()");
};

TargetBase.prototype.get = function (remotePath, localPath, notifyProgress, checksum) {
    throw new Error(this.id + " does not implement get()");
};

TargetBase.prototype.putFile = function (remotePath, localPath, checksum) {
    throw new Error(this.id + " does not implement putFile()");
};

TargetBase.prototype.postFile = function (remotePath, params, localPath, checksum) {
    throw new Error(this.id + " does not implement postFile()");
};

TargetBase.prototype.del = function (remotePath) {
    throw new Error(this.id + " does not implement del()");
};

/**
 * Removes several entries from one directory. The default is a sequential
 * fan-out over del(); a network target should override it with a real batch
 * call.
 */
TargetBase.prototype.batchDel = function (dirPath, names) {
    var self = this;
    return mapFuture(names, function (name) {
        return self.del(dirPath + name);
    });
};

/**
 * True if remotePath exists. The default derives it from list(), which is
 * correct everywhere but wasteful; override where a cheaper check exists.
 */
TargetBase.prototype.exists = function (remotePath) {
    var self = this;
    var slash = remotePath.lastIndexOf("/");
    var dir  = slash < 0 ? "" : remotePath.substring(0, slash + 1);
    var name = slash < 0 ? remotePath : remotePath.substring(slash + 1);

    var future = self.list(dir);
    future.then(this, function (f) {
        if (f.exception) {
            f.result = false;
            return;
        }
        var entries = f.result;
        var found = false;
        entries.forEach(function (entry) {
            if (entry.Name === name) {
                found = true;
            }
        });
        f.result = found;
    });
    return future;
};
