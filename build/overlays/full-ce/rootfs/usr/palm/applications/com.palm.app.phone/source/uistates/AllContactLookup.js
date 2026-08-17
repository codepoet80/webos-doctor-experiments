enyo.kind({
	name: "UIStates.AllContactLookupState",
	kind: UIStates.AbstractState,
	setup: function(params, dontFocus) {
		enyo.require(!window.PalmSystem || !PalmSystem.isMinimal, "can't enter contact lookup while in minimal state");
		enyo.application.openMainCard({scene:"allcontactlookup", params:params}, "images/splash/splash-phone-dialpad.png");
	},
	cleanup: function() {
		enyo.application.tellMainCard({scene:"allcontactlookup", params:{value:""}});
	},
	event_back: function(e) {
		enyo.application.UI.enter('dialpad_card');
		e && e.preventDefault();
	},
	event_emergency: function(isEnabled) {
		if ( isEnabled ) {
			enyo.application.UI.enter("dialpad_emergency");
		} else {
			enyo.error("unexpected event_emergency event received");
		}
	},
	event_dial: function(params) {
		enyo.application.UI.enter('dialpad_card', params);
	},
	event_activecall: function(params) {
		enyo.application.UI.enter("activecall_card", params);
	},
	event_closed: function(params) {
		//enyo.application.UI.enter('dialpad_card', params);
		enyo.application.UI.enter('contactlookup', params);
	}
});
