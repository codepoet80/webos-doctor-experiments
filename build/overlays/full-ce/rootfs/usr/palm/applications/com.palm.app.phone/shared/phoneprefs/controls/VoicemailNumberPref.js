/*globals enyo */
enyo.kind({
	name: "VoicemailNumber",
	kind: enyo.VFlexBox,
	className: "enyo-bg",
	components: [
		{kind: "RowGroup", caption: $L("VOICEMAIL NUMBER"), components: [
			{className: "enyo-row", components: [
				{name: "voicemailSpinner", kind: "Spinner", className: "default-row"},
				{name: "voicemailNumberField", kind: "RichText", autoKeyModifier: "num-lock", onchange: "voicemailChangeHandler"}
			]},
		]},

		//Service calls
		{name: "dbService", kind: enyo.PalmService, service: enyo.palmServices.database, method: "find", onSuccess: "voiceNumberQueryDoneCarrierDb", onFailure: "voiceNumberQueryDoneCarrierDb"},
		{name: "vnQuery", kind: enyo.PalmService, service: enyo.palmServices.telephony, subscribe: true, method: "voicemailNumberQuery", onSuccess: "voiceNumberQueryDone", onFailure: "voiceNumberQueryDone"},		
		{name: "voicemailNumberSet", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "voicemailNumberSet", onSuccess: "setVMHanlder", onFailure: "setVMHanlder"},
		{name: "vmnsystemService", kind: enyo.PalmService, service: "palm://com.palm.systemservice/", method: "getPreferences", onSuccess: "updateVoicenumberEditableQueryDone", onFailure: "updateVoicenumberEditableQueryDone"},
	],

	create: function() {
		this.inherited(arguments);
                
		//this.updateUI();
	},
	
	updateUI: function() {
        	this.$.voicemailNumberField.setValue("");
        	
	       	this.voicemailNumberToshow = $L("Waiting for network");
		this.$.voicemailNumberField.setHint(this.voicemailNumberToshow);

		this.$.voicemailNumberField.setDisabled(true);
		this.$.voicemailSpinner.setShowing(true);
		this.$.voicemailNumberField.hide();

		this.$.vnQuery.call({});
		// big todo: just use the following to get the voicemail number:
		//var number = enyo.application.VoicemailService.getVoicemailNumber();
		//this.voiceNumber = number;
		//this.$.voicemailNumberField.setValue(number? enyo.application.Utils.FormatPhoneNumber(number) : "unable to find");

		this.$.vmnsystemService.call({
			"keys": ["allowEditVoicemail"]
		}); 
	},

	voiceNumberQueryDone: function(inSender, payload) {
		//enyo.log("voiceNumberQueryDone "+enyo.json.stringify(payload));

		if (payload.returnValue && payload.extended && payload.extended.number && payload.extended.number !== "") {
			this.voiceNumber = payload.extended.number;
			enyo.log("Voicemail Number = " + this.voiceNumber);
			this.voicemailNumberToshow = enyo.application.Utils.FormatPhoneNumber(this.voiceNumber);
			//enyo.log("voicemailNumberToshow " + this.voicemailNumberToshow);

			this.$.voicemailSpinner.setShowing(false);

			this.$.voicemailNumberField.setValue(this.voicemailNumberToshow);
			this.$.voicemailNumberField.show();

		} else { //failed to get voicemail number
			enyo.log("try to get it from carrier db");
			this.$.dbService.call({"query": {'from': "com.palm.carrierdb.settings.current:1"}});
		}
	},
	
	voiceNumberQueryDoneCarrierDb: function(inSender, payload) {
		//enyo.log("voiceNumberQueryDoneCarrierDb "+enyo.json.stringify(payload));

		this.$.voicemailSpinner.setShowing(false);
		this.$.voicemailNumberField.show();

		if (payload && payload.results && payload.results.length > 0 && payload.results[0].voicemailNumber) {
			this.voiceNumber = payload.results[0].voicemailNumber;
			this.voicemailNumberToshow = enyo.application.Utils.FormatPhoneNumber(this.voiceNumber);
			this.$.voicemailNumberField.setValue(this.voicemailNumberToshow);
		} else{//failed to get voicemail number
			this.voicemailNumberToshow = $L("Unable to access voicemail number.");
			this.$.voicemailNumberField.setHint(this.voicemailNumberToshow);
		}

		//this.$.voicemailNumberField.setValue(this.voicemailNumberToshow);

	},

	updateVoicenumberEditableQueryDone: function(inSender, payload) {
		//enyo.log("updateVoicenumberEditableQueryDone " + enyo.json.stringify(payload));
		if (payload) {
			this.$.voicemailNumberField.setDisabled(!payload.allowEditVoicemail);
		}
	},

	voicemailChangeHandler: function() {
		//enyo.log("voicemailChangeHandler");

		var newValue = this.$.voicemailNumberField.getValue();
		//enyo.log("newValue = " + newValue)

		if (newValue !== this.voiceNumber) {
			this.lastVoiceNumber = this.voiceNumber;
			this.voiceNumber = this.normalizeNumber(newValue);
			
			// always format
			this.voicemailNumberToshow = enyo.application.Utils.FormatPhoneNumber(this.voiceNumber);
			this.$.voicemailNumberField.setValue(this.voicemailNumberToshow);

			//enyo.log("setting voicenumber "+this.voiceNumber);
			this.$.voicemailNumberSet.call({
				"number": this.voiceNumber
			});
		}
	},

	setVMHanlder: function(inSender, payload) {
	enyo.log("setVMHanlder "+enyo.json.stringify(payload));

		if (!payload.returnValue) {
			//TODO :revert value if it wasn't set
			this.voiceNumber = this.lastVoiceNumber;
			this.voicemailNumberToshow = enyo.application.Utils.FormatPhoneNumber(this.voiceNumber);
			this.$.voicemailNumberField.setValue(this.voicemailNumberToshow);
		}
	},

	// strips characters that aren't valid for dialing at all
	normalizeNumber: function(number) {
		var validDigits = "+01234567890*#pwt";
		
		var out = "";
		for (var i = 0; i < number.length; i++) {
			var curDigit = number.charAt(i);
			if (validDigits.indexOf(curDigit) >= 0) {
				out += curDigit;
			}
		}
		
		// numbers starting with p or w aren't valid
		if (out.length > 0) {
			var firstDigit = out.charAt(0);
			switch (firstDigit) {
				case 'p':
				case 'w':
				case 't':
					enyo.log("invalid digits");
					return "";
			}
		}
		
		return out;
	}
	
});
