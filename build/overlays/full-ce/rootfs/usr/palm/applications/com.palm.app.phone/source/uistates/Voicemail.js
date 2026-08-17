//voicemail
enyo.kind({
	name: "UIStates.VoicemailState",
	kind: UIStates.AbstractState,
	setup: function(params, dontFocus ) {
		enyo.require( ! window.PalmSystem ||  ! PalmSystem.isMinimal, "Should never see voicemail in minimal state");	
		enyo.application.openMainCard({scene: 'voicemail', params: params}, "images/splash/splash-phone-voicemail.png", dontFocus);
		
		// always tell voicemail services to refresh upon entering voicemail inbox view
		enyo.application.VoicemailService.refreshMessages("normal");
	},
	cleanup: function() {
		enyo.application.tellMainCard({scene: 'voicemail', params: {cleanup: true} });
	},
	event_closed: function() {
		// when app is flicked off, clean up scene
		this.cleanup();
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
	event_windowActivate: function() {
		enyo.application.tellMainCard({scene: 'voicemail', params: {activate: true} });
	}, 
	event_windowDeactivate: function() {
		enyo.application.tellMainCard({scene: 'voicemail', params: {deactivate: true} });
	}, 
	event_voicemail: function(params) {
		// (ignore params)
		
		this.event_launch();
		
		// tapping on the dashboard or toolbar icon will also refresh messages
		enyo.application.VoicemailService.refreshMessages("normal");
	},
	event_voicedialing: function(params) {
		enyo.application.UI.enter('voicedialing', params);
	}
});
