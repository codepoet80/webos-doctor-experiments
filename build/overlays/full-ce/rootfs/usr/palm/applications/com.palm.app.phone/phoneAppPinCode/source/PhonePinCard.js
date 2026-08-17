enyo.kind({
	name: "PhonePinCard",
	kind: enyo.VFlexBox,	
	components: [
		{name:"pane", kind:"Pane", transitionKind:enyo.transitions.Simple, onSelectView:"handleDestroyOnUnload", height:"100%", components:[
			{name:"blank"},
			{name:"pinUnlock", kind: "PinUnlock", onCancelClick: "cancelLogin", lazy:true},
			{name:"passwordUnlock", kind: "PasswordUnlock", lazy:true, onCancelClick: "cancelLogin"}, 
			{name:"phonePrefs", kind:"PhonePrefs", lazy:true, destroyOnUnload:true /*see handleDestroyOnUnload*/},
			{name:"activeCall", kind: "ActiveCall", lockedmode: true, lazy:true, destroyOnUnload:true},
			{name:"dialpad", kind:"Dialer", limited: true, lazy:true},
			{name:"voiceDialing", kind: "VoiceDialing", lazy:true, destroyOnUnload:true}
		]},
		
		// dialogs - TODO lazy load these
		{name:"securityUpgradePrompt", kind:"SecurityUpgradePrompt", onPin:"choosePin", onPassword:"choosePassword", onEmergency:"emergencyDial"},
		{name:"setPasswordDialog", kind:"SetPasswordDialog", onDone:"setPassword", onCancel:"cancelLogin"},
		{name:"securityUpgradeOnCallPrompt", kind: "SecurityUpgradeOnCallPrompt", onAccept:"goToActiveCall", cancelButtonCaption:false},
		
		// service calls
		{name:"getDeviceLockMode", kind: enyo.PalmService, service:"palm://com.palm.systemmanager/", method:"getDeviceLockMode", onSuccess: "deviceLockModeResponse", subscribe:true},
		{name:"getSecurityPolicy", kind: enyo.PalmService, service:"palm://com.palm.systemmanager/", method:"getSecurityPolicy", onSuccess: "securityPolicyResponse"},	
		{name:"updatePinAppState", kind: enyo.PalmService, service:"palm://com.palm.systemmanager/", method:"updatePinAppState"},
	],
	lockMode: "none", // lock mode, default is "none"
	create: function() {
		this.inherited(arguments);
		this.$.getDeviceLockMode.call();
	},
	goToActiveCall: function() {
		enyo.application.UI.event('activecall');
	},
	windowParamsChangeHandler: function() {
		this.handleLaunch();
	},
	handleLaunch: function() {
		var params = enyo.windowParams;
		
		// CASE: active call
		if ( 'activecall' in params ) {
			this.$.pane.selectViewByName("activeCall",true);
			
		// CASE: dialpad
		} else if ( 'dialpad' in params ) {
			this.$.pane.selectViewByName("dialpad",true);
			this.$.dialpad.handleLaunch(params.params);
			
		// CASE: preferences
		} else if ( 'preferences' in params ) {
			// TODO: use enyo.depends with callback to also load phoneprefs kinds at this point
			this.$.pane.selectViewByName("phonePrefs",true);
			this.$.phonePrefs.handleLaunch(params.params);
		
		// CASE: voicedialing
		} else if ('voicedialing' in params) {
	        this.$.pane.selectViewByName("voiceDialing");
			this.$.voiceDialing.handleLaunch(params.params);
			
		// CASE: cancel login
		} else if ( 'cancel' in params ) {
			this.cancelLogin();
			
		// DEFAULT: just handle known launch mode
		} else {
			//always unlock - for testing
			//this.$.updatePinAppState.call({state: 'unlock'}); return;
			
			this.handleLaunchLockMode();
		}
		
		// always clean up all open dialogs
		this.$.securityUpgradePrompt.close();
		this.$.setPasswordDialog.close();
		this.$.securityUpgradeOnCallPrompt.close();
	},
	handleLaunchLockMode: function() {
		if (this.securityPolicyState == "pending") {
			this.$.pane.selectViewByName("blank",true);
			this.$.getSecurityPolicy.call();
			
		} else if (this.lockMode == "pin") {
			this.$.pane.selectViewByName("pinUnlock",true);
			this.$.pinUnlock.reset();
			this.$.pinUnlock.setPinSet(false);
			this.$.pinUnlock.securityPolicyState = this.securityPolicyState; 
			
		} else if (this.lockMode == "password"){
			this.$.pane.selectViewByName("passwordUnlock",true);
			this.$.passwordUnlock.reset();
			this.$.passwordUnlock.securityPolicyState = this.securityPolicyState;
		}
	},
	// dispatched automatically by framework when back gesture received
	backHandler: function(inSender, event) {
		if ( ! this.delegateToActiveView("back", event) ) {
			// if not handled by active scene, see if state machine wants it
			enyo.application.UI.event('back', event);
		}
	},
	// destroy views (flagged by destroyOnUnload:true) that we don't want to keep
	// around because they are rarely accessed and/or too expensive to keep in the DOM
	handleDestroyOnUnload: function(inSender, inView, inPreviousView) {
		if ( inPreviousView && inPreviousView.destroyOnUnload && inView !== inPreviousView ) {
			inPreviousView.destroy();
		}
	},
	cancelLogin: function() {
		if (enyo.application.CallSynergizer.callExists()) {		
			enyo.application.UI.enter('activecall_pin');
		} else {
			this.$.updatePinAppState.call({state:"cancel"});
		}
	},
	// dispatched automatically by framework when stage is actived
	// The ONLY way we know this device is locked is if sysmgr activates this stage
	windowActivatedHandler: function() {
		// resend lock event to make sure the current state knows we're locked if sysmgr is trying to activate this stage
		// this handles the case where we go from a locked state to a card state and sysmgr
		// pushes the lock scene, eg: pin state -> dialpad_card state -> stageActivate event -> back to pin state
		// this will be ignored if we're already in a pin state (eg activecall_pin)
		enyo.application.UI.event('lock', true);
		
		// then, let this state know the stage is active. this is only handled by the pin state
		// this will be ignored if we're in another type of pin stage (eg activecall_pin) 
		enyo.application.UI.event('lockstage_activate');
		
		if (this.$.passwordUnlock) {
			this.$.passwordUnlock.$.passwordInput.forceFocus();
		}
	},
	// dispatched automatically by framework when stage is deactived
	windowDeactivatedHandler: function() {
		this.$.pane.selectViewByName("blank",true);
		enyo.application.UI.event('lockstage_deactivate');
	},
	deviceLockModeResponse: function(inSender, response) {
		var securityPolicyRequest; 	
		if (response.returnValue){
			this.lockMode = response.lockMode; 
		} else {
			this.lockMode = "none"; 
		}
		
		this.securityPolicyState = response.policyState;
enyo.log("------------------------securityPolicyState is "+this.securityPolicyState); //todo: remove later, temp log for tracing a policy issue		
		this.handleLaunchLockMode();
	},
	securityPolicyResponse: function(inSender, response){
		this.pendingSecurityPolicy = response.policy;
		
		// CASE: on call, show warning
		if (enyo.application.CallSynergizer.callExists()) {
		 	this.$.securityUpgradeOnCallPrompt.open();
			
		// CASE: not on call, show upgrade prompt with this policy
		} else {
			if (this.lockMode !== "none") {
				this.$.securityUpgradePrompt.setTitle($L("Device Password Upgrade Required")); 
			} else {
				this.$.securityUpgradePrompt.setTitle($L("Device Password Required"));
			}
			this.$.securityUpgradePrompt.setPolicy(this.pendingSecurityPolicy);
			this.$.securityUpgradePrompt.open();
		}
	},
	choosePin: function() {
		this.$.securityUpgradePrompt.close();
		this.$.pane.selectViewByName("pinUnlock",true);
		this.$.pinUnlock.setPinSet(true); 
	},
	choosePassword: function() {
		this.$.securityUpgradePrompt.close(); 
		this.$.setPasswordDialog.setPolicy(this.pendingSecurityPolicy.password);
		this.$.setPasswordDialog.open();
	},
	setPassword: function(inSender, response) {
		this.$.updatePinAppState.call({
			state: 'unlock'
		});					
	},
	emergencyDial: function() {
		enyo.application.UI.event("dial", {"emergencyFill": true});
	},
	keyupHandler: function(inSender, event) {
		return this.delegateToActiveView('keyup', event);
	},
	keydownHandler: function(inSender, event) {
		return this.delegateToActiveView('keydown', event);
	},
	// delegates the named event type to the active scene
	// if the scene's handler returns true, it was handled and it default prevented
	delegateToActiveView: function(eventType, event) {
		var activePaneObj = this.$[this.$.pane.getViewName()];
		var handled = activePaneObj && activePaneObj[eventType] && activePaneObj[eventType].apply(activePaneObj, enyo.cloneArray(arguments).slice(1));
		if ( handled ) {
			event.preventDefault();
		}
		return handled;
	}
});

enyo.kind({
	name: "EmergencyPopupMenu",
	kind: "Menu",
	showing: false,
	events: {
		onCancelClick: ""
	},
	components: [
		{name: "menuEmergency", caption: $L("Emergency call"), kind: "MenuItem", onclick: "onEmergencyCall"},
		{name: "menuCancel", caption: $L("Cancel"), kind: "MenuItem", onclick: "onCancel"},
	],
	
	create: function() {
		this.inherited(arguments);
	}, 
	
	onEmergencyCall: function() {
		enyo.application.UI.event("dial", {"emergencyFill": true});
	},
	
	onCancel: function() {
		this.doCancelClick();
	}
});	
