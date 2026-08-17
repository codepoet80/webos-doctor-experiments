
enyo.kind({
	name: "WifiService",
	kind: enyo.Component,
	components: [
		{name: "wifiStatus", kind:"PalmService", service: "palm://com.palm.wifi/", method:"getstatus", subscribe: true, onSuccess:"gotWifiStatus", onFailure:"gotWifiStatus"}	
	],


	create: function() {
		this.inherited(arguments);	
		this.$.wifiStatus.call({});
	},
	
	destroy: function() {
		this.$.wifiStatus.cancel();
		this.inherited(arguments);
	},


    	gotWifiStatus: function(inSender, response) {
		if (response && response.networkInfo !== undefined) {
			enyo.log("wifi service: network available");
			enyo.application.Cache.wifiAvailable = true;
		} else {
			enyo.application.Cache.wifiAvailable = false;
		}
	}
});


