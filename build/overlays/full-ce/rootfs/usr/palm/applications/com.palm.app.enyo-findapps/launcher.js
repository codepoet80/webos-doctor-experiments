enyo.kind({
    name: "findApps.launcher",
    kind: "VFlexBox",
    components: [{
        kind: "ApplicationEvents",
        onWindowParamsChange: "windowParamsChangeHandler"
    }],
    create: function() {
        this.inherited(arguments);
    },
    windowActivatedHandler: function() {},
    windowDeactivatedHandler: function(inSender, inEvent) {},
    windowParamsChangeHandler: function(inSender, inEvent) {
        this.handleLaunch(inEvent.params);
    },
    applicationRelaunchHandler: function(inSender, inEvent) {
        this.handleLaunch(inEvent.params);
    },
    handleLaunch: function(params) {
        params = params || {};
        this.launchParams = params;
        if (this.launchParams.createAsModal) {
            this.windowParams = {
                window: "modalwindow"
            };
        }
        this.log("AppCatalog launch: launchParams ", this.launchParams);
        this.log("AppCatalog launch: windowParams ", this.windowParams);
        //enyo.windows.activate("main/main.html?debug=true", "main", this.launchParams, this.windowParams);
        enyo.windows.activate("main/main.html", "main", this.launchParams, this.windowParams);
        return true;
    }
});
