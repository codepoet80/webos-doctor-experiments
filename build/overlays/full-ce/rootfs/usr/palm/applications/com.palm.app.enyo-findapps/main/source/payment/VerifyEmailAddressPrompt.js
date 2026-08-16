/**
 * VerifyEmailAddressPrompt.js
 */
enyo.kind({
    name: "findApps.VerifyEmailAddressPrompt",
    kind: enyo.Control,
    events: {
        onOK: "",
        onChangeEmailAddress: "",
    },
    published: {
        profileEmail: ""
    },
    components: [{
        content: $L("Email Receipts"),
        pack: 'center',
		className: "enyo-text-header",
        style: "text-align:center"
    }, {
        name: "verifyEmailMsg",
		className: "enyo-paragraph"
    }, {
        kind: "VFlexBox",
        style: "margin-top: 6px;",
        components: [{
            kind: "Button",
            className: "enyo-button-affirmative",
            caption: $L("OK"),
            onclick: "doOK"
        }, {
            kind: "Button",
            className: "enyo-button-light",
            caption: $L("Change Email"),
            onclick: "doChangeEmailAddress"
        }]
    }],
    profileEmailChanged: function() {
        this.$.verifyEmailMsg.setContent($L("When you purchase items, we'll send receipts to ") + this.profileEmail);
    }
});
