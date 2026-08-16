/**
 * PurchaseConfirmPrompt.js
 */
enyo.kind({
    name: "findApps.PurchaseConfirmPrompt",
    kind: "ModalDialog",
    account: "",
    title: "",
    events: {
        onPurchase: "",
        onPromo: "",
        onCancel: ""
    },
    components: [{
        name: "popuptitle",
		className: "enyo-text-header",
        style: "text-align: center;"
    }, {
        name: "popupdesc",
		className: "enyo-paragraph"
    }, {
        kind: "VFlexBox",
        style: "padding-top: 6px;",
        components: [{
            kind: "Button",
            className: "enyo-button-affirmative",
            caption: $L("Purchase"),
            onclick: "doPurchase"
        }, {
            kind: "Spacer"
        }, {
            kind: "Button",
            caption: $L("Use Promo Code"),
            onclick: "doPromo"
        }, {
            kind: "Spacer"
        }, {
            kind: "Button",
            className: "enyo-button-light",
            caption: $L("Cancel"),
            onclick: "doCancel"
        }, ]
    }],
    create: function() {
        this.inherited(arguments);
    },
    componentsReady: function() {
        this.inherited(arguments);
		
        this.$.popuptitle.setContent($L("Confirm Purchase"));

        var descTemplate = new enyo.g11n.Template($L("You are about to purchase #{title}. Your #{purchaseMethod} will only be charged if you select 'Purchase'."));
		this.$.popupdesc.setContent(descTemplate.evaluate({
            title: this.title,
			purchaseMethod: ((this.account === "credit card") ? $L("credit card") : $L("carrier account"))
        }));
    }
});
