enyo.kind({
    name: "findApps.downloadsavebutton",
    kind: enyo.Control,
    published: {
        appItem: {
            price: "n/a"
        }
    },
    events: {
        onUpdateStates: ""
    },
    components: [{
        kind: "HFlexBox",
        style: "margin-left:24px;",
        //align: "baseline";
        width: "172px",
        align: "center",
        name: "buttonContainer",
        components: [{
            name: "app_save",
            kind: "findApps.SaveButton",
            onclick: "saveApp"
        }]
    }],
    create: function() {
        this.inherited(arguments);
        if (this.type == "detail") {
            //This download button is created in the details page
            this.$.buttonContainer.createComponent({
                name: "downloadbutton",
                kind: "findApps.downloadButton",
                flex: 1,
                appId: this.appItem.appId,
                onUpdateStates: "updateStates",
                owner: this
            });
        } else {
            //This download button is created in the magazine
            this.$.buttonContainer.createComponent({
                name: "downloadbutton",
                kind: "findApps.genericDownloadButton",
                flex: 1,
                appItem: {
                    "appId": this.appItem.appId,
                    "price": this.appItem.price
                },
                onUpdateStates: "updateStates",
                owner: this
            });
            if (this.appItem.price == "n/a" || this.appItem.price == "N/A") {
            	// Hide the Save button
            	this.$.app_save.hide();
            }
        }
        enyo.application.savedList.attach(this);
        this.$.app_save.setButton({
            publicApplicationId: this.appItem.appId
        });
    },
    appItemChanged: function() {
        this.$.app_save.setButton({
            publicApplicationId: this.appItem.appId
        });
        if (this.type == "detail") this.$.downloadbutton.setAppId(this.appItem.appId);
        else this.$.downloadbutton.setAppItem(this.appItem);
    },
    saveListChanged: function(appId) {
        if (appId == this.appItem.appId) {
            this.$.app_save.setButton({
                publicApplicationId: appId
            });
        }
    },
    // Detaching this as an observer (fix for DFISH-16496)
    destroy: function() {
    	
    	enyo.application.savedList && enyo.application.savedList.detach(this);
        this.inherited(arguments);
    },
    updateFromServer: function(appDetails) {
        this.$.downloadbutton._appDownload.updateFromServer(appDetails);
    },
    updateStates: function(inSender, enableSave) {
        if (enableSave) {
            this.$.app_save.show();
        } else {
            this.$.app_save.hide();
        }
    },
    saveApp: function(inSender, inEvent) {
        this.$.app_save.processAction({
            publicApplicationId: this.appItem.appId
        });
    },
    disableMe: function(disable) {
        if(this.type == "detail") {
            if(this.$.downloadbutton != undefined) {
                this.$.downloadbutton.disableMe(disable);
            }
        }
    }
});
