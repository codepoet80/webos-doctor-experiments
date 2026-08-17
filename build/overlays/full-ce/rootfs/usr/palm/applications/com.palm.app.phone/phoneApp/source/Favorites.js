enyo.kind({
	name: "Favorites",
	kind: enyo.VFlexBox,
	className: "phone-background favorites",
	components: [
		{name: "favoritesList", flex: 1, kind: "VirtualListEx", onSetupRow: "onSetupRow", onRefreshPending: "onRefreshPending", components: [
			// {name:"separator", showing: false},
			{name: "drawerItem", kind: enyo.SwipeableItem, 
				tapHighlight: true, onConfirm: "onDeleteConfirm",
				components: [
				{className: "icon", name:"mask", components: [
				{name: "photo", kind: "Control", className: "img"},
				{ kind: "Control", className: "mask"}
				]},
				{ name: "displayArea", layoutKind: enyo.HLayout, className: "clv-drawerItem-displayDetails", onclick: "onDrawerItemClicked", components: [
					{ name: "displayDetails",  style:"width: 96%", components: [
						{name: "displayNm", style: "height: 32px"},
						{name: "displayLbl", className: "drawerItem-favorites-displayLbl"}
					]},
					{name: "addFavoriteLbl", content: $L("+ Add Favorite"), canGenerate: false},
				]},
				{ name: "avatarArea", className: "favorite-draweritem-avatar", onclick: "onAvatarClick", components: [
					{name: "toggleFrame", className: "avatar-frame unOpened"},
					{name: "pillCountLbl", className: "image-toggle-button-pillCountLbl", showing: false}
				]},
				{name: "drawer", kind: enyo.Drawer, className: "favorites-hiddenDrawerItem hidden-drawer-item", open: false, showing: false, onOpenAnimationComplete: "onOpenAnimationComplete", components: [
					{name:"callOptions", kind:"VirtualRepeater", onSetupRow: "onCallOptionsGetItem", components:[
						{name: "drawerSubItem", className: "fav-drawer-subitem", components:[
							{name: "itemTextLbl", onclick: "onDrawerSubItemClick", className: "fav-drawer-subItem-itemTextLbl"},
							{layoutKind: enyo.HLayout, className: "drawer-subitem-itemTypeLblAndIcon", components: [
								{name: "phTypeLbl", className: "subitem-phType-label"},  
								{name: "smsIcon", className: "subitem-sms-icon", onclick: "onSmsIconClicked"}
							]},
						]},
						{name: "sepSubItem", className: "call-log-separator2"},
					]}
				]},
			]}
		]},
		{name: "PersonLinkList", kind: "com.palm.library.contactsui.personListDialog", onCancelClick: "closeFavAdd", onContactClick: "onContactClick", onListUpdated: enyo.nop, mode: "noFavoritesOnly", showFavStars: true, showSearchBar: true, showAddButton: false, showIMStatuses: false},
		{name: "dbGetFavorites", kind: "DbService", dbKind: "com.palm.person:1", method: "find", subscribe: true, onSuccess: "gotFavorites", onWatch: "gotFavorites"},
		{name:"openContactInEditModeService", kind:"PalmService", service: enyo.palmServices.application, method: "open"},
		{name:"unfavoritePersonService", kind:"PalmService", service: "palm://com.palm.service.contacts/", method: "unfavoritePerson"},
		{name:"favoritePersonPersonService", kind:"PalmService", service: "palm://com.palm.service.contacts/", method: "favoritePerson", subscribe: false, onSuccess: "setFavPersonResponse", onFailure: "setFavPersonResponse",},
		{name: "subItemActionHandler", kind: "SubItemActionHandler"},
	],
	
	create: function() {
		this.inherited(arguments);
		this.contacts =  [];
		enyo.job("job.Favs.initialize", enyo.bind(this, "_initialize"), 300);
	},
	destroy: function() {
		this.contacts =  null;
		this.inherited(arguments);
	},
	
	_initialize: function() {
		enyo.job.stop("job.Favs.initialize");

		// init with empty array to get the "Add Favorite..." to show up
		this.processResults();	
		this.getFavorites();
	},
	
	handleLaunch: function(params) {
		if (params && params.cleanup === undefined) {
			enyo.job("job.Favs.handleLaunch", enyo.bind(this, "_handleLaunch", params), 300);
		}
	},

	_handleLaunch: function(params) {
		enyo.job.stop("job.Favs.handleLaunch");
		if (this.refreshPending === true) {
			this.$.favoritesList.refresh();
		}
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
		this.getFavorites();
	},
	
	updateTimer: function() {
		this.clearUpdateTimer();

		this.ignoreResults = false;
		this.processResults();
	},
	
	gotFavorites: function(inSender, inResponse, inRequest) {
        if (inResponse.returnValue && inResponse.fired === true) {
			if (this.ignoreUpdateTimer === true) {
				this.ignoreUpdateTimer = false;
				this.getFavorites();
			} else {
				this.startUpdateTimer();
			}
			return;
        } else {	
            this.contacts = (inResponse && inResponse.results) || [];
			if (this.ignoreResults === true) {
				return;
			} else {
				this.processResults();
			}
        }
	},
	
	processResults: function() {
		// Ordering:
		// 1) Favorites with listIndex
		// 2) Then, favorites with default contact points
		// 3) Then, favorites with "Tap to add default"
		// 4) Then, favorites with "Tap to add number"
		this.contacts.sort(enyo.bind(this, function(a,b) {
			// TODO: This is logic from the older phone app, but is not working since we are using our own FavoritesAdd instead of the one coming from the Contact.UI
			//       Once we are using the Contact.UI library we can restore this logic and test it again.  In the meantime there is a temporary solution below.
			/*if ( a.listIndex === undefined && a.numContactPoints === 0 ) {
				return 1;
			} else if ( b.listIndex === undefined && b.numContactPoints === 0 ) {
				return -1;
			} else if ( a.listIndex === undefined && a.numContactPoints > 1 ) {
				return 1;
			} else if ( b.listIndex === undefined && b.numContactPoints > 1 ) {
				return -1;
			} else if ( a.listIndex === undefined ) {
				return 1;
			} else if ( b.listIndex === undefined ) {
				return -1;
			} else {
				return a.listIndex - b.listIndex;
			}*/
			// Beginning of temp solution, getDefaultPhNumSortValue is also part of the temp solution
			if (a.phoneNumbers.length === 0 && a.ims.length === 0) {
				return 1;
			} else {
				var aSortVal = this.getDefaultPhNumSortValue(a.phoneNumbers, a.ims);
				var bSortVal = this.getDefaultPhNumSortValue(b.phoneNumbers, b.ims);
				if (aSortVal === bSortVal) {
					return 0;
				} else {
					return (aSortVal > bSortVal) ? 1 : -1;
				}
			}
			return 0;
			// End of temp solution
		}));

		this.curItemIndex = undefined;
		this.lastOpen = null;

		var len = this.contacts.length;
		for (var i = 0; i < len; i++) {
			var c = this.contacts[i];
			if (this.curOpenItemId === c._id) {
				this.curItemIndex = i;
				this.lastOpen = i;
			}
		}
		
		this.contacts.push({'AddFav':true});

		if (this.$.favoritesList.getBounds().width > 0) {
			this.$.favoritesList.refresh();
		} else {
			this.onRefreshPending();
		}
	},
	
	getDefaultPhNumSortValue: function (phoneNumbers, ims) {	
		var nPhone = phoneNumbers.length;
		var nPhoneIndex = 0;

		while (nPhoneIndex < nPhone) {
			var phoneNumber = phoneNumbers[nPhoneIndex];
			if (phoneNumber.favoriteData["com.palm.app.phone"]) {
				return 0; 
			}
			nPhoneIndex++;
		}

		var imsLen = ims.length;
		var skypeImsCount = 0;
		for (var i = 0; i < imsLen; i++) {
			if (ims[i].type === "type_skype") {
				skypeImsCount++;
				if (ims[i].favoriteData["com.palm.app.phone"]) {
					return 0;
				}
			}
		}

		if ((nPhone + skypeImsCount) === 1) { // If there is no default ph# or skype ims set and there is at least a ph# or skype ims
			return 0;
		} else {
			return ((nPhone + skypeImsCount) > 1) ? 1 : 2;
		}
	},

	onSetupRow: function(inSrc, inIndex) {
		var contact = this.contacts[inIndex];
		if (contact) {
			if (contact.AddFav) {
				this.createAddFavoriteItem(inIndex);
			} else {
				this.createDrawerItem(contact, inIndex);
			}
			return true;
		}
	},

	createDrawerItem: function(c, inIndex) {
		// this.$.drawerItem.setClassName("FavoritesDrawerItem enyo-item enyo-swipeableitem");
			if(inIndex == 0)
				this.$.drawerItem.setClassName("enyo-first enyo-swipeableitem");
			else
			{
				this.$.drawerItem.setClassName("enyo-item enyo-swipeableitem");
				this.$.drawerItem.removeClass("enyo-first");
			}
		var displayName = enyo.string.removeHtml(enyo.application.Utils.PersonDisplayName(c)).unescapeHTML();
		if (displayName && displayName.length > 65) {
			this.$.displayNm.setClassName("clv-drawerItem-truncated-displayNm");							
		}
		this.$.displayNm.setContent(displayName);
		//this.$.displayNm.setContent(enyo.string.removeHtml(enyo.application.Utils.PersonDisplayName(c)).unescapeHTML());
		
		this.$.displayLbl.setContent(enyo.string.removeHtml(this.listDisplayLabel(c)).unescapeHTML());
		this.$.displayDetails.setShowing(true);
		this.$.avatarArea.setShowing(true);
		var imagePath = (c.photos.listPhotoPath) ? c.photos.listPhotoPath : "./images/list-avatar-default.png";
		this.$.photo.applyStyle("background-image", "url(" + imagePath + ");")
		// this.$.img.setSrc((c.photos.listPhotoPath) ? c.photos.listPhotoPath : "./images/list-avatar-default.png");
		// this.$.drawerItem.$.confirm.setClassName("FavDrawerItem-fit"); // Not sure if this will work....
		this.areHistoryAndOptionsValid = (this.curOpenItemId === c._id);
		this.$.toggleFrame.setClassName("avatar-frame " + ((this.areHistoryAndOptionsValid === true) ? "Opened" : "unOpened"));
		this.$.drawer.setOpen(this.areHistoryAndOptionsValid);
		this.$.drawer.setShowing(this.areHistoryAndOptionsValid);
		this.$.mask.show();
		this.$.addFavoriteLbl.canGenerate = false;

		// If the currently opened contact is the 1st item in the list then the CallHistory needs to be refreshed
		if (this.areHistoryAndOptionsValid) {
			this.createDrawerSubItems(c, false);
			this.$.drawerItem.setSwipeable(false);
		} else {
			this.$.drawerItem.setSwipeable(true);
		}
		// if (enyo.application.isTablet) {
		// 		this.$.separator.setShowing(true);
		// 	}
	},

	createAddFavoriteItem: function(inIndex) {
		if (enyo.application.isTablet) {
			// this.$.separator.setShowing(true); 
			// this.$.drawerItem.setClassName("enyo-item enyo-swipeableitem add-favorite-item");
					if(inIndex == 0)
						this.$.drawerItem.setClassName("enyo-first enyo-swipeableitem add-favorite-item");
					else
					{
						this.$.drawerItem.setClassName("enyo-item enyo-swipeableitem add-favorite-item");
						this.$.drawerItem.removeClass("enyo-first");
					}
		} else {
			this.$.drawerItem.setClassName("add-favorite-item enyo-item enyo-swipeableitem");
		}
		this.$.drawerItem.setSwipeable(false);
		this.$.addFavoriteLbl.canGenerate = true;
		this.$.mask.hide();
		this.$.displayDetails.setShowing(false);
		this.$.avatarArea.setShowing(false);
		
		this.areHistoryAndOptionsValid = false;
		this.$.drawer.setOpen(false);
		this.$.drawer.setShowing(false);
		
	},
	
	createDrawerSubItems: function(inContact, bToggle) {
		this.callOptionsDataArray = [];

        var nPhone = inContact.phoneNumbers.length;
        var nPhoneIndex = 0;

        while (nPhoneIndex < nPhone) {
			var phoneNumber = inContact.phoneNumbers[nPhoneIndex];
			this.createPhoneSubItem(inContact, phoneNumber, DrawerSubItemAction.DialPhoneNumber, phoneNumber.value);
			nPhoneIndex++;
        }

		// Offer a call row for every IM whose service is an enabled PHONE-capable transport
		// (whatsapp/telegram/signal/...), dialing via that IM's own transport.
		var skypeIMs = [];
		var len = inContact.ims.length;
		var callableTypes = enyo.application.CallSynergizer.getCallableImTypes();
		for (var i = 0; i < len; i++) {
			if (callableTypes.indexOf(inContact.ims[i].type) !== -1) {
				var ims = inContact.ims[i];
				this.createPhoneSubItem(inContact, ims.value, DrawerSubItemAction.DialSkypeIms, ims.value, ims.type);
				skypeIMs.push(ims);
			}
		}
		
		//note: because contact library does not have picker library ready, we work around to get rid
		//of the choice of "change default number" as clicking doen't do anything	
		/*/temp solution for DFISH-24007, we should have default number set but if we don't
		//like in the error case DFISH-24007, don't push to the array
		//we need to revisit to see if this fix is necessary
		var defaultContactPoint = enyo.application.Utils.getDefaultContactPoint(inContact, true);
		if (defaultContactPoint){
			if ((inContact.phoneNumbers.length + skypeIMs.length) > 1) {
				this.callOptionsDataArray.push({
					'itemText': $L("Change Default Number"),
					'clickAction': DrawerSubItemAction.ChangeDefaultNumber,
					'showSMSIcon': false,
					'person': inContact,
				});
			}
		}*/
		
		this.callOptionsDataArray.push({
			'itemText': $L("View Contact"),
			'clickAction': DrawerSubItemAction.ViewContact,
			'showSMSIcon': false,
			'personId': inContact._id,
			});
		
		this.areHistoryAndOptionsValid = true;
		this.$.callOptions.render();
		if (bToggle !== false) {
			this.toggleOpen();
		}
	},
	
	createPhoneSubItem: function(inContact, inAddress, inAction, inRawPhoneNumber, inTransport) {		
		this.callOptionsDataArray.push({
			'phoneNum': (inAction === DrawerSubItemAction.DialPhoneNumber) ? inAddress: undefined,
			'ims': (inAction === DrawerSubItemAction.DialSkypeIms) ? inAddress: undefined,
			'showSMSIcon': true,
			'clickAction': inAction,
			'rawPhoneNumber': inRawPhoneNumber,
			'personId': inContact._id,
			'transport': inTransport
			});

	},
	
	listDisplayLabel: function(contact) {
		var defaultContactPoint = enyo.application.Utils.getDefaultContactPoint(contact, true);
		if (defaultContactPoint) {
			return defaultContactPoint.contactPointAddress;
		}
		else {
			return (contact.phoneNumbers.length === 0) ? $L("Tap to add number") : $L("Tap to add default");
		}
	},
	
	addFavorite: function() {
		if (enyo.application.isTablet){
			this.$.PersonLinkList.openAtCenter();
		} else {
			enyo.application.UI.enter('favoritesadd', {});
			this.ignoreUpdateTimer = true; // Refresh the list right away		
		}
	},
	
	closeFavAdd: function(inSender, inEvent) {
enyo.log("Favorite add dialog cancel click called---------------------------------");		
		this.$.PersonLinkList.close();
	}, 
	
	onContactClick: function(inSender, person) {	
		this.person = person;
		this.$.favoritePersonPersonService.call({
			'personId': person._id
		});
		
		this.$.PersonLinkList.close();
	},		

	getFavorites: function() {
		var q = {
			where: [{"prop":"favorite","op":"=","val":true}],
			orderBy: "sortKey"
		};
		this.$.dbGetFavorites.call({query: q});
	},

	onDrawerItemClicked: function(inDrawerItem, inEvent) {	
		var itemData = this.contacts[inEvent.rowIndex];
		if (itemData.AddFav) {
			this.addFavorite();
		} else {
			// itemData is a contact object
			var defaultContactPoint = enyo.application.Utils.getDefaultContactPoint(itemData, false);
			if (defaultContactPoint) {
				enyo.application.CallSynergizer.dial(defaultContactPoint.contactPointAddress, undefined, undefined, defaultContactPoint.contactPointTransport, itemData._id, true);
			} else if (itemData.phoneNumbers.length === 0 && itemData.ims.length === 0) {
				// Handling "Tap to add number", opening the contacting in edit mode...
				this.$.openContactInEditModeService.call({
					id: "com.palm.app.contacts",
					params: {"person": itemData, "launchType":"editContact"}
				});
			} else {
				if (enyo.application.isTablet) {
					this.$.PersonLinkList.openAtCenter();
				}
				else {
					enyo.application.UI.enter('favoritesadd', {
						person: itemData
					});
				}
			}
		}
	},
	
	onAvatarClick: function(inSrc, inEvent) {
		this.$.favoritesList.prepareRow(inEvent.rowIndex);
		if (inEvent.rowIndex != this.curItemIndex && !this.$.drawer.getOpen()) {
			this.curItemIndex = inEvent.rowIndex;
			this.curOpenItemId = this.contacts[inEvent.rowIndex]._id;
			this.createDrawerSubItems(this.contacts[inEvent.rowIndex]);
		} else {
			this.$.favoritesList.prepareRow(inEvent.rowIndex);
			if (this.$.drawer.getOpen() === true) { // Checked needed for when the data refreshes
				this.$.drawer.toggleOpen();
				this.$.toggleFrame.setClassName("avatar-frame unOpened");
				this.animationCount++;
				this.curItemIndex = -1;
				this.curOpenItemId = null;
				this.lastOpen = null;
				this.areHistoryAndOptionsValid = false;
			} else {
				this.toggleOpen();
			}
			this.$.drawerItem.setSwipeable(true);
		}
		
		enyo.stopEvent(inEvent);
	},
	
	toggleOpen: function() {	
		this.animationCount = 1; // animationCount && onOpenAnimationComplete is a work-around provided by fmwk team to fix the jerky scrolling issue after a item toggles
		// toggle and remember state
		this.$.drawer.toggleOpen();
		var o = this.$.drawer.getOpen();
		this.$.toggleFrame.setClassName("avatar-frame " + ((o === true) ? "Opened" : "unOpened"));
		// ("opened?" + o);
		this.$.drawer.setShowing(true);
		this.$.drawerItem.setSwipeable(o === false);
		// close the last drawer
		if (this.lastOpen != null && this.lastOpen != this.curItemIndex) {
			if (this.$.favoritesList.prepareRow(this.lastOpen)) {
				this.animationCount++;
			}
			this.$.drawer.setOpen(false);
			this.$.drawer.setShowing(false);
			this.$.drawerItem.setSwipeable(true);
			this.$.toggleFrame.setClassName("avatar-frame unOpened");
		}
		// remember the last open drawer
		this.lastOpen = o ? this.curItemIndex : null;
		
		// areHistoryAndOptionsValid is a work-around to the framework calling the onGetItem of the VirtualRepeaters as the user scrolls through the list
		this.areHistoryAndOptionsValid = false;
	},
	
	onOpenAnimationComplete: function() {
		this.animationCount--;
		if (!this.animationCount) {
			this.$.favoritesList.refresh();
		}
	},
	
	onConfirmShowingChanged: function(inDrawerItem, inConfirmShowing) {
		// Workaround for problem when inConfirmShowing is true but the drawer item's state is opened (CFISH-3921)
		if (inConfirmShowing === true && inDrawerItem.getOpen() === true) {
			inDrawerItem.setConfirmShowing(false);
		}
	},
	
	onDeleteConfirm: function(inSrc, inIndex) {
		this.ignoreUpdateTimer = true; // Refresh the list right away
		this.$.unfavoritePersonService.call({
			'personId': this.contacts[inIndex]._id
		});
	},
	
	onDrawerSubItemClick: function(inSrc, inEvent) {
		this.$.subItemActionHandler.executeAction(this.callOptionsDataArray[inEvent.rowIndex]);
		enyo.stopEvent(inEvent);
	},
	
	onSmsIconClicked: function(inSrc, inEvent) {
		this.$.subItemActionHandler.executeSendSMS(this.callOptionsDataArray[inEvent.rowIndex]);
		enyo.stopEvent(inEvent);
	},
	
	onCallOptionsGetItem: function(inSrc, inIndex) {
		if (this.callOptionsDataArray === undefined || this.areHistoryAndOptionsValid !== true) {
			return;
		} else if (inIndex < this.callOptionsDataArray.length) {
			var callOptionData = this.callOptionsDataArray[inIndex];
			this.$.callOptions.prepareRow(inIndex);

			if (callOptionData.phoneNum) {
				this.$.itemTextLbl.setContent(enyo.application.Utils.FormatPhoneNumber(callOptionData.phoneNum.value));
				this.$.phTypeLbl.setContent(enyo.application.Utils.getPhoneNumberType(callOptionData.phoneNum.type));
			} else if (!callOptionData.phoneNum && !callOptionData.ims) {
				this.$.itemTextLbl.setContent(callOptionData.itemText);
				this.$.phTypeLbl.setContent("");
			} else if (callOptionData.ims) {
				this.$.itemTextLbl.setContent(callOptionData.ims);
				this.$.phTypeLbl.setContent(enyo.application.Utils.contactPointLabels["type_skype"][0]);
			} // else { 
			 // 				 enyo.error("opened?" + o);("");
			 // 				return true;
			 // 			}
			
			this.$.smsIcon.setShowing(callOptionData.showSMSIcon);
			this.$.itemTextLbl.setStyle((callOptionData.showSMSIcon !== true) ? "width: 100%" : ""); // To handle long strings like "Change Default Number"

			if (inIndex === (this.callOptionsDataArray.length - 1)) {
				this.$.drawerSubItem.setStyle("border-bottom-left-radius: 7px;border-bottom-right-radius: 7px;");
				this.$.sepSubItem.setShowing(false);
			} else {
				this.$.drawerSubItem.setStyle("");
				this.$.sepSubItem.setShowing(true);
			}

			return true;
		}
	},
	
	onRefreshPending: function () {
		this.refreshPending = true;
	}
});

enyo.kind({
	name: "VirtualListEx",
	kind: enyo.VirtualList,
	events: {
		onRefreshPending: ""
	},
	resizeHandler: function () {
		// Override the logic in DbList's(VirtualList) resizeHandler since it is possible for the width to be 0 in screen transtions (e.g. Dialpad to Favorites)
		if (this.getBounds().width > 0) {
			this.inherited(arguments);
		} else {
			this.doRefreshPending();
		}
	}
});

String.prototype.unescapeHTML = function() {
	return this.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
};
