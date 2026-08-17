/*jslint white: false, onevar: false, nomen:false, plusplus: false */
/*globals enyo */

enyo.kind({
	name: "Accessibility",
	kind: "VFlexBox",
	className: "enyo-bg",
	components: [
		{kind: "RowGroup", caption: $L("ACCESSIBILITY"), components: [
			{layoutKind: "HFlexLayout", align: "center", tapHighlight: false, components: [
				{flex: 1, content: $L("TTY/TDD")},
				{name: "ttyTtdToggle", onChange: "ToggleTTY", kind: "ToggleButton"}
			]},
			{layoutKind: "HFlexLayout", align: "center", name: "toggleHACContainer", tapHighlight: false, components: [
				{flex: 1, content: $L("HAC")},
				{name: "toggleHAC", onChange: "ToggleHAC", kind: "ToggleButton"}
			]}
		]},
		{name: "ttyQuery", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "ttyQuery", onSuccess: "updateTTY", onFailure: "updateTTY"},
		{name: "hacQuery", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "hacQuery", onSuccess: "updateHACAvailability", onFailure: "updateHACAvailability"},
		{name: "ttySet", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "ttySet"},
		{name: "setHac", kind: enyo.PalmService, service: "palm://com.palm.audio/phone/", method: "hacSet"},
		{name: "getHac", kind: enyo.PalmService, service: "palm://com.palm.audio/phone/", method: "status", subscribe: true, onSuccess: "updateHACStatus", onFailure: "updateHACStatus"}
	], 

	create: function() {
		this.inherited(arguments);
		this.updateUI();
	},
	
	updateUI: function() {
		this.$.toggleHACContainer.hide();
		
		this.$.ttyTtdToggle.setDisabled(false);
		this.$.toggleHAC.setDisabled(false);
		
		this.$.ttyQuery.call({});
		this.$.hacQuery.call({});
	},

	ToggleTTY: function() {
		var value = this.$.ttyTtdToggle.getState();
		this.$.ttySet.call({
			"mode":  value ? "full" : "off"
		});
		this.$.toggleHAC.setDisabled(value);
	},

	ToggleHAC: function() {
		var value = this.$.toggleHAC.getState();
		this.$.setHac.call({
			"enable": value
		});
		this.$.ttyTtdToggle.setDisabled(value);
	},

	updateTTY: function(inSender, response) {

		if(response.returnValue && response.extended && response.extended.mode) {
			if (response.extended.mode === 'full') {
				this.$.ttyTtdToggle.setState(true);
			} else {
				this.$.ttyTtdToggle.setState(false);
			}

			if (response.extended.mode === 'off') {
				this.$.toggleHAC.setDisabled(false);
			} else {
				this.$.toggleHAC.setDisabled(true);
			}
		}
	},
	
	updateHACAvailability: function(inSender, response) {

		if(response.returnValue && response.extended && response.extended.available) {
			this.$.toggleHACContainer.show();
			this.$.getHac.call({});
		}
	},
	
	updateHACStatus: function(inSender, response) {		
		if(response.returnValue == true && response.hac) {
			if(response.hac == true) {
				this.$.toggleHAC.setState(true);
				this.$.ttyTtdToggle.setDisabled(true);
			} else {
				this.$.toggleHAC.setState(false);
				this.$.ttyTtdToggle.setDisabled(false);
			}
		}
	}
});
