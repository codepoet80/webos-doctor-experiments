/*global console, Utils, MojoDB, TempDB, Future, ContactsLib*/
/*jslint white: false, onevar: false, nomen:false, plusplus: false*/

/*
 * Copyright 2010 Palm, Inc.  All rights reserved.
 */

var DBModels = {};

/*********************************************************************************************
	Individual chat messages - base for IM, SMS, and MMS 
*********************************************************************************************/
DBModels.Messages = {
	id: "com.palm.message:1",

	getWatchQuery: function() {
		return {
			query: {
				from: DBModels.Messages.id,
				where: [
					{ prop: "conversations", op: "=", val: null },
					{ prop: "flags.visible", op: "=", val: true }
				]
			}
		};
	},

	// Query for messages that have a null conversation
	findUnthreaded: function(revision) {
		console.info("DBModels.Messages.findUnthreaded: watching for new messages");
		var query = {
			from: DBModels.Messages.id,
			where: [
				{ prop: "conversations", op: "=", val: null },
				{ prop: "flags.visible", op: "=", val: true },
				{ prop: "_rev", op: ">", val: revision}
			]
		};
		return MojoDB.find(query);
	},
	
	/**
	 * addConversation 
	 * future.result = -1 if something went wrong
	 */
	// If a "collector" array is supplied, the per-message merge object is pushed onto it and
	// the future resolves immediately (no db8 write). The caller then flushes the whole batch
	// with a single MojoDB.merge — collapsing N per-message writes into one. Without a collector
	// the behaviour is identical to before (one merge per call).
	addConversation: function(message, conversation, noNotification, collector) {
		console.info("DBModels.Messages.addConversation: start");
//		console.info("message="+JSON.stringify(message));
		var future = new Future();
		// "conversations" could be null or undefined
		if (!message.conversations) {
			message.conversations = [];
		}

		var id = conversation._id;
		if (id === undefined) {
			console.error("DBModels.Messages.addConversation: id is undefined");
			future.result = -1;
		} else {
			var index = message.conversations.indexOf(id);
			if (index !== -1) {
				// Already exists
				console.info("DBModels.Messages.addConversation: conversation '"+id+"' already exists at index "+index);
				future.result = 1; // simulate a successful merge
			} else {
				message.conversations.push(id);
				console.info("DBModels.Messages.addConversation: add conversation id "+id+" now "+JSON.stringify(message.conversations));
				var mergeObj = {
					_id: message._id,
					conversations: message.conversations,
					flags: {noNotification: noNotification}
				};
				if (collector) {
					collector.push(mergeObj);
					future.result = 1; // deferred to the caller's batched flush
				} else {
					future = MojoDB.merge([mergeObj]);
				}
			}
		}

		return future;
	},
	
	resetPendingGroupChatMessages: function() {
		console.info("DBModels.Messages.resetPendingGroupChatMessages");
		var mergeObject = {
			props: {
				conversations: null,
				flags : {noNotification: false}
			},
			query: {
				from: DBModels.Messages.id,
				where: [{ prop: "conversations", op: "=", val: DBModels.kMessagePendingGroupChatId }]
			}
		};
		return MojoDB.execute("merge", mergeObject);
	},
	
	// Query for messages that have been deleted. Only select retrieve _rev and conversation.
	findDeleted: function(revision) {
		console.info("DBModels.Messages.findDeleted: query for deleted messages");
		var query = {
			from: DBModels.Messages.id,
			select: ["_rev", "conversations"],
			where: [
				{prop: "_del", op: "=", val: true},
				{prop: "_rev", op: ">", val: revision}
			],
			orderBy: "_rev"
		};
		return MojoDB.find(query);
	},

	// Query for inbox and outbox messages for a given conversation
	findMessagesForThread: function(conversation) {
		console.info("DBModels.Messages.findMessagesForThread: query messages for thread: "+conversation);
		var query = {
			from: DBModels.Messages.id,
			select: ["conversations", "localTimestamp", "messageText", "folder"],
			where: [
				{prop: "conversations", op: "=", val: conversation},
				{prop: "flags.visible", op: "=", val: true}
			],
			orderBy: "localTimestamp",
			desc: true,
			limit: 50		
		};
		return MojoDB.find(query);
	}

};

