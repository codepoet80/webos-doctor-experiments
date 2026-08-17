enyo.kind({
	name: "BannerThrottler",
	kind: enyo.Component,
	newMessages: [],
	bannerWidgetIds: [],
	lastShownTimestamp: 0,
	SHOW_BANNER_INTERVAL: 2000,  // two seconds
	create: function(db) {
		this.inherited(arguments);
		this.dashboard = db;
	},
	addNewMessages: function(messages) {
		this.newMessages = this.newMessages.concat(messages);
		
		if (Date.now() - this.lastShownTimestamp > this.SHOW_BANNER_INTERVAL * 2) {
			// show the banner immediately if the time for last banner shown is greater than twice of the pre-defined shown interval
			this.showBanner();
		} else if (!this.showBannerTimer) {
			this.showBannerTimer = setTimeout(function() {
				this.showBannerTimer = undefined;
				this.showBanner();
			}.bind(this), this.SHOW_BANNER_INTERVAL);
		}
	},
	showBanner: function() {
		this.lastShownTimestamp = Date.now();

		//enyo.log("this.newMessages: ", this.newMessages);
		if (this.newMessages.length > 0) {
			var messages = this.newMessages;
			
			enyo.log("Showing banner for ", messages.length, " new messages received");
			this.newMessages = [];
			var bannerMessage = this.getBannerMessagePrefix(messages) + this.getBannerMessage(messages[messages.length - 1]);
			
			// play notification sound and then put up banner
			this.dashboard.playSoundNotification();
			if (this.bannerWidgetIds.length > 10) {
				this.bannerWidgetIds = [];
			}
			this.bannerWidgetIds.push(enyo.windows.addBannerMessage(bannerMessage, "{}", "images/notification-small.png"));
		}
	},
	getBannerMessagePrefix: function(messages) {
		return messages.length > 1 ? ("(" + messages.length + "/" + messages.length + ") ") : "";
	},
	getBannerMessage: function(latestMessage) {
		enyo.log("Latest message for banner: ", latestMessage);
		// The banner is native plain text (no inline emoji images, no emoji font). getDisplayText
		// already strips emoji from the body, but getDisplayName returns the raw sender/chat name,
		// which for e.g. a Telegram contact "🐱🐶 Name" would otherwise show literal "&#128049;"
		// entities in the banner. Strip it the same way the dashboard title does (DashboardManager).
		return enyo.messaging.message.stripEmojiForPlainText(this.dashboard.getDisplayName(latestMessage)) +
			": " + this.dashboard.getDisplayText(latestMessage);
	},
	clearBannerMessages: function(filter) {
		var ids = this.bannerWidgetIds;
		this.bannerWidgetIds = [];
		
		// TODO: there was a framework issue that prevented the following codes to work, so this function is currently not used. 
		for (var i = 0; i < ids.length; i++) {
			enyo.log("Clearing banner with id: ", ids[i]);
			try {
				enyo.windows.removeBannerMessage(ids[i]);
			} catch (e) {
				enyo.warn("Unable to remove banner messages");
			}	
		}
	}
});
