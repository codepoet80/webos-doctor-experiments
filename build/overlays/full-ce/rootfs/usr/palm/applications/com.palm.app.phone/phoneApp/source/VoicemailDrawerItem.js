enyo.kind({
	name: "VoicemailWithCountDrawerItem",
	style: "text-align:left;padding-top:5px;",
	kind: enyo.VFlexBox,
	published: {
		displayName: "",
		displayNumber: 0,
	},
	events: {
		onDrawerItemClicked: "",
	},
	className: "drawerItem",
	components: [
		{kind: enyo.HFlexBox, className: "draweritem-displayArea", onclick: "onDrawerItemClicked", components: [
			{name: "displayName"},
			{name: "displayNumber", className: "folder-number"},
		]},
	],
	
	create: function() {
		this.inherited(arguments);
		
		this.displayNameChanged();
		this.displayNumberChanged();
	},
	
	displayNameChanged: function() {
		this.$.displayName.setContent(this.displayName);
	},

	displayNumberChanged: function() {
		this.$.displayNumber.setShowing(this.displayNumber > 1);
		if (this.displayNumber > 1) {
			this.$.displayNumber.setContent(this.displayNumber);
		}
	},

	onDisplayContentClick: function() {
		this.doDisplayContentClicked();
	},
});

enyo.kind({
	name: "VoicemailDrawerItem",
	style: "text-align:left;padding-top:5px;",
	kind: enyo.SwipeableItem,
	tapHighlight: true,
	events: {
		onDrawerItemClicked: "",
		onDisplayContentClickedAndHeld: "",
		onAvatarClicked: "",
		onBeforeAvatarClicked: "",
		onBeforeToggleOpen: "",
		onMessage1Clicked: "",
		onMessage2Clicked: "",
	},
	components: [
		{name: "displayArea", className: "clv-draweritem-displayArea", components: [
			{name: "displayDetails", className: "clv-drawerItem-displayDetails", onclick: "onDrawerItemClick", onmousehold: "onDisplayContentClickAndHold", components: [
				{layoutKind: enyo.HFlexLayout, components:[
					{name: "displayNm"},
					{name: "favoritesIcon", className: "clv-drawerItem-favoritesIcon", showing: false},
					{kind: enyo.HFlexBox, className: "rightAligned", components: [
						{name: "displayIcon4"},
						{name: "displayIcon3"},
						{name: "displayIcon2"},
						{name: "displayIcon1"},
					]},
				]},
				{layoutKind: enyo.HFlexLayout, components:[
					{name: "displayLbl", className: "clv-drawerItem-displayLbl clv-displayLbl-full"},
					{name: "displayVideoIcon", showing: false},
				]},
				{name: "displayLblRight", className: "clv-draweritem-displayLblRight"}
			]},
			{className: "clv-draweritem-avatar", onclick: "onAvatarClick",components: [
				{name: "img", kind: enyo.Image, className: "image-toggle-button-avatar-image"},
				{name: "toggleFrame", className: "avatar-frame unOpened"},
				{name: "pillCountLbl", className: "image-toggle-button-pillCountLbl", showing: false}
			]}
		]},
		{name: "HiddenDrawerItem2", kind: enyo.Drawer, open: true,	onOpenAnimationComplete: "onOpenAnimationComplete", components: [
			{kind: enyo.VFlexBox, components: [
				{name: "audioPlayer", kind: "AudioPlayer.DrawerItem", showing: false},
				{name: "streamingAudioPlayer", kind: "StreamingAudioPlayer.DrawerItem", showing: false}
			]},
		]},
		{name: "HiddenDrawerItem", kind: enyo.Drawer, open: true,	onOpenAnimationComplete: "onOpenAnimationComplete", components: [
			{name: "message1", className: "drawer-subitem wide", showing: false, onclick: "onMessage1Click"},
			{name: "message2", className: "drawer-subitem wide", showing: false, onclick: "onMessage2Click"},
			{name: "callOptions", kind:"VirtualRepeater", onSetupRow: "onCallOptionsGetItem", components:[
				{name:"drawerSubItem", kind: "DrawerSubItem", onClicked: "onDrawerSubItemClick", onSmsIconClicked: "onSmsIconClicked"},
				{className: "call-log-separator"},
			]}
		]},
	],

	create: function() {
		this.inherited(arguments);
	},
	
	setDisplayIcons: function(inVVM) {
		var icons = [];

		if (inVVM.read || inVVM.readMessage) {
			icons.push((inVVM.expired) ? 'voicemail-heard-icon expired_N_heard voicemail-heard-icon-DL' : 'voicemail-heard-icon heard voicemail-heard-icon-DL');
		}
		else {
			icons.push((inVVM.expired) ? 'voicemail-heard-icon expired voicemail-heard-icon-DL' : 'voicemail-heard-icon voicemail-heard-icon-DL');
		}
		if (inVVM.urgent) {
			icons.push('voicemail-heard-icon urgent voicemail-heard-icon-DL');
		}
		if (inVVM.private) {
			icons.push('voicemail-heard-icon private voicemail-heard-icon-DL');
		}
		if (icons) {
			var icon;
			for (var i = 0; i < icons.length; i++){
				if (icon = icons[i]) {
					switch (i) {
						case 0:
							this.$.displayIcon1.setClassName(icon);
							break;
						case 1:
							this.$.displayIcon2.setClassName(icon);
							break;
						case 2:
							this.$.displayIcon3.setClassName(icon);
							break;
						case 3:
							this.$.displayIcon4.setClassName(icon);
							break;
					}
				}
				else {
					break;
				}
			}
		}
	},

	createDrawerItem: function(vvm, personData) {
		// this.$.vvmlist.$.list.prepareRow(inIndex);

		if (vvm.listName === undefined) {
			vvm.listName = ((vvm.from.name) ? vvm.from.name : enyo.application.Utils.FormatPhoneNumber(vvm.from.addr));
		}
		if (vvm.listLabel === undefined) {
			vvm.listLabel = enyo.application.Utils.getDurationString(vvm.duration);
		}
		if (vvm.listContent === undefined) {
			vvm.listContent = enyo.application.Utils.formatShortTime(new Date(vvm.timestamp));
		}
		if (vvm.icons === undefined) {
			this.setDisplayIcons(vvm);
			vvm.icons = true;
		}

		var favPerson = vvm.from.personId && enyo.application.Cache.favPersonsCache.getFavoritePerson(vvm.from.personId);
		if (favPerson) {
			this.$.favoritesIcon.setShowing(true);
			if (vvm.listName.length > 21) {
				this.$.displayNm.setClassName("clv-drawerItem-truncated-displayNm");
			} else {
				this.$.displayNm.setClassName("");
			}
		} else {
			this.$.favoritesIcon.setShowing(false);
			this.$.displayNm.setClassName("clv-drawerItem-displayNm");
		}

		if (personData) {
			this.$.img.setSrc(personData.listPhotoPath);
		} else {
			this.$.img.setSrc("./images/list-avatar-default.jpg");
		}

		this.$.displayNm.setContent(vvm.listName);
		this.$.displayLbl.setContent(vvm.listLabel);
		this.$.displayLblRight.setContent(vvm.listContent);
		// this.$.img.setSrc((vvm.listPhotoPath && vvm.listPhotoPath != "") ? vvm.listPhotoPath : "./images/list-avatar-default.jpg");
		this.$.displayDetails.setClassName((vvm.read || vvm.readMessage) ? 'clv-drawerItem-displayDetails' : 'clv-drawerItem-displayDetails bold');
		this.setClassName("drawerItem");
		this.$.HiddenDrawerItem.setOpen(false);
		this.$.HiddenDrawerItem2.setOpen(false);
	},
	
	createDrawerSubItems: function(inVVM, bToggle) {
		if (inVVM.item) {
			return;
		}
		inVVM.item = true;

		this.callOptionsDataArray = [];

		if (inVVM.phoneNumbers) {
			var nPhone = inVVM.phoneNumbers.length;
			var nPhoneIndex = 0;

			while (nPhoneIndex < nPhone) {
				var phoneNumber = inVVM.phoneNumbers[nPhoneIndex];
				this.createPhoneSubItem(inVVM, phoneNumber, DrawerSubItemAction.DialPhoneNumber, phoneNumber.value);
				nPhoneIndex++;
			}
		}
		
		// Show "view contact" or "add to contact"
		this.callOptionsDataArray.push({
			'itemText': inVVM.from.personId ? $L("View Contact") : $L("Add to Contacts"),
			'clickAction': inVVM.from.personId ? DrawerSubItemAction.ViewContact : DrawerSubItemAction.AddToContacts,
			'showSMSIcon': false,
			'personId': inVVM.from.personId ? inVVM.from.personId : "",
			});

		this.$.callOptions.render();
	},

	createPhoneSubItem: function(inVVM, inAddress, inAction, inRawPhoneNumber) {		
		this.callOptionsDataArray.push({
			'phoneNum': (inAction === DrawerSubItemAction.DialPhoneNumber) ? inAddress: undefined,
			'ims': (inAction === DrawerSubItemAction.DialSkypeIms) ? inAddress: undefined,
			'showSMSIcon': true,
			'clickAction': inAction,
			'rawPhoneNumber': inRawPhoneNumber,
			'personId': inVVM._id});
	},

	createDrawerSubItems2: function(inVVM) {
		if (inVVM.item2) {
			return;
		}
		inVVM.item2 = true;

		if (inVVM.service === "type_skype") {
			this.$.audioPlayer.setShowing(false);
			this.$.streamingAudioPlayer.setShowing(true);

			this.$.streamingAudioPlayer.fromUsername = inVVM.from.addr;
			this.$.streamingAudioPlayer.timestamp = inVVM.timestamp;
			this.$.streamingAudioPlayer.duration = inVVM.duration;
			this.$.streamingAudioPlayer.service = inVVM.service;
			this.$.streamingAudioPlayer.render();
		}
		else {
			this.$.audioPlayer.setShowing(true);
			this.$.streamingAudioPlayer.setShowing(false);

			this.$.audioPlayer.audioSize = inVVM.size;
			this.$.audioPlayer.audioPath = inVVM.audioPath;
			this.$.audioPlayer.duration = inVVM.duration;
			this.$.audioPlayer.render();

			this.$.audioPlayer.addEventListener('played', enyo.bind(this, "handlePlayed", 0));
			this.$.audioPlayer.addEventListener('playbackended', enyo.bind(this, "handlePaused", 0));
		}
	},

	onDrawerItemClick: function(inSrc, inEvent) {
		if (this.doDrawerItemClicked(inEvent)) {
			// if drawer 1 opened, then close all
			if (this.$.HiddenDrawerItem2.getOpen() || this.$.HiddenDrawerItem.getOpen()) {
				this.toggleOpen(inEvent.rowIndex, "close");
			}
			// if drawers are closed, then open 2
			else {
				this.toggleOpen(inEvent.rowIndex, "halfopen");
				this.$.audioPlayer.onPlayPause();
			}
		}
	},

	onDisplayContentClickAndHold: function(inSrc, inEvent) {
		this.doDisplayContentClickedAndHeld(inEvent);
	},

	onAvatarClick: function(inSrc, inEvent) {
		if (/*inEvent.rowIndex != this.curItemIndex &&*/ !this.$.HiddenDrawerItem.getOpen()) {
			this.doBeforeAvatarClicked(inEvent.rowIndex);
			this.toggleOpen(inEvent.rowIndex, "fullopen");
		} else {
			this.toggleOpen(inEvent.rowIndex, "close");
		}
	},

	toggleOpen: function(inIndex, inOpen) {
		if (inIndex < 0) {
			return;
		}
		this.animationCount = 1; // animationCount && onOpenAnimationComplete is a work-around provided by fmwk team to fix the jerky scrolling issue after a item toggles

		this.doBeforeToggleOpen(inIndex, inOpen);

		if (inOpen === "fullopen" || inOpen === "halfopen") {
			if (inOpen === "fullopen") this.$.HiddenDrawerItem.setOpen(true);
			this.$.HiddenDrawerItem2.setOpen(true);
		}
		else {
			// this.$.vvmlist.$.list.prepareRow(inIndex);
			if (this.$.HiddenDrawerItem.getOpen()) this.$.HiddenDrawerItem.toggleOpen();
			if (this.$.HiddenDrawerItem2.getOpen()) this.$.HiddenDrawerItem2.toggleOpen();
			this.$.audioPlayer.cleanup();
		}
		var o = this.$.HiddenDrawerItem.getOpen();
		this.$.toggleFrame.setClassName("avatar-frame " + ((o === true) ? "Opened" : "unOpened"));
		this.setSwipeable(o === false);
		// remember the last open drawer
		this.lastOpen = o ? this.curItemIndex : null;
		
		// areHistoryAndOptionsValid is a work-around to the framework calling the onGetItem of the VirtualRepeaters as the user scrolls through the list
		this.areHistoryAndOptionsValid = false;
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
});
