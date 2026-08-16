enyo.kind({
	name: "LabeledToggle",
	kind: enyo.HFlexBox,
	published: {
		label: "",
		state: false
	},
	events: {
		onChange: ""
	},
	align: "center",
	components: [
		{name: "label", className: "labeled-toggle-label"},
		{kind: "ToggleButton", onChange: "doChange"}
	],
	create: function() {
		this.inherited(arguments);
		this.labelChanged();
		this.stateChanged();
	},
	labelChanged: function() {
		this.$.label.setContent(this.label);
	},
	stateChanged: function() {
		this.$.toggleButton.setState(this.state);
	}
})
