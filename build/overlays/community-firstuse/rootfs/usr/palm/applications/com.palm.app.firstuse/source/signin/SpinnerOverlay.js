enyo.kind({
	name: "MyApps.FirstUse.SpinnerOverlayPopup",
	kind: "HFlexBox",
	pack: 'justify',
	showing: false,
	components: [
		{kind: "Scrim", layoutKind: "VFlexLayout", align: "center", pack: "center", 
			components: [
            	{name: "spinner", kind: "SpinnerLarge"}
        	]
		},
	],
		
	openAtCenter: function() {
		this.$.spinner.show();
		this.$.scrim.show();
		this.show();
	},
	
	close: function()  {
		this.$.scrim.hide();
		this.$.spinner.hide();
		this.hide();
	},
})
