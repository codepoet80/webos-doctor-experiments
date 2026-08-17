/*globals enyo */
enyo.kind({
	name: "Network",
	kind: "VFlexBox",
	className: "enyo-bg",
	events: {
		onEditNetworkClick: "",
		onCarrierNameChange: ""
	},
	components: [
		{kind: "RowGroup", caption:$L("NETWORK"), components: [
			{layoutKind: "HFlexLayout", align: "center", name: "networkAutoSelectRow", tapHighlight: false, components: [
				{flex: 1, content: $L("Network Auto-Select")},
				{name: "networkAutoSelectToggle", kind: "ToggleButton", state: true, onChange: "toggleNetworkAutoSelect"},
			]},
			{name: "reading_networklist_row", align: "center", components: [
				{layoutKind: "HFlexLayout", flex: 1, components: [
					{name: "networklistSpinner", kind: "Spinner", className: "spinner", show: false},
       					{name: "reading_networklist_status", onclick: "onNetworkStatusTap"},
				]},
				{layoutKind: "HFlexLayout", components: [
					{name: "networkDetailsdrawer", kind: "enyo.BasicDrawer", style:'background:#b6b6b6;padding:0;margin:5px -8px -8px -8px', collapsed: true, flex: 1, components: [
						{kind: "VirtualRepeater", name: "networklist", onSetupRow: "getListItem", components: [
							{kind: "Item", layoutKind: "HFlexLayout", components: [
								{name: "itemValue", kind: enyo.Label, w: "fill", style:'margin:0 -8px;', flex: 1, onclick: "selectNetwork"},
							]},
						]},
						{kind: "Item", layoutKind: "HFlexLayout", components: [
        						{name: "searchNetworklistItem", content: $L(" <span style='color: #8C8C87; font-size: 30px; font-weight: bold;'>+</span> <span style='color: #8C8C87;'>Search for networks</span>"), onclick: "networkListPrompt"},
        					]},
					]},
				]},
			]},
			{layoutKind: "HFlexLayout", name: "networknameContainer", align: "center", components: [
				{name: "networknamerow", flex: 1, onclick: "networkNameTapHandler", className: "default-row greyed-out networknamerow"}
			]},
			{name: "networkTypeRow", Kind: "Item", layoutKind: "HFlexLayout", components: [
			{w: "fill", content: $L("Network Type"), className: "default-row"},   
				{name: "networkTypeList", kind: "ListSelector", value: "automatic", onChange: "networkTypeChanged", items: [
					{caption: $L("2G"), value: "gsm"},
					{caption: $L("3G"), value: "umts"},
					{caption: $L("Automatic"), value: "automatic"}
				]}
			]},
			{name: "voiceRoamRow", Kind: "Item", layoutKind: "HFlexLayout", components: [
			{w: "fill", content: $L("Voice Network"), className: "default-row"},
				{kind: "ListSelector", value: "automatic", name: "voiceRoamList", onChange: "voiceRoamingSelect", items: [
					{caption: $L("Carrier Only"), value: "carrieronly"},
					{caption: $L("Automatic"), value: "automatic"}
				]}
			]},
			{name: "dataRoamRow",  Kind: "Item", layoutKind: "HFlexLayout", components: [
			{w: "fill", content: $L("Data Roaming"), className: "default-row", style:"padding-left: -5px"},
				{kind: "ListSelector", value: "enabled", name: "dataRoamList", labelPlacement: "left", onChange: "toggleDataRoaming", items: [
					{caption: $L("Enabled"), value: "disable"},/*roamguard disable means dataroaming enabled.*/
					{caption: $L("Disabled"), value: "enable"}
				]}
			]},
			/*{layoutKind: "HFlexLayout", name: "voiceRoamingRow", align: "center", tapHighlight: false, components: [
				{flex: 1, className: "greyed-out", content: "Voice Roaming"}, 
				{kind: "ToggleButton", name: "VoiceRoaming", onChange: "toggleVoiceRoaming"}
			]},
			{layoutKind: "HFlexLayout",  name: "ratRow", align: "center", tapHighlight: false, components: [
				{flex: 1, content: "RAT", className: "greyed-out"},
				{kind: "ToggleButton", name: "toggleRat", onChange: ""}
			]},*/
			{layoutKind: "HFlexLayout", align: "center", name: "dataUsageRow", tapHighlight: false, components: [
				{flex: 1, content: $L("Data Usage")},
				{kind: "ToggleButton", name: "dataUsageToggle", onChange: "toggleWAN"}
			]},
			{layoutKind: "HFlexLayout", align: "center", name: "ManualSettingsRow", tapHighlight: false, components: [
				{flex: 1, content: $L("Manual Settings")},
				{name: "manualSettingsToggle", kind: "ToggleButton", onChange: "toggleManualSetting"}
			]},
			{layoutkind: "HFlexLayout", name: "EditNwSettingsContainer", align: "center", onclick: "editNetworkSettings", content: $L("Edit Network Settings")}
		]},

		//network prompt dialog
		{name: "networkPrompt", kind: "Dialog", components: [
			{name: "errorMsg", style: "padding: 12px; font-size: 14px", content: $L("Searching for networks will temporarily disconnect your data connection.")},
			{kind: "Button", caption: $L("Search for networks"), onclick: "onNetworkListPromptChoice", className: "affirmative-button text-header"},
			{kind: "Button", caption: $L("Cancel"), onclick: "onNetworkListPromptCancel"}
		]},
		
		// Error dialog
		{name: "NWerrorDialog", kind: "Dialog", components: [
			{className: "enyo-dialog-prompt-title", content: $L("Manual network selection:")},
			{layoutKind: "VFlexLayout", className: "enyo-dialog-prompt-content", components: [
				{className: "enyo-dialog-prompt-message", name: "NWerrorMsg", content: $L("An error occurred")},
				{kind: "Button", caption: $L("Close"), onclick: "toggleDialog"}
			]}
		]},

		//Service calls
		{name: "wanStatusService", kind: enyo.PalmService, service: "palm://com.palm.wan/", subscribe: true, method: "getstatus", onSuccess: "updateWAN", onFailure: "updateWAN"},		
		{name: "wanService", kind: enyo.PalmService, service: "palm://com.palm.wan/", onSuccess: "", onFailure: ""},
		{name: "enableManualDataSettings", kind: enyo.PalmService, service: "palm://com.palm.carrierdb/", method: "enableOverride", onSuccess: "", onFailure:""},
		{name: "nwpgetPreferences", kind: enyo.PalmService, service: enyo.palmServices.system, method: "getPreferences", onSuccess: "updateRatSelection", onFailure: "updateRatSelection"},
		{name: "networkSelectionModeQuery", kind: enyo.PalmService, service: enyo.palmServices.telephony, subscribe: true, method: "networkSelectionModeQuery", onSuccess: "updateNetworkSelectionMode", onFailure: "updateNetworkSelectionMode"},
		{name: "ratQuery", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "ratQuery", onSuccess: "updateRat", onFailure: "updateRat"},
		{name: "roamModeQuery", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "roamModeQuery", onSuccess: "updateVoiceRoaming", onFailure: "updateVoiceRoaming"},
		
		{name: "ratSet", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "ratSet"},
		{name: "networkSet", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "networkSet", onSuccess: "", onFailure: ""},
		{name: "roamModeSet", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "roamModeSet"},
		{name: "networkService", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "networkListQuery", onSuccess: "updateNetworkList", onFailure: "updateNetworkList"},
		{name: "networkServiceCancel", kind: enyo.PalmService, service: enyo.palmServices.telephony, method: "networkListQueryCancel", onSuccess: "", onFailure: ""},
		{name: "getCarrierName", kind: enyo.PalmService, service: "palm://com.palm.carrierdb/", method: "getCarrierName", onSuccess: "handleCarrierNameQuery", onFailure: "handleCarrierNameQuery"},
		{name: "getRoamguardService", kind: enyo.PalmService, service: "palm://com.palm.preferences/appProperties/", onSuccess: "", onFailure: ""},
		{name: "networkStatusQuery", kind: enyo.PalmService, service: enyo.palmServices.telephony, subscribe: true, onSuccess: "", onFailure: ""},
		{name: "networkIdQuery", kind: enyo.PalmService, service: enyo.palmServices.telephony, subscribe: true, onSuccess: "", onFailure: ""},
		{name: "manualNetworkSelectionPermittedQuery", kind: enyo.PalmService, service: enyo.palmServices.telephony, subscribe: true, onSuccess: "", onFailure: ""},
		{name: "systemPref", kind: enyo.PalmService, service:enyo.palmServices.system},
		{name: "db8Service", kind: enyo.PalmService, service: "palm://com.palm.db/", method: "find", onSuccess: "updateManualDataSettings", onFailure: "updateManualDataSettings"},
	], 

	create: function() {
		this.inherited(arguments);

		//this.reInit();
	},
	
	reInit: function () {
	
		/*if (enyo.application.Cache.platformType === undefined) {
			return;
		}*/
		
		this.networkSearchInitiated = false;
		this.manualNetworkAvailable = true;
		this.hideRatSelection = false;
		this.networkList = [];
		this.carrierOnlyLabel = $L('Carrier Only');

		this.$.networkAutoSelectRow.hide();
		this.$.reading_networklist_row.hide();
		this.$.networklistSpinner.setShowing(false);
		//this.$.searchNetworklistItem.hide();		
		//this.$.networkdetails.hide();
		
		this.$.networkTypeRow.hide();
		//this.$.voiceRoamingRow.hide();
		//this.$.ratRow.hide();		
		this.$.EditNwSettingsContainer.hide();
		this.$.voiceRoamRow.hide();


		if(enyo.application.Cache.platformType === "gsm") {
			this.gsmInit();
		} else if (enyo.application.Cache.platformType === "cdma") {
			this.cdmaInit();
		}

		this.showDataRoamingEnabledAlert = false;
		var params = {"keys": ["showDataRoamingEnabledAlert"]};
		this.$.systemPref.call(params, {
			method: "getPreferences",
			onSuccess: "systemPrefsQueryDone", 
			onFailure: "systemPrefsQueryDone"
		});
		
		this.$.wanStatusService.call({});

		this.$.networkStatusQuery.call({
		},{
			method: "networkStatusQuery",
			onSuccess: "updateNetworkname",
			onFailure: "updateNetworkname"
		});

		//getBandSelectionAllowed
		this.$.nwpgetPreferences.call({
			'keys': ["hideRatSelection"]
		});

		this.toggleNetworkAutoSelectModel={}; 
		this.$.getCarrierName.call({});

		//Set initial data roaming value to disable and Query from service
		this.$.dataRoamList.setValue("enable");
		this.$.getRoamguardService.call({
			"appId": "com.palm.wan",
                	"key": "roamguard"
		},{
			method: "Get",
			onSuccess: "updateDataRoaming",
			onFailure: "updateDataRoaming"
		});
	},
	
	multimodeChanged: function() {
		enyo.log(enyo.application.Cache.platformTech + " = tech; Network prefs platform mode changed; type = " + enyo.application.Cache.platformType);
		if(enyo.application.Cache.platformTech == "cdma" || enyo.application.Cache.platformTech == "world") {
			this.$.networkAutoSelectRow.hide();
			this.$.reading_networklist_row.hide();
			this.$.networknameContainer.show();
			this.$.networkTypeRow.hide();
		} else {
			//Call will update networkAutoSelectRow hide/show status based on response
			this.$.manualNetworkSelectionPermittedQuery.call({},{
				method: "manualNetworkSelectionPermittedQuery",
				onSuccess: "updateManualNetworkAvailability",
				onFailure: "updateManualNetworkAvailability"				
			});

			//Call will update reading_networklist_row hide/show status based on response
			this.$.networkSelectionModeQuery.call({});

			//Call will update networkTypeRow hide/show status based on response
			this.$.ratQuery.call({});
		}
	},

	gsmInit: function() {
		enyo.log("gsmInit");
		this.$.db8Service.call( {"query": {"from": "com.palm.carrierdb.settings.current:1"}});
		
		this.$.ManualSettingsRow.show();

		this.$.networkIdQuery.call({},{
			method: "networkIdQuery",
			onSuccess: "updateNetworkId",
			onFailure: "updateNetworkId"			
		});

		if(enyo.application.Cache.platformMultimode == true) {
			//on multimode device, decide based on platform tech
			this.multimodeChanged();
		} else {
			this.$.manualNetworkSelectionPermittedQuery.call({},{
				method: "manualNetworkSelectionPermittedQuery",
				onSuccess: "updateManualNetworkAvailability",
				onFailure: "updateManualNetworkAvailability"				
			});

			this.$.networkSelectionModeQuery.call({});	
			this.$.ratQuery.call({});
		}
	},

	cdmaInit: function() {
		this.$.ManualSettingsRow.hide();

		//Set initial voice roaming value to homeonly and Query from service
		this.voiceRoamingChoices =  [];
		this.voiceRoamingChoices =  [
			{caption: this.carrierOnlyLabel, value: "homeonly"},
			{caption : $L("Automatic"), value: "any"}
		];
		this.voiceRoamingModel = {
			currentVoiceRoaming: "homeonly"
		};
		this.$.voiceRoamList.setValue(this.voiceRoamingModel.currentVoiceRoaming);

		this.$.roamModeQuery.call({});
		this.$.voiceRoamRow.show();
	},
	
	systemPrefsQueryDone: function(inSender, response) {	
		if (response && response.showDataRoamingEnabledAlert && response.showDataRoamingEnabledAlert == true) {
			this.showDataRoamingEnabledAlert = true;
		}
	},

	updateWAN: function(inSender, response) {

		if (response.disablewan === 'on') {
			this.$.dataUsageToggle.setState(false);
		} else if (response.disablewan === 'off') {
			this.$.dataUsageToggle.setState(true);
		}
	},

	updateDataRoaming: function(inSender, payload) {
		enyo.log("updateDataRoaming");
		//The Preference key may be empty if the device is flashed. WAND guys asked me to assume roamguard is enabled by default.
		if(payload.returnValue != undefined && !payload.returnValue) {
			this.$.dataRoamList.setValue("enable");
			return;
		}

		if (payload.roamguard && payload.roamguard.roamguard == "neverblock") {			
			this.$.dataRoamList.setValue("disable");
		}
		else {
			this.$.dataRoamList.setValue("enable");
		}
	},
	
	toggleDialog: function() {
		this.$.NWerrorDialog.toggleOpen();
	},

	toggleNetworkAutoSelect: function() {
		var value = this.$.networkAutoSelectToggle.getState();

		//Manual network selection not available in Global mode
		if(enyo.application.Cache.platformTech == "world") {
			this.$.networkAutoSelectToggle.setState(true);
			this.$.NWerrorMsg.setContent($L("Manual network selection not available in Global mode"));
			this.toggleDialog();
			return;
		}
		
		if (value === false) {
			this.$.networknameContainer.hide();			
			this.networkListPrompt();
		}
		else {
			this.$.networkServiceCancel.call({});

			this.$.networkSet.call({
				"automatic": true,
				"id": 0
			});
			
			this.automaticSelectionActive = true;

			//cancel the service call
			this.$.networkService.cancel();

			//if(!this.$.networkDetailsdrawer.collapsed) {//close drawer
				this.$.networkDetailsdrawer.setOpen(false);
				this.$.searchNetworklistItem.hide();
			//}
			this.$.reading_networklist_row.hide();
			this.$.networklistSpinner.setShowing(false);
			this.$.networknameContainer.show();
		}
	},

	updateNetworkId: function(insender, payload) {
		if(!payload.returnValue) {
			return;
		}

		if(payload.mccmnc) {
			this.currentNetworkId = payload.mccmnc;
		}
	},

	updateNetworkSelectionMode: function(insender, payload){
		if (!payload.returnValue) {
			return;
		}

		if (payload.automatic != null) {
		
			this.toggleNetworkAutoSelectModel.value = payload.automatic;
			this.$.networkAutoSelectToggle.setState(this.toggleNetworkAutoSelectModel.value);
			
			if (payload.automatic) {				
				this.$.networknameContainer.show();
				//if(!this.$.networkDetailsdrawer.Collapsed) {//close drawer
					this.$.networkDetailsdrawer.setOpen(false);
        				this.$.searchNetworklistItem.hide();
				//}
				this.$.reading_networklist_row.hide();
				this.$.networklistSpinner.setShowing(false);								
			}
			else {
				//this.toggleNetworkListDrawer(true, true);
				if(!this.$.networkDetailsdrawer.open) {//Open drawer
					this.$.networkDetailsdrawer.toggleOpen();					
				}
				this.$.searchNetworklistItem.show();
				this.$.reading_networklist_row.show();
				this.$.networknameContainer.hide();
			}
			//this.$.networkAutoSelectToggle.setDisabled(false);
			this.automaticSelectionActive = payload.automatic;
		}
	},

	// if network blocks manual network selection, don't show controls
	updateManualNetworkAvailability: function(inSender, payload) {

		var enabled = true;
		if (payload && payload.extended) {
			enabled = payload.extended.enabled;
		} 

		//testing code
		//if(!enabled) {
			//enyo.log("for TESTING only");
			//enabled = true;
		//}

		if (enabled) {
			this.manualNetworkAvailable = true;
               		this.$.networkAutoSelectRow.show();
		} else {
			this.manualNetworkAvailable = false;
			this.$.networkAutoSelectRow.hide();
			this.$.reading_networklist_row.hide();
			this.$.networknameContainer.show();
		}
	},
	
	networkNameTapHandler: function() {
		if (!this.manualNetworkAvailable) {
			enyo.log("don't respond to taps if manual network selection isn't available");
			return;
		}
		//this.toggleNetworkListDrawer(this.$.networkDetailsdrawer.collapsed);
	},
	
	onNetworkStatusTap: function() {
	
		if(!this.$.networkDetailsdrawer.open) {//Open drawer
			this.$.networkDetailsdrawer.toggleOpen();
			this.$.searchNetworklistItem.show();
		} else {
			this.$.networkDetailsdrawer.setOpen(false);
        	        this.$.searchNetworklistItem.hide();
        	}
	},

	// before searching for networks, prompt to confirm disconnecting data network is okay
	networkListPrompt: function() {
		this.$.networkPrompt.toggleOpen();

		// if data is blocked, don't bother asking if it's okay to turn it off
		if (this.$.dataUsageToggle.getState() == false) {
			this.onNetworkListPromptChoice();
		}
	},
	
	// if okay, proceed to load; otherwise, restore network selection list with current value
	onNetworkListPromptChoice: function() {
		enyo.log("onNetworkListPromptChoice");

		//close dlg
		this.$.networkPrompt.toggleOpen();

		//this.$.networkdetails.show();
		this.loadNetworkList();
	},

	// restore network selection list with current value
	onNetworkListPromptCancel: function() {
		this.$.networkSelectionModeQuery.call({});

		this.$.networkPrompt.toggleOpen();
		this.$.networkAutoSelectToggle.setState(true);
	},

	toggleWAN: function() {
		var value = this.$.dataUsageToggle.getState();
		var state  = value ? 'off':'on';
		this.$.wanService.call({
			"disablewan": state
		},{
			method: "set",
			onSuccess: "",
			onFailure: ""
		});
	},

	networkTypeChanged: function() {
		var value = this.$.networkTypeList.getValue();
		enyo.log("networkTypeChanged " + value);
		this.$.ratSet.call({
			"mode": value
		});
	},

	toggleManualSetting: function() {
		var value = this.$.manualSettingsToggle.getState();
		enyo.log("toggleManualSetting " + value);		
		this.updateManualDataSettingsToggle(value);
		this.$.enableManualDataSettings.call({
			"useOverride": value
			});
	},

	toggleDataRoaming: function() {
		var value = this.$.dataRoamList.getValue();
		enyo.log("toggleDataRoaming " + value);
		
		if(value == "disable" && this.showDataRoamingEnabledAlert == true) {
			var height = 125;
			enyo.application.openPhoneAppPopup("DataRoaming", "dataRoamingPopup", {}, height);
		}
		
		this.$.wanService.call({
			'roamguard': value
		},{
			method: "set",
			onSuccess: "genericSuccessHandler",
			onFailure: "genericSuccessHandler"
		});
	},

	genericSuccessHandler: function(inSender, payload, request) {
		if(!payload.returnValue) {
			enyo.log("Service call Failed" + request.service + request.method);
		}
	},

	/*toggleVoiceRoaming: function() {
		this.voiceRoamingSelect();
	},*/
	
	editNetworkSettings: function() {
		this.doEditNetworkClick();
	},

	loadNetworkList: function(){
		if (enyo.application.Cache.platformType === "gsm") {
			this.networkSearchInitiated = true;
			this.$.networkService.call({});
			this.networkList = [];
			this.$.networklist.renderContent();
			this.networkListBusy($L("Searching for networks ..."));
		}
	},
    
	networkListBusy: function(statusText) {
		this.$.reading_networklist_row.show();
		this.$.reading_networklist_status.setContent(statusText);
		
		//only enable the spinner on the second row of the table
		this.$.networklistSpinner.setShowing(true);
	},
	
	networkListBusyOff: function(statusText) {
        	this.$.reading_networklist_row.show();
		this.$.reading_networklist_status.setContent(statusText);
		this.$.networklistSpinner.setShowing(false);
	},
	
	updateNetworkList: function(inSender, payload) {
		enyo.log("updateNetworkList" + inSender);
	
		if(!payload.returnValue) {
			this.networkListBusyOff($L("Error retrieving network list. Please try again"));
			enyo.log(enyo.json.stringify(payload));
			/*if (enyo.application.Messages.serviceErrors[payload.errorCode] !== undefined) {
				payload.errorText = enyo.application.Messages.serviceErrors[payload.errorCode].toString();
			} else {
				payload.errorText = enyo.application.Messages.serviceErrors[enyo.application.Messages.defaultErrorIndex].toString();
			}
			 var errorImageContent = enyo.View.render({
			 		object: payload,
			   		template: 'preflist/networkerrorimage'
		      		});
			 this.networkListBusyOff(errorImageContent);
			//this.controller.listen($('reading_networklist_status'), enyo.Event.tap, this.loadNetworkList);
			*/
			return;
			
		}

		var networkDrawerToggleText = '';
		var networks;

		if (payload.extended && payload.extended.networks) {
			networks = payload.extended.networks;
		}

		if (networks && networks.length > 0) {
			//this.toggleNetworkListDrawer(true, true);
			this.networkList = [];
			for(var i = 0; i < networks.length; i++) {		
				var obj = new Object();
				obj.networkId = networks[i].id;
				obj.networkListName = networks[i].name;
				obj.networkListRat = networks[i].rat;
				if (this.automaticSelectionActive === false && networks[i].id === this.currentNetworkId) {
					obj.checkMark = "checkmark";
					networkDrawerToggleText = networks[i].name;
				} else {
					obj.checkMark = "";
				}
				enyo.log(networks[i].name);
				this.networkList.push(obj);
			}

			if (this.automaticSelectionActive === true) {
				networkDrawerToggleText = $L("Available networks: ");
			}

			this.$.networklist.renderContent();
			if(!this.$.networkDetailsdrawer.open) {
				this.$.networkDetailsdrawer.toggleOpen();// Open drawer				
			}
			this.$.searchNetworklistItem.show();
		} else {
			networkDrawerToggleText = $L('No networks available');
		}
	
		this.networkListBusyOff(networkDrawerToggleText);
	},
	
	getPLMNDisplayName: function(inIndex) {
	
		var PLMN = this.networkList[inIndex].networkListName;
		var duplicatesFound = 0;
		for(var i = 0; i < this.networkList.length; i++) {
			if (this.networkList[i].networkListName == PLMN) {
				duplicatesFound++;
			}
		}
		
		if(duplicatesFound <= 1) {	
			return PLMN;
		}
		
		var ratInfo = "";
		if (this.networkList[inIndex].networkListRat == "gsm") {
			ratInfo = "- 2G";
		} else if (this.networkList[inIndex].networkListRat == "umts") {
			ratInfo = "- 3G";
		}		
		return PLMN + ratInfo;
	},

	getListItem: function(inSender, inIndex) {
		if(this.networkList && inIndex < this.networkList.length) {
			this.$.itemValue.content = this.getPLMNDisplayName(inIndex);
			return true;
		}
	},
    
	selectNetwork: function(inSender, inEvent) {
		var i = inEvent.rowIndex;
		enyo.log("row index " + i);
 		if (i >= 0) {
			this.networkListBusy($L("Selecting network"));

			var nameID = {};
			nameID.name = this.networkList[i].networkListName;
			nameID.id = this.networkList[i].networkId;
			
			var networkId = this.networkList[i].networkId;
			enyo.log("networkId " + networkId + " ,name " + this.networkList[i].networkListName);

			this.$.networkSet.call({
				"automatic": false,
				"id": networkId
			},{
				method: "networkSet",
				onSuccess: "onNetworkSet",
				onFailure: "onNetworkSet", 
				myData: nameID
			});
		}
	},
	
	//todo: debug: check the integrity of this.name and this.id
	onNetworkSet: function(inSender, result, request) {
		var status = request.myData.name;
		if (result.returnValue === true) {
			for(var i=0; i< this.networkList.length; i++) {
	   			this.networkList[i].checkMark = '';
	   			if(this.networkList[i].networkId == request.myData.id) {
					this.networkList[i].checkMark = 'checkmark';
					this.currentNetworkId = request.myData.id;
				}
	   		}
			//this.$.networklist.renderContent();
			//this.toggleNetworkListDrawer(false);
			this.automaticSelectionActive = false;
		} else {
        		status = $L("Unable to select network");
		}
		this.networkListBusyOff(status);
	},
	
	updateNetworkname: function(inSender, payload) {	
		var inService = false;
		if(payload) {
			if (payload.extended) {
				if(payload.extended.state == 'service') {
					inService = true;
					this.$.networknamerow.setContent(payload.extended.networkName);
					this.$.reading_networklist_status.setContent(payload.extended.networkName);
					enyo.application.Cache.networkname = payload.extended.networkName;
					this.doCarrierNameChange();
				}
				else if(payload.extended.state == 'limited' && payload.extended.registration == 'denied') {
					this.$.reading_networklist_status.setContent($L("Unable to connect"));
				} else {
					this.$.reading_networklist_status.setContent($L("View available networks"));
				}
			}
			else if (payload.eventNetwork) {
				if(payload.eventNetwork.state === 'service') {
					this.$.networknamerow.setContent(payload.eventNetwork.networkName);
					this.$.reading_networklist_status.setContent(payload.eventNetwork.networkName);
					inService = true;				
					enyo.application.Cache.networkname = payload.eventNetwork.networkName;
					this.doCarrierNameChange();
				}
				else if(payload.eventNetwork.state === 'limited' && payload.eventNetwork.registration == 'denied' && enyo.application.Cache.platformType == "gsm" && !this.toggleNetworkAutoSelectModel.value) {
					this.$.reading_networklist_status.setContent($L("Unable to connect"));
				}
			}
		}

		//TODO
		//if(this.callFwdQueryError && inService) 
		//	this.updateCalls();
	},

	updateManualDataSettings: function(inSender, payload) {
		if (enyo.application.Cache.platformType === 'cdma') {// don't show on CDMA
			return;
		}

		this.$.manualSettingsToggle.setState(false); 
		this.$.EditNwSettingsContainer.hide();
						
		if (payload && payload.results && payload.results[0]) {
			enyo.log("overrideInUse in payload " + enyo.json.stringify(payload.results[0].overrideInUse));
			this.$.manualSettingsToggle.setState(payload && payload.results && payload.results[0].overrideInUse);
			this.updateManualDataSettingsToggle(payload && payload.results && payload.results[0].overrideInUse);		
		}
	},

	updateManualDataSettingsToggle: function(show) {
		if (show) {
			this.$.EditNwSettingsContainer.show();
		} else {
			this.$.EditNwSettingsContainer.hide();
		}
	},

	voiceRoamingSelect: function() {
		var value = this.$.voiceRoamList.getValue();
		enyo.log("toggleVoiceRoaming" + value + " " + this.voiceRoamingModel.currentVoiceRoaming);	
		this.voiceRoamingModel.currentVoiceRoaming = value;

		if (this.roamingAllowsBandSelection) {
			var band = "";
			var mode = ""; 
			switch (this.voiceRoamingModel.currentVoiceRoaming) {
				case "home":
				case "homeonly":
					band = "home";
					mode = "homeonly";
					break;
				case "class0_A_side":
				case "class0_B_side":
					band = this.voiceRoamingModel.currentVoiceRoaming;
					mode = "any";
					break;
				default:
					break;
			}
	
			this.$.roamModeSet.call({
				"mode": mode,
				"band": band
			});
			
		} else {
			this.$.roamModeSet.call({
				"mode": this.voiceRoamingModel.currentVoiceRoaming
			});
		}
		
		if(this.voiceRoamingModel.currentVoiceRoaming == "homeonly") {
			this.$.wanService.call({
				"roamguard": "enable"
			},{
				method: "set",
				onSuccess: "",
				onFailure: ""
			});

			this.$.dataRoamList.setValue("disable");
			this.$.dataRoamRow.hide();
		} else {
			this.$.dataRoamRow.show();
		}
	},

	updateVoiceRoaming: function(inSender, payload) {
		if(!payload.returnValue || !payload.extended) {
			return;
		}

		if (payload.extended.showAutomaticAB === true) {
			this.roamingAllowsBandSelection = true;
			this.voiceRoamingChoices[1] = {
				caption: $L("Automatic - A"),
				value: "class0_A_side"	
			};
			this.voiceRoamingChoices[2] = {
				caption: $L("Automatic - B"),
				value: "class0_B_side"  // cdma: the 12" extended remix?
			};
			
			switch (payload.extended.band) {
				case "class0_A_side":
				case "class0_B_side":
					this.voiceRoamingModel.currentVoiceRoaming = payload.extended.band;
					this.$.dataRoamRow.show();
					break;
				case "home":
				case "homeonly":
					this.voiceRoamingModel.currentVoiceRoaming = "homeonly";
					this.$.dataRoamRow.hide();
					break;
				default:
					enyo.log("unknown band. defaulting to home only " + payload.extended.band);
					this.voiceRoamingModel.currentVoiceRoaming = "homeonly";
					this.$.dataRoamRow.hide();
			}
		} else {
			this.roamingAllowsBandSelection = false;
			// if update happens while we are open and band selection
			// was previously allowed (assuming based on choices == 3)
			// put things back
			if (this.voiceRoamingChoices.length == 3) {
				this.voiceRoamingChoices[1] = {
					caption: $L("Automatic"),
					value: "any"
				};
				this.voiceRoamingChoices.pop();
			}
			
			if (payload.extended.mode == 'any') {
				this.voiceRoamingModel.currentVoiceRoaming = "any";
				this.$.dataRoamRow.show();
			} else {
				this.voiceRoamingModel.currentVoiceRoaming = "homeonly";
				this.$.dataRoamRow.hide();
			}
		}

		this.$.voiceRoamList.setItems(this.voiceRoamingChoices);
		this.$.voiceRoamList.setValue(this.voiceRoamingModel.currentVoiceRoaming);
	},

	//Handler for Carrier Name Query
	handleCarrierNameQuery: function(inSender, payload) {
		if(!payload) {
			return;
		}
		if(payload.returnValue != undefined && payload.returnValue == true) {
			this.carrier =  $L(payload.longName);
			this.carrierOnlyLabel = enyo.application.Utils.interpolate($L("#{carrier} Only"), {carrier: this.carrier});
			this.voiceRoamingChoices[0].caption = this.carrierOnlyLabel;
			//this.controller.modelChanged(this.voiceRoamingModel);
		}
	} ,

	updateRat: function(inSender, payload) {
	
		if (payload && payload.extended && payload.extended.mode) {
			this.$.networkTypeList.setValue(payload.extended.mode);
		}
		
		if (this.hideRatSelection !== true) {
			this.$.networkTypeRow.show();
		}
	},
	
	updateRatSelection: function(inSender, payload) {
		if (payload && payload.hideRatSelection) {
			this.hideRatSelection = true;
			this.$.networkTypeRow.hide();
		}
	}
});
