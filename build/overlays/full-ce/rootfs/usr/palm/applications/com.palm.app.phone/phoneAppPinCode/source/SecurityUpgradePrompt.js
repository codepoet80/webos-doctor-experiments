
enyo.kind({
	name: "SecurityUpgradePrompt",
	kind: enyo.Dialog,
	modal: true,
	lazy: false,
	published: {
		title: "",
		policy: ""
	},
	events: {
		onPin: "",
		onPassword: "",
		onEmergency: ""
	},
	components: [
		{name: "title", className: "enyo-dialog-prompt-title"},
		{className: "enyo-dialog-prompt-content", components: [
			{name: "message", className: "enyo-dialog-prompt-message"},
			{name: "pinButton", kind: "Button", className:"enyo-button-affirmative", caption: $L("Set Pin"), onclick:"selectPin"},
			{name: "passwordButton", kind: "Button", className:"enyo-button-affirmative", caption: $L("Set Password"), onclick:"selectPassword"},
			{name: "emergencyButton", kind: "Button", caption: $L("Emergency Call"), onclick:"selectEmergency"}
		]}
	],
	titleChanged: function() {
		this.$.title.setContent(this.title);
	},
	policyChanged: function() {
		if (this.policy.password && this.policy.password.alphaNumeric === true) {
			this.$.pinButton.hide();
			this.$.message.setContent($L("A security policy has been implemented for your Exchange ActiveSync account. You must set a password to continue using it."));
		} else {
			this.$.message.setContent($L("A security policy has been implemented for your Exchange ActiveSync account. You must set a password or PIN to continue using it."));
		}
	},
	selectPin: function() {
		this.doPin();
		this.close();
	},
	selectPassword: function() {
		this.doPassword();
		this.close();
	},
	selectEmergency: function() {
		this.doEmergency();
		this.close();
	}
});


enyo.kind({
	name: "SecurityUpgradeOnCallPrompt",
	kind: enyo.DialogPrompt,
	modal: true,
	lazy: false,
	message: $L("A new security policy has been implemented for your Exchange ActiveSync account.  When you end the call, you will be able to change your password."),
	acceptButtonCaption: $L("OK")
});
