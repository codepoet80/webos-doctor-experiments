enyo.kind({
    name: "findApps.SystemProperties",
    kind: "PalmService",
    service: "palm://com.palm.preferences/systemProperties/",
    getCarrier: function(successCallBack, failureCallBack) {
        var inParams = {
            key: 'com.palm.properties.DMCARRIER'
        };
        var inProps = {
            method: "Get",
            onSuccess: successCallBack,
            onFailure: failureCallBack
        }
        this.log("systemProperties: getCarrier: params ", inParams, " props: ", inProps);
        this.call(inParams, inProps);
    }
});
