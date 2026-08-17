enyo.kind({
	name: "UIStates.PreferencesCardState",
	kind: UIStates.AbstractState,
	setup: function(params) {
		enyo.application.openMainCard({preferences: true, params:params}, "images/splash/splash-phone-dialpad.png");
	},
	cleanup: function() {
		// if coming from start state (no card) or if in first use, close card
		if ( /*enyo.application.UI.previousState.getName() == 'start' ||*/ PalmSystem.isMinimal ) {
			enyo.application.closeMainCard();
		}
	},
	event_back: function(e) {
		// go back to active call or dialpad or firstlaunch
		if ( enyo.application.CallSynergizer.callExists() ) {
			enyo.application.UI.enter("activecall_card");
		} else {
			var phoneTabScene;
		    	if(enyo.application.isTablet && !enyo.application.Cache.hasVoipAcct && !enyo.application.Cache.hasPairedPhone) {
				phoneTabScene = 'firstlaunch_card';
			} else if (enyo.application.isTablet && enyo.application.Cache.hasPairedPhone) {
				phoneTabScene = 'dialpad_card';
			} else {
				phoneTabScene = 'contactlookup';
			}
			enyo.application.tellMainCard({scene:phoneTabScene});
		}
		e && e.preventDefault();
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
	event_changeView: function(params) {
		this.setup(params);
	},
	event_closed: function() {
		enyo.application.UI.enter("dialpad_card");		
	},
	event_backtoState: function(params) {
		if (params.nextState == "start") {
			enyo.application.closeMainCard();
		} else if (params.nextState == "preferences_card"){
			if (params.nextView) {
				this.setup({"launchType": params.nextView});
			} else {
				this.setup({"launchType": "main"});
			}			
		} else {
			enyo.application.UI.enter(params.nextState);
		}
	}	
});
