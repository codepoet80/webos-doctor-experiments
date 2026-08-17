/*globals enyo */

enyo.kind({
	name: "ActiveCallButton",
	kind: enyo.CustomButton,
	layoutKind: "VFlexLayout",
	pack: "center",
	className: "enyo-button active-call-button",
	published: {
		icon: "",
		caption: ""
	},
	chrome: [
		{kind: "VFlexBox", className: "active-call-button-wrapper", components: [
			{name: "icon", className: "enyo-button-icon active-call-button-icon"},
			{name: "caption"}
		]}
	],
	create: function() {
		this.inherited(arguments);
		this.iconChanged();
		this.captionChanged();
	},
	captionChanged: function() {
		this.$.caption.setContent(this.caption);
	},
	iconChanged: function() {
		this.$.icon.applyStyle("background-image", "url(" + this.icon + ")");
	}
});
