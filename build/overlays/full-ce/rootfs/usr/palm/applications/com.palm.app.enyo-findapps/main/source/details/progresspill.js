enyo.kind({
    name: "findApps.ProgressPill",
    kind: enyo.CustomButton,
    cssNamespace: "button",
    allowDrag: true,
    published: {
        params: null
    },
    events: {
        onTap: "",
        onCancel: ""
    },
    components: [{
        name: "progressPill",
        kind: "ProgressButton",
        className: "affirmative",
        cancelable: false,
        value: 0,
        // default value
        layoutKind: "HFlexLayout",
        position: "",
        onclick: "doTap",
        onmousehold: "mouseHold",
        components: [{
            name: "title",
            content: "",
            style: "width:100%;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
        }, {
            name: "rightIcon",
            kind: "Image",
            className: "acc-progress-icon",
            src: "images/menu/icon-download-top.png",
            // default icon
            onclick: "doCancel"
        }]
    }],

    mouseHold: function(inSender, inEvent){
        inEvent.stopPropagation();
    },

    paramsChanged: function() {
        var pill = this.$.progressPill;
        var icon = this.$.rightIcon;
        var params = this.params;
        if (pill) {
            this.$.title.setContent(params.title);
            if (params.icon) {
                icon.show();
                icon.setSrc(params.icon);
            } else {
                icon.hide();
            }
            
            if(params.state){
                switch(params.state){
                    case "initiating_download":
                    case "pausing":
                    case "resuming":
                    case "removing":
                    case "canceling":
                    case "downloading":
                    case "paused":
                    case "purchasing":
                    case "purchase_pending":
                    case "installing":
                        this.addClass("progress-showing");
                        break;
                    case "initial":
                    case "download":
                    case "download_failed":
                    case "purchase_failed":
                    case "purchased":
                    case "installed":
                    case "update_available":
                    case "install_failed":
                        this.removeClass("progress-showing");
                        break;
                }
            }
            
            if (params.value || params.value === 0) {
                var pos = params.value * 100;
                pill.setPosition(pos);
            } else {
                pill.setPosition(0);
            }
        }
    }
});
