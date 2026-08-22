/*global backup, logger */

function CancelBackupAssistant() {

    // Cancels the running backup. The engine notices at its next progress
    // checkpoint and unwinds; it does not abort mid-file.
    this.run = function (future) {
        logger.log("Inside cancelBackup");
        backup.cancel();
        future.result = { returnValue: true };
    };
}
