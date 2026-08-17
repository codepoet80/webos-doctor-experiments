enyo.kind({
	name: "VoicemailGreetingPlayback",
	kind: enyo.VFlexBox,
	flex: 1,
	className: "phone-background",
	published: {
		filePath: null,
	},
	events: {
		onConfirm: "",
		onRerecord: "",
		onKeepCurrent: "",
	},
	elapsedTime: 0,
	components: [
		{kind: "ButtonHeader", components: [
			{content: $L("Audio Recorder"), style: "text-align: left; width: 100%;"}
		]},
		{name: "vmPlayTimer", content: "00:00", className: "vmg-record-timer-text"},
		{name: "vmAudioControl", kind: "AudioPlayer.DrawerItem", offSpeakerOnEnd: false, proxControl: false, className: "bottom-slider",
			onSpeakerIconUpdate: "onSpeakerIconUpdate", onPlayPauseButtonUpdate: "onPlayPauseButtonUpdate", onSliderUpdate: "onSliderUpdate"},
		{name: "vmPlaybackControls", kind: enyo.HFlexBox, className: "audio-controls center-controls", components: [
			{name: "cancelIcon", className: "cancel-button", onclick: "onGreetingCancel" },
			{components: [
				{name: "playIcon", className: "capture-button", onclick: "onGreetingPlay" },
				{name: "speakerIcon", className: "speaker-button", onclick: "onGreetingSpeakerphone" },
			]},
			{name: "confirmIcon", className: "complete-button", onclick: "onGreetingConfirm" },
		]},
		{name: "reRecordPrompt", kind: "DialogPrompt", 
			message: $L("Do you wish to delete your recording and start again?"),
			acceptButtonCaption: $L("Re-Record"),
			cancelButtonCaption: $L("Keep Existing Recording"),
			onAccept: "onPopupRerecord",
			onCancel: "onPopupKeepCurrent",
		},
	],

	create: function() {
		this.inherited(arguments);

		this.filePathChanged();
		
		this.$.vmAudioControl.$.playPauseButton.setShowing(false);
		this.$.vmAudioControl.$.speakerIcon.setShowing(false);
		
		this.$.vmAudioControl.onSpeakerIconClick();
	},

	filePathChanged: function() {
		this.$.vmAudioControl.setAudioPath(this.filePath);
	},
	
	cleanup: function() {
		if (this.$.vmAudioControl.playing == true)
		{
			enyo.log("AudioPlayer.cleanup()");
			this.$.vmAudioControl.cleanup();
		}
	},

	onGreetingConfirm: function() {
		this.cleanup();
		
		this.doConfirm();
	},
	
	onGreetingCancel: function() {
		this.cleanup();
		
		this.$.reRecordPrompt.open();
	},
	
	onPopupRerecord: function() {
		this.doRerecord();
	},

	onPopupKeepCurrent: function() {
		this.doKeepCurrent();
	},

	onGreetingPlay: function() {
		this.$.vmAudioControl.onPlayPause();
	},

	onGreetingSpeakerphone: function() {
		this.$.vmAudioControl.onSpeakerIconClick();
	},

	onSpeakerIconUpdate: function(inSrc, speakerMode) {
		if (speakerMode) {
			this.$.speakerIcon.domAttributes.className = 'speaker-button selected';
		}
		else{
			this.$.speakerIcon.domAttributes.className = 'speaker-button';
		}
		this.$.speakerIcon.render();
	},

	onPlayPauseButtonUpdate: function(inSrc, playMode) {
		if (playMode) {
			this.$.playIcon.domAttributes.className = 'capture-button pause';
		}
		else {
			this.$.playIcon.domAttributes.className = 'capture-button';
		}
		this.$.playIcon.render();
	},

	getDurationString: function(sec) {
		var hours = Math.floor(sec / 3600);
		sec = sec - (hours * 3600);
		var minutes = Math.floor(sec / 60); 
		if (minutes <= 0) minutes = "0";
		sec = sec - (minutes * 60);
		var seconds = Math.round(sec);
		if (seconds <= 0) seconds = "0";

		var str = "";
		if (hours > 0) str = hours + ":";
		if (minutes < 10) str += "0";
		str += minutes + ":";
		if (seconds < 10) str += "0";
		str += seconds;

		return str;
	},
	
	onSliderUpdate: function(inSrc, elapsedTime) {
		this.$.vmPlayTimer.content = this.getDurationString(elapsedTime);
		this.$.vmPlayTimer.render();
	},
});