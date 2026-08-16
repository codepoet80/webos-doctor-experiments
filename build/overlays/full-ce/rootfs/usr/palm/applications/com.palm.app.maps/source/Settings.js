enyo.kind({
	name: "Settings",
	kind: enyo.VFlexBox,
	events: {
		onShowTraffic: "",
		onDropPinToggle: "",
		onMapTypeChange: "",
		onClearAll: ""
	},      
	className: "settings",
	components: [
		{kind: "Item", layoutKind: "VFlexLayout", className: "settings-divider", components: [
			{content: $L("Map Type")}
		]},
		{kind: "CheckItemGroup", value: "road", onChange: "doMapTypeChange", components: [
			{icon: "images/map-type-road.png", description: $L("Road"), value: "road"},
			{icon: "images/map-type-satellite.png", description: $L("Satellite"), value: "aerial"},
			{icon: "images/map-type-bird-eye.png", description: $L("Bird's Eye"), value: "birdseye"}
		]},
		{kind: "Item", layoutKind: "VFlexLayout", className: "settings-divider", components: [
			{content: $L("Options")}
		]},
		{kind: "CheckItem", icon: "images/icon-traffic.png", description: $L("Show Traffic"), onclick: "showTrafficClick"},
		{kind: "CheckItem", icon: "images/icon-dropPin.png", description: $L("Drop a pin"), onclick: "dropPinClick"},
		{kind: "CheckItem",  icon: "images/icon-clearMap.png",  description: $L("Clear Map"), onclick: "doClearAll"}
	],
	dropPinClick: function(inSender) {
		this.dropPinChecked = !this.dropPinChecked;
		inSender.setChecked(this.dropPinChecked);
		this.doDropPinToggle(this.dropPinChecked);
	},
	showTrafficClick: function(inSender) {
		this.showTrafficChecked = !this.showTrafficChecked;
		inSender.setChecked(this.showTrafficChecked);
		this.doShowTraffic(this.showTrafficChecked);
	}
});
