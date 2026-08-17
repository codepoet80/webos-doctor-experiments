// These are the items created and displayed when the DrawerItem is expanded 

// helper class handles events that the audio player can dispatch

/****************************/
var StreamingAudioPlayer = {
	audioprofile: "",
};

StreamingAudioPlayer.EventDispatch = function() {
	this.listeners = {};
}

StreamingAudioPlayer.EventDispatch.prototype.listen = function(eventName, callback, nIndex) {
	enyo.require(StreamingAudioPlayer.EventDispatch.EVENTS.indexOf(eventName) >= 0, "StreamingAudioPlayer#addEventListener: invalid event passed " + eventName);
	this.listeners[eventName] = {callback: callback, nIndex: nIndex};
	return this;
}

StreamingAudioPlayer.EventDispatch.prototype.fire = function(eventName) {
	var listener = this.listeners[eventName];
	if ( listener && listener.callback ) {
		listener.callback(listener.nIndex);
	}
	return this;
}

StreamingAudioPlayer.EventDispatch.EVENTS = [
	'playbackstarted', // playback was paused or ended
	'playbackended', // playback was paused or ended
	'played', // sent when the audio file has been played past the 5 second mark
];

/****************************/

enyo.kind({
	name: "StreamingAudioPlayer.DrawerItem",
	kind: enyo.HFlexBox,
	className: "favorites-drawer-item",
	published: {
		fromUsername: "",
		timestamp: 0,
		duration: 0,
		service: ""
	},
	components: [
		{name: "playPauseButton", className: "voicemail-drawer-button playpause", onclick: "onPlayPause"},
		{name: "slider", kind: "ProgressSlider", position: 0, maximum: 100, position: 0, flex: 1, onChange: "sliderChange", onFinish: "FinishTest"},
		{name: "speakerIcon", className: "voicemail-drawer-button speakerphone", onclick: "onSpeakerIconClick"},
        {name: "getCurrentScenario", kind: enyo.PalmService, service: "palm://com.palm.audio/media/", method: "status", onSuccess: "onCurrentScenario", onFailure: "serviceFailure"},
		{name: "playVM", kind: enyo.PalmService, service: "palm://com.palm.skype/", method: "playVoicemail", onSuccess: "onPlay", onFailure: "onError"},
		{name: "stopVM", kind: enyo.PalmService, service: "palm://com.palm.skype/", method: "stopVoicemail", onSuccess: "onPause", onFailure: "onError"},
		{name: "deleteVM", kind: enyo.PalmService, service: "palm://com.palm.skype/", method: "deleteVoicemail", onSuccess: "onDeleteVMEvent", onFailure: "onError"}
	],

	// Common function to catch a service request failure
	serviceFailure: function() {
		enyo.log("serviceFailure");
	},
	
	/* local properties */
	playing: false,
	speakerPhone: false,
	intBarPos: 0,
	events: null,
	currentTime: 0,
	
	create: function() {
		this.inherited(arguments);
		this.events = new StreamingAudioPlayer.EventDispatch();
		this.getCurrentAudioProfile();
	},
	destroy: function () {
		this.events = null;
		this.$.getCurrentScenario.cancel();
		this.inherited(arguments);
	},

	addEventListener: function(eventName, callback, nIndex) {
		this.events.listen(eventName, callback, nIndex);
		return this;
	},

	/*******************
		Playback control functions
	********************/
	onPlayPause: function() {
		if (this.playing == true) {
			this.pause();
		}
		else {
			this.play();
		}
	},

	// play + callback
	play: function() {
		this.$.playVM.call({
			"id": this.fromUsername,
			"timestamp": this.timestamp
		 });
	},

	onPlay: function() {
		if ( ! this.playing ) {
			this.events.fire('playbackstarted');
			this.syncSpeakerPhone();
			this.playing = true;
			this.startUpdatingSlider();
			this.$.playPauseButton.domAttributes.className = 'voicemail-drawer-button paused';
			this.$.playPauseButton.render();
		}
	},

	// pause + callback
	pause: function() {
		this.$.stopVM.call({
			"id": this.fromUsername,
			"timestamp": this.timestamp
		 });	
	},

	onPause: function() {
		if ( this.playing ) {
			this.events.fire('playbackended');
			this.setDefaultSpeaker();
			this.setProxSensorEnabled(false);
			this.playing = false;
			this.stopUpdatingSlider();
			this.$.playPauseButton.domAttributes.className = 'voicemail-drawer-button playpause';
			this.$.playPauseButton.render();
		}
	},

	// onEnd is called manually by updateSliderPosition when currentTime > duration
	onEnd: function() {
		if ( ! this.firedPlayedEvent ) {
			this.firedPlayedEvent = true;
			this.events.fire('played');
		}

		this.speakerPhone = false;
		this.$.speakerIcon.domAttributes.className = 'voicemail-drawer-button speakerphone';
		this.$.speakerIcon.render();

		this.stopUpdatingSlider();
		this.intBarPos = 0;
		this.$.slider.setPositionImmediate(this.intBarPos);

		this.currentTime = 0;
		this.pause();
	},

	onError: function() {
		enyo.log("-- Skype voicemail error");
	},

	/*******************
		Audio path control functions
		-------------------------
		possible audio scenarios
			"media_headset_mic"
			"media_a2dp"
			"media_front_speaker"
			"media_back_speaker"
	********************/
	getCurrentAudioProfile: function() {
		// luna-send -i palm://com.palm.audio/media/status '{}'
		this.$.getCurrentScenario.call({
			params: {},
		 });
	},
	
	onCurrentScenario: function(inSender, inResponse, inRequest) {
		// enyo.log("Current audio scenario: " + inResponse.scenario);
		StreamingAudioPlayer.audioprofile = inResponse.scenario;
	},
	
	onSpeakerIconClick: function() {
		if (this.speakerPhone == true)
		{
			// if it is speakerphone mode, then microphone mode
			// this.setAudioScenario("media_front_speaker");
			this.setDefaultSpeaker();
			this.$.speakerIcon.domAttributes.className = 'voicemail-drawer-button speakerphone';
		}
		else
		{
			// If it is microphone mode, then speakerphone mode
			this.setAudioScenario("media_back_speaker");
			this.$.speakerIcon.domAttributes.className = 'voicemail-drawer-button speakerphoneselected';
		}
		this.$.speakerIcon.render();

		this.speakerPhone = !this.speakerPhone;
	},

	// sync speaker phone to audiod
	syncSpeakerPhone: function() {
		if ( this.speakerPhone ) {
			this.setAudioScenario("media_back_speaker");
			this.setProxSensorEnabled(false);
		} else {
			this.setDefaultSpeaker();
			this.setProxSensorEnabled(true);
		}
	},

	// sets the current audio route to bluetooth if enabled, else front speaker
	setDefaultSpeaker: function() {
		if ( StreamingAudioPlayer.audioprofile == "media_a2dp" ) {
			this.setAudioScenario("media_a2dp");	// bluetooth
		} else if ( StreamingAudioPlayer.audioprofile == "media_headset" || StreamingAudioPlayer.audioprofile == "media_headset_mic" ) {
			this.setAudioScenario("media_headset_mic");	// headset_mic
		} else {
			this.setAudioScenario("media_front_speaker");	// front speaker
		}
	},

	setAudioScenario: function(scenario) {
		enyo.application.audioInterface.onAudioMediaRouteChangeClick(scenario);
		StreamingAudioPlayer.audioprofile = scenario;
	},

	/*******************
		Proximity sensor control functions
	********************/
	setProxSensorEnabled: function(enable) {
		if ( enable ) {
			enyo.application.proxInterface.proxOn();
		} else {
			enyo.application.proxInterface.proxOff();
		}
	},

	/*******************
		Slider control functions
	********************/
	startUpdatingSlider: function() {
		if(this.updateSliderInterval !== undefined)
		{
			window.clearInterval(this.updateSliderInterval);
		}
		this.updateSliderInterval = window.setInterval(enyo.bind(this, "updateSliderPosition"), 200)
	},
	
	stopUpdatingSlider: function() {
		window.clearInterval(this.updateSliderInterval);
	},
	
	updateSliderPosition: function ()
	{
		if ( ! this.playing ) {
			this.stopUpdatingSlider();
			return;
		}
		if ( ! this.firedPlayedEvent && this.currentTime >= 500 ) {
			// TODO: Update DB or carrier to "played"
			
			this.firedPlayedEvent = true;
			this.events.fire('played');
		}

		// Move slider bar to the new position
		this.intBarPos = 100 * (this.currentTime / this.duration);
		this.$.slider.setPositionImmediate(this.intBarPos);

		// manually step the time forward
		this.currentTime += 200;

		if(this.currentTime >= this.duration) {
			this.onEnd();
		}
	},

	sliderChange: function(inSender) {
		this.stopUpdatingSlider();

		this.intBarPos = inSender.getPosition();
		this.currentTime = this.intBarPos / 100 * this.duration;

		if ( this.intBarPos == 100 ) {
			this.onEnd();
		} else if ( this.playing ) {
			this.startUpdatingSlider();
		}
	},
	
	cleanup: function() {
		this.stopUpdatingSlider();

		this.intBarPos = 0;
		this.currentTime = 0;
		this.$.slider.setPositionImmediate(this.intBarPos);

		if (this.playing) {
			this.pause();
			this.playing = false;
			this.$.playPauseButton.domAttributes.className = 'voicemail-drawer-button playpause';
			this.$.playPauseButton.render();
		}
	
		this.setProxSensorEnabled(false);

		if (this.speakerPhone) {
			this.speakerPhone = false;
			this.setDefaultSpeaker();
			this.$.speakerIcon.domAttributes.className = 'voicemail-drawer-button speakerphone';
			this.$.speakerIcon.render();
		}
	}
});
