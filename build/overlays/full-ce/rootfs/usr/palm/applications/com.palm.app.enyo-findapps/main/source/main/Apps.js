enyo.kind({
    name: "findApps.Apps",
    kind: "VFlexBox",
    published: {
        topCategory: 0,
        storedQuery: {}
    },
    events: {
        onShowScrim: "",
        onHideScrim: "",
        onAppItemClick: "",
        onGotError: ""
    },
    components: [{
        kind: "HFlexBox",
        className: "enyo-header acc-header-listselector",
        components: [{
            kind: "ListSelector",
            className: "",
            name: "sub_categories",
            onChange: "subCategorySelected"
        },{
        	kind: "Spacer",
        	flex:1
        },
        {
            // App filter selector for touchpad only/phone only/all feature
            kind: "ListSelector",
            
            name: "app_filter_selector",
            onChange: "appFilterChanged",
			className: "appFilterSearch",
            items: [
                {caption: $L("All"), value: "all"},
                {caption: $L("TouchPad"), value: "touchpad_exclusive"},
                {caption: $L("Phone"), value: "phone_exclusive"},
            ]
        }]
    },
    //{kind: "HFlexBox", height:"47px", style:"background-color:white;", components: [ ]},
    {
        className: "apps-shadow"
    }, {
        name: "app_list1",
        kind: "findApps.AppList",
        flex: 1,
        onAcquirePage: "acquireListPage"
    }],
    create: function() {
        this.inherited(arguments);
        this.appMetrics = enyo.application.appMetrics;
    },
    
    setAppFilter: function() {
         // initialize app filter selector based on ACS returned "appFilterOn" in _session 
        // and the value in cookie "findApps.appFilterTypeBrowser"
        var userSession = findApps.UserSession.getSession();
        if (userSession != null && userSession.supportInfo) {
            this.appFilterOn = userSession.supportInfo.appFilterOn;
            if(this.appFilterOn && this.appFilterOn===true) {
                this.appFilterType = enyo.getCookie("findapps.appFilterTypeBrowser") || "all";
                this.$.app_filter_selector.setValue(this.appFilterType);
            }
            else
            	this.$.app_filter_selector.setShowing(false);
        }
    },
    appFilterChanged: function(inSender, inValue, inOldValue) {
        if(inValue !== inOldValue) {
            this.appFilterType = inValue;
            enyo.setCookie("findapps.appFilterTypeBrowser", this.appFilterType);
            this.refresh(true);
        }
    },
    refreshList: function() {
        // this.$.app_list1.refresh();
        // Need to call resized as per the enyo-0.9 release notes, to readjust
        // the list size
        // refresh replaced by resized
        this.$.app_list1.resized();
    },
    refresh: function(holdSelectedSubCategory) {
        this.totalAppsCount = 0;
        if (!holdSelectedSubCategory) {
            this.selectedSubCategory = null;
        }
        if (this.topCategory && this.storedQuery) {
            var cid = this.topCategory.id;
            if (this.selectedSubCategory != null) {
                cid = this.selectedSubCategory;
            }
            this.getApps({
                categoryid: cid,
                qid: this.storedQuery.queryId,
                queryFragment: this.storedQuery.queryFragment,
                sort: "DATE_DESC"
            }, "BrowseAppsService");
        } else {
            this.error("Category or stored query not selected");
        }
    },
    renderSubCategories: function() {
        var sub_categories = [];
        var iconPath = "";
        if (this.topCategory.subcategories) {
            sub_categories = this.topCategory.subcategories.map(function(sub_category) {
                return {
                    caption: sub_category.name || sub_category.label,
                    value: sub_category.id
                }
            });
        }
        if (this.topCategory.id == 0) {
            // if 0, this is "Home" category , show  "All Apps", and don't set sub_categories by "UI Addendum v4c_2_3_2011.pdf" designation.
            sub_categories.unshift({
                caption: $L("All Apps"),
                icon: "images/" + (this.topCategory.iconLocation || "category-icons/home/") + "category-selector.png",
                value: this.topCategory.categoryId
            });
            this.$.sub_categories.setItems(sub_categories);
            this.$.sub_categories.setValue(this.topCategory.categoryId);
            this.$.sub_categories.setHideArrow(true);
            this.$.sub_categories.disabled = true;
            this.$.sub_categories.removeClass("showIcon");
            this.$.sub_categories.addStyles("background: ;");            
        } else {
            iconPath = "images/" + (this.topCategory.iconLocation || "category-icons/home/") + "category-selector.png";
            sub_categories.unshift({
                caption: this.topCategory.label,
                icon: iconPath,
                value: this.topCategory.categoryId
            });
            // Before changing the items in the list, select the topmost value to avoid remembering any previous selections on the UI
            // Since we are changing the entire contents of the list, the tick mark against any previously selected values does not go away
            // after we change the items in the list and re-render the list, because the corresponding index for that value is not found anymore
            // to stop showing the checkmark against it.
            // The index in the list is found on the basis of the value, and that value is not present anymore - hence the issue
            // To circumvent that, do a dummy selection of the first in the old list
            if (this.$.sub_categories.items && this.$.sub_categories.items.length > 0) this.$.sub_categories.setValue(this.$.sub_categories.items[0].value);
            this.$.sub_categories.setItems(sub_categories);
            if (!this.selectedSubCategory || this.selectedSubCategory == null) {
                this.$.sub_categories.setValue(this.topCategory.categoryId);
            } else {
                this.$.sub_categories.setValue(this.selectedSubCategory);
            }
            this.$.sub_categories.setHideArrow(false);
            this.$.sub_categories.disabled = false;
            this.$.sub_categories.addClass("showIcon");
            this.$.sub_categories.addStyles("background: url("+iconPath+") 4px no-repeat;");            
        }
        this.$.sub_categories.render();
    },
    subCategorySelected: function(inSender, inValue, inOldValue) {
        this.totalAppsCount = 0;
        this.selectedSubCategory = inValue;
        if (this.appMetrics) this.appMetrics.trackEvent("subcategory/" + inValue);
        this.getApps({
            categoryid: inValue,
            qid: this.storedQuery.queryId,
            queryFragment: this.storedQuery.queryFragment,
            sort: "DATE_DESC"
        }, "BrowseAppsService");
    },
    acquireListPage: function(inSender, index) {
        // Try to get the next set of applications only if the appList at least has the first page
        if (index > 0 && index < this.totalAppsCount) {
            if (this.endPosition && this.endPosition > index) {
                // Another call has been already made to fetch the next page. No need to make another server call
                return;
            }
            var defaultBatchSize = AppCatalog.Config.defaultPageSize;
            var batchSize;
            var remainingItems = (this.totalAppsCount - index) + 1;
            if (remainingItems < defaultBatchSize) batchSize = remainingItems;
            else batchSize = defaultBatchSize;
            this.getMoreApps({
                categoryid: this.$.sub_categories.getValue(),
                qid: this.storedQuery.queryId,
                queryFragment: this.storedQuery.queryFragment,
                startPosition: index,
                count: batchSize,
                sort: "DATE_DESC"
            });
            this.endPosition = index + batchSize;
        }
    },
    isEmpty: function() {
        return (this.endPosition === -1 || this.totalAppsCount === 0 || this.$.app_list1.appList === []);
    },
    getApps: function(params) {
        this.doShowScrim();
        this.totalAppsCount = 0;
        this.endPosition = -1;
        // Add appFilterType parameter for application filter
        if(this.appFilterOn === true) {
            params.appFilterType = this.appFilterType;
        }
        findApps.BaseServer.getACServer().getAppList(params, "BrowseAppsService", {
            onSuccess: "handleServerResponseInApps",
            onFailure: "handleServerFailureInApps",
            scope: this
        });
    },
    getMoreApps: function(params) {
        if (params.startPosition > 0) {
            // Add appFilterType parameter for application filter
            if(this.appFilterOn === true) {
                params.appFilterType = this.appFilterType;
            }
            // Not showing scrim in case we are fetching more apps in the background
            findApps.BaseServer.getACServer().getAppList(params, "GetMoreAppsService", {
                onSuccess: "handleServerResponseInApps",
                onFailure: "handleServerFailureInApps",
                scope: this
            });
        }
    },
    handleServerResponseInApps: function(inSender, inResponse, inRequest, props) {
        var appList = inResponse.OutGetAppList.appList;
        switch (props.service) {
            case "GetMoreAppsService":
                if (inResponse.OutGetAppList) {
                    this.doHideScrim();
                    if (appList.appSummary) {
                        this.$.app_list1.appendToList(appList.appSummary.length > 1 ? appList.appSummary : [appList.appSummary]);
                    }
                }
                break;
            case "BrowseAppsService":
                if (inResponse.OutGetAppList) {
                    this.doHideScrim();
                    if (appList.appSummary) {
                        if (appList.totalCount) {
                            this.totalAppsCount = appList.totalCount;
                        }
                        this.endPosition = appList.appSummary.length;
                        this.$.app_list1.setAppList(appList.appSummary.length > 1 ? appList.appSummary : [appList.appSummary]);
                    } else {
                        this.$.app_list1.setAppList([]);
                    }
                    this.renderSubCategories();
                }
                break;
        }
    },
    handleServerFailureInApps: function(inSender, inResponse, inRequest, props, errors) {
        switch (props.service) {
            case "GetMoreAppsService":
                errors.push("LOC06001");
                this.doGotError(errors);
                break;
            case "BrowseAppsService":
                errors.push("LOC06002");
                this.doGotError(errors);
                break;
        }
    }
});
