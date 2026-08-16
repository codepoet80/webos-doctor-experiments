enyo.kind({
    name: "findApps.SavedView",
    kind: enyo.VFlexBox,
    components: [
    // Saved Apps
    {
        flex: 1,
        name: "saved",
        className: "enyo-bg",
        kind: "findApps.SavedApps"
    }, {
        kind: "findApps.NavigationBar",
        name: "navigationControlsSave",
        selectedView: "Saved"
    }],
    reset: function() {
        this.$.navigationControlsSave.setSelectedView("Saved");
        this.$.saved.getSavedList(true);
    },
    create: function() {
        this.inherited(arguments);
        var topContainer = findApps.ViewLibrary._container;
        if (topContainer && topContainer.registerObserver) {
            topContainer.registerObserver("resize", this);
        }
    },
    update: function(eventName) {
        if (this.$.saved.update) {
            // Send resize event to Saved Apps (bookmarks) only if this is the top view
            // Otherwise, there is no need to refresh the lists
            if (eventName == "resize") {
                if (findApps.ViewLibrary._container.isTopView(this)) {
                    this.$.saved.update(eventName);
                }
            } else this.$.saved.update(eventName);
        }
    },
    resizeHandler: function() {
        if (findApps.ViewLibrary._container.isTopView(this)) {
            this.inherited(arguments);
        }
    }
    ,
    getAppMenuOptions: function() {
    	return {
    		accountOption: {disabled: false, show: true},
    		softwareManager: {disabled: false, show: true},
    		helpMenu: {disabled: false, show: true}
		}
	},
	prefetch: function() {
		if(this.$.saved.prefetch)
			this.$.saved.prefetch();
	}
});
