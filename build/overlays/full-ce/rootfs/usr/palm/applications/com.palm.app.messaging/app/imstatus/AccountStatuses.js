enyo.kind({
	name: "AccountStatuses",
	kind: "enyo.Control",
	layoutKind: "VFlexLayout",
	published: {
		availability: [],
		invisibilitySupported: false
	},
	events: {
		onAvailabilityChanged: "",
		onInputCustomMessage: ""
	},
	components: [
		{name: "availabilities", className: "availabilities", components: [
			{name: "available", kind: "Availability", caption: $L("Available"), value: enyo.messaging.im.availability.AVAILABLE, onclick:"updateAvailability", className: "enyo-first available-status"},
			{name: "busy", kind: "Availability", caption: $L("Busy"), value: enyo.messaging.im.availability.BUSY, onclick:"updateAvailability"},
			{name: "invisible", kind: "Availability", showing: false, caption: $L("Invisible"), value: enyo.messaging.im.availability.INVISIBLE, onclick:"updateAvailability"},
			{name: "offline", kind: "Availability", caption: $L("Offline"), value: enyo.messaging.im.availability.OFFLINE, onclick:"updateAvailability"},
			{name: "customStatus", kind: "MenuItem", caption: $L("Set custom status"), onclick:"setCustomMessage", className: "custom-status"}
		]}
	],
	availabilityChanged: function() {
		this.resetAvailabilities();
		
		var showCustomStatus = false;
		for (var i=0; i<this.availability.length; i++) {
			this.setAvailabilityCheckMark(this.availability[i]);
			if (this.availability[i] <= enyo.messaging.im.availability.BUSY) {
				showCustomStatus = true;
			}
		}
        this.$.customStatus.setShowing(showCustomStatus);
		this.$.customStatus.$.item.addRemoveClass("enyo-last", showCustomStatus);
		this.$.offline.$.item.addRemoveClass("enyo-last", !showCustomStatus);
	},
	setAvailabilityCheckMark: function(availability) {
		if (availability === enyo.messaging.im.availability.AVAILABLE) { 
			this.$.available.setChecked(true);
		} else if (availability === enyo.messaging.im.availability.BUSY) {
			this.$.busy.setChecked(true);
		} else if (availability === enyo.messaging.im.availability.INVISIBLE) {
			this.$.invisible.setChecked(true);
		} else if (availability === enyo.messaging.im.availability.OFFLINE) {
			this.$.offline.setChecked(true);
		}
	},
	invisibilitySupportedChanged: function() {
		this.$.invisible.setShowing(this.invisibilitySupported);
	},
	resetAvailabilities: function() {
		this.$.available.setChecked(false);
		this.$.busy.setChecked(false);
		this.$.invisible.setChecked(false);
		this.$.offline.setChecked(false);
	},
	updateAvailability: function(inSender, inEvent) {
		this.availability = inSender.value;
		//this.availabilityChanged();  // TODO: this may be done by the parent component
		this.doAvailabilityChanged(this.availability);
	}, 
	setCustomMessage: function(inSender, inEvent) {
		this.doInputCustomMessage(this.accountId);
	}
});

enyo.kind({
	name: "Availability",
	className: "availability",
	kind: "MenuCheckItem",
	tapHighlight: true,
	itemChrome: [
		{name: "status", className: "av-status"},
		{name: "caption", className: "av-caption", flex: 1},
		{name: "arrow", className: "av-arrow"}
	],
	create: function() {
    	this.inherited(arguments);
		if (!this.$.status) {
			this.createItemChrome();
		}
    	if (this.value === enyo.messaging.im.availability.BUSY) {
    		this.$.status.addClass("status status-buddy status-away");
    	} else {
    		this.$.status.addClass("status status-buddy status-"+enyo.messaging.im.buddyAvailabilities[this.value]);
    	}
    }
});
