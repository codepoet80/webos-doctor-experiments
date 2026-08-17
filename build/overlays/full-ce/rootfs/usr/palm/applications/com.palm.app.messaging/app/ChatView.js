enyo.kind({
	name: "ChatView",
	kind: "Pane",
	className: "conversationList",
	transitionKind: "enyo.transitions.Simple",
	events: {
		onSelectThread: "",
		onClearUnreadCount: ""
	},
	published: {
		chatThread: "",
		params:"",
		loginStates:[]//,
//		deletedChatThread: ""
	},
	components: [
		{kind: "ApplicationEvents", onWindowHidden:"windowHiddenHandler"},
		{name: "defaultView", kind: DefaultView},
		{name: "dbGetById", kind: "DbService", dbKind: "com.palm.db:1", method: "get", onSuccess: "gotRecordById"},
		{name: "chatThreadServiceFind", kind: "DbService", dbKind: enyo.messaging.thread.dbKind, method: "find", onSuccess: "gotConversationByPersonId", onFailure: "conversationFailure"},
		{name: "chatThreadServiceCreate", kind: "DbService", dbKind: enyo.messaging.thread.dbKind, method: "put", onSuccess: "threadCreated", onFailure: "conversationFailure"},
		// Open/create a 1:1 when a group-message sender name is tapped (find by address, then create).
		{name: "senderThreadFind", kind: "DbService", dbKind: enyo.messaging.thread.dbKind, method: "find", onSuccess: "senderThreadFound", onFailure: "conversationFailure"},
		{name: "senderThreadCreate", kind: "DbService", dbKind: enyo.messaging.thread.dbKind, method: "put", onSuccess: "senderThreadCreated", onFailure: "conversationFailure"},
		{name: "errorDialog", kind: "PopupDialog", onAccept: "retryMessage"},
		{name: "composeView", kind: "ComposeView", onOpenConversation: "openConversationById"},
		{name: "conversationList", kind: "ConversationList", onCloseConversationList:"closeConversationList",onSelectThread: "selectThread", onClearUnreadCount: "doClearUnreadCount", onOpenComposeView:"openComposeView", onSelectSender: "openConversationWithSender"}
	],
	create: function() {
		this.inherited(arguments);
	},
	chatThreadChanged: function(inOldChatThread) {
		if(this.chatThread){
			// Making 'selectViewByName' to be synchronous by passing 'true' as the second
			// parameter to fix bug DFISH-26620.
			this.selectViewByName("conversationList", true);
		}
		this.$.conversationList.setChatThread(this.chatThread);
	},
	selectThread: function(inSender, inThread) {
		this.doSelectThread(inThread);
	},
	// Open a 1:1 with a tapped group-message sender: find an existing chatthread by the sender's
	// address, else create one. person = {username: <routable id>, serviceName, displayName}.
	openConversationWithSender: function(inSender, person) {
		if (!person || !person.username) {
			return true;
		}
		this._pendingSender = person;
		this.$.senderThreadFind.cancel();
		this.$.senderThreadFind.call({
			query: { where: [{
				prop: "normalizedAddress",
				op: "=",
				val: enyo.messaging.utils.normalizeAddress(person.username, person.serviceName)
			}] }
		});
		return true;
	},
	senderThreadFound: function(inSender, inResponse) {
		if (inResponse.returnValue && inResponse.results && inResponse.results.length > 0) {
			this.chatThread = inResponse.results[0];
			this.chatThreadChanged();
			this.doSelectThread(this.chatThread);
			this._pendingSender = undefined;
		} else {
			var p = this._pendingSender || {};
			this.$.senderThreadCreate.call({
				objects: [{
					"_kind": enyo.messaging.thread.dbKind,
					"timestamp": new Date().getTime(),
					"displayName": p.displayName || p.username,
					"replyAddress": p.username,
					"normalizedAddress": enyo.messaging.utils.normalizeAddress(p.username, p.serviceName),
					"replyService": p.serviceName,
					"summary": "",
					"flags": { "visible": false }
				}]
			});
		}
	},
	senderThreadCreated: function(inSender, inResponse) {
		if (inResponse.returnValue && inResponse.results && inResponse.results.length > 0) {
			// gotRecordById opens the freshly-created chatthread (same path as the personId flow).
			this.$.dbGetById.call({ "ids": [inResponse.results[0].id] });
		}
		this._pendingSender = undefined;
	},
	setDeletedChatThread: function(inThread){
		this.$.conversationList.setDeletedChatThread(inThread);
	},
	threadLocked: function(inThread){
		this.$.conversationList.threadLocked(inThread);
	},
	loginStatesChanged: function(oldLoginStates){
		this.$.conversationList.setLoginStates(this.loginStates);
		this.$.composeView.setLoginStates(this.loginStates);
	},
	resize: function() {
		if (this.getViewName() === "conversationList") {
			// reset adjusts the scroller and tries to maintain the scroll position
			this.$.conversationList.resize();
		}
	},
	closeConversationList: function() {
		if (this.getViewName() === "conversationList") {
			this.selectViewByName("defaultView");
		}
	},
	//launchParams.compose or launchParams from MessagingApp.js
	preHandleLaunch: function(params) {
		if (this.$.conversationList) {
			// Messaging can be launched from the detailsDialog popup. So close the popup
			// and allow the user to compose and send their message.
			this.$.conversationList.closeDetailsDialog();
			
		}
		if (params.ims && params.ims.length > 0) {
			var im = params.ims[0];
			var imIsOk = this.validateAccountAndDisplayWarning(im);
			if (imIsOk){
				this.handleLaunch(params);
			}
		}
		else if(params.phoneNumbers && params.phoneNumbers.length > 0){
			var phone = params.phoneNumbers[0];
			var textIsOk = this.validateAccountAndDisplayWarning(phone);
			if (textIsOk){
				this.handleLaunch(params);
			}
		}
		else {
			this.handleLaunch(params);
		}
	},
	handleLaunch: function(params) {
		if (params && params.personId) {
			enyo.log("ChatView::handleLaunch::should be conversation view");
			this.composeParameter = params;
			var whereClause = [{ prop: "personId", op: "=", val: params.personId }];
			this.$.chatThreadServiceFind.cancel();
			this.$.chatThreadServiceFind.call({
				query: {where: whereClause}
			});//gotConversationByPersonId
		}
		else {
			if (this.getViewName() === "conversationList" && this.$.conversationList) {
				this.$.conversationList.closeConversation();
			}
			this.doSelectThread(undefined);
			this.openComposeView(this, params);
		}
	},
	openComposeView: function(inSender, params){
		if (params) {
			this.$.composeView.setParams(params);
		}
		this.selectViewByName("composeView");
	},
	gotConversationByPersonId: function(inSender, inResponse){
//todo: found more than one converstaion by personId, both are not locked, bug in chatthread?
		if (inResponse.returnValue && inResponse.results && inResponse.results.length > 0) {
			//show found thread
			if (!this.chatThread || (this.chatThread && this.chatThread._id !== inResponse.results[0]._id)) {
				this.chatThread = inResponse.results[0];
				this.doSelectThread(this.chatThread);
			}
			if (this.composeParameter) {
				var overrideReplyAddress = {};
				if (this.composeParameter.ims && this.composeParameter.ims.length > 0) {
					overrideReplyAddress = this.composeParameter.ims[0];
				}
				else 
					if (this.composeParameter.phoneNumbers && this.composeParameter.phoneNumbers.length > 0) {
						overrideReplyAddress = this.composeParameter.phoneNumbers[0];
					}
				
				var addr = overrideReplyAddress.value || overrideReplyAddress.addr;
				var serviceName = overrideReplyAddress.serviceName || overrideReplyAddress.type;
				enyo.log("ChatView::gotConversationByPersonId::Overriding reply address serviceName:", serviceName, " addr:", addr);
				this.chatThread.replyAddress = addr;
				this.chatThread.normalizedAddress = enyo.messaging.utils.normalizeAddress(addr, serviceName);
				this.chatThread.replyService = serviceName;
			}
			this.composeParameter = undefined;
			this.chatThreadChanged();
		}
		//case that start chat from contact's im, which has personId, but no chatthread with this person 
		else if (this.composeParameter.personId) {
			this.$.dbGetById.call({"ids":[this.composeParameter.personId]});//gotRecordById()
		}
	},

	//thread is created based on composeParameter.personId
	threadCreated : function(inSender, inResponse){
		if (inResponse.returnValue && inResponse.results && inResponse.results.length > 0) {
			this.$.dbGetById.call({"ids":[inResponse.results[0].id]});//gotRecordById()
			this.composeParameter = undefined;
		}
	},
	gotRecordById: function(inSender, inResponse){
		if (inResponse.returnValue && inResponse.results && inResponse.results.length > 0) {
			if (inResponse.results[0]._kind === enyo.messaging.thread.dbKind) {
//case that compose view create a chatthread, now need open that chatthread, also thread is created in this file for case that composeParamter has personId
				if (!this.chatThread || (this.chatThread && this.chatThread._id !== inResponse.results[0]._id)) {
					this.chatThread = inResponse.results[0];
					this.chatThreadChanged();
					this.doSelectThread(this.chatThread);
				}
			}
			else if (inResponse.results[0]._kind === "com.palm.person:1") {
//creat chatthread based on person info, which only displayName which generated from person will be used

				var person = inResponse.results[0];
				var address;
				if (this.composeParameter.phoneNumbers) {
					address = this.composeParameter.phoneNumbers[0];
				}
				else if (this.composeParameter.ims){
					address = this.composeParameter.ims[0];
				}
				var replyAddress = address.value;
				var serviceName = address.type;
				var displayName = enyo.messaging.person.getDisplayName(person);
				this.$.chatThreadServiceCreate.call({
					objects: [{
						"_kind": enyo.messaging.thread.dbKind,
						"timestamp": new Date().getTime(),
						"personId": this.composeParameter.personId,
						"displayName": enyo.messaging.person.isNotBlank(displayName) ? displayName : undefined,
						"replyAddress": replyAddress,
						"normalizedAddress": enyo.messaging.utils.normalizeAddress(replyAddress, serviceName),
						"replyService": serviceName,
						"summary": "",
						"flags": {
							"visible": false
						}
					}]
				});//threadCreated();
			}
		}
		else {//edge case for non-valid person id, launch compose view instead
			enyo.warn("ChatView::launch parameter has a nonvalid personid");
			this.composeParameter.personId = undefined;
			this.$.composeView.setParams(this.composeParameter);
			this.composeParameter = undefined;
			this.selectViewByName("composeView");
		}
	},
	validateAccountAndDisplayWarning: function(addressObj) {
		var serviceName = addressObj.serviceName || addressObj.type;
		var isSupported = enyo.application.accountService.getAccount(serviceName);
		if (!isSupported) {
			var errorMessage;
			if (enyo.messaging.utils.isTextMessage(serviceName)) {
				errorMessage = $L("SMS capability is required.");
			}
			else {
				errorMessage = $L("You have not set up an IM account of this type.");
			}
			
			this.$.errorDialog.openAtCenter();
			this.$.errorDialog.setTitle($L("Unable to launch chat"));
			this.$.errorDialog.setMessage(errorMessage);
			this.$.errorDialog.setCancelButtonCaption($L("OK"));
			this.$.errorDialog.hideAcceptButton();
		}
		
		return isSupported;
	},
	rendered: function() {
		this.inherited(arguments);
	},
	openConversationById: function(inSender, inThreadId){
		if(inThreadId)
		{	this.$.dbGetById.call({
				"ids": [inThreadId]
			});//gotRecordById()
		}
	},
	windowHiddenHandler: function(){
		this.selectViewByName("defaultView");
	},
	conversationFailure: function(inSender, inResponse){
		enyo.error("ConverstaionList::conversationFailure::inResponse:", inResponse);
	}
});