/* Copyright 2011 Palm, Inc. All rights reserved.
 * Copyright 2025 woce-backup contributors.
 *
 * Application coordinator — a port of the stock BackupApp.js.
 *
 * The status state machine, the reset timer and the opt-in/opt-out flow are
 * carried over deliberately: they are what make the app feel like the one that
 * shipped. What is new is page navigation (the stock app was a single screen
 * and lived without restore, which First Use owned) and the destination /
 * manage / what-to-back-up rows.
 *
 * What is deliberately *not* carried over is the stock app's db8 watch on the
 * service's preference kind — see the ApplicationEvents component below.
 */

function gup(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
    var results = regex.exec(window.location.href);
    return results === null ? null : results[1];
}

var inLocale = gup("locale");
var inCountry = gup("country");
var rb;

if (inLocale === null || typeof inLocale === 'undefined') {
    rb = new enyo.g11n.Resources();
} else {
    rb = new enyo.g11n.Resources({ locale: inLocale });
    enyo.g11n.setLocale({
        uiLocale: inLocale,
        formatLocale: inCountry,
        phoneLocale: inCountry
    });
}

// The opt-out dialog's strings live in BackupInfo.js, next to the dialog.

label_dialog_noTargetTitle = rb.$L("Backup destination unavailable");
label_dialog_noTargetMsg   = rb.$L("Your backup destination can't be written to right now. Check that there is free space on your device and try again.");
label_dialog_okBtn         = rb.$L("OK");

// A failed backup used to change the button caption to "Backup failed" and stop
// there. The service sends an errorText and a type with every failure and none
// of it reached the user, so the only way to find out what went wrong was to
// read /var/log/messages.
label_dialog_noSpaceTitle  = rb.$L("Not enough space");
label_dialog_failedTitle   = rb.$L("Backup failed");
label_dialog_failedMsg     = rb.$L("Something went wrong during the backup and it did not finish.");

var label_header_backup = rb.$L("Backup");

