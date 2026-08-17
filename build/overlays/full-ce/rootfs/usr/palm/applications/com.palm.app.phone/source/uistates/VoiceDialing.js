//voice dialing
enyo.kind({
	name: "UIStates.VoicedialingState",
	kind: UIStates.AbstractState,
	setup: function(params, dontFocus) {
		enyo.application.openMainCard({voicedialing: true, params: params}, "images/splash/splash-phone-dialpad.png");
	},
	event_back: function(e) {
		enyo.application.UI.enter('dialpad_card', undefined, true);
		e && e.preventDefault();
	},
	cleanup: function() {
		// if coming from start state (no card) or if in first use, close card
		if ( /*enyo.application.UI.previousState.getName() == 'start' ||*/ window.PalmSystem && PalmSystem.isMinimal ) {
			enyo.application.closeMainCard();
		}
	},
	event_emergency: function(isEnabled) {
		if ( isEnabled ) {
			enyo.application.UI.enter("emergency_card");
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
	event_closed: function() {
		enyo.application.UI.enter("dialpad_card");		
	},	
	event_voicedialing: function(params) {
		// todo call 'update'?
	}
});
