enyo.kind({
    name: "findApps.DefaultPaymentType",
    kind: enyo.Item,
    published: {
        selected: "CC"
    },
    events: {
        onTypeSelected: ""
    },
    components: [ //Scrim control
    {
        name: "defaulttype",
        kind: "RowGroup",
        caption: $L("Default Payment Method"),
        components: [{
            kind: enyo.HFlexBox,
            domStyles: "linePaddingSlim",
            components: [{
                kind: "CheckBox",
                checked: false,
                onChange: "selectionChange",
                value: "OB",
                name: "obTypeCheckbox"
            }, {
                content: $L("Carrier Account"),
                name: "obTypeName",
                style: "margin-left:10px"
            }]
        }, {
            kind: enyo.HFlexBox,
            domStyles: "linePaddingSlim",
            components: [{
                kind: "CheckBox",
                checked: false,
                onChange: "selectionChange",
                value: "CC",
                name: "ccTypeCheckbox"
            }, {
                content: $L("Credit Card"),
                name: "ccTypeName",
                style: "margin-left:10px"
            }]
        }]
    }],
    selectedChanged: function() {
        if (this.selected == "CC") {
            this.$.ccTypeCheckbox.checked = true;
            this.$.ccTypeCheckbox.checkedChanged();
            this.$.obTypeCheckbox.checked = false;
            this.$.obTypeCheckbox.checkedChanged();
            return;
        } else if (this.selected == "OB") {
            this.$.ccTypeCheckbox.checked = false;
            this.$.ccTypeCheckbox.checkedChanged();
            this.$.obTypeCheckbox.checked = true;
            this.$.obTypeCheckbox.checkedChanged();
            return;
        }
    },
    selectionChange: function(inSender) {
        if (this.selected != inSender.value) {
            this.setSelected(inSender.value);
        }
        this.doTypeSelected(inSender.value);
    }
});
