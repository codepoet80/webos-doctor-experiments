enyo.kind({
	name: "puckInterface",
	kind: enyo.Component,
	components: [
		{name: "puckStatusSubscribe", kind: enyo.PalmService, service: "palm://com.palm.bus/signal/", method: "addmatch", subscribe: true, onSuccess: "onPuckEvent", onFailure: "onPuckEvent"},

		{name:"puckStateListeners", kind:"Utils.Dispatcher"},
	],
	create: function() {
		this.inherited(arguments);

		enyo.log("puck interface");

		this.puckConnected = false;
		this.usbConnected = false;

		this.$.puckStatusSubscribe.call({"category":"/com/palm/power", "method":"chargerStatus"});
	},

	dispatchPuckState: function(state) {
		this.$.puckStateListeners.dispatch(state);
	},

	addPuckStateListener: function(listener) {
		this.$.puckStateListeners.add(listener);
	},

	removePuckStateListener: function(listener) {
		this.$.puckStateListeners.remove(listener);
	},

	// if puck status has changed, and we only have 2 audio routes,
	// enable speakerphone on puck and disable it off puck
	onPuckEvent: function(inSender, response) {

		enyo.log("onPuckEvent");

		if (response) {
	            enyo.log( "ActiveCallAssistant#onPuckEvent" + response.type + response.connected);
		}

		if (response && response.type) {
			switch (response.type) {
				case "inductive":
					enyo.log("puck connected");
					this.puckConnected = response.connected;
					this.dispatchPuckState(response);
					break;
				case "usb":
					enyo.log("usb connected");
					this.usbConnected = response.connected;
					this.dispatchPuckState(response);
					break;
			}
		}
	},

	enableSpeakerphoneOnPuck: function() {
		if (this.puckConnected === true && enyo.application.Cache.audioActiveProfile !== "phone_back_speaker") {
			var scenarios = enyo.application.Cache.audioEnabledProfiles;
			if (Object.keys(scenarios).length == 2) {
				enyo.application.audioInterface.onAudioRouteChangeClick("phone_back_speaker");
			}
		}
	},

	changeAudio: function(response) {
		if (/*this.appAssistant.puckMode === true &&*/	response && response.type == "inductive") {
			var scenarios = enyo.application.Cache.audioEnabledProfiles;
			if (Object.keys(scenarios).length == 2) {
				enyo.application.audioInterface.onAudioRouteChangeClick(this.puckConnected ? "phone_back_speaker" : "phone_front_speaker");
			}
		}
	},

	isPuckConnected: function() {
		return this.puckConnected;
	},

	isUSBConnected: function() {
		return this.usbConnected;
	},
});


