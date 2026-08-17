/*globals enyo */

enyo.kind({
	name: "ThreadItem",
	kind: "SwipeableItem",
	confirmCaption: $L("Delete"),
	layoutKind: "HFlexLayout",
	components: [
		{components: [
			{name: "imageBorder", className: "contact-image-border"},
			{name: "contactImage", kind: "Image", className: "contact-image"}
		]},
		{kind: "VFlexBox", className: "status-box", pack: "justify", align: "center", components: [
			{name: "status", className: "status"},
			{name: "outgoing", className: "sent-received"}
		]},
		{kind: "VFlexBox", className: "message-summary", flex: 1, components: [
			{layoutKind: "HFlexLayout", align: "center", className:"contact-name-box", components: [
				{name: "displayName", className: "contact-name", allowHtml: true},
				{name: "unreadCount", className: "unread-count", showing: false}
			]},
			{name: "summary", className: "message-preview", allowHtml:true}
		]}
	],
	create: function() {
		this.inherited(arguments);
		this.addClass("contactItem"); 
	},
	updateStatus: function(inStatus) {
		this.$.status.setClassName(this.getStatusClassName(inStatus));
	},
	updateUnreadCount: function(inThread){
		var inUnreadCount = inThread.unreadCount;
		var hasUnread = !this.isThreadSelected(inThread) && Number(inUnreadCount) > 0;
		this.$.unreadCount.setContent(inUnreadCount || 0);
		this.$.unreadCount.setShowing(hasUnread);
		this.$.displayName.setClassName("contact-name" + (hasUnread ? " contact-name-unread" : ""));
	},
	updateContactImage: function(inPerson, inThread) {
		// webOS: 1:1 chats keep the buddy avatar; group chats (no person) show the service logo
		// instead (like Telegram's icon), so you can tell at a glance which network a group is on.
		if (inPerson) {
			this.$.contactImage.setAttribute("src", enyo.messaging.person.getDisplayImage(inPerson));
			this.setServiceIconStyle(false);
			return;
		}
		var svc = inThread && (inThread.serviceName || inThread.replyService);
		var icon = this.getServiceIcon(svc);
		this.$.contactImage.setAttribute("src", icon || enyo.messaging.person.getDisplayImage(inPerson));
		// A group chat shows the provider logo instead of a photo. Those logos already have their
		// own smooth (rounded) edges, so the square photo frame clashes and the full-bleed logo
		// reads too bright: drop the frame + soften it. Real photos keep the framed treatment.
		this.setServiceIconStyle(Boolean(icon));
	},
	// Toggle the provider-logo presentation (no photo frame, softened) vs the normal framed photo.
	// Set on every row so recycled list rows never keep a previous row's treatment.
	setServiceIconStyle: function(isServiceIcon) {
		this.$.imageBorder.setShowing(!isServiceIcon);
		this.$.contactImage.addRemoveClass("contact-image-service", isServiceIcon);
	},
	getServiceIcon: function(serviceName) {
		if (!serviceName || !enyo.application || !enyo.application.accountService ||
		    !enyo.application.accountService.getIcons) { return null; }
		var icon = enyo.application.accountService.getIcons(serviceName);
		if (!icon) { return null; }
		if (typeof icon === "string") { return icon; }
		return icon.loc_48x48 || icon.loc_32x32 || null;
	},
	updateOutgoing: function(inFlags) {
		this.$.outgoing.setClassName("sent-received " + (Boolean(inFlags && inFlags.outgoing) ? "message-outgoing" : ""));
	},
	setThread: function(inThread) {
		this.updateStatus(inThread.status);
		this.updateContactImage(inThread.person, inThread);
		this.updateUnreadCount(inThread);
		this.updateOutgoing(inThread.flags);

		if (inThread.person) {
			var displayName = enyo.messaging.person.getDisplayName(inThread.person);
			this.$.displayName.setContent(enyo.messaging.message.emojifyEscaped(displayName));
		}
		else {
			this.$.displayName.setContent(enyo.messaging.message.emojifyEscaped(inThread.displayName ? inThread.displayName : inThread.replyAddress));
		}
		
		var summary = this.getThreadSummary(inThread);
		// Render emoji in the thread preview as inline images (the summary mirrors the message
		// text, whose astral emoji the transport stored as numeric entities). See utils.js emojify.
		this.$.summary.setContent(enyo.messaging.message.emojify(summary));
	}, 
	/***********************************
	 * Functions below are unit tested *
	 ***********************************/
	getStatusClassName: function(inStatus) {
		var status = inStatus && (inStatus.offline ? "offline" : enyo.messaging.im.availabilityClasses[inStatus.availability]);
		var statusClass = !status ? "" : " status-" + status;
		return "status" + statusClass;
	},
	getThreadSummary: function(inThread){
		var summary;
		if (enyo.messaging.message.isMMSThread(inThread)) {
			summary = enyo.messaging.message.getMMSThreadSummary();
		} else if(inThread.summary){
			if (inThread.flags && inThread.flags.outgoing) {
				// only outgoing messages needs to be escaped since it is not
				// sanitized.
				summary = enyo.string.escapeHtml(inThread.summary);
			} else {
				summary = inThread.summary;
			}
			summary = this.summarizeMedia(summary);
		}
		else {
			summary = "";
		}
		return summary;
	},
	// A voice note / photo / video / file arrives with the media URL as the message body, so the
	// thread preview would otherwise show a raw "file:///..." path. When the body is just a media
	// URL, show a friendly emoji label instead; if there's real text too, keep the text.
	summarizeMedia: function(text){
		// Shared with the notification banner (utils.js). Kept as a thin wrapper so the thread-list
		// call site and its unit test stay put.
		return enyo.messaging.message.summarizeMedia(text);
	},
	isThreadSelected: function(inThread) {
		return (enyo.application.selectedThread && inThread._id === enyo.application.selectedThread._id && enyo.application.messageDashboardManager.getAppDeactivated() === false);
	}
});