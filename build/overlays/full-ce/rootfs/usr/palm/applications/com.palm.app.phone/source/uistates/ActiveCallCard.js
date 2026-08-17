// The active call state for regular sysmgr
//activecall_card
enyo.kind({
	name: "UIStates.ActiveCallStateCard",
	kind: UIStates.AbstractState,
	setup: function(params) {
		// track if the main card was open at launch so we can close it again when it's hung up
		var mainCard = enyo.application.getMainCard();
		this.dismissCardOnHangup = ! mainCard || mainCard.hidden;
		
		enyo.application.openMainCard({activecall: true, showActiveCallBanner: false}, "images/splash/splash-phone-activecall.png");
	},
	cleanup: function() {
		enyo.application.tellMainCard({showActiveCallBanner: true});
		this.dismissCardOnHangup = undefined;
	},
	event_back: function(e) {
		// fail-safe: if we ever get stuck here when a call doesn't exist, go back to dialpad
		if ( ! enyo.application.CallSynergizer.callExists() ) {
			enyo.application.UI.enter('dialpad_card');
		}
		// otherwise, block
	},
	event_hangup: function() {
		if(this.isHangingUp) {
			// Prevent a recursive infinite loop
			return;
		}
		this.isHangingUp = true;
        // if stage was hidden when active call started (and not firstuse), hide it
        var mainCard = enyo.application.getMainCard();
        var shouldCloseStage = this.dismissCardOnHangup && mainCard && ! mainCard.hidden && mainCard.PalmSystem && ! mainCard.PalmSystem.isMinimal && !enyo.application.CallSynergizer.incomingLine();
        if ( shouldCloseStage ) {
			enyo.application.closeMainCard();
		}
		
		var prevState = enyo.application.UI.getPreviousState();
		
		// CASE: main stage was closed, go to start
		if ( shouldCloseStage ) {
			enyo.application.UI.enter('start');         
		// CASE: prevstate is ok to go back to after hangup, go there
		} else if ( ['voicemail','calllog','calllog_missed','preferences','favorites', 'contactlookup'].indexOf(prevState) >= 0) {
			enyo.application.UI.enter(prevState, undefined, true);
		// CASE: prevstate was not ok, go to dialpad
		} else {
			enyo.application.UI.enter('dialpad_card', undefined, true);
		}
		this.isHangingUp = false;
	},
	event_emergency: function(isEnabled) {
		if ( isEnabled ) {
			enyo.application.UI.enter("activecall_emergency", undefined, true);
		} else {
			enyo.error("unexpected event_emergency event received")
		}
	},
	event_dial: function(params) {
		enyo.application.UI.enter('dialpad_card', params);
	},
	event_lock: function(enabled) {
		if ( enabled ) {
			enyo.application.UI.enter('activecall_pin');
		}
	},
	event_windowActivate: function() {
		enyo.application.tellMainCard({showActiveCallBanner: false, windowActivate: true});
	},
	event_windowDeactivate: function() {
		enyo.application.tellMainCard({showActiveCallBanner: true, windowDeactivate: true});
	}, 
	event_preferences: function(params) {
		enyo.application.UI.enter('preferences_card', params);
	},
	event_activecall: function(forceFocus) {
		if ( forceFocus ) {
			this.event_launch();
		}
	}
});
