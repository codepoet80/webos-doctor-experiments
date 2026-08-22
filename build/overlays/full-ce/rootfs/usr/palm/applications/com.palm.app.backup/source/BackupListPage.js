/* Copyright 2025 woce-backup contributors.
 *
 * The stored-backup list. No stock equivalent: with a cloud destination the
 * user never saw individual backups, only a "last backup" timestamp. A local
 * store is finite and visible, so it gets a screen where backups can be
 * inspected, restored, or deleted to reclaim space.
 *
 * enyo.VirtualList has no setCount — it is buffer-driven, and the row count is
 * discovered by onSetupRow returning false past the end of the data. After the
 * data changes, punt() flushes the buffer and re-renders; refresh() alone will
 * happily keep showing rows that no longer exist. This is the same wiring the
 * stock First Use ChooseBackupPage used.
 */

enyo.kind({
    name: "BackupListPage",
    kind: enyo.VFlexBox,

    events: {
        onRestore: "",
        onDone: ""
    },

    components: [
        { name: "locationLabel", className: "list-location", content: "" },

        // A common flex: 1 wrapper, always showing, around emptyLabel/list -
        // same reason as ChooseBackupPage's "content": list alone has
        // showing: false while there are no backups, and a flex: 1 control
        // that isn't showing claims none of the layout's flex space, which is
        // what pins the Toolbar below to the actual bottom of the screen.
        { name: "content", kind: "VFlexBox", flex: 1, components: [
            { name: "emptyLabel", className: "list-empty", showing: false,
              content: $L("No backups yet. Tap Back Up Now to make one.") },

            { name: "list", kind: "VirtualList", flex: 1, onSetupRow: "setupRow",
              components: [
                { name: "item", kind: "SwipeableItem", layoutKind: "HFlexLayout",
                  align: "center", tapHighlight: true,
                  onConfirm: "deleteRow", onclick: "rowClicked", components: [
                    { kind: "Control", flex: 1, components: [
                        { name: "date", className: "backup-date" },
                        { name: "detail", className: "backup-detail" }
                    ]},
                    { name: "size", className: "backup-size" }
                ]}
            ]}
        ]},

        { kind: "Toolbar", className: "enyo-toolbar-light", components: [
            { kind: "Button", className: "enyo-button-affirmative", style: "width: 300px;",
              caption: $L("Done"), onclick: "doneClick" }
        ]},

        { name: "restoreDialog", kind: "ModalDialog", lazy: true, className: "popup",
          caption: $L("Restore this backup?"), components: [
            { name: "restoreMessage", className: "enyo-text-body", content: "" },
            { layoutKind: "HFlexLayout", pack: "center", components: [
                { kind: "Button", caption: $L("Cancel"), flex: 1,
                  onclick: "closeRestoreDialog", style: "margin-right: 10px" },
                { kind: "Button", caption: $L("Restore"), flex: 1,
                  className: "enyo-button-affirmative", onclick: "confirmRestore" }
            ]},
            { kind: "Button", caption: $L("Delete This Backup"), onclick: "deleteFromDialog",
              style: "margin-top: 10px;" }
        ]},

        // A second, focused dialog rather than a third button crammed into
        // restoreDialog's row: same two-step shape as BackupInfo's
        // optOutDialog for the other data-erasing action in this app. Message
        // is filled in per-backup by deleteFromDialog before this opens.
        { name: "deleteDialog", lazy: true, kind: "DialogPrompt", className: "box-center",
          title: $L("Delete this backup?"),
          dismissWithClick: false,
          acceptButtonCaption: $L("Delete"),
          cancelButtonCaption: $L("Cancel"),
          onAccept: "confirmDelete"
        },

        { name: "errorDialog", className: "box-center", kind: "enyo.DialogPrompt",
          title: $L("Couldn't delete"),
          message: $L("That backup could not be deleted."),
          acceptButtonCaption: $L("OK"),
          cancelButtonCaption: ""
        },

        { kind: "BackupService", components: [
            { name: "deleteBackup", method: "deleteBackup",
              onSuccess: "deleteSuccess", onFailure: "deleteFailure" }
        ]}
    ],

    create: function () {
        this.inherited(arguments);
        this.backups = [];
        // DialogPrompt validates its own components from create(), unlike
        // ModalDialog - safe to reach into $.acceptButton immediately, same
        // as BackupInfo's optOutDialog already does.
        this.$.deleteDialog.$.acceptButton.addClass("enyo-button-negative");
    },

    doneClick: function () {
        this.doDone();
    },

    setBackups: function (backups, location) {
        this.backups = backups || [];
        if (location) {
            this.$.locationLabel.setContent(
                enyo.macroize($L("Stored in {$location}"), { location: location }));
        }
        this.refresh();
    },

    refresh: function () {
        this.$.emptyLabel.setShowing(this.backups.length === 0);
        this.$.list.setShowing(this.backups.length > 0);
        if (this.backups.length > 0) {
            // punt() rather than refresh(): the row count may have shrunk, and
            // only a buffer flush drops rows that no longer have data.
            this.$.list.punt();
        }
    },

    setupRow: function (inSender, inIndex) {
        var backup = this.backups[inIndex];
        if (!backup) {
            return false;   // signals the end of the data to the buffer
        }

        this.$.date.setContent(this.formatDate(backup.date));

        var parts = [];
        if (backup.deviceName) {
            parts.push(backup.deviceName);
        }
        parts.push(backup.type === "full" ? $L("Full") : $L("Incremental"));
        if (backup.skipped && backup.skipped.length > 0) {
            parts.push(enyo.macroize($L("{$count} skipped"), { count: backup.skipped.length }));
        }
        if (backup.restoredCount > 0) {
            parts.push(enyo.macroize($L("Restored on {$date}"),
                { date: this.formatDate(backup.lastRestored) }));
        }
        this.$.detail.setContent(parts.join(" · "));
        this.$.size.setContent(this.formatSize(backup.size));
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
        var backup = this.backups[inEvent.rowIndex];
        if (!backup) {
            return;
        }

        this.pendingRestore = backup.manifestName;
        // restoreDialog is lazy: true, so restoreMessage does not exist until
        // openAtCenter's own prepareOpen() calls validateComponents() - which
        // happens too late for a setContent() that runs before openAtCenter().
        // Force it explicitly first, same as enyo's own showSpinner idiom.
        this.$.restoreDialog.validateComponents();
        this.$.restoreMessage.setContent(enyo.macroize(
            $L("Replace the data on this device with the backup from {$date}? Your current accounts, contacts and settings will be overwritten."),
            { date: this.formatDate(backup.date) }));
        this.$.restoreDialog.openAtCenter();
    },

    confirmRestore: function () {
        this.$.restoreDialog.close();
        this.doRestore(this.pendingRestore);
    },

    closeRestoreDialog: function () {
        this.pendingRestore = null;
        this.$.restoreDialog.close();
    },

    /**
     * The escape hatch from restoreDialog. Tracks the target by manifestName
     * (pendingRestore, already set by rowClicked), not by row index: two full
     * dialogs is enough time for a scheduled backup to land and shift every
     * index below it, and finding the row fresh by its stable id when it's
     * actually needed - here and in performDelete - is what keeps that from
     * ever deleting the wrong one.
     */
    deleteFromDialog: function () {
        this.$.restoreDialog.close();
        var backup = this.findByManifestName(this.pendingRestore);
        if (!backup) {
            return;
        }
        this.$.deleteDialog.open(null, enyo.macroize(
            $L("Permanently delete the backup from {$date}? This cannot be undone."),
            { date: this.formatDate(backup.date) }));
    },

    confirmDelete: function () {
        this.performDelete(this.pendingRestore);
    },

    findByManifestName: function (manifestName) {
        for (var i = 0; i < this.backups.length; i++) {
            if (this.backups[i].manifestName === manifestName) {
                return this.backups[i];
            }
        }
        return null;
    },

    // SwipeableItem's onConfirm passes the row index directly as the second
    // argument — unlike onclick, which passes an event carrying rowIndex.
    // SwipeableItem shows its own built-in Delete/Cancel prompt before
    // firing onConfirm, so this path is already confirmed by the time it
    // reaches here, same as confirmDelete is after deleteDialog's Delete.
    deleteRow: function (inSender, inIndex) {
        var backup = this.backups[inIndex];
        if (!backup) {
            return;
        }
        this.performDelete(backup.manifestName);
    },

    performDelete: function (manifestName) {
        var index = -1;
        for (var i = 0; i < this.backups.length; i++) {
            if (this.backups[i].manifestName === manifestName) {
                index = i;
                break;
            }
        }
        if (index === -1) {
            return;
        }

        // Drop it from the model straight away so the row does not spring back
        // while the service works; a failure puts it back.
        var backup = this.backups[index];
        this.removedIndex = index;
        this.removed = backup;
        this.backups.splice(index, 1);
        this.refresh();

        this.$.deleteBackup.call({ manifestName: backup.manifestName });
    },

    deleteSuccess: function () {
        this.removed = null;
    },

    deleteFailure: function (inSender, inResponse) {
        this.error("Unable to delete backup", inResponse);
        if (this.removed) {
            this.backups.splice(this.removedIndex, 0, this.removed);
            this.removed = null;
            this.refresh();
        }
        // The row springing back on its own reads as a UI glitch rather than a
        // failure, and the user has no other way to find out the delete did not
        // happen.
        if (inResponse && inResponse.errorText) {
            this.$.errorDialog.setMessage(inResponse.errorText);
        }
        this.$.errorDialog.open();
    }
});
