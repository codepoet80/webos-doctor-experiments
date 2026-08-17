/*globals enyo */
enyo.kind({
	name: "PRL",
	kind: enyo.VFlexBox,
	className: "enyo-bg",
	components: [
		{kind: "RowGroup", name: "provisioning", caption: $L("NETWORK SETTINGS"), components: [
			{kind: "HFlexBox", align: "center", components: [
				{name: "userspinner", kind: "Spinner", showing: false},
				{name: "userlabel", kind: enyo.Label},
				{content: $L("Update network settings"), name: "userprovisioning", onclick: "doTapuserprovisioning"}, 
			]},
		]},
		{kind: "RowGroup", name: "PRL", caption: $L("PREFERRED ROAMING LIST"), components: [
			{kind: "HFlexBox", align: "center", components: [
				{name: "PRLspinner", kind: "Spinner", showing: false},
				{name: "PRLlabel", kind: enyo.Label},
				{content: $L("Update PRL"), name: "PRLprovisioning", onclick: "doTapPRLprovisioning"},
			]},
		]},
		{name: "sysService", kind: enyo.PalmService, service: "palm://com.palm.provisioning/"},
		{name: "busService", kind: enyo.PalmService, service: "palm://com.palm.bus/signal/", method: "registerServerStatus", onSuccess: "handleProvisionServerStatus", onFailure: "handleProvisionServerStatus"},
		{name: "prefService", kind: enyo.PalmService, service: enyo.palmServices.system}, 
		
		{name: "provErrDialog", kind: "DialogPrompt", 
			message: $L("Provisioning service is not available, please try later"),
			acceptButtonCaption: $L("OK"),
		},		
	], 

	create: function() {
		this.inherited(arguments);
		this.$.prefService.call({
			"keys" : ["showUpdateNetworkSettings", "showUpdatePRL"]
		},{
			method: "getPreferences",
			onSuccess: "updateNetworkSettingDone",
			onFailure: "updateNetworkSettingDone"
		});
			
		this.$.provisioning.hide();
		this.provisioningInited = false; 
		this.setup(); 
	},

	setup: function() {
		if(enyo.application.Cache.platformType == "cdma") {		

			if (this.showUpdateNetworkSettings == true) {
				this.$.provisioning.show();
				
				if (!this.provisioningInited) {
					this.$.userspinner.setShowing(true);
					this.$.userprovisioning.hide();					
					this.initOnProvisionStart();
				}					
			}						
			if (this.showUpdatePRL == true) {
				this.$.PRL.show();
			} else {
				this.$.PRL.hide();
			}
		}
	},

	updateNetworkSettingDone: function(inSender, payload) {
		if (payload && payload.showUpdatePRL !== undefined){			
			this.showUpdatePRL = payload.showUpdatePRL;
		}
		if (payload && payload.showUpdateNetworkSettings == true) {			
			this.showUpdateNetworkSettings = true;
			this.setup(); 
		}
	},
	

	initOnProvisionStart: function() {	
		this.provisioningInited = true; 
		this.$.busService.call({"serviceName":"com.palm.provisioning"}); 
	},

	handleProvisionServerStatus: function(inSender, payload) {
enyo.log(enyo.json.stringify(payload));		
		if (payload.connected == true)
			this.provisioningStatusSubscribe();
		else{//provision is down
			this.$.userprovisioning.show(); 
			this.$.userspinner.setShowing(false);
			if (this.provisionRequest !== undefined) {
				this.$.provisioningStatusService.cancel();
				this.provisionRequest = undefined;
			}
		}
	},	

	doTapuserprovisioning: function() {
		if (this.provisionRequest == undefined) {//no provisioning service	
			this.$.provErrDialog.open(); 
		}
		else{
			if (this.UserWaitingForTimeout ==true){
				if (this.hasCheckmark == true)
					this.restoreProvision("User", "checkmark");
				else
					this.restoreProvision("User");
			} else if (this.cancelable == true) {
				if (!(this.PRLCancelRestoreProvisionTimeout || this.UserCancelRestoreProvisionTimeout || this.restoreProvisionTimeout)) {
					if (this.userProvisionTaped) 
						this.cancelUserProvisionRequest();
				}
			} else{ 
				if (this.cancelable == undefined) {
					this.userProvisionTaped = true;
					this.updateUserProvision();
				}
			}
		}
	},

	doTapPRLprovisioning: function () {

		if (this.provisionRequest == undefined) {//no provisioning service
			this.$.provErrDialog.open(); 
		}
		else {
			if (this.PRLWaitingForTimeout ==true){
				if (this.hasCheckmark == true)
					this.restoreProvision("PRL", "checkmark");
				else
					this.restoreProvision("PRL");
			}
			else if (this.cancelable == true) {
				if (!(this.PRLCancelRestoreProvisionTimeout || this.UserCancelRestoreProvisionTimeout || this.restoreProvisionTimeout)) {
					if (this.PRLTaped) 
						this.cancelPRLProvisionRequest();
				}
			}
			else {
				if (this.cancelable == undefined) {
					this.PRLTaped = true;
					this.updatePRLProvision();
				}
			}
		}
	},

	updatePRLProvision: function(){
		//SystemService.executeBusCall("palm://com.palm.provisioning", "/PRL", {}, null);
		this.$.sysService.call({},{
			method: "PRL"
		});
		this.$.PRLprovisioning.setContent($L("Cancel update"));
		this.$.PRLspinner.setShowing(true);
		this.cancelable = true;
	},

	cancelPRLProvisionRequest: function(){
		
		//SystemService.executeBusCall("palm://com.palm.provisioning", "/Cancel", {}, null);
		this.$.sysService.call({},{
			method: "Cancel"
		});
		this.$.PRLprovisioning.setContent($L("Update canceled"));
		this.$.PRLspinner.setShowing(false);

		this.PRLWaitingForTimeout = true;
		if(this.PRLCancelRestoreProvisionTimeout)
			window.clearTimeout(enyo.hitch(this, "PRLCancelRestoreProvisionTimeout"));

		this.PRLCancelRestoreProvisionTimeout = window.setTimeout(enyo.hitch(this, "restoreProvision"), 5000);
	},

	provisioningStatusSubscribe: function(){
enyo.log();	
		//SystemService.executeBusCall("palm://com.palm.provisioning", "/SessionStatus", {"subscribe": true}, enyo.hitch(this, "onProvisionSessionStatus"));
		this.$.provisioningStatusService.call({
			subscribe: true
		},{
			method: "SessionStatus",
			onSuccess: "onProvisionSessionStatus"
		});
		this.provisionRequest = true; 
	},
	
   	onProvisionSessionStatus: function(inSender, payload){
enyo.log(enyo.json.stringify(payload));
		if(!payload.returnValue) {
			onProvisionSessionStatusFailure(payload);
			return;
		}
		
		if(payload.status){	
			switch (payload.status.toLowerCase()) {
				case 'noupdate':
					this.$.PRLprovisioning.show();
					this.$.PRLprovisioning.setContent($L("No PRL update available"));
					//$("PRLLabel").addClassName('checkmark');

					this.hasCheckmark = true;
					this.$.PRLspinner.setShowing(false);
					this.$.PRLspinner.hide();

					if(this.restoreProvisionTimeout)
						window.clearTimeout(this.restoreProvisionTimeout);
					this.restoreProvisionTimeout = window.setTimeout(enyo.hitch(this, "restoreProvision"), 5000);

					this.PRLWaitingForTimeout = true;
					break;
				case 'waiting':
				case 'busy':
					this.cancelable = payload.cancelable;
					break;
				case 'success':
					if (payload.trigger == "PRL") {
						this.$.PRLprovisioning.show();
						this.$.PRLprovisioning.setContent($L("PRL updated"));
						//$('PRLlabel').addClassName('checkmark');
						this.hasCheckmark = true;
						
						this.$.PRLspinner.setShowing(false);
						this.$.PRLspinner.hide();
						this.PRLWaitingForTimeout = true;
					}
					else if(payload.trigger == "User"){
						this.$.userprovisioning.show();
						this.$.userprovisioning.setContent($L("Settings updated"));
						//$('userlabel').addClassName('checkmark');
						this.hasCheckmark = true;

						this.$.userspinner.setShowing(false);
						this.$.userspinner.hide();
						this.UserWaitingForTimeout = true;
					}
					//show check mark
					if(this.restoreProvisionTimeout)
						window.clearTimeout(this.restoreProvisionTimeout);
					this.restoreProvisionTimeout = window.setTimeout(enyo.hitch(this, "restoreProvision"), 5000);
					break;
				case 'failure':
					this.cancelable = undefined;
					
					var errMsg;
					if (payload.trigger == "PRL") {
						this.PRLTaped = undefined;
						this.$.PRLprovisioning.show();
						this.$.PRLprovisioning.setContent($L("Update PRL"));

						this.$.PRLspinner.setShowing(false);
						this.$.PRLspinner.hide();
						errMsg = $L("The PRL update could not be completed. Try again later. If the problem persists, call #{carrier} Customer Service.").interpolate({carrier:this.carrier});
					}
					else if (payload.trigger == "User")
					{
						this.userProvisionTaped = undefined;
						this.$.userprovisioning.show();
						this.$.userprovisioning.setContent($L("Update network settings"));

						this.$.PRLspinner.setShowing(false);
						this.$.PRLspinner.hide();
						errMsg = $L("The network settings could not be updated. Try again later. If the problem persists, call #{carrier} Customer Service.").interpolate({carrier:this.carrier});
					}
					this.doDialog(errMsg, payload.errorCode);
					break;
				default:
					break;
			}
		}		
	},

   	onProvisionSessionStatusFailure: function(payload){
		
		if (payload.status && payload.status.toLowerCase() == "failure") {
			this.cancelable = undefined;
			
			var errMsg;
			if (payload.trigger == "PRL") {
				this.PRLTaped = undefined;
				this.$.PRLprovisioning.setContent($L("Update PRL"));				
				this.$.PRLspinner.setShowing(false);
				errMsg = $L("The PRL update could not be completed. Try again later. If the problem persists, call #{carrier} Customer Service.").interpolate({carrier:this.carrier});
			}
			else if (payload.trigger == "User")
			{
				this.userProvisionTaped = undefined;
				this.$.userprovisioning.setContent($L("Update network settings"));
				this.$.userspinner.setShowing(false);
				errMsg = $L("The network settings could not be updated. Try again later. If the problem persists, call #{carrier} Customer Service.").interpolate({carrier:this.carrier});
			}
			this.doDialog(errMsg,payload.errorCode);
		}
		else if(payload.serviceName == "com.palm.provisioning" && payload.returnValue == false){
			if (this.provisionRequest !== undefined)
				this.$.provisioningStatusService.cancel();
			this.provisionRequest = undefined;
		}
		else {
			this.cancelable = undefined;
			this.PRLTaped = undefined;
			this.userProvisionTaped = undefined;
			this.$.PRLprovisioning.setContent($L("Update PRL"));
			this.$.userprovisioning.setContent($L("Update network settings"));
		}
	},

	restoreProvision:function(type, classname){
		
		if (this.PRLCancelRestoreProvisionTimeout) {
			window.clearTimeout(this.PRLCancelRestoreProvisionTimeout);
			this.PRLCancelRestoreProvisionTimeout = undefined;
			this.$.PRLprovisioning.setContent($L("Update PRL"));
			//if(classname !== undefined)
				//$('PRLlabel').removeClassName(classname);
		}
		
		if(this.UserCancelRestoreProvisionTimeout){
			window.clearTimeout(this.UserCancelRestoreProvisionTimeout);
			this.UserCancelRestoreProvisionTimeout = undefined;
			this.$.userprovisioning.setContent($L("Update network settings"));
			//if(classname !== undefined)
				//$('userlabel').removeClassName(classname);
			
		}			
		if (this.restoreProvisionTimeout) {
			window.clearTimeout(this.restoreProvisionTimeout);
			this.restoreProvisionTimeout = undefined;
		
			if (type == "PRL") {
				this.$.PRLprovisioning.setContent($L("Update PRL"));
				//if(classname !== undefined)
					//$('PRLlabel').removeClassName(classname);
			}
			else {
				this.$.userprovisioning.setContent($L("Update network settings"));
				//if(classname !== undefined)
					//$('userlabel').removeClassName(classname);
			}
		}
		this.cancelable = undefined;
		this.PRLTaped = undefined;
		this.userProvisionTaped = undefined;
		this.PRLWaitingForTimeout = false;
		this.UserWaitingForTimeout = false;

	}
});
