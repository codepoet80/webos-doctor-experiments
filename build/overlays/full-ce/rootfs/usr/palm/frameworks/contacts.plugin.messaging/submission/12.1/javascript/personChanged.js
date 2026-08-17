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
		// The BIG HACK below exists because a UI-added contact arrives as a personChanged with an
		// unchanged (old===new) address set, and still needs its initial messaging association.
		// BUT a re-link / re-save of an ALREADY-associated person also arrives this way, and
		// re-running the full personAdded for it is pure waste (~350ms/contact of redundant buddy +
		// chatthread work; measured on-device it fired for 85/85 contacts on a re-link).
		//
		// GUARD: only run personAdded when this person is NOT already associated. A com.palm.chatthread
		// or com.palm.imbuddystatus record carrying personId === this person can ONLY exist from a
		// prior association, so its presence proves association already happened -> skip. No false
		// positives: a genuinely-new person has no such record, so it still associates. Both lookups
		// are indexed (chatthread.byperson, imbuddystatus.byperson).
		if (removedPhoneNumbers.length === 0 && removedImAddresses.length === 0 &&
			(personNew.getPhoneNumbers().getArray().length > 0 || personNew.getIms().getArray().length > 0)) {
			future.then(this, function (future) {
				future.nest(DB.find({ from: "com.palm.chatthread:1", where: [{ prop: "personId", op: "=", val: personId }] }));
			});
			future.then(this, function (future) {
				var threads = (future.result && future.result.results) || [];
				if (threads.length > 0) {
					return { alreadyAssociated: true };
				}
				return TempDB.find({ from: "com.palm.imbuddystatus:1", where: [{ prop: "personId", op: "=", val: personId }] });
			});
			future.then(this, function (future) {
				var result = future.result;
				var alreadyAssociated = (result && result.alreadyAssociated === true) ||
					(result && result.results && result.results.length > 0);
				if (!alreadyAssociated) {
					exports.personAdded(personNew);
				}
				future.result = true;
			});
		} else {
			future.result = true;
		}
	}
	
	return future;
};