enyo.kind({
    name: "BackupApp",
    kind: enyo.VFlexBox,

    published: {
        lastBackupTime: ""
    },

    components: [
        { name: "header", kind: "Toolbar", className: "enyo-toolbar-light accounts-header",
          components: [
            { kind: "Image", src: "images/header-icon-backup.png" },
            { name: "headerLabel", kind: "Control", content: label_header_backup,
              style: "text-transform: capitalize; padding-left: 10px" }
        ]},

        { name: "pane", kind: "Pane", flex: 1, transitionKind: "enyo.transitions.Simple",
          components: [
            { name: "mainPage", kind: "Scroller", flex: 1, components: [
                { kind: "Control", tapHighlight: false, className: "box-center", components: [
                    { name: "info", kind: "BackupInfo",
                      onOptIn: "optIn", onOptOut: "optOut",
                      onShowTargets: "showTargets",
                      onShowBackups: "showBackups",
                      onShowUserData: "showUserData" },
                    { name: "BackupProgressButton", kind: "BackupProgressButton",
                      pack: "center", onclick: "backupClick", onCancel: "cancelBackupClick" }
                ]}
            ]},
            { name: "backupListPage", kind: "BackupListPage", onRestore: "restoreFromList",
              onDone: "goBack" },
            { name: "userDataPage", kind: "UserDataPage", onDone: "goBack" },
            { name: "restorePage", kind: "RestoreComponent", onFinish: "restoreFinished" }
        ]},

        { kind: "Scrim", name: "bprogress", lazy: true, layoutKind: "VFlexLayout",
          align: "center", pack: "center", components: [
            { name: "spinner", kind: "SpinnerLarge", showing: true }
        ]},

        { name: "appMenu", kind: "AppMenu", components: [
            { caption: rb.$L("Restore a backup..."), onclick: "showRestore" },
            { caption: rb.$L("Back up everything now"), onclick: "fullBackupClick" },
            { caption: rb.$L("Help"), onclick: "handleHelpClick" }
        ]},

        // Not lazy, and general rather than target-specific: enyo.DialogPrompt
        // validates its own components from create(), so setTitle/setMessage are
        // safe to call before it has ever been opened.
        { name: "messageDialog", className: "box-center", kind: "enyo.DialogPrompt",
          title: label_dialog_failedTitle,
          message: label_dialog_failedMsg,
          acceptButtonCaption: label_dialog_okBtn,
          cancelButtonCaption: ""
        },

        // Not lazy: listTargets can answer before the dialog has ever been
        // opened, and a lazy dialog has no $.targetList to populate yet.
        { name: "targetDialog", kind: "ModalDialog", lazy: false, className: "popup",
          caption: rb.$L("Back up to"), components: [
            { name: "targetList", kind: "RowGroup" },
            { kind: "Button", caption: label_dialog_okBtn, onclick: "closeTargetDialog",
              style: "margin-top: 10px" }
        ]},

        { kind: "BackupService", onFailure: "handleGenericFailure", components: [
            { name: "getBackupStatus", method: "getBackupStatus", subscribe: true,
              onSuccess: "backupStatusSuccess", onFailure: "backupStatusFailure" },
            { name: "startBackup", method: "startBackup", subscribe: true, resume: true,
              onSuccess: "backupStatusSuccess", onFailure: "backupStatusFailure" },
            { name: "cancelBackup", method: "cancelBackup" },
            { name: "getLastBackupTime", method: "getLastBackupTime",
              onSuccess: "lastBackupSuccess", onFailure: "lastBackupFailure" },
            { name: "optOutOfBackup", method: "optOutOfBackup",
              onSuccess: "optOutSuccess", onFailure: "optOutFailure" },
            { name: "optInToBackup", method: "optInToBackup",
              onSuccess: "optInSuccess", onFailure: "optInFailure" },
            { name: "listTargets", method: "listTargets", onSuccess: "listTargetsSuccess" },
            { name: "setTarget", method: "setTarget", onSuccess: "setTargetSuccess" },
            { name: "listBackups", method: "listBackups", onSuccess: "listBackupsSuccess" },
            { name: "getUserDataCategories", method: "getUserDataCategories",
              onSuccess: "userDataSuccess" }
        ]},

        { kind: "ApplicationManagerService", components: [
            { name: "openHelp", method: "open",
              params: { id: "com.palm.app.help", params: { target: "https://webosarchive.org" } } }
        ]},

        // Refresh whenever the card comes forward. The stock app instead put a
        // db8 watch on the service's preference kind, which it could only do
        // because a Configurator permission file
        // (/etc/palm/db/permissions/com.palm.service.backup.prefs) granted
        // com.palm.app.backup read access. A third-party app cannot install
        // one, and db8 refuses the read outright, so the app talks to the
        // service and nothing else — which is the better boundary anyway.
        { kind: "ApplicationEvents", onWindowActivated: "windowActivated" }
    ],

    create: function () {
        this.inherited(arguments);

        this.backupInProgress = false;
        this.cancelInitiated = false;
        this.defaultTimeout = 15000;
        this.initialLoadTimeout = 12000;
        this.initialLoadTimer = null;
        this.lastAction = "RESET";
        this.resetTimer = null;
        this.targetRows = [];
        // True from the moment the user flips the toggle until the service has
        // answered. A getLastBackupTime issued before the opt-in commits comes
        // back saying backup is still off, and without this guard that stale
        // answer lands after the opt-in succeeded and flips the toggle back.
        this.togglePending = false;

        // Covers the gap between the main page rendering with nothing loaded
        // yet and refreshAll's five calls actually answering - without it the
        // toggle, last-backup time and summary rows visibly pop in one at a
        // time. bprogress is the same full-page scrim optIn/optOut already
        // use; reused rather than adding a second one.
        this.initialLoadComplete = false;
        this.pendingInitialLoad = 0;
        this.$.bprogress.show();

        // The scrim covers the whole app and nothing but initialLoadStepDone
        // takes it down, so a single call that never answers left a spinner
        // over an app with no way out of it. The five calls are all cheap and
        // local; if they have not all landed by now, something is wrong and the
        // user is better off looking at a half-populated screen than at a
        // scrim.
        this.initialLoadTimer = setTimeout(
            enyo.bind(this, "initialLoadTimedOut"), this.initialLoadTimeout);

        this.refreshAll();
    },

    destroy: function () {
        this.cancelReset();
        this.cancelInitialLoadTimer();
        this.inherited(arguments);
    },

    /**
     * Pulls every piece of state from the service. Cheap enough to run on each
     * activation, and it is the only way the app learns about changes a
     * scheduled backup made while it was in the background.
     */
    refreshAll: function () {
        if (!this.initialLoadComplete) {
            this.pendingInitialLoad = 5;
        }
        this.$.getBackupStatus.call();
        this.$.getLastBackupTime.call();
        this.$.listTargets.call();
        this.$.listBackups.call();
        this.$.getUserDataCategories.call();
    },

    /**
     * Called from each of refreshAll's five callbacks, success or failure -
     * once all have answered at least once, the launch scrim comes down for
     * good. Never fires again after that: windowActivated/goBack re-issue
     * some of the same calls on every later refresh, and re-showing a
     * full-page scrim for those would be far more disruptive than the stale
     * data it would be covering for a moment.
     */
    initialLoadStepDone: function () {
        if (this.initialLoadComplete) {
            return;
        }
        this.pendingInitialLoad -= 1;
        if (this.pendingInitialLoad <= 0) {
            this.finishInitialLoad();
        }
    },

    finishInitialLoad: function () {
        this.cancelInitialLoadTimer();
        this.initialLoadComplete = true;
        this.$.bprogress.hide();
    },

    cancelInitialLoadTimer: function () {
        if (this.initialLoadTimer) {
            clearTimeout(this.initialLoadTimer);
            this.initialLoadTimer = null;
        }
    },

    initialLoadTimedOut: function () {
        this.initialLoadTimer = null;
        if (this.initialLoadComplete) {
            return;
        }
        this.warn("Initial load did not finish in time; lifting the scrim with " +
            this.pendingInitialLoad + " call(s) outstanding");
        this.finishInitialLoad();
    },

    windowActivated: function () {
        // Not during a run or a pending toggle: re-reading state would fight
        // the progress updates, or race the opt-in the user just asked for.
        if (!this.backupInProgress && !this.togglePending) {
            this.refreshAll();
        }
    },

    /* --------------------------------------------------------- navigation */

    showPage: function (name, title) {
        this.$.pane.selectViewByName(name);
        var isMain = (name === "mainPage");
        this.$.headerLabel.setContent(isMain ? label_header_backup : title);
    },

    goBack: function () {
        this.showPage("mainPage");
        // The list may have changed while we were away.
        this.$.listBackups.call();
        this.$.getUserDataCategories.call();
        this.$.getLastBackupTime.call();
    },

    showBackups: function () {
        this.showPage("backupListPage", rb.$L("Manage backups"));
        this.$.backupListPage.refresh();
    },

    showUserData: function () {
        this.showPage("userDataPage", rb.$L("What to back up"));
        this.$.userDataPage.refresh();
    },

    showRestore: function () {
        this.showPage("restorePage", rb.$L("Restore"));
        this.$.restorePage.start();
    },

    restoreFromList: function (inSender, manifestName) {
        this.showPage("restorePage", rb.$L("Restore"));
        this.$.restorePage.startWithManifest(manifestName);
    },

    restoreFinished: function () {
        this.goBack();
    },

    /* ------------------------------------------------------- backup status */

    cancelReset: function () {
        if (this.resetTimer) {
            clearTimeout(this.resetTimer);
            this.resetTimer = null;
        }
    },

    scheduleReset: function (timeoutValue) {
        var timeout = (timeoutValue === undefined) ? this.defaultTimeout : timeoutValue;
        if (timeout === 0) {
            this.backupInProgress = false;
        }
        if (!this.resetTimer) {
            this.resetTimer = setTimeout(enyo.bind(this, "resetBackup"), timeout);
        }
    },

    // Returns the button to its resting "Back Up Now" state after a run has
    // finished and the user has had a moment to read the outcome.
    resetBackup: function () {
        this.$.BackupProgressButton.setPosition(100);
        this.$.BackupProgressButton.setLabelValue(label_progress_backup_now);
        this.$.BackupProgressButton.hideButton();
        this.$.BackupProgressButton.hideSpinner();
        this.$.info.setDisabled(false);
        this.resetTimer = null;
        this.cancelInitiated = false;
        this.backupInProgress = false;
        this.lastAction = "RESET";
        this.$.listBackups.call();
    },

    prepareBackup: function () {
        this.$.BackupProgressButton.setLabelValue(label_progress_preparing);
        this.$.BackupProgressButton.showSpinner();
        this.$.info.setDisabled(true);
    },

    completeBackup: function (inResponse) {
        this.$.getLastBackupTime.call();
        this.$.BackupProgressButton.hideButton();
        this.$.BackupProgressButton.setPosition(100);
        this.$.BackupProgressButton.hideSpinner();

        var label = label_progress_backup_complete;
        if (inResponse && inResponse.skipped > 0) {
            label = enyo.macroize(rb.$L("Backup complete ({$count} skipped)"),
                { count: inResponse.skipped });
        }
        this.$.BackupProgressButton.setLabelValue(label);
        this.scheduleReset();
    },

    failedBackup: function (inResponse) {
        this.$.BackupProgressButton.setLabelValue(label_progress_backup_failed);
        this.$.BackupProgressButton.hideButton();
        this.$.BackupProgressButton.hideSpinner();
        this.$.info.setDisabled(false);
        this.scheduleReset();

        var type = inResponse && inResponse.type;
        if (type === "TARGET") {
            this.showMessage(label_dialog_noTargetTitle, label_dialog_noTargetMsg);
        } else if (type === "SPACE") {
            // The service builds this one with the actual numbers in it, which
            // is the whole reason it is worth showing rather than a fixed
            // string.
            this.showMessage(label_dialog_noSpaceTitle,
                (inResponse && inResponse.errorText) || label_dialog_failedMsg);
        } else {
            this.showMessage(label_dialog_failedTitle,
                (inResponse && inResponse.errorText) || label_dialog_failedMsg);
        }
    },

    showMessage: function (title, message) {
        this.$.messageDialog.setTitle(title);
        this.$.messageDialog.setMessage(message);
        this.$.messageDialog.open();
    },

    backupStatusSuccess: function (inSender, inResponse) {
        this.initialLoadStepDone();
        if (inResponse.privileged !== undefined) {
            this.$.info.setLimited(inResponse.privileged !== true);
        }

        // A status push that arrives after a reset belongs to a finished run.
        if (this.lastAction === "RESET" && inResponse.STATUS !== "InProgress") {
            return;
        }

        switch (inResponse.STATUS) {
        case undefined:
            if (this.backupInProgress === false) {
                this.$.BackupProgressButton.setLabelValue(label_progress_backup_now);
            }
            break;

        case "Preparing":
            this.cancelReset();
            this.backupInProgress = true;
            this.$.BackupProgressButton.setLabelValue(label_progress_preparing);
            break;

        case "InProgress":
            if (inResponse.percent === undefined || this.cancelInitiated) {
                return;
            }
            this.cancelReset();
            this.backupInProgress = true;
            this.$.BackupProgressButton.showButton();
            this.$.BackupProgressButton.showSpinner();
            this.$.BackupProgressButton.setPosition(inResponse.percent);
            // The service names what it is working on when it can. Archiving a
            // large app can hold the percentage still for minutes, and a bar
            // that does not move with no explanation reads as a hang.
            this.$.BackupProgressButton.setLabelValue(
                inResponse.detail
                    ? label_progress_backing_app.replace("{$name}", inResponse.detail)
                    : label_progress_backing_now);
            break;

        case "Complete":
            this.completeBackup(inResponse);
            break;

        case "Canceled":
            this.$.BackupProgressButton.hideButton();
            this.$.BackupProgressButton.hideSpinner();
            this.$.BackupProgressButton.setLabelValue(label_progress_suspend_complete);
            this.scheduleReset();
            break;

        case "Failed":
            if (this.cancelInitiated) {
                return;
            }
            this.failedBackup(inResponse);
            break;
        }
    },

    backupStatusFailure: function (inSender, inResponse) {
        this.initialLoadStepDone();
        if (this.cancelInitiated) {
            return;
        }
        this.error("backupStatusFailure", inResponse);
        this.failedBackup(inResponse);
    },

    backupClick: function () {
        this.startBackup(false);
    },

    fullBackupClick: function () {
        this.startBackup(true);
    },

    startBackup: function (full) {
        if (this.backupInProgress || this.cancelInitiated) {
            return;
        }
        this.lastAction = "BACKUP";
        this.cancelReset();

        this.$.BackupProgressButton.setPosition(0);
        this.$.BackupProgressButton.show();
        this.backupInProgress = true;
        this.prepareBackup();

        this.$.getBackupStatus.call();
        this.$.startBackup.call({ full: full === true });
    },

    cancelBackupClick: function () {
        this.lastAction = "CANCEL";
        this.cancelInitiated = true;

        this.$.BackupProgressButton.hideButton();
        this.$.BackupProgressButton.setLabelValue(label_progress_suspend);
        this.$.BackupProgressButton.setPosition(100);

        this.$.cancelBackup.call();
        this.scheduleReset();
    },

    /* ------------------------------------------------------- last backup */

    lastBackupSuccess: function (inSender, inResponse) {
        this.initialLoadStepDone();
        // The stock app read inResponse.OptIn here, which the service never
        // sent — so the toggle silently ignored the stored setting. The service
        // returns optOut; use it. This response is also where the app learns
        // the enabled state at all, now that there is no preference watch.
        var enabled = true;
        if (inResponse.optOut !== undefined) {
            enabled = !inResponse.optOut;
            if (this.togglePending) {
                // This reply may have been issued before the opt-in write
                // committed, so it cannot be trusted about the enabled state.
                // Consume the guard and keep what the opt-in response set.
                this.togglePending = false;
                enabled = this.$.info.getState();
            } else {
                this.applyEnabledState(enabled);
            }
        }

        if (!enabled || inResponse.lastbackupTime === "." ||
                inResponse.lastbackupTime === undefined) {
            this.$.info.setLastBackup("");
            this.$.info.hideLastBackup();
        } else {
            this.lastBackupTime = inResponse.lastbackupTime;
            this.$.info.setLastBackup(this.lastBackupTime);
            this.$.info.showLastBackup();
        }
    },

    lastBackupFailure: function (inSender, inResponse) {
        this.initialLoadStepDone();
        this.$.info.setLastBackup("");
        this.$.info.hideLastBackup();
    },

    applyEnabledState: function (enabled) {
        this.$.info.setState(enabled);
        this.$.info.setInfo(enabled ? label_info_optIn : label_info_optOut);
        this.$.BackupProgressButton.setShowing(enabled);
    },

    /* ------------------------------------------------------ opt in / out */

    optIn: function () {
        this.togglePending = true;
        this.$.bprogress.show();
        this.$.optInToBackup.call();
    },

    optOut: function () {
        this.togglePending = true;
        this.$.BackupProgressButton.setLabelValue(label_progress_opting_out);
        this.$.bprogress.show();
        if (this.backupInProgress) {
            this.$.cancelBackup.call();
        }
        this.$.optOutOfBackup.call();
    },

    optInSuccess: function () {
        this.$.bprogress.hide();
        this.$.BackupProgressButton.setLabelValue(label_progress_backup_now);
        this.applyEnabledState(true);
        this.$.getLastBackupTime.call();
    },

    optInFailure: function (inSender, inResponse) {
        this.togglePending = false;
        this.$.bprogress.hide();
        this.error("optInFailure", inResponse);
        this.$.info.setState(false);
    },

    optOutSuccess: function () {
        this.$.bprogress.hide();
        this.applyEnabledState(false);
        this.$.info.setLastBackup("");
        this.$.info.hideLastBackup();
        this.$.listBackups.call();
        // Also consumes togglePending, which is only cleared by the follow-up
        // response — without this the guard would stay raised for good and
        // windowActivated would stop refreshing.
        this.$.getLastBackupTime.call();
    },

    optOutFailure: function (inSender, inResponse) {
        this.togglePending = false;
        this.$.bprogress.hide();
        this.error("optOutFailure", inResponse);
        // The erase did not happen, so leave the toggle showing enabled rather
        // than implying the backups are gone.
        this.applyEnabledState(true);
        this.$.getLastBackupTime.call();
    },

    /* ----------------------------------------------------------- targets */

    showTargets: function () {
        // Open first so the rows have a node to render into when the response
        // arrives.
        this.$.targetDialog.openAtCenter();
        this.$.listTargets.call();
    },

    listTargetsSuccess: function (inSender, inResponse) {
        this.initialLoadStepDone();
        var targets = inResponse.targets || [];
        var selected = null;

        for (var i = 0; i < targets.length; i++) {
            if (targets[i].selected) {
                selected = targets[i];
            }
        }
        this.$.info.setDestination(selected ? selected.description : "");

        // Rebuild the picker rows from the response, so a newly installed
        // connector appears without an app change.
        //
        // The rows are destroyed individually rather than with
        // targetList.destroyComponents(). A component created with owner: self
        // is registered in *self's* $ hash, not the container's, so asking the
        // container to destroy its components removes nothing and the next
        // rebuild trips Enyo's unique-name-under-owner rule.
        for (i = 0; i < this.targetRows.length; i++) {
            if (!this.targetRows[i].destroyed) {
                this.targetRows[i].destroy();
            }
        }
        this.targetRows = [];

        var self = this;
        targets.forEach(function (target) {
            self.targetRows.push(self.$.targetList.createComponent({
                kind: "Item",
                layoutKind: "HFlexLayout",
                align: "center",
                tapHighlight: true,
                targetId: target.id,
                onclick: "targetSelected",
                components: [
                    { kind: "Control", flex: 1, components: [
                        { content: target.label, className: "target-name" },
                        { content: target.description, className: "target-description" }
                    ]},
                    { content: target.selected ? "✓" : "", className: "target-check" }
                ]
            }, { owner: self }));
        });

        // Only re-render once the dialog is actually in the DOM; before that,
        // rendering it is what produces "Cannot call method 'flow' of undefined".
        if (this.$.targetList.hasNode()) {
            this.$.targetList.render();
        }
    },

    targetSelected: function (inSender) {
        this.$.setTarget.call({ targetId: inSender.targetId });
    },

    setTargetSuccess: function () {
        this.$.targetDialog.close();
        this.$.listTargets.call();
        this.$.listBackups.call();
        this.$.getLastBackupTime.call();
    },

    closeTargetDialog: function () {
        this.$.targetDialog.close();
    },

    /* ------------------------------------------------------ summary rows */

    listBackupsSuccess: function (inSender, inResponse) {
        this.initialLoadStepDone();
        var backups = inResponse.backups || [];
        this.$.info.setBackupCount(backups.length);
        if (inResponse.location) {
            this.$.info.setDestination(inResponse.location);
        }
        this.$.backupListPage.setBackups(backups, inResponse.location);
    },

    userDataSuccess: function (inSender, inResponse) {
        this.initialLoadStepDone();
        var categories = inResponse.categories || [];
        var enabled = [];
        categories.forEach(function (category) {
            if (category.enabled) {
                enabled.push(category.label);
            }
        });

        this.$.info.setUserDataSummary(enabled.length === 0
            ? rb.$L("Settings and data")
            : enabled.join(", "));
        this.$.userDataPage.setCategories(categories);
    },

    /* ------------------------------------------------------------- misc */

    handleHelpClick: function () {
        this.$.openHelp.call();
    },

    handleGenericFailure: function (inSender, inResponse) {
        // Catches listTargets/listBackups/getUserDataCategories failures too
        // (they have no onFailure of their own) - each is one of the five
        // refreshAll steps the launch scrim is waiting on.
        this.initialLoadStepDone();
        this.warn("Service call failed", inResponse);
    }
});
