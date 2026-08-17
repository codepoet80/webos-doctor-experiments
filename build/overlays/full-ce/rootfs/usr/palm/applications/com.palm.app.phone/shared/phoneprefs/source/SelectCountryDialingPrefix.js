/*globals enyo */
enyo.kind({
	name: "SelectCountryPrefix",
	kind: enyo.VFlexBox,
	published: {
		selectIndex: 0,
		selectText: "",
		selectRegionId: 0
	}, 
	events: {
		onDoneClick: ""
	},
	components: [
		{ kind: "PageHeader", components: [ 
			{name: "photoImage", kind: "Image", className: "phone-icon", src: "../shared/phoneprefs/images/icon-phone.png"},
			{content: $L("Select Country For Dialing Prefix"), flex: 1} 
		]},

		//todo: add the check mark to the selected one
		{kind: "Scroller", flex: 1, components: [
			{name: "regionlist", kind: "VirtualRepeater", onSetupRow: "getListItem", components: [				
				{name: "listItem", kind: "Item", onclick: "listItemClicked", layoutKind: "HFlexLayout", components: [
					{name: "itemValue", flex: 1, kind: enyo.Label},
				]}
			]}
		]}
	], 

	create: function() {	
		this.inherited(arguments);
		this.countries = [];
	},

	updateUI: function() {
		this.countries = [];
		
		for (var key in InternationalDialingSettings) {
			this.addToList(key, InternationalDialingSettings[key]); 
		}
		//The data file is out of order
		this.arrangeOrder(); 
		this.$.regionlist.render();
	},

	addToList: function(key, value) {
		var obj = new Object();
		obj.key = key;
		obj.name = value.name;
		obj.nanp = value.nanp;
		obj.idd = value.idd;
		this.countries.push(obj);
	},
	
	//sort the list
	arrangeOrder: function() {
        this.countries.sort(function(a,b) {
            var nameA = a.name.toLowerCase();
            var nameB = b.name.toLowerCase();
            return nameA.localeCompare(nameB);
        });
	},

	getListItem: function(inSender, inIndex) {
		if(inIndex < this.countries.length) {
			this.$.itemValue.setContent(this.countries[inIndex].name);
			return true; 
		}	
	},

	listItemClicked: function(item, event) {
		this.selectIndex = item.manager.fetchRowIndex();	
		this.selectText = this.countries[this.selectIndex].name;
		this.selectRegionId = this.countries[this.selectIndex].key;
enyo.log("debug: index is "+this.selectIndex + " " + this.selectText + " "+this.selectRegionId);
		this.doDoneClick(); 
	}
});
