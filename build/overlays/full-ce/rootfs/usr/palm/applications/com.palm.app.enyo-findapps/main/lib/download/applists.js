//Assumption is appdownlaodmgr and applists would be owned by same owner. They should only run single insatnce.
enyo.kind({
    name: "findApps.AppLists",
    kind: enyo.Component,
    ADDED: 0,
    DELETED: 1,
    UPDATED: 2,
    MYAPPS_ALL: 3,
    UPDATELIST_ALL: 4,
    ERROR: 5,
    create: function() {
        this.inherited(arguments);
        this._apps = new Object();
        this._other = new Object();
        this._updates = new Object();
        this._myUpdates = new Object();
        this._observers = new Array();
        this.appdownloadmgr = enyo.application.appdownloadManager;
        this.appdownloadmgr.attach(this);
        this._allListsReady = 1;
        this._updateListReady = 1;
        this._updateListError = 1
        this._initMyApps();
    },
    destroy: function() {
    	if(this.appdownloadmgr)
    		this.appdownloadmgr.detach(this);
    	
    	this._observers = null;
    	this._apps = null;
    	this._other = null;
    	this._updates = null;
    	this._myAppsHash = null;
    	this._myUpdates = null;
    	this.inherited(arguments);
    }
    ,
    _initMyApps: function() {
        this._other.items = [];
        this._apps.items = [];
        this._myUpdates.items = [];
        if (!this.appdownloadmgr.myAppsListIsReady()) return;
        this._myAppsHash = this.appdownloadmgr.getMyApps();
        for (var x in this._myAppsHash) {
            if (this._myAppsHash[x].appType === "app") this._apps.items.push(this._myAppsHash[x])
            else this._other.items.push(this._myAppsHash[x])
        }
        // sort apps alphabetically
        this._apps.items.sort(function(a, b) {
            if (a.title.toLowerCase() == b.title.toLowerCase()) {
                return 0;
            } else {
                return a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1;
            }
        });
        // sort apps alphabetically
        this._other.items.sort(function(a, b) {
            if (a.title.toLowerCase() == b.title.toLowerCase()) {
                return 0;
            } else {
                return a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1;
            }
        });
        this._sendAllListsReady();
        // fetch updates
        this._fetchUpdates();
    },
    allListsReady: function() {
        return (this._allListsReady == 0);
    },
    updateListReady: function() {
        return (this._updateListReady == 0);
    },
    updateListError: function() {
        return (this._updateListError == 0);
    },
    getAppsList: function() {
        return this._apps;
    },
    getOtherList: function() {
        return this._other;
    },
    getUpdatesList: function() {
        return this._myUpdates;
    },
    _sendAllListsReady: function() {
        this._allListsReady--;
        if (this._allListsReady == 0) {
            for (var i = 0; i < this._observers.length; i++) {
                if (this._observers[i].updateLists) this._observers[i].updateLists(null, this.MYAPPS_ALL);
            }
        }
    },
    _sendUpdateListReady: function() {
        this._updateListReady--;
        if (this._updateListReady == 0) {
            for (var i = 0; i < this._observers.length; i++) {
                if (this._observers[i].updateLists) this._observers[i].updateLists("updates", this.UPDATELIST_ALL);
            }
        }
    },
    _sendError: function() {
        this.error("Error in getting updates");
        this._updateListError--;
        if (this._updateListError == 0) {
            for (var i = 0; i < this._observers.length; i++) {
                if (this._observers[i].updateLists) this._observers[i].updateLists("updates", this.ERROR);
            }
        }
    },
    
    updatescb: function(inSender, response, inRequest, props, errors) {
    	if (!errors || errors.length == 0) {
            var apps = [];
            if (response && response.OutUpdateInfoList) {
                var updates = response.OutUpdateInfoList.appSummaryForUpdates;
                apps = !updates ? [] : (updates instanceof Array) ? updates : [updates];
            }
            for (var i = 0; i < apps.length; i++) {
                if (this._myAppsHash[apps[i].publicApplicationId]) {
                    this._myAppsHash[apps[i].publicApplicationId].updateFromServerUpdatesList(apps[i]);
                }
            }
            this._sendUpdateListReady();
        } else {
            this._sendError();
        }
    },
    
    _fetchUpdates: function() {
        var installedAppsPackageIds = new Array();
        for (var x in this._myAppsHash) {
            if (this._myAppsHash[x].isInstalled()) installedAppsPackageIds.push(x);
        }
        if (installedAppsPackageIds.length == 0) return;
        var inProps = {
            onResponse: "updatescb",
            scope: this
        };
        findApps.BaseServer.getACServer().getListOfUpdatableApps(installedAppsPackageIds, "appupdatesService", inProps);
    },
    // Observer method to add/remove/update myapps changes
    updateMyApps: function(app, updateReason) {
        // Optimization:
        // don't process any updates until myApps list is populated
        if (!this.appdownloadmgr.myAppsListIsReady()) return;
        if (updateReason == this.appdownloadmgr.APP_ADDED) {
            if (app.appType == "app") this.addApp(app, this._apps, "app");
            else this.addApp(app, this._other, "other");
        } else if (updateReason == this.appdownloadmgr.APP_DELETED) {
            if (app.appType == "app") this.deleteApp(app, this._apps, "app");
            else this.deleteApp(app, this._other, "other");
        } else if (updateReason == this.appdownloadmgr.APP_UPDATED) {
            if (app.appType == "app") this.updateApp(app, this._apps, "app");
            else this.updateApp(app, this._other, "other");
        } else if (updateReason == this.appdownloadmgr.MYAPPS_ALL) {
            this._initMyApps();
        }
    },
    addApp: function(app, list, name) {
        var index = this.binarySearch(list.items, app, true);
        if(index >=0) {
            if (list.items.length == index || list.items[index].publicApplicationId != app.publicApplicationId) {
                list.items.splice(index, 0, app);
                var l = this._observers.length;
                for (var i = 0; i < l; i++) {
                    if (this._observers[i].updateLists) this._observers[i].updateLists(name, this.ADDED, app, index);
                }
            }
        }    
    },
    deleteApp: function(app, list, name) {
        // delete this app from myApps array
        var index = this.binarySearch(list.items, app, false);
        if (index >= 0) {
            list.items.splice(index, 1);
            for (var i = 0; i < this._observers.length; i++) {
                if (this._observers[i].updateLists) this._observers[i].updateLists(name, this.DELETED, app, index);
            }
        /*if (widget.mojo)
                widget.mojo.noticeRemovedItems(index, 1);*/
        }
        if (name != "updates") this._updateMyUpdatesQueue(app);
    },
    updateApp: function(app, list, name) {
        var index = this.binarySearch(list.items, app, false);
        if (index >= 0) {
            for (var i = 0; i < this._observers.length; i++) {
                if (this._observers[i].updateLists) {
                    this._observers[i].updateLists(name, this.UPDATED, app, index);
                }
            }
            if (name != "updates") {
                this._updateMyUpdatesQueue(app);
            }
        }
    },
    binarySearch: function(o, v, insert) {
        // Search only if the title is present
        // title may not be yet populated if the app details
        // call is not yet done
        if(v.title) {
            var u = o.length - 1;
            var l = 0;
            var m;
            var searchTitle = v.title.toLowerCase();
            while (l <= u) {
                m = (l + u) >> 1;
                if (o[m].title.toLowerCase() < searchTitle) {
                    l = m + 1;
                } else if (o[m].title.toLowerCase() == searchTitle) {
                    // make sure that ids are the same as well
                    if (o[m].publicApplicationId == v.publicApplicationId) {
                        return m;
                    }
                    // serial search down
                    var i = m - 1;
                    while (i >= 0 && o[i].title == v.title) {
                        if (o[i].publicApplicationId == v.publicApplicationId) {
                            return i;
                        }
                        i--;
                    }
                    // serial search up
                    var i = m + 1;
                    while (i < o.length && o[i].title == v.title) {
                        if (o[i].publicApplicationId == v.publicApplicationId) {
                            return i;
                        }
                        i++;
                    }
                    if (insert) {
                        return m;
                    } else {
                        return -1;
                    }
                } else {
                    u = m - 1;
                }
            }
            if (insert) return l;
            else return -1;
        }
        else
            return -1;   
    },
    // TODO remove this when fantom binary search bug is found, that is if it exists
    serialSearch: function(arr, appPublicApplicationId) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].publicApplicationId === appPublicApplicationId) return i;
        }
    },
    // updates the list of active updates
    _updateMyUpdatesQueue: function(app) {
        var state = app.stateToString();
        var index = this.binarySearch(this._myUpdates.items, app, false);
        if (app.canInstallUpdate() && index < 0) {
            this.addApp(app, this._myUpdates, "updates");
        }
        // if this app does not have an update we delete the hash value
        else if (index >= 0 && (state == "findApps.AppState.Installed" || state == "findApps.AppState.InstallFailed" || state == "findApps.AppState.DownloadFailed" || state == "findApps.AppState.Download")) {
            this.deleteApp(app, this._myUpdates, "updates");
        } else if (index >= 0) {
            this.updateApp(app, this._myUpdates, "updates");
        }
    },
    // adds observer to the list
    attach: function(observer) {
        this._observers.push(observer);
    },
    // removes observer from the list
    detach: function(observer) {
        for (var i = 0; i < this._observers.length; i++) {
            if (this._observers[i] === observer) {
                this._observers.splice(i, 1);
            }
        }
    }
});
