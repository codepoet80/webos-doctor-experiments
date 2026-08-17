/*jslint white: false, onevar: false, nomen:false, plusplus: false */
/*globals enyo */

enyo.kind({
	name: "InternationalCallsPref",
	kind: enyo.VFlexBox,
	className: "enyo-bg",
	events: {
		onShowRegion: "",
                onEditAccount: "",
                onAddAccount: "",
	},
	components: [
	
		{name: "serviceHint", className:"accounts-body-title"},
	
		{kind: "RowGroup", name: "domesticPrefCallServiceRow", caption: $L("DOMESTIC CALLS"), showing: false, components: [ 
		{kind: "Item", layoutKind: "HFlexLayout", align: "center", components: [
			{w: "fill", content: $L("Use"), className: "default-row"},      
		   // The calling-account choices (Signal/Telegram/WhatsApp/...) are filled in dynamically from the
		   // enabled PHONE-capable Synergy accounts in onGotAccounts(); only Bluetooth (cellular) and
		   // "Always Ask" are fixed. See buildCallServiceItems().
		   {kind: "ListSelector", value: "none", name: "domesticPrefCallService", onChange: "onDomesticSelectorChanged", items:[
               {caption: $L("Bluetooth"), value: "com.palm.telephony"}, // value must match string in: CallSynergizer.TRANSPORTS.TIL
               {caption: $L("Always Ask"), value: "none"}
	       ]}
		]}			   
	]},
      
       {kind: "RowGroup", name: "internationalPref", caption: $L("CALLS"), components: [
           {layoutKind: "HFlexLayout", name: "internationalDialingRow", align: "center", tapHighlight: false, showing: false, components: [
                     {content: $L("International Dialing"), flex: 1},
                     {name: "internationalDialingToggle", kind: "ToggleButton", onChange: "internationalDialingTap", state: false}
			]},
			{kind: "Item", layoutKind: "HFlexLayout", align: "center", name: "preferredIntlCallServiceItem", components: [
				{w: "fill", content: $L("Use"), className: "default-row"},
				// Calling-account choices filled in dynamically from enabled PHONE accounts (onGotAccounts).
				{kind: "ListSelector", value: "none", name: "preferredIntlCallServiceRow", onChange: "selectorChanged", items: [
					{caption: $L("Bluetooth"), value: "com.palm.telephony"}, // value must match string in: CallSynergizer.TRANSPORTS.TIL
					{caption: $L("Always Ask"), value: "none"}
				]}
			]}
		]},
		
        //<!-- generic accounts from accounts library -- only enabled if PHONE template(s) exists -->
        {name: "accountgroup", kind: "RowGroup", caption: $L("Accounts"), components: [
            {name: "accountsList", kind: "Accounts.accountsList", onAccountsList_AccountSelected: "editAccount"}
        ]},

		// This control uses the enyo version of com.palm.app.skype and accounts library.
		{name: "addAccountButton", kind: "Button", content: $L("Add account"), onclick: "addAccountHandler"},
		{name: "addVvmAccountButton", kind: "Button", content: $L("Add Visual Voicemail"), onclick: "addVvmAccountHandler", showing: false},

		//Service calls
		{name: "prefService", kind: enyo.PalmService, service: enyo.palmServices.system},
		{name: "appLauncher", kind: enyo.PalmService, service: enyo.palmServices.application, method: "launch"},
        {kind: "Accounts.getAccounts", name: "listAccounts", onGetAccounts_AccountsAvailable: "onGotAccounts"},
		{name: "vvmFirstLaunchPref", kind:"PalmService", service: enyo.palmServices.system, params:{keys:["phoneAppShouldShowVoicemailFirstLaunch"]}, method:"getPreferences", onSuccess:"vvmFirstLaunchPrefResponse", onFailure:"genericFailure"},
		{name: "mailboxQuery", kind: "DbService", method: "find", onSuccess: "mailboxQueryCallback", subscribe: true, reCallWatches: true},
		{name: "simStatus", kind: enyo.PalmService, service: enyo.palmServices.telephony, subscribe: true, method: "simStatusQuery", onSuccess: "simStatusResponse", onFailure: "simStatusResponse"},		
	],
	
	create: function() {
		this.inherited(arguments);

		this.accList = [];
        this._accountTemplates = undefined;
        this._savedDomestic = undefined;   // saved call-service prefs, applied after the dynamic
        this._savedIntl = undefined;       // item list is built (see populateCallServiceSelectors)

		this.showPreferredService();
		this.$.serviceHint.setContent($L("Choose a default service for placing calls when a calling account or a phone is connected to this device."));

		this.$.prefService.call({
			"keys": ["phonePreferredIntlPhoneService", "phoneInternationalDialingActive", "phoneInternationalDialingRegionId", "phonePreferredDomesticPhoneService"]
		},{
			method: "getPreferences",
			onSuccess: "updateInternationalDialingSettings", 
			onFailure: "updateInternationalDialingSettings"
		});
		
        this.$.accountsList.getAccountsList("PHONE", "com.palm.palmprofile");
        this.getAccounts();

		this.$.vvmFirstLaunchPref.call();

		this.$.mailboxQuery.call(DBModels.Voicemail.getMailBoxWatchQuery());
		this.$.simStatus.call();		
	},
	
	updateCallService: function() {
		this.showPreferredService(); 
	},
	
	showPreferredService: function() {
		//3G with SIM, show different for domestic and international
		if (enyo.application.Cache.platformType !== "none" && enyo.application.Cache.simState === "simready") {
			this.$.domesticPrefCallServiceRow.show();                       
			this.$.internationalPref.setCaption($L("INTERNATIONAL CALLS"));
			this.$.internationalDialingRow.show();
		} else { //wifi or 3G with no SIM
			this.$.domesticPrefCallServiceRow.hide();                       
			this.$.internationalPref.setCaption($L("CALLS"));
			this.$.internationalDialingRow.hide();
		}			
	},	
	
	simStatusResponse: function(inSender, response) {
		enyo.log("simStatusResponse  " + enyo.json.stringify(response));	
		if (response && response.extended) {
			var state = response.extended.state;
			enyo.application.Cache.simState = state; 
			if (this.simState !== enyo.application.Cache.simState){
				this.showPreferredService();
				this.simState = enyo.application.Cache.simState; 
			}
		}
	},	
	
	mailboxQueryCallback: function(inSender, payload) {
		this.$.vvmFirstLaunchPref.call();
	},

	// Shows "Add Visual Voicemail" button only when the service is verizon and vvm mailbox is not created.
	vvmFirstLaunchPrefResponse: function(inSender, response) {
		var showVerizonFirstLaunch = response.phoneAppShouldShowVoicemailFirstLaunch;
		var carrierName = enyo.application.VoicemailService.getCarrierName();
		if ( showVerizonFirstLaunch && carrierName != "verizon") {
			this.$.addVvmAccountButton.setShowing(true);
		}
		else {
			this.$.addVvmAccountButton.setShowing(false);
		}
		this.$.addVvmAccountButton.render();
	},

	getListItem: function(inSender, inIndex) {
		if(inIndex < this.accList.length) {
			var account = this.accList[inIndex];
			var capabilityProvider = this.$.accounts.getPhoneCapabilityProvider(account);
			this.$.itemTitle.setContent(account.loc_name);
			this.$.itemUsername.setContent(account.username);
			this.$.itemImg.setSrc(account.icon ? account.icon.loc_32x32 : "");
			return true;
		}
	},
	
        // User tapped "Add account". A calling account is a Synergy account (WhatsApp/Telegram/Signal/...),
        // which is set up in the Accounts app - open it rather than the in-Phone add UI so the whole
        // account lifecycle (add/edit/remove) lives in one consistent place.
	addAccountHandler: function () {
         this.$.appLauncher.call({id: "com.palm.app.accounts"});
	},

        // User tapped on account to edit. These accounts are listed here because they're usable as VOIP
        // call providers, but the account itself must be managed/removed from the Accounts app, not inside
        // the Phone card (which is the legacy Skype-provider behaviour). Hand messaging connectors (any
        // account that also has a MESSAGING capability) off to com.palm.app.accounts, deep-linked straight
        // to "Change Login Settings" (changelogin) rather than the full modify-account overview - that's
        // the actual maintenance action for these accounts, and skips an extra tap.
        editAccount: function(inSender, inResults) {
                var account = inResults && inResults.account;
                if (this.isMessagingConnectorAccount(account)) {
                        this.$.appLauncher.call({
                                id: "com.palm.app.accounts",
                                params: {launchType: "changelogin", accountId: account._id}
                        });
                        return;
                }
                this.doEditAccount(inSender, inResults);
        },

        // True if the account also carries a MESSAGING capability (a messaging connector that merely declares
        // PHONE for calling), as opposed to a pure telephony/VOIP-provider account.
        isMessagingConnectorAccount: function(account) {
                var caps = (account && account.capabilityProviders) || [];
                for (var i = 0; i < caps.length; i++) {
                        if (caps[i].capability === "MESSAGING") return true;
                }
                return false;
        },

	addVvmAccountHandler: function() {
		var accountSetupApp = enyo.application.VoicemailService.getAccountSetupApp();
		if (accountSetupApp === undefined || accountSetupApp == null || accountSetupApp == "") {
			accountSetupApp = "com.palm.app.vzwvvm";
		}
		enyo.log("phoneapp>> launch account setup app = " + accountSetupApp);
		this.$.launchApplication.call({
			id: accountSetupApp,
		});
	},

	//update user's preference on what to use to call
	updateInternationalDialingSettings: function(inSender, payload) {
		if (payload.returnValue) {

			// Remember the saved choices so populateCallServiceSelectors can re-apply them after it
			// (re)builds the dynamic item list, regardless of which async callback lands first.
			// "none" default must match preferredPhoneServiceResponse of TelephonyStatusInterface.
			this._savedDomestic = (payload.phonePreferredDomesticPhoneService !== undefined) ?
				payload.phonePreferredDomesticPhoneService : "none";
			if (this.$.domesticPrefCallServiceRow) {
				this.$.domesticPrefCallService.setValue(this._savedDomestic);
			}

			this._savedIntl = (payload.phonePreferredIntlPhoneService !== undefined) ?
				payload.phonePreferredIntlPhoneService : "none";
			if (this.$.preferredIntlCallServiceItem) {
				this.$.preferredIntlCallServiceRow.setValue(this._savedIntl);
			}

			this.$.internationalDialingToggle.setState(payload.phoneInternationalDialingActive);
		}
	},
	
	selectorChanged: function(event) {
		this.$.prefService.call({
			"phonePreferredIntlPhoneService": event.value
		}, {
			method: "setPreferences",
			onSuccess: "",
			onFailure: ""
		});
	},	
	
	onDomesticSelectorChanged: function(event) {
		this.$.prefService.call({
			"phonePreferredDomesticPhoneService": event.value
		}, {
			method: "setPreferences",
			onSuccess: "",
			onFailure: ""
		});
	},      	

    getAccounts: function(){
            enyo.log("phoneAccountService::getAccounts");
            this.$.listAccounts.getAccounts({capability: "PHONE"});
    },

	onGotAccounts: function(inSender, inResponse) {
        enyo.log("phoneAccountService::gotAccounts inResponse.accounts.length:"+JSON.stringify(inResponse.accounts.length));
        if (inResponse.templates) {
			this._accountTemplates = inResponse.templates;
		}
		this.populateCallServiceSelectors(inResponse.accounts);
		this.showPreferredService();
	},

	// Build the "Use" picker choices from the enabled PHONE-capable Synergy accounts (dynamic), instead
	// of a hardcoded Signal/Telegram/WhatsApp list. Bluetooth (cellular) is always first and "Always Ask"
	// last; each distinct calling account (by templateId) goes in between. The account list already comes
	// filtered to capability:PHONE (getAccounts above), so a service only appears here if its Synergy
	// connector's template declares a PHONE capability and an account for it exists on the device.
	buildCallServiceItems: function(accounts) {
		var items = [ {caption: $L("Bluetooth"), value: "com.palm.telephony"} ];
		var seen = {};
		if (accounts) {
			for (var i = 0; i < accounts.length; i++) {
				var acct = accounts[i];
				if (acct && acct.templateId && acct.templateId !== "com.palm.palmprofile" && !seen[acct.templateId]) {
					seen[acct.templateId] = true;
					items.push({caption: (acct.loc_name || acct.name || acct.templateId), value: acct.templateId});
				}
			}
		}
		items.push({caption: $L("Always Ask"), value: "none"});
		return items;
	},

	populateCallServiceSelectors: function(accounts) {
		var items = this.buildCallServiceItems(accounts);
		// setItems resets the selection, so re-apply the saved preference. It may not have loaded yet
		// (async); if not, keep the current value and updateInternationalDialingSettings applies it later
		// (on these now-correct items). Conversely if the pref loaded first, _savedDomestic/_savedIntl
		// hold it and we restore it here.
		var dom = this.$.domesticPrefCallService, intl = this.$.preferredIntlCallServiceRow;
		if (dom) {
			dom.setItems(items);
			dom.setValue(this._savedDomestic !== undefined ? this._savedDomestic : dom.getValue());
		}
		if (intl) {
			intl.setItems(items);
			intl.setValue(this._savedIntl !== undefined ? this._savedIntl : intl.getValue());
		}
	},
	
	internationalDialingTap: function() {
		var value = this.$.internationalDialingToggle.getState();
		this.$.prefService.call({"phoneInternationalDialingActive" : value}, {
		       method: "setPreferences",
		       onSuccess: "prefSetCallback",
		       onFailure: "prefSetCallback"
		});
     },      	

});


