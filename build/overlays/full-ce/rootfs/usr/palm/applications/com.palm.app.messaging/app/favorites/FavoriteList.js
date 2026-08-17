/*globals enyo */

enyo.kind({
	name: "FavoriteList",
	kind: "VFlexBox",
	className: "favoriteItem",
	published: {
	},
	events: {
		onSelectFavorite: ""
	},
	components: [
		{kind: "FavoriteService", onSuccess: "gotFavorites", onWatch: "favoritesWatch"},
		{className:"header-shadow header-favorite-shadow"},
		//{kind: "SearchInput", hint: $L("Search"), className:"searchList", onSearch: "filterList"},
		{name: "noFavoriteMessage", content: FavoriteConstants.NO_FAVORITE_MESSAGE, className: "messageTexts"},
		{flex: 1, name: "list", kind: "DbList", desc: false, onQuery: "listQuery", className:"messaging-listsDivider", onSetupRow: "listSetupRow", components: [
			{name: "favoriteItem", tapHighlight:true, kind: "FavoriteItem", onclick: "favoriteClicked", onConfirm: "removeFavorite", onCancel: "disableKeyboardMannualMode"}
		]},
		{name: "contactLauncher", kind: "Launcher", app: "com.palm.app.contacts"},
		{name: "unfavoritePersonService", kind:"PalmService", service: "palm://com.palm.service.contacts/", method: "unfavoritePerson"}
	],
	favoritesWatch: function() {
		//enyo.log("#@#@ favorites list is updating......");
		this.$.list.reset();
	},
	gotFavorites: function(inSender, inResponse, inRequest) {
		//enyo.log("#@#@ got favorites: ", inResponse);
		this.$.list.queryResponse(inResponse, inRequest);
		
		// by default, hide these messages
		this.$.noFavoriteMessage.hide();
		
		
		if ((inRequest.index === 0) && (!inResponse || !inResponse.results || inResponse.results.length === 0)) {
			this.$.noFavoriteMessage.show();
		} 
	},
	filterList: function(inSender, inValue){
		this.filterString = inValue;
		this.$.list.reset();
	},
	listQuery: function(inSender, inQuery) {
		//enyo.log("#@#@ quering favorites");
		inQuery.where = [{
			              prop: "favorite",
			              op: "=",
			              val: true
		                }];
		inQuery.select = enyo.messaging.person.selectAttributes;
		inQuery.orderBy = "sortKey";
		
		return this.$.favoriteService.call({query: inQuery});
	},
	listSetupRow: function(inSender, inFavorite, inIndex) {
		//enyo.log("#@#@ favorite list set up row" );
		this.$.favoriteItem.setFavorite(inFavorite);
		// set selected row color
		this.$.favoriteItem.addRemoveClass("enyo-item-selected", this.selectedRecord && inFavorite._id === this.selectedRecord._id ? true: false);
	},
	favoriteClicked: function(inSender, inEvent) {
		var selected = this.$.list.fetch(inEvent.rowIndex);
		if (selected) {
			//FIXME: should comment out the following log since it contain user data
			enyo.log("clicked on favorite: ", (selected.displayName || selected.username));
			
			if (enyo.messaging.person.hasMessagingAccounts(selected)) {
				// update list item selection 
				this.selectedRecord = selected;
				this.$.list.refresh();
				
				this.doSelectFavorite({
					personId: this.selectedRecord._id,
					displayName: this.selectedRecord.displayName,
					username: this.selectedRecord.ims[0].username,
					serviceName: this.selectedRecord.ims[0].serviceName
				});
			} else if (enyo.messaging.person.hasSMSAccounts(selected)) {
				// update list item selection 
				this.selectedRecord = selected;
				this.$.list.refresh();
				
				this.doSelectFavorite({
					personId: this.selectedRecord._id,
					displayName: this.selectedRecord.displayName,
					username: enyo.messaging.utils.normalizeAddress(this.selectedRecord.phoneNumbers[0], "sms"),
					serviceName: "sms"
				});
			} else {
				this.$.contactLauncher.launch({
					contact: selected,
					launchType:"editContact"
				});
				// update dashboard's filter 
				enyo.application.messageDashboardManager.setFilter({thread: undefined});
			}
		}
	},
	setSelection: function(inChatThread){
		if ((this.selectedRecord && inChatThread && this.selectedRecord._id === inChatThread.personId) || (!this.selectedRecord && inChatThread && !inChatThread.personId)) {
		//case selection didn't change, do nothing
			return;	
		}
		else {
			this.selectedRecord = {_id: inChatThread ? inChatThread.personId : null};
			if (!inChatThread) {
				this.$.list.refresh();
			}
		}
	}, 
	disableKeyboardMannualMode: function(){
		enyo.messaging.keyboard.setKeyboardAutoMode();
	},
	removeFavorite: function(inSender, inEvent) {
		enyo.messaging.keyboard.setKeyboardAutoMode();
		var favorite = this.$.list.fetch(inEvent);
		this.$.unfavoritePersonService.call({"personId": favorite._id});
	},
	updateList: function() {
		this.$.list.update();
	},
	resetList: function() {
		this.$.list.reset();
	},
	windowHiddenHandler: function() {
		// dump data buffer
		this.$.list.punt();
		// cancel service call
		//this.$.favoriteService.cancel();		
	}
});
