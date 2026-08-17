enyo.kind({
	name: "UssdService",
	kind: enyo.PalmService,
	service: enyo.palmServices.telephony,
	method: "ussdSend",
	timeout: 65000, // 65 seconds
	send: function(address) {
		enyo.application.UI.event('dial',{dialog:true, message:Messages.mmiPending, hideButton:true});
		enyo.log("sent")
		return this.call({commandText: address});
	},
	responseSuccess: function(inRequest) {
		this.inherited(arguments);
		enyo.application.UI.event('dial',{dialog:false});
		enyo.windows.addBannerMessage($L("USSD request successful"));
	},
	responseFailure: function(inRequest) {
		this.inherited(arguments);
		var message;
		if ( inRequest.didTimeout ) {
			message = Messages.mmiTimeout;
		} else {
			message = $L("USSD request failed.");
			if ( enyo.application.Messages.serviceErrors[inRequest.response.errorCode] ) {
				message += " " + enyo.application.Messages.serviceErrors[inRequest.response.errorCode];
			}
		}
		// switch to dialpad and show error dialog
		enyo.application.UI.event('dial',{dialog:true, message:message});
		
	}
});
