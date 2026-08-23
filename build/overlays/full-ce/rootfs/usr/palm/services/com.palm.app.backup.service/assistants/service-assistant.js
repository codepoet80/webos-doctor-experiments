/* Top-level service assistant.
 *
 * Lives for the whole service process, so anything that must survive between
 * commands within one activation belongs here. Backup state itself lives in
 * util/backup-service.js because an in-flight backup outlives the command
 * assistant that started it.
 */
/*global logger, fileUtil, WORK_ROOT, MANIFEST_ROOT, JOB_ROOT, STAGE_ROOT */

// Rewritten by build.sh on every build. Logged at startup so the device
// log says which code is actually running — a reinstall does not restart a
// live node service, so it is easy to spend an evening debugging the
// previous build.
var SERVICE_BUILD = "3.1.0+20260822-213315";

function ServiceAssistant() {
}

ServiceAssistant.prototype.setup = function () {
    logger.log("woce-backup service starting, build", SERVICE_BUILD);

    // Create the working tree up front. Every later path assumes it exists, and
    // doing it once here keeps the mkdirs out of the hot paths.
    var future = fileUtil.mkdirs(MANIFEST_ROOT);
    future.then(this, function (f) {
        var result = f.result;
        f.nest(fileUtil.mkdirs(JOB_ROOT));
    });
    future.then(this, function (f) {
        var result = f.result;
        f.nest(fileUtil.mkdirs(STAGE_ROOT));
    });
    future.then(this, function (f) {
        if (f.exception) {
            logger.error("Unable to create the working tree:", f.exception.message);
        }
        f.result = true;
    });
    return future;
};

ServiceAssistant.prototype.cleanup = function () {
    logger.log("woce-backup service shutting down");
};
