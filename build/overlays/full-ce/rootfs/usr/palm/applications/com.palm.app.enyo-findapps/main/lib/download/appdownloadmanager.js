/* AppDownloadManager
 * 
 * Keeps a queue of active downloads. On launch, it gets active downloads 
 * from appInstallerService/status method and initializes the queue. It then queries 
 * the system for the list of installed apps and adds them to myApps as well.
 * When client request the download object (e.g details scene)
 * dm will either return an existing one, or create a new one.
 * DM is listening for state changes on all download objects, in case that
 * download becomes active and needs to be stored in the myApps queue. 
 * MyApps are installations in progress, failed installations and installed apps.
 * Other downloads are stored in _activeQueue until user initiates the install
 * at which point appDownload object is moved to myApps queue and appears 
 * 
 * Sample flow:
 * 
 * User opens a details scene of some new app "com.company.myapp". 
 * AppDownloadManager creates a new AppDownload object and stores it in _activeQueue hash.
 * AppDownloadManager & current details scene both subscribe as listeners on this object 
 * to be notified of state changes. When user taps "download app" install is initiated 
 * and state of the object starts changing with updates from appInstallService/status method
 * (_appInstallServiceStatusCB). When state changes AppDownloadManager is notified through 
 * updateDownloadState() observer method and it then decides if AppDownload should be added
 * to myApps queue. If state became "download progress" for example, app is added to myApps hash.
 * It's similar with details scene. When state of AppDownload changes details scene's 
 * updateDownloadState method is called to update the UI (progress pill). 
 * 
 * 
 * Observers on AppDownloadManager can subscribe to be notified of these changes:
 * 
 * 1) changes to installed applications list
 * current observers: main scene, search scene...
 * observer needs to implement 
 * 
 * updateInstalledApps(AppDownloadManager_instance, updateReason);
 * 
 * 
 * 2) changes to the myApps queue, sent when app is added/deleted/updated from the queue
 * current observers: myApps scene.
 * observer needs to implement  
 * 
 * updateMyApps(updateReason, app);
 * 
 * updateReason: one of: APP_ADDED, APP_DELETED, APP_UPDATED
 * MYAPPS_ALL - sent when myApps queue is populated 
 *             (from appInstallService/status + installed app from /listApps)
 * 
 * app: instance of AppDownload that changed
 * 
 */
