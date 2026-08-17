/*global _, Activity, Class, console, Date, DBModels, Future, include, mapReduce, MojoDB, PalmCall*/
/*
 * Copyright 2010 Palm, Inc.  All rights reserved.
 */

// Invoked whenever flags.locked changes in a com.palm.imgroupchat record.
var LockedGroupChatCommandAssistant = Class.create({
	run: function(future) {
		this.lockedRevision = this.controller.args.lockedRev;
		
		// Get all the imgroupchat records that have flags.locked changes  
		future.now(this, function(future) {
			future.nest(DBModels.ImGroupChat.findLockedChanges(this.lockedRevision));
		});

		// Call handleLockedGroupChat on each imgroupchat record
		future.then(this, function(future) {
			var groupChatList = future.result ? future.result.results : [];
			console.info("LockedGroupChatCommandAssistant: new groupchats=" +groupChatList.length);
			if (groupChatList.length > 0) {
				var mapFunc = _.bind(this.handleLockedGroupChat, this);
				return mapReduce({map:mapFunc}, groupChatList);
			} else {
				console.error("LockedGroupChatCommandAssistant: the activity fired but no imchatgroups have locked changes."); // future.result=" + JSON.stringify(future.result));
				this.lockedRevision = this.lockedRevision + 1;
				future.result = true;
			}
		});
	},

	// Complete the activity with restart
	complete: function(activity) {
		console.info("LockedGroupChatCommandAssistant:complete activity", activity._activityId);
		var restartParams = {
			activityId: activity._activityId,
			restart: true,
			trigger: {
				method: "palm://com.palm.db/watch",
				key: "fired",
				params: {
					query: DBModels.ImGroupChat.getLockedGroupsQuery(this.lockedRevision)
				}
			},
			callback: {
				method: "palm://com.palm.messaging.chatthreader/lockedImGroupChat",
				params: { lockedRev: this.lockedRevision }
			}
		};
		return PalmCall.call(activity._service, "complete", restartParams);
	},
	
	handleLockedGroupChat: function(groupChat) {
		console.info("LockedGroupChatCommandAssistant.handleLockedGroupChat start");
		var future;

		// Need to know the largest revision number that we handled to properly reset the watch
		if (groupChat.lockedRevSet > this.lockedRevision) {
			this.lockedRevision = groupChat.lockedRevSet;
		}

		future = MojoDB.get([groupChat.chatThreadId]);
		future.then(this, function(future) {
			if (future.result.results && future.result.results.length > 0) {
				// Got the groupchat's chatthread record so now update its locked flag if necessary.
				var chatThreadRecord = this.getUpdatedChatThreadRecord(future, groupChat);
				if (chatThreadRecord !== undefined) {
					//console.info("LockedGroupChatCommandAssistant.handleLockedGroupChat changing locked flag to "+lockedFlag+" for chatthread id="+chatThreadRecord._id);
					future.nest(MojoDB.merge([chatThreadRecord]));
				} else {
					future.result = future.result;
				}
			} else {
				console.warn("LockedGroupChatCommandAssistant.handleLockedGroupChat: groupChat.chatThreadId="+groupChat.chatThreadId+" not found. This may be an error.");
				future.result = future.result;
			}
		});
		
		return future;
	},

	/***********************************
	 * Functions below are unit tested *
	 ***********************************/
	getUpdatedChatThreadRecord: function(future, groupChat) {
		var chatThreadRecord = {
				"_id": future.result.results[0]._id,
				"flags":future.result.results[0].flags
		};
		var lockedFlag = false;
		if (groupChat.flags && groupChat.flags.locked === true) {
			lockedFlag = true;
		}

		var recordChanged = false;
		if (chatThreadRecord.flags === undefined) {
			// If chatthread.flags is missing, only need to add it if imgroupchat.flags.locked is true is undefined is falsy
			if (lockedFlag === true) {
				recordChanged = true;
				chatThreadRecord.flags = { locked: true };
			}
		} else if (chatThreadRecord.flags.locked !== lockedFlag) {
			recordChanged = true;
			chatThreadRecord.flags.locked = lockedFlag;
		}
		return (recordChanged === true ? chatThreadRecord : undefined);
	}
});
