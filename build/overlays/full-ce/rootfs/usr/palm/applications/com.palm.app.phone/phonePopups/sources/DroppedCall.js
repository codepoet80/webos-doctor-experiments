enyo.kind({
	name: "DroppedCall",
	kind: "VFlexBox",
	pack: "justify",
	className: "popups-bg dropped-call",
	statics: {
		kTimeoutMs: 20000
	},
	published: {
		localizedErrorText: {
		        "noservice": $L("Call failed: no service"),
		        "fadedservice": $L("Call dropped: signal faded"),
		        "networkbusy": $L("Call failed: network busy"),
		        "barred": $L("Call barred by network"),
		        "busy": $L("Line is busy"),
		        "noanswer": $L("No answer"),
		        "dropped": $L("Call dropped"),
		        
		        //Newely added codes
		        "authfailed" : $L("Call to this address cannot be placed without authorization"),
			"destinationerror" : $L("Call failed: Destination Error"),
			"emergency" : $L("Emergency calls only"),
			"modemerror" : $L("Call failed"),
			"networkbusy" : $L("Network is busy"),
			"nofunds" : $L("Call failed: Insufficient funds"),
			"noroute" : $L("Call failed: No route"),
			"numbererror" : $L("Call failed: Address Error"),
			"outoforder" : $L("Call failed: Out of order"),
			"phoneLockedUntilReboot" : $L("Phone is locked. Please Reboot"),
			"rejected" : $L("Call Failed: \nRejected by Network"),
			"simmissing" : $L("Call failed: SIM missing"),
			"temporary" : $L("Call failed: Temporary Error"),
			"timeout" : $L("Call failed: Timeout"),
			"unknown" : $L("Call failed")
                }
	},
	components: [
		{kind: "CustomButton", name: "lockScreenContent", layoutKind: "VFlexLayout", pack: "start", className: "notification-box", components: [
			{kind: "HFlexBox", pack: "start", align: "center", components: [
				{kind: "CustomButton", style: "margin 5px;", className: "dropped-call-frame", onclick: "openContact"} ,
				{kind: "VFlexBox", flex: 1, pack: "start", style: "margin: 10px;", components: [    
					{name: "dropped_message", className: "title dropped-call-message"},
					{name: "displayNumber", className: ""},
					{name: "displayLabel", className: "dropped-call-label truncating-text"}
				]},
			]}
		]},
		{components: [
			{kind: "Button", layoutKind: "VFlexLayout", pack: "center", className: "enyo-button-dark notification-button", caption: $L("Ok"), onclick: "onCancel"},
			{kind: "Button", name: "redial_button", layoutKind: "VFlexLayout", pack: "center", className: "enyo-button-affirmative affirmative-button", caption: $L("Redial"), onclick: "onRedial"},
		]},

		//Service calls		
		{name: "displayOn", kind:"PalmService", service:"palm://com.palm.display/control/", method: "setState", onSuccess: "", onFailure: ""}
	],
	create: function() {
		this.inherited(arguments);
		
		enyo.log("DroppedCall popup");		
		enyo.require(enyo.windowParams.line, "Dropped call notification - params missing");
		
		//Workaround: Changed 2nd param to "01" from "", because enyo thinks 2nd param is null and removes the attribute, and has no effect.
		this.$.lockScreenContent.setAttribute("x-palm-popup-content","01"); //informs lunasysmgr the content to show in lock screen	
		
		// turn display on
		this.$.displayOn.call({	"state": "on" });
	
		this.DroppedLine = enyo.windowParams.line;
		var call = this.DroppedLine.calls[0], disconnectErrorMessage;

		//call.contact.decorated(function(line) {
			var contactname = call.contact.name || call.contact.displayName || call.contact.addressFormatted || call.contact.address || "Unknown";
			this.$.displayNumber.setContent(contactname);
			this.$.displayLabel.setContent(call.contact.locationFormatted || "");
		//});
		
		if ( !call.contact.canBeCalled() ) {
			this.$.redial_button.hide();
		}
	
		var message = this.localizedErrorText[this.DroppedLine.disconnectDetails.cause] || $L("Call dropped");
		this.$.dropped_message.content = message;
		//enyo.log(message + " cause : " + this.DroppedLine.disconnectDetails.cause + " causeErrorText" + this.DroppedLine.disconnectDetails.causeErrorText);
		
		// stay up for sometime
		this.droppedTimeout = window.setTimeout(enyo.hitch(this, "closeWindow"), DroppedCall.kTimeoutMs);
	},
	
	destroy: function () {
		window.clearTimeout(this.droppedTimeout);
		this.droppedTimeout = undefined;
		this.inherited(arguments);
	},
	
	closeWindow: function () {
		close();
	},

	onCancel: function () {
		close();
	},

	onRedial: function () {
		var call = this.DroppedLine.calls[0];
		enyo.application.CallSynergizer.dial(call.contact.address, call.isVideo ? true : undefined, undefined, call.transport);
		close();
	},
	
	openContact: function() {
        	this.DroppedLine.calls[0].contact.launchInContactsApp();
		close();
	},
});


