enyo.kind({
    name: "findApps.AccountParamsFetcher",
    kind: enyo.Object,
    constructor: function() {
        this.fetchInProgress = false;
        this._listeners = [];
        this.inherited(arguments);
    },

    addToListeners: function(callback) {
        this._listeners.push(callback);
    },
    sendEventToListeners: function(returnVal) {
        if(this._listeners) {
            for(var i in this._listeners) {
                var calleeObj = this._listeners[i];
                this.returnCall(calleeObj, returnVal);
            }
        }
    },
    returnCall: function(calleeObj, returnVal) {
        if(returnVal === true)
            calleeObj.scope[calleeObj.methodName].apply(calleeObj.scope, calleeObj.params);
        else
            calleeObj.scope[calleeObj.onError].apply(calleeObj.scope, calleeObj.onErrorParams);
    },
    fetchAccountParams: function(callback) {
        if(this.fetchInProgress === true) {
            this.addToListeners(callback);
            return;
        }
        else if(findApps.UserSession._token && findApps.UserSession._email && findApps.UserSession._serverUrl && findApps.UserSession._server2Url && findApps.UserSession._deviceId) {
            this.returnCall(callback, true);
        }
        else {
            this.fetchInProgress = true;
            this.addToListeners(callback);
            findApps.UserSession._callerVersion = enyo.fetchAppInfo().version;

            this.requiredParams = 3;
            var that = this;
            // Local scope functions
            var getAccountToken= function() {
                if(!(findApps.UserSession._token && findApps.UserSession._email)) {
                    findApps.AccountServices.getInstance().getAccountToken({
                        onSuccess: "gotTokenAndEmail", 
                        onFailure: "gotTokenAndEmailError", 
                        scope: that
                    });
                }
                else {
                    that.requiredParams--;
                    that.sendParamsReady("tokenemail");
                }	
            };
	            
            var getServerUrl = function() {
                if(!(findApps.UserSession._serverUrl && findApps.UserSession._server2Url)) {
                    findApps.AccountServices.getInstance().getServerUrl({
                        onSuccess: "gotUrl", 
                        onFailure: "gotUrlError", 
                        scope: that
                    });
                }
                else {
                    that.requiredParams--;
                    that.sendParamsReady("serverurl");
                }		
            };
	            
            var getDeviceId = function() {
                if(!findApps.UserSession._deviceId) {
                    findApps.DeviceProfile.getInstance().getDeviceId({
                        onSuccess: "gotDeviceId", 
                        onFailure: "gotDeviceIdError", 
                        scope: that
                    });
                }
                else {
                    that.requiredParams--;
                    that.sendParamsReady("deviceid");
                }	
            };

            // Get the account token information
            getAccountToken();
            getServerUrl();
            getDeviceId();
            this.getDeviceProfile();
        }
    },
    
    sendParamsReady: function() {
        if(this.requiredParams > 0)
            return;
        this.fetchInProgress = false;
        if(findApps.UserSession._token && findApps.UserSession._email && findApps.UserSession._serverUrl && findApps.UserSession._server2Url && findApps.UserSession._deviceId) {
            // Trigger an event indicating that the required account parameters are available
            this.sendEventToListeners(true);
        }
        else
            this.sendEventToListeners(false);
    }
    ,
    getDeviceProfile: function() {
        if(!findApps.UserSession._softwareBuildBranch) {
            findApps.DeviceProfile.getInstance().getDeviceProfile({
                onSuccess: "gotDeviceProfile", 
                onFailure: "deviceprofileFailure", 
                scope: this
            });
        }
    },
    
    deviceprofileFailure: function(inSender, inResponse) {
        this.error("Device Profile command failed");
    },
    
    gotTokenAndEmail: function(inSender, inResponse) {
        findApps.UserSession._token = inResponse.token;
        findApps.UserSession._email = inResponse.accountAlias;
        findApps.UserProfile.email = inResponse.accountAlias;
        this.requiredParams--;
        this.sendParamsReady("tokenemail");
    },
    gotTokenAndEmailError: function(inSender, inResponse) {
        this.error("Could not fetch token and email");
        this.requiredParams--;
        this.sendParamsReady("tokenemail");
    },
    gotUrl: function(inSender, inResponse) {
        findApps.UserSession._serverUrl = inResponse.serverUrl;
        // ACS2 server URL is different than ACS1 server URL
        // Account Services currently returns ACS1 server URL
        // This code is used to compute ACS2 server URL
        // After all ACS calls are moved to ACS2, account services can be updated to return
        // the ACS2 server URL directly
        var matches = /([^&]*):\/\/([^&/]*)\/([^&]*)/.exec(findApps.UserSession._serverUrl);
        findApps.UserSession._server2Url = matches[1] + "://" + matches[2] + "/appcatalog/2.0/";
        this.requiredParams--;
        this.sendParamsReady("serverurl");
    },
    gotUrlError:function(inSender, inResponse) {
        this.error("Could not fetch server url");
        this.requiredParams--;
        this.sendParamsReady("serverurl");
    },
    gotDeviceId: function(inSender, inResponse) {
        findApps.UserSession._deviceId = inResponse.deviceId;
        this.requiredParams--;
        this.sendParamsReady("deviceid");
    },
    gotDeviceIdError: function(inSender, inResponse) {
        this.error("Could not fetch device id");
        this.requiredParams--;
        this.sendParamsReady("deviceid");
    },
    gotDeviceProfile: function(inSender, inResponse) {
        findApps.UserSession._softwareBuildBranch = inResponse.deviceInfo.softwareBuildBranch;
    }
});