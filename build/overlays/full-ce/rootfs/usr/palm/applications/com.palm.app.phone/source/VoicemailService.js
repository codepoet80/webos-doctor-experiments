/*jslint white: false, onevar: false, nomen:false, plusplus: false */
/*global VoiceNumberCount, VoicemailService, DBModels, document DialingShortcuts, window, console, kit, SystemService, TelephonyService, _, ContactsUI, ContactsLib, Class, App, enyo, $L, $H, $break, Event, Future, MojoDB, mapReduce, MainStageName, setTimeout, clearTimeout, Messaging, AudioTag, Image, PalmSystem, TransportPickerModel, Template, CharacterCounter, MessagingDB, MessagingUtils, MessagingMojoService, ChatFlags, BucketDateFormatter, CONSTANTS, MenuWrapper, SetTopicAssistant*/
/* Copyright 2010 Palm, Inc.  All rights reserved. */
enyo.kind({
	name: "VoicemailService", 
	kind: enyo.Component, 
	pending: {},
	isInternetConnectionAvailable: true,
	components: [
		{name: "find", kind: "DbService", dbKind: "com.palm.vvm.voicemessages:1", method: "find", onSuccess: "findCallback", subscribe: true, reCallWatches: true},
		{name: "merge", kind: "DbService", dbKind: "com.palm.vvm.voicemessages:1", method: "merge", onSuccess: "writeCallback"}
	],
	statics: {
		_instance: undefined,
		
		// constant for a reported unknown count of voicemails
		// don't forget to use '===' when comparing to this
		kUnknownPositiveCount: {},
		
		getInstance: function() {
			if(VoicemailService._instance === undefined) {
				VoicemailService._instance = new VoicemailService();
			}
		}
	},
	create: function() {
		this.inherited(arguments);
		this.$.find.call(DBModels.Voicemail.getWatchQuery());

		this.startVoicemailCountWatch();
		this.startVoicemailNumberWatch();
	},
	
	findCallback: function(inSender, payload) {
		// Found unlinked call(s)
		this.startVvmService();
	},
	
	registerVoicemailCountQuery: function(cb) {
		if(this.voicemailCountCallbacks === undefined) {
			this.voicemailCountCallbacks = [];
		}
		this.voicemailCountCallbacks.push(cb);
		if(this.voicemailCountInstance !== undefined) {
			this.voicemailCountInstance.setCallbacks(this.voicemailCountCallbacks);
		}
	},
	
	unregisterVoicemailCountQuery: function(cb) {
		if(this.voicemailCountCallbacks) {
			enyo.remove(cb, this.voicemailCountCallbacks);
		}
		
		if(this.voicemailCountInstance !== undefined) {
			this.voicemailCountInstance.setCallbacks(this.voicemailCountCallbacks);
		}
	},

	startVoicemailCountWatch: function() {
		if(this.voicemailCountInstance === undefined) {
			this.voicemailCountInstance = new VoicemailService.VoiceNumberCount(this.voicemailCountCallbacks);
		}
	},
	
	stopVoicemailCountWatch: function() {
		if(this.voicemailCountInstance !== undefined) {
			this.voicemailCountInstance.cleanup();
			this.voicemailCountInstance = undefined;
		}
	},
	
	startVoicemailNumberWatch: function() {
		if(this.voicemailNumberInstance === undefined) {
			this.voicemailNumberInstance = new VoicemailService.VoiceNumberWatch();
		}
	},
	
	stopVoicemailNumberWatch: function() {
		if(this.voicemailNumberInstance !== undefined) {
			this.voicemailNumberInstance.cleanup();
			this.voicemailNumberInstance = undefined;
		}
	},
	
	restartVoicemailCountWatch: function() {
		this.stopVoicemailCountWatch();
		this.startVoicemailCountWatch();
	},
	
	startVvmService: function() {
		if(this.vvmService === undefined) {
			this.vvmService = new VoicemailService.VvmService();
		}
	},
	
	stopVvmService: function() {
		if(this.vvmService !== undefined) {
			this.vvmService.cleanup();
			this.vvmService = undefined;
		}
	},
	
	getVoicemailCount: function() {
		var count = 0;
		if(this.voicemailCountInstance !== undefined) {
			count = this.voicemailCountInstance.getCount();
		}
		return count;
	},
	
	enterVoicemail: function() {
		this.voicemailCountInstance.enterVoicemail();
	},
	
	setPendingReadCount: function(pendingCount) {
		this.voicemailCountInstance.setPendingReadCount(pendingCount);
	},
	
	setIgnoreVoicemailCountNotification: function(ignoreNotification) {
		this.voicemailCountInstance.setIgnoreVoicemailCountNotification(ignoreNotification);
	},
	
	getVoicemailNumber: function() {
		return this.voicemailNumberInstance.getNumber();
	},
	
	isVvmEnabled: function() {
		return this.vvmService && this.vvmService.isEnabled();
	},
	
	isCarrierVvmEnabled: function(service) {
		return this.vvmService && this.vvmService.isCarrierVvmEnabled(service);
	},
	
	getStatus: function(service) {
		return this.vvmService && this.vvmService.getStatus(service);
	},
	
	getCarrierName: function() {
		return this.vvmService && this.vvmService.getCarrierName();
	},
	
	isCarrierVvmPasswordEnabled: function(service) {
		return this.vvmService && this.vvmService.isCarrierVvmPasswordEnabled(service);
	},

	getLastSyncTime: function() {
		return this.vvmService && this.vvmService.getLastSyncTime();
	},

	isCarrierVoicemailEnabled: function() {
		return this.vvmService && this.vvmService.isCarrierVoicemailEnabled();
	},
	
	getGreetingPath: function() {
		return this.vvmService && this.vvmService.getGreetingPath();
	},

	getAccountSetupApp: function() {
		return this.vvmService && this.vvmService.getAccountSetupApp();
	},
	
	getMailboxServiceName: function() {
		return this.vvmService && this.vvmService.getMailboxServiceName();
	},
	
	getMailboxId: function() {
		return this.vvmService && this.vvmService.getMailboxId();
	},
	
	getGreetingNumber: function() {
		return this.vvmService && this.vvmService.getGreetingNumber();
	},
	
	refreshMessages: function(refreshOption) {
		if ( this.vvmService ) {
			enyo.log("phoneapp>> refreshMessages: " + refreshOption);
			this.vvmService.refreshMessages(refreshOption);
		}
	},
	setGreeting: function(greetingPathOrNull) {
		if ( this.vvmService ) {
			enyo.log("phoneapp>> setGreeting: " + greetingPathOrNull);
			this.vvmService.setGreeting(greetingPathOrNull);
		}
	},
	setInternetConnectionAvailable: function(isInternetConnectionAvailable) {
		this.isInternetConnectionAvailable = isInternetConnectionAvailable;
	},
	
	getInternetConnectionAvailable: function(isInternetConnectionAvailable) {
		return this.isInternetConnectionAvailable;
	},	
	
	isUnknownPositiveCount: function(count) {
		return (count === VoicemailService.kUnknownPositiveCount);
	},
});

