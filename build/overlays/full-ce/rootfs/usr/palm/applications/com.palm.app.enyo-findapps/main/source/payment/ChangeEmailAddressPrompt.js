/**
 * ChangeEmailAddressPrompt.js
 */
enyo.kind({
    name: "findApps.ChangeEmailAddressPrompt",
    kind: enyo.Control,
    events: {
        onEmailChanged: "",
        onCancel: ""
    },
    components: [{
        name: "errorHandler",
        kind: "findApps.Error"
    }, {
        content: $L("Change Email Address"),
        pack: 'center',
        align: 'center',
        className: "enyo-text-header",
        style: "text-align:center;"
    }, {	
		className: "enyo-paragraph",
        content: $L("Enter a valid email address. This is where receipts will be sent.")
    },
    {
        kind: "Control", 
        className: "form-row", 
        components: [
        {
            content: $L('Email'),
            className: "enyo-subtext",
            style: "font-size: 16px;"
        },
        {
            name: "emailAddress",
            kind: "Input",
            inputType: "email",
            alwaysLooksFocused: true,
            hint: '',
            autoCapitalize: "lowercase",
            autocorrect: false, 
            spellcheck: false
        },
        ]
        },

        {
        kind: "Control", 
        className: "form-row", 
        components: [
        {
            content: $L('Confirm Email'),
            className: "enyo-subtext",
            style: "font-size: 16px;"
        },
        {
            name: "emailAddressAgain",
            kind: "Input",
            inputType: "email",
            alwaysLooksFocused: true,
            hint: '',
            autoCapitalize: "lowercase",
            autocorrect: false, 
            spellcheck: false
        }
        ]
        }, 

    // Error message
    {  
        kind: "HFlexBox",
        name: "errorMessageBar",
        showing: false,
        components: [{
            kind: enyo.Image, 
            src: "images/header-warning-icon.png",
        }, {
            name: "errorMessage",
            content: "",
            className: "enyo-text-error",
            style: "padding: 6px 0 0 3px;"
        }]
    },
    //
    {
        kind: "VFlexBox",
        style: "padding-top: 6px;",
        components: [{
            kind: "Button",
            className: "enyo-button-affirmative",
            caption: $L("OK"),
            onclick: "_validateEmail"
        }, ]
    },	{
        kind: "VFlexBox",
        components: [{
            kind: "Button",
            caption: $L("Cancel"),
            onclick: "doCancel"
        }, ]
    },],
    _validateEmail: function() {
        var email1 = this.$.emailAddress.getValue();
        var email2 = this.$.emailAddressAgain.getValue();
        if (email1.search(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i) == -1) {
            this._setErrors(2);
        } else if (email1 == email2) {
            if (findApps.AccountServices.embargoedList) {
                this.handleEmbargoAcc();
            } else {
                findApps.BaseServer.getPMTServer().getEmbargoedEmailExtensions("embargoedExt", {
                    onSuccess: "processResponse",
                    onFailure: "handleFailure",
                    scope: this
                });
            }
        } else this._setErrors(1);
    },
    handleEmbargoAcc: function() {
        var email1 = this.$.emailAddress.getValue();
        var ext = email1.substring(email1.lastIndexOf(".") + 1);
        var isEmbargoed = findApps.AccountServices.embargoedList.indexOf(ext) != -1;
        if (isEmbargoed) {
            this._setErrors(3);
        } else {
            this._changeEmail();
        }
    },
    _changeEmail: function() {
        findApps.BaseServer.getPMTServer().setInvoiceEmail(this.$.emailAddress.getValue(), "InvoiceEmail", {
            onSuccess: "processResponse",
            onFailure: "handleFailure",
            scope: this
        });
    },
    _setErrors: function(errno) {
        switch (errno) {
            case 0:
                this.$.errorMessage.setContent("");
                this.$.errorMessageBar.hide();
                break;
            case 1:
                this.$.errorMessage.setContent(findApps.ChangeEmailAddressPrompt.emailNotSameError);
                this.$.errorMessageBar.show();
                break;
            case 2:
                this.$.errorMessage.setContent(findApps.ChangeEmailAddressPrompt.emailNotValidError);
                this.$.errorMessageBar.show();
                break;
            case 3:
                this.$.errorMessage.setContent(findApps.ChangeEmailAddressPrompt.embargoedAddError);
                this.$.errorMessageBar.show();
                break;
            default:
                break;
        }
        this.$.emailAddress.forceFocus();
    },
    processResponse: function(inSender, inResponse, inRequest, inProps) {
        if (inResponse.OutGetEmbargoedEmailExtensions) {
            findApps.AccountServices.embargoedList = inResponse.OutGetEmbargoedEmailExtensions.embargoedEmailExtensions;
            this.handleEmbargoAcc();
        } else if (inResponse.OutSetUserInfo) {
            if (findApps.UserProfile.validPayment.OutGetPaymentInfos) {
                findApps.UserProfile.validPayment.OutGetPaymentInfos.invoiceEmail = this.$.emailAddress.getValue();
            }
            this.doEmailChanged();
        }
    },
    // This method clears the text fields for email addresses
    reset: function() {
    	// Clear any error message content if any
    	this._setErrors(0);
        this.$.emailAddress.setValue("");
        this.$.emailAddressAgain.setValue("");
        this.$.emailAddress.forceFocus();
    },
    handleFailure: function(inSender, inResponse, inRequest, inProps, errors) {
        var err = inResponse.JSONException.errorCode ? inResponse.JSONException.errorCode : inResponse;
        if (err === "PMT04800") {
            errors.push("LOC02023");
        } else {
            errors.push("LOC02022");
        }
        this.$.errorHandler.displayError(errors);
    }
});
findApps.ChangeEmailAddressPrompt.emailNotSameError = $L("Email addresses do not match.");
findApps.ChangeEmailAddressPrompt.emailNotValidError = $L("Please enter a valid email address.");
findApps.ChangeEmailAddressPrompt.embargoedAddError = $L("The United States Government restricts exports to certain countries, including the country where your email address domain is issued.");
