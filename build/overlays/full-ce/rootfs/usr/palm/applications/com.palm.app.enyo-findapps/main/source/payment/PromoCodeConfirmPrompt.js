/**
 * PromoCodeConfirmPrompt.js
 */
enyo.kind({
    name: "findApps.PromoCodeConfirmPrompt",
    kind: enyo.Popup,
    scrim: true,
    modal: true,
    width: "400px",
    account: "",
    title: "",
    events: {
        onOK: ""
    },
    components: [{
        name: "popuptitle",
        style: "font-size: 26px; padding: 6px;"
    }, {
        name: "popupdesc",
        style: "padding: 6px;"
    }, {
        kind: "VFlexBox",
        style: "padding-top: 6px;",
        components: [{
            kind: "Button",
            className: "enyo-button-affirmative",
            caption: $L("OK"),
            onclick: "doOK"
        }]
    }],
    create: function() {
        this.inherited(arguments);
    },
    // Lazy initialization of pop-up control in enyo 0.10
    componentsReady: function() {
        this.inherited(arguments);
        var promoTemplate = new enyo.g11n.Template($L("Promo Code #{title}?"));
        this.$.popuptitle.setContent(promoTemplate.evaluate({
            title: this.title
        }));
        this.$.popupdesc.setContent($L("Before you can use a promo code, you must first set up payment information."));
    }
});
