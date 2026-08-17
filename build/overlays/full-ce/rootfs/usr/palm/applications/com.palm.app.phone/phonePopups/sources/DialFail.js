enyo.kind({
	name: "DialFail",
	kind: "VFlexBox",
	pack: "justify",
	className: "dialfail-popups-bg",
	published: {
		callFailErrorMessage: {
			//"callfailed": $L("Call failed."),
			"callfailed": $L("Call cannot be placed through this device.\nPlease try placing the call through your phone instead"),
			"airplanemodeon": $L("Airplane mode is on."),
			"locked": $L("Phone is locked."),
			"noservice": $L("No service."),
			"invalidnumber": $L("Number not on fixed dialing list."),
			"emergencyonly": $L("Emergency calls only."),
			"nofreelines": $L("No free lines."),
			"pinrequired": $L("PIN required."),
			"pukrequired":	$L("Call service provider for PUK code."),
			"simblocked": $L("SIM permanently blocked"),
			"rebootdevice": $L("The number you are trying to call cannot be tried again until you restart your phone."),
			"networkunavailable": $L("The network is unavailable."),
			"addressrequiresauth": $L("Call to this address cannot be placed without authorization"),
			"authrequired":	$L("User must login/enter authorization code to proceed"),
			"serviceauthrequired": $L("User must get authorization code from network provider to proceed"),
			"disabled": $L("transport/account on transport is permanently blocked"),
			"notloggedin": $L("Not logged in."),
			"contactnotfound": $L("Contact not found."),
			"invalidaddress": $L("Invalid address."),
			"insufficientfunds": $L("Insufficient funds.")
		}
	},
	components: [
		{layoutKind: "VFlexLayout", name: "lockScreenContent", pack: "center", className: "notification-text-container", components: [
			{layoutKind: "HFlexLayout", pack: "justify", align: "center", flex: 1, components: [
				{layoutKind: "VFlexLayout", align: "start", flex: 1, components: [
					{content:$L("Unable to connect"), className: "title"},
					{name: "dialFail_message", className: "msg-text"},					
				]},
				{className: "dialfail-frame"}
			]}
		]},
		{kind: "Button", layoutKind: "VFlexLayout", pack: "center", className: "enyo-button-dark", caption: $L("Ok"), onclick: "onOK"},	

		//Service calls
		{name: "displayOn", kind:enyo.PalmService, service:"palm://com.palm.display/control/", method: "setState"}
	],

	create: function() {
		this.inherited(arguments);

		enyo.log("DialFail popup");
		enyo.require(enyo.windowParams.line, "DialFail notification - params missing");
		
		//Workaround: Changed 2nd param to "01" from "", because enyo thinks 2nd param is null and removes the attribute, and has no effect.
		this.$.lockScreenContent.setAttribute("x-palm-popup-content","01"); //informs lunasysmgr the content to show in lock screen
		
		var payload = enyo.windowParams.line;
		
		// turn display on
		this.$.displayOn.call({"state": "on"});
		
		//TODO: payload.dialFailDetails needs to be revisited
		enyo.log("payload errorString "+payload.errorString);
		var message = this.callFailErrorMessage[payload.errorString] || $L("Call failed.");
		//This is a temp workaround for Topaz bug DFISH-3842.  The message will be finalized
		//later by HI and we'll re-do the errorString as well.
		if (payload.errorCode == 33) {
			message =$L("Cannot send voice over paired phone or no phone is paired"); 
		}
		this.$.dialFail_message.content = message;
	},

	onOK: function () {
		close();
	}
});


