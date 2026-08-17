/*jslint white: false, onevar: false, nomen:false, plusplus: false */
/*global DBModels, document DialingShortcuts, window, console, kit, SystemService, TelephonyService, _, ContactsUI, ContactsLib, Class, App, enyo, $L, $H, $break, Event, Future, MojoDB, mapReduce, MainStageName, setTimeout, clearTimeout, Messaging, AudioTag, Image, PalmSystem, TransportPickerModel, Template, CharacterCounter, MessagingDB, MessagingUtils, MessagingMojoService, ChatFlags, BucketDateFormatter, CONSTANTS, MenuWrapper, SetTopicAssistant*/
/* Copyright 2010 Palm, Inc.  All rights reserved. */

enyo.kind({
	name:"DBModels.PhoneCall",
	kind: enyo.Component,
	components: [
		{name: "put", kind: "DbService", method: "put", onSuccess: "putWriteCallback", onFailure: "putWriteFailure"}
	],
	constructor: function() {
		this.inherited(arguments);
	},
	statics: {
		dbKindId: "com.palm.phonecall:1",
		TYPES: {
			MISSED: 'missed',
			OUTGOING: 'outgoing',
			INCOMING: 'incoming',
			IGNORED: 'ignored'
		},
		getWatchQuery: function() {
			return {
				query: {
					from: this.dbKindId,
					where: [
						{ prop: "groups", op: "=", val: null }
					],
					orderBy: "timestamp", // operate on oldest first
					desc: false
				}
			};
		},
		// returns the 'remote' address that isn't this device. This is either 'to' or 'from' depending on type of call
		getRemoteAddress: function(phonecall) {
			return (phonecall.type === DBModels.PhoneCall.TYPES.OUTGOING ? phonecall.to[0] : phonecall.from);		
		}
	},
	// adds a phone call. 
	createPhoneCall: function(contact, type, ms_timestamp, duration, isVideo) {
		contact.decorated(enyo.bind(this, "_createAfterDecoration", contact, type, ms_timestamp, duration, isVideo));
	},
	_createAfterDecoration: function(contact, type, ms_timestamp, duration, isVideo) {
		var object, localAddr, remoteAddr, future;
		
		enyo.require(contact && 'address' in contact, "DbModels.PhoneCall.create: parameter missing required property 'address'");
		enyo.require(contact.transport, "DbModels.PhoneCall.create: parameter has no 'transport'");
		
		// phone-specific actions
		if (contact.transport === enyo.application.CallSynergizer.TRANSPORTS.TIL) {
			// don't log numbers with otasp prefix
			if (enyo.application.Utils.isOtaspNumber(contact.address)) {
				return;
			}
			// Only log emergency numbers if applicable
			if (enyo.application.Cache.hideEmergencyNumbersFromCallLog && enyo.application.Utils.isEmergencyNumber(contact.address)) {
				return;
			}
		}
		
		object = {};
		object._kind = DBModels.PhoneCall.dbKindId;
		object.timestamp = ms_timestamp;
		object.timestampInSecs = Math.round(ms_timestamp / 1000); // WORKAROUND NOV-93332. Bluetooth service can't currently read large numbers from json.
		object.type = type;
		object.duration = duration;
		object.groups = null;
		object.isVideo = isVideo;
		
		// TODO when we handle multiple local addresses
		localAddr = {
			addr: '',
			service: contact.transport 
		};
		
		// map a phone call line 'contact' to a call log 'address'
		remoteAddr = {
			addr: contact.address,
			service: contact.transport,
			
			// needed for the call log cleanup service
			normalizedAddr: contact.normalizedAddress,
			
			// store resolved person information, if available
			// the contact.plugin.phone will automatically keep this up-to-date
			name: contact.name,
			personId: contact.personId,
			personAddressType: contact.label,
			personGivenName: contact.personGivenName, // for Bluetooth service
			personFamilyName: contact.personFamilyName // for Bluetooth service
		};
		
		if ( type === DBModels.PhoneCall.TYPES.OUTGOING ) {
			object.to = [remoteAddr];
			object.from = localAddr;
		} else {
			object.to = [localAddr];
			object.from = remoteAddr;
		}
		
		var params = {objects:[object]};
		this.$.put.call(params);
	},
	
	putWriteCallback: function() {
	},
	
	putWriteFailure: function() {
	},
});

enyo.kind({
	name:"DBModels.Voicemail",
	kind: enyo.Object,
	constructor: function() {
		this.inherited(arguments);
	},
	statics: {
		dbKindId: "com.palm.vvm.voicemessages:1",
		mailBoxDbKindId: "com.palm.vvm.mailbox:1",
		getWatchQuery: function() {
			return {
				query: {
					from: DBModels.Voicemail.dbKindId,
					where: [
						{ prop: "noticed", op: "=", val: null }
					]
				},
				watch: true
			};
		},
		getUnreadWatchQuery: function() {
			return {
				query: {
					from: DBModels.Voicemail.dbKindId,
					where: [
						{ prop: "read", op: "=", val: false }
					],
					limit: 0
				},
				watch: true,
				count: true
			};
		},
		getMailBoxWatchQuery: function() {
			return {
				query: {
					from: DBModels.Voicemail.mailBoxDbKindId
				},
				watch: true
			};
		},
	}
});

