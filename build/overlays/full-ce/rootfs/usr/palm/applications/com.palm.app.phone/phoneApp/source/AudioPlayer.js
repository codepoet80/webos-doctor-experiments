// These are the items created and displayed when the DrawerItem is expanded 

// helper class handles events that the audio player can dispatch

/****************************/
var AudioPlayer = {
	audioPlayer: null,
	cbPlay: null,
	cbPause: null,
	cbEnd: null,
	cbError: null,
	audioprofile: "",
	_audioStateVvmFunc: null,
	
	create: function() {
		this.initialize();
	},
	
	initialize: function() {
		if (this.audioPlayer == null) {
			this.audioPlayer = new Audio();
			this.audioPlayer.setAttribute("x-palm-media-audio-class","vvm");
			this.addEventListener();
		}
	},
	
	load: function(audioPath) {
		if (this.audioPlayer == null) {
			this.initialize();
		}
		if (audioPath){
			this.audioPlayer.src = audioPath;
			this.audioPlayer.load();
		}
	},
	
	destroy: function() {
		if (this._audioStateVvmFunc) {
			enyo.log("phone_audio>> unregister vvm audio listener");
			enyo.application.audioInterface.removeAudioStateVvmListener(this._audioStateVvmFunc);
			this._audioStateVvmFunc = null;
		}
	},
	
	play: function() {
		this.audioPlayer.play();
	},
	
	pause: function() {
		this.audioPlayer.pause();
	},
	
	addEventListener: function() {
		this.audioPlayer.addEventListener("play", enyo.bind(this, "onPlay"));
		this.audioPlayer.addEventListener("pause", enyo.bind(this, "onPause"));
		this.audioPlayer.addEventListener("ended", enyo.bind(this, "onEnd"));
		this.audioPlayer.addEventListener("error", enyo.bind(this, "onError"));
	},
	
	registerEventListener: function(cbPlay, cbPause, cbEnd, cbError) {
		this.cbPlay = cbPlay;
		this.cbPause = cbPause;
		this.cbEnd = cbEnd;
		this.cbError = cbError;
	},
	
	audioStateVvmFunc: function(profile, active) {
		enyo.log("phone_audio>> audioStateVvmFunc: new profile = " + profile + ", active = " + active);
		if (active == false)
		{
			enyo.log("phone_audio>> Pause playing audio");
			this.pause();
		}
	},
	
	onPlay: function() {
		if (this._audioStateVvmFunc === null) {
			enyo.log("phone_audio>> register vvm audio listener");
			this._audioStateVvmFunc = enyo.hitch(this, "audioStateVvmFunc")
			enyo.application.audioInterface.addAudioStateVvmListener(this._audioStateVvmFunc);
		}

		if (this.cbPlay) {
			this.cbPlay();
		}
	},
	
	onPause: function() {
		if (this.cbPause) {
			this.cbPause();
		}
	},
	
	onEnd: function() {
		if (this.cbEnd) {
			this.cbEnd();
		}
	},
	
	onError: function() {
		if (this.cbError) {
			this.cbError();
		}
	},
};

AudioPlayer.EventDispatch = function() {
	this.listeners = {};
}

AudioPlayer.EventDispatch.prototype.listen = function(eventName, callback, nIndex) {
	enyo.require(AudioPlayer.EventDispatch.EVENTS.indexOf(eventName) >= 0, "AudioPlayer#addEventListener: invalid event passed " + eventName);
	this.listeners[eventName] = {callback: callback, nIndex: nIndex};
	return this;
}

AudioPlayer.EventDispatch.prototype.fire = function(eventName) {
	var listener = this.listeners[eventName];
	if ( listener && listener.callback ) {
		listener.callback(listener.nIndex);
	}
	return this;
}

AudioPlayer.EventDispatch.EVENTS = [
	'playbackstarted', // playback was paused or ended
	'playbackended', // playback was paused or ended
	'played', // sent when the audio file has been played past the 5 second mark
];

// AudioPlayer.audioprofile = "";

/****************************/

