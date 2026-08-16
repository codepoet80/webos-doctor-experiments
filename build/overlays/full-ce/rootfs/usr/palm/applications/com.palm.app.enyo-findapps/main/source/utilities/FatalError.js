enyo.kind({
    name: "findApps.FatalError",
    kind: "VFlexBox",
    pack: "center",
    align: 'center',
    width: "100%",
    height: "100%",
    className: "",
    style: 'text-align:center',
    components: [{
        kind: "VFlexBox",
        flex: 2,
        style: "padding-left: 10px;",
        components: [{
            kind: "Spacer"
        }, {
            name: "error_image",
            kind: "Image",
            src: 'images/misc-connection-error-triangle.png',
            height: '176px',
            flex: 1
        }, {
            name: "fullscreen_error_message",
            kind: "findApps.TapMessage",
            "allowHtml": true,
            height: '105px',
            flex: 0
        }, {
            kind: "HFlexBox",
            pack: "center",
            align: "center",
            components: [{
                kind: "Button",
                caption: $L("Retry"),
                onclick: "retryHandler",
                flex: 0,
                width: "244px"
            }]
        }, {
            kind: "Spacer"
        }]
    }],
    published: {
        params: {}
    },
    create: function(args) {
        this.inherited(arguments);
    },
    paramsChanged: function() {
        if (this.params.online) {
            this.$.error_image.setSrc("images/misc-connection-error-triangle.png");
        } else {
            this.$.error_image.setSrc("images/misc-connection-error.png");
        }
        this.$.fullscreen_error_message.setContent(this.params.errorMessage);
        this.$.fullscreen_error_message.setHiddenMsg(this.params.hiddenErrorCodes);
    },
    retryHandler: function() {
        findApps.ViewLibrary.goBack();
    },
    getAppMenuOptions: function() {
    	return {
    		softwareManager: {disabled: false, show: true},
    		helpMenu: {disabled: false, show: true}
		}
	}
});
