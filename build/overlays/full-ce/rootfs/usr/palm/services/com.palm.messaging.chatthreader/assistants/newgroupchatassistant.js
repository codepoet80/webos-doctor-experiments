/*global _, Activity, Class, console, ContactsLib, Date, DBModels, Future, include, mapReduce, MojoDB, Person, PalmCall*/
/*
 * Copyright 2010 Palm, Inc.  All rights reserved.
 */

// Invoked whenever the chatThreadId property of a com.palm.imgroupchat record changes.
// Once set, the chatThreadId will never change so this assistant is only invoked for the following cases:
// 1. a new imgroupchat record is created (either with or without the chatThreadId property set)
// 2. the imgroupchat record was just updated by this assistant. This case can be identified by noting
//    that both the imgroupchat and the chatthread are already both referencing each other.
var NewGroupChatCommandAssistant = Class.create({
	run: function(future) {
		this.chatRevision = this.controller.args.chatThreadIdRev;
		
		// Get all the imgroupchat records that have been added since  
		future.now(this, function(future) {
			future.nest(DBModels.ImGroupChat.findNew(this.chatRevision));
		});

		// Call handleNewGroupChat on each imgroupchat record
		future.then(this, function(future) {
			var groupChatList = future.result ? future.result.results : [];
			console.info("NewGroupChatCommandAssistant: new groupchats=" +groupChatList.length);
			if (groupChatList.length > 0) {
				var mapFunc = _.bind(this.handleNewGroupChat, this);
				return mapReduce({map:mapFunc}, groupChatList);
			} else {
				console.error("NewGroupChatCommandAssistant: the activity fired but there's no new imchatgroups"); // future.result=" + JSON.stringify(future.result));
				this.chatRevision = this.chatRevision + 1;
				future.result = true;
			}
		});

		// The chatthreads now exist for the groupchats, so null out the conversation of any messages
		// that were temporarily stored in the "pending_groupchat" chatthread. This way they can be
		// processed and show up the their intended group's chatthread.
		future.then(this, function(future) {
			future.nest(DBModels.Messages.resetPendingGroupChatMessages());
		});
	},

	// Complete the activity with restart
	complete: function(activity) {
		console.info("NewGroupChatCommandAssistant:complete activity", activity._activityId);
		var restartParams = {
			activityId: activity._activityId,
			restart: true,
			trigger: {
				method: "palm://com.palm.db/watch",
				key: "fired",
				params: {
					query: DBModels.ImGroupChat.getChatIdChangeQuery(this.chatRevision)
				}
			},
			callback: {
				method: "palm://com.palm.messaging.chatthreader/newImGroupChat",
				params: { chatThreadIdRev: this.chatRevision }
			}
		};
		return PalmCall.call(activity._service, "complete", restartParams);
	},
	
	/* Do this for each imgroupchat
		if imgroupchat.chatThreadId get the chatthread
		if chatthread returned
			merge chatthread.groupChatId
		else
			create chatthread
			merge imgroupchat.chatThreadId
	*/
	handleNewGroupChat: function(groupChat) {
		console.info("NewGroupChatCommandAssistant.handleNewGroupChat start");
		var future = new Future();
		var chatThreadRecord;

		// Need to know the largest revision number that we handled to properly reset the watch
		if (groupChat.chatthreadRevSet > this.chatRevision) {
			this.chatRevision = groupChat.chatthreadRevSet;
		}
		
		// do this to kickstart the following future.then() functions
		future.result = true;
		
		// If the imgroupchat has a chatThreadId try getting that chatThread record
		future.whilst(this,
			// Condition checker function
			function() {
				return (!!groupChat.chatThreadId);
			},
			// Future handler function
			function(future) {
				//console.info("*****NewGroupChatCommandAssistant.handleNewGroupChat groupChat.chatThreadId="+groupChat.chatThreadId);
				future.nest(MojoDB.get([groupChat.chatThreadId]));
				future.then(this, function(future) {
					if (future.result.results && future.result.results.length > 0) {
						chatThreadRecord = future.result.results[0];
					} else {
						console.warn("NewGroupChatCommandAssistant.handleNewGroupChat: groupChat.chatThreadId="+groupChat.chatThreadId+" not found. This may be an error.");
					}
					future.result = future.result;
				});
			}
		);
		
		future.then(this, function(future) {
			var lockedFlag = false;
			if (groupChat.flags && groupChat.flags.locked === true) {
				lockedFlag = true;
			}

			// Since the chatthread already exists, it just needs to be converted to a groupchat by setting the groupChatId property.
			if (chatThreadRecord) {
				//console.info("*****NewGroupChatCommandAssistant.handleNewGroupChat got chatThreadRecord");
				if (chatThreadRecord.groupChatId === groupChat._id) {
					console.info("NewGroupChatCommandAssistant.handleNewGroupChat: chatthread already linked to this imgroupchat.");
					future.result = true;
				} else {
					if (chatThreadRecord.groupChatId && chatThreadRecord.groupChatId !== groupChat._id) {
						console.error("NewGroupChatCommandAssistant.handleNewGroupChat: chatthread already linked to groupChatId=" + chatThreadRecord.groupChatId + ". That imgroupchat may now be orphaned!!!");
					}
					future.nest(MojoDB.merge([this.getModifiedChatThreadRecord(groupChat, chatThreadRecord)]));
				}
			// Need to create a chatthread and then update the groupchat to reference that chatthread
			} else {
				//console.info("*****NewGroupChatCommandAssistant.handleNewGroupChat create new chatthread");
				var flags = {
					locked: lockedFlag,
					visible: true,
					outgoing: false
				};
				future.nest(DBModels.Conversations.createNew(groupChat.groupName, groupChat.serviceName, groupChat.displayName, flags, { groupChatId: groupChat._id }));
				future.then(this, function(future) {
					if (future.result.results && future.result.results.length > 0) {
						var chatThreadId = future.result.results[0].id;
						future.nest(MojoDB.merge([{
								_id:groupChat._id, 
								chatThreadId:chatThreadId
						}]));						
					} else {
						console.error("NewGroupChatCommandAssistant.handleNewGroupChat create chatthread failed result="+JSON.stringify(future.result));
						future.result = false;
					}
				});
			}
		});
		
		return future;
	},
	
	/***********************************
	 * Functions below are unit tested *
	 ***********************************/
	getModifiedChatThreadRecord: function(groupChat, chatThreadRecord) {
		var lockedFlag = false;
		if (chatThreadRecord.personId) {
			chatThreadRecord.personId = null;
		}

		if (chatThreadRecord.flags === undefined) {
			chatThreadRecord.flags = { locked: lockedFlag };
		} else {
			chatThreadRecord.flags.locked = lockedFlag;
		}

		chatThreadRecord.groupChatId = groupChat._id;
		
		return chatThreadRecord;
	}
});