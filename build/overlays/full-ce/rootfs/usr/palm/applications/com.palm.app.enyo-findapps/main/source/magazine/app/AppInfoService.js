/* A plain and simple cache object to keep the app details in memory while the magazine is loaded.
TODO: add some expiration mechanism, so app info get refreshed periodically */
MagazineAppInfoCache = {
    appCache: [],
    insertAppDetailsBulk: function(apps) {
        var i, appInfo;
        for (i = 0; i < apps.length; i++) {
            appInfo = apps[i];
            if (!this.appCache[appInfo.id]) {
                this.appCache[appInfo.id] = appInfo;
            }
        }
    },
    getAppDetails: function(appId) {
        return this.appCache[appId];
    }
};
/* Encapsulates the interaction with ACServer to retrive and cache application list
*/
enyo.kind({
    name: "enyo.FindApps.Magazine.AppInfoService",
    kind: enyo.Component,
    partialAppDetails: [],
    asynchGetAppDetailsPending: false,
    bindingPath: "",
    events: {
        onPrefetchAppDetailsBulkResponse: "",
        onGetAppDetails: "",
        onGetAppList: ""
    },
    components: [{
        name: "prefetchAppDetailsBulk",
        kind: "MockService",
        requestKind: "enyo.FindApps.Magazine.AppInfoService.MockService.Request",
        method: "prefetchAppDetailsBulk",
        onSuccess: "prefetchAppDetailBulkSuccess",
        onFailure: "prefetchAppDetailBulkFailed"
    }, {
        name: "bindingHelper",
        kind: "enyo.FindApps.Magazine.BindingHelper"
    }],
    /* This function tries to retrieve the app info for the given set of
       application package ids from the AppInfoCache if possible, if not 
       it will try to get them directly from the Cloud Services.
    */
    getAppList: function(requestParams) {
        this.asynchGetAppDetailsPending = false;
        this.partialAppDetails = [];
        var nonCachedApps = [];
        var packageIds = requestParams["packageIds"];
        this.bindingPath = requestParams["binding"];
        var i, appId;
        for (i = 0; i < packageIds.length; i++) {
            appId = packageIds[i];
            var appInfo = MagazineAppInfoCache.getAppDetails(appId);
            // not available in the cache, fetching it from the server
            if (!appInfo) {
                nonCachedApps.push(appId);
            // already in the cache, keeping it in the partial list to be merged with other apps potentially not in the cache
            } else {
                this.partialAppDetails.push(appInfo);
            }
        }
        if (nonCachedApps.length > 0) {
            this.asynchGetAppDetailsPending = true;
            this._getAppListFromCatalogService(nonCachedApps);
        } else {
            this._returnResponse(this.partialAppDetails);
        }
    },
    _getAppListFromCatalogService: function(inPackageIds) {
        var inProps = {
            onSuccess: "handleCatalogServerResponse",
            onFailure: "handleCatalogServerError",
            scope: this
        }
        findApps.BaseServer.getACServer().getAppList({
            "packageIds": inPackageIds,
            "count": inPackageIds.length || 0
        }, "SearchAppsService", inProps);
    },
    handleCatalogServerResponse: function(inSender, inResponse, inRequest, props) {
        if (inResponse.JSONException) {
            return this._returnResponse();
        }
        switch (props.service) {
            case "SearchAppsService":
                if (inResponse.OutGetAppList) {
                    this._processGetAppListResponse(inResponse);
                } else {
                    return this._returnResponse();
                }
                break;
            default:
                this.error("AppInfo Service: UNKNOWN SERVICE");
                break;
        }
    },
    _processGetAppListResponse: function(inResponse) {
        var canonicalAppInfo = this.$.bindingHelper.getCanonicalAppInfo(inResponse);
        MagazineAppInfoCache.insertAppDetailsBulk(canonicalAppInfo);
        this._returnResponse(canonicalAppInfo);
    },
    _returnResponse: function(inResponse) {
        var mergedResponse = [];
        if (inResponse) {
            mergedResponse = inResponse;
            // Pending applications coming from the AppInfo Cache
            if (this.asynchGetAppDetailsPending) {
                this.asynchGetAppDetailsPending = false;
                mergedResponse = inResponse.concat(this.partialAppDetails);
            }
        }
        this.doGetAppList(mergedResponse);
    },
    handleCatalogServerError: function(inSender, inResponse, inRequest, props) {
        return this._returnResponse();
    }
});
