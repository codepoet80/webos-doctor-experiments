enyo.kind({
    name: "findApps.PreferencesView",
    kind: enyo.VFlexBox,
    components: [{
        name: "acct_preferences",
        kind: "findApps.PreferenceAccount",
        flex: 1
    }],
    reset: function() {
        this.$.acct_preferences.refreshStatus();
    },
    // This method is invoked by downloadstates.js when a callback function has to be registered
    // downloadstates.js calles upon this view when a paid application is to be purchased before downloading
    // and no credit card / OB is set up.
    setCallback: function(callbackFn) {
        this.$.acct_preferences.setCallback(callbackFn);
    },
    // This method is invoked when the Payment Set up screen has to be shown
    // It is used by downloadstates, when a user is made to set up payment before an item can be purchased
    setShowPaymentSetup: function(showPaymentSetup) {
        this.$.acct_preferences.setShowPaymentSetup(showPaymentSetup);
    },
    setParams: function(params) {
        this.$.acct_preferences.setParams(params);
    },
    resizeHandler: function() {
        if (findApps.ViewLibrary._container.isTopView(this)) {
            this.inherited(arguments);
        }
    }
    ,
    getAppMenuOptions: function() {
    	return {
    		softwareManager: {disabled: false, show: true},
    		helpMenu: {disabled: false, show: true}
		}
	}
});
