/* Copyright 2011 Palm, Inc. All rights reserved.
 * Copyright 2025 woce-backup contributors.
 *
 * Restore progress. A port of the First Use RestoringPage: same progress bar,
 * same Try Again on failure, and the same handling of error 408 — the service
 * still uses that code to mean "the connection dropped, retry when it returns",
 * which matters once a network target exists.
 *
 * Changed from stock: "Start Over" erased the device to re-enter First Use.
 * That is not a reasonable thing for an app the user launched deliberately, so
 * the second button simply leaves the flow.
 */

enyo.kind({
    name: "RestoringPage",
    kind: enyo.VFlexBox,
    pack: "justify",

    published: {
        connected: true
    },

    events: {
        onFinish: "",
        onCancel: ""
    },

    components: [
        { name: "progressPanel", kind: "VFlexBox", align: "center", flex: 1, components: [
            { className: "title", content: $L("Restoring your data") },
            { name: "subtitle", className: "subtitle box-center",
              content: $L("Copying your accounts, settings and application data back onto this device. This may take a few minutes.") },

            { kind: "Control", className: "box", components: [
                { name: "progressBar", className: "restore-progress", kind: "ProgressBar" }
            ]},

            { name: "statusLabel", className: "subtitle box-center", content: "" }
        ]},

        { name: "donePanel", kind: "VFlexBox", align: "center", flex: 1, showing: false,
          components: [
            // A common flex: 1 wrapper, always visible, around doneMessage
            // and manualInstallGroup - the same fix as ChooseBackupPage's
            // "content" and BackupListPage's, and for the same reason:
            // manualInstallGroup is flex: 1 but showing: false whenever
            // nothing needs a manual install (the common case - most restores
            // either have no packages or reinstall them all automatically),
            // and a flex: 1 control that isn't showing claims none of
            // donePanel's space, so the Toolbar below wasn't reliably pinned
            // to the bottom. flex: 1 on manualInstallGroup, plus a Scroller
            // (not just the bare Control this had before) around the row
            // list, is what makes a long list scroll instead of overflowing
            // past the Toolbar with everything overlapping - doneMessage
            // stays outside the scroller so it's always visible; only the
            // row list scrolls.
            { name: "doneContent", kind: "VFlexBox", align: "center", flex: 1,
              style: "width: 100%;", components: [
                { name: "doneMessage", className: "subtitle box-center", content: "" },
                { name: "manualInstallGroup", kind: "VFlexBox", flex: 1, showing: false,
                  style: "width: 100%;", components: [
                    { name: "manualInstallLabel", className: "subtitle box-center", content: "" },
                    { name: "manualInstallScroller", kind: "Scroller", flex: 1, components: [
                        { name: "manualInstallList", className: "manual-install-list" }
                    ]}
                ]}
            ]},
            // Same Toolbar/enyo-toolbar-light bottom bar as ChooseBackupPage's
            // Cancel - system apps mix an enyo-button-affirmative ToolButton
            // into one of these too (e.g. VPN's AddProfile "Next"), so this
            // keeps its positive styling rather than switching to dark.
            // width: 100% for the same reason doneContent above needs it:
            // donePanel's own align: "center" shrink-wraps an unstyled child
            // to its content instead of the full row.
            { kind: "Toolbar", className: "enyo-toolbar-light", style: "width: 100%;",
              components: [
                { name: "doneButton", kind: "Button", caption: $L("Done"),
                  className: "enyo-button-affirmative", style: "width: 300px;",
                  onclick: "doneClick" }
            ]}
        ]},

        { name: "errorPopup", kind: "ModalDialog", lazy: false, dismissWithClick: false,
          modal: false, className: "popup", caption: $L("Error Restoring Data"),
          components: [
            { name: "errorMessage", className: "enyo-text-body",
              content: $L("An error occurred while restoring your data. Please try again.") },
            { kind: "Control", layoutKind: "VFlexLayout", pack: "justify", components: [
                { kind: "Button", caption: $L("Try Again"), flex: 1,
                  className: "enyo-button-affirmative", onclick: "tryAgainClick",
                  style: "padding-bottom: 10px; margin-bottom: 5px;" },
                { kind: "Button", caption: $L("Cancel"), flex: 1,
                  onclick: "cancelClick", style: "padding-bottom: 10px;" }
            ]}
        ]},

        { name: "restore", kind: "BackupService", method: "restore", subscribe: true,
          onSuccess: "restoreSuccess", onFailure: "restoreFailure" },

        { name: "reboot", kind: "BackupService", method: "reboot",
          onSuccess: "rebootSuccess", onFailure: "rebootFailure" },

        // No static params, unlike BackupApp's openHelp: the target package
        // differs per row, so the call site builds params fresh each tap.
        { kind: "ApplicationManagerService", components: [
            { name: "openAppCatalog", method: "open" }
        ]}
    ],

    create: function () {
        this.inherited(arguments);
        this.manualInstallRows = [];
    },

    /**
     * This instance is never destroyed (restorePage is not lazy), so it can
     * carry state from an abandoned attempt into the next one: awaitingResponse
     * stuck true from a call whose response never arrived before the user
     * backed out leaves startRestore silently no-opping next time round, which
     * reads as "nothing happened" or "I had to pick a backup twice." Called at
     * the start of every fresh entry into the restore flow (RestoreComponent's
     * start/startWithManifest) so leftover state from however the previous
     * visit ended - Cancel, the header back arrow, a stalled call - never
     * carries forward.
     */
    reset: function () {
        this.awaitingResponse = false;
        this.failedDueToDroppedConnection = false;
        this.finished = false;
        this.canAutoRestart = false;
        this.$.errorPopup.close();
        this.$.progressPanel.setShowing(true);
        this.$.donePanel.setShowing(false);
        this.$.doneButton.setDisabled(false);
        this.$.doneButton.setCaption($L("Done"));
        this.$.statusLabel.setContent("");
        this.$.progressBar.setPositionImmediate(0);
    },

    startRestore: function (params) {
        // A second tap on the confirm button - which stays visible during the
        // dialog's own close animation - or a second row-click before the page
        // transition finishes can re-enter here while the previous call is
        // still outstanding: two independent restores, each with its own
        // tempDir, racing to claim com.palm.backup.privileged on the private
        // bus. Blocking only until the first response of any kind (including
        // "InProgress") arrives is enough to close that window without
        // touching the retry paths below, which by construction only ever
        // call startRestore again after a response has already landed.
        if (this.awaitingResponse) {
            return;
        }
        this.awaitingResponse = true;

        this.params = params || {};
        this.finished = false;

        this.$.progressPanel.setShowing(true);
        this.$.donePanel.setShowing(false);
        this.$.statusLabel.setContent("");
        this.$.progressBar.setPositionImmediate(0);
        this.$.errorPopup.close();

        this.$.restore.call(this.params);
    },

    restoreSuccess: function (inSender, inResponse) {
        this.awaitingResponse = false;
        switch (inResponse.STATUS) {
        case "InProgress":
            this.$.progressBar.setPosition(inResponse.percent);
            break;

        case "Complete":
            this.$.progressBar.setPosition(100);
            // The subscription delivers Complete as well as the call's own
            // result, so guard against finishing twice.
            if (this.finished) {
                return;
            }
            this.finished = true;
            this.showDone(inResponse);
            break;

        case "Failed":
            this.handleFailure(inResponse);
            break;
        }
    },

    restoreFailure: function (inSender, inResponse) {
        this.awaitingResponse = false;
        this.error("restore failed", inResponse);
        this.handleFailure(inResponse);
    },

    handleFailure: function (inResponse) {
        if (inResponse && 408 === inResponse.error) {
            // Dropped connection. Retry immediately if it is already back,
            // otherwise wait for connectedChanged to tell us.
            if (this.connected) {
                this.startRestore(this.params);
            } else {
                this.failedDueToDroppedConnection = true;
            }
            return;
        }

        if (inResponse && inResponse.errorText) {
            this.$.errorMessage.setContent(inResponse.errorText);
        }
        this.$.errorPopup.openAtCenter();
    },

    showDone: function (inResponse) {
        var messages = [$L("Restore complete.")];

        var skipped = inResponse.skipped || [];
        if (skipped.length > 0) {
            messages.push(enyo.macroize(
                $L("{$count} item(s) could not be restored."), { count: skipped.length }));
        }

        var packages = inResponse.packages || [];
        var reinstalled = packages.filter(function (pkg) { return pkg.installed; });
        var needsManual = packages.filter(function (pkg) { return !pkg.installed; });

        if (reinstalled.length > 0) {
            messages.push(enyo.macroize(
                $L("{$count} application(s) were reinstalled automatically."),
                { count: reinstalled.length }));
        }

        // Only the privileged helper can actually issue the restart (see
        // handlers/reboot.js) - a limited-mode restore still needs the user
        // to do it themselves, same as before this button existed.
        this.canAutoRestart = inResponse.privileged === true;
        if (this.canAutoRestart) {
            this.$.doneButton.setCaption($L("Restart"));
        } else {
            this.$.doneButton.setCaption($L("Done"));
            messages.push($L("Restart your device to finish applying the restored data."));
        }

        this.$.statusLabel.setContent("");
        this.$.doneMessage.setContent(messages.join(" "));
        this.buildManualInstallRows(needsManual);
        // Hide the progress display rather than leaving it showing alongside
        // donePanel: both are flex: 1, so with both visible they split the
        // screen and donePanel's own Toolbar ends up pinned to the bottom of
        // its half rather than the page's actual bottom edge.
        this.$.progressPanel.setShowing(false);
        this.$.donePanel.setShowing(true);
    },

    doneClick: function () {
        if (!this.canAutoRestart) {
            this.doFinish();
            return;
        }
        this.$.doneButton.setDisabled(true);
        this.$.doneButton.setCaption($L("Restarting…"));
        this.$.reboot.call({});
    },

    rebootSuccess: function () {
        // The device is going down within a couple of seconds (see
        // handlers/reboot.js) - nothing left to do from here.
    },

    rebootFailure: function (inSender, inResponse) {
        this.error("reboot failed", inResponse);
        // Falls back to plain Done rather than re-arming for another
        // attempt: the restore itself already succeeded, and with the
        // header back button hidden for this whole flow there is no other
        // way out of this screen if a retry failed too.
        this.canAutoRestart = false;
        this.$.doneButton.setDisabled(false);
        this.$.doneButton.setCaption($L("Done"));
        this.$.statusLabel.setContent($L("Restart your device to finish applying the restored data."));
    },

    /**
     * One row per app that couldn't be reinstalled automatically - either the
     * original installer wasn't available to archive at backup time, or
     * reinstalling it just failed. Tapping a row opens the App Catalog
     * straight to that app's page (viewToLoad: "APPDETAILS"), confirmed
     * against com.palm.app.enyo-findapps's own source rather than guessed:
     * AppCatalogWindow.js's showView() switches on params.viewToLoad, and its
     * own promo-code handler builds the identical shape this uses.
     */
    buildManualInstallRows: function (packages) {
        for (var i = 0; i < this.manualInstallRows.length; i++) {
            if (!this.manualInstallRows[i].destroyed) {
                this.manualInstallRows[i].destroy();
            }
        }
        this.manualInstallRows = [];

        this.$.manualInstallGroup.setShowing(packages.length > 0);
        if (packages.length === 0) {
            return;
        }

        this.$.manualInstallLabel.setContent(packages.length === 1
            ? $L("This application could not be reinstalled automatically:")
            : $L("These applications could not be reinstalled automatically:"));

        var self = this;
        packages.forEach(function (pkg) {
            self.manualInstallRows.push(self.$.manualInstallList.createComponent({
                kind: "Item",
                layoutKind: "HFlexLayout",
                align: "center",
                tapHighlight: true,
                packageId: pkg.id,
                onclick: "openAppDetails",
                components: [
                    { className: "manual-install-name", flex: 1, content: pkg.title || pkg.id },
                    { content: "›", className: "manual-install-arrow" }
                ]
            }, { owner: self }));
        });

        // Same rule as BackupApp.listTargetsSuccess: rendering before the
        // panel is in the DOM is what produces "Cannot call method 'flow' of
        // undefined", not something particular to this list.
        if (this.$.manualInstallList.hasNode()) {
            this.$.manualInstallList.render();
        }
    },

    openAppDetails: function (inSender) {
        this.$.openAppCatalog.call({
            id: "com.palm.app.enyo-findapps",
            params: {
                viewToLoad: "APPDETAILS",
                id: "",
                publicApplicationId: inSender.packageId
            }
        });
    },

    tryAgainClick: function () {
        this.$.errorPopup.close();
        this.startRestore(this.params);
    },

    cancelClick: function () {
        this.$.errorPopup.close();
        this.doCancel();
    },

    connectedChanged: function () {
        if (this.connected && this.failedDueToDroppedConnection) {
            this.failedDueToDroppedConnection = false;
            this.startRestore(this.params);
        }
    }
});
