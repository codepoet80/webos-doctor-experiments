enyo.kind({
    name: "Power",
    events: {onFinish: "", onPowerOff: ""},
    kind: "ModalDialog", lazy: false,
	className: "enyo-modaldialog enyo-popup popup",
	caption: rb.$L("Power off device?"),
	layoutKind:"VFlexLayout",
	showing: false,
    components: [
                 {kind: "HFlexBox", pack: "justify", style: "padding:15px 0 0 0;", components: [
                       {name: "turnOffButton", kind: "Button", caption: rb.$L("Turn Off"), className: "enyo-button-negative", style: "margin-right:10px;", flex: 1, onclick: "powerDownNow"},
                       {name: "cancelButton", kind: "Button", caption: rb.$L("Cancel"), flex: 1, onclick: "doFinish"}
                       ]
                 }
	],
	
	powerDownNow: function(inSender, inResponse){
		//this.$.turnOffButton.setDisabled(true); -- Client should put up a spinner instead.
		//this.$.cancelButton.setDisabled(true); -- Client should put up a spinner instead.
		this.close();
		this.doPowerOff();
	},
	
	powerDownResponse: function(inSender, inResponse){
		console.info("powerDownResponse: " + JSON.stringify(inResponse));
	},
	
	handlePowerServiceResponse: function(inSender, inResponse){
		console.info("handleGenericResponse: " + JSON.stringify(inResponse));
	}
});

