enyo.kind({
	name: "CustomDivider",
	kind: enyo.HFlexBox,
	align: "center",
	published: {
		caption: $L("Divider")
	},
	chrome: [
		{name: "rightCap", className: "enyo-divider-right-cap custom-divider-right-cap"},
		{name: "caption", className: "enyo-divider-caption custom-divider-caption"},
		{className: "enyo-divider-left-cap custom-divider-left-cap"},
		{name: "client", kind: enyo.HFlexBox, align: "center", className: "enyo-divider-client"}
	],
	//* @protected
	create: function() {
		this.inherited(arguments);
		this.captionChanged();
	},
	captionChanged: function() {
		this.$.caption.setContent(this.caption);
	}
});