// Process pending visual voicemails
enyo.kind({
	name: "VoicemailService.VvmService", 
	kind: enyo.Component, 
	pending: {},
	isCarrierVoicemail: true,
	greetingPath: "",
	service: "",
	carrierName: "",
	mailboxId: null,
	setGreetingNumber: null,
	accountSetupApp: null,
	lastSync: null,
	components: [
		{name:"find", kind: "DbService", method: "find", onSuccess: "findCallback", subscribe: true, reCallWatches: true},
		{name:"mailboxQuery", kind: "DbService", method: "find", onSuccess: "mailboxQueryCallback", subscribe: true, reCallWatches: true},
		{name:"personLookupQuery", kind:"Utils.PersonFind", onSuccess: "_personLookupComplete", onFailure: "_personLookupFailed"},
		{name:"sfrRefreshMessages", kind:"PalmService", service: "palm://com.palm.sfrvvm/", method: "refreshMessages", onFailure: "genericFailure" },
		{name:"smartMerge", kind: "DBModels.SmartMerge", count: 0},
		{name:"sfrSetGreetings", kind:"PalmService", service: "palm://com.palm.sfrvvm/", method: "setGreeting", onFailure: "genericFailure" },
	],
	
	create: function() {		
		this.inherited(arguments);
		
		// hash of pending phone calls we're currently operating on
		this.pending = {};

		// Query and subscribe to VVMs
		this.$.find.call(DBModels.Voicemail.getWatchQuery());
		this.$.mailboxQuery.call(DBModels.Voicemail.getMailBoxWatchQuery());
	},

	mailboxQueryCallback: function(inSender, payload) {
		// If there are no visual voicemails, then assume that it is not provisioned
		this.mailboxes = payload.results;
		enyo.log("this.mailboxes = " + JSON.stringify(this.mailboxes));
		
		this.isCarrierVoicemail = false;
		this.carrierName = null;

		// "true if we should NOT show the 'Call carrier voicemail' list item above the list of all vvms"
		// this.isCarrierVoicemail = (payload.isCarrierVoicemail == undefined || payload.isCarrierVoicemail == null || payload.isCarrierVoicemail) ? true : false;
		this.mailboxes.forEach(function(mailbox) {
			// Multiple carrier mailboxes???
			if (mailbox.service == "sfr" || mailbox.service == "verizon") {
				this.isCarrierVoicemail = (mailbox.isCarrierVoicemail == undefined || mailbox.isCarrierVoicemail == null || mailbox.isCarrierVoicemail) ? true : false;
				this.greetingPath = mailbox.greetingPath;
				this.setGreetingNumber = mailbox.setGreetingNumber;
				this.accountSetupApp = mailbox.accountSetupApp;
				this.carrierName = mailbox.service;
				if (mailbox.saveMessageResult == "success") {
					enyo.log("phoneapp>> clear saveMessageResult");
					this.clearSaveMessageResult(mailbox);
				}
			}
			this.service = mailbox.service;
			this.mailboxId = mailbox._id || null;
			this.lastSync = mailbox.lastSync;
		}, this);
	},
	
	findCallback: function(inSender, payload) {
		// If there are no visual voicemails, then assume that it is not provisioned
		if(this.isEnabled() && payload.results && payload.results.length > 0) {
			enyo.forEach(payload.results, enyo.hitch(this,this.handleNewVM));
		}
	},
	
	clearSaveMessageResult: function(mailbox) {
		var propsCallback = function(mailbox) {
			mailbox.saveMessageResult = "none";
			return mailbox;
		};

		var callback = enyo.hitch(this, function() {
			enyo.log("smartMerge completed.");
			enyo.windows.addBannerMessage($L("Saved. Connect to PC to retrieve."),"{}","images/notification-small-voicemail.png","none");
		});

		this.$.smartMerge.execute(DBModels.Voicemail.mailBoxDbKindId, mailbox._id, propsCallback, callback);
	},

	isCarrierVoicemailEnabled: function() {
		return this.isCarrierVoicemail;
	},
	
	getGreetingPath: function() {
		return this.greetingPath;
	},
	
	getAccountSetupApp: function() {
		return this.accountSetupApp;
	},
	
	getMailboxServiceName: function() {
		return this.service;
	},
	
	getMailboxId: function() {
		return this.mailboxId;
	},
	
	getGreetingNumber: function() {
		return this.setGreetingNumber;
	},
	
	isEnabled: function() {
		return this.mailboxes && this.mailboxes.length > 0;
	},
	
	isCarrierVvmEnabled: function(service) {
		if (this.isEnabled()) {
			for (var i = 0; i < this.mailboxes.length; i++) {
				if (this.mailboxes[i].service == service) {
					return true;
				}
			}
		}
		
		return false;
	},
	
	getStatus: function(service) {
		if (this.isEnabled()) {
			for (var i = 0; i < this.mailboxes.length; i++) {
				if (this.mailboxes[i].service == service) {
					return this.mailboxes[i].status;
				}
			}
		}
		
		return null;
	},
	
	/* only returns valid service name when the service is a carrier */
	getCarrierName: function() {
		return this.carrierName;
	},
	
	isCarrierVvmPasswordEnabled: function(service) {
		if (this.isEnabled()) {
			for (var i = 0; i < this.mailboxes.length; i++) {
				if ((this.mailboxes[i].service == service) && this.mailboxes[i].password && this.mailboxes[i].password != "") {
					return true;
				}
			}
		}
		
		return false;
	},
	
	getLastSyncTime: function() {
		return this.lastSync;
	},
	
	// Cache person info with each record for performance reasons
	handleNewVM: function(voicemail) {	
		// used in the case that voicemails are added faster than they can be operated on (such as by a script)
		if ( this.pending.hasOwnProperty(voicemail._id) ) {
			//enyo.log("We are already working on voicemail "+voicemail._id);
			return;
		}
		this.pending[voicemail._id] = true;
		
		this.addPersonInfo(voicemail, enyo.bind(this, function() {			
			var propsCallback = function() {
				voicemail.from.normalizedAddr = VoicemailService.normalizeNumber(voicemail.from.addr);
				voicemail.noticed = true;
				return voicemail;
			};

			var callback = enyo.hitch(this, function() {
				delete this.pending[voicemail._id];
			});
			
			this.$.smartMerge.execute(DBModels.Voicemail.dbKindId, voicemail._id, propsCallback, callback);
			
		}));
	},
	
	// Resolve contact information and add it to the voicemail object
	addPersonInfo: function(voicemail, callback) {		
		// don't resolve contact for a number from the blocked or unknown caller
		if (voicemail.from.addr === "blocked" || voicemail.from.addr === "blocked caller" ||
			voicemail.from.addr === "unknown" || voicemail.from.addr === "unknown caller") {
			enyo.log("phoneapp>> don't resolve contact for a number from the blocked or unknown caller");
			callback();
		}
		else {
			this.$.personLookupQuery.findByPhone(voicemail.from.addr, {
				callback: callback,
				voicemail: voicemail
			});
		}
	},
	
	_personLookupComplete: function(inSender, response, request) {
		var voicemail = request.voicemail;
		if ( response.person ) {
			// these derived attributes are cached for performance
			voicemail.from.name = enyo.application.Utils.PersonDisplayName(response.person);
			voicemail.from.personId = response.person._id;
			voicemail.from.personAddressType = (response.person.item && response.person.item.type);
			// add additional info
			voicemail.listPhotoPath = (response.person.photos.listPhotoPath && response.person.photos.listPhotoPath.length > 0)
																	? response.person.photos.listPhotoPath
																	: "";
			voicemail.phoneNumbers = response.person.phoneNumbers;
			voicemail.favorite = response.person.favorite;
		}
		if(request.callback !== undefined) {
			request.callback();
		}
	},
	_personLookupFailed: function(inSender, payload, request) {
		enyo.error("personLookupQuery failed "+enyo.json.stringify(payload));
	},	
	// TODO: This is not working correctly since person.phonenumbers is not populated
	getAddressType: function(person, phonenumber) {
		var normalizedAddr, addr;
		// todo NOV-97361
		normalizedAddr = VoicemailService.normalizeNumber(phonenumber);
		enyo.forEach(person.phonenumbers, function(val) {
			addr = (VoicemailService.normalizeNumber(val.phonenumber) === normalizedAddr);
		});
		return addr && addr.type;
	},
	// refreshes all mailboxes
	refreshMessages: function(refreshOption) {
		if (refreshOption === null || refreshOption === undefined || refreshOption != "force") {
			refreshOption = "normal";
		}
		this.mailboxes.forEach(function(mailbox) {
			if ( mailbox.service == "sfr" /* this may not be right */ ) {
				this.$.sfrRefreshMessages.call();
			}
			else if ( mailbox.service == "verizon" ) { // other carriers, etc
				var propsCallback = function(mailbox) {
					mailbox.refreshMessages = refreshOption;
					return mailbox;
				};

				var callback = enyo.hitch(this, function() {
					enyo.log("smartMerge completed.");
				});

				this.$.smartMerge.execute(DBModels.Voicemail.mailBoxDbKindId, mailbox._id, propsCallback, callback);
			} else { // other carriers, etc
				// set 'refreshMessages' bit in the mailbox entry (use mailbox._id)
			}
		},this);
	},
	// setGreeting for sfrvvm
	setGreeting: function(greethingpath) {
		var params = {"filePath":greethingpath} ;
		enyo.log("setGreeting params!!:" + params);
		this.$.sfrSetGreetings.call(params);
	},
	genericFailure: function(inSender, response, request) {
		enyo.error(request.service + request.method + " failed with " + enyo.json.stringify(response));
	},
	cleanup: function() {
		this.$.find.cancel();
	}
});

