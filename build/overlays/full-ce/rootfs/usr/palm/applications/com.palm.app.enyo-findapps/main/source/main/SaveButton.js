enyo.kind({
    name: "findApps.SaveButton",
    kind: "CustomButton",
    className: "enyo-button enyo-button-light twin-button",
    //caption: $L("Save"),
    components: [{
        className: "twin-inner"
    }],
    events: {
        onRemoveItem: ""
    },
    processAction: function(appItem) {
        if (!enyo.application.savedList.isSaved(appItem.publicApplicationId)) {
            this.saveApp(appItem);
        } else {
            this.removeApp(appItem);
        }
    },
    saveApp: function(appItem) {
        enyo.application.savedList.saveApp(appItem.publicApplicationId);
        this.setButton(appItem);
    },
    removeApp: function(appItem, installing) {
        enyo.application.savedList.removeApp(appItem.publicApplicationId, installing);
        this.setButton(appItem);
    },
    setButton: function(appItem) {
        //set when the AppItems are being rendered
        this.appId = appItem.publicApplicationId;
        if (enyo.application.savedList.isSaved(appItem.publicApplicationId)) {
            this.addClass('enyo-button-depressed');
        } else {
            this.removeClass('enyo-button-depressed');
        }
    }
})
