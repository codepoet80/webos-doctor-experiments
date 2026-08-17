/*jslint white: false, onevar: false, nomen:false, plusplus: false */
/*globals enyo */

enyo.kind({
	name: "Security",
	kind: "VFlexBox",
	events: {
		onRefreshCard:""
	},
	components: [
		{kind: "RowGroup", caption: $L("SECURITY"), components: [
			{name: "lockSIM", layoutKind: "HFlexLayout", align: "center", components: [
				{name: "unlockSimCardButton", flex: 1, content: $L("Lock SIM Card"), onclick: "simClick"},
		 		{name: "warningSIM", kind:"CustomButton", className: "warning-button", showing: false}, 										
			]},
			{name: "changeSIM", layoutKind: "HFlexLayout", align: "center", content: $L("Change SIM Card PIN"), showing: false, onclick: "changeSimClick"},

		]},
		{name: "pin1Service", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "pin1StatusQuery", subscribe: true, onSuccess: "pin1Response", onFailure: "pin1Response"},
	],

	create: function() {
		this.inherited(arguments);
                enyo.log("Sending pin request to modem");
		this.$.pin1Service.call();
	},

	updateUI: function() {
		this.updatePinUI(); 
	},
	
	updatePinUI: function () { 	
		if (PinStatus.Pukrequired == 1){
			this.$.unlockSimCardButton.setContent($L("PUK Required"));
			this.$.changeSIM.hide();			
		} else if (PinStatus.PinLocked !== -1) {
			this.$.warningSIM.setShowing(false);
			if (PinStatus.PinLocked == 1) {
				this.$.unlockSimCardButton.setContent($L("Unlock SIM Card"));
				this.$.changeSIM.show();
			}
			else {
				this.$.unlockSimCardButton.setContent($L("Lock SIM Card"));
				this.$.changeSIM.hide();
			}
		} else {
			this.$.warningSIM.setShowing(true);
			this.$.changeSIM.hide();
		}
	},	
	
	simClick: function() {
		var pinAction; 
		if (PinStatus.Pukrequired == 1) {
			pinAction = PinAction.PUK_Enter;
		}
		else if (PinStatus.PinLocked === -1) {
			return;
		}
		else {		
			pinAction = PinAction.PinCode_Lock;
			if (PinStatus.PinLocked == 1) {
				pinAction = PinAction.PinCode_UnLock;
			}
		}
 
		var params = {
			"launchType": "pinCode",
			"pinAction": pinAction,
			"nextView": "main"
		}
		enyo.log(params);
		enyo.application.UI.event("changeView", params);
	},

	changeSimClick: function() {
		var params = {
			"launchType": "pinCode",
			"pinAction": PinAction.PinCode_Change,
			"nextView": "main"			
		}
		enyo.application.UI.event("changeView", params);
	},

	pin1Response: function(inSender, response) {
enyo.log(enyo.json.stringify(response));		
		if (response.returnValue && response.extended){
			PinStatus.Devicelocked = response.extended.devicelocked; 
			PinStatus.Pinpermblocked = response.extended.pinpermblocked; 
			PinStatus.Pukrequired = response.extended.pukrequired; 
			PinStatus.Pinrequired = response.extended.pinrequired; 
			PinStatus.PinLocked = response.extended.enabled;
			PinStatus.pinAttemptsRemaining = response.extended.pinAttemptsRemaining;
			PinStatus.pukAttemptsRemaining = response.extended.pukAttemptsRemaining;			
			
			this.updatePinUI(); 
			
			//let telinterface handle it
			/*if (PinStatus.Pinpermblocked == true) {
				var params = {"launchType":"pinCode", "pinAction":PinAction.SimLocked, "nextView": "main"};
				enyo.application.UI.event("changeView", params);
			} else if (PinStatus.Pukrequired == true) {
				var params = {"launchType":"pinCode", "pinAction":PinAction.PUK_Enter, "nextView": "main"};
				enyo.application.UI.event("changeView", params);
			} else if (PinStatus.Pinrequired == true) {
				var params = {"launchType":"pinCode", "pinAction":PinAction.PinCode_Verify, "nextView": "main"};
				enyo.application.UI.event("changeView", params);
			}*/ 			
		} else {
			PinStatus.PinLocked = -1; 
			this.$.warningSIM.setShowing(true);
			this.$.changeSIM.hide();
		}
	},

	pin2Response: function(inSender, response) {
enyo.log(enyo.json.stringify(response));			
		if (response.returnValue && response.extended){
			PinStatus.Devicelocked = response.extended.devicelocked; 
			PinStatus.Pin2permblocked = response.extended.pinpermblocked; 
			PinStatus.Puk2required = response.extended.pukrequired; 
			PinStatus.Pin2required = response.extended.pinrequired; 
			PinStatus.pin2AttemptsRemaining = response.extended.pinAttemptsRemaining;
			PinStatus.puk2AttemptsRemaining = response.extended.pukAttemptsRemaining;	
		}		
		this.doRefreshCard(); 
	},
	
	fdnStatusResponse: function (inSender, response){
enyo.log(enyo.json.stringify(response));
		if (response && response.returnValue && response.extended) {//success
			PinStatus.FdnEnabled = response.extended.enabled; 		
			
			if (response.extended.permanentblock) {
				PinStatus.Pin2permblocked = response.extended.permanentblock; 
			} else {
				PinStatus.Pin2permblocked = -1;
			}
		}
		else {
			PinStatus.FdnEnabled = -1; //fdn status is undetermined
		} 

		this.doRefreshCard(); 

	}
});
