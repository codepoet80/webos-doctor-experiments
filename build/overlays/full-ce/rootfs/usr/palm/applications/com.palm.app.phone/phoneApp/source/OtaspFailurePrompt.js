/*globals enyo */

enyo.kind({
	name: "OtaspFailurePrompt",
	kind: enyo.Dialog,
	modal: true,
	components: [
		{name: "title", content: $L("Dialing Disabled"), className: "enyo-dialog-prompt-title"},
		{className: "enyo-dialog-prompt-content", components: [
			{name: "message", content: $L("The number you are trying to call cannot be tried again until you restart your phone."), className: "enyo-dialog-prompt-message"},
			{name: "restartButton", kind: "Button", className:"enyo-button-affirmative", caption: $L("Restart"), onclick:"rebootDevice"},
		]},
		{name:"rebootDevice", kind:enyo.PalmService, service:"palm://com.palm.power/shutdown/", method:"machineReboot", onSuccess:"logResponse", onFailure: "logResponse"},
	],

	create: function() {
		this.inherited(arguments);
	},

	rebootDevice: function(){
		this.$.rebootDevice.call({'reason':'User initiated/PhoneApp'});
	}
});