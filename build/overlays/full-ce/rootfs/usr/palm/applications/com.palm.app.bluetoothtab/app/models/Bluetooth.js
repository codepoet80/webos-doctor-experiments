/* Copyright 2009 Palm, Inc.  All rights reserved. */

var Bluetooth = Class.create({
    
    initialize: function() {
        Mojo.Log.info("====== Bluetooth instantiated ======");
        // Initialize variables available to assistants
        this.enumEasPolicy = { alwaysOff:0 , hfOnly:1 , allowAllProfs:2 , unknown:0xff };
        this.btEasPolicy = this.enumEasPolicy.unknown;
        this.btSupportedProfiles = []; 
        this.isRadioOn = false;
        this.isRadioTurningOn = false;
        this.trustedDevices = [];
        this.deviceCoD = {};
        this.deviceName = {};
        this.getRemNameAddrInProgress = null;
        this.deviceAwaitingConnection = null;
        this.isFullScreen = false;
        this.btProfileStatus = {},
        this.btProfiles = [], 
        this.uiDebugMode = 0;        // 1 = pre-populate lists and allow BT to work without being connected to an actual device
        
        // Initialize internal variables
        this.assistants = [];
        this.gapNotificationServiceCall = null;
        this.profNotificationServiceCall = null;
        this.oppNotificationServiceCall = null;
        this.pairingServiceCall = null;
        this.pairingDirection = null;
        this.deviceAwaitingConnection = null;
        this.newlyPairedDevice = null;
        this.activeScene = null;
        this.passkeyDialog = null;
        this.allowInboundDialog = null;
        this.PIN = {};

        this.monitorNotificationHandler = this.handleMonitorNotifications.bind(this);
        this.profGapNotificationHandler = this.handleNotifications.bind(this);
        this.pairingNotificationHandler = this.handlePairingNotification.bind(this);
        this.oppNotificationHandler = this.handleOppNotification.bind(this);

        this.PinAttributes = {
            requiresEnterKey: true,
            focus: true,
            modifierState: Mojo.Widget.numLock,
            maxLength: 16,
            hintText: $L("Passkey"),
            changeOnKeyPress: true,
        };
    },
    
    registerAssistant: function(assistant) {
        // Register the assistant for notification callbacks
        this.assistants.push(assistant);
        Mojo.Log.info("====== registerAssistant: " + this.assistants.length);
    },
    
    unregisterAssistant: function(assistant) {
        // Unregister the assistant for notification callbacks
        var count = 0;
        for (var i = 0; i < this.assistants.length; i++) {
            if (this.assistants[i] == assistant) 
                this.assistants[i] = null;
            else {
                if (this.assistants[i] != null)
                    count++;
            }
        }
        // Are all the assistants unregistered?  If so, unsubscribe too because this app assistant is about to disappear
        Mojo.Log.info("====== unregisterAssistant: " + count);
        if (count == 0) {
            this.subscribeNotifications("unregister");
            this.subscribeMonitorNotifications("unregister");
            this.allowPairing(false);
        }
    },
    
    notifyAssistants: function(event, data) {
        // Sent the event to the assistant for it to handle
        Mojo.Log.info("====== sending event: " + event);
        this.assistants.each(function(cb) {if (cb) cb(event, data)});
    },
    
    // Set the active scene so that passkey dialogs pop-up on the correct scene
    setActiveScene: function(scene) {
        this.activeScene = scene;
    },
    
    // Set whether the app is full screen or not
    setFullScreen: function(fullScreen) {
        this.isFullScreen = fullScreen;
    },

    startBT: function() {
        if (!this.BtStarted && !this.uiDebugMode) {
            this.BtStarted = true;
            Mojo.Log.info("====== startBT ======");

            // Connect to the service, register for notifications and get current status
            this.btServiceStart();
            return false;
        }
        else {
            // The service has started.  Let the scene know
            return true;
        }
    },
    
    handleRadioTurningOn: function() {
        this.isRadioTurningOn = true;
        this.isRadioOn = false;
        this.getRadioState = false;
        this.notifyAssistants(Bluetooth.radioTurningOn);
    },
    
    handleRadioTurningOff: function() {
        // The radio is not "on", so wait until 'radioon' notification is received before initializing the state
        this.isRadioOn = false;
        this.getRadioState = false;
        this.notifyAssistants(Bluetooth.radioTurningOff);
    },
    
    handleRadioOff: function() {
        // The radio is not "on", so wait until 'radioon' notification is received before initializing the state
        this.isRadioOn = false;
        this.getRadioState = false;
        this.notifyAssistants(Bluetooth.radioOff);
        // Close the pairing dialog box if it is open
        this.closePairingDialogBox();
        
        // Unregister from notifications
        this.subscribeNotifications("unregister");
        this.allowPairing(false);
                                
        // Clear all profile status so they will be obtained once the BT Engine comes up
        this.btProfiles.each(function(profile) 
        {
            if (this.btProfileStatus[profile]) 
            delete this.btProfileStatus[profile];
        }.bind(this));
    },
    
    handleRadioOn: function() {
        this.isRadioOn = true;
        this.isRadioTurningOn = false;
        this.init();
    },

    handleEasPolicy: function(easPolicy){
        this.btEasPolicy = easPolicy;
    },

    btServiceStart: function() {
        // Register to be notified when the BT Service goes up and down
        this.btMonitorServiceSession = this.btMojoService("palm://com.palm.bus/signal/registerServerStatus", 
            {serviceName: 'com.palm.btmonitor', subscribe:true}, function(payload) {
            // Is the service running?
            if (payload.connected == true) {
                Mojo.Log.error("btServiceStart: BT Monitor service is now up (not an error)");
                this.monitorServiceUp = true;
                
                // Default to the case that happens if BT service is up: the radio must be on and we should get the state
                this.getRadioState = true;
                this.isRadioOn = true;
                this.btEasPolicy = this.enumEasPolicy.unknown;
                
                // Check EAS policy settings
                this.btMojoService("palm://com.palm.btmonitor/monitor/geteaspolicy", null, 
                    function(payload) {
                        switch (payload.bteaspolicy) {
                            case 0:
                            case 1:
                            case 2:
                            case 0xff:
                                this.handleEasPolicy(payload.bteaspolicy);
                                break;
                            default:
                                Mojo.Log.info("btServiceStart: Unknown notification from BT Monitor, " + payload.bteaspolicy);
                                break;
                        }
                }.bind(this));
                // Subscribe for bt monitor notifications
                this.subscribeMonitorNotifications("register");

	            if(this.btEasPolicy !== this.enumEasPolicy.alwaysOff || this.btEasPolicy !== this.enumEasPolicy.unknown) { 		    	
                // Subscribe for on/off notifications
                this.btMojoService("palm://com.palm.btmonitor/monitor/getradiostate", null, 
                    function(payload) {
                        switch (payload.radio) {
                            case 'turningon':
                                this.handleRadioTurningOn();
                                break;
                                
                            case 'turningoff':
                                this.handleRadioTurningOff();
                                break;
                              
                            case 'off':
                                this.handleRadioOff();
                                break;
                                // The radio is not "on", so wait until 'radioon' notification is received before initializing the state
                            case 'on':
                                this.handleRadioOn();
                                break;
                            
                            default:
                                Mojo.Log.info("btServiceStart: Unknown notification from BT Monitor, " + payload.radio);
                                break;
                        }
                        this.radioStateObtained = true;
                    }.bind(this));
				}
            }
            else {
                Mojo.Log.error("btServiceStart: BT Monitor service has gone down");
                this.isRadioOn = false;
                this.isRadioTurningOn = false;
                this.monitorServiceUp = false;
                this.notifyAssistants(Bluetooth.serviceDown);
                this.pairingServiceCall = null;

                this.btProfiles.each(function(profile) 
                {
                        if (this.btProfileStatus[profile]) 
                            delete this.btProfileStatus[profile];
                    }.bind(this));
                this.subscribeMonitorNotifications("unregister");
            } 
        }.bind(this));

        // Register to be notified when the power daemon goes up and down
        this.btMojoService("palm://com.palm.bus/signal/registerServerStatus", 
            {serviceName: 'com.palm.power', subscribe:true}, function(payload) {
            // Is the service running?
            if (payload.connected == true) {
                this.btMojoService("palm://com.palm.power/com/palm/power/identify", {"subscribe":true,"clientName":"mojo-app-bluetooth"}, 
                    function(payload) {
                        powerClientId = payload.clientId;
                        this.btMojoService("palm://com.palm.power/com/palm/power/prepareSuspendRegister", {"register":true,"clientId":payload.clientId, subscribe:true}, null, true);
                        this.btMojoService("palm://com.palm.bus/signal/addmatch", {"category":"/com/palm/power","method":"prepareSuspend", subscribe:true}, this.handleSuspendNotification.bind(this), true);
                        this.btMojoService("palm://com.palm.bus/signal/addmatch", {"category":"/com/palm/power","method":"resume", subscribe:true}, this.handleResumeNotification.bind(this), true);
                    }.bind(this));
            }
        }.bind(this));
    },
    
    init: function() {
        Mojo.Log.info("====== init ======");
        
        // Get the state of all profiles which, in turn, gets the trusted devices

        this.subscribeNotifications("unregister");
        this.subscribeNotifications("register");
        this.pairingServiceCall = null;
        
        // Get the state of all profiles which, in turn, gets the trusted devices
        this.getConnectedStateOfAllProfiles();
    },

    // Get the connected state of all supported profiles, one after the other
    getConnectedStateOfAllProfiles: function() {
        Mojo.Log.info("====== getConnectedStateOfAllProfiles ======");
        // Iterate through all the profiles, and get the status of those that aren't known
        
        this.btMojoService("palm://com.palm.bluetooth/prof/profgetstate",
                {"profile":"all"}, function(payload){
                    Mojo.Log.info("getConnectedStateOfAllProfiles: "+ Object.toJSON(this.btProfileStatus));
                    Mojo.Log.info("====== Number of profiles returned " + payload.profiles.length + "====== ");

                    // array of profiles supported by engine
                    this.btProfiles = payload.profiles;
                    for( var i=0; i < payload.profiles.length; i++ )
                    {
                        Mojo.Log.info("======  Profile " + payload.profiles[ i ] + " = " + payload[ payload.profiles[ i ] ][0].state + "======" );

                        this.btProfileStatus[ payload.profiles[ i ] ] = payload[ payload.profiles[ i ] ];
                    }
                    
                    // Get a list of all trusted devices if done getting all the profiles
                    this.getTrustedDevices();
                 }.bind(this));
    },

    // Get the list of trusted devices
    getTrustedDevices: function() {
        Mojo.Log.info("====== getTrustedDevices ======");
         this.btMojoService("palm://com.palm.bluetooth/gap/gettrusteddevices", null,
                    function(payload) {
                        Mojo.Log.info("====== Trusted Devices: " + Object.toJSON(payload));
                        
                        if (!payload.trusteddevices)
                            return;
                        
                        // Save the list of trusted devices
                        this.trustedDevices = payload.trusteddevices;

                        // Loop through the list of trusted devices                        
                        for (var i = 0; i < this.trustedDevices.length; i++) {
                            // Save the COD so that it can be used later
                            if (this.trustedDevices[i].cod) 
                                this.deviceCoD[this.trustedDevices[i].address] = this.trustedDevices[i].cod;
                            else {
                                Mojo.Log.error("CoD is zero for " + this.trustedDevices[i].address);
                            }
                            
                            // Save the name so that it can be used later, if necessary
                            this.deviceName[this.trustedDevices[i].address] = this.trustedDevices[i].name;
                        }
        
                        // Let the UI know that trusted devices have been obtained
                        this.notifyAssistants(Bluetooth.trustedDevices);

                        // If there is a newly paired device (but no timer to connect to it) then connect now
                        Mojo.Log.info("====== getTrustedDevices: newlyPairedDevice="+this.newlyPairedDevice + " connectToNewlyPairedDeviceTimer="+this.connectToNewlyPairedDeviceTimer);
                        if (this.newlyPairedDevice && !this.connectToNewlyPairedDeviceTimer)
                            this.connectToNewlyPairedDevice();
                        
                        // Let the UI know that the radio is on and all state has been obtained
                        this.notifyAssistants(Bluetooth.radioOnAndReady);
                    }.bind(this));
    },
    
    // Set the visibility and connectability
    setVisibilityAndConnectability: function(visible, connectable) {
        Mojo.Log.info("====== setVisibilityAndConnectability: connectable="+ connectable + " visible=" + visible);
        this.btMojoService("palm://com.palm.bluetooth/gap/setscanstate", {visible: visible, connectable: connectable}, null);
    },
    
    getDeviceFromTrustedList: function(addr) {
        if (!addr)
            return undefined;
        for (var i = 0; i< this.trustedDevices.length; i++) {
            if (this.trustedDevices[i].address == addr) {
                return this.trustedDevices[i];
            }
        }
        return undefined;    
    },

    // Turn the BT radio off or on
    toggleRadioState: function() {
        Mojo.Log.info("====== toggleRadioState: radio was on = " + this.isRadioOn);
        if (this.isRadioOn) {
            this.btMojoService("palm://com.palm.btmonitor/monitor/radiooff", null, null);
            
            // Pairing isn't happening anymore
            this.pairingDirection = null;
            
            // All profiles are disconnected
            this.btProfiles.each(function(profile){
                this.btProfileStatus[profile][0].state = 'disconnected';
            }.bind(this));
            
            // Let all the scenes know that the radio is turning off
            this.notifyAssistants(Bluetooth.radioTurningOff);
        }
        else
        {
            // Turn the radio on
            this.btMojoService("palm://com.palm.btmonitor/monitor/radioon", {visible: false, connectable: true}, null);        

            // Let all the scenes know that the radio is turning on
            this.notifyAssistants(Bluetooth.radioTurningOn);
        }
    },
    
    // Cancel pairing if it is inbound
    cancelInboundPairing: function() {
        Mojo.Log.info("====== cancelInboundPairing: direction = " + this.pairingDirection);
        if (this.pairingDirection == "inbound") {
            this.sendPairCancel(this.pairDevAddress);
            this.pairingDirection = null;
        }
    },

    // Cancel pairing if it is outbound
    cancelOutboundPairing: function() {
        Mojo.Log.info("====== cancelOutboundPairing: direction = " + this.pairingDirection);
        if (this.pairingDirection == "outbound") {
            this.sendPairCancel(this.pairDevAddress);
            this.pairingDirection = null;
        }
    },
    
    inqDevAddDevToUiList: function(payload)
    {
        Mojo.Log.info("++++++ inqDevAddDevToUiList ++++++, name = " + payload.name + " namestate = " + payload.NAMESTATE );
        // Save the CoD so that it can be used later, if necessary
        if (payload.cod)
        {
            this.deviceCoD[payload.address] = payload.cod;
        }

        if (payload.name)
        {
            // Save the name so that it can be used later, if necessary
            this.deviceName[payload.address] = payload.name;
        }
        // See if the device is trusted
        var trusted = this.getDeviceFromTrustedList(payload.address);

        if (trusted) {
            // Skip if connected
            if (trusted.CONNECTSTATE == "connected")
                return;
                
            // Get the name from the trusted list
            payload.name = trusted.name;
            // Update the name if it hasn't been renamed
            if (trusted.renamed)
                payload.NAMESTATE = "NameOkay";
            else
                payload.NAMESTATE = "UpdateName";   
            payload.TRUSTED = 'trusted';    
        }

        // Let the UI know that a device has been discovered
        this.notifyAssistants(Bluetooth.inqDeviceFound, payload);
    },

    // Start inquiry
    findDevices: function(devTypeToFind, deviceList) {
        Mojo.Log.info("====== findDevices ======");
        // Don't start inquiry if there is a pairing attempt in progress
        if (this.pairingDirection)
            return;
        return this.btMojoService("palm://com.palm.bluetooth/gap/finddevices",
                {cod:0, seconds:10, subscribe:true},
                function(payload) {
                    if (payload.founddevice == "device") {

                        // Was a name returned by the inquiry?  If so, it should be updated
                        if (payload.name) {
                            payload.NAMESTATE = "UpdateName";
                        }
                        else {
                            payload.name = "";
                            payload.NAMESTATE = "GetName";
                        }

                        for (var i = 0; i < deviceList.length; i++) 
                        {
                            if (deviceList[i].address == payload.address) 
                            {
                                Mojo.Log.info("++++++ findDevices ++++++, address = " + payload.address + " name = " + payload.name + " already in background list");
                                deviceList[i].name = payload.name;
                                deviceList[i].NAMESTATE = payload.NAMESTATE;
                            }
                        }

                        if ( i == deviceList.length )
                        {
                            // Insert CoD icon
                            payload.ICON = getIconFile( payload.address, payload.cod, payload.name);
                            deviceList.push(payload);
                        }
                        
                        if( !isDeviceOfInterest( payload.address, payload.cod, devTypeToFind) )
                            return;
                            
                        this.inqDevAddDevToUiList(payload);
                    }
                    else if (payload.founddevice == "done") {
                        // Let the UI know that inquiry has completed
                        this.notifyAssistants(Bluetooth.inqComplete, payload);
                    }
                }.bind(this));
    },

    handleMonitorNotifications: function(payload) {
        if (!payload || !payload.notification)
            return;
        Mojo.Log.info("====== handleMonitorNotifications: notification = " + payload.notification);
        switch (payload.notification) 
        {
            case 'notifnradioturningon':
                this.handleRadioTurningOn();
                break;

            case 'notifnradioon':
                this.handleRadioOn();
                break;
                
            case 'notifnturningoff':
                this.handleRadioTurningOff();
                break;
                
            case 'notifnradiooff':            
                this.handleRadioOff();
                break;

            case 'notifnbteaspolicy':
                this.handleEasPolicy(payload.bteaspolicy);
                break;
                
            default:
                Mojo.Log.info("====== handleMonitorNotifications: Unhandled notification = " + payload.notification );
                break;
        }
    },

    // Handle general notifications from the BT Engine
    handleNotifications: function(payload) {
        if (!payload || !payload.notification)
            return;
        Mojo.Log.info("====== handleNotifications: notification = " + Object.toJSON(payload) );
    
        // Find the device
        var device = this.getDeviceFromTrustedList(payload.address);
        
        var index = this.getProfIndexForDevice(payload.profile,payload.address);
        if ( index < 0 && payload.profile != undefined )
        {
            if ( undefined != this.btProfileStatus[payload.profile] && undefined != this.btProfileStatus[payload.profile].length )
            {
            index = this.btProfileStatus[payload.profile].length;      
        }
            else
            {
                this.btProfileStatus[payload.profile] = null;
                this.btProfileStatus[payload.profile].length = 0;
                index = 0;
            }
        }
        
        Mojo.Log.info("====== handleNotifications: index = " + index);
        switch (payload.notification) {
            case 'notifnconnecting':
                // Update the profile connected status
                payload.state = 'connecting';
                this.btProfileStatus[payload.profile][index] = payload;
                
                // Show the spinner if there isn't a pending connection
                if (device && !this.deviceAwaitingConnection) {
                    this.updateDeviceConnectedState(payload.address);
                    this.notifyAssistants(Bluetooth.updateTrustedStatus, payload.address);
                    // If the device fails to connect then show an error message
                    device.showErrorIfConnectFails = true;
                }

                break;
            case 'notifndisconnecting':
                payload.state = 'disconnecting';
                this.btProfileStatus[payload.profile][index] = payload;

                // Remove the spinner or connected icon from the screen, in anticipation of the disconnect notification
                if (device) {
                    this.updateDeviceConnectedState(payload.address);
                    this.notifyAssistants(Bluetooth.updateTrustedStatus, payload.address);
                }
                break;
            case 'notifnconnected':
                // Update the profile connected status
                if (payload.error == 0) {
                    payload.state = 'connected';
                    this.btProfileStatus[payload.profile][index] = payload;
                    
                    // If this is the device we are waiting on to make a connection to then clear the flag
                    if (payload.address == this.newlyPairedDevice)
                        this.newlyPairedDevice = null;
                    
                    // The device is connected, but if there is a pending connection to a
                    // different device then disconnect this connection
                    if (this.deviceAwaitingConnection && this.deviceAwaitingConnection != payload.address) {
                        if (payload.profile == 'hf' || payload.profile == 'mapc' || payload.profile == 'hfg' || payload.profile == 'a2dp') {
                            this.disconnectProfile(payload.profile, payload.address);
                            break;
                        }
                    }
                    
                    // Show the connected status on the UI            
                    this.updateDeviceConnectedState(payload.address);
                    this.notifyAssistants(Bluetooth.updateTrustedStatus, payload.address);
                    
                    // Don't show a connect error message for this device (if another profile fails)
                    if (device && device.showErrorIfConnectFails)
                        delete device.showErrorIfConnectFails;
                    break;
                }
                
                // There was a connect error
                // Is a device already connected on the profile?
                if (payload.alreadyconnectedaddr) {
                    Mojo.Log.info("====== Profile " + payload.profile + " is already connected to " + payload.alreadyconnectedaddr);
                    // If the connected device is not the same the the device a connection was
                    // requested for, then display a "Unable to connect" message
                    if (payload.address != payload.alreadyconnectedaddr)
                        this.notifyAssistants(Bluetooth.cannotConnect,payload.profile);
                    // Mark the profile as connected to the given address
                    this.btProfileStatus[payload.profile][index].state = 'connected';
                    this.btProfileStatus[payload.profile][index].address = payload.alreadyconnectedaddr;

                    // Show the connected status on the UI            
                    this.updateDeviceConnectedState(payload.address);
                    this.notifyAssistants(Bluetooth.updateTrustedStatus, payload.address);
                    break;
                }
                
                // Should "Connect error" be displayed?
                if (!this.deviceAwaitingConnection && this.isRadioOn && device && device.showErrorIfConnectFails) {
                    // Update this profile to 'disconnected'
                    this.btProfileStatus[payload.profile][index].state = 'disconnected';
                    // Update the connected state of this device
                    this.updateDeviceConnectedState(payload.address);
                    // If the device is disconnected then display the connect error message
                    switch (payload.profile) {
                        case 'mapc':
                                   if ( 0x0135 == payload.error )
                                   {
                                       break;
                                   }
                        case 'hid':
                        case 'hf':
                        case 'hfg':
                        case 'a2dp':
                            this.notifyAssistants(Bluetooth.cannotConnect,payload.profile);
                            break;
                        case 'opp' :
                            // If the error code is 6, then either OPP is not supported or car kit is not in receive mode.
                            if (payload.error == 6) 
                                this.notifyAssistants(Bluetooth.oppNotSupported);
                            else  
                                this.notifyAssistants(Bluetooth.cannotConnectOPP);
                            break;
                        default:
                            Mojo.Log.info("Not showing connection error for " + payload.profile);
                            break;
                    }
                    delete device.showErrorIfConnectFails;
                }
                
                // Intentional fall-through for connect error
                
            case 'notifndisconnected':
                // Update the profile connected status
                payload.state = 'disconnected';
                this.btProfileStatus[payload.profile][index] = payload;
                this.btProfileStatus[payload.profile][index].state = "disconnected";
                
                Mojo.Log.info("====== notifndisconnected: deviceAwaitingConnection=" + this.deviceAwaitingConnection + " btProfileStatus="+Object.toJSON(this.btProfileStatus));
                // If there is a pending audio connection and this device is no longer
                // connected on a audio profile then connect to the pending device
                
                if ( "hf" == payload.profile || "mapc" == payload.profile )
                {
		            indexHf = this.getProfIndexForDevice("hf",payload.address);
		            indexMapc = this.getProfIndexForDevice("mapc",payload.address);

		            if (this.deviceAwaitingConnection && ( indexHf < 0 || this.btProfileStatus['hf'][indexHf].state == "disconnected" ) && ( indexMapc < 0 || this.btProfileStatus['mapc'][indexMapc].state == "disconnected") ) {
		                this.connectDevice(this.deviceAwaitingConnection);
		                
		                this.deviceAwaitingConnection = null;            
		            }
                }
                else if ( "hfg" == payload.profile || "a2dp" == payload.profile )
                {
		            indexHfg = this.getProfIndexForDevice("hfg",payload.address);
		            indexA2dp = this.getProfIndexForDevice("a2dp",payload.address);

		            if (this.deviceAwaitingConnection && ( indexHfg < 0 || this.btProfileStatus['hfg'][indexHfg].state == "disconnected" ) && ( indexA2dp < 0 || this.btProfileStatus['a2dp'][indexA2dp].state == "disconnected") ) {
		                this.connectDevice(this.deviceAwaitingConnection);
		                
		                this.deviceAwaitingConnection = null;           
		            }
                } 
                
                // Update the UI now (if the device exists)
                if (device) {
                    this.updateDeviceConnectedState(payload.address);
                    this.notifyAssistants(Bluetooth.updateTrustedStatus, payload.address);
                }
                break;
                
            case 'notifndevremoved':
                // Remove the device from the trusted list
                var i;
                for (i = 0; i< this.trustedDevices.length; i++) {
                Mojo.Log.info("====== notifndevremoved: given addr = " + payload.address + "found addr = " + this.trustedDevices[i].address);
                    
                    if (this.trustedDevices[i].address == payload.address)
                        break;
                }
            
                if (i < this.trustedDevices.length) {
                    // Remove the device from the list
                    this.trustedDevices.splice(i, 1);
                    // Let all the scenes know that a device was removed
                    this.notifyAssistants(Bluetooth.deviceDeleted, payload.address);
                }
                
                break;
                
            case 'notifndevrenamed':
                // Let all the scenes know that a device was renamed
                this.notifyAssistants(Bluetooth.deviceRenamed, payload.address);
                break;
                
            case 'notifnprofconnectacceptaccepted':
                var i;
                for (i = 0; i< this.trustedDevices.length; i++) {
                    if (this.trustedDevices[i].address == payload.address)
                        break;
                }
                switch(payload.profile){
                    case 'map':
                        if (i < this.trustedDevices.length) {
                            this.trustedDevices[i].mapstate = 1;
                        }
                        break;
                    case 'pbap':
                        if (i < this.trustedDevices.length) {
                            this.trustedDevices[i].pbapstate = 1;
                        }
                        break;
                    default:
                }
                this.notifyAssistants(Bluetooth.connAccepted, payload.address , payload.profile);
                break;
                
            case 'notifnprofconnectacceptrejected':
                var i;
                for (i = 0; i< this.trustedDevices.length; i++) {
                    if (this.trustedDevices[i].address == payload.address)
                        break;
                }
                switch(payload.profile){
                    case 'map':
                        if (i < this.trustedDevices.length) {
                            this.trustedDevices[i].mapstate = 0;
                        }
                        break;
                    case 'pbap':
                        if (i < this.trustedDevices.length) {
                            this.trustedDevices[i].pbapstate = 0;
                        }
                        break;
                    default:
                }
                this.notifyAssistants(Bluetooth.connRejected, payload.address, payload.profile);
                break;           
            case 'taptosharepaired':
                Mojo.Log.info("taptosharepaied error: "+payload.error + " payload.address=" + payload.address);
                // Refresh the list of trusted devices (one may have been added, or removed on error)
                this.getTrustedDevices();
                break; 

        }
    },

    // Handle pairing notifications from BT Engine
    handlePairingNotification: function(payload) {
        // Ignore subscribe notifications
        if (payload.returnValue)
            return;
        Mojo.Log.info("====== handlePairingNotification: this.pairingDirection = " + this.pairingDirection);
        Mojo.Log.info("====== handlePairingNotification: " + Object.toJSON(payload));
        
        // Ignore anything that isn't a notification or doesn't have an address
        if (!payload.notification || !payload.address)
            return;
            
        // If a CoD wasn't supplied then get it from the saved values, otherwise save the value
        if (!payload.cod) {
            payload.cod = this.deviceCoD[payload.address];
            if (!payload.cod)
                Mojo.Log.error("handlePairingNotification: No COD!, but pairing anyway");
        }
        else 
            this.deviceCoD[payload.address] = payload.cod;
            
        // If a name hasn't been supplied then hopefully we've seen the name somewhere else before (inquiry, trusted)
        if (!payload.name) {
            payload.name = this.deviceName[payload.address];
            
            // If the name is still unknown then retrieve it from the device
            if (!payload.name) {
                this.getPairingDeviceName(payload);
                // Handle the notification once the name has been retrieved
                return;
            }
        }    
                
        switch (payload.notification) {
            case 'notifnpincoderequest':
                // Make a note that this is "regular pairing" (not Secure Simple Pairing)
                this.pairingUsesSSP = false;
                
                // If currently pairing and another pair request appears then reject it
                if (this.pairingDirection && this.pairDevAddress && payload.address != this.pairDevAddress) {
                    this.sendPairCancel(payload.address);
                    break;
                }
                
                // Is this an inbound pairing attempt?
                if (!this.pairingDirection) {                
                    this.pairingDirection = "inbound";
                    this.pairDevAddress = payload.address;
                    // Auto-pairing should not be attempted
                    this.attemptAutoPair = false;
                     this.promptForPairingConfirmation(payload);
                    break;                
                }
                
                // Attempt to auto-pair if an attempt hasn't already been made
                if (this.attemptAutoPair) {
                    // Send a pass key of "0000"
                    this.sendPasskey("0000");
                    this.autoPairAttempted = true;    
                    this.attemptAutoPair = false;
                    break;                
                }
    
				/* Check if the device is keyboard */
				if(isKeyboard(payload.cod))
				{
                    this.promptToEnterPasskeyOnKeyboard(payload);                   
				}
				else
				{
                    // Prompt the user for the passkey
                    this.promptForPasskey(payload);                   
				}
                break;
                
            case 'notifnssppincoderequest':
                // Make a note that this is Secure Simple Pairing
                this.pairingUsesSSP = true;
    
                // If attempting outbound pairing and another pair request appears then reject it
                if (this.pairingDirection && this.pairDevAddress && payload.address != this.pairDevAddress) {
                    this.sendPairCancel(payload.address);
                    break;
                }            
                
                // Is this an inbound pairing attempt?
                if (!this.pairingDirection) {
                    this.pairingDirection = "inbound";
                    this.pairDevAddress = payload.address;
                    // Auto-pairing should not be attempted
                    this.attemptAutoPair = false;
                     this.promptForPairingConfirmation(payload);
                    break;                
                }
    
                // Attempt to auto-pair if an attempt hasn't already been made
                if (this.attemptAutoPair) {
                    // Send a pass key of "0000"
                    this.sendPasskey("0000");
                    this.autoPairAttempted = true;    
                    this.attemptAutoPair = false;
                    break;                        
                }
                
                // Prompt the user for the passkey
                this.promptForPasskey(payload);                    
                break;
                
            case 'notifnssppincodecheckrequest':
                // Make a note that this is Secure Simple Pairing
                this.pairingUsesSSP = true;
    
                // If attempting outbound pairing and another pair request appears then reject it
                if (this.pairingDirection && this.pairDevAddress && payload.address != this.pairDevAddress) {
                    this.sendPairCancel(payload.address);
                    break;
                }            
    
                // Is this an inbound pairing attempt?
                if (!this.pairingDirection) {
                    this.pairingDirection = "inbound";
                    this.pairDevAddress = payload.address;
                     this.promptForPairingConfirmation(payload);
                    break;                
                }
                
                // Display the dialog to confirm or enter the passkey
                if (payload.onlycompare)
                    this.promptToConfirmSSPPasskey(payload);                
                else
                    this.promptToConfirmSSPRemotePasskey(payload);
                break;
            
            case 'notifnsspjustworks':
                // Make a note that this is Secure Simple Pairing
                this.pairingUsesSSP = true;
    
                // If attempting outbound pairing and another pair request appears then reject it
                if (this.pairingDirection && this.pairDevAddress && payload.address != this.pairDevAddress) {
                    this.sendPairCancel(payload.address);
                    break;
                }            
    
                // Is this an inbound pairing attempt?
                if (!this.pairingDirection) {
                    this.pairingDirection = "inbound";
                    this.pairDevAddress = payload.address;
                     this.promptForPairingConfirmation(payload);
                    break;                
                }
                
                // Accept the "just works" pairing
                this.sendPasskey(null);
                break;
                
            case 'notifnpaired':
                Mojo.Log.info("notifnpaired error: "+payload.error + " payload.address=" + payload.address+ " pairDevAddress=" + this.pairDevAddress);
                // Refresh the list of trusted devices (one may have been added, or removed on error)
                this.getTrustedDevices();

                if (payload.address == this.pairDevAddress) {
                    if (payload.error == 0) {
                        // Pairing was successful
                        Mojo.Log.info("======  Successfully paired: addr="+payload.address+" cod=" + payload.cod + " name="+ payload.name);
                        
                        var isHF    = isPhone(payload.cod);
                        var isMAPC  = isMAPSupported(payload.cod);
                        var isHFG   = isHFGSupported(payload.cod);
                        var isA2DP  = isA2DPSupported(payload.cod);
               
                        if ( isHF || isMAPC || isHFG || isA2DP )
                        {
		             		['hf', 'mapc', 'hfg', 'a2dp'].each(function(profile)
		                 	{
		                    	if ( undefined != this.btProfileStatus[profile] && undefined != this.btProfileStatus[profile].length )
		                       	{
		                       		for ( var i = 0 ; i < this.btProfileStatus[profile].length; i++ )
		                           	{
		                            	if (this.btProfileStatus[profile][i].state != 'disconnected' && this.btProfileStatus[profile][i].address != payload.address ) 
		                              	{
		                              		this.disconnectProfile(profile,this.btProfileStatus[profile][i].address);
		                               	}
		                          	}
		                     	}
		               		}.bind(this));
                        }

		                // If still on the inquiry screen then return to the main screen after a short delay
                        // Prevent user from tapping on anything on the Inquiry screen
                        this.notifyAssistants(Bluetooth.disablePairing);
                        // Return to the main screen in a short while
                        this.popInquiryScene({delay: 500});
                        // Let everyone know about the newly paired device
                        this.notifyAssistants(Bluetooth.pairedDevice, payload.address);
                            
                        if (this.pairingDirection == "outbound") {
                            // Connect to the newly paired device
                            // If the newly added device is a car kit then delay connecting to it
							if ( postPairConnectDelay( payload.name )) {
                                if (this.connectToNewlyPairedDeviceTimer)
                                    clearTimeout(this.connectToNewlyPairedDeviceTimer);
                                this.connectToNewlyPairedDeviceTimer = setTimeout(this.connectToNewlyPairedDevice.bind(this), postPairConnectDelay(payload.name));
                            }
                            else {
                                // Connection will happen once the list of trusted devices is received
                            }
                            this.newlyPairedDevice = payload.address;
                        }else{
                            if (this.pairingDirection == "inbound") {
							/* If this is hid keyboard then initiate hid connection   *
							 * as host needs to initiate very first connection to hid * 
							 * device as per Bluetooth HID spec                       */
								if(isKeyboard(this.deviceCoD[payload.address]) || isGamepad(this.deviceCoD[payload.address]) || isMouse(this.deviceCoD[payload.address])){
                                    this.newlyPairedDevice = payload.address;
								}
							}
						} 
                        // Ready to pair to the next device
                        this.pairingDirection = null; 
                        this.autoPairAttempted = false;
                    }
                    else {
                        // If auto-pair was attempted then wait and try to pair again
                        if (this.autoPairAttempted) {
                            this.autoPairAttempted = false;
                            // Attempt to pair again in a few seconds
                            setTimeout(this.sendPairRequest.bind(this), 4000);
                        }
                        else {
                            // Ready to pair to the next device
                            this.pairingDirection = null;
                            // Pairing failed so restart inquiry (if the inquiry scene is running).  "true" means pairing failed
                            this.notifyAssistants(Bluetooth.restartInquiry, true);
                        }
                    }
                    // Hide the dialog box if it is still showing
                    this.closePairingDialogBox();
                }
                else {
                    // This paired notification is for a device we don't care about.
                    //  Pair with the one we do care about
                    if (this.pairingDirection == "outbound")
                        this.sendPairRequest();
                    
                    // Restart inquiry if not pairing
                    if (!this.pairingDirection)
                        this.notifyAssistants(Bluetooth.restartInquiry, false);
                }
                break;
        }
    },
    
    // Handle OPP notifications
    handleOppNotification: function(payload) {
        // Ignore subscribe notifications
        if (payload.returnValue)
            return;
        Mojo.Log.info("====== handleOppNotification: " + Object.toJSON(payload));
        switch (payload.notification) {
            case 'notifnpushprogress':
                this.notifyAssistants(Bluetooth.oppProgressPercent, payload.progress);
                break;
            case 'notifnpushcomplete':
                // Was there an error?
                if (payload.error)
                    this.notifyAssistants(Bluetooth.oppError, payload.error);
                else
                    this.notifyAssistants(Bluetooth.oppProgressPercent, payload.progress);
                break;
        }
    },
    
    getProfIndexForDevice: function(profName, addr)
    {
       if ( undefined == profName || this.btProfileStatus[profName] == undefined )
       {
           return -1;
       }
       if ( this.btProfileStatus[profName][0].address == undefined )
       {
           return 0;
       }
       Mojo.Log.info("====== getProfIndexForDevice: length = " + this.btProfileStatus[profName].length);
       for (var i = 0; i < this.btProfileStatus[profName].length; i++)
       {
           Mojo.Log.info("====== getProfIndexForDevice: given addr = " + addr + ", found = " + this.btProfileStatus[profName][i].address + " prof = " + profName);
           if ( this.btProfileStatus[profName][i].address === addr  )
           {
               return i;
           }
       }
       
       return -1;
    },
    
    updateDeviceConnectedState: function(addr) {
        Mojo.Log.info("====== updateDeviceConnectedState: " + addr);
        if (!addr)
            return;
            
        // Find the device
        var device = this.getDeviceFromTrustedList(addr);
        Mojo.Log.info("====== updateDeviceConnectedState: device " + Object.toJSON(device));
        if (undefined == device)
            return;
            
        Mojo.Log.info("****** updateDeviceConnectedState: " + Object.toJSON(device));
            
        // Make sure the status of all profiles is known
        Mojo.Log.info("====== updateDeviceConnectedState: prof length " + this.btProfiles.length);
        if( this.btProfiles.length == 0 )
        {
            return;
        }
        for( var i = 0; i < this.btProfiles.length; i++ )
        {
            if( !this.btProfileStatus[ this.btProfiles[ i ]][0] )
            {
                Mojo.Log.info("====== updateDeviceConnectedState: no prof status for " + this.btProfiles[ i ]);
                return;
            }
        }
        
        var icon = getIconFile( device.address, device.cod,device.name); 
        // Assume device is disconnected
        device.CONNECTSTATE = 'disconnected';

        device.spinning = false;
        device.oppSpinning = false;
        device.ICON = icon ;
		device.SHOW_INFO_ICON = '';
   
		if(isPhone(device.cod))
		{
		    device.SHOW_INFO_ICON = 'enabled';
		}

		index = this.getProfIndexForDevice("pan",addr);
        if( index >= 0)
        {
            // Is the device connected on PAN?
            if (this.btProfileStatus['pan'][index].state === "connected")
            {
                device.CONNECTSTATE = 'connected';
                device.ICON = icon + '_connected';
            }
        }
                    
        index = this.getProfIndexForDevice("hid",addr);
        if( index >= 0)
        {
            // Is the device connected on HID?
            if (this.btProfileStatus['hid'][index].state === "connected")
            {
                device.CONNECTSTATE = 'connected';
                device.ICON = icon + '_connected';
            }
            else 
            {
                if (this.btProfileStatus['hid'][index].state === "connecting") {
                    device.CONNECTSTATE = 'connecting'
                    device.spinning = true;
                }
            }
        }
        
        index = this.getProfIndexForDevice("spp",addr);
        if( index >= 0)
        {
            // Is the device connected on SPP?
            if (this.btProfileStatus['spp'][index].state == "connected") 
            {
                device.CONNECTSTATE = 'connected';
                device.ICON = icon + '_connected';
            }
            else 
            {
                if (this.btProfileStatus['spp'][index].state == "connecting") 
                {
                    device.CONNECTSTATE = 'connecting'
                    device.spinning = true;
                }
            }
        }
        
        // If the device is connected on either audio profile then show that
        indexHfg = this.getProfIndexForDevice("hfg",addr);
        indexA2dp = this.getProfIndexForDevice("a2dp",addr);
        if ( indexHfg >= 0 || indexA2dp >= 0 )
        {
            if ( indexHfg >= 0 )
            {
                if ( this.btProfileStatus['hfg'][indexHfg].state == "connected" && this.btProfileStatus['hfg'][indexHfg].address == addr )
                {
                	device.CONNECTSTATE = 'connected';
                   	device.ICON = icon + '_connected';
                }
            }
            if ( indexA2dp >= 0 )
            {
				if ( this.btProfileStatus['a2dp'][indexA2dp].state == "connected" && this.btProfileStatus['a2dp'][indexA2dp].address == addr )
                {
                	device.CONNECTSTATE = 'connected';
                    device.ICON = icon + '_connected';
                }
            }
            if ( device.CONNECTSTATE != 'connected' )
            {
                // If there is a pending connection to this device, or it is currently connecting then show the spinner
                if (this.deviceAwaitingConnection == addr || this.newlyPairedDevice == addr ||
                    ( indexHfg >=0 && this.btProfileStatus['hfg'][indexHfg].state == "connecting" && this.btProfileStatus['hfg'][indexHfg].address == addr ) ||
                    ( indexA2dp >=0 && this.btProfileStatus['a2dp'][indexA2dp].state == "connecting" && this.btProfileStatus['a2dp'][indexA2dp].address == addr) ) {
                    device.CONNECTSTATE = 'connecting';
                    device.spinning = true;
                }
            }
        }

        // If the device is connected on either hf or mapc profile then show that
        indexHf = this.getProfIndexForDevice("hf",addr);
        indexMapc = this.getProfIndexForDevice("mapc",addr);
        if ( indexHf >= 0 || indexMapc >= 0 )
        {
            if ( indexHf >= 0 )
            {
                if ( this.btProfileStatus['hf'][indexHf].state == "connected" && this.btProfileStatus['hf'][indexHf].address == addr )
                {
                    device.CONNECTSTATE = 'connected';
                    device.ICON = icon + '_connected';
                }
            }   
            if ( indexMapc >= 0 )
            {
                if (indexMapc >= 0 && this.btProfileStatus['mapc'][indexMapc].state == "connected" && this.btProfileStatus['mapc'][indexMapc].address == addr)
                {
                	device.CONNECTSTATE = 'connected';
                 	device.ICON = icon + '_connected';
                }
            }
            if ( device.CONNECTSTATE != 'connected' )
            {
                // If there is a pending connection to this device, or it is currently connecting then show the spinner
                if (this.deviceAwaitingConnection == addr || this.newlyPairedDevice == addr ||
                    ( indexHf >=0 && this.btProfileStatus['hf'][indexHf].state == "connecting" && this.btProfileStatus['hf'][indexHf].address == addr ) ||
                    ( indexMapc >=0 && this.btProfileStatus['mapc'][indexMapc].state == "connecting" && this.btProfileStatus['mapc'][indexMapc].address == addr) ) 
                {
                    device.CONNECTSTATE = 'connecting';
                    device.spinning = true;
                }
            }
        }

        index = this.getProfIndexForDevice("opp",addr);
        if( index >= 0)
        {
            // Is the device connecting on OPP?
    		if (this.btProfileStatus['opp'][index]) 
            {
				device.CONNECTSTATE_OPP = this.btProfileStatus['opp'][index].state;
                if (device.CONNECTSTATE_OPP === 'connecting')
                    device.oppSpinning = true;
    		}
            // Show connecting on OPP if there is a newly paired device
            if (this.newlyPairedDevice && this.newlyPairedDevice === addr)
                device.oppSpinning = true;
        }
            
        Mojo.Log.info("====== updateDeviceConnectedState: " + addr + " CONNECTSTATE=" +device.CONNECTSTATE + " ICON=" + device.ICON +" spinning="+ device.spinning + " oppSpinning=" + device.oppSpinning);
    },

    // Connect or disconnect the device that the user tapped on (in the "Audio" or HID groups)
    connectOrDisconnectDevice: function(addr) {
        Mojo.Log.info("====== connectOrDisconnectDevice: " + addr + " newly=" + this.newlyPairedDevice);
        // If we're waiting to connect to a newly paired device, then don't do anything
        if (this.newlyPairedDevice != null)
            return;
            
        // Find the device that was tapped on
        var device = this.getDeviceFromTrustedList(addr);
        if (!device)
            return;
            
        Mojo.Log.info("====== connectOrDisconnectDevice: state=" + device.CONNECTSTATE + ", deviceType = " + device.DEVICETYPE );
        // There is a different action based on the current connect status of the device
        switch (device.CONNECTSTATE) {
            case 'connected':
                // Device is connected so disconnect all profiles it is connected on
                this.disconnectAllProfiles(addr);
                // Update the UI to reflect that it is no longer connected
                this.updateDeviceConnectedState(addr);
                this.notifyAssistants(Bluetooth.updateTrustedStatus, addr);
                break;
                
            case 'connecting':
                // Is this device waiting to connect?
                if (addr == this.deviceAwaitingConnection) {
                    // There is no longer a pending connection attempt to this device
                    this.deviceAwaitingConnection = null;
                }
                else {
                    indexHf = this.getProfIndexForDevice("hf",addr);
                    indexMapc = this.getProfIndexForDevice("mapc",addr);

                    // Abort the connection attempt on the supported profiles
                    if (indexHf >= 0 && isPhone(device.cod) && this.btProfileStatus['hf'][indexHf].state != 'disconnected') 
                        this.disconnectProfile('hf',this.btProfileStatus['hf'][indexHf].address);
                    if (indexMapc >= 0 && isMAPSupported(device.cod) && this.btProfileStatus['mapc'][indexMapc].state != 'disconnected') 
                        this.disconnectProfile('mapc',this.btProfileStatus['mapc'][indexMapc].address);
                    
                    indexHfg = this.getProfIndexForDevice("hfg",addr);
                    indexA2dp = this.getProfIndexForDevice("a2dp",addr);

                    // Abort the connection attempt on the supported profiles
                    if (indexHfg >= 0 && isHFGSupported(device.cod) && this.btProfileStatus['hfg'][indexHfg].state != 'disconnected') 
                        this.disconnectProfile('hfg',this.btProfileStatus['hfg'][indexHfg].address);
                    if (indexA2dp >= 0 && isA2DPSupported(device.cod) && this.btProfileStatus['a2dp'][indexA2dp].state != 'disconnected') 
                        this.disconnectProfile('a2dp',this.btProfileStatus['a2dp'][indexA2dp].address);
                    // Don't show the connect failure message
                    delete device.showErrorIfConnectFails;
                }
    
                // Update the UI to reflect that it is no longer connecting
                this.updateDeviceConnectedState(addr);
                this.notifyAssistants(Bluetooth.updateTrustedStatus, addr);
                break;
                
            case 'disconnected':
//            case 'connectcapable':
                // Do nothing if the device is not a audio.
                if (device.DEVICETYPE === "Other")
                    return;
                
                // Is there a pending connection attempt to another device?
                if (this.deviceAwaitingConnection && this.deviceAwaitingConnection != addr) {
                    var addr2 = this.deviceAwaitingConnection;
                    Mojo.Log.info("====== connectOrDisconnectDevice: Connect no longer required to " + addr2);
                    // A connection to the previously pending device is no longer desired
                    this.deviceAwaitingConnection = null;
                    // Update the UI to reflect that there is no longer a pending connection attempt to the old device
                    // Iterate through the list array to find out the index
                    this.updateDeviceConnectedState(addr2);
                    this.notifyAssistants(Bluetooth.updateTrustedStatus, addr2);
                }
                
                var isHF    = isPhone(device.cod);
                var isMAPC  = isMAPSupported(device.cod);
                var isHFG   = isHFGSupported(device.cod);
                var isA2DP  = isA2DPSupported(device.cod);
               
                if ( isHF || isMAPC || isHFG || isA2DP )
                {
                    // Iterate through the list and disconnect audio and HF profiles
      				['hf', 'mapc', 'hfg', 'a2dp'].each(function(profile)
                	{
                    	if ( undefined != this.btProfileStatus[profile] && undefined != this.btProfileStatus[profile].length )
                     	{
                         	for ( var i = 0 ; i < this.btProfileStatus[profile].length; i++ )
                            {
                                if (this.btProfileStatus[profile][i].state != 'disconnected') 
                                {
                                    Mojo.Log.info("====== connectOrDisconnectDevice: Making " + addr + " pending while disconnecting " + profile);
                                    this.disconnectProfile(profile,this.btProfileStatus[profile][i].address);
                                    // Make the connection attempt to this device pending.  The connection will
                                    // happen once the disconnect notification is received
                                    this.deviceAwaitingConnection = addr;
                                    // Update the status of the device being disconnected
                                    this.updateDeviceConnectedState(this.btProfileStatus[profile][i].address);
                                    this.notifyAssistants(Bluetooth.updateTrustedStatus, this.btProfileStatus[profile][i].address);
                              	}
                        	}
                      	}
               		}.bind(this));
                }
                
                // If we don't have to wait for the disconnect then connect now
                Mojo.Log.info("====== connectOrDisconnectDevice: waiting= " + this.deviceAwaitingConnection);
                if (!this.deviceAwaitingConnection) {
                    // Connect to the device now
                    this.connectDevice(addr);
                }                
    
                // The device the user tapped on must show "connecting"
                this.updateDeviceConnectedState(addr);
                this.notifyAssistants(Bluetooth.updateTrustedStatus, addr);
        }
    },

    // Register for general notifications
    subscribeMonitorNotifications: function(register) {
        if (register == "register") {
            // Subscribe for "turning on" notification
            if (!this.monitorServiceCall)
                this.monitorServiceCall = this.btMojoService("palm://com.palm.btmonitor/monitor/subscribenotifications", {subscribe: true}, this.monitorNotificationHandler, true);
        }
        else {
            // Unsubscribe for "turning on" notification
            if (this.monitorServiceCall) {
                this.monitorServiceCall.cancel();
                this.monitorServiceCall = null;
            }
        }
    },

    // Register for general notifications
    subscribeNotifications: function(register) {
        if (register == "register") {
            Mojo.Log.info("====== subscribeNotifications to BT Engine ======");
            // Subscribe for GAP notifications
            if (!this.gapNotificationServiceCall)
                this.gapNotificationServiceCall = this.btMojoService("palm://com.palm.bluetooth/gap/subscribenotifications", {subscribe: true}, this.profGapNotificationHandler, true);
            // Subscribe for PROF notifications
            if (!this.profNotificationServiceCall)
                this.profNotificationServiceCall = this.btMojoService("palm://com.palm.bluetooth/prof/subscribenotifications", {subscribe: true}, this.profGapNotificationHandler, true);
            // Subscribe for OPP notifications
            if (!this.oppNotificationServiceCall)
                this.oppNotificationServiceCall = this.btMojoService("palm://com.palm.bluetooth/opp/subscribenotifications", {subscribe: true}, this.oppNotificationHandler, true);
        }
        else {
            // Unsubscribe for GAP notifications
            Mojo.Log.info("====== UnsubscribeNotifications from BT Engine ======");
            if (this.gapNotificationServiceCall) {
                this.gapNotificationServiceCall.cancel();
                this.gapNotificationServiceCall = null;
            }
            // Unsubscribe for PROF notifications
            if (this.profNotificationServiceCall) {
                this.profNotificationServiceCall.cancel();
                this.profNotificationServiceCall = null;
            }
            // Unsubscribe for OPP notifications
            if (this.oppNotificationServiceCall) {
                this.oppNotificationServiceCall.cancel();
                this.oppNotificationServiceCall = null;
            }
        }
    },

    // Handle notification that device is going to suspend (deep sleep)
    handleSuspendNotification: function(payload) {
        Mojo.Log.info("handleSuspendNotification " + powerClientId + ":" + Object.toJSON(payload));
        if (payload.returnValue)
            return;
    
        // Don't do anything if the radio is off
        if (!this.isRadioOn) {
            this.btMojoService("palm://com.palm.power/com/palm/power/prepareSuspendAck", {"ack":true,"clientId":powerClientId}, null);
            return;
        }

        // Phone should not be visible so allow inbound pairing cannot happen
        this.btMojoService("palm://com.palm.bluetooth/gap/setscanstate", {visible: false, connectable: true}, null );

        this.btMojoService("palm://com.palm.power/com/palm/power/prepareSuspendAck", {"ack":true,"clientId":powerClientId}, null);
    },

    // Handle notification that device is waking from deep sleep
    handleResumeNotification: function(payload) {
        Mojo.Log.info("handleResumeNotification " + powerClientId + ":" + Object.toJSON(payload));
        if (payload.returnValue)
            return;
    
        // Set visibility if the radio is on.  Phone should be visible if full screen
        if (this.isRadioOn)
            this.btMojoService("palm://com.palm.bluetooth/gap/setscanstate", {visible: this.isFullScreen, connectable: true}, null);
    },


    // Start oubound pairing
    startOutboundPairing: function(addr) {
        Mojo.Log.info("====== startOutboundPairing:direction="+ this.pairingDirection+" pairdevAddr:"+this.pairDevAddress + " to:"+addr + "name=" + this.deviceName[addr]);
        
        // Prevent outbound pairing if there is an inbound pairing attempt in progress
        if (this.pairingDirection == "inbound")
            return;

        // Auto-pairing should be attempted for headsets only
        if (this.deviceCoD[addr] && shouldAutoPairBeAttempted(this.deviceCoD[addr], this.deviceName[addr])) {
            this.attemptAutoPair = true;
            this.autoPairAttempted = false;
        }
         
        // Is there an outbound pair attempt in progress already?
        if (this.pairingDirection == "outbound") {
            Mojo.Log.info("====== Cancelling pairing with " + this.pairDevAddress + " and starting pairing with " + addr);
            // The pair attempt in progress must be canceled
            this.sendPairCancel(this.pairDevAddress);

            // Is the pairing attempt to the same device? If so, this just cancels pairing
            if (this.pairDevAddress == addr) {
                this.pairDevAddress = null;
                return;
            }
                    
            // Make a note of the device to pair with
            this.pairDevAddress = addr;
            
            // The pair request will be made once the pair failure notification is received
            return;
        }
        // The pairing is outbound
        this.pairingDirection = "outbound";
        
        // Save Pairing Device Address
        this.pairDevAddress = addr;

        // Send the pair request to Linux
        this.sendPairRequest();      
        
    },

    // Start the pairing process
    sendPairRequest: function() {
        // Make sure the address is valid
        if (!this.pairDevAddress) {
            this.pairingDirection = null;
            return;
        }

        // Let the UI know that pairing to this device has been started
        this.notifyAssistants(Bluetooth.pairingStarted, this.pairDevAddress);
        
        this.btMojoService("palm://com.palm.bluetooth/gap/pair", {address:this.pairDevAddress, cod:this.deviceCoD[this.pairDevAddress]}, null);
    },

    // Cancel pairing to the specified device    
    sendPairCancel: function(addr) {
        // Make sure the address is valid
        if (!addr)
            return;

        // Let the UI know that pairing to this device has been cancelled
        this.notifyAssistants(Bluetooth.pairingComplete, addr);
    
        if (this.pairingUsesSSP)
            this.btMojoService("palm://com.palm.bluetooth/gap/ssppairaccept", {accept:false, address: addr, passkey:0}, null);
        else
            this.btMojoService("palm://com.palm.bluetooth/gap/paircancel", {address: addr}, null);
    },
    
    allowPairing: function(allow) {
        Mojo.Log.info("====== allowPairing: allow = " + allow);
        // BT app is full screen so allow pairing
        if (allow && !this.pairingServiceCall)
            this.pairingServiceCall = this.btMojoService("palm://com.palm.bluetooth/gap/subscribepair", {subscribe:true}, this.pairingNotificationHandler, true); 
        if (!allow && this.pairingServiceCall) {
            this.btMojoService("palm://com.palm.bluetooth/gap/unsubscribepair", null, null); 
            this.pairingServiceCall = null; 
        } 
    },
    
    // Get the name of the device being paired with, then continue handling the pairing notification
    getPairingDeviceName: function (payload) {
        this.btMojoService("palm://com.palm.bluetooth/gap/findremotename",
             {address:payload.address},    
                    function(name) {
                        if (name.returnValue) {
                            payload.name = name.name;
                            // If there really isn't a name, set it to anything so pairing can proceed
                            if (!payload.name) 
                                payload.name = $L("Bluetooth device");
                            else {
                                // Save the name so that it can be used later, if necessary
                                this.deviceName[payload.address] = name.name;
                            }
                                
                            this.handlePairingNotification(payload);
                        }
                        else {
                            this.sendPairCancel(payload.address)
                        }
                    }.bind(this));        
    },

    // Get the remote device name during an inquiry
    getInquiryDeviceName: function(addr, device) {
        Mojo.Log.info("====== getInquiryDeviceName : get name for addr = " + addr);
        this.getRemNameAddrInProgress = addr;
        this.btMojoService("palm://com.palm.bluetooth/gap/findremotename",
                 {address:addr},    
                    function(payload){
                        this.getRemNameAddrInProgress = null;
                        if (payload && payload.returnValue) {
                            Mojo.Log.info("====== getInquiryDeviceName: name of " + addr + " is " + payload.name);
                            device.name = payload.name;

                            // Save the name so that it can be used later, if necessary
                            this.deviceName[addr] = payload.name;

                            // The name was found
                            device.NAMESTATE = "NameOkay";                            
                        }
                        else {
                            Mojo.Log.info("====== getInquiryDeviceName: Getting name failed for addr = " + addr + "   " +  Object.toJSON(payload) );
                            // If updating the name failed just use the old name
                            if (device.NAMESTATE == "UpdateName") 
                                device.NAMESTATE = "NameOkay";
                            else
                                device.NAMESTATE = "NameFailed";
                        }
                        // Let the UI know that the device name has been retrieved
                        this.notifyAssistants(Bluetooth.inqDeviceName, device);
                    }.bind(this));
    },
    
    // Get the remote device name during an inquiry
    cancelGetDeviceName: function() {
        Mojo.Log.info("====== cancelGetDeviceName : addr = " + this.getRemNameAddrInProgress);
        if ( null == this.getRemNameAddrInProgress )
        {
            return;
        }
        
        this.btMojoService("palm://com.palm.bluetooth/gap/findremotenamecancel",
                 {address:this.getRemNameAddrInProgress},    
                    function(payload){
                        Mojo.Log.info("====== cancelGetDeviceName: Cancel Getname response for addr = " + this.getRemNameAddrInProgress + "   " +  Object.toJSON(payload) );
                    }.bind(this));
    },
    
    // Send the passkey to the BT Engine.  Expect the bt.notifnpaired notification next
    sendPasskey: function(passkey) {
        if (this.pairingUsesSSP) {
            if (passkey)
                this.btMojoService("palm://com.palm.bluetooth/gap/ssppairaccept", {accept:true, address:this.pairDevAddress, passkey:passkey}, null);
            else
                this.btMojoService("palm://com.palm.bluetooth/gap/ssppairaccept", {accept:true, address:this.pairDevAddress}, null);
        } else {
            this.btMojoService("palm://com.palm.bluetooth/gap/sendpasskeyresp", {address:this.pairDevAddress, passkey:passkey}, null);
        }
    },
    
    popInquiryScene: function(data) {
        // Tell the Inquiry scene to abort and pop itself
        this.notifyAssistants(Bluetooth.popInquiryScene, data);
    },
    
    popInquirySceneIfPairing: function() {
        if (this.pairingDirection)
            this.popInquiryScene();
    },
    
    // Connect to devices after pairing
    connectToNewlyPairedDevice: function() {
        Mojo.Log.info("====== connectToNewlyPairedDevice ======");
        var addr = this.newlyPairedDevice;
        this.connectToNewlyPairedDeviceTimer = null;
        this.newlyPairedDevice = null;
    
        var device = this.getDeviceFromTrustedList(addr);
        if (!device)
            return;
        Mojo.Log.info("====== connectToNewlyPairedDevice device: " + addr);
            
        // Update the device status now that there is no longer a pending connection to the car kit
        this.updateDeviceConnectedState(addr);
        this.notifyAssistants(Bluetooth.updateTrustedStatus, addr);
        
        // If the device is not connected then connect now
        if (device.CONNECTSTATE == 'disconnected')
            this.connectOrDisconnectDevice(addr);
    },

    // Pop-up the Passkey window to get the passkey from user. 
    promptForPasskey: function(payload) {
        this.showPasskeyDialogBox({prompt:$L("Enter a passkey for “#{name}”").interpolate(payload),
                    topButtonText:$L("Next"),
                    bottomButtonText:$L("Cancel"),
                    showInputField:true,
                    topButtonCb: this.sendPasskey.bind(this),
                    payload:payload});
    },
    
    // Pop-up the Passkey window so the user can confirm the SSP passkey 
    promptToConfirmSSPPasskey: function(payload) {
        Mojo.Log.info("====== promptToConfirmSSPPasskey ======");
        if( isDeviceOfInterest(payload.address, payload.cod, 'Audio') || isDeviceOfInterest( payload.address, payload.cod, 'keyboard') ){
        this.showPasskeyDialogBox({prompt:$L("Does the passkey match with “#{name}”?").interpolate(payload),
                    passkey: "<br><div class=\"bt_ssp_passkey\">" + payload.passkey + "</div>",
                    topButtonText:$L("Yes, connect"),
                    bottomButtonText:$L("No, cancel"),
                    topButtonCb: this.sendPasskey.bind(this),
                    payload:payload});
        }else{            
            this.showPasskeyDialogBox({prompt:$L("Does the passkey match with “#{name}”?").interpolate(payload),
                    passkey: "<br><div class=\"bt_ssp_passkey\">" + payload.passkey + "</div>",
                    topButtonText:$L("Yes, pair"),
                    bottomButtonText:$L("No, cancel"),
                    topButtonCb: this.sendPasskey.bind(this),
                    payload:payload});
        }    
    },
    
    // Pop-up the Passkey window so the user is told to enter the passkey on the remote device (probably a BT keyboard) 
    promptToConfirmSSPRemotePasskey: function(payload) {
        Mojo.Log.info("====== promptToConfirmSSPRemotePasskey ======");
        this.showPasskeyDialogBox({prompt:$L("Enter #{passkey} on “#{name}”").interpolate(payload),
                    bottomButtonText:$L("Cancel"),
                    payload:payload});
    },
   
	// Prompt to enter pin code on remote keyboard even if it doesn't support SSP 
    promptToEnterPasskeyOnKeyboard: function(payload) {
        Mojo.Log.info("====== promptToEnterPasskeyOnKeyboard ======");
		/* Generate a random number to enter passkey */
        payload.passkey = Math.floor(Math.random()*9000)+1000;
		this.showPasskeyDialogBox({prompt:$L("Enter #{passkey} passkey on “#{name}” and then press Enter to connect").interpolate(payload),
                    topButtonText:$L("Next"),
                    bottomButtonText:$L("Cancel"),
                    topButtonCb: this.sendPasskey(String(payload.passkey)),
                    payload:payload});

    },
								 
    // Show the passkey dialog
    showPasskeyDialogBox: function(boxData) {
        Mojo.Log.info("====== showPasskeyDialogBox ======");
        // Make sure there is a scene for the dialog
        if (!this.activeScene)
            return;
        // Hide some fields if not required
        boxData.inputField = boxData.showInputField? "":"display:none";
        boxData.topButtonVisible = boxData.topButtonText? "":"display:none";
    
        boxData.template = 'template/passkey',
        boxData.preventCancel = true;
        boxData.assistant = new passkeyAssistant(this.activeScene, boxData, this);
        
        // Setup the PIN input widget        
        this.activeScene.controller.setupWidget('PINinput', this.PinAttributes, this.PIN);
    
        this.activeScene.controller.showDialog(boxData);
    },

    // Pop-up the confirmation window so the user can confirm the inbound pair notification
    promptForPairingConfirmation: function(payload) {
        var dialog = {template: 'template/allowInbound',
                    preventCancel: true};
            
        // Make sure there is a scene for the dialog
        if (!this.activeScene)
            return;
        // If the device is trusted then use the trusted name (or nickname)
        var device = this.getDeviceFromTrustedList(payload.address);
        if (device) {
            payload.name = device.name;
            dialog.prompt = $L("Allow “#{name}” to pair with this device?").interpolate(payload);
            dialog.assistant = new inboundPairingConfirmationAssistant(this.activeScene, payload, this),
            this.activeScene.controller.showDialog(dialog);
        }
        else {
            // Get the name, even if it was provided
            this.btMojoService("palm://com.palm.bluetooth/gap/findremotename", {address: payload.address}, function(name) {
                if (name.returnValue) {
                    payload.name = name.name;
                    // Save the name so that it can be used later, if necessary
                    this.deviceName[payload.address] = name.name;
                    dialog.prompt = $L("Allow “#{name}” to pair with this device?").interpolate(payload);
                    dialog.assistant = new inboundPairingConfirmationAssistant(this.activeScene, payload, this),
                    this.activeScene.controller.showDialog(dialog);
                }
                else {
                    this.sendPairCancel(payload.address)
                }
            }.bind(this));
        }    
    },

    // If the pairing dialog box is open then close it
    closePairingDialogBox: function() {
        Mojo.Log.info("====== closePairingDialogBox ======");
        // Close the "Allow Inbound Pairing" dialog
        if (this.allowInboundDialog) {
            this.allowInboundDialog.mojo.close();
            this.allowInboundDialog = null;
        }
        // Close the passkey dialog
        if (this.passkeyDialog) {
            this.passkeyDialog.mojo.close();
            this.passkeyDialog = null;
        }
    },

    // Delete the device from the trusted list 
    deleteTrustedDevice: function(addr) {
        // To match what the engine does, make sure no profiles reference this device
        // Notifications should be sent anyway, but to be sure ...
        this.btProfiles.each(function(profile) {
            for (var i = 0; i < this.btProfileStatus[profile].length; i++ )
            {
                if (this.btProfileStatus[profile][i].address === addr)
                {
                    this.btProfileStatus[profile][i].state = "disconnected";
                    if ( i > 0 )
                    {
                        Mojo.Log.info("====== deleteTrustedDevice: deleting index = " + i );
                    
                        delete this.btProfileStatus[profile][i];
                        this.btProfileStatus[profile].length--;
                    }
                }
            } 
        }.bind(this));    
    
        this.btMojoService("palm://com.palm.bluetooth/gap/removetrusteddevice", {address:addr}, null);
    },

    connectProfile: function(inProfile, addr) {
        Mojo.Log.info("====== connectProfile: " + inProfile + " addr: " + addr);

        this.btMojoService("palm://com.palm.bluetooth/prof/profconnect", {profile:inProfile,address:addr}, null);
        
        var index = this.getProfIndexForDevice(inProfile,addr);
        if ( index < 0 )
        {
            Mojo.Log.error("====== connectProfile: cannot find addr = " + addr + " for Profile = " + inProfile );
            return;
        }
        Mojo.Log.info("====== connectProfile: index = " + index );
         
        this.btProfileStatus[inProfile][index].state = "connecting";
        this.btProfileStatus[inProfile][index].address = addr;
    },

    // Connect HFG and/or A2DP profile to the specified device
    connectHfg: function(addr) {
        var device = this.getDeviceFromTrustedList(addr);
        if (!device)
            return;
        Mojo.Log.info("====== connectAudio: " + addr);
    
        // If HFG is supported then do associate and connect to that profile    
        if (isHFGSupported(device.cod)) {
            this.connectProfile( 'hfg', addr );
        }
    },

  connectA2dp: function(addr) {
        var device = this.getDeviceFromTrustedList(addr);
        if (!device)
            return;
        Mojo.Log.info("====== connectAudio: " + addr);
    
        if( isA2DPSupported(device.cod)){
            this.connectProfile( 'a2dp', addr );
        }
    },
    // Connect HF and/or MAP profile to the specified device
    connectHf: function(addr) {
        var device = this.getDeviceFromTrustedList(addr);
        if (!device)
            return;
        Mojo.Log.info("====== connectHf: " + addr);
    
        // If HF is supported then do associate and connect to that profile    
        if (isPhone(device.cod)) 
        {
            this.connectProfile( 'hf', addr );
        }

    },

    connectMapc: function(addr) {
        var device = this.getDeviceFromTrustedList(addr);
        if (!device)
            return;
        Mojo.Log.info("====== connectMapc: " + addr);
    
        if( isMAPSupported(device.cod))
        {
            this.connectProfile( 'mapc', addr );
        }
    },

    connectHid: function(addr) {
        Mojo.Log.info("====== connectHid: " + addr);

        var device = this.getDeviceFromTrustedList(addr);
        if (!device)
            return;

        if( isKeyboard(device.cod) || isGamepad(device.cod) || isMouse(device.cod)) {
            this.btProfileStatus['hid'].push(device);
            this.connectProfile( 'hid', addr );
        }
    },
    
    connectDevice: function(addr) {
        Mojo.Log.info("====== connectDevice: " + addr);
        var device = this.getDeviceFromTrustedList(addr);
        if (!device)
            return;
    
        if( isPhone(device.cod) )
        {
		    //Check eas policy here to decide which profiles to connect
		    if(this.btEasPolicy == this.enumEasPolicy.hfOnly){ 
		        this.connectHf( addr );
		    }else if(this.btEasPolicy == this.enumEasPolicy.allowAllProfs){
                if(device.hfstate == true){
		            this.connectHf( addr );
                }
                if(device.mapstate == true){
		            this.connectMapc( addr );
                }
		        this.connectHid( addr );
		    }
        }
        else if ( isAudioDevice(device.cod) )
        {
		    if(this.btEasPolicy == this.enumEasPolicy.hfgOnly){ 
		        this.connectHfg( addr );
		    }else if(this.btEasPolicy == this.enumEasPolicy.allowAllProfs){
		        this.connectHfg( addr );
		        this.connectA2dp( addr );
		        this.connectHid( addr );
		    }
        }
        else
        {
            if(this.btEasPolicy == this.enumEasPolicy.allowAllProfs){
		        this.connectHid( addr );
            }
        }
    },

    // Disconnect all profiles the device is connected on
    disconnectAllProfiles: function(addr) {
        // Disconnect all profiles
        Mojo.Log.info("====== disconnectAllProfiles : " + Object.toJSON(this.btProfileStatus));
        this.btProfiles.each(function(profile) {
            for (var i = 0 ; i < this.btProfileStatus[profile].length; i++ )
            {
                if (this.btProfileStatus[profile][i] && this.btProfileStatus[profile][i].address == addr && 
                        ( this.btProfileStatus[profile][i].state === 'connecting' || ( this.btProfileStatus[profile][i].state === 'connected' && ( this.btProfileStatus[profile][i].error == undefined || this.btProfileStatus[profile][i].error == 0 ) ) ) )
                {
                    this.disconnectProfile(profile,addr);
                }
            }
        }.bind(this));
    },
    
    // Disconnect a single profile
    disconnectProfile: function(profile, addr) {

        Mojo.Log.info("====== disconnectProfile, addr = " + addr + "profile =" + profile);
        if( addr )
        {
            this.btMojoService("palm://com.palm.bluetooth/prof/profdisconnect", {profile:profile,address:addr}, null);
        }
        else
        {
            this.btMojoService("palm://com.palm.bluetooth/prof/profdisconnect", {profile:profile,address:'00:00:00:00:00:00'}, null);
        }
        
        var index = this.getProfIndexForDevice(profile,addr);
        if ( index < 0 )
        {
            return;
        }
        if (this.btProfileStatus[profile][index])
            this.btProfileStatus[profile][index].state = "disconnecting";
    },

    // Send a file using OPP
    sendOppData: function(addr, file, type, deleteWhenDone) {
        this.btMojoService("palm://com.palm.bluetooth/prof/profconnect", {profile:'opp',address:addr,parameters:{file:file, type:type, deletefile:deleteWhenDone}}, null);
    },

    // Cancel the OPP transfer    
    cancelOpp: function(addr) {
        if (this.radioOn)
            this.disconnectProfile('opp',addr);
    },

    // Mojo service wrapper function
    btMojoService: function(url, params, cb)
    {
        return new Mojo.Service.Request(url, {
            onSuccess: cb,
            onFailure: cb,
            parameters: params,
            }); 
    },
    

    toggleMapState: function(address,isMapAllowed)
    {
        this.btMojoService("palm://com.palm.bluetooth/prof/profsetconfig",{address:address, profile:"mapc",parameters:{enable:isMapAllowed}}, null);
        //update trusted device record with new map setting
        var i;
        for (i = 0; i< this.trustedDevices.length; i++) {
            Mojo.Log.info("====== toggleMapState: given addr = " + address + "found addr = " + this.trustedDevices[i].address);
            if (this.trustedDevices[i].address == address)
                break;
        }
        if (i < this.trustedDevices.length) {
            this.trustedDevices[i].mapstate = isMapAllowed;
        }
    }, 	
    
    toggleAutoConnectState: function(address,isAutoConnectAllowed)
    {
        this.btMojoService("palm://com.palm.bluetooth/prof/profsetconfig",{address:address, profile:"opp",parameters:{enable:isAutoConnectAllowed}}, null);
        //update trusted device record with new auto connect setting
        var i;
        for (i = 0; i< this.trustedDevices.length; i++) {
            Mojo.Log.info("====== toggle Auto Connect State: given addr = " + address + "found addr = " + this.trustedDevices[i].address);
            if (this.trustedDevices[i].address == address)
                break;
        }
        if (i < this.trustedDevices.length) {
            this.trustedDevices[i].autoconnectstate = isAutoConnectAllowed;
        }
    }, 	

    toggleHfState: function(address,isHfAllowed)
    {
        this.btMojoService("palm://com.palm.bluetooth/prof/profsetconfig",{address:address, profile:"hf",parameters:{enable:isHfAllowed}}, null);
        //update trusted device record with new hf setting
        var i;
        for (i = 0; i< this.trustedDevices.length; i++) {
            Mojo.Log.info("====== toggleHfState: given addr = " + address + "found addr = " + this.trustedDevices[i].address);
            if (this.trustedDevices[i].address == address)
                break;
        }
        if (i < this.trustedDevices.length) {
            this.trustedDevices[i].hfstate = isHfAllowed;
        }
    }, 	

});


