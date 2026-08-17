/*globals enyo */
enyo.kind({
	name: "EditFixedNumber",
	kind: enyo.VFlexBox,
	published: {
		needRefresh: false,
	}, 
	events: {
		onDoneClick: ""
	},
	components: [
		{name: "controlGroup", kind: "RowGroup", caption: $L("ADD FIXED NUMBER"), components: [
			{name: "inputName", kind: "Input", onchange: "valueChanged", components: [
				{content: $L("NAME"), domStyles: {"text-transform": "uppercase", "text-align": "right", color: "#00ABEF"}}
			]},
			{name: "inputNumber", kind: "Input", autoKeyModifier: "num-lock", onchange: "valueChanged", components: [
				{content: $L("NUMBER"), domStyles: {"text-transform": "uppercase", "text-align": "right", color: "#00ABEF"}}
			]}
		]},

		{kind: "VFlexBox", defaultKind: "Button", flex:1, components: [
			{name: "buttonDelete", caption:$L("Delete from list"), className: "enyo-button-negative", onclick:"deleteClick"},
			{name: "buttonDone", caption:$L("Done"), onclick:"DoneClick"},
		]},
		{name: "deletePrompt", kind: "DialogPrompt", 
			title: $L("Delete from FDN list"),
			message: $L("Are you sure you want to delete this contact from the FDN List?"),
			acceptButtonCaption: $L("Yes, Delete"),
			cancelButtonCaption: $L("No, Cancel"),
			onAccept: "deleteConfirm",
			preference: "yesDelete"
		}, 
		{name: "dialogError", kind: "ErrorDialog"},

		{name: "simbookDelete", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "simbookDelete", onSuccess: "simbookDeleteResponse", onFailure: "simbookDeleteResponse"},
		{name: "simbookWrite", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "simbookWrite", onSuccess: "simbookWriteResponse", onFailure: "simbookWriteResponse"},
	], 

	create: function() {	
		this.inherited(arguments);
		this.dataChanged = false; 
	},

	updateUI: function(index, data) {
		this.itemData = data; 
		this.itemIndex = index; 		
		enyo.log(this.itemIndex);
		enyo.log(this.itemData); 
		if (this.itemIndex == -1) { //add
			this.$.controlGroup.setCaption($L("ADD FIXED NUMBER"));
			this.$.buttonDelete.hide();
			this.$.inputName.setValue("");
			this.$.inputNumber.setValue("");
		} else { //view
			this.$.controlGroup.setCaption($L("EDIT FIXED NUMBER"));
			this.$.buttonDelete.show(); 
			if (this.itemData){
				this.$.inputName.setValue(this.itemData.name);
				this.$.inputNumber.setValue(this.itemData.number);
			}
		}
	},

	setHeaderText: function(content){
		this.$.controlGroup.setCaption(content); 
	}, 

	valueChanged: function(event) {
		this.dataChanged = true; 
	}, 

	deleteClick: function() {		
		this.$.deletePrompt.open(); 
	},	

	deleteConfirm: function(inSender) {
		if (this.itemData){
			var param = {
			"index": this.itemData.index,
			"type": "fdn"
			};
			this.$.simbookDelete.call(param);
		}
	},

	DoneClick: function() {
		if (this.dataChanged){ //save the changes if there is any
			this.username = this.$.inputName.getValue();
			this.usernumber = this.$.inputNumber.getValue();
			var param; 
			if (this.itemIndex === -1){
				param = {
					"type": "fdn",
					"name": this.username,
					"number":this.usernumber
				}; 
				this.itemData = param;
			}else{
				param = {
					"index": this.itemData.index,
					"name": this.username,
					"number":this.usernumber,
					"type": "fdn"
				}
			}	
			this.$.simbookWrite.call(param);			  
		}else{
			enyo.application.UI.event("changeView", {"launchType":"restrictedDialingList"});
		}
	},
	
	simbookWriteResponse: function(inSender, response){	
		if (response.returnValue){
			this.needRefresh =  true; 
		} else {
			enyo.error("errorCode: " + response.errorCode + " errorString: " + response.errorString);
			var errorMsg = response.errorString; 
			this.$.dialogError.open($L("Fixed Dialing Number"), errorMsg); 
		}
		enyo.application.UI.event("changeView", {"launchType":"restrictedDialingList"});

	},

	simbookDeleteResponse: function(inSender, response) {		
		if (response.returnValue){
			this.needRefresh =  true; 
		} else { 
			enyo.error("errorCode: " + response.errorCode + " errorString: " + response.errorString);
			var errorMsg = response.errorString; 
			this.$.dialogError.open($L("Fixed Dialing Number"), errorMsg); 
		}				
		enyo.application.UI.event("changeView", {"launchType":"restrictedDialingList"});
	}

});
