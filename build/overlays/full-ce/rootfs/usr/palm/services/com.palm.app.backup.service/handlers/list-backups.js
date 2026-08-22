/* Backup listing and deletion.
 *
 * The stock service had no equivalent: with a cloud target the user never saw
 * individual backups, only "last backup time". A local store is visible and
 * finite, so the app grows a list the user can inspect and prune.
 */
/*global backup, logger, mapFuture, targets, MANIFESTS_PATH */

function ListBackupsAssistant() {

    /**
     * Every backup in the current target, newest first.
     */
    this.run = function (future) {
        var target;

        var chain = targets.getCurrent();
        chain.then(this, function (f) {
            target = f.result;
            f.nest(backup.syncManifests(target));
        });
        chain.then(this, function (f) {
            var result = f.result;
            f.nest(backup.listLocalManifests(false));
        });
        chain.then(this, function (f) {
            var names = f.result;
            names.sort();
            names.reverse();

            var backups = [];
            names.forEach(function (name) {
                var manifest;
                try {
                    manifest = backup.loadManifest(name);
                } catch (err) {
                    logger.warn("Skipping unreadable manifest", name);
                    return;
                }

                var info = backup.parseManifestName(name);
                var deviceInfo = manifest.deviceInfo || {};
                backups.push({
                    manifestName: name,
                    number:       info.number,
                    nduId:        info.nduId,
                    date:         manifest.finished,
                    started:      manifest.started,
                    size:         manifest.size,
                    type:         manifest.type,
                    dbVersion:    manifest.dbVersion,
                    deviceName:   deviceInfo.deviceName,
                    hardwareType: deviceInfo.hardwareType,
                    osVersion:    manifest.osVersion,
                    // Set by restore, not backup - see storeManifest's call
                    // site in handlers/restore.js.
                    restoredCount: manifest.restoredCount || 0,
                    lastRestored:  manifest.lastRestored || null,
                    // Services the backup could not capture in full, so the UI
                    // can mark a partial backup rather than implying it is whole.
                    skipped:      manifest.skipped || [],
                    services:     (manifest.services || []).map(function (service) {
                        return {
                            service: service.service,
                            size:    service.size,
                            files:   (service.files || []).length
                        };
                    })
                });
            });

            f.result = {
                returnValue: true,
                target:      target.id,
                location:    target.getDescription(),
                backups:     backups
            };
        });
        future.nest(chain);
    };
}

function DeleteBackupAssistant() {

    /**
     * Deletes one backup, then purges any stored file it alone referenced.
     *
     * Deleting the manifest first and purging afterwards is what makes this
     * safe with content-addressed storage: a file shared with another backup is
     * still referenced after the delete, so the purge leaves it alone.
     */
    this.run = function (future) {
        var manifestName = this.controller.args.manifestName;
        if (!manifestName) {
            throw new Error("manifestName is required");
        }
        if (!backup.isManifestName(manifestName)) {
            throw new Error("Not a manifest name: " + manifestName);
        }

        var target;
        var purged;

        var chain = targets.getCurrent();
        chain.then(this, function (f) {
            target = f.result;
            f.nest(backup.syncManifests(target));
        });
        chain.then(this, function (f) {
            var result = f.result;
            logger.log("Deleting backup", manifestName);
            f.nest(backup.deleteManifest(target, manifestName));
        });
        chain.then(this, function (f) {
            var result = f.result;
            // keep = -1 would trim nothing; we want the orphan sweep only, and
            // purge treats any positive keep as "trim to that many". Passing a
            // count larger than the remaining manifests leaves them all.
            f.nest(backup.purge(target, 100000));
        });
        chain.then(this, function (f) {
            if (f.exception) {
                logger.warn("Orphan purge incomplete:", f.exception.message);
                purged = { manifests: 0, files: 0 };
            } else {
                purged = f.result;
            }
            f.result = {
                returnValue:  true,
                manifestName: manifestName,
                filesRemoved: purged.files
            };
        });
        future.nest(chain);
    };
}
