/*global _, console, Globalization, Foundations, Future, DB, TempDB, Contacts*/
/**
 * Copyright 2010 Palm, Inc.  All rights reserved.
 */
var Utils = {
	Presence: {
		AVAILABLE: 0,
		BUSY: 2,
		INVISIBLE: 3,
		OFFLINE: 4
	},
	
	log: function(message) {
		console.log("contacts.plugin.messaging: " + message);
	},
	
	error: function(message) {
		console.error("ERROR: contacts.plugin.messaging: " + message);
	},
	
	// walk arrays and call callbacks when an element is added, removed, or considered equal
	arrayDiff: function(oldArr, newArr, comparator, onAdded, onRemoved, onEqual) {
		var i=0, j=0, oldObj, newObj;
		oldArr = oldArr.sort(comparator);
		newArr = newArr.sort(comparator);
		
		while (oldArr[i] || newArr[j]) {
			oldObj = oldArr[i];
			newObj = newArr[j];
			//console.log("contacts.plugin.messaging old: " +i+" - "+ JSON.stringify(oldObj));
			//console.log("contacts.plugin.messaging new: " +j+" - "+ JSON.stringify(newObj));
			if ( !oldObj || (newObj && comparator(newObj, oldObj) < 0 ) ) {
				onAdded(newObj);
				j++;
			} else if ( !newObj || comparator(oldObj, newObj) < 0 ) {
				onRemoved(oldObj);
				i++;
			} else {
				onEqual(oldObj, newObj);
				i++;
				j++;
			}
		}
	},
	
	getGroupAvailability: function(buddyStatusRecord, availability) {
		if (availability < Utils.Presence.OFFLINE) {
			var group = buddyStatusRecord.group || "buddies";
			return group.toLowerCase() + availability;
		} else {
			return "" + availability; // want all offline buddies to sort alphabetically by name so the groupAvailability should be same
		}
	},

	// Find all the chatthreads for addresses in the IM and phone arrays that are
	// not already associated with a person or a group chat.
	getUnassociatedChatThreads: function(imArray, phoneArray) {
		console.log("*****contacts.plugin.messaging getUnassociatedChatThreads imArray="+JSON.stringify(imArray)+", phoneArray="+JSON.stringify(phoneArray));
		var chatThreadsObj = {};
		var chatThreadsArray = [];
		var mapFunc;
		var future;
		var findChatThreadsForAddress = function(type, address) {
			var normalizedAddress;
			if (type === "phone") {
				// Just use the subscriber number from the phone number (stripping off extras, like area code)
				var numberObj = Globalization.Phone.parsePhoneNumber(address.value);
				normalizedAddress = numberObj.subscriberNumber || address.value;
			} else {
				normalizedAddress = address.normalizedValue;
			}
			//console.log("*****contacts.plugin.messaging getUnassociatedChatThreads find normalizedAddress="+normalizedAddress+", original="+address.value);

			var query = {
				from: "com.palm.chatthread:1",
				where: [
					{ prop: "normalizedAddress", op: "=", val: normalizedAddress }
				]
			};
			var future = DB.find(query);

			future.then(this, function(future) {
				var chatThreadList = future.result.results || [];
				//console.log("*****contacts.plugin.messaging getUnassociatedChatThreads chatThreadList="+JSON.stringify(chatThreadList));
				if (chatThreadList.length > 0) {
					var i, chatThread;
					for (i = 0; i < chatThreadList.length; i++) {
						chatThread = chatThreadList[i];
						// Only want chat threads that aren't already associated a person or group chat.
						if (!chatThread.personId && !chatThread.groupChatId && chatThreadsObj[chatThread._id] === undefined &&
							(type === "phone" || chatThread.replyService === address.type)) {
							chatThreadsObj[chatThread._id] = true;
							chatThreadsArray.push(chatThread);					
						}
					}
				}
//console.log("*****contacts.plugin.messaging getUnassociatedChatThreads chatThreadsArray="+JSON.stringify(chatThreadsArray));
				future.result = future.result;
			});
			
			return future;
		};
		
		mapFunc = _.bind(findChatThreadsForAddress, this, "im");
		future = Foundations.Control.mapReduce({map:mapFunc}, imArray);
		
		future.then(this, function(future) {
			mapFunc = _.bind(findChatThreadsForAddress, this, "phone");
			future.nest(Foundations.Control.mapReduce({map:mapFunc}, phoneArray));
		});
		
		future.then(this, function(future) {
//console.log("*****contacts.plugin.messaging getUnassociatedChatThreads final chatThreadsArray="+JSON.stringify(chatThreadsArray));
			future.result = chatThreadsArray;
		});
		
		return future;
	},
	
	// Merge the messages for all the chatthreads into a single chatthread.
	mergeChatThreads: function(chatThreadsArray, person) {
console.log("*****contacts.plugin.messaging mergeChatThreads chatThreadsArray="+JSON.stringify(chatThreadsArray)+", person="+person.getId());
		var mainChatThread, future;
		
		if (chatThreadsArray.length > 0) {
			var i,
				visibleFlag = false,
				unreadCount = 0,
				indexOfNewest = 0,
				newestTimestamp,
				chatThread;

			// Find the chatthread with the newest timestamp and associate it with the person.
			// This is so we don't have to modify the timestamp and summary.
			// At the same time, get the total unread count for all chatthreads so that can be
			// updated in the chatthread that's inheriting messages from the other chatthreads.
			for (i = 0; i < chatThreadsArray.length; i++) {
				chatThread = chatThreadsArray[i];
				unreadCount = unreadCount + chatThread.unreadCount;
				if (newestTimestamp === undefined || newestTimestamp > chatThread.timestamp) {
					newestTimestamp = chatThread.timestamp;
					indexOfNewest = i;
				}
				
				if (chatThread.flags === undefined || chatThread.flags.visible) {
					visibleFlag = true;
				}
			}
			
			mainChatThread = chatThreadsArray.splice(indexOfNewest, 1);
			var mergeObj = {
				_id: mainChatThread[0]._id,
				personId: person.getId(),
				displayName: person.generateDisplayName(),
				unreadCount: unreadCount,
				flags: {
					visible: visibleFlag, // if any of the chatthreads were visible, inherit that. 
					locked: false         // since this is now associated with a person, assume it isn't locked.
				}
			};
console.log("*****contacts.plugin.messaging mergeChatThreads updating mainChatThread="+JSON.stringify(mergeObj));
			future = DB.merge([mergeObj]);
		} else {
			future = new Future().immediate();
		}
		
		future.whilst(this,
			// Condition checker function
			function() {
				return (mainChatThread !== undefined && chatThreadsArray.length > 0);
			},
			// Future handler function
			function(future) {
				var mergeChatThreadFunc = function(mainChatThreadId, chatThread) {
console.log("*****contacts.plugin.messaging mergeChatThreads main chatId="+mainChatThreadId+", other chatId"+chatThread._id);
					// Avoid something catastrophic, like unintentionally deleting the main chatThread
					if (mainChatThreadId === chatThread._id) {
						Utils.error("mergeChatThreads attempted to merge the same chatthread id="+mainChatThreadId);
						return new Future().immediate();
					}
					
					var query = {
						from: "com.palm.message:1",
						where: [
							{ prop: "conversations", op: "=", val: chatThread._id }
						]
					};
					var future = DB.find(query);
					future.then(this, function(future) {
						if (future.result && future.result.results && future.result.results.length > 0) {
							var i, updatedMessages = [];
							future.result.results.forEach(function (message) {
								for(i = 0; i < message.conversations.length; i++) {
									if (message.conversations[i] === chatThread._id) {
										message.conversations[i] = mainChatThreadId;
									}
								}
								updatedMessages.push({
									_id: message._id,
									conversations: message.conversations
								});
							});
console.log("*****contacts.plugin.messaging mergeChatThreads merging "+JSON.stringify(updatedMessages));
							// Updated the messages now write them back
							future.nest(DB.merge(updatedMessages));
						} else {
							future.result = future.result;
						}
					});
					
					future.then(this, function(future) {
console.log("*****contacts.plugin.messaging mergeChatThreads results "+JSON.stringify(future.result));
						future.nest(DB.del([chatThread._id]));
					});
					return future;
				};

				var mapFunc = _.bind(mergeChatThreadFunc, this, mainChatThread[0]._id);
				future.nest(Foundations.Control.mapReduce({map:mapFunc}, chatThreadsArray));
			}
		);
		
		return future;
	}
};
