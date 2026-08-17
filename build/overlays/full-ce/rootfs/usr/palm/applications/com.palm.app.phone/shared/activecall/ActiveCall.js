/*globals enyo $L */
enyo.kind({
	name: "ActiveCall",
	kind: "VFlexBox",
	statics: {
		VIDEO_DISABLE_WAIT: 1000,
		DISCONNECTED_WAIT: 1000 // time that a phone call hangs out in the disconnected state
	},
	flex: 1,
	className: "phone-background",
	components: [
		{kind:"Pane", name:"calltype", transitionKind:enyo.transitions.Simple, className:"enyo-fit", components: [
			// VIDEO CALL
			{name:"videoCall", className: "active-call-scene active-call-scene-video", kind:"VideoCall", lazy:true},
			
			// REGULAR CALL
			{name:"regularCall", kind:"MinHeightScroller", clientMinHeight: 424, className:"enyo-fit active-call-scene", components: [
				{kind:"Pane", className:"enyo-fit", transitionKind:enyo.transitions.Simple, components: [
					{name: "dtmfpad", lazy:true, layoutKind: "VFlexLayout", className: "single-call-simple", style: "height: auto; bottom: 71px", components: [
						{name: "digits", w: "fill", style: "height: 40px; font-size: 28px; color: #fff; padding-top: 20px; text-align: left; padding-left: 20px;"},
						{kind: "CustomButton", className: "dtmfpad-activecall-name truncating-text", name: "dtmf_name"},
						{kind: "DtmfDialpad", name:"dtmfdialpad",  flex: 1, dtmfMode: true, onNumberAdded: "dtmfNumberAdded", onHandleDelete: "dtmfNumberDeleted"},
						{kind: "CustomButton", className: "single-call-hangup", name: "hangup", onclick: "disconnectActiveCall"}
					]}
				]},
				{name:"callControls", layoutKind: "HFlexLayout", className: "active-call-button-row", pack: "justify", defaultKind: enyo.IconButton, components: [
					{icon: "../shared/images/menu-popup-bluetooth.png", label: $L("Audio"), name: "audioroute_button", onclick: "onAudioRouteClick", toggling: true, className: "enyo-button active-call-button"},
					{icon: "../shared/images/menu-icon-mute.png", label: $L("Mute"), name: "mute_button", onclick: "toggleMute", toggling: true, className: "enyo-button active-call-button"},
					{icon: "../shared/images/menu-icon-dtmfpad.png", label: $L("Dialpad"), name: "keypad_button", onclick: "toggleDtmf", toggling: true, className: "enyo-button active-call-button"},
					{icon: "../shared/images/menu-icon-addcall.png", label: $L("Add Call"), name: "addcall_button", onclick: "switchToDialpadOrUnlock", className: "enyo-button active-call-button"}
				]},
			]}
		]},
                {name:"poorVoipConnectionPrompt", kind:"PoorVoipConnectionPrompt"},

		{name: "changeMedia", kind:"PalmService", method: "changeMedia"},
		{name: "setMute", kind: enyo.PalmService, service: "palm://com.palm.audio/phone/", method: "setMuted", onSuccess: "", onFailure: ""},
      		{name: "getAudioStatus", kind: "PalmService", service: "palm://com.palm.audio/phone/", method: "status", onSuccess: "onGetAudioStatusSuccess"},
                {name: "tab2phoneAudio", kind: "PalmService", service: "palm://com.palm.bluetooth/hf/", method: "control"},
                {name: "mediaPipelineChanges", kind: "PalmService", method: "propertyChange", onSuccess: "onGetMediaPropertyChange", onFailure: "errorGetMediaPropertyChange", subscribe: "true"},
	],
	dtmfNumberAdded: function(inSender, value) {
		this.dtmfEntry = this.dtmfEntry + value;
		var dtmfString = this.dtmfEntry;
		if (dtmfString.length > 15) {
			dtmfString = "..." + dtmfString.slice(dtmfString.length - 13, dtmfString.length);
		}
		this.$.digits.setContent(dtmfString);
	},
	dtmfNumberDeleted: function() {
	        //Do we support delete/backspace in dtmf pad?
	        /*var number = this.$.digits.getContent();
	        if (number && number.length > 0) {
			number = number.slice(0, number - 1);
			this.$.digits.setContent(number);
		}*/
	},
	create: function() {
		this.inherited(arguments);
		
		this.dtmfEntry = "";
				
		// audio route
		this.audioRouteNormal = $L("Normal");
		this.audioRouteBluetooth = $L("Bluetooth");
		this.audioRouteSpeaker = $L("Speaker");
		this.audioRouteWiredHeadset = $L("Wired headset");
		this.audioRouteTTY = $L("TTY/TDD");
		this.audioRouteMenu = $L("Audio");

		
		if (this.lockedmode) {		
			this.$.addcall_button.setIcon("../images/menu-icon-unlock.png");
			this.$.addcall_button.setCaption($L("Unlock"));  		
		}else{		
			this.$.addcall_button.setIcon("../shared/images/menu-icon-addcall.png"); 
			this.$.addcall_button.setCaption($L("Add Call"));  		
		}	
		
		this.audioRouteImages= {
			phone_bluetooth_sco: "../shared/images/menu-icon-speaker-bluetooth.png",
			phone_front_speaker: "../shared/images/menu-icon-speaker-internal.png",
			phone_back_speaker: "../shared/images/menu-icon-speaker-external.png",
			phone_headset_mic: "../shared/images/menu-icon-headset.png",
			phone_headset: "../shared/images/menu-icon-headset.png",
			phone_tty_full:"../shared/images/menu-icon-headset-tty.png",
			phone_tty_hco:"../shared/images/menu-icon-headset-tty.png",
			phone_tty_vco:"../shared/images/menu-icon-headset-tty.png"
		};
		
		this.audioRouteImagesPopup= {
			phone_bluetooth_sco: "../shared/images/menu-popup-bluetooth.png",
			phone_back_speaker: "../shared/images/menu-popup-bluetooth-speaker.png",
			phone_front_speaker: "../shared/images/menu-popup-bluetooth-internal.png",
			phone_headset_mic: "../shared/images/menu-popup-bluetooth-headset.png",
			phone_headset: "../shared/images/menu-popup-bluetooth-headset.png",
			phone_tty_full:"../shared/images/menu-popup-bluetooth-headset-tty.png",
			phone_tty_hco:"../shared/images/menu-popup-bluetooth-headset-tty.png",
			phone_tty_vco:"../shared/images/menu-popup-bluetooth-headset-tty.png"
		};

                // global variable because it needs to be accessed by both videoCall and activeCall 
                enyo.application.Cache.userOverrideToVideo = false; // this also needs to contain call-id to match the exact call...
                enyo.application.CallSynergizer.callBadQualityLines = {};
		
		// update now in case this card is created and launched immediate to active call
		this.updateWithCallState(enyo.application.CallSynergizer.lines());
		
		// register for future updates on call state
		this._updateWithCallStateFunc = enyo.hitch(this, "updateWithCallState");
		enyo.application.CallSynergizer.registerCallStateQuery(this._updateWithCallStateFunc);

		this._updateWithCallQualityFunc = enyo.hitch(this, "updateWithCallQuality");
		enyo.application.CallSynergizer.registerCallQualityStatus(this._updateWithCallQualityFunc);

		//register for audio state change
		this._updateActiveAudioRouteButtonImageFunc = enyo.hitch(this, "updateActiveAudioRouteButtonImage")
		enyo.application.audioInterface.addAudioStateListener(this._updateActiveAudioRouteButtonImageFunc);

		//register for puck/powersignal changes
		this._onPuckEventFunc = enyo.hitch(this, "onPuckEvent");
		enyo.application.puckInterface.addPuckStateListener(this._onPuckEventFunc);

                //register for audio-call conversion requests
                this._convertToAudioCallFunc = enyo.hitch(this, "convertToAudioCall");
                enyo.application.CallSynergizer.registerConvertToAudioCall(this._convertToAudioCallFunc);

	},
	handleLaunch: function() {
		if ( this.callComponent ) {
			this.$.pane.selectView(this.callComponent);
			this.$.keypad_button.setDepressed(false);
		}

                enyo.application.Cache.userOverrideToVideo = false; 
                enyo.application.CallSynergizer.callBadQualityLines = {};
	},
	//called on first call
	init: function() {

		if(this.initialized !== true) {
			enyo.log("initializing .....");
			//set muted false
			this.setMuteStatus(false);
			this.$.mute_button.setDepressed(false);
			this.$.keypad_button.setDepressed(false);

			this.initialized = true;

			//update speaker button icon
                        this.$.audioroute_button.setDepressed(false);
			this.updateActiveAudioRouteButtonImage(enyo.application.Cache.audioActiveProfile);

                        this.dtmfEntry = "";
                        if(this.$.pane.validateView("dtmfpad")) {
                                this.$.digits.setContent("");
                                this.$.dtmf_name.setContent(enyo.application.CallSynergizer.getActiveLineAddress() || "");
                        }
		}
	},
	//called when hanging up last call
	deInit: function() {
		enyo.log("deinitializing . ....");

		//user might have set mute true inbetween calls, reset muted false
		this.setMuteStatus(false);
		this.$.mute_button.setDepressed(false);

		this.initialized = false;
		//this.updateActiveAudioRouteButtonImage(enyo.application.Cache.audioActiveProfile);
		
		if(this.popup) {
			this.popup.destroy();
			this.popup = undefined;
		}
	},
	destroy: function() {
		enyo.application.puckInterface.removePuckStateListener(this._onPuckEventFunc);
		enyo.application.CallSynergizer.unregisterCallStateQuery(this._updateWithCallStateFunc);
		enyo.application.CallSynergizer.unregisterCallQualityStatus(this._updateWithCallQualityFunc);
		enyo.application.CallSynergizer.unregisterConvertToAudioCall(this._convertToAudioCallFunc);
		enyo.application.audioInterface.removeAudioStateListener(this._updateActiveAudioRouteButtonImageFunc);
		enyo.job.stop("disconnectClear");
		this.inherited(arguments);
	},
	// disconnects active call, for dtmf pad
	disconnectActiveCall: function() {
		enyo.application.CallSynergizer.geniusDisconnect();
	},
	updateWithCallState: function(lines) {
		var activeLines = [];
		var disconnectClear = false;
		var callComponent;
		
		this.init();

		//enyo.log("Active call updateWithCallState = " + enyo.json.stringify(lines));
		
		// clear pending disconnect clear
		enyo.job.stop("disconnectClear");
		
		// todo hack for now: only get real calls
		lines.forEach(function(line) {			
			// display lines that are not
			// 1) incoming
			// 2) disconnected for over ActiveCall.DISCONNECTED_WAIT
			// 3) ignored calls
			if ( line.state != enyo.application.CallSynergizer.STATES.INCOMING && ! line.calls[0].ignored
					&& !enyo.application.CallSynergizer.isMissedCall(line.calls[0])
					&& (line.state != enyo.application.CallSynergizer.STATES.DISCONNECTED
						|| ((Date.now() - line.lastUpdated) <= ActiveCall.DISCONNECTED_WAIT) ) ) {
				
				activeLines.push(line);
				
				if ( ! disconnectClear && line.state == enyo.application.CallSynergizer.STATES.DISCONNECTED ) {
					disconnectClear = true;
				}
			}
		});
		
		// if a line is disconnected, rerun updateWithCallState with these lines to clear the line (DISCONNECTED_WAIT will be expired)
		if ( disconnectClear ) {
			enyo.job("disconnectClear", enyo.bind(this,"updateWithCallState",lines), ActiveCall.DISCONNECTED_WAIT);
		}
		
		var isVideoSceneActive = (this.$.calltype.getViewName() === "videoCall");

                if (activeLines.length) 
                {
                    var activeLine = activeLines[0];
                    //enyo.log("active call details " + enyo.json.stringify(activeLine));
                    enyo.application.Cache.isCurrentLineBluetooth = (((activeLine.calls[0]) && (enyo.application.CallSynergizer.TRANSPORTS.TIL == activeLine.calls[0].transport)) && enyo.application.isTablet);
					//The reason we update here is to have the correct images
					this.updateActiveAudioRouteButtonImage(enyo.application.Cache.audioActiveProfile);
                }
		
		// Delay incomingVideo:disable and outgoingVideo:disable updates by a second to fix DFISH-4150.
		// Ending a video call involves the transport turning the call into a voice call (video:false) then disconnecting.
		// HI does not want the voice call scene to be visible when the call is ending.  This delay will
		// allow the disconnect update to happen in the video scene rather than the voice scene.  
		if(isVideoSceneActive && activeLines[0]) {
			if(activeLines[0].incomingVideoState == "streaming") {
				this.$.videoCall.$.videoTagContactImg.setShowing(false);

				// The underlying <video> tag's play() only ever fires once, the first time
				// the video scene loads (VideoCall.js's enableVideo(), gated by
				// "if (!this.videoURI)"). The scene typically switches to "videoCall" as
				// soon as OUR OWN outgoing video goes live, which is usually before the
				// peer's incoming stream actually starts flowing - so that one-shot play()
				// call fires before there's anything to play, and nothing else here ever
				// retriggers it (the tag just sits blank). Force one retry, exactly once
				// per call, the first time incomingVideoState actually reaches "streaming"
				// AND we actually have a real clonk URI to play (videoURI is populated
				// asynchronously, separately from incomingVideoState - confirmed live: it
				// can lag several seconds behind streaming becoming true. Firing before
				// that with an empty URI would burn the one-shot guard for nothing).
				var incomingVideoURI = activeLines[0].calls && activeLines[0].calls[0] && activeLines[0].calls[0].videoURI;
				if (incomingVideoURI && !this.$.videoCall._incomingVideoRefreshed) {
					this.$.videoCall._incomingVideoRefreshed = true;
					this.$.videoCall.refreshVideo();
				}
                                /*
                                 * If Not Already subscribed for this URI, subscribe now for mediad clonk notifications
                                 * for media encoder framerate values.
                                 */

                                if (!this.alreadySubscribedForFramerates) {

                                   enyo.log("CLONK IS " + enyo.application.Cache.videoURI);
                                   this.clonkPipeline = enyo.application.Cache.videoURI;
                                   //this.$.mediaPipelineChanges.call({},{service:this.clonkPipeline});

                                   //this.alreadySubscribedForFramerates = true;
                               }


			} else {
				this.$.videoCall.$.videoTagContactImg.setShowing(true);
			}
		
			/*if(activeLines[0].incomingVideo === false && activeLines[0]._delayedIncomingVideo === undefined) {
				// Received notification to disable incoming video
				// Resend this callStateQuery update again in case a disconnect follows
				activeLines[0]._delayedIncomingVideo	= true;
				enyo.job.stop("delayIncomingVideoDisconnect");
				enyo.job("delayIncomingVideoDisconnect", enyo.bind(this,"updateWithCallState",lines), ActiveCall.VIDEO_DISABLE_WAIT);
				return;
			}
			if(activeLines[0].outgoingVideo === false && activeLines[0]._delayedOutgoingVideo === undefined) {
				// Received notification to disable outgoing video
				// Resend this callStateQuery update again in case a disconnect follows
				activeLines[0]._delayedOutgoingVideo	= true;
				enyo.job.stop("delayOutgoingVideoDisconnect");
				enyo.job("delayOutgoingVideoDisconnect", enyo.bind(this,"updateWithCallState",lines), ActiveCall.VIDEO_DISABLE_WAIT);
				return;
			}*/
		}
		
		var isVideoSuspended = (this.$.videoCall && this.$.videoCall.isVideoSuspended());
		var isVideoOutgoing =  (activeLines[0] && (activeLines[0].outgoingVideo));
		var isVideoIncoming =  (activeLines[0] && (activeLines[0].incomingVideo));
		var isIncomingVideoAvailable =  (activeLines[0] && (activeLines[0].incomingVideoState === "available"));
		var isIncomingVideoStreaming =  (activeLines[0] && (activeLines[0].incomingVideoState === "streaming"));
		var isInitialDisconnectUpdate = (disconnectClear && !lines._disconnectDelayed);
		if ( activeLines.length === 1 && (isVideoSuspended || isIncomingVideoStreaming || isVideoIncoming || isVideoOutgoing  || (isVideoSceneActive && isInitialDisconnectUpdate)) ) {
			if(isInitialDisconnectUpdate) {
				// Delay disconnect updates by a few seconds so we can display the 'Ending' caption in the video scene
				// before tearing it down.
				lines._disconnectDelayed = true;

				// Stop the incomingVideo:false and outgoingVideo:false callStateQuery updates if there were any
				//enyo.job.stop("delayOutgoingVideoDisconnect");
				//enyo.job.stop("delayIncomingVideoDisconnect");

				// Show the 'Ending' caption
				this.$.videoCall.setLine(activeLines[0]);

				// Let the caption sit for a few seconds before issuing the real disconnect
				enyo.job("disconnectClear", enyo.bind(this,"updateWithCallState",lines), ActiveCall.DISCONNECTED_WAIT);
				return;
			} else {
				var autoAcceptVideoCalls = activeLines[0].autoAcceptVideoCalls;
				var authorizedForVideo = activeLines[0].autoAcceptVideoCalls;
				var allowVideoCalls = activeLines[0].allowVideoCalls;
				// Default to true.  This can be removed once skypem_1.3-25 makes it into a build.
				if(allowVideoCalls === undefined) {
					allowVideoCalls = true;
				}
				if(activeLines[0] && !activeLines[0].autoAcceptVideoCalls) {
					// Require user authorization to start video chat
					var calls = activeLines[0].calls;
					var displayingPopup = false;
					calls.forEach(enyo.hitch(this, function(call) {
						if(isVideoOutgoing) {
							// Authorize it because outgoing video is already streaming, so assume that skypem initiated it
							enyo.application.Cache.authorizedForVideo[call.address] = true;

							// Dismiss the popup if it happened to come up already
							enyo.application.closePhoneAppPopup("videoRequestPopup");
						}
						
						if(enyo.application.Cache.authorizedForVideo[call.address] === false 
							&& activeLines[0].incomingVideo == false 
							&& activeLines[0].incomingVideoState == "streaming") {

							enyo.log("user video request ....");
                                                        // make sure the video accept/reject dialogue is shown to the user
                                                        // only once per call. After video popup action it should not be shown
                                                        // again.
						}

						if(activeLines[0].incomingVideo == false && activeLines[0].incomingVideoState == "available") {
							//close video request popup is it is no longer available....
							enyo.application.closePhoneAppPopup("videoRequestPopup");
						}
						
						if(enyo.application.Cache.authorizedForVideo[call.address] === true) {
							// Authorization already given							 
							authorizedForVideo = true;
						} else if(enyo.application.Cache.authorizedForVideo[call.address] === undefined) {
							if(!displayingPopup && !enyo.windows.fetchWindow("videoRequestPopup") && allowVideoCalls) {
								enyo.application.openPhoneAppPopup("VideoRequest", "videoRequestPopup", {call:call}, 84);
								displayingPopup = true;
							}
						} else if(enyo.application.Cache.authorizedForVideo[call.address] === false) {
							enyo.log("The user rejected the video request");
						}
					}));
				}
				if(autoAcceptVideoCalls && !isVideoOutgoing && allowVideoCalls && !enyo.application.Cache.userdisabledOutgoingVideo) {
					// Was hard-coded to palm://com.palm.skype/ with no call id - dead on this fork (Skype is
					// gone) for every transport. Route to the active call's own transport, like changeToVideoCall
					// in AbstractCall.js already does.
					var autoAcceptCall = activeLines[0].calls[0];
					this.$.changeMedia.call({
						id: autoAcceptCall.id,
						outgoingVideo: true
					}, {
						service: enyo.application.CallSynergizer.transports[autoAcceptCall.transport].implementation
					});
				}
				if(authorizedForVideo && allowVideoCalls && (isIncomingVideoStreaming || isVideoOutgoing)) {
					// Update the video scene
                                        if (!enyo.application.Cache.userOverrideToVideo) {

					    this.$.calltype.selectViewByName("videoCall",true);
					    this.$.videoCall.setLine(activeLines[0]);
					    // isVideoSceneActive (used below, for later updates) reflects
					    // the view BEFORE this switch, so on the very update where the
					    // scene first becomes active AND incoming video is already
					    // streaming, that later check never runs. Catch that case here
					    // too - same one-time-per-call guard (and same "only if we
					    // actually have a real URI yet" condition), so calling both
					    // spots is harmless if this races with the other check.
					    var incomingVideoURI2 = activeLines[0].calls && activeLines[0].calls[0] && activeLines[0].calls[0].videoURI;
					    if (isIncomingVideoStreaming && incomingVideoURI2 && !this.$.videoCall._incomingVideoRefreshed) {
						this.$.videoCall._incomingVideoRefreshed = true;
						this.$.videoCall.refreshVideo();
					    }
                                        } else {
                                            enyo.log("PREVENTING VIDEO FROM LOADING..");

                                            // we need this because even after sending changeMedia to kill the
                                            // incoming stream, the actual recipient device may not do so, and we don't
                                            // want to jump back to video if the user explicitly chose to downgrade
                                            // from video to audio for a poor quality skype call. (skypem issue)
                                        }
					return;
				}
			}
		}
		
		// CASE: single line single call
		if ( activeLines.length == 1 && activeLines[0].calls.length == 1 ) {
			callComponent = this.$.pane.createContainedComponent({kind: "SingleLineSingleCall", line: activeLines[0], activeLines: activeLines});
			if( activeLines[0].incomingVideoState === "unavailable" ) {
				callComponent.videoSupported(false);
			}			
		// CASE: single line conference call
		} else if ( activeLines.length == 1 && activeLines[0].calls.length > 0 ) {
			callComponent = this.$.pane.createContainedComponent({kind: "SingleConferenceCall", className: "enyo-fit", height: "auto", line: activeLines[0], activeLines: activeLines});
			
		// CASE: multi line call
		} else if ( activeLines.length > 1 ) {
			callComponent = this.$.pane.createContainedComponent({kind: "MultiLineView", className: "enyo-fit", height: "auto", lines: activeLines});
			
		// CASE: no active lines, hangup
		} else if ( activeLines.length == 0 ) {
                        // todo: may need a revisit
                        enyo.log("SENDING A HANGUP..");
			enyo.application.UI.event('hangup');
			this.deInit();
			
			// remove existing calls
			if ( this.callComponent ) {
				this.callComponent.destroy();
				this.callComponent = undefined;
			}
		
			if ( this.prevCallComponent ) {
				this.prevCallComponent.destroy();
				this.prevCallComponent = undefined;
			}
						
			// remove video call
			if ( this.$.videoCall ) {
				this.$.videoCall.cleanup();
				this.$.calltype.selectViewByName("regularCall");
			}
			enyo.application.closePhoneAppPopup("videoRequestPopup");
			this.clearAuthorizedVideoCalls(activeLines);
		}
		
		// render the call, if it was added
		if ( callComponent ) {
		    enyo.application.puckInterface.enableSpeakerphoneOnPuck();
			
			callComponent.render();
			
			// remove existing call - this must happen before switching views to prevent race condition in Pane
			if ( this.prevCallComponent ) {
				this.prevCallComponent.destroy();
				this.prevCallComponent = undefined;
			}
			// remove video call
			if ( this.$.videoCall ) {
				this.$.videoCall.cleanup();
			}
			this.prevCallComponent = this.callComponent;
			this.callComponent = callComponent;
			
			//enyo.log("get audio status when creating regular call");
			this.$.getAudioStatus.call();
			this.$.calltype.selectViewByName("regularCall",true);
			this.$.pane.selectView(callComponent, true);
			this.$.keypad_button.setDepressed(false);
		}
		
		this.AutoShowHideDTMFPad(activeLines);
		
		// determines if call should be automatically unmuted
		this.unMuteOnUpdate(activeLines);
	},

        onGetMediaPropertyChange: function(inSender, payload) {
                enyo.log("CLONK Response: " + enyo.json.stringify(payload));

        },

        errorGetMediaPropertyChange: function(inSender, payload) {
                enyo.log("CLONK Response (FAIL): " + enyo.json.stringify(payload));

        },

	updateWithCallQuality: function(payload) {
            // works for any transport whose mediator provides qualInfoQuery (see CallSynergizer.js)
            enyo.log("updateWithCallQuality in ActiveCall");

            // Instead of registering as a listener to the popup
            // for converting to audio call, we let the popup call
            // a global func. in call synergizer to which active call
            // has already registered to as a listener. This avoids race
            // conditions of setting up the registration every time.

            var isAudioCall = (this.$.calltype.getViewName() === "regularCall");

            this.$.poorVoipConnectionPrompt.setCallId(payload.name);
            this.$.poorVoipConnectionPrompt.setTransport(payload.transport);
            this.$.poorVoipConnectionPrompt.setMediaType(isAudioCall);
            this.$.poorVoipConnectionPrompt.openAtCenter();

        },

        convertToAudioCall: function() {

             // convert to audio call after change media was successful
             // -this is called from the skype video quality popup
             enyo.log("---- Converting Video to Audio Call..");

             this.updateWithCallState(enyo.application.CallSynergizer.lines());
             this.$.videoCall.cleanup();
             this.$.calltype.selectViewByName("regularCall");
             enyo.application.Cache.userOverrideToVideo = true;
        },
        
	clearAuthorizedVideoCalls: function(lines) {
		enyo.application.Cache.authorizedForVideo = [];
	},
	
	// unmute, on any line update when there's more than one call
	unMuteOnUpdate: function(activeLines) {
		if(   	activeLines && activeLines.length > 1
			&& enyo.application.Cache.muteStatus == true
		) {
			enyo.log("unmute on any call update");
			this.setMuteStatus(false);
			this.$.mute_button.setDepressed(false);
	 	}
	},
	
	AutoShowHideDTMFPad: function(activeLines) {
                if ( activeLines.length == 1 && activeLines[0].calls.length == 1 ) {//single line single call                                
                        if ( activeLines[0].state == enyo.application.CallSynergizer.STATES.ACTIVE) { //active
                                 if( enyo.application.Utils.isOtaspNumber(activeLines[0].calls[0].address) != 0 ||
                                        enyo.application.Utils.isVoicemailNumber(activeLines[0].calls[0].address) != 0) { //OTASP number or voicemail number
					 					this.showDTMFPad();
                                        this.$.keypad_button.setDepressed(true);
                                 }
                        }
                }
	},
	onAudioRouteClick: function(inSender) {
		var availableAudioRoutes = new Array();
		var scenarios = enyo.application.Cache.audioEnabledProfiles;
		if (!scenarios) {
			enyo.error("No audioEnabledProfiles found!");
			return;
		}

		// Create the list of available routes
                 
        if (!enyo.application.Cache.isCurrentLineBluetooth)
        {
			for (route in scenarios) {
				var routeItem = new Object();
				switch (route) {
					case "phone_front_speaker":
						routeItem.caption = this.audioRouteNormal;
					break;
					case "phone_back_speaker":
						//On a tablet, normal and speaker are the same thing, so we only need one of those options here
						if (enyo.application.isTablet){
							continue; 
						}
						routeItem.caption = this.audioRouteSpeaker;
					break;
					case "phone_bluetooth_sco":
						routeItem.caption = this.audioRouteBluetooth;
					break;
					case "phone_headset":
					case "phone_headset_mic":
						routeItem.caption = this.audioRouteWiredHeadset;
					break;
					case "phone_tty_full":
					case "phone_tty_hco":
					case "phone_tty_vco":
						routeItem.caption = this.audioRouteTTY;
					break;
				}

				routeItem.value = route;
	        	routeItem.icon = this.audioRouteImagesPopup[route];
   				if(route == enyo.application.Cache.audioActiveProfile) {
   			        routeItem.checked = true;
   				}       			
				
				availableAudioRoutes.push(routeItem);
			}
        } 
		else 
		{
            	var routeItemFirst = new Object();
            	routeItemFirst.caption = $L("Touchpad");
            	routeItemFirst.value = "Touchpad";
            	routeItemFirst.icon = this.audioRouteImages["phone_bluetooth_sco"];
        
            	var routeItemSecond = new Object();
            	routeItemSecond.caption = $L("Phone");
            	routeItemSecond.value = "Phone";
            	routeItemSecond.icon = this.audioRouteImages["phone_back_speaker"];

            	if (!enyo.application.Cache.isHfAudioOnTablet) {
                		routeItemSecond.checked = true;
            	} else {
                		routeItemFirst.checked = true;
            	}
            
			availableAudioRoutes.push(routeItemFirst);
			availableAudioRoutes.push(routeItemSecond);
        }

		var hasHeadset = false;
		var frontSpeakerIndex = -1;
		if (availableAudioRoutes.length > 2) {
			for (var i = 0; i < availableAudioRoutes.length; i++) {
				if (availableAudioRoutes[i].value == 'phone_headset_mic' || availableAudioRoutes[i].value == 'phone_headset') {
					hasHeadset = true;
				} else if (availableAudioRoutes[i].value == 'phone_front_speaker') {
					frontSpeakerIndex = i;
				}
			}
			if (hasHeadset == true) {
				availableAudioRoutes.splice(frontSpeakerIndex,1);
			}
		} 

        // For the paired phone case of tablet, HI does not want us to do the auto-toggle
        // for audio-routing even when there are only 2 entries available.
		// note: this part can be removed.  In tablet we always show the pop up if there are 
		// two and more options but if there is only one route, it makes no sense to show a 
		// pop up or a blue state button.  It's a HI decision, I'll leave the code alone for now
		enyo.log("availableAudioRoutes.length "+availableAudioRoutes.length);
        if (!enyo.application.Cache.isCurrentLineBluetooth) {
			if (availableAudioRoutes.length < 2){ 
				if (scenarios[availableAudioRoutes[0].value] != "active") {
					enyo.application.audioInterface.onAudioRouteChangeClick(availableAudioRoutes[0].value);
				}
				return;
			}
         }

		// otherwise popup the list of available audio routes
		this.popup = this.createComponent({kind: "PopupSelect",	className: "audio-route-popup", onSelect: "onPopupAudioRouteChangeClick", defaultKind: "MenuCheckItem"});
		this.popup.setItems(availableAudioRoutes);
		this.popup.openAtCenter();
	},

	onPopupAudioRouteChangeClick: function(inSender, inSelected) {

                if (enyo.application.Cache.isCurrentLineBluetooth)
                {
                    // todo: only send sco command when unchecked option is togged
                    if (inSelected.value == "Phone") {
                        // disable sco: push hf audio from tablet to phone 
                        this.$.tab2phoneAudio.call({message: "audio", enable: false}, { onSuccess: "" });
                    }
                    else if (inSelected.value == "Touchpad") {
                        // enable sco: pull hf audio from phone to tablet
                        this.$.tab2phoneAudio.call({message: "audio", enable: true}, { onSuccess: "" });
                    }
                    this.$.audioroute_button.setDepressed(false);
                    return;
                }

                // default: let audioInterface handle it 
		if (inSelected.value !== undefined) {
			enyo.application.audioInterface.onAudioRouteChangeClick(inSelected.value);
		}
	},
	onPuckEvent: function(response) {
		enyo.application.puckInterface.changeAudio(response);
	},
	updateActiveAudioRouteButtonImage: function(profile) {
enyo.log("update with profile "+profile);
		this.$.audioroute_button && this.$.audioroute_button.setDisabled(false); 	
		var scenarios = enyo.application.Cache.audioEnabledProfiles;
		var scenariosLength = Object.keys(scenarios).length;
		if (!profile) {

			if (scenariosLength == 2) {//default should be front speaker
		        this.$.audioroute_button.setCaption(this.audioRouteSpeaker);
                if (!enyo.application.Cache.isCurrentLineBluetooth) {//e.g. skype call
					this.$.audioroute_button.setIcon(this.audioRouteImages["phone_front_speaker"]);
				} else {
					this.$.audioroute_button.setIcon(this.audioRouteImages["phone_bluetooth_sco"]);					
				}
			}
			else if (scenariosLength == 3 && Object.keys(scenarios).indexOf("phone_headset_mic") >= 0 ) {
        			this.$.audioroute_button.setCaption(this.audioRouteSpeaker);
                		this.$.audioroute_button.setIcon(this.audioRouteImages["phone_headset_mic"]);
			}

			return;
		}
		        
		var img = '';
		var depressed = false; // spot the pun!
		var disabled = false, routeHeadset = false; 
		var label = this.audioRouteMenu;
		enyo.log("debug: label is "+label);
        
		/*/ if we've dropped to two scenarios, turn speakerphone on
		if (scenariosLength === 2 && this.lastScenariosLength > 2) {
		    enyo.application.puckInterface.enableSpeakerphoneOnPuck();
		}*/
        
	    this.lastScenariosLength = scenariosLength;
        
		for (route in scenarios) {
			if(route == "phone_headset_mic" || route == "phone_headset") {
				scenariosLength -= 1;
				routeHeadset = true; 
			}
		}
        if ( scenariosLength > 2) {
			img = this.audioRouteImagesPopup[profile];
			if (!img) {
				enyo.log( "updateActiveAudioRouteButtonImage unknown profile");
				img = this.audioRouteImagesPopup[profile];
			}
			depressed = false;
			
		} else {
			//check whether it's a TIL call or not
			if (!enyo.application.Cache.isCurrentLineBluetooth) {
				label = this.audioRouteSpeaker;
				img = this.audioRouteImages[profile];
				if (profile == "phone_front_speaker" && !routeHeadset) {
					disabled = true; 
				}				
			}
			else{
				img = this.audioRouteImages[profile];
				if (profile === "phone_front_speaker") {
					img = this.audioRouteImages["phone_bluetooth_sco"];
				}
			}
			if (!img) {
				enyo.log( "updateActiveAudioRouteButtonImage unknown profile");
				img = this.audioRouteImages["phone_front_speaker"];
			}
			if (profile == "phone_back_speaker") {
				depressed = true;
			}
		}

		enyo.log(" label " + label + " img " + img + " state " +  depressed + " disabled "+disabled);
		this.$.audioroute_button.setCaption(label);
		this.$.audioroute_button.setIcon(img);		
		this.$.audioroute_button.setDepressed(depressed);
		this.$.audioroute_button.setDisabled(disabled); 		
		
        },
	toggleMute: function(inSender) {
		var address = enyo.application.CallSynergizer.getActiveLineAddress();
		if ( enyo.application.Utils.isEmergencyNumber(address) ) {
			enyo.log("Disallow toggle mute in emergency mode");
			return;
		}
		
		this.setMuteStatus(inSender.getDepressed());
	},
	setMuteStatus: function(muteStatus) {
		enyo.application.Cache.muteStatus = muteStatus;
		this.$.setMute.call({
			"muted": muteStatus
		});
	},
	onGetAudioStatusSuccess: function(inSender, payload) {
		//enyo.log("UPDATING MUTE STATUS" + payload.muted);
		enyo.application.Cache.muteStatus = payload.muted;
		this.$.mute_button.setDepressed(payload.muted);
	},
	toggleDtmf: function(inSender) {
		if ( inSender.getDepressed() ) {
			this.showDTMFPad();
		} else {
			this.$.pane.selectView(this.callComponent);
		}
	},
	switchToDialpadOrUnlock: function() {
		if ( ! this.lockedmode ) {
			enyo.application.UI.event('dial');
		} else {	
			enyo.application.UI.enter('pin');
		}
	},
	//when usr pressing and hold a hard key in dialpad, we should not handle this key
	//event in active call.  There is no easy way to tell the key down event was issued 
	//in activecall screen or just not released in dialpad.  This clumsy hack 
	//(enyo.application.Cache.keydownReleased)is to address CFISH-4129
	keyup: function(event) {
		if (enyo.application.Cache.keydownReleased == false) {
			enyo.application.Cache.keydownReleased = true; 
			return true; 
		}
		if ( this.$.pane.getViewName() == "dtmfpad" ) {
			this.$.dtmfdialpad.keyup(event);
		}
	},
	keydown: function(event) {
		if (enyo.application.Cache.keydownReleased == false) {
			//don't handle it, see notes above
			return true; 
		}
		
		if ( this.$.pane.getViewName() == "dtmfpad" ) {
			this.$.dtmfdialpad.keydown(event);
			
		// don't show dtmf pad for video call (and prevent in browser)
		} else if ( this.callComponent && this.callComponent.kind != "VideoCall" && window.PalmSystem ) {
			if(enyo.application.Utils.isDTMFKey(enyo.application.Utils.keyFromEvent(event)) != "") {
				this.showDTMFPad();
				this.$.keypad_button.setDepressed(true);
				this.$.dtmfdialpad.keydown(event);
			}
		}
	},
	resizeHandler: function() {
		this.inherited(arguments);
		this.$.regularCall.scrollToBottom();
	},
	showDTMFPad: function() {
		// must use selectViewByName since dtmf is 'lazy'
		this.$.pane.selectViewByName("dtmfpad");
		var address = enyo.application.CallSynergizer.getActiveLineAddress(); 
		if (enyo.application.Utils.isVoicemailNumber(address)) {
			address = enyo.application.Messages.voicemailContact;
		}
		this.$.dtmf_name.setContent(address || "");
		
		// always clear dtmf digits
		this.$.digits.setContent("");
		this.dtmfEntry = "";
	},
	windowActivate: function() {
		if(this.$.calltype.getViewName() === "videoCall" && this.$.videoCall.windowActivatedHandler) {
			this.$.videoCall.windowActivatedHandler();
		}
		return true;
	},
	windowDeactivate: function() {
		if(this.$.calltype.getViewName() === "videoCall" && this.$.videoCall.windowDeactivatedHandler) {
			this.$.videoCall.windowDeactivatedHandler();
		}
		return true;
	}
});
