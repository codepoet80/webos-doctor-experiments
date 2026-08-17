/*globals enyo */

// Servers/Rooms (Milestone 2): live-subscribed feeds of the imserver (guild/network) and
// imchannel (room) hierarchy that the chatthreader builds from tagged MUC messages (M1). Modeled
// on ThreadService/FavoriteService but far simpler - the records are already self-contained, so
// there is no person/status join to do; we just page a subscribe find and re-emit on watch.

enyo.kind({
	name: "ServerService",
	kind: enyo.Service,
	requestKind: "ServerRequest",
	events: {
		onWatch: ""
	}
});

enyo.kind({
	name: "ServerRequest",
	kind: enyo.Request,
	events: {
		onWatch: "doWatch"
	},
	components: [
		{kind: "DbService", onFailure: "fail", components: [
			{name: "servers", dbKind: "com.palm.imserver:1", method: "find", subscribe: true, onSuccess: "gotServers", onWatch: "doWatch"}
		]},
		{name: "mockServers", kind: "ServersMockDb", dbKind: "servers/com.palm.imserver:1", method: "find", onSuccess: "gotServers", onFailure: "fail", onWatch: "doWatch"}
	],
	initComponents: function() {
		this.inherited(arguments);
		if (!window.PalmSystem) {
			this.$.servers = this.$.mockServers;
		}
	},
	finish: function() {
		// don't destroy automatically, so we can keep the subscribe watch alive
	},
	call: function() {
		this.$.servers.cancel();
		this.$.servers.call(this.params);
	},
	fail: function(inSender, inResponse) {
		enyo.error("ServerRequest DbService fail: ", inResponse);
		this.receive({returnValue: false, results: []});
	},
	gotServers: function(inSender, inResponse) {
		this.receive(inResponse);
	}
});

// Live-subscribed feed of the unread counts carried on channel chatthreads. Channel/server
// chatthreads denormalize channelId + serverId (see ChannelList's create-thread-on-tap and the
// chatthreader), so a single subscribe over the visible chatthreads - the SAME flags.visible index
// ThreadList already uses - lets the Servers tab tally unread per channel and per server without any
// new db index. ServerList aggregates by serverId; ChannelList keys by channelId (falling back to the
// imchannel.chatThreadId link). Mirrors ServerService/ChannelService structure.
enyo.kind({
	name: "UnreadService",
	kind: enyo.Service,
	requestKind: "UnreadRequest",
	events: {
		onWatch: ""
	}
});

enyo.kind({
	name: "UnreadRequest",
	kind: enyo.Request,
	events: {
		onWatch: "doWatch"
	},
	components: [
		{kind: "DbService", onFailure: "fail", components: [
			{name: "threads", dbKind: "com.palm.chatthread:1", method: "find", subscribe: true, onSuccess: "gotThreads", onWatch: "doWatch"}
		]},
		{name: "mockThreads", kind: "ServersMockDb", dbKind: "chatthreads/com.palm.chatthread:1", method: "find", onSuccess: "gotThreads", onFailure: "fail", onWatch: "doWatch"}
	],
	initComponents: function() {
		this.inherited(arguments);
		if (!window.PalmSystem) {
			this.$.threads = this.$.mockThreads;
		}
	},
	finish: function() {
		// keep the subscribe watch alive
	},
	call: function() {
		this.$.threads.cancel();
		this.$.threads.call(this.params);
	},
	fail: function(inSender, inResponse) {
		enyo.error("UnreadRequest DbService fail: ", inResponse);
		this.receive({returnValue: false, results: []});
	},
	gotThreads: function(inSender, inResponse) {
		this.receive(inResponse);
	}
});

enyo.kind({
	name: "ChannelService",
	kind: enyo.Service,
	requestKind: "ChannelRequest",
	events: {
		onWatch: ""
	}
});

enyo.kind({
	name: "ChannelRequest",
	kind: enyo.Request,
	events: {
		onWatch: "doWatch"
	},
	components: [
		{kind: "DbService", onFailure: "fail", components: [
			{name: "channels", dbKind: "com.palm.imchannel:1", method: "find", subscribe: true, onSuccess: "gotChannels", onWatch: "doWatch"}
		]},
		{name: "mockChannels", kind: "ServersMockDb", dbKind: "channels/com.palm.imchannel:1", method: "find", onSuccess: "gotChannels", onFailure: "fail", onWatch: "doWatch"}
	],
	initComponents: function() {
		this.inherited(arguments);
		if (!window.PalmSystem) {
			this.$.channels = this.$.mockChannels;
		}
	},
	finish: function() {
		// don't destroy automatically, so we can keep the subscribe watch alive
	},
	call: function() {
		this.$.channels.cancel();
		this.$.channels.call(this.params);
	},
	fail: function(inSender, inResponse) {
		enyo.error("ChannelRequest DbService fail: ", inResponse);
		this.receive({returnValue: false, results: []});
	},
	gotChannels: function(inSender, inResponse) {
		this.receive(inResponse);
	}
});
