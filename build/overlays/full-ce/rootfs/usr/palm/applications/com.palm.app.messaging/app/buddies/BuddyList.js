/*globals enyo */

enyo.kind({
	name: "BuddyList",
	kind: "VFlexBox",
	published: {
		showOffline: false,
		loginStates: null
	},
	events: {
		onSelectBuddy: "",
		onShowOfflineBuddies: "",
		onDeleteThread: ""
	},
	components: [
		{kind: "BuddyService", onSuccess: "gotBuddies", onWatch: "buddiesWatch"},
		{name: "search", kind: "SearchInput", hint: $L("Search"), className:"enyo-middle", onchange: "filterList", onCancel: "filterList", changeOnInput: true,  autoCapitalize: "lowercase", onfocus: "disableKeyboardMannualMode"},
		{className:"header-shadow header-app-shadow"},
		{name: "emptyMessage", content: BuddyConstants.OFFLINE_MESSAGE, className: "messageTexts", showing: false},
		{flex: 1, name: "list", kind: "DbList", desc: false, onQuery: "listQuery", className:"messaging-listsDivider", onSetupRow: "listSetupRow", components: [
			{kind: "Divider", className:"buddyList-Divider"},
			{name: "buddyItem", tapHighlight:true, kind: "BuddyItem", onclick: "buddyClicked", onConfirm: "showDeleteConfirmDialog", onCancel: "disableKeyboardMannualMode"}
		]},
		{name: "deleteDialog", kind: "PopupDialog", onAccept: "deleteBuddy"},
		{kind: "DeleteBuddyService", onDeleteThread: "doDeleteThread"}
	],
	buddiesWatch: function() {
		//enyo.log("#@#@ buddies list is updating......");
		// Release the prior request + its subscriptions before re-querying, else each watch fire
		// leaks db8 watches (BuddyService holds subscribed chatthread/person/status finds). See ThreadList.
		this.$.buddyService.cancel();
		this.$.list.reset();
	},
	showOfflineChanged: function() {
		// dump the existing list dataset so that subsequent list query will use
		// the new 'showOffline' flag
		this.$.list.punt();
	},
	filterList: function(inSender, inValue){
	    this.filterString = this.$.search.getValue();
	    this.$.list.punt();
	},
	listQuery: function(inSender, inQuery) {
		if (this.filterString && this.filterString.length > 0) {
			inQuery.where = [{
				prop: "primary",
				op: "=",
				val: true
			}, {
				prop: "offline",
				op: "=",
				val: this.showOffline ? [true, false] : false
			}, {
				prop: "displayName",
				op: "?",
				val: this.filterString,
				"collate": "primary",
				"tokenize": "all"
			}];
			inQuery.search = true;
		} else {
//			var whereStr = "where primary=true and offline=" + (this.showOffline ? "[true, false]" : "false") + " and groupAvailability%''";
//			var where = parseQuery(whereStr).where;
			var where = [{
							prop: "primary",
							op: "=",
							val: true
						}, {
							prop: "offline",
							op: "=",
							val: this.showOffline ? [true, false] : false
						}, {
							prop: "groupAvailability",
							op: "%",
							val: "",
							collate: "secondary"
						}];
//			where[2].collate = "secondary";
			inQuery.where = where;
		}
		
		if (window.PalmSystem) {
			return this.$.buddyService.call({query: inQuery});
		} else {
			if (!this.gotMockData) {
				this.gotMockData = true;
				return this.$.buddyService.call({query: inQuery});
			} else {
				return ;
			}
		}
	},
	gotBuddies: function(inSender, inResponse, inRequest) {
		//enyo.log("#@#@ got buddies: ", inResponse);
		this.$.list.queryResponse(inResponse, inRequest);
		this.emptyMessageCheck(inResponse, inRequest, this.loginStates, this.filterString, this.showOffline);
	},
	showEmptyMessage: function(message) {
		this.$.emptyMessage.setContent(message);
		this.$.emptyMessage.show();
	},
	listSetupRow: function(inSender, inBuddy, inIndex) {
		//enyo.log("#@#@ buddy list set up row" );
		if (!this.filterString || this.filterString.length === 0) {
			this.setupDivider(inBuddy, inIndex);
		}
		else{
			this.$.divider.canGenerate = false;
		}
		this.$.buddyItem.setBuddy(inBuddy);
		// highlight selected buddy
		this.$.buddyItem.addRemoveClass("enyo-item-selected", this.shouldHighlight(inBuddy, this.selectedRecord));
	},
	setupDivider: function(inBuddy, inIndex) {
		var offlineCaption = $L("offline");
		var caption = inBuddy.offline ? offlineCaption : inBuddy.group;
		var pt = this.$.list.fetch(inIndex - 1);
		var previousCaption = pt && (pt.offline ? offlineCaption : pt.group);
		//
		var showDivider = caption != previousCaption;
		//enyo.log("#@#@ current caption: ", caption, " previous caption: ", previousCaption, " show divider: ", showDivider);
		if (showDivider) {
			this.$.divider.setCaption(caption.toUpperCase());
			this.$.buddyItem.addClass("enyo-first");
		}
		//
		this.$.divider.canGenerate = showDivider;
	},
	buddyClicked: function(inSender, inEvent) {
		var selectedRecord = this.$.list.fetch(inEvent.rowIndex);
		if (selectedRecord && this.selectedRecord && selectedRecord.personId === this.selectedRecord.personId){
			return;
		}
		else{
			this.selectedRecord = selectedRecord;
		} 
			
		if (this.selectedRecord) {
			enyo.log("clicked on buddy: ", (this.selectedRecord.displayName || this.selectedRecord.username));
			
			// broadcast buddy selection
			this.doSelectBuddy(this.selectedRecord);
			this.$.list.refresh();
		}
	},
	showDeleteConfirmDialog: function(inSender, inEvent) {
		enyo.messaging.keyboard.setKeyboardAutoMode();
		var deletedBuddy = this.$.list.fetch(inEvent);
		this.$.deleteBuddyService.setBuddy(deletedBuddy);
		
		var template = new enyo.g11n.Template($L("Are you sure you want to delete #{name} from your buddies list?"));
		var dialogMessage = template.evaluate({name: deletedBuddy.displayName});
		enyo.log("Deleting buddy: ", deletedBuddy);
		
		this.$.deleteDialog.openAtCenter();
		this.$.deleteDialog.setAcceptButtonCaption($L("Delete"));
		this.$.deleteDialog.setTitle($L("Remove Buddy"));
		this.$.deleteDialog.setMessage(dialogMessage);
	}, 
	deleteBuddy: function(inSender, inEvent) {
		this.$.deleteBuddyService.deleteBuddy();
	},
	setSelection: function(inChatThread){
		if ((this.selectedRecord && inChatThread 
			&& ((inChatThread.buddyId && this.selectedRecord.buddyId === inChatThread.buddyId) 
			|| (inChatThread.personId && this.selectedRecord.personId === inChatThread.personId))) 
			|| (!this.selectedRecord && inChatThread && !inChatThread.personId)) {
		//case selection didn't change, do nothing
			return;	
		} else {
			this.selectedRecord = {
				personId: inChatThread ? inChatThread.personId : null
			};
//			if (!inChatThread) {
				this.$.list.refresh();
//			}
		}
	},
	windowHiddenHandler: function(){
		// dump data buffer
		this.$.list.punt();
		// cancel service call
		//this.$.buddyService.cancel();
		
		// clear out filter search
		this.filterString = "";
		this.$.search.setValue(this.filterString);
		this.$.search.forceBlur();
	},
	disableKeyboardMannualMode: function(){
		enyo.messaging.keyboard.setKeyboardAutoMode();
	},
	updateList: function() {
		this.$.list.update();
	},
	resetList: function() {
		this.$.list.reset();
	},
	
	/***********************************
	 * Functions below are unit tested *
	 ***********************************/
	isOffline: function(states) {
		var offline = true;
		
		for (var i = 0; i < states.length; i++) {
			if (states[i].availability !== enyo.messaging.im.availability.OFFLINE && states[i].state !== "offline") {
				offline = false;
			}
		}
		return offline;
	},
	emptyMessageCheck: function(inResponse, inRequest, loginStates, filterString, showOffline) {
		var message;
		// by default, hide these messages
		this.$.emptyMessage.hide();

		if (!loginStates || loginStates.length === 0) {
			message = BuddyConstants.OFFLINE_MESSAGE;
		} else if ((inRequest.index === 0) && (!inResponse || !inResponse.results || inResponse.results.length === 0)) {
		    if (filterString && filterString.length > 0) {
			    // No buddies found using search
		    	message = enyo.messaging.CONSTANTS.NO_SEARCH_RESULTS;
			} else if (this.isOffline(loginStates)) {
				// all accounts are offline
				message = BuddyConstants.OFFLINE_MESSAGE;
			} else if (showOffline) {
				// really has no buddies
				message = BuddyConstants.NO_BUDDY_MESSAGE;
			} else {
				// either has no online buddies or no buddies at all
				message = BuddyConstants.NO_ONLINE_BUDDY_MESSAGE;
			}
		}
		
		if (message !== undefined) {
			this.showEmptyMessage(message);
		}
		
		// Added the return for unit testing
		return message;
	},
	shouldHighlight: function(inBuddy, selectedRecord) {
		if (!selectedRecord) {
			enyo.log("Selected record doesn't exist, so can't highligh buddy items");
			return false;
		}
		
		if (selectedRecord.personId) {
			// if person Id is found, use it for matching buddy record
			return selectedRecord.personId === inBuddy.personId;
		}
		
		if (selectedRecord.normalizedAddress) {
			// If normalizedAddresss is found, use it for matching buddy record.
			// This selection should come from a tap event from conversations list.
			return selectedRecord.normalizedAddress === enyo.messaging.utils.normalizeAddress(inBuddy.username, inBuddy.serviceName);
		}
		
		if (selectedRecord.username && selectedRecord.serviceName) {
			// This selection should come from buddy list.
			return enyo.messaging.utils.normalizeAddress(selectedRecord.username, selectedRecord.serviceName) === enyo.messaging.utils.normalizeAddress(inBuddy.username, inBuddy.serviceName);
		}

		return false;
	}

});
