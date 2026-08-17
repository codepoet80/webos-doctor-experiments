enyo.kind({
	name: "phoneAppMenu",
	kind: enyo.AppMenu,
	scrim: true,
	lazy: false,
	events: {
		onCopy: "",
		onPaste: "",
		onLaunchingPreferences: ""
	},
	components: [
		//Edit menu
		{name: "editMenu", kind: enyo.EditMenu, selectAllDisabled: true, onCopy: "doCopy", onPaste: "doPaste", showShortcuts:true},
		
		//CallHistory
		{name: "clearCallHistory", caption: $L("Clear Call History"), onclick: "clearCallHistory", showing: false},
		{name: "purgeCallHistory", kind: "PalmService", service: enyo.palmServices.database, method: "del"},
		{name: "clearCallHistoryPrompt", align: "center", kind: "DialogPrompt",
			title: $L("Clear Call History"),
			message: $L("Are you sure you want to clear all of the calls in your call history?"),
			acceptButtonCaption: $L("Clear Call History"),
			cancelButtonCaption: $L("Cancel"),
			onAccept: "clearCallHistoryConfirm",
		},
		//Voicemail
		{name: "voicemailGreeting", caption: $L("Voicemail Greeting"), onclick: "voicemailGreeting", showing: false},
		{name: "callVoicemail", caption: $L("Call Voicemail"), onclick: "callVoicemail", showing: false},
		{name: "refreshVoicemail", kind: "Item", layoutKind: "VFlexLayout", className: 'item-label', onclick: "refreshedVoicemail", showing: false, components: [
			{kind: enyo.Label, content: $L("Refresh Voicemail"), className: 'item-label'},
			{kind: enyo.Label, name: "lastSync", content: "Synched: 12/8/10, 12:00PM", style: "font-size: 14px;color: darkgray;"},
		]},
		{name:"noVoicemailNumberPrompt", kind: "NoVoicemailNumberPrompt",},
		{name:"noVoicemailGreetingNumberPrompt", kind: "DialogPrompt", 
			message: $L("Unable to find voicemail greeting number."),
			acceptButtonCaption: $L("OK"),
			cancelButtonCaption: null
		},
		
		//Sounds & Ringtones
		{name: "soundsAndRingtones", caption: $L("Sounds & Ringtones"), onclick: "sounds"},
		{name:"launchSoundsAndAlerts", kind:"PalmService",  service: enyo.palmServices.application, method: "open", params: {id: "com.palm.app.soundsandalerts"}},
				
		//Preferences
		{name: "preferencesAndAccounts", caption: $L("Preferences & Accounts"), onclick: "preferences"},
		
		//Network alerts
		{name: "networkAlerts", kind: "NetworkAlerts", onTap: "onTapHandlerFn"},
		
		//Help menu
		{kind: enyo.HelpMenu, target: 'http://help.palm.com/phone/index.html'}
	],
	create: function() {
		this.inherited(arguments);
	},
	clearCallHistory: function() {
		enyo.application.isTablet ? this.$.clearCallHistoryPrompt.openAtCenter() : this.$.clearCallHistoryPrompt.open();
	},
	voicemailGreeting: function() {
		var service = enyo.application.VoicemailService.getMailboxServiceName();
		if (service == "sfr" /* this may not be right */ ) {
			enyo.application.UI.enter('voicemailgreeting');
		}
		else if ( service == "verizon" ) { // other carriers, etc
			var number = enyo.application.VoicemailService.getGreetingNumber();
			if ( ! number ) {
				this.$.noVoicemailGreetingNumberPrompt.open();
			} else {
				enyo.application.CallSynergizer.dialThrough(number);
			}
		}
		else {
			enyo.error("Unknown service provider: " + service);
		}
	},
	callVoicemail: function() {
		var number = enyo.application.VoicemailService.getVoicemailNumber();
		if ( !number ) {
			enyo.application.isTablet ? this.$.noVoicemailNumberPrompt.openAtCenter() : this.$.noVoicemailNumberPrompt.open();
		} else {
			// Always specifiy a transport to avoid having the Cache.phonePreferredDomesticPhoneService from opening the PreferredPhSvcDlg
			enyo.application.CallSynergizer.dial(number, undefined, undefined, enyo.application.CallSynergizer.TRANSPORTS.TIL);
		}
	},
	refreshedVoicemail: function() {
		this.close();
		if (!enyo.application.VoicemailService.getInternetConnectionAvailable()) {
			enyo.log("airplane>> refreshedVoicemail:getInternetConnectionAvailable() == false");
			this.$.networkAlerts.push({type: "voice"});
		}
		enyo.application.VoicemailService.refreshMessages("force");
	},
	sounds: function() {
		this.$.launchSoundsAndAlerts.call();
	},
	preferences: function() {
		this.doLaunchingPreferences();
		if (enyo.application.UI.getCurrentState() === 'preferences_card') {
			enyo.application.UI.event('changeView');
		} else {
			enyo.application.UI.event('preferences');
		}
	},
	clearCallHistoryConfirm: function() {
		//luna-send -a com.palm.app.phone -n 1 luna://com.palm.db/del '{"query":{"from":"com.palm.phonecallgroup:1"},"purge":false}'
		this.$.purgeCallHistory.call({
			"query":{"from":"com.palm.phonecallgroup:1"},"purge":false
		}, {
			onSuccess: "_onPurgePhoneCallGroupSuccess"
		});
		
		enyo.application.CallSynergizer.clearMissedDash();
	},
	_onPurgePhoneCallGroupSuccess: function(inSender, response) {
		this.$.purgeCallHistory.call({
			"query":{"from":"com.palm.phonecall:1"},"purge":false
		});
	},
	openMenu : function(bShowCallHistory, isVoicemail) {

                this.$.editMenu.setShowing(false);

                if ("firstlaunch_card"==enyo.application.UI.getCurrentState()) {
                 
                    this.$.soundsAndRingtones.setShowing(false);

                    if (enyo.application.Cache.platformType == "none") {
		        this.$.preferencesAndAccounts.setShowing(false);
                    } else {
                        // allow user to access Security and Networking
		        this.$.preferencesAndAccounts.setShowing(true);
                    }

                } else { 

                    this.$.soundsAndRingtones.setShowing(true);
	            this.$.preferencesAndAccounts.setShowing(true);
		    this.$.clearCallHistory.setShowing(bShowCallHistory);
		    if (isVoicemail) {
			    var carrierName = enyo.application.VoicemailService.getCarrierName();
			    if (carrierName == "verizon") {
				    this.$.callVoicemail.setShowing(true);
			    }
			    else if (carrierName == "sfr") {
				    this.$.voicemailGreeting.setShowing(true);
			    }
			
			    var lastSync = enyo.application.VoicemailService.getLastSyncTime();
			    var lastSyncStr;
			    if (lastSync) {
				    lastSyncStr = enyo.application.Utils.interpolate($L("Synched: #{lastSyncDT}"), 
					    {"lastSyncDT": enyo.application.Utils.formatDateTime(new Date(lastSync))});
			    }
			    else {
				    lastSyncStr = $L("No sync information");
			    }
			    this.$.lastSync.setContent(lastSyncStr);
			    this.$.refreshVoicemail.render();
			    this.$.refreshVoicemail.setShowing(true);
		    }
		    else {
			    this.$.callVoicemail.setShowing(false);
			    this.$.voicemailGreeting.setShowing(false);
			    this.$.refreshVoicemail.setShowing(false);
		    }
                } 
		
		// always collapse the edit menu before opening the app menu
		this.$.editMenu.setOpen(false);
		// reset the state of the items in the edit
		this._updateEditMenuState();
		
		this.open();
	},
	_updateEditMenuState: function() {	
		var bDisable = !(enyo.application.UI.getCurrentState() === "dialpad_card");
		this.$.editMenu.setCutDisabled(bDisable);
		this.$.editMenu.setCopyDisabled(bDisable);
		this.$.editMenu.setPasteDisabled(bDisable);
	},
});
