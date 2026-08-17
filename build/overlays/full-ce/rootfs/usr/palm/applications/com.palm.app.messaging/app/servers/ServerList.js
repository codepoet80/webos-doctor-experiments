/*globals enyo */

// Servers/Rooms (Milestone 2) tab host. Lives in the left panel's TabGroup+Pane (see
// app/Messaging.js). Presents a two-level drill-down inside its own inner Pane - a server
// (guild/network) list, and, once a server is tapped, that server's channel list - mirroring how
// ChatView (also a Pane) swaps sub-views. Selecting a channel bubbles the channel's chatthread up
// via onSelectThread (the same contract ThreadList uses) so MessagingApp opens it in the right-hand
// ChatView with no extra wiring. Going back up a level is driven by the app's bottom Toolbar: this
// kind fires onServerDrill(bool) and exposes showServers()/isDrilledIn() for Messaging to hook a
// footer "Servers" button (there is no built-in breadcrumb in this Enyo build).
enyo.kind({
	name: "ServerList",
	kind: "VFlexBox",
	events: {
		onSelectThread: "",
		onServerDrill: ""
	},
	components: [
		{kind: "ServerService", onSuccess: "gotServers", onWatch: "serversWatch"},
		{kind: "UnreadService", onSuccess: "gotUnread", onWatch: "unreadWatch"},
		{kind: "Pane", flex: 1, name: "drill", transitionKind: "enyo.transitions.LeftRightFlyin", components: [
			{name: "serversView", kind: "VFlexBox", flex: 1, components: [
				{name: "search", kind: "SearchInput", hint: $L("Search servers"), className: "enyo-middle", onchange: "filterList", onCancel: "filterList", changeOnInput: true, autoCapitalize: "lowercase"},
				{className: "header-shadow header-app-shadow"},
				{name: "emptyMessage", content: "", className: "messageTexts", showing: false},
				{flex: 1, name: "list", kind: "DbList", desc: false, onQuery: "listQuery", className: "messaging-listsDivider", onSetupRow: "listSetupRow", components: [
					{name: "serverItem", kind: "ServerItem", tapHighlight: true, onclick: "selectServer"}
				]}
			]},
			{name: "channelsView", kind: "ChannelList", onSelectThread: "relaySelectThread"}
		]}
	],
	create: function() {
		this.inherited(arguments);
		this.drilledIn = false;
		this.serverUnread = {};   // serverId -> summed unread
		this.serverLatest = {};   // serverId -> {ts, outgoing} of its most recent thread
		this.accountAvail = {};   // serviceName -> imloginstate availability (0..4)
		// Start on the server list; the channel view is shown only after a drill-down.
		this.$.drill.selectViewByIndex(0);
		this.callUnread();
	},
	// Account online states (from Messaging.loginStatesChange). Keep the "best" (lowest = most
	// available) availability per service type, then repaint so each server shows its dot + logo.
	setLoginStates: function(inStates) {
		var map = {};
		var arr = inStates || [];
		for (var i = 0, s; s = arr[i]; i++) {
			if (!s.serviceName) { continue; }
			var a = Number(s.availability);
			if (isNaN(a)) { a = enyo.messaging.im.availability.OFFLINE; }
			if (map[s.serviceName] === undefined || a < map[s.serviceName]) {
				map[s.serviceName] = a;
			}
		}
		this.accountAvail = map;
		this.refreshRows();
	},
	serversWatch: function() {
		this.$.list.reset();
	},
	// Subscribe to visible chatthreads and re-emit on change (the subscription drives serverUnread).
	callUnread: function() {
		// Release the prior request + its chatthread subscription before re-arming, else each
		// unreadWatch fire (every visible-chatthread change) leaks a db8 watch. See ThreadList.
		this.$.unreadService.cancel();
		this.$.unreadService.call({query: {
			where: [{prop: "flags.visible", op: "=", val: true}],
			select: ["_id", "serverId", "channelId", "unreadCount", "flags", "timestamp"]
		}});
	},
	unreadWatch: function() {
		this.callUnread();
	},
	// Tally unread by serverId AND track each server's most-recent thread (for the sent/received
	// arrow), then repaint the visible rows.
	gotUnread: function(inSender, inResponse) {
		var map = {}, latest = {};
		var rows = (inResponse && inResponse.results) || [];
		for (var i = 0, t; t = rows[i]; i++) {
			if (!t.serverId) { continue; }
			if (Number(t.unreadCount) > 0) {
				map[t.serverId] = (map[t.serverId] || 0) + Number(t.unreadCount);
			}
			var ts = Number(t.timestamp) || 0;
			if (!latest[t.serverId] || ts >= latest[t.serverId].ts) {
				latest[t.serverId] = {ts: ts, outgoing: !!(t.flags && t.flags.outgoing)};
			}
		}
		this.serverUnread = map;
		this.serverLatest = latest;
		this.$.list.refresh();
	},
	filterList: function() {
		this.filterString = this.$.search.getValue();
		this.$.list.punt();
	},
	listQuery: function(inSender, inQuery) {
		// No where-clause: show every server, ordered by account type (byservice index). Search is
		// applied client-side in gotServers so no extra db index is needed for these small lists.
		inQuery.orderBy = "serviceName";
		return this.$.serverService.call({query: inQuery});
	},
	gotServers: function(inSender, inResponse, inRequest) {
		inResponse = this.applyFilter(inResponse, ["displayName", "name"]);
		this.$.list.queryResponse(inResponse, inRequest);
		if ((inRequest.index === 0) && (!inResponse.results || inResponse.results.length === 0)) {
			this.$.emptyMessage.setContent(this.filterString ? $L("No servers match your search.") :
				$L("No servers yet. Add a Discord, IRC, Teams, Slack or Matrix account to see its servers here."));
			this.$.emptyMessage.show();
		} else {
			this.$.emptyMessage.hide();
		}
	},
	// Filter the current page in memory (server/channel lists are small - a handful of rows - so a
	// single page holds them all and search needs no tokenized db index).
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
	listSetupRow: function(inSender, inServer, inIndex) {
		this.$.serverItem.setServer(inServer);
		this.$.serverItem.setUnread((this.serverUnread && this.serverUnread[inServer._id]) || 0);
		var avail = this.accountAvail && this.accountAvail[inServer.serviceName];
		this.$.serverItem.setStatus(avail === undefined ? null : avail);
		var latest = this.serverLatest && this.serverLatest[inServer._id];
		this.$.serverItem.setOutgoing(latest ? latest.outgoing : false);
		this.$.serverItem.addRemoveClass("enyo-item-selected", this.selectedServer && this.selectedServer._id === inServer._id ? true : false);
	},
	selectServer: function(inSender, inEvent) {
		var record = this.$.list.fetch(inEvent.rowIndex);
		if (!record) {
			return;
		}
		this.selectedServer = record;
		this.$.list.refresh();
		this.$.channelsView.setServer(record);
		this.$.drill.selectViewByIndex(1, true);
		this.setDrilled(true);
	},
	showServers: function() {
		this.$.drill.selectViewByIndex(0, true);
		this.setDrilled(false);
	},
	setDrilled: function(inDrilled) {
		this.drilledIn = inDrilled;
		this.doServerDrill(inDrilled);
	},
	isDrilledIn: function() {
		return this.drilledIn;
	},
	// Re-emit the channel's chatthread selection upward (ThreadList's onSelectThread contract).
	relaySelectThread: function(inSender, inThread) {
		this.doSelectThread(inThread);
	},
	// Re-render the visible rows without re-querying (used when the account-types hash fills in after
	// load, so server/channel connector logos resolve). Mirrored into the channel view.
	refreshRows: function() {
		this.$.list.refresh();
		this.$.channelsView.refreshRows();
	},
	// ---- methods Messaging.js drives on every list, mirrored across both drill levels ----
	updateList: function() {
		this.$.list.update();
		this.$.channelsView.updateList();
	},
	resetList: function() {
		this.$.list.reset();
		this.$.channelsView.resetList();
	},
	setSelection: function(inChatThread) {
		this.$.channelsView.setSelection(inChatThread);
	},
	windowHiddenHandler: function() {
		// Return to the server list so re-opening the app doesn't strand the user mid-drill.
		this.$.drill.selectViewByIndex(0);
		if (this.drilledIn) {
			this.setDrilled(false);
		}
		this.filterString = "";
		this.$.search.setValue("");
		this.$.list.punt();
	}
});
