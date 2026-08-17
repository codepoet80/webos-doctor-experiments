/*jslint white: false, onevar: false, nomen:false, plusplus: false */
/*globals enyo */

enyo.kind({
	name: "DialingShortcut",
	kind: enyo.VFlexBox,
	className: "enyo-bg",
	events: {
		onDoneClick: ""
	},
	components: [
			{kind: "PageHeader", pack: "center", className: "header", content: $L("Dialing Shortcuts")},     
			{kind: "HFlexBox", flex: 1, pack: "center", components:[
				{kind: "Control", style: "margin-top: 24px", width: "500px", components:[
					{kind: "RowGroup", caption: $L("WHEN I DIAL"), components: [
						{name: "digitsLS", kind: "ListSelector", items: [
							{caption: $L("4 digits"), value:"4DigitNumber"},
							{caption: $L("5 digits"), value:"5DigitNumber"},
							{caption: $L("6 digits"), value:"6DigitNumber"},
							{caption: $L("7 digits"), value:"7DigitNumber"}
						]}
					]},
					{kind: "RowGroup", caption: $L("USE THIS DIALING PREFIX"), components: [
						{name: "dialingPrefix", kind: "Input", hint: $L("Enter Number"), autoKeyModifier: "num-lock", onkeyup: "handleKeyup"}
					]},
					{name: "description", className: "info-text", align: "center", content: $L("These shortcuts are digits added to the beginning of the number you are attempting to call<br>Example: (510) 123-xxxx")},
				]}
			]},
			{name: "toolbar", kind: "Toolbar", className: "enyo-toolbar-light", showing: true, pack: "center", components: [  			
				{kind: "Button", name: "buttonCancel", caption: $L("Cancel"), className: "enyo-button-dark", onclick: "CancelClick", width: "300px"},
				{kind: "Button", name: "buttonDone",className: "enyo-button-affirmative", caption: $L("Save"), onclick: "DoneClick", width: "300px"},
      ]},
			{name: "prefService", kind: enyo.PalmService, service: enyo.palmServices.system, method: "setPreferences", onSuccess: "setPrefResponse", onFailure: "setPrefResponse"}
	], 

	create: function() {
		this.inherited(arguments);
	},
	
	handleKeyup: function(inSrc, inEvent) {
 
            // no backswipe functionality present
            // hence merging the backswipe into the
            // done button.

	},

	//set the short cut
	DoneClick: function() {
		var key = this.$.digitsLS.getValue();
		var value = this.$.dialingPrefix.getValue();
		this.param = {};
		this.param[key] = value;

		if (this.$.dialingPrefix.getValue().length == 0) {
		    this.$.dialingPrefix.setValue("");
		    this.doDoneClick(this.param);

                } else {
		    this.$.prefService.call(this.param);
                }
	},
	
	CancelClick: function() {
		this.doDoneClick({});
	}, 

	setPrefResponse: function(inSender, response){
		this.$.dialingPrefix.setValue("");
		this.doDoneClick(this.param);
	}

});
