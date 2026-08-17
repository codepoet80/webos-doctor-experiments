// dialpad_pin_emergency
enyo.kind({
	name: "UIStates.DialpadPinEmergencyState",
	kind: UIStates.AbstractState,
	setup: function(params) {		
		enyo.application.openEmergencyCard({'dialpad':true});
	},
	cleanup: function() {
		
	},
	event_back: function(e) {
		/*if ( this.appAssistant.telephonyEventListener.callExists() ) {
            enyo.application.UI.enter("activecall_pin_emergency");
		} else {
			enyo.application.UI.enter("emergency_pin");
		}*/
		e.stopPropagation();
	},
	event_emergency: function(isEnabled) {
		if ( ! isEnabled ) {
			enyo.application.UI.enter("dialpad_pin");
			enyo.application.closeEmergencyCard();
		} else {
			enyo.error("unexpected event_emergency event received");
		}
	},
	// if we get a dial event but are already in the dial state, just let the scene assistant know
	event_dial: function(params) {
		this.setup(params);
	},
	event_activecall: function(params) {
		enyo.application.UI.enter("activecall_pin_emergency", params);
	},
	event_lock: function(enabled) {
		enyo.require(! enabled, "DialpadPinEmergencyState received an unexpected lock event");
		enyo.application.UI.enter('dialpad_emergency');
	},
	event_preferences: function(params) {
		//block
	}
});
