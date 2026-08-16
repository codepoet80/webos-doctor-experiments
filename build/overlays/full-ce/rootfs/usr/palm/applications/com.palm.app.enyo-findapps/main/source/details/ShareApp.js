/**
 * This kind is used to share the application details by email or SMS messages
 * It uses the lib/services/applicationmanager and common.js code for sending email / text.
 * This kind is used on App. Details page.
 */
enyo.kind({
    name: "findApps.ShareApp",
    kind: "enyo.Control",
    components: [
    // Utility common kind
    {
        kind: "findApps.CommonHandler",
        name: "utilityHandler"
    }, {
        kind: "Button",
        className: "enyo-button-light",
        caption: $L("Share"),
        onclick: "shareApp",
        name: "shareButton"
    },
    // Pop up for share button
    {
        name: "sharePopup",
        kind: "Menu",
        lazy: false,
        components: [{
            caption: $L("Email"),
            onclick: "shareByEmail"
        }, {
            caption: $L("Text Message"),
            onclick: "shareBySMS"
        }]
    }],
    published: {
        // JSON object containing appDetails
        appDetail: null
    },
    appDetailChanged: function(oldData) {},
    // Event handlers
    shareApp: function(inEvent) {
        // show popup menu
        var n = this.$.shareButton.hasNode();
        this.$.sharePopup.openAroundControl(this);
        this.$.sharePopup.addStyles("width:" + n.offsetWidth + "px");
    },
    shareByEmail: function(inSender) {
        this.closePopup(inSender);
        this.$.utilityHandler.handleCommand('email', this.appDetail);
    },
    shareBySMS: function(inSender) {
        this.closePopup(inSender);
        this.$.utilityHandler.handleCommand('text', this.appDetail);
    },
    // Utility methods
    closePopup: function(inSender) {
        this.$.sharePopup.close();
    },
});
