/*globals enyo */
enyo.kind({
	name: "PhoneNumberPref",
	kind: "VFlexBox",
	className: "enyo-bg",
	components: [
		{kind: "RowGroup", name: "phonenumberGroup", caption: $L("PHONE NUMBER"), components: [
			{kind: "HFlexBox", align: "center", components: [
				{name: "phoneNumberField", className: "default-row greyed-out"}
			]}
		]},

		//Service calls
		{name: "telService", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "phoneNumberQuery", subscribe: true, onSuccess: "responseReceived", onFailure: "responseReceived"},								
		
	],
	
	create: function(){
		this.inherited(arguments);
		//this.updateUI();
	},
	
	updateUI: function() {
		this.$.phonenumberGroup.hide();
		this.$.telService.call();
	},
	
	// This function is called once TelephonyService.getPhoneNumber(params, callback) has responsed.
	// This function updates the field with the properly formatted phone number.
	// If onMethodResponse was not specified, the component would have been updated with extended.number by default.
	responseReceived: function(inSender, response) {
		if(response.extended !== undefined) {
			var formattedNumber = this.formatPhoneNumber(response.extended.number);				
			enyo.log("phone number = " + formattedNumber);
			this.$.phoneNumberField.setContent(formattedNumber);
			if(formattedNumber != "") {
				this.$.phonenumberGroup.show();
				return;
			}
		}
 
		this.$.phonenumberGroup.hide();
	},
	
	// Format the phone number to 1 (XXX) YYY-ZZZZ
	// TODO: Replace this with the real phone number formatting function 
	formatPhoneNumber: function(number) {
		if(number === undefined) {
			return "";
		}
		var formattedNumber = "";
		for(var i=0; i<number.length; i++) {
			formattedNumber = number.charAt((number.length-1)-i) + formattedNumber;
			if(i === 3) {
				formattedNumber = "-" + formattedNumber;
			} else if(i === 6) {
				formattedNumber = ") " + formattedNumber;
			} else if(i === 9) {
				formattedNumber = " (" + formattedNumber;
			}
		}
		return formattedNumber;
	}
	
});
