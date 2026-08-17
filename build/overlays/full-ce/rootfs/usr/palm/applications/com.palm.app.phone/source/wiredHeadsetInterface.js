enyo.kind({
	name: "wiredHeadsetInterface",
	kind: enyo.Component,
	components: [
		{name: "wiredStatusSubscribe", kind: enyo.PalmService, service: "palm://com.palm.keys/headset/", method: "status", subscribe: true, onSuccess: "onWiredButtonEvent", onFailure: "onWiredButtonEvent"},

		{name:"wiredStateListeners", kind:"Utils.Dispatcher"},
	],
	create: function() {
		this.inherited(arguments);

		enyo.log("wiredHeadsetInterface");
		this.$.wiredStatusSubscribe.call({});
	},

	dispatchWiredState: function(state) {
		this.$.wiredStateListeners.dispatch(state);
	},

	addWiredStateListener: function(listener) {
		this.$.wiredStateListeners.add(listener);
	},

	removeWiredStateListener: function(listener) {
		this.$.wiredStateListeners.remove(listener);
	},
		
	// disconnects call on press of wired button if there's no incoming call
	onWiredButtonEvent: function(inSender, response) {
		if (response && response.key == "headset_button") {
			if (response.state == "single_click" && enyo.application.CallSynergizer.callExists() && !(enyo.application.CallSynergizer.incomingLine())) {
				 enyo.application.CallSynergizer.geniusDisconnect();
			} else if (response.state == "hold") {
				// TODO: voice dial?
			}
		}
	}
});


