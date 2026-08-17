//voice dialing
enyo.kind({
	name: "UIStates.VoicedialingPinState",
	kind: UIStates.AbstractState,
	setup: function(params, dontFocus) {
		enyo.application.openPinCard({voicedialing: true, params: params});
	},
	cleanup: function() {
		
	},
	event_back: function(e) {
		enyo.application.UI.enter('pin', undefined, true);
	},
	event_emergency: function(isEnabled) {
		if ( isEnabled ) {
			enyo.application.UI.enter("emergency_pin");
		} else {
			enyo.error("unexpected event_emergency event received");
		}
	},
	event_dial: function(params) {
		enyo.application.UI.enter('dialpad_pin', params);
	},
	event_activecall: function(params) {
		enyo.application.UI.enter("activecall_pin", params);
	},
	event_voicedialing: function(params) {
		// todo call 'update'?
	}
});
