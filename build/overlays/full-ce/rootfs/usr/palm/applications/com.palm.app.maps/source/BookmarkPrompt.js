enyo.kind({
	name: "BookmarkPrompt",
	kind: enyo.Popup,
	scrim: true,
	className: "enyo-popup popup",
	published: {
		value: "",
		location: ""
	},
	events: {
		onCancel: "",
		onSave: ""
	},
	components: [
		{kind: "VFlexBox", components: [
			{content: $L("Add Bookmark"), className: "spaced popup-title"},
			{name: "input", kind: "ToolInput", className: "popup-input"},
			{kind: "HFlexBox", components: [
				{kind: "ToolButton", flex: 1, className: "spaced", caption: $L("Cancel"), onclick: "cancel"},
				{kind: "ToolButton", flex: 1, className: "spaced", caption: $L("Save"), onclick: "save"}
				
			]}
		]}
	],
	componentsReady: function() {
		this.inherited(arguments);
		this.valueChanged();
	},
	valueChanged: function() {
		if (!this.lazy) {
			this.$.input.setValue(this.value);
			this.$.input.forceSelect();
		}
	},
	getValue: function() {
		return this.$.input.getValue();
	},
	cancel: function() {
		this.close();
		this.doCancel();
	},
	save: function() {
		this.close();
		this.doSave();
	}
});