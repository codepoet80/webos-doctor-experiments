/*jslint white: false, onevar: false, nomen:false, plusplus: false */
/*globals enyo */

enyo.kind({
	name: "WhenTypingPref",
	kind: "VFlexBox",
	className: "enyo-bg",
	components: [
		{kind: "RowGroup", caption: $L("WHEN TYPING IN DIALPAD"), components: [
			{layoutKind: "HFlexLayout", align: "center", tapHighlight: false, components: [
				{flex: 1, content: $L("Show Contact Matches")},

				// Make sure that the component you want to be live has onclick set to 'propertyChanged'
				{name: "showContactMatchField", kind: "ToggleButton", onChange: "matchValueChanged"}
			]}
		]},
		{name: "wtpgetPreferences", kind: enyo.PalmService, service: enyo.palmServices.system, method: "getPreferences", onSuccess: "updateContactMatchField", onFailure: "updateContactMatchField"},
		{name: "wtpsetPreferences", kind: enyo.PalmService, service: enyo.palmServices.system, method: "setPreferences"}
	],
	create: function(){
		this.inherited(arguments);
		this.$.wtpgetPreferences.call({
			keys:["showcontactmatch"]
		});
	},
	updateContactMatchField: function(inSender, response){		
		if (response && response.returnValue && response.showcontactmatch !== undefined){
			this.$.showContactMatchField.setState(response.showcontactmatch);
		}else {
			//this.$.showContactMatchField.setState(!!response);
			this.$.showContactMatchField.setState(true); 
			this.matchValueChanged(null, true); 			
		}
	},
	matchValueChanged: function (inSender, value) {		
		this.$.wtpsetPreferences.call({
			"showcontactmatch": value
		});
	}
});
