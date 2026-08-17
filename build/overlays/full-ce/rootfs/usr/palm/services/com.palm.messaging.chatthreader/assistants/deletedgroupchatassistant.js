/*global _, Activity, Class, console, Date, DBModels, Future, include, mapReduce, MojoDB, PalmCall*/
/*
 * Copyright 2010 Palm, Inc.  All rights reserved.
 */

// Invoked whenever a com.palm.imgroupchat record is deleted.
var DeletedGroupChatCommandAssistant = Class.create({
	run: function(future) {
		this.revision = this.controller.args.revision;
		
		// Get all the imgroupchat records that have been added since  
		future.now(this, function(future) {
			future.nest(DBModels.ImGroupChat.findDeleted(this.revision));
		});

		// Call handleDeletedGroupChat on each imgroupchat record
		future.then(this, function(future) {
			var groupChatList = future.result ? future.result.results : [];
			console.info("DeletedGroupChatCommandAssistant: new groupchats=" +groupChatList.length);
			if (groupChatList.length > 0) {
				var mapFunc = _.bind(this.handleDeletedGroupChat, this);
				return mapReduce({map:mapFunc}, groupChatList);
			} else {
				console.error("DeletedGroupChatCommandAssistant: the activity fired but there's no deleted imchatgroups future.result="); // + JSON.stringify(future.result));
				this.revision = this.revision + 1;
				future.result = true;
			}
		});
	},

	// Complete the activity with restart
	complete: function(activity) {
		console.info("DeletedGroupChatCommandAssistant:complete activity", activity._activityId);
		var restartParams = {
			activityId: activity._activityId,
			restart: true,
			trigger: {
				method: "palm://com.palm.db/watch",
				key: "fired",
				params: {
					query: DBModels.ImGroupChat.getDeletedGroupsQuery(this.revision)
				}
			},
			callback: {
				method: "palm://com.palm.messaging.chatthreader/deletedImGroupChat",
				params: { revision: this.revision }
			}
		};
		return PalmCall.call(activity._service, "complete", restartParams);
	},
	
	handleDeletedGroupChat: function(groupChat) {
		console.info("DeletedGroupChatCommandAssistant.handleDeletedGroupChat start");
		var future;

		// Need to know the largest revision number that we handled to properly reset the watch
		if (groupChat._rev > this.revision) {
			this.revision = groupChat._rev;
		}

		if (!groupChat.chatThreadId) {
			// nothing to do so just kickstart the future 
			future = new Future();
			future.result = true;
		} else {
			future = MojoDB.get([groupChat.chatThreadId]);
			future.then(this, function(future) {
				if (future.result.results && future.result.results.length > 0) {
					// Got the groupchat's chatthread record so remove the groupChatId and flag it as locked.
					var chatThreadRecord = future.result.results[0];
					chatThreadRecord.groupChatId = null;
					if (chatThreadRecord.flags === undefined) {
						chatThreadRecord.flags = { locked: true };
					} else {
						chatThreadRecord.flags.locked = true;
					}
					future.nest(MojoDB.merge([chatThreadRecord]));
				} else {
					console.warn("DeletedGroupChatCommandAssistant.handleDeletedGroupChat: groupChat.chatThreadId="+groupChat.chatThreadId+" not found. This may be an error.");
					future.result = future.result;
				}
			});
		}
		
		return future;
	}
});


