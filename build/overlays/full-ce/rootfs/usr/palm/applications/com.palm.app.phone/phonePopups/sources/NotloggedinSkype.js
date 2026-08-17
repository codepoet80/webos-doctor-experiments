/*globals enyo */

enyo.kind({
	name: "NotloggedinSkype",
	kind: "VFlexBox",
	pack: "justify",
	className: "popups-bg",
	IMSTATUS: {
		AVAILABLE: 0,
		OFFLINE: 4
	},
	components: [
		{layoutKind: "VFlexLayout", pack: "center", className: "notification-text-container", style: "-webkit-border-image: none; ", components: [
				{name: "titleText", content:$L("You Are Offline"), className: "title"},
				{name: "bodyText", content: $L("To make this call, you will need to sign into your Skype account."),  className: "msg-text"},
				{name: "spinner", kind: "Spinner", showing: false, shownWhenSpinning: true}
		]},                                                                                                                                                                  
		{kind: "HFlexBox", width: "100%", components: [
			{kind: "Button", flex: 1,  name: "dismiss_button", className: "enyo-button-negative", label: $L("Cancel"), onclick: "dismiss"},
			{kind: "ActivityButton", active: false, flex: 1, name: "login_button", className: "enyo-button-affirmative", label: $L("Sign In"), onclick: "signinSkype"},
			{kind: "Button", flex: 1,  name: "ok_button", className: "enyo-button-affirmative", label: $L("Ok"), onclick: "dismiss"},
		]},
		{name: "loginStateSetter", kind: "DbService", method: "merge", onSuccess: "changedLoginState"},
		{name: "loginStateFinder", kind: "DbService", dbKind: "com.palm.imloginstate.skypem:1", method: "find", onSuccess: "gotLoginStates", subscribe: true, resubscribe: true, reCallWatches: true},
	],

	create: function() {
		this.inherited(arguments);
		//this.payload = enyo.windowParams.line;
		this.$.ok_button.hide();
	},

	signinSkype: function(){
		if(enyo.application.isTablet) {
			this.saveAvailability(this.IMSTATUS.AVAILABLE);
			this.$.login_button.active = true;
			this.$.login_button.activeChanged();
		}
   	},
	
	saveAvailability: function(value) {
		this.status = value;
		this.$.loginStateSetter.call({
			"props": {
				"availability": value
			},
			"query": {
				"from": "com.palm.imloginstate.skypem:1"
			}
		});
	},	
	
	changedLoginState: function(inSender, inResponse) {
		if (inResponse && inResponse.count > 0 && this.status === this.IMSTATUS.AVAILABLE) {
			this.fetchLoginStates();
			return; 
		} 

		if (this.status !== this.IMSTATUS.OFFLINE) {
			enyo.error("unable to change skype login state to "+this.status)
		}
		
		this.setLoginStatus("offline");
		if (this.loginTimer) {
			clearTimeout(this.loginTimer);
			this.loginTimer = undefined;
		}
	},
	
	fetchLoginStates: function() {
		this.$.loginStateFinder.cancel();
		this.$.loginStateFinder.call();
		
		if (!this.loginTimer) {
			// login will timeout after 2.5 minutes. this is really long, but intended to handle transports failing
			this.loginTimer = setTimeout(function() {
				this.loginTimer = undefined;
				this.saveAvailability(this.IMSTATUS.OFFLINE);
			}.bind(this), 150000);
		}		
	},	
	
	gotLoginStates: function(inSender, inResponse){
		if (inResponse && inResponse.returnValue === true) {
			var status = inResponse.results && inResponse.results[0];			
			if (status && status.state === "online") {
				this.setLoginStatus(status.state);
			} else {
				//we find out we have multiple status returned during signing in
				//process, we will either time out or go for a online status
				enyo.log("skype logging status is "+status.state);
			}
		} 
	},
	
	setLoginStatus: function(status) {
		this.$.spinner.setShowing(false);
		this.$.login_button.hide();			
		
		if (this.loginTimer) {
			clearTimeout(this.loginTimer);
			this.loginTimer = undefined;
		}		
		if (status === "online") {					
			this.$.titleText.setContent($L("Sign In Successful"));
			this.$.bodyText.setContent($L("You are successfully signed in and can now make calls."));
			this.$.dismiss_button.hide();
			this.$.ok_button.show();
		} else {
			if (status !== "offline") {
				enyo.log("unexpected skype login status " + status);
			}
			this.$.bodyText.setContent($L("Unable to Sign In"));
			this.$.dismiss_button.setContent($L("Ok"));
		}
	},
	
	/*redial: function() {
		var address = this.payload.details.address;
		var transport = this.payload.details.transport;
		close(); 		
		enyo.log("address is "+address + " transport is "+transport);
		if (address) {
			enyo.application.CallSynergizer.dial(address, undefined, undefined, transport, undefined);
		}
	},*/

	dismiss: function(){
		close();
	}
});
