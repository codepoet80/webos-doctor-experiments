DrawerSubItemAction = {
	NoAction: 0,
	ViewContact: 1,
	AddToContacts: 2,
	DialPhoneNumber: 3,
	DialSkypeIms: 4,
	ChangeDefaultNumber: 5,
	SendSMS: 6,
	DialVoicemail: 7,
	CustomAction: 8
}

enyo.kind({
	name: "DrawerSubItem",
	kind: enyo.Item,
	className: "drawer-subitem minHeight",
	tapHighlight: true,
	published: {
		phoneNumber: undefined,
		ims: undefined,
		itemText: "",
		displaySMSIcon: false,
		action: DrawerSubItemAction.NoAction,
		rawPhoneNumber: "",
		service: undefined,
		personId: undefined,
		person: undefined,
	},
	events: {
		onClicked: "",
		onSmsIconClicked: ""
	},
	components: [
		// Widgets
		{onclick: "onClick", components:[ // width:82% so that there is space for long text in phTypeLbl like "ASSISTANT"
			{name: "itemTextLbl", kind: enyo.Label, className: "",},
		]},
		{layoutKind: enyo.HLayout, className: "drawer-subitem-itemTypeLblAndIcon", components: [
			{name: "phTypeLbl", className: "subitem-phType-label"},  
			{name: "smsIcon", className: "subitem-sms-icon", onclick: "onSMSIconClicked", showing: true}
		]}
	],
	onclick: "onClick",

	create: function() {
		this.inherited(arguments);
		
		this.phoneNumberChanged();
		this.imsChanged();
		this.itemTextChanged();
		this.displaySMSIconChanged();
	},
	
	phoneNumberChanged: function() {
		if (this.phoneNumber) {
			this.$.itemTextLbl.setContent(enyo.application.Utils.FormatPhoneNumber(this.phoneNumber.value));
			this.$.phTypeLbl.setContent(enyo.application.Utils.getPhoneNumberType(this.phoneNumber.type));
		}
	},
	
	imsChanged: function() {
		if (this.ims) {
			// webOS: an IM row is no longer always Skype. Format phone-shaped ids (WhatsApp/Signal are
			// +E.164) and label the row by the IM's OWN service (this.service == type_whatsapp/... set
			// from callOptionData.transport), falling back to the generic "IM" label.
			this.$.itemTextLbl.setContent(enyo.application.Utils.formatImAddress(this.ims));
			var lbl = enyo.addressing.fetchLabelFromType("ims", this.service) || enyo.addressing.fetchLabelFromType("ims", "type_default");
			this.$.phTypeLbl.setContent(lbl);
		}
	},

	itemTextChanged: function() {
		if (!this.phoneNumber && !this.ims) {
			this.$.itemTextLbl.setContent(this.itemText);
			this.$.phTypeLbl.setContent("");
		}
	},

	displaySMSIconChanged: function() {
		this.$.smsIcon.setShowing(this.displaySMSIcon);
	},

	mouseholdHandler: function(inSender, inEvent) {
		this.setHeld(true);
		this.stateChanged("held");
		inEvent.stopPropagation();
	},

	mousereleaseHandler: function(inSender, inEvent) {
		this.setHeld(false);
		this.stateChanged("held");
		inEvent.stopPropagation();
	},
	
	onClick: function(inSender, inEvent) {
		this.doClicked(inEvent);
		enyo.stopEvent(inEvent);
	},
	
	onSMSIconClicked: function(inSender, inEvent) {
		this.doSmsIconClicked(inEvent);
		enyo.stopEvent(inEvent);
	},
});

