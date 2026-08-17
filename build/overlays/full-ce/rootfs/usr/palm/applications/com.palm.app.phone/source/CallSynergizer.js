enyo.kind({
	name:"CallSynergizer",
	kind: enyo.Component,
    // Parameters for a pending redial. An object with 'transport' and 'address' attributes. This address
    // will be dialed when the transport updates its network status with 'service'
    redialOnNetworkService: undefined,	
	// constants for built-in transports
	// used only where transports require special handling
	// 3rd party transports don't need to be in this list
	// Cant be static because they need to be retrieved from other cards off the enyo.application object
	TRANSPORTS: {
		TIL: "com.palm.telephony",
		VOIP: "com.palm.whatsapp"
	},
	STATES: {
		INCOMING: "incoming",
		DIALPENDING: "dialpending", // fake state
		DIALING: "dialing",
		ACTIVE: "active",
		HOLD: "onHold",
		DISCONNECTPENDING: "disconnectpending", // fake state
		DISCONNECTED: "disconnected"
	},
	DISCONNECTDETAILS: {
    	NORMAL:       "normal",
    	NOSERVICE:    "noservice",
	FADEDSERVICE: "fadedservice",
	NETWORKBUSY:  "networkbusy",
	BARRED:       "barred",
	BUSY:         "busy",
	NOANSWER:     "noanswer",
	DROPPED:      "dropped",
        NOCREDIT:     "insufficientfunds"
	},
	ORIGINS: {
		INCOMING: "incoming",
		OUTGOING: "outgoing",
	},
	// internally used static attributes
	statics: {
		PHONE_CAPABILITY: "PHONE"
	},
	components: [
		{name:"capabilitiesWatch", kind:"DbService", method: "find", dbKind: "com.palm.callcapabilities:1", onSuccess: "_capabilitiesWatch", onFailure: "genericFailure", subscribe: true, reCallWatches: true},
		{name:"accountsWatch", kind:"DbService", method: "find", dbKind: "com.palm.account:1", onSuccess: "_accountsWatch", onFailure: "genericFailure", subscribe: true, reCallWatches: true},
		{name:"accountsListQuery", kind:"PalmService", service: "palm://com.palm.service.accounts/", method: "listAccounts", onSuccess: "_accountsListQuery", onFailure: "genericFailure", params: {capability:"PHONE"}},
		{name: "getAccounts", kind: "Accounts.getAccounts", onGetAccounts_AccountsAvailable: "onAccountsAvailable"},
		{name:"changeMedia", kind:"PalmService", service: "palm://com.palm.skype/", method: "changeMedia", params: {incomingVideo:true}},
		{name:"callControl", kind:"PalmService", onFailure: "genericFailure", timeout: 8000},
		{name:"callStateCallbacks", kind:"Utils.Dispatcher", delay: 100},
		{name:"transportsCallbacks", kind:"Utils.Dispatcher"},
		{name:"phoneCall", kind:"DBModels.PhoneCall"},
		{name:"dialProxy", kind: "DialProxy"},
		
		// todo conditionally add if til exists
		{name:"tilDialHandler", kind:"DialHandler.Telephony"},
		
		// todo hack for updating BT of call status. See note below. Workaround DFISH-4995
		{name:"bluetoothCallStatus", kind:"PalmService", service: "palm://com.palm.bluetooth/hfg/", method: "currentcallstatus"},
		{name:"systemUICallStatus", kind:"PalmService", service: "palm://com.palm.systemmanager/", method: "publishToSystemUI"},		
		{name:"informBluetooth", kind:"PalmService", service:"palm://com.palm.audio/telephony/", method: "answered"},
		{name:"audioRoute", kind:"PalmService", service: "palm://com.palm.audio/phone/", method: "CallStatusUpdate"},
		
		//ringback when dialing voip call
		{name:"voipRingback", kind:"Utils.Telephony.ringback"},
		{name:"displayOn", kind:"PalmService", service:"palm://com.palm.display/control/", method: "setState", onSuccess: "", onFailure: ""},
		{name:"muteRingtone", kind:"PalmService", service:"palm://com.palm.audio/ringtone/", method: "setMuted"},
		
		{name:"poorVoipConnectionPrompt", kind:"PoorVoipConnectionPrompt"},
		
		{name: "informBTPrefServiceError", kind: enyo.PalmService, service: "palm://com.palm.bluetooth/hfg/", method: "forceCallEvent", onSuccess: ""},

                //dispatcher for skype call-quality callbacks (created mostly because modal dialogues cannot be instantiated in 
                //parentless objects) 
                {name:"CallQualityStatusListeners",    kind:"Utils.Dispatcher"},
                {name:"ConvertToAudioCallListeners",   kind:"Utils.Dispatcher"},
	],
	create: function() {
		this.inherited(arguments);
		
		// account capability objects of type=PHONE. We call these transports. Key is capability (transport) id.
		this.transports = {};
		
		// current line state. Keyed on transport id. Does not include disconnected lines
		this.callStateLines = {};
		this.callBadQualityLines = {};
		
		// the current dialpending call. There can only be one.
		// in the format: {transport:/*transport string*/, call:/*call object*/}
		this.dialPendingCall = undefined;
		
		// start watching for accounts
		this.$.accountsWatch.call();
	},
	_accountsWatch: function(inSender, payload) {
		this.$.accountsListQuery.call();
	},
	_accountsListQuery: function(inSender, payload){
		enyo.require(enyo.isArray(payload.results), "listAccounts returned bad result: " + enyo.json.stringify(payload));
		enyo.assert(payload.results.length > 0, "No phone accounts installed! Won't be able to make calls.");
		
		// TODO: CANCEL SUBSCRIPTIONS IF TRANSPORT REMOVED (eg Skype account removed)
		
		// gather transports and register callStateQuery
		payload.results.forEach(function(account) {
			account.capabilityProviders.forEach(function(cap) {
				if ( cap.capability == CallSynergizer.PHONE_CAPABILITY ) {
					enyo.error("CALLSYN_DIAG PHONE-account=" + account.templateId + " impl=" + cap.implementation + " alreadyHave=" + !!(this.transports[account.templateId] && this.transports[account.templateId]._subs));
					// include accountId with capability
					if (this.transports[account.templateId] && this.transports[account.templateId]._accountId != account._id) {
						this.transports[account.templateId]._accountId = account._id;
					} else {
						cap._accountId = account._id;
					}
					
					if ( ! (this.transports[account.templateId] && this.transports[account.templateId]._subs) && (account.templateId != "com.palm.palmprofile")) {
						// save transport subscriptions in case we need to cancel them later
						cap._subs = {};
						
						// register callStateQuery
						cap._subs.callState = this.createComponent({
							kind:"PalmService",
							service: cap.implementation,
							method: "callStateQuery",
							subscribe: true,
							resubscribe: true, // always resubscribe: whatsapp mediator may restart; TIL too. Bad responses are ignored downstream
							onSuccess: "_callStateQueryResponse",
							onFailure: "_callStateQueryResponseFailure",
							transport: account.templateId
						});
						try {
							cap._subs.callState.call();
						} catch (e) {
							enyo.error("Handling Enyo exception(1). Need to fix this. " + e.description);
						}

                                                // monitor call quality for any non-cellular (VoIP-style) transport
						if ( account.templateId != this.TRANSPORTS.TIL ) {
						    // the mediator is able to provide call quality data
						    // register qualInfoQuery
                                                    enyo.log("registering for call quality monitoring: " + account.templateId);
						    cap._subs.callQuality = this.createComponent({
						        	kind:"PalmService",
								service: cap.implementation,
								method: "qualInfoQuery",
								subscribe: true,
								transport: account.templateId,
								onSuccess: "_callQualityInfoResponse",
								onFailure: "_callQualityInfoResponseFailure"
						    });
						    try {
							    cap._subs.callQuality.call();
						    } catch (e) {
							    enyo.error("Handling Enyo exception(2). Need to fix this. " + e.description);
						    }
                                                } // monitor skype call quality
						
						// todo emergency query only for TIL transport
						if ( account.templateId == this.TRANSPORTS.TIL ) {
							cap._subs.emergencyMode = this.createComponent({
								kind:"PalmService",
								service: cap.implementation,
								method: "emergencyModeQuery",
								subscribe: true,
								resubscribe: true,
								onSuccess: "_emergencyModeQuery",
								onFailure: "genericFailure",
								transport: account.templateId
							});
							cap._subs.emergencyMode.call();
						}
						
						this.transports[account.templateId] = cap;
					}
				}
			}, this);
		}, this);
		enyo.error("CALLSYN_DIAG discovered transports=[" + Object.keys(this.transports).join(",") + "]");

		// todo only call on first response
		this.$.capabilitiesWatch.call();
		
		//Hack: store skype account information for faster loading
		this.$.getAccounts.getAccounts({capability: "PHONE"});//{templateId: enyo.application.CallSynergizer.TRANSPORTS.VOIP}
	},
	_capabilitiesWatch: function(inSender, payload) {
		payload.results.forEach(function(cap) {
			
			// workaround CFISH-1189
			if ( cap.transport == this.TRANSPORTS.TIL ) {
				if (( this.$.tilDialHandler.platformType == "gsm" ) || ( this.$.tilDialHandler.platformType == "none" )) {
					cap.legacySwap = false;
					cap.hangupAffectsAll = false;
				} else {
					cap.legacySwap = true;
					cap.hangupAffectsAll = true;
				}
			}
			
			//Close outOfNetwork popup on networkstatus change
			if ( enyo.application.Cache.platformMultimode == true &&
				cap.transport == this.TRANSPORTS.TIL &&
			     (cap.networkStatus == "service" || cap.networkStatus == "roaming" /*|| cap.networkStatus == "limited"*/)) {
				enyo.application.closePhoneAppPopup("oonPopup");
			}
			
			// if we have a pending redial for this transport
			// either network is available or is limited with emergency dial
			if ( this.redialOnNetworkService && this.redialOnNetworkService.transport === cap.transport ) {				
				var number = this.redialOnNetworkService.address;
				if (cap.networkStatus == "service" || cap.networkStatus == "roaming" || (cap.networkStatus == "limited" && enyo.application.Utils.isEmergencyNumber(number))) {
					enyo.application.closePhoneAppPopup("airplaneModePopup");	
					this.redialOnNetworkService = undefined;						
					this.dial(number, undefined, undefined, cap.transport);
				}
			}
			
			this.transports[cap.transport] = enyo.mixin((this.transports[cap.transport] || {}), cap);
		}, this);
		
		this.$.transportsCallbacks.dispatch(this.transports);
	},
	onAccountsAvailable: function (inSender, inResponse) {
		if(inResponse && inResponse.accounts && this.transports[this.TRANSPORTS.VOIP]) {
			var skypeAcc = this.transports[this.TRANSPORTS.VOIP]._accountId;
			for(var i = 0; i < inResponse.accounts.length; i++) {
				if(inResponse.accounts[i]._id == skypeAcc) {
					enyo.application.Cache.skypeAccount = inResponse.accounts[i];
					enyo.application.Cache.skypeTemplate = inResponse.templates[i];
					break;
				}
			}
		}
	},
	_emergencyModeQuery: function(inSender, payload) {
		enyo.application.UI.event("emergency", payload.enabled);		
	},
	_callStateQueryResponse: function(inSender, payload) {
		var lines, transport, autoAcceptVideoCalls, allowVideoCalls, isIncoming, isVideo;

		// DIAG (remove after confirmation): full payload so we can see address/displayName/transport
		// the card actually got (debugging "Unknown Caller"/"Mobile"/number-formatted-id on TG dial).
		enyo.error("CALLSYN_DIAG CSQRESP transport=" + (inSender && inSender.transport) + " PAYLOAD=" + enyo.json.stringify(payload));

		// ignore "{returnValue: true}" initial response
		if ( ! enyo.isArray(payload.lines) ) {
			return;
		}
		
		// temp logging for CFISH-6235
		enyo.log("callStateQueryResponse: " + enyo.json.stringify(payload));
		
		lines = payload.lines;
		transport = inSender.transport;
		autoAcceptVideoCalls = payload.autoAcceptVideoCallsSkype;
		allowVideoCalls = payload.allowVideoCalls;
		
		enyo.application.Cache.allDisconnected = true; 
		isIncoming = false;
		isVideo = false;
		isAnsweredIncomingCall = false;
		voipCallDialing = false;
		
		//Workaround for DFISH-19843 - need to be handled in transport later
		if ( transport != this.TRANSPORTS.TIL ) {
			var otherLines = [];
			var incomingLines = [];
			payload.lines.forEach(function(line) {
				if (line.state == "incoming") {
					incomingLines.push(line);					
				} else {
					otherLines.push(line);
				}
			}, this);

			if(incomingLines.length > 0) {
				var bFound = false;
				enyo.log("currIncomingLine" + enyo.json.stringify(this.currIncomingLine));
				if(this.currIncomingLine) {
					//check this.currIncomingLine is still valid. fix if order changed
					for (var j = 0; j < incomingLines.length; j++) {
						var inCall = incomingLines[j].calls[0];
						if(this.currIncomingLine.calls[0].id == inCall.id) {
							otherLines.push(incomingLines[j]);//Always push already pushed incoming line
							this.currIncomingLine = incomingLines[j];
							enyo.log("Pushing same incoming line again" + enyo.json.stringify(incomingLines[j]));
							bFound = true;
							break;
						}
					}
				}
		
				if(!bFound) {
					otherLines.push(incomingLines[0]);//Always push only first incoming line
					this.currIncomingLine = incomingLines[0];
					enyo.log("Pushing new incoming line" + enyo.json.stringify(incomingLines[0]));
				}	
			}

			if(incomingLines.length > 1) {
				for (var j = 0; j < incomingLines.length; j++) {
					var inCall = incomingLines[j].calls[0];
					if(this.currIncomingLine.calls[0].id != inCall.id) {
						inCall.transport = transport;
						enyo.error("Ignoring call due to multiple incoming calls" + inCall.id);
						this.callIgnore(inCall, true);
					}
				}

				enyo.warn("No of VOIP incoming calls " + incomingLines.length);
				lines = otherLines;
				enyo.log("Original Lines : " + enyo.json.stringify(payload.lines));
				enyo.log("Modified Lines : " + enyo.json.stringify(otherLines));
			}
		}
		//End of workaround for DFISH-19843
		
		lines.forEach(function(line) {
			
			// workaround CFISH-1390, CFISH-1879
			if ( line.state == "hold" || line.state == "conference_hold" ) {
				line.state = "onHold";
			}
			
			// workaround CFISH-1879
			if (line.state == "conference_active" ) {
				line.state = "active";
			}
			
			//Workaround DFISH-17886
			if ( transport != this.TRANSPORTS.TIL && line.state != this.STATES.ACTIVE ) {
				enyo.application.Cache.voipCallRequestedForHold = false;
			}
			
			// temp
			if ( enyo.application.Cache.allDisconnected && line.state != this.STATES.DISCONNECTED ) {
				enyo.application.Cache.allDisconnected = false;
			}
			
			if ( ! isVideo && (line.outgoingVideo || line.incomingVideo) ) {
				isVideo = true;
			}
			
			//Play ringback while dialing voip call's
			if ( transport != this.TRANSPORTS.TIL && line.state == this.STATES.DIALING ) {
				voipCallDialing = true;
			}

			line.autoAcceptVideoCalls = autoAcceptVideoCalls;
			line.allowVideoCalls = allowVideoCalls;
			
			// add transport, startTime, isVideo, and contact to calls
			line.calls.forEach(function(call) {
				line.lastUpdated = Date.now();
				
				var oldCall = this._getExistingCall(call, line.state, transport);
				call.transport = transport;
				call.firstState = (oldCall && oldCall.firstState) || line.state;
				call.videoURI = payload.videoURI;
				enyo.application.Cache.videoURI = payload.videoURI;
				// only add startTime to an active call
				call.startTime = (oldCall && oldCall.startTime) || (line.state == this.STATES.ACTIVE && Date.now());
				
				//HACK: skype calls directly goes to onhold when answered
				if ( oldCall && transport != this.TRANSPORTS.TIL && call.startTime == false && line.state == this.STATES.HOLD) {
					enyo.error("skype calls directly goes to onhold state when answered, missing startTime, mistaken for missed call");
					call.startTime = Date.now();
				}
				
				call.ignored = (oldCall && oldCall.ignored);
				call.contact = (oldCall && oldCall.contact) || new CallSynergyContact({address: call.address, transport: transport, displayName: call.displayName});
				// A reused (dial-time) contact may have been created before the mediator sent the name;
				// apply a display name that arrives in a later push so the card shows it, not the raw id.
				if ( call.displayName && call.contact.setLateDisplayName ) { call.contact.setLateDisplayName(call.displayName); }
				call.isVideo = isVideo || (oldCall && oldCall.isVideo); // Keep isVideo set to true if video was ever used during the call	
				
				// TODO: late displayName updates are TIL only for now
				if ((call.displayName || call.stkCallDisplayText) && transport == this.TRANSPORTS.TIL) {
					//enyo.log("CNAP:  update contact with cnap info til - call.displayName " + call.displayName);
					//call.contact.displayName = call.displayName;
					call.contact.setCnap(call.displayName || call.stkCallDisplayText);
				}
				call.pauseWaitDigits = (oldCall && oldCall.pauseWaitDigits);
				//delete call.displayName; // only the CallSynergyContact uses this - it doesn't need to be stored
				
				//Hack: TIL sends incoming notification after incoming call was answered
				if(oldCall && line.state == this.STATES.INCOMING && line.calls.length == 1 && transport == this.TRANSPORTS.TIL) {
					enyo.log("Don't show incoming call popup, this incoming call notifcation was already answered by user.");
					isAnsweredIncomingCall = true;
				}

			}, this);
			
			// CASE: active
			if ( line.state == this.STATES.ACTIVE ) {
				this.handleActive(line);
				
			// CASE: incoming
			} else if (!isAnsweredIncomingCall && line.state == this.STATES.INCOMING) {
				isIncoming = true;
				this.handleIncoming(line);
				
			// CASE: disconnected 
			} else if ( line.state == this.STATES.DISCONNECTED ) {
				this.handleDisconnected(line);
			}
		}, this);
					
		// save lines and update listeners
		this.callStateLines[transport] = lines;
		this.dispatchLines();
		
		if(transport != this.TRANSPORTS.TIL) {
			if(voipCallDialing == true) {
				this.$.voipRingback.ringbackStart();
			} else {
				this.$.voipRingback.ringbackEnd();
			}
		}
		
		// todo only show activecall if we just answered a call
		// for now, if any lines are incoming, show incoming dialog
		if ( ! isIncoming && ! enyo.application.Cache.allDisconnected && !enyo.application.Cache.isVideoSuspended ) {
                         
			//HACK: DFISH-9308 Slightly delay active call window loading so incoming popup window will be destroyed first.
			setTimeout(enyo.bind(this, function() {

                                // since we have a lag, prevent side effects: example:
                                // if the active call was superceded by a disconnect, this should be cancelled.
                                // if the app was thrown away, this timer callback should not fire.
                                if (this.isPendingOrActive())  {
			            enyo.application.UI.event('activecall');		
                                }
			}), 150);
	
	               		
                        // test code start - simulate a bad skype network
                        /*
                        enyo.application.mypayload = {};
			setTimeout(enyo.bind(this, function() {

                            enyo.application.mypayload.cpu = "bad";
                            if ((!lines[0]) && (!lines[0].id)) {
                                enyo.log("call from skypeuser ");
                                enyo.application.mypayload.name = "skypeuser";
                            } else {
                                enyo.log("call from " + lines[0].calls[0].id);
                                enyo.application.mypayload.name = lines[0].calls[0].id;
                            }
                            enyo.application.mypayload.ploss = "bad";
                            enyo.application.mypayload.rtt = "bad";
                            this._callQualityInfoResponse ("com.palm.skype", enyo.application.mypayload);

			}), 15000);
                        */
                       // test code end
		}
		
		if ( ! isIncoming && ! enyo.application.Cache.allDisconnected && ! isVideo ) {
			enyo.application.proxInterface.enableProxOnCallAndAudio();
		} else {
			enyo.application.proxInterface.proxOff();
	    		this.$.displayOn.call({"state": "on"});
		}
		
		//Hack: close incoming dash (incoming dash created at incoming popup destroy for topaz) if there is no incoming call
		if(! isIncoming ) {
			this.closeIncomingDash();
		}
				
		// Dispatch to services that need to know call state but can't subscribe to us
		// Workaround DFISH-4995
		this.dispatchToBluetooth();
		this.dispatchToSystemUI();
		this.dispatchToAudioRoute();
	},
	_callStateQueryResponseFailure: function(inSender, response) {
		enyo.error(inSender.transport + " failed with " + enyo.json.stringify(response));
		
		if ( this.callStateLines[inSender.transport] ) {
			this.callStateLines[inSender.transport] = [];
		}
		
		if ( this.dialPendingCall && this.dialPendingCall.transport == inSender.transport ) {
			this.dialPendingCall = undefined;
		}
		
		this.dispatchLines();
	},

	_callQualityInfoResponse: function(inSender, payload) {
		enyo.log("callQualityQueryResponse: " + enyo.json.stringify(payload));

                // the mediator determines the numeric threshold values of the good, bad and ugly
                // it also applies heuristics so we do not have to worry about it here.
                // if ((payload.cpu && payload.cpu     === "bad") ||

                // carry which transport this came from, so listeners (the poor-connection prompt) can
                // target changeMedia/disconnect at the right per-transport service instead of a fixed one
                payload.transport = inSender.transport;

                 if ((payload.ploss && payload.ploss === "bad") ||
                     (payload.rtt && payload.rtt     === "bad")) {

                     if (!this.callBadQualityLines[payload.name]) {
		         enyo.warn("callQualityQueryResponse: BAD !! dispatching - " + enyo.json.stringify(payload));
                         this.dispatchCallQualityStatus(payload);
                         this.callBadQualityLines[payload.name] = true; // comment out to test repeated popups

                      } else {
		         enyo.warn("callQualityQueryResponse: Already reported bad quality on call " + payload.name);
                      }

                  } else {
                      // ideally we're not concerned with all-good for quality actions, so log
                      // how many times we get called to optimize the number of such calls.
		      enyo.warn("callQualityQueryResponse: redundant info: " + enyo.json.stringify(payload));
                  }
        },

	_callQualityInfoResponseFailure: function(inSender, response) {
		enyo.error(inSender.transport + "callQualityResponse failed with " + enyo.json.stringify(response));
		
	},

	// Workaround DFISH-4995
	// This is a tactic to let Bluetooth know about the current call state.
	// Prior to this phone app release, bluetooth talked directly with TIL.
	// With the introduction of other call synergy services (such as skype),
	// the phone app is the only thing in the system that knows about the full call
	// state from all the transports.
	// In the future, this CallSynergizer code should be split out to a separate static
	// service that bluetooth can subscribe to.
	dispatchToBluetooth: function() {
		this.$.bluetoothCallStatus.call({
			lines: this.lines()
		},{
			// service might not exist and thus won't return at all,
			// so timeout to prevent memory leak due to hanging call
			timeout: 2000
		});
	},
	// See note above dispatchToBluetooth. Workaround DFISH-4995
	// palm://com.palm.systemmanager/publishToSystemUI ''{"event":"macroCallEvents", "message": {"lines":[{"state":"dialing","calls":[{"id":6,"address":"7035551212","origin":"outgoing","video":false,"transport":"com.palm.telephony","startTime":false}]}]}}'
	dispatchToSystemUI: function() {
		this.$.systemUICallStatus.call({
			event: "macroCallEvents",
			message: {
				lines: this.lines()
			}
		},{
			// service might not exist and thus won't return at all,
			// so timeout to prevent memory leak due to hanging call
			timeout: 2000
		});	
	},
	// Workaround DFISH-4995
	// App needs to let audiod know what kind of call is active so it can dispatch audio properly.
	dispatchToAudioRoute: function() {
		this.$.audioRoute.call({
			lines: this.lines()
		},{
			// service might not exist and thus won't return at all,
			// so timeout to prevent memory leak due to hanging call
			timeout: 2000
		});
	},
	handleActive: function(line) {		
		// Enforce a single active line at a time by putting other active lines
		// on hold (should only be one). Only do this for other lines that are
		// on a different transport since active lines of this transport
		// should be automatically placed on hold.
		var activeLine = this.findLine(function(l) {
			return l.calls[0].transport != line.calls[0].transport
			 	&& l.state == this.STATES.ACTIVE;
		},this);
		
		if ( activeLine ) {	
			if(enyo.application.Cache.voipCallRequestedForHold == true && activeLine.calls[0].transport != this.TRANSPORTS.TIL) {
				enyo.warn("......Not sending Hold to other transport as a VoIP Hold request is still pending.....");
			} else {
				this.callSwap(undefined /*put all calls on hold*/, activeLine.calls[0].transport);
				if(activeLine.calls[0].transport != this.TRANSPORTS.TIL) {
					enyo.application.Cache.voipCallRequestedForHold = true;
				}
			}
			
			// temp debugging for CFISH-6191
			enyo.log("line: " + JSON.stringify(line))
			enyo.log("activeLine (to put on hold): " + JSON.stringify(activeLine))
		}
		
		line.calls.forEach(function(call) {
			call.contact.checkContactReminder();
		});
	},
	handleIncoming: function(line) {
		if ( line.calls.length > 0 ) {
			// incoming call name must start with "incoming" so sysmgr's AlertWindow::isIncomingCallAlert
			// returns true. However, it should not be a name in persistentWindows.conf for phone.
			// All this is going away post-phone anyways. Just don't change this name until then.
			var incomingWindowName = "incoming-phoneapp";
			
			// wait until the first call is decorated - TEMP (incoming call needs to do this)
			// why the first call? that's all we're displaying for now
			// wait until the first call is decorated - TEMP (incoming call needs to do this)
			// why the first call? that's all we're displaying for now
			line.calls[0].contact.decorated(enyo.bind(this, function(line) {
				var height = line.calls[0].contact.picture.src ? 140 : 110;							
				//DFISH-19164 - not using Big incoming popup for now
				/*if (enyo.application.isTablet) {
					height = 140;
					if (line.calls[0].contact.picture.src && 
						line.calls[0].contact.picture.obj &&
						line.calls[0].contact.picture.src != "images/contacts-unknown-icon-large.png" &&
						line.calls[0].contact.picture.obj.width > 80 && line.calls[0].contact.picture.obj.height >80){
						enyo.log("image width "+line.calls[0].contact.picture.obj.width + " height "+line.calls[0].contact.picture.obj.height);
						enyo.application.openPhoneAppPopup("IncomingCall-bigImage", incomingWindowName, {"line": line}, 280);
						return; 				
					}
				}*/					
				//enyo.error("Trying to open incoming call popup **********" + enyo.application.Cache.incomingCallPopupLoading);
				if(!enyo.windows.fetchWindow(incomingWindowName) && !enyo.application.Cache.incomingCallPopupLoading) {
					//enyo.error("Opened incoming call popup window **********");
					enyo.application.Cache.incomingCallPopupLoading = true;
					enyo.application.openPhoneAppPopup("IncomingCall", incomingWindowName, {"line": line}, height);
				} else {
					//enyo.error("delay opening incoming call popup....");
					setTimeout(enyo.bind(this, function() {
						if(!enyo.windows.fetchWindow(incomingWindowName) && !enyo.application.Cache.incomingCallPopupLoading) {
							enyo.application.Cache.incomingCallPopupLoading = true;
							enyo.application.openPhoneAppPopup("IncomingCall", incomingWindowName, {"line": line}, height);
						}
					}), 1500);
 				}
			}, line));

		}
	},
	/*testtimer: function() {
		enyo.log("CNAP: Test timer expired  - calling updateWithContactChange");		
		window.clearInterval(this.testTimer);
		
		//call.contact.displayName = "XYZ";
		this.testLine.calls[0].contact.setCnap("ZYX");
	},*/
	handleDisconnected: function(line) {
		// the final legacy of the popped collar
		var lines, i, otherLineToMakeActive;

		lines = this.lines();
		for (i=0; i < lines.length; i++) {
			// if there is another line that isn't this disconnected one
			if ( lines[i].calls[0].id != line.calls[0].id ) {
				// if other call is active, stop now
				if ( lines[i].state == this.STATES.ACTIVE ) {
					otherLineToMakeActive = undefined;
					break;
					// else
				} else if (lines[i].state == this.STATES.DISCONNECTED) {
					otherLineToMakeActive = lines[i];
				}
			}
		}

		if ( otherLineToMakeActive ) {
			enyo.log("otherLineToMakeActive: " + JSON.stringify(otherLineToMakeActive))
			this.callSwap(otherLineToMakeActive.calls[0].id, otherLineToMakeActive.calls[0].transport);
		}

		// A user-initiated hangup (callDisconnect) must announce a normal "Call ended", never the
		// "Call dropped"/Redial popup - the mediator may report a non-"normal" cause for a deliberate hangup.
		this.userHangupCalls = this.userHangupCalls || {};
		var userInitiatedHangup = !!(line.calls[0] && line.calls[0].id && this.userHangupCalls[line.calls[0].id]);
		if (line.calls[0] && line.calls[0].id) { delete this.userHangupCalls[line.calls[0].id]; }

		// debounce two disconnected calls: if the first call's original state was disconnected, don't log it
		if ( line.calls.length == 0 || (line.calls[0].transport !== this.TRANSPORTS.TIL && line.calls[0].firstState == this.STATES.DISCONNECTED )) {

                        // DFISH-17498: the mediator sends the cause code in the 2nd disconnect sometimes ...
		        if (line.calls[0] && ! line.calls[0].ignored && line.disconnectDetails && line.disconnectDetails.cause && line.disconnectDetails.cause == enyo.application.CallSynergizer.DISCONNECTDETAILS.NOCREDIT) {
			    var height = line.calls[0].contact.canBeCalled() ? 195 : 125;
			    enyo.application.openPhoneAppPopup("NoCreditSkype", "noCreditSkypePopup", {"line": line}, height);

		        } 
			return;
		}
				
		// CASE: missed call
		if (this.isMissedCall(line.calls[0])) {
			line.timestamp = Date.now();

			//when on a call, refrain from opening the missed call popup & just show the banner & dashboard
			if(!enyo.application.CallSynergizer.activeLine()) {
				var height = line.calls[0].contact.canBeCalled() ? 195 : 125;
				enyo.application.openPhoneAppPopup("MissedCall", "missedCallPopup", {"line": line}, height);
			} else {		
				this.showMissedDash(line);				
			}
                } // CASE: not enough credit for calling
		else if (line.calls[0] && ! line.calls[0].ignored && line.disconnectDetails && line.disconnectDetails.cause && line.disconnectDetails.cause == enyo.application.CallSynergizer.DISCONNECTDETAILS.NOCREDIT) {
			var height = line.calls[0].contact.canBeCalled() ? 195 : 125;
			enyo.application.openPhoneAppPopup("NoCreditSkype", "noCreditSkypePopup", {"line": line}, height);


		} // CASE: abnormal disconnect (but NOT if the user deliberately hung up)
		else if (!userInitiatedHangup && line.calls[0] && ! line.calls[0].ignored && line.disconnectDetails && line.disconnectDetails.cause && line.disconnectDetails.cause !== enyo.application.CallSynergizer.DISCONNECTDETAILS.NORMAL) {
			enyo.error("abnormal disconnect: " + enyo.json.stringify(line.disconnectDetails));
			var height = line.calls[0].contact.canBeCalled() ? 165 : 145;
			enyo.application.openPhoneAppPopup("DroppedCall", "droppedCallPopup", {"line": line}, height);	

		// DEFAULT: normal announce
		} else if ( ! line.calls[0].ignored ) {
			this.announceDisconnectNormal(line);
		}
		
		// log each disconnected call
		line.calls.forEach(enyo.bind(this,this.logDisconnectedCall));
	},
	logDisconnectedCall: function(call) {
		if( enyo.application.Utils.isOtaspNumber(call.address)) {
			enyo.log("Skip logging otasp call");
			return;
		}

		var startTime, type, duration;
		
		if ( call.startTime ) {
			startTime = call.startTime;
			duration = (Date.now() - call.startTime);
		} else {
			startTime = Date.now();
			duration = 0;
		}
		
		if (this.isMissedCall(call)) {
			type = "missed";
		} else {
			type = (call.ignored ? "ignored" : call.origin);
		}

		this.$.phoneCall.createPhoneCall(call.contact, type, startTime, duration, call.isVideo);
	},
	isMissedCall: function(call) {
		// missed if the first call doesn't have a start time, it wasn't answered, wasn't ignored, and was incomin
		return ( call && ! call.startTime && ! call.ignored && call.origin == enyo.application.CallSynergizer.ORIGINS.INCOMING);
	},
	// helper flattens the callStateLines object to an array
	// todo later optimization: memoize output since this is called so many
	// times between callstatequery updates
	lines: function() {
		var transport, allLines = [];
		
		// add dialpending call
		if ( this.dialPendingCall ) {
			allLines.push({
				state: this.STATES.DIALPENDING,
				calls: [this.dialPendingCall]
			});
		}
		
		for ( transport in this.callStateLines ) {
			allLines = allLines.concat(this.callStateLines[transport]);
		}
		return allLines;
	},
	// convenience function dispatches line state
	dispatchLines: function() {
		this.$.callStateCallbacks.dispatch(this.lines());
	},
	// Returns a call in callStateLines that is similar to the newCall based on as set of rules
	_getExistingCall: function(newCall, state, transport) {
		
		// helper function: comparator for two addresses
		// TODO move this out to a Utils function
		function isEqual(a,b,t) {
			if (t == enyo.application.CallSynergizer.TRANSPORTS.TIL) {
				return (new enyo.g11n.PhoneNumber(a)).equals(new enyo.g11n.PhoneNumber(b));
			} else {
				return a == b;
			}
		};
		
		// is this call the current dialpending call?
		if ( this.dialPendingCall
				&& this.dialPendingCall.transport == transport
				&& state == this.STATES.DIALING
				&& isEqual(newCall.address, this.dialPendingCall.address, transport) ) {
					
			var temp = this.dialPendingCall;
			
			// once a dialpending call is matched to a dialing call, remove it
			this.dialPendingCall = undefined;
			
			return temp;
		}
		
		// or, is it in the set of lines?
		var i, j, line, call;
		if ( this.callStateLines[transport] ) {
			for(i = 0; i < this.callStateLines[transport].length; i++) {
				line = this.callStateLines[transport][i];
				for(j = 0; j < line.calls.length; j++) {
					call = line.calls[j];
					
					// calls are same if ids match and call is not disconnected
					// since the id is meaningless for disconnected calls
					if ( newCall.id == call.id && line.state != this.STATES.DISCONNECTED) {
						return call;
					}
				}
			}
		}
	},
	// cb will be called with value of enyo.application.CallSynergizer.lines() when it changes
	registerCallStateQuery: function(cb) {
		this.$.callStateCallbacks.add(cb);
	},
	unregisterCallStateQuery: function(cb) {
		this.$.callStateCallbacks.remove(cb);
	},
	registerTransportsQuery: function(cb) {
		this.$.transportsCallbacks.add(cb);
	},
	unregisterTransportsQuery: function(cb) {
		this.$.transportsCallbacks.remove(cb);
	},
	// Return the IM contact-point types ("type_whatsapp", "type_telegram", "type_signal", ...) that map
	// to a registered VoIP call transport - i.e. the serviceName of every enabled PHONE-capable account
	// except cellular (TIL) and the palm profile. Drives the dialer's addressing filter and the per-contact
	// call options dynamically, so ANY current/future messaging connector with PHONE capability is offered
	// as a call option instead of the single hardcoded service. One agnostic place, no per-service code.
	getCallableImTypes: function() {
		var types = [];
		for (var tid in this.transports) {
			if ( tid === this.TRANSPORTS.TIL || tid === "com.palm.palmprofile" ) { continue; }
			var sn = this.transports[tid] && this.transports[tid].serviceName;
			if ( sn && types.indexOf(sn) === -1 ) { types.push(sn); }
		}
		return types;
	},
	// debounce: disallow a second dial call if received within 1.5 sec of first (and both calls pass 'debounce')
	dial: function(address, video, audio, transport /*optional*/, personId /*optional*/, debounce /*optional*/, manualDial /*optional*/) {
		// A dial can arrive with the IM serviceName ("type_telegram") instead of the account templateId
		// ("com.palm.telegram"). this.transports is keyed by templateId (each entry carries its serviceName),
		// so translate here - ONE agnostic place that works for any current/future service, no per-service code.
		if (transport && transport.indexOf("type_") === 0) {
			for (var _tid in this.transports) {
				if (this.transports[_tid] && this.transports[_tid].serviceName === transport) { transport = _tid; break; }
			}
		}
		enyo.error("CALLSYN_DIAG PLACECALL transport=" + transport + " known=" + !!(this.transports && this.transports[transport]));
		if ( debounce ) {
			if ( ! this.debounceDial ) {
				this.$.dialProxy.placeCall(address, video, audio, transport, personId, manualDial);
			}
			this.debounceDial = true;
			enyo.job("debounceDial", enyo.bind(this, function(){ this.debounceDial = false; }), 1500);
		} else {
			this.$.dialProxy.placeCall(address, video, audio, transport, personId, manualDial);
		}
	},
	// Dial without going through the DialProxy.
	dialThrough: function(address, video, audio, transport /*optional*/, personId /*optional*/, manualDial /*optional*/) {
		if ( transport === undefined ) {
			transport = this._guessTransport(address);
		}
		
		enyo.require(transport in this.transports, transport + " isn't a known transport");
		enyo.require(address, "address must be exist to dial");
		
		// special case TIL needs its own dial handler
		if ( transport == this.TRANSPORTS.TIL ) {
			this.$.tilDialHandler.dial(address, enyo.hitch(this, "_dialAfterHandler", video, audio, transport, personId, manualDial));			
		} else {//this is for skype transport			
			/*var bDial = true; 
			//check wifi status
			if (!enyo.application.Cache.wifi || enyo.application.Cache.wifi.state !== "connected"){					
				//wifi not available, check wan status
				if (!enyo.application.Cache.wan || enyo.application.Cache.wan.state !== "connected"){
					bDial = false; 
					this.redialOnNetworkService = {
						transport: this.TRANSPORTS.VOIP,
						address: address
					}						
					//wan is not available either, push network alerts
					if (enyo.application.Cache.airplaneMode === true) {
						//airplane mode is on, try turning it off
						enyo.log("turn off airplane mode");					
						enyo.application.UI.event("dial", {"alerts" : true, type: "voice"});				
					} else {
						//airplane mode is off, try turn on wifi
						enyo.log("turn on wifi");
						enyo.application.UI.event("dial", {"alerts" : true, type: "data"});
					}	
				}										
			}
			
			if (bDial) {
				this._dialAfterHandler(video, audio, transport, personId, manualDial, address, false, undefined);
			}*/
			this._dialAfterHandler(video, audio, transport, personId, manualDial, address, false, undefined);			
		}
	},
	_dialAfterHandler: function(video, audio, transport, person, manualDial, address, blockId, pauseWaitDigits) {
		var line, addressObj, normalizedAddress, defaultAreaCode;	
		enyo.require(address, "Fail to dial: No address sent to dial");
		
		enyo.application.Cache.lastattemptednumber = address; 
		if (pauseWaitDigits != undefined) {
			enyo.application.Cache.lastattemptednumber = address+pauseWaitDigits; 
		}
		
		// normalize phone number before sending to the TIL OR if an international number for skype
		defaultAreaCode = (enyo.application.TelephonyStatusInterface.phoneNumber && enyo.application.TelephonyStatusInterface.phoneNumber.areaCode);
		if ( transport == this.TRANSPORTS.TIL ) {
			if ( this.$.tilDialHandler.phoneInternationalDialingActive ) {
				addressObj = new enyo.g11n.PhoneNumber(address);
				normalizedAddress = addressObj.normalize({
					mcc: enyo.application.TelephonyStatusInterface.mcc,
					assistedDialing: true,
					manualDialing: !!manualDial,
					networkType: enyo.application.Cache.platformType,
					defaultAreaCode: defaultAreaCode
				});
			}
		} else if (transport == this.TRANSPORTS.VOIP && enyo.application.Utils.isValidNumber(address) && (enyo.application.Utils.isInternationalNumber(address) || enyo.application.Utils.isDomesticNumber(address))) {
			addressObj = new enyo.g11n.PhoneNumber(address, {
				mcc: enyo.application.TelephonyStatusInterface.mcc
			});
			normalizedAddress = addressObj.normalize({
				mcc: enyo.application.TelephonyStatusInterface.mcc,
				defaultAreaCode: defaultAreaCode
			});
		}
		
		// todo remove comment. for tracking various assisted dialing bugs
		if ( this.$.tilDialHandler.phoneInternationalDialingActive ) {
			enyo.log("assisted dialing converted " + address + " to " + normalizedAddress);
		}
		
		if ( ! normalizedAddress ) {
			normalizedAddress = address;
		}
		// IM transports (whatsapp/telegram/signal/...) get the raw dialpad string, which carries the
		// display grouping ("+31 6 2148 9831"); the plugin needs a clean E.164. Strip formatting for any
		// non-cellular transport when the address looks like a phone number (leave IM usernames/ids alone).
		if ( transport !== this.TRANSPORTS.TIL && /^[\s()+\-.0-9]+$/.test(String(normalizedAddress)) ) {
			normalizedAddress = String(normalizedAddress).replace(/[\s()\-.]/g, "");
		}
		enyo.log("normalizedAddress = " + normalizedAddress);

                if ((this.TRANSPORTS.VOIP == transport) && (normalizedAddress[0] == '+')) {
                    //enyo.log(" skypeout call ");
                    enyo.application.Cache.IsSkypeoutCall = true;
                } else {
                    enyo.application.Cache.IsSkypeoutCall = false;
                }
		
		this.$.callControl.call({
			"address" : normalizedAddress,
			"video": video,
			"audio": audio,
			"blockId": blockId
		},{
			service: this.transports[transport].implementation,
			method: "dial",
			onSuccess: "_dialSuccess",
			onFailure: "_dialFail",
			details: {
				transport: transport,
				address: address
			}
		});
		
		this.dialPendingCall = {
			address: normalizedAddress,
			transport: transport,
			contact: new CallSynergyContact({address: address, transport: transport, person: person}),
			pauseWaitDigits: pauseWaitDigits
		};
	},
	_dialSuccess: function () {
		this.dispatchLines();
		enyo.application.UI.event('activecall');
	},
	_dialFail: function(inSender, payload, request) {
		enyo.error("FAILED TO DIAL " + enyo.json.stringify(payload) + " with address " + enyo.json.stringify(request.details));
		
		if(this.dialPendingCall) {
			this.dialPendingCall.contact = null;
			this.dialPendingCall = undefined;
		}
		this.dispatchLines();
		
		if(payload === undefined) {
			payload = {};
			payload.errorCode = 2;//assume timeout error
			payload.errorString = "callfailed";
		}
		//switch proxy off if it is the only call
		if(this.lines().length < 2) {
			enyo.application.proxInterface.proxOff();
		}		
		if (payload.errorCode){
			switch (payload.errorCode){
				case 23: //power off
				enyo.application.openPhoneAppPopup("AirplaneMode", "airplanemodePopup");
				break; 
				
				case 4: //Fixed-dialing is active, and the specified number is not allowed
				var param = {"launchType": "fdnDisable", "nextView":"dialer"};
				enyo.application.UI.event('preferences', param);
				break;
								
				case 7: //PIN security lock is in effect
				enyo.application.CallSynergizer.redialOnNetworkService = {
					transport: request.details.transport,
					address: request.details.address
				}; 
				var param = {"launchType": "unlockTelephony"};
				enyo.application.UI.event('preferences', param);				
				break;
								
				case 8: //PUK security lock is in effect 
				var param = {"launchType": "puk1Lock", "nextView":"dialer"};
				enyo.application.UI.event('preferences', param);				
				break;
				
				case 10: //otasp failure code
				var param = {"otaspFailure": true};
				enyo.application.UI.event('dial', param);				
				break;
				
				case 16: 
				if (request.details.transport === this.TRANSPORTS.VOIP) {
					//if we get an error code for skype "notloggedin", ask user what they want to do
					//if airplaneMode is on and wifi is not on, we pop the dialog, still waiting to see the 
					//flow if wifi is off and airplanemode is off as well
					enyo.log("skype error 16..."); 
					/*if (enyo.application.Cache.airplaneMode === true && enyo.application.Cache.wifiAvailable === false) {
						enyo.log("error getting here 16, no connection");
						//enyo.application.openPhoneAppPopup("AirplaneMode", "airplaneModePopup", {
							redialParams: {
								transport: enyo.application.CallSynergizer.TRANSPORTS.VOIP,
								address: request.details.address
							}
						});//
					}
					else {
						var height = 115;
						enyo.application.openPhoneAppPopup("NotloggedinSkype", "NotloggedinSkype", undefined, height);
					}				
					break;*/
					
					if ((enyo.application.Cache.wifi && enyo.application.Cache.wifi.state === "connected") || 
					(enyo.application.Cache.wan && enyo.application.Cache.wan.state === "connected")){	
						var height = 115;
						enyo.application.openPhoneAppPopup("NotloggedinSkype", "NotloggedinSkype", undefined, height);									
					}else {
						var height = 150;
						enyo.application.openPhoneAppPopup("DialFail", "dailFailPopup", {"line": payload}, height);						
					}				
					break;
				}

				default:{
					var height = 150;
					enyo.application.openPhoneAppPopup("DialFail", "dailFailPopup", {"line": payload}, height);
				}
				break;
			}
		}
	},
	// returns a transport given an address
	_guessTransport: function(address) {
		enyo.warn("Guessing transport.....");
			
		if(enyo.application.isTablet) {
			if (enyo.application.Cache.hasVoipAcct && !enyo.application.Cache.hasPairedPhone) {
				return this.TRANSPORTS.VOIP;
			}
		}
	
		// always return TIL for now
		return this.TRANSPORTS.TIL;
	},
	hangupAllHeld: function(transport) {
		enyo.require(transport in this.transports, "hangupAllHeld: transport '" + transport + "' not recognized");
		this.$.callControl.call({},{
			service: this.transports[transport].implementation,
			method: "hangupAllHeld"
		});
	},
	hangupAllActive: function(transport) {
		enyo.require(transport in this.transports, "hangupAllActive: transport '" + transport + "' not recognized");
		this.$.callControl.call({},{
			service: this.transports[transport].implementation,
			method: "hangupAllActive"
		});
	},
	hangupAllCalls: function(transport) {
		enyo.require(transport in this.transports, "hangupAll: transport '" + transport + "' not recognized");
		this.$.callControl.call({},{
			service: this.transports[transport].implementation,
			method: "hangupAll"
		});
	},
	hangupMMI: function(callId, transport) {
		enyo.require(transport in this.transports, "hangupMMI: transport '" + transport + "' not recognized");
		this.$.callControl.call({
			"id" : callId
		},{
			service: this.transports[transport].implementation,
			method: "hangupMMI"
		});
	},
	extractMMI: function(callId, transport) {
		enyo.require(transport in this.transports, "extractMMI: transport '" + transport + "' not recognized");
		this.$.callControl.call({
			"id" : callId
		},{
			service: this.transports[transport].implementation,
			method: "extractMmi"
		});
	},
	callExtract: function(callId, transport) {
		// TODO: for now, send call id only. Will need to send line too for other transports
		enyo.require(transport in this.transports, "callExtract: transport '" + transport + "' not recognized");
		this.$.callControl.call({
			"id" : callId
		},{
			service: this.transports[transport].implementation,
			method: "extract"
		});
	},
	callIgnore: function(callObj, bDontAnnounce) {
		callObj.ignored = true;
		this.callDisconnect(callObj.id, callObj.transport);
		if(!bDontAnnounce) {
			this.announceIgnored(callObj);
		}
	},
	
	announceIgnored: function(call) {
		if (window && window.PalmSystem && PalmSystem.isMinimal) {
			return; // not valid in first use
		}

		var callIgnoredBanner = $L("Ignored call from #{contact}");
		var name = (call.contact.name || call.contact.displayName || call.contact.addressFormatted);
		var message = enyo.application.Utils.interpolate(callIgnoredBanner, { "contact": name } );

		// turn display on
		this.$.displayOn.call({"state": "on"});

		enyo.windows.addBannerMessage(message, "{}", "{}", "notifications");
	},

	// callDisconnect accepts a call if OR conferenceId OR undefined. These can never overlap per the call synergy spec.
	// A better long-term solution would be to get rid of conferenceId concept and send all call ids
	// in the conf call to the transport to figure out that it's a conf call. If undefined, all lines
	// on this transport will be disconnected.
	callDisconnect: function(callIdOrConferenceId, transport) {
		var i, lines = [];
		enyo.require(transport in this.transports, "callDisconnect: transport '" + transport + "' not recognized");
		enyo.require(this.transports[transport].implementation, "transport does not have an implementation")
		
		if(this.callStateLines[transport] == undefined || this.callStateLines[transport].length < 1 || this.callStateLines[transport][0] == undefined ||  
		(this.callStateLines[transport].length == 1 && this.callStateLines[transport][0].state == "disconnected")) {
			//User clicks hangup buttons when we dont have any call information			
			if(this.dialPendingCall) {
				enyo.log("User may want to hangup dialpending call. - We don't have call id yet, So send hangup up all to transport");
				this.hangupAllCalls(transport);
			}
			if(this.dialPendingCall) {
				this.dialPendingCall.contact = null;
				this.dialPendingCall = undefined;
			}
			this.dispatchLines();
			return;
		}

		// if this is the last call in its line, set the line state to a fake 'disconnectpending' state
		for (i=0; i<this.callStateLines[transport].length; i++) {
			
			// this is a line to mark disconnected if:
			// 1) callIdOrConferenceId is undefined, meaning "all lines"
			// or, 2) callIdOrConferenceId matches the conferenceId, meaning "hang up all calls on a line"
			// or, 3) callIdOrConferenceId matches the only call in the line
			var isLine = callIdOrConferenceId === undefined
				|| (callIdOrConferenceId === this.callStateLines[transport][i].conferenceId)
				|| (this.callStateLines[transport][i].calls.length == 1
					&& callIdOrConferenceId === this.callStateLines[transport][i].calls[0].id);
			
			// in addition, this line must not already be disconnected
			var isNotDisconnected = (this.callStateLines[transport][i].state != this.STATES.DISCONNECTED
									&& this.callStateLines[transport][i].state != this.STATES.DISCONNECTPENDING)
			
			if ( isLine && isNotDisconnected ) {
				lines.push(this.callStateLines[transport][i]);
				this.markLineDisconnectPending(this.callStateLines[transport][i]);
				// Remember this was a USER-initiated hangup, so its disconnect is announced as a
				// normal "Call ended" rather than the "Call dropped" (network-drop) popup + Redial.
				// VoIP mediators (WhatsApp/Signal/Telegram) may report a non-"normal" cause even for a
				// deliberate hangup, which would otherwise wrongly trigger the DroppedCall popup.
				this.userHangupCalls = this.userHangupCalls || {};
				var _dc = this.callStateLines[transport][i].calls || [];
				for (var _dj = 0; _dj < _dc.length; _dj++) {
					if (_dc[_dj] && _dc[_dj].id) { this.userHangupCalls[_dc[_dj].id] = true; }
				}
			}
		}
		
		// continue only if disconnected lines were found OR callIdOrConferenceId was valid
		// callIdOrConferenceId can still be valid and no lines found in the case that
		// we're hanging up an individual call of a conference line
		if ( lines.length > 0 || callIdOrConferenceId !== undefined ) {
			// let listeners know about the new 'disconnectpending' lines
			this.dispatchLines();
			enyo.log("SENDING DISCONNECT/HANGUPALL TO TRANSPORT : id  = " + callIdOrConferenceId + " line info " + JSON.stringify(lines));
			this.$.callControl.call({
				"id" : callIdOrConferenceId
			},{
				service: this.transports[transport].implementation,
				method: (transport == this.TRANSPORTS.TIL && callIdOrConferenceId === undefined) ? "hangupAll" : "disconnect",
				onFailure: "callDisconnectFailed",
				lines: lines
			});
		}
	},
	markLineDisconnectPending: function(line) {
		line.state = this.STATES.DISCONNECTPENDING;
		line.lastUpdated = Date.now();
		
		// clear this line if left in this state for more than 5 seconds
		setTimeout(enyo.bind(this, function() {
			if ( line && line.state == this.STATES.DISCONNECTPENDING ) {
				line.state = this.STATES.DISCONNECTED;
				line.lastUpdated = Date.now();
				enyo.warn("No state change info from transport, DisconnectPending -> Disconnected.");
				this.dispatchLines();
			}
		}), 5000);
	},
	callDisconnectFailed: function(inSender, payload, request) {
		enyo.error("FAILED TO DISCONNECT " + enyo.json.stringify(payload));
		// let line go away in the UI
	},
	callMerge: function(ids, destination, transport) {
		enyo.require(transport in this.transports, "callMerge: transport '" + transport + "' not recognized");
		
		// temp workaround CFISH-1070
		if ( transport == this.TRANSPORTS.TIL ) {
			this.$.callControl.call({},{
				service: this.transports[transport].implementation,
				method: "conference"
			});
			return
		}
		
		this.$.callControl.call({
			'ids': ids,
			'to': destination
		},{
			service: this.transports[transport].implementation,
			method: "merge"
		});
	},
	callSwap: function(callId, transport) {
		enyo.require(transport in this.transports, "callSwap: transport '" + transport + "' not recognized");
		this.$.callControl.call({
			"id" : callId
		},{
			service: this.transports[transport].implementation,
			method: "swap"
		});
	},
	callAnswered: function(line, callid, transport) {
		enyo.require(transport in this.transports, "callAnswered: transport '" + transport + "' not recognized");
		enyo.require(callid, "callAnswered: callid must exist");
		
		//inform BT, incoming call was answered from phone app, to route audio through speaker
		this.$.informBluetooth.call({"client": "phone app"});

		this.$.callControl.call({
			"id" : callid
		},{
			service: this.transports[transport].implementation,
			method: "answer",
			onSuccess: "callAnsweredSuccess",
			onFailure: "callAnsweredFailed",
			line: line
		});
		
		// performance hack: spoof 'active' line state and open activecall immediately
		// todo this only works for the TIL. It is an unsafe assumption for other transports
		// (eg skype) that might send the call back with state == incoming
		if ( transport == this.TRANSPORTS.TIL ) {
			line.state = this.STATES.ACTIVE;
			line.calls[0].startTime = Date.now();
			enyo.application.UI.event('activecall');
		}
	},
	callAnsweredFailed: function(inSender, payload, request) {
		enyo.error(enyo.json.stringify(request) + " FAILED TO ANSWER " + enyo.json.stringify(payload));
		if(request && request.line) {
			request.line.state = this.STATES.DISCONNECTED;
			request.line.lastUpdated = Date.now();
			request.line.calls.forEach(enyo.bind(this, this.logDisconnectedCall));
			this.dispatchLines();
		}
	},
	callAnsweredSuccess: function() {
		//HACK: DFISH-18661 User answers and immediately closes the phone app - Calls are not disconnected.
		setTimeout(enyo.bind(this, function() {
	                if(enyo.application.Cache.phoneAppLoaded == false) {
	                	enyo.warn("HACK: DFISH-18661 - Sending disconnect all as phone app is not running");
	                	this.disconnectAllCalls();
	                	enyo.application.UI.enter('start');
	                }
		}), 4000);

	},
	
	// sends dtmf tone over active line
	callDtmf: function(tone, held) {
		var line = this.activeLine();
		if ( line && line.calls.length > 0 ) {			
			/*if(!enyo.application.Utils.findInArray(this.transports[line.calls[0].transport].dtmf, "held") && held == true) {
				enyo.log("long dtmf not listed in transport's capability");
				return;
			}
			if(!enyo.application.Utils.findInArray(this.transports[line.calls[0].transport].dtmf, "oneshot") && held == false) {
				enyo.log("short dtmf not listed in transport's capability");
				return;
			}*/
			
			//temp workaround - DFISH-13517 - remove this when implemented in TIL
			if(held == true && enyo.application.isTablet == true && line.calls[0].transport == this.TRANSPORTS.TIL) {
				return;
			}
		
			this.$.callControl.call({
				tone: tone,
				held: held
			},{
				service: this.transports[line.calls[0].transport].implementation,
				method: "dtmf"
			});
		}
	},
	// sends dtmf tone over active line
	callDtmfEnd: function() {
		var line = this.activeLine();
		if ( line && line.calls.length > 0) {			
			/*if(!enyo.application.Utils.findInArray(this.transports[line.calls[0].transport].dtmf, "held")) {
				enyo.log("long dtmf not listed in transport's capability - so no endDTMF");
				return;
			}*/
			
			//temp workaround - DFISH-13517 - remove this when implemented in TIL
			if(enyo.application.isTablet == true && line.calls[0].transport == this.TRANSPORTS.TIL) {
				return;
			}

			this.$.callControl.call({},{
				service: this.transports[line.calls[0].transport].implementation,
				method: "dtmfEnd"
			});
		}
	},
	genericFailure: function(inSender, response, request) {
		enyo.error(request.service + request.method + " failed with " + enyo.json.stringify(response));
	},
	// returns true if any call exists
	callExists: function() {
		return !!this.findLine(function(line) {
			return line.state != this.STATES.DISCONNECTED && line.state != this.STATES.DISCONNECTPENDING;
		},this);
	},
	//returns active call, if it exists
	activeLine: function() {
		return this.findLine(function(line) {
			return (line.state != this.STATES.DISCONNECTED && line.state != this.STATES.INCOMING && line.state != this.STATES.DISCONNECTPENDING);
		},this);
	},
	//returns FIRST incoming call, if it exists
	incomingLine: function() {
		return this.findLine(function(line) {
			return line.state == this.STATES.INCOMING;
		},this);
	},
	// returns the first line that the iterator returns true
	findLine: function(iterator, context) {
		var transport, i;
		for (transport in this.callStateLines) {
			for(i = 0; i < this.callStateLines[transport].length; i++) {
				if (iterator.call(context, this.callStateLines[transport][i])) {
					return this.callStateLines[transport][i];
				}
			}
		}
	},
	// returns true if there's a call in any state except disconnect, disconnectpending or incoming
	isPendingOrActive: function() {
		var allLines = this.lines();		
		for (var i = 0; i < allLines.length; i++) {
			if (allLines[i].state !== this.STATES.DISCONNECTED && allLines[i].state !== this.STATES.DISCONNECTPENDING && allLines[i].state !== this.STATES.INCOMING) {
				return true;
			}
		}
		return false;
	},
	//disconnects active line on more than single line
	geniusDisconnect: function() {
	        var allLines = this.lines();
	        var noOfCalls = allLines.length;
	        allLines.forEach(function(line) {
				var call = line.calls[0];
				if (noOfCalls == 1 || line.state == this.STATES.ACTIVE) {
					if (line.conferenceId) {
						this.callDisconnect(line.conferenceId, call.transport);
					} else {
						this.callDisconnect(call.id, call.transport);
					}
					return;
				}
	        }, this); 
	},
	// convenience function disconnects all calls
	disconnectAllCalls: function() {
		var transport;
		for ( transport in this.callStateLines ) {
			if ( this.callStateLines[transport].length > 0 ) {
				this.callDisconnect(undefined, transport);
			}
		}
	},	
	announceDisconnectNormal: function(line) {
		
		if ( window.PalmSystem && (PalmSystem.isMinimal || (!PalmSystem.isMinimal && enyo.application.UI.getCurrentState() === 'activecall_card' && enyo.windows.getActiveWindow() != undefined))) {
			enyo.log( "not valid in first use or when active call is focused & not carded");
			return;
		}
			
		// turn display on
		//this.$.displayOn.call({"state": "on" }, { method: "setState", onSuccess: "", onFailure: ""});
			
		this.conferenceEndedBanner = $L("Conference call ended");
		this.callEndedBanner = $L("Call with #{contact} ended");
		this.callEndedNoNameBanner = $L("Call ended");
		
		var message;
	
		// CASE: if this is the last call being disconnected from a conference, 
		// show name as conference label
		if (line.conferenceId) {
			message = this.conferenceEndedBanner;
		
		// CASE: otherwise look for contact name; if it's not there, use number
		} else {
			var call, name;
			if(line.calls && line.calls.length > 0) {
				call = line.calls[0];
				if(call.contact) {
					name = (call.contact.name || call.contact.displayName || call.contact.addressFormatted);
				}
			}
			if ( name !== undefined ) {
				message = enyo.application.Utils.interpolate(this.callEndedBanner, {"contact": name});
			} else {
				message = this.callEndedNoNameBanner;
			}
		}
	
		enyo.windows.addBannerMessage(message, "{}", "{}", "notifications");
	},
	//returns address of an active call
	getActiveLineAddress: function() {
		var allLines = this.lines();
		var noOfCalls = allLines.length;
        	for(var i = 0; i < allLines.length; i++){
			if (noOfCalls == 1 || allLines[i].state == this.STATES.ACTIVE) {
				if (allLines[i].conferenceId) {
					return $L("Conference call");
				} else {
					var call = allLines[i].calls[0];
					return call.address;
				}
			}
		}
	        return $L("Unknown");
	},	

	mute: function() {			
	    this.$.muteRingtone.call({
	        "muted": true
	    });
		
	    if (window.PalmSystem) {
	        window.PalmSystem.cancelVibrations();
	    }		
	},
	//HACK for DFISH-20465 - Bluetooth supports only TIL as preferred call service on a phone which means that
        // this code on the phone must return an error to the tablet.
	isSkypeCallBarredFromBt: function(params) {
		if(!enyo.application.isTablet && params.bluetooth && params.number && enyo.application.Utils.isValidNumber(params.number)) {
			if ( ( enyo.application.Utils.isInternationalNumber(params.number) && ( enyo.application.Cache.phonePreferredIntlPhoneService == "none" || enyo.application.Cache.phonePreferredIntlPhoneService == this.TRANSPORTS.VOIP ) ) /* || ( enyo.application.Utils.isDomesticNumber(params.number) &&( enyo.application.Cache.phonePreferredDomesticPhoneService == "none" || enyo.application.Cache.phonePreferredDomesticPhoneService == this.TRANSPORTS.VOIP ) )*/ ) {
				var params = {"event":"disconnected", "call" :{"callState":"hangupdial","number":params.number,"causeErrorCode":30}};
				this.$.informBTPrefServiceError.call(params);
				return true;
			}
		}
		return false;
	},
	//Incoming call dash
	addIncomingDash: function(dashTitle, dashText, dashInfo) {
		enyo.log("addIncomingDash :" + dashText);
		if(this.incomingdash != undefined) {
        		this.incomingtempLayers = this.incominglayers;
        		this.incomingdash.setLayers([]);
			this.incomingdash.destroy();
			this.incomingdash = undefined;
		}
		
		// delay creating new component under same name after destory
		setTimeout(enyo.bind(this, function() {
			if(this.incomingLine()) {
				this.incomingdash = this.createComponent({
					name: "incomingEnyoDashabord",
					kind:"enyo.Dashboard",
					smallIcon: "images/notification-small-incoming.png",
					onTap: "incomingdashOnTap",
					onUserClose: "incomingUserClose",
					onLayerSwipe: "incomingLayerSwipe"
				}, {"owner": this});

				if(this.incominglayers == undefined) {
					this.incominglayers = [];
				} else {
					if(this.incomingtempLayers) {
						this.incominglayers = this.incomingtempLayers;
					}
				}
				this.incominglayers.push({"icon": "images/notification-large-answer.png","title":dashTitle, "text": dashText, line: dashInfo});
				this.incomingdash.setLayers(this.incominglayers);
				
				this.dispatchToIncomingDash();
			} else {
				//on missed call Incoming dash was added when incoming call popup was destroyed...(for topaz...)
				enyo.log("No incoming lines - skip adding incoming dash...");
			}			
		}), 1000);
	},
	incomingdashOnTap: function (inSender, layer, event) {				
		this.mute();
		if (layer && layer.line) {
			var call = layer.line.calls[0];
			var id = (layer.line.conferenceId !== undefined ? layer.line.conferenceId : call.id);
			this.callAnswered(call, id, call.transport);
		}
		this.incomingdash.pop();
		this.incominglayers.pop();
	},
	incomingUserClose: function() {
		enyo.log("incomingUserClose");
		this.incominglayers = [];
		//this.incomingdash.setLayers([]);
	},
	incomingLayerSwipe: function() {		
		this.incomingdash.pop();
		this.incominglayers.pop();
	},
	//incoming dash was created in incoming popup destroy so we need close 
	closeIncomingDash: function() {
		if (this.incomingdash !== undefined) {
			enyo.log("destroyed incomingdash");
			this.incominglayers = [];
			this.incomingdash.setLayers([]);
			this.incomingdash.destroy();
			this.incomingdash = undefined;
		}
	},
	dispatchToIncomingDash: function() {
		if (this.incomingdash && this.incomingdash.layers && this.incomingdash.layers.length > 0) {
			//enyo.log("dispatchToIncomingDash");
			var allLines = this.lines();
			
			var incomingLines = [];
			for (var i = 0; i < allLines.length; i++) {
				if (allLines[i].state == this.STATES.INCOMING) {
					incomingLines.push(allLines[i]);
				}
			}
			
			var incominglayers = [];
			var dashlayers = this.incomingdash.layers;
			
			//find layer line in incoming call
			for (var j = 0; j < dashlayers.length; j++) {
				var dashCall = dashlayers[j].line.calls[0];
				//enyo.log(enyo.json.stringify(dashCall));
				for (var i = 0; i < incomingLines.length; i++) {
					var inCall = incomingLines[i].calls[0];
					//enyo.log(enyo.json.stringify(inCall));
					if(inCall.id == dashCall.id && inCall.transport == dashCall.transport) {
						incominglayers.push(dashlayers[j]);
						break;
					}
				}
			}
			
			this.incomingdash.setLayers(incominglayers);
		}
	},
	getMissedDashTitle: function(line) {
		var call = line.calls[0];
		var contactname = call.contact.name || call.contact.displayName || call.contact.addressFormatted || call.contact.address || $L("Unknown");
		var contactInfo = contactname;
		if(call.contact.labelFormatted) {
			contactInfo = enyo.application.Utils.interpolate($L("#{id} - #{type}"),{
				id: contactname,
				type: call.contact.labelFormatted
			});
		}
		
		return contactInfo;
	},
	getMissedDashContent: function(line) {
		var call = line.calls[0];
		return enyo.application.Utils.interpolate((call.video == true) ? $L("Missed video call #{day} #{date}") : $L("Missed call #{day} #{date}"),{ 
			day: enyo.application.Utils.formatRelativeDate(new Date(line.timestamp)),
			date: enyo.application.Utils.formatShortTime(new Date(line.timestamp)) 
		});
	},
	showMissedDash: function(missedLine) {
		this.addMissedDash(this.getMissedDashTitle(missedLine), this.getMissedDashContent(missedLine), missedLine);
	},
	//Missed call dash
	addMissedDash: function(dashTitle, dashText, dashInfo) {
		enyo.log("addMissedDash :" + dashText);
		if(this.misseddash == undefined) {
			this.misseddash = this.createComponent({
				name: "phoneMissedDash",
				kind:"enyo.Dashboard",
				smallIcon: "images/notification-small-missed.png",
				onIconTap: "missedIconTap",
				onMessageTap: "missedMessageTap",
				onDashboardActivated: "missedLayerUpdate"
			}, {"owner": this});
		}
		//show dashboard
		this.misseddash.push({"icon": "images/notification-large-missed.png","title":dashTitle, "text": dashText, line: dashInfo});
	},
	missedLayerUpdate: function(inSender, layer, event) {
		if(this.misseddash && this.misseddash.layers) {
			for(var i = 0; i < this.misseddash.layers.length; i++) {
				this.misseddash.layers[i].text = this.getMissedDashContent(this.misseddash.layers[i].line);
			 }
			 this.misseddash.setLayers(this.misseddash.layers);
		}
	},
	missedIconTap: function (inSender, layer, event) {
		enyo.application.UI.event("missedcall");
		this.misseddash.setLayers([]);
	},
	missedMessageTap: function (inSender, layer, event) {
		var call = layer.line.calls[0];
		if(call && call.transport && call.address && enyo.application.Utils.canBeCalled(call.transport, call.address)) {
			enyo.application.CallSynergizer.dial(call.address, call.isVideo ? true : undefined, undefined, call.transport);
		}
		this.misseddash.pop();
	},
	clearMissedDash: function() {
		if(this.misseddash) {
			this.misseddash.setLayers([]);
		}
	},
        // call Quality listeners
        dispatchCallQualityStatus: function(payload) {
                enyo.log("dispatchCallQualityStatus");
                this.$.CallQualityStatusListeners.dispatch(payload);
        },

        registerCallQualityStatus: function(listener) {
                enyo.log("addCallQualityStatusListener");
                this.$.CallQualityStatusListeners.add(listener);
        },

        unregisterCallQualityStatus: function(listener) {
                enyo.log("removeCallQualityStatusListener");
                this.$.CallQualityStatusListeners.remove(listener);
        },

        // video to audio conversion listeners
        dispatchConvertToAudioCall: function(payload) {
                enyo.log("dispatchConvertToAudioCall");
                this.$.ConvertToAudioCallListeners.dispatch(payload);
        },

        registerConvertToAudioCall: function(listener) {
                enyo.log("addConvertToAudioCallListener");
                this.$.ConvertToAudioCallListeners.add(listener);
        },

        unregisterConvertToAudioCall: function(listener) {
                enyo.log("removeConvertToAudioCallListener");
                this.$.ConvertToAudioCallListeners.remove(listener);
        },
	cancelNetworkAlerts: function() {
		this.$.networkalerts && this.$.networkalerts.cancel();
	}
});
