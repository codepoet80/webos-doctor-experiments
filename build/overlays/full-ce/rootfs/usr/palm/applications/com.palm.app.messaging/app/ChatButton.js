enyo.kind({
	name: "ChatButton",
	kind: enyo.CustomButton,
	className: "enyo-button-icon chat-button",
	components: [
		{name: "caption", className: "chat-button-text"}
	],
	captionChanged: function() {
		this.$.caption.setContent(this.caption);
	}
});
