enyo.kind({
	name: "UIStates.AbstractState",
	kind: enyo.Object, // for logging
	constructor: function(name, machine) {
		this.inherited(arguments);
		this.name = name;
	},
	getName: function() {
		return this.name;
	},
	// default lock event puts the phone into the pin state 
	event_lock: function(enabled) {
		if ( enabled ) {
			enyo.application.UI.enter('pin');
		}
	},
	// default voicemail event puts the phone into the voicemail state 
	event_voicemail: function(params) {
		enyo.application.UI.enter('voicemail',params);
	},
	// default calllogmissed event puts the phone into the calllogmissed state 
	event_missedcall: function(enabled) {
		if (enyo.application.isTablet) {
			//no missed call log on tablets
			enyo.application.UI.enter('calllog');
		} else {
			enyo.application.UI.enter('calllogmissed');
		}
	},
	event_launch: function() {
		if ( ! enyo.application.activateMainCard() ) {
			// if stage doesn't exist, call setup to reopen stage with arguments
			this.setup();
		}
	},
	// default preferences goes to main preferences scene
	event_preferences: function(params) {
		enyo.application.UI.enter('preferences_card',params);
	}
});
