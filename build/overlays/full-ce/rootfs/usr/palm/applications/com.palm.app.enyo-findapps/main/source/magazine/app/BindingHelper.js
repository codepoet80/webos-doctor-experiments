enyo.kind({
    name: "enyo.FindApps.Magazine.BindingHelper",
    kind: enyo.Component,
    recognizeBindingNames: ["bindings.json", "binding.json"],
    templateNames: ["default.lo.js", "main.lo.js"],
    portraitTemplateNames: ["portrait.lo.js"],
    landscapeTemplateNames: ["landscape.lo.js"],
    logicalPathRegex: /(\.js|\.png|\.jpg|\.gif|\.json|\.txt|\.htm|\.html)$/,
    dynamicVariableRegex: /{\$([^}]*)}/,
    appInfoRegex: /{\$(_app)(_price|_rating|_reviewCount)(_.*)?}/,
    bindingKeyToStageName: {},
    events: {
        onPrefetchAppDetailsBulkResponse: "",
        onGetAppDetails: ""
    },
    payloadPropertyLookup: {
        "_price": "price",
        "_reviewCount": "numReviews",
        "_rating": "rating"
    },
    create: function() {
        this.inherited(arguments);
        this.bindingKeyToStageName["prefetch"] = STAGES.APP_PREFETCH;
    },
    resolveBindingPath: function(pageFileSet) {
        return this._resolvePathByNamingConvention(pageFileSet, "binding", this.recognizeBindingNames);
    },
    resolveTemplatePaths: function(pageFileSet) {
        var templatePaths = [];
        // looking up the default template
        var defaultTemplatePath = this._resolvePathByNamingConvention(pageFileSet, "layout", this.templateNames);
        if (defaultTemplatePath) {
            templatePaths.push(defaultTemplatePath);
        } else {
            // no default template found, looking up custom templates for landscape and portrait
            var portraitTemplatePath = this._resolvePathByNamingConvention(pageFileSet, "layout", this.portraitTemplateNames);
            if (portraitTemplatePath) {
                templatePaths.push(portraitTemplatePath);
            }
            var landscapeTemplatePath = this._resolvePathByNamingConvention(pageFileSet, "layout", this.landscapeTemplateNames);
            if (landscapeTemplatePath) {
                templatePaths.push(landscapeTemplatePath);
            }
        }
        return templatePaths;
    },
    resolveDefaultTemplatePath: function(pageFileSet) {
        var templatePaths = [];
        var defaultTemplatePath = this._resolvePathByNamingConvention(pageFileSet, "layout", this.templateNames);
        if (defaultTemplatePath) {
            templatePaths.push(defaultTemplatePath);
        }
        return templatePaths;
    },
    /* It takes a key value pair from the bindings object and determine if it needs to be resolved.
       In which case, a given binding stage will take care of retrieving the corresponding info.
    
       It support three use cases so far:
       1) Named stage: the actual key value is used as the name of the stage.
    
       2) Logical path value: the value is a logical path that will have to be mapped
          to its corresponding physical path, which is implemented by the.
    
       3) A Dynamic variable: the value represents a dynamic variable. So far only the following variables are
          supported: {$_app_price}, {$_app_reviewCount}, {$_app_rating}.
       
       Further refactoring could be needed if new families (not "_app" related) 
       of dynamic variables are needed (ex. _reviewer_rating), and/or 
       additional stage names are required.
    
    */
    findResolvingStageName: function(key, value) {
        if (!key || !value) {
            return undefined;
        }
        var stageName = this.bindingKeyToStageName[key];
        // key not registered as a named stage
        if (!stageName) {
            var result = this.logicalPathRegex.exec(value);
            // value represents a logical path.
            if (result) {
                stageName = STAGES.PATH_RESOLVE;
            } else {
                result = this.dynamicVariableRegex.exec(value);
                // it's a dynamic variable like {$var}
                if (result) {
                    result = this.appInfoRegex.exec(value);
                    // it's an app info related variable, ex: {$_app_price}, {$_app_rating}, etc.
                    if (result) {
                        stageName = STAGES.APP_INFO;
                    }
                }
            }
        }
        return stageName;
    },
    resolvePhysicalPath: function(commonFileSet, pageFileSet, logicalPath) {
        var collectionNames = ["layout", "image", "css", "binding"];
        var physicalPath = this._resolvePhysicalByLogicalPath(collectionNames, pageFileSet, logicalPath);
        if (!physicalPath) {
            physicalPath = this._resolvePhysicalByLogicalPath(collectionNames, commonFileSet, logicalPath);
        }
        return physicalPath;
    },
    resolveBulkPhysicalPath: function(commonFileSet, pageFileSet, logicalPathsArray) {
        if (logicalPathsArray && logicalPathsArray.length > 0) {
            var i;
            for (i = 0; i < logicalPathsArray.length; i++) {
                var logicalPath = logicalPathsArray[i].logicalPath;
                var physicalPath = this.resolvePhysicalPath(commonFileSet, pageFileSet, logicalPath);
                if (physicalPath) {
                    logicalPathsArray[i].physicalPath = physicalPath;
                }
            }
        }
        return logicalPathsArray;
    },
    _resolvePhysicalByLogicalPath: function(collectionNames, fileSet, logicalPath) {
        var physicalPath;
        var i;
        for (i = 0; i < collectionNames.length; i++) {
            var collectionName = collectionNames[i];
            if (fileSet[collectionName][logicalPath]) {
                physicalPath = fileSet[collectionName][logicalPath];
                break;
            }
        }
        return physicalPath;
    },
    _resolvePathByNamingConvention: function(pageFileSet, collectionName, recognizeNames) {
        var path = undefined;
        var i;
        for (i = 0; i < recognizeNames.length; i++) {
            var key = pageFileSet.section + "/" + recognizeNames[i];
            if (pageFileSet[collectionName][key]) {
                path = pageFileSet[collectionName][key];
                break;
            }
        }
        return path;
    },
    getAppProperty: function(dynamicVar) {
        var property = "";
        var groups = this.appInfoRegex.exec(dynamicVar);
        if (groups && groups[2]) {
            property = this.payloadPropertyLookup[groups[2]];
        }
        return property;
    },
    getAppIdForVariable: function(dynamicVar) {
        var appIdKey = "";
        var result = this.appInfoRegex.exec(dynamicVar);
        if (result && !result[3]) {
            appIdKey = result[1] + "_id";
        }
        if (result && result[3]) {
            appIdKey = result[1] + "_id" + result[3];
        }
        return appIdKey;
    },
    getCanonicalAppInfo: function(serverResponse) {
        var appCount = serverResponse.OutGetAppList.appList.totalCount || 0;
        var apps = serverResponse.OutGetAppList.appList.appSummary || [];
        var appInfo, canonicalAppInfo = [];
        var i;
        // just being conservative about the appCount returned by the server.
        if (apps.length) {
            // array of apps, taking the length of the array instead of totalCount
            appCount = apps.length;
        } else {
            // not an array of apps, taking at most 1
            appCount = Math.min(1, appCount);
        }
        for (i = 0; i < appCount; i++) {
            // apps is an array of app info or could be just one actual app info
            appInfo = apps[i] || apps;
            canonicalAppInfo.push({
                id: appInfo.publicApplicationId,
                rating: appInfo.averageRating,
                numReviews: appInfo.ratingCount,
                price: appInfo.price
            });
        }
        return canonicalAppInfo;
    }
});
