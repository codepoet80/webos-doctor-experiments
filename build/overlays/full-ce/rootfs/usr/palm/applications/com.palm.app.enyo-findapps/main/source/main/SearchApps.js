enyo.kind({
    name: "findApps.SearchApps",
    kind: "VFlexBox",
    published: {
        params: {},
        categories: [],
        storedQueries: null,
        storedCategoryId: "",
        storedQuery: {
            queryId: "",
            queryFragment: ""
        }
    },
    events: {},
    components: [ //Scrim control
    {
        kind: "Scrim",
        name: "scrim",
        layoutKind: "VFlexLayout",
        align: "center",
        pack: "center",
        animateShowing: false,
        components: [{
            kind: "SpinnerLarge",
            name: 'spinner',
            showing: false
        }]
    }, //Error dialog
    {
        kind: "findApps.Error",
        onSubmit: "submitError",
        onCancel: "cancelError"
    }, {
        name: "searchHeader",
        className: "enyo-header",
        components: [{
            style: "margin-top:6px;",
            components: [{
                kind: "SearchInput",
                name: "search_field",
                width: "448px",
                style: "margin:0px auto 6px auto;",
                hint: $L("Type search terms here..."),
                changeOnInput: "true",
                // Real Time Search
                onchange: "searchInputChange",
                onkeypress: "onKeyPress",
                onSearch: "searchHandler",
                autoCapitalize: "lowercase",
                spellcheck: false,
                autocorrect: false,
                onCancel: "cancelSearch"
            }, {
                name: "searchTitleHeader",
                kind: "HFlexBox",
                pack: "center",
                align: "center",
                style: "text-align: center; line-height: 38px;",
                components: [{
                    name: "headerIcon",
                    style: "margin-right: 10px",
                    showing: false, 	 // this icon is no longer visible [DFISH-20982]
                    kind: enyo.Image
                }, {
                    name: "headerTitle",
                    kind: enyo.Control
                }]
            }]
        }]
    }, {
        name: "emptyInstructions",
        height: "1024px",
        showing: true,
        style: "text-align:center;background-color:#e7e7e7;",
        components: [{
            className: "top-shadow",
            style: "width:100%"
        }, {
            kind: "VFlexBox",
            width: "560px",
            style: "margin:auto;color:#46484b;",
            components: [{
                name: "bigSearchIcon",
                style: "margin:168px 0 0 0;",
                kind: enyo.Image,
                src: 'images/empty-scene-search-icon.png'
            }, {
                name: 'description',
                content: $L("Type here to search for apps in App Catalog")
            }]
        }]
    }, {
        name: "search_info",
        height: "50px",
        className: "search-info",
        showing: false,
        style: "",
        content: $L("")
    }, {
        kind: "Pane",
        name: "pane",
        flex: 1,
        className: "pane",
        components: [{
            name: "search_result",
            kind: "HFlexBox",
            horizontal: false,
            autoHorizontal: false,
            showing: false,
            components: [ // Search Categories
            {
                className: "top-shadow"
            }, {
                className: "right-shadow"
            }, {
                name: "search_categories",
                className: "category-list",
                kind: "VirtualList",
                onSetupRow: "setupCategoriesRow",
                width: "240px",
                components: [{
                    name: "categoryItem",
                    kind: "Item",
                    tapHighlight: true,
                    style: "",
                    components: [{
                        kind: "HFlexBox",
                        onclick: "categoryClicked",
                        align: "center",
                        components: [{
                            name: "category_icon",
                            kind: "Image"
                        }, {
                            name: "category_name",
                            className: "search-category-name",
                            flex: 1
                        }, {
                            name: "category_count",
                            className: "search-category-count"
                        }]
                    }]
                }]
            }, {
                kind: "VFlexBox",
                flex: 1,
                components: [{
                    kind: "HFlexBox", 
                    components: [{
                        kind: "VFlexBox",
                        align: "center",
                        pack: "center",
                        className: "radiohead",
                        flex:1,
                        components: [{
                            kind: "RadioGroup",
                            name: "stored_queries",
                            onChange: "storedQuerySelected",
                            // width is reduced from 440 to 420 so that all the components fit in portrait mode
                            width: "420px",
                            components: [{
                                label: $L("Top")
                            },/* {  // removed by codepoet, June 2026
                                label: $L("Paid")
                            }, {
                                label: $L("Free"), name: "freeLabel"
                            },*/ {
                                label: $L("New"), name: "newLabel"
                            }]
                        }]
                    }, {
                        // App filter selector for touchpad only/phone only/all feature
                        kind: "ListSelector",
                        className: "radiohead",
                        name: "app_filter_selector",
                        onChange: "appFilterChanged",
                        showing: false,
                        items: [
                            {caption: $L("All"), value: "all"},
                            {caption: $L("TouchPad"), value: "touchpad_exclusive"},
                            {caption: $L("Phone"), value: "phone_exclusive"}
                        ]
                    }
                ]}, {
                    className: "apps-shadow"
                }, {
                    name: "noFoundInstructions",
                    flex: 1,
                    showing: false,
                    style: "text-align:center;background-color:#e7e7e7;",
                    components: [{
                        kind: "VFlexBox",
                        width: "500px",
                        style: "margin:auto;color:#46484b;",
                        components: [{
                            style: "margin:20px 0 0 0;",
                            kind: enyo.Image,
                            src: 'images/empty-scene-search-icon.png'
                        }, {
                            content: $L("Sorry, the search did not find any matching apps. Check your spelling or try a new entry.")
                        }]
                    }]
                }, {
                    flex: 1,
                    name: "app_list1",
                    kind: "findApps.AppList",
                    onAcquirePage: "acquireNextPage"
                }]
            }]
        }]
    }],
    create: function() {
        this.inherited(arguments);
        //this.firstLaunch = true;
        this.selectedCategoryIndex = 0;
    },
    
	appFilterChanged: function(inSender, inValue, inOldValue) {
        if(inValue !== inOldValue) {
            this.appFilterType = inValue;
            enyo.setCookie("findapps.appFilterTypeSearch", this.appFilterType);
            
            this.resetCategorySelection();
            this.launchSearch(null, null);
        }
    },
    receiveResponse: function(event, success, errors) {
    	if(event === "userSession") {
    		enyo.application.sessionManager.removeListener(this, "userSession");
	    	if(success) {
	            this.reset();
	            this.entryPointMethod();
	    	}
	    	else {
	    		errors.push("LOC08000");
	    	    this.displayError(errors);
	    	}
    	}
    },
    setupCategoriesRow: function(inSender, inIndex) {
        var categoryItem = this.fetchCategoryItem(inIndex);
        if (categoryItem) {
            var categoryInfo = findApps.BaseServer.getCategoryInfo(categoryItem.id);
            if (categoryInfo) {
                this.$.category_name.setContent(categoryInfo.label);
                this.$.category_icon.setSrc(categoryInfo.icon);
                this.$.category_count.setContent(categoryItem.count);
                // Highlight the user selected category 
                var isRowSelected = (inIndex == this.selectedCategoryIndex);
                if (isRowSelected) {
                    this.$.categoryItem.addClass("enyo-held");
                } else {
                    this.$.categoryItem.removeClass("enyo-held");
                }
                return true;
            } else {
                //this.log("SearchApps:Could not retrieve information for category with ID", categoryItem.id);
            }
        }
    },
    fetchCategoryItem: function(index) {
        return this.categories ? this.categories[index] : null;
    },
    executeSearch: function(params) {
        if (params) {
            this.$.scrim.show();
            this.$.spinner.setShowing(true);
            this.searchParams = {
                includeCategoryBreakdown: true
            };
            this.searchParams = enyo.mixin(this.searchParams, params);
            if (this.connectors != "") {
                this.searchParams.provides = this.connectors;
            }
            if (!this.searchParams.sort) this.searchParams.sort = "NAME_ASC";
            // Add a co-relation parameter that can be used to deal with out of order responses
            this.lastServerCallTimestamp = new Date().getTime();
            this.searchParams.corelationId = this.lastServerCallTimestamp;
            this.totalCount = 0;
            this.endPosition = -1;
            // Add appFilterType parameter for application filter
            if(this.appFilterOn === true) {
                this.searchParams.appFilterType = this.appFilterType;
            }
            
            var callParams = {};
            callParams = enyo.mixin(callParams, this.searchParams);
            
            findApps.BaseServer.getACServer().getAppList(callParams, "SearchAppsService", {
                onSuccess: "gotApps",
                onFailure: "gotError",
                scope: this
            });
        }
    },

    reset: function() {
    	if(this.autoSearchDelay === undefined) {
	    	if (findApps.UserSession._session != null && findApps.UserSession._session.supportInfo) {
	            this.autoSearchDelay = findApps.UserSession._session.supportInfo.autoSearchDelay;
	            this.autoSearchEnabled = findApps.UserSession._session.supportInfo.autoSearchEnabled;
	            
	            if (this.autoSearchDelay === undefined || this.autoSearchDelay === null) {
	                this.autoSearchDelay = 100; // default
	            }
	            if (this.autoSearchEnabled === undefined || this.autoSearchEnabled === null) {
	                this.autoSearchEnabled = true; // default enable auto search
	            }
	            if (this.autoSearchEnabled) {
	                this.$.search_field.setKeypressInputDelay(this.autoSearchDelay);
	            }
	   		 }
    	}
    	if(this.appFilterOn === undefined) {
    		if (findApps.UserSession._session != null && findApps.UserSession._session.supportInfo) {
		    	this.appFilterOn = findApps.UserSession._session.supportInfo.appFilterOn;
			    if(this.appFilterOn && this.appFilterOn===true) {
			        this.$.newLabel.setShowing(false);
			        // Need to update the class for Free so that if New is hidden, the border of Free looks proper
			        this.$.freeLabel.removeClass("enyo-middle");
			        this.$.freeLabel.addClass("enyo-last");
			        this.$.app_filter_selector.setShowing(true);
			        this.appFilterType = enyo.getCookie("findapps.appFilterTypeSearch") || "all";
			        this.$.app_filter_selector.setValue(this.appFilterType);
			    }
    		}
    	}
        // If storedQueries is null, get the queryButtons from user session
        if (this.storedQueries == null) {
        	var userSession = findApps.UserSession.getSession();
            // Check that the /user/session response contains query button DEFAULT
            if (userSession != null && userSession.queryButtons && userSession.queryButtons.DEFAULT) {
                this.$.stored_queries.setValue(0);
                this.storedQueries = userSession.queryButtons.DEFAULT;
                this.storedQueriesType = "DEFAULT";
                this.storedQuery = this.getQueryByButtonIndex();
            }
        }
        // In case, the control comes here, reset has been called because this view got selected on coming back
        // from some screen
        // Only thing to do is to refresh the lists so that they are rendered automatically (and user does not need to 
        // click something for the lists to appear)
        this.$.app_list1.refresh();
        this.$.search_categories.refresh();
        // APPC-6990: focus search input field and let virtual keyboard pop out
        // Pop out keyboard only if there is nothing in the search field
        if (enyo.string.trim(this.$.search_field.getValue()).length == 0)
        	this.$.search_field.forceFocus();
    },
    refresh: function() {
    	var userSession = findApps.UserSession.getSession();
    	if(userSession!=null) {
	        if (this.$.search_field.getValue()) {
	            this.resetCategorySelection();
	            this.launchSearch(this, {
	                rowIndex: -1
	            });
	        }
    	}
    },
    searchInputChange: function(inSender, inEvent) {
        if (this.autoSearchEnabled) {
            this.resetCategorySelection();
            this.launchSearch(inSender, inEvent);
        }
    },
    onKeyPress: function(inSender, inEvent){
        if(inEvent.charCode == 13){
            this.searchInputChange(inSender, inEvent);
            this.$.search_field.forceBlur();
        }
    },
    // enyo 0.10 onwards - Event raised when search is canceled. Search text is cleared
    cancelSearch: function(inSender, inEvent) {
        // Reset the Top / Paid / Free selection if any
        this.$.stored_queries.setValue(0);
        this.resetCategorySelection();
        this.launchSearch(inSender, inEvent);
    },
    searchHandler: function(inSender, inEvent) {
        this.resetCategorySelection();
        this.launchSearch(inSender, inEvent);
        inSender.forceBlur();
    },
    launchSearch: function(inSender, inEvent) {
        var params;
        this.hideNoApp();
        if (this.searchFieldSearch == true) {
            // no need to query the server if there are queryStr
            if (enyo.string.trim(this.$.search_field.getValue()).length == 0) {
                this.$.search_result.hide();
                this.$.search_field.setHint($L("Type search terms here..."));
                this.$.emptyInstructions.show();
                return;
            }
            params = {
                queryStr: enyo.string.trim(this.$.search_field.getValue()),
                qid: this.storedQuery.queryId,
                queryFragment: this.storedQuery.queryFragment,
                categoryid: this.storedCategoryId
            };
        } else {
            params = {};
            params = enyo.mixin(params, this.params);
            // This is to ensure that the right category gets
            // passed in the query.
            // This has to be set after the mixin call
            params.categoryid = this.storedCategoryId;
            // set the query id and fragment into params
            if (!params.qid) params.qid = this.storedQuery.queryId;
            if (!params.queryFragment) params.queryFragment = this.storedQuery.queryFragment;
        }
        this.$.scrim.show();
        this.$.spinner.setShowing(true);
        // setTimeout(this.executeSearch(params), 100); // define search timeout here
        this.executeSearch(params);
    },
    categoriesChanged: function() {
        if (this.totalCount >= 0) {
            this.categories.unshift({
                id: "",
                count: this.totalCount
            }); // this is an extra All results category
        }
        this.$.search_categories.punt();
    // punt rebuilds the component from start state according to code documentation (ScrollingList.js line#79)
    // so no need to call resized afterwards, which is an expensive function
    //this.$.search_categories.resized();
    },
    paramsChanged: function() {
        this.hideNoApp();
        this.$.scrim.show();
        this.$.spinner.setShowing(true);
        // Check that /user/session call is made
        var sessionStatus = enyo.application.sessionManager.triggerInitSession(this);
        if(sessionStatus && sessionStatus.status === "inprogress") {
        	// Wait for the /user/session call to be over
        	return;
        }
        else
        	this.entryPointMethod();
    },
    // Method invoked by Container when user session is received
    update: function(eventName, params) {
        if (eventName == "resize") {
            // Refresh the list display
            this.$.app_list1.resized();
            this.$.search_categories.resized();
            this.$.app_list1.refresh();
            this.$.search_categories.refresh();
        }
    },
    listResized: function() {
        this.$.app_list1.resized();
        this.$.search_categories.resized();
        this.$.app_list1.refresh();
        this.$.search_categories.refresh();
    },
    entryPointMethod: function() {
        if (this.$.scrim) {
            this.$.scrim.hide();
            this.$.spinner.setShowing(false);
        }
        var invokeSearch = true;
        
        this.connectors = "";
        
        
        this.selectedCategoryIndex = 0;
        this.categorySearch = false;
        // Check if the search field has to be hidden or when this is a cross launch for synergy search, with type=connector
        if ((this.params.hideSearchField && this.params.hideSearchField == true) || (this.params.type && this.params.type == "connector")) {
            this.searchFieldSearch = false;
            this.$.search_field.hide();
            if (this.params.title) this.$.headerTitle.setContent(this.params.title);
            else this.$.headerTitle.setContent("");
            // Synergy search
            if (this.params.type && this.params.type == "connector") {
                
                var synergyTitle = $L("Synergy Services");
                if (this.params.connectorInfo && this.params.connectorInfo.searchBarTitle && this.params.connectorInfo.searchBarTitle != '') {
                    synergyTitle = this.params.connectorInfo.searchBarTitle;
                }
                this.$.headerTitle.setContent(synergyTitle);
                var synergyIcon = "images/appcatalog.png";
                if (this.params.connectorInfo && this.params.connectorInfo.searchBarIcon && this.params.connectorInfo.searchBarIcon != '') {
                    synergyIcon = this.params.connectorInfo.searchBarIcon;
                }
                this.$.headerIcon.setSrc(synergyIcon);
                // Build a synergy connector string
                if (this.params.connectorInfo && this.params.connectorInfo.types) {
                    // We must prepend "connector/" to all connector strings for ACS
                    for (var i = 0; i < this.params.connectorInfo.types.length; i++) {
                        var ct = this.params.connectorInfo.types[i];
                        if (ct !== 'noApp' && ct !== 'dockMode' && ct !== 'universalSearch') {
                            this.params.connectorInfo.types[i] = 'connector/' + this.params.connectorInfo.types[i].toUpperCase();
                        }
                    }
                    this.connectors = this.params.connectorInfo.types.join(",");
                }
            }
            // Forget any previously stored category id value
            // This is required so that any previous filters are not remembered when starting a fresh search
            this.storedCategoryId = "";
            this.params.categoryid = "";
            
            if(this.$.headerTitle.getContent() === "") {
                this.$.searchHeader.hide();
            }
            else {
                this.$.searchTitleHeader.show();
                this.$.searchHeader.show();
            }	
        } else {
            // Normal search
            this.$.search_field.show();
            this.$.searchHeader.show();
            // Fetch any filters that user may have selected previously
            // Since we share the searchapps screen for normal search (by user typed text) and also direct searches
            // launched from magazine / details page
            // storedCategoryId and storedQuery values may have got updated if a direct search was launched after a normal search
            this.storedCategoryId = this.userSelectedCategoryId || "";
            this.storedQuery = this.userSelectedStoredQuery;
            if (this.params.type && this.params.type == "query") // Universal search 
            {
                
                this.params.queryStr = decodeURIComponent(this.params.search);
            }
            if (this.params.queryStr) this.$.search_field.setValue(this.params.queryStr);
            else {
                this.params.queryStr = this.$.search_field.getValue();
                this.params.categoryid = this.userSelectedCategoryId || "";
                this.params.qid = this.userSelectedStoredQuery ? this.userSelectedStoredQuery.queryId : undefined;
                this.params.queryFragment = this.userSelectedStoredQuery ? this.userSelectedStoredQuery.queryFragment : undefined;
                // No search term
                if (enyo.string.trim(this.$.search_field.getValue()) == "") {
                    this.$.search_result.hide();
                    this.$.search_field.setHint($L("Type search terms here..."));
                    this.$.emptyInstructions.show();
                    invokeSearch = false;
                } else {
                    // No need to launch search again since the results are already being displayed.
                    // At this point this.searchFieldSearch still indicates the previously launched search type
                    if (this.searchFieldSearch == true) {
                        invokeSearch = false;
                    }
                }
            }
            this.$.searchTitleHeader.hide();
            // To indicate that the currently launched search is a normal search
            this.searchFieldSearch = true;
        }
        // Check if the user is coming here from details scene - by clicking developer apps
        if (this.params.comingFrom && this.params.comingFrom == "details") {

            // Set the searchListType on searchAppList to search for dev. apps, coming from Details page
            this.$.app_list1.searchListType = "devappssearch";
        } else {
            // Set the searchListType on app_list1 to normal search
            this.$.app_list1.searchListType = "directsearch";
        }
        var params = this.params;
        // Select the right query button
        var qidIndex = this.getButtonIndexByQId(params.qid);
        this.$.stored_queries.setValue(qidIndex);
        var userSession = findApps.UserSession.getSession();
        // Check that the /user/session response contains query button DEFAULT
        if (userSession != null) {
            if (userSession.queryButtons && userSession.queryButtons.DEFAULT) {
                this.storedQueries = userSession.queryButtons.DEFAULT;
                this.storedQueriesType = "DEFAULT";
                this.storedQuery = this.getQueryByButtonIndex();
                if (!params.qid) params.qid = this.storedQuery.queryId;
                if (!params.queryFragment) params.queryFragment = this.storedQuery.queryFragment;
            }
        }
        // Normal search
        if (this.searchFieldSearch == true) {
            this.userSelectedCategoryId = "";
            this.userSelectedStoredQuery = this.storedQuery;
        }
        // run the search
        if (invokeSearch == true) {
            this.executeSearch(params);
        }
    },
    gotApps: function(inSender, inResponse, inRequest, props) {
        // Make sure that the response received is not out of order, i.e. not a response for some older request
        // Compare the corelationId field in request with this.lastServerCallTimestamp
        if (inRequest && inRequest.params) {
            var requestObj = JSON.parse(inRequest.params);
            var corelationId = requestObj.corelationId;
            if (corelationId && corelationId != this.lastServerCallTimestamp) {
                // Response is stale, for some older request, ignore the response
                return;
            }
        }
        if (inResponse.OutGetAppList) {
            this.$.scrim.hide();
            this.$.spinner.setShowing(false);
            if (props.service && props.service == "SearchAppsService") {
                this.totalCount = inResponse.OutGetAppList.appList.totalCount;
                // Check to show the list area, note this function must be here, after got the totalCount, 
                // and before set the list, else will display not correctly.
                this.displaySearchedResult();
                if (inResponse.OutGetAppList.appList.appSummary) this.endPosition = inResponse.OutGetAppList.appList.appSummary.length;
                if (inResponse.OutGetAppList.appList.appSummary) this.$.app_list1.setAppList(inResponse.OutGetAppList.appList.appSummary.length > 1 ? inResponse.OutGetAppList.appList.appSummary : [inResponse.OutGetAppList.appList.appSummary]);
                else this.$.app_list1.setAppList([]);
                // In case the search is triggered by a category selection, we do not want to refresh the
                // category list
                // Categories should be refreshed only if this is the search result for 
                // typed text / query buttons
                if (!this.categorySearch || this.categorySearch == false) {
                    this.categories = findApps.BaseServer.getRelevantSearchCategories(inResponse.OutGetAppList.categories) || [];
                    this.categoriesChanged();
                }
            } else {
                if (inResponse.OutGetAppList.appList.appSummary) this.$.app_list1.appendToList(inResponse.OutGetAppList.appList.appSummary.length > 1 ? inResponse.OutGetAppList.appList.appSummary : [inResponse.OutGetAppList.appList.appSummary]);
            }
            // Reset the category search flag
            this.categorySearch = false;
        }
    },
    gotError: function(inSender, inResponse, inRequest, props, errors) {
        // Reset the category search flag
        this.categorySearch = false;
        this.categories = null;
        this.$.scrim.hide();
        this.$.spinner.setShowing(false);
        this.$.emptyInstructions.hide();
        //this.$.search_result.hide();
        // This event is generated to ensure that the nagivation  bar is displayed.
        //this.doSearchInputBlur();
        errors.push("LOC08002");
        this.displayError(errors);
    },
    displaySearchedResult: function() {
        // Safety measure, to avoid any exceptions
        if (!this.totalCount) this.totalCount = 0;
        // Show the search result info
        var resultTmp = new enyo.g11n.Template($L("#{count} Results for \"#{queryStr}\" were found"));
        if (this.searchFieldSearch == true) {
            this.$.search_info.setContent(resultTmp.evaluate({
                count: this.totalCount,
                queryStr: this.$.search_field.getValue()
            }));
        } else {
            resultTmp = new enyo.g11n.Template($L("#{count} Results were found"));
            this.$.search_info.setContent(resultTmp.evaluate({
                count: this.totalCount
            }));
        }
        // Decide whether to show empty instructions text or not
        // If this is a normal search and some search text is present
        // or if this is a search triggered by magazine / developer apps, and there are search results
        if (this.searchFieldSearch == true && this.$.search_field.getValue() == "") {
            this.$.emptyInstructions.show();
            this.$.search_result.hide();
        } else {
            this.$.emptyInstructions.hide();
            this.$.search_result.show();
            if (this.totalCount == 0) {
                this.showNoApp();
            }
        }
    },
    showNoApp: function() {
        this.$.app_list1.hide();
        this.$.noFoundInstructions.show();
    },
    hideNoApp: function() {
        this.$.app_list1.show();
        this.$.noFoundInstructions.hide();
    },
    acquireNextPage: function(inSender, index) {
        // Try to get the next set of applications only if the appList at least has the first page
        if (index > 0 && index < this.totalCount) {
            if (this.endPosition && this.endPosition > index) {
                // Another call has been already made to fetch the next page. No need to make another server call
                return;
            }
            var defaultBatchSize = AppCatalog.Config.defaultPageSize;
            var batchSize;
            var remainingItems = (this.totalCount - index) + 1;
            if (remainingItems < defaultBatchSize) batchSize = remainingItems;
            else batchSize = defaultBatchSize;
            var moreSearchParams = {
                startPosition: index,
                count: batchSize
            };
            moreSearchParams = enyo.mixin(moreSearchParams, this.searchParams);
            // Add a co-relation parameter that can be used to deal with out of order responses
            this.lastServerCallTimestamp = new Date().getTime();
            moreSearchParams.corelationId = this.lastServerCallTimestamp;
            // Add appFilterType parameter for application filter
            if(this.appFilterOn === true) {
                moreSearchParams.appFilterType = this.appFilterType;
            }
            findApps.BaseServer.getACServer().getAppList(moreSearchParams, "SearchMoreAppsService", {
                onSuccess: "gotApps",
                onFailure: "gotError",
                scope: this
            });
            this.endPosition = index + batchSize;
        }
    },
    //Utility methods
    displayError: function(errors) {
        // Display the error only if the current view is Search view
        if (findApps.ViewLibrary._container.isTopView(this.owner)) this.$.error.displayError(errors);
    },
    // Error dialog methods
    submitError: function() {
        this.$.error.cancel();
    },
    cancelError: function() {
        this.$.error.cancel();
    },
    categoryClicked: function(inSender, inEvent) {
        var categoryItem = this.fetchCategoryItem(inEvent.rowIndex);
        var category_id = categoryItem ? categoryItem.id : "";
        // Store the categoryItem for use in other case, such as user click on "Top" ,"Paid","Free","New"
        this.storedCategoryId = category_id;
        // Normal search
        if (this.searchFieldSearch == true) {
            this.userSelectedCategoryId = category_id;
        }
        this.categorySearch = true;
        this.selectedCategoryIndex = inEvent.rowIndex;
        this.$.search_categories.refresh();
        this.launchSearch(inSender, inEvent);
    },
    resetCategorySelection: function() {
        // Resetting of the selected category - Start
        // When any stored query is selected - forget about the previously selected category
        // Always go back to "All Results"
        this.storedCategoryId = "";
        // Normal search
        if (this.searchFieldSearch == true) {
            this.userSelectedCategoryId = "";
        }
        this.categorySearch = false;
        this.selectedCategoryIndex = 0;
    // Resetting of selected category - End
    },
    storedQuerySelected: function(inSender) {
        this.hideNoApp();
        this.resetCategorySelection();
        this.storedQuery = this.getQueryByButtonIndex();
        // Normal search
        if (this.searchFieldSearch == true) {
            this.userSelectedStoredQuery = this.storedQuery;
        }
        var params;
        if (this.searchFieldSearch == true) {
            // no need to query the server if there are queryStr
            if (enyo.string.trim(this.$.search_field.getValue()).length == 0) {
                this.$.search_result.hide();
                this.$.search_field.setHint($L("Type search terms here..."));
                this.$.emptyInstructions.show();
                return;
            }
            params = {
                queryStr: enyo.string.trim(this.$.search_field.getValue()),
                qid: this.storedQuery.queryId,
                queryFragment: this.storedQuery.queryFragment,
                categoryid: this.storedCategoryId
            };
        } else {
            params = {
                categoryid: this.storedCategoryId
            };
            params = enyo.mixin(params, this.params);
            // set the query id and fragment into params
            params.qid = this.storedQuery.queryId;
            params.queryFragment = this.storedQuery.queryFragment;
        }
        this.$.scrim.show();
        this.$.spinner.setShowing(true);
        this.executeSearch(params);
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
    },
    getButtonIndexByQId: function(qid) {
        // Default the button sequence: Top, Paid, Free, New
        var _homeQueryItems = ["HOME-DartfishQuery1", "HOME-DartfishQuery2", "HOME-DartfishQuery3", "HOME-DartfishQuery4"];
        var _defaultQueryItems = ["DEFAULT-DartfishQuery5", "DEFAULT-DartfishQuery6", "DEFAULT-DartfishQuery7", "DEFAULT-DartfishQuery8"];
        var index = 0;
        if (qid) {
            if (_homeQueryItems.indexOf(qid) != -1) index = _homeQueryItems.indexOf(qid);
            else if (_defaultQueryItems.indexOf(qid) != -1) index = _defaultQueryItems.indexOf(qid);
        }
        return index;
    }
});
