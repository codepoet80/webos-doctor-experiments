enyo.kind({
	name: "ConnectPhone",
	kind: "enyo.VFlexBox",
	events: {
		onBluetoothStatusChange: ""
	}, 
	components: [
		{name: "connectPhoneMsg",  className:"accounts-body-title"},
		{name: "launchApp", kind: "Launcher", app: "com.palm.app.bluetooth"},
		{name: "connectPhoneButton", kind: "Button", label: $L("Connect Phone"), onclick: "connectPhone", className:"accounts-btn"},
		{name: "btFirstlaunchQuery", kind: "PalmService", service: "palm://com.palm.bluetooth/prof/", method: "profgetstate"},
	],

	create: function() {
		this.inherited(arguments);
                enyo.application.Cache.endFirstLaunch = false;
                this.showedConnectMessage = false; // only changes to true
                this.$.connectPhoneMsg.setContent (FirstLaunchConstants.PAIR_PHONE_MESSAGE);
                this.$.btFirstlaunchQuery.call({ profile: "hf" }, { onSuccess: "btFirstLaunchQueryResponse" });

                //subscribe as a listener for bluetooth changes 
                this.onBluetoothStatusBound = enyo.hitch(this, "onBluetoothStatus");
                enyo.application.BluetoothService.addBluetoothStatusListener(this.onBluetoothStatusBound);      
	},

        destroy: function() {
  		this.$.btFirstlaunchQuery.cancel();
                // unsubscribe from bluetooth changes
                enyo.application.BluetoothService.removeBluetoothStatusListener(this.onBluetoothStatusBound);
                this.inherited(arguments);
        },

	btFirstLaunchQueryResponse: function(inSender, inResponse) {
		enyo.log("FL bt query response: " + enyo.json.stringify(inResponse));
                if ((inResponse.hf[0]) && (inResponse.hf[0].state) && (inResponse.hf[0].state == "connected")) {
                    enyo.log("FL bt query: connected to phone");

                    if (inResponse.hf[0].name) {
                        enyo.log("FL bt query: Name of phone" + inResponse.hf[0].name);
                        this.$.connectPhoneMsg.setContent (FirstLaunchConstants.SHOW_PHONE_MESSAGE);
                        this.$.connectPhoneButton.setCaption (inResponse.hf[0].name);
                    }

                    enyo.application.Cache.endFirstLaunch = true;
                    enyo.application.Cache.hasPairedPhone = true;

                } else {
                    enyo.log("FL bt query: not connected to phone");
                    this.$.connectPhoneMsg.setContent (FirstLaunchConstants.PAIR_PHONE_MESSAGE);
                    this.$.connectPhoneButton.setCaption ($L("Connect Phone"));
                    enyo.application.Cache.endFirstLaunch = false;
                    enyo.application.Cache.hasPairedPhone = false;
                    this.showedConnectMessage = true;

                }
	},

        onBluetoothStatus: function() {

            enyo.log("FL onBtStatus called");
            if (enyo.application.Cache.hasPairedPhone == true) {
                enyo.log("FL onBtStatus hasPairedPhone is true");
          		var updateCaption = true; 
                if (!this.showedConnectMessage) {
                    this.$.connectPhoneMsg.setContent (FirstLaunchConstants.SHOW_PHONE_MESSAGE);
                } else {
					enyo.log("current state "+enyo.application.UI.getCurrentState());
					enyo.log("previous state "+enyo.application.UI.getPreviousState());
 					if (enyo.application.UI.getCurrentState() === 'preferences_card'){
						if (enyo.application.UI.getPreviousState() === 'firstlaunch_card' && enyo.application.Cache.pinView !== true){
							enyo.application.UI.enter('contactlookup');
							updateCaption = false;							
						}												
					} else {
					 	if (enyo.application.UI.getCurrentState() === 'firstlaunch_card') {
							enyo.log("FL: Since we have already shown FL, transition to contacts if skype acct exist");
							if (enyo.application.Cache.hasVoipAcct === true) {
								enyo.application.UI.enter('contactlookup');
							} else {
								enyo.application.UI.enter('dialpad_card');
							}
							updateCaption = false;
						}
					}
                }	
				//update the button caption
				if (updateCaption) {
					if (enyo.application.Cache.isBtDeviceNameAvailable) {
						this.$.connectPhoneButton.setCaption(enyo.application.Cache.btDeviceName);
					}
					else {
						this.$.connectPhoneButton.setCaption($L("Phone"));
					}
				}
				enyo.application.Cache.endFirstLaunch = true;
            } else {

                enyo.log("FL onBtStatus hasPairedPhone is false");
                this.$.connectPhoneMsg.setContent (FirstLaunchConstants.PAIR_PHONE_MESSAGE);
                this.$.connectPhoneButton.setCaption ($L("Connect Phone"));
                enyo.application.Cache.endFirstLaunch = false;
                this.showedConnectMessage = true;
           }
		   this.doBluetoothStatusChange(); 
        },

	connectPhone: function(){

                enyo.log("endFirstLaunch is " + enyo.application.Cache.endFirstLaunch);
                if (enyo.application.Cache.endFirstLaunch == false) {
		    this.$.launchApp.launch();
                } else {
					if (enyo.application.Cache.hasVoipAcct === true) {
						enyo.application.UI.enter('contactlookup');
					} else {
						enyo.application.UI.enter('dialpad_card');
					}                
				}
	}
});
