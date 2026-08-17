enyo.kind({
	name: "UIStates.PinState",
	kind: UIStates.AbstractState,
	setup: function() {
		enyo.application.tellPinCard();
	},
	cleanup: function() {
		
	},
	event_dial: function(params) {
		enyo.application.UI.enter('dialpad_pin', params);
	},
	event_activecall: function(params) {
		enyo.application.UI.enter("activecall_pin", params);
	},
	event_hangup: function() {
		
	},
	event_back: function(e) {
        if ( enyo.application.CallSynergizer.callExists() ) {
            enyo.application.UI.enter("activecall_pin");
		} else {
			enyo.application.tellPinCard({cancel:true});
		}
		e && e.preventDefault();
	},
	event_lock: function(enabled) {
		var prevState = enyo.application.UI.getPreviousState();
		
		if ( ! enabled ) {
			// CASE: active call exists, go back
			if (enyo.application.CallSynergizer.callExists()) {
				enyo.application.UI.enter("activecall_card");
				
			// CASE: coming from a whitelisted state, go back to it
			// we must whitelist these since we don't accidentally go back to
			// a bad state such as 'activecall_pin'
			} else if ( ['voicemail','calllog','calllog_missed','preferences_card','favorites'].indexOf(prevState) >= 0) {
				enyo.application.UI.enter(prevState, undefined, true);
				
			// ELSE: go back to start state
			} else {
				enyo.application.UI.enter('start', undefined, true);
			}
		}
	},
	event_lockstage_activate: function() {
		// CASE: sysmgr activated us because the user pressed the power button
		if ( ! enyo.application.CallSynergizer.callExists() ) {
			enyo.application.tellPinCard();
		}
		
		/* TODO copied from Barley, but might not need this anymore:
		// CASE: sysmgr activated us because of an incoming call. Just wait for the
		//	activecall or hangup event. Check again in 3 seconds in case it doesn't come through.
		}/ else {
			// if we didn't receive the active call event we were waiting for, show lock screen
			this.waitForActiveCallTimeout = setTimeout(function() {
				if ( ! this.tel.incomingLine() && ! this.tel.callExists() ) {
					Mojo.Log.warn("PinState: Expected an activecall or hangup event in 3s after being actived with an incoming call.");
					this._pushLockScene();
				}
			}.bind(this), 3000);
		}*/
	},
	event_voicemail: function() {
		// block accessing voicemail from pin
	},
	event_launch: function() {
		// block default
	},
	event_preferences: function(params) {
		enyo.application.UI.enter('preferences_pin', params);
	},
	event_voicedialing: function(params) {
		enyo.application.UI.enter('voicedialing_pin', params);
	}
});
