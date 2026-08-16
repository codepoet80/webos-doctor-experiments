enyo.kind({
    name: "findApps.MagazineView",
    kind: enyo.VFlexBox,
    components: [{
        flex: 1,
        name: "magazine",
        kind: "enyo.FindApps.Magazine.Magazine",
        className: "enyo-bg",
        onMagazineGoToTarget: "goToTarget"
    }, {
        kind: "findApps.NavigationBar",
        name: "navigationControlsMagazine",
        selectedView: "Issue"
    }],
    create: function() {
        this.inherited(arguments);
        var topContainer = findApps.ViewLibrary._container;
        if (topContainer && topContainer.registerObserver) {
            topContainer.registerObserver("resize", this);
        }
    },
    update: function(eventName) {
        if (this.$.magazine.update) {
            // Send resize event to appcatalog.js only if this is the top view
            // Otherwise, there is no need to refresh the lists
            if (eventName == "resize") {
                if (findApps.ViewLibrary._container.isTopView(this)) {
                    this.$.magazine.update(eventName);
                }
            }
        }
    },
    goToTarget: function(inSender, targetName, params) {
        switch (targetName) {
        case "saved":
            var newView = findApps.ViewLibrary.getView("SAVEDAPPS");
            newView.reset();
            break;
        case "preferences":
            var newView = findApps.ViewLibrary.getView("PREFERENCES");
            newView.reset();
            break;
        case "appdetails":
            var detailView = findApps.ViewLibrary.getView("APPDETAILS");
            detailView.setAppItem(params);
            break;
        case "searchlist":
            if (params) {
                params.hideSearchField = true;
                // Per DFISH-23402, the title that gets shown in the search list scene in case of magazine is not 
                // necessarily generic (will depend upon the magazine author). The title can say "Top Free", but 
                // user can later change to paid / New once he is on Search list scene. The title continues to say
                // "Top Free", causing confusion.
                // As a fix, we do not allow titles to be shown for the search list scene when user comes to that page
                // via the magazine
                // Since some of the existing magazines already published may be passing over title field, overriding the 
                // title to empty here
                params.title = "";
                params.comingFrom = "magazine";
            }
            // MAGSEARCH name is used to construct a Search Apps scene for 
            // a search triggered from magazine (this helps to keep it separate from the normal 
            // search or the develoepr apps search). 
            // Search Apps kind is reused, but a separate instance is used for magazine searches
            var searchAppsKind = findApps.ViewLibrary.getView("MAGSEARCH");
            searchAppsKind.setParams(params);
            break;
        }
    },
    reset: function() {
        this.$.navigationControlsMagazine.setSelectedView("Issue");
    },
    resizeHandler: function() {
        if (findApps.ViewLibrary._container.isTopView(this)) {
            this.inherited(arguments);
        }
    },
    // used to map well known target strings to the corresponding pane view index.
    targetViewMapping: {
        "saved": 2,
        // needed targets, not mapped yet to any specific pane view index.
        "preferences": 5,
        "myAccount": 0,
        "topPaid": 0,
        "topFree": 0,
        "onSale": 0
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
