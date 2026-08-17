/*globals enyo */

enyo.kind({
	name: "IncomingCallImpl",
	kind: "VFlexBox",
	className: "incoming-call",
	wideClassName: "incoming-call-wide",
	fullImgClassName: "incoming-call-full",
	isWideLayout: false,
	wideWidth: 320,
	pack: "end",
	incomingLine: {},
	chrome: [
		// button area (subclass provides components[])
		{name: "client"},

		//Service calls
		{name: "wiredSubscription", kind:"PalmService", service:"palm://com.palm.keys/headset/", method: "status", subscribe: true, onSuccess: "onWiredButtonEvent", onFailure: "onWiredButtonEvent"},
		
		// todo use enyo.application.SystemStatus for these
		{name: "lockSubscription", kind:"PalmService", service:"palm://com.palm.systemmanager/", method: "getLockStatus", subscribe: true, onSuccess: "onLockStatusEvent", onFailure: "onLockStatusEvent"},
		{name: "dockModeSubscription", kind:"PalmService", service:"palm://com.palm.systemmanager/", method: "getDockModeStatus", subscribe: true, onSuccess: "dockModeStatusEvent", onFailure: "dockModeStatusEvent"},
		{name: "lockButtonSubscription", kind:"PalmService", service:"palm://com.palm.systemmanager/", method: "lockButtonTriggered", subscribe: true, onSuccess: "onLockButtonEvent", onFailure: "onLockButtonEvent"},

		{name: "sliderSubscription", kind:"PalmService", service:"palm://com.palm.keys/switches/", method: "status", subscribe: true, onSuccess: "onSliderEvent", onFailure: "onSliderEvent"},

		{name: "powerButtonSubscribe", kind:"PalmService", service:"palm://com.palm.display/control/", subscribe: true},
		{name: "dnastSub", kind:"PalmService", service:"palm://com.palm.display/control/", subscribe: true, },

		{name: "muteRingtone", kind:"PalmService", service:"palm://com.palm.audio/ringtone/", method: "setMuted"},
		
		{kind: "ApplicationEvents", onWindowDeactivated: "windowDeactivatedHandler"},
	],
	resizeHandler: function() {
		this.inherited(arguments);
	    if (document.body.offsetWidth > this.wideWidth) {
	        this.addClass(this.wideClassName);
	        //this.$.lockScreenContent.setDisabled(true);
	        this.isWideLayout = true;
	    } else {
	        this.removeClass(this.wideClassName);
	        //this.$.lockScreenContent.setDisabled(false);
	        this.isWideLayout = false;
	    }

	    this.contactImgSrcChanged();
	},
	contactImgSrcChanged: function() {
	    this.$.picContainer.hide();
	    if (this.isWideLayout) {
	        this.removeClass(this.fullImgClassName);
	        this.applyStyle("background-image", "none");
	    } else {
	        if (this.picLoc != undefined) {
	            this.addClass(this.fullImgClassName);
	            //this.applyStyle("background-image", this.picLoc);
	            this.applyStyle("background-image", "none");
	            
	            if(this.incomingLine.calls[0].contact.picture.src) {
					if (this.hasClass("incoming-call-small")) this.addClass("incoming-small-has-image");
	            	this.$.picContainer.show();
					
					if (enyo.application.isTablet && this.incomingLine.calls[0].contact.picture.src == "images/contacts-unknown-icon-large.png")
						this.$.incomingCallPic.setSrc("../phoneApp/images/list-avatar-default.png");
					else
	            		this.$.incomingCallPic.setSrc(this.incomingLine.calls[0].contact.picture.src);
					
	            }
	        } 
	    }
	},
	create: function() {
	    var soundClass,
	    soundFile;

	    this.inherited(arguments);
	    
	    //Workaround: Changed 2nd param to "01" from "", because enyo thinks 2nd param is null and removes the attribute, and has no effect.
	    this.$.lockScreenContent.setAttribute("x-palm-popup-content","01"); //informs lunasysmgr the content to show in lock screen
	    this.resizeHandler();

	    enyo.require(enyo.windowParams.line, "ActiveCallLineIncoming doesn't have an incoming call");
	    this.incomingLine = enyo.windowParams.line;
	    //enyo.log("ActiveCallLineIncoming = " + JSON.stringify(enyo.windowParams));
	    var call = this.incomingLine.calls[0];

	    this.$.displayNumber.setContent(call.contact.addressFormatted || call.contact.address || $L("Unknown"));
		if (this.$.displayNumber.getContent() != enyo.application.Messages.blockedNumber) {
			this.$.displayName.setContent(call.contact.name || call.contact.displayName || $L("Unknown"));
			this.$.numberType.setContent(call.contact.labelFormatted || call.contact.locationFormatted || "");
		}

	    if (call.contact.picture.src != undefined) {
	        this.picLoc = "url(" + call.contact.picture.src + ")";
	        this.contactImgSrcChanged();
	    } 


	    this.exposed = true;
	    this.blockIgnore = true;
	    this.exitStatus = "";
	    this.muted = false;

	    // NOTE: this is a potentially dangerous assumption
	    // as long as the subscription doesn't provide initial status, this will be fine.
	    this.sliderOpen = false;

	    this.defaultCallOnCallSound = enyo.application.SystemStatus.getDefaultCallOnCallSound();

	    if (enyo.application.CallSynergizer.activeLine()) {
	        if (enyo.application.Cache.platformType == "gsm") {
	            soundClass = "alarm";
	        } else {
	            soundClass = "none";
	        }
	    } else {
	        soundClass = "ringtones";
	    }

	    if (!enyo.application.CallSynergizer.activeLine() && call.contact.ringtoneLoc) {
	        soundFile = call.contact.ringtoneLoc;

	    } else if (enyo.application.CallSynergizer.activeLine() && enyo.application.Cache.platformType == "gsm") {
	        soundFile = this.defaultCallOnCallSound;
	    }

	    if (window.PalmSystem) {
	        if (soundFile == undefined) {
	            PalmSystem.setAlertSound(soundClass);
	        } else {
	            PalmSystem.setAlertSound(soundClass, soundFile);
	        }
	    }

	    this.$.wiredSubscription.call({});
	    this.$.lockSubscription.call({});
	    this.$.dockModeSubscription.call({});
	    this.$.lockButtonSubscription.call({});
		
	    this._onPuckEventFunc = enyo.hitch(this, "onPuckEvent")
	    enyo.application.puckInterface.addPuckStateListener(this._onPuckEventFunc);
	    this.puckConnected = true;
	    
	    this.$.sliderSubscription.call({});
	    this.powerButtonListen();
	    this.displayLock();

	    /*this.$.sysmanagerService.call({
				passCode: this.$.pin,
				lockMode: "pin"
			},{
				method: 'setDevicePasscode',
				onSuccess: "onSetPin",
				onFailure: "onSetPin"	
			});*/
		this._updateFunc = enyo.hitch(this,"updateWithCallState");
		enyo.application.CallSynergizer.registerCallStateQuery(this._updateFunc);
		
		//enyo.log("CNAP: Incoming call register for late contact updates from network");
		this._updateContact = enyo.hitch(this,"updateContactDetails");
		this.incomingLine.calls[0].contact.addContactUpdateListener(this._updateContact);
		
		//CFISH-9595 - Incoming call may have already disconnected before we registering for change in call state
		this.updateWithCallState(enyo.application.CallSynergizer.lines());

		enyo.application.Cache.incomingCallPopupLoading = false;
	},

	destroy: function() {
		
		this.mute();
               
		// if no exit status, assume it was hidden before answering, ignoring, or rejecting
		if (! this.exitStatus ) {
		   this.addDashboard();
		}
		
		enyo.application.puckInterface.removePuckStateListener(this._onPuckEventFunc);
	
		enyo.application.CallSynergizer.unregisterCallStateQuery(this._updateFunc);
		
		//enyo.log("CNAP: Incoming call unregister late updates notifications");
		this.incomingLine.calls[0].contact.removeContactUpdateListener(this._updateContact);
		
		// just in case we never opened, turn off power and display blocks
		enyo.job.stop("powerButtonListen");
		enyo.job.stop("displayLock");
		           		
		this.inherited(arguments);
	},
	
	windowDeactivatedHandler: function() {
		close();
	},
	
	addDashboard : function () {
		var call = this.incomingLine.calls[0];
		var displayName = call.contact.name || call.contact.displayName || $L("Unknown number");
		var displayLabel = call.contact.locationFormatted || "";
		var dashBoardTitle = "";
		var displayNumber = call.contact.addressFormatted || "";

		if (displayLabel != "") {
			var contactWithLabel = $L("#{contact} - #{label}");
			dashBoardTitle = enyo.application.Utils.interpolate(contactWithLabel, {
			    "contact": displayName,
			    "label": displayLabel
			});
		} else {
			dashBoardTitle = displayName;
		}
		
		enyo.application.CallSynergizer.addIncomingDash(dashBoardTitle, displayNumber, this.incomingLine);
	},
	
	updateContactDetails: function() {
		var call = this.incomingLine.calls[0];
		//enyo.log("CNAP: incoming call gets contacts update");
		this.$.displayName.setContent(call.contact.name || call.contact.displayName || $L("Unknown"));
	},
	
	// called when app is opened or reopened from parent
	windowParamsChangeHandler: function() {		
	},

	// dismisses this dialog if there is an incoming call
	updateWithCallState: function(lines) {
		var i;
		for (i = 0; i < lines.length; i++) {
			if ( lines[i].state == enyo.application.CallSynergizer.STATES.INCOMING &&
				this.incomingLine.calls[0].address == lines[i].calls[0].address) {
				return; // stop at first incoming call
			}
		}

		this.mute();
		enyo.log("no incoming call, close dialog");
		this.exitStatus = "missed";
		close();
	},

	answerCall: function() {
		var call = this.incomingLine.calls[0];
	    var id = (this.incomingLine.conferenceId !== undefined ? this.incomingLine.conferenceId : call.id);
	    this.exitStatus = "answer";
	    this.mute();
	    
		// delay answering to give this popup time to close first.
		// this must be done off the parent window since this window 
		// object gets destroyed after this function returns.
		window.opener.enyo.job("closeincomingpopup", enyo.bind(this, function() {
		    enyo.application.CallSynergizer.callAnswered(this.incomingLine, id, call.transport);
		}),100);
		
		close();
	},

	//Ignore call
	cancelCall: function() {
	    enyo.application.CallSynergizer.callIgnore(this.incomingLine.calls[0]);
	    this.exitStatus = "ignore";
		close();
	},

	// hide alert and instruct blur handler to disconnect call & show ignored UI
	rejectCall: function() {
	    /*if (this.blockIgnore) {
				enyo.log( "IncomingcallAssistant#rejectCall tapped too soon");
				this.unblockIgnore();
				return;	
			}*/

	    this.mute();
	    enyo.application.CallSynergizer.callIgnore(this.incomingLine.calls[0]);
	    this.exitStatus = "rejected";
	    close();
	},

	mute: function() {
	    if (!this.muted) {
	        this.muted = true;
	    }

	    this.$.muteRingtone.call({
	        "muted": true
	    });

	    if (window.PalmSystem) {
	        //if( Object.isFunction(window.PalmSystem.cancelVibrations)){
	        window.PalmSystem.cancelVibrations();
	        //}
	    }
	},

	openContact: function() {
	    this.incomingLine.calls[0].contact.launchInContactsApp();
	    close();
	},

	// handles slides
	// NOTE: assumes that service does not initially provide status.
	// if it starts doing that, it could inadvertently answer the first call.
	onSliderEvent: function(inSender, response) {
	    if (response && response.key && response.state) {
	        enyo.log("IncomingcallAssistant#onSliderEvent " + response.key + " " + response.state);
	    } else {
	        return;
	    }

	    if (response.key === "slider") {
	        var newSliderOpenState = (response.state === "up");
	        if (this.exposed &&
	        this.sliderOpen === false &&
	        newSliderOpenState === true) {
	            this.answerCall();
	        }
	        this.sliderOpen = newSliderOpenState;
	    }
	},

	// handles presses on wired button
	onWiredButtonEvent: function(inSender, response) {

	    if (response) {
	        enyo.log("IncomingcallAssistant#onWiredButtonEvent " + response.key + " " + response.state);

	        if (this.exposed) {
	            if (response && response.key == "headset_button") {
	                if (response.state == "single_click") {
	                    this.answerCall();

	                } else if (response.state == "double_click") {
	                    this.cancelCall();

	                } else if (response.state == "hold") {
	                    this.rejectCall();
	                }
	            }
	        }
	    }
	},

	// detect connection of inductive charger to determine if we should answer a call
	onPuckEvent: function(response) {
	    if (response) {
	        enyo.log("IncomingcallAssistant#onPuckEvent " + response.type + response.connected);
	    }

	    // answer the call after a delay if we're exposed, set to do so,
	    // and we were previously on the puck
	    if (response && response.type == "inductive") {
	        if (this.exposed && this.puckConnected === true && response.connected === false) {	        
			enyo.job("answerCallIfStillOffPuck", enyo.bind(this, function() {
			            this.answerIfStillOffPuck();
			}),0.750);
	        }
	        this.puckConnected = response.connected;
	    }
	},

	// checks if phone is still off the puck, and answers call if it is
	// corrects for jitter in puck messages
	answerIfStillOffPuck: function() {
	    if (this.puckConnected === false) {
	        this.answerCall();
	    } else {
	        enyo.log("IncomingcallAssistant#answerIfStillOffPuck,  back on puck");
	    }
	},

	// Shows/hides the buttons based on if the phone is locked or in dockmode.
	// Parameters are optional. If ommitted, their global counterparts will be used.
	buttonsSetVisible: function(locked, dockmode) {
	    locked = locked !== undefined ? locked: enyo.application.Cache.screenLocked;
	    dockmode = dockmode !== undefined ? dockmode: enyo.application.Cache.inDockMode;

	    /* Only show buttons if we're unlocked or in dock mode.
			 * Set visibility instead of display so text box stays
			 * centered with margins the same width as these buttons
			 */
	    if (!locked || dockmode) {
	        this.$.answer_button.applyStyle("visibility", "");
	        this.$.reject_button.applyStyle("visibility", "");
	    } else {
	        this.$.answer_button.applyStyle("visibility", "hidden");
	        this.$.reject_button.applyStyle("visibility", "hidden");
	    }
	},

	// detect lock status to hide/show buttons
	onLockStatusEvent: function(inSender, response) {
	    enyo.log("IncomingcallAssistant#onLockStatusEvent");
	    this.buttonsSetVisible(response.locked, undefined);
	},
	// detect lock status to hide/show buttons
	dockModeStatusEvent: function(inSender, response) {
	    enyo.log("IncomingcallAssistant#onLockStatusEvent");
	    this.buttonsSetVisible(undefined, response.enabled);
	},

	onLockButtonEvent: function(inSender, response) {
	    if (this.exposed === true && response && response.triggered === true) {
	        this.answerCall();
	    }
	},

	// blocks power button from turning screen off; starts listening for button events
	powerButtonListen: function() {

	    enyo.log("powerButtonListen");
	    this.windowName = "IncomingCall";
	    //kind name
	    this.$.powerButtonSubscribe.call({
	        "powerKeyBlock": true,
	        "client": this.windowName
	    },
	    {
	        method: "setProperty",
	        onSuccess: "onPowerButtonEvent",
	        onFailure: "onPowerButtonEvent"
	    });

	    enyo.job("powerButtonListen", enyo.hitch(this, "powerButtonStopListening"), 60 * 1000);
	},

	// reenables power button screen off; stops listening for button events
	powerButtonStopListening: function() {
	    this.$.powerButtonSubscribe.cancel();
	},

	// if a valid power button event, registers it as a hardkey press
	onPowerButtonEvent: function(inSender, response) {
	    enyo.log("IncomingcallAssistant#onPowerButtonEvent");

	    if (response.powerKey == "released") {
	        this.handleHardKeyPress();
	        return;
	    }
	    if (!response.returnValue) {
	        enyo.error("IncomingcallAssistant#onPowerButtonEvent - returnvalue false");
	    }
	},

	// both power button and corenav button are interchangeable.
	// first tap mutes ringtone.
	// second closes window and rejects call
	handleHardKeyPress: function() {
	    enyo.log("IncomingcallAssistant#handleHardKeyPress");
	    if (this.muted) {
	        enyo.log("IncomingcallAssistant#handleHardKeyPress reject");
	        this.rejectCall();
	    } else {
	        enyo.log("IncomingcallAssistant#handleHardKeyPress mute");
	        this.mute();
	    }
	},

	// lock display status
	displayLock: function() {

	    this.$.dnastSub.call({
	        "requestBlock": true,
	        "client": "phoneapp"
	    },
	    {
	        method: "setProperty"
	    });

	    enyo.job("displayLock", enyo.hitch(this, "displayOff"), 60 * 1000);
	},

	// unlock display
	displayOff: function() {
	    this.$.dnastSub.cancel();
	}
});
