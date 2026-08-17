/*globals enyo */

// A single channel (room) row inside a server's channel list. Channels are presented IRC-style
// with a leading "#". The record is an imchannel; its chatThreadId links to the conversation.
enyo.kind({
	name: "ChannelItem",
	kind: "HFlexBox",
	className: "contactItem",
	align: "center",
	components: [
		{kind: "VFlexBox", flex: 1, className: "message-summary", pack: "center", components: [
			{name: "displayName", className: "contact-name", allowHtml: true}
		]},
		// Unread badge for this channel's conversation; hidden when read (or when it's the open channel).
		{name: "unreadCount", className: "unread-count channel-unread", showing: false}
	],
	setChannel: function(inChannel) {
		this.$.displayName.setContent(enyo.messaging.message.emojifyEscaped(this.getChannelLabel(inChannel)));
	},
	// Unread count for this channel (0 or the currently-open channel hides the badge). Driven by
	// ChannelList, which bolds the channel name to match the thread-list unread treatment.
	setUnread: function(inCount) {
		var n = Number(inCount) || 0;
		this.$.unreadCount.setContent(n > 99 ? "99+" : n);
		this.$.unreadCount.setShowing(n > 0);
		this.$.displayName.setClassName("contact-name" + (n > 0 ? " contact-name-unread" : ""));
	},
	/***********************************
	 * Functions below are unit tested *
	 ***********************************/
	// Channels seeded by M1 carry name = remote id and displayName = server name, so prefer an
	// explicit human name/topic when present and otherwise show the remote id. "#"-prefixed, but
	// don't double it for IRC channels whose name already starts with "#".
	getChannelLabel: function(inChannel) {
		var name = inChannel.name || inChannel.remoteId || inChannel.displayName || $L("channel");
		return (String(name).charAt(0) === "#") ? name : ("# " + name);
	}
});
