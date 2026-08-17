/*globals enyo */
enyo.kind({
	name: "Provisioning",
	kind: enyo.VFlexBox,
	className: "enyo-bg",
	components: [
		{kind: "RowGroup", name: "provisioning", caption: $L("NETWORK SETTINGS"), components: [
			{kind: "HFlexBox", align: "center", components: [
				{w: "fill", content: $L("Update network settings"), className: "default-row"}, 
				{name: "user-provisioning", kind: "Button"},
			]},
		]},
	], 

	create: function() {
		this.inherited(arguments);

		if(enyo.application.Cache.platformType == "cdma") {
			this.initOnProvisionStart();
		}
	},

	onTap: function() {
		if (this.provisionRequest == undefined) {//no provisioning service
			this.doDialog($L("Provisioning service is not available, please try later"), "");
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

	updateUserProvision: function() {
		this.updateUserProvisionReq = new enyo.Service.Request('palm://com.palm.provisioning/User', {});
		$('user-provisioning').innerHTML = $L("Cancel update");
		//this.spinnerProvisioningModel.spinning = true;
		//this.controller.modelChanged(this.spinnerProvisioningModel);
		this.cancelable = true;
	},

	cancelUserProvisionRequest:function() {
		this.cancelUserProvisionReq2 =  new enyo.Service.Request('palm://com.palm.provisioning/Cancel', {});
		$('user-provisioning').innerHTML = $L("Update canceled");
		//if ($('PRL-spinner')) {
		//	this.spinnerProvisioningModel.spinning = false;
		//	this.controller.modelChanged(this.spinnerProvisioningModel);
		//}
		this.UserWaitingForTimeout = true;
		if(this.UserCancelRestoreProvisionTimeout)
			window.clearTimeout(this.UserCancelRestoreProvisionTimeout);
		this.UserCancelRestoreProvisionTimeout = window.setTimeout(this.restoreProvision.bind(this, "User"), 5000);
	},	
});
