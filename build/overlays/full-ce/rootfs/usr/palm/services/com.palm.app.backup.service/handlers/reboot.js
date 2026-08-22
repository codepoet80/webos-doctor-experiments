/*global privileged */

function RebootAssistant() {

    /**
     * Restarts the device via the root helper. Some restored state only
     * takes effect on the next boot - role files among it, see the
     * ensurePrivateBusRole note in device/woce-backupd.js - so RestoringPage's
     * Done button calls this directly rather than leaving the user to
     * remember to do it themselves.
     */
    this.run = function (future) {
        var chain = privileged.isAvailable();
        chain.then(this, function (f) {
            var isPrivileged = f.exception ? false : f.result;
            if (isPrivileged !== true) {
                f.result = { returnValue: false, errorText: "The privileged helper is not available." };
                return;
            }
            f.nest(privileged.reboot());
        });
        future.nest(chain);
    };
}
