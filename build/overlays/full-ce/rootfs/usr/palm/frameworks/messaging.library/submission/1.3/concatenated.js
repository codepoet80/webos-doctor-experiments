this._root["__MojoFramework_messaging.library"] = function(MojoLoader, exports, root) {


//@ sourceURL=messaging.library/prologue.js

/*global MojoLoader, exports*/
/**
 * Copyright 2010 Palm, Inc.  All rights reserved.
 */

var IMPORTS =  MojoLoader.require(
	{ name: "foundations", version: "1.0" },
	{ name: "underscore", version: "1.0" },
	{ name: "globalization", version: "1.0" }
);

var _ = IMPORTS.underscore._;
var Foundations = IMPORTS.foundations;
var Globalization = IMPORTS.globalization.Globalization;

var Future = Foundations.Control.Future;

var MojoDB = Foundations.Data.DB;
var TempDB = Foundations.Data.TempDB;

var RBfactory = new Globalization.ResourceBundleFactory(MojoLoader.root);
var RB = RBfactory.getResourceBundle();

var Messaging = {};
exports.Messaging = Messaging;


//@ sourceURL=messaging.library/chatthread.js

/*global _, exports, console, Messaging, Globalization, Foundations, MojoDB, Future*/
/**
 * Copyright 2010 Palm, Inc.  All rights reserved.
 */

function ChatThread(rawChatThread)
{
	if (rawChatThread) {
		this._rawChatThread = rawChatThread;
	} else {
		this._rawChatThread = {
			_kind: Messaging.ChatThread._dbkind,
			unreadCount: 0
		};
	}
}

ChatThread.prototype = {
	/**
	 * Load the chatthread from DB, using the passed in _id or the existing raw chatthread's _id
	 */
	load: function(chatThreadId) {
		var future;
		if (!chatThreadId && this._rawChatThread && this._rawChatThread._id) {
			chatThreadId = this._rawChatThread._id;
		}

		if (chatThreadId) {
			future = MojoDB.get(chatThreadId);
			future.then(this, function(future) {
				if (future.result.results && future.result.results.length > 0) {
					this._rawChatThread = future.result.results[0];
					future.result = this._rawChatThread;
				} else {
					this._rawChatThread = undefined;
					future.result = false;
				}
			});
		} else {
			future = new Future();
			future.result = false;
		}
		return future;
	},

	/**
	 * Does a db.merge (if _id is set) or a db.put. 
	 */
	save: function() {
		var future = undefined;
		
		if (this._rawChatThread) {
			if (this._rawChatThread._id) {
				future = MojoDB.merge([ this._rawChatThread ]);
			} else if (this._rawChatThread._kind) {
				future = MojoDB.put([ this._rawChatThread ]);
			}
		}
		
		if (!future) {
			future = new Future();
			future.result = false;
		}
		return future;
	},
	
	/**
	 * Updates the chatthread with to reflect a newly added message
	 */
	updateFromNewMessage: function(rawMessage, addressObj) {
		return Messaging.ChatThread._updateFromNewMessage(this._rawChatThread, rawMessage, addressObj);
	}
};


ChatThread._dbkind = "com.palm.chatthread:1";

/**
 * 
 */
ChatThread._updateFromNewMessage = function _updateFromNewMessage(rawChatThread, rawMessage, addressObj) {
	// Ignore messages that shouldn't change the chatthread: ones that are invisible or
	// in a folder other than "inbox" or "outbox".
	if (!rawMessage || (rawMessage.folder !== "outbox" && rawMessage.folder !== "inbox") ||
		!Messaging.Message.isVisible(rawMessage)) {
		return rawChatThread;
	}
			
	if (rawChatThread) {
		if (!rawChatThread.flags) {
			rawChatThread.flags = {};
		}
		rawChatThread.flags.outgoing = (rawMessage.folder === "outbox");
		rawChatThread.flags.visible = true; // since a new message was added, ensure the thread is visible
	} else {
		// Assume we're creating a new chat thread
		rawChatThread = {
			_kind: Messaging.ChatThread._dbkind,
			unreadCount: 0,
			flags: {
				outgoing: (rawMessage.folder === "outbox")
			}
		};
	}
	
	rawChatThread.timestamp = rawMessage.localTimestamp || Date.now();
	rawChatThread.summary = Messaging.Message.getMessageText(rawMessage);
	rawChatThread.replyService = rawMessage.serviceName;
	
	if (!addressObj) {
		var addressList = Messaging.Message.getAddressesForThreading(rawMessage);
		var address = addressList ? addressList[0].addr : Messaging.Utils.kMissingAddress;
		addressObj = {
			addr: address,
			normalizedAddress: Messaging.Utils.normalizeAddress(address, rawMessage.serviceName)
		};	
	}

	if (!addressObj.normalizedAddress) {
		addressObj.normalizedAddress = Messaging.Utils.normalizeAddress(addressObj.addr, rawMessage.serviceName);
	}
	
	rawChatThread.replyAddress = addressObj.addr;
	rawChatThread.normalizedAddress = addressObj.normalizedAddress;
	
	if (Messaging.Message.isUnread(rawMessage)) {
		// NOTE:
		// We are handling replacement messages by preventing the unreadCount
		// from being updated upon replacement.  This could also be done by
		// having the chatthreader watch for deletes and decrement the
		// unread count on delete.
		// This method is less robust but allows us to avoid another watch on the DB
		if (Messaging.Message.isReplacementMessage(rawMessage)) {
			console.info("Ignoring replacement message for unreadCount");
		} else {
			var unreadCount = rawChatThread.unreadCount || 0;
			rawChatThread.unreadCount = unreadCount + 1;
		}
	}
	
	return rawChatThread;
};

exports.Messaging.ChatThread = ChatThread;

//@ sourceURL=messaging.library/message.js

/*global _, console, Messaging, Globalization, Foundations, Future*/
/**
 * Copyright 2010 Palm, Inc.  All rights reserved.
 */


Messaging.Message = {
	isVisible: function(rawMessage) {
		if (rawMessage.flags && rawMessage.flags.visible === false) {
			return false;
		}
		return true;
	},

	isUnread: function(rawMessage) {
		return (rawMessage.folder === "inbox" && (rawMessage.flags === undefined || 
				(rawMessage.flags.read !== true && rawMessage.flags.visible !== false)));
	},
	
	isReplacementMessage: function(rawMessage) {
		// SMS types of 0x41 to 0x47 indicate replacement messages.
		// When a replacement message comes in the smsservice locates the message to replace
		// and makes changes accordingly.  The app and chatthreader don't have to do anything
		// when replacement messages come in.
		if (!rawMessage) {
			return false;
		} else {
			return (rawMessage.smsType >= 0x41 && rawMessage.smsType <= 0x47);
		}
	},

	getMessageText: function(rawMessage) {
		var messageText = "";
		if(rawMessage !== undefined) {
			if (rawMessage.subject) {
				messageText = rawMessage.subject;
			} else if (rawMessage.serviceName === "mms") {
				// MMS messages do not keep their body in the messageText field
				// Instead the body is a text attachment
				// The first text attachment is going to be interpreted as the message body
				if (rawMessage.attachments) {
					for( var i=0; i<rawMessage.attachments.length; i++ ) {
						if(rawMessage.attachments[i].mimeType === "text/plain") {
							messageText = rawMessage.attachments[i].partText;
							break;
						}
					}
				}
			} else {
				messageText = rawMessage.messageText;
			}
		}
		return messageText;
	},
	
	// Returns an array of CommunicationAddress objects
	getAddressesForThreading: function(rawMessage) {
		var addresses;
		// For group chat, the address to use is the groupChatName
		if (rawMessage.groupChatName) {
			addresses = [{ addr: rawMessage.groupChatName }];
		} else if (rawMessage.folder === "outbox") {
			addresses = rawMessage.to;
		} else if (rawMessage.from !== undefined) {
			addresses = [rawMessage.from];
		}
		
		if (addresses === undefined) {
			addresses = [];
		}
		//console.info("Messaging.Message.getAddressesForThreading: folder="+message.folder+", address="+JSON.stringify(addresses));
		return addresses;
	}
};



//@ sourceURL=messaging.library/utils.js

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


}