//activecall_emergency
enyo.kind({
	name: "UIStates.ActiveCallEmergencyState",
	kind: UIStates.AbstractState,
	setup: function(params, noTransition) {
		enyo.application.openEmergencyCard({'activecall': true});
	},
	cleanup: function() {
		
	},
	event_back: function(e) {
		e.stopPropagation();
	},
	event_hangup: function() {		
		enyo.application.UI.enter("emergency_card");
	},
	event_emergency: function(isEnabled) {
		if ( ! isEnabled ) {
			enyo.application.closeEmergencyCard();
			enyo.application.UI.enter("activecall_card");
		} else {
			enyo.error("unexpected event_emergency event received");
		}
	},
	event_dial: function(params) {
		enyo.application.UI.enter('dialpad_emergency', params);
	},
	event_activecall: function(params) {
		// don't need to handle
	},
	event_lock: function(enabled) {
		enyo.require(enabled, "ActiveCallEmergencyState received an unexpected unlock event");
		enyo.application.UI.enter('activecall_pin_emergency');
	}
});
