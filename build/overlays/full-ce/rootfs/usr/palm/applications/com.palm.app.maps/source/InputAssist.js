enyo.kind({
	name: "InputAssist",
	kind: enyo.Popup, 
	published: {
		isEmpty: false,
		showDroppedPin: false,
		showMyLocationPin: false
	},
	events: {
		onSelect: ""
	},
	className: "enyo-popup enyo-popup-menu inputassist",
	components: [  
		{kind: "VFlexBox", height: "200px", className: "enyo-menu-inner", components: [
			{kind: "Recents", flex: 1, hideClearButton: true, onSelect: "itemSelect", onEmpty: "close"}
		]}
	],
	afterOpen: function() {
		this.inherited(arguments);
		this.$.recents.reset();
	},
	showDroppedPinChanged: function() {
		this.$.recents.setShowDroppedPin(this.showDroppedPin);
	},
	showMyLocationPinChanged: function() {
		this.$.recents.setShowMyLocationPin(this.showMyLocationPin);
	},
	itemSelect: function(inSender, inValue) {
		this.doSelect(this.input, inValue);
	}
})