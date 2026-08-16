/**
 * ChangePasswordPrompt.js
 */
enyo.kind({
    name: "findApps.ChangePasswordPrompt",
    kind: enyo.Control,
    events: {
        onSubmit: "",
    },
    components: [{
        content: $L("Change Password"),
        style: "font-size: 26px; padding: 6px;"
    }, {
        name: "password",
        kind: "PasswordInput",
        hint: $L("Enter Password")
    }, {
        name: "passwordAgain",
        kind: "PasswordInput",
        hint: $L("Confirm Password")
    }, {
        kind: "Spacer"
    }, {
        name: "errorMessage",
        showing: false,
        content: $L("Passwords do not match."),
        style: "font-size: 16px; padding: 6px; color: red"
    }, {
        kind: "Button",
        caption: $L("Done"),
        onclick: "doSubmit"
    }, ],
    getPassword: function() {
        return this.$.password.getValue();
    },
    getPasswordAgain: function() {
        return this.$.passwordAgain.getValue();
    },
    showError: function() {
        this.$.errorMessage.show();
    },
    resetPassword: function() {
        this.$.password.setValue("");
        this.$.passwordAgain.setValue("");
    },
    doChange: function() {
        var password = this.getPassword();
        var passwordAgain = this.getPasswordAgain();
        if (password != passwordAgain || password == "" || password.length < 6 || password.length > 20) {
            this.showError();
        } else {
            this.doSubmit();
        }
    },
});
