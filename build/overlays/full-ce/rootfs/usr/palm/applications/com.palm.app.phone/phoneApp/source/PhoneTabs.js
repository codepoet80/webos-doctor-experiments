/*jslint white: false, onevar: false, nomen:false, plusplus: false */
/*global enyo */

enyo.kind({
	name: "PhoneTabs",
	kind: "VFlexBox",
	className: "phone-background",
	style: "min-height: 344px", // Support broadway(400),  424px", // Screen (480px) - System bar (28px) - Notification (28px) = 424px
	published: {
		tabsShowing: true
	},
	components: [
		{kind:"Pane", className: "panes", name: "pane", transitionKind: enyo.transitions.Simple, flex: 1, style: "text-align: center", onSelectView: "handleDestroyOnUnload", components:[
			{name:"dialpad_card",  kind: "Dialer",/*onButtonChange: "showContactbutton",*/ lazy:true},
			{name:"contactlookup", className: "phone-background", kind: "ContactLookup", onShowTabMenu: "showTabMenu", lazy:true}, 
			//comment out for video discoveribility
			//{name:"allcontactlookup", className: "phone-background", kind: "AllContactLookup", lazy: true},			
			{name:"calllog", className: "phone-background", kind: "CallLog", lazy:true},
			{name:"favorites", className: "phone-background", kind: "Favorites", lazy:true},
			{name:"voicemail", kind: "Voicemail", lazy:true},
			//{name:"favoritesAdd", kind: "FavoritesAdd", lazy:true},
			{name:"activeCall", className: "active-call-scrim", kind: "ActiveCall", lazy:true, destroyOnUnload:true},
		]},
		{kind: "BacktoActiveCallControl", name:"BacktoActiveCallButton", pack: "center", showing: false, onclick: "backtoCallClick"},						
		{name: "commandMenu", kind: "Toolbar", className: "phone-command-menu-main", components: [
			{name:"menu", kind:"PhoneTabsMenu", flex: 1,  onChange: "radioSelectView"}
		]},
		{name:"noVoicemailNumberPrompt", kind: "NoVoicemailNumberPrompt"},
		{name:"visualVoicemailFirstLaunch", kind: "VisualVoicemailFirstLaunch", onSubscribe:"launchVvmSignup", onContinue:"enterVoicemail"},
		//luna-send -n 1 luna://com.palm.systemservice/setPreferences '{"phoneAppShouldShowVoicemailFirstLaunch":true}'
		//luna-send -n 1 luna://com.palm.systemservice/getPreferences '{"keys":["phoneAppShouldShowVoicemailFirstLaunch"]}'
		{name:"vvmFirstLaunchPref", kind:"PalmService", service: enyo.palmServices.system, params:{keys:["phoneAppShouldShowVoicemailFirstLaunch"]}, method:"getPreferences", onSuccess:"vvmFirstLaunchPrefResponse", onFailure:"genericFailure"},
		{name:"launchVvmSignup", kind: enyo.PalmService, service: enyo.palmServices.application, method: "launch", params: {id:"com.palm.app.accounts"}},
		//{name:"addToContactsService", kind:"PalmService", service: enyo.palmServices.application, method: "open", },
		{name: "launchApplication", kind: "PalmService", service: enyo.palmServices.application, method: "launch"},
		{name: "favPersonsCache", kind: "FavPersonsCache"},
		{name: "skypeBuddyCache", kind: "SkypeBuddyCache"}
	],
	create: function() {
		this.inherited(arguments);
		//re-enable for Dubonnet
		this.setVoicemailCount(enyo.application.VoicemailService.getVoicemailCount());
		
		this._updateWithVoicemailCountFunc = enyo.hitch(this, "updateWithVoicemailCount")
		enyo.application.VoicemailService.registerVoicemailCountQuery(this._updateWithVoicemailCountFunc);
				
		this.$.vvmFirstLaunchPref.call();
		this.tabsShowingChanged();

		enyo.application.Cache.skypeBuddyCache = this.$.skypeBuddyCache;
		enyo.application.Cache.favPersonsCache = this.$.favPersonsCache;
		enyo.application.Cache.commandMenu = this.$.commandMenu;

		// Default to the PHONE (dialer) tab on launch. On a fresh launch windowParamsChangeHandler
		// doesn't reach the app root, so nothing else selects a view and the Pane would otherwise come
		// up on VIDEO (contactlookup). Do this AFTER the caches above are set: instantiating the (lazy)
		// Dialer view touches Cache.skypeBuddyCache, so selecting it earlier NPEs. An active call or an
		// explicit launch scene overrides this right after (both run later than create()).
		if ( ! enyo.application.CallSynergizer.callExists() ) {
			this.$.pane.selectViewByName("dialpad_card", true);
			// A LunaSysMgr card restore re-selects the app's LAST scene ~100ms AFTER create() (via
			// PhoneAppCard), so it can land on the VIDEO tab. Bounce back to the dialer once, on a slightly
			// longer timeout so it runs after the restore. Only fires if we ended up on VIDEO, so tapping
			// the VIDEO tab afterwards still works (this runs once, at launch).
			setTimeout(enyo.hitch(this, "assertDialpadDefault"), 250);
		}
		// Command menu should match current active view
		this.$.menu.setValue(this.$.pane.getViewName());
	},
	assertDialpadDefault: function() {
		if ( ! enyo.application.CallSynergizer.callExists() && this.$.pane.getViewName() === "contactlookup" ) {
			enyo.application.UI.enter("dialpad_card");
		}
	},
	destroy: function() {
		enyo.log("destory ****************** PhoneTabs");
		enyo.application.VoicemailService.unregisterVoicemailCountQuery(this._updateWithVoicemailCountFunc);
		
		enyo.application.Cache.skypeBuddyCache = null;
		enyo.application.Cache.favPersonsCache = null;
		enyo.application.Cache.commandMenu = null;
		
		this.inherited(arguments);
	},
	// destroy views (flagged by destroyOnUnload:true) that we don't want to keep
	// around because they are rarely accessed and/or too expensive to keep in the DOM
	handleDestroyOnUnload: function(inSender, inView, inPreviousView) {
		if ( inPreviousView && inPreviousView.destroyOnUnload && inView !== inPreviousView ) {
			//enyo.log("delete previous view (active call view) if no call exists");		
			if(!enyo.application.CallSynergizer.callExists() /*&& inPreviousView.name = "activeCall"*/) {
				inPreviousView.destroy();
			}
		}
	},
	tabsShowingChanged: function() {
		// do not show command menu when in "minimal mode" (ie first use)
		if(this.$.commandMenu) {
			this.$.commandMenu.setShowing(this.tabsShowing && ! (window.PalmSystem && PalmSystem.isMinimal));
		}
	},
	vvmFirstLaunchPrefResponse: function(inSender, response) {
		this.showVerizonFirstLaunch = response.phoneAppShouldShowVoicemailFirstLaunch;
	},
	genericFailure: function(inSender, response, request) {
		enyo.error(request.service + request.method + " failed with " + enyo.json.stringify(response));
	},
	selectViewByName: function(name, params) {
		enyo.log("debug: name is "+name);
		this.$.pane.selectViewByName(name,true);
			
		this.setTabsShowing(enyo.application.isTablet || name != "activeCall");
		
		/*if (enyo.application.isTablet ){			
			this.showContactbutton(null, name === "dialpad_card");			
		}*/
		
		if (name != "activeCall" && enyo.application.CallSynergizer.callExists()) {
			this.$.BacktoActiveCallButton.setVisible(true);
			this.$.pane.addClass("call-active");

                        /* adjust the dialpad button to fit the active call banner */
                        enyo.application.Cache.adjustDialButton = true;

		}else{
			if(this.$.BacktoActiveCallButton) {
				this.$.BacktoActiveCallButton.setVisible(false);			
			}
			this.$.pane.removeClass("call-active");
                        enyo.application.Cache.adjustDialButton = false;
		}
		/*if ( name == "activecall" ) {
			this.showContactbutton(false);
		}*/

		if ( this.$[name].handleLaunch ) {
			this.$[name].handleLaunch(params || {});
		}
		// if the view isn't one of the tab-bar entries (activeCall, phonePrefs, firstlaunch, ...),
		// highlight the PHONE tab rather than VIDEO — the dialer is the app's home.
		if ( ! this.$.menu.fetchControlByValue(name) ) {
			name = "dialpad_card";
		}
		this.$.menu.setValue(name);
	},
	copy: function(event) {
		return this.delegateToActiveView("copy", event);
	},
	paste: function(event) {
		return this.delegateToActiveView("paste", event);
	},
	back: function(event) {
		return this.delegateToActiveView("back", event);
	},
	keyup: function(event) {
		return this.delegateToActiveView('keyup', event);
	},
	keydown: function(event) {
		return this.delegateToActiveView('keydown', event);
	},
	// delegates the named event type to the active scene
	// if the scene's handler returns true, it was handled and it default prevented
	delegateToActiveView: function(eventType, event) {
		var activePaneObj = this.$[this.$.pane.getViewName()];
		var handled = activePaneObj && activePaneObj[eventType] && activePaneObj[eventType].apply(activePaneObj, enyo.cloneArray(arguments).slice(1));
		if ( handled ) {
			event.preventDefault();
		}
		return handled;
	},
	setVoicemailCount: function(count) {
		if(enyo.application.VoicemailService.isUnknownPositiveCount(count)){
			enyo.log("phoneapp>> unknownPositiveCount: count = " + count);
			this.$.menu.$.voicemailCountWrapper.setShowing(true);
			this.$.menu.$.voicemailCount.hide();
			this.$.menu.$.unknownpositiveCountImg.show();
			enyo.log("phoneapp>> unknownPositiveCount: counter update done");
			return;
		} 
		
		// if(!isInt)
		if (isNaN(count) || parseInt(count, 10) !== count) {
			count = "!";
		}
		
		this.$.menu.$.unknownpositiveCountImg.hide();
		this.$.menu.$.voicemailCountWrapper.setShowing((count !== 0));
		this.$.menu.$.voicemailCount.setContent(count);
	},
	radioSelectView: function(inSender, inValue) {
		if (inValue === "voicemail") {
			this.maybeEnterVoicemail();	
		} else {
			enyo.application.UI.enter(inValue);
		}
	},
	maybeEnterVoicemail: function() {        
		enyo.application.UI.enter("dialpad_card");
		this.$.menu.setValue("dialpad_card");
		
		var carrierName = "";
		if (this.showVerizonFirstLaunch) {
			carrierName = "verizon";
		}
		else {
			carrierName = enyo.application.VoicemailService.getCarrierName();
		}
		enyo.log("phoneapp>> maybeEnterVoicemail(): carrierName = " + carrierName + ", showVerizonFirstLaunch = " + this.showVerizonFirstLaunch + "ranVvmFirstLaunch = " + enyo.getCookie("ranVvmFirstLaunch"));
		if (carrierName) {
			var isCarrierVvmEnabled = enyo.application.VoicemailService.isCarrierVvmEnabled(carrierName);
			if (this.showVerizonFirstLaunch && enyo.getCookie("ranVvmFirstLaunch") != "true" && !isCarrierVvmEnabled) {
				enyo.log("phoneapp>> maybeEnterVoicemail(): launch account app and go back to dialpad");
				
				enyo.setCookie("ranVvmFirstLaunch", "true");

				// this.$.visualVoicemailFirstLaunch.open();
				var accountSetupApp = enyo.application.VoicemailService.getAccountSetupApp();
				if (accountSetupApp === undefined || accountSetupApp == null || accountSetupApp == "") {
					// accountSetupApp = "com.palm.app.accounts";
					accountSetupApp = "com.palm.app.vzwvvm";
				}
				this.$.launchApplication.call({
					id: accountSetupApp,
				});

				enyo.application.UI.enter("dialpad_card");
				this.$.menu.setValue("dialpad_card");
			}
			else {
				enyo.log("phoneapp>> maybeEnterVoicemail(): enterVoicemail from Verizon routine");
				this.enterVoicemail();
			}
		}
		else {
			enyo.log("phoneapp>> maybeEnterVoicemail(): enterVoicemail from non-Verizon routine");
			this.enterVoicemail();
		}
	},
	enterVoicemail: function() {
		// CASE: vvm not enabled
		if ( ! enyo.application.VoicemailService.isVvmEnabled() ) {
			var number = enyo.application.VoicemailService.getVoicemailNumber();
			if ( ! number ) {
				if(enyo.application.isTablet == true) {
					this.$.noVoicemailNumberPrompt.openAtCenter();
				} else {
					this.$.noVoicemailNumberPrompt.open();
				}
			} else {
				// Always specifiy a transport to avoid having the Cache.phonePreferredDomesticPhoneService from opening the PreferredPhSvcDlg
				enyo.application.CallSynergizer.dial(number, undefined, undefined, enyo.application.CallSynergizer.TRANSPORTS.TIL);
			}
		// CASE: vvm enabled, always to it
		} else {
			enyo.application.UI.enter("voicemail");
		}
	},
	launchVvmSignup: function() {
		this.$.launchVvmSignup.call();
	},
	updateWithVoicemailCount: function(count) {
		//re-enable for Dubonnet
		this.setVoicemailCount(count);
	},
	getCurrentViewName: function() {
		return this.$.pane.getViewName();
	}, 
	/*showContactbutton: function(inSender, value) {
		// ignore request to show the "Add to Contacts" button during "first use"
		if ( window.PalmSystem && PalmSystem.isMinimal )
			return;

                if (!this.$.dialpad_card) return;

		if(value){
			var dialString = this.$.dialpad_card.getDailStringRawValue();
 			if (dialString && dialString.length > 0) {
				this.$.addtoContactButton.show();
				//this.$.commandMenu.hide();
				this.$.commandMenu.addClass("contactsButtonDisplayed")
			}
		} else {
			this.$.addtoContactButton.hide();
			//this.$.commandMenu.show();                            
			this.$.commandMenu.removeClass("contactsButtonDisplayed")
		}

	},
	addContactClick: function(inSender, value) {
		var address = this.$.dialpad_card.getDailStringValue();
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
	},*/
	disableTabsMenu: function(disable) {
		this.$.menu.disableTabs(disable);
	},
	windowActivate: function() {
		if(this.$.activeCall.$.calltype.getViewName() === "videoCall" && this.$.activeCall.$.videoCall.windowActivatedHandler) {
			this.$.activeCall.$.videoCall.windowActivatedHandler();
		}
		return true;
	},
	windowDeactivate: function() {
		if(this.$.activeCall.$.calltype.getViewName() === "videoCall" && this.$.activeCall.$.videoCall.windowDeactivatedHandler) {
			this.$.activeCall.$.videoCall.windowDeactivatedHandler();
		}
		return true;
	}, 
	
	backtoCallClick: function(inSender, value){
		enyo.application.UI.event('activecall');
	}, 
	
	showTabMenu: function(inSender, showing) {
		this.$.commandMenu.setShowing(showing);
		this.$.menu.disableTabs(!showing);
		this.$.menu.setShowing(showing);		
	}, 
});

enyo.kind({
	name: "VisualVoicemailFirstLaunch",
	kind: "DialogPrompt",
	events: {
		onContinue: "",
		onSubscribe: ""
	},
	// TODO THIS IS NOT THE FINAL MESSAGE
	title: $L("Visual Voicemail"),
	// message: "Would you like to set up Verizon Visual Voicemail",
	message: $L("Immediately access and manage your voicemail messages with Visual Voice mail. Visual Voice mail delivers your messages to an application on your device. Your messages are now clicks away rather than dialing into the voicemail system."),
	acceptButtonCaption: $L("Sign up"),
	cancelButtonCaption: $L("No, continue"),
	acceptClick: function() {
		this.doSubscribe();
		this.close();
	},
	cancelClick: function() {
		this.doContinue();
		this.close();
	}
});

