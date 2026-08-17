/*global console, Class, DBModels, Future, MojoDB */
/*
 * Copyright 2010 Palm, Inc.  All rights reserved.
 */

// Invoked whenever a restore is completed
var RestoreAssistant = Class.create({
	run: function(future) {
				
		// null out personId for all chatthreads
		future.now(this, function(future) {
			var query = {
				from: DBModels.Conversations.id,
				where: []
			};
			var props = {"personId":null};
			future.nest(MojoDB.merge(query, props));
		});

		return future;
	}
});
