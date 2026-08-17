/*globals enyo */

enyo.kind({
	name: "FDNListItem",
	kind: "Item",

	published: {
		fdndata: null 
	},

	components: [
		{ kind: "HFlexBox", components: [
			{ components: [
				{ name: "username", flex: 1},
				{ name: "phonenumber", flex: 1}
			]}
		]},
	],

	fdndataChanged: function() {
		this.$.username.setContent(this.fdndata.name); 
		this.$.phonenumber.setContent(this.fdndata.number);
	}
});

enyo.kind({
	name: "RestrictedDialingList",
	kind: enyo.VFlexBox,
	className: "enyo-bg",
	published: {
		//fdnlistdata: []
		viewItemIndex: -1,
		viewItemData: {} 
	},

	events: {
		onSaveFDNItem: ""
	},
	components: [

			{ kind: "PageHeader", className: "header", components: [ 
				{ content: $L("Fixed Dialing Numbers"), className: "phone-header-caption" } 
			]},

			{kind: "Scroller", flex: 1, components: [
				{name: "fdnlist", kind: "VirtualRepeater", onSetupRow: "getFDNlistItem", components:[				
					{name: "listItem", kind: "FDNListItem", onclick: "fDNlistItemClicked" }
				]},
		
				{name: "restrictedListPushable", kind: "Pushable", className: "enyo-row enyo-roundy", components: [
					{kind: "HFlexBox", domStyles: {color: "#666", padding: "6px"}, components: [
						{content: $L("+"), domStyles: {padding: "8px 8px 8px 12px"}},
						{content: $L("Add an entry..."), className: "default-row", onclick: "restrictedListClick"}
					]}
				]}
			]},

			{name: "simbookCapacityQuery", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "simbookCapacityQuery", onSuccess: "simbookCapacityResponse", onFailure: "simbookCapacityResponse"},
			{name: "simbookDelete", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "simbookDelete", onSuccess: "simbookDeleteResponse", onFailure:"simbookDeleteResponse"},
			{name: "simbookRead", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "simbookRead", onSuccess: "simbookReadResponse", onFailure:"simbookReadResponse"}			
	], 

	create: function() {
		this.inherited(arguments);
		this.maxCapacity = 50;
		this.fdnUsed = 0; 
	}, 

	updateUI: function() {
		this.$.simbookCapacityQuery.call({
			"type": "fdn"
		});
	}, 

	//add an entry
	restrictedListClick: function() {		
		this.viewItemIndex = -1;
		this.viewItemData = {}; 		
	
		this.doSaveFDNItem(); 				

		var params = {
			"launchType": "pinCode",
			"pinAction": PinAction.Pin2_Verify,
			"nextView": "editFixedNumber"
		}
		enyo.application.UI.event("changeView", params);		
		return true; 
	},

	//render the list item
	getFDNlistItem: function(inSender, index) {
		if (this.fdnlistdata && index < this.fdnlistdata.length && this.fdnlistdata[index]){
			var data = this.fdnlistdata[index]; 
			this.$.listItem.setFdndata(data);
			return true; 
		}	
	},

	fDNlistItemClicked: function(inSender, inEvent) {
		this.viewItemIndex = inEvent.rowIndex;
		this.viewItemData = this.fdnlistdata[this.viewItemIndex];

		this.doSaveFDNItem(); 				
	
		var params = {
			"launchType": "pinCode",
			"pinAction": PinAction.Pin2_Verify,
			"nextView": "editFixedNumber"
		}
		enyo.application.UI.event("changeView", params);		
		return true; 
	},

	deleteItem: function() {
		var itemData = this.$.fdnlist.fetchItemData();
		if (itemData){
			var param = {
				"index": itemData.index,
				"type": itemData.type
			};			
			this.$.simbookDelete.call(param);
		}
	},

	refresh: function() {
		var	param = {
	        "index": 0,
	        "type": "fdn",
	        "indexEnd": this.maxCapacity
		};		
		this.$.simbookRead.call(param);
	}, 

	simbookCapacityResponse: function(inSender, response) {
		if (response.returnValue && response.extended){
			this.maxCapacity = response.extended.capacity; 
			this.fdnUsed = response.extended.used; 
			var	param = {
		        "index": 0,
		        "type": "fdn",
		        "indexEnd": this.maxCapacity
			};		
			this.$.simbookRead.call(param);			 
		} else {
			enyo.error("errorCode: " + response.errorCode + " errorString: "+ response.errorString);
		}		
	},

	simbookReadResponse: function(inSender, response) {
		if (response.returnValue && response.entries){
			this.fdnlistdata = response.entries;  
			this.$.fdnlist.render();
		} else {
			enyo.error("errorCode: " + response.errorCode + " errorString: " + response.errorString);
		}				
	}

});
