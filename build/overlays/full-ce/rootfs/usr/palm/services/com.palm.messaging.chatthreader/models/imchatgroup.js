/*global _, Activity, Class, console, ContactsLib, Date, DBModels, Future, include, mapReduce, MojoDB, Person*/
/*
 * Copyright 2010 Palm, Inc.  All rights reserved.
 */

DBModels.ImGroupChat = {
	id: "com.palm.imgroupchat:1",
	
	getChatIdChangeQuery: function(chatThreadRev) {
		chatThreadRev = chatThreadRev || 0;
		return {
			from: DBModels.ImGroupChat.id,
			where: [
				{ prop: "chatthreadRevSet", op: ">", val: chatThreadRev }
			]
		};
	},
	
	getLockedGroupsQuery: function(lockedRev) {
		lockedRev = lockedRev || 0;
		return {
			from: DBModels.ImGroupChat.id,
			where: [
				{ prop: "lockedRevSet", op: ">", val: lockedRev }
			]
		};
	},
	
	getDisplayNameQuery: function(displayNameRev) {
		displayNameRev = displayNameRev || 0;
		return {
			from: DBModels.ImGroupChat.id,
			where: [
				{ prop: "displayNameRevSet", op: ">", val: displayNameRev }
			]
		};
	},
	
	getDeletedGroupsQuery: function(lastRevision) {
		lastRevision = lastRevision || 0;
		return {
			from: DBModels.ImGroupChat.id,
			where: [
				{"prop": "_del", "op": "=", "val": true},
				{"prop": "_rev", "op": ">", "val": lastRevision}
			]
		};
	},
	
	findNew: function(chatThreadRev) {
		console.info("DBModels.ImGroupChat.findNew: rev="+chatThreadRev);
		// Since the chatthreadId should never change, this is essentially a watch for new com.palm.imgroupchat records.
		var query = DBModels.ImGroupChat.getChatIdChangeQuery(chatThreadRev);
		return MojoDB.find(query, false);
	},
	
	findLockedChanges: function(lockedRev) {
		console.info("DBModels.ImGroupChat.findLockedChanges: rev="+lockedRev);
		var query = DBModels.ImGroupChat.getLockedGroupsQuery(lockedRev);
		return MojoDB.find(query, false);
	},
	
	findDisplayNameChanges: function(displayNameRev) {
		console.info("DBModels.ImGroupChat.findDisplayNameChanges: rev="+displayNameRev);
		var query = DBModels.ImGroupChat.getDisplayNameQuery(displayNameRev);
		return MojoDB.find(query, false);
	},
	
	findDeleted: function(lastRevision) {
		console.info("DBModels.ImGroupChat.findDeleted: rev="+lastRevision);
		var query = DBModels.ImGroupChat.getDeletedGroupsQuery(lastRevision);
		return MojoDB.find(query, false);
	}
};
