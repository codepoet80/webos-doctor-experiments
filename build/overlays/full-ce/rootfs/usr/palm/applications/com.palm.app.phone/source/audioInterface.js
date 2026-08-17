enyo.kind({
	name: "audioInterface",
	kind: enyo.Component,
	statics: {
		audioPhone_uri: "palm://com.palm.audio/phone/",
		audioMedia_uri: "palm://com.palm.audio/media/",
		audioVvm_uri: "palm://com.palm.audio/vvm/",
	},
	components: [
		{name: "registerServiceStatus", kind: enyo.PalmService, service: "palm://com.palm.bus/signal/", method: "registerServerStatus", onSuccess: "onAudiodEvent", onFailure: "onAudiodEvent"},

		{name: "subscribeAudioRouting", kind: enyo.PalmService, method: "status", subscribe: true, onSuccess: "onAudioNotification", onFailure: "onAudioNotification"},

		{name: "AudioRoutingListScenarios", kind: enyo.PalmService, method: "listScenarios", onSuccess: "onListScenarios", onFailure: "onListScenarios"},

		{name: "setCurrentScenario", kind: enyo.PalmService, method: "setCurrentScenario", onSuccess: "", onFailure: ""},

		{name:"audioStateListeners", kind:"Utils.Dispatcher"},
		{name:"audioStateMediaListeners", kind:"Utils.Dispatcher"},
		{name:"audioStateVvmListeners", kind:"Utils.Dispatcher"},
	],

	create: function() {
		this.inherited(arguments);

		this.audiodConnected = false;

		this.$.registerServiceStatus.call({
			"serviceName": "com.palm.audio"
		});
	},

	destroy: function() {
		this.$.registerServiceStatus.cancel();
		this.$.subscribeAudioRouting.cancel();
		this.inherited(arguments);
	},

	dispatchAudioState: function(profile) {
		if(profile != null) {
			this.$.audioStateListeners.dispatch(profile);
		}
	},

	dispatchAudioMediaState: function(profile) {
		if(profile != null) {
			this.$.audioStateMediaListeners.dispatch(profile);
		}
	},

	dispatchAudioVvmState: function(profile, active) {
		if(profile != null) {
			this.$.audioStateVvmListeners.dispatch(profile, active);
		}
	},

	addAudioStateListener: function(listener) {
		this.$.audioStateListeners.add(listener);
	},

	addAudioStateMediaListener: function(listener) {
		this.$.audioStateMediaListeners.add(listener);
	},

	addAudioStateVvmListener: function(listener) {
		this.$.audioStateVvmListeners.add(listener);
	},

	removeAudioStateListener: function(listener) {
		this.$.audioStateListeners.remove(listener);
	},

	removeAudioStateMediaListener: function(listener) {
		this.$.audioStateMediaListeners.remove(listener);
	},

	removeAudioStateVvmListener: function(listener) {
		this.$.audioStateVvmListeners.remove(listener);
	},

	onAudiodEvent: function(inSender, result) {
		enyo.application.Cache.audioEnabledProfiles = new Object();
		enyo.application.Cache.audioActiveProfile = null;
		enyo.application.Cache.audioMediaEnabledProfiles = new Object();
		enyo.application.Cache.audioVvmEnabledProfiles = new Object();

		if (result.connected == true && this.audiodConnected == false) {

			this.audiodConnected = true;

			this.$.AudioRoutingListScenarios.call({
					"enabled": true
				},{
					service: audioInterface.audioPhone_uri,
				});
			this.$.AudioRoutingListScenarios.call({
					"enabled": true
				},{
					service: audioInterface.audioMedia_uri,
				});
			this.$.AudioRoutingListScenarios.call({
					"enabled": true
				},{
					service: audioInterface.audioVvm_uri,
				});

			this.$.subscribeAudioRouting.call({
				},{
					service: audioInterface.audioPhone_uri,
				});

			this.$.subscribeAudioRouting.call({					
				},{
					service: audioInterface.audioMedia_uri,
				});
				
			this.$.subscribeAudioRouting.call({					
				},{
					service: audioInterface.audioVvm_uri,
				});
				
		} else if (result.connected == false) {
			this.audiodConnected = false;
		}
	},

	onAudioNotification: function(inSender, payload, request) {

		//enyo.log("onAudioNotification");

		if (!payload || !payload.returnValue) {
			enyo.error("PhoneApp:handleAudioNotification Error");
			return;
		}

		if(request.service == audioInterface.audioPhone_uri) {

			var audioProfiles = enyo.application.Cache.audioEnabledProfiles;

			if (payload.muted != undefined && payload.active != undefined) {
				this.muted = payload.muted && payload.active;
			}

			//enyo.log(request.service +  payload.scenario + payload.action);
			switch (payload.action) {
				//case "requested":
				case "changed":
					// Update the active scenario
					if (payload.active != undefined) {
						if (payload.active) {
							// Clear the previously active profile (if any)
							if (enyo.application.Cache.audioActiveProfile)
								audioProfiles[enyo.application.Cache.audioActiveProfile] = true;
							// Mark the new profile as active
							//remove following condition
							//if (audioProfiles[payload.scenario] != undefined)
								audioProfiles[payload.scenario] = "active";
							// Save the active audio profile
							enyo.application.Cache.audioActiveProfile = payload.scenario;
							// Notify whoever cares
							this.dispatchAudioState(payload.scenario);

							enyo.application.proxInterface.enableProxOnCallAndAudio(payload.scenario);
						} else {
							//add following condition 
							if (payload.scenario == enyo.application.Cache.audioActiveProfile)
								enyo.application.Cache.audioActiveProfile = null;

							if (audioProfiles[payload.scenario] != undefined)
								audioProfiles[payload.scenario] = true;
						}
					}
					break;
				
				case "enabled":
					audioProfiles[payload.scenario] = true;
					break;
				
				case "disabled":
					if (audioProfiles[payload.scenario] != undefined)
						delete audioProfiles[payload.scenario];

					this.dispatchAudioState(enyo.application.Cache.audioActiveProfile);
					break;
			}
		} else if(request.service == audioInterface.audioMedia_uri) {

			//enyo.log(request.service +  payload.scenario + payload.action);
			switch ( payload.action ) {
				case "enabled" :
					enyo.application.Cache.audioMediaEnabledProfiles[payload.scenario] = true;
					break;
				case "disabled" :
					if(enyo.application.Cache.audioMediaEnabledProfiles[payload.scenario] != undefined) {
						delete enyo.application.Cache.audioMediaEnabledProfiles[payload.scenario];
					}
					break;
				case  "changed" :
				//case  "requested":
					if(enyo.application.Cache.audioMediaEnabledProfiles[payload.scenario]) {
						enyo.application.Cache.audioMediaEnabledProfiles[payload.scenario] = true;
					}
					// Notify whoever cares
					this.dispatchAudioMediaState(payload.scenario);					
					break;
			}
		} else if(request.service == audioInterface.audioVvm_uri) {

			//enyo.log(request.service +  payload.scenario + payload.action);
			switch ( payload.action ) {
				case "enabled" :
					enyo.application.Cache.audioVvmEnabledProfiles[payload.scenario] = true;
					break;
				case "disabled" :
					if(enyo.application.Cache.audioVvmEnabledProfiles[payload.scenario] != undefined) {
						delete enyo.application.Cache.audioVvmEnabledProfiles[payload.scenario];
					}
					break;
				case  "changed" :
				//case  "requested":
					if(enyo.application.Cache.audioVvmEnabledProfiles[payload.scenario]) {
						enyo.application.Cache.audioVvmEnabledProfiles[payload.scenario] = true;
					}
					// Notify whoever cares
					this.dispatchAudioVvmState(payload.scenario, payload.active);					
					break;
			}
		}
	},

	onListScenarios: function (inSender, payload, request) {

		if (!payload || !payload.returnValue) {
			enyo.error("onListScenarios Error");
			return;
		}

		var prof;

		if(request.service == audioInterface.audioPhone_uri) {
			var audioProfiles = enyo.application.Cache.audioEnabledProfiles;

			if (payload.scenarios != undefined) {
				while ((prof = payload.scenarios.pop()) != undefined) {
					//enyo.log("Available audio scenarios: " + prof)
					audioProfiles[prof] = true;
				}
			}
		} else if (request.service == audioInterface.audioMedia_uri) {
			var audioMediaProfiles = enyo.application.Cache.audioMediaEnabledProfiles;

			if (payload.scenarios != undefined) {
				while ((prof = payload.scenarios.pop()) != undefined) {
					//enyo.log("Available audio media scenarios: " + prof)
					audioMediaProfiles[prof] = true;
				}
			}
		} else if (request.service == audioInterface.audioVvm_uri) {
			var audioVvmProfiles = enyo.application.Cache.audioVvmEnabledProfiles;

			if (payload.scenarios != undefined) {
				while ((prof = payload.scenarios.pop()) != undefined) {
					//enyo.log("Available audio Vvm scenarios: " + prof)
					audioVvmProfiles[prof] = true;
				}
			}
		}
	},

	changeScenario: function(value, serviceType) {

		if (value !== undefined) {
			//enyo.log( "onAudioRouteChangeClick New audio route is " + value);
			this.$.setCurrentScenario.call({
				"scenario": value
				}, {
					service: serviceType,
				});
		} else {
			enyo.error("value undefined");
		}
	},

	onAudioRouteChangeClick: function(value) {
		this.changeScenario(value, audioInterface.audioPhone_uri);
    	},

	onAudioMediaRouteChangeClick: function(value) {
		this.changeScenario(value, audioInterface.audioMedia_uri);	
    	},

	onAudioVvmRouteChangeClick: function(value) {
		this.changeScenario(value, audioInterface.audioVvm_uri);	
    	},
});

