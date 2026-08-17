//favorites
enyo.kind({
	name: "UIStates.FavoritesAddState",
	kind: UIStates.AbstractState,
	setup: function(params) {
		enyo.require( ! window.PalmSystem || ! PalmSystem.isMinimal, "Should never be in favoritesadd in minimal state")
		if (enyo.application.isTablet) {
			enyo.application.openMainCard({
				scene: 'favoritesAdd',
				context: params
			}, "images/splash/splash-phone-dialpad.png");
		}
		else {
			enyo.application.openMainCard({
				favoritesAdd: true,
				context: params
			}, "images/splash/splash-phone-dialpad.png");
		}
	},
	cleanup: function() {
		
	},
	event_back: function(e) {
		if (e._handled !== true) {
			enyo.application.UI.enter("favorites");
		}
		e.preventDefault();
	},
	event_closed: function() {
		enyo.application.UI.enter("favorites");
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
	}
});
