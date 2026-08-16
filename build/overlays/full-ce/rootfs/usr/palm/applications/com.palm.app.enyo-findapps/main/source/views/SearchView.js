enyo.kind({
    name: "findApps.SearchView",
    kind: enyo.VFlexBox,
    showingBackNavigation: false,
    components: [
    // Search Apps
    {
        flex: 1,
        name: "search_apps",
        kind: "findApps.SearchApps"
    }, {
        kind: "findApps.NavigationBar",
        name: "navigationControlsSearch",
        selectedView: "Search"
    }, {
        kind: "findApps.BackNavigationBar",
        name: "backButtonBar",
        showing: "false"
    }],
    published: {
        "params": {}
    },
    create: function() {
        this.inherited(arguments);
        var topContainer = findApps.ViewLibrary._container;
        if (topContainer && topContainer.registerObserver) {
            topContainer.registerObserver("resize", this);
        }
    },
    update: function(eventName) {
        if (this.$.search_apps.update) {
            // Send resize event to SearchApps only if this is the top view
            // Otherwise, there is no need to refresh the lists
            if (eventName == "resize") {
                if (findApps.ViewLibrary._container.isTopView(this)) {
                    this.$.search_apps.update(eventName);
                }
            } else this.$.search_apps.update(eventName);
        }
    },
    reset: function() {
        /*if(this.showingBackNavigation == false) {
			this.$.backButtonBar.reset();
			this.$.backButtonBar.hide();
			this.$.navigationControlsSearch.show();
			
			this.$.navigationControlsSearch.setSelectedView("Search");
		}*/
        this.updateNavigationBar(this.params);
        this.$.backButtonBar.reset();
        this.$.search_apps.reset();
    },
    updateNavigationBar: function(params) {
    	if((params && params.comingFrom && (params.comingFrom === "details" || params.comingFrom==="magazine"))
    		||
    	   (params && params.type && params.type === "connector")) {
            if (findApps.ViewLibrary._container.isFirstPage()) {
                this.$.backButtonBar.hide();
            } else {
                this.$.backButtonBar.show();
                this.showingBackNavigation = true;
            }
            this.$.navigationControlsSearch.hide();
        } else {
            this.$.backButtonBar.reset();
            this.$.backButtonBar.hide();
            this.$.navigationControlsSearch.show();
            this.$.navigationControlsSearch.setSelectedView("Search");
        }
    },
    paramsChanged: function() {
        this.$.search_apps.setParams(this.params);
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
