enyo.kind({
	name: "UIStates.ActiveCallPinState",
	kind: UIStates.AbstractState,
	setup: function(params) {
		enyo.application.openPinCard({activecall: true});
	},
	cleanup: function() {
		
	},
	event_back: function(e) {
        enyo.application.UI.enter('pin'); // temp for now
		//e.stopPropagation();
	},
	event_hangup: function() {
	        //Workaround: CFISH-7508 - In pin state LSM loads pin window(different index.html), 
	        //so phone app child window stays in activepin UI when pin window closes, changing state to dialpad.
		enyo.application.UI.enter('dialpad_card', undefined, true);
		
		enyo.application.UI.enter("pin", true /*force pinpad activation*/);
	},
	event_emergency: function(isEnabled) {
		if ( isEnabled ) {
			enyo.application.UI.enter("activecall_pin_emergency");
		} else {
			enyo.error("unexpected event_emergency event received");
		}
	},
	event_dial: function(params) {
		enyo.application.UI.enter('dialpad_pin', params);
	},
	event_activecall: function(params) {
		// don't need to handle
	},
	event_lock: function(enabled) {
		enyo.require(!enabled, "ActiveCallPinState received an unexpected lock event");
		enyo.application.UI.enter('activecall_card');
	},
	event_preferences: function(params) {
		enyo.application.UI.enter('preferences_pin',params);
	}
});
