/*jslint white: false, onevar: false, nomen:false, plusplus: false */
/*globals enyo PinStatus PinAction*/

enyo.kind({
	name: "PhonePrefs",
	kind: enyo.VFlexBox,
	className: "enyo-bg",

        // This is the Wifi and 3G Tablet's Phone Preference
        // independent of machine type

	components: [

		{name: "pane", kind:"Pane", flex: 1, transitionKind:enyo.transitions.Simple, components:[
			{name: "main",  kind: "VFlexBox", pack: "justify", components: [			
				{ kind: "PageHeader", pack: "center", className: "header", components: [
					{name: "photoImage", kind: "Image", className: "phone-icon", src: "../shared/phoneprefs/images/header-icon-phone.png"},
					{content: $L("Phone Preferences"), className: "phone-header-caption"}
				]}, 
				{kind: "Scroller",flex: 1, components: [
					{kind: "HFlexBox", style: "margin-top: 14px; overflow: hidden", pack: "center", components: [
						{kind: "VFlexBox", width: "500px", components: [
							{name: "dialingScene", kind: "Dialing", onAddDialingShortcut: "dialingShortcutClick"},
							{name: "internationalCallView", kind: "InternationalCallsPref", onShowRegion: "showRegionList", onEditAccount: "prefsEditAccount", onAddAccount: "prefsAddAccount"},
							{name: "securityView", kind: "Security", onRefreshCard: "updateCardUI"},
							{name: "network", kind: "Network", onEditNetworkClick: "editNetwork"},
							{name: "connectBtPhone", kind: "ConnectPhone", onBluetoothStatusChange: "updateBluetoothStatus"},
						]}
					]}
				]},
			 	{name: "toolbar", kind: "Toolbar", className: "enyo-toolbar-light", showing: true, pack: "center", components: [  
			    		{name: "donePhonePrefsTablet", width: "300px", kind: "Button", className: "enyo-button-affirmative", content: $L("Done"), showing: true, onclick: "handleDonePhonePrefsTablet"},
			    	]}
			]},
			{name:"pinCode", kind:"PinCode", onRefreshCard: "updateCardUI", lazy:true},
			{name:"dialingShortcut", kind:"DialingShortcut", onDoneClick: "dialingShortcutDone", lazy:true},
			{name:"editNetworkSettings", kind:"EditNetworkSettings", onDoneClick: "editNetworkDone", tablet: true, lazy:true},
			{kind:"FlightMode", lazy:true},
			{kind: "AccountsUI", name: "accountsView", capability: "PHONE", onAccountsUI_Done: "accountsDone", lazy:true},
			{kind: "AccountsModify", name: "accountsModify", capability: "PHONE", onAccountsModify_Done: "accountsDone", lazy:true},
		]},
		{name: "prefService", kind: enyo.PalmService, service:enyo.palmServices.system}, 
		{name: "telService", kind: enyo.PalmService, service: enyo.palmServices.telephony, onSuccess: "", onFailure: ""},
		/*{name: "appMenu", kind: "AppMenu", components: [
			{caption: $L("Preferences & Account"), onclick: "preferencesClick"},
			{caption: $L("Help"), onclick: "helpClick"}
		]}*/
	],

	create: function() {
		this.inherited(arguments);
		
		// subscribe
		this.phoneNumber = "";

		this.updateNetworkUI(); 
                this.updateAdditionalPrefs();
	},

	destroy: function() {
		//unsusbcribe from platform changes
		this.inherited(arguments);
	},
	
	updateBluetoothStatus: function() {
		if (this.$.internationalCallView) {
			this.$.internationalCallView.updateCallService(); 
		}
	}, 

        // User tapped on account to edit
        prefsEditAccount: function(inView, inSender, inResults) {
                this.$.pane.selectViewByName("accountsModify");
                this.$.accountsModify.ModifyAccount(inResults.account, inResults.template, "PHONE");
        },

        // User tapped on add account
        prefsAddAccount: function(inView, accountTemplates) {
                this.$.pane.selectViewByName("accountsView");
                this.$.accountsView.AddAccount(accountTemplates);
        },

        // Go to the prefs and accounts view
        accountsDone: function(inSender, e) {
                enyo.log("done with account handling");
                
                if(this.accountsLaunchedFromAppMenu) {
	                this.accountsLaunchedFromAppMenu = false;
                	setTimeout(enyo.hitch(this, "handleDonePhonePrefsTablet"), 10);
                } else {
                        this.$.pane.selectViewByName("main");
                }
        },

	handleLaunch: function(params) {
		enyo.log(enyo.json.stringify(params));
		if (false) {	
			this.handleFlightMode(); 
			return;
		}
		
		this.accountsLaunchedFromAppMenu = false;
			
		switch (params && params.launchType) {				
			case "flightMode":
				this.handleFlightMode(); 
				break; 
					
			case "closePinView":
				//we check the status again in case the pin view itself handled
				//notification and goes away
				if (this.$.pinCode && enyo.application.Cache.pinView === true) {
					this.$.pinCode.nextState = params.nextState;
					this.$.pinCode.nextView = params.nextView;					
					this.$.pinCode.doneClick();
				} else {
					enyo.application.UI.event('back');
				}	
				return; 
				
			case "pinCode":
				this.launchPinView(params.pinAction, params);
				break; 
				
			case "editFixedNumber": 
				this.$.pane.selectViewByName("editFixedNumber");
				this.$.editFixedNumber.updateUI(this.ItemIndex, this.ItemData); 
				break;
				
			case "restrictedDialingList":
				this.$.pane.selectViewByName("restrictedDialingList");
				this.$.restrictedDialingList.updateUI(); 			
				break; 		
		
			case "puk1Lock":
				if (params && params.nextState == "preferences_card") {					
					params.nextView = this.$.pane.getViewName(); 
					//params.nextState = undefined; 
				}			
				this.launchPinView(PinAction.PUK_Enter, params);			
				break;		
				
			case "puk2Lock":
				this.launchPinView(PinAction.PUK2_Enter, params);			
				break;				
				
			case "fdnUnLock":		
				this.launchPinView(PinAction.Fdn_Verify, params);			
				break; 
				
			case "fdnDisable":
				var pinAction = PinAction.Fdn_Disable;
				if (PinStatus.Puk2required){
					pinAction = PinAction.PUK2_Enter; 
				}
				this.launchPinView(pinAction, params);							 						
				break;				
				
			case "devicelock":		
				this.launchPinView(PinAction.deviceLockUnlock, params);				
				break;
				
			case "unlockTelephony":			
				if (params && params.nextState == "preferences_card") {					
					params.nextView = this.$.pane.getViewName(); 
					//params.nextState = undefined; 
				}
				this.launchPinView(PinAction.PinCode_Verify, params);											
				break;				

			case "startNetworkSearch":
				this.$.network.loadNetworkList(); 				
				break;
				
			case "apn":
				this.editNetwork(false);  				
				break;
				
			case "mms":
				this.editNetwork(true);
				break;				
				
			default:
				if(params && params.launchType) {
			        	enyo.log("launchview: " + params.launchType);
					this.$.pane.selectViewByName(params.launchType);
				} else {
					this.$.pane.selectViewByName("main");
				}

				break;
		}
	},	

	handleFlightMode: function() {
		if (!enyo.application.Cache.powerOn) {
			this.$.pane.selectViewByName("flightMode");
			return; 
		} else {
			if (this.$.pane.getViewName() == "flightMode") {
				this.$.pane.selectViewByName("main");
				//this.$.fdnService.call(); //todo: this line will be changed when we have pref state handling in
				this.updateCardUI(); 
			}
		}		
	},
	
	EnableCallForwardingButtonClick: function() {
		this.$.drawer.toggleCollapsed();
	},
	
	launchPinView: function(pinAction, params) {	
		if (this.$.pane.getViewName() == "pinCode") {
			return; 
		}
		enyo.application.Cache.pinView = true; 
		this.$.pane.selectViewByName("pinCode");	
		this.$.pinCode.pinAction = pinAction;
		this.$.pinCode.nextState = params.nextState;
		this.$.pinCode.nextView = params.nextView;

		if (params.locktype) {
			this.$.pinCode.unblock = params.unblock; 
			this.$.pinCode.locktype = params.locktype; 
		}
		this.$.pinCode.setUI();		
	},	

	//launch view dialingShortcut
	dialingShortcutClick: function() {
		this.$.pane.selectViewByName("dialingShortcut");
	},
	
	saveFDNItemData: function() {
		this.ItemIndex = this.$.restrictedDialingList.viewItemIndex;
		this.ItemData = this.$.restrictedDialingList.viewItemData;

	},

	//launch view editNetworkSettings
	editNetwork: function(mmsSetting) { //mmsSetting true if MMS; false if apn
		this.$.pane.selectViewByName("editNetworkSettings"); //EditNetworkSettings	
		if (mmsSetting === undefined){
			this.$.editNetworkSettings.MMS = false;
		} 
		else {
			this.$.editNetworkSettings.MMS = mmsSetting;
		}
	},
	
	updateCardUI: function() {
		this.$.securityView.updateUI();
	},

	//back from view dialingShortcut
	dialingShortcutDone: function() {
		this.$.dialingScene.updateDialingShortcuts();
		this.$.pane.back();
	},

	//back from view editNetworkSettings
	editNetworkDone: function() {
		this.$.pane.back(); 
	},

	showRegionList: function() {
		this.$.pane.selectViewByName("selectCountryPrefix"); 
		this.$.selectCountryPrefix.updateUI(); 		
	}, 

	countryPrefixDone: function() {
		this.$.internationalCallView.setLabelContent(this.$.selectCountryPrefix.selectText); 
		this.$.pane.back(); 
		var params = {
			"phoneInternationalDialingActive": true,
			"phoneInternationalDialingRegionId": this.$.selectCountryPrefix.selectRegionId
		};
		this.$.prefService.call(params, {method: "setPreferences", onSuccess: "setPrefResponse", onFailure: "setPrefResponse"});
	}, 
	
	setPrefResponse: function(inSender, response) {
		enyo.log(enyo.json.stringify(response));
	},

	voicemailclearQueryDone: function(inSender, payload) {	
		if (( payload.allowClearVoicemailCount !== undefined ) && ( payload.allowClearVoicemailCount === true )) {
			this.$.voicemailclear.show();
		}
	},
	
	handleTapOnVoicemailReset: function() {
		this.$.telService.call({},{
			method: "voicemailCountReset",
			onSuccess: "",
			onFailure: ""
		});		
	},	

	handleDonePhonePrefsTablet: function() {
		enyo.application.UI.event('back'); 
	},	

	//todo: the listener of platformquery and OON should be moved to phoneApp, not in phonePref
	//the variable storing network technology should be moved to data, a shared resource	
	updateNetworkUI: function() {

		enyo.log("updateNetworkUI");

		if (enyo.application.Cache.platformType == undefined) {
			enyo.error("error querying platform type");
			return; 
		}


		if (enyo.application.Cache.platformType != "none") {
			//network scene handles platform change
			this.$.network.reInit(); 
		}
					
		//dialing scene available on all platforms
		this.$.dialingScene.updateUI();

		if (enyo.application.Cache.platformType == "cdma") {
			//we only need to query this in cdma mode
			var params = {"keys": ["allowClearVoicemailCount"]};
			this.$.prefService.call(params, {
				method: "getPreferences",
				onSuccess: "voicemailclearQueryDone", 
				onFailure: "voicemailclearQueryDone"
			});

		} 


	},

	updateAdditionalPrefs: function() {

		enyo.log("platformType is " + enyo.application.Cache.platformType);

		if (enyo.application.Cache.platformType == "none") {

                    // wifi's view does not contain network and security
                    this.$.securityView.hide();
                    this.$.network.hide(); 
           
                } else {

                    // allow a limited view of preferences for network and security
                    if (enyo.application.UI.getPreviousState() == "firstlaunch_card") {
	                this.$.dialingScene.hide();
                        this.$.internationalCallView.hide();
                        this.$.connectBtPhone.hide();
                    } else {
	                this.$.dialingScene.show();
                        this.$.internationalCallView.show();
                        this.$.connectBtPhone.show();
                    }
                }
	},
	
	back: function(e) {
		var currView = this.$.pane.getViewName();
		if ( currView != "main" ) {
			if (currView == "restrictedDialingList") {
				this.$.pane.selectViewByName("main");
			} else if (currView == "editFixedNumber") {
				this.$.pane.selectViewByName("restrictedDialingList");
			} else if (currView == "flightMode") {
				enyo.application.UI.event('back'); 
			} else {
				this.$.pane.back(e);
			}
			return true;
		}
	}
});
