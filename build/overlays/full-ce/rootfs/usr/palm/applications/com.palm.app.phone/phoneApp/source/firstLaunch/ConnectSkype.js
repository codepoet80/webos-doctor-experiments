enyo.kind({
	name: "ConnectSkype",
	kind: "enyo.VFlexBox",
	components: [
		{content:FirstLaunchConstants.CONNECT_SKYPE_MESSAGE, style: "padding: 20px 0 10px 0"},
		{name: "launchApp", kind: "Launcher", app: "com.palm.app.skype"},

                // this is probably not a button but something else
		//{kind: "Button", label: $L("Skype Mobile"), onclick: "connectSkype"},
		{label: $L("Skype Mobile"), kind: "Button", onclick: "connectSkype"},
		//{name: "telephony", kind: "PalmService", service: "palm://com.palm.telephony/", method: "platformQuery", onSuccess: "gotPlatformData", subscribe: true}
	],
	create: function() {
		this.inherited(arguments);
		//this.$.telephony.call();
	},

	//gotPlatformData: function(inSender, inResponse) {
	//	enyo.log("----------- platformData for BT connect phone: " + enyo.json.stringify(inResponse));
	//	this.setShowing(this.shouldDisplay(inResponse));
	//},

	shouldDisplay: function(inResponse) {
		if (!inResponse.extended || !inResponse.extended.platformType || !inResponse.extended.platformType.capabilities) {
			// always show connect phone section if we can't get enough information from telephony 
			return true;
		}
		
		// show connect phone section if phone is not paired
		return  inResponse.extended.platformType.capabilities.hfenable === false;
	},
	connectSkype: function(){
		this.$.launchApp.launch();
	}
});
