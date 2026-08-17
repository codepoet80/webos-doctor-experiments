enyo.kind({
	name: "MyApps.FirstUse.SimCheck",
	kind: "HFlexBox",
	
	events: {
        onSimCheckSuccess: "",
        onSimCheckFailure: "",
        onStartOver: ""
    },

	pack: 'justify',
	components: [
		{kind: "Scrim", layoutKind: "VFlexLayout", align: "center", pack: "center", 
			components: [
				{name: "CheckSim", kind: "CheckSim", onSimCheckSuccess: "onSimCheckSuccess_internal", onSimCheckFailure: "onSimCheckFailure_internal", onStartOver: "onSimCheckStartOver_internal"},
        	]
		},
	],
		
	openAtCenter: function(locale) {
		this.$.scrim.show();
		this.$.CheckSim.startCheck({locale: locale});
	},
	
	close: function()  {
		this.$.scrim.hide();
	},
	
	onSimCheckSuccess_internal: function () {
		this.doSimCheckSuccess();	
	},
	onSimCheckFailure_internal: function (insender, response) {
		this.doSimCheckFailure(response);	
	},
	onSimCheckStartOver_internal: function () {
		this.doStartOver();	
	},
})
