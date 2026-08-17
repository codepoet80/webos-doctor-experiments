/*globals enyo */

enyo.kind({
	name: "WorldPhone",
	kind: enyo.VFlexBox,
	className: "enyo-bg",
	components: [
		{kind: "RowGroup", caption: $L("WORLD PHONE"), components: [
			{kind: "ListSelector", value: "cdma", name: "networkMode", label: $L("Network"), onChange: "selectorChanged", items: [
				{caption: $L("CDMA Mode"), value: "cdma"},
				{caption: $L("GSM/UMTS Mode"), value: "umts"},
				{caption: $L("Global Mode"), value: "world"}
			]}
		]}, 
		{name: "dialogError", kind: "ErrorDialog"},
		{name: "wpswitchTech", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "switchTechnology", onSuccess: "onSwitchNetworkDone", onFailure: "onSwitchNetworkDone"}
	],

	create: function() {
		this.inherited(arguments);

		//this.setupPlatform();
	},

	selectorChanged: function(event) {		
		if(event.value) {
			enyo.log("WorldPhone: selectorChanged "+event.value);
			this.selectiontoSave = event.value;
			if (this.selectiontoSave != enyo.application.Cache.platformTech){
				this.$.wpswitchTech.call({
					"tech": this.selectiontoSave
				});					
			}
		}
	},

	onSwitchNetworkDone: function(inSender, response) {	
		enyo.log("WorldPhone:onSwitchNetworkDone "+enyo.json.stringify(response));
		if (!response.returnValue){
			enyo.log("failed to do network switch");
			var errorMsg = $L("Error Switching Network Mode"); 
			if(response.errorString == "SIM was not detected") {
				errorMsg = $L("SIM not detected");
			}
			this.$.dialogError.open($L("Switch Network"), errorMsg); 
			this.$.networkMode.setValue(enyo.application.Cache.platformTech); //revert the value back	
		}else{
			enyo.application.Cache.platformTech = this.selectiontoSave;
		}
	},

	setupPlatform: function() {
		this.$.networkMode.setValue(enyo.application.Cache.platformTech);
	}
});

