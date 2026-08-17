/*jslint white: false, onevar: false, nomen:false, plusplus: false */
/*globals enyo Messages NetworkRestrictImageView */

enyo.kind({
	name: "CallsPref",
	kind: "VFlexBox",
	className: "enyo-bg",
	components: [
		{kind: "RowGroup", caption: $L("CALLS"), components: [
		
			// Call Forwarding Toggle Button
			{name: "forwardingControl", layoutKind: "HFlexLayout", /*align: "center", tapHighlight: false, onclick: "messagePop", */components: [
				{content: $L("Call Forwarding"), flex: 1},
				{name: "callForwardingToggle", onChange: "forwardToggled", kind: "ToggleButton"},
			]},		
			// Call Forwarding error/status messages.  This is usually hidden.
			{name: "callForwardStatusContainer", layoutKind: "HFlexLayout", /*onclick: "showFDNError",*//* align: "center", tapHighlight: false,*/ components: [
				{name: "callForwardStatus", content: $L("Reading from network"), flex: 1},
				{name: "callForwardSpinner", kind: "Spinner"},
		 		{name: "lockButton1", kind:"CustomButton", className: "lock-button", showing: false}, 
		 		{name: "warningButton1", kind:"CustomButton", className: "warning-button", showing: false},
			]},
			// Call forwarding number text field.  This appears only if Call Forwarding is enabled
			{name: "callForwardNumberContainer", components: [
				{name: "callForwardNumber", kind: "Input", hint: $L("Enter Number"), autoKeyModifier: "num-lock", onchange: "callFWDNumChanged", insetClass: "enyo-flat-shadow"}
			]},
			
			// Caller ID Toggle Button
			{name: "callerIdControl", layoutKind: "HFlexLayout",/* align: "center", tapHighlight: false, onclick: "messagePop", */components: [
				{content: $L("Show My Caller ID"), flex: 1},
				{name: "showMyCallerIdToggle", onChange: "callerIDChanged", kind: "ToggleButton"},
			]},
			// Caller ID error/status messages.  This is usually hidden.
			{name: "showMyCallerIdStatusContainer", layoutKind: "HFlexLayout", /*onclick: "showCallIDError",*/ components: [
				{name: "showMyCallerIdStatus", content: $L("Reading from network"), flex: 1},
				{name: "showMyCallerIdSpinner", kind: "Spinner"},
		 		{name: "lockButton2", kind: "CustomButton", className: "lock-button", showing: false},
		 		{name: "warningButton2", kind:"CustomButton", className: "warning-button", showing: false},
			]},
			
			
			// Call Waiting Toggle Button
			{name: "callWaitingControl", layoutKind: "HFlexLayout",/* align: "center", tapHighlight: false, onclick: "messagePop", */components: [
				{content: $L("Call Waiting"), flex: 1},
				{name: "callWaitingToggle", onChange: "callWaitingChanged", kind: "ToggleButton"},		
			]},
			// Call Waiting error/status messages.  This is usually hidden.
			{name: "callWaitingStatusContainer", layoutKind: "HFlexLayout", /*onclick: "showCallWaitingError",*/ components: [
				{name: "callWaitingStatus", content: $L("Reading from network"), flex: 1},
				{name: "callWaitingSpinner", kind: "Spinner"},
		 		{name: "lockButton3", kind:"CustomButton", className: "lock-button", showing: false},
		 		{name: "warningButton3", kind:"CustomButton", className: "warning-button", showing: false},
			]}
		]},
		
		{name: "forwardQuery", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "forwardQuery", onSuccess: "forwardQueryResponse", onFailure: "forwardQueryResponse"},
		{name: "clirQuery", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "clirQuery", onSuccess: "callerIdResponse", onFailure: "callerIdResponse"},
		{name: "callWaitingQuery", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "callWaitingQuery", onSuccess: "callWaitingResponse", onFailure: "callWaitingResponse"},
		{name: "clirSet", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "clirSet",onSuccess: "callerIdsetResponse", onFailure: "callerIdsetResponse"},
		{name: "callWaitingSet", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "callWaitingSet", onSuccess: "callWaitingSetResponse", onFailure: "callWaitingSetResponse"},
		{name: "forwardRegister", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "forwardRegister", onSuccess: "registerForwardingNumberCallback", onFailure: "registerForwardingNumberCallback"},
	
		// message dialog
		{kind: "MsgDialog"}
	],
	create: function() {
		this.inherited(arguments);
		//this.updateUI();
	},
	
	updateUI: function () {
		enyo.log("****************** call prefs updateUI");
		this.callprefsUIInit();
		this.callPrefsQuery();
		
		//init prevFdnEnabledStatus to unavailable
		this.prevFdnEnabledStatus = -1;
	},
	
	callprefsUIInit: function() {
		this.$.callForwardStatusContainer.show();
		this.$.forwardingControl.hide();
		this.$.callForwardNumberContainer.hide();
		this.$.callForwardSpinner.setShowing(false);
		this.$.warningButton1.setShowing(false);
		this.$.lockButton1.setShowing(false);
		
		this.$.showMyCallerIdStatusContainer.show();
		this.$.callerIdControl.hide();
		this.$.showMyCallerIdSpinner.setShowing(false);
		this.$.showMyCallerIdToggle.setDisabled(false);
		this.$.warningButton2.setShowing(false);
		this.$.lockButton2.setShowing(false);

		this.$.callWaitingStatusContainer.show();		
		this.$.callWaitingControl.hide();
		this.$.callWaitingSpinner.setShowing(false);
		this.$.warningButton3.setShowing(false);
		this.$.lockButton3.setShowing(false);
		
		
		/*enyo.log("Cancel existing queries..");
		this.$.forwardQuery.cancel();
		this.$.clirQuery.cancel();
		this.$.callWaitingQuery.cancel();*/
	},
	
	callPrefsQuery: function() {
		// Retrieve Call Forwarding data
		this.$.forwardQuery.call({
			"condition": "unconditional",
			"bearer":"defaultbearer"
		});
		this.$.callForwardSpinner.setShowing(true);
		this.$.callForwardStatus.setContent($L("Reading from network"));

		//Retrieve show my caller id data
		this.$.clirQuery.call({});
		this.$.showMyCallerIdSpinner.setShowing(true);
		this.$.showMyCallerIdStatus.setContent($L("Reading from network"));
		
		//Retrieve call waiting data
		this.$.callWaitingQuery.call({
			"bearer": "defaultbearer"
		});
		this.$.callWaitingSpinner.setShowing(true);
		this.$.callWaitingStatus.setContent($L("Reading from network"));
	},
	
	updateOnFDNStatusChange: function() {
		enyo.log("updateOnFDNStatusChange :" + PinStatus.FdnEnabled + " - " + this.prevFdnEnabledStatus);
		if(this.prevFdnEnabledStatus == PinStatus.FdnEnabled || PinStatus.FdnEnabled == -1/*not available*/) {
			this.prevFdnEnabledStatus = PinStatus.FdnEnabled;
			return;
		}

		if(PinStatus.FdnEnabled == true) {/*Show the lock icon*/
			this.callprefsUIInit();

			this.$.lockButton1.setShowing(true);
			this.$.lockButton2.setShowing(true);
			this.$.lockButton3.setShowing(true);

			this.$.callForwardStatus.setContent($L("Call Forwarding"));
			this.$.showMyCallerIdStatus.setContent($L("Show My Caller ID"));
			this.$.callWaitingStatus.setContent($L("Call Waiting"));

		} else if(this.prevFdnEnabledStatus == true && PinStatus.FdnEnabled == false) {/*reQuery*/
			this.callprefsUIInit();
			this.callPrefsQuery();
		}
		
		this.prevFdnEnabledStatus = PinStatus.FdnEnabled;
	},
	
	/*messagePop: function(inSender, inEvt) {		
		if (PinStatus.FdnEnabled !== true) {
			return;
		}
		var message; 
		if (inSender.name == "forwardingControl") {
			message = $L("While fixed dialing is enabled, call forwarding cannot be set.");
		}else if (inSender.name == "callerIdControl") {
			message = $L("While fixed dialing is enabled, caller ID cannot be set.");
		}else if (inSender.name == "callWaitingControl") {
			message = $L("While fixed dialing is enabled, call waiting cannot be set.");
		} else {
			return;
		}
		this.$.msgDialog.setMessage(message);
		this.$.msgDialog.open(); 	
	},*/

	// ====================================================================================
	// Call forwarding
	// ====================================================================================

	// Call forward query response
	forwardQueryResponse: function(inSender, response) {	
		enyo.log(enyo.json.stringify(response));
		this.$.callForwardSpinner.setShowing(false);
		if(!response.returnValue) {
			this.forwardQueryResponseFailed(response);
			this.lastfwdCallError = response.errorCode;
			this.$.callForwardStatusContainer.onclick = "showFDNError";
			return;
		}
		
		this.lastfwdCallError = "";
		this.$.callForwardStatusContainer.onclick = "";
		
		this.$.callForwardStatusContainer.hide();
		this.$.forwardingControl.show();
		
		// search through status array for voice and default bearers
		if (response.extended && response.extended.status != null) {

			var status = response.extended.status;
			var found = false;
			for( var i = 0; i < status.length; i++ ) {
				switch (status[i].bearer) {
					case 'voice':
					case 'default':
					case 'defaultbearer':
						if (status[i].activated) {
							found = true;
							this.$.callForwardNumberContainer.show();
							
							this.callFWDNumber = status[i].number;
							this.$.callForwardNumber.setValue(this.callFWDNumber);
							
							this.callFwdValue = true;
							this.$.callForwardingToggle.setState(this.callFwdValue);
						} else {
							//this.$.callForwardNumberContainer.hide();
							if(status[i].number) {
								this.callFWDNumber = status[i].number;
								this.$.callForwardNumber.setValue(this.callFWDNumber);
							}
						}
						// Make the toggle button reflect the call forwarding state
						//this.$.callForwardingToggle.setState(status[i].activated);
						break;		
					default:
						break;
				}
				if (found){
					break;
				}
			}
			if (!found) {
				this.callFwdValue = false;
				this.$.callForwardingToggle.setState(this.callFwdValue);
			}
		} else {
			this.callFwdValue = false;
			this.$.callForwardingToggle.setState(this.callFwdValue);//off
			//this.$.callForwardNumberContainer.hide();
		}
	},
	
	// Display a tappable error message when call forwarding fails
	forwardQueryResponseFailed: function(response) {
		this.$.callForwardStatus.setContent($L("Call Forwarding"));

		if (response.errorCode && response.errorCode === "108") {
			this.$.warningButton1.setShowing(false);
			this.$.lockButton1.setShowing(true);
		} else {
			this.$.lockButton1.setShowing(false);
			this.$.warningButton1.setShowing(true);
		}
	},
	
	// Handle Call Forwarding toggle button tapped
	forwardToggled: function(inSender) {
		// If call forwarding is enabled, show the Text Field for entering the Call Forwarding Number
		var state = this.$.callForwardingToggle.getState();
		if(state) {
			this.$.callForwardNumberContainer.show();
		} else {
			this.$.callForwardNumberContainer.hide();
		}
		this.registerForwardingNumber(state);
	},
	
	callFWDNumChanged: function() {
		this.callFWDNumber = this.$.callForwardNumber.getValue();
		this.registerForwardingNumber(true);
	},

	// Set or clear the call forwarding number
	registerForwardingNumber: function(register) {
	
		this.$.callForwardingToggle.setDisabled(true);
		this.$.callForwardNumber.setDisabled(true);
			
		//var number = this.$.callForwardNumber.getValue();
		if((register == true) && (this.callFWDNumber !== undefined) && (this.callFWDNumber.length > 0)) {
			this.$.forwardRegister.call({
				"number":this.callFWDNumber,
				"condition" :"unconditional",
				"bearer":"defaultbearer",
				"time":"0"
			});
		} else {
			this.$.forwardRegister.call({
				"number": "",
				"condition" :"unconditional",
				"bearer":"defaultbearer",
				"time":"0"
			});
		}
	},
	
	// Response from setting the call forwarding number.  This is used to handle error conditions.
	registerForwardingNumberCallback: function(inSender, response) {
		enyo.log(enyo.json.stringify(response));		
		this.$.callForwardingToggle.setDisabled(false);
		this.$.callForwardNumber.setDisabled(false);
				
		if(!response.returnValue) {
			this.lastfwdCallError = response.errorCode;
			this.showFDNError("");
			
			//Revert old value
			this.$.callForwardingToggle.setState(this.callFwdValue);
			if(this.callFwdValue) {
				this.$.callForwardNumberContainer.show();
			} else {
				this.$.callForwardNumberContainer.hide();
			}
		} else {
			this.callFwdValue = this.$.callForwardingToggle.getState();
		}
	},
	
	// Display Call Forwarding specific error messages
	showFDNError: function(inSender) {
		enyo.log("showFDNError");
		if(this.lastfwdCallError == "" || this.lastfwdCallError == undefined) {
			return;
		}
		switch(this.lastfwdCallError) {
			case 108: 
				this.showErrorDialog($L('While fixed dialing is enabled, call forwarding cannot be set.'));
				break;
			case 102: 
				this.showErrorDialog($L('You need a network connection to your wireless service provider to see some settings.'));
				break;
			default:  
				if (enyo.application.Messages.serviceErrors[this.lastcallWaitingError] !== undefined) {
					this.showErrorDialog(enyo.application.Messages.serviceErrors[this.lastcallWaitingError].toString());
				} else {
					this.showErrorDialog(enyo.application.Messages.serviceErrors[enyo.application.Messages.defaultErrorIndex].toString());
				}
				break;
		}
	},


	
	// ====================================================================================
	// Caller ID
	// ====================================================================================
	
		
	callerIDChanged: function(inSender, value) {		
		this.$.clirSet.call({
			"restrict": !value
		});	
		
		this.$.showMyCallerIdToggle.setDisabled(true);		
	},
	
	// This function is called when the Caller Id toggle button is updated.  
	// This is used for handling error conditions.
	callerIdResponse: function(inSender, response) {
		enyo.log(enyo.json.stringify(response));
		this.$.showMyCallerIdSpinner.setShowing(false);
				
		if(response.returnValue !== undefined && response.extended !== undefined) {
			this.callerIdValue = !response.extended.restricted;
			this.$.showMyCallerIdToggle.setState(!response.extended.restricted);
			if(response.extended.permanent != undefined && response.extended.permanent === true) {
				this.$.showMyCallerIdToggle.setDisabled(true);
			}
			
			this.lastcallerIdError = "";
			this.$.showMyCallerIdStatusContainer.onclick = "";
			
			this.$.showMyCallerIdStatusContainer.hide();
			this.$.callerIdControl.show();
			
		} else {
			this.$.showMyCallerIdStatus.setContent($L("Show My Caller ID"));
		
			if (response.errorCode && response.errorCode === "108") {
				this.$.warningButton2.setShowing(false);
				this.$.lockButton2.setShowing(true);
			} else {
				this.$.lockButton2.setShowing(false);
				this.$.warningButton2.setShowing(true);
			}
			
			this.lastcallerIdError = response.errorCode;
			this.$.showMyCallerIdStatusContainer.onclick = "showCallIDError";
		}
	},

	callerIdsetResponse: function(inSender, response){
		enyo.log(enyo.json.stringify(response)); 
		this.$.showMyCallerIdToggle.setDisabled(false);
		if(!response.returnValue) {
			this.lastcallerIdError = response.errorCode;
			this.showCallIDError("");
			//onError revert back to original value
			this.$.showMyCallerIdToggle.setState(this.callerIdValue);
		} else {
			this.callerIdValue = this.$.showMyCallerIdToggle.getState();
		}
	},
	
	// Display Caller ID specific error messages
	showCallIDError: function(inSender) {
		enyo.log("showCallIDError");
		if(this.lastcallerIdError == "" || this.lastcallerIdError == undefined) {
			return;
		}
		switch(this.lastcallerIdError) {
			case 108: 
				this.showErrorDialog($L('While fixed dialing is enabled, caller ID cannot be set.'));
				break;
			case 102: 
				this.showErrorDialog($L('You need a network connection to your wireless service provider to see some settings.'));
				break;
			default:  
				if (enyo.application.Messages.serviceErrors[this.lastcallWaitingError] !== undefined) {
					this.showErrorDialog(enyo.application.Messages.serviceErrors[this.lastcallWaitingError].toString());
				} else {
					this.showErrorDialog(enyo.application.Messages.serviceErrors[enyo.application.Messages.defaultErrorIndex].toString());
				}
				break;
		}		
	},



	// ====================================================================================
	// Call Waiting
	// ====================================================================================
	
	callWaitingChanged: function(inSender, value) {		
		this.$.callWaitingSet.call({
			"bearer": "defaultbearer",
			"enable": value
		});
		
		//Disable the control until we get response for above request; To prevent multiple requests...
		this.$.callWaitingToggle.setDisabled(true);
	},
	
	callWaitingSetResponse: function(inSender, response) {
		enyo.log(enyo.json.stringify(response));
		this.$.callWaitingToggle.setDisabled(false);
		
		if(!response.returnValue) {
			this.lastcallWaitingError == response.errorCode;
			this.showCallWaitingError("");
			//onError revert back to original value
			this.$.callWaitingToggle.setState(this.callWaitingValue);
		} else {
			this.callWaitingValue = this.$.callWaitingToggle.getState();
		}
	},
	
	// This function is called when the Caller Waiting toggle button is updated.  
	// This is used for handling error conditions.
	callWaitingResponse: function(inSender, response) {
		enyo.log(enyo.json.stringify(response));
		this.$.callWaitingSpinner.setShowing(false);

		if(response.returnValue !== undefined && response.extended !== undefined) {
		
			this.lastcallWaitingError = "";
			this.$.callWaitingStatusContainer.onclick = "";
			
			this.$.callWaitingControl.show();
			this.$.callWaitingStatusContainer.hide();
		
			this.callWaitingValue = response.extended.enabled;
			this.$.callWaitingToggle.setState(response.extended.enabled);
		} else {
			this.$.callWaitingStatus.setContent($L("Call Waiting"));
			
			if (response.errorCode && response.errorCode === "108") {
				this.$.warningButton3.setShowing(false);
				this.$.lockButton3.setShowing(true);
			} else {
				this.$.lockButton3.setShowing(false);
				this.$.warningButton3.setShowing(true);
			}
			
			this.lastcallWaitingError = response.errorCode;
			this.$.callWaitingStatusContainer.onclick = "showCallWaitingError";
		}
	},
	
	// Display Call Waiting specific error messages
	showCallWaitingError: function(inSender) {
		enyo.log("showCallWaitingError");
		if(this.lastcallWaitingError == "" || this.lastcallWaitingError == undefined) {
			return;
		}
		switch(this.lastcallWaitingError) {
			case 108: 
				this.showErrorDialog($L('While fixed dialing is enabled, call waiting cannot be set.'));
				break;
			case 102: 
				this.showErrorDialog($L('You need a network connection to your wireless service provider to see some settings.'));
				break;
			default:  
				if (enyo.application.Messages.serviceErrors[this.lastcallWaitingError] !== undefined) {
					this.showErrorDialog(enyo.application.Messages.serviceErrors[this.lastcallWaitingError].toString());
				} else { 
					this.showErrorDialog(enyo.application.Messages.serviceErrors[enyo.application.Messages.defaultErrorIndex].toString());
				}  
				break;
		}
	},
	
	showErrorDialog: function(msg) {
		if (msg !== undefined && msg !== " ") {
			this.$.msgDialog.setMessage(msg);
			this.$.msgDialog.open(); 	
		}		
	}		
});


enyo.kind({
	name: "MsgDialog",
	kind: enyo.Dialog,
	published: {
		message: ""
	},
	events: {
		onAccept: ""
	},
	components: [
		{className: "enyo-dialog-prompt-content", components: [
			{name: "message", className: "enyo-dialog-prompt-message"},
			{name: "acceptButton", kind: "Button", caption: $L("OK"), onclick: "acceptClick"},
		]}
	],
	titleChanged: function() {
		this.$.title.setContent(this.title);
	},
	messageChanged: function() {
		this.$.message.setContent(this.message);
	},
	acceptClick: function() {
		this.close();
	}
});

