/*jslint white: true, onevar: true, undef: true, eqeqeq: true, plusplus: true, bitwise: true, 
regexp: true, newcap: true, immed: true, nomen: false, maxerr: 500 */
/*global ContactsLib, enyo, console, $L, com, $contactsui_path, PalmSystem, crb, PalmCall */

/*

!!!!!!! DO NOT USE THIS COMPONENT DIRECTLY IN YOUR CODE !!!!!!!!
IT IS A SUPERKIND OF DetailsDialog, which should be used instead.

*/
enyo.kind({
	name: "com.palm.library.contactsui.detailsInDialog",
	kind: "VFlexBox",
	className: "enyo-contacts-details",
	person: null,
	published: {
		personId: null,
		contact: null,
		showButtonsHideBar: true
	},
	events: {
		onEdit: "",
		onAddToExisting: "",
		onAddToNew: "",
		onDoneCreatingPersonObject: ""
	},
	components: [
		{ kind: "PalmService", service: "palm://com.palm.applicationManager/", components: [
			{name: "launchApp", method: "launch"},
			{name: "openApp", method: "open"},
			{name: "getDefaultMapApp", method: "listAllHandlersForUrl"}
		]},
		{name: "AllDetails", layoutKind: "VFlexLayout", showing: false, components: [
			{kind: "Control", components: [
				{kind: "HFlexBox", align: "center", components: [
					{name: "photo", kind: "Control", className: "icon", components: [
						{name: "photoImage", className: "img", kind: "Control"},
						{kind: "Control", className: "mask"}
					]},
					{name: "favIndicator", kind: "Control", className: "favorite", onclick: "toggleFavorite", showing: false},
					{kind: "Control", layoutKind: "VFlexLayout", className: "nameinfo", align: "start", pack: "justify", components: [
						{name: "title", className: "name"},
						{name: "nickname", className: "nickname", showing: false},
						{name: "desc", className: "position"}
					]},
					{name: "linkCounter", kind: "enyo.Button", toggling: true, showing: false, caption: "", className: "enyo-button-light profiles-button", 
						onclick: "linkedProfilesClick", onmousedown: "photoMousedown", onmouseup: "photoMouseup"}
				]}
			]}
		]},
		{name: "SelectAContact", kind: "VFlexBox", flex: 1, pack: "center", showing: true, style: "border-left:1px solid #a8a8a8;text-align: center; color: grey;", components: [
			{kind: "Spacer", flex: 2},
			{kind: "Image", src: "images/first-launch-contacts.png"},
			{content: crb.$L("Select a contact on the left to see more information."), style: "width:250px;margin:0 auto;"},
			{kind: "Spacer", flex: 5}
		]},
		{name: "skypeMenu", kind: "PopupSelect", onSelect: "onSkypeMenuSelect", onBeforeOpen: "onSkypeMenuBeforeOpen", onClose: "onSkypeMenuClose"},
		{kind: "Control", layoutKind: "VFlexLayout", className: "group", flex: 1, components: [
			{name: "SomeDetails", kind: "Scroller", flex: 1, horizontal: false, autoHorizontal: false, components: [
				{name: "phoneGroup", kind: "com.palm.library.contactsui.FieldGroup", onFieldClick: "phoneFieldClick", onGetActionIcon: "phoneGetActionIcon", onActionIconClick: "phoneActionIconClick"},
				{name: "emailGroup", kind: "com.palm.library.contactsui.FieldGroup", onFieldClick: "emailFieldClick"},
				{name: "imGroup", kind: "com.palm.library.contactsui.FieldGroup", onFieldClick: "imFieldClick", onGetFieldValue: "getImFieldValue", onShowArrow: "showImDropdownArrow"},
				{name: "addressGroup", kind: "com.palm.library.contactsui.FieldGroup", onGetFieldValue: "getAddressFieldValue", onFieldClick: "addressFieldClick"},
				{name: "urlGroup", kind: "com.palm.library.contactsui.FieldGroup", onFieldClick: "urlFieldClick"},
				{name: "notesGroup", kind: "com.palm.library.contactsui.FieldGroup", onGetFieldValue: "getNotesFieldValue"},
				{name: "moreDetailsGroup", kind: "com.palm.library.contactsui.FieldGroup", propertyName: "moredetails", onGetFieldValue: "getMoreDetailsValue"},
				{name: "ButtonsWrapper", className: "enyo-item enyo-last contacts-actions", components: [
					{kind: "Button", name: "addToNewButtonInline", caption: crb.$L("Add New Contact"), onclick: "addNewContactClick", showing: false},
					{kind: "Button", name: "addToExistingButtonInline", caption: crb.$L("Add To Existing"), onclick: "addToExistingClick", showing: false},
					{kind: "Button", name: "editButtonInline", caption: crb.$L("Edit Contact"), onclick: "editPerson", showing: false}
				], flex: 1, kind: "VFlexBox", showing: false}
			]}
		]}
	],
	create: function () 
	{
		this.inherited(arguments);

		if (this.showButtonsHideBar) { //shows either the chrome with buttons or inlines the buttons for in-dialog use. Triggered with this.showButtonsHideBar
			this.$.ButtonsWrapper.show();
		}
		
		this.personIdChanged();
	},
	launchContacts: function (params)
	{
		this.$.launchApp.call({
			id: "com.palm.app.contacts", 
			params: params
		});
	},
	addNewContactClick: function (inSender) 
	{
		this.launchContacts(
			{
				contact: this.contact.getDBObject(),
				launchType: "newContact",
				skipPrompt: true
			}
		);

		this.doAddToNew();
	},
	addToExistingClick: function (inSender) 
	{
		this.launchContacts(
			{
				person: this.person.getDBObject(),
				launchType: "addToExisting"
			}
		);

		this.doAddToExisting();
	},
	showDetails: function (show) 
	{
		this.$.AllDetails.setShowing(show);
		this.$.SelectAContact.setShowing(!show);
//		this.$.SomeDetails.scrollTo(0, 0);
	},
	contactChanged: function () 
	{
		 //inline buttons mode
		this.$.addToNewButtonInline.show();
		this.$.addToExistingButtonInline.show();
		this.$.editButtonInline.hide();
		

		this.$.linkCounter.setDepressed(false);

		this.person = ContactsLib.PersonFactory.createPersonDisplay(this.contact);
		this.personId = null;
		this.renderPerson();
	},
	personIdChanged: function () {
		var personFuture;

		 //inline buttons mode
		this.$.addToNewButtonInline.hide();
		this.$.addToExistingButtonInline.hide();
		this.$.editButtonInline.hide();   // webOS: Edit Contact now lives in the dialog chrome (DetailsDialog), not inline
		

		this.$.linkCounter.setDepressed(false);

		if (!this.personId)
		{
			this.showDetails(false);
			return;
		}
	
		personFuture = ContactsLib.Person.getDisplayablePersonAndContactsById(this.personId);
		personFuture.then(this, function (personFuture) {
			try {
				this.person = personFuture.result || {};
				this.renderPerson();  //TODO: move this back into try block
				if (enyo.windowParams && enyo.windowParams.launchType === "editContact") {
					this.doDoneCreatingPersonObject();
					enyo.windowParams = {}; //global
				}
			} catch (e) {
				enyo.log("person failed: " + e);
				this.showDetails(false);
				return;
			}
		});

	},
	reloadPerson: function () {
		this.personIdChanged();
	},
	renderPerson: function () 
	{
		if (!this.person)
		{
			return;
		}

		var photoFuture;
		this.$.title.setContent(this.person.displayName);
		this.$.desc.setContent(this.person.workInfoLine);
		this.$.nickname.setContent(this.getNickName(this.person));
		this.renderLinkDetails();

		this.$.moreDetailsGroup.setFields(this.getMoreDetailsFields());
		this.$.emailGroup.setFields(this.person.getEmails().getArray());
		this.$.phoneGroup.setFields(this.person.getPhoneNumbers().getArray());
		this.$.imGroup.getFieldTypeDisplay = this.imTypeDisplay;
		this.$.imGroup.setFields(this.person.getIms().getArray());
		this.refreshImLabelsWhenReady();
		this.$.addressGroup.setFields(this.person.getAddresses().getArray());
		this.$.urlGroup.setFields(this.person.getUrls().getArray());
		this.$.notesGroup.setFields(this.addTypeToNotes(this.person.getNotes().getArray()));

		photoFuture = this.person.getPhotos().getPhotoPath(ContactsLib.PersonPhotos.TYPE.LIST);
		photoFuture.then(this, function () {
			this.$.photoImage.applyStyle("background-image", "url(" + photoFuture.result + ");");
		});

//		this.$.favoriteBtn.setState("down", this.person.isFavorite() ? true : false);
		this.$.favIndicator.addRemoveClass("true", this.person.isFavorite() ? true : false);
		this.showDetails(true);
		this.adaptHeight();
	},
	// webOS: size the Contact Detail popup to its content instead of a fixed 520px. The flex chain
	// (contentBox -> wrapper -> detailsInDialog -> group -> Scroller) stays intact so nothing collapses;
	// we just set the contentBox height = header + min(rows, MAX). The flex:1 Scroller then fills exactly
	// that, so short contacts get a compact popup and long ones cap + scroll. Finally we re-center, since
	// Popup memoizes its size/position at open time (Popup.calcSize) and won't re-center on its own.
	// Fully guarded: any failure leaves the default fixed-height layout intact.
	adaptHeight: function () {
		var self = this;
		enyo.asyncMethod(this, function () { self.doAdaptHeight(0); });
	},
	doAdaptHeight: function (attempt) {
		var self = this;
		try {
			// contentBox is the fixed-height box in DetailsDialog (this.owner) that we shrink/grow.
			var dlg = this.owner;
			var box = dlg && dlg.$ && dlg.$.contentBox;
			if (!box || !box.applyStyle || !box.hasNode || !box.hasNode()) { return; }
			// Natural height of the rows = sum of the rendered FieldGroup nodes (each row is its own
			// natural height inside the scroller, unaffected by the scroller's flex fill).
			var groups = ["phoneGroup", "emailGroup", "imGroup", "addressGroup", "urlGroup", "notesGroup", "moreDetailsGroup"];
			var rows = 0, i, g, n;
			for (i = 0; i < groups.length; i += 1) {
				g = this.$[groups[i]];
				n = g && g.hasNode && g.hasNode();
				if (n) { rows += n.offsetHeight; }
			}
			var hdrNode = this.$.AllDetails && this.$.AllDetails.hasNode && this.$.AllDetails.hasNode();
			var header = (hdrNode && hdrNode.offsetHeight) || 0;
			// DOM not laid out yet -> retry a couple of times before giving up.
			if (rows <= 0 || header <= 0) {
				if (attempt < 4) { setTimeout(function () { self.doAdaptHeight(attempt + 1); }, 70); }
				return;
			}
			var MIN_ROWS = 60, MAX_ROWS = 380, PAD = 20;
			var scroller = Math.max(MIN_ROWS, Math.min(rows, MAX_ROWS));
			var boxH = header + scroller + PAD;
			box.applyStyle("height", boxH + "px");
			// Re-center the dialog now its content changed size (dlg is the DetailsDialog/ModalDialog).
			if (dlg.applyBoundsInfo) {
				enyo.asyncMethod(dlg, function () { this.applyBoundsInfo(); });
			}
		} catch (e) { /* never break the details view */ }
	},
	addTypeToNotes: function (array)
	{
		var i;
		for (i = 0; i < array.length; i += 1)
		{
			array[i].x_displayType = crb.$L("notes");
		}
		return array;
	},
	// returns the first one in the list that passes a truth test (iterator)
	detect: function (obj, iterator)
	{
		var result,
			i;														
		for (i in obj)
		{
			if (iterator.call(this, obj[i])) {
				result = obj[i];				 
				return result;
			}										 
		}									
		return result;						
	},
	getMoreDetailsFields: function ()
	{
		var array = [],
			// Note: getDisplayValue relies on Mojo.Format which we are not importing therefore we are using Utils.formatBirthday as an alternative
			birthday = com.palm.library.contacts.Utils.formatBirthday(this.person.getBirthday()),
			relations = this.person.getRelations().getArray(),
			spouse = this.detect(relations, function (relation) {
				return relation.getType() === ContactsLib.Relation.TYPE.SPOUSE;
			}),
			child = this.detect(relations, function (relation) {
				return relation.getType() === ContactsLib.Relation.TYPE.CHILD;
			});

		if (birthday)
		{
			array.push({"value": birthday, "x_displayType": crb.$L("BIRTHDAY")});
		}
		if (spouse)
		{
			array.push({"value": spouse.getDisplayValue(), "x_displayType": crb.$L("SPOUSE")});
		}
		if (child)
		{
			array.push({"value": child.getDisplayValue(), "x_displayType": crb.$L("CHILDREN")});
		}
		return array;

	},
	getNickName: function (inPerson) 
	{
		return inPerson.getNickname().getDisplayValue() || "";
	},
	emailFieldClick: function (inSender, inEvent, inField) {
		this.$.openApp.call(
			{
				target: "mailto:" + inSender.getFieldValue(inField)
			}
		);
	},
	onSkypeMenuSelect: function (inSender, inSelected)
	{
		if (inSelected.getValue() === "CHAT")
		{
			this.$.openApp.call({
				id: "com.palm.app.messaging", 
				params: {
					compose:
					{
						personId: this.personId,
						ims: [inSelected.field.getDBObject()]
					}
				}
			});
		}
		else if (inSelected.getValue() === "VOICE")
		{
			this.openPhoneApp(inSelected.inSender.getFieldValue(inSelected.field.getDBObject()), "com.palm.skype");
		}
		else if (inSelected.getValue() === "VIDEO")
		{
			this.openPhoneApp(inSelected.inSender.getFieldValue(inSelected.field.getDBObject()), "com.palm.skype", true);
		}
	},
	onSkypeMenuBeforeOpen: function () {
		this.$.skypeMenu.setItems(this.skypPopupItems);
	},
	onSkypeMenuClose: function () {
		this.skypPopupItems = [];
	},

	openPhoneApp: function (address, transport, video)
	{
		this.$.openApp.call({
			id: "com.palm.app.phone", 
			params: 
			{
				address: address,
				transport: transport,
				video: video
			}
		});
	},
	phoneActionIconClick: function (inSender, inEvent, inField)
	{
		this.$.openApp.call(
			{
				id: "com.palm.app.messaging",
				params: {
					compose:
					{
						personId: this.personId,
						phoneNumbers: [inField.getDBObject()]
					}
				}
			}
		);
	},
	phoneGetActionIcon: function () 
	{
		return $contactsui_path + "/images/btn_sms.png";
	},
	phoneFieldClick: function (inSender, inEvent, inField) {
		this.openPhoneApp(inSender.getFieldValue(inField), "com.palm.telephony");
	},
	// webOS: label each IM row with its real service (WhatsApp/Telegram/Signal/...) instead of the
	// generic "IM". FieldGroup renders inField.x_displayType; the framework leaves it "IM" for the
	// webOS "type_*" IM services, so resolve it here from the field's serviceName/type. Mirrors the
	// per-service labels the Contacts app card shows.
	// webOS: label each IM row by its real service (WhatsApp/Telegram/Signal/...) instead of the
	// generic "IM". FieldGroup renders whatever getFieldTypeDisplay returns; the stock version reads
	// the field's x_displayType, which the framework leaves "IM" for the webOS "type_*" IM services
	// (and IMAddress.x_displayType is a read-only getter, so it can't be overridden on the field).
	// So we override the imGroup's getFieldTypeDisplay to resolve the service from the field's type.
	// Fully guarded so it can never break the IM list (falls back to the original "IM" label).
	// webOS: format the IM row's VALUE like the Contacts card. WhatsApp/Signal IM ids are routable
	// phone forms (a WhatsApp JID "<phone>@s.whatsapp.net" or a bare +E164) -> show a formatted phone;
	// Telegram's "id<digits>" -> show the bare number. Display-only; the stored value is unchanged.
	// Mirrors com.palm.app.contacts PseudoDetailsInApp.getImFieldValue / phoneFromImAddress.
	getImFieldValue: function (inSender, inField) {
		var value = (inField && inField.value) || (inField && inField.getDisplayValue && inField.getDisplayValue()) || "";
		var dbo = (inField && inField.getDBObject && inField.getDBObject()) || null;
		var type = (dbo && dbo.type) || (inField && inField.getType && inField.getType()) || "";
		if (type === "type_telegram" && (/^id[0-9]+$/).test(value)) {
			return value.substring(2);
		}
		var phone = this.phoneFromImAddress(value, type);
		return phone || value;
	},
	phoneFromImAddress: function (address, serviceName) {
		var raw = String(address || "");
		if (serviceName === "type_gometa") { return ""; }
		var s = raw.toLowerCase();
		var at = s.indexOf("@");
		var isWaJid = (at !== -1) && (s.substring(at) === "@s.whatsapp.net");
		if (at !== -1 && !isWaJid) { return ""; }
		var bare = isWaJid ? s.substring(0, at) : s;
		if (/[a-z\-]/.test(bare)) { return ""; }
		var digits = bare.replace(/[^0-9]/g, "");
		if (digits.length < 7 || digits.length > 15) { return ""; }
		var phoneService = (serviceName === "type_whatsapp" || serviceName === "type_signal");
		var phoneShaped = isWaJid || /^\+?[0-9]{7,15}$/.test(raw);
		if (!phoneService && !phoneShaped) { return ""; }
		var e164 = "+" + digits;
		try {
			var numberObj = new enyo.g11n.PhoneNumber(e164);
			if (numberObj.subscriberNumber) {
				return (new enyo.g11n.PhoneFmt({style: "default"})).format(numberObj);
			}
		} catch (e) { /* fall through to plain e164 */ }
		return e164;
	},
	// The label comes from the SAME account-template data every messaging service already publishes
	// (loc_shortName/loc_name via listAccountTemplates) -- see refreshImLabelsWhenReady below --
	// rather than a hand-maintained map that has to be extended by hand for every new IM service.
	// The tiny static map is only a same-tick fallback for the instant before that fetch resolves.
	imTypeDisplay: function (inField) {
		var fallback = {
			type_whatsapp: "WhatsApp", type_telegram: "Telegram", type_signal: "Signal",
			type_gometa: "Facebook", type_discord: "Discord", type_teams: "Teams",
			type_googlechat: "Google Chat", type_irc: "IRC"
		};
		try {
			var dbo = (inField && inField.getDBObject && inField.getDBObject()) || {};
			var svc = dbo.serviceName || dbo.type;
			var dynamic = ContactsLib.IMAddress && ContactsLib.IMAddress._dynamicLabels;
			if (svc && ("" + svc).indexOf("type_") === 0) {
				return (dynamic && dynamic[svc]) || fallback[svc] || ("" + svc).replace(/^type_/, "");
			}
		} catch (e) { /* fall through to the stock label */ }
		return (inField && inField.x_displayType) || "";
	},
	// This dialog is shared framework code used from Phone/Messaging's own contact-lookup popups,
	// not just the Contacts app -- each app is a separate process/JS context, so whichever app opens
	// this dialog first needs to trigger its own copy of this fetch (com.palm.app.contacts'
	// ContactsApp.installDynamicIMLabels does the same thing for its own context, and both write to
	// the same ContactsLib.IMAddress fields, so whichever runs first "wins" and the other just
	// queues a callback). Re-renders this dialog's IM rows once the fetch resolves, guarded on
	// personId so a stale response can't overwrite whatever contact is showing by then.
	refreshImLabelsWhenReady: function () {
		var IMAddress = ContactsLib.IMAddress, self = this, personId;
		if (!IMAddress || IMAddress._dynamicLabelsReady) {
			return;
		}
		personId = this.person && this.person.getId && this.person.getId();
		IMAddress._dynamicLabelsCallbacks = IMAddress._dynamicLabelsCallbacks || [];
		IMAddress._dynamicLabelsCallbacks.push(function () {
			if (self.person && self.$.imGroup && self.person.getId && self.person.getId() === personId) {
				self.$.imGroup.setFields(self.person.getIms().getArray());
			}
		});
		if (IMAddress._dynamicLabelsInstalled) {
			return;
		}
		IMAddress._dynamicLabelsInstalled = true;
		IMAddress._dynamicLabels = IMAddress._dynamicLabels || {};
		PalmCall.call("palm://com.palm.service.accounts/", "listAccountTemplates", {"capability": "MESSAGING"}).then(this, function (future) {
			var results, map = {}, seen = {}, callbacks;
			try {
				results = future.result && future.result.results;
			} catch (e) { /* leave map empty, still mark ready so queued callbacks stop waiting */ }
			(results || []).forEach(function (tmpl) {
				(tmpl.capabilityProviders || []).forEach(function (cp) {
					if (cp && cp.capability === "MESSAGING" && cp.serviceName && !seen[cp.serviceName]) {
						seen[cp.serviceName] = true;
						map[cp.serviceName] = cp.loc_shortName || cp.loc_name || tmpl.loc_name || cp.serviceName;
					}
				});
			});
			IMAddress._dynamicLabels = map;
			IMAddress._dynamicLabelsReady = true;
			callbacks = IMAddress._dynamicLabelsCallbacks || [];
			IMAddress._dynamicLabelsCallbacks = [];
			callbacks.forEach(function (cb) {
				try { cb(); } catch (e2) { /* one bad callback shouldn't break the rest */ }
			});
		});
	},
	showImDropdownArrow: function (inSender, inType)
	{
		return (inType === ContactsLib.IMAddress.TYPE.SKYPE);
	},
	imFieldClick: function (inSender, inEvent, inField) {
		if (inSender.getFieldType(inField) === ContactsLib.IMAddress.TYPE.SKYPE)
		{
			// maxSkypeMenuXPosition is a work-around for DFISH-12977 (This should be handled by the fmwk)
			var	deviceDetails = PalmSystem && JSON.parse(PalmSystem.deviceInfo),
				maxSkypeMenuXPosition,
				orientation;

			this.skypPopupItems = [
				{caption: crb.$L("Chat"), value: "CHAT", field: inField, inSender: inSender},
				{caption: crb.$L("Voice Call"), value: "VOICE", field: inField, inSender: inSender},
				{caption: crb.$L("Video Call"), value: "VIDEO", field: inField, inSender: inSender}
			];

			if (deviceDetails) {
				orientation = enyo.getWindowOrientation();
				if (orientation === "up" || orientation === "down") {
					maxSkypeMenuXPosition = deviceDetails.screenWidth - (parseInt(this.$.skypeMenu.width, 10) + 28);
				} else if (orientation === "left" || orientation === "right") {
					maxSkypeMenuXPosition = deviceDetails.screenHeight - (parseInt(this.$.skypeMenu.width, 10) + 28);
				}
			}

			if (maxSkypeMenuXPosition && (inEvent.clientX > maxSkypeMenuXPosition)) {
				this.$.skypeMenu.openAt({left: maxSkypeMenuXPosition, top: inEvent.clientY});
			} else {
				this.$.skypeMenu.openAtEvent(inEvent);
			}

			return;
		}

		this.$.openApp.call(
			{
				id: "com.palm.app.messaging", 
				params: {
					compose:
					{
						personId: this.personId,
						ims: [inField.getDBObject()]
					}
				}
			}
		);
	},
	getAddressFieldValue: function (inSender, inField) {
		return inField.streetAddress;
	},

	getNotesFieldValue: function (inSender, inField) {
		// Don't call getDisplayValue since escaping of html & replacement of newlines to <br> tags is handled in the FieldGroup
		//return inField.getDisplayValue();
		return inField.getValue();
	},
	
/*
1. get maps app call: com.palm.applicationManager/listAllHandlersForUrl
2. return: { "subscribed": false, "url": "mapto:", "returnValue": true, "redirectHandlers": { "activeHandler": { "url": "^mapto:", "appId": "com.palm.app.maps", "index": 24, "tag": "system-default", "schemeForm": true, "appName": "Google Maps" } } }
3. default maps app call: {"id":"com.palm.app.maps","params":{"target":"maploc:666 HELL AVENUE, HELL, MD!!!!!"}
*/
	addressFieldClick: function (inSender, inEvent, inField) {
		this.$.openApp.call(
			{id: "com.palm.app.maps", params: { //TODO: this will need to change in the future to the system default - goog maps or carrier gps nav app
				address: "" + inSender.getFieldValue(inField)
			}}
		);
	},
	urlFieldClick: function (inSender, inEvent, inField) {
		this.$.openApp.call(
			{id: "com.palm.app.browser", params: {
				url: inSender.getFieldValue(inField)
			}}
		);
	},
	editPerson: function () 
	{
		this.launchContacts(
			{
				contact: this.person.getDBObject(),
				launchType: "editContact"
			}
		);

		this.doEdit();
	},
	toggleFavorite: function () {
		this.personShouldBeFavorite = ! this.person.isFavorite();

		//business logic that saves, changes appearance
//		this.$.favoriteBtn.setState("down", this.personShouldBeFavorite ? true : false);
		this.$.favIndicator.addRemoveClass("true", this.personShouldBeFavorite ? true : false);
		if (this.personShouldBeFavorite) {
			this.person.makeFavorite();
		} else {
			this.person.unfavorite();
		}

	},
	createContactDisplay: function () {
		return ContactsLib.ContactFactory.createContactDisplay();
	},

	// These are "overridden" by the Details scene
	photoMousedown: function () {
	},
	photoMouseup: function () {
	},
	linkContact: function (inPerson) {
	},
	linkedContactsChanged: function (inSender, inPerson) {
	},
	linkedProfilesClick: function () {
	},
	renderLinkDetails: function () {
		this.$.linkCounter.setShowing(false);
	}
});
