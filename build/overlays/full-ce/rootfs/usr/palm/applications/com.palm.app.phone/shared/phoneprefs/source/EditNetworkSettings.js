/*globals enyo */
enyo.kind({
	name: "ErrorDialog",
	kind: enyo.Dialog,
	className: "enyo-dialog",
	scrim: true,
	published: {
		title: "",
		message: "",
		acceptButtonCaption: $L("OK"),
	},
	events: {
		onAccept: ""
	},
	components: [
		{name: "title", className: "enyo-dialog-prompt-title"},
		{className: "enyo-dialog-prompt-content", components: [
			{name: "message", className: "enyo-dialog-prompt-message"},
			{name: "acceptButton", kind: "Button", onclick: "acceptClick"}
		]}		
	],
	create: function() {
		this.inherited(arguments);
		this.titleChanged();
		this.messageChanged();
		this.acceptButtonCaptionChanged();
	},
	open: function(inTitle, inMessage, inAcceptButtonCaption) {
		if (inTitle) {
			this.setTitle(inTitle);
		}
		if (inMessage) {
			this.setMessage(inMessage);
		}
		if (inAcceptButtonCaption) {
			this.setAcceptButtonCaption(inAcceptButtonCaption);
		}
		this.inherited(arguments);
	},
	titleChanged: function() {
		this.$.title.setContent(this.title);
		this.$.title.setShowing(this.title);
	},
	messageChanged: function() {
		this.$.message.setContent(this.message);
	},
	acceptButtonCaptionChanged: function() {
		this.$.acceptButton.setCaption(this.acceptButtonCaption);
	},
	acceptClick: function() {
		this.doAccept();
		this.close();
	}
});

