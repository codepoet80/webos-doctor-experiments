/* Copyright 2009 Palm, Inc.  All rights reserved. */
enyo.kind({
    name: "findApps.ApplicationInstaller",
    kind: "PalmService",
    service: "palm://com.palm.appinstaller/",
    validateInstall: function(appid, size, uncomprSize, successCallback, failureCallback) {
        if(enyo.application.onBrowser){
            var scope = this.owner;
            scope[successCallback].call(scope, scope, {
                result: 0
            });
            return;
        }
        var uncomprSize = (uncomprSize && uncomprSize != 0) ? Math.ceil(uncomprSize / 1024) : undefined;
        var size = Math.ceil(size / 1024);
        var inParams = {
            appId: appid,
            size: size,
            uncompressedSize: uncomprSize
        };
        var inProps = {
            method: "queryInstallCapacity",
            onSuccess: successCallback,
            onFailure: failureCallback
        }
        this.log("appinstaller: validateInstall: params ", inParams, " props: ", inProps);
        this.call(inParams, inProps);
    }
});
