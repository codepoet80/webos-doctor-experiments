// emergency_pin
enyo.kind({
	name: "UIStates.EmergencyModePinState",
	kind: UIStates.AbstractState,
	setup: function() {
		enyo.application.openEmergencyCard({'emergencymode':true});
	},
	cleanup: function() {
		
	},
	event_back: function(e) {
		e.stopPropagation();
	},
	event_emergency: function(isEnabled) {
		// always go back to dialpad when exiting emergency mode from emergency stage
		if ( ! isEnabled ) {
			enyo.application.UI.enter("pin");
			enyo.application.closeEmergencyCard();
		} else {
			enyo.error("Unexpected event_emergency event received");
		}
	},
	event_dial: function(params) {
		enyo.application.UI.enter('dialpad_pin_emergency', params);
	},
	event_activecall: function(params) {
		// transition likely can't happen, but handle just in case
		enyo.error("unexpected activecall event");
		enyo.application.UI.enter('activecall_pin_emergency', params);
	},
	event_lock: function(enabled) {
		enyo.require(! enabled, "EmergencyModePinState received an unexpected lock event");
		enyo.application.UI.enter('emergency_card');
	},
	event_preferences: function(params) {
		//block
	}
});
