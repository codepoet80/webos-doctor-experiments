/* Copyright 2009 Palm, Inc.  All rights reserved. */
enyo.kind({
    name: "findApps.ApplicationManager",
    kind: findApps.PalmService,
    service: 'palm://com.palm.applicationManager/',
    getInstalledApplications_V2: function(successCallback, failureCallback, scope) {
        this.subscribe = false;
        var inParams = {};
        var inProps = {
            method: "listPackages"
        }
        this.call(inParams, findApps.PalmService.addCallbackProps(inProps, successCallback, failureCallback, scope));
    },
    openApplication: function(name, passedParams, launchinnewgroup, successCallback, failureCallback, scope) {
        this.subscribe = false;
        var appParams = passedParams;
        if (!appParams) appParams = {};
        // DFISH-16541: Some application(for example: People) does not compatible for parameter {launchinnewgroup:true},
        // so comments following parameter setting action.
        // appParams.launchinnewgroup = launchinnewgroup;
        var inParams = {
            id: name,
            params: appParams
        };
        var inProps = {
            method: "open"
        }
        this.call(inParams, findApps.PalmService.addCallbackProps(inProps, successCallback, failureCallback, scope));
    },
    launchApplication: function(name, params, successCallback, failureCallback, scope) {
        this.subscribe = false;
        var inParams = {
            id: name,
            params: params
        };
        var inProps = {
            method: "launch"
        }
        this.call(inParams, findApps.PalmService.addCallbackProps(inProps, successCallback, failureCallback, scope));
    },
    launchPointChanges: function(successCallback, failureCallback, scope) {
        this.subscribe = true;
        var inParams = {};
        var inProps = {
            method: "launchPointChanges",
            subscribe: true
        }
        this.call(inParams, findApps.PalmService.addCallbackProps(inProps, successCallback, failureCallback, scope));
    },
    openBrowserPage: function(url, successCallback, failureCallback, scope) {
        this.subscribe = false;
        this.openApplication("com.palm.app.browser", "{\"target\": \"" + url + "\"}", true, successCallback, failureCallback, scope);
    }
});

findApps.ApplicationManager.getInstance = function(){
    findApps.ApplicationManager._singleton = findApps.ApplicationManager._singleton || new findApps.ApplicationManager();
    return findApps.ApplicationManager._singleton;
}

findApps.ApplicationManager.destroy = function() {
	findApps.ApplicationManager._singleton = null;
}
