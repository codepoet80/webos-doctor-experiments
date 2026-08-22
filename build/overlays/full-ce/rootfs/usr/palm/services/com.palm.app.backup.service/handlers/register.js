/* Dynamic registration, so a third-party app can join backup without shipping
 * a file into /etc/palm/backup (which it could not write anyway).
 *
 * The descriptor is the same shape as a static registration file: the names of
 * the methods we should call on the registering service.
 */
/*global backup, logger */

function RegisterAssistant() {
    this.run = function (future) {
        var args = this.controller.args;
        var service = args.service;
        if (!service) {
            throw new Error("service is required");
        }

        var serviceDescriptor = {
            preBackup:       args.preBackup,
            postBackup:      args.postBackup,
            preRestore:      args.preRestore,
            postRestore:     args.postRestore,
            restoreFinished: args.restoreFinished
        };

        logger.log("Registering", service, "with", serviceDescriptor);
        var reg = backup.putDynamicService(service, serviceDescriptor);
        reg.then(this, function (f) {
            var result = f.result;
            f.result = { returnValue: true };
        });
        future.nest(reg);
    };
}

function UnregisterAssistant() {
    this.run = function (future) {
        var service = this.controller.args.service;
        if (!service) {
            throw new Error("service is required");
        }

        logger.log("Unregistering", service);
        var del = backup.delDynamicServices([service]);
        del.then(this, function (f) {
            if (f.exception) {
                // Unregistering something that was never registered is a no-op,
                // not a failure.
                logger.log("Nothing to unregister for", service);
            }
            f.result = { returnValue: true };
        });
        future.nest(del);
    };
}
