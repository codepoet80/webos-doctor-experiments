/* Copyright 2009 Palm, Inc.  All rights reserved. */
enyo.kind({
    name: "findApps.DeviceProfile",
    kind: findApps.PalmService,
    getDeviceId: function(inProps) {
        if(AppCatalog.Config.DummyConfig){
            inProps.scope[inProps.onSuccess].call(inProps.scope, this, {
                deviceId: AppCatalog.Config.DummyConfig._deviceId
            }, {}, inProps);
            return;
        }
        var inParams = {};
        inProps = enyo.mixin((inProps?inProps:{}), {
            service: "palm://com.palm.deviceprofile/",
            method: "getDeviceId"
        });
        this.sendRequest(inParams, inProps);
    },
    getCarrierIdentification: function(inProps) {
        if(AppCatalog.Config.DummyConfig){
            inProps.scope[inProps.onSuccess].call(inProps.scope, this, {
                results: [{
                        mcc: AppCatalog.Config.DummyConfig._carrier._mcc,
                        mnc: AppCatalog.Config.DummyConfig._carrier._mnc,
                        qOperatorShortName: AppCatalog.Config.DummyConfig._carrier._shortName
                }]
            }, {}, inProps);
            return;
        }
        var inParams = {
            "query": {
                "from": "com.palm.carrierdb.settings.current:1"
            }
        };
        inProps = enyo.mixin((inProps?inProps:{}), {
            service: "palm://com.palm.db/",
            method: "find"
        });
        //TODO: uncomment this
        //this.log("deviceprofile: getCarrierIdentification: params ", inParams, " props: ", inProps);
        this.sendRequest(inParams, inProps);
    },
    getDeviceProfile: function(inProps) {
        if(AppCatalog.Config.DummyConfig){
            inProps.scope[inProps.onSuccess].call(inProps.scope, this, {
                deviceInfo: {
                    softwareBuildBranch: AppCatalog.Config.DummyConfig._softwareBuildBranch
                }
            }, {}, inProps);
            return;
        }
        var inParams = {};
        inProps = enyo.mixin((inProps?inProps:{}), {
            service: "palm://com.palm.deviceprofile/",
            method: "getDeviceProfile"
        });
        this.sendRequest(inParams, inProps);
    }
});

findApps.DeviceProfile.getInstance = function(){
    findApps.DeviceProfile._singleton = findApps.DeviceProfile._singleton || new findApps.DeviceProfile();
    return findApps.DeviceProfile._singleton;
}

findApps.DeviceProfile.destroy = function() {
    findApps.DeviceProfile._singleton = null;
}
