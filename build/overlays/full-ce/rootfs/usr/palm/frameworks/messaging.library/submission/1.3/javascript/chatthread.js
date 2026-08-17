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