enyo.kind({
	name: "LocationServicesPrompt",
	kind: enyo.Popup,
	events: {
		onLocationServicesLaunched: "",
		onCancel: ""
	},
	scrim: true,
	className: "enyo-popup popup",
	components: [
		{name: "openApp", kind: "PalmService", service: "palm://com.palm.applicationManager/", method: "open"},
		{kind: "VFlexBox", components: [
			{content: $L("Your current location is unavailable."), className: "spaced popup-title"},
			{content: $L("Launch Location Services?"), className: "spaced popup-title"},
			{content: $L("In the App Menu of Location Services, make sure to select a service in the 'Locate Me Using...' menu"), className: "spaced", style: "color: grey;"},
			{kind: "HFlexBox", components: [
				{kind: "Button", flex: 1, className: "spaced", caption: $L("Cancel"), onclick: "cancel"},
				{kind: "Button", flex: 1, className: "spaced", caption: $L("Launch"), onclick: "launch"}
				
			]}
		]}
	],
	launch: function() {
		this.$.openApp.call({id: "com.palm.app.location", params: {}});
		this.doLocationServicesLaunched();
		this.close();
	},
	cancel: function() {
		this.close();
		this.doCancel();
	}
});