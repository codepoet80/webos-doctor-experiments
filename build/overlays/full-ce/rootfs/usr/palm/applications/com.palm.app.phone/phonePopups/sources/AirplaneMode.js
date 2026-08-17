/*globals enyo */

enyo.kind({
	name: "AirplaneMode",
	kind: "VFlexBox",
	pack: "justify",
	className: "popups-bg",
	components: [
		{layoutKind: "VFlexLayout", pack: "center", className: "notification-box", style: "-webkit-border-image: none; ", components: [
			{layoutKind: "HFlexLayout", pack: "justify", align: "center", flex: 1, components: [
				{layoutKind: "VFlexLayout", align: "start", flex: 1, components: [
					{content:$L("Airplane Mode Is On"), style: "margin: 5px 15px;", className: "title"},
					{content: $L("Turn off Airplane Mode for network access?"), style: "margin: 5px 15px;", className: "msg-text"},
				]},
				{className: "airplane-mode-frame"}
			]}
		]},
		{kind: "ActivityButton", active: false, name: "turnoff_button", className: "enyo-button-affirmative", label: $L("Turn Off"), onclick: "airmodeOff"},
		{kind: "Button", name: "dismiss_button", className: "enyo-button-negative", label: $L("Dismiss"), onclick: "dismiss"},

		//Service calls
		{name: "prefService", kind: enyo.PalmService, service: enyo.palmServices.system},
	],

	create: function() {
		this.inherited(arguments);
		enyo.log();			
	},

	airmodeOff: function(){
		this.$.prefService.call({"airplaneMode" : false}, {method: "setPreferences"});
		
		enyo.application.CallSynergizer.redialOnNetworkService = enyo.windowParams.redialParams;
		//close();
		this.$.turnoff_button.active = true;
		this.$.turnoff_button.activeChanged();		
		
		if (!this.changeTimer) {
			// change mode will timeout after 2 minutes. 
			this.changeTimer = setTimeout(function() {
				this.changeTimer = undefined;
				enyo.application.CallSynergizer.redialOnNetworkService = null; 
				close();
			}.bind(this), 120000);
		}					 
   	},

	dismiss: function(){
		close();
	}, 
	
	destroy: function() {
		if (this.changeTimer){
			clearTimeout(this.changeTimer);
			this.changeTimer = undefined; 
		}
		this.inherited(arguments);
	},	
});
