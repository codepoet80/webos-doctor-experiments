enyo.kind({
	name: "CheckItemGroup",
	kind: enyo.Control,
	defaultKind: "CheckItem",
	published: {
		value: 0
	},
	events: {
		onChange: ""
	},
	create: function() {
		this.inherited(arguments);
		this.valueChanged();
	},
	valueChanged: function(inOldValue) {
		this.setChecked(inOldValue, false);
		this.setChecked(this.value, true);
	},
	setChecked: function(inValue, inChecked) {
		var c = this.fetchControlByValue(inValue);
		if (c) {
			c.setChecked(inChecked);
		}
	},
	fetchControlByValue: function(inValue) {
		var c$ = this.controls;
		for (var i=0, c; c=c$[i]; i++) {
			if (c.getValue() == inValue) {
				return c;
			}
		}
	},
	checkItemClick: function(inSender) {
		var oldValue = this.value;
		this.setValue(inSender.getValue());
		if (this.value != oldValue) {
			this.doChange(this.value);
		}
	}
});