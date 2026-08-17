/*global _, console, Messaging, Globalization, RB, Foundations, Future*/
/**
 * Copyright 2010 Palm, Inc.  All rights reserved.
 */


Messaging.Availability = {
	AVAILABLE: 0,
	BUSY: 2,
	INVISIBLE: 3,
	OFFLINE: 4,
	NO_PRESENCE: 4 //Note, this used to be 6 because we differentiated between none and offline
};

Messaging.Utils = {
	_phoneTypeServiceNames: {
		"sms":         true,
		"mms":         true,
		"type_home":   true,
		"type_home_fax":   true,
		"type_work":   true,
		"type_business":   true,
		"type_mobile": true,
		"type_car":	   true,
		"type_pager":  true,
		"type_work_fax": true,
		"type_sim":true,
		"type_primary":  true,
		"type_other":  true,
		"type_home2":   true,
		"type_home_fax2":   true,
		"type_work2":   true,
		"type_business2":   true,
		"type_mobile2": true,
		"type_car2":	   true,
		"type_pager2":  true,
		"type_work_fax2": true,
		"type_sim2":true,
		"type_primary2":  true,
		"type_other2":  true
	},
	
	kDefaultBuddyGroup: RB.$L("Buddies"),
	kMissingAddress: RB.$L("No Recipient"),

	/**
	 * Returns true if the service is a SMS/MMS type
	 */
	isTextMessage: function(serviceName) {
		return (serviceName === undefined || serviceName === "" || this._phoneTypeServiceNames[serviceName] === true);
	},
	
	/**
	 * Returns a formatted version of the address to be used for display. This is primarily used for phone numbers.
	 */
	formatAddress: function(address, serviceName) {
		var formattedAddress = address;
		if (!address) {
			console.warn("Messaging.Utils.formatAddress address is empty. Using kMissingAddress");
			formattedAddress = Messaging.Utils.kMissingAddress;
		} else {
			if (Messaging.Utils.isTextMessage(serviceName) && address.indexOf('@') === -1) {
				var numberObj = Globalization.Phone.parsePhoneNumber(address);
				// If subscriber number wasn't found, the phone number isn't valid
				if (numberObj.subscriberNumber) {
					formattedAddress = Globalization.Format.formatPhoneNumber(numberObj);
				}
			}
		}
		return formattedAddress;
	},
	
	normalizeAddress: function(address, serviceName) {
		// first trim leading and trailing whitespace
		if (!address) {
			console.error("Messaging.Utils.Conversations.normalizeAddress missing address");
			address = Messaging.Utils.kMissingAddress;
		}

		if (typeof address === "object") {
			console.warn("normalizeAddress was passed an object for the address!!! Can I handle this???");
			if (address.addr) {
				console.warn("Yes, I can handle it. address.addr ain't so bad");
				address = address.addr;
			} else if (address.value) {
				console.warn("Yes, I can handle it. address.value ain't so bad");
				address = address.value;
			} else {
				console.warn("No, I can't handle it :( Why did you give me "+JSON.stringify(address));
				address = Messaging.Utils.kMissingAddress;
			}
		}

		var normalizedAddress = address.replace(/^\s*/, "").replace(/\s*$/, "");
		if (Messaging.Utils.isTextMessage(serviceName) && (address.indexOf('@') === -1)) {
			var normalizedShortcode = Messaging.Utils.normalizeShortcode(normalizedAddress);
			if (normalizedShortcode !== false) {
				normalizedAddress = normalizedShortcode;
			} else {
				// Just use the subscriber number from the phone number (stripping off extras, like area code)
				var numberObj = Globalization.Phone.parsePhoneNumber(normalizedAddress);
				normalizedAddress = numberObj.subscriberNumber || normalizedAddress;
			}
		} else {
			// Ignore email addresses
			// TODO: Strip out '.'s from email addresses, trim whitespace,
			normalizedAddress = normalizedAddress.toLowerCase();
		}
		// webOS WhatsApp: unify the address variants so an outgoing "+<phone>", an incoming
		// "<phone>@s.whatsapp.net" and a bare "<phone>" all thread to the SAME conversation. We
		// canonicalize to E.164 ("+<phone>") so the chatthread key MATCHES the contacts framework's
		// im normalizedValue (IMAddress.normalizeIm keeps the "+"); that lets the thread link to its
		// contact/person. The opaque "<id>@lid" (a LinkedID with no phone) is left as-is.
		if (serviceName === "type_whatsapp") {
			var waAddr = normalizedAddress.toLowerCase();
			var waAt = waAddr.indexOf("@");
			if (waAt !== -1 && waAddr.substring(waAt) === "@s.whatsapp.net") {
				waAddr = waAddr.substring(0, waAt);
			}
			// prefix "+" for a bare phone-number id (E.164); "+<phone>" and opaque @-ids are left as-is
			if (waAddr.charAt(0) !== "+" && waAddr.indexOf("@") === -1 && (/^[0-9]+$/).test(waAddr)) {
				waAddr = "+" + waAddr;
			}
			normalizedAddress = waAddr;
		}
		//console.log("***normalizeAddress after "+normalizedAddress);
		return normalizedAddress;
	},

	normalizeShortcode: function(shortcode) {
		if (shortcode) {
			// strip out all non-numeric characters.
			var normalizedShortcode = shortcode.replace(/\D*/g, "");
			// TODO this is valid for a lot of countries, but not all. Need to use the
			// Globalization library API once it is ready.
			if (normalizedShortcode.length > 1 && normalizedShortcode.length < 7) {
				return normalizedShortcode;
			}
		}
		
		return false;
	}
};

