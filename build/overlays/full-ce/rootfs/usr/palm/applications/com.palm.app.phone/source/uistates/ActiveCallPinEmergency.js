enyo.kind({
	name: "UIStates.ActiveCallPinEmergencyState",
	kind: UIStates.AbstractState,
	setup: function(params) {
		enyo.application.openEmergencyCard({'activecall': true});
	},
	cleanup: function() {
		
	},
	event_back: function(e) {
		e.stopPropagation();
	},
	event_hangup: function() {		
		enyo.application.UI.enter('emergency_pin');
	},
	event_emergency: function(isEnabled) {
		if ( ! isEnabled ) {
			enyo.application.UI.enter("activecall_pin");
			enyo.application.closeEmergencyCard();
		} else {
			enyo.error("unexpected event_emergency event received");
		}
	},
	event_dial: function(params) {
		enyo.application.UI.enter('dialpad_pin_emergency', params);
	},
	event_activecall: function(params) {
		// don't need to handle
	},
	event_lock: function(enabled) {
		enyo.require(!enabled, "ActiveCallPinEmergencyState received an unexpected lock event");
		enyo.application.UI.enter('activecall_emergency');
	},
	event_preferences: function(params) {
		// block
	}
});
