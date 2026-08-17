// Dashboard notification for OUTGOING messages that couldn't be sent. Distinct from the inbox
// DashboardManager: it watches the outbox for messages stuck in an error state (status "failed" or
// "permanent-fail" with an errorCategory) and posts a "tap to resend" notification. Tapping a layer
// puts the message back to "pending" so the transport re-sends it (identical to the in-thread
// "Send again"); the watch then drops it from the failed set and the layer clears automatically.
enyo.kind({
	name: "FailedMessageDashboardManager",
	kind: enyo.Component,
	components: [
		{kind: "DbService", onFailure: "dbFail", components: [
			{dbKind: "com.palm.immessage.libpurple:1", components: [
				// Two watches because db8 has no OR: outgoing messages stuck at "failed" and at
				// "permanent-fail". Both hit the outgoingMsg index (folder, status, localTimestamp).
				{name: "failedWatch",   method: "find", onSuccess: "gotFailedList",   subscribe: true, resubscribe: true, reCallWatches: true},
				{name: "permFailWatch", method: "find", onSuccess: "gotPermFailList", subscribe: true, resubscribe: true, reCallWatches: true},
				{name: "resendMerge",   method: "merge"}
			]},
			{dbKind: "com.palm.chatthread:1", components: [
				{name: "threadGet", method: "get", onSuccess: "gotThreads"}
			]}
		]}
	],
	create: function() {
		this.inherited(arguments);
		this.failedByStatus = { "failed": [], "permanent-fail": [] };
		this.threadNames = {};   // chatthread _id -> displayName cache
		this.startWatch();
	},
	startWatch: function() {
		this.$.failedWatch.call({ query: {
			where: [{prop: "folder", op: "=", val: "outbox"}, {prop: "status", op: "=", val: "failed"}],
			orderBy: "localTimestamp", desc: true, limit: 50
		}});
		this.$.permFailWatch.call({ query: {
			where: [{prop: "folder", op: "=", val: "outbox"}, {prop: "status", op: "=", val: "permanent-fail"}],
			orderBy: "localTimestamp", desc: true, limit: 50
		}});
	},
	gotFailedList: function(inSender, inResponse) {
		this.failedByStatus["failed"] = (inResponse && inResponse.results) || [];
		this.reconcile();
	},
	gotPermFailList: function(inSender, inResponse) {
		this.failedByStatus["permanent-fail"] = (inResponse && inResponse.results) || [];
		this.reconcile();
	},
	// Combined, deduped set of genuinely-errored outgoing messages (an errorCategory means the send
	// actually failed, not just an in-flight retry).
	currentFailed: function() {
		var all = this.failedByStatus["failed"].concat(this.failedByStatus["permanent-fail"]);
		var seen = {}, out = [];
		for (var i = 0; i < all.length; i++) {
			var m = all[i];
			// Skip: dupes, non-errored (in-flight), and any the user already swiped away
			// (failNotifyDismissed) so a dismissed notification doesn't resurface on UI restart.
			if (!m || !m._id || seen[m._id] || !m.errorCategory || m.failNotifyDismissed) {
				continue;
			}
			seen[m._id] = true;
			out.push(m);
		}
		return out;
	},
	// Persist the user's dismissal on the message so it stays gone across UI/app restarts (the message
	// is still status=failed, so without this the watch would re-show it). Cleared again on resend.
	markDismissed: function(messages) {
		var objs = [];
		for (var i = 0; i < messages.length; i++) {
			var m = messages[i];
			if (m && m._id) {
				objs.push({ _id: m._id, failNotifyDismissed: true });
			}
		}
		if (objs.length > 0) {
			this.$.resendMerge.call({ objects: objs });
		}
	},
	reconcile: function() {
		var failed = this.currentFailed();
		// Resolve any not-yet-cached conversation display names, then render.
		var need = [];
		for (var i = 0; i < failed.length; i++) {
			var tid = failed[i].conversations && failed[i].conversations[0];
			if (tid && this.threadNames[tid] === undefined) {
				need.push(tid);
			}
		}
		if (need.length > 0) {
			this._pendingFailed = failed;
			this.$.threadGet.call({ ids: need });
		} else {
			this.render(failed);
		}
	},
	gotThreads: function(inSender, inResponse) {
		var results = (inResponse && inResponse.results) || [];
		for (var i = 0; i < results.length; i++) {
			this.threadNames[results[i]._id] = results[i].displayName || "";
		}
		this.render(this._pendingFailed || this.currentFailed());
		this._pendingFailed = null;
	},
	nameFor: function(message) {
		var tid = message.conversations && message.conversations[0];
		if (tid && this.threadNames[tid]) {
			return this.threadNames[tid];
		}
		if (message.to && message.to[0]) {
			return message.to[0].name || message.to[0].addr || "";
		}
		return "";
	},
	render: function(failed) {
		// Remember what's currently shown so a whole-dashboard close can persist the dismissal.
		this.shownFailed = failed || [];
		if (!failed || failed.length === 0) {
			if (this.dashboard) {
				this.dashboard.setLayers([]);
				delete this.dashboard;
			}
			return;
		}
		var layers = [];
		for (var i = 0; i < failed.length; i++) {
			layers.push(this.makeLayer(failed[i]));
		}
		var db = this.dashboard;
		if (!db) {
			db = this.createComponent({
				name: "messaging-failed-dashboard", kind: "enyo.Dashboard",
				smallIcon: "images/notification-small.png",
				onIconTap: "tapResend", onMessageTap: "tapResend",
				onLayerSwipe: "layerDismissed", onUserClose: "dashboardClose"
			});
			this.dashboard = db;
		}
		db.setLayers(layers);
	},
	makeLayer: function(message) {
		var layer = { _message: message, _messageCount: 1 };
		// Clean layout like the inbox / email notification: icon + recipient (title) + message (text).
		// The failure/resend affordance is the distinct warning icon; tapping the layer resends.
		var name = enyo.messaging.message.stripEmojiForPlainText(this.nameFor(message));
		layer._from = layer.title = name || $L("Message not sent");
		// Preview the body the same way the inbox notification does (strip html/emoji, summarize media).
		var preview = enyo.messaging.message.stripEmojiForPlainText(enyo.messaging.message.summarizeMedia(
			enyo.messaging.message.unescapeText(enyo.messaging.message.removeHtml(message.messageText || ""))))
			.replace(/\r|\n|\\r|\\n/g, " ");
		if (typeof preview === "string") { preview = preview.replace(/^\s+|\s+$/g, ""); }
		// Attachment-only message (e.g. a voice note) has no body text -- label it by its media type.
		if (!preview && message.filePath) {
			preview = enyo.messaging.message.summarizeMedia(message.filePath);
			if (!preview || preview.indexOf("/") !== -1) { preview = $L("Attachment"); }
		}
		layer.text = preview || $L("Attachment");
		layer.icon = "images/notification-large-failed.png";
		return layer;
	},
	tapResend: function(inSender, layer, event) {
		var m = layer && layer._message;
		if (m && m._id) {
			// Same as the in-thread "Send again": back to pending so the transport re-sends. Clear the
			// dismissed flag so a fresh failure re-notifies. The watch then drops it from the failed set
			// and this layer clears on the next reconcile.
			this.$.resendMerge.call({ objects: [{ _id: m._id, status: "pending", errorCategory: null, retryCount: 0, failNotifyDismissed: false }] });
		}
	},
	// A single layer was swiped away -> persist its dismissal so it doesn't come back on restart.
	layerDismissed: function(inSender, layer, event) {
		if (layer && layer._message) {
			this.markDismissed([layer._message]);
		}
	},
	// The whole notification was swiped/closed -> persist dismissal for every message it showed, so
	// none of them (including ones that can't be resent) resurface on the next UI restart.
	dashboardClose: function(inSender, event) {
		if (this.shownFailed && this.shownFailed.length > 0) {
			this.markDismissed(this.shownFailed);
		}
		this.shownFailed = [];
		delete this.dashboard;
	},
	dbFail: function(inSender, error) {
		enyo.warn("FailedMessageDashboardManager: db watch failed: ", error);
	}
});
