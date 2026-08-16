enyo.kind({
    name: "findApps.DetailsView",
    kind: enyo.VFlexBox,
    components: [{
        flex: 1,
        kind: "findApps.Details",
        name: "appDetails"
    }, {
        className: "bottom-shadow",
        style: "margin-top:-9px;"
    }, {
        kind: "findApps.BackNavigationBar",
        name: "backBar"
    }],
    create: function() {
        this.inherited(arguments);
        var topContainer = findApps.ViewLibrary._container;
        if (topContainer && topContainer.registerObserver) {
            topContainer.registerObserver("resize", this);
        }
    },
    update: function(eventName) {
        if (this.$.appDetails.update) {
            // Send resize event to appcatalog.js only if this is the top view
            // Otherwise, there is no need to refresh the lists
            switch (eventName) {
            case ("resize"):
                if (findApps.ViewLibrary._container.isTopView(this)) {
                    this.$.appDetails.update(eventName);
                }
                break;
            default:
                this.$.appDetails.update(eventName);
                break;
            }
        }
    },
    refresh: function() {
        this.$.appDetails.appItemChanged();
    },
    reset: function() {
        // Details view has got selected
        if (this.source && this.source == "devappssearch") {
            // User is coming to this Details view from Dev. Apps
            // In this case - remove Developer Apps and previous Details screens from history
            // The flow is: Details --> Dev. Apps. --> Details. We want to remove the dev. apps search screen and older Details from history
            // Otherwise, this will be a cycle.
            findApps.ViewLibrary.popViewsFromHistory(2);
        }
        this.source = null;
        // Check if this is the only view (this will be the case when App Catalog is launched directly by clicking
        // on some promo code link)
        if (findApps.ViewLibrary._container.isFirstPage()) {
            this.$.backBar.hide();
        } else {
            this.$.backBar.reset();
            this.$.backBar.show();
        }
        // This is to ensure that the reviews list shows up correctly when user comes back to Details page
        this.$.appDetails.refreshLists();
    },
    setAppItem: function(appItem) {
        this.$.appDetails.setAppItem(appItem);
    },
    setSource: function(source) {
        this.source = source;
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
	}
});
