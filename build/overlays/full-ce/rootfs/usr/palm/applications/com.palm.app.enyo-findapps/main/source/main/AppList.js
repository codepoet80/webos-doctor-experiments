enyo.kind({
    name: "findApps.AppList",
    kind: "VFlexBox",
    isSaveList: false,
    // null will be default
    // Search Apps kind may set this to two possible types: searchListType=directsearch, searchListType=devappssearch
    searchListType: null,
    events: {
        onAcquirePage: "",
        onSaveListEmpty: ""
    },
    published: {
        appList: [],
        myAppList: []
    },
    components: [{
        name: "app_list",
        className: "app-list",
        kind: "VirtualList",
        flex: 1,
        accelerated: true,
        onSetupRow: "getAppItem",
        onAcquirePage: "nextPage",
        components: [{
            name: "app_item",
            kind: "findApps.AppItem",
            onclick: "appItemClick",
            onUpdateList: "refreshItem"
        }]
    }],
    create: function() {
        this.appdownloadmgr = enyo.application.appdownloadManager;
        this.appdownloadmgr.attach(this);
        enyo.application.savedList.attach(this);
        this.init();
        this.inherited(arguments);
        if (this.isSaveList) this.$.app_item.isSaveList = true;
        //Reset of selected item - when create
        this.selectedCategoryIndex = undefined;

		/* 
		   The following function override could be handled by using the eval() statement below,
		   but eval() is probably verbotten.  Saved here just in case:

		   eval("this.$.app_list.$.scroller.displayBuffer.acquirePage = " + this.$.app_list.$.scroller.displayBuffer.acquirePage.toString().replace(/[a-zA-Z]*\.offsetHeight/,90) + ";");

		   This would be more resiliant to change within enyo, though it is pretty unlikely
		   that displayBuffer.acquirePage is going to undergo any significant overhaul.
		 */
		this.$.app_list.$.scroller.displayBuffer.acquirePage = function(inPage) {
			var node = this.pages[inPage];
			if (node) {
				node.style.display = "";
				if (!this.heights[inPage]) {
					// The original call here to calculate node.offsetHeight triggers a layout.
					//  As long as we know the size of all app items (currently 90px fixed),
					//  we can avoid the layout penalty when bringing on multiple pages. 

					//  Note, any change to appItem height will have to be updated here as well.
					this.heights[inPage] = 90; //node.offsetHeight;
				}
				this.height += this.heights[inPage];
			}
		};
    },
    destroy: function() {
    	this.appdownloadmgr && this.appdownloadmgr.detach(this);
    	if(enyo.application.savedList!=null)
    		enyo.application.savedList.detach(this);
        this.inherited(arguments);
    },
    saveListChanged: function(appId, action) {
        var index = this.serialSearch(this.appList, appId);
        if (index >= 0) {
            this.$.app_list.updateRow(index);
        }
    },
    saveListEmpty: function() {
        // Raise an event that the list of saved apps has changed (could be addition or removal from saved list)
        // This event is currently used only on Saved Apps screen to check if all the applications are removed from the saved list
        // If saved list is empty now, then the empty instructions are shown
        this.doSaveListEmpty();
    },
    updateMyApps: function(app, updateReason) {
        if (updateReason == this.appdownloadmgr.MYAPPS_ALL) {
            this.init();
        } else {
            var appPublicApplicationId = app.publicApplicationId;
            var index = this.serialSearch(this.appList, appPublicApplicationId);
            if (index >= 0) {
                this.$.app_list.updateRow(index);
                if (updateReason == this.appdownloadmgr.APP_DELETED) {
                    // If this app was deleted from somewhere, such as swmanager, set this.appList[index]._appDownload to null,
                    // so next time this can get new _appDownload when processDownload().
                    this.appList[index]._appDownload = null;
                } else {
                    this.appList[index]._appDownload = app;
                }
            }
            if (!app.enableSave) {
                //removing the app from the saved list
                enyo.application.savedList.removeApp(appPublicApplicationId, true);
            }
        }
    },
    init: function() {
        if (!this.appdownloadmgr.myAppsListIsReady()) return;
        this.getAppDownload(this.appList);
    },
    getAppDownload: function(list) {
        for (var index in list) {
            if (list[index]) {
                var appDownload = this.appdownloadmgr.belongToMyApp(list[index].publicApplicationId);
                if (appDownload) {
                    list[index]._appDownload = appDownload;
                }
            }
        }
    },
    appendToList: function(list) {
        //this.getAppDownload(list);
        this.appList = this.appList.concat(list);
        this.appListUpdated();
    },
    //Commenting right now. To use binary search we have to keep the list sorted
    //binarySearch: function(o, v, insert)
    //{
    //	for(index in this.v){
    //		this.log("app: id ", v.publicApplicationId);
    //		}
    //    var u = o.length - 1;
    //	var l = 0;
    //	var m;
    //	var searchTitle = v.title.toLowerCase();
    //
    //    while (l <= u)
    //	{
    //		m = (l + u) >> 1;
    //
    //		if (o[m].title.toLowerCase() < searchTitle)
    //		{
    //			l = m + 1;
    //		}
    //		else if (o[m].title.toLowerCase() == searchTitle)
    //		{
    //			// make sure that ids are the same as well
    //			if (o[m].publicApplicationId == v.publicApplicationId)
    //				return m;
    //
    //			// serial search down
    //			var i = m - 1;
    //			while (i >= 0 && o[i].title == v.title)
    //			{
    //				if (o[i].publicApplicationId == v.publicApplicationId)
    //					return i;
    //				i--;
    //			}
    //
    //			// serial search up
    //			var i = m + 1;
    //			while (i < o.length && o[i].title == v.title)
    //			{
    //				if (o[i].publicApplicationId == v.publicApplicationId)
    //					return i;
    //				i++;
    //			}
    //
    //			if (insert)
    //				return m;
    //			else
    //				return -1;
    //		}
    //		else
    //		{
    //			u = m - 1;
    //		}
    //	}
    //
    //	if (insert)
    //		return l;
    //	else
    //		return -1;
    //},
    serialSearch: function(arr, appPublicApplicationId) {
        if (!arr) return -1;
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === undefined ) continue;
            if (arr[i].publicApplicationId === appPublicApplicationId) return i;
        }
        return -1;
    },
    nextPage: function(inSender, inPage) {
        if (this.appList.length > 0) {
            var index = inPage * inSender.pageSize;
            if (index > 0 && !this.appList[index]) {
                this.doAcquirePage(index);
            }
        }
    },
    //This handles the event issues with appItem
    appItemClick: function(inSender, inEvent) {
        var appListItem = this.appList[inEvent.rowIndex];
        if (inSender.buyClick && appListItem._appDownload) {
            appListItem._appDownload.defaultAction();
        } else if (inSender.saveClick) {
            inSender.$.app_save.processAction(appListItem);
            if (this.isSaveList) { // and being removed!
                this.appList.splice(inEvent.rowIndex, 1);
                this.appListUpdated();
            }
        } else if (inSender.appClick) {
            inSender.$.app_save.processAction(appListItem);
        } else if (inSender.buyClick) {
            this.processDownload(inSender, appListItem)
        } else if (inSender.progressCancelled) {
        //this.log('we clicked the progress cancelled');
        } else {
            this.showAppDetails(appListItem, this.searchListType);
        }
        inSender.appClick = false;
        inSender.saveClick = false;
        inSender.buyClick = false;
        inSender.progressCancelled = false;
        inSender.tapHighlight = true;
        return true;
    },
    
    processDownload: function(inSender, appListItem) {
    	appListItem._appDownload = this.appdownloadmgr.getAppDownload(appListItem.publicApplicationId);
    	if(appListItem._appDownload.price === undefined) {
        	var appDetails = {"publicApplicationId": appListItem.publicApplicationId,
        	                  "price": appListItem.price,
        	                  "title": appListItem.title
        	};
        	appListItem._appDownload.updateFromAppList(appDetails);
	    }	
        appListItem._appDownload.defaultAction();
    },
    showAppDetails: function(inResponse, source) {
        var detailView = findApps.ViewLibrary.getView("APPDETAILS");
        detailView.setAppItem(inResponse);
        detailView.setSource(source);
    },
    getAppItem: function(inSender, inIndex) {
        // Just to bail out earlier if there are no apps in the data list
        if (!this.appList || this.appList.length == 0) {
            return false;
        }
        var start = (new Date).getTime();
        if (inIndex >= 0) {
            var appItem = this.appList[inIndex];
            if (appItem) {
                if (inIndex % 2 == 1) {
                    var name = this.$.app_item.getClassName();
                    this.$.app_item.setClassName(name + " app-list-even");
                }
                if (!appItem._appDownload) appItem._appDownload = this.appdownloadmgr.belongToMyApp(appItem.publicApplicationId);
                this.$.app_item.setAppItem(appItem, this.isSaveList);
                return true;
            }
        }
    },
    appListChanged: function() {
        this.refresh(true);
    },
    appListUpdated: function() {
        this.refresh();
    },
	resizeHandler: function() {
		/* 
		   Implement a custom resizeHandler to prevent punting the entire list on excessive calls.
		   A more proper fix would probably be to evaluate all calls to this.resized() within the 
		   application, only call it when absolutely neccessary.  With so many edge cases however,
		   it seems this is going to be the best way for now
		*/
		var newBounds = this.getBounds();
		if(newBounds.width == 0 || newBounds.height == 0) return; //Ignore anytime we do not have a size
		if(this.oldBounds && this.oldBounds.height == newBounds.height && this.oldBounds.width == newBounds.width) return; //Same size?  No change
		this.oldBounds = newBounds;
        enyo.application.appcatwindow.orientationChangeHandler();
		this.inherited(arguments);
	},
    refresh: function(punt) {
        // resized is an expensive function so the timer is to give the processor
        // sometime to render other stuff to show to the user to improve user experience
        var self = this;
        setTimeout(function(){
            self._refresh.call(self, punt);
        }, 50);
    },
    _refresh: function(punt) {
        if(punt)
            // punt rebuilds the component from start state according to code documentation (ScrollingList.js line#79)
            // so no need to call resized afterwards, which is an expensive function
            this.$.app_list.punt();
        else
            this.$.app_list.resized();
    }
});
