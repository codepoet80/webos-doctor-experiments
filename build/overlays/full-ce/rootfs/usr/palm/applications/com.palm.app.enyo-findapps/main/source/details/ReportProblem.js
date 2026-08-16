enyo.kind({
    name: "findApps.Details.ReportProblem",
    kind: enyo.Control,
    published: {
        appDetails: null
    },
    components: [
    //Error dialog
    {
        kind: "findApps.Error",
        onSubmit: "submitError",
        onCancel: "cancelError"
    }, {
        kind: "Popup",
        name: "alertPrompt",
        components: [{
            name: "alertTitle",
            className: "enyo-item enyo-first",
            content: "",
            style: "padding: 12px"
        }, {
            name: "alertMessage",
            className: "enyo-item enyo-last",
            content: "",
            style: "padding: 12px; font-size: 14px"
        }, {
            kind: "Button",
            className: "enyo-button-light",
            value: "ok",
            caption: "OK",
            onclick: "dismissAlertPopup"
        }]
    },
    //Popup for report a problem
    {
        name: "reportAProblemPopup",
        kind: "ModalDialog",
        caption: $L("Report a Problem"),
        components: [{
            kind: "HFlexBox",
            flex: 1,
            className: "palm-paragraph",
            components: [{
                name: "reportHeaderImage",
                kind: enyo.Image,
                src: '',
                className: 'report-header-image'
            }, {
                components: [{
                    name: "reportHeaderTitle",
                    kind: enyo.Control,
                    className: 'enyo-text-subheader enyo-text-ellipsis'
                }, {
                    name: "reportHeaderCreater",
                    kind: enyo.Control,
                    className: 'enyo-text-ellipsis enyo-text-body'
                }]
            }]
        }, {
            kind: "Button",
            className: "report-list-button",
            components: [{
                kind: "CustomListSelector",
                name: "problemTypeListSelector",
                value: '1',
                items: [{
                    caption: $L("Bug"),
                    value: '1'
                }, {
                    caption: $L("Offensive Content"),
                    value: '2'
                }, {
                    caption: $L("Download"),
                    value: '3'
                }, {
                    caption: $L("Installation"),
                    value: '4'
                }, {
                    caption: $L("Payment"),
                    value: '5'
                }, {
                    caption: $L("Legal Issue"),
                    value: '6'
                }, {
                    caption: $L("Other"),
                    value: '7'
                }]
            }]
        }, {
            kind: enyo.Control,
            content: "<p>" + $L("Report a problem with this application to Palm.") + "</p>",
            className: 'enyo-paragraph'
        }, {
            kind: "RichText",
            name: "descriptionInput",
            richContent: false,
            alwaysLooksFocused: true,
            style: "min-height:90px;",
            hint: $L("Tap here to begin typing")
        }, {
            layoutKind: "HFlexLayout",
            defaultKind: "Button",
            className: "report-button-box",
            components: [{
                kind: "Button",
                caption: $L("Cancel"),
                flex: 1,
                onclick: "closePopup"
            }, {
                kind: "Button",
                name: "sendReportButton",
                flex: 1,
                caption: $L("Send"),
                onclick: "submitProblem"
            }]
        }]
    },
    // Report a Problem button
    {
        kind: "Button",
        className: "enyo-button-light",
        caption: $L("Report a Problem"),
        onclick: "openPopup",
        name: "reportProblemButton"
    }],

    create: function() {
        this.inherited(arguments);
        this.appMetrics = enyo.application.appMetrics;
        var accntInfo = findApps.AccountServices.getInstance().getAccountInfo({
            onSuccess: "accountInfoSuccess", 
            onFailure: "accountInfoFailure", 
            scope: this
        });
        if (accntInfo) {
            this.accountInfoSuccess(null, accntInfo);
        }
    },
    appDetailsChanged: function() {
        this.$.reportAProblemPopup.validateComponents();
        if (this.appDetails) {
            this.$.reportHeaderImage.setSrc(this.appDetails.appIcon);
            this.$.reportHeaderTitle.setContent(this.appDetails.title);
            this.$.reportHeaderCreater.setContent(this.appDetails.creator);
        }
        // Set the problem fields to empty
        this.$.descriptionInput.setValue("");
        this.$.problemTypeListSelector.setValue(0);
    },
    getDescription: function() {
        return this.$.descriptionInput.getValue();
    },
    getProblemType: function() {
        return this.$.problemTypeListSelector.getValue();
    },
    // Event handlers
    submitProblem: function(inSender) {
        this.problemDesc = this.$.descriptionInput.getValue();
        this.problemType = this.$.problemTypeListSelector.getValue();
        this.$.sendReportButton.disabled = true;
        this.$.sendReportButton.addClass('enyo-button-disabled');
        findApps.BaseServer.getACServer().reportProblem(this.appDetails.id, this.appDetails.publicApplicationId, this.problemDesc, 0, enyo.g11n.currentLocale().toISOString(), this.name, false, true, this.problemType, "ReportProblemService", {
            onSuccess: "handleServerResponse",
            onFailure: "handleServerError",
            scope: this
        });
    },
    closePopup: function() {
        if (this.appMetrics) this.appMetrics.trackNewScene("report_a_problem_closed/" + this.appDetails.publicApplicationId);
        this.$.reportAProblemPopup.close();
    },
    // Open Report a Problem as a pop-up
    openPopup: function() {
        if (this.appMetrics) this.appMetrics.trackNewScene("report_a_problem/" + this.appDetails.publicApplicationId);
        this.$.reportAProblemPopup.openAtCenter();
    },
    // Server callback
    accountInfoSuccess: function(inSender, accountInfo) {
        // Store the account info in the global object
        if (findApps.UserSession.getAccountInfo() == null) findApps.UserSession.setAccountInfo(accountInfo);
        this.name = accountInfo.firstName + " " + accountInfo.lastName;
    },
    accountInfoFailure: function(inSender, inResponse) {
        this.error("ReportProblem : Could not fetch first name / last name. getAccountInfo failure. ", inResponse);
        this.name = "";
    },
    handleServerResponse: function(inSender, inResponse, inRequest, props) {
        this.$.sendReportButton.disabled = false;
        this.$.sendReportButton.removeClass('enyo-button-disabled');
        this.closePopup();
        if (this.appMetrics) this.appMetrics.trackNewScene("report_a_problem_submitted/" + this.appDetails.publicApplicationId);
    },
    handleServerError: function(inSender, inResponse, inRequest, props, errors) {
        this.$.sendReportButton.disabled = false;
        this.$.sendReportButton.removeClass('enyo-button-disabled');
        if (this.appMetrics) this.appMetrics.trackNewScene("report_a_problem_failed/" + this.appDetails.publicApplicationId);
        this.closePopup();
        errors.push("LOC07100");
        this.displayError(errors);
    },
    // Utility methods
    displayError: function(errors) {
        // Only if details view is at the top
        if (findApps.ViewLibrary._container.isTopView(this.owner.owner)) {
            this.$.error.displayError(errors);
        }
    },
    // Error dialog methods
    submitError: function() {
        this.$.error.cancel();
    },
    cancelError: function() {
        this.$.error.cancel();
    },
    showAlertPopup: function(title, message) {
        // Only if details view is at the top
        if (findApps.ViewLibrary._container.isTopView(this.owner.owner)) {
            this.$.alertPrompt.openAtCenter();
            this.$.alertTitle.setContent(title);
            this.$.alertMessage.setContent(message);
        }
    },
    dismissAlertPopup: function() {
        this.$.alertPrompt.close();
    },
    disableMe: function(disable) {
        if(disable) {
            this.$.reportProblemButton.disabled = true;
            this.$.reportProblemButton.addClass("enyo-button-disabled");
        } else {
            this.$.reportProblemButton.disabled = false;
            this.$.reportProblemButton.removeClass("enyo-button-disabled");
        }
    }
});
