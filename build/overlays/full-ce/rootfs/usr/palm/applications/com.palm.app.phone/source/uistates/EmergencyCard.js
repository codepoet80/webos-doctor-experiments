//emergency_card
enyo.kind({
	name: "UIStates.EmergencyModeCardState",
	kind: UIStates.AbstractState,
	setup: function() {
		enyo.application.openEmergencyCard({'emergencymode':true});
	},
	cleanup: function() {
		
	},
	event_back: function(e) {
		e.stopPropagation();
	},
	event_emergency: function(isEnabled) {
		// always go back to dialpad when exiting emergency mode from emergency stage
		if ( ! isEnabled ) {
			enyo.application.closeEmergencyCard();
			enyo.application.UI.enter("dialpad_card");
			// if in first use, also close main stage and go straight to first use
			/*if ( PalmSystem.isMinimal ) {
				this.appController.closeStage(UI.STAGES.MAIN);
				enyo.application.UI.enter("start");
			} else {
				enyo.application.UI.enter("dialpad_card");
			}*/
		} else {
			enyo.error("unexpected event_emergency event received");
		}
	},
	event_dial: function(params) {
		enyo.application.UI.enter('dialpad_emergency', params);
	},
	event_activecall: function(params) {
		// transition likely can't happen, but handle just in case
		enyo.application.UI.enter('activecall_emergency', params);
	},
	event_lock: function(enabled) {
		enyo.require(enabled, "EmergencyModeCardState received an unexpected unlock event")
		enyo.application.UI.enter('emergency_pin');
	}
});