// Events
Bluetooth.serviceDown = 'serviceDown';                    // The BT service has gone down
Bluetooth.radioOnAndReady = 'radioOnAndReady';            // the Bluetotoh radio is on, all state has been obtained and ready to receive commands
Bluetooth.radioTurningOn = 'radioTurningOn';            // The BT radio is turning on
Bluetooth.radioTurningOff = 'radioTurningOff';            // The BT radio is turning off
Bluetooth.radioOff = 'radioOff';                        // The BT radio has turned off
Bluetooth.trustedDevices = 'trustedDevices';            // List of trusted devices has been updated
Bluetooth.popInquiryScene = 'popInquiryScene';            // Inquiry scene is no longer needed
Bluetooth.restartInquiry = 'restartInquiry';            // Restart inquiry after pairing failure
Bluetooth.disablePairing = 'disablePairing';            // Prevent clicks on Inq scene from initiating pairing
Bluetooth.inqDeviceFound = 'inqDeviceFound';            // Device has been found during device inquiry
Bluetooth.inqDeviceName = 'inqDeviceName';                // The name of a device found during inquiry 
Bluetooth.inqComplete = 'inqComplete';                    // Inquiry has finished
Bluetooth.pairingStarted = 'pairingStarted';            // Pairing to the specified device has started
Bluetooth.pairingComplete = 'pairingComplete';            // Pairing to the specified device is complete
Bluetooth.pairedDevice = 'pairedDevice';                // Broadcast the newly paired device, in case something needs to happen (like OPP)
Bluetooth.updateTrustedStatus = 'updateTrustedStatus';    // The connection status of a trusted device has changed
Bluetooth.cannotConnect = 'cannotConnect';                // The connect attempt failed (HF/MAPC)
Bluetooth.cannotConnectOPP = 'cannotConnectOPP';        // The connect attempt failed (OPP)
Bluetooth.deviceDeleted = 'deviceDeleted';                // A trusted device has been deleted
Bluetooth.deviceRenamed = 'deviceRenamed';                // A trusted device has been renamed
Bluetooth.oppProgressPercent = 'oppProgressPercent';    // OPP push progress, as a percentage
Bluetooth.oppError = 'oppError';                        // OPP error occured
Bluetooth.oppNotSupported = 'oppNotSupported';            // Connection succeeded, but OPP is not supported



