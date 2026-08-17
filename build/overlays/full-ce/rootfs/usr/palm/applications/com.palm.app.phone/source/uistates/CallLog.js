/**
  * Superclass for CallLogAllState and CallLogMissedState
  * Not used as an actual state, but rather to house function common to both subclasses
  */
enyo.kind({
	name: "UIStates.CallLogAbstractState",
	kind: UIStates.AbstractState,
	cleanup: function() {
		enyo.application.tellMainCard({scene:'calllog', params:{cleanup: true}});
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
	},
	event_windowActivate: function(params) {
		this._maybeRefreshLists();
	},
	_maybeRefreshLists: function() {
		var now = enyo.application.Utils.formatRelativeDate(new Date());
		var timezone = new Date().getTimezoneOffset();

		if ( this.lastCheckTime ) {
			then = enyo.application.Utils.formatRelativeDate(this.lastCheckTime);
			if ( now !== then || timezone !== this.lastCheckTimezone ) {
				enyo.application.tellMainCard({scene:'calllog', params:{refreshLists: true}});
			}
		}
		
		this.lastCheckTime = new Date();
		this.lastCheckTimezone = timezone;
	},
});

/**
  * Subclass of UIStates.CallLogAbstractState
  * Represents the "All calls" tab of the call log scene
  */
enyo.kind({
	name: "UIStates.CallLogAllState",
	kind: UIStates.CallLogAbstractState,
	setup: function(params, dontFocus) {
		enyo.application.openMainCard({scene: 'calllog'}, "images/splash/splash-phone-calllog.png", dontFocus);
		this._maybeRefreshLists();
	}
});

/**
  * Subclass of UIStates.CallLogAbstractState
  * Represents the "Missed calls" tab of the call log scene
  */
enyo.kind({
	name: "UIStates.CallLogMissedState",
	kind: UIStates.CallLogAbstractState,
	setup: function(params, dontFocus) {
		this.event_missedcall(dontFocus);
	},
	event_missedcall: function(dontFocus) {
		if (!enyo.application.isTablet) {
			enyo.application.openMainCard({
				scene: 'calllog',
				params: {
					missed: true
				}
			}, "images/splash/splash-phone-calllog.png", dontFocus);
			this._maybeRefreshLists();
		}
	}
});
