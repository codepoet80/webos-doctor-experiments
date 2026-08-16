enyo.kind({
    name: "findApps.OBSetupView",
    kind: enyo.VFlexBox,
    components: [{
        name: "obSetup",
        kind: "findApps.CarrierInfo",
        flex: 1
    }],
    reset: function() {
        this.$.obSetup.refreshStatus();
    },
    // This method is invoked by downloadstates.js when a callback function has to be registered
    // downloadstates.js calles upon this view when a paid application is to be purchased before downloading
    // and no credit card / OB is set up.	
    setCallback: function(callback) {
        this.$.obSetup.setCallback(callback);
    },
    setModalMode: function(inModalMode) {
        this.$.obSetup.setModalMode(inModalMode);
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
