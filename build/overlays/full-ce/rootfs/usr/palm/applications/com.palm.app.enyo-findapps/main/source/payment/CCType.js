enyo.kind({
    name: "findApps.CCType",
    kind: enyo.Item,
    published: {
        code: "",
        description: "",
        selected: false
    },
    events: {
        onCCTypeSelected: ""
    },
    components: [{
        kind: enyo.HFlexBox,
        domStyles: "linePaddingSlim",
        components: [{
            kind: "CheckBox",
            checked: false,
            onChange: "checkboxSelected",
            name: "ccTypeCheckbox"
        }, {
            content: "",
            name: "ccTypeName",
            style: "margin-left:10px"
        }, {	
			flex: 1,
			components: [
				{
					kind: "Image",
					name: "ccTypeIcon",
					src: "",
					style: "float: right;"
				}
			]
		}]
    }],
    create: function() {
        this.inherited(arguments);
        this.codeChanged();
        this.descriptionChanged();
        this.selectedChanged();
    },
    descriptionChanged: function() {
        this.$.ccTypeName.setContent(this.description);
	    this.$.ccTypeIcon.setSrc("images/payment-" + this.description.toLowerCase() + ".png");
    },
    selectedChanged: function() {
        if (this.$.ccTypeCheckbox.checked != this.selected) {
            this.$.ccTypeCheckbox.checked = this.selected;
            this.$.ccTypeCheckbox.checkedChanged();
        }
    },
    codeChanged: function() {
        this.$.ccTypeName.addClass('icon.' + this.code);
    },
    checkboxSelected: function() {
        // Changing from true to false by user selection - do not allow this
        if (this.selected == true && this.$.ccTypeCheckbox.checked == false) {
            this.$.ccTypeCheckbox.checked = true;
            this.$.ccTypeCheckbox.checkedChanged();
            return;
        }
        this.selected = this.$.ccTypeCheckbox.checked;
        this.doCCTypeSelected(this.code, this.$.ccTypeCheckbox.checked);
    }
});
