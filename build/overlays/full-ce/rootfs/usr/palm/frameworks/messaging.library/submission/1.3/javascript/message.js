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