// Update the voicemail count, whether it is a VVM or traditional voicemail
enyo.kind({
	name: "VoicemailService.VoiceNumberCount", 
	kind: enyo.Component, 
	pending: {},
	_count: -1,
	components: [
		{name: "find", kind: "DbService", method: "find", onSuccess: "findCallback", subscribe: true, reCallWatches: true},
		//{name:"voicemailTilCountQuery", kind:"PalmService", service: "palm://com.palm.telephony/", method: "voicemailCountQuery", onSuccess: "_voicemailTilCountQueryComplete", onFailure: "_voicemailTilCountQueryFailed", subscribe: true}, ANUPAM
		{name: "voicemailTilCountQuery", kind: enyo.PalmService, service: enyo.palmServices.telephony, subscribe: true, method: "voicemailCountQuery", onSuccess: "_voicemailTilCountQueryComplete", onFailure: "_voicemailTilCountQueryFailed"},
		{name: "displayOn", kind: enyo.PalmService, service: "palm://com.palm.display/control/", method: "setState", onSuccess: "", onFailure: ""},
	],
	create: function(voicemailCountCallbacks) {
		this.inherited(arguments);
		this.voicemailCountCallbacks = voicemailCountCallbacks;
		var params = DBModels.Voicemail.getUnreadWatchQuery();
		// MRA-6517: register TIL voicemail count query regardless vvm setup
		this.$.voicemailTilCountQuery.call();
		this.$.find.call(params);
	},
	
	findCallback: function(inSender, payload) {
		if(payload.count === 0) {
			if(this._count !== -1) {
				// The phone just started, Let the TIL callback determine if we really have 0 voicemails right now
				// This w
				this.setCount(payload.count);
			}
		} else {
			this.setCount(payload.count);
		}
	},
	setCallbacks: function(voicemailCountCallbacks) {
		this.voicemailCountCallbacks = voicemailCountCallbacks;
	},
	_voicemailTilCountQueryComplete: function(inSender, payload) {
		var voicemailCount, highPriority;
		voicemailCount = 0;
		highPriority = false;
		
		if (payload.extended) {
			voicemailCount = payload.extended.line1;
			highPriority = payload.extended.high;
			
		} else if (payload.eventVoicemail) {
			voicemailCount = payload.eventVoicemail.line1;
			highPriority = payload.eventVoicemail.high;
			
		} else {
			enyo.error("TelephonyEventListener::subscribeVoicemail unknown vm message: "+enyo.json.stringify(payload));
		}
		
		// TIL sends '255' if it doesn't know the count, use our constant instead
		if ( voicemailCount === 255 ) {
			voicemailCount = VoicemailService.kUnknownPositiveCount;
		}
		
		// MRA-6517: send refresh message to the vvm service when the verizon vvm is enabled and TIL voicemail comes.
		if (voicemailCount > 0 && enyo.application.VoicemailService.isVvmEnabled()) {
			enyo.application.VoicemailService.refreshMessages("force");
		}

		this.setCount(voicemailCount, highPriority);
	},
	
	clearUpdateTimer: function() {
		if (this.updateTimerHandle) {
			clearTimeout(this.updateTimerHandle);
			this.updateTimerHandle = undefined;
		}
	},

	// The update timer will prevent the list from rerfreshes
	startUpdateTimer: function() {
		this.clearUpdateTimer();

		this.updateTimerHandle = setTimeout(enyo.bind(this, "updateTimer"), 2500);
	},
	
	updateTimer: function() {
		this.clearUpdateTimer();

		this.updateCount();
	},
	
	setIgnoreVoicemailCountNotification: function(ignoreNotification) {
		this.ignoreNotification = ignoreNotification;
	},
	
	setPendingReadCount: function(pendingVoicemailCount) {
		var displayCount = this._count - pendingVoicemailCount;
		if (displayCount < 0) displayCount = 0;
		enyo.log("phoneapp>> setPendingReadCount(): displayCount = " + displayCount + ", _count = " + this._count + ", pendingVoicemailCount = " + pendingVoicemailCount);

		enyo.forEach(this.voicemailCountCallbacks, enyo.hitch(this,function(callback) {
			// MRAY-3102: error tolerant from callback fn 
			try {
				callback(displayCount, !!this._highPriority);
			} catch (err) {
				enyo.error("phoneapp>> counter error = " + err.toString());
			}
		}));
		
		this.announceVoicemail(displayCount, this._highPriority, false);		
	},
	
	setCount: function(voicemailCount, highPriority) {
		// TODO: counter update timer here
		if (voicemailCount !== this._count) {
			this._count = voicemailCount;
			this._highPriority = highPriority;
			this.startUpdateTimer();
		}
	},
	
	updateCount: function() {
		enyo.log("phoneapp>> delayed setCount(): _count = " + this._count);
		enyo.forEach(this.voicemailCountCallbacks, enyo.hitch(this,function(callback) {
			// MRAY-3102: error tolerant from callback fn 
			try {
				callback(this._count, !!this._highPriority);
			} catch (err) {
				enyo.error("phoneapp>> counter error = " + err.toString());
			}
		}));
		
		// Don't announce the change in voicemail count if:
		//   - this is our first retrieval of the VM count (_count == -1)
		//   - we found out we have 0 voicemails (_count == 0)
		//   - our count went down
		//if(voicemailCount === VoicemailService.kUnknownPositiveCount || (voicemailCount > this._count && this._count >= 0)) {
			// announce voicemail, dont announce on the first update though	
			if (this.ignoreNotification) {
				this.announceVoicemail(this._count, this._highPriority, false);
				this.ignoreNotification = false;
			}
			else {
				this.announceVoicemail(this._count, this._highPriority, true);
			}
		//}

		enyo.log("Updating Voicemail Count: " + this._count);
	},
	
	getCount: function() {
		var count = this._count;
		if(count < 0) {
			count = 0;
		}
		return count;
	},
	
	announceVoicemail: function(count, high, notification) {	
		// not valid in first use
		if (window.PalmSystem && window.PalmSystem.isMinimal) {
			return;
		}

		if (count === VoicemailService.kUnknownPositiveCount || count > 0 ) {
			var bannerMsg;
			var voicemailHigh = $L("- URGENT");
			if (count === VoicemailService.kUnknownPositiveCount) {
				bannerMsg = enyo.application.Utils.interpolate($L("New message #{high}"), {"high": (high ? voicemailHigh : "")});
			} else {
				bannerMsg = enyo.application.Utils.formatChoice(
								$L("1#1 message #{high}|##{count} messages #{high}"),
								count,
								{"count": count, "high": (high ? voicemailHigh : "")});
			}

        		// turn display on
			this.$.displayOn.call({"state" : "on"});
			
			//Play alert notification
			// MRAY-3102 don't play alert if count is changed because user heard a message
			if ( window.PalmSystem && notification ) {
				window.PalmSystem.playSoundNotification("notifications");
			}
                        
        		//Add dashboard message
        		this.addVoicemailDash(bannerMsg);

		        //Add banner message
				// MRAY-3102 don't play alert if count is changed because user heard a message
			if (notification) {
		        	enyo.windows.addBannerMessage(bannerMsg, "{}");
			}
		
		}
		else if (count == 0) {
			if(this.voicemaildash) {
				this.voicemaildash.setLayers([]);
			}
		}
	},	

	cleanup: function() {
		this.$.find.cancel();
	},	
	
	//Voicemail dash
	addVoicemailDash: function(dashText) {
		enyo.log("addvoicemailDash");

		if(!this.voicemaildash) {
			enyo.log("Create new voicemail dashboard window");
			this.voicemaildash = this.createComponent({
				kind:"enyo.Dashboard",
				smallIcon: "images/notification-small-voicemail.png",
				onTap: "voicemailDashTap",
			}, {"owner": this});
		}
		this.voicemaildash.setLayers([{"icon": "images/notification-large-voicemail.png","title":$L("Voicemail"), "text": dashText}]);
	},
	voicemailDashTap: function (inSender, layer, event) {
		this.voicemaildash.pop();
		// enyo.application.UI.event("dial",{voicemail:true});
		this.enterVoicemail();	
	},
	enterVoicemail: function() {
		// CASE: vvm not enabled
		if ( ! enyo.application.VoicemailService.isVvmEnabled() ) {
			var number = enyo.application.VoicemailService.getVoicemailNumber();
			if ( ! number ) {
				var params = {launchType: "noVoicemailNumber"};
				enyo.application.UI.event("voicemail", params);
			} else {
				enyo.application.CallSynergizer.dial(number);
			}
		// CASE: vvm enabled, always to it
		} else {
			enyo.application.UI.event("voicemail", {});
		}
	}
});

