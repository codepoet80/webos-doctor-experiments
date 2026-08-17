// finds a person by phone or IM
enyo.kind({
	name: "Utils.PersonFind",
	kind: enyo.DbService,
	method: "find",
	dbKind: "com.palm.person:1",
	findById: function(inPersonId, inFallbackAddress, inFallbackService) {
		this.fallbackAddress = inFallbackAddress;
		this.fallbackService = inFallbackService;
		this.parsedPhoneNumber = null;
		return this.call({ids: [inPersonId]}, {method:"get"});
	},
	findByPhone: function(phoneNumber, requestParams) {
		var normalizedPhoneNumber;
		this.fallbackAddress = undefined;
		this.parsedPhoneNumber = new enyo.g11n.PhoneNumber(phoneNumber, {mcc: enyo.application.TelephonyStatusInterface.mcc});
		
		if (this.parsedPhoneNumber && (this.parsedPhoneNumber.areaCode || this.parsedPhoneNumber.countryCode || this.parsedPhoneNumber.iddPrefix)) {
			normalizedPhoneNumber = Utils.PersonFind.normalizePhoneNumber(phoneNumber, false);
		} else {
			normalizedPhoneNumber = Utils.PersonFind.normalizePhoneNumber(phoneNumber, true);
		}
		return this.call({
			query: {
				where: [{
					prop: "phoneNumbers.normalizedValue",
					op: "%",
					val: normalizedPhoneNumber
				}]
			}
		}, enyo.mixin(requestParams,{requestedPhoneNumber: normalizedPhoneNumber}));
	},
	findByIm: function(imAddress, requestParams) {
		this.fallbackAddress = undefined;
		this.parsedPhoneNumber = null;
		var normalizedIm = Utils.PersonFind.normalizeIm(imAddress);
		return this.call({
			query: {
				where: [{
					prop: "ims.normalizedValue",
					op: "=",
					val: normalizedIm
				}]
			}
		}, enyo.mixin(requestParams,{requestedImAddress: normalizedIm}));
	},
	// returns a response in the format:
	// {
	// 	person: <object from db>
	//	item: <contact point this person was matched on>
	// }
	responseSuccess: function(inRequest) {
		var delegate = inRequest.onFailure;
		var contactPointType;
		if ( inRequest.response.results && inRequest.response.results.length > 0 ) {
			inRequest.response.person = inRequest.response.results[0];
			if (this.parsedPhoneNumber !== null) {
				var len = inRequest.response.person.phoneNumbers.length;
				for (var i = 0; i < len; i++) {
					var phNum = inRequest.response.person.phoneNumbers[i];
					var parsedPhNum = new enyo.g11n.PhoneNumber(phNum.value, {mcc: enyo.application.TelephonyStatusInterface.mcc});
					var matchQuality = this.parsedPhoneNumber.compare(parsedPhNum);
					if (matchQuality > 0) {
						delegate = inRequest.onSuccess;
						break;
					}
				}
				this.parsedPhoneNumber = null;
			} else {
				delegate = inRequest.onSuccess;
			}
			
			if ( inRequest.requestedPhoneNumber ) {
				inRequest.response.item = Utils.PersonFind.getContactPointFromPerson(inRequest.requestedPhoneNumber, "phoneNumbers", inRequest.response.person);
			} else {
				inRequest.response.item = Utils.PersonFind.getContactPointFromPerson(inRequest.requestedImAddress, "ims", inRequest.response.person);
			}
		} else if ( this.fallbackAddress ) {
			// Any non-cellular transport (whatsapp/telegram/signal/teams/...) whose address isn't
			// phone-number-shaped is an IM id/@handle/UUID - look it up as IM, not as a phone number.
			// (TRANSPORTS.SKYPE never existed, so this always fell through to findByPhone before.)
			if ( this.fallbackService && this.fallbackService !== enyo.application.CallSynergizer.TRANSPORTS.TIL
					&& !enyo.application.Utils.isValidNumber(this.fallbackAddress) ) {
				this.findByIm(this.fallbackAddress);
			} else {
				this.findByPhone(this.fallbackAddress);
			}
			return;
		}
		this.dispatchResponse(delegate, inRequest);
	}
});

// static functions

// helper iterates person for a contact point matching normalizedAddress
Utils.PersonFind.getContactPointFromPerson = function(normalizedAddress, contactPointType, person) {
	var i;
	if ( person[contactPointType] ) {
		for (i=0; i<person[contactPointType].length; i++) {
			if ( person[contactPointType][i].normalizedValue.indexOf(normalizedAddress) === 0 ) {
				return person[contactPointType][i];
			}
		}
	}
}

// helper is copied from blowfish Contacts lib PhoneNumber.normalizePhoneNumber
Utils.PersonFind.normalizePhoneNumber = function (phoneNumber, wantSearchFormat) {
	var parsedPhoneNumber, normalizedValue;
	
	parsedPhoneNumber = wantSearchFormat ? new enyo.g11n.PhoneNumber(phoneNumber)
										 : new enyo.g11n.PhoneNumber(phoneNumber, {mcc: enyo.application.TelephonyStatusInterface.mcc});
	
	normalizedValue = "";
	
	if (parsedPhoneNumber.extension) {
		normalizedValue += parsedPhoneNumber.extension.split("").reverse().join("");
	}
	normalizedValue += "-";
	if (parsedPhoneNumber.subscriberNumber) {
		normalizedValue += parsedPhoneNumber.subscriberNumber.split("").reverse().join("");
	} else if (parsedPhoneNumber.serviceCode) {
		normalizedValue += parsedPhoneNumber.serviceCode.split("").reverse().join("");
	} else if (parsedPhoneNumber.emergency) {
		normalizedValue += parsedPhoneNumber.emergency.split("").reverse().join("");
	} else if (parsedPhoneNumber.vsc) {
		normalizedValue += parsedPhoneNumber.vsc.split("").reverse().join("");
	}
	normalizedValue += "-";
	
	if (!wantSearchFormat) {
		if (parsedPhoneNumber.areaCode) {
			normalizedValue += parsedPhoneNumber.areaCode.split("").reverse().join("");
		}
		normalizedValue += "-";
		if (parsedPhoneNumber.countryCode) {
			normalizedValue += parsedPhoneNumber.countryCode.split("").reverse().join("");
		}
		normalizedValue += "-";
		if (parsedPhoneNumber.iddPrefix) {
			normalizedValue += parsedPhoneNumber.iddPrefix.split("").reverse().join("");
		}
	}

	return normalizedValue;
};

// helper is copied from blowfish Contacts lib IMAddress.normalizeIm
Utils.PersonFind.normalizeIm = function (str) {
	return str.toLowerCase().trim();
};