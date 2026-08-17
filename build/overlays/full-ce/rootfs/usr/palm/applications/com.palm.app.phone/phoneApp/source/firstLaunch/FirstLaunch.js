enyo.kind({
	name: "FirstLaunch",
	kind: "enyo.VFlexBox",
	events: {
		onFirstLaunchDone: ""
	},
	style: "position: absolute; top: 0px",
	components: [
	    {
	    	name:"firstLaunch",
	    	kind: "firstLaunchView",
				className: "first-launch-scene",
	    	iconSmall: "../images/icon-48x48.png",	// Path to small icon used for title bar
	    	iconLarge: "../images/empty-calllog-phone.png",	// Path to large icon used for Welcome page
	    	components: [
				{name: "connectPhoneLayer", layoutKind: "VFlexLayout", align: "center", components: [
					//{kind: "ConnectSkype", style: "width: 480px; height: 100px"},
					{kind: "ConnectPhone", style: "width: 480px; height: 100px"}
				]}
			],	
	    	onAccountsFirstLaunchDone: "doFirstLaunchDone",	
	    	capability: 'PHONE'							
	    } 
	],
	rendered: function() {
		this.inherited(arguments);
		
		var msgs = {
				pageTitle: FirstLaunchConstants.TITLE_MESSAGE_WITH_ACCOUNTS,
				welcome: FirstLaunchConstants.TITLE_MESSAGE	
		};
		
		// Templates to exclude from the accounts list (can be an array if you need more than one)
		// Do not exclude com.palm.palmprofile; the library will do the right thing WRT that template
                var exclude = "com.palm.palmprofile";
		this.$.firstLaunch.startFirstLaunch(exclude, msgs);
		
		// Show your custom UI (optional)
		enyo.asyncMethod(this.$.connectPhoneLayer, "show");
	},
	hideConnectPhone: function() {
		this.$.connectPhone.hide();
	}
});