// helper class retrieves the device's voicemail number from a variety of sources (in order):
// 1) luna-send -n 1 -f palm://com.palm.telephony/voicemailNumberQuery '{"subscribe":true}'
// 2) luna-send -n 1 -f palm://com.palm.db/find '{"query":{"from":"com.palm.carrierdb.settings.current:1"}}' | grep voicemail
// 3) luna-send -n 1 -f palm://com.palm.telephony/phoneNumberQuery '{}'
// Sets Voicemail._number
enyo.kind({
	name: "VoicemailService.VoiceNumberWatch", 
	kind: enyo.Component, 
	pending: {},
	components: [
		{name: "voicemailNumberQuery", kind: enyo.PalmService, service: enyo.palmServices.telephony, subscribe: true, method: "voicemailNumberQuery", onSuccess: "_voicemailNumberQueryComplete", onFailure: "_voicemailNumberQueryFailed"},
		{name:"carrierDbQuery", kind: "DbService", dbKind: "com.palm.carrierdb.settings.current:1", method: "find", onSuccess: "_carrierDbQueryComplete", onFailure: "_carrierDbQueryFailed", subscribe: true, reCallWatches: true},
		{name:"phoneNumberQuery", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "phoneNumberQuery", onSuccess: "_phoneNumberQueryComplete", onFailure: "_phoneNumberQueryFailed", subscribe: true}
	],
	create: function() {		
		this.inherited(arguments);
		this.$.voicemailNumberQuery.call();
	},
	_voicemailNumberQueryComplete: function(inSender, payload) {
		var number = payload.extended.number;
		// temp workaround for NOV-107048 and NOV-107622
		if(VoicemailService.normalizeNumber(number) !== "") {
			this.setVoicemailNumber(number);
			this.$.carrierDbQuery.cancel();
		} else {
			this.$.carrierDbQuery.call();
		}
	},
	_carrierDbQueryComplete: function(inSender, payload) {
		var number;
		if(payload.results !== undefined && payload.results.length > 0) {
			number = payload.results[0].voicemailNumber;
		}
		if(VoicemailService.normalizeNumber(number) !== "") {
			number = payload.results[0].voicemailNumber;
			this.setVoicemailNumber(number);
		} else {
			//enyo.log( "_carrierDbQueryComplete didn't get voicemail number from carrierDB; getting device's phone number");
			
			// TODO can use enyo.application.TelephonyStatusInterface.phoneNumber instead of calling this again
			this.$.phoneNumberQuery.call();
		}
	},
	_phoneNumberQueryComplete: function(inSender, payload) {
		if (payload.extended !== undefined) {
			var number = payload.extended.number;
			this.setVoicemailNumber(number);
		} else {
			enyo.log( "_phoneNumberQueryComplete failed to get number");
		}
	},
	_voicemailNumberQueryFailed: function(inSender, payload) {
		enyo.log("voiceNumberQuery Failed!!");
	},
	_carrierDbQueryFailed: function(inSender, payload) {
		enyo.log("carrierDbQuery Failed!!");
	},
	_phoneNumberQueryFailed: function(inSender, payload) {
		enyo.log("phoneNumberQuery Failed!!");
	},
	setVoicemailNumber: function(number) {
		enyo.log("Updating Voicemail Phonenumber: "+number);
		this._number = number;
		// TODO: Launch Voicemail?
		return true;
	},
	getNumber: function() {
		return this._number;
	},
	cleanup: function() {
		//Nothing to delete
	}
});


// strips characters that aren't valid for dialing at all
VoicemailService.normalizeNumber = function(number) {
	var validDigits = "+01234567890*#pwt";
	
	var out = "";
	if(number == undefined) {
		return "";
	}
	
	for (var i = 0; i < number.length; i++) {
		var curDigit = number.charAt(i);
		if (validDigits.indexOf(curDigit) >= 0) {
			out += curDigit;
		}
	}
	
	// numbers starting with p or w aren't valid
	if (out.length > 0) {
		var firstDigit = out.charAt(0);
		switch (firstDigit) {
			case 'p':
			case 'w':
			case 't':
				enyo.log("invalid digits");
				return "";
		}
	}
	
	return out;
};
