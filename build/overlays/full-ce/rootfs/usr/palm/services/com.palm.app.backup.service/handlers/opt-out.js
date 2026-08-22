/* Disables backup and erases what has been stored.
 *
 * "Turn Off and Erase" in the UI means exactly that, matching the stock
 * warning text: the stored backups go away. purge(target, 0) drops every
 * manifest and then every file no surviving manifest references.
 */
/*global backup, logger, prefs, system, targets */

function OptOutAssistant() {
    this.run = function (future) {
        logger.log("Inside optOutOfBackup");
        var purged;

        var chain = targets.getCurrent();
        chain.then(this, function (f) {
            var target = f.result;
            var work = backup.syncManifests(target);
            work.then(this, function (wf) {
                var result = wf.result;
                wf.nest(backup.purge(target, 0));
            });
            f.nest(work);
        });
        chain.then(this, function (f) {
            if (f.exception) {
                // Report the erase failure but still turn backup off — leaving
                // it enabled after the user said no is the worse outcome.
                logger.error("Unable to erase backups:", f.exception.message);
                purged = null;
            } else {
                purged = f.result;
            }
            f.nest(prefs.setUserEnabled(false));
        });
        chain.then(this, function (f) {
            var result = f.result;
            f.nest(system.cancelScheduledActivity());
        });
        chain.then(this, function (f) {
            if (f.exception) {
                // Cancelling the schedule is best-effort; backup is already
                // off, which is what the user asked for.
                logger.warn("Unable to cancel the scheduled backup:", f.exception.message);
            }
            f.result = {
                returnValue: true,
                erased:      purged !== null,
                manifests:   purged ? purged.manifests : 0,
                files:       purged ? purged.files : 0
            };
        });
        future.nest(chain);
    };
}
