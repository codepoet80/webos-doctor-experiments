enyo.kind({
    name: "findApps.genericDownloadButton",
    kind: enyo.Control,
    appdownloadmgr: null,
    //appItem should have appId and price
    published: {
        appItem: {
            price: "n/a"
        }
    },
    events: {
        onUpdateStates: ""
    },
    components: [{
        kind: "findApps.ProgressPill",
        name: "headerDownloadButton",
        onTap: "_handleDownloadBar",
        onCancel: "_progressCancelled"
    }],
    create: function() {
        this.inherited(arguments);
        this.appdownloadmgr = enyo.application.appdownloadManager;
        //Attaching to appdownloadmanager as observer so that can track app downloads
        this.appdownloadmgr.attach(this);
        this.init();
    },
    formatPrice: function(price) {
        if (price == "n/a" || price == "N/A") return price;
        else {
            // The input price is Object from featured ,such as: 9,0.99,Free
            if (price === "Free" || price == 0 || price == "0" || findApps.BaseServer.isPurchased(this.appItem.appId)) {
                return $L("FREE");
            } else {
                var parsedPrice = parseFloat(price);
                var loc = findApps.UserSession.getActivationCountry();
                return findApps.Utilities.Formatter.formatCurrency(parsedPrice, loc);
            }
        }
    },
    destroy: function() {
    	this.appdownloadmgr && this.appdownloadmgr.detach(this);
        this.inherited(arguments);
    },
    appItemChanged: function() {
        this.init();
    },
    init: function() {
        this.$.headerDownloadButton.setParams({
            value: 0,
            title: this.formatPrice(this.appItem.price)
        });
        if (!this.appdownloadmgr.myAppsListIsReady()) return;
        this._appDownload = this.appdownloadmgr.belongToMyApp(this.appItem.appId);
        if (this._appDownload) {
            this.$.headerDownloadButton.setParams(this._appDownload._progressPillModel);
            this.doUpdateStates(this._appDownload.enableSave);
        } else {
            this.doUpdateStates(true);
        }
    },
    updateMyApps: function(app, updateReason) {
        if (updateReason == this.appdownloadmgr.MYAPPS_ALL) {
            this.init();
        } else if (app.publicApplicationId == this.appItem.appId) {
            if (!this._appDownload) {
                this._appDownload = app;
            }
            this.$.headerDownloadButton.setParams(this._appDownload._progressPillModel);
            this.doUpdateStates(this._appDownload.enableSave);
        }
    },
    
    _progressCancelled: function(event) {
        //this.log("progress cancelled");
        //this._appDownload.cancelDownload();
    },
    _handleDownloadBar: function(sender, event) {
        event.bubbles = false;
        
        if(!this._appDownload) {
        	this._appDownload = this.appdownloadmgr.getAppDownload(this.appItem.appId);
        	if(this._appDownload.price === undefined) {
	        	var appDetails = {"publicApplicationId": this.appItem.appId,
	        	                  "price": this.appItem.price 
	        	};
	        	this._appDownload.updateFromAppList(appDetails);
	        }	
        }
        this._appDownload.defaultAction();
    }
});
