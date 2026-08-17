// note: this file must be loaded after CallSynergizer

enyo.kind({
	name:"DialHandler.Telephony",
	kind: enyo.Component,
	statics: {
		LaunchCodesExternalApps: {
			'8011183': 'com.palm.app.collectlogs', // based on QWERTY: c011ect 
			'5647': 'com.palm.app.collectlogs', // LOGS
			'8727277': 'com.palm.app.usbpassthrough', // USBPASS
			'43574357': 'com.palm.app.deviceinfo', // HELPHELP
			'387': 'com.palm.app.ftp', // FTP
			'66338': 'com.palm.app.ondevlog', // ONDEV,
			'66623': 'com.palm.app.monad', // MONAD
			'8463': 'com.palm.app.timedetails', // TIME
			'3386633': 'com.palm.app.devmodeswitcher', // DEVMODE
			'8378': 'com.palm.app.crotest', // CROTEST
			'2833766': 'com.palm.app.phonediag', // AUDEQON
			'28337633': 'com.palm.app.phonediag', // AUDEQOFF
			'477': 'com.palm.app.phonediag', // GPS
			'889': 'com.palm.app.phonediag', // TTY
			'3366': 'com.palm.app.phonediag', // DEMO
			'72346': 'com.palm.app.phonediag', // RADIO
			'633': 'com.palm.app.phonediag' // OFF
		},
		
		// regex for a normal number (all numeric and min length 3)
		REGEX_NORMAL_NUMBER: /^[0-9\+]{3,}$/,
		
		// gsmGSM only
		// Matches *|#|**|##|*# and puts that in
		// parsedDialString[1] and puts the rest of the dial string (excluding the final
		// '#') into parsedDialString[2].
		// '^' = match to start of string
		// (\*|#|\*\*|##|\*#) = match *|#|**|##|*# and put it into parsedDialString[1]
		// ([0-9]+[0-9\*]*) = match a single digit/+, then a series of digits and '*'
		// #$ = match a '#' at the end of the string
		REGEX_GSM_LAUNCH_CODE: /^(\*|#|\*\*|##|\*#)([\+0-9]+[\+0-9\*]*)#$/,
		
		// GSM only
		// (star or hash) then a number, or '0', or '00'
		REGEX_GSM_NA: /^([\*#][0-9]|0|00)$/,
		
		// GSM only
		// Service Code (the first number, terminated by either '*' or '#')
		REGEX_GSM_SERVICE_CODE: /^([0-9]*)[\*#]?([\+0-9\*]*)$/,
		
		// *31#<number><SEND> to supress CLIR or #31#<number><SEND> to invoke CLIR
		REGEX_CLIR: /^([\*#]31#)([\+0-9]+)$/,
		
		// Look for SI1, SI2, SI3 and SI4 separated by '*', allow + in first slot so call forwarding can use it
		REGEX_GSM_MULTI_MMI: /^([0-9\+]*)[\*]?([0-9]*)[\*]?([0-9]*)[\*]?([0-9]*)[\*]?/,
	},
	components: [		
		// actions
		{name:"launchApp", kind:"PalmService", method:"open", service: enyo.palmServices.application},
		{name:"telephony", kind:"PalmService", service:enyo.palmServices.telephony, onFailure:"_genericFailure"},
		{name:"mmiService", kind:"MmiService"},
		{name:"ussdService", kind:"UssdService"},
		
		// temp subscriptions - these should be replaced by call capabilities
		{name:"platformQuery", kind:"PalmService", method:"platformQuery", service:enyo.palmServices.telephony, subscribe:true, onSuccess:"_updatePlatformType"},
		{name:"settingsQuery", kind:"PalmService", method:"getPreferences", params:{keys: ["PhoneAppGSMNorthAmericanSettings","phoneInternationalDialingActive"]}, service:enyo.palmServices.system, subscribe:true, onSuccess:"_updateSettings"},
	],
	create: function() {
		this.inherited(arguments);
		
		// temp - this should be replaced with callcapabilities
		this.$.platformQuery.call();
		this.$.settingsQuery.call();
	},
	// temp - this should be replaced with callcapabilities
	_updatePlatformType: function(inSender, response) {
		this.platformType = response.extended.platformType;
	},
	// temp - this should be replaced with callcapabilities
	_updateSettings: function(inSender, response) {
		this.phoneGSMNorthAmericanSettings = !!response['PhoneAppGSMNorthAmericanSettings'];
		this.phoneInternationalDialingActive = !!response['phoneInternationalDialingActive'];
	},
	// helper normalizes an address by whitelisting characters
	_normalize: function(address) {
		return address && String(address).replace(/[^\+01234567890\*#pwt]/g,'');
	},
	_genericFailure: function(inSender, response, request) {
		enyo.error(request.service + request.method + " failed with " + enyo.json.stringify(response));
	},
	// helper returns the launch code portion of the address if it is a launch code
	_handleLaunchCode: function(address) {
		var i, transport, transportLaunchCodes, matchedCode, launchCode, launchCodeExternalAppCodes;
		transport = enyo.application.CallSynergizer.transports[enyo.application.CallSynergizer.TRANSPORTS.TIL]
		transportLaunchCodes = transport.launchCodes;
		launchCodeExternalAppCodes = transport.launchCodeExternalAppCodes;
				
		// workaround CFISH-1287
		if ( ! transportLaunchCodes ) {
			if ( this.platformType == "gsm" ) {
				transportLaunchCodes = ["#*"];
			} else { // cdma
				transportLaunchCodes = ["##","#*#"];
			}
		}
		
		// find correct launch code
		if ( transportLaunchCodes ) {
			for (i=0; i<transportLaunchCodes.length; i++) {
				if ( address.indexOf(transportLaunchCodes[i]) === 0 ) {
					matchedCode = transportLaunchCodes[i];
					break;
				}
			}
		}
		
		if ( matchedCode ) {
			launchCode = address.slice(matchedCode.length).replace(/#$/,''); // strip off last '#'

                        if ((this.platformType == "none") && ((launchCode == "477") || (launchCode == "8727277"))) {
                             enyo.log(" launchCode " + launchCode + " not allowed on wifi");
                             return true;
                        }
			
			// CASE: external app
			if ( DialHandler.Telephony.LaunchCodesExternalApps[launchCode] ) {
				this.$.launchApp.call({
					id: DialHandler.Telephony.LaunchCodesExternalApps[launchCode],
					// pass launch code in case external app needs it
					params: {
						launchCode: launchCode
					}
				});
				return true;
				
                        // CASE: in list of transport capability's external launch codes
			} else if (transport.launchCodeExternalAppCodes && transport.launchCodeExternalAppCodes.indexOf(launchCode) >= 0 ) {
				this.$.launchApp.call({
					id: transport.launchCodeExternalApp,
					params: {
						launchCode: launchCode
					}
				});
				return true;
				
			// 6 digit numbers on CDMA are considered MSL
			} else if (this.platformType == "cdma" && launchCode.match(/^[0-9]{6}$/)) {
				this.$.launchApp.call({
					id: "com.palm.app.phonediag",
					params: {
						launchCode: "msl",
						mslCode: launchCode
					}
				});
				return true;
			}
			
		}
	},
	_handleAsRegularCall: function(address, dialCallback, capabilities) {
		var pauseCodeIndex, waitCodeIndex, sliceIndex;
		pauseCodeIndex = address.indexOf(capabilities.pauseCode);
		waitCodeIndex = address.indexOf(capabilities.waitCode);
		
		if ( pauseCodeIndex >= 0 && waitCodeIndex >= 0 ) {
			sliceIndex = Math.min(pauseCodeIndex, waitCodeIndex);
		} else if ( pauseCodeIndex >= 0 ) {
			sliceIndex = pauseCodeIndex;
		} else if ( waitCodeIndex >= 0 ) {
			sliceIndex = waitCodeIndex;
		}
		
		if ( sliceIndex != undefined ) {
			dialCallback(address.slice(0,sliceIndex), undefined, address.slice(sliceIndex));
		} else {

			// if it ends in a #, it's a USSD (3GPP 22.030, 6.5.3.2 item 3 / figure 3.5.3.2)
			if (this.platformType == "gsm" && address.length > 0 && address.charAt(address.length - 1) === '#') {
				this.$.ussdService.send(address);
			} else {
				dialCallback(address);
			}
		}
	},
	_handleShortGsm: function(address, dialCallback) {
		// TEMP refactor handle using callcapabilities
		// Is the dial string 2 characters or less?
		// todo: factor out to parse short (?)
		if (address.length <= 2) {
			// CASE: active call
			if (enyo.application.CallSynergizer.callExists()) {
				var transport = enyo.application.CallSynergizer.TRANSPORTS.TIL;
			
				if (address.length == 1) {
					switch (address) {
						// FIXME: order is important here. it needs to show the active call scene 
						// first so that it can receive the event via delegateToSceneAssistant
						case "0":
							//enyo.application.UI.event('activecall');
							enyo.application.CallSynergizer.hangupAllHeld(transport);

							var inLine = enyo.application.CallSynergizer.incomingLine();
							if (inLine) {
								enyo.log("Ignore Incoming call on 0-SEND");
								enyo.application.CallSynergizer.callIgnore(inLine.calls[0]);
							}
							break; //release all held, accept waiting
						case "1":
							//enyo.application.UI.event('activecall');
							enyo.application.CallSynergizer.hangupAllActive(transport);
							break; //release all active, accept held
						case "2":
							//enyo.application.UI.event('activecall');
							enyo.application.CallSynergizer.callSwap("", transport);							
							break; //swap
						case "3":
							//enyo.application.UI.event('activecall');
							enyo.application.CallSynergizer.callMerge("","",transport);
							break; //merge
						default:
                                                        if (this.plaformType != "none") {
							    this.$.ussdService.send(address);
                                                        }
					}
				} else {
					switch (address.charAt(0)) {
						// TODO FIXME: order is important here. it needs to show the active call scene 
						// first so that it can receive the event via delegateToSceneAssistant
						case '1':
							//enyo.application.UI.event('activecall');
							enyo.application.CallSynergizer.hangupMMI(parseInt(address.charAt(1),10), transport);
							break; //release active call X
						case '2':
							//enyo.application.UI.event('activecall');
							enyo.application.CallSynergizer.extractMMI(parseInt(address.charAt(1),10), transport);
							break; //extract call X
						default:
                                                        if (this.platformType != "none") {
							    this.$.ussdService.send(address);
                                                        }
					}
				}
			// CASE: not on an active call
			} else {
				// TODO FIXME: won't dial 1 as USSD
				// It is a USSD code if it doesn't start with 1, p, or w
				if (address.length > 0 && '1pw'.indexOf(address.charAt(0)) === -1) {				
					if (this.phoneGSMNorthAmericanSettings && DialHandler.Telephony.REGEX_GSM_NA.test(address)) {
						dialCallback(address);
					} else {
                                                if (this.platformType != "none") {
						    this.$.ussdService.send(address);
                                                }
					}
				// it's not, so we should dial it if it's a valid number
				} else if ('pw'.indexOf(address.charAt(0)) === -1){
					dialCallback(address);
				}
			}
			
			return true;
        }
	},
	_handleClirGsm: function(address, dialCallback) {
		var clirParts;
		if (clirParts = address.match(DialHandler.Telephony.REGEX_CLIR)) {
                        if (this.platformType != "none") {
        	            dialCallback(clirParts[2], (clirParts[1] == "#31#"));
                        }
			return true;
		}
	},
	_handleGsmMMI: function(address, dialCallback) {
		var parsedDialString, mmi, scTemplate, handle;
		parsedDialString = address.match(DialHandler.Telephony.REGEX_GSM_LAUNCH_CODE);
		mmi = {};
		
        if ( parsedDialString ) {
			// The action is the first regex match
	        // TODO: factor as parseActiom
	        switch (parsedDialString[1]) {
	            case "*":
	                mmi.action = 'activate';
	                break;
	            case "#":
	                mmi.action = 'deactivate';
	                break;
	            case "**":
	                mmi.action = 'register';
	                break;
	            case "##":
	                mmi.action = 'unregister';
	                break;
	            case "*#":
	                mmi.action = 'interrogate';
	                break;
	        }
        	
			// TODO: FIXME: added + support here.  this AT LEAST allows the first
			// parameter of the PIN MMI codes to contain a +.  it might cause other problems too.
	        var matches = parsedDialString[2].match(DialHandler.Telephony.REGEX_GSM_SERVICE_CODE);
			if ( matches.length >= 2 ) {
	            mmi.serviceCode = matches[1];
	            mmi.si = matches[2];
			}
			
	        // See if the service code is valid.  If not then this is a USSD
	        if (! mmi.serviceCode || ! MmiService.MmiServiceCodes[mmi.serviceCode]) {
	            // The service code is not valid.  This must be USSD. Send the entire dial string
                                if (this.platformType != "none") {
				    this.$.ussdService.send(address);
                                }
				return true;
	        }
        	
	        // Parse the supplementary info
	        mmi.si = mmi.si.match(DialHandler.Telephony.REGEX_GSM_MULTI_MMI);
        	
	        // Point to the service code template
	        scTemplate = MmiService.MmiServiceCodes[mmi.serviceCode][mmi.action];
	        // Make sure the action can be handled
	        if (!scTemplate) {
	            return true;
	        }
        	
	        // This is a valid MMI code. 
        	
	        // Special case for call forwarding.  If the action is "activate" but a phone
	        // number is specified then the command must be changed to "register".
	        if (mmi.action == 'activate' && mmi.si[1].length > 0 && scTemplate.cmd.indexOf("forward") >= 0) {
	            // If there is a template for "registration" then use that instead
	            if (MmiService.MmiServiceCodes[mmi.serviceCode]["register"]) {
	                scTemplate = MmiService.MmiServiceCodes[mmi.serviceCode]["register"];
	                mmi.action = "register";
	            }
	        }
        	
	        // Create the basic service groups that correspond to the SI values entered by the user
	        mmi.ic = [];
			// TODO: will this let invalid codes through?
	        for (var i = 1; i <= 4; i++) {
	            if (MmiService.MmiInfoClass[mmi.si[i]]) {
	                mmi.ic[i] = MmiService.MmiInfoClass[mmi.si[i]];
	            } else {
	                mmi.ic[i] = MmiService.MmiInfoClassDefault;
				}
	        }
			
	        // Create the call barring service types that correspond to the SI[1] value entered by the user
	        // This is used to change call barring password (*03 or **03)
	        mmi.bs = [];
			
			// TODO: will this let invalid call barring types through?
			mmi.bs[1] = MmiService.MmiCallBarringType[mmi.si[1]] || MmiService.MmiCallBarringTypeDefault;
			
			var cmd = scTemplate.cmd;
			// TODO FIXME WORKAROUND TO GET ARRAY OF BEARERS OUT
			mmi.cmd = scTemplate.cmd;
			
	        // Create the JSON arguments and substitute in the values that the user entered
	   		var interpolatedArgs = enyo.application.Utils.interpolate(enyo.json.stringify(scTemplate), mmi);
			var arg = enyo.json.parse(interpolatedArgs);
				        
			delete arg.cmd;

                        if ((enyo.application.isTablet && this.platformType == "gsm"))
                        {
                            var allowedMmiCmds = ["imeiQuery", "pin1Change", "pin2Change", "pin1Unblock", "pin2Unblock"];
                            if (allowedMmiCmds.indexOf(mmi.cmd) < 0){
                                    enyo.log(" MMI " + mmi.cmd + " is not allowed ");
                                    return true;
                            } else {
                                    enyo.log(" MMI " + mmi.cmd + " is allowed ");

                            }
                        }

                        if (this.platformType != "none") {
			    this.$.mmiService.send(arg, cmd, mmi)
                        }
			
			return true;
		}
	},
	_convertForWorldPhoneSpecialCases: function(address) {
		if ( enyo.application.Cache.platformMultimode && enyo.application.Cache.simLocked ) {

			if ( (this.platformType == "gsm") || (this.platformType == "none") || (enyo.application.Utils.isInternationalCDMA() == true) ) {
				if (address.indexOf("*611") === 0) {
					return "+19085594899"
				
				} else if (address.indexOf("*86") === 0) {
					return enyo.application.VoicemailService.getVoicemailNumber();
				}
			}
	
			if ( (this.platformType == "gsm") || (this.platformType == "none")) {
				if (address.indexOf("*67") === 0) {
					return address.replace(/^\*67/,"#31#");
				
				} else if (address.indexOf("*82") === 0) {
					return address.replace(/^\*82/,"*31#");
				}
			}
		}
		return address;
	},
	_handleWorldPhoneCallFwdCases: function(address) {
		//call forwarding not supported in 
		//1. Multimode international cdma
		//2. Multimode carrier sim locked gsm networks
		if( enyo.application.Cache.platformMultimode == true && (enyo.application.Utils.isInternationalCDMA() == true ||
			(this.platformType != "cdma" && (enyo.application.Cache.simLocked == true || enyo.application.Cache.vzwSIM == true ))
			)) {

			if ((address.indexOf("*71") === 0) || (address.indexOf("*72") === 0) || (address.indexOf("*73") === 0)) {
				var payload = {"returnValue": false, "errorString": "callfailed"};
				enyo.application.openPhoneAppPopup("DialFail", "dailFailPopup", {"line": payload}, 125);
				return true;
			}
		}
		return false;
	},
	dial: function(address, dialCallback) {
		var capabilities = enyo.application.CallSynergizer.transports[enyo.application.CallSynergizer.TRANSPORTS.TIL];
		address = this._normalize(address);
		
		// TODO refactor handle using callcapabilities

		// don't dial if no address or it start with 'w' or 'p'
		if ( ! address || address[0] == 'w' || address[0] == 'p') {
			return;
		}
		
		// always dial if an emergency number, turn the flight mode off automatically
		if ( enyo.application.Utils.isEmergencyNumber(address) ) {
			if (!enyo.application.Cache.powerOn) {
				enyo.log("emergency call with radio off");
				enyo.application.CallSynergizer.redialOnNetworkService = {
					transport: enyo.application.CallSynergizer.TRANSPORTS.TIL,
					address: address
				}; 
				this.$.telephony.call({"state": "on"},{method: "powerSet"});
			}
			else {
				dialCallback(address);
			}
			return;
		}
		
		// if it's a launch code, eg ##APP
		if ( this._handleLaunchCode(address) ) {
			return;
		}
		
		/*/ if SIM is not ready, show popup and return
		if ((enyo.application.Cache.powerOn == false) && (enyo.application.Cache.hasPairedPhone == false)){
			enyo.application.openPhoneAppPopup("AirplaneMode", "airplaneModePopup", {
				redialParams: {
					transport: enyo.application.CallSynergizer.TRANSPORTS.TIL,
					address: address
				}});
			return; 
		}*/
		
		// if number looks normal, dial out now
		if ( DialHandler.Telephony.REGEX_NORMAL_NUMBER.test(address) ) {
			dialCallback(address);
			return;
		}
		
		// voicemail number on CDMA
		if (address == "1" && this.platformType == "cdma") {
			address = enyo.application.VoicemailService.getVoicemailNumber();
			if (address == undefined || address == null || address == "")
				address = "1"; 
				
			dialCallback(address);
			return;
		}
		
		address = this._convertForWorldPhoneSpecialCases(address);
		
		// GSM only + wifi tablet
		if ((this.platformType == "gsm") || (this.platformType == "none")) {
			
			if ( this._handleShortGsm(address, dialCallback) ) {
				return;
			}
			
			if ( this._handleClirGsm(address, dialCallback) ) {
				return;
			}
			
			if ( this._handleGsmMMI(address, dialCallback) ) {
				return;
			}
		}
		
		if(this._handleWorldPhoneCallFwdCases(address)) {
			return;
		}		
		
		this._handleAsRegularCall(address, dialCallback, capabilities);
	}
});
