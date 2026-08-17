/*globals enyo */

// The channel (room) list for one server, shown after drilling into a server row. Going back up is
// handled by the app's bottom Toolbar (see ServerList/Messaging), so this view has no back button of
// its own - just a search box and the channel list. Selecting a channel resolves its
// imchannel.chatThreadId to the chatthread record and emits it upward via onSelectThread, reusing
// the exact thread-selection contract ThreadList uses so the right-hand ChatView opens the channel
// conversation with no new plumbing.
enyo.kind({
	name: "ChannelList",
	kind: "VFlexBox",
	events: {
		onSelectThread: ""
	},
	published: {
		serverId: ""
	},
	components: [
		{kind: "ChannelService", onSuccess: "gotChannels", onWatch: "channelsWatch"},
		{kind: "UnreadService", onSuccess: "gotUnread", onWatch: "unreadWatch"},
		{name: "search", kind: "SearchInput", hint: $L("Search channels"), className: "enyo-middle", onchange: "filterList", onCancel: "filterList", changeOnInput: true, autoCapitalize: "lowercase"},
		{className: "header-shadow header-app-shadow"},
		{name: "emptyMessage", content: "", className: "messageTexts", showing: false},
		{flex: 1, name: "list", kind: "DbList", desc: false, onQuery: "listQuery", className: "messaging-listsDivider", onSetupRow: "listSetupRow", components: [
			{name: "channelItem", kind: "ChannelItem", tapHighlight: true, onclick: "selectChannel"}
		]},
		{kind: "DbService", dbKind: "com.palm.chatthread:1", components: [
			{name: "threadGetter", method: "get", onSuccess: "threadFetched", onFailure: "threadFetchFailed"},
			{name: "threadFinder", method: "find", onSuccess: "threadSearchResult", onFailure: "threadFetchFailed"},
			{name: "threadPutter", method: "put", onSuccess: "threadCreated", onFailure: "threadFetchFailed"}
		]},
		// create-thread-on-tap: link a freshly-created channel thread back onto its imchannel.
		{name: "channelMerger", kind: "DbService", dbKind: "com.palm.db", method: "merge"},
		// join-on-open: ask the transport to join the channel so the prpl fetches its history.
		{name: "channelOpener", kind: "PalmService", service: "palm://com.palm.imlibpurple/", method: "openChannel"},
		{name: "mockThreadGetter", kind: "ServersMockDb", dbKind: "serverchannels_threads/com.palm.chatthread:1", method: "get", onSuccess: "threadFetched", onFailure: "threadFetchFailed"},
		{name: "mockThreadFinder", kind: "ServersMockDb", dbKind: "serverchannels_threads/com.palm.chatthread:1", method: "find", onSuccess: "threadSearchResult", onFailure: "threadFetchFailed"}
	],
	initComponents: function() {
		this.inherited(arguments);
		if (!window.PalmSystem) {
			this.$.threadGetter = this.$.mockThreadGetter;
			this.$.threadFinder = this.$.mockThreadFinder;
		}
	},
	create: function() {
		this.inherited(arguments);
		this.channelUnread = {};   // imchannel._id -> unreadCount (chatthread.channelId link)
		this.threadUnread = {};    // chatthread._id  -> unreadCount (imchannel.chatThreadId link)
		this.callUnread();
	},
	// Subscribe to visible chatthreads; the subscription drives the per-channel unread badges.
	callUnread: function() {
		// Release the prior request + its chatthread subscription before re-arming, else each
		// unreadWatch fire (every visible-chatthread change) leaks a db8 watch. See ThreadList.
		this.$.unreadService.cancel();
		this.$.unreadService.call({query: {
			where: [{prop: "flags.visible", op: "=", val: true}],
			select: ["_id", "channelId", "unreadCount"]
		}});
	},
	unreadWatch: function() {
		this.callUnread();
	},
	// Key unread both ways so a channel resolves whether its chatthread carries channelId (tap-created)
	// or we only have the imchannel.chatThreadId link. Repaint the visible rows.
	gotUnread: function(inSender, inResponse) {
		var byChannel = {}, byThread = {};
		var rows = (inResponse && inResponse.results) || [];
		for (var i = 0, t; t = rows[i]; i++) {
			var n = Number(t.unreadCount) || 0;
			if (t.channelId) { byChannel[t.channelId] = n; }
			if (t._id) { byThread[t._id] = n; }
		}
		this.channelUnread = byChannel;
		this.threadUnread = byThread;
		this.$.list.refresh();
	},
	// Point this list at a server: stash its id, retarget the search hint, and re-run the query.
	setServer: function(inServer) {
		this.serverId = inServer && inServer._id;
		this.serverName = (inServer && (inServer.displayName || inServer.name)) || $L("channels");
		this.$.search.setHint($L("Search ") + this.serverName);
		this.filterString = "";
		this.$.search.setValue("");
		this.$.list.reset();
	},
	channelsWatch: function() {
		this.$.list.reset();
	},
	filterList: function() {
		this.filterString = this.$.search.getValue();
		this.$.list.punt();
	},
	listQuery: function(inSender, inQuery) {
		if (!this.serverId) {
			// No server drilled into yet - don't hit the db; the list stays empty until setServer().
			return undefined;
		}
		inQuery.where = [{prop: "serverId", op: "=", val: this.serverId}];
		inQuery.orderBy = "position";
		return this.$.channelService.call({query: inQuery});
	},
	gotChannels: function(inSender, inResponse, inRequest) {
		inResponse = this.applyFilter(inResponse, ["name", "displayName", "remoteId"]);
		this.$.list.queryResponse(inResponse, inRequest);
		if ((inRequest.index === 0) && (!inResponse.results || inResponse.results.length === 0)) {
			this.$.emptyMessage.setContent(this.filterString ? $L("No channels match your search.") : $L("No channels yet."));
			this.$.emptyMessage.show();
		} else {
			this.$.emptyMessage.hide();
		}
	},
	applyFilter: function(inResponse, fields) {
		if (!this.filterString || !inResponse || !inResponse.results) {
			return inResponse;
		}
		var f = this.filterString.toLowerCase();
		var out = inResponse.results.filter(function(r) {
			return fields.some(function(k) { return r[k] && String(r[k]).toLowerCase().indexOf(f) !== -1; });
		});
		return {returnValue: inResponse.returnValue, results: out};
	},
	listSetupRow: function(inSender, inChannel, inIndex) {
		this.$.channelItem.setChannel(inChannel);
		var selected = (this.selectedRecord && this.selectedRecord._id === inChannel._id) ||
			(this.selectedChatThread && inChannel.chatThreadId && this.selectedChatThread._id === inChannel.chatThreadId);
		// The open channel is being read, so suppress its badge (mirrors ThreadItem's selected-row rule).
		var unread = selected ? 0 :
			((this.channelUnread && this.channelUnread[inChannel._id]) ||
			 (this.threadUnread && inChannel.chatThreadId && this.threadUnread[inChannel.chatThreadId]) || 0);
		this.$.channelItem.setUnread(unread);
		this.$.channelItem.addRemoveClass("enyo-item-selected", selected ? true : false);
	},
	selectChannel: function(inSender, inEvent) {
		var record = this.$.list.fetch(inEvent.rowIndex);
		if (!record) {
			return;
		}
		this.selectedRecord = record;
		this.$.list.refresh();
		// join-on-open: fetch this channel's history via the transport (idempotent if already joined).
		if (record.serviceName && record.remoteId) {
			this.$.channelOpener.call({serviceName: record.serviceName, channel: record.remoteId});
		}
		if (record.chatThreadId) {
			// Resolve the channel's chatthread (created by the chatthreader on the channel's first
			// message) and hand it up exactly like a thread selection.
			this.$.threadGetter.call({ids: [record.chatThreadId]});
		} else {
			// No chatThreadId link yet. DO NOT create blindly - a thread for this conversation may
			// already exist (created by the message-driven chatthreader, or a prior tap after the
			// imchannel's link was lost to a re-sync). Blind create-on-tap was the app-side source of
			// the duplicate chatthreads. Search by the stable normalizedAddress first; reuse+relink if
			// found, otherwise create. See threadSearchResult / createChannelThread.
			this.pendingChannel = record;
			this.$.threadFinder.call({query: {where: [{prop: "normalizedAddress", op: "=",
				val: enyo.messaging.utils.normalizeAddress(record.remoteId, record.serviceName)}]}});
		}
	},
	// Result of the pre-create lookup. If a thread for this conversation already exists (same
	// normalizedAddress + service), link it onto the imchannel and open it - no new thread. Only
	// create when none exists. This makes opening an unlinked channel idempotent.
	threadSearchResult: function(inSender, inResponse) {
		var results = (inResponse && inResponse.results) || [];
		var svc = this.pendingChannel && this.pendingChannel.serviceName;
		var match = null;
		for (var i = 0; i < results.length; i++) {
			if (!svc || results[i].replyService === svc) { match = results[i]; break; }
		}
		if (match && this.pendingChannel) {
			// Relink the imchannel to the existing thread so future taps/messages reuse it too.
			this.$.channelMerger.call({objects: [{_kind: "com.palm.imchannel:1", _id: this.pendingChannel._id, chatThreadId: match._id}]});
			this.pendingChannel = null;
			this.doSelectThread(match);
		} else {
			this.createChannelThread();
		}
	},
	// Create the channel's chatthread (same shape the chatthreader uses on a channel's first message:
	// replyAddress = the channel key, channelId/serverId denormalized), then link + open it via
	// threadCreated. Only reached when no existing thread matched.
	createChannelThread: function() {
		var record = this.pendingChannel;
		if (!record) { return; }
		var thread = {
			_kind: "com.palm.chatthread:1",
			timestamp: (new Date()).getTime(),
			summary: "",
			flags: { visible: true, outgoing: false },
			displayName: record.displayName || record.name || record.remoteId,
			replyAddress: record.remoteId,
			normalizedAddress: enyo.messaging.utils.normalizeAddress(record.remoteId, record.serviceName),
			replyService: record.serviceName,
			channelId: record._id,
			serverId: record.serverId
		};
		this.$.threadPutter.call({objects: [thread]});
	},
	threadCreated: function(inSender, inResponse) {
		var newId = inResponse && inResponse.results && inResponse.results[0] && inResponse.results[0].id;
		if (!newId || !this.pendingChannel) {
			return;
		}
		// link the new thread onto the imchannel so future messages + re-taps reuse it
		this.$.channelMerger.call({objects: [{_kind: "com.palm.imchannel:1", _id: this.pendingChannel._id, chatThreadId: newId}]});
		this.pendingChannel = null;
		// fetch the canonical thread record and open it (reuses threadFetched -> doSelectThread)
		this.$.threadGetter.call({ids: [newId]});
	},
	threadFetched: function(inSender, inResponse) {
		if (inResponse.results && inResponse.results.length > 0) {
			this.doSelectThread(inResponse.results[0]);
		}
	},
	threadFetchFailed: function(inSender, inResponse) {
		enyo.error("ChannelList: failed to fetch channel chatthread: ", inResponse);
	},
	updateList: function() {
		this.$.list.update();
	},
	// Re-render visible rows without re-querying (connector logos resolve once accounts are loaded).
	refreshRows: function() {
		this.$.list.refresh();
	},
	resetList: function() {
		this.$.list.reset();
	},
	setSelection: function(inChatThread) {
		// Highlight the channel whose chatthread is now the active conversation.
		this.selectedChatThread = inChatThread;
		this.$.list.refresh();
	}
});
