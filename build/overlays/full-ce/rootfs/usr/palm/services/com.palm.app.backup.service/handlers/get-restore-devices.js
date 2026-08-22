/* The device list behind the restore picker.
 *
 * Ported from com.palm.service.backup/handlers/get-restore-devices.js and kept
 * to the same response shape, because the picker UI is a port of First Use's
 * ChooseBackupPage and reads exactly these fields:
 *
 *     {
 *       date: <newest backup date>,
 *       autoRestore: <true when there is exactly one candidate>,
 *       devices: [{
 *         nduId, deviceId, currentDevice, deviceName, hardwareType,
 *         deviceImageUrl, osVersion,
 *         backups: [{ manifestName, date, size, dbVersion }]
 *       }]
 *     }
 *
 * The stock version merged this list with a server call that knew about devices
 * with no backup yet. There is no server, so the list is exactly what the
 * target holds — which is the more honest answer anyway.
 *
 * One real difference: stock reported at most one backup per device, since the
 * cloud only kept the newest usable one. A local target keeps several, so every
 * manifest is listed, newest first, and the user picks.
 */
/*global backup, logger, system, targets */

function GetRestoreDevicesAssistant() {

    // Bundled with the app rather than fetched, so the picker still renders
    // device art with no network.
    var IMAGE_ROOT = "images/devices/";

    var KNOWN_HARDWARE = {
        castle:     "Palm Pre",
        castleplus: "Palm Pre Plus",
        pixie:      "Palm Pixi",
        pixieplus:  "Palm Pixi Plus",
        roadrunner: "Palm Pre 2",
        broadway:   "HP Veer",
        mantaray:   "HP Pre3",
        topaz:      "HP TouchPad",
        opal:       "HP TouchPad Go"
    };

    var getImageUrl = function (hardwareType) {
        return hardwareType ? IMAGE_ROOT + hardwareType + ".png" : undefined;
    };

    var getDefaultDeviceName = function (hardwareType) {
        return KNOWN_HARDWARE[hardwareType] || "webOS device";
    };

    this.run = function (future) {
        var myNduId;
        var target;
        var newestDate = null;

        var chain = targets.getCurrent();
        chain.then(this, function (f) {
            target = f.result;
            f.nest(target.isAvailable());
        });
        chain.then(this, function (f) {
            var available = f.result;
            if (!available) {
                throw new Error("Backup destination is unavailable: " + target.getDescription());
            }
            f.nest(system.getNduId());
        });
        chain.then(this, function (f) {
            myNduId = f.exception ? null : f.result;
            f.nest(backup.syncManifests(target));
        });
        chain.then(this, function (f) {
            var result = f.result;
            f.nest(backup.listLocalManifests(false));
        });
        chain.then(this, function (f) {
            var names = f.result;
            names.sort();

            // Group manifests by the device that wrote them.
            var deviceMap = {};
            for (var i = names.length - 1; i >= 0; i--) {
                var name = names[i];
                var manifest;
                try {
                    manifest = backup.loadManifest(name);
                } catch (err) {
                    logger.warn("Skipping unreadable manifest", name);
                    continue;
                }
                // A zero-size manifest means the backup produced nothing;
                // offering it would only waste the user's time.
                if (!manifest.size || manifest.size <= 0) {
                    continue;
                }

                var info = backup.parseManifestName(name);
                var deviceInfo = manifest.deviceInfo || {};
                var nduId = deviceInfo.nduId || info.nduId;

                if (!deviceMap[nduId]) {
                    deviceMap[nduId] = {
                        nduId:          nduId,
                        deviceId:       manifest.deviceId,
                        currentDevice:  myNduId === nduId,
                        deviceName:     deviceInfo.deviceName || getDefaultDeviceName(deviceInfo.hardwareType),
                        hardwareType:   deviceInfo.hardwareType,
                        deviceImageUrl: getImageUrl(deviceInfo.hardwareType),
                        osVersion:      manifest.osVersion,
                        backups:        []
                    };
                }

                deviceMap[nduId].backups.push({
                    manifestName: name,
                    date:         manifest.finished,
                    size:         manifest.size,
                    dbVersion:    manifest.dbVersion,
                    type:         manifest.type,
                    skipped:      (manifest.skipped || []).length,
                    packages:     (manifest.packages || []).length
                });

                if (!newestDate && manifest.finished) {
                    newestDate = manifest.finished;
                }
            }

            var devices = [];
            var totalBackups = 0;
            for (var id in deviceMap) {
                if (deviceMap.hasOwnProperty(id)) {
                    devices.push(deviceMap[id]);
                    totalBackups += deviceMap[id].backups.length;
                }
            }

            // This device first, then alphabetically — the ordering the picker
            // expects, so the most likely choice is already at the top.
            devices.sort(function (a, b) {
                if (a.currentDevice && !b.currentDevice) { return -1; }
                if (b.currentDevice && !a.currentDevice) { return 1; }
                var aName = (a.deviceName || "").toLowerCase();
                var bName = (b.deviceName || "").toLowerCase();
                if (aName < bName) { return -1; }
                if (aName > bName) { return 1; }
                return 0;
            });

            f.result = {
                returnValue: true,
                date:        newestDate,
                location:    target.getDescription(),
                // Only auto-restore when the choice is unambiguous.
                autoRestore: totalBackups === 1,
                devices:     devices
            };
        });
        future.nest(chain);
    };
}
