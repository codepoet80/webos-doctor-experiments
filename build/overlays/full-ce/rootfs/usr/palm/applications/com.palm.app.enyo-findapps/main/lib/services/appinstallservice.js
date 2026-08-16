enyo.kind({
    name: "findApps.AppInstallService",
    kind: "PalmService",
    service: "palm://com.palm.appInstallService/",
    install: function(app, successCallBack, failureCallBack) {
        this.subscribe = false;
        var transactionId = new Date().getTime();
        var inParams = {
            catalogId: app.id,
            id: app.publicApplicationId,
            title: app.title,
            version: app.serverVersion,
            vendor: app.vendor,
            vendorUrl: app.vendorUrl,
            iconUrl: app.iconUrl,
            ipkUrl: app.packageUrl,
            authToken: findApps.UserSession._token,
            deviceId: findApps.UserSession._deviceId,
            email: findApps.UserSession._email,
            noApp: app.appType === "app" ? false : true,
            services: app.services,
            accounts: app.accounts,
            dockMode: app.dockMode,
            universalSearch: app.universalSearch,
            loc_name: app.title,
            transactionId: '' + transactionId
        };
        var inProps = {
            method: "install",
            onSuccess: successCallBack,
            onFailure: failureCallBack
        }
        this.log("appinstallservice: install: params ", inParams, " props: ", inProps);
        this.call(inParams, inProps);
    },
    status: function(successCallBack, failureCallBack) {
        this.subscribe = true;
        var inParams = {};
        var inProps = {
            method: "status",
            onSuccess: successCallBack,
            onFailure: failureCallBack
        }
        this.log("appinstallservice: status: params ", inParams, " props: ", inProps);
        this.call(inParams, inProps);
    },
    pause: function(publicApplicationId, successCallBack, failureCallBack) {
        this.subscribe = false;
        var inParams = {
            "id": publicApplicationId
        };
        var inProps = {
            method: "pause",
            onSuccess: successCallBack,
            onFailure: failureCallBack
        }
        this.log("appinstallservice: pause: params ", inParams, " props: ", inProps);
        this.call(inParams, inProps);
    },
    resume: function(publicApplicationId, successCallBack, failureCallBack) {
        this.subscribe = false;
        var inParams = {
            "id": publicApplicationId
        };
        var inProps = {
            method: "resume",
            onSuccess: successCallBack,
            onFailure: failureCallBack
        }
        this.log("appinstallservice: resume: params ", inParams, " props: ", inProps);
        this.call(inParams, inProps);
    },
    cancel: function(publicApplicationId, successCallBack, failureCallBack) {
        this.subscribe = false;
        var inParams = {
            "id": publicApplicationId
        };
        var inProps = {
            method: "cancel",
            onSuccess: successCallBack,
            onFailure: failureCallBack
        }
        this.log("appinstallservice: cancel: params ", inParams, " props: ", inProps);
        this.call(inParams, inProps);
    },
    remove: function(publicApplicationId, successCallBack, failureCallBack) {
        this.subscribe = false;
        var inParams = {
            "id": publicApplicationId
        };
        var inProps = {
            method: "remove",
            onSuccess: successCallBack,
            onFailure: failureCallBack
        }
        this.log("appinstallservice: remove: params ", inParams, " props: ", inProps);
        this.call(inParams, inProps);
    },
    installLocal: function(app, successCallBack, failureCallBack) {
        this.subscribe = false;
        var inParams = {
            id: app.id,
            version: app.version,
            title: app.loc_name,
            ipkUrl: app.ipkgUrl,
            iconUrl: app.iconUrl,
            vendor: app.vendor
        };
        var inProps = {
            method: "installLocal",
            onSuccess: successCallBack,
            onFailure: failureCallBack
        }
        this.log("appinstallservice: installLocal: params ", inParams, " props: ", inProps);
        this.call(inParams, inProps);
    }
});
