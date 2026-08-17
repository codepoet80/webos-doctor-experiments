enyo.kind({
	name: "ThreadService",
	kind: enyo.Service,
	requestKind: "ThreadRequest",
	events: {
		onWatch: ""
	}});

enyo.kind({
	name: "ThreadRequest",
	kind: enyo.Request,
	events: {
		onWatch: "doWatch"
	},
	components: [
		{kind: "DbService", onFailure: "fail", components: [
			{dbKind: "com.palm.chatthread:1", onSuccess: "gotThreads", components:[
				{name: "threads", method: "find", subscribe: true, onWatch: "doWatch"/*, resubscribe: true, reCallWatches: true*/},
				{name: "threadsSearch", method: "search", subscribe: true, onWatch: "doWatch"/*, resubscribe: true, reCallWatches: true*/}
			]},
			{name: "people", dbKind: "com.palm.person:1", method: "find", onSuccess: "gotPeople", onFailure: "gotPeople", subscribe: true, onWatch: "doWatch"/*, resubscribe: true, reCallWatches: true*/}
		]},
		{name: "status", kind: enyo.TempDbService, dbKind: "com.palm.imbuddystatus:1", method: "find", onSuccess: "gotStatus", subscribe: true, onWatch: "doWatch"/*, resubscribe: true, reCallWatches: true*/},
		{name: "mockThreads", kind: "MockDb", dbKind: "chatthreads/com.palm.chatthread:1", method: "find", onSuccess: "gotThreads", onFailure: "fail", onWatch: "doWatch"},
		{name: "mockBuddies", kind: "MockDb", dbKind: "buddies/com.palm.imbuddystatus:1", method: "find", onSuccess: "gotStatus", onFailure: "fail", onWatch: "doWatch"},
		{name: "mockPeople", kind: "MockDb", dbKind: "persons/com.palm.person:1", method: "find", onSuccess: "gotPeople", onFailure: "fail", onWatch: "doWatch"}
	],
	create: function() {
		this.inherited(arguments);
	},
	initComponents: function() {
		this.inherited(arguments);
		if (!window.PalmSystem) {
			this.$.threads = this.$.mockThreads;
			this.$.buddies = this.$.mockBuddies;
			this.$.people = this.$.mockPeople;
		}
	},
	finish: function() {
		// don't destroy automatically, so we can see watches
	},
	call: function() {
		if (this.params && this.params.query && this.params.query.search) {
			this.params.query.search = undefined;
			this.$.threadsSearch.cancel();
			this.$.threadsSearch.call(this.params);
		}
		else{
			this.$.threads.cancel();
			this.$.threads.call(this.params);
		}
	},
	reply: function() {
		this.receive(this.data);
	},
	fail: function(inSender, inResponse) {
		enyo.log(inResponse);
		this.reply();
	},
	gotThreads: function(inSender, inResponse) {
		this.data = inResponse;
		this.assembleIds();
		//query people and status at same time, so the list will be updated which ever returned early, might cause to refresh list one more time though
		this.queryPeople();
		this.queryStatus();
	},
	assembleIds: function() {
		// acquire ids for merging person data
		this.pids = [];
		for (var i=0, d; d=this.data.results[i]; i++) {
			if (d.personId) {
				this.pids.push(d.personId);
			}
		}
	},
	queryPeople: function() {
		// query person data
		var where = [{
			prop: "_id",
			op: "=",
			val: this.pids
		}];

		this.$.people.id = "threadRequest_people";
		this.$.people.cancel();
		this.$.people.call({query: {
			where: where,
			select: enyo.messaging.person.selectAttributes
		}});
	},
	gotPeople: function(inSender, inResponse){
		if (inResponse.results && inResponse.results.length > 0) {
			// merge linked data
			enyo.messaging.utils.joinData(this.data, inResponse.results, "_id", "personId", "person");
		}
		this.reply();
	},
	queryStatus: function() {
		// query buddy status data
		var where = [{
			prop: "personId",
			op: "=",
			val: this.pids
		}];
		this.$.status.id = "threadRequest_status";
		this.$.status.cancel();
		this.$.status.call({query: {
			where: where
		}});
	},
	gotStatus: function(inSender, inResponse){
		// merge linked data
		if (inResponse.results && inResponse.results.length > 0) {
			enyo.messaging.utils.joinData(this.data, inResponse.results, "personId", "personId", "status");
		}
		this.reply();
	}
});
