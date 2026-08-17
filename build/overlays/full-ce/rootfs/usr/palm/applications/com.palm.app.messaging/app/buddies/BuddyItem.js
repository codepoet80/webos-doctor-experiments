/*globals enyo */

enyo.kind({
	name: "BuddyItem",
	kind: "SwipeableItem",
	confirmCaption: $L("Delete"),
	layoutKind: "HFlexLayout",
	components: [
		{name: "imageContainer", style: "display: inline-block;", components: [
			{className: "contact-image-border"},
			{name: "contactImage", kind: "Image", className: "contact-image"}
		]},
		{name: "status", className: "status status-buddy"},
		{className:"message-summary", components: [
			{layoutKind: "HFlexLayout", align: "center", className:"contact-name-box", components: [
				{name: "contactName", className: "contact-name", allowHtml: true},
				{name: "favorite", kind: "Image", showing: false, className: "favorite-icon"},
				{name: "unreadCount", className: "unread-count", showing: false}
			]},
			{name: "statusMessage", className: "status-message", allowHtml: true}
		]}
	],
	create: function() {
		this.inherited(arguments);
		this.addClass("contactItem"); 
	},
	updateContactName: function(inBuddy) {
		this.$.contactName.setContent(enyo.messaging.message.emojifyEscaped(this.getContactName(inBuddy)));
	},
	updateStatus: function(inAvailability) {
		this.$.status.setClassName(this.getStatus(inAvailability));
	},
	updateStatusMessage: function(inBuddy) {
		this.$.statusMessage.setContent(enyo.messaging.message.emojifyEscaped(this.getStatusMessage(inBuddy)));
	},
	updateContactImage: function(inPerson) {
		//enyo.log("#@#@ inPerson: ", inPerson);
		this.$.contactImage.setAttribute("src", enyo.messaging.person.getDisplayImage(inPerson));
	},
	updateContactFavorite: function(inPerson) {
		this.$.favorite.setShowing(inPerson && inPerson.favorite);
	},
	updateUnreadCount: function(inThread, inPerson) {
		//enyo.log("#@#@ buddy item's chat thread: ", inThread);
		var count = this.getUnreadCount(inThread);
		var hasUnread = !this.isThreadSelected(inThread) && Number(count) > 0;
		
		this.$.contactName.setClassName(this.getContactNameClass(hasUnread, inPerson));
		this.$.unreadCount.setShowing(hasUnread);
		this.$.unreadCount.setContent(count);
	},
	isThreadSelected: function(inThread) {
		return inThread && enyo.application.selectedThread && (inThread._id === enyo.application.selectedThread._id);
	},
	setBuddy: function(inBuddy) {
		//enyo.log(inBuddy);
		this.updateContactName(inBuddy);
		this.updateUnreadCount(inBuddy.thread, inBuddy.person);
		this.updateStatus(inBuddy.personAvailability !== undefined ? inBuddy.personAvailability : inBuddy.availability);
		this.updateStatusMessage(inBuddy);
		this.updateContactImage(inBuddy.person);
		this.updateContactFavorite(inBuddy.person);
	},
	
	/***********************************
	 * Functions below are unit tested *
	 ***********************************/
	getContactName: function(inBuddy) {
		var displayName = inBuddy.person ? enyo.messaging.person.getDisplayName(inBuddy.person) : inBuddy.displayName || inBuddy.username;
		return enyo.messaging.message.removeHtml(displayName);
	},
	getStatus: function(inAvailability) {
		var statusClass = "status-" + enyo.messaging.im.availabilityClasses[inAvailability];
		return "status status-buddy " + statusClass;
	},
	getStatusMessage: function(inBuddy) {
		var inStatus = inBuddy.status || "";

		if (inBuddy._kind === "com.palm.imbuddystatus.libpurple:1") {
			// needs to unescape &amp; &apos; &lt; and &gt; from status messages
			// that are synced by libpurple transport since the libpurple
			// library escapes these characters.
			inStatus = enyo.messaging.message.unescapeText(inStatus);
		}
		return enyo.messaging.message.removeHtml(inStatus);
	},
	getUnreadCount: function(inThread) {
		return inThread && inThread.unreadCount || 0;
	},
	getContactNameClass: function(hasUnread, inPerson) {
		var isFavorite = inPerson && inPerson.favorite;
		var className = "contact-name";

		if (hasUnread && isFavorite) {
			className += " contact-name-unread-favorite";
		} else if (hasUnread) {
			className += " contact-name-unread";
		} else if (isFavorite) {
			className += " contact-name-favorite";
		}
		
		return className;
	}

});