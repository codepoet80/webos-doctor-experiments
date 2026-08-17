enyo.kind({
	name: "phoneOMADM",
	kind: "Dialog",
	components: [
		{kind: "Item", layoutKind: "HFlexLayout", components: [
			//{kind: "Image", src: "images/icon.png"},
			{className: "enyo-item top", style: "padding: 12px", content: $L("OMADM settings")},
		]},
		{kind: "Item", layoutKind: "HFlexLayout", components: [
			{kind: enyo.Label, flex: 1, content: $L("Provisioning URL")},
			{kind: enyo.Input, flex: 1, className: "title", name: "url", hint: $L("URL")},
		]},
		{kind: "Item", layoutKind: "HFlexLayout", components: [
			{kind: enyo.Label, flex: 1, content: $L("Enter MSL")},
			{kind: enyo.Input, flex: 1, className: "title", name: "msl", hint: $L("msl")},
		]},
		{kind: enyo.Label, flex: 1, name: "message"},
		{kind: "Button", className: "button-secondary", name: "saveButton", caption: $L("Save"), onclick: "handleSave"},
		{kind: "Button", className: "button-secondary", name: "defaultsButton", caption: $L("Restore defaults"), onclick: "handleRestore"},
		{kind: "Button", className: "button-secondary", name: "closeButton", caption: $L("Close"), onclick: "handleClose"},
		{name: "provisioning", kind:"PalmService", service: "palm://com.palm.provisioning/"},
		{name: "telService", kind: enyo.PalmService, service: enyo.palmServices.telephony, onSuccess: "", onFailure: ""}
	],

	create: function() {
		this.inherited(arguments);
		//enyo.callService("luna://com.palm.provisioning/GetURL/", {}, enyo.hitch(this, "updateUrl"));
		this.$.provisioning.call({},{
			method: "GetURL",
			onSuccess: "_updateUrl", 
			onFailure: "_updateUrl"
		});
	},

	_updateUrl: function(inSender, payload) {
		if (payload && payload.URL) {
			this.$.url.setValue(payload.URL);
		} else {
			enyo.log("OmadmAssistant: URL payload invalid");
		}
	},

	handleRestore: function() {
		this.handleSaveRestore(true);
	},

	handleSave: function(event) {
		this.handleSaveRestore(false);
	},

	handleSaveRestore: function(restoreDefaults) {
		this.url = '';
		
		// an empty URL returns to the default provisioning URL
		if (restoreDefaults == false) {
			this.url = this.$.url.getValue();
		}
		
		this.msl = this.$.msl.getValue();
		if(!this.msl) {
			this.$.message.setContent($L("Please enter the MSL"));
			return;
		}

		this.$.message.content = '';
		this.$.saveButton.disabled = true;
	        this.$.closeButton.disabled = true;

		//TelephonyCommands.enterProgramMode(this.msl, enyo.hitch(this, "doProgramming"));
		this.$.telService.call({
			"msl": msl
		},{
			method: "enterProgramMode",
			onSuccess: "doProgramming",
			onFailure: "doProgramming"
		});		
	},
	
	doProgramming: function (inSender, response) {

		if (response.returnValue) {
			//enyo.callService("luna://com.palm.provisioning/SetURL/", {"URL": this.url,"MSL": this.msl}, enyo.hitch(this, "handleProgrammingSaved"));
			this.$.provisioning.call({
				URL: this.url,
				MSL: this.msl
			},{
				method: "SetURL",
				onSuccess: "_handleProgrammingSaved",
				onFailure: "_handleProgrammingSaved"
			});			 
		} else {

			this.$.message.setContent(enyo.application.Messages.serviceErrors[response.errorCode] || enyo.application.Messages.generalServiceError || $L("Error"));
	            	this.$.saveButton.disabled = false;
	            	this.$.closeButton.disabled = false;
		}
	},

	// updates status message; exits program mode
	_handleProgrammingSaved: function(inSender, response) {

		if (!response.returnValue) {
			this.$.message.setContent(enyo.application.Messages.serviceErrors[response.errorCode] || enyo.application.Messages.generalServiceError || $L("Error"));
		} else {
			this.$.message.setContent(enyo.application.Messages.omadmSuccess || $L("Success"));
		}

		this.exitProgramMode();	
		//enyo.callService("luna://com.palm.provisioning/GetURL/", {}, enyo.hitch(this, "updateUrl"));
		this.$.provisioning.call({},{
			method: "GetURL",
			onSuccess: "_updateUrl", 
			onFailure: "_updateUrl"
		});	
	},
	
	// exits program mode, optionally closing dialog
	exitProgramMode: function() {

		//TelephonyCommands.exitProgramMode(null);
		this.$.telService.call({},{ 
			method: "programModeExit",
			onSuccess: "",
			onFailure: ""
		});				
		this.$.saveButton.disabled = false;
	        this.$.closeButton.disabled = false;
	},
	
	handleClose: function() {
		//this.owner.close();
		close();
	}, 
});


