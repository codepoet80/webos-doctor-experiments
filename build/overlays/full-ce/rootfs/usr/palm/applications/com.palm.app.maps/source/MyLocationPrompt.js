enyo.kind({
	name: "MyLocationPrompt",
	kind: enyo.Popup,
	events: {
		onLocateMe: "",
		onCancel: ""
	},
	scrim: true,
	className: "enyo-popup popup",
	components: [
		{kind: "VFlexBox", components: [
			{content: $L("Your current location is unavailable."), className: "spaced popup-title"},
			{content: $L("Turn on My Location?"), className: "spaced popup-title"},
			{kind: "HFlexBox", components: [
				{kind: "Button", flex: 1, className: "spaced", caption: $L("Cancel"), onclick: "cancel"},
				{kind: "Button", flex: 1, className: "spaced", caption: $L("OK"), onclick: "locateMe"}
				
			]}
		]}
	],
	locateMe: function() {
		this.close();
		this.doLocateMe();
	},
	cancel: function() {
		this.close();
		this.doCancel();
	}
});