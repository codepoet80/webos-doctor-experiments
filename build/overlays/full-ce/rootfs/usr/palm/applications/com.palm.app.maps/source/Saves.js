enyo.kind({
	name: "Saves",
	kind: enyo.VFlexBox, 
	className: 'saves', 
	published: {
		showDroppedPin: false,
		showMyLocationPin: false
	},
	events: {
		onSelect: ""
	},
	components: [
		{kind: "RadioGroup", className: "saves-header", onChange: "modeChange", components: [
			{label: $L("Saved"), value: 0},
			{label: $L("Recents"), value: 1}
		]},
		{kind: "Pane", className: 'saves-pane', flex: 1, components: [
			{kind: "Bookmarks", showMyLocationPin: true, flex: 1, onSelect: "doSelect"},
			{kind: "Recents", flex: 1, onSelect: "doSelect"}
		]}
	],
	modeChange: function(inSender, inModeValue) {
		var v = this.$.pane.selectViewByIndex(inModeValue);
	},
	showDroppedPinChanged: function() {
		this.$.bookmarks.setShowDroppedPin(this.showDroppedPin);
	},
	showMyLocationPinChanged: function() {
		this.$.bookmarks.setShowMyLocationPin(this.showMyLocationPin);
	},
	addRecent: function(inValue) {
		this.$.recents.addItem(inValue);
	},
	addBookmark: function(inTitle, inLocation) {
		this.$.bookmarks.addItem(inTitle, inLocation);
	}
})
