/* Copyright 2009 Palm, Inc.  All rights reserved. */

var BluetoothAssistant = Class.create({
	initialize: function(bluetooth) {
		// Get the Bluetooth state from the app assistant
		this.bt = Mojo.Controller.getAppController().assistant.bt;
		
		// Register this assistant as being interested in BT events
		this.btEventHandler = this.handleBtEvent.bind(this);
		this.bt.registerAssistant(this.btEventHandler);
		
		// Initialize the variables
		this.trustedDeviceList = [];
		this.onViewVisible = false;
		this.defaultMessageTimer = null;
		this.btStarted = false;
	},
	
	setup: function() {
        Mojo.Log.info("****** BT Setup ****** ");
		this.trustedListWidget = this.controller.get('trustedlist');
		this.msgAreaWidget = this.controller.get('btmsgarea');
		this.msgAreaSpinner = this.controller.get('bt_msg_spinner');
		this.msgSpinnerWidget = this.controller.get('msgspinner');
		this.onOffWidget = this.controller.get('btradioonoff');
		this.btOnView = this.controller.get('bt-on-view');

		this.trustedListModel = {
			listTitle: $L('Devices'),
            items: this.trustedDeviceList
        };
        
        this.template = {
            itemTemplate: 'bluetooth/listitem',
            listTemplate: 'bluetooth/listcontainer',
            addItemLabel: $L("Add device"),
			swipeToDelete: true,
        };

		this.controller.setupWidget('trustedlist', this.template, this.trustedListModel);
		
		this.textAttributes = {
			enterSubmits: true,
			focus: false,
			multiline: false,       
			modifierState: Mojo.Widget.sentenceCase,
			focusMode: Mojo.Widget.focusSelectMode,
			maxLength: 40,
			holdToEdit: true,
			modelProperty: "name",
		};
		
		// Setup the 'rename device' widget		
		this.controller.setupWidget('bt_rename', this.textAttributes, {});
		
		// App Menu - Remove default items and add only Edit & Help items.
		var appMenuModel = {
	        visible: true,
            items: [{label:$L('Help'), command:Mojo.Menu.helpCmd}]
        };
		this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems:true}, appMenuModel);
		
		Mojo.Event.listen(this.trustedListWidget, Mojo.Event.listAdd, this.listAddHandler.bindAsEventListener(this), false);
		Mojo.Event.listen(this.trustedListWidget, Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this), false);
		Mojo.Event.listen(this.trustedListWidget, Mojo.Event.listDelete, this.listDeleteHandler.bindAsEventListener(this), false);
		Mojo.Event.listen(this.trustedListWidget, Mojo.Event.propertyChange, this.listChangeHandler.bindAsEventListener(this), false);
		
		// Model for the radio on/off toggle
	    this.radioOnOffModel = {
	        value: false,
			disabled: true,
	    },
		
		this.controller.setupWidget('btradioonoff', {}, this.radioOnOffModel);
		Mojo.Event.listen(this.onOffWidget, Mojo.Event.propertyChange, this.radioOnOffHandler.bindAsEventListener(this), false);

		this.btAppHasFocusHandler = this.btAppHasFocus.bind(this);
		this.btAppHasLostFocusHandler = this.btAppHasLostFocus.bind(this);
		Mojo.Event.listen(this.controller.document, Mojo.Event.activate, this.btAppHasFocusHandler, false);
		Mojo.Event.listen(this.controller.document, Mojo.Event.deactivate, this.btAppHasLostFocusHandler, false);
		
		// Connect to the service, register for notifications and get current status
		this.btStarted = this.bt.startBT();
		
	},
	
	activate: function(params) {		
		Mojo.Log.info("****** BT activate ****** ");
		
        // If BT was already started, get the status now
        if (this.btStarted) {
            if (this.bt.isRadioOn) {
                this.handleBtEvent(Bluetooth.radioOnAndReady);
                this.handleBtEvent(Bluetooth.trustedDevices);
            }
            else
                this.handleBtEvent(Bluetooth.radioOff);
            
            this.btStarted = false;

            if (this.bt.uiDebugMode)
                this.frameworkDebug();
        }

		// This is the active scene for passkey dialogs
		this.bt.setActiveScene(this);
		this.bt.setFullScreen(true);
		
		if (this.bt.uiDebugMode)
			this.bt.promptForPasskey({name:"Hello"});
	},

	// Handle Bluetooth events
	handleBtEvent: function(event, data) {
		Mojo.Log.info("****** handleBtEvent: " + event);
		switch (event) {
			case Bluetooth.serviceDown:
            case Bluetooth.radioOff:
				if (this.bt.uiDebugMode)
					break;
				// The BT service is down
				if (this.bt.monitorServiceUp) {
					// Enable the button if the monitor service is up
					this.radioOnOffModel.disabled = false;
				}
				else {
					// Disable the button if the monitor service is down too
					this.radioOnOffModel.disabled = true;
				}
				this.controller.modelChanged(this.radioOnOffModel, this);
				this.showBtOnView(false, true);
				this.showDefaultMessage();
				break;
				
			case Bluetooth.radioOnAndReady:

				// Enable the radio on/off toggle switch
				this.radioOnOffModel.disabled = false;
				this.controller.modelChanged(this.radioOnOffModel, this);

				// Register for pairing notifications (and allow inbound pairing)
				this.bt.allowPairing(true);

                // Show the on/off view
                this.showBtOnView(true);
                
				break;
				
			case Bluetooth.radioTurningOn:
				// Show the turning on message
				this.showStatusMessage($L("Bluetooth is turning on ..."), false, true, 0);
				// Set the on/off toggle to "on"
				this.radioOnOffModel.value = true;
				this.controller.modelChanged(this.radioOnOffModel, this);
				break;
				
			case Bluetooth.radioTurningOff:
				// The radio is turning off
				this.showBtOnView(false, true);
				
				// Update the list of trusted devices to show that none are connected
				// Intentional fall-through
			
			case Bluetooth.trustedDevices:
				// Empty the list first
				this.trustedDeviceList.clear();
				for (var i = 0; i < this.bt.trustedDevices.length; i++)
					this.addTrustedDevice(this.bt.trustedDevices[i]);
				// Update the Model to refresh the UI
				this.controller.modelChanged(this.trustedListModel, this);
				break;
				
			case Bluetooth.deviceDeleted:
				var i;
				for (i = 0; i< this.trustedDeviceList.length; i++) {
					if (this.trustedDeviceList[i].address == data)
						break;
				}
				if (i < this.trustedDeviceList.length) {
					// Remove the device from the model
					this.trustedDeviceList.splice(i, 1);
					
					// Update the UI too
					this.trustedListWidget.mojo.noticeRemovedItems(i, 1);
				}
				break;
				
			case Bluetooth.updateTrustedStatus:
				this.updateTrustedDeviceDisplay(data);
				break;
				
			case Bluetooth.cannotConnect:
				switch (data) {
                    case 'hid':
			    	    this.showStatusMessage($L("Unable to connect to Keyboard (HID) profile"), true, false, 5000);
				        break;
                    case 'hfg':
                    case 'hf':
			    	    this.showStatusMessage($L("Unable to connect Headset (Hands-Free) profile"), true, false, 5000);
				        break;
                    case 'a2dp':
			    	    this.showStatusMessage($L("Unable to connect Wireless Stereo (A2DP) profile"), true, false, 5000);
					case 'mapc':
			    	    this.showStatusMessage($L("Unable to connect Messaging (MAP) profile"), true, false, 5000);

				        break;

		    }
				break;
				
			case Bluetooth.restartInquiry:
				Mojo.Log.info("****** Bluetooth.restartInquiry = " + data);
				if (data)
					this.showStatusMessage($L("Pairing failed."), true, false, 5000);
				break;


		}
	},
	
	// Cleanup because this scene is no longer running
	cleanup: function() {	
		// BT App is no longer running
		Mojo.Log.info("****** BT Cleanup ******");
		
		// Phone should not be visible so allow inbound pairing cannot happen
		this.bt.setVisibilityAndConnectability(false, true);
	
		// Inbound pairing is only allowed in the BT app, and the BT app is closing
		// so cancel any inbound pairing attempt in progress
		this.bt.cancelInboundPairing();
		
		// Close the pairing dialog box if it is still showing
		this.bt.closePairingDialogBox();

		// Unregister this assistant from interesting BT events
		this.bt.unregisterAssistant(this.btEventHandler);

		// Stop listening for window focus events
		Mojo.Event.stopListening(this.controller.document, Mojo.Event.activate, this.btAppHasFocusHandler, false);
		Mojo.Event.stopListening(this.controller.document, Mojo.Event.deactivate, this.btAppHasLostFocusHandler, false);
	},
	
	// Main Bluetooth scene is no longer top scene	
	deactivate: function() {
		Mojo.Log.info("****** BT deactivate ******");
	},
	
	listDeleteHandler: function(event) {
		// Delete the device without further prompting
		Mojo.Log.info("****** listDeleteHandler: " + event.item.address);
		this.deleteTrustedDevice(event.item.address);
	},	
	
	listTapHandler: function(event) {
		// User tapped on a trusted device
		Mojo.Log.info("****** listTapHandler: " + event.item.address);
		Mojo.Log.info("****** listTapHandler: " + event.item.name);
		this.handleTapOnTrustedList(event.item.address);
	},
	
	listAddHandler: function(event) {
		// User tapped on "Add device"
		Mojo.Log.info("****** listAddHandler ******");
		// Tell other scenes to abort inquiry
		this.bt.popInquiryScene({relaunchingInquiry:true});
        if(this.bt.btEasPolicy == this.bt.enumEasPolicy.allowAllProfs){
		Mojo.Controller.stageController.pushScene('inquiry');		
        }else if(this.bt.btEasPolicy == this.bt.enumEasPolicy.hfOnly){
            this.controller.stageController.pushScene('inquiry', {hfOnly:true, hideOnOffToggle:true, title:$L("Search devices")});	
        }
	},
	
	listChangeHandler: function(event) {
		Mojo.Log.info("****** listChangeHandler ******");
		// Make sure that it is the name that has changed
		if (event.property !== 'name' || !event.model)
			return;
			
		// Find the list item that was tapped on
		var device = this.getDeviceFromTrustedList(event.model.address);
		if (!device)
			return;
			
		// Get the old and new names
		var oldName = event.oldValue;
		var newName = event.model.name;
		var sanitizedName = newName? newName.strip(): "";
		
		// If the new name is invalid then revert it
		if (sanitizedName.length == 0) {
			device.name = oldName;
			this.updateTrustedDeviceDisplay(device.address);
			return;
		}
		
		// If the sanitized name is not the same as what the user entered then change it now
		if (sanitizedName != newName) {
			device.name = sanitizedName;
			this.updateTrustedDeviceDisplay(device.address);
		}

		Mojo.Log.info("****** NAME CHANGE: From " + oldName + " to " + sanitizedName + "    was " + event.model.name);
		if (this.bt.uiDebugMode)
			return;
			
		// Update the list to show the new name (revert it later if there was an error saving it)
		this.bt.btMojoService("palm://com.palm.bluetooth/gap/setremotenickname", {address: device.address, name: sanitizedName}, 
				function(payload){
					// Revert the name if changing it was unsuccessful
					if (!payload.returnValue) {
						device.name = oldName;
						this.updateTrustedDeviceDisplay(device.address);
					}
				}.bind(this));
	},
	
	radioOnOffHandler: function(event) {
		if (this.bt.uiDebugMode) {
			this.bt.isRadioOn = !this.bt.isRadioOn;
			this.showBtOnView(this.bt.isRadioOn);
			return;
		}
		
		// Disable the toggle button until:
		// 1. Turning radio off -> stack and engine must restart
		// 2. Turing radio on -> notifnradioon is received
		this.radioOnOffModel.disabled = true;
		this.controller.modelChanged(this.radioOnOffModel, this);

		// Send the on/off change to the engine
		this.bt.toggleRadioState();
	},

	// BT App is running full-screen 
	btAppHasFocus: function(event) {
		// Make sure the event is for this scene
		if (event.target != this.controller.document)
			return
		Mojo.Log.info("****** btAppHasFocus ******");
	
		this.bt.setFullScreen(true);
	    // Don't do anything if the radio is off 
	    if (!this.bt.isRadioOn) 
	        return; 
	         
	    // Allow pairing requests 
		this.bt.allowPairing(true);
	     
		// Force the update to update the discoverability message
		this.showBtOnView(true, true);
	},

	// BT App is not running full-screen anymore 
	btAppHasLostFocus: function(event) { 
		// Make sure the event is for this scene
		if (event.target != this.controller.document)
			return
		Mojo.Log.info("****** btAppHasLostFocus ******");
	
		this.bt.setFullScreen(false);
	    // Don't do anything if the radio is off 
	    if (!this.bt.isRadioOn) 
	        return; 
	 
	    // Phone should not be visible so allow inbound pairing cannot happen 
	    this.bt.setVisibilityAndConnectability(false, true); 
	     
	    // Pairing is no longer allowed 
		this.bt.allowPairing(false);

		// If currently pairing, then the Inquiry scene should pop itself
		this.bt.popInquirySceneIfPairing();

	    // If currently pairing, then cancel it 
		this.bt.cancelInboundPairing();
		
		// Close the pairing dialog box if it is still showing
		this.bt.closePairingDialogBox();

		this.showDefaultMessage(); 
	},
	
	// Show the view corresponding to the radio state 
	showBtOnView: function(on, override) {
		Mojo.Log.info("****** showBtOnView ****** on="+on + " override=" + override);
		if (on && (!this.onViewVisible || override)) {
			Mojo.Log.info("****** showBtOnView - turning on ******");
			this.onViewVisible = true;
			this.radioOnOffModel.value = true;
			this.controller.modelChanged(this.radioOnOffModel, this);
			this.showDefaultMessage();
			
			this.btOnView.show();
			this.controller.showWidgetContainer(this.btOnView);
			
			// Set the device visibility to always off
			this.bt.setVisibilityAndConnectability(false, true);
		}
		
		if (!on && (this.onViewVisible || override)) {
			Mojo.Log.info("****** showBtOnView - turning off******");
			this.onViewVisible = false;
			this.radioOnOffModel.value = false;
			this.controller.modelChanged(this.radioOnOffModel, this);
			// If any items are in delete/undo state then restore them
			for (var i = 0; i < this.trustedListModel.items.length; i++) {
				if (this.trustedListModel.items[i].deleted) {
					delete this.trustedListModel.items[i].deleted;
					this.trustedListWidget.mojo.noticeUpdatedItems(i, [this.trustedDeviceList[i]]);
				}				
			}
			this.btOnView.hide();
			this.showStatusMessage($L("Bluetooth is turning off ..."), false, true, 0);
		}	
	},

	// Show the default message in the message box
	showDefaultMessage: function() {
		var msg = $L("Bluetooth is off, no devices connected.");
		if (this.onViewVisible) {
				msg = $L("");
		}
		this.showStatusMessage(msg, false, false, 0);
	},

	showStatusMessage: function(msg, error, spinner, timeToDisplayMsg) {
		Mojo.Log.info("****** showStatusMessage: msg=" + msg + " error=" + error + " time=" + timeToDisplayMsg);
		// Display the message
		this.msgAreaWidget.innerHTML = msg;
		
		// Is this an error message?
		if (error)
			this.msgAreaWidget.addClassName('error');
		else
			this.msgAreaWidget.removeClassName('error');
	
		// Should the spinner be displayed?
		if (spinner) {
			this.msgAreaSpinner.addClassName('active');
			this.msgSpinnerWidget.mojo.start();
		}
		else {
			this.msgAreaSpinner.removeClassName('active');
			this.msgSpinnerWidget.mojo.stop();		
		}
			
		// If there is currently a timer to display the default message then clear it now
		if (this.defaultMessageTimer) {
			clearTimeout(this.defaultMessageTimer);
			this.defaultMessageTimer = null;
		}
		
		// Should the default message be displayed after a while?
		if (timeToDisplayMsg)
			this.defaultMessageTimer = setTimeout(this.showDefaultMessage.bind(this), timeToDisplayMsg);	
	},

	// Add a trusted device to the list of trusted devices
	addTrustedDevice: function(payload) {
		Mojo.Log.info("****** addTrustedDevice: " + Object.toJSON(payload));
		
		// Insert CoD icon
		payload.ICON = getIconFile( payload.address, payload.cod, payload.name);
		
        payload.DISABLED = 'disabled';
        payload.HIGHLIGHT = '';
		// Find out the Device Type - Is it Audio device or HID or Other (PAN etc.,) ?
		if (isAudioDevice(payload.cod)) 
		{ 
			payload.DEVICETYPE = 'Audio';
			payload.DISABLED = '';
	        payload.HIGHLIGHT = 'x-mojo-tap-highlight="momentary"';
		}
		else if (isPhone(payload.cod))
        {
            payload.DEVICETYPE = 'Phone';
            payload.DISABLED = '';
            payload.HIGHLIGHT = 'x-mojo-tap-highlight="momentary"';
        }
		else if (isKeyboard(payload.cod))
		{
            payload.DEVICETYPE = 'Keyboard';
		}
        else if (isGamepad(payload.cod))
        {
            payload.DEVICETYPE = 'Gamepad';
        }
        else if (isMouse(payload.cod))
        {
            payload.DEVICETYPE = 'Mouse';
        }
		else 
		{
			payload.DEVICETYPE = 'Other';
		}
		
		// Add it to the list array - The order of the list is to show all the audio devices top 
		// and other devices in the bottom.
		if (payload.DEVICETYPE == 'Audio') {
			// Insert between Audio and Other Devices.
			var position;
			for (position = 0; position< this.trustedDeviceList.length; position++) {
				if (this.trustedDeviceList[position].DEVICETYPE == 'Other')
					break;
			}
			this.trustedDeviceList.splice(position,0,payload);				
		}
		else
			this.trustedDeviceList.push(payload);
	
		// Added the elements that show connected status
		this.bt.updateDeviceConnectedState(payload.address);
	},

	getDeviceFromTrustedList: function(addr) {
		if (!addr)
			return undefined;
		for (var i = 0; i< this.trustedDeviceList.length; i++) {
			if (this.trustedDeviceList[i].address == addr) {
				return this.trustedDeviceList[i];
			}									
		}
		return undefined;	
	},

	updateTrustedDeviceDisplay: function(addr) {
		for (var i = 0; i< this.trustedDeviceList.length; i++) {
			if (this.trustedDeviceList[i].address == addr) {
				this.trustedListWidget.mojo.noticeUpdatedItems(i, [this.trustedDeviceList[i]]);
				break;
			}									
		}
	},

	// Delete the device from the trusted list 
	deleteTrustedDevice: function(addr) {
		var i;
		if (!addr)
			return;
			
		for (i = 0; i< this.trustedDeviceList.length; i++) {
			if (this.trustedDeviceList[i].address == addr)
				break;
		}
	
		if (i < this.trustedDeviceList.length) {
			// This device will be removed from the UI, but remove it from the model too
			this.trustedDeviceList.splice(i, 1);
			
			// Get the BT engine to remove the device
			this.bt.deleteTrustedDevice(addr);
		}
	},

	// Connect or disconnect the device that the user tapped on (in the "Audio" group)
	handleTapOnTrustedList: function(addr) {
        // Find the device that was tapped on
        var device = this.getDeviceFromTrustedList(addr);
        if (!device)
        {
            return;// Do nothing if the device is not in the trusted list.
        }
	
		if (this.bt.uiDebugMode) 
		{
			if (device.spinning)
				device.spinning = false;
			else
				device.spinning = true;
			this.updateTrustedDeviceDisplay(addr);
			return;
		}
		
        //check if tapped on info icon
	    if("profile-setting" == event.originalEvent.target.title && isPhone(device.cod)) {
            this.controller.stageController.pushScene('profilephone-details', event.item);
			return;
        } else if ( device.DEVICETYPE != "Audio" && device.DEVICETYPE != "Phone" && device.DEVICETYPE != "Gamepad" && device.DEVICETYPE != "Mouse" && 
                ( device.CONNECTSTATE === "disconnected" || device.CONNECTSTATE === "connectcapable") )
        {
            return;
        }
		
		this.bt.connectOrDisconnectDevice(addr)
	},

	handleCommand: function(event) {
		if (event.type == Mojo.Event.command) {
			if (event.command == Mojo.Menu.helpCmd) {
				 this.bt.btMojoService("palm://com.palm.applicationManager/open",
                                  {'id': 'com.palm.app.help','params': {'target': 'http://help.palm.com/bluetooth/index.html'}});       
			}
		}
	},	

	frameworkDebug: function() {
		// Populate the lists with dummy data so that framework and UI can be debugged
		this.bt.btProfileStatus['hfg'][0] = new Object();
		this.bt.btProfileStatus['a2dp'][0] = new Object();
		this.bt.btProfileStatus['pan'][0] = new Object();
		this.bt.btProfileStatus['hfg'][0].state = 'disconnected';
		this.bt.btProfileStatus['pan'][0].state = 'disconnected';
		this.bt.btProfileStatus['a2dp'][0].state = 'disconnected';
		
		this.trustedListModel.items = [
			{address:"00:11:22:33:44:55", cod:"1024", ICON:'headset', name:"HFG is now connected", DEVICETYPE:'Audio', DISABLED:'', CONNECTSTATE:'connected', CONNECTSTATE_HFG:'connected', SHOW_PAN_ICON:'', spinning:false},
			{address:"00:11:22:33:44:56", cod:"1024", ICON:'headset_a2dp', name:"HFG and A2DP up!", DEVICETYPE:'Audio', DISABLED:'', CONNECTSTATE:'connected', CONNECTSTATE_HFG:'connected', CONNECTSTATE_A2DP:'connected', SHOW_PAN_ICON:'', spinning:false},
			{address:"01:11:22:33:44:57", cod:"1024", ICON:'carkit', name:"Carkit is spinning", DEVICETYPE:'Audio', DISABLED:'', CONNECTSTATE:'connecting', SHOW_PAN_ICON:'', spinning:true},
			{address:"02:11:22:33:44:58", cod:"1024", ICON:'a2dp', name:"Disconnected Audio device", DEVICETYPE:'Audio', DISABLED:'', CONNECTSTATE:'disconnected', SHOW_PAN_ICON:'', spinning:false},
			{address:"03:11:22:33:44:59", cod:"1024", ICON:'phone', name:"Phone not enabled today", DEVICETYPE:'', DISABLED:'disabled', CONNECTSTATE:'disconnected', SHOW_PAN_ICON:'', spinning:false},
			{address:"04:11:22:33:44:60", cod:"1024", ICON:'computer', name:"Laptop with PAN", DEVICETYPE:'', DISABLED:'disabled ', CONNECTSTATE:'connected', SHOW_PAN_ICON:'enabled', spinning:false},
			{address:"05:11:22:33:44:61", cod:"1024", ICON:'computer', name:"Laptop Spin", DEVICETYPE:'', DISABLED:'disabled ', CONNECTSTATE:'connecting', SHOW_PAN_ICON:'', spinning:true},
		];
		this.controller.modelChanged(this.trustedListModel, this);
	},
});
