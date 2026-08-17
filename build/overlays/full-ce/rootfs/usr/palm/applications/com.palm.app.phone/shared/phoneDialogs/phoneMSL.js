enyo.kind({
	name: "phoneMSL",
	kind: "Dialog",
	className: "enyo-dialog",
	scrim: true,
	events: {
		onSuccess: ""
	},
	components: [
		{kind: "Item", layoutKind: "HFlexLayout", components: [
			{className: "enyo-item top", style: "padding: 12px", content: $L("Master Subsidy Lock")},
		]},
		{kind: "Item", layoutKind: "HFlexLayout", components: [
			{kind: enyo.Label, flex: 2, content: $L("Enter the Master Subsidy Lock: ")},
			{kind: enyo.Input, flex: 1, name: "msl", hint: $L("msl code"), /*onchange: "mslEntered"*/},
		]},
		{kind: enyo.Label, name: "message", content: ""},
		{kind: "Button", className: "button-secondary", name: "okButton", caption: $L("Ok"), onclick: "handleSave"},
		{kind: "Button", className: "button-secondary", name: "closeButton", caption: $L("Close"), onclick: "handleClose"},

		{name: "telService", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "enterProgramMode", onSuccess: "doProgramming", onFailure: "doProgramming"}	
	],

	create: function() {
		this.inherited(arguments);
	},

	handleSave: function() {		
		this.msl = this.$.msl.getValue();
		if(this.msl) {
			this.$.message.setContent($L("Verifying MSL"));
			this.$.closeButton.disabled = true;
			this.$.okButton.disabled = true;
		
			//TelephonyCommands.enterProgramMode(this.msl, enyo.hitch(this, "doProgramming"));	
			this.$.telService.call({
				"msl": this.msl
			});
		}
	},
	
	doProgramming: function (inSender, response) {
		if (response.returnValue) {
			//this.sceneAssistant.verifiedMSL(true, this.msl);
			enyo.application.Cache.poundDataVerifiedMSL = true;
			this.$.message.setContent($L("Success"));
			this.handleClose();
			this.doSuccess();
		} else {
			//this.sceneAssistant.verifiedMSL(false, this.msl);
			this.$.message.setContent(enyo.application.Messages.serviceErrors[response.errorCode] || enyo.application.Messages.generalServiceError);
            this.$.closeButton.disabled = false;
			this.$.okButton.disabled = false;
			//this.$.msl.focus();
		}
	},
	
	///mslEntered: function(event) {
		//if (event /*&& Mojo.Char.isEnterKey(event.originalEvent.keyCode)*/) {
		//	this.handleSave();
		//}
	//},
	
	handleClose: function() {
		this.close();
	},
});

