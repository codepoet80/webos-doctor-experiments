/*global backup, logger, prefs, targets */

function GetLastBackupTimeAssistant() {

    /**
     * Time of the newest backup made by this device, or "." when there is none.
     *
     * The "." sentinel and the millisecond return are the stock contract — the
     * ported UI tests for it directly.
     */
    this.run = function (future) {
        var enabled;

        var chain = prefs.isEnabled();
        chain.then(this, function (f) {
            enabled = f.result;
            f.nest(targets.getCurrent());
        });
        chain.then(this, function (f) {
            var target = f.result;
            // Sync first: the newest manifest may have been written by another
            // device into a shared target, or removed behind our back.
            f.nest(backup.syncManifests(target));
        });
        chain.then(this, function (f) {
            var result = f.result;
            f.nest(backup.listLocalManifests(true));
        });
        chain.then(this, function (f) {
            var manifests = f.result;
            var time = ".";

            if (manifests.length > 0) {
                manifests.sort();
                try {
                    var manifest = backup.loadManifest(manifests[manifests.length - 1]);
                    if (manifest.finished) {
                        time = Date.parse(manifest.finished);
                    }
                } catch (err) {
                    logger.warn("Unable to read the newest manifest:", err.message);
                }
            }

            f.result = {
                returnValue:    true,
                lastbackupTime: time,
                optOut:         !enabled
            };
        });
        future.nest(chain);
    };
}
