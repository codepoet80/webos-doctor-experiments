enyo.kind({
	name: "EmergencyCard",
	kind: enyo.VFlexBox,
	EmergencyPowerModeActivityId: "com.palm.app.phone.emergencyModeExpiration",
	components: [
		{name:"pane", kind: "Pane", onSelectView:"onSelectView", height: "100%", transitionKind:enyo.transitions.Simple, components: [
			{name:"dialpad", kind:"Dialer", limited:true, lazy:true},
			{name:"emergencymode", kind: "EmergencyMode", lazy:true},
			{name:"activecall", kind: "ActiveCall", lazy:true}
		]},
		
		// incoming call dialog
		{kind: "EmergencyCard.IncomingCallDialog"},
		
		// services
		{name:"emergencyModePrefs", kind:"PalmService", service: enyo.palmServices.system, method:"getPreferences", onSuccess:"preferenceResponse", onFailure:"genericFailure"},
		{name:"powerService", kind:"PalmService", service: "palm://com.palm.power/com/palm/power/", onFailure:"genericFailure"},
		{name:"emergencyModeEnd", kind:"EmergencyCard.EmergencyModeEnd"}
	],
	create: function() {
		this.inherited(arguments);
		this.$.emergencyModePrefs.call({
			keys: ["PhoneAppEmergencyModeExpiration"]
		});
		this.handleLaunch();
	},
	destroy: function() {
		this.destroyTimer();
		this.inherited(arguments);
	},
	handleLaunch: function() {
		var params = enyo.windowParams;
		if ('activecall' in params) {
			this.$.pane.selectViewByName("activecall");
			
		} else if ('dialpad' in params) {
			this.$.pane.selectViewByName("dialpad");
			this.$.dialpad.handleLaunch(params.params || {});
			
		} else if ('emergencymode' in params) {
			this.$.pane.selectViewByName("emergencymode");
		}
	},
	preferenceResponse: function(inSender, response) {
		if ( response.PhoneAppEmergencyModeExpiration ) {
			this.emergencyModeExpirationMs = parseInt(response.PhoneAppEmergencyModeExpiration,10);
		}
		
		// if we got the preference after we've already entered emergencymode
		if ( this.$.pane.getViewName() == "emergencymode" ) {
			this.maybeSetupTimer();
		}
	},
	onSelectView: function(inSender, inView, inPreviousView) {
		if ( inView.name == "emergencymode" ) {
			this.maybeSetupTimer();
		} else {
			this.destroyTimer();
		}
	},
	// called when app is opened or reopened from parent
	windowParamsChangeHandler: function() {
		this.handleLaunch();
	},
	unloadHandler: function() {
		this.destroy();
	},
	maybeSetupTimer: function() {
		var timeout;
		if ( ! this.timerSetup && this.emergencyModeExpirationMs ) {
			this.timerSetup = true;
			
			// add 5 sec buffer to prevent race between setTimeout and com.palm.power.
			// com.palm.power must get called first before setTimeout destroys this component
			timeout = this.emergencyModeExpirationMs + 5000;
			
			enyo.job("exitEmergencyMode", enyo.hitch(this,"exitEmergencyMode"), timeout);
			
			this.$.powerService.call({
				id: this.EmergencyPowerModeActivityId,
				duration_ms: this.emergencyModeExpirationMs
			},{
				method: "activityStart"
			});
		}
	},
	destroyTimer: function() {
		if ( this.timerSetup ) {
			this.timerSetup = false;
			
			enyo.job.stop("exitEmergencyMode");
			
			this.$.powerService.call({
				id: this.EmergencyPowerModeActivityId
			},{
				method: "activityEnd"
			});
		}
	},
	exitEmergencyMode: function() {
		this.$.emergencyModeEnd.call();
	},
	genericFailure: function(inSender, response, request) {
		enyo.error(request.service + request.method + " failed with " + enyo.json.stringify(response));
	},
});

// helper exits emergency mode
enyo.kind({
	name: "EmergencyCard.EmergencyModeEnd",
	kind: enyo.PalmService,
	service: enyo.palmServices.telephony,
	method: "emergencyModeEnd"
});

// incoming call dialog listens to CallSynergy and opens itself when there's an incoming call
enyo.kind({
	name: "EmergencyCard.IncomingCallDialog",
	kind: enyo.DialogPrompt,
	title: $L("Incoming Call"),
	acceptButtonCaption: $L("Answer"),
	cancelButtonCaption: $L("Ignore"),
	create: function() {
		this.inherited(arguments);
		
		this._updateWithCallStateFunc = enyo.hitch(this, "updateWithCallState");
		enyo.application.CallSynergizer.registerCallStateQuery(this._updateWithCallStateFunc);
	},
	destroy: function() {
		enyo.application.CallSynergizer.unregisterCallStateQuery(this._updateWithCallStateFunc);
		this.inherited(arguments);
	},
	updateWithCallState: function(lines) {
		var i;
		for (i = 0; i < lines.length; i++) {
			if ( lines[i].state == enyo.application.CallSynergizer.STATES.INCOMING ) {
				this.incomingLine = lines[i]
				this.incomingCall = lines[i].calls[0];
				this.setMessage(this.messageFromCall(this.incomingCall));
				this.open();
				return; // stop at first incoming call
			}
		}
		// if no incoming call, close dialog
		this.close();
	},
	messageFromCall: function(call) {
		var message = call.contact.name || $L("Unknown number");
		message += "<br>";
		message += call.contact.addressFormatted;
		return message;
	},
	acceptClick: function() {
		enyo.application.CallSynergizer.callAnswered(this.incomingLine, this.incomingCall.id, this.incomingCall.transport);
		this.inherited(arguments);
	},
	cancelClick: function() {
		enyo.application.CallSynergizer.callIgnore(this.incomingCall);
		this.inherited(arguments);
	}
});
