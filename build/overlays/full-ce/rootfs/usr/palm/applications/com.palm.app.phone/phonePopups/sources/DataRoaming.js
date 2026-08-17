/*globals enyo */

enyo.kind({
    name: "DataRoaming",
    kind: "VFlexBox",
    components: [
        {Kind: "Control", className: "notification-container", flex:1, components: [
            {content:$L("Data Roaming Alert"), className: "title"},
            {content: $L("Enabling data roaming may incur additional service charges for using data while roaming."), className: "message"}
        ]},
        {kind: "NotificationButton", layoutKind: "VFlexLayout", pack: "center", className: "enyo-notification-button-affirmative", label: $L("OK"), onclick: "dismiss"},
    ],

    create: function() {
        this.inherited(arguments);
        enyo.log();            
    },

    dismiss: function(){
        close();
    }
});