enyo.kind({
	name:"DBModels.SmartMerge", kind: enyo.Component, components: [
		{name: "get", kind: "DbService", method: "find", onSuccess: "getCallback", onFailure: "genericFailure"},
		{name: "merge", kind: "DbService", method: "merge", onSuccess: "writeCallback", onFailure: "genericFailure"},
		{name: "put", kind: "DbService", method: "put", onSuccess: "writeCallback", onFailure: "genericFailure"}
	],
	create: function() {
		this.inherited(arguments);
		this.retries = 0;
	},
	execute: function(dbKind, recordId, updatefn, callback) {
		enyo.log("SmartMerge: "+dbKind+"   "+recordId);
		var params = {
			query: {
				where: [{"prop":"_id","op":"=","val":recordId}]
			}
		};
		this.$.get.call(params, {
			recordId: recordId,
			dbKind: dbKind,
			updatefn: updatefn,
			callback: callback
		});
	},
	getCallback: function(inSender, payload, request) {
		var obj;
		var params;
		var service;
		var result = payload.results ? payload.results[0] : undefined;
		obj = request.updatefn(result);
		obj._id = request.recordId;				

		if( result !== undefined ) {
			obj._kind = result._kind;
			//obj._rev = result._rev;
			obj._del = false;
			service = this.$.merge;
		} else {
			obj._kind = request.dbKind;
			service = this.$.put;
		}
		params = {objects:[obj]};

		service.call(params, {
			recordId: request.recordId,
			dbKind: request.dbKind,
			updatefn: request.updatefn,
			callback: request.callback
		});
	},
	writeCallback: function(inSender, payload, request) {
		request.callback();
		this.retries = 0;
	},
	genericFailure: function(inSender, payload, request) {
		if ( window.PalmSystem ) {
			if ( ++this.retries < 10 ) {
				enyo.log("DBModels.SmartMerge Failure! "+enyo.json.stringify(payload));
				enyo.log("Retrying: "+request.dbKind+" "+request.recordId);
				this.execute(request.dbKind, request.recordId, request.updatefn, request.callback);
			} else {
				enyo.log("DBModels.SmartMerge Failure! Giving up after 10 trials");
				this.retries = 0;
			}
		}
	}
});

enyo.kind({
	name:"DBModels.PhoneCallGroup",
	kind: enyo.Object,
	constructor: function() {
		this.inherited(arguments);
	},
	statics: {
		dbKindId: "com.palm.phonecallgroup:1",
		TYPES: {
			ALL: 'all',
			MISSED: 'missed'
		},
		
		// generates a call group id by hashing the day, remote address, and group type.
		// the phone call log is special in that we get to create our own ids to emulate a unique index
		generateId: function(type, phonecall) {
			var prefix, remote, address, date, day;

			// we need to be globally unique in mojodb, so make this app-specific
			prefix = String.prototype.concat(PalmSystem.identifier, ".callgroup");

			// groups are keyed on the remote address
			remote = DBModels.PhoneCall.getRemoteAddress(phonecall);

			// always prefer person id
			if ( remote.personId ) {
				address = "_ID_" + remote.personId;

			// or, if phone number (TIL) or a registered VoIP/IM transport (whatsapp/telegram/signal/
			// teams/...), use the normalized version so xxx-xxx-xxxx and 1+xxx-xxx-xxxx match, and
			// different call-log entries for the same IM contact group together
			} else if ( remote.normalizedAddr && (remote.service === enyo.application.CallSynergizer.TRANSPORTS.TIL
					|| (enyo.application.CallSynergizer.transports && enyo.application.CallSynergizer.transports[remote.service])) ) {
				address = "_PHONE_" + remote.normalizedAddr;

			} else {
				enyo.error("generateId: Unknown address type " + enyo.json.stringify(remote));
				address = Date.now();
			}

			// ...and keyed on the date. Y2K compliant!
			date = new Date(phonecall.timestamp);
			//Mojo.assert(date.valueOf(), "Phonecall "+JSON.stringify(phonecall)+" has an invalid timestamp");
			day = String.prototype.concat(date.getMonth(), "/", date.getDate(), "/", date.getFullYear());

			return [prefix, address, day, type].join('_');
		},
		
		getRelatedId: function(type, allGroupID) {
			var regEx, otherType;

			regEx = new RegExp(type + "$");

			if ( type == DBModels.PhoneCallGroup.TYPES.ALL ) {
				otherType = DBModels.PhoneCallGroup.TYPES.MISSED;
			} else {
				otherType = DBModels.PhoneCallGroup.TYPES.ALL;
			}

			enyo.require(allGroupID.match(regEx), "getRelatedId: id "+allGroupID+" isn't of type "+type);
			return allGroupID.replace(regEx, otherType);
		},
	}
});

