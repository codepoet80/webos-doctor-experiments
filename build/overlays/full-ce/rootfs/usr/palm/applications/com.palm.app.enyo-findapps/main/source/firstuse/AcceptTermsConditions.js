enyo.kind({
    name: "findApps.AcceptTermsAndConditions",
    kind: enyo.VFlexBox,
    className: "terms",
    published: {},
    components: [{
        layoutKind: "HFlexLayout",
        pack: 'center',
        components: [{
            name: "header",
            className: 'terms-header',
            content: $L("webOS App Catalog End-User Terms And Conditions")
        }, ]
    }, {
        kind: "Scroller",
        className: "box terms-box",
        flex: 1,
        components: [{
            kind: "findApps.TermsAndConditions"
        }]
    }, {
        kind: "Toolbar",
        layoutKind: "HFlexLayout",
        pack: 'center',
        className: 'enyo-toolbar-light terms-footer',
        components: [{
            kind: "Button",
            caption: $L("Decline"),
            className: "enyo-button-negative",
            style: "width:130px;margin-right:6px",
            onclick: "handleDecline"
        }, {
            kind: "Button",
            caption: $L("Accept"),
            className: "enyo-button-affirmative",
            style: "width:130px;margin-left:6px",
            onclick: "handleAccept"
        }, ]
    }],
    constructor: function() {
        this.inherited(arguments);
    },
    handleDecline: function(inSender, inResponse) {
        window.close();
    },
    handleAccept: function(inSender, inResponse) {
        findApps.UserSession.setTermsAccepted();
        this.showNextView();
    },
    showNextView: function() {
		// Terms of use is also accepted now. Show the user selected view now
		var viewParams = this.sceneParams.nextViewParams || {};
		viewParams.viewToLoad = this.sceneParams.nextView;
		findApps.ViewLibrary._container.showView(viewParams);
    },
    setParams: function(params) {
    	this.sceneParams = params;
        if (params && params.modalMode) {
            this.$.header.setClassName("terms-header-modal");
        }
    }
    ,
    getAppMenuOptions: function() {
    	return {
    		softwareManager: {disabled: false, show: true},
    		helpMenu: {disabled: false, show: true}
		}
	}
});
