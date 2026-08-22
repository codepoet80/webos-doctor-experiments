/* Copyright 2011 Palm, Inc. All rights reserved.
 * Copyright 2025 woce-backup contributors.
 *
 * The restore picker. A port of the First Use ChooseBackupPage.
 *
 * Stock listed one backup per device, because the cloud kept only the newest
 * usable one. A local target keeps several, so devices and their backups are
 * flattened into a single row list — each row is one restorable backup, tagged
 * with the device that made it. That also keeps this on the same VirtualList
 * wiring stock used, rather than building nested RowGroups at runtime.
 *
 * The "Copy Everything / Applications Only" pair from First Use is gone: it
 * chose whether to re-download apps from the App Catalog, which no longer
 * exists.
 */

enyo.kind({
    name: "ChooseBackupPage",
    kind: enyo.VFlexBox,

    published: {
        devices: null,
        inCompatibleVersion: 300,
        loading: false
    },

    events: {
        onRestore: "",
        onCancel: ""
    },

    components: [
        { className: "title", content: $L("Choose a backup") },
        { name: "subtitle", className: "subtitle box-center",
          content: $L("Select the backup to copy onto this device.") },

        // A common flex: 1 wrapper, always showing, around the three states
        // (loading/empty/list) is what pins the Toolbar below to the actual
        // bottom of the screen: each of the three has showing: false at some
        // point, and a flex: 1 control that isn't showing claims none of that
        // space, so without something else always flexed here the toolbar
        // would settle wherever the currently-visible content happens to end.
        { name: "content", kind: "VFlexBox", flex: 1, components: [
            { name: "spinner", kind: "SpinnerLarge", showing: false, style: "margin: 40px auto;" },

            { name: "emptyLabel", className: "list-empty", showing: false,
              content: $L("There are no backups to restore.") },

            { name: "list", kind: "VirtualList", flex: 1, showing: false,
              onSetupRow: "setupRow", components: [
                { name: "item", kind: "Item", layoutKind: "HFlexLayout", align: "center",
                  tapHighlight: true, onclick: "rowClicked", components: [
                    { kind: "Control", flex: 1, components: [
                        { name: "deviceName", className: "backup-date" },
                        { name: "detail", className: "backup-detail" }
                    ]},
                    { name: "deviceImage", kind: "Image", className: "device-image",
                      onerror: "imageError" }
                ]}
            ]}
        ]},

        { name: "incompatibleDialog", kind: "ModalDialog", lazy: true, className: "popup",
          caption: $L("Cannot Restore"), components: [
            { className: "enyo-text-body",
              content: $L("This backup was made by a newer version of webOS than this device is running, so it can't be restored here.") },
            { kind: "Button", caption: $L("OK"), onclick: "closeIncompatible",
              style: "margin-bottom: 10px" }
        ]},

        { name: "errorDialog", kind: "ModalDialog", lazy: true, className: "popup",
          caption: $L("Can't read backups"), components: [
            { name: "errorMessage", className: "enyo-text-body", content: "" },
            { kind: "Button", caption: $L("OK"), onclick: "closeError",
              style: "margin-bottom: 10px" }
        ]},

        // Restoring overwrites the accounts, contacts and settings on this
        // device, and until this dialog existed nothing in the restore flow
        // asked first: tapping a row started it outright, and with exactly one
        // backup in the target the picker was skipped entirely, so "Restore a
        // backup..." from the app menu was two taps from an irreversible
        // overwrite. BackupListPage has always confirmed; this is the same
        // dialog for the other way in.
        { name: "confirmDialog", kind: "ModalDialog", lazy: true, className: "popup",
          caption: $L("Restore this backup?"), components: [
            { name: "confirmMessage", className: "enyo-text-body", content: "" },
            { layoutKind: "HFlexLayout", pack: "center", components: [
                { kind: "Button", caption: $L("Cancel"), flex: 1,
                  onclick: "closeConfirm", style: "margin-right: 10px" },
                { kind: "Button", caption: $L("Restore"), flex: 1,
                  className: "enyo-button-affirmative", onclick: "confirmRestore" }
            ]}
        ]},

        // Same Toolbar/enyo-toolbar-light/enyo-button-dark shape system apps
        // use for a page-level bottom bar - e.g. Date & Time's timezone
        // picker (DateAndTimePrefTimezone.js) - rather than a plain
        // HFlexLayout row.
        { kind: "Toolbar", className: "enyo-toolbar-light", components: [
            { name: "cancelButton", kind: "Button", className: "enyo-button-dark",
              style: "width: 300px;", caption: $L("Cancel"), onclick: "doCancel" }
        ]}
    ],

    create: function () {
        this.inherited(arguments);
        this.rows = [];
        this.pendingRestore = null;
    },

    loadingChanged: function () {
        this.$.spinner.setShowing(this.loading);
        if (this.loading) {
            this.$.emptyLabel.setShowing(false);
            this.$.list.setShowing(false);
        }
    },

    devicesChanged: function () {
        var data = this.devices || { devices: [] };
        var devices = data.devices || [];

        if (data.location) {
            this.$.subtitle.setContent(enyo.macroize(
                $L("Backups in {$location}."), { location: data.location }));
        }

        // One row per backup, carrying its device's identity.
        this.rows = [];
        var self = this;
        devices.forEach(function (device) {
            var name = device.deviceName || $L("webOS device");
            if (device.currentDevice) {
                name = enyo.macroize($L("{$name} (this device)"), { name: name });
            }
            device.backups.forEach(function (backup) {
                self.rows.push({
                    deviceName:   name,
                    deviceImage:  device.deviceImageUrl,
                    manifestName: backup.manifestName,
                    date:         backup.date,
                    size:         backup.size,
                    type:         backup.type,
                    skipped:      backup.skipped,
                    incompatible: backup.dbVersion >= self.inCompatibleVersion
                });
            });
        });

        this.$.emptyLabel.setShowing(this.rows.length === 0);
        this.$.list.setShowing(this.rows.length > 0);
        if (this.rows.length > 0) {
            this.$.list.punt();
        }
    },

    setupRow: function (inSender, inIndex) {
        var row = this.rows[inIndex];
        if (!row) {
            return false;
        }

        this.$.deviceName.setContent(row.deviceName);

        var detail = [this.formatDate(row.date)];
        detail.push(row.type === "full" ? $L("Full") : $L("Incremental"));
        if (row.size) {
            detail.push(this.formatSize(row.size));
        }
        if (row.skipped > 0) {
            detail.push(enyo.macroize($L("{$count} skipped"), { count: row.skipped }));
        }
        this.$.detail.setContent(detail.join(" · "));

        // Device art is bundled; a backup from hardware we have no image for is
        // still perfectly restorable.
        this.$.deviceImage.setShowing(!!row.deviceImage);
        if (row.deviceImage) {
            this.$.deviceImage.setSrc(row.deviceImage);
        }
        return true;
    },

    formatDate: function (dateString) {
        if (!dateString) {
            return $L("Unknown date");
        }
        var value = Date.parse(dateString);
        if (isNaN(value)) {
            return dateString;
        }
        var formatter = new enyo.g11n.DateFmt({ date: "long", time: "short" });
        return formatter.format(new Date(value));
    },

    formatSize: function (bytes) {
        if (!bytes) {
            return "";
        }
        var units = ["B", "KB", "MB", "GB"];
        var value = bytes;
        var unit = 0;
        while (value >= 1024 && unit < units.length - 1) {
            value = value / 1024;
            unit++;
        }
        return (unit === 0 ? value : value.toFixed(unit > 1 ? 1 : 0)) + " " + units[unit];
    },

    rowClicked: function (inSender, inEvent) {
        var row = this.rows[inEvent.rowIndex];
        if (!row) {
            return;
        }
        if (row.incompatible) {
            this.$.incompatibleDialog.openAtCenter();
            return;
        }

        this.pendingRestore = row.manifestName;
        // confirmDialog is lazy: true, so confirmMessage does not exist until
        // openAtCenter's own prepareOpen() calls validateComponents() - too late
        // for a setContent() that runs before it. Same idiom as
        // BackupListPage.rowClicked.
        this.$.confirmDialog.validateComponents();
        this.$.confirmMessage.setContent(enyo.macroize(
            $L("Replace the data on this device with the backup from {$date}? Your current accounts, contacts and settings will be overwritten."),
            { date: this.formatDate(row.date) }));
        this.$.confirmDialog.openAtCenter();
    },

    confirmRestore: function () {
        var manifestName = this.pendingRestore;
        this.pendingRestore = null;
        this.$.confirmDialog.close();
        if (manifestName) {
            this.doRestore({ manifestName: manifestName });
        }
    },

    closeConfirm: function () {
        this.pendingRestore = null;
        this.$.confirmDialog.close();
    },

    imageError: function (inSender) {
        inSender.hide();
    },

    showError: function (message) {
        // errorDialog is lazy: true; see the identical fix and comment in
        // BackupListPage.js's rowClicked for why validateComponents() has to
        // run before errorMessage exists.
        this.$.errorDialog.validateComponents();
        this.$.errorMessage.setContent(message || $L("The backup destination could not be read."));
        this.$.errorDialog.openAtCenter();
    },

    closeIncompatible: function () {
        this.$.incompatibleDialog.close();
    },

    closeError: function () {
        this.$.errorDialog.close();
    }
});
