enyo.kind({
	name: "UIStates.ContactLookupState",
	kind: UIStates.AbstractState,
	setup: function(params, dontFocus) {
		//enyo.require(!window.PalmSystem || !PalmSystem.isMinimal, "can't enter contact lookup while in minimal state");
			enyo.application.openMainCard({
				scene: "contactlookup",
				params: params
			}, "images/splash/splash-phone-dialpad.png");
	},
	cleanup: function() {
		//enyo.application.tellMainCard({scene:"contactlookup", params:{value:""}});
		//video is disabled for DB+
		//enyo.application.tellMainCard({scene:"contactlookup", params:{cleanup:true}});
	},
	event_back: function(e) {
		enyo.application.UI.enter('contactlookup');
		e && e.preventDefault();
	},
	event_emergency: function(isEnabled) {
		if ( isEnabled ) {
			enyo.application.UI.enter("dialpad_emergency");
		} else {
			enyo.error("unexpected event_emergency event received");
		}
	},
	event_updateView: function(params){
		this.setup(params);
	},	
	event_dial: function(params) {
		enyo.application.UI.enter('dialpad_card', params);
	},
	event_activecall: function(params) {
		enyo.application.UI.enter("activecall_card", params);
	},
	event_closed: function(params) {
                // Remain in contacts lookup state upon exiting app from contacts-lookup
		// enyo.application.UI.enter('dialpad_card', params);
	},
	/* comment out for video discoveribility
	 * event_windowDeactivate: function() {
		enyo.log("debug: contactlookup deactivated");
		enyo.application.tellMainCard({scene:"contactlookup", params:{deactivate:true}});
	}, 
	event_windowActivate: function() {
		enyo.log("debug: contactlookup activated");
		enyo.application.tellMainCard({scene:"contactlookup", params:{activate:true}});
	},*/	
});
