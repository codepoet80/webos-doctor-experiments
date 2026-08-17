
enyo.kind({
	name: "TelephonyStatusInterface",
	kind: enyo.Component,
	published: {
		DISCONNECT_DELAY: 250
	},
	SIMStatus: {
		READY: "simready",
		NOTREADY: "simnotready", 
		MISSING: "simnotfound",
		PIN: "pinrequired"
	},	
	components: [
		//service calls		
		{name: "Pin1Status", kind: enyo.PalmService, service: enyo.palmServices.telephony, subscribe: true, method: "pin1StatusQuery", onSuccess: "pin1StatusResponse", onFailure: "pin1StatusResponse"},
		{name: "deviceLockStatus", kind: enyo.PalmService, service: enyo.palmServices.telephony, subscribe: true, method: "deviceLockQuery", onSuccess: "deviceLockResponse", onFailure: "deviceLockResponse"},
		{name: "simStatus", kind: enyo.PalmService, service: enyo.palmServices.telephony, subscribe: true, method: "simStatusQuery", onSuccess: "simStatusResponse", onFailure: "simStatusResponse"},
		{name: "radioStatus", kind: enyo.PalmService, service: enyo.palmServices.telephony, subscribe: true, method: "powerQuery", onSuccess: "radioStatusResponse", onFailure: "radioStatusResponse"},
		{name: "networkIdQuery", kind: enyo.PalmService, service: enyo.palmServices.telephony, subscribe: true, method: "networkIdQuery", onSuccess: "networkIdQueryResponse"},
		{name: "phoneNumberQuery", kind: enyo.PalmService, service: enyo.palmServices.telephony, subscribe: true, method: "phoneNumberQuery", onSuccess: "phoneNumberQueryResponse"},
		{name: "contactMatch", kind: enyo.PalmService, service: enyo.palmServices.system, subscribe: true, method: "getPreferences", onSuccess: "contactMatchStatusResponse", onFailure: "contactMatchStatusResponse"},
		{name: "preferredPhoneService", kind: enyo.PalmService, service: enyo.palmServices.system, subscribe: true, method: "getPreferences", onSuccess: "preferredPhoneServiceResponse", onFailure: "preferredPhoneServiceResponse"},
		{name: "preferredIntlPhoneService", kind: enyo.PalmService, service: enyo.palmServices.system, subscribe: true, method: "getPreferences", onSuccess: "preferredIntlPhoneServiceResponse", onFailure: "preferredIntlPhoneServiceResponse"},		
		{name: "prefService", kind: enyo.PalmService, service: enyo.palmServices.system, subscribe: true, method: "getPreferences", onSuccess: "airplaneModeStatusResponse", onFailure: "airplaneModeStatusResponse"},
		{name: "infoTextSubscribe", kind: enyo.PalmService, service: enyo.palmServices.telephony, subscribe: true, method : "subscribe", onSuccess: "onInfotextEvent", onFailure: "onInfotextEvent"},
		{name: "telStatusDisplayOn", kind: enyo.PalmService, service: "palm://com.palm.display/control/", method: "setState", onSuccess: "", onFailure: ""},
		{name: "hideEmgcyNumFromCallLogPref", kind:"PalmService", service: enyo.palmServices.system, params:{keys:["PhoneAppHideEmergencyNumbersFromCallLog"]}, method:"getPreferences", onSuccess:"gotHideEmgcyNumFromCallLogPref", onFailure:"gotHideEmgcyNumFromCallLogPref"},
		
		// cause current puck status to be signaled
		{name: "chargeSignalQuery", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "chargeSourceQuery"},
		{name: "getPower", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "powerQuery", subscribe: true, onSuccess: "onPowerEvent", onFailure: "onPowerEvent"},
		{name: "initOnProvisionStart", kind: enyo.PalmService, service: "palm://com.palm.bus/signal/", method: "registerServerStatus", onSuccess: "handleProvisionServerStatus", onFailure: "handleProvisionServerStatus"},
		{name: "provisioningStatusSubscribe", kind: enyo.PalmService, service: "palm://com.palm.provisioning/", method: "SessionStatus", subscribe: true, onSuccess: "onProvisioningStatusNotification", onFailure: "onProvisioningStatusNotification"},
		{name: "disconnectDelaySet", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "disconnectDelaySet"},
		
		{name: "telSvcStatus", kind: enyo.PalmService, service: "palm://com.palm.bus/signal/", method: "registerServerStatus", subscribe: true, onSuccess: "onSvcStatusEventResponse", onFailure: "onSvcStatusEventResponse"},
		{name: "callsGetAll", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "callsGetAll", subscribe: true, onSuccess: "onMacrocallEvent", onFailure: "onMacrocallEvent"},
		
		//dispatcher
		{name:"TelStateListeners", kind:"Utils.Dispatcher"},
		{name:"TelRingback", kind:"Utils.Telephony.ringback"},
		
		{name: "connectionmanager", kind: enyo.PalmService, service: "palm://com.palm.connectionmanager/", method: "getstatus", subscribe: true, onSuccess: "connectionManagerResponse", onFailure: "connectionManagerResponse"},		
	],
	create: function() {
		this.inherited(arguments);
		enyo.log("Telephony service status interface");

		this.$.telSvcStatus.call({"serviceName": "com.palm.telephony"});
				
		this.$.networkIdQuery.call();
		this.$.contactMatch.call({keys:["showcontactmatch"]});
		this.$.preferredPhoneService.call({keys:["phonePreferredDomesticPhoneService"]});
		this.$.preferredIntlPhoneService.call({keys:["phonePreferredIntlPhoneService"]});
		this.$.prefService.call({keys:["airplaneMode"]});
		this.$.connectionmanager.call(); 		
		this.$.hideEmgcyNumFromCallLogPref.call();
	},

	dispatchTelState: function(state) {
		enyo.log("dispatchTelState");
		this.$.TelStateListeners.dispatch(state);
	},

	addTelStateListener: function(listener) {
		enyo.log("addTelStateListener");
		this.$.TelStateListeners.add(listener);
	},

	removeTelStateListener: function(listener) {
		this.$.TelStateListeners.remove(listener);
	},

	pin1StatusResponse: function(inSender, response) {
		enyo.log("TelState:pin1StatusResponse " + enyo.json.stringify(response));

		if (response && response.returnValue && response.extended) {
			enyo.application.Cache.Devicelocked = response.extended.devicelocked;
			enyo.application.Cache.Pinpermblocked = response.extended.pinpermblocked; //display sim lock
			enyo.application.Cache.Pukrequired = response.extended.pukrequired; //display puk1 lock
			enyo.application.Cache.Pinrequired = response.extended.pinrequired; //display pin1 lock
			enyo.application.Cache.PinLocked = response.extended.enabled;
			enyo.application.Cache.pinAttemptsRemaining = response.extended.pinAttemptsRemaining;
			enyo.application.Cache.pukAttemptsRemaining = response.extended.pukAttemptsRemaining;
						
			enyo.log("current state " + enyo.application.UI.getCurrentState());
			enyo.log("last pin state "+enyo.application.Cache.lastPinState);			
			var bDoPopup = true;
			var params = {};
			//somehow TIL sent multiple notification in a roll on touchpad, remember it and don't handle 
			//if we got the same state notification
			if (response.extended.pinpermblocked == true) {							
				if (enyo.application.Cache.lastPinState === "state_Pinpermblocked") {
					return;
				} else {
					params.launchType = 'simlock'; //todo: phoneprefs does not have a simlock
					enyo.application.Cache.lastPinState = "state_Pinpermblocked";
				}
			}
			else if (response.extended.pukrequired == true) {
				if (enyo.application.Cache.lastPinState === "state_Pukrequired") {
					return;
				} else {
					params.launchType = 'puk1Lock'; 
					enyo.application.Cache.lastPinState = "state_Pukrequired";
				}
				
			}
			else if (response.extended.pinrequired == true) {				
				if (enyo.application.Cache.lastPinState === "state_Pinrequired") {
					return;
				}
				else {
					params.launchType = 'unlockTelephony';
					enyo.application.Cache.lastPinState = "state_Pinrequired";
				}
			}
			else {
				bDoPopup = false;
				if (enyo.application.Cache.lastPinState === "state_noPin") {
					return;
				}
				else {
					enyo.application.Cache.lastPinState = "state_noPin"; 
				}					
			}
			if (bDoPopup && !(PalmSystem.isMinimal)) {
				params.nextState = enyo.application.UI.getCurrentState(); 
				if (enyo.application.UI.getCurrentState() === 'preferences_card') {
					enyo.application.UI.event('changeView', params);
				}
				else {
					if (!enyo.application.CallSynergizer.callExists()) {
						params.nextState = enyo.application.UI.getCurrentState();
						enyo.application.UI.enter('preferences_card', params);
					}
				}
			}

		}
		//this.dispatchTelState(); not sure I need this right now
	},

	deviceLockResponse: function(inSender, response) {
		enyo.log("TelState:deviceLockResponse " + enyo.json.stringify(response));
		if (response && response.extended) {
			var keys = Object.keys(response.extended);
			var bDoPopup = false; 
			if (keys.length > 0) {
				for (var item in keys) {
					var params = {};
					if (keys.length == 1) {
						bDoPopup = true;
						params.unblock = response.extended[keys[item]];
					}
					else {
						if (keys[item] == true) {
							bDoPopup = true; 							
							params.unblock = true;
						}
					}
					if (bDoPopup && !(PalmSystem.isMinimal)) {
						params.launchType = 'devicelock';
						params.lock = "devicelock";
						params.locktype = keys[item];
						
						enyo.log("current state " + enyo.application.UI.getCurrentState());
						if (!(PalmSystem.isMinimal)) {
							if (enyo.application.UI.getCurrentState() === 'preferences_card') {
								enyo.application.UI.event('changeView', params);
							}
							else {
								params.nextState = enyo.application.UI.getCurrentState();
								enyo.application.UI.enter('preferences_card', params);
							}
						}
						return;
					}			
				}
			}			
		}
	},

	simStatusResponse: function(inSender, response) {
		enyo.log("TelState:simStatusResponse  " + enyo.json.stringify(response));	
		if (response && response.extended) {
			var state = response.extended.state;
			enyo.application.Cache.simState = state; 
			if (state === this.SIMStatus.MISSING && !PalmSystem.isMinimal){				
				//if the pin view is up, we'll close it; and if the state is not preferences_card, something is very wrong
				if ( enyo.application.Cache.pinView === true && enyo.application.UI.getCurrentState() === 'preferences_card') {
					var params = {}; 
					params.launchType = 'closePinView';					
					params.nextState = enyo.application.UI.getPreviousState();
					enyo.application.Cache.lastPinState = "state_noPin"; 
					enyo.application.UI.event('changeView', params);
				}	
			} 
		}
	}, 
	
	radioStatusResponse: function(inSender, response) {
		//enyo.log("TelState:radioStatusResponse  " + enyo.json.stringify(response));	
		var state; 
		if (response && response.extended && response.extended.powerState != undefined) {
			state = response.extended.powerState;
		}else if (response && response.eventPower != undefined) {
			state = response.eventPower;
		} else {
			enyo.error("unabled to get radio status"); 
		}
		
		if (state != undefined){
			switch (state) {
				case 'on':
					enyo.application.Cache.powerOn = true;
					if (enyo.application.CallSynergizer.redialOnNetworkService == undefined) {
						enyo.application.UI.event('changeView', {
							"launchType": "flightMode"
						});
					}
					break;
				case 'off':
					//if we are in airplane mode, reset the state to noPin 
					enyo.application.Cache.lastPinState = "state_noPin";			
					enyo.application.Cache.powerOn = false;
					enyo.application.UI.event('changeView', {"launchType":"flightMode"});
					break;					
					
				default: 
					enyo.error("unknown radio status");
					break; 		
			}			
		}		
	},
	
	networkIdQueryResponse: function(inSender, response) {
		var parsedImsi;
		if ( response && response.extended && response.extended.mccmnc ) {
			parsedImsi = enyo.g11n.PhoneUtils.parseImsi(response.extended.mccmnc);
			this.mcc = (parsedImsi && parsedImsi.mcc);
		}
		
		// cancel phone number subscription and re-subscribe, as a changing
		// mcc will change how the phone number is parsed
		this.$.phoneNumberQuery.cancel();
		this.$.phoneNumberQuery.call();
	}, 
	
	phoneNumberQueryResponse: function(inSender, response) {
		if ( response && response.extended && response.extended.number ) {
			this.phoneNumber = new enyo.g11n.PhoneNumber(response.extended.number);
		}
	},
	
	contactMatchStatusResponse: function(inSender, response) {
		enyo.log("TelState:contactMatchStatusResponse  " + enyo.json.stringify(response));	
		enyo.application.Cache.contactMatch = response && response.showcontactmatch;	
		if (enyo.application.Cache.contactMatch == undefined) {
			enyo.application.Cache.contactMatch = true;
		}
	},
	
	preferredPhoneServiceResponse: function(inSender, response) {
		enyo.log("TelState:preferredPhoneServiceResponse  " + enyo.json.stringify(response));
		enyo.application.Cache.phonePreferredDomesticPhoneService = "none"; // If the preference does not exist, match it with the default item in the ListSelector of DomesticCallPrefs
		
		if (response && response.phonePreferredDomesticPhoneService) {
				// accept TIL, "none", or any currently-registered transport (whatsapp/telegram/signal/teams/...) -
				// the preferred service list is built dynamically from enabled PHONE accounts, not a fixed enum
				enyo.require(response.phonePreferredDomesticPhoneService === enyo.application.CallSynergizer.TRANSPORTS.TIL ||
							response.phonePreferredDomesticPhoneService === "none" ||
							!!enyo.application.CallSynergizer.transports[response.phonePreferredDomesticPhoneService],
							"TelState:Invalid phonePreferredDomesticPhoneService: " + response.phonePreferredDomesticPhoneService);

				enyo.application.Cache.phonePreferredDomesticPhoneService = response.phonePreferredDomesticPhoneService;
		}
	},
	
	preferredIntlPhoneServiceResponse: function(inSender, response) {
		enyo.log("TelState:preferredIntlPhoneServiceResponse  " + enyo.json.stringify(response));
		enyo.application.Cache.phonePreferredIntlPhoneService = "none"; // If the preference does not exist, match it with the default item in the ListSelector of InternationalCallPrefs
		
		if (response && response.phonePreferredIntlPhoneService) {
				// accept TIL, "none", or any currently-registered transport (whatsapp/telegram/signal/teams/...) -
				// the preferred service list is built dynamically from enabled PHONE accounts, not a fixed enum
				enyo.require(response.phonePreferredIntlPhoneService === enyo.application.CallSynergizer.TRANSPORTS.TIL ||
							response.phonePreferredIntlPhoneService === "none" ||
							!!enyo.application.CallSynergizer.transports[response.phonePreferredIntlPhoneService],
							"TelState:Invalid phonePreferredIntlPhoneService: " + response.phonePreferredIntlPhoneService);

				enyo.application.Cache.phonePreferredIntlPhoneService = response.phonePreferredIntlPhoneService;
			
		}		
	},
	
	airplaneModeStatusResponse: function(inSender, payload) {
		enyo.application.Cache.airplaneMode = payload && payload.airplaneMode;
	},
	
	handleProvisionServerStatus: function(inSender, payload) {
		enyo.log( "TelephonyCommands::handleProvisionServerStatus");
		if (payload.connected == true)
			this.$.provisioningStatusSubscribe.call();
		else{//provision is down
			this.$.provisioningStatusSubscribe.cancel();
		}
	},
	
	onProvisioningStatusNotification: function(inSender, payload){
		enyo.log("PhoneApp: TelephonyEventListener::onProvisioningStatusNotification");
		if (payload.status) {
			var showAlert = payload.displayAlert;
			var msg = payload.status.toLowerCase();
			
			//TODO: push scence provisioning
			//this.announcer.announceProvisioning(payload.trigger ,msg, payload.cancelabel, showAlert, payload.errorCode);
                        enyo.windows.addBannerMessage(msg, "{}", "{}", "none");			
		}	
	},
	
	// called when service lost; if limited service available, notes it
	onServiceLoss: function() {
		enyo.log( "TelephonyEventListener::onServiceLoss");
		this.serviced = false;
		this.limited = false;
		this.incomingPending = undefined;
		this.$.TelRingback.ringbackEnd();
	},
	
	onLimited: function() {
		enyo.log( "TelephonyEventListener::onLimited");
		this.serviced = false;
		this.limited = true;
		this.incomingPending = undefined;
		// attempt to dial if there's an emergency number saved up
		//this.dialOnService();
	},
	
	// called on GSM when simready; CDMA when power on
	// gets account-specific server settings (like voicemail number)
	onServiceSettingsReady: function() {
		if (!this.serviceSettingsLoaded) {
			enyo.log( "TelephonyEventListener::onServiceSettingsReady");
			this.serviceSettingsLoaded = true;
			// get voicemail number
			//Voicemail.startVoicemailNumberWatch();
			// get allowEditVoicemail preference
			//TelephonyCommands.subscribePreference("allowEditVoicemail", this.onVoicemailNumberEditableReturn.bind(this));
			// query for emergency numbers in case they've changed
			//TelephonyCommands.emergencyNumberQuery(this.onEmergencyListReturn.bind(this));
			// attempt to calculate area code
			//TelephonyCommands.phoneNumberQuery(this.homeAreaCodeFromPhoneNumber.bind(this));
		}
	},
	
	// called when radio power goes off; clears out account-specific server settings
	clearServiceSettings: function() {
		enyo.log( "TelephonyEventListener::clearServiceSettings");
		if (this.serviceSettingsLoaded) {
			//Voicemail.stopVoicemailNumberWatch();						
			this.serviceSettingsLoaded = false;
		}
	},
	
	// called when radio power goes on
	// on CDMA, queries for service settings (like voicemail number)
	onPowerOn: function() {
		enyo.log( "TelephonyEventListener::onPowerOn");
		//TelephonyCommands.emergencyNumberQuery(this.onEmergencyListReturn.bind(this));
		if (!(enyo.application.Cache.platformType == "gsm"))
			this.onServiceSettingsReady();
	},
	
	// called when radio power goes off
	// if calls are connected, blows them away
	onPowerOff: function() {
		enyo.log( "TelephonyEventListener::onPowerOff");
		if (enyo.application.CallSynergizer.callExists()) {
			enyo.log( "TelephonyEventListener::onPowerOff: radio powered off while calls connected");	
			
			//TODO: Disconnect only TIL calls? What about Wifi voip calls?
			enyo.application.CallSynergizer.disconnectAllCalls();
		}
		this.clearServiceSettings();
		this.onServiceLoss();
	},
	
	onPowerEvent: function(inSender, response) {
		var state = false;
		if (response.extended) {
			if (response.extended.powerState == "on") {
				state = true;
			} else {
				state = false;
			}
		} else if (response.eventPower == "on") {
			state = true;
		} else {
			state = false;
		}
		
		enyo.log( "TelephonyEventListener::onPowerEvent powerState: " + state);
		
		if (this.powered !== state) {
			this.powered = state;
			// if the radio went off while it was already on, see if we need to clear calls
			if (this.powered == false) {
				this.onPowerOff();
			} else if (this.powered == true) {
				this.onPowerOn();
			}
		}
	},
	
	// called when luna bus service tells us that the TelephonyService status has changed
	onSvcStatusEventResponse: function(inSender, response) {
		if (response.connected == true) {
			this.$.chargeSignalQuery.call();
			/*this.$.getPower.call();*///already done on radioStatus
			this.$.initOnProvisionStart.call({'serviceName':"com.palm.provisioning"});
			this.$.disconnectDelaySet.call({"ms":this.DISCONNECT_DELAY});
			this.$.callsGetAll.call();
			
			this.$.radioStatus.call(); 		
			this.$.deviceLockStatus.call(); 
			this.$.simStatus.call(); 
			this.$.Pin1Status.call(); 
			
			this.$.infoTextSubscribe.call({"events":"infotext"});
			this.notifyCounter = 0;
			enyo.application.MultimodeInterface.platformSubscribe();
			
			//Make sure it gets called only when conection goes down previously..
			if(this.connected == false) {
				enyo.application.VoicemailService.stopVoicemailNumberWatch();			
				enyo.application.VoicemailService.startVoicemailNumberWatch();
				enyo.application.VoicemailService.restartVoicemailCountWatch();
			}
			this.connected = true;
						
		} else if (response.connected == false) {
			this.onPowerOff();
			this.connected = false;
		}
	},
	
	onInfotextEvent: function(inSender, response) {
		enyo.log("onInfotextEvent");
		if (response.infotext) {
			var infoTextmsg = "ID : " + response.infotext.id + " " + response.infotext.message;
			enyo.log(infoTextmsg);
			this.announceServiceMsg(infoTextmsg);
		}
	},
	
	gotHideEmgcyNumFromCallLogPref: function(inSender, response) {
		if (response) {
			enyo.application.Cache.hideEmergencyNumbersFromCallLog = response.PhoneAppHideEmergencyNumbersFromCallLog;
		}
	},
	
	
	announceServiceMsg: function(message){
		// not valid in first use
		if (window.PalmSystem && window.PalmSystem.isMinimal)
			return;
		
        	// turn display on
		this.$.telStatusDisplayOn.call({"state" : "on"});
		
		// increment notification number
		var counter = this.notifyCounter++;		
		var serviceMessageNew = $L("New network message");
		var serviceMessageTitle = $L("Network message");
		
		// add dashboard pane
		this.addServiceMessageDash(serviceMessageTitle, message);	
		
		// show banner for message
		enyo.windows.addBannerMessage(serviceMessageNew, "{}" /*{"action":"servicemessage", "message":message, "counter":counter}*/, "{}", "notifications");
	},
	
	addServiceMessageDash: function(dashTitle, dashText) {
		enyo.log("addServiceMessageDash :" + dashText);

		if(this.serviceMsgDash != undefined) {
			this.serviceMsgtempLayers = this.serviceMsglayers;
        		this.serviceMsgDash.setLayers([]);
			this.serviceMsgDash.destroy();
			this.serviceMsgDash = undefined;
		}
		
		// delay creating new component under same name after destory
		setTimeout(enyo.bind(this, function() {
			this.serviceMsgDash = this.createComponent({
				name:"serviceMsgEnyoDashabord",
				kind:"enyo.Dashboard",
				onTap: "serviceMsgDashTap",
				onUserClose: "serviceMsgUserClose",
				onLayerSwipe: "serviceMsgLayerSwipe",
				smallIcon: "images/notification-small-ignored.png",
			}, {"owner": this});

			if(this.serviceMsglayers == undefined) {
				this.serviceMsglayers = [];
			} else {
				if(this.serviceMsgtempLayers) {
					this.serviceMsglayers = this.serviceMsgtempLayers;
				}
			}
			this.serviceMsglayers.push({"icon": "images/notification-large-info.png", "title":dashTitle, "text":dashText});
			this.serviceMsgDash.setLayers(this.serviceMsglayers);
		
		}), 1000);
	},
	serviceMsgDashTap: function(inSender, layer, event) {
		var popupType = "ServiceMessage";
		var popupName = "NetworkMessage";
		enyo.application.openPhoneAppPopup(popupType, popupName, {"message": layer.text});
		this.serviceMsgDash.pop();
		this.serviceMsglayers.pop();
	},
	serviceMsgUserClose: function() {
		enyo.log("serviceMsgUserClose");	
		this.serviceMsglayers = [];
		//this.serviceMsgDash.setLayers([]);
	},
	serviceMsgLayerSwipe: function() {
		this.serviceMsgDash.pop();
		this.serviceMsglayers.pop();
	},
	
	onMacrocallEvent: function(inSender, response) {
		if (response.eventLocalAlert !== undefined) {
			if (response.eventLocalAlert.playTone === true) {
				this.$.TelRingback.ringbackStart();
			} else if (response.eventLocalAlert.playTone === false) {
				this.$.TelRingback.ringbackEnd();
			}
		}
	}, 
	
	connectionManagerResponse: function(inSender, response){
		//enyo.log("debug: testing response "+enyo.json.stringify(response));		
		if (response){
			enyo.application.Cache.isInternetConnectionAvailable = response.isInternetConnectionAvailable; 
			if (enyo.application.Cache.isInternetConnectionAvailable){
				enyo.application.CallSynergizer.cancelNetworkAlerts();
			}
			
			enyo.application.Cache.wifi = response.wifi; 
			enyo.application.Cache.wan = response.wan;  
		} else {
			enyo.error("unable to get connection response");
		}
	}	
});