enyo.kind({
	name: "EditNetworkSettings",
	kind: enyo.VFlexBox,
	statics: {
		kApnTypeData: 1,
		kApnTypeMms: 4
	},
	events: {
		onDoneClick: ""
	},
	published: {
		MMS : false 
	}, 
	components: [
		{kind: "PageHeader", pack: "center", className: "header", content: $L("Network Settings")},     
		{kind: "Scroller", flex: 1, components: [
			{kind: "HFlexBox", style: "margin-top: 24px;", flex: 1, pack: "center", components:[
				{kind: "Control", width: "500px", components:[
				
					{name: "APNRadio", kind: "RadioGroup", value: 0, onChange: "APNclick", components: [
						{label: $L('INTERNET APN')},
						{label: $L('MMS APN')}
					]},
					{name: "APN", kind: "RowGroup", caption: $L("INTERNET APN"), components: [
						{name: "inputAPN", kind: "Input", autoCapitalize: "lowercase", onchange: "onFieldChange"}
					]},

					{kind: "RowGroup", caption: $L("USERNAME"), components: [
						{name: "userName", kind: "Input", autoCapitalize: "lowercase", onchange: "onFieldChange"}
					]},

					{kind: "RowGroup", caption: $L("PASSWORD"), components: [
						{name: "passWord", kind: enyo.PasswordInput, onchange: "onFieldChange"}
					]},

					{name: "MMSProp", kind: "RowGroup", caption: $L("MMS PROPERTIES"), components: [
						{name: "MMSC", kind: "Input", hint: $L(""), onchange: "onFieldChange", components: [
							{content: $L("MMSC"), domStyles: {"text-transform": "uppercase", "text-align": "right", color: "#00ABEF"}}
						]},
						{name: "MMSCProxy", kind: "Input", hint: $L(""), onchange: "onFieldChange", components: [
							{content: $L("MMS PROXY"), domStyles: {"text-transform": "uppercase", "text-align": "right", color: "#00ABEF"}}
						]},
						{name: "MMSCMaxSize", kind: "Input", hint: $L(""), onchange: "onFieldChange", components: [
							{content: $L("MAX SIZE"), domStyles: {"text-transform": "uppercase", "text-align": "right", color: "#00ABEF"}}
						]}
					]},

				        {kind: "Item", layoutKind: "HFlexLayout", components: [
					        {kind: enyo.Label, name: "statusLabel", content: $L("Status: Ready")},
				        ]},
					{name: "ChangeSettings", kind: "ActivityButton", active: false, caption: $L("Change Settings"), onclick: "onChangeSettings"}, 
					{name: "SetupAnyway", kind: "ActivityButton", active: false, caption: $L("Set Up Anyway"), onclick: "onSetupAnyway"},
		            {name: "backButton", kind: "Button", content: $L("Back"), showing: false, onclick: "handleButtonBack"},

					{name: "dialogSwitch", kind: "Dialog", onClose: "HideScrim", components: [
						{className: "networksetting-dialog-style", content: $L("You must save changes before continuing.")},
						{kind: "Button", caption: $L("Save Changes"), onclick: "saveChanges"},
						{kind: "Button", caption: $L("Discard Changes"), onclick: "discardChanges"},
						{kind: "Button", caption: $L("Cancel"), onclick: "closeDialog"}
					]},
					//{name: "scrimStyle", className: "enyo-confirmprompt-scrim enyo-fit", domStyles: {"display": "none"}},

				]},   
			]},
		]},
		//setupanyway dialog
		{name: "setupanywayDialog", kind: "Dialog", components: [
			{className: "enyo-item top", style: "padding: 12px", content: $L("Set Up Anyway?")},
			{className: "enyo-item", name: "dlgMsg", content: $L("If these settings are invalid, you will not have a data connection.  Are you sure you want to use these settings?")},
			{kind: "Button", caption: $L("Ok"), onclick: "handleDlgOk"},
			{kind: "Button", caption: $L("Cancel"), onclick: "handleDlgCancel"}
		]},
		
		//Alert dialog
		{name: "alertDialog", kind: "Dialog", components: [
			{className: "enyo-item top", style: "padding: 12px", name: "dlgTitle", content: $L("Unable to Set Up Internet APN")},
			{className: "enyo-item", content: $L("Your settings could not be validated. If you believe these settings are correct, try again in a few minutes. For assistance, call your service provider.")},
			{kind: "Button", caption: $L("Ok"), onclick: "handleAlertDlgOk"},
		]},
		
		
		//Service calls
		{name: "wanService", kind: enyo.PalmService, service:"palm://com.palm.wan/"},
		{name: "testDataSettingsSubscribe", kind: enyo.PalmService, service:"palm://com.palm.wan/", method: 'getstatus', subscribe: true, onSuccess: "onTestDataSetSubResponse", onFailure: "onTestDataSetSubResponse"},
		{name: "testMMSSettingsSubscribe", kind: enyo.PalmService, service:"palm://com.palm.wan/", method: 'getstatus', subscribe: true, onSuccess: "onTestMMSSetSubResponse", onFailure: "onTestMMSSetSubResponse"},
		{name: "messagingService", kind: enyo.PalmService, service: "palm://com.palm.messaging/", method: "mms/validateMmscSettings", onSuccess: "validateMmscSettingsResponse", onFailure: "validateMmscSettingsResponse"},
		{name: "carrierdbService", kind: enyo.PalmService, service: "palm://com.palm.carrierdb/"},
		{name: "carrierDBIdentifier", kind: enyo.PalmService, service: "palm://com.palm.carrierdb/", method: "getCurrentRecord", onSuccess: "updateSettings", 	onFailure: "updateSettings"},
		{name: "db8Service", kind: enyo.PalmService, service: "palm://com.palm.db/", method: "find", onSuccess: "updateMMSSettings", onFailure: "updateMMSSettings"},
		{name: "testMmsSettings", kind: enyo.PalmService, service: "palm://com.palm.mmsservice/", method: "validateMmscSettings", onSuccess: "onTestMmsSettings", onFailure: "onTestMmsSettings"},

		//error dialog
		//{name: "dialogError", kind: "ErrorDialog"}
	], 

	//Todo: the initial focus is not working
	create: function() {
		this.inherited(arguments);
		
		this.$.backButton.setShowing(this.tablet);
		
		this.firstuse = false; //this.params.callingapp == "firstuse";

		this.$.MMSProp.hide(); 
		//this.initData(); 
		//this.$.inputAPN.forceFocus();

		this.settingsModel = {};
		this.loadSettings();
		
		this.$.SetupAnyway.hide();
		
		this.internetApnChanged = false;
		this.mmsApnChanged = false;
	},

	/*initData: function() {
		this.datausername = "";
		this.datapassword = "";
		this.dataapn = "";
		this.mmsusername = "";
		this.mmspassword = "";
		this.mmsapn = "";
		this.mmsc = "";
		this.mmsproxy = "";
		this.mmsmaxsize = "";
		//this.continueSwitch = true;
		//this.disconnect = true;
	},*/
	
	onFieldChange: function() {
        	(1 == this.$.APNRadio.getValue()) ? this.mmsApnChanged = true : this.internetApnChanged = true;
	},

	loadSettings: function() {
        	this.$.carrierDBIdentifier.call({});		
		this.$.db8Service.call( {"query": {"from": "com.palm.carrierdb.settings.current:1"}});
	},

	updateSettings: function(inSender, payload) {
	
	        enyo.log("updateSettings " + enyo.json.stringify(payload));
	
	        if (payload && payload.profiles && payload.profiles.length > 0) {
			payload = payload.profiles;
		} else {
			return;
		}
		
		this.settingsModel.dataApn = '';
		this.settingsModel.dataUser = '';
		this.settingsModel.dataPassword = '';
		
		this.settingsModel.mmsApn = '';
		this.settingsModel.mmsUser = '';
		this.settingsModel.mmsPassword = '';
		
		this.datausername = "";
		this.datapassword = "";
		this.dataapn = "";
		this.mmsusername = "";
		this.mmspassword = "";
		this.mmsapn = "";

		if (payload) {
 
			var d;
			var m;
			
			// find the data and/or mms apn in the list
			payload.forEach(function(apn) {
			        enyo.log(enyo.json.stringify(apn));
				if (apn.apnType === EditNetworkSettings.kApnTypeData) {
					d = apn;
				} else if (apn.apnType === EditNetworkSettings.kApnTypeMms) {
					m  = apn;
				}
			}, this);
			
			// if we have a data apn, get the settings
			if (d !== undefined) {
                		enyo.log("Internet APN = " + d.apn + " " + d.uname + " " + d.passwd);
				this.dataapn = this.settingsModel.dataApn = d.apn;
				this.datausername = this.settingsModel.dataUser = d.uname;
				this.datapassword = this.settingsModel.dataPassword = d.passwd;
			}
			
			// if we have an mms apn, get those settings too
			if (m !== undefined) {
        			enyo.log("MMS APN = " + m.apn + " " + m.uname + " " + m.passwd);
				this.mmsapn = this.settingsModel.mmsApn = m.apn;
				this.mmsusername = this.settingsModel.mmsUser = m.uname;
				this.mmspassword = this.settingsModel.mmsPassword = m.passwd;
			}			
		}

		this.updateUI(this.$.APNRadio.getValue());
	},
	
	updateMMSSettings: function(inSender, payload) {
	
	        enyo.log("updateMMSSettings " + enyo.json.stringify(payload));
	
		if (payload && payload.results && payload.results.length > 0) {
			payload = payload.results[0];
		} else {
			return;
		}
		
		this.settingsModel.mmsc = '';
		this.settingsModel.mmsProxy = '';
		this.settingsModel.mmsMaxSize = '';
		this.mmsc = "";
		this.mmsproxy = "";
		this.mmsmaxsize = "";
	
		if (payload) {
		        enyo.log("mms settings " + payload.mmscUrl + " " + payload.mmsProxy + " " + payload.mmscMessageSizeLimit);
			this.mmsc = this.settingsModel.mmsc = payload.mmscUrl;
			this.mmsproxy = this.settingsModel.mmsProxy = payload.mmsProxy;
			this.mmsmaxsize = this.settingsModel.mmsMaxSize = payload.mmscMessageSizeLimit;

		}
				
		this.updateUI(this.$.APNRadio.getValue());
	},

	APNclick: function(inSender) {
		var value = inSender.getValue(); 
		this.updateUI(value);
		
		if(this.mmsApnChanged == true && value == 0) {
        	        this.mmsApnChanged = false;
		        this.$.dialogSwitch.open();
		}
		
		//changed internet settings and trying to go to mms settings
		if(this.internetApnChanged == true && value == 1)  {
		        this.internetApnChanged = false;
      		        this.$.dialogSwitch.open();
		}
/*
		if (this.continueSwitch){
			enyo.log("switch " + value);
			this.updateUI(value);			
		}
*/
	},

	updateUI: function(value) {
	        enyo.log("updateUI " + value);
		if (value == 1) {
			this.$.APN.setCaption($L("MMS APN")); 
			this.$.MMSProp.show();
			this.MMS = true; 

			this.$.userName.setValue(this.settingsModel.mmsUser);
			this.$.passWord.setValue(this.settingsModel.mmsPassword);
			this.$.inputAPN.setValue(this.settingsModel.mmsApn);
			this.$.MMSC.setValue(this.settingsModel.mmsc);
			this.$.MMSCProxy.setValue(this.settingsModel.mmsProxy);
			this.$.MMSCMaxSize.setValue(this.settingsModel.mmsMaxSize);

		} else {
			this.$.APN.setCaption($L("INTERNET APN"));
			this.$.MMSProp.hide();
			this.MMS = false;

			this.$.userName.setValue(this.settingsModel.dataUser);
			this.$.passWord.setValue(this.settingsModel.dataPassword);
			this.$.inputAPN.setValue(this.settingsModel.dataApn);
		}
		
		this.$.statusLabel.setContent($L("Ready."));
		this.$.SetupAnyway.hide();
	}, 
	
	onChangeSettings: function() {
	        (1 == this.$.APNRadio.getValue()) ? this.onMmsChangeTap() : this.onDataChangeTap();
	},
	
	buttonSpin: function() {	
		this.$.ChangeSettings.setCaption($L("Changing Settings"));
		//this.$.ChangeSettings.setDisabled(true);
		this.$.ChangeSettings.setActive(true);
	},
	
	buttonSpinStop: function(button, model, success) {
		this.$.ChangeSettings.setCaption($L("Change Settings"));
		//this.$.ChangeSettings.setDisabled(false);
		this.$.ChangeSettings.setActive(false);
	},
	
	onSetupAnyway: function() {       	
        	
	        if(1 == this.$.APNRadio.getValue()) {
	                this.$.dlgMsg.setContent($L("If these settings are invalid, you will not be able to send or receive an MMS.  Are you sure you want to use these settings?"));
                } else {
                        this.$.dlgMsg.setContent($L("If these settings are invalid, you will not have a data connection.  Are you sure you want to use these settings?"));
                }
	                
	        this.$.setupanywayDialog.toggleOpen();
	},
	
	handleDlgOk: function() {
		enyo.log("handleDlgOk : " + this.$.APNRadio.getValue());
		
		if(1 == this.$.APNRadio.getValue()) {
			enyo.log("setup MMS");
			this.onMmsSetupAnywayTap();
		} else {
			enyo.log("setup DATA");
			this.onDataSetupAnywayTap();
		}
        	this.$.setupanywayDialog.toggleOpen();
	},
	
	handleDlgCancel: function() {
        	this.$.setupanywayDialog.toggleOpen();
	},
	
	handleAlertDlgOk: function() {
		this.$.alertDialog.toggleOpen();
	},
		
	onDataChangeTap: function() {
		        
                this.settingsModel.dataUser = this.$.userName.getValue();
		this.settingsModel.dataPassword = this.$.passWord.getValue();
		this.settingsModel.dataApn = this.$.inputAPN.getValue();
		
		enyo.log(this.settingsModel.dataUser + " " + this.settingsModel.dataPassword + " " + this.settingsModel.dataApn);
	        
		this.testDataSettings();
		this.buttonSpin();
	},
	
	testDataSettings: function() {
	
	        this.$.statusLabel.setContent($L(""));
       		this.$.SetupAnyway.hide();
	         
	        this.$.wanService.call({
                        "action":"connect",
			"wanprofile": {
				"cid": "1",
				"service":"test",
				"username":this.settingsModel.dataUser,
				"password":this.settingsModel.dataPassword,
				"pdptype":"IP",
				"apn":this.settingsModel.dataApn,
				"pdpaddr":"0.0.0.0",
				"dcomp":0,
				"hcomp":"0"
			}
	        },{
        	         method: 'manageprofile',
        	         onSuccess: "onTestDataSettingResponse",
        	         onFailure: "onTestDataSettingResponse"
	        });
	},
	
	onTestDataSettingResponse: function(inSender, payload) {
        	 enyo.log("onTestDataSettingResponse");
	        if (payload.returnValue) {
		        this.$.statusLabel.setContent($L("Internet APN Settings tested.. getting status.."));
        		this.$.testDataSettingsSubscribe.call({});
        	} else {
	        	this.buttonSpinStop();
        	        enyo.log("onTestDataSettingResponse - error");
        	        this.$.statusLabel.setContent($L("Invalid Internet APN Settings.."));
			this.$.SetupAnyway.show();
        	}
	},
	
	onTestDataSetSubResponse: function(inSender, payload) {
	
	        enyo.log("onTestDataSetSubResponse");
	        
	        if(payload.returnValue == false) {
	        	this.buttonSpinStop();
	        	this.$.statusLabel.setContent($L("Invalid Internet APN Settings.."));
			this.$.SetupAnyway.show();
	        	return;
	        }
	        
	        
	        this.$.statusLabel.setContent($L("Waiting for active connect status.."));
	        
        	var result = undefined;
        	if (payload && payload.connectedservices) {
	                payload.connectedservices.forEach(function(service) {
	                //payload.connectedservices.each(function(service) {
			        if (service.service.indexOf("test") !== -1 ) {					
					if (service.connectstatus === "active") {
						result = true;
												
					} else if (service.connectstatus === "disconnected" || service.requeststatus === "connect failed") {
					        this.$.statusLabel.setContent(service.connectstatus);
						result = false;						
					} 
					if (result !== undefined) {
						//if (settings && settings.disconnect === true) {
							//testDataSettingsDisconnect
							this.$.wanService.call({
							        "action":"disconnect",
			                                        "wanprofile": {
				                                        "cid": "1",
			                                        }
							},{
        							method: 'manageprofile',
        							onSuccess: "",
                                                	        onFailure: ""
							});
						//}
						this.processTestDataSet(result);
						this.$.testDataSettingsSubscribe.cancel();
					}
				}
			}, this);
			//});
		}
	},
	
	processTestDataSet: function(result) {
		if (result) {
			this.$.statusLabel.setContent($L("Writing data settings.."));
			this.writeDataSettings();
		} else {
			this.buttonSpinStop();
			
			if (this.firstUse) {
				this.$.alertDialog.toggleOpen();				
			} else {
			        this.$.statusLabel.setContent($L("Unable to Set Up Internet APN.."));
			        this.$.SetupAnyway.show();
			}
		} 
	},
	
	writeDataSettings: function() {
		enyo.log("WRITING DATA SETTINGS!");
		this.$.statusLabel.setContent($L("Write Internet APN Settings...."));
		
		this.$.carrierdbService.call({
		        "apns": [{
				"apn": this.settingsModel.dataApn,
				"username": this.settingsModel.dataUser,
				"password": this.settingsModel.dataPassword,
				"apnType": EditNetworkSettings.kApnTypeData
			}]
			}, {
			         method: 'setOverrideRecord',
                	         onSuccess: "onWriteDataSettings",
                	         onFailure: "onWriteDataSettings"
			});
	},
	
	onWriteDataSettings: function(inSender, payload) {
		enyo.log("onWriteDataSettings");
		this.buttonSpinStop();
		
		if (payload.returnValue) {
			//this.resetError('data');
			//this.dataDirty = false;

			//enableManualDataSettings
			this.$.carrierdbService.call({'useOverride': true},{
			        method: "enableOverride",
			        onSuccess: "",
				onFailure: ""
				});
			if(this.firstuse) {
				//TODO: go back
				//this.controller.window.close();
			} else {			
				enyo.windows.addBannerMessage($L("Internet APN settings changed"), "{}", "images/notification-small-handset.png", "none");
			}
			
			this.$.statusLabel.setContent($L("Internet APN settings changed"));
			this.$.SetupAnyway.hide();
		} else {
        		this.$.statusLabel.setContent($L("Unable to Write Internet APN Settings."));
		}
	},
	
	onDataSetupAnywayTap: function() {
		enyo.log("onDataSetupAnywayTap");
		this.buttonSpin();
		this.writeDataSettings();
	},
	
	onMmsChangeTap: function() {
		
		this.settingsModel.mmsUser = this.$.userName.getValue();
		this.settingsModel.mmsPassword = this.$.passWord.getValue();
		this.settingsModel.mmsApn = this.$.inputAPN.getValue();
		this.settingsModel.mmsc = this.$.MMSC.getValue();
		this.settingsModel.mmsProxy = this.$.MMSCProxy.getValue();
		this.settingsModel.mmsMaxSize = this.$.MMSCMaxSize.getValue();	

		this.testMmsSettings();
		this.buttonSpin();
	},
	
	// to test MMS settings, we need to manage setting up the MMS APN and tearing it down
	testMmsSettings: function() {
	
		this.$.statusLabel.setContent("");
		this.$.SetupAnyway.hide();
	
		this.$.wanService.call({
                        "action":"connect",
			"wanprofile": {
				"cid": "1",
				"service":"test",
				"username":this.settingsModel.mmsUser,
				"password":this.settingsModel.mmsPassword,
				"pdptype":"IP",
				"apn":this.settingsModel.mmsApn,
				"pdpaddr":"0.0.0.0",
				"dcomp":0,
				"hcomp":"0"
			}
	        },{
        	         method: 'manageprofile',
        	         onSuccess: "onTestMMSSettingResponse",
        	         onFailure: "onTestMMSSettingResponse"
	        });
	},
	
	onTestMMSSettingResponse: function(inSender, payload) {
        	enyo.log("onTestMMSSettingResponse");
	        if (payload.returnValue) {
		         this.$.statusLabel.setContent($L("MMS APN Settings tested.. getting status.."));
        		this.$.testMMSSettingsSubscribe.call({});
        	} else {
        	        enyo.log("onTestMMSSettingResponse - error.");
        	        this.$.statusLabel.setContent($L("Invalid MMS APN Settings.."));
       			this.buttonSpinStop();
			this.$.SetupAnyway.show();
        	}
	},
	
	onTestMMSSetSubResponse: function(inSender, payload) {
	
	        enyo.log("onTestMMSSetSubResponse");
	        
	        if(payload.returnValue == false) {
	        	this.buttonSpinStop();
	        	this.$.statusLabel.setContent($L("Invalid MMS APN Settings.."));
			this.$.SetupAnyway.show();
	        	return;
	        }
	        
	        
	        this.$.statusLabel.setContent($L("Waiting for active connect status.."));
	        
        	var result = undefined;
        	if (payload && payload.connectedservices) {
	                payload.connectedservices.forEach(function(service) {
	                //payload.connectedservices.each(function(service) {
			        if (service.service.indexOf("test") !== -1 ) {					
					if (service.connectstatus === "active") {
						result = true;
												
					} else if (service.connectstatus === "disconnected" || service.requeststatus === "connect failed") {
					        this.$.statusLabel.setContent(service.connectstatus);
						result = false;						
					} 
					if (result !== undefined) {
						this.processTestMMSSet(result);
						this.$.testMMSSettingsSubscribe.cancel();
					}
				}
			}, this);
			//});
		}
	},

	processTestMMSSet : function(result) {
		enyo.log("onTestMMSSetSubResponse ");
		if (result) {
		        this.$.testMmsSettings.call({
		                "mmsc": this.settingsModel.mmsc,
				"mmsProxy": this.settingsModel.mmsProxy
		        });
		} else { // on failure, tear down
			this.testDataSettingsDisconnect();
			this.$.statusLabel.setContent($L("Invalid MMS APN Settings.."));
			this.buttonSpinStop();
			this.$.SetupAnyway.show();
		}
	},
	
	onTestMmsSettings: function(inSender, payload) {

		this.testDataSettingsDisconnect();
		if (payload.mmscSettingsValid === true) {
			this.writeMmsSettings();
		} else {
        		this.$.statusLabel.setContent($L("Invalid MMS Settings..."));
			this.buttonSpinStop();
			this.$.SetupAnyway.show();
		}
	},
	
	writeMmsSettings: function() {
		enyo.log("WRITING MMS SETTINGS!");
		this.$.statusLabel.setContent($L("Write MMS APN Settings...."));
		
		var manualSettings = {
			"apns": [{
				"apn": this.settingsModel.mmsApn,
				"username": this.settingsModel.mmsUser,
				"password": this.settingsModel.mmsPassword,
				"apnType": EditNetworkSettings.kApnTypeMms
			}],
			"mmsSettings": {
				"mmscUrl": this.settingsModel.mmsc,
				"mmsProxy": this.settingsModel.mmsProxy
			}
		};
		if(this.settingsModel.mmsMaxSize !== undefined) {
			manualSettings.mmsSettings.mmscMessageSizeLimit = parseInt(this.settingsModel.mmsMaxSize, 10);
		}
	
		this.$.carrierdbService.call( manualSettings, {
		         method: 'setOverrideRecord',
        	         onSuccess: "onWriteMmsSettings",
        	         onFailure: "onWriteMmsSettings"
		});
	},
	
	onWriteMmsSettings: function(inSender, payload) {
		this.buttonSpinStop();
		if (payload.returnValue) {			
			//this.resetError('mms');
			//this.mmsDirty = false;
			
        		//enableManualDataSettings
			this.$.carrierdbService.call({'useOverride': true},{
			        method: "enableOverride",
			        onSuccess: "",
				onFailure: ""
				});
				
			enyo.windows.addBannerMessage($L("MMS APN settings changed"),"{}","images/notification-small-handset.png","none");
        		this.$.statusLabel.setContent($L("MMS APN settings changed."));
        		this.$.SetupAnyway.hide();
		} else {
			this.$.statusLabel.setContent($L("Unable to write MMS settings."));
		}		
	},
	
	onMmsSetupAnywayTap: function() {
		enyo.log("onMmsSetupAnywayTap");
		this.buttonSpin();
		this.writeMmsSettings();
	},

	/*collectData: function() {
		this.username = this.$.userName.getValue();
		this.password = this.$.passWord.getValue();
		this.apn = this.$.inputAPN.getValue();
		if (this.username == "" || this.password == "" || this.apn == ""){
			return false; 
		}
		if (this.MMS){
			this.mmsc = this.$.MMSC.getValue();
			this.mmsproxy = this.$.MMSCProxy.getValue();
			this.mmsmaxsize = this.$.MMSCMaxSize.getValue();
			if (this.mmsc == "" || this.mmsproxy == "" || this.mmsmaxsize == ""){
				return false; 
			}
		}
		return true; 
	},

	changeSettings: function(){
		this.buttonSettings.setActive(true); 
		//this.doDoneClick(); 
		this.collectData(); 

		if (this.MMS === true){
			this.disconnect = true; 
		}

		if ((this.username == "") || this.apn == ""){
			//todo: pop error?? 
		}

		this.testDataSettingChanges();
	},

	testDataSettingChanges: function(){
		enyo.log("testDataSettingChanges "+this.username + " "+ this.password + " "+this.apn);				
		var params = {
			"action":"connect",
			"wanprofile": {
				"cid": "1",
				"service":"test",
				"username":this.username,
				"password":this.password,
				"pdptype":"IP",
				"apn":this.apn,
				"pdpaddr":"0.0.0.0",
				"dcomp":0,
				"hcomp":"0"
			}			
		};

		//SystemService.executeBusCall(SystemService.wanIdentifier, "/manageprofile", params, enyo.hitch(this, "testDatasettingsResponse"));
		this.$.wanService.call(params,{
			method: "manageprofile", 
			onSuccess: "testDatasettingsResponse",
			onFailure: "testDatasettingsResponse"
		});
	},

	testDatasettingsResponse: function(inSender, response){
		enyo.log("TestDatasettingsResponse: " + response);
		if (response.returnValue){
			//SystemService.executeBusCall(SystemService.wanIdentifier, "/getstatus", {"subscribe": true}, enyo.hitch(this, "testSettingsSubscribeResponse"));
			this.$.wanService.call({
				"subscribe": true
			},{
				method: "getstatus", 
				onSuccess: "testSettingsSubscribeResponse",
				onFailure: "testSettingsSubscribeResponse"
			});
		}else{
			if (this.MMS){
				this.showSettingError("Invalid MMS APN Settings."); 
			}else {
				this.showSettingError("Invalid Internet APN Settings."); 
			}
		}

	},

	testSettingsSubscribeResponse: function(inSender, response){
		enyo.log("testSettingsSubscribeResponse: " + response); 
		if (response.returnValue){
			if (response.connectedservices){
				response.connectedservices.each(function(service) {
					if (service.service.indexOf("test") !== -1 ) {
						var result = undefined;
						if (service.connectstatus === "active") {
							result = true;
							
						} else if (service.connectstatus === "disconnected" || service.requeststatus === "connect failed") {
							result = false;
						} 
						if (result !== undefined) {
							if (this.disconnect === true) {
								this.testDataSettingsDisconnect();
							}
							this.testMoreDataSettings(); 
							//SystemService.dataSettingsReq.cancel();
						}else{
							if (this.MMS){
								this.showSettingError("Invalid MMS APN Settings."); 
							}else {
								this.showSettingError("Invalid Internet APN Settings."); 
							}
						}
					}
				});			
			}
		}else{
			
		}
	},*/

	testDataSettingsDisconnect: function(){
		this.$.wanService.call({
			"action":"disconnect",
			"wanprofile": {
			"cid": "1",
			}
		}, {
			method: "manageprofile",
	                onSuccess: "",
			onFailure: ""
		});
	}, 

	/*testMoreDataSettings: function(){
		enyo.log("testMoreDataSettings");
		if (this.MMS){
			var param = {
				"mmsc": this.mmsc,
				"mmsProxy": this.mmsproxy,
				"apn":"test"
			};
			//SystemService.executeBusCall(SystemService.messagingIdentifier, "/mms/validateMmscSettings", params, enyo.hitch(this, "validateMmscSettingsResponse"));
			this.$.messagingService.call(param);
		}else {
			var params = {
				"apns": [{
					"apn": this.apn,
					"username": this.username,
					"password": this.password,
					"apnType": EditNetworkSettings.kApnTypeData  //1
				}]		
			};
			this.commitSettingChanges(params);
		}
	},

	validateMmscSettingsResponse: function(inSender, response){
		enyo.log("validateMmscSettingsResponse: "+ response);
		this.testDataSettingsDisconnect();
		if (response.returnValue){
			var params = {
				"apns": [{
					"apn": this.apn,
					"username": this.username,
					"password": this.password,
					"apnType": EditNetworkSettings.kApnTypeMms //4
				}],
				"mmsSettings": {
					"mmscUrl": this.mmsc,
					"mmsProxy": this.mmsproxy,
					"mmscMessageSizeLimit": parseInt(this.mmsmaxsize, 10)
				}
			}
			this.commitSettingChanges(params);
		}else{
			this.showSettingError("Invalid MMS Settings"); 
		}
	},

	commitSettingChanges: function(params){
		enyo.log("commitSettingChanges: "+params);

		//SystemService.executeBusCall(SystemService.carrierDBIdentifier, "/setOverrideRecord", params, enyo.hitch(this, "commitSettingsResponse"));
		this.$.carrierdbService.call(params, {
			method: "setOverrideRecord",
			onSuccess: "commitSettingsResponse",
			onFailure: "commitSettingsResponse"
		});		
	},

	commitSettingsResponse: function(inSender, response){
		enyo.log("commitSettingsResponse: "+response);
		this.buttonSettings.setActive(false);
		if (response.returnValue){
			//SystemService.executeBusCall(SystemService.carrierDBIdentifier, "/enableOverride", {"useOverride": true}, enyo.hitch(this, "enableManualsettingsResponse"));
			this.$.carrierdbService.call({
				"useOverride": true
			},{
				method: "enableOverride",
				onSuccess: "enableManualsettingsResponse",
				onFailure: "enableManualsettingsResponse"				
			});		
		}else{
			this.showSettingError("Unable to Write Settings."); 
		}

	},

	enableManualsettingsResponse: function(inSender, response){
		enyo.log("enableManualsettingsResponse: " + response);
		if (response.returnValue){
			//todo: show banner "Internet APN settings changed"
		}else{
			this.showSettingError("Unable to Write Settings."); 
		}
	},*/

	saveChanges: function() {
		/*if (!this.MMS){
			this.disconnect = true; 
		}*/
	
                if(1 == this.$.APNRadio.getValue()) {
        		this.testMmsSettings();
        	} else {
      			this.testDataSettings();
      		}
      		
		this.$.dialogSwitch.close();
	},

	discardChanges: function() {
	        var value = this.$.APNRadio.getValue();
                if(1 == value) {
                        this.settingsModel.mmsApn = this.mmsapn;
                        this.settingsModel.mmsUser = this.mmsusername;
                        this.settingsModel.mmsPassword = this.mmspassword;

                        this.settingsModel.mmsc = this.mmsc;
                        this.settingsModel.mmsProxy = this.mmsproxy;
                        this.settingsModel.mmsMaxSize = this.mmsmaxsize;
                } else {

                        this.settingsModel.dataApn = this.dataapn;
                        this.settingsModel.dataUser = this.datausername;
                        this.settingsModel.dataPassword = this.datapassword;
                }
                
                this.updateUI(value);
                this.$.dialogSwitch.close();
	},

	HideScrim: function() {
		//this.$.scrimStyle.hide();
	},

	closeDialog: function() {
		this.$.dialogSwitch.close();
	},
	
	handleButtonBack: function() {
		this.doDoneClick(); 
	}

/*	showSettingError: function(errorMsg){
		this.$.buttonSettings.setActive(false);
		this.$.dialogError.open("Change Settings", errorMsg);
	},*/

});
