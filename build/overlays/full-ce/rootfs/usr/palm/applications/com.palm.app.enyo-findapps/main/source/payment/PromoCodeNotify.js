/**
 * PromoCodeNotify.js
 */
enyo.kind({
    name: "findApps.PromoCodeNotify",
    kind: enyo.Control,
    events: {
        onClose: "",
    },
    components: [{
        style: "padding: 8px;",
        content: $L("Promo Code")
    }, {
        kind: "Spacer"
    }, {
        name: "promoNotification",
        style: "padding: 6px;",
        content: "none"
    }, {
        kind: "VFlexBox",
        style: "padding-top: 6px;",
        components: [{
            kind: "Button",
            caption: $L("OK"),
            onclick: "doClose"
        }, ]
    }],
    setContent: function(content) {
        this.$.promoNotification.setContent(content);
    }
});