// Assistant for the inbound pairing "allow device to pair?" dialog
var inboundPairingConfirmationAssistant = Class.create({
    initialize: function(sceneAssistant, payload, bt) {
        Mojo.Log.info("====== inboundPairingConfirmationAssistant initialize ======");
        this.bt = bt;
        this.sceneAssistant = sceneAssistant;
        this.payload = payload;
        this.handleAllowPairingH = this.handleAllowPairing.bindAsEventListener(this);
        this.handleCancelPairingH = this.handleCancelPairing.bindAsEventListener(this);
    },
    
    setup : function(widget) {
        Mojo.Log.info("====== inboundPairingConfirmationAssistant setup ======");
        // Save the widget so it can be cancelled programatically
        this.bt.allowInboundDialog = widget;
        this.dialog = widget;
        Mojo.Event.listen(this.sceneAssistant.controller.get('allowPairing'), Mojo.Event.tap, this.handleAllowPairingH, false);
        Mojo.Event.listen(this.sceneAssistant.controller.get('cancelPairing'), Mojo.Event.tap, this.handleCancelPairingH, false);
        
        // Turn the screen on (or restart the auto-dim timer)
        this.bt.btMojoService("palm://com.palm.display/control/setState", {state:"on"}, null);
    },
    
    handleAllowPairing: function() {
        Mojo.Log.info("====== inboundPairingConfirmationAssistant handleAllowPairing ======");
        this.dialog.mojo.close();
        this.bt.handlePairingNotification(this.payload);
    },
    
    handleCancelPairing: function() {
        Mojo.Log.info("====== inboundPairingConfirmationAssistant handleCancelPairing ======");
        this.bt.pairDevAddress = null;
        this.bt.pairingDirection = null;
        this.dialog.mojo.close();
        this.bt.sendPairCancel(this.payload.address);
    },
    
    cleanup: function() {
        Mojo.Log.info("====== inboundPairingConfirmationAssistant cleanup ======");
        this.bt.allowInboundDialog = null;
        Mojo.Event.stopListening(this.sceneAssistant.controller.get('allowPairing'), Mojo.Event.tap, this.handleAllowPairingH, false);
        Mojo.Event.stopListening(this.sceneAssistant.controller.get('cancelPairing'), Mojo.Event.tap, this.handleCancelPairingH, false);
    }
});

