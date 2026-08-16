enyo.kind({
	name: "Location",
	kind: enyo.Component,
	published: {
		title: "",
		addr: "",
		city: "",
		state: "",
		latitude: "",
		longitude: ""
	},
	getAddress: function() {
		return (this.addr || "") + (this.city ? ", " + this.city : "") + (this.state ? ", " + this.state : "");
	},
	getValue: function() {
		if (this.latitude && this.longitude) {
			return this.latitude + ", " + this.longitude;
		} else {
			return this.getAddress();
		}
	},
	getDisplayValue: function() {
		if (this.title) {
			if (this.isReserved()) {
				return this.title;
			}
			return this.title + (this.getAddress() ? ", " + this.getAddress() : "");
		}
		return this.getAddress() || this.getValue();
	},
	getSavedName: function() {
		if (this.isReserved()) {
			return this.addr || $L("Untitled");
		} else {
			return this.title || this.addr;
		}
	},
	isReserved: function() {
		return enyo.mapsApp.isReservedLabel(this.title);
	}
})
