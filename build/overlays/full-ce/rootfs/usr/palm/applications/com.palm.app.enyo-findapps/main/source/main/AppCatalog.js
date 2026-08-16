enyo.kind({
    name: "findApps.AppCatalog",
    kind: enyo.VFlexBox,

    storedQueries: null,
    _selectedCatIndex: 0,
    components: [{
        kind: "Scrim",
        name: "scrim",
        layoutKind: "VFlexLayout",
        animateShowing: false,
        align: "center",
        pack: "center",
        components: [{
            kind: "SpinnerLarge",
            name: 'spinner',
            showing: false
        }]
    },
    // Error dialog
    {
        kind: "findApps.Error"
    }, {
        kind: "VFlexBox",
        align: "center",
        pack: "center",
        className: "radiohead",
        components: [{
            kind: "RadioGroup",
            name: "stored_queries",
            onChange: "storedQuerySelected",
            components: [{
                name: "stored_query_1",
                label: $L("Top")
            },/* { //removed by codepoet, June 2026
                label: $L("Paid")
            }, {
                label: $L("Free")
            },*/ {
                label: $L("New")
            }]
        }, ]
    }, {
        kind: "Pane",
        name: "pane",
        flex: 1,
        className: "pane",
        components: [
        // Browser section
        {
            name: "browser",
            kind: "HFlexBox",
            className: "enyo-bg",
            components: [
            // Categories
            {
                name: "categories",
                kind: "findApps.Categories",
                flex: 0,
                width: "240px",
                onCategoryClick: "updateApps"
            },
            // Applications
            {
                name: "apps",
                kind: "findApps.Apps",
                flex: 1,
                onShowScrim: "showScrim",
                onHideScrim: "hideScrim",
                onGotError: "handleGetAppsError",
                onAppItemClick: "showAppDetails"
            }]
        }]
    }, {
        name: "app_save",
        kind: "findApps.SaveButton",
        showing: false
    }, ],
    create: function() {
        this.inherited(arguments);
        this.appMetrics = enyo.application.appMetrics;
        this.firstLaunch = true;
        // Flag to indicate if this AppCatalog has registered with Container to receive 
        // an event when /user/session is successful
        this.registered = false;
    },
    constructed: function() {
        this.inherited(arguments);
        //TODO: Remove hacks.js once this is the primary view (hack taken from Calendar)
        typeof HACKS != "undefined" && HACKS.HACK_ENYO_DEFAULT_GUI_EVENT_HANDLER(this);
    },
    showAppDetails: function(inSender, inResponse) {
        var detailView = findApps.ViewLibrary.getView("APPDETAILS");
        detailView.setAppItem(inResponse);
    },
    updateApps: function(inSender, selectedCatIndex) {
        var categoryIdx = selectedCatIndex || this._selectedCatIndex;
        var userSession = findApps.UserSession.getSession();
        if(userSession!=null) {
	        var selectedCategory = userSession.categories[categoryIdx];
	        var category_id = selectedCategory.id;
	        // HOME Category
	        if (category_id == 0) {
	            this.storedQueries = userSession.queryButtons.HOME;
	            this.storedQueriesType = "HOME";
	            this.$.apps.setStoredQuery(this.getQueryByButtonIndex());
	            if (this.appMetrics) this.appMetrics.trackNewScene("categories/home");
	            // Update the filter label
	            this.$.stored_query_1.setCaption($L("Recommended"));
	        }
	        // OTHER Categories 
	        else {
	            this.storedQueries = userSession.queryButtons.DEFAULT;
	            this.storedQueriesType = "DEFAULT";
	            this.$.apps.setStoredQuery(this.getQueryByButtonIndex());
	            if (this.appMetrics) this.appMetrics.trackNewScene("categories/" + selectedCategory.label);
	            // Update the filter label
	            this.$.stored_query_1.setCaption($L("Top"));
	        }
	        this.$.apps.setTopCategory(selectedCategory);
	        this.$.apps.refresh();
	        this.$.categories.setCurrentSelectRowIndex(categoryIdx);
	        this.$.apps.renderSubCategories();
        }
        // OTHER Categories 
        else {
            this.storedQueries = userSession.queryButtons.DEFAULT;
            this.storedQueriesType = "DEFAULT";
            this.$.apps.setStoredQuery(this.getQueryByButtonIndex());
            if (this.appMetrics) this.appMetrics.trackNewScene("categories/" + selectedCategory.label);
            // Update the filter label
            this.$.stored_query_1.setCaption($L("Top"));
        }
        this.$.apps.setTopCategory(selectedCategory);
        this.$.apps.refresh();
        this.$.categories.setCurrentSelectRowIndex(categoryIdx);
        this.$.apps.renderSubCategories();
    },
    receiveResponse: function(event, success, errors) {
    	if(event === "userSession") {
    		enyo.application.sessionManager.removeListener(this, "userSession");
	    	if(success) {
	    		if (findApps.ViewLibrary._container.isTopView(this.owner))
	    			this.reset();
	    		else
	    			this.prefetch();
	    	}
	    	else {
	    		if (findApps.ViewLibrary._container.isTopView(this.owner)) {
		    		errors.push("LOC06006");
		    	    this.displayError(errors);
	    		}
	    	}
    	}
    },
    prefetch: function() {
    	// Check that /user/session call is made
        var sessionStatus = enyo.application.sessionManager.triggerInitSession(this);
        if(sessionStatus && sessionStatus.status === "inprogress") {
        	// Wait for the /user/session call to be over
        	return;
        }
        // /user/session data is available
        var userSession = findApps.UserSession._session;
        // Check that the /user/session response contains a category and query button HOME
        // If not present, error case, do nothing
        if ((userSession.queryButtons && userSession.queryButtons.HOME && userSession.queryButtons.HOME.length == 0) || (userSession.categories && userSession.categories.length == 0)) {
            // This is an error in /user/session response
            return;
        }
        
        if (this.firstLaunch) {
            this.$.stored_queries.setValue(0);
            this.storedQueries = userSession.queryButtons.HOME;
            this.$.categories.setCategories(userSession.categories);
            // INFO: order is important here, change to find the right query id for the sequences different
            this.storedQueriesType = "HOME";
            this.$.apps.setStoredQuery(this.getQueryByButtonIndex());
            this.$.apps.setTopCategory(userSession.categories[0]);
            this.$.apps.setAppFilter();
            
            this.$.apps.refresh();
            this.$.categories.refresh();
            this.firstLaunch = false;
            // Update the filter label
            this.$.stored_query_1.setCaption($L("Recommended"));
            return;
        }
    },
    reset: function() {
    	
    	// Check that /user/session call is made
        var sessionStatus = enyo.application.sessionManager.triggerInitSession(this);
        if(sessionStatus && sessionStatus.status === "inprogress") {
        	this.showScrim();
        	// Wait for the /user/session call to be over
        	return;
        }
        // /user/session data is available
        var userSession = findApps.UserSession._session;
        // Check that the /user/session response contains a category and query button HOME
        // If not show an error
        if ((userSession.queryButtons && userSession.queryButtons.HOME && userSession.queryButtons.HOME.length == 0) || (userSession.categories && userSession.categories.length == 0)) {
            // This is an error in /user/session response
            this.displayError(["LOC06005"]);
            return;
        }
        
        if (this.firstLaunch) {
            this.showScrim();
            this.$.stored_queries.setValue(0);
            this.storedQueries = userSession.queryButtons.HOME;
            this.$.categories.setCategories(userSession.categories);
            // INFO: order is important here, change to find the right query id for the sequences different
            this.storedQueriesType = "HOME";
            this.$.apps.setStoredQuery(this.getQueryByButtonIndex());
            this.$.apps.setTopCategory(userSession.categories[0]);
            this.$.apps.setAppFilter();
            this.$.apps.refresh();
            this.$.categories.refresh();
            this.firstLaunch = false;
            // Update the filter label
            this.$.stored_query_1.setCaption($L("Recommended"));
            return;
        }
        
        // In case, the control comes here, reset has been called because this view got selected on coming back
        // from some screen
        // Only thing to do is to refresh the lists so that they are rendered automatically (and user does not need to 
        // click something for the lists to appear)
        this.$.apps.refreshList();
        this.$.categories.refresh();
        if (this.$.apps.isEmpty()) {
            this.refresh();
        }
    },
    refresh: function() {
        this.updateApps();
    },
    storedQuerySelected: function(inSender) {
        var query = this.getQueryByButtonIndex();
        this.$.apps.setStoredQuery(query);
        this.$.apps.refresh(true);
        if (this.appMetrics) this.appMetrics.trackEvent("stored_query/storedQuerySelected");
    },
    handleGetAppsError: function(inSender, errors) {
        this.hideScrim();
        errors.push("LOC06008");
        this.displayError(errors);
    },
    hideScrim: function() {
        if (this.$.scrim) {
            this.$.scrim.hide();
            this.$.spinner.setShowing(false);
        }
    },
    showScrim: function() {
        if (this.$.scrim) {
            this.$.scrim.show();
            this.$.spinner.setShowing(true);
        }
    },
    update: function(eventName, params) {
        switch (eventName) {
        case "resize":
            // Refresh the list display
            this.$.apps.refreshList();
            this.$.categories.refresh();
            break;
        }
    },
    //Utility methods
    displayError: function(errors) {
        // Stop the scrim
        this.hideScrim();
        if (findApps.ViewLibrary._container.isTopView(this.owner))
        	this.$.error.displayError(errors);
    },
    //Get query by query button index from this.storedQueries
    getQueryByButtonIndex: function() {
        // Default the button sequence: Top, Paid, Free, New
        var _homeQueryItems = ["HOME-DartfishQuery1", "HOME-DartfishQuery2", "HOME-DartfishQuery3", "HOME-DartfishQuery4"];
        var _defaultQueryItems = ["DEFAULT-DartfishQuery5", "DEFAULT-DartfishQuery6", "DEFAULT-DartfishQuery7", "DEFAULT-DartfishQuery8"];
        var queryItems = _homeQueryItems;
        if (this.storedQueriesType === "DEFAULT") {
            queryItems = _defaultQueryItems;
        }
        var storedQuerySelected = this.$.stored_queries.getValue();
        var queries = this.storedQueries;
        for (var i = 0; i < queries.length; i++) {
            if (queries[i].queryId === queryItems[storedQuerySelected]) {
                return queries[i];
            }
        }
    }
});
