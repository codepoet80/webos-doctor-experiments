/*globals enyo */

// A single server (guild/network) row in the Servers tab. Shows the server display name plus its
// account type as a subtitle; tapping the row drills into its channels.
enyo.kind({
	name: "ServerItem",
	kind: "HFlexBox",
	className: "contactItem server-item",
	align: "center",
	components: [
		{name: "serverImage", kind: "Image", className: "contact-image", src: "images/menu-icon-servers.png"},
		// Same status column as thread rows (ThreadItem): the account's online dot on top, the
		// last-message sent/received arrow below. Also supplies the gap between logo and title.
		{kind: "VFlexBox", className: "status-box", pack: "justify", align: "center", components: [
			{name: "status", className: "status"},
			{name: "outgoing", className: "sent-received"}
		]},
		{kind: "VFlexBox", flex: 1, className: "message-summary", pack: "center", components: [
			{name: "displayName", className: "contact-name", allowHtml: true},
			{name: "serviceName", className: "message-preview"}
		]},
		// Aggregate unread badge (sum across the server's channels); hidden when the server is caught up.
		{name: "unreadCount", className: "unread-count server-unread", showing: false}
	],
	setServer: function(inServer) {
		var name = inServer.displayName || inServer.name || inServer.remoteId || $L("Server");
		this.$.displayName.setContent(enyo.messaging.message.emojifyEscaped(name));
		this.$.serviceName.setContent(enyo.string.escapeHtml(this.getServiceLabel(inServer)));
		this.updateServerImage(inServer);
	},
	// Account online dot. inAvailability is the imloginstate availability index (0 available..4
	// offline); null when the account has no login state yet -> the dot is blank (still a spacer).
	setStatus: function(inAvailability) {
		var cls = (inAvailability == null) ? "" :
			(" status-" + (enyo.messaging.im.availabilityClasses[inAvailability] || "offline"));
		this.$.status.setClassName("status" + cls);
	},
	// Direction of the server's most recent message (last channel activity). Mirrors ThreadItem.
	setOutgoing: function(inOutgoing) {
		this.$.outgoing.setClassName("sent-received " + (inOutgoing ? "message-outgoing" : ""));
	},
	// Show the account's Synergy connector logo (like the group-chat rows in ThreadItem) instead of the
	// generic servers glyph, so you can tell at a glance which network a server is on. Falls back to the
	// generic icon when the service has no template icon (e.g. account removed).
	updateServerImage: function(inServer) {
		var icon = this.getServiceIcon(inServer && inServer.serviceName);
		this.$.serverImage.setAttribute("src", icon || "images/menu-icon-servers.png");
		// Provider logos carry their own rounded edges and read a touch bright at full bleed; reuse
		// ThreadItem's softened, frameless treatment. Recycled rows must clear it when falling back.
		this.$.serverImage.addRemoveClass("contact-image-service", Boolean(icon));
	},
	// Sum of unread across this server's channels (0 hides the badge). Driven by ServerList.
	setUnread: function(inCount) {
		var n = Number(inCount) || 0;
		this.$.unreadCount.setContent(n > 99 ? "99+" : n);
		this.$.unreadCount.setShowing(n > 0);
	},
	/***********************************
	 * Functions below are unit tested *
	 ***********************************/
	// Resolve a service's connector icon (loc_48x48/loc_32x32) via the accounts template hash, exactly
	// as ThreadItem does for group chats. Returns null when unavailable so callers can fall back.
	getServiceIcon: function(serviceName) {
		if (!serviceName || !enyo.application || !enyo.application.accountService ||
		    !enyo.application.accountService.getIcons) { return null; }
		var icon = enyo.application.accountService.getIcons(serviceName);
		if (!icon) { return null; }
		if (typeof icon === "string") { return icon; }
		return icon.loc_48x48 || icon.loc_32x32 || null;
	},
	// Map the raw serviceName ("type_discord", "type_irc"...) to a friendly label via the account
	// template hash (same source ImStatus/getIcons use), falling back to the stripped raw name.
	getServiceLabel: function(inServer) {
		var svc = inServer.serviceName || "";
		var accountService = enyo.application && enyo.application.accountService;
		if (accountService && accountService.getMyAccountTypesHash) {
			var types = accountService.getMyAccountTypesHash();
			var tmpl = types && types[svc];
			if (tmpl && (tmpl.loc_name || tmpl.name)) {
				return tmpl.loc_name || tmpl.name;
			}
		}
		return svc.replace(/^type_/, "");
	}
});
