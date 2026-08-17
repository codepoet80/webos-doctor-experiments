enyo.kind({
	name: "OutOfNetwork",
	kind: "VFlexBox",
	pack: "justify",
	className: "outofnetwork",
	components: [
		{layoutKind: "VFlexLayout", pack: "center", className: "notification-box", components: [
			{layoutKind: "HFlexLayout", pack: "justify", align: "center", flex: 1, components: [
				{layoutKind: "VFlexLayout", align: "start", flex: 1, components: [
					{content: $L("Out of Network:"), className: "title"},
					{content: $L("Network mode selected can't be acquired."), className: "msg-text"},
					{layoutKind: "HFlexLayout", tapHighlight: false, components: [
                				{kind: "CheckBox", align: "center", name: "cbOON", checked: false},
		                		{content: $L("Do not show this message next time."), style: "margin-top: 5px;", className: "msg-text"}
		                	]},
				]},
			]},
		]},	
		{kind: "CustomButton", name: "buttonWorld", layoutKind: "VFlexLayout", pack: "center", className: "affirmative-button text-header", caption: $L("Switch to Global(auto) mode"), onclick: "switchWorld"},
		{kind: "CustomButton", name: "buttonOpposite", layoutKind: "VFlexLayout", pack: "center", className: "affirmative-button text-header", caption: $L("Switch to CDMA mode"), onclick: "switchOpposite"},
		{kind: "CustomButton", name: "buttonCurrent", layoutKind: "VFlexLayout", pack: "center", className: "notification-button text-header",caption: $L("Keep the current mode"), onclick: "exit"},

		//service calls
		{name: "switchTechnology", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "switchTechnology", onSuccess: "onSwitchNetworkDone", onFailure: "onSwitchNetworkDone"}
	],

	create: function() {
		this.inherited(arguments);
		
		if(enyo.application.Cache.platformTech == "cdma") {
			this.$.buttonOpposite.setCaption($L("Switch to GSM/UMTS mode"));
		} else {
			this.$.buttonOpposite.setCaption($L("Switch to CDMA mode"));			
		}
	},

	switchWorld: function() {
		this.selectiontoSave = "world";
 		this.$.switchTechnology.call({
			"tech": this.selectiontoSave
		});

		this.exit();
	}, 
	
	switchOpposite: function() {
		if(enyo.application.Cache.platformTech == "cdma") {
			this.selectiontoSave = "umts";
		} else {
			this.selectiontoSave = "cdma";
		}

 		this.$.switchTechnology.call({
			"tech": this.selectiontoSave
		});

		this.exit();
	},

	exit: function() {
		enyo.application.Cache.showOONDlg = !this.$.cbOON.checked;
		close();
	},

	onSwitchNetworkDone: function(inSender, response) {
		if (response.returnValue) {
			enyo.application.Cache.platformTech = this.selectiontoSave;
		}
	},
});
