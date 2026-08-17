enyo.kind({
	name: "DashboardManager",
	kind: enyo.Component,
	published: {
		appDeactivated: true,
		filter: undefined
	},
	components: [
		{kind: "DbService", onFailure: "fail", components: [
			{dbKind: "com.palm.message:1", components: [
				{name: "newMessagesFinder", method: "find", onSuccess: "gotMessages",subscribe: true, resubscribe: true, reCallWatches: true}
			]},
			{dbKind: "com.palm.chatthread:1", components: [
				{name: "threads", method: "get", onSuccess: "gotThreads"}
			]}
		]},
		//{name: "displayOn", kind:"PalmService", service:"palm://com.palm.display/control/", onSuccess: "", onFailure: ""},
		{name: "displayState", kind: "PalmService", service: "palm://com.palm.display/control/", method: "status", onSuccess: "displayUpdate", subscribe: true}
	],
	create: function() {
		this.inherited(arguments);
		this.init();
	},
	init: function() {
		this.cutoffRevSet = 0;  // 'readRevSet' is a more reliable reference to indicate the order that the message is received on the phone.  We can't use 'localTimestamp' since multiple messages can have the same local timestamp.
		this.lastRev = 0;
		this.filter = {filterAll: false};
		this.dashboardUtil = new MessageDashboardUtil();
		this.bannerThrottler = new BannerThrottler(this);
		
		// listening to display on/off changes
		this.$.displayState.call();
		
		// try to query the largest readRevSet for all inbox messages
		this.queryMessages();
		
		// register for prefs changes
		enyo.application.prefsHandler.register(this, this.prefsUpdated.bind(this));
	},
	queryMessages: function() {
		enyo.log("*********** In ", this.name, "DashboardManager, querying new messages in MasessageDashboardManager");
		this.$.newMessagesFinder.cancel();
		this.$.newMessagesFinder.call({
			query: {
				orderBy: "readRevSet",
				desc: true,
				limit: !this.isInited ? 1 : 500
			}
		});
	},
	gotMessages: function(inSender, inResponse) {
		// TODO: need to handle the case that the result set has more records to follow 
		//enyo.log("*********************** In ", this.name, "DashboardManager, gotMessages: ", inResponse);
		if (inResponse && inResponse.results.length > 0) {
			this.processChanges(inResponse.results);
		}
		if (!this.isInited) {
			this.isInited = true;
		}
	},
	updateWatch: function() {
		enyo.log("In ", this.name, "DashboardManager,  update notification watch with revision: ", this.lastRev);
//		var where = parseQuery("where folder='inbox' and _rev>" + this.lastRev).where;
		var where = [{
						prop: "folder",
						op: "=",
						val: "inbox"
					}, {
						prop: "_rev",
						op: ">",
						val: this.lastRev
					}];
		this.$.newMessagesFinder.cancel();
		this.$.newMessagesFinder.call({
			query: {
				where: where,
				orderBy: "_rev"
			}
		});
		
		// reset this flag
		this.shouldUpdateWatch = false;
	},
	processPendingMessages: function() {
		var tids = [];
		for (var i = 0; i < this.pendingMessages.length; i++) {
			var msg = this.pendingMessages[i];
			tids.push(msg.conversations[0]);
		}
		enyo.log("In ", this.name, "DashboardManager, looking up threads for new messages: ", tids);
		this.findThreads(tids);
	},
	findThreads: function(tids) {
		this.$.threads.call({
			ids: tids
		});
	},
	gotThreads: function(inSender, inResponse) {
		var results = inResponse.results;
		var peopleThreads = {};
		
		for (var i = 0; i < results.length; i++) {
			var thread = results[i];
			peopleThreads[thread._id] = thread.displayName;
		}
		
		//enyo.log("In ", this.name, "DashboardManager, got threads ", results);
		for (var j = 0; j < this.pendingMessages.length; j++) {
			var msgThread = this.pendingMessages[j].conversations[0];
			
			this.pendingMessages[j].displayName = peopleThreads[msgThread];
		}
		
		this.notify();
	},
	notify: function() {
		// add dashboard layers into banner throttle so that throttle can batch the layers to show only one banner per specified interval
		this.bannerThrottler.addNewMessages(this.pendingMessages);
		
		var layers = this.getPendingLayers(this.pendingMessages);
		// put new message layers into dashboard
		this.putUpDashboard(layers);
		
		// clean up pendingMessages cache
		delete this.pendingMessages;
		
		// update db watch
		if (this.shouldUpdateWatch) {
			this.updateWatch();
		}
	},
	putUpDashboard: function(layers) {
		enyo.log("In ", this.name, "DashboardManager, updating dashboard with new layers: ", layers);		
		this.updateDashboard(layers);
	},
	updateDashboard: function(layers) {
		var db = this.dashboard;
		
		if (!db && layers.length === 0) {
			return;
		}
		
		if (!db) {
			enyo.log("$$$$$$$$$$$$$$ In ", this.name, "DashboardManager, creating dashboard for ", this.name);
			db = this.createComponent({name: "messaging-" + this.name + "-dashboard", kind:"enyo.Dashboard", smallIcon:"images/notification-small.png", onIconTap:"dashboardIconTap", onMessageTap:"dashboardMessageTap", onUserClose: "dashboardClose"});
			this.dashboard = db;
		}
		this.dashboardUtil.addLayers(db, layers);
	},
	playSoundNotification: function() {
		var options = this.getSoundOptions(this.prefs);
		if (options && window.PalmSystem) {
			window.PalmSystem.playSoundNotification(options.soundClass, options.soundPath);
		}
	},
	dashboardIconTap: function(inSender, layer, event) {
		//enyo.log("In ", this.name, "DashboardManager, icon is tapped");
		var layers = this.dashboard.getLayers();
		enyo.windows.activate("index.html", "messaging", (layers.length > 1 ? {} : {message:layers[0]._message}));
		
		// clear & close dashboard
		this.dashboard.setLayers([]);
		this.dashboardClose(this);
	},
	dashboardMessageTap: function(inSender, layer, event) {
		//enyo.log("In ", this.name, "DashboardManager, message text is tapped");
		enyo.windows.activate("index.html", "messaging", {message:layer._message});
	},
	dashboardClose: function(inSender, event) {
		//enyo.log("In ", this.name, "Dashboard is closed.");
		delete this.dashboard;
	},
	filterChanged: function() {
		this.clearDashboard(this.filter);
		this.bannerThrottler.clearBannerMessages(this.filter);
	},
	clearDashboard: function(filter) {
		var db = this.dashboard;
		if (db) {
			//enyo.log("In ", this.name, "DashboardManager, clearing dashboard with filter: ", filter);
			var layers = [];
			var currLayers = db.getLayers();
			if (currLayers) {
				for (var i = 0; i < currLayers.length; i++) {
					if (!this.matchFilter(filter, currLayers[i]._message.conversations)) {
						layers.push(currLayers[i]);
					}
				}
			}
			db.setLayers(layers);
		}
	},
	removeThread : function(thread) {
		//enyo.log("In ", this.name, "DashboardManager, removeThread - thread = ", thread);
		var db = this.dashboard;	
		
		function threadInCoversations (conversations) {
			var x = conversations.length;
            while (x--) {
                if (conversations[x] === thread) {
                    return true;
                }
            }
            return false;
		}
		
		if (db) {
			var layers = [];
			var currLayers = db.getLayers();
			
			if (currLayers) {
				for (var i = 0; i < currLayers.length; i++) {
					if (!threadInCoversations(currLayers[i]._message.conversations)) {
						layers.push(currLayers[i]);
					} 
				}
			}
            db.setLayers(layers);
		}
	},
	accountRemoved : function(account) {
		//enyo.log("In ", this.name, "DashboardManager, accountRemoved: ", account.username);
		var db = this.dashboard;		
		
		function keepLayer(layer) {
			if (layer._message.serviceName !== account.serviceName) {
				return true;
			}
			
			if (layer._message.username === account.username) {
				return false;
			}
			
			/**
			 * If target user name is not an email address, then we need to use the 
			 * user name prefix of the email address from the IM account and compare
			 * it to the target user name.  So 'bob.dole' should match 'bob.dole@company.com'
			 * but not 'bob@company.com'.     
			 */
			var accountUsername = account.username.replace(/\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/, "");
			return layer._message.username !== accountUsername;
		}
		
		if (db) {
			var layers = [];
			var currLayers = db.getLayers();

			if (currLayers) {
				for (var i = 0; i < currLayers.length; i++) {
					if (keepLayer(currLayers[i])) {
						layers.push(currLayers[i]);
					}
				}
			}			
			db.setLayers(layers);
		}
	},	
	// unit tested functions
	prefsUpdated: function(latestPrefs) {
		this.prefs = latestPrefs;
		//enyo.log("---------#### In ", this.name, "Dashboard, got preferences: ", this.prefs);
		
		if (this.prefs && !this.prefs.enableNotification) {
			this.clearDashboard();
		}
	},
	appDeactivatedChanged: function() {
		//enyo.log("In ", this.name, "DashboardManager, app deactivated changed: ", this.appDeactivated);
		if (!this.appDeactivated) {
			this.clearDashboard(this.filter);
			this.bannerThrottler.clearBannerMessages(this.filter);
		}
	},
	// maintains this.displayOff, used to determine if new message dashboards should be displayed.
	displayUpdate: function (inSender, inResult) {
		if (inResult.event) {
			// Note, specifically checking Off and On so we ignore displayInactive,
			// displayActive and displayDimmed
			if (inResult.event === "displayOff") {
				this.displayOff = true;
			} else if (inResult.event === "displayOn" || inResult.event === "request") {
				this.displayOff = false;
			}
			
			//enyo.log("displayUpdate event ", inResult.event);
		}
	},
	processChanges: function(newMessages) {
		this.pendingMessages = this.getPendingNewMessages(newMessages);
		
		if (this.pendingMessages.length > 0) {
			this.processPendingMessages();
		} else if (this.shouldUpdateWatch) {
			this.updateWatch();
		}
	},
	isNewMessage: function(message) {
		var isNew = message.folder === enyo.messaging.message.FOLDERS.INBOX;
		isNew = isNew && (message.conversations && message.conversations.length > 0);
		isNew = isNew && (message.readRevSet > this.cutoffRevSet);
		isNew = isNew && (message.status === "successful" || message.status === "delayed");  // TODO: need to figure out whether we should show notification for messages with error
		isNew = isNew && !message.errorCode;
		isNew = isNew && (!message.flags || (!message.flags.read && !message.flags.visible && !message.flags.noNotification));
		isNew = isNew &&(!message.accepted || message.accepted === "pending");
		
		return isNew;
	},
	// Default notification window (minutes). During initial sync the transports back-fill history
	// with each message's ORIGINAL send time (composetime), so without this filter every synced
	// message would fire a notification.
	//   notifyMaxAgeMinutes  < 0  -> "All messages": age filter disabled, notify for everything
	//                        == 0  -> "None (only future)": notify only genuinely live messages
	//                         > 0  -> notify only messages newer than that many minutes
	NOTIFY_MAX_AGE_MINUTES: 60,
	// Grace window (ms) for the "None (only future)" setting: a genuinely live incoming message can
	// arrive with a timestamp a few seconds in the past (server/processing/clock skew), so allow a
	// small slack while still suppressing synced history.
	NOTIFY_FUTURE_GRACE_MS: 30 * 1000,
	// True when the message is old enough that it's almost certainly sync back-fill rather than a
	// live incoming message. Uses localTimestamp (device ms) / timestamp as written by the transport.
	isTooOldToNotify: function(message) {
		var raw = (this.prefs && this.prefs.notifyMaxAgeMinutes !== undefined && this.prefs.notifyMaxAgeMinutes !== null) ?
			this.prefs.notifyMaxAgeMinutes : this.NOTIFY_MAX_AGE_MINUTES;
		var maxAgeMin = parseInt(raw, 10);  // ListSelector may hand back a string; normalize
		if (isNaN(maxAgeMin)) {
			maxAgeMin = this.NOTIFY_MAX_AGE_MINUTES;
		}
		if (maxAgeMin < 0) {
			return false;  // "All messages" -> age filter disabled
		}
		// Age is measured from the message's ORIGINAL send time: `timestamp` (server time, unix
		// SECONDS). localTimestamp is the device WRITE time, which during sync back-fill is ~now - so
		// using it makes every back-filled message look fresh and defeats this filter (the "continuous
		// pings while catching up on 100s of messages" bug). Prefer send time, normalized to ms; only
		// fall back to the write time when there's no send time.
		var ts = message.timestamp;
		if (ts && ts < 1e12) { ts = ts * 1000; }  // unix seconds -> ms (guard if a ms value ever appears)
		if (!ts) { ts = message.localTimestamp; }  // no send time -> device write time (already ms)
		if (!ts) {
			return false;  // no timestamp -> treat as current, notify
		}
		var maxAgeMs = (maxAgeMin === 0) ? this.NOTIFY_FUTURE_GRACE_MS : (maxAgeMin * 60 * 1000);
		return (Date.now() - ts) > maxAgeMs;
	},
	shouldNotify: function(message) {
		var should = this.prefs && this.prefs.enableNotification;
		should = should && (this.displayOff || (this.appDeactivated || !this.matchFilter(this.filter, message.conversations)));
		should = should && !this.isTooOldToNotify(message);

		return should;
	},
	getPendingNewMessages: function(newMessages) {
		var i, msg;
		var latestRev = 0;
		var latestRevSet = this.cutoffRevSet;
		var pendingMessages = [];
		
		enyo.log("In ", this.name, "DashboardManager,  cutoffRevset: ", this.cutoffRevSet);
		//enyo.log("                     current filter: ", this.filter);
		for (i = 0; i < newMessages.length; i++) {
			msg = newMessages[i];
			//enyo.log("*********** In ", this.name, "DashboardManager, message: ", msg);
			
			if (!this.isInited && msg.folder === enyo.messaging.message.FOLDERS.INBOX) {
				latestRevSet = msg.conversations && latestRevSet < msg.readRevSet ? msg.readRevSet : latestRevSet;
			} else if (this.isNewMessage(msg)) {
				if (this.shouldNotify(msg)) {
					pendingMessages.push(msg);
				}
				latestRevSet = msg.conversations && latestRevSet < msg.readRevSet ? msg.readRevSet : latestRevSet;
			}
			latestRev = latestRev < msg._rev ? msg._rev : latestRev;
		}
		
		if (latestRevSet > this.cutoffRevSet) {
			this.cutoffRevSet = latestRevSet;
		}
		
		if (latestRev > this.lastRev) {
			this.lastRev = latestRev;
			this.shouldUpdateWatch = true;
		}
		
		return pendingMessages;
	},
	getPendingLayers: function(pendingMessages) {
		var layers = [];
		
		enyo.log("*********** In ", this.name, "DashboardManager, pending changes for notification: ", this.pendingMessages);
		// notify new messages
		for (var i = 0; i < pendingMessages.length; i++) {
			var msg = pendingMessages[i];
			// get layers to push to dashboard
			layers.push(this.makeDashboardLayer(msg));
		}
		
		return layers;
	},
	makeDashboardLayer: function(message) {
		var layer = {};
		
		layer._message = message;
		layer._messageCount = 1;
		if (message.from) {
			// A banner title is native plain text (no inline images, no emoji font), so strip emoji
			// from the sender/chat name the same way getDisplayText does for the body - otherwise the
			// title shows a literal "&#128049;" entity or tofu instead of the emoji.
			layer._from = layer.title = enyo.messaging.message.stripEmojiForPlainText(this.getDisplayName(message));
		} else {
			layer.title = "";
			enyo.error("Message ", message._id, " is missing Sender information, message len= ", (message.messageText && message.messageText.length));
		}
		layer.text = this.getDisplayText(message);
		layer.icon = "images/notification-large-messaging.png";
		
		return layer;
	},
	getDisplayName: function(message) {
		//enyo.log("%%%% In ", this.name, "DashboardManager, message's display name=", message.displayName, ", message.from.name= ", message.from.name,  ", message.from.addr=", message.from.addr);
		if (enyo.messaging.person.isNotBlank(message.displayName)) {
			return message.displayName; 
		} else if (message.from && enyo.messaging.person.isNotBlank(message.from.name)) {
			return message.from.name;
		} else if (message.from && enyo.messaging.person.isNotBlank(message.from.addr)) {
			return message.from.addr;
		}
		
		enyo.warn("DashboardManager: unable to find dispaly name for message '", message._id, "', so default display name to a blank string");
		return "";
	},
	getDisplayText: function(message) {
		var text = message.messageText || ""; 
		
		if (enyo.messaging.message.isMMSMessage(message)) {
			text = enyo.messaging.message.getMMSDisplayMessage();
		} else if (message._kind === "com.palm.immessage.libpurple:1" || message._kind === "com.palm.immessage.skypem:1" || message._kind === "com.palm.iminvitation:1") {
			// These transports store the message body HTML-escaped (the conversation view renders it
			// with allowHtml, so &gt;/&lt;/&amp; come out right there). A banner/notification is plain
			// text, so strip any trusted tags THEN decode the entities - otherwise "&gt;" shows
			// literally in notifications.
			text = enyo.messaging.message.removeHtml(text);
			text = enyo.messaging.message.unescapeText(text);
		} else {
			// other transport escaped text in DB
			text = enyo.messaging.message.unescapeText(text);
		}
		// A pure-media message (Discord/Telegram/WhatsApp voice notes, photos, videos) carries the
		// media URL / local file path as its body, which would otherwise show as a raw "file://..."
		// reference in the banner/notification. Replace it with a friendly label (the emoji is stripped
		// just below for the plain-text banner, leaving e.g. "Voice message").
		text = enyo.messaging.message.summarizeMedia(text);
		// A banner is native plain text - it can't show inline emoji images and has no emoji
		// font, so decoding would only produce tofu. Strip emoji (and any leftover U+FFFD from
		// pre-fix data) entirely so notifications read cleanly instead of showing garbage.
		text = enyo.messaging.message.stripEmojiForPlainText(text);
		// remove new line characters
		text = text.replace(/\r|\n|\\r|\\n/g, " ");
		
		return text;
	},
	matchFilter: function(filter, threads) {
		if (!filter) {// || filter.filterAll) {
			return true;
		} else if (!threads) {
			return false;
		}
		
		for (var i = 0; i < threads.length; i++) {
			if (filter.thread === threads[i]) {
				return true;
			}
		}
		
		return false;
	},
	getSoundOptions: function(prefs) {
		if (prefs && prefs.notificationSound === "system") {
			return {
				soundClass: enyo.messaging.message.SOUND_CLASSES.RINGTON, 
				soundPath: enyo.messaging.utils.getAppRootPath() + enyo.messaging.message.SOUND_PATHS.RECEIVED
			};
		} else if (prefs && prefs.notificationSound === "vibrate") {
			return {
				soundClass: enyo.messaging.message.SOUND_CLASSES.VIBRATE
			};
		} else if (prefs && prefs.notificationSound === "ringtone") {
			return {
				soundClass: enyo.messaging.message.SOUND_CLASSES.RINGTON,
				soundPath: prefs.ringtone.fullPath
			};
		}
		
		return undefined;
	}
});