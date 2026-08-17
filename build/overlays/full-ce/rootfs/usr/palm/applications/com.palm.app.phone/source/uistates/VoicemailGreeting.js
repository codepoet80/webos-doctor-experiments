//voicemailgreeting
enyo.kind({
	name: "UIStates.VoicemailGreetingState",
	kind: UIStates.AbstractState,
	setup: function(params, dontFocus ) {
		enyo.require( ! window.PalmSystem ||  ! PalmSystem.isMinimal, "Should never see voicemailgreeting in minimal state");
		enyo.application.openMainCard({voicemailgreeting: true, params: "vmFrontpage"}, "images/splash/splash-phone-dialpad.png");
	},
	cleanup: function() {
		enyo.log("cleanup()");
	},
	event_back: function(e) {
		enyo.application.tellMainCard({voicemailgreeting_back: true});
		e.preventDefault();
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
		enyo.application.UI.enter("dialpad_card", params);		
	}	
});


