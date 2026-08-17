enyo.kind({
	name: "UIStates.DialpadCardState",
	kind: UIStates.AbstractState,
	setup: function(params, dontFocus) {
		enyo.application.openMainCard({scene: 'dialpad_card', params:params}, "images/splash/splash-phone-dialpad.png", dontFocus);
	},
	cleanup: function() {
		
	},
	event_back: function(e) {
		// CASE: call exists, go back to active call
        if ( enyo.application.CallSynergizer.callExists() ) {
            enyo.application.UI.enter("activecall_card");
			e && e.preventDefault();
			
		// CASE: first use: close stage to return to first use
        } else if ( PalmSystem.isMinimal ) {
			enyo.application.closeMainCard();
		}
	},
	event_emergency: function(isEnabled) {
		if ( isEnabled ) {
			enyo.application.UI.enter("dialpad_emergency");
		} else {
			enyo.error("unexpected event_emergency event received");
		}
	},
	// if we get a dial event but already have the dialpad open
	event_dial: function(params) {
		this.setup(params);
	},
	event_activecall: function(params) {
		enyo.application.UI.enter("activecall_card", params);
	},
	event_closed: function() {
		enyo.application.tellMainCard({scene:"dialpad_card", params: {fill:""}});
	},
	event_voicedialing: function(params) {
		enyo.application.UI.enter('voicedialing', params);
	}
});
