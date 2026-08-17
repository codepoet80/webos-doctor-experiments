//favorites
enyo.kind({
	name: "UIStates.FavoritesState",
	kind: UIStates.AbstractState,
	setup: function(params, dontFocus) {
		enyo.require( ! window.PalmSystem || ! PalmSystem.isMinimal, "Should never be in favorites in minimal state")
		enyo.application.openMainCard({scene: 'favorites'}, undefined, dontFocus);
	},
	cleanup: function() {
		
	},
	event_back: function(e) {
		enyo.application.UI.enter('contactlookup');
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
	event_voicedialing: function(params) {
		enyo.application.UI.enter('voicedialing', params);
	}
});
