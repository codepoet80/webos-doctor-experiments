enyo.kind({
    name: "findApps.AppCatalogWindow",
    kind: enyo.VFlexBox,
    // Observers of particular events
    // Is there a better way of propagating resize and orientationChanged events
    observers: {
        "resize": [],
        "orientationChanged": []
    },
    components: [
    //Scrim control
    {
        kind: "Scrim",
        name: "scrim",
        layoutKind: "VFlexLayout",
        align: "center",
        pack: "center",
        components: [{
            kind: "SpinnerLarge",
            name: 'spinner',
            showing: false
        }]
    },{
        kind: "ApplicationEvents",
        onWindowParamsChange: "windowParamsChangeHandler",
        onOpenAppMenu: "openAppMenu"
    },{
        name: "appMenu",
        kind: "AppMenu",
        components: [
        
        {
            name: "accountOption",
            caption: $L("Preferences & Accounts"),
            onclick: "showPreferenceAccount"
        }, {
            name: "softwareManager",
            caption: $L("Software Manager"),
            onclick: "openSoftwareManager"
        }, {
            name: "helpMenu",
            caption: $L("Help"),
            onclick: "openHelpApp"
        }]
    }, {
        name: "pane",
        kind: "Pane",
        flex: 1,
        onCreateView: "paneAddView",
        onSelectView: "triggerReset",
        components: [
        // Show the default launch view
        {
            kind: "findApps.LaunchView",
            name: "findApps_LaunchView"
        }
        // Views are added dynamically as needed
        // When a view is created / added for the first time, paneAddView method gets called
        ]
    }],
    openAppMenu: function() {
        // Validate components inside app menu
        this.$.appMenu.validateComponents();
        
        // Configure app menu options based on current top view
        this.configureAppMenu();
        this.$.appMenu.render();
        this.$.appMenu.open();
        return true; // stop bubbling
    },
    configureAppMenu: function() {
        var currentView = this.$.pane.view;
        var menuOptions = {};
        if(currentView.getAppMenuOptions)
            menuOptions = currentView.getAppMenuOptions();
        
        var items = this.$.appMenu.getControls();
		
        items.forEach(function(item) {
            if(menuOptions[item.name]) {
                var handler = menuOptions[item.name];
                item.setDisabled(item.disabled);
                if(item.disabled)
                    item.addClass('enyo-disabled');
                else
                    item.removeClass('enyo-disabled');
                item.setShowing(item.show);
            }
            else {
                // Hide the menu option
                item.setShowing(false);
            }
        });
    },
    create: function() {
        /* Setting this accelerated property of VirtualScroller to true for better srolling performance */
        enyo.VirtualScroller.prototype.accelerated = true;
        enyo.keyboard.setResizesWindow(false);
        // set the container, then call inherited, 
        // otherwise components accessing viewLibrary_container will get ahead
        findApps.ViewLibrary.setContainer(this);
        this.inherited(arguments);
        
        findApps.ViewLibrary.init();
        // Create findApps.SessionManager instance
        enyo.application.sessionManager = new findApps.SessionManager();
        enyo.application.savedList = new findApps.SavedList(); 
        enyo.application.connectionManager = new findApps.ConnectionManager();
        enyo.application.connectionManager.monitor();
        enyo.application.appdownloadManager = new findApps.AppDownloadManager();
        /* 
         // Do we want to do this for App Catalog? This is being used by Email app to keep the card alive till the user force kills the app.  
        // Mark main card as cachable off-screen.
		// This means it will usually not be closed when the user throws it away.
		if (window.PalmSystem) {
			PalmSystem.keepAlive(true);
		}
		*/
		this.orientationChangeHandler();
        this.launched = false;
    },
    launchAppCat: function() {
        this.showView(this.launchParams);
        
        // First view is shown. Now do the generic stuff required (only once in a given session)
        if(this.launched === false) {
            this.launched = true;
            var self = this;
            setTimeout(function() {
                enyo.application.sessionManager.triggerInitSession(self);
            }, 10);
            setTimeout(function() {
                // init method of appdownloadmanager will start the required calls to fetch the list of installed apps
                enyo.application.appdownloadManager.init();
                // AppCatalogWindow needs to be a listener for appDownloadManager to see if the list of installed apps is ready
                // Once installed apps list is available, the bookmarked list should be updated and any installed apps should be removed
                // from the bookmarked list
                if (enyo.application.appdownloadManager.myAppsListIsReady()) {
                    self.updateMyApps(null, enyo.application.appdownloadManager.MYAPPS_ALL)
                } else {
                    enyo.application.appdownloadManager.attach(self);
                }
                // Get the google property id for tracking
                self.initGoogleAppMetrics();
		        
                // Get the data service
                enyo.application.connectionManager.getDataService();
                // TODO: Check with Mamta why we need applists component. If we really need it, there are no observers right now
                // If to be kept, may be we can move this inside appdownloadmgr itself
                if (!self.$.appLists) {
                    self.createComponent({
                        name: "appLists",
                        kind: "findApps.AppLists",
                        owner: self
                    });
                }
            }, 20);
        }
    },
    destroy: function() {
    	findApps.ViewLibrary.cleanup();
    	enyo.application.appdownloadManager.detach(this);
        this.inherited(arguments);
    },
    constructed: function() {
        this.inherited(arguments);
        //TODO: Figure out why we still need this
        typeof HACKS != "undefined" && HACKS.HACK_ENYO_DEFAULT_GUI_EVENT_HANDLER(this);
    },
    windowParamsChangeHandler: function(inSender, inEvent) {
        // Show the view based on the parameters
        // launchParams will be of the following format:
        /*
         * {
         * "viewToLoad" : "<view name",
         * ... <followed by scene specific parameters>
         * }
         * Note that for countryPicker and TermsConditions views, the parameters will specify what should be the view to be shown to the user
         * after country is selected and terms of use are accepted. For example: 
         * {
         * 	 "viewToLoad" : "COUNTRYPICKER" or "TERMSCONDITIONS",
         *   "nextView" : "APPDETAILS" or "default" or "MAGAZINE" or "SEARCHAPPS", 
         *    "nextViewParams" : { } --> JSON object containing parameters as expected by the next view
         *   
         * }
         */
        var launchParams = inEvent.params;
        if(launchParams.modalMode === true)
            this.modalId = launchParams.modalId;
        this.launchParams = launchParams;
        // Check if this is a promo code launch
        if(launchParams.viewToLoad === "PROMOCODE") {
            this.handlePromoCodeLaunch();
        }
        else
            this.launchAppCat();
        
    },
    displayError: function(errors) {
        if(!this.$.error) {
            this.createComponent({
                kind: "findApps.Error",
                name: "error",
                onSubmit: "submitError",
                onCancel: "cancelError"
            });
        }
        this.$.error.displayError(errors);
    },
    receiveResponse: function(event, success, errors) {
        if(event === "userSession") {
            enyo.application.sessionManager.removeListener(this, "userSession");
            if(!success) {
                errors.push("LOC03004");
                this.displayError(errors);
            }
        }
        enyo.windows.activate("","main");
    },
    // Google Analytics
    initGoogleAppMetrics: function() {
        // Get google analytics ID
        if (enyo.application.onDevice) {
        	findApps.AccountServices.getInstance().getGoogleAnalyticsWebPropertyID({
                onSuccess: "gotGooglePropertyId", 
                onFailure: "errorGooglePropertyId", 
                scope: this
            });
        } else {
            this.gotGooglePropertyId(null, null);
        }
    },
    gotGooglePropertyId: function(inSender, inResponse) {
        var propertyID;
        if (AppCatalog.Config.DummyConfig) {
            propertyID = AppCatalog.Config.DummyConfig._googlePropertyId; // using a dummy value
        } else {
            if (inResponse.parameterInfos) {
                // looking for the right setting
                for (var i = 0; i < inResponse.parameterInfos.length; i++) {
                    if (inResponse.parameterInfos[i]["key"] == "GOOGLE_ANALYTICS_WPID") {
                        propertyID = inResponse.parameterInfos[i]["value"];
                        break;
                    }
                }
            }
        }
        var appMetrics = new AppMetrics(propertyID);
        appMetrics.setInternetConnection(enyo.application.connectionManager.isOnline());
        appMetrics.trackLaunch(enyo.fetchAppInfo().version);
        appMetrics.trackRegistration(enyo.fetchAppInfo().version);
        enyo.application.appMetrics = appMetrics;
    },
    errorGooglePropertyId: function(inSender, inResponse) {
        this.error("Error when fetching google Property ID: ", inResponse);
    },
    // View related methods (adding a view / going back)
    setView: function(name) {
        this.$.pane.selectViewByName(name);
        var s = this.$[name + "_content"] || this.$[name];
        return s;
    },
    validateView: function(name) {
        this.$.pane.validateView(name);
        var s = this.$[name + "_content"] || this.$[name];
        return s;
    },
    paneAddView: function(inSender, inName) {
        // inName is used to fetch the corresponding kind to be loaded
        var kind = findApps.ViewLibrary._views[inName];
        var ctor = enyo.constructorForKind(kind);
        return {
            name: inName,
            kind: kind
        };
    },
    hiddenLoadView: function(name) {
        // Validate if the view  exists, if not, this will create the view,
        // If prefetch is true, call prefetch so that the data can be prefetched
        var view = this.validateView(name);
        if (view.prefetch) {
            view.prefetch();
        }
    },
    prefetchViews: function(viewsArr) {
        if(viewsArr) {
            for(var i in viewsArr) {
                this.hiddenLoadView(viewsArr[i]);
            }
        }
    	
    },
    goBack: function(inSender, e) {
        // The following two steps are done to ensure that session is available and appmetrics is available
        // It is possible that a full page error was shown at the beginning due to no network connection
        // In that case, it is possible that the session call failed, and google appmetrics id was not retrieved
        // Check if user/session is available
        if(!findApps.UserSession._session || findApps.UserSession._session == null) {
            enyo.application.sessionManager.triggerInitSession(this);
        }
        // Check that the google appmetrics is initialized
        if(!enyo.application.appMetrics) {
            this.initGoogleAppMetrics();
        }
        if (this.$.pane.getViewIndex() > 0) {
            var flag = true;
            while (flag) {
                var currentView = this.$.pane.view;
                this.$.pane.back(e);
                var newView = this.$.pane.view;
                if (currentView.id === "appCatalogWindow_FULLSCREENERROR") {
                    //the new view could be still in an inconsistent state because FULLSCREENERROR just got popped away
                    if (newView && newView.refresh) {
                        newView.refresh();
                    }
                }
                //if the new view is still a FULLSCREENERROR, we need to pop this view also
                flag = (newView.id === "appCatalogWindow_FULLSCREENERROR");
            }
        } else {
            this.selectTopView();
        }
        
        // Check if current view is Launch View
        var currentView = this.$.pane.view;
        if(currentView.id === "appCatalogWindow_findApps_LaunchView") {
            this.showView(this.launchParams);
        }
    },
    popViewsFromHistory: function(numItems) {
        if (numItems && numItems > 0) {
            while (numItems > 0) {
                var popIndex = this.$.pane.history.pop();
                numItems--;
            }
        }
    },
    selectTopView: function() {
        this.$.pane.selectViewByIndex(0);
    },
    isTopView: function(viewToCheck) {
        var result = false;
        var currentView = this.$.pane.view;
        if (viewToCheck) {
            if (currentView.id === "appCatalogWindow_FULLSCREENERROR") {
                var views = this.$.pane.views;
                var previousView = views && enyo.isArray(views) && views[views.length - 1] && views[views.length - 1];
                this.log("Previous View: ", previousView && previousView.id, "View To Check: ", viewToCheck.id, "Current View: ", currentView.id);
                result = (viewToCheck === previousView);
            } else {
                result = (viewToCheck === currentView);
            }
        }
        return result;
    },
    isFirstPage: function() {
        // Note: LaunchView will always be shown. Hence we need to show a back button
        // if history has any view other than the launch view
        if (this.$.pane.history.length && this.$.pane.history.length > 1) {
            return false;
        } else return true;
    },
    triggerReset: function(inSender, inView, inPreviousView) {
        if (inView.reset) inView.reset();
    },
    
    // App menu related methods
    showPreferenceAccount: function(params) {
        var prefView = findApps.ViewLibrary.getView("PREFERENCES");
        if (params) {
            prefView.setParams(params);
        }
    },
    openSoftwareManager: function() {
        // Open SWM application
        findApps.ApplicationManager.getInstance().launchApplication("com.palm.app.swmanager", '', "SWMLaunchSuccess", "SWMLaunchFailure");
    },
    SWMLaunchSuccess: function() {
        this.log("SWMLaunchSuccess");
    },
    SWMLaunchFailure: function() {
        this.log("SWMLaunchFailure");
    },
    openHelpApp: function() {
    	// Open Help App
    	findApps.ApplicationManager.getInstance().launchApplication("com.palm.app.help", {
            "target": "http://help.palm.com/app_catalog/index.html"
        }, "helpLaunchSuccess", "helpLaunchFailure");
    },
    helpLaunchSuccess: function() {
        this.log("helpLaunchSuccess");
    },
    helpLaunchFailure: function() {
        this.log("helpLaunchFailure");
    },
    // appdownloadmanager callback method
    updateMyApps: function(app, updateReason) {
        var appdownloadmgr = enyo.application.appdownloadManager;
        if (app === null && updateReason == appdownloadmgr.MYAPPS_ALL && appdownloadmgr.myAppsListIsReady()) {
            this.verifySavedList(appdownloadmgr.getMyApps());
            enyo.application.appdownloadManager.detach(this);
        }
    },
    verifySavedList: function(installedPackageIds) {
        var filteredPackageIds = [];
        //filtering out the installed package ids from the savedlist
        var localSavedPackageIds = enyo.application.savedList.getList();
        localSavedPackageIds.forEach(function(localSavedPackageId) {
            if (!installedPackageIds[localSavedPackageId]) {
                filteredPackageIds.push(localSavedPackageId);
            }
        });
        var params = {
            packageIds: filteredPackageIds,
            sort: "DATE_DESC"
        };
        // no need to query the server if there are no saved apps
        if (params.packageIds.length > 0) {
            findApps.BaseServer.getACServer().getAppList(params, "SavedAppsService", {
                onSuccess: "handleACServerResponse",
                onFailure: "handleACServerFailure",
                scope: this
            });
        }
    },
    
    updateSavedList: function(totalCount, appSummaries) {
        var result = [];
        if (totalCount > 1) { //list of app summaries
            appSummaries.forEach(function(appSummary) {
                result.push(appSummary.publicApplicationId);
            });
        } else if (totalCount === 1) { //single app summary
            result.push(appSummaries.publicApplicationId);
        }
        enyo.application.savedList.updateList(result);
    },
    handleACServerResponse: function(inSender, inResponse, inRequest, props) {
        if (props.service == "SavedAppsService") {
            var appList = inResponse.OutGetAppList.appList;
            var totalCount = appList.totalCount;
            var appSummaries = appList.appSummary;
            this.updateSavedList(totalCount, appSummaries);
        }
    },
    handleACServerFailure: function(inSender, inResponse, inRequest, props, errors) {
        this.error("handleACServerFailure for service ", props.service);
    },
    registerObserver: function(eventName, observer) {
        this.observers[eventName].push(observer);
    },
    sendEvent: function(eventName, params) {
        var i;
        var eventObservers = this.observers[eventName] || [];
        for (i = 0; i < eventObservers.length; i++) {
            if (eventObservers[i].update) {
                eventObservers[i].update(eventName, params);
            }
        }
    },
    resizeHandler: function() {
        this.inherited(arguments);
        this.sendEvent("resize", {
            "width": window.innerWidth,
            "height": window.innerHeight
        });
        // Invoke this method to check if the orientation has changed.
        // If it has, this method notifies all the interested parties (observers)
        this.orientationChangeHandler();
    },
    orientationChangeHandler: function() {
        var orientationChanged = this.updateOrientation(window.innerWidth, window.innerHeight);
        if (orientationChanged == true) {
            // Send Orientation Changed event to all observers
            this.sendEvent("orientationChanged", {
                "orientation": this._orientation
            });
        }
    },
    updateOrientation: function(width, height) {
        var landscapeMode = width > height;
        var orientationChanged = false;
        if (landscapeMode == true) {
            if (this._orientation && this._orientation != "landscape") {
                orientationChanged = true;
            } else if (!this._orientation) orientationChanged = true;
            this._orientation = "landscape";
        } else {
            if (this._orientation && this._orientation != "portrait") {
                orientationChanged = true;
            } else if (!this._orientation) orientationChanged = true;
            this._orientation = "portrait";
        }
        return orientationChanged;
    },
   
    showView: function(params) {
        // showView is called from:
        // AppCatalogWindow - launchAppCat to start the process
        // goBack handler if the launch view is the only view that has been shown so far (some error occurred at start up)
        // CountryPicker and Terms and Conditions scenes will modify the launch params and call showView to show the right view
        // Therefore, this.launchParams must be updated with the parameter: params
        this.launchParams = params;
        var currentView = this.$.pane.view;
        if (currentView && currentView.id === "appCatalogWindow_FULLSCREENERROR") {
            return;
        }
    	
        var sceneName = params.viewToLoad;
        switch (sceneName) {
            case "COUNTRYPICKER":
                var countryPickerView = findApps.ViewLibrary.getView("COUNTRYPICKER");
                countryPickerView.setParams(params);
                break;
            case "TERMSCONDITIONS":
                var termsConditionsView = findApps.ViewLibrary.getView("TERMSCONDITIONS");
                termsConditionsView.setParams(params);
                break;
            case "SEARCHAPPS":
                var searchView = findApps.ViewLibrary.getView("SEARCHAPPS");
                searchView.setParams(params);
                break;
            case "APPDETAILS":
                var detailView = findApps.ViewLibrary.getView("APPDETAILS");
                detailView.setAppItem(params);
                break;
            case "PREFERENCES":
                if(!this.$.closeModal) {
                    this.createComponent(
                    {
                        name: "closeModal",
                        kind: "PalmService",
                        service: "palm://com.palm.systemmanager/",
                        method: "dismissModalApp",
                        onSuccess: "doNothing",
                        onFailure: "handleError",
                        subscribe: true
                    }
                    );
                }
                var prefAcctView = this.showPreferenceAccount(params);
                break;
            case "PROMOCODE":
                this.handlePromoCodeLaunch();
                break;
            case "BROWSER":
            	 var browserView = findApps.ViewLibrary.getView("BROWSER");
                 var that = this;
                 setTimeout(function() {
                     that.prefetchViews(["MAGAZINE", "SAVEDAPPS", "SEARCHAPPS"]);
                 }, 30);
                 break;
            case "default":
            case "MAGAZINE":
            default:
                var magView = findApps.ViewLibrary.getView("MAGAZINE");
                // Pre-fetch other views
                var that = this;
                setTimeout(function() {
                    that.prefetchViews(["BROWSER", "SAVEDAPPS", "SEARCHAPPS"]);
                }, 30);
                break;
        }
    },
    closeModalAndExit: function(params) {
        if (params && this.modalId) {
            params.subscribe = true;
            params.callerId = this.appId;
            params.launchId = "com.palm.app.enyo-findapps";
            params.modalId = this.modalId;
            this.$.closeModal.call(params);
        }
    },
    doNothing: function() {
    //this.log("Dismissing modal dialog successfully.");
    },
    handleError: function(inSender, inResponse) {
    //this.log("INAPP Dismissing modal dialog with error ", inResponse);
    },
    showScrim: function() {
        this.$.scrim.show();
        this.$.spinner.setShowing(true);
    },
    hideScrim: function() {
        this.$.scrim.hide();
        this.$.spinner.setShowing(false);
    },
    handlePromoCodeLaunch: function() {
        // Check if current view is Launch View
        var currentView = this.$.pane.view;
        //Show the scrim only if the current view is not the launch view
        if(currentView.id !== "appCatalogWindow_findApps_LaunchView") {
            // Show scrim 
            this.showScrim();
        }
    	
        var params = this.launchParams;
        enyo.setCookie("findapps.promocode", params.promoCode);
        findApps.UserProfile.promoLink = true;
         
        if (params.promoCode.length > 0) {
            findApps.BaseServer.getPMTServer().getCodeInfos(params.promoCode, "codeInfosService", {
                onSuccess: "handlePaymentResp",
                onFailure: "handlePaymentError",
                scope: this
            });
        }
    },
    handlePaymentResp: function(inSender, inResponse, inRequest, props) {
        if (inResponse.OutGetPromoCodeInfos) {
            var campaignType = inResponse.OutGetPromoCodeInfos.campaignType;
            var amount = inResponse.OutGetPromoCodeInfos.amount;
            var validTo = inResponse.OutGetPromoCodeInfos.validTo;
            var validFrom = inResponse.OutGetPromoCodeInfos.validFrom;
            var campaignStatus = inResponse.OutGetPromoCodeInfos.campaignStatus;
            var status = inResponse.OutGetPromoCodeInfos.status;
            if (inResponse.OutGetPromoCodeInfos.items) {
                var appid = inResponse.OutGetPromoCodeInfos.items[0].id;
            }
	        
            // Function to check if promo code is valid
            var isPromoCodeValidNow = function(validFrom, validTo) {
                var result = true;
                var getLocalDateFromGMT = function(dateRawStr) {
                    if(!dateRawStr || dateRawStr.length<8) {
                        return (new Date());
                    }
                    var year = dateRawStr.substr(0,4);
                    var month = dateRawStr.substr(4,2);
                    var day = dateRawStr.substr(6,2);
                    var hour = dateRawStr.substr(8,2);
                    var min = dateRawStr.substr(10,2);
                    var sec = dateRawStr.substr(12,2);
                    var dateObj = new Date(year, month-1, day, hour, min, sec);
                    var dateObjTime = dateObj.getTime();
	                
                    // change to local timezone
                    var clDate = new Date();
                    localOffset = clDate.getTimezoneOffset() * 60000;
                    return (new Date(dateObjTime - localOffset));
                };
	            
                var localValidFrom = getLocalDateFromGMT(validFrom);
                var localCurrent = new Date();
                var localValidTo = getLocalDateFromGMT(validTo);
                if(localValidTo<localValidFrom || localCurrent<localValidFrom || localCurrent>localValidTo) {
                    result = false;
                }
	            
                return result;
            };
            var formatDateStr= function(dateRawStr) {
                if (!dateRawStr || dateRawStr.length < 8) {
                    return "";
                }
                var year = dateRawStr.substr(0, 4);
                var month = dateRawStr.substr(4, 2);
                var day = dateRawStr.substr(6, 2);
                var hour = dateRawStr.substr(8, 2);
                var min = dateRawStr.substr(10, 2);
                var sec = dateRawStr.substr(12, 2)
                var dateObj = new Date(year, month - 1, day, hour, min, sec);
                var dateObjTime = dateObj.getTime();
                // change to local timezone
                var clDate = new Date();
                localOffset = clDate.getTimezoneOffset() * 60000;
                var ld = new Date(dateObjTime - localOffset);
                var fd = findApps.Utilities.Formatter.formatLongDate(ld);
                return fd;
            };
            // Campaign type: GP, Show magazine view
            if (campaignType === "GP") {
	        	var viewParams = {"viewToLoad": "BROWSER"};
                enyo.mixin(this.launchParams, viewParams);
	        	
	        	
                if(campaignStatus==="A" && status==="A") {
                    var msg = $L("This Promo Code is valid until ") + formatDateStr(validTo);
	                
                    // Since SGP type code has been converted to GP from paymentserver(APPC-7913), 
                    // and CampaignStatus has been converted from E(xpired) to A(ailable), here need to check
                    // validTo and validFrom to decide the validation of the code
                    if(!isPromoCodeValidNow(validFrom, validTo)) {
                        msg = $L("This promo code is invalid (expired or other reason).");
                        enyo.setCookie("findapps.promocode", "");
                    }
                }
                else {
                    var msg = $L("Invalid promo code or campaign.");
	                
                    if(status!=="A") {
                        msg = $L("This promo code is invalid (redeemed or other reason).");
                    }
                    else if(campaignStatus!=="A") {
                        msg = $L("This promo code related campaign is invalid (expired or other reason).");
                    }
                    enyo.setCookie("findapps.promocode", "");
                }
            } 
            // Show Details view
            else if (campaignType === "AP" || campaignType === "AJ" || campaignType === "AD") {
                // Show details view
	        	var viewParams = {"viewToLoad": "APPDETAILS", "id":"", "publicApplicationId": appid};
                enyo.mixin(this.launchParams, viewParams);
                if (campaignStatus === "A" && status === "A") {
                    var msg = $L("This Promo Code is valid until ") + formatDateStr(validTo);
                } 
                else {
                    var msg = $L("Invalid promo code or campaign.");
	                
                    if(status!="A") {
                        msg = $L("This promo code is invalid (redeemed or other reason).");
                    }
                    else if(campaignStatus!="A") {
                        msg = $L("This promo code related campaign is invalid (expired or other reason).");
                    }
                    enyo.setCookie("findapps.promocode", "");
                }
            }
            this.hideScrim();
            this.openPromoCodeNotifyPopup(msg);
            // Show the right view (magazine or details)
            this.launchAppCat();
        }
    },
    handlePaymentError: function(inSender, inResponse, inRequest, props, errors) {
        enyo.setCookie("findapps.promocode", "");
        this.hideScrim();
    	// Show error message 
        errors.push("LOC03010");
	    this.displayError(errors);
        // APPC-7105: show default view before promo code invalid error pop out
        this.launchParams.viewToLoad = "default";
        this.launchAppCat();
    },
    openPromoCodeNotifyPopup: function(message) {
        if(!this.$.PromoCodeNotify) {
            // Create popup component for showing promo code message
            this.createComponent({
                name: "PromoCodeNotify",
                kind: "Popup",
                scrim: true,
                modal: true,
                width: "400px",
                components: [{
                    style: "padding: 8px;",
                    content: $L("Promo Code")
                }, {
                    kind: "Spacer"
                }, {
                    name: "promoNotification",
                    style: "padding: 6px;",
                    content: "none"
                }, {
                    kind: "VFlexBox",
                    style: "padding-top: 6px;",
                    components: [{
                        kind: "Button",
                        caption: $L("OK"),
                        onclick: "closePopup"
                    }]
                }]
            });
        }
        this.$.PromoCodeNotify.openAtCenter();
        this.$.promoNotification.setContent(message);
    },
    closePopup: function(inSender) {
        this.$.PromoCodeNotify.close();
    }
});
