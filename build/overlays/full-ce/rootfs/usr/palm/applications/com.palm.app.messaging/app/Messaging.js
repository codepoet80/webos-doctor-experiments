/*globals enyo */

enyo.kind({
	name: "Messaging",
	kind: enyo.VFlexBox,
	events: {
		onSelectThread: "",
		onDeleteThread: "",
		onThreadLocked: "",
		onOpenComposeView: "",
		onNewBuddy: "",
		onNewFavorite: "",
		onLoginStatesChange: "",
		onAddAccount: ""
	},
	components: [
		{kind:"Toolbar", className:"enyo-toolbar-light messaging-availability", components: [
			{name: "imStatus", kind: "ImStatus", onLoginStatesChange: "loginStatesChange", onAddAccount: "doAddAccount"}
		]},
		{kind: "TabGroup", onChange: "menuToggle", className:"messaging-radiobuttons", pack: "center", components: [
			// NOTE: keep this in value order (0..3). RadioButton.getValue() returns
			// `value || indexOfControl`, so the value:0 (Chats) button MUST stay at DOM index 0 or
			// its value resolves to its position and taps route to the wrong pane. The Servers tab
			// is moved to the LEFT visually via CSS (-webkit-box-ordinal-group, .servers-tab-left),
			// which does not change component index, so value routing stays correct.
			{value: 0, components: [{name: "unreadCountButton", kind: "ChatButton"}]},
			{value: 1, icon: "images/menu-icon-buddies.png"},
			{value: 2, icon: "images/menu-icon-favorites.png"},
			{value: 3, icon: "images/menu-icon-servers.png", className: "servers-tab-left"}
		]},
		{kind: "Pane", flex: 1, transitionKind: "enyo.transitions.Simple", components: [
			{kind: "ThreadList", onSelectThread: "doSelectThread", onDeleteThread: "doDeleteThread", onThreadLocked: "doThreadLocked", onUnreadCountChanged: "updateUnreadCount"},
			{kind: "BuddyList", onSelectBuddy: "personSelected", onDeleteThread: "doDeleteThread"},
			{kind: "FavoriteList", onSelectFavorite: "personSelected"},
			{kind: "ServerList", onSelectThread: "doSelectThread", onServerDrill: "serverDrillChanged"}
		]},
		{className:"footer-shadow footer-app-shadow"},
		{kind: "Toolbar", className:"enyo-toolbar-light", components: [
			{name: "serverBackBtn", kind: "GrabButton", slidingHandler: false, allowDrag: false, onclick: "serverBack", showing: false},
			{name: "conversationBtn", kind: "Button", label:$L("New Conversation"), onclick: "doOpenComposeView"},
			{name: "buddyBtn", kind: "Button", label:$L("Add Buddy"), onclick: "doNewBuddy", showing: false},
			{name: "favoriteBtn", kind: "Button", label:$L("Add Favorite"), onclick: "doNewFavorite", showing: false}
		]},
		{kind: "DbService", dbKind: "com.palm.chatthread:1", components: [
			{name: "findThread", method: "find", onSuccess: "threadFound"},
			{name: "createThread", method: "put", onSuccess: "threadCreated"},
			{name: "threadGetter", method: "get", onSuccess: "threadFound"}
		]}
	],
	create: function() {
		this.inherited(arguments);
		
		this.buttons = [];
		this.buttons.push(this.$.conversationBtn);
		this.buttons.push(this.$.buddyBtn);
		this.buttons.push(this.$.favoriteBtn);
	},
	loginStatesChange: function(inSender, inStates){
		this.doLoginStatesChange(inStates);
		this.$.buddyList.setLoginStates(inStates);
		// Servers show each account's online dot from these states, AND resolve their connector logo
		// from the account-types hash (empty until accounts load - Telegram first showed the generic
		// glyph). setLoginStates stores the availabilities and repaints the rows, covering both.
		this.$.serverList.setLoginStates(inStates);
	},
	workaroundListVisibilityBug: function(inValue) {
		// this object loses scrollTop when it goes invisible, this hack restores scrollTop
		if (inValue === undefined || inValue === 0) {
			this.$.threadList.updateList();
		}
		// this one has never rendered at startup (it was invisible), we need more power for this one
		if (inValue === undefined || inValue === 1) {
			this.$.buddyList.updateList();
		}
		//this.$.aggregator.findThreads();
		if (inValue === undefined || inValue === 2) {
			this.$.favoriteList.updateList();
		}
		if (inValue === undefined || inValue === 3) {
			this.$.serverList.updateList();
		}
	},
	menuToggle: function(inSender, inValue) {
		this._curTab = inValue;
		this.$.pane.selectViewByIndex(inValue, true);
		this.updateButtons(inValue);
		// this.updateDashboard(inValue);
		// FIXME: should no longer be needed.
		this.workaroundListVisibilityBug(inValue);
	},
	// Show the "Servers" back button in the bottom toolbar only while the Servers tab is drilled
	// into a server's channels; hidden everywhere else.
	serverBack: function() {
		this.$.serverList.showServers();
	},
	serverDrillChanged: function(inSender, inDrilledIn) {
		this.$.serverBackBtn.setShowing((this._curTab === 3) && inDrilledIn);
	},
	highlightTabButton: function(inValue) {
		this.$.tabGroup.setValue(inValue);
	},
	updateButtons: function(index) {
		for (var i = 0; i < this.buttons.length; i++) {
			this.buttons[i].setShowing(i === index);
		}
		// serverBackBtn is not tab-indexed: it belongs to the Servers tab and only when drilled in.
		this.$.serverBackBtn.setShowing((index === 3) && this.$.serverList && this.$.serverList.isDrilledIn());
	},
	updateDashboard: function(pane) {
		var dashboardMgr = enyo.application.messageDashboardManager;
		var filter = dashboardMgr.getFilter();
		
		if (pane === 0) {
			// this is the conversation view
			if (filter) {
				filter = {};
			} 
			filter.filterAll = true;
		} else {
			filter.filterAll = false;
		}
		
		dashboardMgr.setFilter(filter);
	},
	personSelected: function(inSender, inPerson) {
		this.person = inPerson;
		this.findThread();
	},
	findThread: function() {
		this.$.findThread.cancel();
		if (this.person.personId) {
			this.$.findThread.call({
				query: {
					where: [{
						prop: "personId",
						op: "=",
						val: this.person.personId
					}]
				}
			//parseQuery("where personId='" + this.person.personId + "'")
			});
		} else {
			// if person Id is not found, use username and service name to search
			// for a chat thread
			this.$.findThread.call({
				query: {
					where: [{
						prop: "normalizedAddress",
						op: "=",
						val: enyo.messaging.utils.normalizeAddress(this.person.username, this.person.serviceName)
					}]
				}
			});
		}
	},
	threadFound: function(inSender, inResponse) {
		var threads = inResponse.results;
		if (threads.length > 0) {
			enyo.log("got chat thread record: ", threads[0]._id);
			this.doSelectThread(threads[0]);
		} else {
			this.createThread();
		}
	},
	createThread: function() {
		var p = this.person;  // there can be a race condition here if user tap on different buddies or favorites quick.  we may want to use an array to handle pending person selection.
		this.$.createThread.call({
			objects: [{
				"_kind": "com.palm.chatthread:1",
				"timestamp": new Date().getTime(),
				"personId": p.personId,
				"displayName": p.displayName || p.username,
				"replyAddress": p.username,
				"normalizedAddress": p.username,
				"replyService": p.serviceName,
				"summary": "",
				"flags": {"visible":false}
			}]
		});
	},
	threadCreated: function(inSender, inResponse) {
		//enyo.log("*********************************** created thread: ", inResponse);
		if (inResponse.returnValue && inResponse.results && inResponse.results.length > 0) {
			this.$.threadGetter.call({"ids": [inResponse.results[0].id]});
		}
	},
	setOfflinePrefs: function(prefs) {
		this.$.buddyList.setShowOffline(!prefs.showOnlineBuddiesOnly);
	}, 
	updateUnreadCount: function(inSender, inCount) {
		//enyo.log("*********** unread count: ", inCount);
		this.$.unreadCountButton.setClassName("enyo-button-icon chat-button"+ (inCount > 99?"-plus":""));	    
		this.$.unreadCountButton.setCaption(inCount > 99?"99":(inCount || ""));
	},
	setSelection: function(chatThread){
		this.$.threadList.setSelection(chatThread);
		this.$.buddyList.setSelection(chatThread);
		this.$.favoriteList.setSelection(chatThread);
		this.$.serverList.setSelection(chatThread);
	},
	windowHiddenHandler: function(){
		// show chat list
		this.menuToggle(this, 0);
		// highlights the radio button for conversations view
		this.$.tabGroup.setValue(0);
		
		this.$.threadList.windowHiddenHandler();
		this.$.buddyList.windowHiddenHandler();
		this.$.favoriteList.windowHiddenHandler();
		this.$.serverList.windowHiddenHandler();
		this.$.imStatus.windowHiddenHandler();
	},
	windowShownHandler:function() {
		// reset all lists so that their db service restarted
		this.$.threadList.resetList();
		this.$.buddyList.resetList();
		this.$.favoriteList.resetList();
		this.$.serverList.resetList();
	}
});