/*********************************************************************************************
	Chat threads 
*********************************************************************************************/
DBModels.Conversations = {
	id: "com.palm.chatthread:1",
	
	/*
	 * required properties:
	 * replyAddress, replyService, and summary
	 * either personId or groupChatId can be specified
	 */
	createNew: function(replyAddress, replyService, summary, flags, optionalParams) {
		var future;
		if (optionalParams && (optionalParams.personId || optionalParams.groupChatId)) {
			future = DBModels.Conversations.lookupDisplayName(optionalParams);
		} else {
			future = new Future();
			future.result = replyAddress;
		}
		
		future.then(this, function(future) {
			var displayName = undefined;
			if (future.result) {
				displayName = future.result;
			// Leave the displayname empty for group chats that don't have a topic set
			} else if (!optionalParams || !optionalParams.groupChatId) {
				displayName = replyAddress;
			}
			
			var conversation = {
				_kind: DBModels.Conversations.id,
				timestamp: Date.now(),
				summary: summary || "",
				flags: flags,
				displayName: displayName,
				replyAddress: replyAddress,
				normalizedAddress: Messaging.Utils.normalizeAddress(replyAddress, replyService),
				replyService: replyService
			};
			future.nest(MojoDB.put([conversation]));
		});
		return future;
	},

	/*
	 * Adds the displayName property to the chatThread by looking it up from the appropriate source
	 */
	lookupDisplayName: function(chatThread) {
		//console.log("*****lookupDisplayName ++++++");
		var future;
		var displayName = false;
		if (chatThread.groupChatId) {
			future = MojoDB.get([chatThread.groupChatId]);
			future.then(this, function(future) {
				if (future.result.results && future.result.results.length > 0) {
					var groupChat = future.result.results[0];
					displayName = groupChat.displayName;
					// console.log("lookupDisplayName got groupchat name: "+displayName);
				}
				future.result = displayName;
			});
		} else if (chatThread.personId) {
			future = MojoDB.get([chatThread.personId]);
			future.then(this, function(future) {
				if (future.result.results && future.result.results.length > 0) {
					displayName = ContactsLib.Person.generateDisplayNameFromRawPerson(future.result.results[0]);
					// console.log("lookupDisplayName got person name: "+displayName);
				}
				future.result = displayName;
			});
		} else {
			future = new Future();
			future.result = Messaging.Utils.formatAddress(chatThread.replyAddress, chatThread.replyService);
		}
		
		future.then(this, function(future) {
			if (future.result && future.result.length > 0) {
				future.result = future.result;
			} else {
				if(chatThread.displayName){
					future.result = chatThread.displayName;
				}
				else if (chatThread.replyAddress) {
					//console.log("lookupDisplayName got replyAddress: "+chatThread.replyAddress);
					future.result = chatThread.replyAddress;
				} else {
					console.warn("lookupDisplayName: surprisingly I couldn't find any displayable name");
					future.result = "";
				}
			}
		});
		
		return future;
	},
	
	/**
	 * findOrCreateChannelThread (Servers/Rooms Milestone 1)
	 * Route a channel (MUC) message to the single chatthread that represents its channel,
	 * creating the imserver (guild/network) + imchannel (room) hierarchy and the channel's
	 * chatthread on first sight. Mirrors the imgroupchat <-> chatthread 1:1 link, but driven
	 * from the message tags instead of a separate transport-created record, so no extra db8
	 * watch is needed. future.result = the channel's chatthread (with _id) or undefined on error.
	 */
	findOrCreateChannelThread: function(message) {
		var serviceName = message.serviceName || "";
		var channelAddr = message.channelName;
		var serverRec, channelRec, targetConversation;

		var future = new Future();
		future.result = true;

		// 1. Ensure the server (guild/network) record exists.
		future.then(this, function(future) {
			future.nest(DBModels.ImServer.findOrCreate(message));
		});

		// 2. Ensure the channel record exists under that server.
		future.then(this, function(future) {
			serverRec = future.result;
			future.nest(DBModels.ImChannel.findOrCreate(message, serverRec && serverRec._id));
		});

		// 3. If the channel is already linked to a chatthread, fetch it; otherwise signal "none".
		future.then(this, function(future) {
			channelRec = future.result;
			if (channelRec && channelRec.chatThreadId) {
				future.nest(MojoDB.get([channelRec.chatThreadId]));
			} else {
				future.result = { results: [] };
			}
		});

		// 4. Update the existing channel thread, or create it if this is the channel's first message.
		future.then(this, function(future) {
			var results = (future.result && future.result.results) || [];
			if (results.length > 0) {
				// Existing channel thread: apply the new message (summary/unreadCount/timestamp).
				var conversation = {
					_kind: DBModels.Conversations.id,
					_id: results[0]._id,
					unreadCount: results[0].unreadCount
				};
				// Self-heal the thread's display name from the (now-refreshed) imchannel, so a channel
				// first threaded under a stale name (e.g. "Chats") updates to its real title next message.
				if (channelRec && channelRec.displayName && !DBModels.ImChannel._isRawId(channelRec.displayName, channelAddr) && results[0].displayName !== channelRec.displayName) {
					conversation.displayName = channelRec.displayName;
				}
				Messaging.ChatThread._updateFromNewMessage(conversation, message, { addr: channelAddr });
				targetConversation = conversation;
				future.nest(MojoDB.merge([conversation]));
			} else {
				// First message for this channel: create its chatthread. normalizedAddress is keyed
				// on the channel so nothing else is needed to find it again; channelId/serverId are
				// denormalized so the Servers-tab UI can map thread -> channel -> server.
				var newConversation = {
					_kind: DBModels.Conversations.id,
					timestamp: Date.now(),
					summary: "",
					flags: { visible: true, outgoing: false },
					displayName: (channelRec && channelRec.displayName) || message.channelDisplayName || message.serverName || channelAddr,
					replyAddress: channelAddr,
					normalizedAddress: Messaging.Utils.normalizeAddress(channelAddr, serviceName),
					replyService: serviceName,
					channelId: channelRec && channelRec._id,
					serverId: serverRec && serverRec._id
				};
				Messaging.ChatThread._updateFromNewMessage(newConversation, message, { addr: channelAddr });
				targetConversation = newConversation;
				future.nest(MojoDB.put([newConversation]));
			}
		});

		// 5. If we created a new thread, capture its _id and link it back onto the imchannel.
		future.then(this, function(future) {
			if (targetConversation && targetConversation._id === undefined) {
				if (future.result.results && future.result.results.length > 0) {
					targetConversation._id = future.result.results[0].id;
				}
				if (channelRec && channelRec._id && targetConversation._id !== undefined) {
					future.nest(DBModels.ImChannel.setChatThreadId(channelRec._id, targetConversation._id));
				} else {
					future.result = true;
				}
			} else {
				future.result = true;
			}
		});

		// 6. Resolve to the channel's chatthread.
		future.then(this, function(future) {
			if (targetConversation === undefined) {
				console.error("findOrCreateChannelThread: no conversation resolved for channel " + channelAddr);
			}
			future.result = targetConversation;
		});

		return future;
	},

	/**
	 * findOrCreate
	 * future.result will be an object with _id of the conversation or undefined if something went wrong
	 */
	findOrCreate: function(person, message, address) {
		// Servers/Rooms (Milestone 1): a MUC message tagged by the transport with a channelName
		// belongs to a CHANNEL (Discord/IRC/Teams/etc.). Route it to the single chatthread for that
		// channel - keyed on the channel, NOT the per-message sender - so a busy channel stays in
		// ONE thread instead of the one-thread-per-speaker flattening the address path below would
		// produce. Gated entirely on channelName, so 1:1 IM / SMS / group-chat threading is
		// untouched. (Safe to run inline: the new-message assistant drains each batch sequentially
		// under an activation lock, so no two channel messages create the same channel concurrently.)
		if (message.channelName) {
			return DBModels.Conversations.findOrCreateChannelThread(message);
		}

		// targetConversation references a conversation object that will be the eventual future.result value.
		// It will be the result of a db.find() or pieced together and _id added as part of a db.put()
		var conversationList, targetConversation = undefined;
		if (address.addr !== undefined) {
			// TODO: This is a HACK. The service should clean up the address
			if (address.addr.indexOf("@gmail") !== -1 && address.addr.indexOf("/") !== -1) {
				console.log("BAD GMAIL ADDRESS FIXED");
				address.addr = address.addr.substring(0, address.addr.indexOf("/"));
				// console.log("FIXED: "+address.addr);
			}
		}

		// lookup the conversation...
		console.info("DBModels.Conversation.findOrCreate: nesting db.find");
		var query = { from: DBModels.Conversations.id };
		if (address.addr === undefined) {
			console.error("DBModels.Conversations.findOrCreate address is undefined, setting to 'No Recipient'");
			address.addr = Messaging.Utils.kMissingAddress;
		}
		if (message.serviceName === undefined) {
			console.error("DBModels.Conversations.findOrCreate serviceName is undefined, setting to 'sms'");
			message.serviceName = "sms";
		}

		var normalizedAddress = Messaging.Utils.normalizeAddress(address.addr, message.serviceName);

		// If the person doesn't exist, then see if there's already a "non-contact" conversation for this address 
		if (person && person._id !== undefined) {
			query.where = [{prop:"personId", op:"=", val:person._id}];
		} else {
			// NOTE:
			// This used to query based on replyService as well.  By querying only on replyAddress, addresses with the
			// same value will be placed in the same chatthread.  This means that if you receive a GTalk message from 
			// john_smith and an AIM message from john_smith, they will be placed in the same chatthread.  This is making
			// the assumption that these two accounts are actually the same person which may not always be valid.  Another
			// edge case is that we could receive a message from an ICQ account of address 4085551234 and an SMS from 
			// the phone number 408-555-1234.  In that case, they would incorrectly be placed in the same chatthread.
			query.where = [{prop:"normalizedAddress", op:"%", val:normalizedAddress}];
		}

		var chatFuture = MojoDB.find(query, false);

		// A 1:1 thread created BEFORE its contact was linked is keyed on the raw address and has no
		// personId, so the personId-keyed lookup above misses it once the person resolves — which would
		// fork a duplicate, number-named thread. When the person is now known but no personId-keyed
		// thread exists, re-query by address and ADOPT that pre-person thread instead of duplicating it.
		if (person && person._id !== undefined) {
			chatFuture.then(function(future) {
				var list = (future.result && future.result.results) || [];
				if (list.length === 0 && !message.groupChatName) {
					future.nest(MojoDB.find({ from: DBModels.Conversations.id,
						where: [{prop:"normalizedAddress", op:"%", val:normalizedAddress}] }, false));
				} else {
					future.result = future.result;
				}
			});
		}

		// Either update the existing conversation or create a new one
		chatFuture.then(function(future) {
			conversationList = future.result.results || [];
			//console.info("DBModels.Conversation.findOrCreate: find result " + JSON.stringify(future.result));
			var conversation = {
				_kind: DBModels.Conversations.id,
				personId: (person ? person._id : undefined)
			};
			
			// Result could be {} if the conversation doesn't exist
			if (conversationList.length > 0) {
				targetConversation = conversationList[0];
				conversation._id = targetConversation._id;
				conversation.unreadCount = conversationList[0].unreadCount;
				// Self-heal the display name: if the sender name carries astral emoji the transport
				// supplies an encoded copy as address.name. Refresh displayName from it so existing
				// emoji-named chats stop showing tofu on their next message. Match key untouched.
				if (!message.groupChatName && address.name && targetConversation.displayName !== address.name) {
					conversation.displayName = address.name;
				}
				// Adopt a pre-person thread: if we now have a person this thread wasn't linked to, stamp
				// its real contact name so it stops showing the bare address (personId itself is already
				// set on `conversation` above via personId: person._id). Only fires on first adoption
				// (personId differs), so an already-linked thread's name is never disturbed.
				if (person && person._id !== undefined && targetConversation.personId !== person._id &&
				    ContactsLib && ContactsLib.Person && ContactsLib.Person.generateDisplayNameFromRawPerson) {
					var pdn = ContactsLib.Person.generateDisplayNameFromRawPerson(person);
					if (pdn && pdn.length > 0) { conversation.displayName = pdn; }
				}
				Messaging.ChatThread._updateFromNewMessage(conversation, message, address);
				// webOS: an INCOMING message must surface its conversation even if the thread was left
				// hidden (a stale service thread visible:false from a prior session) or the message is
				// flagged invisible. _updateFromNewMessage early-returns for invisible messages
				// (Messaging.Message.isVisible === false) -- e.g. the Telegram login-code/2FA prompt the
				// plugin posts to the "Telegram" service chat as a PURPLE_MESSAGE_SYSTEM message -- so a
				// reused hidden thread stays hidden and the user can't see/reply to the prompt, stalling
				// login. Force it visible on any inbox message, and if the update was skipped, surface the
				// prompt text so the conversation is recognizable in the list.
				if (message.folder === "inbox") {
					if (!conversation.flags) { conversation.flags = {}; }
					conversation.flags.visible = true;
					if (conversation.summary === undefined && message.messageText) {
						conversation.summary = message.messageText;
						conversation.timestamp = message.localTimestamp || conversation.timestamp;
					}
				}
				// Return the object we actually incremented (not the pre-increment db record),
				// so callers that reuse the result see the applied summary/unreadCount. Stock
				// re-read per message so it never mattered; the batched path caches this object.
				targetConversation = conversation;
				future.nest(MojoDB.merge([conversation]));
			} else if (message.groupChatName) {
				// The chatthread for this groupchat doesn't yet exist so put the message
				// in a dummy chatthread until an imgroupchat causes the chatthread to get created.
				console.info("Putting message in 'pending' because there's no group chatthread for "+message.groupChatName);
				var dummyConversation = { _id: DBModels.kMessagePendingGroupChatId };
				future.nest(DBModels.Messages.addConversation(message, dummyConversation, true));
			} else {
				// If the conversation doesn't yet have a displayName and it isn't a groupChat,
				// then incorporate the name given in the address (if any)
				if (!message.groupChatName && address.name) {
					console.info("inheriting displayName from addr.name: "+address.name);
					conversation.displayName = address.name;
				}

				Messaging.ChatThread._updateFromNewMessage(conversation, message, address);

				// webOS: see the inbox-visible note above -- a NEW thread created from an invisible
				// incoming message (e.g. a Telegram auth prompt when no prior thread exists) must still
				// be visible so the user can see/reply to it.
				if (message.folder === "inbox") {
					if (!conversation.flags) { conversation.flags = {}; }
					conversation.flags.visible = true;
					if (conversation.summary === undefined && message.messageText) {
						conversation.summary = message.messageText;
						conversation.timestamp = message.localTimestamp || conversation.timestamp;
						conversation.replyService = conversation.replyService || message.serviceName;
					}
				}

				targetConversation = conversation;

				var creatorFunc = function() {
					
					var createChatFuture = DBModels.Conversations.lookupDisplayName(conversation);
					createChatFuture.then(this, function(createFuture) {
						// console.log("findOrCreate: got the name, now create the conversation " + JSON.stringify(createFuture.result));
						if (createFuture.result && createFuture.result.length > 0) {
							conversation.displayName = createFuture.result;
						}
						createFuture.nest(MojoDB.put([conversation]));
					});
					return createChatFuture;
				};
				future.nest(creatorFunc());
			}
		});
		
		chatFuture.then(function(future) {
			//console.info("DBModels.Conversation.findOrCreate: last 'then' targetConversation=" + JSON.stringify(targetConversation));
			//console.info("DBModels.Conversation.findOrCreate: last 'then' future.result=" + JSON.stringify(future.result));
			// targetConversation._id will be undefined if a new conversation was created in which case _id can be
			// had from the success result of the db.put() which looks something like [{"id": "1lk", "rev": 28}]
			if(targetConversation === undefined) {
				console.error("targetConversation is undefined!"); //  conversationList:" + JSON.stringify(conversationList));
			} else if (targetConversation._id === undefined && future.result.results.length > 0) {
				targetConversation._id = future.result.results[0].id;
			}

			future.result = targetConversation;
		});

		return chatFuture;
	},
		
	createEmpty: function(personId, addr, serviceName) {
		// Create the chatthread
		var person = {_id:personId};
		var message = {
			serviceName: serviceName,
			flags: {
				visible: false
			}
		};
		var address = {
			addr: addr
		};
		return DBModels.Conversations.findOrCreate(person, message, address);

	},
	
	// Query for a specific thread
	findThread: function(thread) {
		console.info("DBModels.Conversations.findThread: "+thread);
		var query = {
			from: DBModels.Conversations.id,
			select: ["_id", "summary", "timestamp", "flags"],
			where: [
				{prop: "_id", op: "=", val: thread}
			]
		};
		return MojoDB.find(query);
	}

};