enyo.kind({
	name: "AudioPlayer.DrawerItem",
	kind: enyo.VFlexBox,
	className: "favorites-drawer-item",
	published: {
		audioSize: 0,
		audioPath: "",
		duration: 0,
	},
	events: {
		onSpeakerIconUpdate: "",
		onPlayPauseButtonUpdate: "",
		onSliderUpdate: "",
	},
	components: [
		{className: "call-log-separator"},
		{kind: enyo.HFlexBox, style: "margin-left: 10px; margin-right: 10px; margin-top: 10px", components: [
			{name: "playPauseButton", className: "voicemail-drawer-button playpause", onclick: "onPlayPause"},
			{name: "slider", kind: "ProgressSlider", position: 0, maximum: 100, flex: 1, onChange: "sliderChange", onFinish: "FinishTest"},
			{name: "speakerIcon", className: "voicemail-drawer-button speakerphone", onclick: "onSpeakerIconClick"}
		]},
        {name: "getCurrentScenario", kind: enyo.PalmService, service: "palm://com.palm.audio/vvm/", method: "status", onSuccess: "onCurrentScenario", onFailure: "serviceFailure"},
        {name: "setVvmScenarioControl", kind: enyo.PalmService, service: "palm://com.palm.audio/vvm/", method: "control", onSuccess: "onSetVvmScenario", onFailure: "serviceFailure"},
	],

	// Common function to catch a service request failure
	serviceFailure: function() {
		enyo.error("phone_audio>> serviceFailure");
	},
	
	/* local properties */
	playing: false,
	speakerPhone: false,
	audioPlayer: null,
	intBarPos: 0,
	eventDispatch: null,
	audioPlayerInit: false,
	offSpeakerOnEnd: true,
	proxControl: true,
	firedPlayedEvent: false,
	
	create: function() {
		this.inherited(arguments);

		this.audioSizeChanged();
		this.audioPathChanged();
		this.playingChanged();

		this.eventDispatch = new AudioPlayer.EventDispatch();

		AudioPlayer.initialize();
		
		this.firedPlayedEvent = false;

		this.getCurrentAudioProfile();
		// AudioPlayer.audioprofile = enyo.application.Cache.audioVvmActiveProfile;
	},

	addEventListener: function(eventName, callback, nIndex) {
		this.eventDispatch.listen(eventName, callback, nIndex);
		return this;
	},

	/*******************
		Playback control functions
	********************/
	onPlayPause: function() {
		if (this.playing == true)
		{
			AudioPlayer.pause();
		}
		else
		{
			if (this.audioPlayerInit == false) {
				this.audioPlayerInit = true;
				this.firedPlayedEvent = false;
				AudioPlayer.registerEventListener(enyo.bind(this, "onPlay"), enyo.bind(this, "onPause"), enyo.bind(this, "onEnd"), enyo.bind(this, "onAudioError"));
				AudioPlayer.load(this.audioPath);
			}
			
			AudioPlayer.play();
		}
	},

	onPlay: function() {
		if ( ! this.playing ) {
			this.eventDispatch.fire('playbackstarted');
			this.syncSpeakerPhone();
			this.setVvmScenarioControl(true);
			this.playing = true;
			this.startUpdatingSlider();
			this.$.playPauseButton.domAttributes.className = 'voicemail-drawer-button paused';
			this.$.playPauseButton.render();

			if (this.onPlayPauseButtonUpdate) {
				this.doPlayPauseButtonUpdate(this.playing);
			}
		}
	},

	onPause: function() {
		if ( this.playing ) {
			this.playing = false;
			this.setDefaultSpeaker();
			this.setProxSensorEnabled(false);
			this.stopUpdatingSlider();
			this.$.playPauseButton.domAttributes.className = 'voicemail-drawer-button playpause';
			this.$.playPauseButton.render();

			if (this.onPlayPauseButtonUpdate) {
				this.doPlayPauseButtonUpdate(this.playing);
			}
		}

		this.eventDispatch.fire('playbackended');
	},

	onEnd: function() {
		if ( ! this.firedPlayedEvent ) {
			this.firedPlayedEvent = true;
			this.eventDispatch.fire('played');
		}

		if (this.offSpeakerOnEnd) {
			this.speakerPhone = false;
			this.$.speakerIcon.domAttributes.className = 'voicemail-drawer-button speakerphone';
			this.$.speakerIcon.render();
		
			if (this.onSpeakerIconUpdate) {
				this.doSpeakerIconUpdate(this.speakerPhone);
			}
		}
		
		this.stopUpdatingSlider();
		this.intBarPos = 0;
		this.$.slider.setPositionImmediate(this.intBarPos);

		AudioPlayer.audioPlayer.currentTime = 0;
		AudioPlayer.pause();
	},

	onAudioError: function() {
		enyo.error("onAudioError()");
	},

	/*******************
		Audio path control functions
		-------------------------
		possible vvm audio scenarios
		"vvm_back_speaker"
		"vvm_front_speaker"
		"vvm_headset_mic"
		"vvm_bluetooth_sco"
	********************/
	getCurrentAudioProfile: function() {
		// luna-send -i palm://com.palm.audio/vvm/status '{}'
		this.$.getCurrentScenario.call({
			params: {},
		 });
	},
	
	onCurrentScenario: function(inSender, inResponse, inRequest) {
		enyo.log("phone_audio>> onCurrentScenario: inResponse.scenario = " + inResponse.scenario);
		// AudioPlayer.audioprofile = inResponse.scenario;
	},
	
	setVvmScenarioControl: function(inActive) {
		// luna-send -i palm://com.palm.audio/vvm/control '{active:true}'
		enyo.log("phone_audio>> set active : " + inActive);
		this.$.setVvmScenarioControl.call({
			active: inActive,
		 });
	},
	
	onSetVvmScenario: function(inSender, inResponse, inRequest) {
		enyo.log("phone_audio>> onSetVvmScenario OK = " + enyo.json.stringify(inResponse));
	},
	
	onSpeakerIconClick: function() {
		if (this.speakerPhone == true)
		{
			// if it is speakerphone mode, then microphone mode
			// this.setAudioScenario("vvm_front_speaker");
			this.setDefaultSpeaker();
			this.$.speakerIcon.domAttributes.className = 'voicemail-drawer-button speakerphone';
		}
		else
		{
			// If it is microphone mode, then speakerphone mode
			this.setAudioScenario("vvm_back_speaker");
			this.$.speakerIcon.domAttributes.className = 'voicemail-drawer-button speakerphoneselected';
		}
		this.$.speakerIcon.render();

		this.speakerPhone = !this.speakerPhone;

		if (this.onSpeakerIconUpdate) {
			this.doSpeakerIconUpdate(this.speakerPhone);
		}
	},

	// sync speaker phone to audiod
	syncSpeakerPhone: function() {
		if ( this.speakerPhone ) {
			this.setAudioScenario("vvm_back_speaker");
			this.setProxSensorEnabled(false);
		} else {
			this.setDefaultSpeaker();
			this.setProxSensorEnabled(true);
		}
	},

	printMediaProfiles: function() {
		enyo.error("phone_audio>> printMediaProfiles: -------- available media profiles");
		var scenarios = enyo.application.Cache.audioVvmEnabledProfiles;
		if (!scenarios) {
			enyo.error("phone_audio>> No audioVvmEnabledProfiles found!");
			return "vvm_front_speaker";	// by default
		}

		// Create the list of available routes
		for (route in scenarios) {
			enyo.log("phone_audio>> vvm audio profiles = " + route);
		}
	},
	
	// sets the current audio route to bluetooth if enabled, else front speaker
	setDefaultSpeaker: function() {
		// this.printMediaProfiles();
		
		var scenarios = enyo.application.Cache.audioVvmEnabledProfiles;
		if (!scenarios) {
			enyo.error("phone_audio>> No audioVvmEnabledProfiles found!");
			this.setAudioScenario("vvm_front_speaker");	// front speaker
		}

		if ( scenarios["vvm_bluetooth_sco"] ) {
			this.setAudioScenario("vvm_bluetooth_sco");	// bluetooth
		} else if ( scenarios["vvm_headset"] || scenarios["vvm_headset_mic"] ) {
			this.setAudioScenario("vvm_headset_mic");	// headset_mic
		} else {
			this.setAudioScenario("vvm_front_speaker");	// front speaker
		}
	},

	setAudioScenario: function(scenario) {
		enyo.log("phone_audio>> set audio scenario = " + scenario);
		enyo.application.audioInterface.onAudioVvmRouteChangeClick(scenario);
		AudioPlayer.audioprofile = scenario;
	},

	/*******************
		Proximity sensor control functions
	********************/
	setProxSensorEnabled: function(enable) {
		if (this.proxControl) {
			if ( enable ) {
				enyo.application.proxInterface.proxOn();
			} else {
				enyo.application.proxInterface.proxOff();
			}
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
		var interval = this.duration / 100;
		if (interval < 500) interval = 500;
		this.updateSliderInterval = window.setInterval(enyo.bind(this, "updateSliderPosition"), interval);
	},
	
	stopUpdatingSlider: function() {
		window.clearInterval(this.updateSliderInterval);
	},
	
	updateSliderPosition: function() {
		if ( ! AudioPlayer.audioPlayer || ! this.playing || AudioPlayer.audioPlayer.currentTime === undefined ) {
			this.stopUpdatingSlider();
			return;
		}

		// exception handler
		if (AudioPlayer.audioPlayer.duration <= 0) {
			enyo.error("Invalid audio duration: AudioPlayer.audioPlayer.duration = " + AudioPlayer.audioPlayer.duration);
			return;
		}
		
		this.intBarPos = 100 * (AudioPlayer.audioPlayer.currentTime / AudioPlayer.audioPlayer.duration);
		// if ( ! this.firedPlayedEvent && ((AudioPlayer.audioPlayer.currentTime >= 5) || (this.intBarPos > 25)) ) {
		if ( ! this.firedPlayedEvent && this.intBarPos > 25 ) {
			this.firedPlayedEvent = true;
			this.eventDispatch.fire('played');
		}

		if (this.onSliderUpdate) {
			this.doSliderUpdate(AudioPlayer.audioPlayer.currentTime);
		}
		
		// Move slider bar to the new position
		this.$.slider.setPositionImmediate(this.intBarPos);
	},

	sliderChange: function(inSender, inPos) {
		this.stopUpdatingSlider();

		this.intBarPos = inPos;
		AudioPlayer.audioPlayer.currentTime = this.intBarPos / 100 * AudioPlayer.audioPlayer.duration;

		if ( this.intBarPos == 100 ) {
			this.onEnd();
		} else if ( this.playing ) {
			this.startUpdatingSlider();
		}
	},
	
	cleanup: function() {
		this.stopUpdatingSlider();

		this.intBarPos = 0;
		if (this.audioPlayerInit) {
			if (AudioPlayer.audioPlayer.currentTime > 0) {
				AudioPlayer.audioPlayer.currentTime = 0;
			}
			this.$.slider.setPositionImmediate(this.intBarPos);

			if (this.playing) {
				AudioPlayer.audioPlayer.pause();
				this.playing = false;
				this.$.playPauseButton.domAttributes.className = 'voicemail-drawer-button playpause';
				this.$.playPauseButton.render();

				if (this.onPlayPauseButtonUpdate) {
					this.doPlayPauseButtonUpdate(this.playing);
				}
			}

			this.setProxSensorEnabled(false);

			AudioPlayer.registerEventListener(null, null, null, null);
			this.audioPlayerInit = false;
		}

		if (this.speakerPhone) {
			this.speakerPhone = false;
			this.setDefaultSpeaker();
			this.$.speakerIcon.domAttributes.className = 'voicemail-drawer-button speakerphone';
			this.$.speakerIcon.render();

			if (this.onSpeakerIconUpdate) {
				this.doSpeakerIconUpdate(this.speakerPhone);
			}
		}
	},
	
	audioSizeChanged: function() {
	},

	audioPathChanged: function() {
		AudioPlayer.load(this.audioPath);
	},

	playingChanged: function() {
	},
});
