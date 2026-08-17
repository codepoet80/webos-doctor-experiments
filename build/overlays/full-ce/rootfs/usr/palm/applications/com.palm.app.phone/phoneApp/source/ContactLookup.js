enyo.kind({
	name: "ContactLookup",
	kind: enyo.VFlexBox,
	mediaCaptureInitialized: false,
	IMSTATUS: {
		AVAILABLE: 0,
		OFFLINE: 4
	},
	events: {
		onShowTabMenu: ""
	},
	components: [{
		name: "pane", kind: "Pane", flex: 1, transitionKind: enyo.transitions.Simple, components: [
			{name: "main", kind: "VFlexBox", className: "contact-list", components: [
				{name: "group", kind: enyo.VFlexBox, flex: 1, components: [
					{kind: "SearchInput", name: "textVInput", style: "margin: 15px;", className: "enyo-rounded-input", spellcheck: false, autocorrect: false, hint: $L("Enter Name"), changeOnKeypress: true,
							keypressChangeDelay: 200, onchange: "showVideoContacts", onCancel: "showVideoContacts"},
					// Lists every contact whose IM address is on a currently video-capable transport
					// (whatsapp/telegram/signal/teams/...), provider-agnostic - see VideoAddressingList.js.
					{name: "videoAddressingList", kind: "VideoAddressingList", flex: 1, addressTypes: ["ims"], showVideo: true,
							onSelect: "videoCallClicked", onVideoCall: "videoCallClicked"}
				]},
				{name: "noVideoAccountControl", kind: enyo.VFlexBox, align: "center", showing: false, components: [
					{name: "videoTabCaption", layoutkind: "HFlexBox", className:"video-tab-caption", pack: "center",
						content: $L("Add a video calling account to view video contacts")},
					{align: "center", pack: "center", components: [
						{kind: "Button", name: "videoAccountButton", className:"enyo-notification-button", width:"200px", caption: $L("Add Account"), onclick: "videoAccountButtonClick"},
						{name: "spinner", kind: "Spinner", showing: false, pack: "center", shownWhenSpinning: true}
					]},

				]}
			]},
			{name: "accountsView", kind: "AccountsUI", capability: "PHONE", onAccountsUI_Done: "accountsDone", lazy: true},
		]},
	],
	create: function() {
		this.inherited(arguments);
		this.buddyStatusDirty = true;//force update listview
		this._updateBuddystatus = enyo.hitch(this, "updateBuddyStatus");
		// webOS: Skype gone -> skypeBuddyCache may be absent; guard so this doesn't NPE (see Dialer.js).
		if (enyo.application.Cache.skypeBuddyCache) {
			enyo.application.Cache.skypeBuddyCache.registerBuddyStatus(this._updateBuddystatus);
		}
	},

	destroy: function() {
		if(enyo.application.Cache.skypeBuddyCache) {
			enyo.application.Cache.skypeBuddyCache.unregisterBuddyStatus(this._updateBuddystatus);
		}
		this.inherited(arguments);
	},

	handleLaunch: function(params) {
		// tell preference we're launched, this value comes strictly from prefDB
		if (enyo.application.Cache.isFirstTimeLaunched !== true) {
			enyo.log("update isFirstTimeLaunched in contactlookup");
			enyo.application.Cache.isFirstTimeLaunched = true;
			enyo.application.SystemStatus.setFirstTimeLaunchRecord(true);
		}

		this.$.textVInput.setValue(this.prevVal || (params && params.value) || "");
		if (enyo.application.Utils.getKeyBoardType() !== undefined) {
			this.$.textVInput.forceFocus();
		}

		this.updateContactLookupUI(params);
	},

	// Provider-agnostic: any enabled PHONE-capable account other than cellular counts (see
	// Cache.hasVoipAcct, set from the same capability:"PHONE" account list DialProxy.js uses).
	// If one exists, show the video contact list and let VideoAddressingList's own "no results"
	// state handle an empty roster; otherwise prompt to add one.
	updateContactLookupUI: function(params) {
		this.$.spinner.setShowing(false);
		if (enyo.application.Cache.hasVoipAcct === true) {
			this.$.noVideoAccountControl.hide();
			this.$.group.show();

			this.$.textVInput.setValue(this.prevVal || (params && params.value) || "");
			if (enyo.application.Utils.getKeyBoardType() !== undefined) {
				this.$.textVInput.forceFocus();
			}
			this.showVideoContacts();
		} else {
			this.$.group.hide();
			this.$.noVideoAccountControl.show();
			this.$.videoTabCaption.setContent($L("Add a video calling account to view video contacts"));
			this.$.videoAccountButton.setCaption($L("Add Account"));
			this.$.videoAccountButton.show();
		}
	},
	videoAccountButtonClick: function() {
		this.addVoipAccount();
	},

	updateBuddyStatus: function () {
		this.buddyStatusDirty = true;
		enyo.log("debug: updateBuddyStatus "+ this.buddyStatusDirty);
		if (enyo.application.UI.getCurrentState() === 'contactlookup') {
			this.updateContactLookupUI(null);
			this.showVideoContacts();
		}
	},

	showVideoContacts: function() {
		var curVal = this.$.textVInput.getValue();

		if((this.prevVal == curVal) && !this.buddyStatusDirty) {
		     enyo.log(this.buddyStatusDirty + " prev search val = curr search val, Skipping Search");
		     return;
		}

		this.prevVal = curVal;

		if (curVal.length === 0) {
			this.$.videoAddressingList.cancelSearch();
		}
		this.$.videoAddressingList.search(curVal);
		this.buddyStatusDirty = false;
	},
	focusHandler: function() {
		if (enyo.keyboard.isManualMode()){
			enyo.keyboard.setManualMode(false);
		}
	},
	// inSelected.address.type carries the IM's own service ("type_whatsapp"/"type_telegram"/...);
	// CallSynergizer.dial() translates that serviceName to the account templateId itself, same
	// generalization already applied to Dialer.js's videoClicked()/addressSelected().
	videoCallClicked: function(inSender, inSelected){
		if (!inSelected) {
			return;
		}
		var transport = (inSelected.address.type && inSelected.address.type.indexOf("type_") === 0) ? inSelected.address.type : undefined;
		enyo.application.CallSynergizer.dial(inSelected.address.value, true /*video call*/, undefined, transport, inSelected.personId, true);
	},
	addVoipAccount: function(){
		if (!enyo.application.Cache.accountTemplate) {
			enyo.log("debug: no account list");
		}
		else {
			this.doShowTabMenu(false);
			this.$.pane.selectViewByName("accountsView");
			this.$.accountsView.AddAccount(enyo.application.Cache.accountTemplate);
		}
	},
	accountsDone: function(){
		 this.$.pane.selectViewByName("main");
		 this.doShowTabMenu(true);
	},

});
