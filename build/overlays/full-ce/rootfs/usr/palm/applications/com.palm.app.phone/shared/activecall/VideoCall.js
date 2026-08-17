/* Copyright 2010 Palm, Inc.  All rights reserved. */

enyo.kind({
	name:"VideoCall",
	kind:"VFlexBox",
	clientLayoutKind: "VFlexLayout",
	pack:"center",
	published: {
		line: ''
	},
	_isActive: true,
	className: "videoCallScene",
	APPLICATION_MENU_HEIGHT: 41,
	SCALING_FACTOR: 1.5,
	THUMBNAIL_WIDTH: 151,
	THUMBNAIL_HEIGHT: 121,
	FADE_TIMEOUT: 10000,
	components: [
		{name:"videoTagScreenshot", kind:"Image", className: "videoScreenshot", showing: false},
		{name:"video", kind:"VFlexBox", pack:"end", align:"center", className: "video", components: [
			{name:"videoTag", kind:"Video", showControls: false, className:"videoTag"},
			{name:"videoTagContactImg", kind:"Image", className: "videoTagImg", showing: true},
			{name:"videoPip", kind:"VFlexBox", align: "start", pack: "justify", className:"videoPip" }
		]},
		{name:"hideShim", kind:"VFlexBox", className:"shim"},
		{name:"videoPipLocation", kind:"VFlexBox", className:"videoPipLocation" },
		{name:"videoPipScreenshot", kind:"Image", className:"videoPipLocation", showing: false, src:"../shared/activecall/images/pip-screenshot.jpg"},
		{name:"videoDisconnectButton", kind:"Button", className: "videoDisconnectButton videoFade", caption: " ", onclick:"disconnect"},
		{name:"contact", kind:"VideoCallContact", className: "videoFadeContact", onMuteClicked: "toggleMute", onDisableVideoClicked: "toggleVideo" },
		{name:"changeMedia", kind:"PalmService", method: "changeMedia", onSuccess: "changeMediaSuccess", onFailure: "changeMediaFailure"},
		{name:"disableMedia", kind:"PalmService", method: "changeMedia", onSuccess: "disableMediaSuccess", onFailure: "disableMediaFailure"},
		{name:"setMute", kind: "PalmService", service: "palm://com.palm.audio/phone/", method: "setMuted", onSuccess: "", onFailure: ""},
		{name:"getAudioStatus", kind: "PalmService", service: "palm://com.palm.audio/phone/", method: "status", onSuccess: "onGetAudioStatusSuccess", onFailure: "onGetAudioStatusFailure"},
		{name:"setPipLocation", kind:"PalmService", method: "setPip", onSuccess: "setPipLocationSuccess", onFailure: "setPipLocationFailure"},
		{name:"getPipLocation", kind:"PalmService", method: "getPip", onSuccess: "getPipLocationSuccess", onFailure: "getPipLocationFailure"},
		{name:"updatePipLocation", kind:"PalmService", method: "updatePipSettings", onSuccess: "updatePipLocationSuccess", onFailure: "updatePipLocationFailure"},
		{name:"keepDisplayOn", kind:"PalmService", service: "palm://com.palm.display/control/", method: "setProperty", subscribe: true,
			onSuccess: "onKeepDisplayOnSuccess", onFailure: "onKeepDisplayOnFailure", 
			params: {requestBlock: true, client: 'phoneapp'}}
	],
	create: function() {
		// TODO: Set the state of the mute button on entry
		this.inherited(arguments);
		enyo.application.Cache.userdisabledOutgoingVideo = undefined;//initial state when video screen loads
		/* TEST CODE
		var timeout = setInterval(enyo.bind(this, function() {
			if ( ! this.$.videoTag ) {
				clearTimeout(timeout)
			} else if (this.$.videoTag.hasNode()) {
				enyo.log(this.$.videoTag.node.id)
				enyo.log(window.getComputedStyle(this.$.videoTag.node, null).getPropertyValue("height"));
				enyo.log(window.getComputedStyle(this.$.videoTag.node, null).getPropertyValue("width"));
			}
		}), 5000);*/
	},
	destroy: function() {
		this.cleanup();
		this.inherited(arguments);
	},
	isVideoSuspended: function() {
		return enyo.application.Cache.isVideoSuspended;
	},
	cleanup: function() {
		// Hide the video layer so the orientation switch looks cleaner
		this.$.hideShim.applyStyle("visibility", "visible");
		enyo.setAllowedOrientation(enyo.application.isTablet ? "free" : "up");
		
		this.$.keepDisplayOn.cancel();
		enyo.job.stop("videoFadeOut");
		this.$.contact.$.disableVideoButton.updateState(false);
		this._isActive = false;
		this.videoURI = undefined;
		this._incomingVideoRefreshed = false;
		if (this._incomingVideoWatchTimer) {
			window.clearInterval(this._incomingVideoWatchTimer);
			this._incomingVideoWatchTimer = undefined;
		}
		if(enyo.application.isTablet && enyo.application.Cache.commandMenu) {
			enyo.application.Cache.commandMenu.setShowing(true);
		}
	},
	// The native <video> tag's one-shot play() can fire before the peer's incoming stream
	// is actually live (videoURI populates asynchronously, sometimes several seconds after
	// the scene activates), and retriggering it only works via ActiveCall.js's payload-push
	// -driven check - which only runs when a NEW callStateQuery push arrives. A call can go
	// quiet (no further pushes) for a long time once nothing else changes, so relying on
	// catching the exact right push is fragile. Poll instead, independent of push timing -
	// cheap (a few property reads) and self-stopping once it's done its one job.
	startIncomingVideoWatch: function() {
		if (this._incomingVideoWatchTimer) return;
		this._incomingVideoWatchTimer = window.setInterval(enyo.hitch(this, function() {
			if (this._incomingVideoRefreshed) {
				window.clearInterval(this._incomingVideoWatchTimer);
				this._incomingVideoWatchTimer = undefined;
				return;
			}
			if (this.call && this.call.videoURI && this.line && this.line.incomingVideoState === "streaming") {
				this._incomingVideoRefreshed = true;
				this.refreshVideo();
				window.clearInterval(this._incomingVideoWatchTimer);
				this._incomingVideoWatchTimer = undefined;
			}
		}), 1500);
	},
	lineChanged: function() {
		// This component is lazy:true - created once and reused across separate calls
		// within the same Phone app session, not destroyed/recreated per call. Reset the
		// one-shot incoming-video-refresh guard (and force a fresh enableVideo cycle) the
		// moment we see a genuinely different call, otherwise a flag left over from an
		// earlier call permanently blocks the refresh for every call after the first.
		var newCallId = this.line.calls[0] && this.line.calls[0].id;
		if (this._lastCallId !== undefined && this._lastCallId !== newCallId) {
			this._incomingVideoRefreshed = false;
			this.videoURI = undefined;
		}
		this._lastCallId = newCallId;

		this.call = this.line.calls[0];
		this.startIncomingVideoWatch();

		var capabilities = enyo.application.CallSynergizer.transports[this.line.calls[0].transport];
		
		if(enyo.application.Cache.commandMenu) {
			enyo.application.Cache.commandMenu.setShowing(false);
		}
		// Only actually call enableVideo() once we have a real clonk URI. videoURI is
		// populated asynchronously and can lag several seconds behind the scene first
		// activating - calling enableVideo("") that early sets this.videoURI to "" (still
		// falsy, so this gate alone wouldn't re-skip next time), but also calls .load()/
		// .play() on the native <video> tag with nothing to play, which empirically seems
		// to leave it in a state a later .load()/.play() with a real src doesn't recover
		// from. Simplest fix: just don't call it until there's something real to load.
		if ( ! this.videoURI && this.call.videoURI ) {
			this.$.keepDisplayOn.call();
			this.$.hideShim.applyStyle("visibility", "hidden");
			this.enableVideo(this.call.videoURI);
		}
		
		// todo always fade buttons in on call state change?
		this.fadeIn();
		this.$.getAudioStatus.call();
		this.$.contact.setLine(this.line);
		
		//show contact image if incoming video is not available
		var contactImgSrc;
		if(this.call.contact && this.call.contact.picture) {
			contactImgSrc = this.call.contact.picture.src;
		}
		this.$.videoTagContactImg.setSrc(contactImgSrc ? contactImgSrc : "../shared/activecall/images/contacts-unknown-icon-large_VC.png");
		
		if(this.line.outgoingVideo === true) {
			this.$.contact.$.disableVideoButton.updateState(false);
			this.$.videoPip.setShowing(true);
		} else {
			this.$.contact.$.disableVideoButton.updateState(true);
			this.$.videoPip.setShowing(false);
		}
		// conditionally enable disconnect button and video tag
		var isDisconnected = (this.line.state == enyo.application.CallSynergizer.STATES.DISCONNECTPENDING
										|| this.line.state == enyo.application.CallSynergizer.STATES.DISCONNECTED);
		this.$.videoDisconnectButton.setDisabled(isDisconnected);
		this.$.video.setShowing(!isDisconnected);
		if ( ! isDisconnected ) {
			this._isActive = true;
			enyo.asyncMethod(this, function() {
				if(this._isActive) {
					// Make the video layer visible
					// REVERTED to "up": the video scene's own CSS (videocall-tablet.css etc.)
					// appears hardcoded to only lay out correctly in the "up" orientation -
					// switching to "free" here produced a visibly broken layout (misaligned/
					// mispositioned video regions). Not touching this until the actual video
					// rendering issue itself is resolved on a known-stable layout; revisit as
					// its own isolated, separately-verified change afterward.
					this.$.hideShim.applyStyle("visibility", "hidden");
					enyo.setAllowedOrientation((!enyo.application.isTablet) ? "left" : "up");
				}
			});
		}
		
	/*this.isReceivingVideo = this.line.incomingVideo;
		this.isSendingVideo = this.line.outgoingVideo;
		
		if (this.line.mock) {
			// Show fake video images
			this.$.videoPipScreenshot.setShowing(true);
			this.$.videoTagScreenshot.setShowing(true);
			
			if (enyo.application.isTablet) {
			        this.$.videoTagScreenshot.setSrc("../shared/activecall/images/video-screenshot.jpg");
			} else {
			        this.$.videoTagScreenshot.setSrc("../shared/activecall/images/video-screenshot-manta.jpg");
			}
		}*/
	},
	fadeIn: function(useTimeout) {	
		this.removeClass('videoFadeOut');
		this.$.contact.setPaused(false);
		
		// Leave the controls on the screen when video is suspended
		if(enyo.application.Cache.isVideoSuspended !== true) {
			enyo.job("videoFadeOut", enyo.hitch(this, this.fadeOut), this.FADE_TIMEOUT);
		}
	},
	fadeOut: function() {
		if(!enyo.application.isTablet) {
			this.$.contact.setPaused(true);
			this.addClass('videoFadeOut');
		}
	},
	enableVideo: function(videoURI) {
		this.suspendVideo(false);
		this.videoURI = videoURI;
		if(this.videoURI) {
			this.$.videoTag.setSrc(this.videoURI);
		}
		this.render();
		
		if(this.$.videoTag.hasNode()) {
			var node = this.$.videoTag.node;
			if(node.load) {
				node.load();
				node.play();
			} else {
				enyo.error("Attempted to enable video on a non video tag");
			}
		}
		
		// Set the native location of the PIP to the coordinates of this invisible component
		this.setPipLocationByElement(this.$.videoPipLocation);
	},
	setPipLocationByElement: function(component) {
		var x, y, x2, y2, width, height;
		var style;
		
		if(component.hasNode()) {
			var node = component.node;
			style = node.style;
			style = window.getComputedStyle(component.node, null);
		} else {
			enyo.log("Unable to set PIP location.  Could not find coordinates.");
			return;
		}
		
		// Read the coordinates of the CSS class videoPipLocation
		x = parseInt(style.left);
		y = parseInt(style.top);
		width = parseInt(style.width);
		height = parseInt(style.height);
				
		this._pipWidth = width;
		this._pipHeight = height;
		
		this.setPipLocation(x, y, width, height);
	},
	
	// Set the pip location
	// This function handles the scaling and orientation inconsistencies between
	// the application layer and the native layer.
	// This will be greatly simplified if/when mediaserver improves their API.
	setPipLocation: function(x, y, width, height) {
		
		if(width === undefined) {
			width = this._pipWidth;
		}
		if(height === undefined) {
			height = this._pipHeight;
		}
		
		var orientation;
		var scale;
		var x2 = x + width;
		var y2 = y + height;
		
		if(enyo.application.isTablet) {
			orientation = "up";
			scale = 1.0;

			// Workaround to fix bug where pip is not drawn exactly at the correct coordinates
			var offset = 28;
			y += offset;
			y2 += offset;
		} else {
			orientation = "left";
			scale = 1.5;
		}
		
		// updatePipLocation requires two sets of coordinates
		
		var args = {args:[{top_left: {x:x, y:y}, bottom_right: {x:x2, y:y2}, scale:scale, orientation:orientation}]};
		enyo.log("updatePipLocation: "+JSON.stringify(args));
		this.$.updatePipLocation.call(args,{service:this.videoURI});
	},

	clickHandler: function(inSender, inEvent) {
		var className = "";
		if(this.hasNode()) {
			className = this.node.className;
		}
		if(className === "" || className.indexOf("videoFadeOut") !== -1) {
			this.fadeIn();
		} else {
			this.fadeOut();
		}
		return true;
	},
	
	toggleMute: function() {
		var isMuted = this.$.contact.$.mute.getState();
		this.$.setMute.call({
			"muted":!isMuted
		});
		enyo.log("Toggling Mute: "+isMuted);
	},
	disconnect: function() {
		this.fadeIn();
		enyo.application.CallSynergizer.callDisconnect(this.call.id, this.call.transport);
	},
	refreshVideo: function() {
		enyo.log("Setting video tag source to: "+this.call.videoURI);
		this.enableVideo(this.call.videoURI);
	},
	changeMedia: function(outgoing, incoming) {
		var params = {
			id:this.call.id,
		};
		if(outgoing !== undefined) {
			params.outgoingVideo = outgoing;
		}
		if(incoming !== undefined) {
			params.incomingVideo = incoming;
		}
		enyo.log("changeMedia: "+JSON.stringify(params));
		// TODO: Read this value dynamically
		
		this.$.changeMedia.call(params,{
			service: enyo.application.CallSynergizer.transports[this.call.transport].implementation
		});
	},
	toggleVideo: function() {		
		if(this.$.contact.$.disableVideoButton.getState()) {
			this.changeMedia(true, undefined);
                        enyo.application.Cache.userOverrideToVideo = false;
			this.enableVideo(this.call.videoURI);
			enyo.application.Cache.userdisabledOutgoingVideo = false;
		} else {
			//this.disableVideo();
			this.changeMedia(false, undefined);
			enyo.application.Cache.userdisabledOutgoingVideo = true;
		}
	},
	disableVideo: function() {
		enyo.log("Disabling video");
		this.$.changeMedia.call({
			id: this.call.id,
//			incomingVideo: false,
			outgoingVideo: false
		},{
			service: enyo.application.CallSynergizer.transports[this.call.transport].implementation
		});
	},
	suspendVideo: function(suspend) {
		if(suspend) {
			enyo.log("Disabling video, set isVideoSuspended to true");
			enyo.application.Cache.isVideoSuspended = true;
			this.$.disableMedia.call({
				id: this.call.id,
//				incomingVideo: false,
				outgoingVideo: false
			},{
				service: enyo.application.CallSynergizer.transports[this.call.transport].implementation
			});
		} else {
			enyo.application.Cache.isVideoSuspended = undefined;
		}
		this.fadeIn();
	},
	handleFailure: function(payload) {
		if(payload.localResponse.errorCode === 2) {
			enyo.log("No active call");
			enyo.application.UI.event("activecall");
		}
	},
	getPipLocationSuccess: function(inSender, payload) {
		enyo.log("getPipLocationSuccess !! "+JSON.stringify(payload));
	},
	getPipLocationFailure: function(inSender, payload) {
		enyo.error("getPipLocationFailure !! "+JSON.stringify(payload));
	},
	updatePipLocationSuccess: function(inSender, payload) {
		enyo.log("updatePipLocationSuccess !! "+JSON.stringify(payload));
	},
	updatePipLocationFailure: function(inSender, payload) {
		enyo.error("updatePipLocationFailure !! "+JSON.stringify(payload));
	},
	setPipLocationSuccess: function(inSender, payload) {
		enyo.log("setPipLocationSuccess !! "+JSON.stringify(payload));
	},
	setPipLocationFailure: function(inSender, payload) {
		enyo.error("setPipLocationFailure !! "+JSON.stringify(payload));
	},
	changeMediaSuccess: function(inSender, payload) {
	},
	changeMediaFailure: function(inSender, payload) {
		enyo.error("changeMediaFailure");
	},	
	disableMediaSuccess: function(inSender, payload) {
		this.$.contact.$.disableVideoButton.updateState(true);
	},
	disableMediaFailure: function(inSender, payload) {
		enyo.error("disableMediaFailure");
		this.$.contact.$.disableVideoButton.updateState(false);
		this.handleFailure(payload);
	},
	onKeepDisplayOnSuccess: function(inSender, payload) {
		enyo.log("onKeepDisplayOnSuccess");
	},
	onKeepDisplayOnFailure: function(inSender, payload) {
		enyo.error("onKeepDisplayOnFailure");
	},
	onGetAudioStatusSuccess: function(inSender, payload) {
		enyo.log("onGetAudioStatusSuccess: "+payload.muted);
		this.$.contact.$.mute.updateState(payload.muted);
	},
	onGetAudioStatusFailure: function(inSender, payload) {
		enyo.error("onGetAudioStatusFailure");
	},
	windowActivatedHandler: function() {
		//this.changeMedia(true, true);

		// Unsuspend video (there is currently a bug that will cause the screen buffer to become corrupt)
		//this.suspendVideo(false);
		//this.changeMedia(true, true);
		//this.enableVideo(this.call.videoURI);
	},
	windowDeactivatedHandler: function() {
		// Change to a voice call when carded
		this.changeMedia(false, false);

		// Suspend video
		// this.suspendVideo(true);	
	}
});

