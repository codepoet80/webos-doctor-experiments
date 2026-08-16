enyo.kind({
    name: "findApps.ACServer",
    kind: "findApps.BaseServer",

    getSession: function(service, inProps) {
        var endpoint = "user/session";
        if (!findApps.UserSession.getSession()) {
            // Check if the account parameters are available
        	var paramsAvailable = this.isAccountParamsAvail();
        	if(paramsAvailable) {
		        var inParams = {
		            url: findApps.UserSession._server2Url + enyo.g11n.currentLocale().toISOString() + "/" + endpoint,
		            service: "SessionService"
		        };
		        this.callServer1(inParams, inProps);
            }   
        	else
        		this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
        }
    },
    setCountryCode: function(code, service, inProps) {
        // Check if the account parameters are available
    	var paramsAvailable = this.isAccountParamsAvail();
    	if(paramsAvailable) {
	        var endpoint = "user/profile/devices/" + findApps.UserSession._deviceId;
	        var inParams = {
	            url: findApps.UserSession._server2Url + endpoint,
	            body: code,
	            service: service
	        };
	        this.callServer1(inParams, inProps);
    	}
    	else
    		this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
    },
    getCountryList: function(service, inProps) {
        // Check if the account parameters are available
    	var paramsAvailable = this.isAccountParamsAvail();
    	if(paramsAvailable) {
	        var endpoint = "support/firstUseCountryList";
	        var inParams = {
	            url: findApps.UserSession._server2Url + endpoint,
	            service: service
	        };
	        this.callServer1(inParams, inProps);
    	}
    	else
    		this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
    },
    /**
     * This method fetches the Application Details from the server
     * ACS1 Server call: appDetail_ext2
     */
    getApplicationDetails: function(appId, packageId, locale, service, ignoreCache, inProps) {
        // Check if the account parameters are available
    	var paramsAvailable = this.isAccountParamsAvail();
    	if(paramsAvailable) {
	        var endpoint = "appDetail_ext2";
	        var body = {
	            InGetAppDetailV2: {
	                accountTokenInfo: findApps.UserSession.getAccountToken(),
	                packageId: packageId,
	                locale: locale,
	                appId: appId?appId:undefined
	            }
	        };
	        
	        var expires = new Date(new Date().getTime() + AppCatalog.Config.CacheConfig.longTermTTL);
	        var inParams = {
	            url: findApps.UserSession._serverUrl + endpoint,
	            body: body,
	            service: service,
	            expires: ignoreCache?undefined:expires
	        };
	        this.callServer(inParams, inProps);
    	}
    	else
    		this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
    },
    /**
     * This method fetches the user's review
     * ACS1 call: getMyRating
     */
    getMyRating: function(appid, packageid, service, inProps) {
        // Check if the account parameters are available
    	var paramsAvailable = this.isAccountParamsAvail();
    	if(paramsAvailable) {
	        var endpoint = "getMyRating";
	        var body = {
	            InGetMyRating: {
	                accountTokenInfo: findApps.UserSession.getAccountToken(),
	                publicApplicationId: packageid
	            }
	        };
	        var inParams = {
	            url: findApps.UserSession._serverUrl + endpoint,
	            body: body,
	            service: service
	        };
	        this.callServer(inParams, inProps);
    	}
    	else
    		this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
    },
    /**
     * This method fetches the list of reviews for the selected application and device locale.
     * It fetches -ve / +ve reviews based on the user selection
     * ACS2 Server call:/apps/<packageid>/reviews/?sign=<>&offset=<>&count=<>
     */
    getAppReviewsList: function(appid, packageid, sign, offset, count, service, inProps) {
        // Check if the account parameters are available
    	var paramsAvailable = this.isAccountParamsAvail();
    	if(paramsAvailable) {
	        var endpoint = "/apps/" + packageid + "/reviews/?sign=" + sign + "&offset=" + offset + "&count=" + count;
	        var expires = new Date(new Date().getTime() + AppCatalog.Config.CacheConfig.shortTermTTL);
	        var inParams = {
	            url: findApps.UserSession._server2Url + enyo.g11n.currentLocale().toISOString() + "/" + endpoint,
	            service: service,
	            expires: expires
	        };
	        this.callServer1(inParams, inProps);
    	}
    	else
    		this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
    },
    /**
     * This method marks a review as useful / unuseful.
     * ACS2 server call: /apps/<packageid>/reviews/<reviewid>
     * This is a POST call, with payload as: {"usefulToMe": true / false}
     */
    updateReviewOfReview: function(appid, packageid, version, reviewId, usefulToMe, service, inProps) {
        // Check if the account parameters are available
    	var paramsAvailable = this.isAccountParamsAvail();
    	if(paramsAvailable) {
	        var endpoint = "/apps/" + packageid + "/reviews/" + reviewId;
	        var payload = {
	            "usefulToMe": usefulToMe,
	            "packageId": packageid,
	            "version": version,
	            "reviewId": reviewId
	        };
	        var inParams = {
	            url: findApps.UserSession._server2Url + enyo.g11n.currentLocale().toISOString() + "/" + endpoint,
	            body: payload,
	            service: service
	        };
	        this.callServer1(inParams, inProps);
    	}
    	else
    		this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
    },
    getAppList: function(params, service, inProps) {
        // Check if the account parameters are available
    	var paramsAvailable = this.isAccountParamsAvail();
    	if(paramsAvailable) {
	        var endpoint = "appList_ext2";
	        var body = {
	            InGetAppListV2: {
	                accountTokenInfo: findApps.UserSession.getAccountToken(),
	                queryStr: params.queryStr || "",
	                queryFragment: params.queryFragment || "",
	                qid: params.qid || "",
	                listId: params.listId || "",
	                categoryid: params.categoryid || "",
	                tagName: params.tagName || "",
	                provides: params.provides || "",
	                startPosition: params.startPosition || 0,
	                // setting count to 200 by default
	                count: params.count || AppCatalog.Config.defaultPageSize,
	                sort: params.sort || "DATE_DESC",
	                locale: params.locale || enyo.g11n.currentLocale().toISOString(),
	                includeImages: params.includeImages || "true",
	                includeCategoryBreakdown: params.includeCategoryBreakdown || "false",
	                packageIds: params.packageIds || [],
		            // this "filterBadges" parameter tell server filter out special type(for touchpad only/ 
		            // for phone only/ all) of applications
		            filterBadges: params.appFilterType || "all"
	            },
	            // this id is not used by the server, but will be used by the client side to relate
	            // the response with the request. This id if passed will be used to deal with out of order responses
	            corelationId: params.corelationId || ""
	        }
	        if (params.developerId && params.developerId != 0) body.InGetAppListV2.developerId = params.developerId;
	        var expires = new Date(new Date().getTime() + AppCatalog.Config.CacheConfig.longTermTTL);
	        var inParams = {
	            url: findApps.UserSession._serverUrl + endpoint,
	            body: body,
	            service: service,
	            expires: expires
	        };
	        this.callServer(inParams, inProps);
    	}
    	else
    		this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
    },
    /**
     * This method is used to submit a user review. 
     * ACS2 server call: /apps/<packageid>/reviews/ - PUT method
     */
    addUserReview: function(appid, packageid, version, locale, comment, score, name, service, inProps) {
        // Check if the account parameters are available
    	var paramsAvailable = this.isAccountParamsAvail();
    	if(paramsAvailable) {
	        var body = {
	            packageId: packageid,
	            version: version,
	            locale: locale,
	            creator: name,
	            comments: comment,
	            rating: score
	        };
	        var endpoint = "/apps/" + packageid + "/reviews/";
	        var inParams = {
	            url: findApps.UserSession._server2Url + enyo.g11n.currentLocale().toISOString() + "/" + endpoint,
	            body: body,
	            service: service,
	            httpMethod: "PUT"
	        };
	        this.callServer1(inParams, inProps);
    	}
    	else
    		this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
    },
    /**
     * This method is used to update existing user review. 
     * ACS2 server call: /apps/<packageid>/reviews/<reviewid> - PUT method
     */
    updateUserReview: function(appid, packageid, version, locale, reviewId, comment, score, name, service, inProps) {
        // Check if the account parameters are available
    	var paramsAvailable = this.isAccountParamsAvail();
    	if(paramsAvailable) {
	        var body = {
	            id: reviewId,
	            packageId: packageid,
	            version: version,
	            locale: locale,
	            creator: name,
	            comments: comment,
	            rating: score
	        };
	        var endpoint = "/apps/" + packageid + "/reviews/" + reviewId;
	        var inParams = {
	            url: findApps.UserSession._server2Url + enyo.g11n.currentLocale().toISOString() + "/" + endpoint,
	            body: body,
	            service: service,
	            httpMethod: "PUT"
	        };
	        this.callServer1(inParams, inProps);
    	}
    	else
    		this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
    },
    /**
     * This method is used to report a problem with the application.
     * ACS1 server call: addUserRating
     */
    reportProblem: function(appid, packageid, comment, score, locale, name, anonymous, inappropriate, problemType, service, inProps) {
        // Check if the account parameters are available
    	var paramsAvailable = this.isAccountParamsAvail();
    	if(paramsAvailable) {
	        var endpoint = "addUserRating";
	        var body = {
	            InAddUserRating: {
	                userRatingItem: {
	                    score: Math.round(score),
	                    // Server requires score to be an interger
	                    comment: comment,
	                    accountId: name || "",
	                    locale: locale,
	                    isAnonymous: anonymous,
	                    isInappropriate: inappropriate,
	                    appId: appid,
	                    publicApplicationId: packageid,
	                    complaintType: problemType
	                },
	                accountTokenInfo: findApps.UserSession.getAccountToken()
	            }
	        };
	        var inParams = {
	            url: findApps.UserSession._serverUrl + endpoint,
	            body: body,
	            service: service
	        };
	        this.callServer(inParams, inProps);
    	}
    	else
    		this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
    },
    getListOfUpdatableApps: function(packageNames, service, inProps) {
        // Check if the account parameters are available
    	var paramsAvailable = this.isAccountParamsAvail();
    	if(paramsAvailable) {
	        var endpoint = "getListOfUpdatableApps";
	        var body = {
	            InGetUpdatableApps: {
	                accountTokenInfo: findApps.UserSession.getAccountToken(),
	                packageIds: packageNames
	            }
	        };
	        var inParams = {
	            url: findApps.UserSession._serverUrl + endpoint,
	            body: body,
	            service: service
	        };
	        this.callServer(inParams, inProps);
    	}
    	else
    		this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
    },
    handleAccountParamsError: function(service, inProps) {
    	this.error("handleAccountParamsError: Failed to fetch account parameters. Returning failure status for service ", service);
    	var errors = ["LOC07006"];
    	// dummy response
		var inResponse = {
	            JSONException: {
	                errorCode: "LOC07006"
	            }
	     };
		var failureArgs = [this, inResponse, null, inProps, errors];
        (inProps.scope[inProps.onFailure]).apply(inProps.scope, failureArgs);
    },
    isAccountParamsAvail: function(){
	 	return findApps.UserSession.getAccountToken() && findApps.UserSession._serverUrl ? true : false;
	}
});
