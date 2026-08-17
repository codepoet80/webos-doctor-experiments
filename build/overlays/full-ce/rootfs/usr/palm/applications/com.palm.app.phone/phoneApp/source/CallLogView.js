enyo.kind({
	name: "CallLogView",
	kind: enyo.VFlexBox,
	listType: "",
	components: [
		{name: "callLogList", flex: 1, kind: enyo.DbList, onSetupRow: "onSetupRow", onQuery: "onQuery", desc: true, components: [
			{name: "divider", kind: "Divider", showing: false},
			{name:"separator", className: "call-log-separator", showing: false},
			{	name: "drawerItem", style: "text-align:left;padding-top:5px;", kind: enyo.SwipeableItem, tapHighlight: true, onConfirm: "onDeleteConfirm",
				components: [
				{ name: "displayArea", className: "clv-draweritem-displayArea", components: [
					{ name: "displayDetails", kind: "CallLogEntry", onCallLogDrawerClick: "onDrawerItemClicked",  onCallLogAvatarClick: "onAvatarClick"}, 
				]},
				{ name: "HiddenDrawerItem",	kind: enyo.Drawer, open: false, onOpenAnimationComplete: "onOpenAnimationComplete", components: [
					{name:"callHistories", kind:"VirtualRepeater", className: "hidden-drawer-item01", onSetupRow: "onCallHistoriesGetItem", components:[
						{name:"callHistorySubItem", kind: "CallHistorySubItem", className: "clv-fonts-contents"}
					]},
					{name:"callOptions", className: "hidden-drawer-item", kind:"VirtualRepeater", onSetupRow: "onCallOptionsGetItem", components:[
						{name:"separator1", className: "call-log-separator2", showing: false},
						{name:"drawerSubItem", kind: "DrawerSubItem", onClicked: "onDrawerSubItemClick", className: "clv-fonts-contents", onSmsIconClicked: "onSmsIconClicked"},
						{name:"separator2", className: "call-log-separator2", showing: false},
					]}
				]},
			]},
			{name:"separator_last", className: "call-log-separator", showing: false},
			
		]},
		{name: "emptyCallHistoryBox", layoutKind: enyo.VFlexLayout, flex: 1, className:"empty-calllog-phone", showing: false, components: [
			{name: "emptyCallHistoryIcon", kind: enyo.Image, src: "../images/empty-calllog-phone.png", className: "empty-calllog-phone-icon"},
			{name: "emptyCallHistoryLabel"}
		]},
		{name: "callsDBAssistant", kind: "DBAssistant", onGotCallGroup: "onGotCallGroup", onGotCallHistory: "onGotCallHistory", onGotPerson: "onGotPerson"},
		{name: "subItemActionHandler", kind: "SubItemActionHandler"},
		{name: "personsCache", kind: "PersonsCache", onPersonCacheReady: "onPersonCacheReady"},
		{name: "dbCallGroupCount", kind: enyo.DbService, method: "find", dbKind: "com.palm.phonecallgroup:1", onSuccess: "onDbCallGroupCountSuccess", subscribe: true, reCallWatches: true},
		
	],
	create: function() {
		this.inherited(arguments);
		this.callHistoriesArray = [];
		if (this.listType === "missed") {
			this.$.emptyCallHistoryLabel.setContent($L("Your missed call history is empty"));
		} else {
			this.$.emptyCallHistoryLabel.setContent($L("Your call history is empty"));
		}
		
		this._getDbCallGroupCount();
	},
	destroy: function() {
		this.callOptionsDataArray = null;
		this.callHistoriesArray = null;
		this.inherited(arguments);
	},

	scrollToTop: function(inIgnorePrevState) {
		if (inIgnorePrevState !== true) {
			this.$.personsCache.resetItems();
			this.$.callLogList.punt();
		}
	},

	createDivider: function(callLog, inIndex) {
		var dayOffsetText,
			callLogPrev = this.$.callLogList.fetch(inIndex - 1),
			relDate1 = enyo.application.Utils.formatRelativeDate(new Date(callLog.timestamp));
		if (!callLogPrev) {
			dayOffsetText = relDate1;
		} else {
			if (relDate1 !== enyo.application.Utils.formatRelativeDate(new Date(callLogPrev.timestamp))) {
				dayOffsetText = relDate1;
			}
			this.$.callLogList.fetch(inIndex); // another call to fetch is necessary since it was used above to get the prev callLog
		}

		if (dayOffsetText) {
			this.$.divider.setShowing(true);
			this.$.divider.setCaption(dayOffsetText);
			this.$.separator.setShowing(false);
		} else {
			this.$.divider.setShowing(false);
			this.$.separator.setShowing(true);
		}
		
		//if this is the last item, show the separtor at the bottom
		callLogNext = this.$.callLogList.fetch(inIndex + 1);
		if (!callLogNext){
			this.$.separator_last.setShowing(true);			
		} else {
			this.$.separator_last.setShowing(false);
		}		
	},
	
	createDrawerItem: function(drawerItem, callLog) {
		if (callLog.listName === undefined) {
			callLog.listName = this.listDisplayName(callLog.recentcall_address);
		}
		if (callLog.listLabel === undefined) {
			callLog.listLabel = this.listAddressLabel(callLog.recentcall_address);
		}
		
		
		this.$.displayDetails.$.displayNm.setContent(callLog.listName);
		this.$.displayDetails.$.displayLbl.setContent(callLog.listLabel);
		this.$.displayDetails.$.displayLblRight.setContent(this.listCallTime(callLog));
		this.$.displayDetails.$.displayIcon.setClassName("draweritem-displayicon call-log-icon-colors " + callLog.recentcall_type);
		this.$.drawerItem.setClassName("drawerItem enyo-swipeableitem");

		if (callLog.callcount > 1) {
			if (enyo.application.isTablet) {
				this.$.displayDetails.$.pillCountLbltab.setContent(callLog.callcount);
				this.$.displayDetails.$.pillCountLbltab.setShowing(true);
				this.$.displayDetails.$.displayNm.setClassName("");
			}
			else {
				this.$.displayDetails.$.pillCountLbl.setContent(callLog.callcount);
				this.$.displayDetails.$.pillCountLbl.setShowing(true);
			}
		} else {
			this.$.displayDetails.$.pillCountLbl.setShowing(false);
			this.$.displayDetails.$.pillCountLbltab.setShowing(false);
			this.$.displayDetails.$.displayNm.setClassName("clv-drawerItem-displayNm");
		}				

		var favPerson = enyo.application.Cache.favPersonsCache.getFavoritePerson(callLog.recentcall_address.personId);
			if (favPerson) {
				this.$.displayDetails.$.favoritesIcon.setShowing(true);
				if (callLog.listName.length > 65) {
					this.$.displayDetails.$.displayNm.setClassName("clv-drawerItem-truncated-displayNm");
				}	else {
					this.$.displayDetails.$.displayNm.setClassName("clv-drawerItem-displayNm");
				}
			} else {
				this.$.displayDetails.$.favoritesIcon.setShowing(false);
				if (callLog.listName.length > 65) {
					this.$.displayDetails.$.displayNm.setClassName("clv-drawerItem-truncated-displayNm");
				}
				else {
					this.$.displayDetails.$.displayNm.setClassName("clv-drawerItem-displayNm");
				}
			}

		var personData = this.$.personsCache.getPersonData(callLog.recentcall_address.personId);
		if (personData) {
			this.$.displayDetails.$.photo.applyStyle("background-image", "url(" + personData.listPhotoPath + ");");
		} else {
			this.$.displayDetails.$.photo.applyStyle("background-image", "url(./images/list-avatar-default.png);");
		}

		if (callLog.recentcall_address.isVideo === true) {
			// TODO: There has to be a better way to do this than checking for the length of the string...
			if (callLog.listLabel.length > 20) {
				this.$.displayDetails.$.displayLbl.setClassName("clv-drawerItem-displayLbl");
				this.$.displayDetails.$.displayVideoIcon.setClassName("clv-drawerItem-displayVideoIcon-absolute");
			} else {
				this.$.displayDetails.$.displayLbl.setClassName("clv-drawerItem-displayLbl");
				this.$.displayDetails.$.displayVideoIcon.setClassName("clv-drawerItem-displayVideoIcon-relative");
			}

			this.$.displayDetails.$.displayVideoIcon.setShowing(true);
		} else {
			this.$.displayDetails.$.displayLbl.setClassName("clv-drawerItem-displayLbl clv-displayLbl-full");
			this.$.displayDetails.$.displayVideoIcon.setShowing(false);
		}	
		
		this.areHistoryAndOptionsValid = (this.curOpenItemId === callLog._id);
		this.$.displayDetails.$.toggleFrame.setClassName("avatar-frame " + ((this.areHistoryAndOptionsValid === true) ? "Opened" : "unOpened"));
		this.$.HiddenDrawerItem.setOpen(this.areHistoryAndOptionsValid);
		this.$.drawerItem.setSwipeable(!this.areHistoryAndOptionsValid);
	},
	
	createSubItem: function(phoneNum, ims, itemtext, clickAction, transport, val, personId, bShowSeparator1, bShowSeparator2) {			
		this.callOptionsDataArray.push({
			'phoneNum': phoneNum,
			'ims': ims,
			'itemText': itemtext,
			'clickAction': clickAction,
			'transport': transport,
			'rawPhoneNumber': val,
			'personId': personId,
			'bShowSeparator1': bShowSeparator1,
			'bShowSeparator2': bShowSeparator2,
			});
	},
	
	createViewOrAddContactSubItem: function(bAddViewContact, person, address) {
		this.callOptionsDataArray.push({
			'itemText': bAddViewContact ? $L("View Contact") : $L("Add to Contacts"),
			'clickAction': bAddViewContact ? DrawerSubItemAction.ViewContact : DrawerSubItemAction.AddToContacts,
			'rawPhoneNumber': address.addr ? address.addr : "",
			'personId': person ? person._id : "",
			'bShowSeparator1': false,
			'bShowSeparator2': false,
			'service': address.service
			});
	},
	
	listDisplayName: function(address) {
		if (enyo.application.Utils.isVoicemailNumber(address.addr))
			return enyo.application.Messages.voicemailContact;

		// CASE: contact resolved, person's name
		if ( address.name ) {
			if (address.name === "unknown") {
				return enyo.application.Messages.unknownNumber;
			} else if (enyo.application.Utils.isValidNumber(address.name)) {
				// no contact resolved, "name" is just the raw phone number -> format it
				return enyo.application.Utils.FormatPhoneNumber(address.name) || address.name;
			} else {
				return address.name;
			}
			
		// CASE: unknown phone call, format and return
		} else if ( address.service === enyo.application.CallSynergizer.TRANSPORTS.TIL) {
			return enyo.application.Utils.FormatPhoneNumber(address.addr);
		} else if ( address.service === enyo.application.CallSynergizer.TRANSPORTS.VOIP) {
			return enyo.application.Utils.callNetworkName(address.service);
		} else if ( address.service && enyo.application.CallSynergizer.transports && enyo.application.CallSynergizer.transports[address.service] ) {
			// registered IM transport (Telegram/Signal/...) with no resolved contact: the id/@handle
			// IS the identity - show it verbatim, service-agnostically.
			return address.addr || "";
		} else {
			return address.addr || "";
		}
	},

	listAddressLabel: function(address) {
		// Service-agnostic: any registered VoIP/IM transport (not cellular) is named by its network.
		// Phone-number transports (WhatsApp/VOIP) format the address; IM transports (Telegram/Signal/
		// ...) show the id/@handle/UUID verbatim instead of mangling it into a "MOBILE" phone number.
		if ( address.service && address.service !== enyo.application.CallSynergizer.TRANSPORTS.TIL &&
		     enyo.application.CallSynergizer.transports && enyo.application.CallSynergizer.transports[address.service] ) {
			var shown = "";
			if (address.addr) {
				shown = " " + (address.service === enyo.application.CallSynergizer.TRANSPORTS.VOIP
					? (enyo.application.Utils.FormatPhoneNumber(address.addr) || address.addr)
					: address.addr);
			}
			return enyo.application.Utils.callNetworkName(address.service) + shown;
		} else if (address.name == null) {
			if (enyo.application.Utils.isVoicemailNumber(address.addr))
				return enyo.application.Utils.FormatPhoneNumber(address.addr);
			
			var location = enyo.application.Utils.locationForAddress(address.addr, enyo.application.CallSynergizer.TRANSPORTS.TIL);
			if (location.length > 0) {
				return location;
			} else {
				return $L("Unknown");
			}
		} else {
			// TODO: Use Contacts when available ... ???
			//return Contacts.PhoneNumber.Labels.getLabel(address.personAddressType);
			var personPhAddressType = enyo.application.Utils.getPhoneNumberType(address.personAddressType);
			if (personPhAddressType.length > 0) {
				return personPhAddressType + " " + enyo.application.Utils.FormatPhoneNumber(address.addr);
			} else {
				return enyo.application.Utils.FormatPhoneNumber(address.addr);
			}
		}
	},
	
	listCallTime: function(callLog) {
		if (callLog.callTime === undefined) {
			callLog.callTime = enyo.application.Utils.formatShortTime(new Date(callLog.timestamp));
		}

		return callLog.callTime;
	},
	
	updateSubItems: function() {
		// TODO: Remove the use of itemId, it is a work-around for the issue where onGetItem of the VirtualRepeaters are called as the user scrolls through the list
		this.areHistoryAndOptionsValid = true;
		this.$.callHistories.render();
		this.$.callOptions.render();
	},

	_getDbCallGroupCount: function() {
		this.$.dbCallGroupCount.call(
			{query:{"where": [{"prop":"type","op":"=","val":this.listType}]},
				count: true});
	},
	
	onQuery: function(inSender, inQuery) {
		return this.$.callsDBAssistant.getCallLogGroup(this.listType, inQuery);
	},
	
	onSetupRow: function(src, callLog, inIndex) {
		if (callLog && inIndex >= 0) {
			this.createDivider(callLog, inIndex);
			this.createDrawerItem(this.$.drawerItem, callLog);
			return true;
		}
	},

	onGotCallGroup: function(inSrc, inResponse, inRequest) {
		if (inResponse.fired == true) {
			this.$.callLogList.reset();
			return;
		}

		var callLogs = (inResponse && inResponse.results) || [];
		var len = callLogs.length;
		if (len > 0) {
			// If the currently opened call log is the 1st item in the list then the CallHistory needs to be refreshed
			if (this.curOpenItemId === callLogs[0]._id) {
				this.$.callsDBAssistant.getCallHistory(this.curOpenItemId);
			}
			
			// be backwards compatible to v2.0 call log entries				
			for (var i = 0; i < len; i++) {
				var callLog = callLogs[i];
				if ( callLog.recentcall_address.service === "phone" || callLog.recentcall_address.service === "skype_intl" ) {
					callLog.recentcall_address.service = enyo.application.CallSynergizer.TRANSPORTS.TIL;
				} else if ( callLog.recentcall_address.service === "skype") {
					callLog.recentcall_address.service = enyo.application.CallSynergizer.TRANSPORTS.VOIP;
				}
				
				this.$.personsCache.addItem(callLog.recentcall_address.personId);
				
				if (this.curOpenItemId === callLog._id) {
					this.curItemIndex = i;
					this.lastOpen = i;
				}
			}

			this.$.personsCache.updateCache();			
		}

		this.$.callLogList.queryResponse(inResponse, inRequest);
	},
	
	onDrawerItemClicked: function(inSrc, rowIndex) {
		var itemData = this.$.callLogList.fetch(rowIndex);
		if (enyo.application.Utils.canBeCalled(itemData.recentcall_address.service, itemData.recentcall_address.addr)) {
			
			// Only use the service if it is a VoIP/IM call that is not a ph# (any non-cellular transport,
			// not just WhatsApp - otherwise redialing a Telegram/Signal/Teams call log entry would fall
			// through to transport-guessing by number instead of using the transport it was actually placed on)
			var service = undefined;
            if (itemData.recentcall_address.service && itemData.recentcall_address.service !== enyo.application.CallSynergizer.TRANSPORTS.TIL &&
				itemData.recentcall_address.addr === itemData.recentcall_address.normalizedAddr) // Work-around since we can't rely on personAddressType
            {
				service = itemData.recentcall_address.service;
            }
			
			if(itemData.recentcall_address.isVideo === true) {
				enyo.application.Cache.authorizedForVideo[itemData.recentcall_address.addr] = true;				
			}
			enyo.application.CallSynergizer.dial(itemData.recentcall_address.addr,
				(itemData.recentcall_address.isVideo === true) ? true: undefined, undefined, 
				service, itemData.recentcall_address.personId,
				true /*debounce*/);
		}
	},
	
	onDrawerSubItemClick: function(inSrc, inEvent) {
		this.$.subItemActionHandler.executeAction(this.callOptionsDataArray[inEvent.rowIndex]);
	},
	
	onSmsIconClicked: function(inSrc, inEvent) {
		this.$.subItemActionHandler.executeSendSMS(this.callOptionsDataArray[inEvent.rowIndex]);
	},
	
	onDeleteConfirm: function(inSrc, inIndex) {
		this.$.callsDBAssistant.deleteCallLogGroup(this.$.callLogList.fetch(inIndex)._id);
	},
	
	onAvatarClick: function(inSender, rowIndex) {	
		var callLog = this.$.callLogList.fetch(rowIndex);
		if (rowIndex != this.curItemIndex && !this.$.HiddenDrawerItem.getOpen()) {
			this.curItemIndex = rowIndex;
			this.curOpenItemId = callLog._id;
			this.$.callsDBAssistant.getCallHistory(this.curOpenItemId);
			this.$.drawerItem.setSwipeable(false);
		} else {
			if (this.$.HiddenDrawerItem.getOpen() === true) { // Checked needed for when the data refreshes
				this.$.HiddenDrawerItem.toggleOpen();
				this.$.displayDetails.$.toggleFrame.setClassName("avatar-frame unOpened");
				this.animationCount = 1;
				this.curItemIndex = -1;
				this.curOpenItemId = null;
				this.lastOpen = null;
				this.areHistoryAndOptionsValid = false;
			} else {
				this.toggleOpen();
			}
			this.$.drawerItem.setSwipeable(true);
		}
		//disable this for now as it breaks call log view"view/add contact".  We'll redo the fix of DFISH-16919
		/*/To fix DFISH-16919[Phone App] Call log records disappears when expanding a record with more than 25 entries
		//since manta didn't report this, I'll apply it for tablet only.  The issue is the current positioin is not 
		//updated after the item with lots of sub items collapsed which moves the viewable positions up away from 
		//what user sees.  User see the blink page and has to flick the list down to see them.
		if (enyo.application.isTablet){
			this.$.callLogList.reset();
		}*/
		//enyo.stopEvent(inEvent);
	},
	
	onGotCallHistory: function(inSrc, inCallHistoriesArray) {
		this.callHistoriesArray = inCallHistoriesArray;
		var callLog = this.$.callLogList.fetch(this.curItemIndex);
		if (!callLog) {
			return; // This happens when a user makes a call from the call log & returns to this scene
		}

		if (callLog.recentcall_address.personId === undefined) {		
			this.callOptionsDataArray = [];
			if (callLog.listName !== enyo.application.Messages.unknownNumber && callLog.listName !== enyo.application.Messages.blockedNumber) {
				var bIsVoicemailNumber = enyo.application.Utils.isVoicemailNumber(callLog.recentcall_address.addr);
				var bIsEmergencyNumber = enyo.application.Utils.isEmergencyNumber(callLog.recentcall_address.addr);
				this.createSubItem(undefined, undefined,
					enyo.application.Utils.FormatPhoneNumber(callLog.recentcall_address.addr), 
					DrawerSubItemAction.DialPhoneNumber,
					callLog.recentcall_address.service,
					callLog.recentcall_address.addr, undefined, true, !bIsVoicemailNumber && !bIsEmergencyNumber);

			
				if (!bIsVoicemailNumber && !bIsEmergencyNumber) {
					this.createViewOrAddContactSubItem(false, null, callLog.recentcall_address);
				}
			}
			
			this.updateSubItems();
			this.toggleOpen();
		}
		else {
			this.$.callsDBAssistant.getPerson(callLog.recentcall_address.personId, callLog.recentcall_address.addr, callLog.recentcall_address.service);
		}		
	},
	
	onGotPerson: function(inSrc, inPerson) {
		this.callOptionsDataArray = [];
		if (inPerson) {
			var bShowSeparator1 = false;
	        var nPhone = inPerson.phoneNumbers.length;
	        var nPhoneIndex = 0;
			if (nPhone > 0) {
				bShowSeparator1 = true;
			}
	        while (nPhoneIndex < nPhone) {
				var phoneNum = inPerson.phoneNumbers[nPhoneIndex];
				this.createSubItem(phoneNum, undefined, undefined, DrawerSubItemAction.DialPhoneNumber, 
					enyo.application.CallSynergizer.TRANSPORTS.TIL, phoneNum.value, inPerson._id, bShowSeparator1, true);
				nPhoneIndex++;
				bShowSeparator1 = false;
	        }
			
			var len = inPerson.ims.length;
			if(nPhone == 0)
				bShowSeparator1 = true;
			// Offer a call row for every IM whose service is an enabled PHONE-capable transport
			// (whatsapp/telegram/signal/...), dialing via that IM's own transport.
			var callableTypes = enyo.application.CallSynergizer.getCallableImTypes();
			for (var i = 0; i < len; i++) {
				if (callableTypes.indexOf(inPerson.ims[i].type) !== -1) {
					var ims = inPerson.ims[i];
					this.createSubItem(undefined, ims.value, undefined, DrawerSubItemAction.DialSkypeIms,
						ims.type, ims.value, inPerson._id, bShowSeparator1, true);

					bShowSeparator1 = false;
				}
			}

			this.createViewOrAddContactSubItem(true, inPerson, {});
		}
		
		this.updateSubItems();
		this.toggleOpen();
	},
	
	toggleOpen: function() {	
		this.animationCount = 1; // animationCount && onOpenAnimationComplete is a work-around provided by fmwk team to fix the jerky scrolling issue after a item toggles
		// toggle and remember state
		this.$.HiddenDrawerItem.toggleOpen();
		var o = this.$.HiddenDrawerItem.getOpen();
		this.$.displayDetails.$.toggleFrame.setClassName("avatar-frame " + ((o === true) ? "Opened" : "unOpened"));
		this.$.drawerItem.setSwipeable(o === false);
		// close the last drawer
		if (this.lastOpen != null && this.lastOpen != this.curItemIndex) {
			if (this.$.callLogList.$.list.prepareRow(this.lastOpen)) {
				this.animationCount++;
			}
			this.$.HiddenDrawerItem.setOpen(false);
			this.$.drawerItem.setSwipeable(true);
			this.$.displayDetails.$.toggleFrame.setClassName("avatar-frame unOpened");
		}
		// remember the last open drawer
		this.lastOpen = o ? this.curItemIndex : null;
		
		// areHistoryAndOptionsValid is a work-around to the framework calling the onGetItem of the VirtualRepeaters as the user scrolls through the list
		this.areHistoryAndOptionsValid = false;
	},
	
	onOpenAnimationComplete: function() {
		this.animationCount--;
		if (!this.animationCount) {
			this.$.callLogList.refresh();
		}
	},
	
	onCallHistoriesGetItem: function(inSrc, inIndex) {
		if (this.callHistoriesArray === undefined || this.areHistoryAndOptionsValid !== true) {
			return;
		}
		else if (inIndex < this.callHistoriesArray.length) {
			this.$.callHistories.prepareRow(inIndex);
			this.$.callHistorySubItem.setCallHistory(this.callHistoriesArray[inIndex]);
			return true;
		}
	},
	
	onCallOptionsGetItem: function(inSrc, inIndex) {
		if (this.callOptionsDataArray === undefined || this.areHistoryAndOptionsValid !== true) {
			return;
		}
		else if (inIndex < this.callOptionsDataArray.length) {
			var callOptionData = this.callOptionsDataArray[inIndex];
			this.$.callOptions.prepareRow(inIndex);
			this.$.drawerSubItem.setPhoneNumber(callOptionData.phoneNum);
			this.$.drawerSubItem.setService(callOptionData.transport);
			this.$.drawerSubItem.setIms(callOptionData.ims);
			this.$.drawerSubItem.setItemText(callOptionData.itemText);
			this.$.drawerSubItem.setPersonId(callOptionData.personId);
			if (callOptionData.transport && callOptionData.rawPhoneNumber) {
				this.$.drawerSubItem.setDisplaySMSIcon(enyo.application.Utils.canBeMessaged(callOptionData.transport, callOptionData.rawPhoneNumber));
			} else {
				this.$.drawerSubItem.setDisplaySMSIcon(false);
			}
			this.$.separator1.setShowing(callOptionData.bShowSeparator1);
			this.$.separator2.setShowing(callOptionData.bShowSeparator2);
			return true;
		}
	},
	
	onPersonCacheReady: function() {
		this.$.callLogList.refresh();
	},
	
	onDbCallGroupCountSuccess: function(inSrc, inResponse, inRequest) {
		if (inResponse.returnValue && inResponse.fired == true) {
			this._getDbCallGroupCount();
		}
		else if (inResponse.returnValue) {
			if (inResponse.count === 0) {
				this.$.callLogList.setShowing(false);
				this.$.emptyCallHistoryBox.setShowing(true);
			} else {
				this.$.callLogList.setShowing(true);
				this.$.emptyCallHistoryBox.setShowing(false);
			}
		}
	},
});
