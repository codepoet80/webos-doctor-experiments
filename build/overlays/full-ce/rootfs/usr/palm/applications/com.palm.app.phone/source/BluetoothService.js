
enyo.kind({
	name: "BluetoothService",
	kind: enyo.Component,
	components: [
                 {name: "btHfQuery", kind: enyo.PalmService, service: "palm://com.palm.bluetooth/prof/", method: "profgetstate"},
                 {name: "btHfProfileSubscribe", kind: enyo.PalmService, service: "palm://com.palm.bluetooth/prof/", method: "subscribenotifications", onSuccess: "btHfNotificationData", subscribe: true},
                 {name: "btTabHfScoAudioSubscribe", kind: enyo.PalmService, service: "palm://com.palm.bluetooth/hf/", method: "subscribenotifications", onSuccess: "onNotifyTabHfScoAudio", subscribe: true},
                 //when bt is off the service is down, use the bus, as the resubscribe call is expensive for services that are meant to go down
		{name: "btSvcStatus", kind: enyo.PalmService, service: "palm://com.palm.bus/signal/", method: "registerServerStatus", subscribe: true, onSuccess: "onSvcStatusEventResponse", onFailure: "onSvcStatusEventResponse"},

                //dispatcher for bt notification callbacks
                {name:"BluetoothStatusListeners",    kind:"Utils.Dispatcher"},
	],


	create: function() {
		this.inherited(arguments);
		enyo.log("bluetooth service");

                var deviceDetails = window.PalmSystem && JSON.parse(PalmSystem.deviceInfo);
                var isTablet = (deviceDetails && deviceDetails.screenWidth == 1024);

                if (isTablet) {
                    this.$.btSvcStatus.call({"serviceName": "com.palm.bluetooth"});
                }
	},

	destroy: function () {
		this.$.btSvcStatus.cancel();
		this.$.btHfProfileSubscribe.cancel();
		this.$.btTabHfScoAudioSubscribe.cancel();
		this.inherited(arguments);
	},

        serviceSubscribe: function() {
		enyo.log("attach to bluetooth service from bus");

		//bt service calls - we need a query since BT's profile subscription does not return the last saved value.		
                this.$.btHfQuery.call({ profile: "hf" }, { onSuccess: "btHfQueryResponse" });
                this.$.btHfProfileSubscribe.call();
                this.$.btTabHfScoAudioSubscribe.call();

        },

        // called when luna bus service tells us that the Bluetooth Service status has changed
        onSvcStatusEventResponse: function(inSender, response) {
                if (response.connected == true) {
		        enyo.log("bt service: subscribe at connect");
                        this.serviceSubscribe();

                } else if (response.connected == false) {
		        enyo.log("bt service: bus disconnect");
                        enyo.log(enyo.json.stringify(response));
                        enyo.application.Cache.hasPairedPhone = false;

                        /* if we are also not connected to skype at this time, we need to launch
                         * the first launch screen for the user if in visible mode.
                         */
                        if (enyo.application.Cache.hasVoipAcct == false) {

                            var card = enyo.windows.fetchWindow("PhoneApp");                       
                            if (card && !card.hidden && !enyo.application.isCarded) {
                                    var currentstate = enyo.application.UI.getCurrentState();
                                    var state = ['dialpad_card', 'activecall_card', 'voicemail', 'calllog', 'favorites', 'contactlookup', 'preferences_card'];
		                    enyo.log("bt service: currentstate " +  currentstate + " state " + state);

                                    if (currentstate && state.indexOf(currentstate) >= 0){
                                            enyo.application.UI.enter('firstlaunch_card');
                                    }
                            }
                        }

                        enyo.log("bt service: dispatch at bus disconnect");
                        this.dispatchBluetoothStatus();
                }
        },

        btHfQueryResponse: function(inSender, inResponse) {
                enyo.log("bt service query: " + enyo.json.stringify(inResponse));

                if ((inResponse.hf[0]) && (inResponse.hf[0].state) && (inResponse.hf[0].state == "connected")) {
                    enyo.log("bt service query: connected and paired");

                    if (inResponse.hf[0].name) {
                        enyo.log("bt service query: name of paired device " + inResponse.hf[0].name);
                        enyo.application.Cache.isBtDeviceNameAvailable = true;
                        enyo.application.Cache.btDeviceName = inResponse.hf[0].name;
                    }

                    enyo.application.Cache.hasPairedPhone = true;

                } else {
                    enyo.log("bt service query: not connected to device");
                    enyo.application.Cache.hasPairedPhone = false;
                    enyo.application.Cache.isBtDeviceNameAvailable = false;
                }
        },

        btHfNotificationData: function(inSender, inResponse) {

                if (inResponse.profile == "hf") {
                    enyo.log("bt service: hf profile available " + inResponse.profile );

                    if (inResponse.notification && inResponse.notification == "notifnconnected") {
                        enyo.log("bt service: connected to device" + inResponse.profile );
                        enyo.application.Cache.hasPairedPhone = true;

                        if (inResponse.name)
                        {
                            enyo.log("bt service: name of paired device " +  inResponse.name); 
                            enyo.application.Cache.isBtDeviceNameAvailable = true;
                            enyo.application.Cache.btDeviceName = inResponse.name;
                        } else {
                            enyo.application.Cache.isBtDeviceNameAvailable = false;
                        }


                    } else {

                        enyo.log("bt service: not connected to device" + inResponse.profile );
                        enyo.application.Cache.hasPairedPhone = false;

                        /* if we are also not connected to skype at this time, we need to launch
                         * the first launch screen for the user if in visible mode.
                         */
                        if (enyo.application.Cache.hasVoipAcct == false) {

                            var card = enyo.windows.fetchWindow("PhoneApp");                       
                            if (card && !card.hidden && !enyo.application.isCarded) {
                                    var currentstate = enyo.application.UI.getCurrentState();
                                    var state = ['dialpad_card', 'activecall_card', 'voicemail', 'calllog', 'favorites', 'contactlookup', 'preferences_card'];
									
									if (currentstate ) {
										if (currentstate === 'preferences_card' && enyo.application.Cache.pinView === true) {
											enyo.log("pinView is up, don't do anything");
										}
										else {
											if (state.indexOf(currentstate) >= 0) {
												enyo.application.UI.enter('firstlaunch_card');
											}
										}
                                    }
                            }
                        }
                    }

                    enyo.log("bt service: dispatch at bt disconnect");
                    this.dispatchBluetoothStatus();
                }

        },

        onNotifyTabHfScoAudio: function(inSender, inResponse) {

            enyo.log("bt notify: onNotifyTabHfScoAudio: " + enyo.json.stringify(inResponse));
            if (inResponse && inResponse.notification == "audio") {
		enyo.application.Cache.isHfAudioOnTablet = inResponse.enabled;
            }
        },

        dispatchBluetoothStatus: function(state) {
                enyo.log("dispatchBluetoothStatus");
                this.$.BluetoothStatusListeners.dispatch(state);
        },

        addBluetoothStatusListener: function(listener) {
                enyo.log("addBluetoothStatusListener");
                this.$.BluetoothStatusListeners.add(listener);
        },

        removeBluetoothStatusListener: function(listener) {
                enyo.log("removeBluetoothStatusListener");
                this.$.BluetoothStatusListeners.remove(listener);
        },

});


