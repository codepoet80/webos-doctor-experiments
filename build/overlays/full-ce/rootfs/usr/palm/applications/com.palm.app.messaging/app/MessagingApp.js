/*globals enyo */

enyo.kind({
	name: "enyo.MessagingApp",
	kind: "Pane",
	transitionKind: "enyo.transitions.Simple",
	className: "enyo-bg",
	components: [
		{kind: "ApplicationEvents", onOpenAppMenu: "openAppMenuHandler", onBack:"backHandler", onWindowParamsChange:"windowParamsChangeHandler", 
					onResize:"resizeHandler", onUnload:"unloadHandler", onWindowHidden:"windowHiddenHandler", onWindowShown:"windowShownHandler",
					onWindowActivated:"windowActivatedHandler", onWindowDeactivated:"windowDeactivatedHandler"},
		{name: "slidingGroup", kind: enyo.SlidingPane, className: "loading-background", components: [
			{width: "320px", name: "messagingSliding", fixedWidth: true, components: [{
				flex: 1,
				kind: "Messaging",
				onSelectThread: "selectThread",
				onDeleteThread: "deleteThread",
				onThreadLocked: "threadLocked",
				onOpenComposeView: "openComposeView",
				onNewBuddy: "addBuddy",
				onNewFavorite: "showAddFavoriteList",
				onLoginStatesChange: "LoginStatesChange",
				onAddAccount: "showAddAccountDialog"
			}]},
			{name: "conversationSliding", flex: 1, className:"conversationSliding-right", components: [{
				kind: "ChatView",
				onSelectThread: "selectThread",
				onClearUnreadCount: "clearUnreadCount",
				flex: 1
			}]}
		]},
		{name: "firstLaunch", kind: "FirstLaunch", onFirstLaunchDone: "doneFirstLaunch", lazy: true},
		{name: "preferencesView", kind: "PreferencesView", onClosePreferences: "closePreferences", lazy: true},
		{name: "threadServiceMerge", kind: "DbService", dbKind: "com.palm.chatthread:1", method: "merge"/*, onSuccess: "setUnreadcount"*/},
		{name: "threadFinder", kind: "DbService", dbKind: "com.palm.chatthread:1", method: "get", onSuccess: "gotThread"},
		{name: "readMessageMerger", kind: "DbService", dbKind: "com.palm.message:1", method: "merge"},
		{name: "addFavoriteList", kind: "com.palm.library.contactsui.personListDialog", onBeforeOpen: "onBeforeOpenFavoriteList", onContactClick: "favoriteSelected", onCancelClick: "closeAddFavoriteList", mode: "noFavoritesOnly", showFavStars: false, showIMStatuses: false},
		{name: "buddyDialog", kind: "AddBuddyDialog"},
		{name: "noAccountDialog", kind: "ModalDialog", autoClose: true, style: "width: 20em; height: 8em;", contentHeight: "8em", components: [
			{content: $L("Add a messaging account to set your online status."), style:"padding-bottom:22px;text-align:center;"},
			{layoutKind: "HFlexLayout", components: [
				{kind: "Button", flex:1, caption: $L("OK"), onclick: "closeDialog"},
				{kind: "Button", flex:1, caption: $L("Add an Account"), onclick: "addAccountClicked"}
			]}
		]},
		{name: "appMenu", kind: "AppMenu", automatic: false, onOpen: "menuOnOpen", components: [
			{name: "addBuddyMenuItem", caption: $L("Add Buddy"), onclick: "addBuddy"},
			{name: "showOfflineMenuItem", caption: $L("Show Offline Buddies"), onclick: "updateOfflinePrefs", showOffline: true},
			{name: "prefsAccntsMenuItem", caption: $L("Preferences & Accounts"), onclick: "openPreferences"},
			{name: "helpMenuItem", kind: enyo.HelpMenu, target: "http://help.palm.com/messaging/index.html"}
		]},
		{name: "firstUseAppMenu", kind: "AppMenu", automatic: false, components: []},
		{name: "buddyInviteDelete", kind: "DbService", dbKind: "com.palm.iminvitation:1", method: "del"},
		{name: "buddyInviteFind", kind: "DbService", dbKind: "com.palm.iminvitation:1", method: "find", onSuccess: "invitesToDelete"}	

	],
	create: function() {
		this.inherited(arguments);
		
		// Mark main card as cachable off-screen.
		// This means it will usually not be closed when the user throws it away.
		if (window.PalmSystem) {
			PalmSystem.keepAlive(true);
		}
		
		this.viewInitialized = false;
		this.registerServices();
		
		this.resize();
		if (window.PalmSystem && enyo.application.firstLaunchHandler.shouldShowFirstLaunch()) {
			this.handleFirstLaunch();
		}
		
		// register for account changes
		enyo.application.accountService.register(this, this.accountsChanged.bind(this));
	},
	menuOnOpen: function(){
		enyo.messaging.keyboard.setKeyboardAutoMode();
	},
	accountsChanged: function() {
		var removedAccount = this.getRemovedAccount(enyo.application.accountService.getImAccounts());
		if (removedAccount) {
		    // Inform the DashboardManagers that the account has been removed so any
			// messages related to this account can be removed from the dashboard.
		    enyo.application.messageDashboardManager.accountRemoved(removedAccount);
		    enyo.application.inviteDashboardManager.accountRemoved(removedAccount);
		    
		    // Query for all the invite messages associated with this account so they
		    // can be deleted.
		    this.$.buddyInviteFind.cancel(); 		
		    this.$.buddyInviteFind.call({
		    	query: { 
		    	   where: [{ prop: "accountId",
			    	         op:   "=",
			    	         val:  removedAccount.accountId
			              }],
			       select: ["_id"]
		        }
		    });
		}
	    
	},	
	invitesToDelete: function(inSender, inResponse) {
		if (inResponse && inResponse.results) {
			for (var i = 0; i < inResponse.results.length; i++) {
				this.$.buddyInviteDelete.call({
					ids: [inResponse.results[i]._id]
				});
			}
		}
	},
	LoginStatesChange: function(inSender, inStates){
		if (this.$.chatView) {
			this.$.chatView.setLoginStates(inStates);
		}
	},
	prefsUpdated: function(inPrefs) {
		this.prefs = inPrefs;
		if (!this.prefs) {
			// app is still initializing
			return;
		}
			
		this.setOffline();
	},
	updatePrefs: function() {
		this.prefsHandler.setPrefs(this.prefs);
	},
	selectThread: function(inSender, inThread){
		//inThread could be null
		this.checkWideLayout();
		enyo.application.selectedThread = inThread;
		if (inSender === "Messaging") {
			this.$.chatView.setChatThread(inThread);
		}
		else if (inSender === "ChatView") {
			//update highlight for threadlist, buddylist and favorite list
			this.$.messaging.setSelection(inThread);
		}
		else {
			this.$.chatView.setChatThread(inThread);
			this.$.messaging.setSelection(inThread);
		}
	},
	deleteThread: function(inSender, inThread) {
		this.$.chatView.setDeletedChatThread(inThread);
	},
	threadLocked:function(inSender, inThread) {
		if (this.$.chatView.getViewName() === "chatView") {
			this.$.chatView.threadLocked(inThread);
		}
	},
	openComposeView: function(inSender) {
		enyo.messaging.keyboard.setKeyboardAutoMode();
		this.checkWideLayout();
		if (enyo.application.selectedThread) {
			this.selectThread(undefined, undefined);
		}
		if (this.$.chatView.getViewName() !== "composeView") {
			this.$.chatView.selectViewByName("composeView");
		}
	},
	checkWideLayout: function() {
		/*
		if (!this.$.slidingGroup.getWideLayout()) {
			this.$.slidingGroup.setSelected(this.$.conversationSliding);
		}
		*/
	},
	clearUnreadCount: function(inSender, inThreadId){
		this.clearUnreadCountForThread(inThreadId);
		this.setThreadMessagesRead(inThreadId);
	},
	clearUnreadCountForThread: function(inThreadId) {
		this.$.threadServiceMerge.call({objects: [
			{_id: inThreadId,  unreadCount: 0}
		]});
	},
	setThreadMessagesRead: function(inThreadId){
		//enyo.log("MessagingApp: updating inbox messages to be read for thread '", inThreadId, "'");
		//TODO: may want to use the 'unreadRevSet' value to limit to only new 
		//inbox messages' read flag to be updated
		var myquery = JSON.stringify({query: {
				from: "com.palm.message:1",
				where: [
					{
						"prop": "conversations",
						"op": "=",
						"val": inThreadId
					},
					{
						"prop": "folder",
						"op": "=",
						"val": enyo.messaging.message.FOLDERS.INBOX
					}
				]
			},
			props: {
				flags: {read: true}
			}
	});
		this.$.readMessageMerger.call(myquery
			);
	},
	addBuddy: function(inSender, inEvent) {
		enyo.messaging.keyboard.setKeyboardAutoMode();
		this.$.buddyDialog.openAtCenter();
	},
	showAddAccountDialog: function() {
		this.$.noAccountDialog.openAtCenter();
	},
	addAccountClicked: function() {
		this.$.noAccountDialog.close();
		this.openPreferences();
	},
	closeDialog: function() {
		this.$.noAccountDialog.close();
	},
	onBeforeOpenFavoriteList: function() {
		this.$.addFavoriteList.removeClass("enyo-view");
	},
	showAddFavoriteList: function() {
		enyo.messaging.keyboard.setKeyboardAutoMode();
		this.$.addFavoriteList.openAtCenter();	
	},
	favoriteSelected: function (inSender, inParams) {
		ContactsLib.PersonFactory.createPersonDisplay(inParams).makeFavorite();
		this.$.addFavoriteList.closeDialog();
	},
	closeAddFavoriteList: function () {
		this.$.addFavoriteList.closeDialog();
	},
	updateOfflinePrefs: function() {
		this.prefs.showOnlineBuddiesOnly = !this.prefs.showOnlineBuddiesOnly;
		this.updatePrefs();
	},
	setOffline: function() {
		this.setOfflineMenuItem();
		this.$.messaging.setOfflinePrefs(this.prefs);
	},
	setOfflineMenuItem: function() {
		if (this.$.showOfflineMenuItem) {
			if (this.prefs.showOnlineBuddiesOnly) {
				this.$.showOfflineMenuItem.setCaption($L("Show Offline Buddies"));
			}
			else {
				this.$.showOfflineMenuItem.setCaption($L("Hide Offline Buddies"));
			}
		}
	},
	handleFirstLaunch: function() {
		if (!this.$.firstLaunch) {
			this.createView("firstLaunch");
		}
		this.selectView(this.$.firstLaunch, true);
		
		// show buddy list after first launch
		this.$.messaging.menuToggle(this, 1);
		// highlights the radio button for conversations view
		this.$.messaging.highlightTabButton(1);
	},
	doneFirstLaunch: function() {
		enyo.application.firstLaunchHandler.passedFirstLaunch();
		
		// change view
		this.selectViewByName("slidingGroup");
		this.$.messaging.workaroundListVisibilityBug();
	},
	openPreferences: function() {
		if (!this.$.preferencesView) {
			this.createView("preferencesView");
		}
		this.selectView(this.$.preferencesView, true);
		// should not filter any messages from dashboards
		enyo.application.messageDashboardManager.setFilter({filterAll: false, thread: undefined});
		enyo.application.inviteDashboardManager.setFilter({filterAll: false, thread: undefined});
	},
	closePreferences: function(){
		this.$.messaging.workaroundListVisibilityBug();
		this.selectViewByName("slidingGroup");
		// re-enable filtering in dashboards
		var selected = enyo.application.selectedThread && enyo.application.selectedThread._id;
		enyo.application.messageDashboardManager.setFilter({filterAll: false, thread: selected});
		enyo.application.inviteDashboardManager.setFilter({filterAll: false, thread: selected});
	},
	backHandler: function() {
		this.back();
	},
	openAppMenuHandler: function() {
		var menu = !this.prefs || this.prefs.firstUseMode ? this.$.firstLaunchAppMenu : this.$.appMenu;
		
		if (menu) {
			menu.removeClass("enyo-view");
			menu.open();
			
			if (this.prefs && !this.prefs.firstUseMode) {
				// initialize offline menu item with respect to preference setttings
				this.setOfflineMenuItem();
			}
		}
	},
/*	closeAppMenuHandler: function() {
		this.$.appMenu.close();
	},*/
	resize: function() {
	  	this.$.slidingGroup.resize();
		// instruct the conversation list to resize itself.
		this.$.chatView.resize();  
	},
	resizeHandler: function() {
	    this.inherited(arguments);
        this.resize();
	},
	windowParamsChangeHandler: function(inSender, event) {
		enyo.log("in windowParamsChangeHandler in MessagingApp");
		enyo.log("event.params: ", event.params);		
		enyo.error("*&*&*&*&* window reactivated: ", event.params);
		enyo.messaging.keyboard.setKeyboardAutoMode();
		this.checkWideLayout();
		var launchHandled = this.handleDisplayMessageLaunch(event && event.params);
		return launchHandled;
	},
	handleDisplayMessageLaunch: function (launchParams) {
		enyo.log("in MessagingApp handleDisplayMessageLaunch");
		enyo.log("launchParams: ", launchParams);
		
		if (window.PalmSystem && enyo.application.firstLaunchHandler.shouldShowFirstLaunch()) {
			this.handleFirstLaunch();
			return true;
		}
		
		this.selectViewByName("slidingGroup");
		this.registerServices();
		
		if (launchParams.compose) {
			this.$.chatView.preHandleLaunch(launchParams.compose);
			return true;
		} else if (launchParams.message) {
			// case launch from taping on notification, find the chat thread and launch it
			this.findThread(launchParams.message.conversations[0]);
			return true;
		} else if (launchParams.messageText || launchParams.attachment|| launchParams.personId || (launchParams.composeRecipients && launchParams.composeRecipients.length)) {
			enyo.warn("*** Warning, using deprecated launch params:",launchParams);
			if(launchParams.attachment){
				enyo.error("*** ERROR:attachment is not supported");
			}
			this.$.chatView.preHandleLaunch(launchParams);
		} else {
			// show threadsList in Messaging
			this.showThreadsList();
			return true;
		}
	},
	findThread: function(threadId) {
		var tIds = [threadId];
		this.$.threadFinder.call({ids: tIds});
	},
	gotThread: function(inSender, inResponse) {
		//case that taping on notifications, so, need update both chatView(open or update with new chatThread) and Messaging (for selection of threadList, buddyList)
		this.selectThread(this, inResponse.results[0]);
	},
	showThreadsList: function() {
		// show threadsList
		this.$.messaging.menuToggle(this, 0);
		// highlights the radio button for threadsList view
		this.$.messaging.highlightTabButton(0);
	},
	windowHiddenHandler: function() {
		enyo.messaging.keyboard.setKeyboardAutoMode();
		if (this.prefs && !this.prefs.firstUseMode) {			
			// close addFavoriteList if it is opened
			if (this.$.addFavoriteList && this.$.addFavoriteList.isOpen) {
				this.$.addFavoriteList.closeDialog();
			}
			
			// let enclosed components to handle window hidden state themselves
			this.$.messaging.windowHiddenHandler();
			
			// clear other app states
			this.unloadHandler();
			
			// close menu
			this.$.appMenu.close();
		}
	},
	windowShownHandler:function() {
		if (this.prefs && !this.prefs.firstUseMode) {
			// switch back to default view
			this.$.slidingGroup.selectViewImmediate(this.$.messagingSliding);
			this.selectView(this.$.slidingGroup);
			
			// call windows show handler to child components
			this.$.messaging.windowShownHandler();
		}
	},
	windowActivatedHandler: function() {
		//enyo.log("***************** messaging app window activated");
		// clear new message notifications
		enyo.application.messageDashboardManager.setAppDeactivated(false);	
        
		if (enyo.application.selectedThread) {
		    this.clearUnreadCount(this, enyo.application.selectedThread._id);
		}
	},
	windowDeactivatedHandler: function() {
		//enyo.log("***************** messaging app window deactivated");
		// allow new message notifications to show
		enyo.application.messageDashboardManager.setAppDeactivated(true);
		if (enyo.application.selectedThread) {
		    this.clearUnreadCount(this, enyo.application.selectedThread._id);
		}

	},
	unloadHandler: function(){
        if (enyo.application.selectedThread) {
            // clear out selected thread 
    		enyo.application.selectedThread = undefined;
        }	
			
		this.unregisterServices();
//		this.inherited(arguments);
	}, 
	registerServices: function() {
		this.prefsHandler = enyo.application.prefsHandler;
		if (this.prefsHandler) {
			this.prefsHandler.register(this, this.prefsUpdated.bind(this));
		}
	},
	unregisterServices: function() {
		if (this.prefsHandler) {
			this.prefsHandler.unregister(this);
			if (this.$.preferencesView) {
				this.$.preferencesView.unloadHandler();
			}
		}
		
		if (this.$.firstLaunch) {
			this.$.firstLaunch.unregisterServices();
		}
	},
	
	/***********************************
	 * Functions below are unit tested *
	 ***********************************/
	getRemovedAccount: function(imAccounts) {
	    var removedAccount = null;
	  
        function imAccountsContain(account) {
            var i = imAccounts.length;
            while (i--) {
                if (imAccounts[i].accountId === account.accountId) {
                    return true;
                }
            }
            return false;
        }
        
        if (this.accountsInfo === undefined) {
            this.accountsInfo = [];
        }
        
	    if (imAccounts && (imAccounts.length > this.accountsInfo.length)) {	        
	        // Clear out the array so it can refreshed.
	        this.accountsInfo.splice(0, this.accountsInfo.length);

			for (var i = 0; i < imAccounts.length; i++) {
				this.accountsInfo.push(imAccounts[i]);
			}			
		} else if (imAccounts && (imAccounts.length < this.accountsInfo.length)) {
		    // Determine which account that was removed.
		    var x = this.accountsInfo.length;
		    while (x--) {
		        if (!imAccountsContain(this.accountsInfo[x])) {
		            removedAccount = this.accountsInfo[x];
		            this.accountsInfo.splice(x, 1); 
		            break;
		        }
		    }	    
		}	        

	    return removedAccount;
	}
});
