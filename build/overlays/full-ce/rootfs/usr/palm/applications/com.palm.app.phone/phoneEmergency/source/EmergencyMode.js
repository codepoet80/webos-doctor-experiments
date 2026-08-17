enyo.kind({
	name: "EmergencyMode",
	kind: "VFlexBox",
	className: "palm-dark-background",
	components: [
		{flex: 1, layoutKind: "VFlexLayout", align: "center", pack: "center", className: "emergency-mode-text", content:$L("Emergency Mode")},
		{name: "groupButton", layoutKind: "VFlexLayout", defaultKind: "Button", components: [
			{layoutKind: "VFlexLayout", caption: $L("Call Emergency"), className: "button-primary", onclick: "callEmergency"},
			{layoutKind: "VFlexLayout", caption: $L("Exit Emergency Mode"), className: "button-secondary", onclick: "exitEmergencyMode"},			
		]},
		
		{name:"emergencyModeEnd", kind:"EmergencyCard.EmergencyModeEnd"}		
	],
	getEmergencyNumber: function() {
		// figures out which emergency number to call. 
		// precedence: the last dialed number, then the first emergency number in the list, then 911
		
		// todo get redial number?
	},
	callEmergency: function() {
		enyo.application.UI.event('dial',{'emergencyFill': true});
		//enyo.application.UI.event('dial',{'fill': this.getEmergencyNumber()}); // todo
	},
	exitEmergencyMode: function() {
		this.$.emergencyModeEnd.call();
	}
});


