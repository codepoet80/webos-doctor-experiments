/**
 * ProfilePasswordPrompt.js
 * 
 * Please keep the style of this prompt in sync with In-App Payment:
 * subversion.palm.com/main/nova/palm/enyo-apps/com.palm.payment/trunk/app/src/ProfilePasswordPrompt.js
 */
enyo.kind({
    name: "findApps.ProfilePasswordPrompt",
    kind: enyo.Control,
    events: {
        onSubmit: "",
        onForgetPassword: "",
        onCancel: ""
    },
    components: [{
        kind: "Scrim",
        "animateShowing": false,
        name: "scrim",
        layoutKind: "VFlexLayout",
        align: "center",
        pack: "center",
        components: [{
            kind: "SpinnerLarge",
            name: 'spinner',
            showing: false
        }]
    }, {
        content: $L("Password Required"),
		className: "enyo-text-header",
        style: "text-align:center;"
    }, {
        content: $L("Please enter the password for this HP webOS Account:"),
		className: "enyo-paragraph"
    }, {
        name: "accntEmail",
		className: "enyo-text-subheader",
        style: "padding: 0 0 12px 0;"
    }, {
        kind: "PasswordInput",
		alwaysLooksFocused: true,
        hint: $L("Enter password"),
        onkeyup: "passwordKeyupHandler"
    }, {
        name: "errorLength",
        showing: false,
        content: $L("Password must be between 6 and 20 characters long."),
		className: "enyo-text-error",
        style: "padding: 3px 0;"
    }, {
        name: "errorIncorrect",
        showing: false,
        content: $L("Incorrect password. Please try again."),
		className: "enyo-text-error",
        style: "padding: 3px 0;"
    },{
        name: "errorMessage",
        showing: false,
        content: "",
		className: "enyo-text-error",
        style: "padding: 3px 0;"
    }, {
        kind: "VFlexBox",
        style: "padding-top: 6px;",
        components: [{
            kind: "Button",
			className: "enyo-button-affirmative",
            caption: $L("OK"),
            onclick: "passwordCheck"
        }, {
            name: "forgetPwd",
            kind: "Button",
            showing: false,
            caption: $L("Forgot Password"),
            onclick: "doForgetPassword"
        }, {
            kind: "Button",
            caption: $L("Cancel"),
            onclick: "doCancel"
        }, ]
    }],
    focusInput: function() {
        this.$.passwordInput.forceFocus();
    },
    passwordCheck: function(inSender) {
        this.doSubmit();
    },
    getPassword: function() {
        return this.$.passwordInput.getValue();
    },
    showLengthError: function() {
        this.$.errorMessage.setContent($L("Password must be between 6 and 20 characters long."));
        this.$.errorMessage.show();
        this.$.passwordInput.forceFocus();
    },
    showIncorrectError: function() {
        this.$.errorMessage.setContent($L("Incorrect password. Please try again."));
        this.$.errorMessage.show();
        this.$.passwordInput.forceSelect();
    },
    showOtherError: function(errorMessage) {
        this.$.errorMessage.setContent($L(errorMessage));
        this.$.errorMessage.show();
        this.$.passwordInput.forceFocus();
    },
    resetPassword: function() {
        this.$.errorMessage.hide();
        this.hideScrim();
        this.$.passwordInput.forceFocus();
        this.$.passwordInput.setValue("");
        this.$.forgetPwd.hide();
        this.$.accntEmail.setContent(findApps.UserProfile.email);
    },
    showScrim: function() {
        this.$.scrim.show();
        this.$.spinner.setShowing(true);
    },
    hideScrim: function() {
        this.$.scrim.hide();
        this.$.spinner.setShowing(false);
    },
    showForgetPasswordButton: function() {
        this.$.forgetPwd.show();
    },
    passwordKeyupHandler: function(inSender, inEvent) {
        if (inEvent.keyCode == "13") {
            this.doSubmit();
            inSender.forceBlur();
        }
    }
});
