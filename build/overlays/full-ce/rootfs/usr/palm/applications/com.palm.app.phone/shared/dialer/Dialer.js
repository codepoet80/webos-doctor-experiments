enyo.kind({
	name: "Dialer",
	kind: enyo.VFlexBox,
	
	events: {
		onButtonChange: ""
	},
	components: [
	{kind: "VFlexBox", className:"phoneDialer", name:"dialerTop", flex: 1, components: [
		{kind: "VFlexBox", align: "center", components: [
			{kind: "Button", name:"dialpad_Button", caption: $L("Dialpad"), onclick: "dialpadClick", className: "enyo-button-blue", width:"318px"},
		]},		
		{kind: "VFlexBox", className: "phone-contacts", flex: 1, components: [
		{name: "textInput", style: "margin: 15px;", className: "enyo-rounded-input", kind: "SearchInput", hint: $L("Enter Name"), spellcheck: false, autocorrect: false, changeOnKeypress: true, keypressChangeDelay: 200, onchange: "showContacts", onCancel: "showContacts"},		
		{kind: "AddressingList", name: "addressinglist", flex: 1, addressTypes: ["phoneNumbers", "ims"], imTypes: ["type_skype"], onSelect: "addressSelected", onVideoCall:"videoClicked"},	
		// generic dialog, see launch params
		{name: "genericDialog", kind: enyo.DialogPrompt, cancelButtonCaption: false /*don't show*/},
		{name: "networkAlerts", kind: "NetworkAlerts", onTap: "onTapHandlerFn"},
		// services
		{name: "dbGetSpeedDail", kind: "DbService", dbKind: "com.palm.person:1", method: "find", onSuccess: "gotSpeedDialContact", onFailure: "gotSpeedDialContact"},
		{name: "dbLastOutgoingCall", kind: "DbService", dbKind: "com.palm.phonecall:1", method: "find", onSuccess: "gotLastOutgoingCall", onFailure: "gotLastOutgoingCall"},

		// todo this should only be defined in PhoneTabs.js
		{name: "noVoicemailNumberPrompt", kind: "NoVoicemailNumberPrompt"},
		{name: "preferredPhSvcDlg", kind: "PreferredPhSvcDlg", onServiceProviderSelected: "dialNumber", onCancelSelected: "dialNumber"},
		{name: "otaspFailure", kind: "OtaspFailurePrompt"},
		{name:"addToContactsService", kind:"PalmService", service: enyo.palmServices.application, method: "open", },
		]},
	]},
		{kind: "VFlexBox", className: "dialplad-scrim", components:[  	
			{kind: "Scrim", showing: false, onclick: "scrimClicked"},
		]},
		{kind: "VFlexBox", className: "dialermain", name: "dialermain", showing: false, components: [
			{kind: "VFlexBox", name: "dialerControl", className: "dialer", showing: false, components: [
				{kind: "Dialer.DialStringWidget", name: "dialStringWidget", limited: this.limited, onButtonStatus: "sendButtonStatus"},
				{kind: "PhoneDialpad", name: "phoneDialpad", flex: 1, onNumberAdded: "added", onKeyHeld: "softkeyHeld", onHandleDelete: "deleted"},
				{kind: "CustomButton", allowDrag: true, className: "dial-button", name: "dialButton", onclick: "dialButtonClick", onmousehold: "dialButtonHold"},
				{name: "launchApp", kind:"PalmService", method:"open", service: enyo.palmServices.application},
				{kind: "Button", name:"cancelButton", caption: $L("Cancel"), onclick: "cancelClick"},
			]},
		{kind: "VFlexBox", align: "center", components:[    
			{kind: "Button", name:"addtoContactButton", caption: $L("Add to Contacts"), showing: false, onclick: "addContactClick", className: "add-to-contacts-button"},			
		]},
	]},
	],

	create: function() {
		this.inherited(arguments);
		this.$.cancelButton.setShowing(this.limited || (window.PalmSystem && PalmSystem.isMinimal));
		this.hasKeydownBeenReleased = true;
		
		this.buddyAllContactsStatusDirty = true;//force update listview
		this._updateAllContactsBuddystatus = enyo.hitch(this, "updateAllContactsBuddystatus");
		// webOS: Skype is gone, so skypeBuddyCache (its buddy-status watcher) can be absent - guard it.
		// Unguarded, this NPE'd in create() and crashed the Phone app on launch-for-call, which surfaced
		// as "Unable to connect" on outgoing WhatsApp calls. destroy() already guards the same cache.
		if (enyo.application.Cache.skypeBuddyCache) {
			enyo.application.Cache.skypeBuddyCache.registerBuddyStatus(this._updateAllContactsBuddystatus);
		}
	},
	
	destroy: function() {
		if(enyo.application.Cache.skypeBuddyCache) {
			enyo.application.Cache.skypeBuddyCache.unregisterBuddyStatus(this._updateAllContactsBuddystatus);
		}
		this.inherited(arguments);
	},
	
	handleLaunch: function(params) {
		this.params = params || {}; 
 
 		// tell preference we're launched, this value comes strictly from prefDB
		if (enyo.application.Cache.isFirstTimeLaunched !== true) {
			enyo.log("update isFirstTimeLaunched in dialpad");
			enyo.application.Cache.isFirstTimeLaunched = true; 
			enyo.application.SystemStatus.setFirstTimeLaunchRecord(true);
		}	
		
        if (!enyo.application.Cache.adjustDialButton) {               
			this.$.dialerTop.removeClass("phoneDialer-backtoActiveCall");
			this.$.dialerTop.addClass("phoneDialer");
		} else {
			this.$.dialerTop.removeClass("phoneDialer");
			this.$.dialerTop.addClass("phoneDialer-backtoActiveCall");
		}

		// generic ability to show a dialog
		if ( 'dialog' in params ) {
			if ( params.dialog ) {
				this.$.genericDialog.setMessage(params.message);
				this.$.genericDialog.$.acceptButton.setShowing(! params.hideButton); // hack to use DialogPrompt's message
				enyo.application.isTablet ? this.$.genericDialog.openAtCenter() : this.$.genericDialog.open();
			} else {
				this.$.genericDialog.close();
			}
		// otaspFailure
		} else if ( 'otaspFailure' in params ) {
			this.$.otaspFailure.open();
	
		// dial a number
		} else if ( 'dialNumber' in params ) {
			this.$.dialStringWidget.clear();
			// In the Blowfish build the dialStringWidget is not set since it probably adds complexity in looking up the name of a person.
			this.$.preferredPhSvcDlg.setCallDataAndOpen(params);

		// fill in a number
		} else if ( 'fill' in params ) {
			this.$.dialStringWidget.clear();
			this.$.dialStringWidget.setValue(params.fill);
			
		// fill with emergency number
		// this is a convenience method since it's a common use case of 'fill'
		} else if ( 'emergencyFill' in params ) {
			this.$.dialStringWidget.setParams(params);
			this.$.dialStringWidget.clear();
			this.$.dialStringWidget.setValue(enyo.application.Utils.getEmergencyNumbers()[0]);
			
		// call voicemail
		} else if ('voicemail' in params) {
			this.voicemailClick();		
		// show alerts
		} else if ('alerts' in params) {
			enyo.log("network alerts type is "+this.params.type);
			var alertsType = this.params.type; 
			this.$.networkAlerts.push({type: alertsType});		
			
		} else {
			if (this.$.dialStringWidget.getValue() == "") {
				this.$.dialStringWidget.setDefaultText(); 
			}
		}

		this.LastOptionKey = false;
		this.contactMatchKeyValue = undefined;
		
		this.$.textInput.setValue(this.prevVal || params.value || "");
		if (enyo.application.Utils.getKeyBoardType() !== undefined) {
			this.$.textInput.forceFocus();
		}
		this.showContacts();			
	},
	dialpadClick: function(){
		this.$.scrim.setShowing(true);
		this.$.dialerControl.setShowing(true);
		this.$.dialermain.setShowing(true);
		if (this.getDialStringValue()){
			this.$.addtoContactButton.setShowing(true);
		}
		this.dialpadShowed = true; 
	}, 
	scrimClicked: function(inSender, inValue){
		this.$.scrim.setShowing(false);
		this.$.dialerControl.setShowing(false); 
		this.$.dialermain.setShowing(false);
		this.$.addtoContactButton.setShowing(false);
		this.dialpadShowed = false; 
	}, 	
	updateAllContactsBuddystatus: function () {
		this.buddyAllContactsStatusDirty = true;
		if (enyo.application.UI.getCurrentState() === 'dialpad_card') {
			this.showContacts();
		}
	},
	/*the functionality for addressing list*/
	showContacts: function() {
		var curVal = this.$.textInput.getValue();
		
		if(this.prevVal == curVal && !this.buddyAllContactsStatusDirty) {
			enyo.log(this.prevVal + " prev search val = curr search val - Skipping Search" + curVal);
			return;
		}
		this.prevVal = curVal;
		
		if (curVal.length === 0) {
			this.$.addressinglist.cancelSearch();
		}
		// Offer a call row for every enabled PHONE-capable service (whatsapp/telegram/signal/...),
		// not just the legacy hardcoded Skype type. Video stays Skype-only (gated in AddressingList).
		this.$.addressinglist.imTypes = enyo.application.CallSynergizer.getCallableImTypes();
		this.$.addressinglist.search(curVal);
		this.buddyAllContactsStatusDirty = false;
	},	
	addressSelected: function(inSender, inSelected) {
		var transport;
		if (!inSelected)
			return; 
		
		// IM contact-point (type_whatsapp/type_telegram/...) dials via its own transport; CallSynergizer.dial()
		// translates the serviceName to the account templateId. Phone numbers leave the transport unset.
		if ( inSelected.address.type && inSelected.address.type.indexOf("type_") === 0 ) {
			transport = inSelected.address.type;
		} else {
			transport = undefined;
		}

		enyo.application.CallSynergizer.dial(inSelected.address.value, undefined, undefined, transport, inSelected.person._id, true);
	},
	videoClicked: function(inSender, inSelected){
		// Generalized the same way addressSelected() above already is for voice: any
		// type_-prefixed IM contact-point dials through its own transport, CallSynergizer.dial()
		// translates the serviceName to the account templateId. This used to hard-require
		// "type_skype" (there is no TRANSPORTS.SKYPE constant -- that branch always resolved
		// transport to undefined), which silently no-oped video for every other transport
		// (whatsapp/telegram/teams/...) even though their own dial() already accepts a video flag.
		var transport;
		if (inSelected.address.type && inSelected.address.type.indexOf("type_") === 0) {
			transport = inSelected.address.type;
		} else {
			transport = undefined;
		}
		enyo.application.CallSynergizer.dial(inSelected.address.value, true /*video call*/, undefined, transport, inSelected.person._id, true);
	}, /*the functionality for addressing list*/
	
	added: function(inSender, value) {
		enyo.asyncMethod(this, "_added", inSender, value);
	},
	_added: function(inSender, value) {
		if (value && value.length > 0) {
			this.$.dialStringWidget.addChar(value);

			if (enyo.application.Cache.platformType === "cdma"
				&& this.$.dialStringWidget.getValue().match(/^\#\#\d+\#$|^\#\*\#\d+\#$/)) {
					var dialValue = this.$.dialStringWidget.getValue(); 
					this.$.dialStringWidget.clear();					
					enyo.application.CallSynergizer.dialThrough(dialValue);
			}
		}
	},
	isContactLookupChar: function(value) {
		if (enyo.application.Cache.contactMatch === true) {
			switch (value) {
				case 'p': case 'P':
					return (!this.limited && this.$.dialStringWidget.getValue().length === 0) ? true : false;
					
				default:
					return (this.limited || this.$.dialStringWidget.getValue().length > 0) ? false : /[A-z]/.test(value);
			}
		} else {
			return false;
		}
	},
	deleted: function() {
		this.$.dialStringWidget.handleDelete();
	},
	cancelClick: function() {
		enyo.application.UI.event('back');	
	},
	dialButtonClick: function() {
		if ( this.params && 'emergencyFill' in this.params ) {
			var number = enyo.string.trim(this.$.dialStringWidget.getRawValue());
			if (enyo.application.Utils.isEmergencyNumber(number) == false) {
				//todo: don't do anything or pop up some error notification?
				//try to dial a non-emergency number in emergency mode
				enyo.log("dial non-emergency number from emergency mode "+number); 
				return; 
			}
		}
		
		if ( ! window.PalmSystem ) {			
			// TEMPORARY!!
			var dostuff = function(state) {
							// Uncomment these individually to test the popups. Make sure to uncomment the debug line in IncomingCall.js
							/*  
							//switch to video notification
							var call ={"id":14,"address":"4086177733","displayName":"","origin":"incoming","video":false,"transport":"com.palm.telephony","firstState":"incoming","startTime":false,"contact":"Test8 Long Name Testing Long Name Testing"}; 
							enyo.application.openPhoneAppPopup("VideoRequest", "videoRequestPopup", {"call" : call}, 84);
							return;
							
			        //Fake a missed Call popup, 
						 	var dostuff = function(state) {
									enyo.application.CallSynergizer.transports['com.palm.telephony'] = {
										hangupAffectsAll: true,
										legacySwap: true,
										conferenceHangupIndividual: true
									};
									enyo.application.CallSynergizer._callStateQueryResponse({
									    transport: "com.palm.telephony"
									},
									{
									    "lines": [{
									        "state": state,
											"conferenceId": 20,
								            "incomingVideo": false,
								            "outgoingVideo": false,
											"startTime": Date.now(),
											"conferenceId": -2,
									        "calls": [{
										        "address": "anthonygosub",
										        "displayName": "",
										        "id": 2,
												"pauseWaitDigits": "1234",
										        "origin": "incoming",
										    }]
									    }]
									});
								};

								dostuff("incoming");
								setTimeout(function() { dostuff("disconnected"); }, 3000)
								return;
							}                               

							 //fake an incoming call popup
							var dostuff = function(state) {
									enyo.application.CallSynergizer.transports['com.palm.telephony'] = {
										hangupAffectsAll: true,
										legacySwap: true,
										conferenceHangupIndividual: true
									};
									enyo.application.CallSynergizer._callStateQueryResponse({
									    transport: "com.palm.telephony"
									},
									{
									    "lines": [{
									        "state": state,
											"conferenceId": 20,
								            "incomingVideo": false,
								            "outgoingVideo": false,
											"startTime": Date.now(),
											"conferenceId": -2,
									        "calls": [{
										        "address": "anthonygosub",
										        "displayName": "",
										        "id": 2,
												"pauseWaitDigits": "1234",
										        "origin": "incoming",
										    }]
									    }]
									});
								};

								dostuff("incoming");

								//return;
							}                               


							 //fake a dialfail popup
							//enyo.application.openPhoneAppPopup("DialFail", "dailFailPopup", {"line": {}});
							//return;

							 //fake an out of range popup popup
							//enyo.application.openPhoneAppPopup("OutofPhoneRange", "outOfRangePopup", {}, 125);
							//return;

							 //fake an airplane mode popup
							//enyo.application.openPhoneAppPopup("AirplaneMode", "airplaneModePopup", {redialParams: {}});
							//return;


							//var popupType = "ServiceMessage";
							//var popupName = "NetworkMessage";
							//enyo.application.openPhoneAppPopup(popupType, popupName, {"message": 'Some text to put in'});
							//return;
							
							
			*/      
			enyo.application.UI.enter('preferences_card', {});
					return; 
			
				
				var call = {
					displayName: "Anthony Gosub",
					transport: "type_skype",
					callId: "anthonygosub"
				};				
				enyo.application.CallSynergizer.transports['com.palm.telephony'] = {
					hangupAffectsAll: true,
					legacySwap: true,
					conferenceHangupIndividual: true
				};
				enyo.application.Cache.authorizedForVideo = [];
				enyo.application.Cache.authorizedForVideo[call.callId] = true;
				enyo.application.CallSynergizer._callStateQueryResponse({
				    transport: "com.palm.telephony"
				},
				{
				    "lines": [{
				        "state": "active",
						"conferenceId": 20,
			            "incomingVideo": true,
			            "outgoingVideo": true,
						"startTime": Date.now(),
						"conferenceId": -2,
				        "calls": [{
					        "address": "anthonygosub",
					        "displayName": "",
					        "id": 2,
							"pauseWaitDigits": "1234",
					        "origin": "outgoing",
					    }]
				    }]
				});
			};
			
			dostuff("active");
			//setInterval(function() { dostuff("active"); }, 5000)
			//setTimeout(function() { dostuff("disconnected"); }, 7000)
			return;
		}
		
		// Same bug as videoClicked() above used to have: there is no TRANSPORTS.SKYPE constant, so this
		// branch always resolved to false, silently dropping the transport (and the video flag) for any
		// redial of a VoIP/IM contact (whatsapp/telegram/signal/teams/...) and falling through to a plain
		// number redial instead. Fixed the same way: use whatever service is actually on the data.
		var lastCallContactData = this.$.dialStringWidget.getLastCallContactData();
		if (lastCallContactData && lastCallContactData.service) {
			enyo.application.CallSynergizer.dial(lastCallContactData.addr, lastCallContactData.isVideo, undefined, 
			lastCallContactData.service, lastCallContactData.personId, true);
			this.clear();
		} else {
			var number = this.$.dialStringWidget.getValue();
			if (number == undefined || number == "") {
				//redial
				this.clear();
				this.getLastOutgoingCall();
			}
			else {
				if (enyo.application.CallSynergizer.dial(number, undefined, undefined, undefined, undefined, true, true) === false) {
					this.$.preferredPhSvcDlg.setCallDataAndOpen({'dialNumber': number});
				} else {
					this.clear();
				}
			}
		}
	},
	dialButtonHold: function() {
		// TODO: uncomment to enable voice dialing
		// enyo.application.UI.event('voicedialing');
	},
	dialNumber: function(inSender, callData) {
		if (callData) {
			this.clear();
			enyo.application.CallSynergizer.dialThrough(callData.dialNumber, callData.video, callData.audio, callData.transport, callData.personId);
		}
	},
	copy: function() {
		enyo.dom.setClipboard(this.$.dialStringWidget.getValue());
	},
	paste: function() {
		enyo.dom.getClipboard(enyo.bind(this, function(value) {
			this.$.dialStringWidget.setValue(value);
		}));
	},
	back: function(e) {
		return this.clear();
	},
	keyup: function(e) {
		if (!this.dialpadShowed){
			return false; 
		}
		var rtnValue = null;
		this.hasKeydownBeenReleased = true;
		this.clearsoftkeytimeout();
		
		switch (e.keyCode) {
			case 13://enter
				this.dialButtonClick();
				rtnValue = true;
				break;
			
			case 27: // escape (follows a back gesture)
				rtnValue = false;
				break;
				
			default:
				if (this.contactMatchKeyValue && this.$.dialStringWidget.getValue().length == 0) {
					enyo.application.UI.enter('contactlookup', {value:this.contactMatchKeyValue});
				}
				else {
					rtnValue = this.$.phoneDialpad.up(enyo.application.Utils.keyFromEvent(e));
				}
				break;
		}
		
		this.contactMatchKeyValue = undefined;
		if (e.keyCode === 129) {
			this.LastOptionKey = false;
		}
		
		return rtnValue;
	},
	keydown: function(e) {
		if (!this.dialpadShowed){
			return false; 
		}
		if (e.keyCode === 8 ) {
			this.deleted();
			return true;
		}
		// hasKeydownBeenReleased is used to cancel out the multiple key down events from the HW keyboard
		if (this.hasKeydownBeenReleased === true && !e.altKey) {		
			//keyCode 8 is backspace key, is this true for all our keyboard?	
			//keyCode 13 is enter, 129 is option, and 32 is space
			if (e.keyCode !== 13 && e.keyCode !== 32) {
				this.hasKeydownBeenReleased = false;
				var keyValue = this.translateKey(enyo.application.Utils.keyFromEvent(e));
				if (this.isContactLookupChar(keyValue))	{
					this.contactMatchKeyValue = keyValue;
				} else {
					this.$.phoneDialpad.down(keyValue);
				}
				
				if (this.keyPressTimeout === undefined) {
					this.keyPressTimeout = setTimeout(enyo.bind(this, "softkeyHeld", e), 500);
				}
			}
		}
		else if (e.altKey && e.keyCode === 129) {
			this.LastOptionKey = true;
		}
	},
	clearsoftkeytimeout: function() {
		if (this.keyPressTimeout !== undefined) {
			clearTimeout(this.keyPressTimeout);
			this.keyPressTimeout = undefined;
		}
	}, 	
	softkeyHeld: function(e, virtualkeyvalue) {
		var key = undefined; // = enyo.application.Utils.keyFromEvent(e);	
		if (virtualkeyvalue == undefined || virtualkeyvalue == null) {	
			key = enyo.application.Utils.keyFromEvent(e);	//from dialer
			this.keyvalue = this.$.phoneDialpad.translateKey(key);
		}
		else { //from dialpad
			this.keyvalue = virtualkeyvalue;
		}	 
		var keymappings = enyo.application.CallSynergizer.transports[enyo.application.CallSynergizer.TRANSPORTS.TIL].keyHoldMappings;
		var mapvalue =  keymappings && keymappings[0];
		switch (this.keyvalue) {
			case '0':		
				if (mapvalue != undefined) {
					if (enyo.application.Cache.platformType == "gsm") {//this is a gsm phone add '+'
						if (this.$.dialStringWidget.getValue() === "0") {
							this.$.dialStringWidget.setValue(mapvalue["0"]);
						}
						else {
							this.deleted();
							this.added(null, mapvalue["0"]);
						}
					}
					else if (this.$.dialStringWidget.getValue() === "0") {//this is cdma, only add '+' for the first character
						this.$.dialStringWidget.setValue(mapvalue["0"]);
					}
				}
				return true;
			case '1':
				if (this.$.dialStringWidget.getValue() === "1" || this.$.dialStringWidget.getValue() === "") {
					this.$.phoneDialpad.clearvirtualHoldTimout(this.keyvalue);	
					this.clearsoftkeytimeout();
					this.deleted();			
					//using enyo.application.Cache.keydownReleased is an clumsy hack to address issue
					//issue CFISH-4129 longer key press should not go pass Connecting screen
					//see ActiveCall.js keyup function for more details		
					if (!this.hasKeydownBeenReleased) {
						if (enyo.application.Cache.keydownReleased != false) {
							enyo.application.Cache.keydownReleased = false;
							this.voicemailClick();
						}
						this.hasKeydownBeenReleased = true; // This is needed since the HW keyup event doesn't fire when making a VM call
					}
					else {
						if (enyo.application.Cache.keydownReleased != false) {
							this.voicemailClick();
						}
					}
				}
				return true;
			case '*':
			case '#':
				mapvalue =  keymappings && keymappings[(this.keyvalue === '*') ? 1 : 2];
				if (mapvalue != undefined) {
					var len = this.$.dialStringWidget.getValue().length; 
					if (len > 1) {
						this.deleted();
						this.added(null, mapvalue[this.keyvalue]);
					} else {
						if (len == 1){
							this.$.dialStringWidget.setValue(mapvalue[this.keyvalue]);
						} else {
							this.added(null, mapvalue[this.keyvalue]);
						}
					}
				}
				return true;
			default:
				//check if its value is speeddial key
				if (this.$.dialStringWidget.getValue() == undefined || this.$.dialStringWidget.getValue().length < 2 ) {
					if (/*key != undefined && */this.isValidSpeedDialChar(this.keyvalue)) {
						this.getSpeedDailContact(enyo.application.Utils.mapSpeedDialKey(this.keyvalue));
					}
				}
				return true;
			}
	},
	isValidSpeedDialChar: function(keyCode) {
		var valid="acdfghijklmnopqrstuvwxyACDFGHIJKLMNOPQRSTUVWXY23456789";
		if( valid.indexOf(keyCode) >= 0 ) {
			return keyCode;
		}
		return null;
	},

	getSpeedDailContact: function(key) {
		this.speeddialKey = key.toUpperCase();
		var q = {
			where: [{"prop":"phoneNumbers.speedDial","op":"=","val":this.speeddialKey}]
		};
		this.$.dbGetSpeedDail.call({query: q});
	}, 

	gotSpeedDialContact: function(inSender, response) {
		if (response && response.results.length > 0) {
			this.clearsoftkeytimeout();
			this.$.phoneDialpad.clearvirtualHoldTimout(this.keyvalue);			
			this.speedDialContact = response.results[0];
			var addr = enyo.application.Utils.getSpeedDialNumber(this.speedDialContact, this.speeddialKey);
			this.deleted();
			//using enyo.application.Cache.keydownReleased is an ugly hack to address issue
			//issue CFISH-4129 longer key press should not go pass Connecting screen					
			//see ActiveCall.js keyup function for more details					
			if (!this.hasKeydownBeenReleased) {
				if (enyo.application.Cache.keydownReleased != false) {
					enyo.application.Cache.keydownReleased = false;
					enyo.application.CallSynergizer.dial(addr, undefined, undefined, undefined, undefined, true);
				}				
				this.hasKeydownBeenReleased = true; // This is needed since the HW keyup event doesn't fire when making a speedDial call			
			}
			else {
				if (enyo.application.Cache.keydownReleased != false) {
					enyo.application.CallSynergizer.dial(addr, undefined, undefined, undefined, undefined, true);
				}
			}
		}

	},
	
	getLastOutgoingCall: function() {
		var q = {
			where: [{"prop":"type","op":"=","val":'outgoing'}],
			orderBy: "timestamp",
			desc: true,
			limit: 1
		};
		this.$.dbLastOutgoingCall.call({query: q});
	}, 
	
	gotLastOutgoingCall: function(inSender, response) {
		//enyo.log(enyo.json.stringify(response));
		if (response && response.results.length > 0) {
			this.lastCall = response.results[0];
			var recipient = this.lastCall.to[0];
			// don't redial emergency or otasp
			if (enyo.application.Utils.isEmergencyNumber(recipient.addr)  ||
					enyo.application.Utils.isOtaspNumber(recipient.addr)) {
				enyo.log("emergency or otasp number");
				return;
			}

			if (recipient.name && recipient.name.length > 0) {
				this.$.dialStringWidget.setContactName(recipient);
			}
			else
				this.$.dialStringWidget.setValue(recipient.addr);
		}
	},
	voicemailClick: function() {
		var number = enyo.application.VoicemailService.getVoicemailNumber();
		if (number == undefined || number == "") {
			if(enyo.application.isTablet == true) {
				this.$.noVoicemailNumberPrompt.openAtCenter();
			} else {
				this.$.noVoicemailNumberPrompt.open();
			}
		}
		else {
			enyo.application.CallSynergizer.dial(number, undefined, undefined, undefined, undefined, true);
		}
	},
	clear: function() {
		var isEmpty = this.$.dialStringWidget.getValue() == "";
		this.$.dialStringWidget.clear();
		return ! isEmpty;
	},
	setData: function(invalue) {
		//this.$.dialStringWidget.setDefaultData(invalue);
	}, 
	setCallData: function(inSender, inValue){
		//this.addressingContact = inValue;
	},
	getDialStringValue: function() {
		return this.$.dialStringWidget.getValue();
	},
	getDialStringRawValue: function() {
		return this.$.dialStringWidget.getRawValue();
	},	
	sendButtonStatus: function(inSender, inValue) {
		//this.doButtonChange(inValue);
		this.showContactbutton(inValue); 
	},	
	translateKey:function(c) {
		if (enyo.application.Cache.contactMatch === true) {
			var dialStrLen = this.$.dialStringWidget.getValue().length;
			var bTranslateKey = (this.LastOptionKey && dialStrLen === 0) || dialStrLen > 0;
			switch (c) {
				case 'w': case 'W':
					if ((bTranslateKey && enyo.application.Cache.platformType == "gsm") || (bTranslateKey && dialStrLen === 0))
						return this.$.phoneDialpad.translateKey(c);
					else
						return c;

				case 'e': case 'E': case 'r': case 'R':	case 't': case 'T':
				case 'd': case 'D':	case 'f': case 'F': case 'g': case 'G':
				case 'z': case 'Z': case 'x': case 'X': case 'c': case 'C':	case 'v': case 'V': case 'b': case 'B':
				case '@':
					return (bTranslateKey ? this.$.phoneDialpad.translateKey(c) : c);

				default:
					return c;
			}
		} else {
			if (c === 'w' || c === 'W') {
				if (enyo.application.Cache.platformType == "gsm" || this.$.dialStringWidget.getValue().length === 0)
					return this.$.phoneDialpad.translateKey(c);
				else
					return c;
			} else if (c === 'p' || c === 'P') {
				if (this.$.phoneDialpad.azertyKey && this.LastOptionKey)
					return '+';
				else 
					return c; 					
			} else {
				return this.$.phoneDialpad.translateKey(c);
			}
		}
	},
	resizeHandler: function() {
		this.inherited(arguments);
		//this.$.dialerControl.scrollToBottom();
	}, 
	showContactbutton: function(value) {
		// ignore request to show the "Add to Contacts" button during "first use"
		if ( window.PalmSystem && PalmSystem.isMinimal )
			return;

		if(value){
			var dialString = this.getDialStringRawValue();
 			if (dialString && dialString.length > 0) {
				this.$.addtoContactButton.show();
				//this.$.commandMenu.hide();
				//this.$.commandMenu.addClass("contactsButtonDisplayed")
			}
		} else {
			this.$.addtoContactButton.hide();
			//this.$.commandMenu.show();                            
			//this.$.commandMenu.removeClass("contactsButtonDisplayed")
		}

	},
	addContactClick: function(inSender, value) {
		var address = this.getDialStringValue();
		if (address == undefined || address.length == 0) {
			enyo.error("unable to add contact with phone number " + address);
		}
		else {
			this.$.addToContactsService.call({
				"id": "com.palm.app.contacts",
				"params": {
					"contact": {
						"phoneNumbers": [{
							"value": address
						}]
					},
					"launchType": "pseudo-card"
				}
			});
		}		
	},
});

/* Perf testing!
enyo.kind({
	name: "Dialer.DialStringWidgetLight",
	kind: "Control",
	style: "height: 60px; width: 400px; border: 1px solid red",
	published: {
		value: ""
	},
	components: [
		{name:"content"}
	],
	valueChanged: function() {
		this.$.content.setContent(this.value);
	},
	addChar: function(char) {
		this._setValue(this.getValue() + char);
	},
	clear: function() {
		this._setValue("");
	},
	maybeEnableContactLookup: function() {
		
	},
	setContactName: function() {
		
	},
	handleDelete: function() {
		
	},
	handleClick: function() {
		
	},
	setDefaultText: function() {
		
	}
});*/

// handles hard (keyboard) keys and returns an action
// todo proof-of-concept... not used yet
Dialer.keyAction = function(key, isHeld, contactMatchOn) {
	if ( key == "1" && isHeld ) {
		return Dialer.KEYACTIONS.VOICEMAIL;
	}
	
	if ( contactMatchOn && /[A-z]/.test(key) ) {
		return Dialer.KEYACTIONS.CONTACTMATCH;
	}
	
	return Dialer.KEYACTIONS.ADDTODIALSTRING;
}

Dialer.KEYACTIONS = {
	VOICEMAIL: 'voicemail',
	CONTACTMATCH: 'contactmatch',
	ADDTODIALSTRING: 'dialstring',
	
}                                                        


