enyo.kind({
    name: "findApps.BackNavigationBar",
    kind: "Header",
    className: "enyo-header back-footer",
    height: "54px",
    align: "center",
    create: function() {
        this.inherited(arguments);
    },
    components: [
    // Back button
    {
        name: "backButton",
        kind: "Button",
        label: $L("Back"),
        className: "back-button",
        onclick: "goBack"
    }, {
        kind: "Control",
        flex: 1
    }, ],
    // Event handlers
    goBack: function(inSender) {
        this.$.backButton.disabled = true;
        this.$.backButton.addClass('enyo-button-disabled');
        // Go to the back screen in pane history
        findApps.ViewLibrary.goBack();
    },
    setBackButtonCaption: function(caption) {
        //this.$.backButton.setLabel(caption);
    },
    reset: function() {
        this.$.backButton.disabled = false;
        this.$.backButton.removeClass('enyo-button-disabled');
    }
});
