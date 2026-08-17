enyo.kind({
	name:"DialProxy",
	kind: enyo.Component,
	components: [
		{name: "accounts", kind: "Accounts.getAccounts", onGetAccounts_AccountsAvailable: "onAccountsAvailable",},
	],
	create: function() {
		this.inherited(arguments);	
		this.$.accounts.getAccounts({
			//filterBy:{templateId: 'com.skype'}, // TODO: This is better but not working, why???
			/*filterBy:{capability: ['PHONE']},*/
			capability: "PHONE",
			subscribe:true
		});
	},
	_normalize: function(address) {
		return address && String(address).replace(/[^\+01234567890\*#pwt]/g,'');
	},
	// Picks the one registered non-cellular (VoIP/IM) transport for the "exactly one calling account,
	// no paired phone" case. Replaces the old hard-coded TRANSPORTS.SKYPE (which doesn't exist, so this
	// always left transport undefined and broke dialing on this path).
	_firstVoipTransport: function() {
		var transports = enyo.application.CallSynergizer.transports;
		for (var id in transports) {
			if (id !== enyo.application.CallSynergizer.TRANSPORTS.TIL && id !== "com.palm.palmprofile") {
				return id;
			}
		}
		return undefined;
	},
	// The DialProxy, checks if the user has a skype acct and the address is a int'l #, then it takes appropriate actions.
	//    (If the transport is defined then the DialProxy will alwyays use it and ignore what is stored in the preference value preferredPhoneService)
	placeCall: function(address, video, audio, transport /*optional*/, personId /*optional*/, manualDial /*optional*/) {
		
		this.callData = {'dialNumber':address, 'video':video, 'audio':audio, 'transport':transport, 'personId':personId};
		
		//this is a temp solution for DFISH-9610, only applies to tablet 
		//if user has set the phone service preference, try use that transport; if not, ask user
		if (enyo.application.isTablet) {
			if (address[0] == '#' || address[0] == '*'){
				//todo: this is not a complete solution, we try to avoid breaking USSD call
				//but if skype allows # or * in the address, this will fail
				transport = enyo.application.CallSynergizer.TRANSPORTS.TIL; 
			//if transport is not defined, we use preferred phone service in the pref 			
			}else if (transport === undefined) {
				var preferredService; 
				
				if (enyo.application.Cache.hasVoipAcct === true && enyo.application.Cache.hasPairedPhone === true) {
					//3G device with SIM ready
					if (enyo.application.Cache.platformType !== "none" && enyo.application.Cache.simState === "simready"){
						if (enyo.application.Utils.isInternationalNumber(address)) {
							this.callData.isIntl = true;
							preferredService = enyo.application.Cache.phonePreferredIntlPhoneService;
						}
						else {					
							this.callData.isIntl = false;
							preferredService = enyo.application.Cache.phonePreferredDomesticPhoneService;
						} 
					}else { //wifi or 3G device without SIM
						preferredService = enyo.application.Cache.phonePreferredIntlPhoneService; 
					}				
					if (preferredService === undefined) {
						preferredService = "none"; 
					}
					switch (preferredService) {
						//ask user to choose only if both transport are available
						case "none":
							enyo.application.UI.event("dial", this.callData);
							return false;
						
						// any non-cellular preferred service (whatsapp/telegram/signal/teams/...) gets
						// normalized the same way (TRANSPORTS.SKYPE never existed, so this case never matched)
						default:
							if (preferredService !== enyo.application.CallSynergizer.TRANSPORTS.TIL) {
								address = this._normalize(address);
							}
							transport = preferredService;
							break;
					}								
				} else { //only one transport is available
					if (enyo.application.Cache.hasVoipAcct === true) {
						transport = this._firstVoipTransport();
					} else if (enyo.application.Cache.hasPairedPhone === true) {
						transport = enyo.application.CallSynergizer.TRANSPORTS.TIL; 
					} else {
						//we should not get here.  This probably can happen in the
						//case, user delete the skype account or turn off the bluetooth
						//while in the phone app.
						enyo.log("no preferred phone service is available.");
						enyo.application.UI.enter('firstlaunch_card');
					}					
				}				
			} 
		}
					
		// TODO: What if there is already an active call

		// If a transport is defined just go ahead and dial
		if (transport) {
			enyo.application.CallSynergizer.dialThrough(address, video, audio, transport, personId, manualDial);
			return;
		}
		else if (this.isReady === undefined) {
			this.executePlaceCall = true;
			return;
		}
		else if (enyo.application.Cache.hasVoipAcct) {
			if (enyo.application.Utils.isInternationalNumber(address)) {
				switch (enyo.application.Cache.phonePreferredIntlPhoneService) {
					case "none":
						this.callData.isIntl = true;
						enyo.application.UI.event("dial", this.callData);
						return false;
				
					default:
						enyo.application.CallSynergizer.dialThrough(address, video, audio, enyo.application.Cache.phonePreferredIntlPhoneService, personId, manualDial);
						break;
				}
			} else {
				switch (enyo.application.Cache.phonePreferredDomesticPhoneService) {
					case "none":
						this.callData.isIntl = false;
						enyo.application.UI.event("dial", this.callData);
						return false;
				
					default:
						enyo.application.CallSynergizer.dialThrough(address, video, audio, enyo.application.Cache.phonePreferredDomesticPhoneService, personId, manualDial);
						break;
				}
			}
		}
		else {
			enyo.application.CallSynergizer.dialThrough(address, video, audio, transport, personId, manualDial);
		}
	},
	onAccountsAvailable: function(inSender, inResponse) {
		var previousAcctState = enyo.application.Cache.hasVoipAcct;	
        if (inResponse.templates) {
			enyo.application.Cache.accountTemplate = inResponse.templates;	
		}		
		
		enyo.application.Cache.hasVoipAcct = false;
		if (inResponse.accounts) {
			var len = inResponse.accounts.length;
			for (var i = 0; i < len; i++) {
				// The getAccounts query above is capability:PHONE, so EVERY returned account is a
				// VoIP/calling account - legacy Skype OR any Synergy connector that declares a PHONE
				// capability (Signal/Telegram/WhatsApp/...). Any one of them means the user can place
				// VoIP calls, so the Phone app opens to the dialer instead of the "Your Phone Accounts"
				// first-launch screen. (The palm profile is not a calling account.)
				var acct = inResponse.accounts[i];
				if (acct && acct.templateId && acct.templateId !== "com.palm.palmprofile") {
					enyo.application.Cache.hasVoipAcct = true;
					break;
				}
			}
		}
		
		//The account is remvoed, update contact look up page if necessary
		if (previousAcctState === true && enyo.application.Cache.hasVoipAcct === false) {
			enyo.log("debug: skype account removed");
			if (!enyo.application.hidden && !enyo.application.isCarded) {
				if (!enyo.application.Cache.hasPairedPhone) {
					enyo.application.UI.enter('firstlaunch_card');
				}
				else { //if we're still at contact page refresh it
					if (enyo.application.UI.getCurrentState() === 'contactlookup') {
						enyo.application.UI.event('updateView', {
							"updateSkype": true
						});
					}
				}
			}			
			
		}							
		
		this.isReady = true;
	
		if (this.executePlaceCall === true) {
			this.executePlaceCall = false;
			this.placeCall(this.callData.dialNumber, this.callData.video, this.callData.audio, undefined, this.callData.personId);
		}
	}
});