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

