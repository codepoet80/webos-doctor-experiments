enyo.kind({
    name: "PostSignIn", kind: enyo.VFlexBox,
	events: {onFinish: ""},
    components: [
  		  {kind: "UpdateService", onFailure: "handleGenericFailure", onSuccess: "handleGenericSuccess",
  			components:[
  				{name: "isOTAAvailable", method: "CheckForUpdate",params: {"firstUse" : true},  onResponse: "isOTAAvailableResponse"},
                {name: "getOTAStatus", method: "GetStatusApp", params: {"firstUse" : true}, subscribe: true, onResponse: "isOTAAvailableResponse"}
			]	
  		  },
  		  {kind: "BackupService", onFailure: "handleGenericFailure", onSuccess: "handleGenericSuccess",
  			components:[
  				{name: "isBackupAvailable", method: "getRestoreDevices", onResponse: "isBackupAvailableResponse"},
  				{name: "scheduleAppRestore", method: "scheduleAppRestore", onResponse: "scheduleAppRestoreResponse"}
  			]	
  		  },
	],
	
	create: function(){
		console.info("PostSignIn create...");
		this.inherited(arguments);
		this.reset();
	},
	
	reset: function() { // called by client to reuse component.
		console.info("PostSignIn reset...");
		this.retriedOnce = false;
		this.otaResponse = false;
		this.restoreResponse = false;
		this.$.isOTAAvailable.call({"firstUse":true});
        // make sure status is called after the check for updates.
        this.$.getOTAStatus.call();
        if (!enyo.application.FirstUse.getCreateProfile()) {
            // user signed in to an existing account
            this.$.isBackupAvailable.call();
            this.$.scheduleAppRestore.call();
        } else {
            this.restoreResponse = true;
        }
	},
    
    sendFinish: function(){
        if(this.otaResponse && this.restoreResponse) {
            console.info("restore and OTA finished");
            this.doFinish();
        }               
    },
	
	isOTAAvailableResponse: function(inSender, inResponse){
		if (this.otaResponse) return; //if we already set this to true then do noting. We have seen multiple calls here then causing sendFinish to get called repeatedly.
		
		console.info("inSender:"+inSender+"  isOTAAvailableResponse: " + JSON.stringify(inResponse));
		if(inResponse){
			if(inResponse.priority && (inResponse.priority == "forced" || inResponse.priority == "optional" || inResponse.priority == "default" )) {
			  enyo.application.FirstUse.setSoftwareUpdateAvailable(true);
			}
			else{
				enyo.application.FirstUse.setSoftwareUpdateAvailable(false);
			}
			
            if(inResponse.priority && (inResponse.priority == "forced" || inResponse.priority == "optional")) {
                console.info("Setting OTA available to true");
                enyo.application.FirstUse.setCheckForUpdatesResponsePayload = inResponse;
                enyo.application.FirstUse.setIsOTAAvailable(true);
                this.otaResponse = true;

            } else if(inResponse.priority && (inResponse.priority == "default" || inResponse.priority == "none")) {
                console.info("Setting OTA available to false");
                enyo.application.FirstUse.setIsOTAAvailable(false);
                this.otaResponse = true;

            } else if (inResponse.status && inResponse.status == "Checking") {
                console.info("watching OTA status for results");
                
			} else if (inResponse.status && inResponse.status == "UpToDate") {
				console.info("Setting OTA available to false");
				enyo.application.FirstUse.setIsOTAAvailable(false);
                this.otaResponse = true;
                
			} else {
                console.info("Setting OTA available to false - catch all");
                enyo.application.FirstUse.setIsOTAAvailable(false);
                this.otaResponse = true;
                
            }
		} else {
			console.info("OTA check response" + JSON.stringify(inResponse));
		}
		this.sendFinish();
	},
	
	isBackupAvailableResponse: function(inSender, inResponse){		
		if(inResponse && inResponse.returnValue){
			enyo.application.FirstUse.setNoOfOtherDevices(inResponse.devices.length);
			for(i = 0; i < inResponse.devices.length; i++){
				if(inResponse.devices[i].backups.length > 0){
					enyo.application.FirstUse.setIsBackupAvailable(true);
					enyo.application.FirstUse.setRestoreDevicesResponsePayload(inResponse);
					break;
				}
			}
		} else {
			if (this.retriedOnce) {
				console.info("Error getting restore devices" + JSON.stringify(inResponse));
				enyo.application.FirstUse.setIsBackupAvailableFailed(true);
			} else {
				console.info("Error (will retry) getting restore devices" + JSON.stringify(inResponse));
				this.retriedOnce = true;
            	this.$.isBackupAvailable.call();
				return;
			}
		}
        this.restoreResponse = true;
		console.info("isBackupAvailableResponse: " + JSON.stringify(inResponse));
		this.sendFinish();
	},
	
	scheduleAppRestoreResponse: function(inSender, inResponse) {
	    console.info("scheduleAppRestore response: " + JSON.stringify(inResponse));
	}
});
