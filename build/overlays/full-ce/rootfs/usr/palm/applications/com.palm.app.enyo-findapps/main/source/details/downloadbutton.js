enyo.kind({
    name: "findApps.downloadButton",
    kind: enyo.Control,
    published: {
        appId: null
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
    },
    destroy: function() {
    	this._appDownload && this._appDownload.detach(this);
    	this.inherited(arguments);
    },
    appIdChanged: function() {
        this._appDownload = enyo.application.appdownloadManager.getAppDownload(this.appId, this);
        this.$.headerDownloadButton.setParams(this._appDownload._progressPillModel);
        this.doUpdateStates(this._appDownload.enableSave);
    },
    updateDownloadState: function() {
        this.$.headerDownloadButton.setParams(this._appDownload._progressPillModel);
        this.doUpdateStates(this._appDownload.enableSave);
    },
    _progressCancelled: function(event) {
        //this.log("progress cancelled");
        //this._appDownload.cancelDownload();
    },
    _handleDownloadBar: function(event) {
        this._appDownload.defaultAction();
    },
    disableMe: function(disable) {
        if(disable) {
            this.$.headerDownloadButton.disabled = true;
            this.$.headerDownloadButton.addClass("enyo-button-disabled");
        } else {
            this.$.headerDownloadButton.disabled = false;
            this.$.headerDownloadButton.removeClass("enyo-button-disabled");
        }
    }
});
