enyo.kind({
    name: "findApps.BaseServer",
    kind: enyo.Object,

    getAuthHeaders: function() {
        if (findApps.BaseServer._authHeaders == null) {
            findApps.BaseServer._authHeaders = (findApps.UserSession._token && findApps.UserSession._deviceId && findApps.UserSession._email) ? {
                "Authorization": "PalmAuth token=" + findApps.UserSession._token,
                "X-Palm-Device-Id": findApps.UserSession._deviceId,
                "X-Palm-Profile-Email": findApps.UserSession._email,
                "X-Palm-AppCat-Caller-ID": "acc",
                "X-Palm-AppCat-Caller-Version": findApps.UserSession._callerVersion
            } : null;
        }
        return findApps.BaseServer._authHeaders;
    },
    callServer: function(inParams, inProps) {
        var url = inParams.url;
        var body = inParams.body;
        var service = inParams.service;
        var expires = inParams.expires;
        
        this.log("ACS1 server call: URL: ", url, "Service: ", service, "Request: ", body);
        
        findApps.WebService.getInstance().sendRequest(enyo.mixin({
            contentType: "application/json",
            method: "POST",
            handleAs: "json",
            url: url,
            body: enyo.json.stringify(body),
            timeout: AppCatalog.Config.wsTimeout,
            service: service,
            expires: expires
        }, inProps));
    },
    // GET and POST requests to ACS2
    // httpMethod indicates POST / PUT / GET
    callServer1: function(inParams, inProps) {
        var url = inParams.url;
        var body = inParams.body;
        var service = inParams.service;
        var expires = inParams.expires;
        var httpMethod = inParams.httpMethod;
        
        this.log("ACS2 server call: URL: ", url, "Service: ", service, "Request: ", body);
        
        var headers = this.getAuthHeaders();
        findApps.WebService.getInstance().sendRequest(enyo.mixin({
            contentType: "application/json",
            method: body?httpMethod || "POST":"GET",
            handleAs: "json",
            url: url,
            headers: headers,
            body: body?enyo.json.stringify(body):null,
            timeout: AppCatalog.Config.wsTimeout,
            service: service,
            expires: expires
        }, inProps));
    },
    //For calling with with wapproxy or wan interface
    callServer3: function(inParams, inProps) {
        var url = inParams.url;
        var service = inParams.service;
        var wapProxy = inParams.wapProxy;
        var headers = inParams.headers;
        
        this.log("server call through proxy: URL: ", url, "Service: ", service, "wapProxy: ", wapProxy, "headers: ", headers);
       
	    findApps.WebService.getInstance().sendRequest(enyo.mixin({
	            contentType: "application/xml",
	            method: "POST",
	            url: url,
	            headers: headers,
	            timeout: AppCatalog.Config.wsTimeout,
	            service: service
	        }, inProps));
    },
    
	fetchAccountParams: function(scope, args, callback) {
		
		var paramsFetcher = enyo.application.paramsFetcher = enyo.application.paramsFetcher || new findApps.AccountParamsFetcher();
		var argsArr = Array.prototype.slice.apply(args);
		
		paramsFetcher.fetchAccountParams({"scope": scope, "methodName": callback, "params": argsArr, "onError": "handleAccountParamsError", "onErrorParams": [args.service, args.inProps]});
	},
	getMethodName: function(s) {
        return s.split(".").pop().replace("()", "");
    }
});

enyo.mixin(findApps.BaseServer, {
	_categoriesMap: null,
    // this should only be done once
    buildCategoriesMap: function() {
        var categories = findApps.UserSession._session.categories;
        var categoriesMap = {};
        for (var i in categories) {
            categoriesMap[categories[i].categoryId] = categories[i];
            var subcategories = categories[i].subcategories;
            for (var j in subcategories) {
                categoriesMap[subcategories[j].categoryId] = subcategories[j];
                categoriesMap[subcategories[j].categoryId].parentId = categories[i].categoryId;
            }
        }
        this._categoriesMap = categoriesMap;
    },
    isPurchased: function(packageId) {
        if (findApps.UserSession._session && findApps.UserSession._session.purchasedApplications && findApps.UserSession._session.purchasedApplications.apps) {
            if (findApps.UserSession._session.purchasedApplications.apps.indexOf(packageId) == -1) return false;
            else return true;
        }
        return false;
    },
    getCategoryItem: function(categoryId) {
        return this._categoriesMap[categoryId];
    },
    getCategoryInfo: function(categoryId) {
        if (categoryId == "") {
            return {
                label: $L("All results"),
                icon: ""
            };
        }
        var categoryItem = this.getCategoryItem(categoryId);
        if (categoryItem) {
            var parentCategoryItem = this.getCategoryItem(categoryItem.parentId);
            if (parentCategoryItem) {
                return {
                    label: enyo.macroize("{$par} / {$item}", {
                        par: parentCategoryItem.label,
                        item: categoryItem.label
                    }),
                    icon: "images/" + (categoryItem.iconLocation || parentCategoryItem.iconLocation || "category-icons/home/") + "category-selector.png"
                };
            } else {
                return {
                    label: categoryItem.label,
                    icon: "images/" + (categoryItem.iconLocation || "category-icons/home/") + "category-selector.png"
                };
            }
        }
        return null;
    },
    // Categories that are bound to the user settings
    getRelevantSearchCategories: function(categories) {
        var relevant_categories = [];
        for (var i in categories) {
            /*
        if(this.getCategoryItem(categories[i].id)) {
          relevant_categories.unshift(categories[i]);
        }
        */
            // Fix APPC-6764: filter out all main categories
            var ci = this.getCategoryItem(categories[i].id);
            if (ci && !ci.parentId) {
                relevant_categories.unshift(categories[i]);
            }
        }
        // adding All result category
        return relevant_categories;
    },
    getACServer: function() {
        findApps.BaseServer._ACServer = findApps.BaseServer._ACServer || new findApps.ACServer();
        return findApps.BaseServer._ACServer;
    },
    getPMTServer: function(){
        findApps.BaseServer._PMTServer = findApps.BaseServer._PMTServer || new findApps.PMTServer();
        return findApps.BaseServer._PMTServer;
    },
    
    destroy: function() {
    	findApps.WebService.destroy();
    	findApps.BaseServer._PMTServer = null;
    	findApps.BaseServer._ACServer = null;
    	this._categoriesMap = null;
    	
    }
});
