enyo.kind({
	name:"Utils.Telephony.ringback",
	kind: enyo.Component,
	statics: {
		kRingbackSoundUS : "/usr/palm/applications/com.palm.app.phone/sounds/ringbackus.mp3",
		kRingbackSoundCEPT : "/usr/palm/applications/com.palm.app.phone/sounds/ringbackcept.mp3"
	},
	create: function() {
		this.inherited(arguments);
	},
	
	destroy: function () {
		if (this.ringbackAudio) {
			this.ringbackAudio.removeEventListener('ended', this._ringbackloop);
			this.ringbackAudio.removeEventListener('canplay', this._ringbackLoaded);
			this.ringbackAudio = null;
		}
		this.inherited(arguments);
	},
	
	ringbackStart: function() {
		enyo.log("ringbackStart");
		this.ringbackPlaying = true;
		if (this.ringbackAudio === undefined) {
			this.ringbackInit();
		} else {
			this.ringbackLoaded();
		}
	},

	ringbackEnd: function() {
		enyo.log("ringbackEnd");
		this.ringbackPlaying = false;
		if (this.ringbackAudio) {
			// TODO remove this try/catch
			// it's only here since I saw an DOM exception
			try {
				this.ringbackAudio.pause();
				this.ringbackAudio.currentTime = 0.0;
			} catch(e) {
				enyo.log("exception: " + e + e.stack)
			}
		}
	},

	ringbackInit: function() {
		enyo.log("ringbackInit");
		var region = '00us';// G11n.Locale.getCurrentFormatRegion() || '';
		var tone = '';
		switch (region.substr(-2)) {
			case 'us':
			case 'ca':
			case 'mx':
				tone = Utils.Telephony.ringback.kRingbackSoundUS;
				break;
			default:
				tone = Utils.Telephony.ringback.kRingbackSoundCEPT;
				break;
		}
		this.ringbackAudio = new Audio();
		this.ringbackAudio.src = tone;
		/*this.ringbackLoop = this.ringbackLoop.bind(this);
		this.ringbackLoaded = this.ringbackLoaded.bind(this);
	
		this.mediaLib = MojoLoader.require({
			name: "mediaextension",
			version: "1.0"
		});
	
		this.ringbackExtObj = this.mediaLib.mediaextension.MediaExtension.getInstance(this.ringbackAudio);
		this.ringbackExtObj.audioClass = "ringtone";
		*/
		this.ringbackAudio.setAttribute("x-palm-media-audio-class", "ringtone");

		this._ringbackloop = enyo.bind(this, "ringbackLoop");
		this.ringbackAudio.addEventListener('ended', this._ringbackloop);
		
		this._ringbackLoaded = enyo.bind(this, "ringbackLoaded");
		this.ringbackAudio.addEventListener('canplay', this._ringbackLoaded);
		
		this.ringbackAudio.load();
	},

	ringbackLoaded: function(){
		enyo.log("ringbackLoaded");
		//this.ringbackAudio.removeEventListener('canplay', this._ringbackLoaded);
		if (this.ringbackPlaying) {
			this.ringbackAudio.play();
		}
	},

	ringbackLoop: function(){
		enyo.log("ringbackLoop");
		if (this.ringbackPlaying) {
			//this.ringbackAudio.play();
			
			//Workaround - play not working
			this.ringbackAudio.load();
		}
	}
});
