/* Copyright 2011 Palm, Inc. All rights reserved.
 * Copyright 2025 woce-backup contributors.
 *
 * The main panel: the Backup on/off toggle, the explanatory text, and the
 * summary rows. A port of the stock BackupInfo.js, with the info text rewritten
 * for a local destination and three rows added below it (destination, manage
 * backups, what to back up) that the stock app had no need for.
 */

label_info_optIn = $L("Your accounts, contacts, calendar, settings and application data are backed up to this device once a day, and whenever you tap Back Up Now.<br><br>Backups are stored on your device where you can copy them off over USB. They are not encrypted, so they can be restored after a webOS Doctor or onto a different device.");
label_info_optOut = $L("Turn Backup on to start backing up your data.");

label_info_lastbackup  = $L("Last backup");
label_info_destination = $L("Back up to");
label_info_manage      = $L("Manage backups");
label_info_whatToBackUp = $L("What to back up");
label_backup = $L("Backup");
label_on  = $L("ON");
label_off = $L("OFF");

label_limited_title = $L("Limited backup");
label_limited_text  = $L("Some system files can't be read without the privileged helper, so they will be left out of your backups. Install this app with Preware or WebOS Quick Install and reboot to enable full backups.");

// The opt-out dialog belongs to this component, so its strings live here.
// The stock app declared them in BackupApp.js and got away with it only because
// its depends.js loaded BackupApp.js first; a kind's `components` array is
// evaluated at definition time, so anything it names must already exist.
label_dialog_title   = $L("Turn Backup Off?");
label_dialog_message = $L("If you turn off Backup, your device will no longer back up your data and your current backups will be erased.");
label_dialog_off     = $L("Turn Off and Erase");
label_dialog_on      = $L("Keep Backup On");

enyo.kind({
    name: "BackupInfo",
    kind: enyo.VFlexBox,

    events: {
        onOptOut: "",
        onOptIn: "",
        onShowTargets: "",
        onShowBackups: "",
        onShowUserData: ""
    },

    published: {
        lastBackup: "",
        info: "",
        destination: "",
        backupCount: null,
        userDataSummary: "",
        limited: false
    },

    components: [
        { kind: "RowGroup", components: [
            { layoutKind: "HFlexLayout", components: [
                { flex: 1, content: label_backup, style: "line-height: 32px;" },
                { kind: "ToggleButton", name: "tbutton", state: false,
                  onLabel: label_on, offLabel: label_off, onChange: "toggleChanged" }
            ]}
        ]},

        { kind: "VFlexBox", className: "box-center box", components: [
            { name: "infoLabel", className: "backup-info-text", content: label_info_optIn }
        ]},

        // Shown only when the root helper is missing, so the user knows the
        // backup is partial rather than discovering it at restore time.
        { name: "limitedBox", kind: "VFlexBox", className: "box-center box limited-box",
          showing: false, components: [
            { className: "limited-title", content: label_limited_title },
            { name: "limitedLabel", className: "backup-info-text", content: label_limited_text }
        ]},

        { name: "settingsGroup", kind: "RowGroup", components: [
            { name: "destinationRow", kind: "Item", layoutKind: "HFlexLayout", align: "center",
              tapHighlight: true, onclick: "destinationClick", components: [
                { flex: 1, content: label_info_destination, className: "enyo-label" },
                { name: "destinationLabel", className: "info-text", content: "" }
            ]},
            { name: "userDataRow", kind: "Item", layoutKind: "HFlexLayout", align: "center",
              tapHighlight: true, onclick: "userDataClick", components: [
                { flex: 1, content: label_info_whatToBackUp, className: "enyo-label" },
                { name: "userDataLabel", className: "info-text", content: "" }
            ]},
            { name: "manageRow", kind: "Item", layoutKind: "HFlexLayout", align: "center",
              tapHighlight: true, onclick: "manageClick", components: [
                { flex: 1, content: label_info_manage, className: "enyo-label" },
                { name: "manageLabel", className: "info-text", content: "" }
            ]}
        ]},

        { kind: "RowGroup", name: "lastBackup", showing: false, components: [
            { layoutKind: "HFlexLayout", components: [
                { flex: 1, content: label_info_lastbackup, className: "enyo-label",
                  style: "line-height: 1.2rem; vertical-align: middle;" },
                { name: "lastBackupLabel", className: "info-text", content: "" }
            ]}
        ]},

        { name: "optOutDialog", lazy: true, kind: "DialogPrompt", className: "box-center",
          title: label_dialog_title,
          dismissWithClick: false,
          message: label_dialog_message,
          acceptButtonCaption: label_dialog_off,
          cancelButtonCaption: label_dialog_on,
          onAccept: "offClick",
          onCancel: "onClick"
        }
    ],

    create: function () {
        this.inherited(arguments);
        this.$.optOutDialog.$.acceptButton.addClass("enyo-button-negative");
        this.$.infoLabel.setAllowHtml(true);
        this.$.limitedLabel.setAllowHtml(true);
    },

    lastBackupChanged: function () {
        if (this.lastBackup === "") {
            this.$.lastBackupLabel.setContent("");
        } else {
            this.$.lastBackupLabel.setContent(this.formatTime(this.lastBackup));
        }
    },

    infoChanged: function () {
        this.$.infoLabel.setContent(this.info);
        this.$.infoLabel.setAllowHtml(true);
    },

    destinationChanged: function () {
        this.$.destinationLabel.setContent(this.destination);
    },

    backupCountChanged: function () {
        var content = "";
        if (this.backupCount !== null && this.backupCount !== undefined) {
            content = this.backupCount === 1 ? $L("1 backup")
                : enyo.macroize($L("{$count} backups"), { count: this.backupCount });
        }
        this.$.manageLabel.setContent(content);
    },

    userDataSummaryChanged: function () {
        this.$.userDataLabel.setContent(this.userDataSummary);
    },

    limitedChanged: function () {
        this.$.limitedBox.setShowing(this.limited === true);
    },

    formatTime: function (lastbackuptime) {
        var dateTime = new Date(Number(lastbackuptime));
        var formatter = new enyo.g11n.DateFmt({ date: "long", time: "short" });
        return formatter.format(dateTime);
    },

    offClick: function () {
        this.$.optOutDialog.toggleOpen();
        this.doOptOut();
    },

    onClick: function () {
        // Cancelled the confirmation, so put the toggle back where it was.
        this.$.tbutton.setState(true);
        this.$.optOutDialog.toggleOpen();
    },

    toggleChanged: function (inSender) {
        if (inSender.getState() === false) {
            // Turning off erases the stored backups, so it is confirmed first.
            this.$.optOutDialog.toggleOpen();
        } else {
            this.doOptIn();
        }
    },

    setState: function (state) {
        // Programmatic only. ToggleButton fires onChange from updateState(),
        // which is user interaction, so this does not re-enter toggleChanged.
        this.$.tbutton.setState(state);
    },

    getState: function () {
        return this.$.tbutton.getState();
    },

    setDisabled: function (disabled) {
        this.$.tbutton.setDisabled(disabled);
    },

    hideLastBackup: function () {
        this.$.lastBackup.hide();
    },

    showLastBackup: function () {
        this.$.lastBackup.show();
    },

    destinationClick: function () {
        this.doShowTargets();
    },

    manageClick: function () {
        this.doShowBackups();
    },

    userDataClick: function () {
        this.doShowUserData();
    }
});
