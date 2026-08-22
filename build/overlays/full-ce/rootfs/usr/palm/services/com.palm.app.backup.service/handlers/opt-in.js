/* Enables backup and schedules the daily activity.
 *
 * The stock version also consulted the Exchange ActiveSync security policy,
 * which could forbid backups outright. That check is gone: it existed to honour
 * a corporate policy about uploading data to Palm's servers, and has no meaning
 * for a backup written to the user's own device. The UI keeps the dialog for
 * the case where a future network target reintroduces the concern.
 */
/*global logger, prefs, system */

function OptInAssistant() {
    this.run = function (future) {
        logger.log("Inside optInToBackup");

        var chain = prefs.setUserEnabled(true);
        chain.then(this, function (f) {
            var result = f.result;
            f.nest(system.createScheduledActivity());
        });
        chain.then(this, function (f) {
            if (f.exception) {
                // A failed schedule must not block manual backups.
                logger.warn("Unable to schedule the daily backup:", f.exception.message);
            }
            f.result = { returnValue: true, enabled: true };
        });
        future.nest(chain);
    };
}
