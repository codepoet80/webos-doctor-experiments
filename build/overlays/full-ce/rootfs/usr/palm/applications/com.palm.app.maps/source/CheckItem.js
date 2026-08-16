enyo.kind({
	name: "CheckItem",
	kind: enyo.Item,
	published: {
		value: "",
		icon: "",
		description: "",
		checked: false
	},
	layoutKind: "HFlexLayout",
	components: [
		{kind: "Image"},
		{name: "description", flex: 1, className: "checkitem-description"}
	],
	create: function() {
		this.inherited(arguments);
		this.iconChanged();
		this.descriptionChanged();
		this.checkedChanged();
	},
	iconChanged: function() {
		this.$.image.setSrc(this.icon);
	},
	descriptionChanged: function() {
		this.$.description.setContent(this.description);
	},
	checkedChanged: function() {
		this.addRemoveClass("checkitem-checked", this.checked);
	},
	clickHandler: function(inSender, e) {
		this.dispatch(this.container, "checkItemClick");
		this.fire("onclick", e);
	}
});
