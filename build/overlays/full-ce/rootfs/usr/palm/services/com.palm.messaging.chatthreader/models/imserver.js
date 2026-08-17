/*global console, DBModels, Future, MojoDB, Messaging*/
/*
 * Copyright 2010 Palm, Inc.  All rights reserved.
 */

// Servers/Rooms (Milestone 1): the top container of a hierarchical IM service - a Discord
// guild, IRC network, Teams team, Slack workspace, Matrix space, etc. Created on demand by the
// channel-routing branch in DBModels.Conversations.findOrCreate the first time a message for one
// of its channels is threaded. Deduped on (serviceName, remoteId) via the imserver byRemoteId
// index. Nothing here runs for 1:1 IM / SMS - only for messages the transport tagged as channels.
DBModels.ImServer = {
	id: "com.palm.imserver:1",

	// Resolve the imserver record for a channel message, creating it if it does not exist yet.
	// The message carries serverId (stable remote guild id), serverName (display) and serviceName,
	// as tagged by the libpurple transport (M0). future.result = the imserver record (with _id).
	findOrCreate: function(message) {
		var serviceName = message.serviceName || "";
		// serverId is the stable remote id (M0 currently mirrors serverName into it); fall back to
		// the display name so we still get a stable-enough key if only the name is present.
		var remoteId = message.serverId || message.serverName || "";
		var serverRecord;

		var query = {
			from: DBModels.ImServer.id,
			where: [
				{ prop: "serviceName", op: "=", val: serviceName },
				{ prop: "remoteId", op: "=", val: remoteId }
			]
		};

		var future = MojoDB.find(query, false);
		future.then(this, function(future) {
			var list = future.result.results || [];
			if (list.length > 0) {
				// Existing server - reuse it (already carries its _id).
				serverRecord = list[0];
				future.result = serverRecord;
			} else {
				serverRecord = {
					_kind: DBModels.ImServer.id,
					remoteId: remoteId,
					serviceName: serviceName,
					displayName: message.serverName || remoteId,
					accountId: message.accountId
				};
				future.nest(MojoDB.put([serverRecord]));
			}
		});
		// Stamp the assigned _id onto a freshly-created record (no-op when we reused one).
		future.then(this, function(future) {
			if (serverRecord && serverRecord._id === undefined &&
					future.result.results && future.result.results.length > 0) {
				serverRecord._id = future.result.results[0].id;
			}
			future.result = serverRecord;
		});
		return future;
	}
};
