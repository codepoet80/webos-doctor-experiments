enyo.kind({
	name: "Voicemail",
	kind: enyo.VFlexBox,
	className: "phone-background",

	keyOrangePressed: false,
	numNoVVMMessage: 0,
	carrierVvmSignupPending: false,
	isInternetConnectionAvailable: true,
	ignoreResults: false,
	
	components: [
		{name: "emptyVisualVoicemail", kind: enyo.VFlexBox, flex: 1, style: "text-align: center", showing: false, components: [
			{name: "emptyVisualVoicemailIcon", kind: enyo.Image, src: "../images/empty-voicemail.png", style: "margin-top: 30px"},
			{name: "emptyVisualVoicemailLabel", content: $L("Your voicemail list is empty"), className: "empty-text"},
			{kind: "Button", caption: $L("Call My Voicemail"), onclick: "callCarrierVoicemail", style: "margin-top: 50px; margin-left: 40px; margin-right: 40px"},
		]},
		{name: "callsDBAssistant", kind: "DBAssistant", onGotVisualVoicemail: "onGotVisualVoicemail"},
		{name: "dbVVMCount", kind: enyo.DbService, method: "find", dbKind: "com.palm.vvm.voicemessages:1", onSuccess: "onVVMCountSuccess", subscribe: true, reCallWatches: true},
		{name: "personsCache", kind: "PersonsCache", onPersonCacheReady: "onPersonCacheReady"},
		{flex: 1, name: "vvmlist", kind: "DbList", onQuery: "listQuery", onSetupRow: "onSetupRow", desc: true, components: [
			{name: "drawerItem_VvmCounter", kind: "VoicemailWithCountDrawerItem", showing: false, onDrawerItemClicked: "callCarrierVoicemail"},
			{name: "drawerItem_VvmDrawer", kind: "VoicemailDrawerItem", showing: false, onDrawerItemClicked: "callCarrierVoicemail"},
			{name: "divider", kind: "CustomDivider", showing: false},
			{name: "separator", className: "call-log-separator", showing: false},
			{name: "drawerItem", kind: "VoicemailDrawerItem",
				onConfirm: "onDeleteConfirm",
				onBeforeAvatarClicked: "onBeforeAvatarClicked",
				onBeforeToggleOpen: "onBeforeToggleOpen",
				onDrawerItemClicked: "onDrawerItemClicked"},
		]},
		{name: "popupMenu", kind: "VoicemailPopupMenu", onDeleteMenuItem: "onDeleteMenuItem", onSaveMenuItem: "onSaveMenuItem"},
		{name: "noVoicemailNumberPrompt", kind: "NoVoicemailNumberPrompt"},
		{name: "connectionManager", kind: enyo.PalmService, service: "palm://com.palm.connectionmanager/", method: "getstatus", 
			subscribe: true, onSuccess: "onConnectionManager", onFailure: "onConnectionManagerFail"},
		{name: "networkAlerts", kind: "NetworkAlerts", onTap: "onTapHandlerFn"},
		{name: "voicemailError", kind: "VoicemailError"},
		{name: "airplaneModePref", kind:"PalmService", service: enyo.palmServices.system, params:{keys:["airplaneMode"]}, method:"getPreferences", onSuccess:"onAirplaneModePref"},
	],
	
	create: function() {
		this.inherited(arguments);
		// TODO: size
		this.$.vvmlist.setPageSize(100);

		this.$.airplaneModePref.call();
		this.$.connectionManager.call({
			params: {},
		 });
		
		this._getVVMCountQuery();
	},
	
	handleLaunch: function(params) {
		if ( params.cleanup ) {
			this.deactivated = true;
			this.deactivating();
		}
		else {
			this.deactivated = false;
			this.$.vvmlist.punt();
		}
	},

	deactivating: function() {
		this.$.popupMenu.close();
	},
	
	_getVVMCountQuery: function() {
		this.$.dbVVMCount.call({query:{"from":"com.palm.vvm.voicemessages:1"}, count: true});
	},

	listQuery: function(inSender, inQuery) {
		return this.$.callsDBAssistant.getVisualVoicemail_DL(inQuery);
	},
	
	updateSubItems: function() {
		this.$.drawerItem.$.callHistorySubItem.render();
		this.$.drawerItem.$.callOptions.render();
	},
	
	createDivider: function(vvm, inIndex) {
		var dayOffsetText;
		if (inIndex === 0) {
			dayOffsetText = enyo.application.Utils.formatRelativeDate(new Date(vvm.timestamp));
		} else {
			// TODO!! NEED a more efficient algorithm to do this...
			var relDate1 = enyo.application.Utils.formatRelativeDate(new Date(vvm.timestamp));
			var vvmPrev = this.$.vvmlist.fetch(inIndex - 1);
			if (relDate1 !== enyo.application.Utils.formatRelativeDate(new Date(vvmPrev.timestamp))) {
				dayOffsetText = relDate1;
			}
			this.$.vvmlist.fetch(inIndex); // another call to fetch is necessary since it was used above to get the prev callLog
		}
		
		if (dayOffsetText) {
			this.$.divider.setShowing(true);
			this.$.divider.setCaption(dayOffsetText);
			this.$.separator.setShowing(false);
		} else {
			this.$.divider.setShowing(false);
			this.$.separator.setShowing(true);
		}
	},

	createCarrierVoicemailItem: function(withCounter) {
		this.$.drawerItem_VvmCounter.setDisplayName($L("Carrier Voicemail"));
		this.$.drawerItem_VvmCounter.setDisplayNumber(withCounter ? enyo.application.VoicemailService.getVoicemailCount() : "");
		this.$.drawerItem_VvmCounter.setShowing(true);
	},
	
	createCarrierVvmSignupItem: function() {
		this.$.drawerItem_VvmDrawer.$.message1.setContent($L("Complete Visual Voicemail Set Up"));
		this.$.drawerItem_VvmDrawer.$.message1.setShowing(true);
		
		this.$.drawerItem_VvmDrawer.$.message2.setContent($L("Decline Visual Voicemail"));
		this.$.drawerItem_VvmDrawer.$.message2.setShowing(true);
		
		this.$.drawerItem_VvmDrawer.$.displayNm.setContent("Visual Voicemail Set Up");
		this.$.drawerItem_VvmDrawer.$.displayLbl.setContent($L("Tap to complete setup"));
		this.$.drawerItem_VvmDrawer.$.img.setSrc("./images/list-avatar-default.jpg");

		this.$.drawerItem_VvmDrawer.setClassName("drawerItem");
		this.$.drawerItem_VvmDrawer.$.HiddenDrawerItem.setOpen(false);
		this.$.drawerItem_VvmDrawer.$.HiddenDrawerItem2.setOpen(false);
		
		this.$.drawerItem_VvmDrawer.onMsgClick = this.onContinueSubscription.bind(this);
		this.$.drawerItem_VvmDrawer.onMsg2Click = this.onDeclineSubscription.bind(this);
		// TODO
		// this.$.drawerItem_VvmDrawer.onDrawerItemClicked = this.onContinueSubscription.bind(this);
		
		this.$.drawerItem_VvmDrawer.setShowing(true);
	},
	
	onContinueSubscription: function() {
		enyo.log("tady>> onContinueSubscription");
		this.subscribeVvm(true);
	},
	
	onDeclineSubscription: function() {
		enyo.log("tady>> onDeclineSubscription");
		this.subscribeVvm(false);
	},
	
	subscribeVvm: function(isContinue) {
		var accountSetupApp = enyo.application.VoicemailService.getAccountSetupApp();
		if (accountSetupApp === undefined || accountSetupApp == null || accountSetupApp == "") {
			accountSetupApp = "com.palm.app.accounts";
		}
		this.$.launchApplication.call({
			id: accountSetupApp,
			params: { "accept": isContinue }
		});
	},

	createFirstIndexItems: function () {
		// this.$.drawerItem_VvmDrawer.setShowing(false);
		if (this.isInternetConnectionAvailable && this.carrierVvmSignupPending) {
			this.createCarrierVoicemailItem(false);
			this.createCarrierVvmSignupItem();
		}
		else {
			// No Carrier VVM
			if (!enyo.application.VoicemailService.isCarrierVoicemailEnabled()) {
				this.createCarrierVoicemailItem(true);
			}
			else {
				// No Message Retrieval Capability
				this.createVvmErrorItem();
			}
		}
	},

	onSetupRow: function(inSender, inRecord, inIndex) {
		if (inIndex == 0) {
			this.createFirstIndexItems();
		}

		this.createDivider(inRecord, inIndex);
		var vvm = inRecord;
		var personData = this.$.personsCache.getPersonData(vvm.from.personId);
		this.$.drawerItem.createDrawerItem(vvm, personData);
		return true;
	},

	onPersonCacheReady: function() {
		this.$.vvmlist.refresh();
	},

	onGotVisualVoicemail: function(inSrc, inResponse, inRequest) {	
		var vvms = (inResponse && inResponse.results) || [];
		if (!this.ignoreResults) {
			this.refreshPending = false;
			this.confirmShowingItem = undefined;

			this.curItemIndex = -1;
			this.curOpenItemId = null;

			var carrierName = enyo.application.VoicemailService.getCarrierName();
			if (carrierName) {
				var mailStatus = enyo.application.VoicemailService.getStatus(carrierName);
				this.carrierVvmSignupPending = (mailStatus == "pending");
				if (!this.carrierVvmSignupPending) {
					this.$.voicemailError.start();
				}
				else {
					this.$.voicemailError.stop();
				}
			}
			else {
				this.carrierVvmSignupPending = false;
			}
			
			//this.numNoVVMMessage = 0; // TODO: Can only be set to 0 when the list is punted...
			var numPersonId = 0;
			var len = vvms.length;
			for (var i = 0; i < len; i++) {
				var vvm = vvms[i];
				if (vvm.audioPath == null || vvm.audioPath == "") {
					vvms.splice(i--, 1);
					this.numNoVVMMessage++;
				}
				
				if (vvm.from.personId) {
					numPersonId++;
					this.$.personsCache.addItem(vvm.from.personId);
				}
			}
			if (numPersonId) {
				this.$.personsCache.updateCache();			
			}

			this.$.vvmlist.queryResponse(inResponse, inRequest);
		}
	},

	// Shows a list item "X New Voicemail" when the phone is not able to download vvm message because of the network error
	// Tap to make regular carrier voicemail
	createVvmErrorItem: function() {
		if (this.numNoVVMMessage && !this.isInternetConnectionAvailable && this.airplaneMode) {
			this.$.drawerItem_VvmDrawer.$.message1.setContent($L("No data service, unable to download message!"));
			this.$.drawerItem_VvmDrawer.$.message1.setShowing(true);
			if (this.numNoVVMMessage == 1) {
				this.$.drawerItem_VvmDrawer.$.displayNm.setContent($L("1 New Voicemail"));
			}
			else {
				this.$.drawerItem_VvmDrawer.$.displayNm.setContent(this.numNoVVMMessage + $L(" New Voicemails"));
			}
			this.$.drawerItem_VvmDrawer.$.displayLbl.setContent($L("Tap to Call"));
			this.$.drawerItem_VvmDrawer.$.img.setSrc("./images/list-avatar-default.jpg");

			this.$.drawerItem_VvmDrawer.$.HiddenDrawerItem.setOpen(false);
			this.$.drawerItem_VvmDrawer.$.HiddenDrawerItem2.setOpen(false);
			this.$.drawerItem_VvmDrawer.setClassName("drawerItem");
			this.$.drawerItem_VvmDrawer.setShowing(true);

			// TODO
			// onDisplayContentClicked: "callCarrierVoicemail",
			// allowSwipe: false,
		}
		else {
			return null;
		}
	},
	
	//physical keyboard button keydown
	keydown: function(e) {
		if (e.altKey) {
			this.keyOrangePressed = true;
		}
	},

	//physical keyboard button keyup
	keyup: function(e) {
		if (e.altKey) {
			this.keyOrangePressed = false;
		}
	},

	onConnectionManager: function(inSrc, inResponse, inRequest) {
		enyo.application.VoicemailService.setInternetConnectionAvailable(inResponse.isInternetConnectionAvailable);
		enyo.log("airplane>> voicemail:onConnectionManager(): network is " + (inResponse.isInternetConnectionAvailable ? "connected" : "disconnected"));

		if (this.isInternetConnectionAvailable != inResponse.isInternetConnectionAvailable){
			this.isInternetConnectionAvailable = inResponse.isInternetConnectionAvailable;
			this.$.airplaneModePref.call();
			if (!this.deactivated){
				this.$.vvmlist.refresh(); // TOOD: To be tested ...
			}
			else {
				this.redraw = true;
			}
			if (this.isInternetConnectionAvailable) {
				enyo.log("airplane>> voicemail:onConnectionManager():network recovered. remove popup");
				this.$.networkAlerts.cancel();
			}
		}
	},
	
	onConnectionManagerFail: function(inSrc, inResponse, inRequest) {
		enyo.error("phoneapp>> connection manager get status failed: inResponse = " + JSON.stringify(inResponse));
	},
	
	onAirplaneModePref: function(inSrc, response) {
		this.airplaneMode = response.returnValue && response.airplaneMode;
	},
	
	onDeleteConfirm: function(inSrc, inIndex) {
		this.$.callsDBAssistant.deleteVisualVoicemail(this.$.vvmlist.fetch(inIndex)._id);
	},
	
	onSaveMenuItem: function(src, inId) {
		this.$.callsDBAssistant.updateVvmSaveMessage(inId);
	},
	
	onDeleteMenuItem: function(src, inId) {
		this.$.callsDBAssistant.deleteVisualVoicemail(inId);
	},

	onDrawerItemClicked: function(inSrc, inEvent) {
		if (this.keyOrangePressed) {
			this.$.popupMenu.launch(this.$.vvmlist.fetch(inEvent.rowIndex));
			return false;
		}
		else {
			inSrc.createDrawerSubItems(this.$.vvmlist.fetch(inEvent.rowIndex));
			inSrc.createDrawerSubItems2(this.$.vvmlist.fetch(inEvent.rowIndex));
			return true;
		}
	},
	
	onDisplayContentClickAndHold: function(inSrc, inEvent) {
		this.doDisplayContentClickedAndHeld(inEvent);
	},

	onAvatarClick: function(inSrc, inEvent) {
		if (/*inEvent.rowIndex != this.curItemIndex &&*/ !this.$.HiddenDrawerItem.getOpen()) {
			// this.doBeforeAvatarClicked(inEvent.rowIndex);
			var vvm = this.$.vvmlist.fetch(inEvent.rowIndex);
			this.createDrawerSubItems(vvm);
			this.createDrawerSubItems2(vvm);
			
			this.toggleOpen(inEvent.rowIndex, "fullopen");
		} else {
			this.toggleOpen(inEvent.rowIndex, "close");
		}

		enyo.stopEvent(inEvent);
	},

	onCallOptionsGetItem: function(inSrc, inIndex) {
		// TODO: this.areHistoryAndOptionsValid
		if (this.callOptionsDataArray === undefined /*|| this.areHistoryAndOptionsValid !== true*/) {
			return;
		} else if (inIndex < this.callOptionsDataArray.length) {
			var callOptionData = this.callOptionsDataArray[inIndex];
			this.$.drawerSubItem.setPhoneNumber(callOptionData.phoneNum);
			this.$.drawerSubItem.setIms(callOptionData.ims);
			this.$.drawerSubItem.setItemText(callOptionData.itemText);
			this.$.drawerSubItem.setDisplaySMSIcon(callOptionData.showSMSIcon);
			this.$.drawerSubItem.setPerson(callOptionData.person);
			return true;
		}
		return;
	},

	callCarrierVoicemail: function() {
		var number = enyo.application.VoicemailService.getVoicemailNumber();
		if (number == undefined || number == null || number == "") {
			if(enyo.application.isTablet == true) {
				this.$.noVoicemailNumberPrompt.openAtCenter();
			} else {
				this.$.noVoicemailNumberPrompt.open();
			}
		}
		else {
			// Always specifiy a transport to avoid having the Cache.phonePreferredDomesticPhoneService from opening the PreferredPhSvcDlg
			enyo.application.CallSynergizer.dial(number, undefined, undefined, enyo.application.CallSynergizer.TRANSPORTS.TIL);
		}		
	},

	onDrawerSubItemClick: function(inSrc, inEvent) {
		enyo.log("tady>> onDrawerSubItemClick(): inEvent.rowIndex = " + inEvent.rowIndex);
	},
	
	onSmsIconClicked: function(inSrc, inEvent) {
		enyo.log("tady>> onSmsIconClicked(): inEvent.rowIndex = " + inEvent.rowIndex);
	},
	
	onDisplayContentClickedAndHeld: function(inSrc, inEvent) {
		this.$.popupMenu.launch(this.$.vvmlist.fetch(inEvent.rowIndex));
	},

	onOpenAnimationComplete: function() {
		// TODO:
		return;
		
		this.animationCount--;
		if (!this.animationCount) {
			this.$.vvmlist.refresh();
		}
	},

	// Event handler to change voicemail icon to "played"
	handlePlayed: function() {
		if (this.curItemIndex < 0) {
			enyo.error("tady>> invalid curItemIndex = " + this.curItemIndex);
		}
		var vvm = this.$.vvmlist.fetch(this.curItemIndex);
		if (vvm.read /*|| vvm.readMessage*/) {
			// Already marked read or in the queue to be updated.
			// enyo.error("tady>> already read, vvm = " + JSON.stringify(vvm));
			return;
		}
		vvm.readMessage = true;
	
		this.$.vvmlist.$.list.prepareRow(this.curItemIndex);
		this.setDisplayIcons(vvm);
		this.$.drawerItem.$.displayDetails.setClassName('clv-drawerItem-displayDetails');
				
		this.$.callsDBAssistant.updateVvmReadMessage(vvm._id);
	},
	
	handlePaused: function(inIndex) {
		this.$.drawerItem.$.audioPlayer.render();
		
		if (this.refreshPending) {
			this.ignoreResults = false;
			this.refreshPending = false;
			this.$.vvmlist.refresh(); // TOOD: To be tested ...
		}
	},

	onBeforeAvatarClicked: function(inSrc, inIndex) {
		var vvm = this.$.vvmlist.fetch(inIndex);
		inSrc.createDrawerSubItems(vvm);
		inSrc.createDrawerSubItems2(vvm);
	},
	
	onBeforeToggleOpen: function(inSrc, inIndex, inOpen) {
		if (inOpen === "fullopen" || inOpen === "halfopen") {
			// close the last drawer
			if (this.curItemIndex > -1 && inIndex != this.curItemIndex) {
				if (this.$.vvmlist.$.list.prepareRow(this.curItemIndex)) {
					this.animationCount++;
				}
				this.$.drawerItem.$.HiddenDrawerItem.setOpen(false);
				this.$.drawerItem.$.HiddenDrawerItem2.setOpen(false);
				this.$.drawerItem.$.audioPlayer.cleanup();
				this.$.drawerItem.setSwipeable(true);
				this.$.drawerItem.$.toggleFrame.setClassName("avatar-frame unOpened");
				this.$.drawerItem.render();
			}

			// open all drawer
			this.curItemIndex = inIndex;
			this.curOpenItemId = this.$.vvmlist.fetch(inIndex)._id;
			
			this.$.vvmlist.$.list.prepareRow(this.curItemIndex);
		}
		else {
			this.curItemIndex = -1;
			this.curOpenItemId = null;
		}
	},
	
	onVVMCountSuccess: function(inSrc, inResponse, inRequest) {
		if (inResponse.returnValue && inResponse.fired == true) {
			this._getVVMCountQuery();
		}
		else if (inResponse.returnValue) {
			if (inResponse.count === 0) {
				this.$.vvmlist.setShowing(false);
				this.$.emptyVisualVoicemail.setShowing(true);
			}
			else {
				this.$.vvmlist.setShowing(true);
				this.$.emptyVisualVoicemail.setShowing(false);
			}
		}
	}
});
