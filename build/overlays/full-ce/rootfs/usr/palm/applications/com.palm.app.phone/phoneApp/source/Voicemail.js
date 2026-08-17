enyo.kind({
	name: "Voicemail",
	kind: enyo.VFlexBox,
	className: "phone-background",
	keyOrangePressed: false,
	stateOpened: "closed",
	oldOpenDrawerItem: null,
	numNoVVMMessage: 0,
	carrierVvmSignupPending: false,
	popupMenuChange: false,
	redraw: true,
	isInternetConnectionAvailable: true,
	deactivated: true,
	cleanedup: true,
	confirmShowingItem: undefined,
	airplaneMode: false,
	commandToServiceCounter: 0,
	mailboxlen: 0,
	mailboxstatus: "",
	carrierName: "",
	passwordError: false,
	mailboxError: 0,
	components: [
		{name: "viewPane", kind:"Pane", flex: 1, transitionKind:enyo.transitions.Simple, components: [ 
			{name: "vvmScroller", kind: "Scroller", className: "enyo-fit", components: [
				{name: "vvmList", kind: "BaseList", onSetupRow: "listGetItem" },
			]},
			{name: "emptyVisualVoicemail", kind: enyo.VFlexBox, flex: 1, style: "text-align: center", components: [
				{name: "emptyVisualVoicemailIcon", kind: enyo.Image, src: "../images/empty-voicemail.png", style: "margin-top: 30px"},
				{name: "emptyVisualVoicemailLabel", content: $L("Your voicemail list is empty"), className: "empty-text"},
				{kind: "ToolButton", caption: $L("Call My Voicemail"), onclick: "callCarrierVoicemail", style: "margin-top: 50px; margin-left: 40px; margin-right: 40px"},
			]},
		]},
		{name: "callsDBAssistant", kind: "DBAssistant", 
			onGotVisualVoicemail: "onGotVisualVoicemail",
		},
		{name: "popupMenu", kind: "VoicemailPopupMenu", onDeleteMenuItem: "onDeleteMenuItem", onSaveMenuItem: "onSaveMenuItem"},
		{name: "noVoicemailNumberPrompt", kind: "NoVoicemailNumberPrompt"},
		{name: "launchApplication", kind: enyo.PalmService, service: enyo.palmServices.application, method: "launch"},
		{name: "connectionManager", kind: enyo.PalmService, service: "palm://com.palm.connectionmanager/", method: "getstatus", subscribe: true, onSuccess: "onConnectionManager", onFailure: "onConnectionManagerFail"},
		{name: "voicemailError", kind: "VoicemailError"},
		{name: "airplaneModePref", kind:"PalmService", service: enyo.palmServices.system, params:{keys:["airplaneMode"]}, method:"getPreferences", onSuccess:"onAirplaneModePref"},
		{name: "mailboxQuery", kind: "DbService", method: "find", onSuccess: "mailboxQueryCallback", subscribe: true, reCallWatches: true},
		{name: "networkAlerts", kind: "NetworkAlerts"},
		{name: "subItemActionHandler", kind: "SubItemActionHandler"}
	],
	
	create: function() {
		this.inherited(arguments);
		
		this._updateVVMAudioStateFunc = enyo.hitch(this, "updateVVMAudioState")
		enyo.application.audioInterface.addAudioStateMediaListener(this._updateVVMAudioStateFunc);
		
		this.$.airplaneModePref.call();
		this._initializeTimerHandle = setTimeout(enyo.bind(this, "_initialize"), 200);
		
		this.vvms = [];
	},
	
	_initialize: function() {
		if (this._initializeTimerHandle) {
			clearTimeout(this._initializeTimerHandle);
			this._initializeTimerHandle = undefined;
		}

		this.$.mailboxQuery.call(DBModels.Voicemail.getMailBoxWatchQuery());
		// this.$.callsDBAssistant.getVisualVoicemail();
		this.$.connectionManager.call({
			params: {},
		 });
	},
	
	destroy: function() {
		AudioPlayer.destroy();
		
		if (this._initializeTimerHandle) {
			clearTimeout(this._initializeTimerHandle);
			this._initializeTimerHandle = undefined;
		}

		if (this.updateTimerHandle) {
			clearTimeout(this.updateTimerHandle);
			this.updateTimerHandle = undefined;
		}

		enyo.application.audioInterface.removeAudioStateMediaListener(this._updateVVMAudioStateFunc);
		this.inherited(arguments);
	},
	
	handleLaunch: function(params) {
		enyo.log("phoneapp>> handleLaunch: params = " + enyo.json.stringify(params));
		if (params.launchType) {
			if (params.launchType == "noVoicemailNumber") {
				enyo.application.UI.enter("dialpad_card");
				if(enyo.application.isTablet == true) {
					this.$.noVoicemailNumberPrompt.openAtCenter();
				} else {
					this.$.noVoicemailNumberPrompt.open();
				}
			}
		}
		else if ( params.cleanup ) {
			this.deactivating(true);
		}
		else if ( params.deactivate ) {
			this.deactivating(false);
		}
		else if ( params.activate ) {
			this.redrawVvmList();
		}
		else {
			this.redrawVvmList();
		}
	},
	
	// Event handler to change voicemail icon to "played"
	handlePlayed: function(inIndex) {
		var item = this.$.vvmList.drawerItemOpenStateMgr.curOpenDrawerItem;
		if (item) {
			var vvm = item.getData();
			if (vvm.read || vvm.readMessage) {
				// Already marked read or in the queue to be updated.
				return;
			}
		
			item.setDisplayIconsClassName([(vvm.expired) ? 'voicemail-heard-icon expired_N_heard' : 'voicemail-heard-icon heard']);
			item.setDisplayDetailsClassName('drawerItem-displayDetails');
			item.render();

			// This will skip UI refreshing two times;
			// once when readMessage flag is set by phone app, another is when "read" is set by service.
			// TODO: only skip once because sometimes "read" isn't set properly.
			this.commandToServiceCounter += 1;
			enyo.log("phoneapp>> add commandToServiceCounter = " + this.commandToServiceCounter);
			this.$.callsDBAssistant.updateVvmReadMessage(vvm._id);
			// MRAY-3102 don't play alert if count is changed because user heard a message
			enyo.application.VoicemailService.setIgnoreVoicemailCountNotification(true);
			// enyo.application.VoicemailService.decrementVoicemailCount();
		}
	},

	handlePaused: function(inIndex) {
		if (this.refreshPending) {
			this.ignoreResults = false;
			this.refreshPending = false;
			this.$.callsDBAssistant.getVisualVoicemail();
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

	updateVVMAudioState: function(profile) {
		AudioPlayer.audioprofile = profile;
		StreamingAudioPlayer.audioprofile = profile;
	},

	clearUpdateTimer: function() {
		if (this.updateTimerHandle) {
			clearTimeout(this.updateTimerHandle);
			this.updateTimerHandle = undefined;
		}
	},

	// The update timer will prevent the list from rerfreshes
	startUpdateTimer: function() {
		this.clearUpdateTimer();

		this.updateTimerHandle = setTimeout(enyo.bind(this, "updateTimer"), 2500);
		this.ignoreResults = true;
		this.$.callsDBAssistant.getVisualVoicemail();
	},
	
	updateTimer: function() {
		this.clearUpdateTimer();

		this.ignoreResults = false;

		if (!this._initializeTimerHandle) {
			this._initializeTimerHandle = setTimeout(enyo.bind(this, "_processResults"), 200);
		}
	},
	
	_processResults: function() {
		if (this._initializeTimerHandle) {
			clearTimeout(this._initializeTimerHandle);
			this._initializeTimerHandle = undefined;
		}

		this.processResults();
	},

	mailboxQueryCallback: function(inSender, payload) {
		var mailboxes = payload.results;
		if (this.mailboxlen !== mailboxes.length) {
			enyo.log("phoneapp>> number of mailbox is changed = " + mailboxes.length);
			this.mailboxlen = mailboxes.length;
			// this.$.callsDBAssistant.getVisualVoicemail();

			if (this.carrierName !== enyo.application.VoicemailService.getCarrierName()) {
				this.mailboxstatus = "";
				this.carrierVvmSignupPending = false;
				this.getCarrierMailboxStatus(mailboxes);
			}
		}
		else {
			this.getCarrierMailboxStatus(mailboxes);
		}
	},

	getCarrierMailboxStatus: function(mailboxes) {
		this.carrierName = "";
		mailboxes.forEach(function(mailbox) {
			if (mailbox.service == "sfr" || mailbox.service == "verizon") {
				this.carrierName = mailbox.service;
				if ((this.mailboxstatus !== mailbox.status) || (this.mailboxError !== mailbox.error)) {
					enyo.log("phoneapp>> mailbox status is changed: status = " + mailbox.status + ", error = " + mailbox.error);
					this.mailboxstatus = mailbox.status;

					this.carrierVvmSignupPending = (this.mailboxstatus == "pending");
					// mailbox.error: 3 && mailbox.status: pending => not an error, but needs subscription
					// mailbox.error: 3 && mailbox.status: active => vvm subscription is done, password is wrong
					this.passwordError = ((mailbox.error === VvmErrorCode.BAD_PASSWORD) && !this.carrierVvmSignupPending);
					this.mailboxError = mailbox.error;
					
					this.$.voicemailError.start();

					this.redraw = true;
					if (!this.cleanedup) {
						this.redrawVvmList();
					}
					else {
						enyo.log("phoneapp>> don't redraw UI while the card is deactivated.");
					}
				}
			}
		}, this);

		enyo.log("phoneapp>> this.mailboxstatus = " + this.mailboxstatus + ", carrierVvmSignupPending = " + this.carrierVvmSignupPending);
	},
	
	redrawVvmList: function() {
		if (this.passwordError && this.carrierName === "verizon") {
			enyo.log("phoneapp>> redrawVvmList: password error");
			enyo.application.UI.enter("dialpad_card");

			if (!enyo.application.VoicemailService.getInternetConnectionAvailable()) {
				enyo.log("airplane>> appmenu:getInternetConnectionAvailable() == false");
				this.$.networkAlerts.push({type: "voice"});
			}
			else {
				var accountSetupApp = enyo.application.VoicemailService.getAccountSetupApp();
				if (accountSetupApp === undefined || accountSetupApp == null || accountSetupApp == "") {
					accountSetupApp = "com.palm.app.accounts";
				}
			}
			this.$.launchApplication.call({
				id: accountSetupApp,
				params: { "resetpin": true }
			});
		}
		else {
			this.deactivated = false;
			this.cleanedup = false;
			if (this.redraw) {
				this.redraw = false;
				this.$.callsDBAssistant.getVisualVoicemail();
			}
		}
	},
	
	onConnectionManager: function(inSrc, inResponse, inRequest) {
		enyo.application.VoicemailService.setInternetConnectionAvailable(inResponse.isInternetConnectionAvailable);
		enyo.log("airplane>> voicemail:onConnectionManager(): network is " + (inResponse.isInternetConnectionAvailable ? "connected" : "disconnected"));

		if (this.isInternetConnectionAvailable != inResponse.isInternetConnectionAvailable){
			this.isInternetConnectionAvailable = inResponse.isInternetConnectionAvailable;
			this.$.airplaneModePref.call();
			if (!this.deactivated && !this.cleanedup){
				this.$.callsDBAssistant.getVisualVoicemail();
			}
			else {
				this.redraw = true;
			}
		}
	},
	
	onConnectionManagerFail: function(inSrc, inResponse, inRequest) {
		enyo.error("phoneapp>> connection manager get status failed: inResponse = " + JSON.stringify(inResponse));
	},
	
	onAirplaneModePref: function(inSrc, response) {
		this.airplaneMode = response.returnValue && response.airplaneMode;
	},
	
	onGotVisualVoicemail: function(inSrc, inResponse, inRequest) {
        if (inResponse.returnValue && inResponse.fired == true) {
			if (this.commandToServiceCounter > 0) {
				this.commandToServiceCounter--;
				enyo.log("phoneapp>> remove commandToServiceCounter = " + this.commandToServiceCounter);
				this.ignoreResults = true;
				this.$.callsDBAssistant.getVisualVoicemail();
				return;
			}
			var curItem = this.$.vvmList.drawerItemOpenStateMgr.curOpenDrawerItem && this.$.vvmList.drawerItemOpenStateMgr.curOpenDrawerItem.getDrawerItemContainer2();
			if (curItem && curItem.$.audioControl && curItem.$.audioControl.playing) {
				this.ignoreResults = true;
				this.refreshPending = true;
				this.$.callsDBAssistant.getVisualVoicemail();
			}
			else if (this.ignoreUpdateTimer === true) {
				this.ignoreUpdateTimer = false;
				this.$.callsDBAssistant.getVisualVoicemail();
			} else {
				this.startUpdateTimer();
			}
			return;
		}
		else {
			this.vvms = (inResponse && inResponse.results) || [];
 			if (!this.ignoreResults && !this._initializeTimerHandle) {
				this._initializeTimerHandle = setTimeout(enyo.bind(this, "_processResults"), 200);
			}
		}
	},

	processResults: function() {
		this.refreshPending = false;
		this.confirmShowingItem = undefined;
		this.curDividerText = "";
		
		if (this.vvms.length > 0) {
			this.$.viewPane.selectView(this.$.vvmScroller); 
			
			this.numNoVVMMessage = 0;
			for (var i = 0; i < this.vvms.length; i++) {
				var vvm = this.vvms[i];
				if (vvm.audioPath === undefined || vvm.audioPath === null || vvm.audioPath === "") {
					if (vvm.messagetype !== "fax") {
						this.vvms.splice(i--, 1);
						this.numNoVVMMessage++;
					}
				}
				enyo.log("phoneapp>> # of empty voicemessages: " + this.numNoVVMMessage);
			}
							
           	this.$.vvmList.build();
		} else {
			if (this.carrierName) {
				if (this.carrierVvmSignupPending) {
					this.$.vvmList.build();
				}
				else {
					this.$.viewPane.selectView(this.$.emptyVisualVoicemail); 
				}
			}
			else {
				if (enyo.application.VoicemailService.isVvmEnabled()) {
            		this.$.vvmList.build();
				}
				else {				
					this.redraw = true;

					enyo.application.UI.enter("dialpad_card");

					this.$.vvmList.build();	// clean up
				}
			}
		}
	},
	
	listGetItem: function(src, inIndex) {
		if (inIndex < this.vvms.length) {
			var vvm = this.vvms[inIndex];
			var items = [];
			var legacyVM = null;
			this.bFillingList = true;

			if (inIndex == 0) {
				items = this.createFirstIndexItems();
			}

			var divider = this.createDivider(vvm.timestamp);
			if (divider != null) {
				items.push(divider);
			}

			items.push(this.createDrawerItem(src, inIndex));

			return items;
		}
		else
		{
			if (this.vvms.length > 0) {
				this.$.vvmScroller.render();
				
				enyo.asyncMethod(this, "decorateFavoriteList");
			}
			else {
				if (inIndex == 0) {
					var items = [];
					items = this.createFirstIndexItems();
					return items;
				}
				else {
					this.$.viewPane.selectView(this.$.vvmScroller);
					this.$.vvmScroller.render();
				}
			}
			
			this.bFillingList = false;
		}
	},
	
	createFirstIndexItems: function () {
		var items = [];
		var legacyVM = null;

		if (this.carrierVvmSignupPending) {
			// No Message Retrieval Capability
			items.push(this.createCallCarrierVoicemailItem());
			items.push({ className: "call-log-separator" });
			legacyVM = this.createVvmErrorItemBeforeVvmSetup();
			if (legacyVM) {
				items.push(legacyVM);
				items.push({ className: "call-log-separator" });
			}
			items.push(this.createCarrierVvmSignupItem());
		}
		else {
			// No Carrier VVM
			if (!enyo.application.VoicemailService.isCarrierVoicemailEnabled()) {
				items.push(this.createCarrierVoicemailItem());
			}
			else {
				// No Message Retrieval Capability
				legacyVM = this.createVvmErrorItem();
				if (legacyVM) {
					items.push(legacyVM);
				}
			}
		}
		
		return items;
	},
	
	createDivider: function(timestamp)
	{
		var dayOffsetText = enyo.application.Utils.formatRelativeDate(new Date(timestamp));
		if (dayOffsetText) {
			if (dayOffsetText != this.curDividerText) {
				this.curDividerText =  dayOffsetText;
				return { kind: "CustomDivider", caption: this.curDividerText};
			}
			else {
				return { className: "call-log-separator" };
			}
		}
	},

	/*
		Draw voicemail item when the drawer is closed.
	*/
	createDrawerItem: function(src, inIndex) {
		var vvm = this.vvms[inIndex];
		var icons = [];

		if (vvm.read || vvm.readMessage) {
			icons.push((vvm.expired) ? 'voicemail-heard-icon expired_N_heard' : 'voicemail-heard-icon heard');
		}
		else {
			icons.push((vvm.expired) ? 'voicemail-heard-icon expired' : 'voicemail-heard-icon');
		}

		if (vvm.urgent) {
			icons.push('voicemail-heard-icon urgent');
		}
		
		if (vvm.private) {
			icons.push('voicemail-heard-icon private');
		}

		vvm.index = inIndex;
		var item = {
			kind: "DrawerItem", 
			displayName: ((vvm.from.name) ? vvm.from.name : enyo.application.Utils.FormatPhoneNumber(vvm.from.addr)),
			displayDetailsClassName: (vvm.read || vvm.readMessage) ? "drawerItem-displayDetails" : "drawerItem-displayDetails-bold",
			displayLabelRight: enyo.application.Utils.formatShortTime(new Date(vvm.timestamp)),
			displayIconsClassName: icons,
			isAFavoriteContact: false,
			avatarImgSrc: (vvm.listPhotoPath && vvm.listPhotoPath != "") ? vvm.listPhotoPath : "./images/list-avatar-default.jpg",
			onClickedAndHeld: "onDisplayContentClickedAndHeld",
			data: vvm,
			onSwipe: "onDrawerItemSwipe",
			onConfirm: "onDrawerItemSwipeConfirm",
			onCancel: "onDrawerItemSwipeCancel"
		};

		if (vvm.messagetype == "fax") {
			var drawerItemsContainer = this.createDrawerTextSubItems($L("Fax or DSN message"), "callCarrierVoicemail");
			item.displayLabel = $L("Tap to Call");
			item.displayMiddleLabel = $L("FAX");
			item.drawerItemContainer = drawerItemsContainer;
			item.onDisplayContentClicked = "callCarrierVoicemail";
		}
		else {
			item.displayLabel = enyo.application.Utils.getDurationString(vvm.duration);
			if (vvm.service === "type_skype") item.displayMiddleLabel = $L("SKYPE");
			item.onOpenChanged = src.onDrawerStateChanged;
			item.onBeforeOpenChanged = enyo.bind(this, this.onBeforeDrawerStateChanged);
			item.onDisplayContentClicked = "onDrawerItemClicked";
		}

		return item;
	},

	/*
		Draw voicemail detail information when the drawer is opened.
	*/
	createDrawerSubItems2: function(inVVM) {
		var drawerItemsContainer = enyo.create({
			kind: enyo.VFlexBox,
			vvm: inVVM,
		});
		
		if(inVVM.service === "type_skype") {
			drawerItemsContainer.createComponent({
				name: "audioControl",
				kind: "StreamingAudioPlayer.DrawerItem",
				fromUsername: inVVM.from.addr,
				timestamp: inVVM.timestamp,
				duration: inVVM.duration,
				service: inVVM.service,
				owner: drawerItemsContainer,
			});
		}
		else {
			drawerItemsContainer.createComponent({
				name: "audioControl",
				kind: "AudioPlayer.DrawerItem",
				audioSize: inVVM.size,
				audioPath: inVVM.audioPath,
				duration: inVVM.duration,
				owner: drawerItemsContainer,
			});
		}
		drawerItemsContainer.createComponent({ className: "call-log-separator" });

		return  drawerItemsContainer;
	},
	
	// Call Carrier Voicemail when there's no carrier vvm db available
	createCallCarrierVoicemailItem: function() {
		var item = {kind: "ToolButton", onclick: "callCarrierVoicemail", components: [
			{kind: enyo.HFlexBox, components: [
				{name: "img", kind: enyo.Image, src: "../images/notification-small-active.png", style: "padding: 15px 0px; margin-right: 10px"},
				{kind: enyo.Label, content: $L("Call Carrier Voicemail")}
			]},
		]};
		return item;
	},

	createVvmErrorItemBeforeVvmSetup: function() {
		if (!this.isInternetConnectionAvailable) {
			var msg;
			var label;
			var tapAction;
			if (this.airplaneMode) {
				msg = $L("Airplane mode is on, unable to download message!");
				label = $L("Tap to turn off Airplane mode");
				tapAction = "turnOffAirplaneMode";
			}
			else {
				msg = $L("No data service, unable to download message!");
				label = $L("Tap to Call");
				tapAction = "callCarrierVoicemail";
			}
			var drawerItemsContainer = this.createDrawerTextSubItems(msg, tapAction);

			var item = {
				kind: "DrawerItem", 
				displayName: $L("No Internet Connection"),
				displayNameAreaClassName: "drawerItem-displayNm-full",
				displayDetailsClassName: "drawerItem-displayDetails",
				displayLabel: label,
				displayLabelRight: enyo.application.Utils.formatShortTime(new Date()),
				avatarImgSrc: "./images/avatar-exclamation.png",
				drawerItemContainer: drawerItemsContainer,
				onOpenChanged:	null,
				onBeforeOpenChanged: null,
				onDisplayContentClicked: tapAction,
				allowSwipe: false,
			};
						
			return item;
		}
		else {
			return null;
		}
	},
	
	// Shows a list item "X New Voicemail" when the phone is not able to download vvm message because of the network error
	// Tap to make regular carrier voicemail
	createVvmErrorItem: function() {
		// enyo.log("phoneapp>> numNoVVMMessage = " + this.numNoVVMMessage + ", network = " + this.isInternetConnectionAvailable + ", airplane = " + this.airplaneMode)
		if (this.numNoVVMMessage) {
			var msg;
			var label;
			var tapAction;
			if (this.isInternetConnectionAvailable) {
				msg = $L("Unable to download messages.");
				label = $L("Tap to Call");
				tapAction = "callCarrierVoicemail";
			}
			else if (this.airplaneMode) {
				msg = $L("Airplane mode is on, unable to download message!");
				label = $L("Tap to turn off Airplane mode");
				tapAction = "turnOffAirplaneMode";
			}
			else {
				msg = $L("No data service, unable to download message!");
				label = $L("Tap to Call");
				tapAction = "callCarrierVoicemail";
			}
			var drawerItemsContainer = this.createDrawerTextSubItems(msg, tapAction);

			var item = {
				kind: "DrawerItem", 
				displayName: "",
				displayNameAreaClassName: "drawerItem-displayNm-full",
				displayDetailsClassName: "drawerItem-displayDetails",
				displayLabel: label,
				displayLabelRight: enyo.application.Utils.formatShortTime(new Date()),
				avatarImgSrc: "./images/avatar-exclamation.png",
				drawerItemContainer: drawerItemsContainer,
				onOpenChanged:	null,
				onBeforeOpenChanged: null,
				onDisplayContentClicked: tapAction,
				allowSwipe: false,
			};
						
			item.displayName = enyo.application.Utils.formatChoice(
				$L("1#1 New Voicemail|##{msg} New Voicemails"), this.numNoVVMMessage, {"msg": this.numNoVVMMessage});

			return item;
		}
		else {
			return null;
		}
	},
	
	// Shows a list item "Carrier Voicemail" when user has no carrier visual voicemail
	// Tap to make regular carrier voicemail
	createCarrierVoicemailItem: function() {
		// var item = {
		// 	kind: "BubbleDrawerItem", 
		// 	displayName: $L("Carrier Voicemail"),
		// 	displayNumber: enyo.application.VoicemailService.getVoicemailCount(),	// TODO: get the number of carrier voicemail
		// 	onDisplayContentClicked: "callCarrierVoicemail",
		// };
		var item = {kind: "ToolButton", onclick: "callCarrierVoicemail", components: [
			{kind: enyo.HFlexBox, components: [
				{name: "img", kind: enyo.Image, src: "../images/notification-small-active.png", style: "padding: 15px 0px; margin-right: 10px"},
				{kind: enyo.Label, content: $L("Call Carrier Voicemail")},
				{name: "displayNumber", className: "folder-number", showing: false},
			]},
		]};
		var voicemailCount = enyo.application.VoicemailService.getVoicemailCount();
		if (voicemailCount > 1) {
			item.displayNumber.setShowing(true);
			item.displayNumber.setContent(voicemailCount);
		}

		return item;
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
	
	turnOffAirplaneMode: function() {
		enyo.log("phoneapp>> turn off airplane mode");
		this.$.networkAlerts.push({type: "voice"});
	},

	handlePlayingAudio: function(action) {
		if (this.$.vvmList.drawerItemOpenStateMgr.curOpenDrawerItem) {
			var curItem = this.$.vvmList.drawerItemOpenStateMgr.curOpenDrawerItem.getDrawerItemContainer2();
			if (curItem && curItem.$.audioControl.playing) {
				if (action == "cleanup") {
					curItem.$.audioControl.cleanup();
				}
				else if (action == "pause") {
					curItem.$.audioControl.onPlayPause();
				}
			}
		}
	},
	
	onDrawerItemClicked: function(src, itemData) {
		if (this.keyOrangePressed) {
			// this.handlePlayingAudio("pause");	
			this.$.popupMenu.launch(src.getData());
		}
		else {
			this.createDrawerItemsContainers(src);

			var oldItem = this.$.vvmList.drawerItemOpenStateMgr.curOpenDrawerItem;
			
			// Open Hidden Drawer 2 only or close all drawer
			src.toggleOpen2();

			// Play VM automatically
			if (src.open) {
				if (oldItem) {
					if (oldItem && oldItem != src)
					{
						oldItem.getDrawerItemContainer2().$.audioControl.cleanup();
					}
				}
				
				this.stateOpened = "halfopened";
				src.getDrawerItemContainer2().$.audioControl.onPlayPause();
			}
			else {
				this.stateOpened = "closed";
				src.getDrawerItemContainer2().$.audioControl.cleanup();
				this.oldOpenDrawerItem = src.getDrawerItemContainer2();
			}
		}
	},
	
	onDrawerSubItemClicked: function(src) {
		var executeData = {
			"clickAction": src.action,
			"personId": src.personId, 
			"person": src.person,
			"rawPhoneNumber": src.rawPhoneNumber,
			"service": src.service
		};
		this.$.subItemActionHandler.executeAction(executeData);
	},
	
	onSMSIconClicked: function(src) {
		var executeData = {"personId": src.personId, "rawPhoneNumber": src.rawPhoneNumber, "transport": src.service};
		this.$.subItemActionHandler.executeSendSMS(executeData);
	},
	
	onDisplayContentClickedAndHeld: function(src, itemData) {
		// this.handlePlayingAudio("pause");	
		this.$.popupMenu.launch(src.getData());
	},

	onBeforeDrawerStateChanged: function(src, oldOpenVal, newOpenVal) {
		var created = this.createDrawerItemsContainers(src);

	    if (newOpenVal == true) {
			// Drawer is opening
		
			// A new drawer is opened while another is closed without notification.
			if (this.$.vvmList.drawerItemOpenStateMgr.curOpenDrawerItem) {
				var oldItem = this.$.vvmList.drawerItemOpenStateMgr.curOpenDrawerItem.getDrawerItemContainer2();
				var newItem = src.getDrawerItemContainer2();
				if (oldItem && oldItem != newItem)
				{
					oldItem.$.audioControl.cleanup();
				}
			}
		
			this.stateOpened = "fullyopened";
		}
		else {
			// Drawer is closing
			this.stateOpened = "closed";
		
			// Stop playing audio and resets slider position to the beginning.
			var newItem = src.getDrawerItemContainer2();
			if (newItem) newItem.$.audioControl.cleanup();
			this.oldOpenDrawerItem = newItem;
		}

		if (created) {
			enyo.asyncMethod(this, "asyncToggleOpen", src);
			return true;
		}
		else {
			return false;
		}
	},
	
	asyncToggleOpen: function(src) {
		src.toggleOpen();
	},

	onSaveMenuItem: function(src, inId) {
		this.commandToServiceCounter++;
		enyo.log("phoneapp>> add commandToServiceCounter = " + this.commandToServiceCounter);
		this.$.callsDBAssistant.updateVvmSaveMessage(inId);
	},
	
	onDeleteMenuItem: function(src, vvm) {
		if (!vvm.read && !vvm.readMessage) {
			enyo.application.VoicemailService.setIgnoreVoicemailCountNotification(true);
		}
		this.$.callsDBAssistant.deleteVisualVoicemail(vvm._id);
	},

	onDrawerItemSwipe: function(src) {
		if (this.confirmShowingItem && (this.confirmShowingItem != src)) {
			this.confirmShowingItem.setConfirmShowing(false);
		}
		
		this.confirmShowingItem = src;
	},
	
	onDrawerItemSwipeCancel: function(src) {
		this.confirmShowingItem = undefined;
	},

	onDrawerItemSwipeConfirm: function(src) {
		this.confirmShowingItem = undefined;
		var vvm = src.getData();
		if (!vvm.read && !vvm.readMessage) {
			enyo.application.VoicemailService.setIgnoreVoicemailCountNotification(true);
		}
		this.$.callsDBAssistant.deleteVisualVoicemail(vvm._id);
	},
	
	/*
		Draw voicemail detail information when the drawer is opened.
	*/
	createDrawerSubItems: function(inVVM) {
		if (inVVM.from.addr === "blocked" || inVVM.from.addr === "blocked caller" || inVVM.from.addr === "unknown" || inVVM.from.addr === "unknown caller") {
			enyo.log("phoneapp>> don't add phone number info for blocked or unknown caller");
			return null;
		}
		
		var drawerItemsContainer = enyo.create({
			kind: enyo.VFlexBox,
			vvm: inVVM,
		});
		
		// add multiple phone numbers, phone type
		if (inVVM.phoneNumbers) {
			var len = inVVM.phoneNumbers.length;
			for (var i = 0; i < len; i++) {
				drawerItemsContainer.createComponent({
					kind: "DrawerVVMSubItem",
					itemText: enyo.application.Utils.FormatPhoneNumber(inVVM.from.addr),
					action: DrawerSubItemAction.DialPhoneNumber,
					rawPhoneNumber: inVVM.from.addr,
					phoneNumber: inVVM.phoneNumbers[i],
					displaySMSIcon: true,
					onClicked: enyo.bind(this, "onDrawerSubItemClicked"),
					onSmsIconClicked: enyo.bind(this, "onSMSIconClicked"),
					owner: drawerItemsContainer,
				}); 
				drawerItemsContainer.createComponent({ className: "call-log-separator" });
			}
		}
		else {
			drawerItemsContainer.createComponent({
				kind: "DrawerVVMSubItem",
				itemText: enyo.application.Utils.FormatPhoneNumber(inVVM.from.addr),
				action: DrawerSubItemAction.DialPhoneNumber,
				rawPhoneNumber: inVVM.from.addr,
				displaySMSIcon: true,
				onClicked: enyo.bind(this, "onDrawerSubItemClicked"),
				onSmsIconClicked: enyo.bind(this, "onSMSIconClicked"),
				owner: drawerItemsContainer,
			}); 
			drawerItemsContainer.createComponent({ className: "call-log-separator" });
		}
		
		// Show "view contact" or "add to contact"
		drawerItemsContainer.createComponent({
			kind: "DrawerVVMSubItem",
			itemText: inVVM.from.personId ? $L("View Contact") : $L("Add to Contacts"),
			action: inVVM.from.personId ? DrawerSubItemAction.ViewContact : DrawerSubItemAction.AddToContacts,
			personId: inVVM.from.personId ? inVVM.from.personId : "",
			rawPhoneNumber: inVVM.from.addr, 
			style: "color: #CCCCCC;",
			onClicked: enyo.bind(this, "onDrawerSubItemClicked"),
			onSmsIconClicked: enyo.bind(this, "onSMSIconClicked"),
			owner: drawerItemsContainer,
		});
		drawerItemsContainer.createComponent({ className: "call-log-separator" });

		return  drawerItemsContainer;
	},

	/*
		Draw voicemail detail information when the drawer is opened.
	*/
	createDrawerTextSubItems: function(message, tapAction) {
		var drawerItemsContainer = enyo.create({
			kind: enyo.VFlexBox,
		});

		drawerItemsContainer.createComponent({
			kind: "DrawerVVMSubItem",
			className: "drawer-subitem wide",
			itemText: message,
			action: DrawerSubItemAction.CustomAction,
			onClicked: enyo.bind(this, tapAction),
			displaySMSIcon: false,
			owner: drawerItemsContainer,
		}); 
		drawerItemsContainer.createComponent({ className: "call-log-separator" });

		return  drawerItemsContainer;
	},
	
	// Shows a list item "Visual Voicemail Set Up" when vvm setup is not completed
	// Tap to continue subscription process
	createCarrierVvmSignupItem: function() {
		var drawerItemsContainer = this.createCarrierVvmSubscriptionSubItem();

		var item = {
			kind: "DrawerItem", 
			displayName: $L("Visual Voicemail Set Up"),
			displayNameAreaClassName: "drawerItem-displayNm-full",
			displayDetailsClassName: "drawerItem-displayDetails",
			displayLabel: $L("Tap to complete setup"),
			avatarImgSrc: "./images/avatar-exclamation.png",
			drawerItemContainer: drawerItemsContainer,
			onBeforeOpenChanged: null,
			onDisplayContentClicked: "onContinueSubscription",
			allowSwipe: false,
		};
		
		return item;
	},

	createCarrierVvmSubscriptionSubItem: function() {
		var drawerItemsContainer = enyo.create({
			kind: enyo.VFlexBox,
		});

		drawerItemsContainer.createComponent({
			kind: "DrawerVVMSubItem",
			className: "drawer-subitem wide",
			itemText: $L("Complete Visual Voicemail Set Up"),
			action: DrawerSubItemAction.CustomAction,
			onClicked: enyo.bind(this, this.onContinueSubscription),
			displaySMSIcon: false,
			owner: drawerItemsContainer,
		}); 

		drawerItemsContainer.createComponent({ className: "call-log-separator" });

		drawerItemsContainer.createComponent({
			kind: "DrawerVVMSubItem",
			className: "drawer-subitem wide",
			itemText: $L("Decline Visual Voicemail"),
			action: DrawerSubItemAction.CustomAction,
			onClicked: enyo.bind(this, this.onDeclineSubscription),
			displaySMSIcon: false,
			owner: drawerItemsContainer,
		}); 

		drawerItemsContainer.createComponent({ className: "call-log-separator" });

		return  drawerItemsContainer;
	},
	
	onContinueSubscription: function() {
		this.subscribeVvm(true);
	},
	
	onDeclineSubscription: function() {
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

	deactivating: function(isCleanup) {
		this.deactivated = true;
		this.cleanedup = isCleanup;

		if (isCleanup) {
			this.$.voicemailError.stop();
		}

		this.$.popupMenu.close();

		if (this.$.vvmList.drawerItemOpenStateMgr.curOpenDrawerItem) {
			var curItem = this.$.vvmList.drawerItemOpenStateMgr.curOpenDrawerItem.getDrawerItemContainer2();
			if (curItem)
			{
				if (isCleanup) {
					curItem.$.audioControl.setVvmScenarioControl(false);
				}
				if (curItem.$.audioControl.playing == true)
				{
					if(curItem.$.audioControl.service === "type_skype") {
						curItem.$.audioControl.pause();
					}
					else {
						if (isCleanup) {
							curItem.$.audioControl.cleanup();
						}
						// else {
						// 	enyo.log("phoneapp>> don't pause audio when the ui is carded.");
						// }
					}
				}
			}
		} else {
			if (isCleanup && this.oldOpenDrawerItem) {
				this.oldOpenDrawerItem.$.audioControl.setVvmScenarioControl(false);
			}
		}

		enyo.application.VoicemailService.refreshMessages("normal");
	},

	onDecorationComplete: function(inSender, inItem) {
		if (this.bFillingList)
			return false;

		var len = inItem.itemIndexes.length;
		for (var i = 0; i < len; i++) {
			var listControls = this.$.vvmList.getControls(); // Saving a reference to the array should be more efficient than calling getItemByIndex
			var drawerItemContainer = listControls[inItem.itemIndexes[i]];
			// The 1st child in the container chould be a divider, therefore check for this case to get the correct DrawerItem reference
			var drawerItem = drawerItemContainer.children[0].kind == "DrawerItem" ? drawerItemContainer.children[0] : drawerItemContainer.children[1];

			if (inItem.favorite == true) {
				drawerItem.setIsAFavoriteContact(true);
			}

			if (inItem.listPhotoPath.length > 0) {
				drawerItem.setAvatarImgSrc(inItem.listPhotoPath);
			}
			
			if (inItem.phoneNumbers) {
				drawerItem.getData().phoneNumbers = inItem.phoneNumbers;
				this.createDrawerItemsContainers(drawerItem);
			}
		}
	},
	
	decorateFavoriteList: function() {
		var listControls = this.$.vvmList.getControls(); // Saving a reference to the array should be more efficient than calling getItemByIndex
		var lastDrawerItemId = this.$.vvmList.getLastOpenedDrawerItemId();
		for (var i = 0; i < listControls.length; i++) {
			var drawerItemContainer = listControls[i];
			// The 1st child in the container chould be a divider, therefore check for this case to get the correct DrawerItem reference
			var drawerItem = drawerItemContainer.children[0].kind == "DrawerItem" ? drawerItemContainer.children[0] : drawerItemContainer.children[1];
			if (drawerItem && drawerItem.kind == "DrawerItem") {
				drawerItem.setIsAFavoriteContact(drawerItem.getData() && drawerItem.getData().favorite == true);	// or drawerItem.isAFavoriteContact

				if (drawerItem.getItemId() == lastDrawerItemId) {
					if (this.stateOpened == "fullyopened") {
						drawerItem.pulseMouseUpEvent();
					}
					else if (this.stateOpened == "halfopened") {
						this.createDrawerItemsContainers(drawerItem);
						drawerItem.toggleOpen2();
					}
				}
			}
			else {
				enyo.error("invalid drawerItem");
			}
		}
	},
	
	createDrawerItemsContainers: function(src) {
		var newItem = src.getDrawerItemContainer2();
		if (!newItem) {
			var drawerItemsContainer = this.createDrawerSubItems(src.getData());
			if (drawerItemsContainer) {
				src.setDrawerItemContainer(drawerItemsContainer);
				drawerItemsContainer.render();
			}
			
			var drawerItemsContainer2 = this.createDrawerSubItems2(src.getData());
			src.setDrawerItemContainer2(drawerItemsContainer2);
			drawerItemsContainer2.render();

			drawerItemsContainer2.$.audioControl.addEventListener('played', enyo.bind(this, "handlePlayed", 0));
			drawerItemsContainer2.$.audioControl.addEventListener('playbackended', enyo.bind(this, "handlePaused", 0));
			
			return true;
		}
		else {
			return false;
		}
	},
});
