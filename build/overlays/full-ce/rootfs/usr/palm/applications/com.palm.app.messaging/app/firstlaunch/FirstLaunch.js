enyo.kind({
	name: "FirstLaunch",
	kind: "enyo.VFlexBox",
	events: {
		onFirstLaunchDone: ""
	},
	components: [
	    {
	    	kind: "firstLaunchView",
	    	iconSmall: "images/messaging-48x48.png",	// Path to small icon used for title bar
	    	iconLarge: "icon-256x256.png",	 		// Path to large icon used for Welcome page
	    	/*
	    	components: [
				{name: "connectPhoneLayer", layoutKind: "VFlexLayout", className:"box-center", style:"margin-top:0", components: [
					{kind: "ConnectPhone", firstLaunch: true, onComplete: "done"}
				]}
			],
			*/	
	    	onAccountsFirstLaunchDone: "done",	
	    	capability: "MESSAGING"							
	    } 
	],
	create: function() {
		this.inherited(arguments);
		
		this.accountService = enyo.application.accountService;
		if (this.accountService) {
			this.accountService.register(this, this.accountsUpdated.bind(this));
		}
	},
	rendered: function() {
		this.inherited(arguments);
		
		var msgs = {
				pageTitle: FirstLaunchConstants.TITLE_MESSAGE_WITH_ACCOUNTS,
				welcome: FirstLaunchConstants.TITLE_MESSAGE	
		};
		
		// Templates to exclude from the accounts list (can be an array if you need more than one)
		// Do not exclude com.palm.palmprofile; the library will do the right thing WRT that template
		var exclude = "com.palm.palmprofile"; 
		this.$.firstLaunchView.startFirstLaunch(exclude, msgs);
		
		/** To fix DFISH-28718
		// Show your custom UI (optional)
		enyo.asyncMethod(this.$.connectPhoneLayer, "show");
		
		this.$.connectPhone.subscriptToTelephony();
		*/
	}, 
	accountsUpdated: function() {
		//this.$.connectPhone.accountsUpdated(this.accountService.getImAccounts());
	},
	done: function() {
		this.unregisterServices();
		this.doFirstLaunchDone();
	}, 
	unregisterServices: function() {
		this.accountService.unregister(this);
	}
});