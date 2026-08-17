enyo.kind({
	name: "UIStates.PreferencesPinState",
	kind: UIStates.AbstractState,
	setup: function(params) {
		enyo.application.openPinCard({preferences: true, params: params});
	},
	cleanup: function() {
		
	},
	event_back: function(e) {
		// todo go back to dialpad instead?
		enyo.application.UI.enter("pin");
	},
	event_emergency: function(isEnabled) {
		if ( isEnabled ) {
			enyo.application.UI.enter("emergency_pin");
		} else {
			enyo.error("unexpected event_emergency event received");
		}
	},
	// if we get a dial event but are already showing the dial pad
	event_dial: function(params) {
		enyo.application.UI.enter("dialpad_pin", params);
	},
	event_lockstage_deactivate: function() {
		// if the lockstage was deactivated it was because the screen was turned off
		enyo.application.UI.enter('pin');
	},
	event_activecall: function(params) {
		enyo.application.UI.enter("activecall_pin", params);
	},
	event_lock: function(enabled) {
		if ( ! enabled ) {
			enyo.application.UI.enter('preferences_card');
		}
	}
});
