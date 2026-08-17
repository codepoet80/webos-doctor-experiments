enyo.kind({
	name: "FavoriteService",
	kind: enyo.Service,
	requestKind: "FavoriteRequest",
	events: {
		onWatch: ""
	}
});

enyo.kind({
	name: "FavoriteRequest",
	kind: enyo.Request,
	events: {
		onWatch: "doWatch"
	},
	components: [
		{kind: "DbService", onFailure: "fail", components: [
			{name: "people", method: "find", dbKind: "com.palm.person:1", onSuccess: "gotPeople", subscribe: true, onWatch: "doWatch"/*, resubscribe: true, reCallWatches: true*/},
			{name: "peopleSearch", method: "search", dbKind: "com.palm.person:1", onSuccess: "gotPeople", subscribe: true, onWatch: "doWatch"/*, resubscribe: true, reCallWatches: true*/},
			{name: "threads", dbKind: "com.palm.chatthread:1", method: "find", onSuccess: "gotThreads", subscribe: true, onWatch: "doWatch"/*, resubscribe: true, reCallWatches: true*/},
			{name: "buddy", service: "palm://com.palm.tempdb/", dbKind: "com.palm.imbuddystatus:1", method: "find", onSuccess: "gotBuddies", subscribe: true, onWatch: "doWatch"/*, resubscribe: true, reCallWatches: true*/}
		]}/*,
		{name: "mockPeople", kind: "MockDb", dbKind: "com.palm.people:1", method: "find", onSuccess: "gotPeople", onFailure: "fail", onWatch: "doWatch"}*/
	],
	create: function() {
		this.inherited(arguments);
	},
	initComponents: function() {
		this.inherited(arguments);
		/*
		if (!window.PalmSystem) {
			this.$.people = this.$.mockPeople;
		}
		*/
	},
	call: function() {
		//enyo.log(this.params);
		if (this.params.query.search) {
			this.params.query.search = undefined;
			this.$.peopleSearch.cancel();
			this.$.peopleSearch.call(this.params);
		}
		else {
			this.$.people.cancel();
			this.$.people.call(this.params);
		}
	},
	reply: function() {
		//enyo.log(this.data);
		this.receive(this.data);
	},
	fail: function(inSender, inResponse) {
		enyo.error("FavoriteRequest DbService fail: ", inResponse);
		this.reply();
	},
	finish: function() {
		// don't destroy automatically, so we can see watches
	},
	gotPeople: function(inSender, inResponse, inRequest) {
		this.data = inResponse;
		this.assembleIds();
		this.queryThreads();
	},
	assembleIds: function() {
		this.pids = [];
		for (var i=0, d; d=this.data.results[i]; i++) {
			this.pids.push(d._id);
		}
	},
	queryThreads: function() {
		this.$.threads.id = "favoriteRequest_threads";
		this.$.threads.cancel();
		this.$.threads.call({query: {
					            where: [{ 
					         	          prop: "personId",
										  op: "=",
										  val: this.pids
									    }],
								select: [
								         "_id",			
								         "_kind",
								         "personId",
								         "normalizedAddress",
								         "displayName",
								         "unreadCount"
								        ]
								      }
					            });
	},
	gotThreads: function(inSender, inResponse, inRequest) {
		//enyo.log("#@#@ got chat threads in ", inRequest.latency, "ms");
		//enyo.log("#@#@ got chat threads: ", inResponse);
		// join chat thread data to buddy data
		enyo.messaging.utils.joinData(this.data, inResponse.results, "personId", "_id", "thread");
		this.queryBuddies();
	},
	queryBuddies: function() {
		this.$.buddy.id = "favoriteRequest_buddies";
		this.$.buddy.cancel();
		this.$.buddy.call({query: {
					            where: [{ 
					         	          prop: "personId",
										  op: "=",
										  val: this.pids
									    }],
								select: [
								         "_id",			
								         "_kind",
								         "personId",
								         "username",
								         "serviceName",
								         "availability",
								         "status"
								        ]
								      }
					            });
		
	},
	gotBuddies: function(inSender, inResponse) {
		var favorites = this.data.results;
		var buddies = inResponse.results;
		var lookup = {};
		var i, j;
		
		//enyo.log("@#@# got buddies: ", buddies);
		
		// in Person' record, 'ims' records store only the username and service
		// name for each buddy.  So we need to use this pair of information to 
		// reverse look up the buddy record.
		for (i = 0; i < favorites.length; i++) {
			var favorite = favorites[i];
			lookup[favorite._id] = favorite.ims;
		}
		//enyo.log("@#@# got lookup: ", lookup);
		
		for (i = 0; i < buddies.length; i++) {
			var ims = lookup[buddies[i].personId];
			//enyo.log("@#@# looked up ims: ", ims);
			if (ims) {
				for (j = 0; j < ims.length; j++) {
					if (buddies[i].serviceName === ims[j].type && buddies[i].username === ims[j].value) {
						ims[j].availability = buddies[i].availability;
						ims[j].status = buddies[i].status;
						ims[j]._kind = buddies[i]._kind;
					}
				}
				
			}
		}
		
		// all done now
		this.reply();
	}
});