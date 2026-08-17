//dialpad_emergency
enyo.kind({
	name: "UIStates.DialpadEmergencyState",
	kind: UIStates.AbstractState,
	setup: function(params) {
		enyo.application.openEmergencyCard({'dialpad':true, params: params});
	},
	cleanup: function() {
		
	},
	event_back: function(e) {
		if ( enyo.application.CallSynergizer.callExists() ) {
            enyo.application.UI.enter("activecall_emergency");
		} else {
			enyo.application.UI.enter("emergency_card");
		}
		e && e.stopPropagation();
	},
	event_emergency: function(isEnabled) {
		if ( ! isEnabled ) {
			enyo.application.closeEmergencyCard();
			enyo.application.UI.enter("dialpad_card");
		} else {
			enyo.error("unexpected event_emergency event received");
		}
	},
	// if we get a dial event but are already in the dial state, just let the scene assistant know
	event_dial: function(params) {
		this.setup(params);
	},
	event_activecall: function(params) {
		enyo.application.UI.enter("activecall_emergency", params);
	},
	event_lock: function(enabled) {
		enyo.require(enabled, "DialpadEmergencyState received an unexpected unlock event");
		enyo.application.UI.enter('dialpad_pin_emergency');
	}
});
