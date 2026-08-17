enyo.kind({
    name: "Wifi",
    events: {onFinish: ""},
    kind: "ModalDialog", lazy: false,
	modal: true,
	scrim:true,
	width: "351px",
	height:"600px",
	layoutKind:"VFlexLayout",
	caption: rb.$L("Wi-Fi Setup"),
    components: [
		{"content": rb.$L("Choose a network"), style: "font-size: 13px; padding: 0px 0px 10px 0px;" },
		{kind: enyo.Control, height: "100%", className: "fu-wifi scrollable", flex: 1, components: [{flex:1, name: "wifiHelper", height: "100%", kind: "WiFiHelper", className:"scrollable-inner"}]}
		
	],
	showing: false,	
	
    create: function(){
        this.inherited(arguments);
	this.$.wifiHelper.setLiteMode(true);
    },
	start: function() {
    	this.$.wifiHelper.turnWiFiOn();
    },
    
	doShowIpConfig: function(inSender, inProfile) {
		this.$.wifiIpConfig.setJoinedProfile(inProfile);
	},
});

