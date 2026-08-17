enyo.kind({
	name: "Dialing",
	kind: "VFlexBox",
	className: "enyo-bg",
	events: {
		onAddDialingShortcut: ""
	},
	components: [
		{kind: "RowGroup", caption: $L("DIALING SHORTCUTS"), components: [
			{kind: "VirtualRepeater", name: "dialingShortcutlist", onSetupRow: "getListItem", components: [
				{kind: "enyo.SwipeableItem", layoutKind: "HFlexLayout", onConfirm: "deleteDialingShortcut", components: [
					{name: "itemTitle", kind: enyo.Label},
					{kind: "Spacer"},
					{name: "itemText", domStyles: {color: "rgb(31, 117, 191)"}, kind: enyo.Label}
				]}
			]},
			{style: "color: darkGray", style:"margin-left: 0", content: $L("<span style='color: #8C8C87; font-size: 30px; font-weight: bold;'>+</span> Add a number"), onclick: "AddDialingShortcut"}
		]},

		//service calls
		{name: "getPreferences", kind: enyo.PalmService, service: "palm://com.palm.systemservice/", method: "getPreferences", onSuccess: "loadDialingShortcuts", onFailure: "loadDialingShortcuts"},
		{name: "setPreferences", kind: enyo.PalmService, service: "palm://com.palm.systemservice/", method: "setPreferences"},
	],

	create: function() {
		this.inherited(arguments);

		this.dialingShortcutsList = [];
		this.updateUI();
	},
	
	updateUI: function() {

		this.updateDialingShortcuts();
	},

	dtmfDurationChanged: function() {
		this.$.dtmfDurationSet.call({
			"dtmflong": this.$.DTMFtones.getValue()
		});
	},

	updateDTMF: function(inSender, payload) {
		if(payload.returnValue) {			
			if(payload.extended && payload.extended.dtmflong == true)
				this.$.DTMFtones.setValue(true);
			else
				this.$.DTMFtones.setValue(false);
		}
	},

	//DIALING SHORTCUTS
	updateDialingShortcuts: function() {

		this.dialingShortcutsList = [];
		this.$.dialingShortcutlist.hide();
		this.$.getPreferences.call({"keys": ["4DigitNumber", "5DigitNumber", "6DigitNumber", "7DigitNumber"]});
	},
	
	loadDialingShortcuts: function(inSender, payload) {
        
		if ( ! payload || ! payload.returnValue ) {
			return;
		}
		//delete payload.returnValue;

		// TODO: When the phonepres is opened this fn is getting called 3 times, for efficiency fix it so that it is only called once when opened 
		this.dialingShortcutsList.splice(0, this.dialingShortcutsList.length); // clear the array
		for (key in payload) {
			if (key != "returnValue" && typeof(payload[key]) == 'string') {
				var str = key.charAt(0);
				var dispText = parseInt(str) + $L(" digits");
				var Xtimes = "";
				for(j = 0; j < parseInt(str); j++) {
					Xtimes += "X";
				}

				var obj = new Object();
				obj.FIELDNAME = key;
				obj.FIELDTEXT = dispText;
				obj.FIELDVALUE = payload[key] + '-' + Xtimes;

				this.dialingShortcutsList.push(obj);
			}
		}
		
		if(this.dialingShortcutsList.length > 0) {
			this.$.dialingShortcutlist.show();
			this.$.dialingShortcutlist.render();
		}
    },

	getListItem: function(inSender, inIndex) {
		if(inIndex < this.dialingShortcutsList.length) {
			//enyo.log(this.dialingShortcutsList[inIndex].FIELDNAME + " : " + this.dialingShortcutsList[inIndex].FIELDVALUE);
			this.$.itemTitle.content = this.dialingShortcutsList[inIndex].FIELDVALUE;
			this.$.itemText.content =  this.dialingShortcutsList[inIndex].FIELDTEXT;
			return true;
		}
	},
	

	deleteDialingShortcut: function(inSender, inIndex) {
		var i = inIndex;
		//enyo.log("itemIndex" + this.$.dialingShortcutlist.fetchRowIndex(inSender));
 		if (i >= 0) {
			var item = this.dialingShortcutsList[i].FIELDNAME;
			var params = {};
			params[item] = false;
			this.$.setPreferences.call(params);

			this.dialingShortcutsList.splice(i, 1);
			this.$.dialingShortcutlist.render();
		}
	},

	//launch view dialingShortcut
	AddDialingShortcut: function() {
		this.doAddDialingShortcut();
	},
});


