

//called from Dialpad, audioPlayer, active call


enyo.kind({
	name: "proxInterface",
	kind: enyo.Component,
	components: [
		{name: "proxSet", kind: enyo.PalmService, service: "palm://com.palm.display/control/", method: "setProperty", subscribe: true},

		{name:"proxStateListeners", kind:"Utils.Dispatcher"},
	],
	create: function() {
		this.inherited(arguments);

		enyo.log("proximity sensor interface");

		this.proxSubscription = false;
	},

	dispatchProxState: function(state) {
		this.$.proxStateListeners.dispatch(state);
	},

	addProxStateListener: function(listener) {
		this.$.proxStateListeners.add(listener);
	},

	removeProxStateListener: function(listener) {
		this.$.proxStateListeners.remove(listener);
	},
	// called on dialing and when audio scenario changes
	// if we're on a call, and the audio scenario is the front speaker
	// turns proximity sensor on
	enableProxOnCallAndAudio: function(scenario) {
		enyo.log( "TEL#enableProxOnCallAndAudio " + scenario);
		if (!(scenario)) {
			scenario = enyo.application.Cache.audioActiveProfile;
			if (!(scenario)) {
				// if we're not on the puck, there are only two profiles available, and one of them is the front speaker,
				// assume that the current profile is phone_front_speaker
				var profiles = enyo.application.Cache.audioEnabledProfiles;
				
				if (!enyo.application.puckInterface.isPuckConnected()
					&& Object.keys(profiles).length == 2 				
					&& profiles["phone_front_speaker"] == true) {
					scenario = "phone_front_speaker";
				} else {
					return;
				}
			}
		}
		
		if (enyo.application.CallSynergizer.isPendingOrActive()) {
			if (scenario == "phone_front_speaker") {
				this.proxOn();
			} else {
				enyo.log( "TEL#enableProxOnCallAndAudio not enabled: " + scenario);
				this.proxOff();
			}
		} else {
			enyo.log( "TEL#enableProxOnCallAndAudio no call, doing nothing");
		}
	},

	proxOn: function() {
		if (!this.proxSubscription) {
			enyo.log( "TEL#proxOn");
			this.$.proxSet.call({'proximityEnabled': true, 'client': "phoneapp"});
			this.proxSubscription = true;
		} else {
			enyo.log( "TEL#proxOn - already on");
		}
	},
	
	proxOff: function() {
		if (this.proxSubscription) {
			enyo.log( "TEL#proxOff");
			this.$.proxSet.cancel();
			this.proxSubscription = false;
		}
	}
});


