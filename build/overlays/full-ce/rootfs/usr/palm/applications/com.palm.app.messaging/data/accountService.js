enyo.kind({
	name: "accountService",
	kind: "PalmService",
	components: [
		{kind: "Accounts.getAccounts", name: "listAccounts", onGetAccounts_AccountsAvailable: "gotAccounts"}
	],
	create: function() {
		this.inherited(arguments);
		this.data = [];
		this._cleanedImAccounts = undefined;
		this._accountTypes = undefined;
		this._accountTemplates = undefined;
		this._notifier = new Notifier();
	},
	getCleanedImAccounts: function(){
		this.marshallCleanedImAccounts();
		return this._cleanedImAccounts;
	},
	marshallCleanedImAccounts: function(){
//		enyo.log("------------accountService::marshallCleanedImAccounts this._cleanedImAccounts: ", this._cleanedImAccounts);
		if (!this._cleanedImAccounts) {
//			enyo.log("------------accountService::marshallCleanedImAccounts::this.data:", this.data);
			if(!this.data || this.data.length === 0){
				enyo.warn("------------accountService::marshallCleanedImAccounts::should wait for app to load and get accounts info");
				return;
			}
			this._cleanedImAccounts = [];
			this._accountTypes = {};
			for (var i=0, a; a=this.data[i]; i++) {
				this.cleanAccount(a);
			}
//			enyo.log("------------accountService::marshallCleanedImAccounts before return, got: ", this._cleanedImAccounts.length);
		}
	},
	getChatWithNonBuddies: function(serviceName){
		var accountTypes = this.getMyAccountTypesHash();
		if(!accountTypes){
			return null;
		}
		var account = accountTypes[serviceName];
		if (account) {
			return account.chatWithNonBuddies;
		}
		else {
			return null;
		}
	},
	getIcons: function(serviceName){
		var accountTypes = this.getMyAccountTypesHash();
		if(!accountTypes){
			return null;
		}
		var account = accountTypes[serviceName];
		if (account && account.icon) {
			return account.icon;
		}
		else {
			return null;
		}
	},
	getDbKinds: function(serviceName) {
		var dbkind;
		var accountTypes = this.getMyAccountTypesHash();
		if(!accountTypes){
			return null;
		}
		var account = accountTypes[serviceName];
		if (account === undefined || account.dbkinds === undefined) {
			enyo.warn("accountService::getDbKinds::Warning, no account for ", serviceName, " returning empty object");
			return {};
		} else {
			return account.dbkinds;
		}
	},
	getAccountTemplates: function(){
		return this._accountTemplates;
	},
	// Per-service reaction policy (the MESSAGING capabilityProvider's optional "reactions" descriptor,
	// e.g. {supported:true, map:{"&#128518;":"&#128513;"}}). Sourced from the LIVE account template
	// (getAccountTemplates) so edits to the template take effect without re-adding the account (the
	// account DB record snapshots capabilities at create-time); falls back to the snapshotted account
	// record, then null (=> caller passes reactions through unchanged).
	getReactions: function(serviceName){
		var tmpls = this.getAccountTemplates();
		if (tmpls) {
			for (var i = 0, t; t = tmpls[i]; i++) {
				var caps = t.capabilityProviders || [];
				for (var j = 0, c; c = caps[j]; j++) {
					if (c.capability === "MESSAGING" && c.serviceName === serviceName && c.reactions) {
						return c.reactions;
					}
				}
			}
		}
		var types = this.getMyAccountTypesHash && this.getMyAccountTypesHash();
		var acct = types && types[serviceName];
		return (acct && acct.reactions) || null;
	},
	// Auth pseudo-contacts for a service: usernames of the non-buddy "contacts" a connector surfaces
	// its interactive-login challenge through (e.g. Telegram's "Telegram" chat, Facebook/gometa's
	// "Facebook" chat that collects the login/2FA code). Declared as the MESSAGING capabilityProvider's
	// optional "authContacts" array in the LIVE account template. These pseudo-contacts have no presence
	// record, so the "recipient is offline" send nag falsely fires on them mid-login - considerForSend
	// uses this list to skip the nag for them. Returns [] when none declared.
	getAuthContacts: function(serviceName){
		var tmpls = this.getAccountTemplates();
		if (tmpls) {
			for (var i = 0, t; t = tmpls[i]; i++) {
				var caps = t.capabilityProviders || [];
				for (var j = 0, c; c = caps[j]; j++) {
					if (c.capability === "MESSAGING" && c.serviceName === serviceName && c.authContacts) {
						return c.authContacts;
					}
				}
			}
		}
		return [];
	},
	// Is this address one of the service's auth pseudo-contacts (case-insensitive)? See getAuthContacts.
	isAuthContact: function(serviceName, address){
		if (!address) { return false; }
		var list = this.getAuthContacts(serviceName);
		var addr = ("" + address).toLowerCase();
		for (var i = 0; i < list.length; i++) {
			if (("" + list[i]).toLowerCase() === addr) { return true; }
		}
		return false;
	},
	// Can this service place a voice call through the phone app? Cellular SMS/MMS always can. An IM
	// service is voice-capable when its account template declares a PHONE capabilityProvider (as
	// WhatsApp and Signal already do) - the canonical webOS way to say "this service can call". Read
	// from the LIVE templates so any connector that adds a PHONE provider auto-extends the set with no
	// code change. Used to gate the conversation phone button.
	hasVoiceCapability: function(serviceName){
		if (enyo.messaging.utils.isTextMessage(serviceName)) { return true; } // SMS/MMS (cellular)
		var tmpls = this.getAccountTemplates();
		if (tmpls) {
			for (var i = 0, t; t = tmpls[i]; i++) {
				var caps = (t && t.capabilityProviders) || [];
				for (var j = 0, c; c = caps[j]; j++) {
					if (c.capability === "PHONE" && (!c.serviceName || c.serviceName === serviceName)) {
						return true;
					}
				}
			}
		}
		return false;
	},
	cleanAccount: function(account) {
		id = account._id;
		for (var i=0, c; c = account.capabilityProviders[i]; i++) {
			if (c.capability === "MESSAGING") {
				this.cleanCapability(account, c);
				break;
			}
		}
	},
	cleanCapability: function(account, cap) {
		cap.accountId = account._id; // "2+Mr",
		cap.templateId = account.templateId; // "com.palm.aol",
		cap.username = account.username; // "flyingsquirrel",
		cap.alias = account.alias; // "flyingsquirrel @ AIM",
		if (!cap.loc_name) {
			cap.loc_name = account.loc_name || "";
		}
		if (cap.loc_shortName === undefined) {
			//enyo.log("-------capability.loc_shortName undefined. using part of loc_name", cap.loc_name);
			cap.loc_shortName = cap.loc_name.substr(0, 5);
		}
		this._cleanedImAccounts.push(cap);
		//enyo.log("----------capability.serviceName:", cap.serviceName);
		if (cap.capabilitySubtype === "SMS") {
			//ensure that a serviceName is specified for the SMS capability
			cap.serviceName = "sms";
			this._accountTypes.sms = cap; 
			this._accountTypes.mms = cap; // MMS is also this capability
		} else if (cap.serviceName !== undefined && this._accountTypes[cap.accountId] === undefined) {
			if (this._accountTypes[cap.serviceName] === undefined) {//for generic info such icons for service type
				this._accountTypes[cap.serviceName] = cap;
			}
//			enyo.log("----------add accountId:", cap.accountId, " to this._accountTypes[]");
			this._accountTypes[cap.accountId] = cap;
		}
		else{
			enyo.warn("Duplicate capabilities: ---------cap.serviceName should be undefined:", cap.serviceName, " this._accountTypes[cap.accontId] exist:", this._accountTypes[cap.accountId]);
		}
	},
	getAccount: function(serviceName, username){
		//enyo.log("---------acountService::getAccount:servicename:", serviceName, " username:", username, " this._clearnedImAccounts:", this._cleanedImAccounts.length)
		if (this._cleanedImAccounts) {
			// Phone numbers can have multiple servicenames so normalize it to "sms"
			if (enyo.messaging.utils.isTextMessage(serviceName)) {
				serviceName = "sms";
			}
			for (var i=0, a; a=this._cleanedImAccounts[i]; i++) {
//				enyo.log("--------------accountService::getAccount::account.serviceName:", a.serviceName);
				if (serviceName === a.serviceName) {
					//enyo.log("--------------accountService::getAccount::account:", a);
					if (username === undefined || username === this._cleanedImAccounts[i].username) {
						return this._cleanedImAccounts[i];
					}
				}
			}
		}
		return undefined;
	},
	getMyAccountTypesHash: function(){
		//enyo.log("---------acountService::getMyAccountTypesHash::this._accountTypes:", this._accountTypes);
		this.marshallCleanedImAccounts();
		return this._accountTypes;
	},
	getAccounts: function(){
//		enyo.log("-----------------messagingAccountService::getAccounts");
		//include com.palm.palmprofile here, so transportpicker will include sms
		if (window.PalmSystem || enyo.messaging.utils.getAppRootPath().indexOf("http") !== -1) {
			this.$.listAccounts.getAccounts({
				capability: "MESSAGING"
			});
		} else {
			this.getMockAccounts();
		}
	},
	gotAccounts: function(inSender, inResponse) {
//		enyo.log("-----------------messagingAccountService::gotAccounts inResponse.accounts.length:", inResponse.accounts.length);
		if (inResponse.accounts.length > 0) {
			this.data = inResponse.accounts;
			this._cleanedImAccounts = undefined;
			this._accountTypes = undefined;
			this.getCleanedImAccounts();
		}
		if(inResponse.templates){
			this._accountTemplates = inResponse.templates;
		}
		this.notify();
	},
	getMockAccounts: function() {
		var data = enyo.g11n.Utils.getNonLocaleFile({
			root: enyo.messaging.utils.getAppRootPath(),
			path: "mock/accounts/com.palm.messaging.accounts-1.json"
		});
		this.gotAccounts(this, data);
	},
	getImCommandKind: function(serviceName){
		var dbkinds = this.getDbKinds(serviceName);
		if (dbkinds.imcommand) {
			return dbkinds.imcommand;
		} else {
			enyo.warn("No imcommand dbkind for ", serviceName ,", so using default");
			return "com.palm.imcommand:1";
		}
	},
	getImAccounts: function() {
		var accounts = this.getCleanedImAccounts();  // may contain SMS account
		var ims = [];
		
		if (accounts) {
			for (var i = 0; i < accounts.length; i++) {
				if (accounts[i].capabilitySubtype === "IM") {
					ims.push(accounts[i]);
				}
			}
		}
//		enyo.log("-----------------messagingAccountService::gotImAccounts: ", ims);
		return ims;
	},
	notify: function() {
		this._notifier.notify();
	},
	register: function(listener, callback) {
		this._notifier.register(listener, callback);
	},
	unregister: function(listener) {
		this._notifier.unregister(listener);
	}
});

