enyo.kind({
	name: "ConnectPhone",
	className: "connect-phone",
	kind: "enyo.VFlexBox",
	firstLaunch: false,
	events: {
		onComplete: ""
	},
	components: [
		{name: "connectPhoneMsg", content:FirstLaunchConstants.PAIR_PHONE_MESSAGE, className:"accounts-body-title"},
		{name: "launchApp", kind: "Launcher", app: "com.palm.app.bluetooth"},
		{name: "connectPhoneButton", kind: "Button", label: FirstLaunchConstants.PAIR_PHONE_BUTTON_LABEL, onclick: "connectPhone", className:"accounts-btn"},
		{name: "telephony", kind: "PalmService", service: "palm://com.palm.telephony/", method: "platformQuery", onSuccess: "gotPlatformData", subscribe: true}
	],
	subscriptToTelephony: function() {
		this.$.telephony.call();
	},
	gotPlatformData: function(inSender, inResponse) {
		enyo.log("------------ platformDate: ", inResponse);
		if (inResponse && inResponse.extended && inResponse.extended.capabilities && inResponse.extended.capabilities.mapcenable) {
			this.connected = true;
			this.$.connectPhoneMsg.setContent(FirstLaunchConstants.SHOW_PHONE_MESSAGE);
			this.$.connectPhoneButton.setCaption(FirstLaunchConstants.SHOW_PHONE_BUTTON_LABEL);
		} else {
			this.connected = false;
			this.$.connectPhoneMsg.setContent(FirstLaunchConstants.PAIR_PHONE_MESSAGE);
			this.$.connectPhoneButton.setCaption(FirstLaunchConstants.PAIR_PHONE_BUTTON_LABEL);
		}
	},
	connectPhone: function(){
		if (this.connected) {
			this.doComplete();
		} else {
			this.$.launchApp.launch();
		}
	},
	accountsUpdated: function(ims) {
		if (this.firstLaunch) {
			this.setShowing(ims && ims.length === 0);
		}
	}
});
