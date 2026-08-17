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


