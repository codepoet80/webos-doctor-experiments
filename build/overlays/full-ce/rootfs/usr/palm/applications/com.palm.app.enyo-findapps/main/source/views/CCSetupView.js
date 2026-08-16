enyo.kind({
    name: "findApps.CCSetupView",
    kind: enyo.VFlexBox,
    components: [{
        name: "ccSetup",
        kind: "findApps.CreditCardInfo",
        flex: 1
    }],
    reset: function() {
        this.$.ccSetup.refreshStatus();
    },
    // This method is invoked by downloadstates.js when a callback function has to be registered
    // downloadstates.js calles upon this view when a paid application is to be purchased before downloading
    // and no credit card / OB is set up.	
    setCallback: function(callback) {
        this.$.ccSetup.setCallback(callback);
    },
    setModalMode: function(inModalMode) {
        this.$.ccSetup.setModalMode(inModalMode);
    },
    resizeHandler: function() {
        if (findApps.ViewLibrary._container.isTopView(this)) {
            this.inherited(arguments);
        }
    },
    getAppMenuOptions: function() {
    	return {
    		softwareManager: {disabled: false, show: true},
    		helpMenu: {disabled: false, show: true}
		}
	}
});
