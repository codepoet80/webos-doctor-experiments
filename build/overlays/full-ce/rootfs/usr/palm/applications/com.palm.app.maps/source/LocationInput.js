locationInput = {
	setLocation: function(inValue) {
		this._location = enyo.isString(inValue) || inValue.isReserved() ? null : inValue;
		var v = enyo.isString(inValue) ? inValue : inValue.getDisplayValue();
		this.setValue(enyo.mapsApp.unMicrosoftString(v));
	},
	getRealValue: function() {
		if (this._location) {
			return this._location.getValue() || this.getValue();
		} else {
			return this.getValue();
		}
	},
	clearLocation: function() {
		this._location = null;
	},
	getLocation: function() {
		return this._location;
	},
	styleInput: function() {
		this.addRemoveClass("reserved-labeled-value", enyo.mapsApp.isReservedLabel(this.getValue()));
	},
	isUserKeypressed: function() {
		return !this._location && !enyo.mapsApp.isReservedLabel(this.getValue());
	},
	swapValues: function(inInput) {
		var v = this.getValue();
		var l = this._location;
		this.setValue(inInput.getValue());
		this.styleInput();
		this._location = inInput._location;
		inInput.setValue(v);
		inInput.styleInput();
		inInput._location = l;
	}
};

enyo.kind({
	name: "LocationInput",
	kind: enyo.ToolInput,
	autocorrect: false,
	mixins: [
		locationInput
	]
});

enyo.kind({
	name: "LocationSearchInput",
	kind: enyo.ToolSearchInput,
	autocorrect: false,
	mixins: [
		locationInput
	]
});
