/*globals enyo */

enyo.kind({
	name: "FlightMode",
	kind: enyo.VFlexBox,
	components: [
			{ kind: "PageHeader", className: "header", components: [
				{name: "photoImage", kind: "Image", className: "phone-icon", src: "../shared/phoneprefs/images/header-icon-phone.png"},
				{content: $L("Phone Preferences"), className: "phone-header-caption"}
			]},
			{layoutKind: "HFlexLayout", align: "center", className: "info-text", components: [
				{kind: enyo.Label, content: $L("You need a network connection to your wireless service provider to see Phone Preferences.")}
			]}
	], 

	create: function() {
		this.inherited(arguments);
	}

});
