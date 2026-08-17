enyo.kind({
	name: "UIStates.StartState",
	kind: UIStates.AbstractState,
	setup: function() {
		
	},
	
	event_launch: function(params) {

        enyo.log("start: has skype account " + enyo.application.Cache.hasVoipAcct);
        enyo.log("start: has paired phone "  + enyo.application.Cache.hasPairedPhone);

        // sanity checks
        if (enyo.application.Cache.hasPairedPhone === undefined) {
            enyo.application.Cache.hasPairedPhone = false;
        }

        if (enyo.application.Cache.hasVoipAcct === undefined) {
            enyo.application.Cache.hasVoipAcct = false;
        }

        // first launch or dial screen
        if ((enyo.application.Cache.hasVoipAcct == false) && (enyo.application.Cache.hasPairedPhone == false))
        {
	    	enyo.application.UI.enter('firstlaunch_card', params);		    
		} else {
			if (enyo.application.Cache.hasPairedPhone === true && enyo.application.Cache.hasVoipAcct === false) {	
				enyo.application.UI.enter('dialpad_card', params);		
			}
			else {
				enyo.application.UI.enter('contactlookup', params);
			}
		}
	},
	event_emergency: function(isEnabled) {
		if ( isEnabled ) {
			enyo.application.UI.enter('emergency_card');
		}
	},
	event_activecall: function(params) {
		enyo.application.UI.enter('activecall_card', params);
	},
	event_dial: function(params) {
		enyo.application.UI.enter('dialpad_card', params);
	},
	event_lock: function(enabled) {
		if ( enabled ) {
			enyo.application.UI.enter('pin');
		}
	},
	event_voicedialing: function(params) {
		enyo.application.UI.enter('voicedialing', params);
	}
});