enyo.kind({
	name:"VideoCallContact",
	kind:"HFlexBox",
	className: "enyo-page-header vidContactHeader",
	published: {
		paused: false,
		line: ''
	},
	events: {
		onMuteClicked: "",
		onDisableVideoClicked: ""
	},
	layoutKind: "HFlexLayout",
	pack: "center",
	components: [
		{name:"mute", kind:"VideoCallButton", className: "muteButton",  onclick: "doMuteClicked", label: $L("Audio")},
		{name:"disableVideoButton", kind:"VideoCallButton", className: "videoButton", onclick: "doDisableVideoClicked", label: $L("Video")},
		{kind:"HFlexBox", className: "meta", components: [	
			{name:"picContainer", kind: "Control", className: "vidContactPicContainer", components:[
				{name:"pic", kind:"Control", className: "vidContactPicture"},
			]},
			{name: "info", kind: enyo.VFlexBox, components: [
				{name:"name", className : "title"},
				{name:"state", className : "subtitle"}
			]}
		]}
	],
	create: function() {
		this.inherited(arguments);
	},
	destroy: function() {
		window.clearInterval(this.callTimer);
		this.inherited(arguments);
	},
	pausedChanged: function(oldPausedVal) {
		if ( this.paused ) {
			window.clearInterval(this.callTimer);
		} else if ( oldPausedVal ) {
			this.lineChanged();
		}
	},
	lineChanged: function(oldPausedVal) {
		this.call = this.line.calls[0];
		if(this.call && this.call.contact) {
			this.call.contact.decorated(enyo.bind(this,"updateWithContact"));
		}
		
		window.clearInterval(this.callTimer);
		
		// don't handle if paused
		if ( this.paused || ! this.line ) {
			return;
		}
		
		this.startTime = this.line.calls[0].startTime;
		this.call = this.line.calls[0];
		
		if (this.line.state == enyo.application.CallSynergizer.STATES.ACTIVE ) {
			this.timer();
			this.callTimer = window.setInterval(enyo.hitch(this, "timer"), 1000);
			this.$.picContainer.setShowing(false);
			
		} else if ( this.line.state == enyo.application.CallSynergizer.STATES.DIALING
			 	|| this.line.state == enyo.application.CallSynergizer.STATES.DIALPENDING ) {
			this.$.state.setContent($L("Starting Video..."));
			this.$.picContainer.setShowing(true);
			
		} else if ( this.line.state == enyo.application.CallSynergizer.STATES.DISCONNECTPENDING ) {
			this.$.state.setContent($L("Ending"));
			this.$.picContainer.setShowing(false);
		
		} else if ( this.line.state == enyo.application.CallSynergizer.STATES.HOLD ) {
			this.$.state.setContent($L("On hold"));
			this.$.picContainer.setShowing(true);
			
		} else if ( this.line.state == enyo.application.CallSynergizer.STATES.DISCONNECTED ) {
			this.$.state.setContent($L("Ending"));
			this.$.picContainer.setShowing(true);
		}
		
		this.call.contact.decorated(enyo.bind(this,"updateWithContact"));
	},
	timer: function() {
		this.$.state.setContent(enyo.application.Utils.getElaspedTime(this.startTime));
	},
	updateWithContact: function() {
		if ( ! this.destroyed ) { // make sure this object wasn't destroyed
			if ( this.call.contact.name ) {
				this.$.pic.setStyle("background:url(" + this.call.contact.picture.src + ") no-repeat 50% 50%");
				this.$.name.setContent(this.call.contact.name);
			} else {
				this.$.name.setContent(this.call.contact.addressFormatted);
			}
		}
	}
});


enyo.kind({
	name: "VideoCallButton",
	kind: enyo.Button,
	className: "video-call-button-off",
	published: {
		label: "",
		state: false
	},
	components: [
		{name: "icon", className: "enyo-button-icon", showing: true},
		{name: "label"}
	],
	//* @protected
	create: function() {
		this.inherited(arguments);
		this.label = this.label;
		this.labelChanged();
	},
	labelChanged: function() {
		this.$.label.setContent(this.label);
	},
	clickHandler: function() {
		this.inherited(arguments);
		this.updateState(!this.state);
		return true;
	},
	updateState: function(state) {
		if(state !== undefined) {
			this.state = state;
		}
		if(this.state){

			this.addClass('videocall-button-on');
		}else{
			this.removeClass('videocall-button-on');
		}
	}
 });
