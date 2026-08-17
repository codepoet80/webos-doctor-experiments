
enyo.kind({
	name: "MultimodeInterface",
	kind: enyo.Component,
	components: [
		//service calls		
		{name: "platformQuery", kind: enyo.PalmService, service: enyo.palmServices.telephony, subscribe: true, method: "platformQuery", onSuccess: "onPlatformQueryHandler", onFailure: "onPlatformQueryHandler"},
		{name: "outOfNetworkSubscribe", kind: enyo.PalmService, service: enyo.palmServices.telephony, subscribe: true, method: "outOfNetwork", 	onSuccess: "onOutOfNetworkHandler", onFailure: "onOutOfNetworkHandler"},
		{name: "autoSwitchSubscribe", kind: enyo.PalmService, service: enyo.palmServices.telephony, subscribe: true, method: "autoSwitchingTechnology", onSuccess: "onAutoNetworkSwitchHandler", onFailure: "onAutoNetworkSwitchHandler"},
		{name: "multimodeQuerySubscribe", kind: enyo.PalmService, service: enyo.palmServices.telephony, subscribe: true, method: "multiModeSettingQuery", onSuccess: "onMultimodeQueryHandler", onFailure: "onMultimodeQueryHandler"},
		{name: "switchTechnology", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "switchTechnology", onSuccess: "", onFailure: ""},
		
		//Database
		{name: "dbMultimode", kind: "DbService", dbKind: "com.palm.phoneApp.autoSwtichTech:1", onFailure: "genericFailure", components: [
				{name: "createDbKind", method: "putKind", onSuccess: ""},
				{name: "findInDb", method: "find", onSuccess: "handleFindDataResponse"},
				{name: "putInDb", method: "put", onSuccess: ""},
				{name: "delInDb", method: "del", onSuccess: "handleUpdateDB"}
		]},

		//dispatcher
		{name:"MultimodeStateListeners", kind:"Utils.Dispatcher"},
		{name:"PlatformTypeStatusListeners", kind:"Utils.Dispatcher"},
	],
	create: function() {
		this.inherited(arguments);
		//enyo.log("Telephony Multimode interface");
		
		//create db kind to store platformtech
		this.$.createDbKind.call({"owner": enyo.fetchAppId(), "indexes": [{"name":"tech", "props":[{"name":"tech"}] }] });
	},
	
	platformSubscribe: function() {
		this.multimodesubscription = false;
		this.$.platformQuery.call({});
	},

	dispatchMultimodeState: function(state) {
		//enyo.log("dispatchMultimodeState");
		this.$.MultimodeStateListeners.dispatch(state);
	},

	addMultimodeStateListener: function(listener) {
		//enyo.log("addMultimodeStateListener");
		this.$.MultimodeStateListeners.add(listener);
	},

	removeMultimodeStateListener: function(listener) {
		this.$.MultimodeStateListeners.remove(listener);
	},
	
	dispatchPlatformTypeStatus: function(state) {
		//enyo.log("dispatchPlatformTypeStatus");
		this.$.PlatformTypeStatusListeners.dispatch(state);
	},

	addPlatformTypeStatusListener: function(listener) {
		//enyo.log("addMultimodeStateListener");
		this.$.PlatformTypeStatusListeners.add(listener);
	},

	removePlatformTypeStatusListener: function(listener) {
		this.$.PlatformTypeStatusListeners.remove(listener);
	},

	onPlatformQueryHandler: function(inSender, response) {
		enyo.log("WorldPhone:onPlatformQueryHandler " + enyo.json.stringify(response));
		var hfValue; 
		//var prevPlatformType = enyo.application.Cache.platformType;

		if (response.extended) {
			enyo.application.Cache.platformType = response.extended.platformType;

			enyo.application.Cache.homeMCC = response.extended.mcc;
			enyo.application.Cache.vzwSIM = false; 
			if (response.extended.mcc == "204" && response.extended.mnc == "04") {
				enyo.application.Cache.vzwSIM = true;
			}
			
			hfValue = response.extended.capabilities && response.extended.capabilities.hfenable;
			enyo.log("hfValue is "+hfValue);
						
			if(response.extended.capabilities) {
				if (response.extended.capabilities.supportedmodes) {
					//enyo.log("multimode true");
					enyo.application.Cache.platformMultimode = true;
				} else {
					enyo.application.Cache.platformMultimode = false;	
				}
				//if the capabilities is undefined, treat it as false
				enyo.application.Cache.simLocked = false; 
				if (response.extended.capabilities.lockedToSim != undefined) {
					enyo.application.Cache.simLocked = response.extended.capabilities.lockedToSim;
				}
			}
		}

		if(enyo.application.Cache.platformMultimode == true && this.multimodesubscription == false) {

			enyo.log("subscribe outOfNetwork &  autoSwitch only on multimode devices");
			this.$.outOfNetworkSubscribe.call({});
			this.$.autoSwitchSubscribe.call({});
			this.$.multimodeQuerySubscribe.call({});

			this.multimodesubscription = true;
			if(enyo.application.Cache.showOONDlg == undefined) {
			        enyo.application.Cache.showOONDlg = true;
                        }
                        
		} else if(enyo.application.Cache.platformMultimode == false && this.multimodesubscription == true) {

			this.$.outOfNetworkSubscribe.cancel({});
			this.$.autoSwitchSubscribe.cancel({});
			this.$.multimodeQuerySubscribe.cancel({});
			this.multimodesubscription = false
		}

		//if(prevPlatformType != enyo.application.Cache.platformType) {
			this.dispatchPlatformTypeStatus();
		//}

		if (enyo.application.isTablet==true && enyo.application.Cache.hasVoipAcct==true && enyo.application.Cache.hfenable==true && hfValue==false)
		{
			//only show the outofrange popup when the phone app is the current app and user has a skype account.
                        // otherwise we should be transitioning to first launch screen from here.

			var card = enyo.windows.fetchWindow("PhoneApp");			
			if (card && !card.hidden && !enyo.application.isCarded) {
				var currentstate = enyo.application.UI.getCurrentState();
				var state = ['dialpad_card', 'activecall_card', 'voicemail', 'calllog', 'favorites', 'contactlookup']; 

				//only show the outofrange pop up when it's in the above states
				if (currentstate && state.indexOf(currentstate) >= 0){
					enyo.application.openPhoneAppPopup("OutofPhoneRange", "outOfRangePopup", {}, 125);
				}
			}								
		}
		if (enyo.application.Cache.hfenable == false && hfValue == true)
		{
			enyo.application.closePhoneAppPopup("outOfRangePopup");
		}
		enyo.application.Cache.hfenable = hfValue;
		
	},

	//our assumption is: if the device gets OON it meets the following criterias
	//1) It's a verizon world phone
	//2) It's not in world phone mode
	//3) there is a SIM card present
	//4) modem could not acquire current technology for 30 s
	onOutOfNetworkHandler: function(inSender, response) {
		//enyo.log("WorldPhone:onOutOfNetworkHandler " + enyo.json.stringify(response));
		if (response.returnValue) {
			if (response.subscribed) {
				//subscription response - don't show dialog
				return;
			}
			if(enyo.application.Cache.showOONDlg == true) {
				var height = 220;
				enyo.application.openPhoneAppPopup("OutOfNetwork", "oonPopup", {}, height);
			}
		}
	},

	//this notification only covers device reboot case
	onAutoNetworkSwitchHandler: function(inSender, response) {
		enyo.log("WorldPhone:onAutoNetworkSwitchHandler " + enyo.json.stringify(response));
		
		if(response && ((response.returnValue == false) || (response.subscribed && response.subscribed == true))) {
			//subscribtion ack
			return;
		}
		
		//TIL gives this reason to show "SIM Missing" in UI.
        	this.reasonSimMissing = false;
   		if (response.reason && response.reason == "simMissing") {
			this.reasonSimMissing = true;
		}
			
		if(response.tech) {
			var platformTech = {"world" :  $L("Global"), "umts" : $L("GSM/UMTS"), "cdma" : $L("CDMA")};

			//Show dashboard
			var msgText = enyo.application.Utils.interpolate($L("Device auto switches to #{tech}."), {"tech": platformTech[response.tech]});
			this.addAutoNetworkSwitchdash(msgText);
		}
	},

	addAutoNetworkSwitchdash: function(dashText) {
		enyo.log("addAutoNetworkSwitchdash :" + dashText);

		if(this.autoNetworkSwitchdash != undefined) {
        		this.autoNetworkSwitchdash.setLayers([]);
			this.autoNetworkSwitchdash.destroy();
			this.autoNetworkSwitchdash = undefined;
		}
		
		// delay creating new component under same name after destory
		setTimeout(enyo.bind(this, function() {
			this.autoNetworkSwitchdash = this.createComponent({
				name: "autoNetworkEnyoDashabord",
				kind:"enyo.Dashboard",
	       	        	smallIcon: "images/notification-small-ignored.png",
			}, {"owner": this});
			var msgTitle = enyo.application.Utils.interpolate($L("#{sim} Network switch."), {"sim": this.reasonSimMissing ? $L("SIM Missing.") : ""});
		
			this.autoNetworkSwitchdash.setLayers([{"icon": "images/notification-large-info.png","title":msgTitle, "text":dashText}]);
			//reset sim missing reason after showing dash
			this.reasonSimMissing = false;
			
		}), 1000);
	},
	
	onMultimodeQueryHandler: function(inSender, response) {
        	//enyo.log("WorldPhone:onMultimodeQueryHandler " + enyo.json.stringify(response));
        				
        	//first multimodeQuery response after reboot (enyo.application.Cache.platformTech is undefined)
		if(enyo.application.Cache.platformTech == undefined) {

			//HACK: get previous value from Database and show Auto network switch notification if required.
			this.$.findInDb.call({"query": {"where": [{"prop": "tech", "op": "%", "val": "" }]}});
		}
        	
        	if(response) {
			if (response.mode && response.mode != "unknown") {
			        enyo.application.Cache.platformTech = response.mode;
			}
	   		
	        	//TIL gives this reason to show -SIM Missing- in UI.
	        	this.reasonSimMissing = false;
	   		if (response.reason && response.reason == "simMissing") {
				this.reasonSimMissing = true;
			}
		}
			
		if(enyo.application.Cache.platformTech != undefined ) {
			this.dispatchMultimodeState();
			
			//delay updating database - find request may inprogress
			enyo.job("updateDbtech", enyo.bind(this, function() {
				this.updateMultimodeDB();
			}),1000);
		}
	},
	
/*luna-send -n 1 -a com.palm.app.phone luna://com.palm.db/putKind '{"id":"com.palm.phoneApp.autoSwtichTech:1", "owner": "com.palm.app.phone", "indexes": [{"name":"tech", "props":[{"name":"tech"}] }]}'
luna-send -n 1 -a com.palm.app.phone luna://com.palm.db/delKind '{"id":"com.palm.phoneApp.autoSwtichTech:1"}'
luna-send -n 1 -a com.palm.app.phone luna://com.palm.db/put '{"objects": [{"_kind":"com.palm.phoneApp.autoSwtichTech:1", "tech": "umts"}]}'
luna-send -n 1 -a com.palm.app.phone luna://com.palm.db/merge '{"objects": [{"_kind":"com.palm.phoneApp.autoSwtichTech:1", "tech": "umts"}]}'
luna-send -n 1 -a com.palm.app.phone luna://com.palm.db/find '{ "query": {"from":"com.palm.phoneApp.autoSwtichTech:1", "where": [{ "prop": "tech", "op": "%", "val": "" }]}}'
luna-send -n 1 -a com.palm.app.phone luna://com.palm.db/del '{ "query": {"from":"com.palm.phoneApp.autoSwtichTech:1", "where": [{ "prop": "tech", "op": "%", "val": "" }]}}'
*/
	
	genericFailure: function() {
		enyo.log("Error using DB for storing platform technology");
	},
	
	//called only on phone app reboot
	handleFindDataResponse: function(inSender, response) {
		if(response && response.returnValue) {
			if(response.results && response.results.length > 0) {
			 	//if(response[0].tech != "") {
			 		enyo.log("tech from DB" + response.results[0].tech + " current tech " + enyo.application.Cache.platformTech);
					if(enyo.application.Cache.platformTech != undefined && response.results[0].tech != enyo.application.Cache.platformTech) {
						enyo.log("auto network swtich notification");
						this.onAutoNetworkSwitchHandler(null, {tech: enyo.application.Cache.platformTech});
					}
				//}
			}
		}
	},
	
	//store platformTech in database for autonetwork switch notification hack
	updateMultimodeDB: function() {
		this.$.delInDb.call({"query": {"from": "com.palm.phoneApp.autoSwtichTech:1", "where": [{"prop": "tech", "op": "%", "val": ""}]}});
	},
	
	handleUpdateDB : function (inSender, response) {
		this.$.putInDb.call({"objects": [{"_kind": "com.palm.phoneApp.autoSwtichTech:1", "tech": enyo.application.Cache.platformTech}]});
	}	
});

