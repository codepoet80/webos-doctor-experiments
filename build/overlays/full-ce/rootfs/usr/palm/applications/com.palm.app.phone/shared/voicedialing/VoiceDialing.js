
// Notes:
//   palm-log -f <appId>
//   palm-log --system-log-level info

enyo.kind({
	name: "VoiceDialing",
	kind: enyo.VFlexBox,
	pack: "justify",
	className: "phone-background",
	components: [
		     // enyo-button-pressed - selected
		     // enyo-button-down - pressed
		     // enyo-button - normal.
	//{name: "testbutton", onclick: "handletesty", className: "vc-active-call-button vc-enyo-button-down", content: "testy", height: "100", align: "center", pack: "center", layoutKind: "VFlexLayout", style: "text-align: center;"},
		{name: "groupSession", flex: 1, components: [
			{name: "sessionTitle", className: "vc-title vc-options-title",         content: "&nbsp;",              align: "center", pack: "center", layoutKind: "VFlexLayout", style: "text-overflow: ellipsis;overflow:hidden;", flex: 1},
			{name: "subText",      className: "vc-title vc-options-title-subtext initializing", content: $L("Initializing..."), align: "center", pack: "center" },
			{name: "micVContainer", className: "mic-container", layoutKind: "VFlexLayout", pack: "center", components: [
				{name: "micHContainer", layoutKind: "HFlexLayout", pack: "center", components: [
					{name: "imagespinner", kind: "SpinnerLarge", pack: "justify", className: "vc-spinner"}, // , className: "spinner"
					{name: "centerImage", className: "vc-microphone-icon", showing: false}
				]}
			]},
			{name: "sessionText", className: "vc-text", content: $L("You can try \"John Smith\",\"John Smith mobile\", or \"800-555-1234\""), showing: false}
		]},
		
		{name: "groupTutorial", layoutKind: "VFlexLayout", pack: "justify", showing: false, components: [
			{name: "tutorialTitle", className: "vc-title", content: $L("Welcome")},
			{name: "tutorialText1", className: "vc-text", content: $L("Press and hold either of the volume keys or the button on your headset to initiate Voice Dialing.")}, 
			{name: "spacing1", className: "vc_tutorial_spacing"},
			{name: "tutorialText2", className: "vc-text", content: $L("When you hear the tone you can say \"John Smith\", \"John Smith mobile\", or \"800-555-1234.\"")},	
			{name: "spacing2", className: "vc_tutorial_spacing"},
			{name: "tutorialText3", className: "vc-text", content: $L("To hear this tutorial again, you can say \"Tutorial\"or \"Help\"")}	
		]},
		{name: "groupList", kind: enyo.VFlexBox,
		 components: [
			{name: "optionsTitleVWrapper", components: [
				{name: "optionsTitle", content: "", className: "vc-title vc-options-title", align: "center", pack: "center",
				 style: "text-overflow: ellipsis;overflow:hidden;text-align: center;white-space: nowrap"}
			]},
			{name: "optionsSubtext", content: "", className: "vc-title vc-options-title-subtext"}
			
			
		]},
			{name: "groupListScroller", flex: 1, /*kind: "Scroller", */ kind: "MaxHeightScroller",  autoVertical: true, align: "center", pack: "justify", components: [
			    {name: "optionsListContainer", layoutKind: "VFlexLayout", showing: false, components: [
					{name: "optionsList", kind: enyo.RowGroup, components:[
//						{name: "listItem", onclick: "HandleTapOnOptionsList" }
					]}
				]},
				{name: "Poihgwpoieh", kind: enyo.Control} // Dummy needed for MinHeightScroller
			]},
		
		 //pack: ""
		{name: "optionsText", className: "vc-text", content: "", pack: "justify", align: "stretch"},
		{name: "buttonSkip", kind: "Button", caption: $L("Skip Tutorial"), pack: "justify", align: "stretch", onclick: "ButtonSkipClick", style: "cancel-button", showing: false},
		{name: "buttonCancel", kind: "Button", pack: "justify", align: "stretch", caption: $L("Cancel"), style: "cancel-button", onclick: "ButtonCancelClick", className: "enyo-button-negative"},
		
		{name: "vcServiceRegister", kind: enyo.PalmService, service: "palm://com.palm.pmvoicecommand/", method: "registerUI", subscribe: true, onSuccess: "voiceCommandServiceHandler", onFailure: "exitVoiceCommandHandler"},
		{name: "busService", kind: enyo.PalmService, service: "palm://com.palm.bus/", method: "signal/registerServerStatus", params: {serviceName: 'com.palm.pmvoicecommand'}, subscribe: true, 
				onSuccess: "busServiceCallback", onFailure: "busServiceCallback"},
		{name: "displayService", kind: enyo.PalmService, service: "palm://com.palm.display/", method: "control/setProperty", params: {"requestBlock": true,"client":"phoneApp"},
				subscribe:true},
 		{name: "vcService", kind: enyo.PalmService, service: "palm://com.palm.pmvoicecommand/", onSuccess: "", onFailure: ""},		
		{name: "UIevent", kind: enyo.PalmService, service: "palm://com.palm.pmvoicecommand/", onSuccess: "", onFailure: ""}
	    
	],

	create: function(launchParams) {
		this.UIIsExiting = undefined;
		this.inherited(arguments);
		
		this.oldMode = "initializing";
		
		// Set this to '1' to enable UI test mode
window.UiTestMode = 1;
		this.nextUITestScenario = 0;
		
		if (window.UiTestMode) {
			//enyo.g11n.setLocale({ "uiLocale": "fr_FR", "formatLocale": "fr_FR", "phoneLocale": "fr_FR"});
//			enyo.g11n.setLocale({ "uiLocale": "es_ES", "formatLocale": "es_ES", "phoneLocale": "es_ES"});
//			enyo.g11n.setLocale({ "uiLocale": "de_DE", "formatLocale": "de_DE", "phoneLocale": "de_DE"});
//			enyo.g11n.setLocale({ "uiLocale": "en_CA", "formatLocale": "en_CA", "phoneLocale": "en_CA"});
//			enyo.g11n.setLocale({ "uiLocale": "en_GB", "formatLocale": "en_GB", "phoneLocale": "en_GB"});
			enyo.log("currentLocale = ", enyo.g11n.currentLocale());
			enyo.log("formatLocale = ", enyo.g11n.formatLocale());
			enyo.log("phoneLocale = ", enyo.g11n.phoneLocale());
		}
		if (window.vcStandaloneMode) {
			this.handleLaunch(enyo.windowParams);
		}
	},
	handleLaunch: function(params) {
		enyo.log("handleLaunch: enyo.windowParams=" + enyo.windowParams );
		this.params = params || {};
		enyo.log("params ", this.params);
		this.setup();
	},	
	setup: function() {
		enyo.log("running setup()...");
		this.audioOverBluetooth = false;	
		
		//this.needATicketFromDownloadManager = "Need a ticket";	// Do not localize
		this.titleText = "";
		// Tap on the "Cancel" button to change the view
		
		// You also need to start the voice command scene in handleLaunch() in app-assistant.js.  Place this line just before the switch statement
		// args.action = "voicecommand";
	
		if (window.UiTestMode){			
			this.params = {reason:"session start", URL:"http://www.palm.com", targetDir:"dir", targetFilename:"filename", size:"812"};
		}			

		if (!window.UiTestMode) {
			// Setup a pipe to the voice command service so that events can be received
			this.$.vcServiceRegister.call(); 
			
			// Monitor the status of the service.  If it crashes then exit this UI
			this.$.busService.call(); 
			
			// Keep the backlight on at all times (unless using Bluetooth)
			if ( ! this.audioOverBluetooth ) {
				this.$.displayService.call();
			}
		}
enyo.log("params reason "+this.params.reason);	
		// Based on the reason for launching this scene, display the right information
		switch (this.params.reason) {
			// case "session start":
			default:
				// The scene has been configured to display this correctly
				this.showControls("vcSession");
				break;
		}
	}, 

	setObjText: function(widget, text) {
		if (/^\s*$/.test(text) || text === undefined) {
			widget.setContent("&nbsp;");
		} else {
			widget.setContent(text);
		}
	},

	setOptionsTitleText: function(text) {
		this.setObjText(this.$.optionsTitle, text);
	},

	// This method receives instructions from the Voice Command service
	handleVoiceCommandService: function(response) {
		enyo.log("handleVoiceCommandService "+enyo.json.stringify(response));		
		if (!response || !response.command)
			return;
			
		// Is there a timeout associated with this command?
		if (response.defaultTimeout) {
			// Clear the previous timeout, if there was one
			if (this.recognitionTimer) {
				clearTimeout(this.recognitionTimer);
				this.recognitionTimer = undefined;
			}
			// Set the new timer if:
			// 1. The value of defaultTimeout isn't -1 AND
			// 2. startTimeout is not defined OR startTimeout is defined and is non-zero 
			if (response.defaultTimeout > 0 && (response.startTimeout === undefined || response.startTimeout > 0)) {
				this.recognitionTimer = setTimeout(enyo.hitch(this.UITimeout(), response.defaultTimeout));
			}
		}
		
		switch (response.command) {
			case "state":
				// Update the icon
				if (response.scenario && response.scenario === "bluetooth") {
					this.$.centerImage.addClass("bluetooth");
					this.audioOverBluetooth = true;
				}
				else {
					this.$.centerImage.removeClass("bluetooth");
					this.audioOverBluetooth = false;
				}
				// Update the icon and form layout
				if (response.state)
					this.setMode(response.state);
					
				// Remove the mic level icon on the screen if the state isn't "recording"
				if (response.state !== "recording" && this.oldAudioLevel) {
					// Remove the old level class
					this.$.centerImage.removeClass(this.oldAudioLevel);
					//delete this.oldAudioLevel; ??
				}
				break;
				
			case "audioLevel":
				// Display the microphone recording level
				if (this.oldAudioLevel) {
					// Remove the old level class
					this.$.centerImage.removeClass(this.oldAudioLevel);
				}
				var level = 'level-' + response.level;	
				// Add the new level class to display the correct mic level
				this.$.centerImage.addClass(level);
				this.oldAudioLevel = level;
				break;
				
			case "displayText":
				// These are going to be ignored.  They don't contain any information that needs to be displayed.
				// Make sure that the correct divs are visible though
				enyo.log("displayText: " + response.command);
				this.showControls("vcSession");
				
				switch (response.screenId) {
						// Show the "not recognized" icon
					case VSuiteScreenId.VST_UI_SCR_NO_MATCH_GENERIC_NONLISTENING:
					case VSuiteScreenId.VST_UI_SCR_NO_MATCH_CALL_NONLISTENING:
						this.titleText = response.titleText;
						this.setMode("notrecognized");
						break;
						
					case VSuiteScreenId.VST_UI_SCR_TASK_COMPLETE_CALL:
					case VSuiteScreenId.VST_UI_SCR_TASK_COMPLETE_REDIAL:
					case VSuiteScreenId.VST_UI_SCR_TASK_COMPLETE_PLAY: // playing song: same as calling for this code logic
						// Show the "Calling..." screen
						this.titleText = response.titleText;
					    this.$.sessionText.show();
					    this.$.sessionText.setContent(response.bodyText);
						this.setMode("calling");
						break;
						
					default:
						// Make sure the "Who would you like to call?" scene is visible
						enyo.log("displayText response.titleText is "+response.titleText);
					    this.$.sessionTitle.setContent(response.titleText);
						this.titleText = response.titleText;
					    this.$.sessionText.show();
						break;
				}
				break;
				
			case "displayCommand":
			    this.showControls("vcSession");
			    enyo.log("displayCommand response.titleText is "+response.titleText);
			    this.$.sessionTitle.setContent(response.titleText);
				this.titleText = response.titleText;
			    this.$.sessionText.show();
				break;
				
			case "displayConfirm":
				// Display a list of options from which the user has to select
				this.showControls("vcOptionslist");				
				//this.$.groupList.show(); 
				
				// Clear the old list and create a new list of items
				//this.listOptions.clear();
				var reg = /(.*)\((.*)\)/;
				var nameSplitReg = "(.*)\t(.*)";
	
				// If the screenId is VST_UI_SCR_WHICH_LOCATION_CALL... then the "item" format is "location (number)"
				var locationAndNumber = (response.screenId == VSuiteScreenId.VST_UI_SCR_WHICH_LOCATION_CALL_MULTI || response.screenId == VSuiteScreenId.VST_UI_SCR_WHICH_LOCATION_CALL_SINGLE);
				
				this.$.optionsList.destroyControls();
				
				for (var i = 0; i < response.items.length; i++) {
					var data;
					var location;
					var split;
					var componentObj = {kind: "Item" /*enyo.CustomButton*/ , tapHighlight: true, allowDrag: true, name: "sessionTitlepaiuwh"+i, layoutKind: "HFlexLayout", pack: "justify", align: "stretch", onclick: "HandleTapOnOptionsList", itemIndex: i, className: "vc-button-text"};
					if(i == response.selectedItem) {
					    //componentObj.down = true;
						componentObj.className += " vc-button-selected";
					}

					if (locationAndNumber) {
						split = reg.exec(response.items[i]);
						data = split[2]; // phone number
						location = split[1].trim();
						var phoneNumberObject = new enyo.g11n.PhoneNumber(data);
						var phoneNumberFormatter = new enyo.g11n.PhoneFmt();
						var phoneNumber = phoneNumberFormatter.format(phoneNumberObject);
						componentObj.components = [
							{content: phoneNumber, className: "vc-button-text", style: "text-overflow: ellipsis;overflow:hidden;text-align: left;white-space: nowrap;", flex: 1}, {content: "  "}, {content: location, className: "vc-location-text"}
						];
					}
					else {
					    data = response.items[i];
						dataSanitized = this.sanitize(data);
						if (response.bodyText == undefined) {
							var nameLocRegexp = /(.*)\s(\S+(\s*[1-9])?)\s*$/;
							split = nameLocRegexp.exec(dataSanitized);
							if (split === null) {
								componentObj.content = dataSanitized;
							}
							else {
								componentObj.components = [
									{content: split[1], className: "vc-button-text", style: "text-overflow: ellipsis;overflow:hidden;text-align: left;white-space: nowrap;", flex: 1}, {content: "  "}, {content: split[2], className: "vc-location-text"}
								];
							}
						}
						else {
							componentObj.className += " vc-text2";
							componentObj.content = dataSanitized;
						}

					}

					var item = this.$.optionsList.createComponent(componentObj, {owner: this});
					if(i == response.selectedItem) {
						this.vcSelectedItem = item;
					}
				}
				
				var resultsTemplate = new enyo.g11n.Template($L("1##{length} result|##{length} results"));
				var formattedResults = resultsTemplate.formatChoice(response.items.length, {length: response.items.length});

				// Show the Contact name in the title, or just the number of hits
				if (locationAndNumber) {
					this.setOptionsTitleText(response.bodyText);
					this.$.optionsTitle.show();
					
					//Mojo.Format.formatChoice(response.items, $L("1##{length} result|##{length} results"), {length: response.items.length});
					this.$.optionsSubtext.setContent(formattedResults);
					this.$.optionsSubtext.show();
				}
				else {
					this.setOptionsTitleText("");
					this.$.optionsTitle.show();

					this.$.optionsSubtext.setContent(formattedResults);
					this.$.optionsSubtext.show();
				} 

				this.$.optionsListContainer.show();
				this.$.groupListScroller.scrollToBottom();

				this.render();
				break;
	
			case "displayListen":
				this.showControls("vcSession");
			    this.$.sessionTitle.setContent(response.titleText);
				this.$.sessionText.show();
				break;
				
			case "displayAdapt":
			case "displayMenu":
			case "displayCheckbox":
			case "displayRadioButton":
			case "displayPopup":
			case "displayRgbBitmap":
				// ignore
				break;
	
			case "displayBitmap":
			    if (response.screenId == VSuiteScreenId.VST_UI_SCR_INTRO_TUTORIAL){
					this.showControls("vcTutorial");
				} 			    	
				break;
				
			default:
				break;
		}
	}, 
	// Display the correct icon for the mode that voice recording is in
	// Mode is one of: "initializing", "recording", "calculating", "playback", "notrecognized" or "calling"
	setMode: function(mode) {
		enyo.log("setMode: " + mode + "  oldMode was " + this.oldMode);
		
		// Is the mode the same?  If so, don't do anything
		if (!mode || mode === this.oldMode) {
			enyo.log("ignoring setMode(): mode is unchanged");
			return;
		}

		// If the current mode is "not recognized" or "calling" then don't change it.  These are terminal conditions
		if (!window.UiTestMode && (this.oldMode === "notrecognized" || this.oldMode === "calling") && this.oldMode !== mode) {
			enyo.log("ignoring setMode(): terminal condition");
			return;
		}

		this.newTitle = this.titleText;
		//Remove "Listening..." since it probably won't be needed 
		this.$.subText.setContent("&nbsp;");
		this.$.optionsText.setContent("&nbsp;");

		// Remove the old mode class from the icon, if there was one
		if (this.oldMode){
			this.$.centerImage.removeClass(this.oldMode);
		}

		switch (mode) {
			case "initializing":
			    this.newTitle = $L("Initializing...");			    				
				// Hide the body text
			    this.$.sessionText.hide();
				
				this.$.imagespinner.setShowing(true); 
				break;
				
			case "calculating":
			    this.newTitle = $L("Processing...");
	
				// Hide the body text
			    this.$.sessionText.hide();
	
				this.$.imagespinner.setShowing(true); 
				this.$.centerImage.hide();
				break;
			
			case "notrecognized":
//				this.$.subText.setContent($L("Command Not Recognized"));
				this.$.imagespinner.hide();
				this.$.centerImage.show();
				break;
				
			case "recording":
				this.$.subText.setContent($L("Listening..."));
				this.$.optionsText.setContent($L("Listening..."));
	
				// Show the body text
			    this.$.sessionText.show();
				// Intentional fall-through
			
			default:
				this.$.imagespinner.setShowing(false);
				this.$.centerImage.setShowing(true);
				break;
		}
	
		// Set the title
		this.setObjText(this.$.sessionTitle, this.newTitle);
//		this.$.sessionTitle.setContent(this.newTitle);
		
		// Set the mode class on the icon
		this.$.centerImage.addClass(mode);
		this.oldMode = mode;
	}, 		
	

	// Send a UI event to the VSuite engine
	sendUIEvent: function(event, index) {
		enyo.log("sendUIEvent: " + event + " index=" + index);
		// Send the event to the voice command service
		if (!window.UiTestMode) {
			this.$.UIevent.call({"event":event, "index":index});
		}
			
/*
		{
			method: "UIevent",
			params: {"event":event, "index":index}
		}
		*/ 
	}, 	
	
	// Handles voice command service callbacks when in UI test mode
	handleVoiceCommandServiceTestUI: function(inSender, response){
		// Ignore all service inputs when in test mode
	}, 	
	voiceCommandServiceHandler: function(inSender, response){
		if (window.UiTestMode) {
			this.handleVoiceCommandServiceTestUI(); 
		}else {
			this.handleVoiceCommandService(response); 
		}
	},
	exitVoiceCommandHandler: function(inSender, response){
		this.exitVoiceCommandSession(); 
		
	}, 
	ButtonCancelClick: function (inSender, value)	
	{
		enyo.log("ButtonCancelClick ", inSender, value);	

		if (window.UiTestMode) {
			// Make the Cancel/Skip button move the UI to the next scenario
			this.nextUiScenario();
		}else {
			this.handleCancelButton(); 
		}
	}, 
	ButtonSkipClick: function (inSender, value)	
	{
		enyo.log("ButtonSkipClick ", inSender, value);	
		if (window.UiTestMode) {
			// Make the Cancel/Skip button move the UI to the next scenario
			this.nextUiScenario();
		}else {
			this.handleSkipButton();
		}
	},	
	// The "Skip" button was tapped.
	handleSkipButton: function() {
		enyo.log("handleSkipButton");
		// Send "Skip" to the voice command service
		this.sendUIEvent(VSuiteEvent.VST_UI_EVENT_NEXT, 0);
		
		// If there is a UI subscription then expect the voice command service to tell the UI to exit
		// otherwise force this scene to exit
		if (!this.$.vcServiceRegister) {
			enyo.log("service not registered.  Exiting...");
			this.exitVoiceCommandSession();
		}
	}, 	

	// The "Cancel" button was tapped.
	handleCancelButton: function() {
		enyo.log("handleCancelButton");
		// Send "Cancel" to the voice command service
		this.sendUIEvent(VSuiteEvent.VST_UI_EVENT_EXIT, 0);
		
		// If there is a UI subscription then expect the voice command service to tell the UI to exit
		// otherwise force this scene to exit
		if (!this.voiceCommandServiceReq)
			this.exitVoiceCommandSession();
	},
	
	// The session was terminated for one of many possible reasons
	// 1. Subscription to voice command service failed
	// 2. Nuance engine told us to quit
	exitVoiceCommandSession: function() {
		enyo.log("exitVoiceCommandSession");
		// Pop this scene.  The cleanup routine will do the necessary cleanup, like canceling the subscription to the voice command service
		if (!this.UIIsExiting) {
			this.UIIsExiting = true;
			if(window.vcStandaloneMode) {
				window.close();
			}
			else {
				enyo.application.UI.event('back',null);
			}
		}
	}, 
	
	// The user tapped on the list of options
	HandleTapOnOptionsList: function(inSender, event) {
		// Send the select event to the voice command service
		enyo.log("selected="+this.vcSelectedItem);
		this.vcSelectedItem.removeClass("vc-button-selected");
		inSender.addClass("vc-button-selected");
		this.sendUIEvent(VSuiteEvent.VST_UI_EVENT_SELECT, inSender.itemIndex);
	}, 	
	busServiceCallback: function(inSender, response){
		if (!response.connected)
			this.exitVoiceCommandHandler();
	}, 	
	
	// Timeout has occurred in the UI.  Send this info to the VSuite engine
	UITimeout:  function() {
		enyo.log("UITimeout");
		
		//this.sendUIEvent(VSuiteEvent.VST_UI_EVENT_TIMEOUT, 0);
	}, 	
	
	//todo: debug: who and when calls this??
	destroy: function(event) {
		enyo.log("cleanup");
		
		// Clear the timeouts, if they were set
		if (this.recognitionTimer)
			clearTimeout(this.recognitionTimer);

		// Cancel service requests.  This will stop the voice command session
		if (this.$.vcServiceRegister){
			this.$.vcServiceRegister.cancel();
		}
		if (this.$.busService){
			this.$.busService.cancel();
		}
		this.UIIsExiting = undefined;

		this.inherited(arguments);
	}, 	

	sanitize: function(data) {
		data = data.replace(/^\s*/, "").replace(/\s*$/, "");
		return data;
	},

	log: function() {
		var args = [].splice.call(arguments,0);
		enyo.log(arguments.callee.name + ": " + args.join(' '));
	}, 	

	// Show the correct controls
	showControls: function(scene) {
		enyo.log("showControls: "+scene);

		switch (scene) {
			case "vcSession":
				// Show the main voice dialing scene
				this.$.groupList.hide();
				this.$.groupListScroller.hide();
				this.$.optionsText.hide();
				this.$.groupTutorial.hide();
				this.$.groupSession.show();
				this.$.buttonCancel.show();
				this.$.buttonSkip.hide();
				//this.vcSession.show();
				break;
			case "vcOptionslist":
				// Show the list of contact or locations			
				//this.vcNoLangPack.hide();
				this.$.groupSession.hide(); 
				this.$.groupTutorial.hide(); 
				this.$.groupList.show();
				this.$.groupListScroller.show();
				this.$.optionsText.show();
				this.$.buttonCancel.show();
				this.$.buttonSkip.hide();
				break;
			case "vcTutorial":
				// Show the "Tutorial" scene
				this.$.groupList.hide();
				this.$.groupListScroller.hide();
				this.$.optionsText.hide();
				this.$.groupTutorial.show();
				this.$.groupSession.hide();
				this.$.buttonCancel.hide();
				this.$.buttonSkip.show();
				break;
			default:
				break;
		}
	},
	// The "Cancel" button was tapped.
	nextUiScenario: function() {
		
		var scenarios = [
		
		
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			// A long phone number
		{   "command": "state",   "returnValue": true,   "scenario": "handset",   "state": "initializing" },
			{"pause":"yes"},	// Wait for user to tap "Cancel"
		{   "command": "displayBitmap",   "defaultTimeout": -1,   "returnValue": true,   "screenId": 3 },
			{"pause":"yes"},	// Wait for user to tap "Cancel"
		{   "command": "state",   "returnValue": true,   "scenario": "handset",   "state": "playback" },
			{"pause":"yes"},	// Wait for user to tap "Cancel"
		{   "command": "state",   "returnValue": true,   "scenario": "handset",   "state": "neither" },
			{"pause":"yes"},	// Wait for user to tap "Cancel"
		{   "command": "displayCommand",   "commands": [     "<Call> <Name or #>",     "Redial"   ],   "defaultTimeout": 10000,   "events": [     {       "softKeyEvent": 17,       "softkeyText": "Tutorial"     }   ],   "panelBarText": "Listening ...",   "returnValue": true,   "screenId": 4,   "startTimeout": 0,   "titleText": "Who would you like to call?" },
			{"pause":"yes"},	// Wait for user to tap "Cancel"
		{   "command": "state",   "returnValue": true,   "scenario": "handset",   "state": "recording" },
		
		
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"displayBitmap", "screenId":0},

			// A long phone number
			{   "bodyText": "JIM ^IABEL",   "command": "displayConfirm",   "defaultTimeout": 10000,   "items": [     "MOBILE 1 (886)",     "MOBILE 2 (16#*5)",
     "MOBILE 3 (6966548965w123685566544252554789)",     "MOBILE 3 (6966548965w123685566544252554789)",     "MOBILE 3 (6966548965w123685566544252554789)",     "MOBILE 3 (6966548965w123685566544252554789)",     "MOBILE 3 (6966548965w123685566544252554789)",     "MOBILE 3 (6966548965w123685566544252554789)",     "MOBILE 3 (6966548965w123685566544252554789)",
     "OTHER (6659321234)"   ],   "panelBarText": "Listening ...",   "phrases": [],   "returnValue": true,   "screenId": 10,   "selectedItem": 0,   "startTimeout": 0,   "titleText": "Call" },
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{   "bodyText": "JIM ^IABEL",   "command": "displayConfirm",   "defaultTimeout": 10000,   "items": [     "MOBILE 1 (886)",     "MOBILE 2 (16#*5)",     "MOBILE 3 (6966548965w123685566544252554789)",     "OTHER (6659321234)"   ],   "panelBarText": "Listening ...",   "phrases": [],   "returnValue": true,   "screenId": 10,   "selectedItem": 0,   "startTimeout": 0,   "titleText": "Call" },
			{"pause":"yes"},	// Wait for user to tap "Cancel"

			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"bodyText":"","command":"displayText","defaultTimeout":10000,"events":[{"softKeyEvent":17,"softkeyText":"Tutorial"}],"returnValue":true,"screenId":6,"titleText":"Command not recognized"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"state", "state":"playback","scenario":"bluetooth"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command": "displayConfirm", "defaultTimeout": 10000,   "items": ["	 	Kleenex SIM","	 	Kleenex OTHER","Amy Flob 	Pooch"], "panelBarText": "Listening ...",   "phrases": ["Yes", "No"], "returnValue": true, "screenId": 9, "selectedItem": 0, "startTimeout": 0, "titleText": "Call?" },
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"state","returnValue":true,"scenario":"bluetooth","state":"recording"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"state","returnValue":true,"scenario":"bluetooth","state":"playback"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"bodyText":"Bob\tJones and Mickey Mouse","command":"displayConfirm","defaultTimeout":10000,"items":["MOBILE (555-1234)","HOMEreallylonggggggg (208-456-3246)","WORK (360-257-6432)"],"panelBarText":"Listening ...","phrases":[],"returnValue":true,"screenId":10,"selectedItem":0,"startTimeout":0,"titleText":"Call"}, 
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"state","returnValue":true,"scenario":"bluetooth","state":"recording"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"state","returnValue":true,"scenario":"bluetooth","state":"neither"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"bodyText":"Bob\tJones","command":"displayConfirm","defaultTimeout":10000,"items":["Bog Grey","Bob Jones","Samuel Hunt"],"panelBarText":"Listening ...","phrases":[],"returnValue":true,"screenId":7,"selectedItem":0,"startTimeout":0,"titleText":"Call"}, 
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"state","returnValue":true,"scenario":"bluetooth","state":"recording"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
	
			{"command":"audioLevel","level":7,"returnValue":true},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"state","returnValue":true,"scenario":"bluetooth","state":"neither"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"bodyText":"Bob\tJones","command":"displayConfirm","defaultTimeout":10000,"items":["MOBILE (555-1234)","HOME (208-456-3246)","WORK (360-257-6432)"],"panelBarText":"Listening ...","phrases":[],"returnValue":true,"screenId":10,"selectedItem":0,"startTimeout":0,"titleText":"Call"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"state","returnValue":true,"scenario":"bluetooth","state":"playback"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"displayListen", "titleText":"Who would you like to call?", "bodyText":"You can try \"Bob\", \"Bob mobile\", or \"555-1234\""},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"state", "state":"recording","scenario":"bluetooth"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"audioLevel", "level":"4"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"state","returnValue":true,"scenario":"bluetooth","state":"calculating"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{   "bodyText": "Song: \nThis Land is Your Land",   "command": "displayText",   "defaultTimeout": -1,   "events": [],   "returnValue": true,   "screenId": 73,   "titleText": "Playing..." },
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"state","returnValue":true,"scenario":"bluetooth","state":"playback"},
			{"command":"audioLevel","level":0,"returnValue":true},
			{"command":"state","returnValue":true,"scenario":"bluetooth","state":"neither"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
	
			{"command":"displayListen", "titleText":"Welcome to UI Test Mode", "bodyText":"Welcome to voice dialing. Press the Cancel button to change scenario."},
			{"bodyText":"","command":"displayText","defaultTimeout":10000,"events":[{"softKeyEvent":17,"softkeyText":"Tutorial"}],"returnValue":true,"screenId":6,"titleText":"Command not recognized"},
			{"command":"state", "state":"playback","scenario":"bluetooth"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			
			{"command":"displayListen", "titleText":"Showing Mic levels", "bodyText":"Showing microphone levels using headset/handset.  This is level 0."},
			{"command":"displayBitmap", "screenId":0},
			
			{"command":"state", "state":"recording","scenario":"handset"},
			{"command":"audioLevel", "level":"0"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"displayListen", "titleText":"Showing Mic levels", "bodyText":"Showing microphone level 1"},
			{"command":"audioLevel", "level":"1"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"displayListen", "titleText":"Showing Mic levels", "bodyText":"Showing microphone level 2"},
			{"command":"audioLevel", "level":"2"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"displayListen", "titleText":"Showing Mic levels", "bodyText":"Showing microphone level 1"},
			{"command":"audioLevel", "level":"1"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"displayListen", "titleText":"Showing Mic levels", "bodyText":"Showing microphone level 0"},
			{"command":"audioLevel", "level":"0"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"displayListen", "titleText":"Showing Mic levels", "bodyText":"Showing microphone level 3"},
			{"command":"audioLevel", "level":"3"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"displayListen", "titleText":"Showing Mic levels", "bodyText":"Showing microphone level 4"},
			{"command":"audioLevel", "level":"4"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"displayListen", "titleText":"Showing Mic levels", "bodyText":"Showing microphone level 5"},
			{"command":"audioLevel", "level":"5"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"displayListen", "titleText":"Showing Mic levels", "bodyText":"Showing microphone level 6"},
			{"command":"audioLevel", "level":"6"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"displayListen", "titleText":"Showing Mic levels", "bodyText":"Showing microphone level 7"},
			{"command":"audioLevel", "level":"7"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"displayListen", "titleText":"Showing Mic levels", "bodyText":"Showing microphone level 8"},
			{"command":"audioLevel", "level":"8"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"displayListen", "titleText":"Showing Mic levels", "bodyText":"Showing microphone level 9"},
			{"command":"audioLevel", "level":"9"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"displayListen", "titleText":"Showing Mic levels", "bodyText":"Showing microphone level 10"},
			{"command":"audioLevel", "level":"10"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"displayListen", "titleText":"Showing Mic levels", "bodyText":"Showing microphone level - Clipping!!"},
			{"command":"audioLevel", "level":"11"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
	
			{"command":"displayListen", "titleText":"Showing Mic levels", "bodyText":"Showing microphone levels using Bluetooth.  This is level 0."},
			{"command":"state", "state":"recording","scenario":"bluetooth"},
			{"command":"audioLevel", "level":"0"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"displayListen", "titleText":"Showing Mic levels", "bodyText":"Showing microphone level 1"},
			{"command":"audioLevel", "level":"1"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"displayListen", "titleText":"Showing Mic levels", "bodyText":"Showing microphone level 2"},
			{"command":"audioLevel", "level":"2"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"displayListen", "titleText":"Showing Mic levels", "bodyText":"Showing microphone level 3"},
			{"command":"audioLevel", "level":"3"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"displayListen", "titleText":"Showing Mic levels", "bodyText":"Showing microphone level 4"},
			{"command":"audioLevel", "level":"4"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"displayListen", "titleText":"Showing Mic levels", "bodyText":"Showing microphone level 5"},
			{"command":"audioLevel", "level":"5"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"displayListen", "titleText":"Showing Mic levels", "bodyText":"Showing microphone level 6"},
			{"command":"audioLevel", "level":"6"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"displayListen", "titleText":"Showing Mic levels", "bodyText":"Showing microphone level 7"},
			{"command":"audioLevel", "level":"7"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"displayListen", "titleText":"Showing Mic levels", "bodyText":"Showing microphone level 8"},
			{"command":"audioLevel", "level":"8"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"displayListen", "titleText":"Showing Mic levels", "bodyText":"Showing microphone level 9"},
			{"command":"audioLevel", "level":"9"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"displayListen", "titleText":"Showing Mic levels", "bodyText":"Showing microphone level 10"},
			{"command":"audioLevel", "level":"10"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"displayListen", "titleText":"Showing Mic levels", "bodyText":"Showing microphone level - Clipping!!"},
			{"command":"audioLevel", "level":"11"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			
			// Some typical screens
			{"command":"displayListen", "titleText":"Who would you like to call?", "bodyText":"You can try \"Bob\", \"Bob mobile\", or \"555-1234\""},
			{"command":"state", "state":"recording","scenario":"bluetooth"},
			{"command":"audioLevel", "level":"4"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			{"command":"displayListen", "titleText":"Who would you like to call?", "bodyText":"You can try \"Bob\", \"Bob mobile\", or \"555-1234\""},
			{"command":"state", "state":"playback","scenario":"bluetooth"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
	
			// A long phone number
			{   "bodyText": "JIM ^IABEL",   "command": "displayConfirm",   "defaultTimeout": 10000,   "items": [     "MOBILE 1 (886)",     "MOBILE 2 (16#*5)",     "MOBILE 3 (6966548965w123685566544252554789)",     "OTHER (665)"   ],   "panelBarText": "Listening ...",   "phrases": [],   "returnValue": true,   "screenId": 10,   "selectedItem": 0,   "startTimeout": 0,   "titleText": "Call" },
			{"pause":"yes"},	// Wait for user to tap "Cancel"
	
			// Show some of the lists
			{"command":"displayConfirm", "titleText":"3 Results", "items":["John Smith", "Jimmy Smythe", "Joan Smug"], "selectedItem":0},
			{"command":"state", "state":"recording","scenario":"bluetooth"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			// Show some of the lists
			{"command":"displayConfirm", "titleText":"3 Results", "items":["John Smith", "Jimmy Smythe", "Joan Smug"], "selectedItem":1},
			{"command":"state", "state":"recording","scenario":"bluetooth"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			// Show some of the lists
			{"command":"displayConfirm", "titleText":"3 Results", "items":["John Smith", "Jimmy Smythe", "Joan Smug"], "selectedItem":2},
			{"command":"state", "state":"recording","scenario":"bluetooth"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			
			{"command":"displayConfirm", "titleText":"3 Long Results for truncation testing of list", "items":["John Long Long Name Smith", "Jimmy Long Long Name Smythe", "Joan Long Long Name Smug"], "selectedItem":0},
			{"command":"state", "state":"recording","scenario":"bluetooth"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			
			{"command":"displayConfirm", "screenId":1, "titleText":"3 Results", "items":["123-456-7890", "123-456-7891", "123-456-7892"]},
			{"command":"state", "state":"recording","scenario":"bluetooth"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			
			{"command":"displayConfirm","screenId":10, "titleText":"John Smith - 3 Results", "items":["Mobile1 (617-797-8180)","Home(1) (781-435-1695)", "Home (781-435-1696)","A really really long location (a long number 781-970-5216)"], "selectedItem":0},
			{"command":"state", "state":"recording","scenario":"bluetooth"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"
			
			{reason:"no language pack", URL:"http://www.palm.com", targetDir:"dir", targetFilename:"filename", size:"812"},
			{"command":"state","returnValue":true,"scenario":"bluetooth","state":"initializing"},

			{"bodyText":"Press Back to try again. Press Help to learn how to use this voice command.","command":"displayText","defaultTimeout":10000,"events":[{"softKeyEvent":14,"softkeyText":"Help"}],"returnValue":true,"screenId":18,"titleText":"Command not recognized"},
			{"pause":"yes"},	// Wait for user to tap "Cancel"

			{"last":"last"}
		];
		
		do {
			this.params = scenarios[this.nextUITestScenario];
			// Was there a "reason" change?
			//if (this.params.reason === "no language pack") 
				//this.showControls("vc_no_language_pack");
			this.handleVoiceCommandService(this.params);
			enyo.log("iteration ", this.nextUITestScenario, " done");
			this.nextUITestScenario++;
		} while (scenarios[this.nextUITestScenario].last !== "last" && scenarios[this.nextUITestScenario].pause != "yes");
		
		// Was that the last scenario?  If so, cycle back to the beginning
		if (scenarios[this.nextUITestScenario].last === "last")
			this.nextUITestScenario = 0;
	}


});

VSuiteEvent = {
    VST_UI_EVENT_NONE:0,              /*!< No event assigned to softkey */
    VST_UI_EVENT_TIMEOUT:1,           /*!< Screen timed out.  Timeout events should
                                         only be sent by the OEM in response to a
                                         timeout specified when displaying a VSuite
                                         screen */
    VST_UI_EVENT_EXIT:2,              /*!< Exit from the voice application */
    VST_UI_EVENT_RESTART:3,           /*!< Restart the voice application */
    VST_UI_EVENT_BACK:4,              /*!< Return to the previous screen */
    VST_UI_EVENT_NEXT:5,              /*!< Go to the next screen of a sequence */
    VST_UI_EVENT_PREVIOUS:6,          /*!< Go to the previous screen of a sequence */
    VST_UI_EVENT_OK:7,                /*!< Dismiss and/or confirm current screen */
    VST_UI_EVENT_YES:8,               /*!< Accept a yes/no choice */
    VST_UI_EVENT_NO:9,                /*!< Reject a yes/no choice  */
    VST_UI_EVENT_CANCEL:10,            /*!< Cancel the current operation*/
    VST_UI_EVENT_REPEAT:11,            /*!< Repeat the current operation*/
    VST_UI_EVENT_PAUSE:12,             /*!< Pause the current operation */
    VST_UI_EVENT_CONTINUE:13,          /*!< Continue the current operation */
    VST_UI_EVENT_HELP:14,              /*!< Display the help page of the current screen */
    VST_UI_EVENT_OPTIONS:15,           /*!< Display an optional options menu over the main menu. */
    VST_UI_EVENT_SETTINGS:16,          /*!< Display the VSuite 3.x application settings */
    VST_UI_EVENT_TUTORIAL:17,          /*!< View the tutorial */
    VST_UI_EVENT_SELECT:18,            /*!< Select an item from a list */
    VST_UI_EVENT_SELECT_SUBMENU:19,    /*!< Select a subitem from a list */
    VST_UI_EVENT_SET_FOCUS:20,         /*!< Scroll to a new item in a list  */
    VST_UI_EVENT_SET_FOCUS_SUBMENU:21, /*!< Scroll to a new submenu item in a list */
    VST_UI_EVENT_ADD:22,               /*!< Add a contact */
    VST_UI_EVENT_START:23,             /*!< Start an operation */
    VST_UI_EVENT_SAVE:24,              /*!< Save something */
    VST_UI_EVENT_READOUT:25,           /*!< Readout the entire screen - VZW only */
    VST_UI_EVENT_INFO:26,              /*!< Display Info - VZW only */
    VST_UI_EVENT_KEYPRESS_BARGEIN:27,  /*!< Keypress Barge-in event - VZW only */
    VST_UI_EVENT_SCROLL_UP:28,         /*!< Scroll up event - VSearch only */
    VST_UI_EVENT_SCROLL_DOWN:29,       /*!< Scroll down event - VSearch only */
    VST_UI_EVENT_SCROLL_LEFT:30,       /*!< Scroll left event - VSearch only */
    VST_UI_EVENT_SCROLL_RIGHT:31,      /*!< Scroll right event - VSearch only */
    VST_UI_EVENT_TIMER:32,             /*!< VCM Timer event.
                                         Will NOT interrupt audio or restart VSuite state machine. */
    VST_UI_EVENT_RESULTS:33,           /*!< Network results received - VSearch only */
    VST_UI_EVENT_TEXT_INPUT:34,        /*!< Text input update ready - VSearch only */
    VST_UI_EVENT_TOUCH_DOWN:35,        /*!< Touch screen press down - VSearch only
                                         Will NOT interrupt audio or restart VSuite state machine. */
    VST_UI_EVENT_TOUCH_UP:36,          /*!< Touch screen press up - VSearch only
                                         Will NOT interrupt audio or restart VSuite state machine. */
    VST_UI_EVENT_TOUCH_MOVE:37,        /*!< Touch screen press move - VSearch only
                                         Will NOT interrupt audio or restart VSuite state machine. */
    VST_UI_EVENT_ENROLL_START:38,      /*!< Indicates that VSuite should start recording a dict enrollment phrase */
    VST_UI_EVENT_ENROLL_STOP:39        /*!< Indicates that VSuite should stop recording a dict enrollment phrase */
};

VSuiteScreenId = {
	VST_UI_SCR_INTRO_TUTORIAL:0,
	VST_UI_SCR_MAIN_MENU:4,
    VST_UI_SCR_NO_MATCH_GENERIC_NONLISTENING:6,
    VST_UI_SCR_WHICH_LOCATION_CALL_MULTI:10,
    VST_UI_SCR_WHICH_LOCATION_CALL_SINGLE:11,
	VST_UI_SCR_TASK_COMPLETE_CALL:12,
    VST_UI_SCR_NO_MATCH_CALL_NONLISTENING:18,
	VST_UI_SCR_TASK_COMPLETE_PLAY:73
};  

enyo.kind({
	name: "MaxHeightScroller",
	kind: "Scroller",
	autoVertical: true, // don't allow 'nudging' of content that doesn't need to be scrolled
	multiChrome: [
			{name: "innerClient", height: "100%"}
	],
	create: function() {
		this.inherited(arguments);
		this.$.innerClient.applyStyle("max-height", "274px");
		//this.$.innerClient.applyStyle("max-height", "60%");
	}
});