// Assistant for the passkey dialog
var passkeyAssistant = Class.create({
    initialize: function(sceneAssistant, boxData, bt) {
        Mojo.Log.info("====== passkeyAssistant initialize ======");
        this.bt = bt;
        this.sceneAssistant = sceneAssistant;
        this.boxData = boxData;
        this.bt.PIN.value = undefined;
        this.handleAllowPairingH = this.handleAllowPairing.bindAsEventListener(this);
        this.handleCancelPairingH = this.handleCancelPairing.bindAsEventListener(this); 
        this.handleFocusLostH = this.handleFocusLost.bindAsEventListener(this);
        this.handleEnterH = this.handleEnter.bindAsEventListener(this);
    },
    
    setup : function(widget) {
        Mojo.Log.info("====== passkeyAssistant setup ======");
        // Save the widget so it can be cancelled programatically
        this.bt.passkeyDialog = widget;
        this.dialog = widget;
        Mojo.Event.listen(this.sceneAssistant.controller.get('allowPasskey'), Mojo.Event.tap, this.handleAllowPairingH, false);
        Mojo.Event.listen(this.sceneAssistant.controller.get('cancelPasskey'), Mojo.Event.tap, this.handleCancelPairingH, false);
        Mojo.Event.listen(this.sceneAssistant.controller.get('PINinput'), 'blur', this.handleFocusLostH, true);
        
        // Listen for the Enter key
        this.sceneAssistant.controller.listen(this.dialog, Mojo.Event.propertyChange, this.handleEnterH);

        // Turn the screen on (or restart the auto-dim timer)
        new Mojo.Service.Request("palm://com.palm.display/control/setState", {parameters: {state: "on"}});
    },    
    
    handleEnter: function(event) {
        if (event && event.originalEvent && Mojo.Char.isEnterKey(event.originalEvent.keyCode)) {
            this.handleAllowPairingH();
        }
    },
    
    handleAllowPairing: function() {
        Mojo.Log.info("====== passkeyAssistant handleAllowPairing ======");
        // Get the callback depending on which button was pressed
        var cb = this.boxData.topButtonCb;
        var cbData = this.boxData.topButtonCbData;
                
        // If there is callback data then use that, otherwise use the input field on the dialog (if it exists)
        if (!cbData && this.boxData.showInputField) {
            cbData = this.bt.PIN.value;
            // Check for passkey value. Don't accept no value 
            if (!cbData)
                return;
        }        

        // Close the dialog box
        this.dialog.mojo.close();

        // Call the callback now
        if (cb)
            cb(cbData);
    },
    
    handleCancelPairing: function() {
        Mojo.Log.info("====== passkeyAssistant handleCancelPairing ======");
        this.bt.pairDevAddress = null;
        this.bt.pairingDirection = null;
        this.dialog.mojo.close();
        this.bt.sendPairCancel(this.boxData.payload.address);
    },
    
    handleFocusLost: function() {
        // Keep the focus on the PIN Input field
        setTimeout(this.sceneAssistant.controller.get('PINinput').mojo.focus, 0);
    },
    
    cleanup: function() {
        Mojo.Log.info("====== passkeyAssistant cleanup ======");
        this.bt.passkeyDialog = null;
        Mojo.Event.stopListening(this.sceneAssistant.controller.get('allowPasskey'), Mojo.Event.tap, this.handleAllowPairingH, false);
        Mojo.Event.stopListening(this.sceneAssistant.controller.get('cancelPasskey'), Mojo.Event.tap, this.handleCancelPairingH, false);
        Mojo.Event.stopListening(this.sceneAssistant.controller.get('PINinput'), 'blur', this.handleFocusLostH, true);
    }
});