// TODO: Temporary until VVM is converted to a DbList
enyo.kind({
	name: "DrawerVVMSubItem",
	kind: enyo.Item,
	className: "drawer-subitem minHeight",
	tapHighlight: true,
	published: {
		phoneNumber: undefined,
		ims: undefined,
		itemText: "",
		displaySMSIcon: false,
		action: DrawerSubItemAction.NoAction,
		rawPhoneNumber: "",
		service: undefined,
		personId: undefined,
		person: undefined,
	},
	events: {
		onClicked: "",
		onSmsIconClicked: ""
	},
	components: [
		// Widgets
		{onclick: "onItemClick", style: "width:82%;height:100%;padding-top:3px;padding-bottom:2px", components:[ // width:82% so that there is space for long text in phTypeLbl like "ASSISTANT"
			{name: "itemTextLbl", kind: enyo.Label, className: "drawer-subItem-itemTextLbl",},
		]},
		{layoutKind: enyo.HLayout, className: "drawer-subitem-itemTypeLblAndIcon", components: [
			{name: "phTypeLbl", className: "subitem-phType-label"},  
			{name: "smsIcon", className: "subitem-sms-icon", onclick: "onSMSClick", showing: true}
		]}
	],

	create: function() {
		this.inherited(arguments);
		
		this.phoneNumberChanged();
		this.imsChanged();
		this.itemTextChanged();
		this.displaySMSIconChanged();
	},
	
	phoneNumberChanged: function() {
		if (this.phoneNumber) {
			this.$.itemTextLbl.setContent(enyo.application.Utils.FormatPhoneNumber(this.phoneNumber.value));
			this.$.phTypeLbl.setContent(enyo.application.Utils.getPhoneNumberType(this.phoneNumber.type));
		}
	},
	
	imsChanged: function() {
		if (this.ims) {
			// webOS: label/format an IM row by its own service, not a hardcoded Skype (see DrawerSubItem).
			this.$.itemTextLbl.setContent(enyo.application.Utils.formatImAddress(this.ims));
			var lbl = enyo.addressing.fetchLabelFromType("ims", this.service) || enyo.addressing.fetchLabelFromType("ims", "type_default");
			this.$.phTypeLbl.setContent(lbl);
		}
	},

	itemTextChanged: function() {
		if (!this.phoneNumber && !this.ims) {
			this.$.itemTextLbl.setContent(this.itemText);
			this.$.phTypeLbl.setContent("");
		}
	},

	displaySMSIconChanged: function() {
		this.$.smsIcon.setShowing(this.displaySMSIcon);
	},

	onItemClick: function() {
		this.onClicked(this);
	},
	
	onSMSClick: function() {
		this.onSmsIconClicked(this);
	}
});

enyo.kind({
	name: "CallHistorySubItem",
	kind: enyo.HFlexBox,
	className: "drawer-subitem call-history-subitem",
	published: {
		callHistory: null,
	},
	components: [
		{kind: enyo.HFlexBox, className: "drawer-subItem-itemTextLbl", onclick: "stopEvent", onmousedown: "stopEvent", components: [
			{name: "itemPrefixTextLbl"},
			{name: "itemTextLbl", className: "drawer-subItem-itemFullAddrLbl"},
		]},
		{name: "itemCallTypeAndTime", kind: enyo.HFlexBox, className: "clv-draweritem-displayLblRightSub", onclick: "stopEvent", onmousedown: "stopEvent", components: [
			{name: "callTypeIcon", className: "call-log-icon"},   
			{name: "callTimeLbl", className: "drawer-subitem-calltimelbl", style: "width: 62px;"},  
		]}
	],

	create: function() {
		this.inherited(arguments);

		this.callHistoryChanged();
	},

	callHistoryChanged: function() {
		if (this.callHistory != null) {
			var addrData;
			if (this.callHistory.type == "outgoing") {
				addrData = this.callHistory.to[0];
			}
			else {
				addrData = this.callHistory.from;
			}

			// webOS: a VoIP/IM call names its network (WhatsApp/Telegram/...) via callNetworkName; a
			// cellular call keeps the number's own type (Mobile/Home/...). The old TRANSPORTS.SKYPE slot
			// is gone, so branch on "is this a non-cellular transport" instead of hard-coding Skype.
			var svc = addrData.service;
			var isVoip = svc && svc !== enyo.application.CallSynergizer.TRANSPORTS.TIL && svc !== "com.palm.telephony";
			this.$.itemPrefixTextLbl.setContent(isVoip
				? enyo.application.Utils.callNetworkName(svc)
				: enyo.application.Utils.getPhoneNumberType(addrData.personAddressType));
			if (this.$.itemPrefixTextLbl.content.length > 0) {
				this.$.itemPrefixTextLbl.setClassName("drawer-subItem-itemPrefixTextLbl");
				this.$.itemTextLbl.setClassName("drawer-subItem-itemPartialAddrLbl");	
			}

			var durationStr = enyo.application.Utils.getDurationString(this.callHistory.duration);
			var phoneNumber;
			// Work-around since this is the only way for us to know if it is a IM address because we can't rely on personAddressType 100% of the time
			if  (isVoip && addrData.addr === addrData.normalizedAddr) {
				phoneNumber = addrData.addr;
			} else {
				phoneNumber = enyo.application.Utils.FormatPhoneNumber(addrData.addr);
			}

			if (phoneNumber.length === 0) {
				phoneNumber = addrData.addr;
			}

			this.$.itemTextLbl.setContent(enyo.application.Utils.formatChoice(
				$L("0>##{phNum} (#{durStr})|##{phNum}"),
				durationStr.length,
				{"phNum": phoneNumber, "durStr": durationStr}));

			this.$.callTypeIcon.setClassName(this.$.callTypeIcon.getClassName() + " " + this.callHistory.type);
			this.$.callTimeLbl.setContent(enyo.application.Utils.formatShortTime(new Date(this.callHistory.timestamp)));
		}
		else {
			this.$.itemTextLbl.setContent("");
		}
	},
	stopEvent: function(inSrc, inEvent) {
		enyo.stopEvent(inEvent);
	},
});

