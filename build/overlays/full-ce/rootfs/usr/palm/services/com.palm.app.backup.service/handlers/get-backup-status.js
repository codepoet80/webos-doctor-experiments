/*global backup, logger, privileged */

function GetBackupStatusAssistant() {

    // The listener this call registered, so cancelSubscription can take it back
    // off the list. One assistant instance is constructed per command call, so
    // this is per-subscription state and does not need a registry.
    var listener;

    /**
     * Current status, plus a stream of updates when subscribe is true.
     *
     * The status shape is the stock one — { STATUS, percent, type } — because
     * the ported UI switches on exactly those values.
     *
     * `privileged` is ours: it tells the UI whether the root helper is present,
     * so it can say which files a backup will have to skip.
     */
    this.run = function (future, subscription) {
        if (subscription !== undefined) {
            listener = function (status) {
                subscription.get().result = status;
            };
            backup.addStatusListener(listener);
        }

        var current = backup.getStatus();
        var pf = privileged.isAvailable();
        pf.then(this, function (f) {
            var isPrivileged = f.exception ? false : f.result;
            var ret = { returnValue: true, privileged: isPrivileged === true };
            if (current) {
                for (var key in current) {
                    if (current.hasOwnProperty(key)) {
                        ret[key] = current[key];
                    }
                }
            }
            f.result = ret;
        });
        future.nest(pf);
    };

    /**
     * Called by the service framework when the client drops the subscription
     * (controller_command.js: `if (this.assistant.cancelSubscription)`).
     *
     * Without this the listener list only ever grew. backup.clearStatusListeners
     * runs at Complete/Failed, so it looked bounded — but the app re-subscribes
     * from refreshAll on every window activation and again from startBackup, and
     * between two backups those all accumulate, each one pushing status into a
     * subscription nobody is reading.
     */
    this.cancelSubscription = function () {
        if (listener) {
            backup.removeStatusListener(listener);
            listener = undefined;
        }
    };
}
