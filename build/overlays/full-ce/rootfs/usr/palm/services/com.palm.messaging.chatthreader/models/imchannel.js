/*global console, DBModels, Future, MojoDB, Messaging*/
/*
 * Copyright 2010 Palm, Inc.  All rights reserved.
 */

// Servers/Rooms (Milestone 1): a room/channel inside an imserver (a Discord text channel, IRC
// channel, Teams/Slack channel, Matrix room). Created on demand by the channel-routing branch in
// DBModels.Conversations.findOrCreate. Deduped on (serviceName, remoteId=channelName) via the
// imchannel byRemoteId index. Each channel is linked 1:1 to a chatthread (chatThreadId), exactly
// like an imgroupchat - the chatthread holds the message list; the imchannel gives it a parent
// server so the Servers-tab UI can present server -> channel. parentId/path stay unused for flat
// 2-level services (IRC) and carry categories/subspaces for Discord/Matrix later.
DBModels.ImChannel = {
	id: "com.palm.imchannel:1",

	// webOS: a WhatsApp group whose subject hasn't been fetched yet (during post-connect backfill)
	// can surface with its raw JID as the "display name" ("<digits>-<digits>@g.us"), or with the
	// display name equal to the match key. NEVER let that raw id become or overwrite the channel's
	// human name -- keep the existing good name until a message supplies the real subject. The
	// transport now suppresses this at the source too; this is the belt-and-suspenders half.
	_isRawId: function(dn, remoteId) {
		return !dn || dn === remoteId || /^\d+(-\d+)?@g\.us$/.test(dn);
	},

	// Resolve the imchannel record for a channel message, creating it if absent. serverRecId is the
	// _id of the owning imserver. future.result = the imchannel record (with _id).
	findOrCreate: function(message, serverRecId) {
		var serviceName = message.serviceName || "";
		var remoteId = message.channelName || "";
		var channelRecord;

		var query = {
			from: DBModels.ImChannel.id,
			where: [
				{ prop: "serviceName", op: "=", val: serviceName },
				{ prop: "remoteId", op: "=", val: remoteId }
			]
		};

		var future = MojoDB.find(query, false);
		future.then(this, function(future) {
			var list = future.result.results || [];
			if (list.length > 0) {
				// Existing channel - reuse it (already carries its _id and chatThreadId if linked).
				channelRecord = list[0];
				// Self-heal: a channel first seen via an old-transport message (or before its title
				// was known) can carry a stale displayName (e.g. the server name "Chats") or sit under
				// a stale server. If this message now supplies a real channelDisplayName that differs,
				// or a different server, refresh them in place so the channel stops showing "Chats"/the
				// raw id and moves under the current server. Match key (remoteId) is untouched.
				var patch = null;
				var dn = message.channelDisplayName;
				if (dn && !DBModels.ImChannel._isRawId(dn, remoteId) && channelRecord.displayName !== dn) {
					patch = patch || { _id: channelRecord._id };
					patch.displayName = dn; channelRecord.displayName = dn;
				}
				if (serverRecId && channelRecord.serverId !== serverRecId) {
					patch = patch || { _id: channelRecord._id };
					patch.serverId = serverRecId; channelRecord.serverId = serverRecId;
				}
				if (patch) {
					future.nest(MojoDB.merge([patch]));
				} else {
					future.result = channelRecord;
				}
			} else {
				channelRecord = {
					_kind: DBModels.ImChannel.id,
					remoteId: remoteId,
					serviceName: serviceName,
					serverId: serverRecId,
					parentId: null,
					type: "channel",
					// name = the stable remote key (channelName: Discord snowflake, Telegram chat-<id>).
					// displayName prefers the transport-supplied human room title (channelDisplayName,
					// e.g. the Telegram group name); falls back to the server name, then the raw id.
					name: remoteId,
					// NB: do NOT fall back to remoteId (the raw JID) -- leave displayName unset when no
					// human name is known yet, so the thread self-heal (which copies channelRec.displayName)
					// never propagates the JID. A later named message fills it in via the update branch.
					displayName: (message.channelDisplayName && !DBModels.ImChannel._isRawId(message.channelDisplayName, remoteId)) ?
						message.channelDisplayName : message.serverName,
					position: 0
				};
				future.nest(MojoDB.put([channelRecord]));
			}
		});
		// Stamp the assigned _id onto a freshly-created record (no-op when we reused one).
		future.then(this, function(future) {
			if (channelRecord && channelRecord._id === undefined &&
					future.result.results && future.result.results.length > 0) {
				channelRecord._id = future.result.results[0].id;
			}
			future.result = channelRecord;
		});
		return future;
	},

	// Link a freshly-created chatthread back onto the imchannel (mirrors how
	// NewGroupChatCommandAssistant writes chatThreadId onto an imgroupchat).
	setChatThreadId: function(channelRecId, chatThreadId) {
		return MojoDB.merge([{ _id: channelRecId, chatThreadId: chatThreadId }]);
	}
};