/* 
 IMAccounts:[]
 from capabilityProviders:
                    "_id": "260",
                    "capability": "MESSAGING",
                    "id": "com.palm.yahoo.im",
                    "capabilitySubtype": "IM",
                    "dbkinds": {
                        "imcommand": "com.palm.imcommand.yahoo:1",
                        "immessage": "com.palm.immessage.yahoo:1"
                    },
                    "icon": {
                        "loc_32x32": "\/usr\/palm\/public\/accounts\/com.palm.yahoo\/images\/yim-32x32.png",
                        "loc_48x48": "\/usr\/palm\/public\/accounts\/com.palm.yahoo\/images\/yim-48x48.png",
                        "splitter": "\/usr\/palm\/public\/accounts\/com.palm.yahoo\/images\/yim-32x32.png"
                    },
                    "implementation": "palm:\/\/com.palm.imyahoo\/",
                    "invites": {
                        "supportsCustomMessage": true
                    },
                    "loc_shortName": "Yahoo!",
                    "onCredentialsChanged": "palm:\/\/com.palm.imyahoo\/onCredentialsChanged",
                    "onEnabled": "palm:\/\/com.palm.imyahoo\/onEnabled",
                    "serviceName": "type_yahoo"

from accounts:
capability.accountId = account._id; // "2+Mr",
								capability.templateId = account.templateId; // "com.palm.aol",
								capability.username = account.username; // "flyingsquirrel",
								capability.alias = account.alias; // "flyingsquirrel @ AIM",
								
								if (!capability.loc_name) {
									capability.loc_name = account.loc_name || "";
								}
								
								if (capability.loc_shortName === undefined) {
									Mojo.Log.warn("capability.loc_shortName undefined. using part of loc_name", capability.loc_name);
									capability.loc_shortName = capability.loc_name.substr(0,5);
								}

								this._cleanedImAccounts.push(capability);
								if (capability.capabilitySubtype === "SMS") {
									//ensure that a serviceName is specified for the SMS capability
									if (capability.serviceName !== "sms") {
										capability.serviceName = "sms";
									}
									this._accountTypes.sms = capability;
									this._accountTypes.mms = capability; // MMS is also this capability


 */
