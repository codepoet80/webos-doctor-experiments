enyo.kind({
    name: "findApps.SavedApps",
    kind: "enyo.VFlexBox",
    published: {
        appList: []
    },

    components: [
    //Scrim control
    {
        kind: "Scrim",
        name: "scrim",
        layoutKind: "VFlexLayout",
        align: "center",
        pack: "center",
        animateShowing: false,
        components: [{
            kind: "SpinnerLarge",
            name: 'spinner',
            showing: false
        }]
    },
    //Error dialog
    {
        kind: "findApps.Error",
        onSubmit: "submitError",
        onCancel: "cancelError"
    }, {
        name: "emptyInstructions",
        height: "1024px",
        showing: true,
        style: "text-align:center;background-color:#e7e7e7;",
        components: [{
            kind: "VFlexBox",
            width: "560px",
            style: "margin:auto;color:#46484b;",
            components: [{
                name: "bigSavedIcon",
                style: "margin:168px 0 10px 0;",
                kind: enyo.Image,
                src: 'images/empty-scene-bookmark-icon.png'
            }, {
                name: 'description',
                className: "enyo-text-header",
                content: $L("To add bookmarks, tap the Bookmark icon next to the application. Any saved bookmarks appear on this page so you can view and manage them.")
            }]
        }]
    }, {
        name: "app_list1",
        kind: "findApps.AppList",
        className: "saved-items",
        flex: 1,
        isSaveList: true,
        onSaveListEmpty: "handleSaveListEmpty"
    }

    ],
    create: function() {
        this.inherited(arguments);
    },
    prefetch: function() {
    	this.getSavedList(false);
    },
    // This event is raised by the savedList model class when there are no apps in the saved list
    // SavedApps then shows empty instructions if list has become empty
    handleSaveListEmpty: function(inSender) {
        // Show empty instructions
        this.$.emptyInstructions.show();
        this.$.app_list1.hide();
    },
    getSavedList: function(showScrim) {
        var idList = enyo.application.savedList.getList();
        var params = {
            packageIds: idList,
            sort: "DATE_DESC"
        }
        // no need to query the server if there are no saved apps
        if (params.packageIds.length > 0) {
            this.$.emptyInstructions.hide();
            this.$.app_list1.show();
            if(showScrim) {
	            this.$.scrim.show();
	            this.$.spinner.setShowing(true);
            }
            findApps.BaseServer.getACServer().getAppList(params, "SavedAppsService", {
                onSuccess: "gotSavedList",
                onFailure: "gotError",
                scope: this
            });
        } else {
            this.$.emptyInstructions.show();
            this.$.app_list1.hide();
        }
    },
    gotSavedList: function(inSender, inResponse, inRequest, props) {
        this.$.scrim.hide();
        this.$.spinner.setShowing(false);
        if (inResponse.OutGetAppList) {
            // FIXME: api problem
            // totalCount = 1 => one object
            // totalCount > 1 => array of objects
            var appList = inResponse.OutGetAppList.appList;
            var appSummaries = appList.appSummary;
            var totalCount = appList.totalCount;
            this.$.app_list1.setAppList(totalCount > 1 ? appSummaries : [appSummaries]);
            findApps.ViewLibrary._container.updateSavedList(totalCount, appSummaries);
            if(totalCount == 0) {
                this.$.emptyInstructions.show();
                this.$.app_list1.hide();
            }
        }
    },
    gotError: function(inSender, inResponse, inRequest, props, errors) {
        this.$.scrim.hide();
        this.$.scrim.setShowing(false);
        errors.push("LOC09000");
        this.displayError(errors);
    },
    //Utility methods
    displayError: function(errors) {
        // Only if Saved view is at the top
        if (findApps.ViewLibrary._container.isTopView(this.owner)) {
            this.$.error.displayError(errors);
        }
    },
    // Error dialog methods
    submitError: function() {
        this.$.error.cancel();
    },
    cancelError: function() {
        this.$.error.cancel();
    },
    update: function(eventName, params) {
        if (eventName == "resize") {
            // Refresh the list display
            this.$.app_list1.refresh();
        }
    }
});
