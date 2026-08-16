/**
 * PasswordResetPrompt.js
 * 
 * Please keep the style of this prompt in sync with In-App Payment:
 * subversion.palm.com/main/nova/palm/enyo-apps/com.palm.payment/trunk/app/src/PasswordResetPrompt.js
 */
enyo.kind({
    name: "findApps.PasswordResetPrompt",
    kind: enyo.Control,
    events: {
        onSubmit: "",
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
        content: $L("Change Password"),
		className: "enyo-text-header",
        style: "text-align:center;"
    }, {
		kind: "Control", 
		className: "form-row", 
		components: [
			{
				content: $L('Password'),
				className: "enyo-subtext",
				style: "font-size: 16px;",
		        onkeyup: "keyupNP"
			},
			{
		        name: "newPassword",
		        kind: "PasswordInput",
				alwaysLooksFocused: true,
		        hint: '',
		        autoCapitalize: "lowercase",
				autocorrect: false, 
				spellcheck: false
		    },
	]}, {
		kind: "Control", 
		className: "form-row", 
		components: [
			{
				content: $L('Verify Password'),
				className: "enyo-subtext",
				style: "font-size: 16px;",
		        onkeyup: "keyupNP"
			},
			{
		        name: "confirmPassword",
		        kind: "PasswordInput",
				alwaysLooksFocused: true,
		        hint: '',
		        autoCapitalize: "lowercase",
				autocorrect: false, 
				spellcheck: false
		    },
	]}, {
        name: "noPasswordMessage",
        showing: false,
        content: $L("Please enter a password."),
        className: "enyo-text-error",
		style: "padding: 3px 0;"
    }, {
        name: "passwordLengthError",
        showing: false,
        content: $L("Password must be between 6 and 20 characters long."),
        className: "enyo-text-error",
		style: "padding: 3px 0;"
    }, {
        name: "mismatchMessage",
        showing: false,
        content: $L("Passwords do not match."),
        className: "enyo-text-error",
		style: "padding: 3px 0;"
    }, {
        name: "noConfirmMessage",
        showing: false,
        content: $L("Please confirm password."),
        className: "enyo-text-error",
		style: "padding: 3px 0;"
    }, {
        name: "systemErrorMessage",
        showing: false,
        content: $L("Unable to change password. Try again."),
        className: "enyo-text-error",
		style: "padding: 3px 0;"
    }, {
        kind: "VFlexBox",
        style: "padding-top: 6px;",
        components: [{
            kind: "Button",
			className: "enyo-button-affirmative",
            caption: $L("Change Password"),
            onclick: "submitResetPassword"
        }, ]
    },	{
        kind: "VFlexBox",
        components: [{
            kind: "Button",
            caption: $L("Cancel")
        }, ]
    }
	],
    focusInput: function() {
        this.$.newPassword.forceFocus();
    },
    keyupNP: function(inSender, inEvent) {
        if (inEvent.keyCode == "13") {
            this.$.confirmPassword.forceFocus();
        }
    },
    keyupNPConfirm: function(inSender, inEvent) {
        if (inEvent.keyCode == "13") {
            inSender.forceBlur();
            this.submitResetPassword();
        }
    },
    getNewPassword: function() {
        return this.$.newPassword.getValue();
    },
    getConfirmPassword: function() {
        return this.$.confirmPassword.getValue();
    },
    resetPassword: function() {
        this.$.password.setValue("");
        this.$.passwordAgain.setValue("");
        this.clearErrorMessages();
        this.$.newPassword.forceFocus();
    },
    showSystemErrorMessages: function() {
        this.$.systemErrorMessage.setShowing(true);
    },
    clearErrorMessages: function() {
        this.$.mismatchMessage.setShowing(false);
        this.$.noPasswordMessage.setShowing(false);
        this.$.noConfirmMessage.setShowing(false);
        this.$.systemErrorMessage.setShowing(false);
        this.$.passwordLengthError.setShowing(false);
    },
    showScrim: function() {
        this.$.scrim.show();
        this.$.spinner.setShowing(true);
    },
    hideScrim: function() {
        this.$.scrim.hide();
        this.$.spinner.setShowing(false);
    },
    submitResetPassword: function(inSender) {
        this.newPassword = this.getNewPassword();
        this.confirmPassword = this.getConfirmPassword();
        this.clearErrorMessages();
        if (this.newPassword == "" || this.newPassword == undefined) {
            this.$.noPasswordMessage.setShowing(true);
            this.$.newPassword.forceFocus();
            return;
        } else if ((this.newPassword.length < 6) || (this.newPassword.length > 20)) {
            this.$.passwordLengthError.setShowing(true);
            this.$.newPassword.forceSelect();
            return;
        } else if (this.confirmPassword == "" || this.confirmPassword == undefined) {
            this.$.noConfirmMessage.setShowing(true);
            this.$.confirmPassword.forceFocus();
            return;
        } else if (this.newPassword != this.confirmPassword) {
            this.$.mismatchMessage.setShowing(true);
            this.$.confirmPassword.forceSelect();
            return;
        } else {
            this.doSubmit();
        }
    }
});