enyo.kind({
    name: "findApps.AppDownloadManager",
    kind: enyo.Component,
    APP_ADDED: 0,
    APP_DELETED: 1,
    APP_UPDATED: 2,
    MYAPPS_ALL: 3,
    UPDATELIST_ALL: 4,
    components: [{
        name: "registerServerStatus",
        kind: "PalmService",
        service: "palm://com.palm.bus/signal/"
    }, {
        name: "appinstallservice",
        kind: "findApps.AppInstallService"
    }, {
        name: "downloadService",
        kind: "PalmService"
    }, {
        name: "appStates_Initial",
        kind: "findApps.AppState.Initial"
    }, {
        name: "appStates_Pausing",
        kind: "findApps.AppState.Pausing"
    }, {
        name: "appStates_InitiatingDownload",
        kind: "findApps.AppState.InitiatingDownload"
    }, {
        name: "appStates_Resuming",
        kind: "findApps.AppState.Resuming"
    }, {
        name: "appStates_Removing",
        kind: "findApps.AppState.Removing"
    }, {
        name: "appStates_Canceling",
        kind: "findApps.AppState.Canceling"
    }, {
        name: "appStates_Download",
        kind: "findApps.AppState.Download"
    }, {
        name: "appStates_Downloading",
        kind: "findApps.AppState.Downloading"
    }, {
        name: "appStates_Paused",
        kind: "findApps.AppState.Paused"
    }, {
        name: "appStates_DownloadFailed",
        kind: "findApps.AppState.DownloadFailed"
    }, {
        name: "appStates_Purchasing",
        kind: "findApps.AppState.Purchasing"
    }, {
        name: "appStates_Purchased",
        kind: "findApps.AppState.Purchased"
    }, {
        name: "appStates_PurchaseFailed",
        kind: "findApps.AppState.PurchaseFailed"
    }, {
        name: "appStates_PurchasePending",
        kind: "findApps.AppState.PurchasePending"
    }, {
        name: "appStates_Installing",
        kind: "findApps.AppState.Installing"
    }, {
        name: "appStates_Installed",
        kind: "findApps.AppState.Installed"
    }, {
        name: "appStates_UpdateAvailable",
        kind: "findApps.AppState.UpdateAvailable"
    }, {
        name: "appStates_InstallFailed",
        kind: "findApps.AppState.InstallFailed"
    }, {
        name: "downloadStateManager",
        kind: "findApps.DownloadStateManager"
    }],
    create: function() {
        this.inherited(arguments);
        this._myApps = new Object();
        this._revertableApps = new Object();
        this._activeQueue = new Object();
        this._observers = new Array();
        this._allow1xDownload = false;
        // two things need to happen before myApps list is ready:
        // get all apps in progress and all installed apps
        this._myAppsListIsReady = 2;
    },
    destroy: function() {
    	this._myApps = null;
        this._revertableApps = null;
        this._activeQueue = null;
        this._observers = null;
        this.inherited(arguments);
    },
    init: function() {
    	 this.$.registerServerStatus.call({
             "serviceName": "com.palm.appInstallService"
         }, {
             onSuccess: "_appInstallerServiceSignalCB",
             onFailure: "genericFailure"
         });
         this.$.registerServerStatus.call({
             "serviceName": "com.palm.applicationManager"
         }, {
             onSuccess: "_appManagerServiceSignalCB",
             onFailure: "genericFailure"
         });
         this.$.registerServerStatus.call({
             "serviceName": "com.palm.downloadmanager"
         }, {
             onSuccess: "_appDownloadServiceSignalCB",
             onFailure: "genericFailure"
         });
    },
    start: function() {
        this._myApps = new Object();
        this._revertableApps = new Object();
        this._myAppsListIsReady = 2;
        // get installed apps and subscribe for status
        findApps.ApplicationManager.getInstance().getInstalledApplications_V2("getInstalledApplicationsSuccess", "genericFailure", this);
    },
    _appInstallerServiceSignalCB: function(inSender, inResponse) {
        if (inResponse.connected == true) {
            this.start();
        } else if (inResponse.connected == false) {
            //this.error("AppDownloadManager._appInstallerServiceSignal is gone from the bus");
        }
    },
    _appManagerServiceSignalCB: function(inSender, inResponse) {
        if (inResponse.connected == true) {
            // subscribe for app install/uninstall notifications
            findApps.ApplicationManager.getInstance().launchPointChanges("launchPointChangesSuccess", "genericFailure", this);
        } else if (inResponse.connected == false) {
            //this.error("AppDownloadManager._appManagerServiceSignalCB is gone from the bus");
        }
    },
    launchPointChangesSuccess: function(inSender, inResponse) {
        this._updateInstalledQueue(inResponse);
    },
    genericFailure: function(inSender, inResponse) {
        this.error("appdownloadmanager: service failed: ", inSender, inResponse);
    },
    _appDownloadServiceSignalCB: function(inSender, inResponse) {
        if (inResponse.connected == true) {
            // if we need to allow 1x, reissue the command
            if (this._allow1xDownload) this.allow1xDownload(true);
        } else if (inResponse.connected == false) {
            //this.error("AppDownloadManager._appDownloadServiceSignalCB is gone from the bus");
        }
    },
    getInstalledApplicationsSuccess: function(inSender, inResponse) {
        this.log("getInstalledApplicationsSuccess ", inResponse);
        var loadedInfo = [];
        var self = this;
        this.$.appinstallservice.status("_appInstallServiceStatusCB", "genericFailure");
        var packages = inResponse.packages;
        packages = !packages ? [] : (packages instanceof Array) ? packages : [packages];
        this.createComponent({
            kind: "WebService"
        });
        this.$.webService.call(null, {
            url: "/usr/palm/ipkgs/manifest.json",
            handleAs: "json",
            onResponse: "manifestLoaded"
        });
        this.manifestLoaded = function(inSender, inResponse) {
            loadedInfo = inResponse || [];
            self.$.webService.destroy();
            for (var i = 0; i < loadedInfo.length; i++) {
                self._revertableApps[loadedInfo[i].id] = loadedInfo[i];
            }
            for (var i = 0; i < packages.length; i++) {
                if ((packages[i].userInstalled || (packages[i].apps[0] && packages[i].apps[0].userInstalled)) || self._revertableApps[packages[i].id]) {
                    // update app from this payload
                    // this might change the state of the app which will 
                    // cause it to be added to _myApps
                    var app = self.getAppDownload(packages[i].id);
                    app.updateFromInstalledAppsList(packages[i]);
                }
            }
            self._sendMyAppsListIsReady();
            for (var i = 0; i < self._observers.length; i++) {
                if (self._observers[i].updateInstalledApps) self._observers[i].updateInstalledApps();
            }
        };
    },
    // returns true if myApps list has been populated
    // from both sources: /status call - apps in progress
    // and /listApps call - installed applications
    myAppsListIsReady: function() {
        return (this._myAppsListIsReady == 0);
    },
    // Send MYAPPS_ALL notification when myApps list is populated
    // two things need to happen before myApps list is ready:
    // 1) get all apps in progress
    // 2) get all installed apps
    _sendMyAppsListIsReady: function() {
        this._myAppsListIsReady--;
        if (this._myAppsListIsReady == 0) {
            for (var i = 0; i < this._observers.length; i++) {
                if (this._observers[i].updateMyApps) this._observers[i].updateMyApps(null, this.MYAPPS_ALL);
            }
        }
    },
    // return app download with specified id
    // will attach listener to returned app object
    // called from details scene assistant
    getAppDownload: function(appId, listener) {
        // queues have priority, we first return app from downloadQ if present and so on
        var app = this._myApps[appId];
        if (!app) app = this._activeQueue[appId];
        if (!app) {
            // create a new one and add ourselfs as listener
            // we listen for state changes so that we can add it 
            // to the downloads queue if download starts
            // Set the publicApplicationId property at the time of creation 
            var app = this.createComponent({
                kind: findApps.AppDownload,
                owner: this, 
                publicApplicationId: appId
            })
            app.attach(this);
            this._activeQueue[appId] = app;
        }
        if (listener) app.attach(listener);
        return app;
    },
    // releases appDownload obj. If we are the last listener
    // and this app is in active queue, delete it from the queue
    // since it is no longer needed
    releaseAppDownload: function(appId, listener) {
        var app = this._myApps[appId];
        if (!app) app = this._activeQueue[appId];
        app.detach(listener);
        if (app == this._activeQueue[appId] && app._observers.length == 1) {
            //might have to destroy component watch**
            //this._activeQueue[appId].destroy();
            delete this._activeQueue[appId];
        }
    },
    _updateInstalledQueue: function(updateReason) {
        // if app was deleted notify the server
        if (updateReason && (updateReason.change == "added" || updateReason.change == "removed" || updateReason.change == "updated")) {
            var app = this._myApps[updateReason.packageId];
            if (app) {
                app.updateFromInstallNotification(updateReason);
                /*var self = this;
				var f = function()
				{
					for (var i = 0; i < self._observers.length; i++) 
					{
						if (self._observers[i].updateInstalledApps) 
							self._observers[i].updateInstalledApps();
					}
				}
				// delay until myApps queue is updated
				f.delay(2);*/
            }
        }
    },
    // returns installed app if found or null
    getInstalledApp: function(id) {
        var app = this._myApps[id];
        if (app && app.installedVersion) {
            return app;
        }
        return null;
    },
    getMyApps: function() {
        return this._myApps;
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
    },
    // Observer method for app download state changes
    // Here we decide if this app should be added/removed from
    // the myApps queue. If app is in the queue and has changed state
    // we send the "update" event APP_UPDATED.
    updateDownloadState: function(app) {
        var updateType = null;
        if (app.saveToMyApps() && !this._myApps[app.publicApplicationId]) {
            this._myApps[app.publicApplicationId] = app;
            updateType = this.APP_ADDED;
            //To do
            //Mojo.assert(this._activeQueue[app.publicApplicationId], "AppDownloadManager.updateDownloadState added to MyApps but app wasn't in the activeQ");
            delete this._activeQueue[app.publicApplicationId];
        } else if (app.removeFromMyApps() && this._myApps[app.publicApplicationId]) {
            delete this._myApps[app.publicApplicationId];
            updateType = this.APP_DELETED;
            // move it to active queue if we are not the only observer
            if (app._observers.length > 1) {
                this._activeQueue[app.publicApplicationId] = app;
            }
        } else if (this._myApps[app.publicApplicationId]) {
            updateType = this.APP_UPDATED;
        }
        // app is updated, notify observers
        if (updateType != null) {
            for (var i = 0; i < this._observers.length; i++) {
                if (this._observers[i].updateMyApps) this._observers[i].updateMyApps(app, updateType);
            }
        }
    },
    _appInstallServiceStatusCB: function(inSender, inResponse) {
        this.log("appdownloadmanager: _appInstallServiceStatusCB ", inResponse);
        var status = undefined;
        var singleUpdate = undefined;
        var apps = [];
        if (inResponse.status && inResponse.status.apps) {
            status = true;
            singleUpdate = false;
            apps = inResponse.status.apps;
        } else {
            status = true;
            singleUpdate = true;
            apps = [inResponse];
        }
        if (!status) return;
        for (var i = 0; i < apps.length; i++) {
            var app = this.getAppDownload(apps[i].id);
            app.updateFromStatus(apps[i].id, apps[i].details);
        }
        // on first response, when we get the entire list
        // of active apps send "ready" update
        if (!singleUpdate) {
            this._sendMyAppsListIsReady();
        }
    },
    belongToMyApp: function(appId) {
        return this._myApps[appId];
    },
    isRevertable: function(id) {
        if (this._revertableApps[id]) return true;
        else return false;
    },
    getDetailsRevertableApp: function(id) {
        return this._revertableApps[id];
    },
    allow1xDownload: function(allow, callback) {
        var self = this;
        this.onSuccess = function(inSender, inResponse) {
            self._allow1xDownload = allow;
            callback && callback(true);
        }
        this.onFailure = function(inSender, inResponse) {
            this.error("AppDownloadManager.allow1xDownload failed ", inResponse);
            callback && callback(false);
        }
        this.$.downloadService.setService("palm://com.palm.downloadmanager/");
        this.$.downloadService({
            "value": allow
        }, {
            method: "allow1x",
            OnSuccess: "onSuccess",
            OnFailure: "onFailure"
        })
    },
    canAllow1xDownload: function() {
        return this._allow1xDownload;
    },
    cleanup: function() {
        if (this._allow1xDownload) this.allow1xDownload(false);
        // this is just causing errors 
        // "could not find call XXX to cancel"
        //delete this._appInstallerService;
        //delete this._appManagerService;
        //delete this._downloadManagerService;
    }
});
//var Catalog 			= Catalog || {}; 
//Catalog.AppDownloadMngr = Catalog.AppDownloadMngr || new findApps.AppDownloadManager;
//Catalog.AppLists = Catalog.AppLists || new findApps.AppLists;