enyo.kind({
	name: "DBModel.Accounts", 
	kind: enyo.Component, 
	events: {
		onGotAccounts: "",
	},
	components: [
		{name: "accountTemplatesService", kind: enyo.PalmService, service: enyo.palmServices.accounts, method: "listAccountTemplates", onSuccess: "listAccountTemplatesQueryResults", onFailure: "listAccountTemplatesQueryResults"},
		{name: "listAccountService", kind: enyo.PalmService, service: enyo.palmServices.accounts, method: "listAccounts", },
		{name: "appLaunchService", kind: enyo.PalmService, service: enyo.palmServices.application, method: "launch"},
		{name: "accountsWatch", kind:"DbService", method: "find", dbKind: "com.palm.account:1", onSuccess: "_accountsWatch", subscribe: true, reCallWatches: true},
	],
	create: function() {
		this.inherited(arguments);
		
		this.acctTemplateList = [];	
		this.$.accountTemplatesService.call({});
	},
	getAllAccounts: function() {
		this.$.listAccountService.call({}, {onSuccess: "listAccountQueryResults", onFailure: "listAccountQueryResults"});

		// start watching for accounts		
		if (!this.startWatchingForAccounts) {
			this.startWatchingForAccounts = true;
			this.$.accountsWatch.call();
		}
	},
	getPhoneCapabilityProvider: function(account){
		var len = account.capabilityProviders.length;
		for (var i = 0; i < len; i++) {
			if (account.capabilityProviders[i].capability === "PHONE") {
				return account.capabilityProviders[i];
			}
		}
	},
	getTemplateForAccount: function(account) {
		var len = this.acctTemplateList.length;
		for (var i = 0; i < len; i++) {
			if (this.acctTemplateList[i].templateId == account.templateId) {
				return this.acctTemplateList[i];
			}
		}
	},
	launchAccountSettingsUI: function(account, accountId) {
		if (account == undefined) {
			enyo.require(accountId, "A account or accountId is required");
			// find the account from the ID and the launch the UI
			this.accountIdToLaunch = accountId;
			this.$.listAccountService.call({}, {onSuccess: "_listAccountQueryResults", onFailure: "_listAccountQueryResults"});
			return;
		}

		var capabilityProvider = this.getPhoneCapabilityProvider(account);

		if (capabilityProvider && capabilityProvider.settingsUI) {
			var accountSettingsUI = capabilityProvider.settingsUI;
			var template = this.getTemplateForAccount(account);
			// TODO: cross app pushScene is not yet available in Enyo, enable this properly when it is... (At the moment just start the associated app)
			this.$.appLaunchService.call({
				"id": accountSettingsUI.appId,
				"name": accountSettingsUI.sceneName,
				"params": {"account": account, "template": template, "callingApp": "phone"}
			});

			/*
			this.controller.stageController.pushScene({
				appId: accountSettingsUI.appId,
				name: accountSettingsUI.sceneName
			}, {
				account: account,
				template: template,
				callingApp:"phone"
			});
			*/
		}
		//todo: remove this after skype transport add settingsUI in account template
		else if(capabilityProvider && capabilityProvider.serviceName === "type_skype") {
			var template = this.getTemplateForAccount(account);
			// TODO: cross app pushScene is not yet available in Enyo, enable this properly when it is... (At the moment just start the associated app)
			this.$.appLaunchService.call({
				"id": "com.palm.app.skype",
				"name": "accountlogin",
				"params": {"account": account, "template": template, "callingApp": "phone"}
			});

			/*
			this.controller.stageController.pushScene({
				appId: "com.skype.app.skypesearchdirectory",
				name: "accountlogin"
			}, {
				account: account,
				template: template,
				callingApp:"phone"
			});
			*/
		}
	},
	launchAddAccountUI: function() {
		this.$.appLaunchService.call({id: "com.palm.app.phoneaccounts"});
	},
	listAccountTemplatesQueryResults: function(inSender, response) {
		if(response.results) {
			this.acctTemplateList = (response && response.results) || [];
		}
	},
	listAccountQueryResults: function(inSender, response) {
		this.doGotAccounts(response);
	},
	_listAccountQueryResults: function(inSender, response) {
		if (response.results) {
			response.results.forEach(function(account) {
				if (account._id == this.accountIdToLaunch) {
					this.launchAccountSettingsUI(account);
				}
			}, this);
		}
	},
	_accountsWatch: function(inSender, payload) {
		this.getAllAccounts();
	},
});
