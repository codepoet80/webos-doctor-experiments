var STAGES = {};
STAGES.PATH_RESOLVE = "pathResolve";
STAGES.APP_PREFETCH = "appPrefetch";
STAGES.APP_INFO = "appInfo";
/* 
 Handler for the PATH_RESOLVE Stage, that maps any logical path defined in the bindings 
 to its corresponding physical couterpart. 

 A typical stage looks like:
 stage: {
	pending: true,
	items: [
		{bindingKey: "imagePath", logicalPath: "common/images/a.png"}
	]
 }

 In which case the handler will find the corresponding physical path for "common/images/a.png" 
 and will update the bindings value keyed by imagePath.
*/
pathBindingStageHandler = {
    buildStage: function(bindings, key, value, stage) {
        stage.items.push({
            bindingKey: key,
            logicalPath: value,
            physicalPath: ""
        });
    },
    handleRequest: function(stage) {
        var layout = this.$;
        var bindingHelper = layout.bindingHelper;
        var commonFileSet = this.magazinePage.getCommonFileSet();
        var pageFileSet = this.magazinePage.getPageFileSet();
        var resolvedItems = bindingHelper.resolveBulkPhysicalPath(commonFileSet, pageFileSet, stage.items);
        if (resolvedItems) {
            var bindings = this.bindingObject;
            var i;
            var bindingKey;
            var physicalPath;
            for (i = 0; i < resolvedItems.length; i++) {
                bindingKey = resolvedItems[i].bindingKey;
                physicalPath = resolvedItems[i].physicalPath;
                if (bindings[bindingKey] && physicalPath) {
                    bindings[bindingKey] = physicalPath;
                }
            }
            stage.pending = false;
        }
        // not an asynch processing
        return false;
    },
    handleAsyncResponse: function(stage, inResponse) {
        // Nothing here, just keeping some consistency accorss handlers
        return true;
    },
    handleAsyncFailure: function() {
        // Nothing here, just keeping some consistency accorss handlers
        return true;
    }
};
/* 
 Handler for the APP_PREFETCH Stage, that triggers the bulk fetching in advance of one or more apps from the cloud, 
 so they are already loaded at the time of the page and layouts processing. 

 A typical stage looks like:
 stage: {
	pending: true,
	items: [
		{"appId1", "appId2", "appId3"}
	]
 }
*/
prefetchBindingStageHandler = {
    buildStage: function(bindings, key, value, stage) {
        stage.items = value;
    },
    handleRequest: function(stage) {
        stage.pending = false;
        this.$.getAppDetailsService.getAppList({
            "packageIds": stage.items,
            "binding": this.bindingPath
        });
        return true;
    },
    handleAsyncResponse: function(stage, inResponse) {
        // Nothing here, just keeping some consistency accorss handlers
        return true;
    },
    handleAsyncFailure: function() {
        // Nothing here, just keeping some consistency accorss handlers
        return true;
    }
};
/* 
 Handler for the APP_INFO Stage, that resolves dynamic application properties like: rating, or price from the cloud, and updates the 
 corresponding binding entry.

 A typical stage looks like:
 stage: {
	pending: true,
	// ojects keyed by application ids
	"appId1" : {
	    // collection of properties needed for application appId1
		items: [
			{bindingKey: "appId1Price", property: "price", resolvedValue: "", resolvedFlag: false},
			{bindingKey: "appId1Rating", property: "rating", resolvedValue: "", resolvedFlag: false}
		]
	},	
	"appId2" : {
		items: [
			{bindingKey: "appId2Price", property: "price", resolvedValue: "", resolvedFlag: false},
			{bindingKey: "appId2Rating", property: "rating", resolvedValue: "", resolvedFlag: false}
		]
	}
 }

 The handler will:
 1) retrive the application details for appId1 and appId2 
 2) retrive the requested properties price and rating from each one
 3) load the actual price and the rating values from the cloud into the resolvedValue's
 4) copy the resolvedValue's into the binding[appId1Price] entries using the binding key.
 5) If the value was not resolved (retrieved from the cloud) controlled by resolvedFlag, then use N/A as the default value
*/
appInfoBindingStageHandler = {
    buildStage: function(bindings, key, value, stage) {
        var bindingHelper = this.$.bindingHelper;
        // The bindings object should have the corresponding app id when requesting 
        // app related info. If the app price is needed, then give the app id of the 
        // app your are interested in.
        var appIdKey = bindingHelper.getAppIdForVariable(value);
        var appId = bindings[appIdKey];
        if (appId) {
            var appInfo = stage[appId];
            if (!appInfo) {
                appInfo = stage[appId] = {
                    items: []
                };
            }
            // the stage has now a property named as the appid, which object has an array of
            // properties that are needed for this app (price, rating, etc)
            var appProperty = bindingHelper.getAppProperty(value);
            appInfo.items.push({
                bindingKey: key,
                property: appProperty,
                resolvedValue: "",
                resolvedFlag: false
            });
        }
    },
    handleRequest: function(stage) {
        stage.pending = false;
        var appIds = [];
        var appInfo = {};
        var i;
        for (appId in stage) {
            appInfo = stage[appId];
            // avoding other stage attributes like the pending flag, etc.
            isAppInfo = typeof appInfo != 'function' && appInfo.items;
            if (isAppInfo) {
                appIds.push(appId);
            }
        }
        this.$.getAppDetailsService.getAppList({
            "packageIds": appIds,
            "binding": this.bindingPath
        });
        return true;
    },
    handleAsyncResponse: function(stage, inResponse) {
        var bindings = this.bindingObject;
        if (!bindings) {
            return false;
        }
        if (inResponse.length && inResponse.length > 0) {
            var i;
            for (i = 0; i < inResponse.length; i++) {
                // getting the i-th application info object from the inResponse array of apps
                var responseAppInfo = inResponse[i];
                // the stage should have objects keyed by the app id.
                var stageAppInfo = stage[responseAppInfo.id];
                if (stageAppInfo) {
                    var j;
                    // every stage app info object has an array of dynamic properties to be resolved
                    for (j = 0; j < stageAppInfo.items.length; j++) {
                        var appPropertyItem = stageAppInfo.items[j];
                        if (appPropertyItem && appPropertyItem.property && appPropertyItem.bindingKey) {
                            appPropertyItem.resolvedValue = responseAppInfo[appPropertyItem.property];
                            if (appPropertyItem.resolvedValue !== undefined) {
                                //if (appPropertyItem.resolvedValue) {
                                appPropertyItem.resolvedFlag = true;
                            }
                            bindings[appPropertyItem.bindingKey] = appPropertyItem.resolvedValue;
                        }
                    }
                }
            }
        }
        var appId;
        // Sanitizing still missing dynamic variables
        for (appId in stage) {
            appInfo = stage[appId];
            // avoding other stage attributes like the pending flag, etc.
            isAppInfo = typeof appInfo != 'function' && appInfo.items;
            if (isAppInfo) {
                for (j = 0; j < appInfo.items.length; j++) {
                    var appPropertyItem = appInfo.items[j];
                    if (appPropertyItem && !appPropertyItem.resolvedFlag) {
                        appPropertyItem.resolvedValue = "N/A";
                        bindings[appPropertyItem.bindingKey] = appPropertyItem.resolvedValue;
                    }
                }
            }
        }
        return true;
    },
    handleAsyncFailure: function() {
        return false;
    }
};
