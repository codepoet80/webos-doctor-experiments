/* Copyright 2011 Palm, Inc. All rights reserved.
 * Copyright 2025 woce-backup contributors.
 *
 * Coordinates the restore flow. A port of the First Use RestoreComponent, which
 * is where restore lived on stock webOS — the Backup app itself could only back
 * up. Bringing it here means a restore no longer requires wiping the device to
 * reach First Use.
 *
 * The auto-restore shortcut is NOT kept. First Use skipped the picker when the
 * target held exactly one backup, which made sense there: the device had just
 * been wiped, and the user was already several screens into a flow whose whole
 * purpose was to restore. Reached from a running device's app menu it meant two
 * taps - "Restore a backup...", and nothing - between a working device and its
 * accounts, contacts and settings being overwritten, with no prompt anywhere.
 * The picker is always shown now, and ChooseBackupPage confirms the choice.
 */

enyo.kind({
    name: "RestoreComponent",
    kind: enyo.VFlexBox,

    // Backups from a newer db8 generation than this device understands cannot
    // be restored; the picker marks them rather than failing halfway through.
    INCOMPATIBLE_VERSION: 300,

    events: {
        onFinish: ""
    },

    components: [
        { name: "pane", kind: "Pane", flex: 1, transitionKind: "enyo.transitions.Fade",
          className: "restore", components: [
            { name: "chooseBackupPage", kind: "ChooseBackupPage",
              onRestore: "startRestore", onCancel: "cancel" },
            { name: "restoringPage", kind: "RestoringPage",
              onFinish: "restoreFinished", onCancel: "cancel" }
        ]},

        { kind: "BackupService", components: [
            { name: "getRestoreDevices", method: "getRestoreDevices",
              onSuccess: "getRestoreDevicesSuccess", onFailure: "getRestoreDevicesFailure" }
        ]}
    ],

    /**
     * Entry point from the app menu: fetch what is available and choose.
     *
     * Guarded on `active`, not on RestoringPage's own awaitingResponse: that
     * flag clears on the *first* progress tick, seconds into a restore that
     * is still running, so it cannot stop a second, well-separated entry into
     * this flow - confirmed on-device, two restore calls for the same
     * manifest 7s apart, both accepted and racing for the
     * com.palm.backup.privileged bus identity. `active` only clears on a
     * genuine finish or cancel, so a redundant start()/startWithManifest()
     * while one is already running is simply ignored, however it happens to
     * be triggered.
     */
    start: function () {
        if (this.active) {
            return;
        }
        this.active = true;
        this.$.restoringPage.reset();
        this.$.pane.selectViewByName("chooseBackupPage");
        this.$.chooseBackupPage.setLoading(true);
        this.$.getRestoreDevices.call({});
    },

    /**
     * Entry point from the backup list, where the user already picked.
     */
    startWithManifest: function (manifestName) {
        if (this.active) {
            return;
        }
        this.active = true;
        this.$.restoringPage.reset();
        this.$.pane.selectViewByName("restoringPage");
        this.$.restoringPage.startRestore({ manifestName: manifestName });
    },

    getRestoreDevicesSuccess: function (inSender, inResponse) {
        this.$.chooseBackupPage.setLoading(false);

        var devices = this.getDevicesWithBackups(inResponse.devices || []);
        if (devices.length === 0) {
            this.$.chooseBackupPage.setDevices({ date: null, devices: [], location: inResponse.location });
            return;
        }

        this.$.chooseBackupPage.setInCompatibleVersion(this.INCOMPATIBLE_VERSION);
        this.$.chooseBackupPage.setDevices({
            date:     inResponse.date,
            location: inResponse.location,
            devices:  devices
        });
    },

    getRestoreDevicesFailure: function (inSender, inResponse) {
        this.error("getRestoreDevices failed", inResponse);
        this.$.chooseBackupPage.setLoading(false);
        this.$.chooseBackupPage.showError(inResponse && inResponse.errorText);
    },

    /**
     * Devices that actually hold a backup, this one first and the rest by name.
     */
    getDevicesWithBackups: function (devices) {
        var withBackups = devices.filter(function (device) {
            return device.backups && device.backups.length > 0;
        });

        withBackups.sort(function (a, b) {
            if (a.currentDevice && !b.currentDevice) { return -1; }
            if (b.currentDevice && !a.currentDevice) { return 1; }
            var aName = (a.deviceName || "").toLowerCase();
            var bName = (b.deviceName || "").toLowerCase();
            if (aName < bName) { return -1; }
            if (aName > bName) { return 1; }
            return 0;
        });

        return withBackups;
    },

    /**
     * Reached from ChooseBackupPage's confirm dialog, only after start() has
     * already set `active`. Not separately guarded on `active` - a double-tap
     * on the confirm button is a genuine rapid re-invocation of this one call,
     * which is exactly what RestoringPage.startRestore's own awaitingResponse
     * guard is for.
     */
    startRestore: function (inSender, backup) {
        this.$.pane.selectViewByName("restoringPage");
        this.$.restoringPage.startRestore({ manifestName: backup.manifestName });
    },

    restoreFinished: function () {
        this.active = false;
        this.doFinish();
    },

    cancel: function () {
        this.active = false;
        this.doFinish();
    }
});