/*********************************************************************************************
BuddyStatus 
*********************************************************************************************/
DBModels.BuddyStatus = {
	id: "com.palm.imbuddystatus:1",
	rev: 0,
	
	// Function getGroupAvailability() included in Unit testing
	getGroupAvailability: function(buddyStatusRecord, availability) {
		if (availability < Messaging.Availability.OFFLINE) {
			var group = buddyStatusRecord.group || Messaging.Utils.kDefaultBuddyGroup;
			return group.toLowerCase() + availability;
		} else {
			return "" + availability; // want all offline buddies to sort alphabetically by name so the groupAvailability should be same
		}
	},
	
	// Watch for all records with an empty displayName.  If the displayName is empty, it's likely that
	// this is a new buddy and will also have an empty personId.  
	getDisplayNameWatchQuery: function() {
		return {
			query: {
				from: DBModels.BuddyStatus.id,
				where: [
					{ prop: "displayName", op: "=", val: "" }
				]
			}
		};
	},
	
	// Watch for changes to availability
	getAvailabilityWatchQuery: function(revision) {
		revision = revision || this.rev;
		var q ={
			query: {
				from: DBModels.BuddyStatus.id,
				where: [
					{ prop: "availabilityRevSet", op: ">", val: revision }
				],
				limit: 1
			}
		};
		return q;
	},

	
	// Find buddies with no displayName set yet.  These are usually new buddies.
	findNewBuddies: function() {
		var query = {
			from: DBModels.BuddyStatus.id,
			where: [
				{ prop: "displayName", op: "=", val: "" }
			]
		};
		return TempDB.find(query, false);
	},

	// Find buddies that have had their availability updated
	findNewAvailability: function(revision) {
		revision = revision || this.rev;
		console.info("DBModels.BuddyStatus.findNewAvailability rev="+revision);

		// Query for a list of records with a revision number greater than the last availabilityRevSet value
		var query = {
			from: DBModels.BuddyStatus.id,
			where: [
				{ prop: "availabilityRevSet", op: ">", val:revision }
			]
		};
		var future = TempDB.find(query, false);
		future.then(this, function() {
			// console.log("updating rev!  Currently: "+this.rev);
			var results = future.result ? future.result.results : [];
			if(results.length > 0) {
				// console.log("UPDATING REV BASED ON: "+JSON.stringify(results[results.length-1]));
				this.rev = results[results.length-1].availabilityRevSet;
			} else {
				if( this.rev > 0 ) {
					console.error("DBModels.Person: Queried for rev "+this.rev+".!  We were told there were changes but none exist!");
				}
			}
			future.result = future.result;
		});
		return future;
	},

	// Set the displayName and personId for imbuddystatus records that do not have it set yet
	updateFromPerson: function(buddyStatusRecord, personRecord, checkRevision) {
		// If the buddy isn't valid, don't attempt to update it.
		if (!buddyStatusRecord._id || !buddyStatusRecord._rev) {
			return new Future().immediate();
		}

		var displayName;
		try {
			displayName = ContactsLib.Person.generateDisplayNameFromRawPerson(personRecord);
		} catch(e) {
			displayName = buddyStatusRecord.username || ".";
			console.error("updateFromPerson caught exception " + JSON.stringify(e));
		}
		var buddyChange = {
			_id: buddyStatusRecord._id,
			personId: personRecord._id,
			displayName: displayName
		};
		
		if (checkRevision) {
			buddyChange._rev = buddyStatusRecord._rev;
		}
		return TempDB.merge([buddyChange]);
	},
	
	// Update the groupAvailability field with the group field concatenated with the most available availability.
	// This field is used for sorting the buddy list.
	updatePersonAvailability: function(buddyStatusRecord) {
		var future = new Future();
		//console.log("updatePersonAvailability u="+buddyStatusRecord.username+", grp="+buddyStatusRecord.group);
		// we could have an empty budyStatusRecord here if there were no buddies to update
		if(buddyStatusRecord === undefined || (!buddyStatusRecord.personId && !buddyStatusRecord.username && !buddyStatusRecord.serviceName)) {
			console.error("updatePersonAvailability: No record to update!");
			future.result = true;
			return future;
		}

		var query;
		if (buddyStatusRecord.personId) {
			query = {
				from: DBModels.BuddyStatus.id,
				limit:50,
				where: [{ prop:"personId", op:"=", val:buddyStatusRecord.personId}]
			};
		} else {
			query = {
				from: DBModels.BuddyStatus.id,
				limit:50,
				where: [
					{ prop:"username", op:"=", val:buddyStatusRecord.username},
					{ prop:"serviceName", op:"=", val:buddyStatusRecord.serviceName}
				]
			};
		}
		// console.log("Look for all imbuddystatus records connected to the same person.  query:"+JSON.stringify(query));
		future = TempDB.find(query, false);
		future.then(this, function(future) {
			var i, mergeObject, returnFuture;
			var results = future.result ? future.result.results : [];
			var count = results ? results.length : 0;
			var mostAvailableState = 4;
			// console.log("Retrieved list of imbuddystatus records with personId "+buddyStatusRecord.personId);
			if(future.result) {
			//	console.log("future.result:"+JSON.stringify(future.result));
			} else {
				console.error("future.result is undefined!!");
			}
			
			//returnFuture = new Future();
			//returnFuture.result = true;
			
			// Find the most available state for this person
			for(i=0; i<count; i++) {
				if(results[i].availability !== undefined && results[i].availability < mostAvailableState) {
					// Found a more available state
					mostAvailableState = results[i].availability;
				}
			}
			// console.log("mostAvailableState: "+mostAvailableState);
			
			// Update the sortby field for each record linked to the person.
			var buddy, buddyUpdates = [];
			var groupHasPrimary = {}; // used to mark a buddy as primary for a given group
			for(i=0; i<count; i++) {
				var groupAvailability = DBModels.BuddyStatus.getGroupAvailability(results[i], mostAvailableState);
				groupAvailability = groupAvailability.toLowerCase();
				buddy = {
					_id: results[i]._id,
					primary: (groupHasPrimary[groupAvailability] === undefined),
					groupAvailability: groupAvailability,
					offline: (mostAvailableState === Messaging.Availability.OFFLINE),
					personAvailability: mostAvailableState
				};
				buddyUpdates.push(buddy);
				groupHasPrimary[groupAvailability] = true;
				// console.log("updating imbuddystatus["+results[i].displayName+"]: "+JSON.stringify(buddy));
			}
			future.nest(TempDB.merge(buddyUpdates));
			
			// console.log("nest the future only from the last merge call");
			//future.nest(returnFuture);
		});
		return future;
	}

};

DBModels.kMessagePendingGroupChatId = "pending_groupchat";
// Sentinel conversation id used by the chatthreader SELF-HEAL loop-breaker: a message parked here
// (conversations = [this]) can never match findUnthreaded's "conversations = null" again, so a
// poison record can't spin the newMessages activity forever. No real conversation record uses this
// id - parked messages are simply not shown under any thread, which is fine (they were looping /
// invisible anyway). Deliberately NOT the pending_groupchat id, so resetPendingGroupChatMessages
// never re-nulls a self-healed message back into the loop.
DBModels.kSelfHealedThreadId = "self_healed_orphan";

/*********************************************************************************************
Person 
*********************************************************************************************/
DBModels.Person = {
	id: "com.palm.person:1"
};
