enyo.kind({
	name: "ThreadList",
	kind: "VFlexBox",
	events: {
		onSelectThread: "",
		onDeleteThread: "",
		onThreadLocked: "",
		onUnreadCountChanged: ""
	},
	components: [
		{kind: "ThreadService", onSuccess: "gotThreads", onWatch: "threadsWatch"},
		{name: "deleteService", kind: "DeleteThreadService"},
		{name: "search", kind: "SearchInput", hint: $L("Search"), className:"enyo-middle", onchange: "filterList", onCancel: "filterList", changeOnInput: true,  autoCapitalize: "lowercase", onfocus: "disableKeyboardMannualMode"},
		{className:"header-shadow header-app-shadow"},
		{name: "emptyMessage", content: "", className:"messageTexts", showing: false},
		{flex: 1, name: "list", kind: "DbList", desc: true, onQuery: "listQuery", className:"messaging-listsDivider", onSetupRow: "listSetupRow", components: [
			{kind: "Divider", className:"threadList-Divider"},
			{kind: "ThreadItem", tapHighlight:true, onConfirm: "swipeDelete", onclick: "selectThread", onCancel: "disableKeyboardMannualMode"}
		]}
	],
	disableKeyboardMannualMode: function(){
		enyo.messaging.keyboard.setKeyboardAutoMode();
	},
	
	filterList: function(inSender, inValue){
	    this.filterString = this.$.search.getValue();
		this.$.list.punt();
	},
	listQuery: function(inSender, inQuery) {
		if (this.filterString && this.filterString.length > 0) {
			inQuery.where = [{prop: "flags.visible", op: "=", val: true},{prop: "displayName", op:"%", val:this.filterString, collate: "primary", "tokenize":"all"}];
			inQuery.search = true;
		}
		else{
			inQuery.where = [{
				prop: "flags.visible",
				op: "=",
				val: true
			}];
		}
		inQuery.orderBy = "timestamp";
		return this.$.threadService.call({query: inQuery});
	},
	gotThreads: function(inSender, inResponse, inRequest) {
		this.$.list.queryResponse(inResponse, inRequest);
		if ((inRequest.index === 0) && (inResponse.returnValue && inResponse.results && inResponse.results.length === 0)){
			if (this.filterString && this.filterString.length > 0) {
				// No threads found using search
				this.showEmptyMessage(enyo.messaging.CONSTANTS.NO_SEARCH_RESULTS);
			} else {
				this.showEmptyMessage($L("Your conversation list is empty."));
			}
		} else {
			this.$.emptyMessage.hide();
		}
		
		var cnt = 0;
		if (inResponse && inResponse.results) {
			for (var i = 0; i < inResponse.results.length; i++) {
				var thread = inResponse.results[i];
				if (!enyo.application.selectedThread || thread._id !== enyo.application.selectedThread._id || enyo.application.messageDashboardManager.getAppDeactivated() === true) {
					cnt += thread.unreadCount;
				}
			}
		}
		//enyo.log("***************** total unread count in thread list: ", cnt);
		this.doUnreadCountChanged(cnt);
	},
	showEmptyMessage: function(message) {
		this.$.emptyMessage.setContent(message);
		this.$.emptyMessage.show();
	},
	threadsWatch: function() {
		// enyo.Service.call() creates a NEW request (3 subscribed finds) each time and
		// ThreadRequest.finish() is overridden not to self-destroy, so without this the watch
		// leaks 3 db8 watches per fire (chatthread/person/imbuddystatus) — hundreds under a busy
		// channel. cancel() -> destroyComponents() releases the prior request + its subscriptions.
		this.$.threadService.cancel();
		this.$.list.reset();
	},
	selectThread: function(inSender, inEvent) {
		this.selectedRecord = this.$.list.fetch(inEvent.rowIndex);
		if(enyo.application.selectedThread && this.selectedRecord && enyo.application.selectedThread._id === this.selectedRecord._id){
			//tap on current selected record, do nothing
			return;
		}
		if (this.selectedRecord) {
			this.$.list.refresh();
			this.doSelectThread(this.selectedRecord);
		}
	},
	setupDivider: function(inThread, inIndex) {
		var date = new Date(inThread.timestamp);
		var caption = BucketDateFormatter.getDateBucket(date);
		var pt = this.$.list.fetch(inIndex - 1);
		var previousCaption = pt && BucketDateFormatter.getDateBucket(new Date(pt.timestamp));
		var showDivider = caption != previousCaption;
		if (showDivider) {
			this.$.divider.setCaption(caption);
			this.$.threadItem.addClass("enyo-first");
		}
		this.$.divider.canGenerate = showDivider;
		// this.$.threadItem.applyStyle("border-top", Boolean(showDivider) ? "none" : "1px solid silver;");
	},
	listSetupRow: function(inSender, inThread, inIndex) {
		// Do not perform model changes in this rendering method
		if (this.selectedRecord && this.selectedRecord._id === inThread._id && this.selectedRecord.flags.locked !== inThread.flags.locked){
			this.doThreadLocked(inThread);
		}
		this.setupDivider(inThread, inIndex);
		this.$.threadItem.setThread(inThread);
		
		// make to the row to be selected if it is selected by user
		this.$.threadItem.addRemoveClass("enyo-item-selected", this.selectedRecord && this.selectedRecord._id === inThread._id ? true : false);
	},
	swipeDelete: function(inSender, inIndex) {
		enyo.messaging.keyboard.setKeyboardAutoMode();
		var record = this.$.list.fetch(inIndex);
		if (record && record._id) {
			this.$.deleteService.setId(record._id);
			this.$.deleteService.deleteThread();
			this.doDeleteThread(record);
		}
	},
	setSelection: function(inChatThread){
		if (this.selectedRecord && inChatThread && this.selectedRecord._id === inChatThread._id) {
		//case selection didn't change, do nothing
			return;	
		}
		else {
			this.selectedRecord = inChatThread;
//			if (!inChatThread) {
				this.$.list.refresh();
//			}
		}
	},
	updateList: function() {
		this.$.list.update();
	},
	resetList: function() {
		this.$.list.reset();
	},
	windowHiddenHandler: function(){
		// dump data buffer
		this.$.list.punt();
		// cancel service call
		//this.$.threadService.cancel();
		
		// clear out filter search
		this.filterString = "";
		this.$.search.setValue(this.filterString);
		this.$.search.forceBlur();
	}
});
