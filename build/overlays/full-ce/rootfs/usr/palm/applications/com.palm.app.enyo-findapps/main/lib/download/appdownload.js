/*
 * AppDownload
 * 
 * represents a single app download. Each time details scene is pushed an instance of
 * AppDownload object is created (or an existing one is returned from myApps hash
 * maintained by the AppDownloadManager). Details scene listens for state changes
 * on this object to update the UI.
 * The most important property of AppDownload is _state which is always set to one
 * of the states defined in downloadstates.js (Catalog.appStates).
 * Behavior of the download object is entirely driven by the current state.
 * AppDownload defers almost all functionlaity to its current state object.
 * 
 * For example if details scene calls appDownload->cancelDownload()
 * the call will map to appDownload->_state->cancelDownload()
 * In some states one can not cancel a download, thus only some states 
 * define this method. Calling cancelDownload() while _state == "installed"
 * will do nothing since Catalog.appStates["installed"] doesn't define cancelDownload().
 * 
 */
enyo.kind({
    name: "findApps.AppDownload",
    kind: enyo.Component,
    _defaultState: "findApps.AppState.Initial",
    create: function() {
        this.inherited(arguments);
        this._observers = new Array();
        this._progressPillModel = {};
        this.enableSave = true;
        this._setState(this._defaultState);
    },
    destroy: function() {
    	this._observers = null;
    	this.inherited(arguments);
    },
    /*
	 *  Update functions
	 *  
	 *  update application object from different sources
	 *  Each source names properties differently, we
	 *  need to "equalize" them before updating object
	 */
    // called when application details are pulled
    // from the server to update state. Mostly used to
    // figure out if software update is available
    updateFromServer: function(appDetails) {
        var appType;
        if (appDetails.attributes && !appDetails.attributes.provides.noApp) appType = "app"
        else appType = "other"
        var details = {
            id: appDetails.id,
            publicApplicationId: appDetails.publicApplicationId,
            title: appDetails.title,
            iconUrl: appDetails.appIcon,
            purchasedVersion: appDetails.purchasedVersion,
            serverVersion: appDetails.version,
            packageSize: appDetails.appSize,
            installSize: appDetails.installSize,
            isEncrypted: appDetails.isEncrypted,
            currency: appDetails.currency,
            priceType: appDetails.priceType,
            price: appDetails.price,
            sku: appDetails.sku,
            paymentCategory: appDetails.paymentCategory,
            // install wants vendor and purchase vendorid
            vendor: appDetails.creator,
            vendorid: appDetails.vendorid,
            vendorUrl: appDetails.homeURL,
            vendorCity: appDetails.vendorCity,
            vendorRegion: appDetails.vendorRegion,
            vendorCountry: appDetails.vendorCountry,
            islocationbased: appDetails.islocationbased,
            packageUrl: appDetails.appLocation,
            "appType": appType,
            "services": appDetails.attributes && appDetails.attributes.provides.services,
            "dockMode": appDetails.attributes && appDetails.attributes.provides.dockMode,
            "universalSearch": appDetails.attributes.provides.universalSearch,
            "accounts": appDetails.attributes.provides.connectors
        }
        enyo.mixin(this, details);
        // delegate to state objects
        if (this._state.updateFromServer) this._state.updateFromServer(this);
    },
    // called from download manager when installed queue is created
    // at startup
    updateFromInstalledAppsList: function(appDetails) {
        var appType;
        var dockMode = false;
        var universalSearch = false;
        if (appDetails.apps && appDetails.apps.length > 0) {
            appType = "app";
            //if any app in package has dockMode support, the package as dockMode support
            for (var i = 0; i < appDetails.apps.length; i++) {
                if (appDetails.apps[i].dockMode) dockMode = true;
                if (appDetails.apps[i].universalSearch) universalSearch = true;
            }
        } else appType = "other";
        //keeping it compable with old model of information being in first app	
        var title = appDetails.loc_name ? appDetails.loc_name : appDetails.apps.length > 0 ? appDetails.apps[0].title : undefined;
        var icon = appDetails.icon ? appDetails.icon : appDetails.apps.length > 0 ? appDetails.apps[0].icon : undefined;
        var vendor = appDetails.vendor ? appDetails.vendor : appDetails.apps.length > 0 ? appDetails.apps[0].vendor : undefined;
        var details = {
            publicApplicationId: appDetails.id,
            title: title,
            installedVersion: appDetails.version,
            icon: icon ? icon : this.icon,
            "appType": appType,
            installSize: appDetails.size,
            vendor: vendor,
            services: appDetails.services,
            accounts: appDetails.accounts,
            dockMode: dockMode,
            universalSearch: universalSearch
        }
        enyo.mixin(this, details);
        if (this._state.updateFromInstalledAppsList) this._state.updateFromInstalledAppsList(this);
    },
    // called when list of updatable apps is retrived 
    // from the server (My apps scene calls it)
    updateFromServerUpdatesList: function(appDetails) {
        var details = {
            id: appDetails.id,
            serverVersion: appDetails.appVersion,
            packageUrl: appDetails.packageUrl,
            vendor: appDetails.vendor,
            vendorUrl: appDetails.homeURL,
            iconUrl: appDetails.appIcon,
            packageSize: appDetails.appSize,
            installSize: appDetails.installSize
        }
        enyo.mixin(this, details);
        // delegate to state objects
        if (this._state.updateFromServerUpdatesList) this._state.updateFromServerUpdatesList(this);
    },
    updateFromInstallNotification: function(appDetails) {
        ///Forcing a refresh for including size. 
        if (appDetails.change == "added" || (appDetails.change == "updated" && appDetails.version && this.installedVersion != appDetails.version)) {
            if (!this.installSize) {
                var details = {
                    installSize: appDetails.size
                }
            }
            enyo.mixin(this, details);
            this.setState(this._state.toString());
        }
    },
    /*
	  	"icon download current"
		"icon download complete"
		"icon download paused" - will also have "progress" 100
		"ipk download current" - will also have "progress" : 0-100
		"ipk download complete"
		"ipk download paused"  - will also have "progress" : 0-100
		
		"installing"
		"installed"
		"removing"
		"removed"
		"canceled"
		"download failed" - will also have "errorCode" : int and "reason" : string
		"install failed" - - will also have "errorCode" : int and "reason" : string
		"remove failed" - - will also have "errorCode" : int and "reason" : string
		"unknown"
	 * 
	 * 
	 * 
	 */
    updateFromStatus: function(id, appDetails) {
        var appType;
        var newState = appDetails.state;
        this.log("appdownload: updateFromStatus: new state and app id ", newState, id);
        // removed & installed notifications are handled in updateFromInstallNotification
        // nothing to do for removing & unknown
        if (newState == "removing" || newState == "unknown") {
            return;
        }
        if (newState == "installed") {
            var details = {
                publicApplicationId: id,
                installedVersion: appDetails.version
            }
            enyo.mixin(this, details);
        } else if (newState == "removed") {
            if (this._state._remove) this._state._remove(this);
            return;
        }
        // translate state
        if (newState == "icon download complete" || newState == "icon download current") {
            appDetails.progress = 0;
        }
        if (newState == "ipk download complete") {
            appDetails.progress = 100;
        }
        // fix up error code
        if (newState == "install failed") {
            this.errorCode = appDetails.reason;
        } else if (newState == "download failed") {
            this.errorCode = appDetails.errorCode.toString();
        } else {
            this.errorCode = appDetails.errorCode;
        }
        if (appDetails.noApp && appDetails.noApp === true) {
            appType = "other";
        } else {
            appType = "app";
        }
        var details = {
            publicApplicationId: id,
            title: appDetails.title,
            progress: appDetails.progress,
            serverVersion: appDetails.version,
            vendor: appDetails.vendor,
            vendorUrl: appDetails.vendorUrl,
            icon: this.icon ? this.icon : appDetails.iconUrl,
            "appType": appType,
            dockMode: appDetails.dockMode,
            universalSearch: appDetails.universalSearch,
            services: appDetails.services,
            accounts: appDetails.accounts
        }
        enyo.mixin(this, details);
        if (newState == "canceled" || newState == "remove failed") {
            if (this._state._reset) this._state._reset(this);
        } else {
            if (this._state._allowTransition && !this._state._allowTransition(newState)) {
                return;
            }
            this.setState(findApps.AppDownload.map2AppState(newState));
        }
    },
    
    // This method is used to update the appdownload object with details available from the appList_ext2 call
    // Mainly used for having price initialized even before the details call can be made
    // That helps to differentiate between free and paid apps without having to make a details call
    updateFromAppList: function(appdetails) {
        var details = {};
        if(appdetails.publicApplicationId)
            details.publicApplicationId = appdetails.publicApplicationId;
        if(appdetails.price)   
            details.price = appdetails.price;
        if(appdetails.title)   
            details.title = appdetails.title;
        enyo.mixin(this, details);   
    }
    ,
    
    // called from state objects when state changes
    setState: function(state, args) {
        this._setState(state, args);
        // notify observers
        for (var i = 0; i < this._observers.length; i++) {
            if (this._observers[i].updateDownloadState) this._observers[i].updateDownloadState(this);
        }
    },
    _setState: function(state, args) {
        var stateId = state.slice(state.lastIndexOf(".")+1);
        this._state = this.owner.$["appStates_" + stateId];
        this._state.init(this, args);
    },
    // returns progress pill model, called by observers
    // to update the UI in response to state changes
    getProgressPillModel: function() {
        return this._progressPillModel;
    },
    // returns formated price for this app
    getFormattedPrice: function() {
        // The input price is Object from featured ,such as: 9,0.99,Free, so sync with genericdownloadbutton 
        var price = this.price;
        if (price == "n/a" || price == "N/A") return price;
        else {
            if (price === "Free" || findApps.BaseServer.isPurchased(this.publicApplicationId)) {
                return $L("FREE");
            } else {
                var parsedPrice = parseFloat(price);
                var loc = findApps.UserSession.getActivationCountry();
                return findApps.Utilities.Formatter.formatCurrency(parsedPrice, loc);
            }
        }   
    },
    // adds observer to the list of observers
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
    // defer all actions to state objects, that is 
    // if action is defined for the current state 
    install: function() {
        if (this._state.install) this._state.install(this);
    },
    // called when updates are installed in a bulk from MyApps scene
    // all checks (install capacity, network..) are done
    // once for the whole batch and are skipped at this time
    installUpdate: function() {
        if (this._state.installUpdate) this._state.installUpdate(this);
    },
    // used by myApps scene to distinguish 
    // apps that are ready to be updated
    canInstallUpdate: function() {
        if (this._state.installUpdate) return true;
        else return false;
    },
    cancelDownload: function() {
        if (this._state.cancelDownload) this._state.cancelDownload(this);
    },
    pauseDownload: function() {
        if (this._state.pauseDownload) this._state.pauseDownload(this);
    },
    cancelPausedDownload: function() {
        if (this._state.cancelPausedDownload) this._state.cancelPausedDownload(this);
    },
    resumeDownload: function() {
        if (this._state.resumeDownload) this._state.resumeDownload(this);
    },
    launch: function() {
        if (this._state.launch) this._state.launch(this);
    },
    uninstall: function() {
        if (this._state.uninstall) this._state.uninstall(this);
    },
    defaultAction: function() {
        if (this._state.defaultAction) this._state.defaultAction(this);
    },
    // called from MyApps scene to perform 
    // default action based on the current state
    myAppsDefaultAction: function() {
        if (this._state.myAppsDefaultAction) this._state.myAppsDefaultAction(this);
    },
    isInstalled: function() {
        var app = this.owner.getInstalledApp(this.publicApplicationId);
        if (app) return true;
        return false;
    },
    stateToString: function() {
        return this._state.toString();
    },
    // for debugging purposes
    toString: function() {
        return "id:" + this.id + "enableSave:" + this.enableSave + " publicApplicationId:" + this.publicApplicationId + ", state:" + this.stateToString() + ", title:" + this.title + ", serverVersion:" + this.serverVersion + ", installedVersion:" + this.installedVersion + ", purchasedVersion:" + this.purchasedVersion + ", errorCode:" + this.errorCode + ", icon:" + this.icon + ", updateClass:" + this.updateClass + ", activeClass:" + this.activeClass + ", resumeClass:" + this.resumeClass + ", pauseClass:" + this.pauseClass + " warningClass:" + this.warningClass + ", packageSize:" + this.packageSize + " installSize: " + this.installSize + " appType: " + this.appType + "services" + this.servcies + "accounts" + this.accounts + "dockMode" + this.dockMode + "universalSearch" + this.universalSearch;
    },
    // returns true if app should be saved to the global
    // downloads queue based on the current state
    saveToMyApps: function() {
        if (this._state.saveToMyApps) return this._state.saveToMyApps();
        return false;
    },
    // returns true if app should be removed from the global
    // downloads queue based on the current state
    removeFromMyApps: function() {
        if (this._state.removeFromMyApps) return this._state.removeFromMyApps();
        return false;
    },
    //Used to construct an informative delete message
    getAppDeleteDialogInfo: function() {
        var deleteType, deleteTitle, deleteMessage, removable, removedItems = [];
        if (this.appType !== undefined && this.appType == "app") {
            deleteTitle = $L('Delete application?');
            deleteType = 'application';
        } else {
            deleteTitle = $L('Delete this item?');
            deleteType = 'item';
        }
        if (this.owner.isRevertable(this.publicApplicationId) || this.removable === "false") {
            removable = false;
            if (deleteType === 'application') {
                deleteMessage = $L("This application cannot be deleted from your phone.");
            } else {
                deleteMessage = $L("This item cannot be deleted from your phone.");
            }
        } else {
            if (this.accounts !== undefined && this.accounts instanceof Array && this.accounts.length > 0) {
                removedItems[removedItems.length] = $L('•Related accounts & data');
            }
            if (this.dockMode !== undefined && this.dockMode === true) {
                removedItems[removedItems.length] = $L('•Dock components');
            }
            //TODO: revise check once API in place.  Docs not super clear on the exact value being passed (ie.) true, false, emopty string, etc.
            if (this.universalSearch !== undefined && this.universalSearch !== false && (this.universalSearch === true || this.universalSearch !== '')) {
                removedItems[removedItems.length] = $L('•Universal Search plugins');
            }
            if (removedItems.length < 1) {
                if (deleteType === 'application') {
                    deleteMessage = $L("Are you sure you want to delete this application from your phone?");
                } else {
                    deleteMessage = $L("Are you sure you want to delete this item from your phone?");
                }
            } else {
                removable = true;
                if (deleteType === 'application') {
                    deleteMessage = $L("Deleting #{appName} also removes:").interpolate({
                        appName: this.title
                    }) + "<br>";
                    for (var a = 0; a < removedItems.length; a++) {
                        deleteMessage += removedItems[a] + "<br>";
                    }
                } else {
                    deleteMessage = $L("Deleting this item removes:") + "<br>";
                    for (var a = 0; a < removedItems.length; a++) {
                        deleteMessage += removedItems[a] + "<br>";
                    }
                }
            }
        }
        return {
            "deleteTitle": deleteTitle,
            "deleteMessage": deleteMessage,
            "removable": removable
        };
    },
    setPromoLink: function(promoLink) {
        this.promoLink = promoLink;
    }
});

