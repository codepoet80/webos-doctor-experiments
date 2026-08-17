enyo.kind({
	name: "UIStates.DialpadPinState",
	kind: UIStates.AbstractState,
	setup: function(params) {
		enyo.application.openPinCard({dialpad: true, params: params});
	},
	cleanup: function() {
		
	},
	event_back: function(e) {
        if ( enyo.application.CallSynergizer.callExists() ) {
            enyo.application.UI.enter("activecall_pin");
		} else {
			enyo.application.UI.enter("pin", true);
		}
		e && e.preventDefault();
	},
	event_emergency: function(isEnabled) {
		if ( isEnabled ) {
			enyo.application.UI.enter("dialpad_pin_emergency");
		} else {
			enyo.error("unexpected event_emergency event received");
		}
	},
	// if we get a dial event but are already showing the dial pad
	event_dial: function(params) {
		this.setup(params);
	},
	event_lockstage_deactivate: function() {
		// if the lockstage was deactivated it was because 
		enyo.application.UI.enter('pin');
	},
	event_activecall: function(params) {
		enyo.application.UI.enter("activecall_pin", params);
	},
	event_lock: function(enabled) {
		if ( ! enabled ) {
			enyo.application.UI.enter('dialpad_card');
		}
	},
	event_preferences: function(params) {
		enyo.application.UI.enter('preferences_pin',params);
	},
	event_voicedialing: function(params) {
		enyo.application.UI.enter('voicedialing_pin', params);
	}
});