enyo.kind({
	name: "SubItemActionHandler",
	kind: enyo.Component,
	components: [
		{name:"launchContactsService", kind:"PalmService", service: enyo.palmServices.application, method: "launch"},
		{name:"addToContactsService", kind:"PalmService", service: enyo.palmServices.application, method: "open"},
		{name:"launchSMSService", kind:"PalmService", service: enyo.palmServices.application, method: "launch"}, 
		{name: "noVoicemailNumberPrompt", kind: "NoVoicemailNumberPrompt"}
	],

	executeAction: function(inData) {
		switch (inData.clickAction) {
			case DrawerSubItemAction.ViewContact:
				this.contactsLaunchWithId(inData.personId);
				break;
			case DrawerSubItemAction.AddToContacts:
				this.addToContacts(inData.rawPhoneNumber, inData.service);
				break;
			case DrawerSubItemAction.DialPhoneNumber:
				enyo.application.CallSynergizer.dial(inData.rawPhoneNumber, undefined, undefined, undefined, inData.personId, true);
				break;
			case DrawerSubItemAction.DialSkypeIms:
				// inData.transport carries the IM's own service (type_whatsapp/type_telegram/...);
				// CallSynergizer.dial() translates that serviceName to the account templateId.
				enyo.application.CallSynergizer.dial(inData.rawPhoneNumber, undefined, undefined, inData.transport, inData.personId, true);
				break;
			case DrawerSubItemAction.ChangeDefaultNumber:
				enyo.application.UI.enter('favoritesadd', {person:inData.person});
				break;
			case DrawerSubItemAction.DialVoicemail:
				var number = enyo.application.VoicemailService.getVoicemailNumber();
				if (number === undefined || number === null || number === "") {
					if(enyo.application.isTablet == true) {
						this.$.noVoicemailNumberPrompt.openAtCenter();
					} else {
						this.$.noVoicemailNumberPrompt.open(); // TODO: To be tested ...
					}
				}
				else {
					enyo.application.CallSynergizer.dial(number);
				}
				break;
			default:
				break; 
		}
	},

	// Resolve a transport/service value - which may already be an IM serviceName like "type_whatsapp"
	// (DialSkypeIms rows carry ims.type) or an account templateId like "com.palm.whatsapp" (call-log
	// rows carry address.service) - to its IM serviceName, or undefined for cellular/unset. Replaces
	// the old hard-coded "type_skype"/TRANSPORTS.SKYPE checks (TRANSPORTS.SKYPE doesn't exist, so those
	// always resolved false) with something that works for any current/future VoIP transport.
	_imServiceNameFor: function(transportOrService) {
		if ( !transportOrService || transportOrService === enyo.application.CallSynergizer.TRANSPORTS.TIL ) {
			return undefined;
		}
		if ( String(transportOrService).indexOf("type_") === 0 ) {
			return transportOrService;
		}
		var t = enyo.application.CallSynergizer.transports[transportOrService];
		return t && t.serviceName;
	},

	executeSendSMS: function(inData) {
		var composeParams = {};
		if ( inData.personId ) {
			composeParams.personId = inData.personId;
		}

		var imServiceName = this._imServiceNameFor(inData.transport);
		if ( imServiceName ) {
			composeParams.ims = [{value: inData.rawPhoneNumber, serviceName: imServiceName}];
		} else {
			composeParams.phoneNumbers = [{value: inData.rawPhoneNumber}];
		}

		this.$.launchSMSService.call({
			id: "com.palm.app.messaging",
			params: {
				compose: composeParams
			}
		});
	},

	contactsLaunchWithId: function(personId) {
		this.$.launchContactsService.call({
			id: "com.palm.app.contacts",
			params: {'id': personId}
		});
	},

	addToContacts: function(rawPhoneNumber, service) {
		var contact = {
			"id":"com.palm.app.contacts",
			"params":{"contact":{},"launchType":"pseudo-card", "test":"aa"}
		};
		var imServiceName = this._imServiceNameFor(service);
		if(imServiceName) {
			contact.params.contact["ims"] = [{"value":rawPhoneNumber,"type":imServiceName}];
		} else {
			contact.params.contact["phoneNumbers"] = [{"value":rawPhoneNumber}];
		}
		this.$.addToContactsService.call(contact);		
	}
});
