this._root["__MojoFramework_contacts.plugin.messaging"] = function(MojoLoader, exports, root) {


//@ sourceURL=contacts.plugin.messaging/prologue.js

/*global MojoLoader*/
/**
 * Copyright 2010 Palm, Inc.  All rights reserved.
 */

var IMPORTS =  MojoLoader.require(
	{ name: "foundations", version: "1.0" },
	{ name: "underscore", version: "1.0" },
	{ name: "contacts", version: "1.0" },
	{ name: "globalization", version: "1.0" }
);

var _ = IMPORTS.underscore._;
var Foundations = IMPORTS.foundations;
var Contacts = IMPORTS.contacts;
var Globalization = IMPORTS.globalization.Globalization;

var DB = Foundations.Data.DB;
var TempDB = Foundations.Data.TempDB;
var Future = Foundations.Control.Future;


//@ sourceURL=contacts.plugin.messaging/personAdded.js

/*global _, exports, Foundations, Future, DB, TempDB, Utils, Contacts*/
/**
 * Copyright 2010 Palm, Inc.  All rights reserved.
 */

/*
 * Find buddies that should be linked to this person.
 * Find all the chatthreads associated with person's addresses and merge them together
 */
exports.personAdded = function(person) {
	Utils.log("personAdded: " + person.getId());
	
	// Using getDBObject() instead of getArray() since it needs to be a traditional JS array for mapReduce.
	var imArray = person.getIms().getDBObject();
	var phoneArray = person.getPhoneNumbers().getDBObject();
	if (imArray.length > 0 || phoneArray.length > 0) {
		var future,
			contactsArray = [],
			buddiesToPersonify = [];
		
		var addPersonIdToBuddy = function addPersonIdToBuddy(person, address) {
			//console.log("*****contacts.plugin.messaging addPersonIdToBuddy address="+JSON.stringify(address));
			var query = {
				from: "com.palm.imbuddystatus:1",
				where: [
					{ prop: "username", op: "=", val: address.value },
					{ prop: "serviceName", op: "=", val: address.type }
				]
			};
			var future = TempDB.find(query);
			
			future.then(this, function(future) {
				var buddyQueryResults = future.result.results || [];
				//console.log("*****contacts.plugin.messaging addPersonIdToBuddy # found="+buddyQueryResults.length);
				if (buddyQueryResults.length > 0) {
					var buddyAdded = {},
						contactIndex;
					
					buddyQueryResults.forEach(function (buddy) {
						if (!buddy.group) {
							Utils.error("addPersonIdToBuddy "+buddy.username+" is missing group");
							buddy.group = "Buddies";
						}

						// If this buddy's accountId is the same as one of the person's contacts, then
						// it should be linked to the person.
						// WARNING: need to be careful to always validate that the buddy is associated
						// with this person (via the accountId in the contact or some other way)!
						for(contactIndex = 0; contactIndex < contactsArray.length; ++contactIndex) {
							if (buddy.accountId === contactsArray[contactIndex].accountId && buddyAdded[buddy._id] !== true) {
								//console.log("*****contacts.plugin.messaging addPersonIdToBuddy matched buddy._id="+buddy._id);
								buddiesToPersonify.push({
									_id: buddy._id,
									group: buddy.group,
									availability: buddy.availability,
									personId: person.getId()
								});
								buddyAdded[buddy._id] = true;
							}
						}
					});
				}
				
				future.result = future.result;
			});
			
			return future;
		};

		// Update Buddies
		if (imArray.length > 0) {
			future = DB.get(person.getContactIds().getDBObject());
			
			future.then(this, function(future) {
				contactsArray = future.result.results || [];
				var mapFunc = _.bind(addPersonIdToBuddy, this, person);
				future.nest(Foundations.Control.mapReduce({map:mapFunc}, imArray));
			});
			
			future.then(this, function(future) {
				var displayName = person.generateDisplayName(),
					mostAvailableState = Utils.Presence.OFFLINE,
					groupHasPrimary = {}; // used to mark a buddy as primary for a given group

				buddiesToPersonify.forEach(function (buddy) {
					if(buddy.availability !== undefined && buddy.availability < mostAvailableState) {
						mostAvailableState = buddy.availability;
					}
				});

				buddiesToPersonify.forEach(function (buddy) {
					var normalizedGroup = buddy.group.toLowerCase(),
						groupAvailability = Utils.getGroupAvailability(buddy, mostAvailableState);
					
					buddy.primary = (groupHasPrimary[normalizedGroup] === undefined);
					buddy.displayName = displayName;
					buddy.groupAvailability = groupAvailability;
					buddy.offline = (mostAvailableState === Utils.Presence.OFFLINE);
					buddy.personAvailability = mostAvailableState;

					groupHasPrimary[normalizedGroup] = true;
				});

				Utils.log("addPersonIdToBuddy merging "+JSON.stringify(buddiesToPersonify));
				future.nest(TempDB.merge(buddiesToPersonify));
			});
		} else {
			future = new Future().immediate();
		}
		
		// Merge chatthreads
		future.then(this, function(future) {
			future.nest(Utils.getUnassociatedChatThreads(imArray, phoneArray));
		});

		future.then(this, function(future) {
			future.nest(Utils.mergeChatThreads(future.result, person));
		});
		
		return future;
	} else {
		return new Future().immediate();
	}
};




//@ sourceURL=contacts.plugin.messaging/personChanged.js

/*global _, exports, Foundations, Future, DB, TempDB, Utils, Contacts*/
/**
 * Copyright 2010 Palm, Inc.  All rights reserved.
 */

/*
 * Changes of interest:
 * + added IMs or phone numbers
 * + added contactIds -- this could happen if two Persons are merged
 * + displayName changed -- update the imbuddystatus.displayName
 */
exports.personChanged = function(personOld, personNew) {
	Utils.log("personChanged old id=" + personOld.getId() +" new id=" + personNew.getId());

	var future,
		displayName = personNew.generateDisplayName(),
		personId = personOld.getId(),
		newPhoneNumbers = [],
		newImAddresses = [],
		removedPhoneNumbers = [],
		removedImAddresses = [];
	
	if (personOld.generateDisplayName() !== displayName) {
		// Update the displayName for all buddies associated with this person
		var queryBuddyStatus = {
			from: "com.palm.imbuddystatus:1",
			where: [
				{ prop: "personId", op: "=", val: personId }
			]
		};
		future = TempDB.merge(queryBuddyStatus, { displayName: displayName });

		// Update the displayName for the ChatThread associated with this person
		future.then(this, function(future) {
			var queryChatThread = {
					from: "com.palm.chatthread:1",
					where: [
						{ prop: "personId", op: "=", val: personId }
					]
				};
			future.nest(DB.merge(queryChatThread, { displayName: displayName }));
		});
	} else {
		future = new Future().immediate();
	}
	
	// check for new phone numbers
	Utils.arrayDiff(
		personOld.getPhoneNumbers().getDBObject(),// Using getDBObject() because getArray() isn't really an array
		personNew.getPhoneNumbers().getDBObject(),// Using getDBObject() because getArray() isn't really an array
		// comparator
		function(a,b) {
			a = a.normalizedValue;
			b = b.normalizedValue;
			return a < b ? -1 : a > b ? 1 : 0;
		},
		// added
		function(phone) {
			//console.log("*****contacts.plugin.messaging new "+JSON.stringify(phone));
			newPhoneNumbers.push(phone);
		},
		// removed - don't care
		function(phone) {
			removedPhoneNumbers.push(phone);
		},
		// equal - don't care
		function() {}
	);
	
	// check for new im addresses
	Utils.arrayDiff(
		personOld.getIms().getDBObject(),// Using getDBObject() because getArray() isn't really an array
		personNew.getIms().getDBObject(),// Using getDBObject() because getArray() isn't really an array
		// comparator
		function(a,b) {
			a = a.normalizedValue;
			b = b.normalizedValue;
			return a < b ? -1 : a > b ? 1 : 0;
		},
		// added
		function(im) {
			//console.log("*****contacts.plugin.messaging new "+JSON.stringify(im));
			newImAddresses.push(im);
		},
		// removed - don't care
		function(im) {
			removedImAddresses.push(im);
		},
		// equal - don't care
		function() {}
	);
	
	Utils.log("newPhoneNumbers "+JSON.stringify(newPhoneNumbers));
	Utils.log("newImAddresses "+JSON.stringify(newImAddresses));
	Utils.log("removedPhoneNumbers "+JSON.stringify(removedPhoneNumbers));
	Utils.log("removedImAddresses "+JSON.stringify(removedImAddresses));

	// New IM addresses need to have personId added.
	// TODO: make this a utility function to be shared by both personAdded and personChanged.
	if (newImAddresses.length > 0) {
		var contactsArray = [],
			buddiesToPersonify = [];
		var addPersonIdToBuddy = function addPersonIdToBuddy(person, address) {
			//console.log("*****contacts.plugin.messaging addPersonIdToBuddy address="+JSON.stringify(address));
			var query = {
				from: "com.palm.imbuddystatus:1",
				where: [
					{ prop: "username", op: "=", val: address.value },
					{ prop: "serviceName", op: "=", val: address.type }
				]
			};
			var future = TempDB.find(query);
			
			future.then(this, function(future) {
				var buddyQueryResults = future.result.results || [];
				if (buddyQueryResults.length > 0) {
					var buddyAdded = {},
						contactIndex;
					
					buddyQueryResults.forEach(function (buddy) {
						if (buddy.personId) {
							// Need to add buddies that are already associated with this person
							// to properly set "primary" later on.
							if (buddy.personId === personId) {
								buddiesToPersonify.push({
									_id: buddy._id,
									group: buddy.group,
									availability: buddy.availability,
									personId: buddy.personId
								});
							}
						} else {
							if (!buddy.group) {
								Utils.error("personChanged.addPersonIdToBuddy "+buddy.username+" is missing group");
								buddy.group = "Buddies";
							}
	
							// If this buddy's accountId is the same as one of the person's contacts, then
							// it should be linked to the person.
							// WARNING: need to be careful to always validate that the buddy is associated
							// with this person (via the accountId in the contact or some other way)!
							for(contactIndex = 0; contactIndex < contactsArray.length; ++contactIndex) {
								if (buddy.accountId === contactsArray[contactIndex].accountId && buddyAdded[buddy._id] !== true) {
									//console.log("*****contacts.plugin.messaging addPersonIdToBuddy matched buddy._id="+buddy._id);
									buddiesToPersonify.push({
										_id: buddy._id,
										group: buddy.group,
										availability: buddy.availability,
										personId: person.getId()
									});
									buddyAdded[buddy._id] = true;
								}
							}
						}
					});
				}
				
				future.result = future.result;
			});
			
			return future;
		};

		future.then(this, function(future) {
			future.nest(DB.get(personNew.getContactIds().getDBObject()));
		});

		future.then(this, function(future) {
			contactsArray = future.result.results || [];
			var mapFunc = _.bind(addPersonIdToBuddy, this, personNew);
			future.nest(Foundations.Control.mapReduce({map:mapFunc}, newImAddresses));
		});
		
		future.then(this, function(future) {
			var mostAvailableState = Utils.Presence.OFFLINE,
				groupHasPrimary = {}; // used to mark a buddy as primary for a given group

			buddiesToPersonify.forEach(function (buddy) {
				if(buddy.availability !== undefined && buddy.availability < mostAvailableState) {
					mostAvailableState = buddy.availability;
				}
			});

			buddiesToPersonify.forEach(function (buddy) {
				var normalizedGroup = buddy.group.toLowerCase(),
					groupAvailability = Utils.getGroupAvailability(buddy, mostAvailableState);
				
				buddy.primary = (groupHasPrimary[normalizedGroup] === undefined);
				buddy.displayName = displayName;
				buddy.groupAvailability = groupAvailability;
				buddy.offline = (mostAvailableState === Utils.Presence.OFFLINE);
				buddy.personAvailability = mostAvailableState;

				groupHasPrimary[normalizedGroup] = true;
			});

			Utils.log("personChanged.addPersonIdToBuddy merging "+JSON.stringify(buddiesToPersonify));
			future.nest(TempDB.merge(buddiesToPersonify));
		});
	}

	if (newImAddresses.length > 0 || newPhoneNumbers.length > 0) {
		var chatThreadsArray;
		future.then(this, function(future) {
			future.nest(Utils.getUnassociatedChatThreads(newImAddresses, newPhoneNumbers));
		});

		future.then(this, function(future) {
			chatThreadsArray = future.result || [];
			future.result = true;
//console.log("*****contacts.plugin.messaging result from getUnassociatedChatThreads "+JSON.stringify(chatThreadsArray));
		});

		future.then(this, function(future) {
//console.log("*****contacts.plugin.messaging find chatthread for person "+personId);
			var queryChatThread = {
				from: "com.palm.chatthread:1",
				where: [
					{ prop: "personId", op: "=", val: personId }
				]
			};
			future.nest(DB.find(queryChatThread));
		});

		future.then(this, function(future) {
			var personChatThread = future.result.results || [];
//console.log("*****contacts.plugin.messaging result from find chatthread "+JSON.stringify(personChatThread));
			if (personChatThread.length > 0) {
				chatThreadsArray.push(personChatThread[0]);
			}

//console.log("*****contacts.plugin.messaging personChanged chatThreadList="+JSON.stringify(chatThreadsArray));
			if (chatThreadsArray.length > 0) {
				future.nest(Utils.mergeChatThreads(chatThreadsArray, personNew));
			} else {
				future.result = true;
			}
		});
	} else {
		//TODO get rid of this once UI add of a contact is treated as an add instead of change
		if (removedPhoneNumbers.length === 0 && removedImAddresses.length === 0 &&
			(personNew.getPhoneNumbers().getArray().length > 0 || personNew.getIms().getArray().length > 0)) {
			console.error("*****contacts.plugin.messaging BIG HACK! Old and New person are same, maybe this is an AddPerson");
			exports.personAdded(personNew);
		}
		future.result = true;
	}
	
	return future;
};





//@ sourceURL=contacts.plugin.messaging/personRemoved.js

/*global exports, Future, DB, TempDB, Utils*/
/**
 * Copyright 2010 Palm, Inc.  All rights reserved.
 */

/*
 * When a person is removed, clear that person's record _id from the chatthread and imbuddystatus
 */
exports.personRemoved = function(person) {
	var personId = person.getId();
	Utils.log("personRemoved: " + personId);
	//TODO: add the person's IMs and phoneNumbers to chatthreader so we can find by any of the addresses again

	var queryChatThread = {
		from: "com.palm.chatthread:1",
		where: [
			{ prop: "personId", op: "=", val: personId }
		]
	};
	//TODO: For now lock the thread and remove ways to look it up so new messages never accidentally get added to it.
	// In the future, the better behavior is look to see if another person has the address and merge with that chatthread 
	var future = DB.merge(queryChatThread, { personId: null, normalizedAddress: "zombie"+Date.now(), flags: {locked:true} });
	
	future.then(this, function(future) {
console.log("*****contacts.plugin.messaging personRemoved chatthread merge results "+JSON.stringify(future.result));
		var queryBuddyStatus = {
			from: "com.palm.imbuddystatus:1",
			where: [
				{ prop: "personId", op: "=", val: personId }
			]
		};
		var changes = {
			personId: null,
			displayName: ""
		};
		future.nest(TempDB.merge(queryBuddyStatus, changes));
	});

	future.then(this, function(future) {
console.log("*****contacts.plugin.messaging personRemoved imbuddystatus merge results "+JSON.stringify(future.result));
		if (future.result.count > 1) {
			Utils.error("Expected 1 buddy associated with person " + personId + " but there were " + future.result.count);
		}
		future.result = true;
	});

	return future;
};



//@ sourceURL=contacts.plugin.messaging/utils.js

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

}