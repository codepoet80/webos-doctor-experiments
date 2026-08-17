enyo.kind({
	name: "NetworkSwitch",
	kind: "VFlexBox",
	pack: "justify",
	className: "outofnetwork",
	components: [
		{layoutKind: "VFlexLayout", pack: "center", className: "notification-box", components: [
			{layoutKind: "HFlexLayout", pack: "justify", align: "center", flex: 1, components: [
				{layoutKind: "VFlexLayout", align: "start", flex: 1, components: [
					{content: $L("Network switch:"), className: "title"},
					{content: $L("SIM detected. Do you want to switch to Global(auto) mode?"), className: "msg-text"},
				]},
			]},
		]},	
		{kind: "Button", layoutKind: "VFlexLayout", pack: "justify", className: "affirmative-button text-header", caption: $L("Yes"), onclick: "switchWorld"},
		{kind: "Button", layoutKind: "VFlexLayout", pack: "justify", className: "notification-button text-header",caption: $L("No"), onclick: "exit"},

		//service calls
		{name: "switchTechnology", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "switchTechnology", onSuccess: "", onFailure: ""}
	],

	create: function() {
		this.inherited(arguments);
	},

	switchWorld: function() {
		this.selectiontoSave = "world";
 		this.$.switchTechnology.call({
			"tech": this.selectiontoSave
		});

		this.exit();
	}, 

	exit: function() {
		//don't show this popup again
		//enyo.application.Cache.showOONDlg = this.$.cbOON.checked;
		close();
	}
});
