enyo.kind ({
	name: "SetPasswordDialog", 
	kind: enyo.Dialog,
	modal: true,
	published: {
		policy: ""
	},
	events: {
		onDone: "",
		onCancel: ""
	},
	components: [		
		{name: "title", content: $L("Set Password"), className: "enyo-dialog-prompt-title"},
		{name: "hint", className: "enyo-dialog-prompt-message"},
		{name: "error", showing: false},
		{name: "password", kind: "PasswordInput", hint: $L("enter password...")},
		{name: "passwordconfirm", kind: "PasswordInput", hint: $L("confirm password...")},
		{name: "acceptButton", content:$L("Done"), className:"enyo-button-affirmative", kind: "Button", onclick: "acceptClick"},
		{name: "cancelButton", content:$L("Cancel"), kind: "Button", onclick: "cancelClick"},
		{name: "setPassword", kind:"PalmService", service:"palm://com.palm.systemmanager/", method: "setDevicePasscode", onSuccess:"setPasswordSuccess", onFailure: "setPasswordFailure"}
	],
	policyChanged: function() {
		if ( this.policy.alphaNumeric === true ) {
			if ( this.policy.minLength > 1 ) {
				this.$.hint.setContent(enyo.application.Utils.interpolate($L("Password must be #{len} or more characters long and contain both numbers and letters."),{
					len: this.policy.minLength
				}));
			} else {
				this.$.hint.setContent($L("Password must contain both numbers and letters."))
			}
		} else {
			if ( this.policy.minLength > 1 ) {
				this.$.hint.setContent(enyo.application.Utils.interpolate($L("Password must be #{len} or more characters long."),{
					len: this.policy.minLength
				}));
			}
		}
	},
	acceptClick: function() {
		if (this.$.password.getValue() !== this.$.passwordconfirm.getValue()){
			this.setErrorMessage($L("Passwords do not match."));
		} else {
			this.$.setPassword.call({
				passCode: this.$.password.getValue(),
				lockMode: "password"
			});
		}
	},
	cancelClick: function(inSender) {
		this.setErrorMessage();
		this.doCancel();
		this.close();
	},
	setPasswordSuccess: function(inSender) {
		this.setErrorMessage()
		this.doDone();
		this.close();
	},
	setPasswordFailure: function() {
		this.setErrorMessage($L("Password does not match security requirements."));
	},
	// resets and sets error message, if one defined
	setErrorMessage: function(message) {
		this.$.password.setValue('');
		this.$.passwordconfirm.setValue('');
		this.$.error.setContent(message || '');
		this.$.error.setShowing(!!message);
	}
}); 
