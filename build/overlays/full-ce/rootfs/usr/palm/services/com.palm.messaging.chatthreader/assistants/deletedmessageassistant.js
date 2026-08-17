/*global _, Activity, Class, console, Date, DBModels, Future, include, mapReduce, MojoDB, PalmCall*/
/*
 * Copyright 2010 Palm, Inc.  All rights reserved.
 */

// Invoked whenever a com.palm.message record is deleted.
var DeletedMessageCommandAssistant = Class.create({
	run: function(future) {
		this.revision = this.controller.args.revision || 0;
		console.info("DeletedMessageCommandAssistant:run() - this.revision = " + this.revision);

		future.now(this, function(future) {
			future.nest(DBModels.Messages.findDeleted(this.revision));
		});


		future.then(this, function(future) {
			var deletedList = future.result ? future.result.results : [];
			var conversationHash = {};

			if (deletedList !== undefined && deletedList.length > 0) {
				console.info("DeletedMessageCommandAssistant:run() - deletedList.length = " + deletedList.length);
				for (var i = 0; i < deletedList.length; i++) {
					// Update the revision so that the next watch will
					// ignore this message.
					if (deletedList[i]._rev > this.revision) {
						this.revision = deletedList[i]._rev;
					}

					// Create a hash of all the conversations in the deleted messages list
					// BUG FIX: Add null check for conversations array
					var conversations = deletedList[i].conversations;
					if (conversations && conversations.length > 0) {
						for (var x = 0; x < conversations.length; x++) {
							conversationHash[conversations[x]] = conversations[x];
						}
					}
				}
			}

			// BUG FIX: Use mapReduce to properly process all conversations asynchronously
			// instead of broken for-in loop with future.nest()
			var conversationIds = [];
			for (var conversation in conversationHash) {
				if (conversationHash.hasOwnProperty(conversation)) {
					conversationIds.push(conversationHash[conversation]);
				}
			}

			if (conversationIds.length > 0) {
				var mapFunc = _.bind(this.updateChatThread, this);
				future.nest(mapReduce({map: mapFunc}, conversationIds));
			} else {
				future.result = true;
			}
		});												
	},

	
	// Complete the activity
	complete: function(activity) {
		console.info("DeletedMessageCommandAssistant:complete()"+ activity._activityId + ", this.revision = " + this.revision);
		var restartParams = {
				activityId: activity._activityId,
				restart: true,
				trigger: {
					method: "palm://com.palm.db/watch",
					key: "fired",
					params: {
						query: {
							from: "com.palm.message:1",
							where: [
								{prop: "_del", op: "=", val: true},
								{prop: "_rev", op: ">", val: this.revision}
							]
						}
					}
				},
				callback: {
					method: "palm://com.palm.messaging.chatthreader/deletedMessage",
					params: {"revision": this.revision}
				}
			};
			return PalmCall.call(activity._service, "complete", restartParams);
	},
	
	
	
	updateChatThread: function(thread) {
		console.info("DeletedMessageCommandAssistant:updateChatThread() - thread = "+ thread);
		
		var future = new Future();
		
		future.now(this, function(future) {
			future.nest(DBModels.Conversations.findThread(thread));
		});
			
		
		future.then(this, function(future) {
			var results = future.result ? future.result.results : [];
			if (results !== undefined && results.length > 0) {
				this.chatThread = results[0];
				future.nest(DBModels.Messages.findMessagesForThread(this.chatThread._id));
			} else {
				future.result = true;
			}
		});


		future.then(this, function(future) {
			var messageList = future.result ? future.result.results : [];
			var nothingToDo = true;
			// The message list will be in descending localTimestamp order
			if (messageList !== undefined) {
				if (messageList.length > 0) {			
					for (var i=0; i<messageList.length; i++) {
						var message = messageList[i];
						//console.info("DeletedMessageCommandAssistant:run() - message = " + JSON.stringify(message));
						if(message.folder === "inbox" || message.folder === "outbox") {						
							if(this.shouldUpdateChatThread(this.chatThread, message)) {						
								nothingToDo = false;
								// Update the chatThread to reflect this message  
								//console.info("DeletedMessageCommandAssistant:run() - Update ChatThread: _id: "+this.chatThread._id+ "with summary: "+message.messageText);
								future.nest(MojoDB.merge([{
									_id:this.chatThread._id,
									summary: message.messageText, 
									timestamp: message.localTimestamp, 
									flags: {outgoing: message.folder === "outbox"}
								}]));
							}
							// Only need to check the last inbox or outbox message
							break;
						}
					}
				} else {
					nothingToDo = false;
					// Since there are no more messages for the thread, make it invisible.
					// It will be deleted or made visible elsewhere as needed.
					future.nest(MojoDB.merge([{
						_id:this.chatThread._id,
						flags: {visible: false}
					}]));
				}
			} 			

			if (nothingToDo) {
				future.result = true;
			}
		});
	
		return future;
	
	},
	
	/***********************************
	 * Functions below are unit tested *
	 ***********************************/
	shouldUpdateChatThread: function (chatThread, message) {
		return (chatThread.timestamp !== message.localTimestamp || 
			    chatThread.summary !== message.messageText || 
				(chatThread.flags.outgoing === true && message.folder !== "outbox"));
	}
	
});