/* methods used:
   getEdition
   */
enyo.kind({
    name: "enyo.FindApps.Magazine.EditionsMgrService",
    kind: "PalmService",
    service: "palm://com.palm.activitymanager/",
    getEdition: function(acCountry, deviceLocale) {
        var downloadEditionActivity = {
            "name": "DownloadEditionActivity",
            "description": "This is the activity for downloading magazine edition",
            "callback": {
                "method": "palm://com.palm.appcatalog/getEdition",
                "params": {
                    "acCountry": acCountry,
                    "locale": deviceLocale
                }
            },
            "requirements": {
                "internet": true
            },
            "type": {
                "immediate": true,
                "priority": "low"
            }
        };
        var inParams = {
            "activity": downloadEditionActivity,
            "start": true,
            "replace": true
        };
        var inProps = {
            method: "create",
            onSuccess: "activityCreatedSuccess",
            onFailure: "activityCreatedFailure"
        }
        this.call(inParams, inProps);
    },
    activityCreatedSuccess: function(inSender, inResponse) {
        this.log("activityCreatedSuccess: Edition downloaded activity started. Response: " + enyo.json.stringify(inResponse));
    },
    activityCreatedFailure: function(inSender, inResponse) {
        this.error("activityCreatedFailure: Edition download activity could not be created. Response: " + enyo.json.stringify(inResponse));
    }
});
