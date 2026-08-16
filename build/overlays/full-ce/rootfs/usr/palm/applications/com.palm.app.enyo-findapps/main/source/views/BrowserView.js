enyo.kind({
    name: "findApps.BrowserView",
    kind: enyo.VFlexBox,
    components: [{
        flex: 1,
        kind: "findApps.AppCatalog",
        name: "browseCategories"
    }, {
        kind: "findApps.NavigationBar",
        name: "navigationControlsBrowser",
        selectedView: "Browser"
    }],
    create: function() {
        this.inherited(arguments);
        var topContainer = findApps.ViewLibrary._container;
        if (topContainer && topContainer.registerObserver) {
            topContainer.registerObserver("resize", this);
        }
    },
    update: function(eventName) {
        if (this.$.browseCategories.update) {
            // Send resize event to appcatalog.js only if this is the top view
            // Otherwise, there is no need to refresh the lists
            switch (eventName) {
            case ("resize"):
                if (findApps.ViewLibrary._container.isTopView(this)) {
                    this.$.browseCategories.update(eventName);
                }
                break;
            }
        }
    },
    refresh: function() {
        this.$.browseCategories.refresh();
    },
    reset: function() {
        this.$.navigationControlsBrowser.setSelectedView("Browser");
        this.$.browseCategories.reset();
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
		if(this.$.browseCategories.prefetch)
			this.$.browseCategories.prefetch();
	}
});
