/*global _, Activity, Class, console, Date, DBModels, Future, include, mapReduce, MojoDB, PalmCall*/
/*
 * Copyright 2010 Palm, Inc.  All rights reserved.
 */

// Invoked whenever displayName changes in a com.palm.imgroupchat record.

var ChangeImGroupChatDisplayNameCommandAssistant = Class.create({
	run: function(future) {
		this.displayNameRevision = this.controller.args.displayNameRev;
		
		// Get all the imgroupchat records that have changes to displayName  
		future.now(this, function(future) {
			future.nest(DBModels.ImGroupChat.findDisplayNameChanges(this.displayNameRevision));
		});

		// Call handleChangeImGroupChatDisplayName on each imgroupchat record
		future.then(this, function(future) {
			var groupChatList = future.result ? future.result.results : [];
			console.info("ChangeImGroupChatDisplayNameCommandAssistant: num groupchats=" +groupChatList.length);
			if (groupChatList.length > 0) {
				var mapFunc = _.bind(this.handleChangeImGroupChatDisplayName, this);
				return mapReduce({map:mapFunc}, groupChatList);
			} else {
				console.error("ChangeImGroupChatDisplayNameCommandAssistant: the activity fired but no imchatgroups have displayName changes.");
				this.displayNameRevision = this.displayNameRevision + 1;
				future.result = true;
			}
		});
	},

	// Complete the activity with restart
	complete: function(activity) {
		console.info("ChangeImGroupChatDisplayNameCommandAssistant:complete activity", activity._activityId);
		var restartParams = {
			activityId: activity._activityId,
			restart: true,
			trigger: {
				method: "palm://com.palm.db/watch",
				key: "fired",
				params: {
					query: DBModels.ImGroupChat.getDisplayNameQuery(this.displayNameRevision)
				}
			},
			callback: {
				method: "palm://com.palm.messaging.chatthreader/changeImGroupChatDisplayName",
				params: { displayNameRev: this.displayNameRevision }
			}
		};
		return PalmCall.call(activity._service, "complete", restartParams);
	},
	
	handleChangeImGroupChatDisplayName: function(groupChat) {
		console.info("ChangeImGroupChatDisplayNameCommandAssistant.handleChangeImGroupChatDisplayName start");

		// Need to know the largest revision number that we handled to properly reset the watch
		if (groupChat.displayNameRevSet > this.displayNameRevision) {
			this.displayNameRevision = groupChat.displayNameRevSet;
		}
		if(!groupChat.chatThreadId){
			console.info("ChangeImGroupChatDisplayNameCommandAssistant.handleChangeImGroupChatDisplayName: missing chatGhreadId:"+JSON.stringify(groupChat));
		}
		var obj = {
			_id: groupChat.chatThreadId,
			displayName: groupChat.displayName
		};
		return MojoDB.merge([obj]);
	}
});