/*
    "icon download current" -> findApps.AppState.Downloading
    "icon download complete" -> findApps.AppState.Downloading
    "icon download paused" -> findApps.AppState.Paused

    "ipk download current" -> findApps.AppState.Downloading
    "ipk download complete" -> findApps.AppState.Downloading
    "ipk download paused" -> findApps.AppState.Paused

    "installing" -> findApps.AppState.Installing
    "installed" -> findApps.AppState.Installed
    "removing" -> findApps.AppState.Removing
    "removed" -> findApps.AppState.Download
    "canceled" -> findApps.AppState.Download
    "download failed" -> findApps.AppState.DownloadFailed
    "install failed" -> findApps.AppState.InstallFailed
    "remove failed" -> findApps.AppState.Initial
    "unknown" -> findApps.AppState.Initial
 * 
 * 
 * 
 */
findApps.AppDownload.map2AppState = function(status){
    var appState = "findApps.AppState.Initial";
    switch(status){
        case "icon download current":
            appState = "findApps.AppState.Downloading";
            break;
        case "icon download complete":
            appState = "findApps.AppState.Downloading";
            break;
        case "icon download paused":
            appState = "findApps.AppState.Paused";
            break;
        case "ipk download current":
            appState = "findApps.AppState.Downloading";
            break;
        case "ipk download complete":
            appState = "findApps.AppState.Downloading";
            break;
        case "ipk download paused":
            appState = "findApps.AppState.Paused";
            break;
        case "installing":
            appState = "findApps.AppState.Installing";
            break;
        case "installed":
            appState = "findApps.AppState.Installed";
            break;
        case "removing":
            appState = "findApps.AppState.Removing";
            break;
        case "removed":
            appState = "findApps.AppState.Download";
            break;
        case "canceled":
            appState = "findApps.AppState.Download";
            break;
        case "download failed":
            appState = "findApps.AppState.DownloadFailed";
            break;
        case "install failed":
            appState = "findApps.AppState.InstallFailed";
            break;
    }
    return appState;
};
