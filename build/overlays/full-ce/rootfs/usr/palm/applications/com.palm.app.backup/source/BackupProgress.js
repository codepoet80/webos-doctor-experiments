/* Copyright 2011 Palm, Inc. All rights reserved.
 * Copyright 2025 woce-backup contributors.
 *
 * The "Back Up Now" button, which doubles as the progress bar during a run.
 * A close port of the stock BackupProgress.js: same strings, same
 * ProgressButton behavior, same spinner and cancel affordance.
 */

label_progress_backup_now      = $L("Back Up Now");
label_progress_backing_now     = $L("Backing up...");
// Shown while the service names what it is on; {$name} is an app title.
label_progress_backing_app     = $L("Backing up {$name}...");
label_progress_backup_complete = $L("Backup complete");
label_progress_backup_failed   = $L("Backup failed");
label_progress_preparing       = $L("Preparing...");
label_progress_opting_out      = $L("Turning Backup off");
label_progress_suspend         = $L("Cancelling... ");
label_progress_suspend_complete = $L("Cancel Completed");

enyo.kind({
    name: "BackupProgressButton",
    kind: enyo.ProgressButton,

    published: {
        labelValue: label_progress_backup_now
    },

    components: [
        { layoutKind: "HFlexLayout", components: [
            { name: "pbcontent", content: label_progress_backup_now, style: "padding-right: 10px" },
            { kind: "Spinner", lazy: true, name: "pbspinner" }
        ]}
    ],

    create: function () {
        this.inherited(arguments);
        // Full bar with the cancel button hidden is the resting state: the
        // control reads as an ordinary button until a backup actually starts.
        this.setPosition(100);
        this.hideButton();
        this.hideSpinner();
    },

    labelValueChanged: function () {
        this.$.pbcontent.setContent(this.labelValue);
    },

    hideButton: function () {
        this.$.cancelButton.hide();
    },

    showButton: function () {
        this.$.cancelButton.show();
    },

    showSpinner: function () {
        this.$.pbspinner.show();
    },

    hideSpinner: function () {
        this.$.pbspinner.hide();
    }
});
