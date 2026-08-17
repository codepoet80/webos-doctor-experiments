enyo.kind({
	name: "ConversationList",
	kind: enyo.VFlexBox,
	selectedMessage: "",
	events: {
		onSelectThread: "",
		onClearUnreadCount: "",
		onCloseConversationList: "",
		onOpenComposeView:"",
		onSelectSender: ""
	},
	published: {
		chatThread: "", 
		params:"",
		loginStates:[],
		deletedChatThread: ""
	},
	components: [
		{kind: "ApplicationEvents", onUnload: "windowUnloadHandler", onWindowHidden:"windowHiddenHandler"},
			{name: "dbDelete", kind: "DbService", dbKind: "com.palm.db", method: "del"},
			{name: "dbFind", kind: "DbService", dbKind: "com.palm.db", method: "find", onSuccess: "gotMessagesForChatThreadId"},
			{name: "dbMerge", kind: "DbService", dbKind: "com.palm.db", method: "merge"},
			// webOS reactions (SEND): writes an imcommand row the transport watches (command
			// "sendReaction") to transmit a reaction to the network. See sendReactionCommand.
			{name: "reactionCommand", kind: "DbService", dbKind: "com.palm.imcommand:1", method: "put"},
			{kind: "VFlexBox", flex: 1, onclick:"disableKeyboardMannualMode", components: [
				{kind: "Toolbar", className:"enyo-toolbar-light conversation-header", layoutKind: "HFlexLayout", align: "center", components: [
					{name: "buddyStatusServiceWatch", kind: enyo.TempDbService, dbKind: "com.palm.imbuddystatus:1", method: "find", onSuccess: "gotStatus", subscribe: true, resubscribe: true, reCallWatches: true},
					{name: "status", className: "status"},
					{kind:"Control", name: "header", className: "conversation-header-content", allowHtml: true, flex: 1, onclick: "handleHeaderTap"},
					{name: "videoCallButton", kind: "IconButton", icon: "images/video-call-icon.png", showing: false, onclick: "videocall", className: "conversation-call-btn"},
					{name: "phoneCallButton", kind: "IconButton", icon: "images/phone-icon.png", showing: false, onclick: "voicecall", className: "conversation-call-btn"},
					{kind: "Button", className:"conversation-header-type", components:[
						{name: "personServiceWatch", kind: "DbService", dbKind: "com.palm.person:1", method: "find", onSuccess: "gotPerson", subscribe: true, resubscribe: true, reCallWatches: true, onFailure: "personFailure"},
						{name: "contactServiceGet", kind: "DbService", dbKind: "com.palm.contact:1", method: "get", onSuccess: "gotContacts", onFailure: "contactFailure"},
						{name: "transportselector", kind: "TransportSelector",onPhoneClick:"dial", onVideoClick: "videocall", label: $L("."), hideCaption: true, align: "center", onChange: "transportChange"}
					]}
				]},
				{className:"header-shadow"},
				{name: "messageService", kind: "DbService", dbKind: enyo.messaging.message.dbKind, onFailure: "messagesFailure", components: [
					{name: "messageServicePutOutbox", method: "put", onSuccess: "revealListBottom"},//for outbox message
					{name: "messageServicePut", method: "put"},//for status message and draft
					{name: "messageServiceFind", method: "find", onSuccess: "gotDraftMessages"}
				]},
				{kind: "ConversationService", onSuccess: "gotMessages", onWatch: "messagesWatch"},
				{name: "launchApp", kind: "PalmService", service: "palm://com.palm.applicationManager/", method: "open"},
				{name: "appLauncher", kind: "PalmService", service: "palm://com.palm.applicationManager/", method: "launch"},
				{name: "errorDialog", kind: "PopupDialog", onAccept: "retryMessage"},
				{name: "buddyOfflineDialog", kind: "PopupDialog", onAccept: "sendAny"},
				{kind: "PopupSelect", onSelect: "popupMenuSelect"},
				// Reaction picker: short tap (handleMessageTap) or short right-swipe (handleReactSwipe)
				// on a message opens this quick emoji row. Tapping an emoji reacts (optimistic merge onto
				// the row's reactions array); the trailing "..." opens the full message menu (openMessageMenu).
				// Emoji are stored as HTML numeric entities so they survive the db8/JS round-trip and
				// render via emojify() (astral emoji are tofu otherwise). Button contents set in create().
				{name: "reactRow", kind: "Popup", modal: true, dismissWithClick: true, onBeforeOpen: "setupReactEmoji", className: "reaction-picker-popup", components: [
					{name: "reactRowBox", className: "reaction-row-box", components: [
						{kind: "Control", className: "reaction-pick", allowHtml: true, reactionValue: "&#10084;&#65039;", onclick: "reactPicked"},
						{kind: "Control", className: "reaction-pick", allowHtml: true, reactionValue: "&#128077;", onclick: "reactPicked"},
						{kind: "Control", className: "reaction-pick", allowHtml: true, reactionValue: "&#128518;", onclick: "reactPicked"},
						{kind: "Control", className: "reaction-pick", allowHtml: true, reactionValue: "&#128558;", onclick: "reactPicked"},
						{kind: "Control", className: "reaction-pick", allowHtml: true, reactionValue: "&#128546;", onclick: "reactPicked"},
						{kind: "Control", className: "reaction-pick", allowHtml: true, reactionValue: "&#128591;", onclick: "reactPicked"},
						{kind: "Control", className: "reaction-pick reaction-more", allowHtml: true, content: "&#8226;&#8226;&#8226;", onclick: "reactMore"}
					]}
				]},
				{flex: 1, name: "list", kind: "FlyweightDbList", pageSize: 20, style: "border: none;", desc: true, bottomUp: true, onQuery: "listQuery", onSetupRow: "listSetupRow", components: [
					{name: "listButtons", layoutKind: "HFlexLayout", flex: 1, showing: false, className:"block-delete-box", components: [
						{name: "blockButton", kind: "Button", caption: $L("Block Sender"), className:"enyo-button-light blocksender-bt", onclick: "promptBlock", flex: 1},
						{name: "deleteButton", kind: "Button", caption: $L("Delete Conversation"), className:"enyo-button-light deleteconversation-bt", onclick: "promptDelete", flex: 1}
					]},
					{kind: "Divider", icon: "images/default_transport_splitter.png", className: "conversationDivider", caption: ""},
					{kind: "ConversationItem", style: "border: none;", onConfirm: "swipeDelete", onclick: "handleMessageTap", onReact: "handleReactSwipe", onError: "showErrorDialog", onCancel: "disableKeyboardMannualMode", onSelectSender: "senderRowSelected", onOpenAttachment: "openAttachment"}
				]}
			]},
			{className:"footer-shadow"},
			// Attachment send: a staged-attachment chip shown above the input once the user picks a
			// file. Hidden until an attachment is chosen; the decline icon clears it. The picked file's
			// absolute path rides along on the outgoing immessage as "filePath" (see sendMessage).
			{name: "attachmentChip", showing: false, className: "attachment-chip", components: [
				{name: "attachmentChipThumb", kind: "Image", className: "attachment-chip-thumb"},
				{name: "attachmentChipLabel", kind: "Control", className: "attachment-chip-label"},
				// Voice message: an inline preview player (play/pause + progress) - same markup as a
				// received voice note. Shown only for a staged recording (hidden for image attachments).
				{name: "attachmentChipPlayer", kind: "Control", className: "attachment-chip-player", allowHtml: true, showing: false, onclick: "chipPlayerTapped"},
				{name: "attachmentChipRemove", kind: "IconButton", icon: "images/icon-decline.png", onclick: "clearAttachment"}
			]},
			// Reply/quote bar: shown above the input while replying to a message; the X cancels reply mode.
			{name: "replyBar", showing: false, className: "reply-bar", layoutKind: "HFlexLayout", align: "center", components: [
				{className: "reply-bar-accent"},
				{name: "replyBarText", flex: 1, allowHtml: true, className: "reply-bar-text"},
				{name: "replyBarClose", kind: "IconButton", icon: "images/icon-decline.png", onclick: "cancelReply", className: "reply-bar-close"}
			]},
			{name:"footer", kind: "Toolbar", className:"enyo-toolbar-light conversation-bottom", components: [
				{name: "slidingDrag", slidingHandler: true, kind: "GrabButton" },
				// Paperclip LEFT of the input (clear of the absolute slide handle - see CSS margin);
				// send arrow on the RIGHT (restores the explicit Send button from webOS 2.2.x, Enter
				// still sends). Both are bare transparent icons (no button box) - see conversation.css.
				{name: "attachButton", kind: "IconButton", icon: "images/menu-icon-attach.png", onclick: "openAttachmentPicker", className: "conversation-attach-btn"},
				// Voice message: hold-free toggle - tap to start recording (native mediaserver MediaCaptureV3
				// -> clean 8kHz WAV), tap again to stop; the transport transcodes the WAV to an Ogg/Opus
				// voice note on send. Only shown on IM transports that accept attachments.
				{name: "micButton", kind: "IconButton", icon: "images/menu-icon-mic.png", onclick: "micButtonClicked", className: "conversation-mic-btn"},
				// Voice message: elapsed-time readout, shown only while recording.
				{name: "vnTimer", kind: "Control", className: "conversation-vn-timer", content: "", showing: false},
				/* Watch keyup because the default action of a key (printing/deleting a character)
				 * is done before keyup, which means the input will have resized.
				 * Watch keypress because pressing & holding a key generates
				 * multiple presses but never a keyup
				 */
				{name: "scroller", kind: "BasicScroller", style: "max-height: 155px;", flex: 1, horizontal: false, autoHorizontal: false,  components: [
				    {name: "richText", kind: "RichText", hint:$L("Enter message here..."), richContent: false, alwaysLooksFocused:true, onkeydown: "checkKey", autoEmoticons: true, onfocus: "setKeyboardMannualMode"}
				]},
				{name: "sendButton", kind: "IconButton", icon: "images/menu-icon-send.png", onclick: "sendButtonClicked", className: "conversation-send-btn"}
			]},
		{name: "detailsDialog", kind: "com.palm.library.contactsui.detailsDialog", style: "max-height: 700px", onCancelClicked: "closeDetailsDialog", onEdit: "closeDetailsDialog", onDone :"closeDetailsDialog", onAddToNew: "closeDetailsDialog", onAddToExisting: "closeDetailsDialog", onBeforeOpen: "onBeforeOpenDetailsDialog"},
        {name: "deleteDialog",  kind: "PopupDialog", onAccept: "deleteConversation"},
		{name: "deleteService", kind: "DeleteThreadService"},
		{name: "blockDialog",   kind: "PopupDialog", onAccept: "blockSender"},
		{name: "blockService",  kind: "BlockPersonService"},
		{name: "connectPhoneDialog", kind: "ConnectPhoneDialog"},
		{name: "systemPrefs", kind: enyo.SystemService, method: "getPreferences", subscribe: true, onSuccess: "gotSystemPrefs", onFailure: "gotSystemPrefsFailure"},
		{name: "chatThreadWatch", kind: "DbService", dbKind: "com.palm.chatthread:1", method: "find", onSuccess: "gotChatThread", subscribe: true, resubscribe: true, reCallWatches: true, onFailure: "chatThraedFailure"},
		// Attachment send: system file picker (images for now). onPickFile returns an array of
		// {name, fullPath, ...}; attachmentChosen stages result[0] on this.outboundAttachment.
		{name: "attachmentPicker", kind: "FilePicker", fileType: ["image", "video", "document"], onPickFile: "attachmentChosen"},
		// Voice message: one-shot LS2 calls to the dynamic MediaCaptureV3 endpoint (load / startAudioCapture
		// / stopAudioCapture). service+method are set per call. The captureV3 subscription itself is created
		// dynamically per recording (see startVoiceNote) so it can be torn down to end the mediaserver session.
		{name: "vnCmd", kind: "PalmService", onFailure: "vnCmdFailed"}
	],
	create: function() {
		this.inherited(arguments);
		// Register as the active conversation list so inline-image onload callbacks (which run from raw
		// HTML in the flyweight rows, outside any control) can reach us to re-measure after images load.
		enyo.messaging.activeConversationList = this;
		if (window.PalmSystem) {
			this.$.systemPrefs.call ({keys: ["timeFormat"]});
		}
		if (enyo.application.telephonyWatcher) {
			enyo.application.telephonyWatcher.register(this, this.connectionUpdated.bind(this));
		}
	},
	destroy: function() {
		if (enyo.messaging.activeConversationList === this) { enyo.messaging.activeConversationList = null; }
		if (this._imgRelayoutTimer) { clearTimeout(this._imgRelayoutTimer); this._imgRelayoutTimer = null; }
		this.inherited(arguments);
	},
	// An inline message image finished loading (see enyo.messaging.message.imageLoaded). The row was
	// measured at text height before the image had its real size, so re-measure the list. Debounced so
	// a burst of images triggers one relayout. Only snaps to the bottom if the user is already near it
	// (so re-measuring never yanks someone who scrolled up to read history).
	noteInlineImageLoaded: function() {
		if (!this.$.list) { return; }
		var self = this;
		if (this._imgRelayoutTimer) { clearTimeout(this._imgRelayoutTimer); }
		this._imgRelayoutTimer = setTimeout(function () {
			self._imgRelayoutTimer = null;
			if (!self.$.list || !self.$.list.$.scroll) { return; }
			if (self.$.list.$.scroll.y < enyo.messaging.MAX_BOTTOM_HEIGHT_FOR_SNAP) {
				self.$.list.punt();   // near bottom -> re-measure and reveal the now full-height image
			} else {
				self.$.list.reset();  // scrolled up -> re-measure rows but keep the reading position
			}
		}, 120);
	},
	connectionUpdated: function(connected) {
		this.phoneConnected = connected;
	},
	onBeforeOpenDetailsDialog: function(){	
		if (this.chatThread.personId) {
			this.$.detailsDialog.setPersonId(this.chatThread.personId);
		}
		else {
			var contact = ContactsLib.ContactFactory.createContactDisplay();
			var serviceName = this.chatThread.replyService;
			var chatAddress = this.chatThread.replyAddress;
			
			if (enyo.messaging.utils.isTextMessage(serviceName) === true && chatAddress && chatAddress.indexOf("@") > -1) {
				contact.getEmails().add(new ContactsLib.EmailAddress({
					value: chatAddress
				}));
			}
			else 
				if (enyo.messaging.utils.isTextMessage(serviceName) === true) {
					contact.getPhoneNumbers().add(new ContactsLib.PhoneNumber({
						value: chatAddress
					}));
				}
				else {
					contact.getIms().add(new ContactsLib.IMAddress({
						value: chatAddress,
						serviceName: serviceName,
						type: serviceName
					}));
				}
			this.$.detailsDialog.setContact(contact);
		}
	},
	closeDetailsDialog: function() {
		if (this.$.detailsDialog && this.$.detailsDialog.isOpen) {
			this.$.detailsDialog.close();
		}
	},
	disableKeyboardMannualMode: function(){
		enyo.messaging.keyboard.setKeyboardAutoMode();
	},
	handleHeaderTap: function(){
		enyo.messaging.keyboard.setKeyboardAutoMode();

		if (!this.chatThread.flags.locked) {
			this.$.detailsDialog.openAtCenter();
		}
	},
	// The header Control has allowHtml:false, so setContent() escapes what it is given. Some thread
	// displayNames arrive ALREADY html-escaped (e.g. a Teams channel named "LuneOS & webOS-OSE" is
	// stored as "LuneOS &amp; webOS-OSE"), which then double-escapes into a literal "&amp;". Decode
	// entities first so the single escape on setContent renders correctly; raw names are unaffected.
	decodeEntities: function(inText){
		if (!inText) { return ""; }
		return String(inText)
			.replace(/&lt;/g, "<").replace(/&gt;/g, ">")
			.replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
			.replace(/&amp;/g, "&");
	},
	// Set the conversation header title, rendering any Unicode emoji as inline images so the
	// header matches the thread list on the left (which uses emojifyEscaped too). The header
	// Control is allowHtml:true, so we imageify emoji and HTML-escape the rest. decodeEntities
	// first undoes any pre-escaping (Teams "&amp;") so emojifyEscaped's single escape is correct;
	// it also leaves numeric emoji entities (&#128049;) for emojifyEscaped to decode+imageify.
	// The plain (un-imageified) name is stashed on _headerName so gotPerson can compare against
	// it instead of the emoji HTML that getContent() would return.
	setHeaderName: function(inName){
		var plain = this.decodeEntities(inName);
		this._headerName = plain;
		this.$.header.setContent(enyo.messaging.message.emojifyEscaped(plain));
	},
	// scroll list to bottom when we resize.
	resize: function() {
		if (this.$.list) {
			// reset adjusts the scroller and tries to maintain the scroll position
			this.$.list.reset();
		}
	},
	disEnableTransportSelector: function(inDisEnable) {
		this.$.transportselector.setHideArrow(!inDisEnable);
		this.$.transportselector.setDisabled(!inDisEnable);
	},
	//event from sweep delete in thread list, clean up and close conversation list if deleted chatthread is  current viewed
	deletedChatThreadChanged: function() {
		if(this.chatThread && this.chatThread._id === this.deletedChatThread._id){
			this.closeConversation(this.chatThread._id, true);
			this.doSelectThread(null);
			this.doCloseConversationList();
		}
	},
	deleteEmptyChatThread: function(chatThreadId){
		if (chatThreadId && this.$.dbFind) {
			this.$.dbFind.call({
				query: {
					from: enyo.messaging.message.dbKind,
					where: [{
						prop: "conversations",
						op: "=",
						val: chatThreadId
					}, {
						prop: "folder",
						op: "=",
						val: [enyo.messaging.message.FOLDERS.INBOX, enyo.messaging.message.FOLDERS.OUTBOX, enyo.messaging.message.FOLDERS.DRAFTS]
					}],
					select: [
						"conversations"
					],
					limit: 1
				}
			});
		}//gotMessagesForChatThreadId
	},
	gotMessagesForChatThreadId: function(inSender, inResponse, inRequest){
		if (inResponse.returnValue && inResponse.results && inResponse.results.length === 0) {
			var i, id, where;
			where = inRequest["params"].query.where;
			for (i = 0; i < where.length; i++) {
				if (where[i].prop === "conversations") {
					id = where[i].val;
					break;
				}
			}
			if (id) {
				this.$.dbDelete.call({
					"ids": [id]
				});
			}
		}
	},
	deleteTransientMessages: function(chatThreadId){
		if (chatThreadId && this.$.dbDelete) {
			this.$.dbDelete.call({
				query: {
					from: enyo.messaging.message.dbKind,
					where: [{
						prop: "conversations",
						op: "=",
						val: chatThreadId
					}, {
						prop: "folder",
						op: "=",
						val: enyo.messaging.message.FOLDERS.TRANSIENT
					}]
				}
			});
		}
		else if(this.$.dbDelete){//case to delete all transient messages, todo: maybe we don't need it anymore since always do closeConversation. currently not called without chatid anymore.
			this.$.dbDelete.call({
				query: {
					from: enyo.messaging.message.dbKind,
					where: [{
						prop: "folder",
						op: "=",
						val: enyo.messaging.message.FOLDERS.TRANSIENT
					}]
				}
			});
		}
	},
	//thread is locked in thread list, and passed to conversation list.
	threadLocked: function(inThread) {
		if (inThread._id === this.chatThread._id) {
			var lock = inThread.flags.locked;
			this.lockConversationList(lock);
		}
	},
	lockConversationList: function(lock){
		if (lock) {
			var message = $L("Messages can no longer be sent or received in this conversation.");
			this.addStatusMessageToChat(message, true);
			this.$.deleteButton.hide();
			this.$.blockButton.hide();
		}
		this.$.richText.setShowing(!lock);
		this.disEnableTransportSelector(!lock);
	},
	addStatusMessageToChat: function(message, locked) {
		if(message !== undefined && message.length > 0) {
			var params = {
				conversations: [this.chatThread._id],
				folder: enyo.messaging.message.FOLDERS.TRANSIENT,
				messageText: message,
				recipient: this.chatThread.replyAddress,
				serviceName: this.chatThread.replyService,
				status: "successful",
				locked:locked,
				_kind: enyo.messaging.message.dbKind,
				localTimestamp: Date.now()
			};
			this.$.messageServicePut.call({objects: [params]});
		}
	},
	addAvailabilityMessageToChat: function(buddystatus) {
		var availability = buddystatus.availability;
        var template = new enyo.g11n.Template(enyo.messaging.buddyAvailability_TRANSIENT_MESSAGES_Template[availability]);
		if( template !== undefined ) {
			var transport = transportPicker.getSelectedTransport();
			var message = template.evaluate({name: transport.displayName}); 
			// special case for offline. Make sure we did not get logged out
			if (availability === enyo.messaging.im.availability.OFFLINE) {
				for (var i = 0; i < this.loginStates.length; i++) {
					if (transport && transport.account && this.loginStates[i].accountId === transport.account.accountId) {
						if (this.loginStates[i].availability === enyo.messaging.im.availability.OFFLINE) {
							message = $L("You are offline");
						}
					}
				}
			}
			this.addStatusMessageToChat(message);
		}
	},
	closeConversation: function(chatThreadId, skipSaveDraft) {
//enyo.log("--------ConversationList::closeConversation this.chatThread:", this.chatThread);
		if (this.$.personServiceWatch && this.$.personServiceWatch.active) {
			this.$.personServiceWatch.cancel();
			this.$.personServiceWatch.active = false;
		}
		if (this.$.conversationService) {
			this.$.conversationService.cancel();
		}
		if (this.$.chatThreadWatch && this.$.chatThreadWatch.active) {
			this.$.chatThreadWatch.cancel();
			this.$.chatThreadWatch.active = false;
		}
		if (this.$.buddyStatusServiceWatch && this.$.buddyStatusServiceWatch.active) {
			this.$.buddyStatusServiceWatch.cancel();
			this.$.buddyStatusServiceWatch.active = false;
		}
		if (chatThreadId) {
			if (!skipSaveDraft) {
				//save draft
				this.saveMessageToDraft(this.$.richText.getValue(), chatThreadId);			
			}
			
			this.$.richText.setValue("");
			
			//clear unread count if app is activated only, but this conversation is closed (switch conversation or open compose view)
			//but not clear if current selected thread has unread messages because app is carded
			if (enyo.application.messageDashboardManager.getAppDeactivated() === false) {
				//cases we want to clear message when incoming messages at bottom and never rendered
				this.doClearUnreadCount(chatThreadId);
			}
			this.deleteTransientMessages(chatThreadId);
			this.deleteEmptyChatThread(chatThreadId);
			
			// clear dashboard to filter out messages from this thread 
			this.updateDashboard({_id: undefined}, enyo.application.messageDashboardManager);
			this.updateDashboard({_id: undefined}, enyo.application.inviteDashboardManager);
		}
	},
	getDraftMessage: function(chatThreadId){
		this.startDraftMsgTime = Date.now();
		enyo.log("Timing - ConversationList - getDraftMessage() - Get Draft Message");
		this.$.messageServiceFind.call({
			query: {
				where: [{
					prop: "conversations",
					op: "=",
					val: chatThreadId
				}, {
					prop: "folder",
					op: "=",
					val: enyo.messaging.message.FOLDERS.DRAFTS
				}]
			}
		});
	},
	watchChatThread: function(chatThreadId){
		this.$.chatThreadWatch.cancel();
		var whereClause = [{"prop":"_id","op":"=","val":chatThreadId}];
		this.$.chatThreadWatch.call({
			query: {
				where: whereClause
			}
		});
		this.$.chatThreadWatch.active = true;
	},
	watchPersonById: function(personId){
				this.$.personServiceWatch.cancel();
				this.$.personServiceWatch.call({
					query: {
						where: [{
							     "prop":"_id",
							     "op":"=",
							     "val":personId
						}],
					    select: enyo.messaging.person.selectAttributes
					}
				});
				this.$.personServiceWatch.active = true;
	},
	setupNewChatThread: function(){
		this.forceSendIfOffline = false;
		this.isIMBuddy = false;

		// clear current thread's unread count
		this.doClearUnreadCount(this.chatThread._id);
	
		// update dashboard to filter out messages from this thread 
		this.updateDashboard(this.chatThread, enyo.application.messageDashboardManager);
		this.updateDashboard(this.chatThread, enyo.application.inviteDashboardManager);
		
		//clear text field and retrieve draft for this chatThread
//		this.$.richText.setValue("");
		this.getDraftMessage(this.chatThread._id);
		
		//update header and status
		this.setHeaderName(this.chatThread.displayName);
		this.updateVideoButton();
		this.$.status.setClassName("status status-no-presence");
		
		//get default avartar image
		this.chatThread.personImage = enyo.messaging.person.getDisplayImage();
		//watch this chatThread for person, or lock flag change
		this.watchChatThread(this.chatThread._id);
	},
	// Pre-warm the WebKit/media-server audio pipeline when a thread opens so the FIRST inline
	// voice-note tap plays instantly. That pipeline (for the <audio> element's audio class) is cold
	// on first use - it takes ~10s to acquire the media resource - but stays warm afterwards. Playing
	// a tiny silent Opus clip hidden warms it. Once per app session (it stays warm).
	warmMediaPipeline: function() {
		if (window._msgMediaWarmed) { return; }
		window._msgMediaWarmed = true;
		try {
			var base = window.location.href.replace(/[^\/]*(?:\?.*)?$/, "");
			var a = document.createElement("audio");
			a.volume = 0;
			a.setAttribute("preload", "auto");
			a.setAttribute("src", base + "warmup.ogg");
			a.play();
		} catch (e) {}
	},
	chatThreadChanged: function(inOldChatThread) {
		this.chatThreadChangeTime = Date.now();
		if (this.chatThread && this.chatThread._id) { this.warmMediaPipeline(); }
		enyo.log("Timing - ConversationList - chatThreadChanged() - Chat Thread changed so build new Conversation List");
		if (!inOldChatThread && this.chatThread && this.chatThread._id) {
			//open conversationList, switch from default view or composeView
			this.setupNewChatThread();
		}
		else if(inOldChatThread && inOldChatThread._id && !this.chatThread){
			//close conversationList, case that switch to composeView, or default view (thread is deleted so app is carded or closed)
			this.closeConversation(inOldChatThread._id);
		}
		else if (inOldChatThread && inOldChatThread._id && this.chatThread && inOldChatThread._id !== this.chatThread._id) {
			//switch to different chat thread
			this.closeConversation(inOldChatThread._id);
			this.setupNewChatThread();
		}
		else if(inOldChatThread && inOldChatThread._id && this.chatThread && inOldChatThread._id === this.chatThread._id){
			//refresh current chatthread, such as person info changed or thread is locked, or 3rd party launch(need updated transportPicker)
			//todo: test out cases that 3rd party launch with different transport as current selected transport.
		}

		if (this.chatThread && this.chatThread._id) {
			this.lockConversationList(this.chatThread.flags.locked);

			if (!this.chatThread.flags.locked) {
				if (this.chatThread.personId && this.chatThread.personId !== "null") {
					this.watchPersonById(this.chatThread.personId);
					// For handling 'Block Sender' button:
					// We need to double check to make sure the person record contains
					// record that is created by IM transport.  If the person's contact
					// records only contains IM addresses that are created by the user,
					// we still need to display the block sender button.   
					if (this.chatThread.person && this.chatThread.person._id === this.chatThread.personId) {
						this.chatThread.personImage = enyo.messaging.person.getDisplayImage(this.chatThread.person);
						//setup transports for person's phoneNumbers
						transportPicker.setTransportsByPerson(this.$.status, this.$.transportselector, this.chatThread.person, this.chatThread, this.params.selectIMTransport, this.params.buddyStatus);
						if (this.chatThread.person.ims && this.chatThread.person.ims.length > 0 && this.chatThread.person.contactIds && this.chatThread.person.contactIds.length > 0) {
							this.shouldCallListPunt = true;//used in gotContacts() to  reset list after get contact's imbuddy info
							this.$.contactServiceGet.call({"ids": this.chatThread.person.contactIds});
						}
						else {
							this.$.list.punt();//reset();
						}
					}
					else {
					//cases: tap on buddy in buddylist, which create chatthread with personId, but won't have person since it's not part of thread list and person is joined in thread watch
					//cases: 3rd party launch with personId, a new thread is created, no person neither
					//if any other case found that has personId, but don't have person, then, need add code to handle block button
						this.$.list.punt();//reset();
					}
				}
				else {
					transportPicker.setTransportsByChatThread(this.chatThread, this.$.transportselector);
					this.$.list.punt();//dumping existing data and get new data
				}
			}
			else{
				this.$.transportselector.setLabel($L("Lock"));
				this.$.transportselector.closePopup();
				this.$.list.punt();//dumping existing data and get new data
			}
		}
	},
	//watch for chatThread which doesn't have personId, watch it for personId added.
	gotChatThread: function(inSender, inResponse){
		if (inResponse.returnValue && inResponse.results && inResponse.results.length > 0 && inResponse.results[0]._id === this.chatThread._id) {
			if (inResponse.results[0].personId !== this.chatThread.personId || inResponse.results[0].flags.locked !== this.chatThread.flags.locked) {
				this.chatThread = inResponse.results[0];
				this.chatThreadChanged(this.chatThread);
			}
		}
	},
	updateDashboard: function(thread, dashboardMgr) {
		var filter = dashboardMgr.getFilter();
		if (!filter) {
			filter = {};
		} 
		filter.thread = thread._id;
		
//		enyo.log("In ConversationList, setting filter message dashboard manager: " ,filter);
		dashboardMgr.setFilter(filter);
	},
	revealListBottom: function(inSender, inResponse){
		if(this.$.list.$.scroll.y >= enyo.messaging.MAX_BOTTOM_HEIGHT_FOR_SNAP) {
			//reveal bottom for outbox only, not status or drafts
			this.$.list.punt();
		}
	},
	messagesWatch: function(inSender, inResponse){
		//list will retain where it is if user scroll up list at least enyo.messaging.MAX_BOTTOM_HEIGHT_FOR_SNAP(300px)
		//but we want to reveal bottom for outgoing message, so, need reveal it in revealListBottom() after successfully send out messages 
		if (this.$.list.$.scroll.y < enyo.messaging.MAX_BOTTOM_HEIGHT_FOR_SNAP) {
			//reveal bottom
			this.$.list.punt();
		}
		else {
			this.$.list.reset();
		}
	},
	gotMessages: function(inSender, inResponse, inRequest){
		this.gotMessagesTime = Date.now();
		enyo.log("Timing - ConversationList - gotMessages() - It took ", Date.now() - this.listQueryTime, "ms to get",inResponse.results.length,  "messages from the Db.");
		this.$.list.queryResponse(inResponse, inRequest);
	},
	gotStatus: function(inSender, inResponse){
		transportPicker.gotStatus(inResponse, this.statusChanged.bind(this));
	},
	statusChanged: function(buddystatus){
		if (this.oldBuddyStatus && this.oldBuddyStatus.serviceName == buddystatus.serviceName && this.oldBuddyStatus.username == buddystatus.username && this.oldBuddyStatus.availability != buddystatus.availability){
			this.addAvailabilityMessageToChat(buddystatus);
		}
		if (this.oldBuddyStatus && this.oldBuddyStatus.serviceName == buddystatus.serviceName && this.oldBuddyStatus.username == buddystatus.username && this.oldBuddyStatus.status != buddystatus.status){
			var statusMessage = buddystatus.status || "";
			if (buddystatus._kind === "com.palm.imbuddystatus.libpurple:1") {
				// needs to unescape &amp; &apos; &lt; and &gt; from status messages
				// that are synced by libpurple transport since the libpurple
				// library escapes these characters.
				statusMessage = enyo.messaging.message.unescapeText(statusMessage);
			}
			this.addStatusMessageToChat(enyo.string.removeHtml(statusMessage));
		}
		this.oldBuddyStatus = buddystatus;
	},
	gotPerson: function(inSender, inResponse){
		if(inResponse.returnValue && inResponse.results && inResponse.results.length > 0 && inResponse.results[0]._id === this.chatThread.personId){
			var person = inResponse.results[0];
			var personImage = enyo.messaging.person.getDisplayImage(person);
			if(personImage !== this.chatThread.personImage) {
				this.chatThread.personImage = personImage;
				this.$.list.refresh();
			}
						
			var displayName = this.decodeEntities(enyo.messaging.person.getDisplayName(person));
			if (displayName !== this._headerName && enyo.messaging.person.isNotBlank(displayName)) {
				this.setHeaderName(enyo.messaging.person.getDisplayName(person));
			}
			
			if (!this.chatThread.person || this.isDifferent(person.contactIds, this.chatThread.person.contactIds) || this.isDifferent(person.phoneNumbers, this.chatThread.person.phoneNumbers)) {
				if (this.$.buddyStatusServiceWatch && this.$.buddyStatusServiceWatch.active) {
					this.$.buddyStatusServiceWatch.cancel();
					this.$.buddyStatusServiceWatch.active = false;
				}
				transportPicker.setTransportsByPerson(this.$.status, this.$.transportselector, person, this.chatThread, this.params.selectIMTransport, this.params.buddyStatus);

				if (person.ims && person.ims.length > 0 && person.contactIds && person.contactIds.length > 0) {
					this.$.contactServiceGet.call({
						"ids": person.contactIds
					});
				}
				else{
					this.$.status.setClassName("status status-no-presence");
				}
			}
			
			this.chatThread.person = person;
		}
		else {
			enyo.error("ConversationList::gotPerson:Failed to get person:payload ",inResponse.results, " this.chatThread.personId:", this.chatThread.personId);
			//fallback to chatthread for deleted person (from contacts)
			transportPicker.setTransportsByChatThread(this.chatThread, this.$.transportselector);
			this.$.status.setClassName("status status-no-presence");
		}
	},
	gotContacts:function(inSender, inResponse){
		this.isIMBuddy = false;
		if (inResponse.returnValue && inResponse.results && inResponse.results.length > 0) {
			var i, contact;
			for (i = 0; i < inResponse.results.length; i++) {
				contact = inResponse.results[i];
				if(contact.imBuddy){
					this.isIMBuddy = true;
					break;
				}
			}
			//need call list.punt() only for one cases which is not called in chatthreadChanged
			if (this.shouldCallListPunt) {
				this.$.list.punt();//reset()
				this.shouldCallListPunt = false;
			}

			if(this.isIMBuddy && this.chatThread.personId){
				this._watchBuddyStatus(this.chatThread.personId);
			}
			transportPicker.setTransportsByContacts(this.$.status, this.$.transportselector, inResponse.results, this.chatThread, this.params.selectIMTransport, this.params.buddyStatus/*, this.allowVideoCallsSkype*/);
		}
		else {
			enyo.error("ConversationList::gotContacts:Failed to get contacts ",inResponse.results);
			transportPicker.setTransportsByChatThread(this.chatThread, this.$.transportselector);
		}
	},
	_watchBuddyStatus: function(personId){
		if (this.$.buddyStatusServiceWatch.active) {
			this.$.buddyStatusServiceWatch.cancel();
		}
		this.$.buddyStatusServiceWatch.call({
			query: {
				where: [{
					"prop": "personId",
					"op": "=",
					"val": personId
				}],
				select: ["_id", "_kind", "personId", "username", "serviceName", "availability", "status"]
			}
		});
		this.$.buddyStatusServiceWatch.active = true;
	},
	transportChange: function(inSender, inNewValue, inOldValue) {
		//todo:for different service this.setCharacterCounterMaxLength();
		transportPicker.selectTransportById(inNewValue);
		var selectedTransport = transportPicker.getSelectedTransport();
		this.$.transportselector.setLabel(selectedTransport.label);
		this.$.status.setClassName("status status-"+enyo.messaging.im.buddyAvailabilities[transportPicker.getBuddyAvailability(selectedTransport.serviceName, selectedTransport.caption)]);
		// Re-evaluate the header call icons for the newly-selected service (e.g. show the phone icon when
		// switching to WhatsApp, hide it for Facebook) - they were only set at conversation-open otherwise.
		this.updateVideoButton();
	},
	rendered: function() {
		var bottom, range;
		var richTextNode = this.$.richText && this.$.richText.hasNode();
		this.inherited(arguments);
//todo: what this is for? should clean up later
		/* This is called after the list renders, but the rich text does not
		 * exist at that point. Only "focus" it (set its selection) if it
		 * exists and there is a chat thread to type in
		 */
		if (this.chatThread && richTextNode) {
			range = document.createRange();
			range.setEnd(richTextNode, richTextNode.childNodes.length);
			range.collapse(false);
			window.getSelection().addRange(range);
		}
	},
	checkKey: function(inSender, inEvent) {
		var messageText;

		// Pressing "enter" should send a message and clear the input
		if (inEvent.keyCode === 13) {
			enyo.log(" ENYO PERF: TRANSITION START time: "+ Date.now());
			inEvent.preventDefault();
			messageText = this.$.richText.getValue();

			// Only send non-empty messages - or an attachment-only message (a staged file with no text).
			if (messageText || (this.outboundAttachment && this.outboundAttachment.path)) {
				this.considerForSend();
				enyo.log(" ENYO PERF: TRANSITION DONE time: "+ Date.now());
			}
		}
	},
	listQuery: function(inSender, inQuery) {
		if(this.chatThread){
			this.listQueryTime = Date.now();
			enyo.log("Timing - ConversationList - listQuery() - Get Messages from Db.");
			inQuery.where = [
				{"prop":"conversations","op":"=","val":this.chatThread._id}, 
				{"prop":"flags.visible","op":"=","val":true}, 
				{"prop":"localTimestamp","op":">","val":0}];
			
			inQuery.orderBy = "localTimestamp";
			inQuery.select = [
					"_id",			
					"_kind",		
					"parts",
					"conversations",
					"deliveryReports",
					"errorCategory",
					"networkErrorCode",
					"flags",		
					"folder",
					"groupChatName",
					"localTimestamp",
					"messageText",
					"smsType",
					"callbackNumber",
					"mmsAttachmentsFolder",
					"filePath",
					"mmsType",
					"priority",
					"serviceName",
					"status",
					"subject",
					"accepted",
					"commandId",
					"from",
					"to",
					"channelName",
					"chatType",
					"reactions",
					"serviceMessageId",
					"quotedText",
					"quotedFrom",
					"quotedMessageId",
					"deliveryStatus",
					"locked"
				];
			return this.$.conversationService.call({query: inQuery});
	   }
	},
	listSetupRow: function(inSender, inMessage, inIndex) {
		enyo.log("Timing - ConversationList - listSetupRow() - It took", (Date.now() - this.chatThreadChangeTime), "ms to render this message since the chat thread changed.");
		this.setupDivider(inMessage, inIndex);
		//todo: for groupchat, each message could associate with different person, so can't use chatThread.personImage for this.Will we show different iamge for different buddy or use default for all?
		if (this.chatThread.personImage) {
			inMessage.personImage = this.chatThread.personImage;
		}
		this.$.conversationItem.setMessage(inMessage);
		this.$.listButtons.canGenerate = false;
		if (!inSender.fetch(inIndex+1)) {
			if (this.chatThread && !this.chatThread.flags.locked) {
				// show top buttons for the first row
				this.$.conversationItem.applyStyle("padding-top:10px");
				this.$.listButtons.canGenerate = true;//show();
				this.$.listButtons.show();
				this.updateListButtons(this.chatThread);
			}
		}			
		
		if (inMessage.flags && !inMessage.flags.read && enyo.application.messageDashboardManager.getAppDeactivated() === false) {
			// play sound notification only when this is a new unread message in either inbox or transient folder
			if (inMessage.folder !== enyo.messaging.message.FOLDERS.OUTBOX) {
				this.playSoundNotification({ isSent: false });
			}
		}				
	},
	updateListButtons: function(thread) {
		this.$.blockButton.setShowing(!this.shouldHideBlockButton(thread));
	},
	shouldHideBlockButton: function(thread) {
		var transports = transportPicker.getTransports();
		var haveIMAccount = false;
		for(var i = 0; i < transports.length; i++) {
			if (transports[i].account && transports[i].account.capabilitySubtype === "IM") {
				haveIMAccount = true;		
			}
		}		
		return thread && ((thread.personId && this.isIMBuddy) || thread.groupChatId || !haveIMAccount);
	},
	setupDivider: function(inMessage, inIndex) {
		var caption = this.getDividerCaption(inMessage.localTimestamp);
		var username = inMessage.folder === enyo.messaging.message.FOLDERS.INBOX ? inMessage.from.addr : (inMessage.folder === enyo.messaging.message.FOLDERS.OUTBOX ? inMessage.to[0].addr: "");
		if(enyo.messaging.utils.isTextMessage(inMessage.serviceName)){
			username = enyo.messaging.utils.formatAddress(username, inMessage.serviceName);
		}
		var pt = this.$.list.fetch(inIndex + 1);
		var previousCaption = pt && this.getDividerCaption(pt.localTimestamp);
		var previousServiceName = pt && pt.serviceName;
		var serviceName = inMessage.serviceName;
		var icon;
		var previousUsername = pt && (pt.folder === enyo.messaging.message.FOLDERS.INBOX ? pt.from.addr : (pt.folder === enyo.messaging.message.FOLDERS.OUTBOX ? pt.to[0].addr: ""));
		if(pt && pt.serviceName && enyo.messaging.utils.isTextMessage(pt.serviceName)){
			previousUsername = enyo.messaging.utils.formatAddress(previousUsername, pt.serviceName);
		}
		var showDivider = caption != previousCaption || serviceName != previousServiceName || username !== previousUsername; 
		var usernameDisplay = username ? username + ", " : "";
		var usernameDate = usernameDisplay + caption;
		if (showDivider) {
			this.$.divider.setCaption(usernameDate);
			icon = enyo.application.accountService.getIcons(serviceName);
			if (icon && icon.splitter) {
				this.$.divider.setIcon(icon.splitter);
			}
			else{
				this.$.divider.setIcon("images/default_transport_splitter.png");
			}
		}
		//
		this.$.divider.canGenerate = showDivider;
	},
	getDividerCaption: function(timestamp) {
		return Utils.formatShortDate(new Date(timestamp));
	},
	considerForSend: function() {
		// If the current transport is IM + it has gone offline + you are not offline, display a dialog, give the user an option to force the send
		var selectedTransport = transportPicker.getSelectedTransport();

		var accountLoginState, loginState, i;
		if (selectedTransport.account && selectedTransport.account.accountId) {
			for (i = 0; i < this.loginStates.length; i++) {
				loginState = this.loginStates[i];
				if (loginState.accountId === selectedTransport.account.accountId) {
					accountLoginState = loginState;
					break;
				}
			};
		}
		if (this.forceSendIfOffline === false && enyo.messaging.utils.isTextMessage(selectedTransport.serviceName) === false &&
			transportPicker.getBuddyAvailability(selectedTransport.serviceName, selectedTransport.caption) === enyo.messaging.im.availability.OFFLINE &&
			accountLoginState && accountLoginState.availability !== enyo.messaging.im.availability.OFFLINE && accountLoginState.state !== enyo.messaging.imLoginState.TRANSPORT_STATE.OFFLINE
			&& !this.chatThread.groupChatId
			// Skip the "recipient is offline" nag for a connector's auth pseudo-contact (e.g. the
			// Telegram/Facebook login-code chat). It has no presence record so it always reads OFFLINE,
			// which falsely triggered this dialog while replying with the 2FA code mid-login. See
			// accountService.getAuthContacts / the template's MESSAGING "authContacts".
			&& !enyo.application.accountService.isAuthContact(selectedTransport.serviceName, selectedTransport.caption)) {
            var template = new enyo.g11n.Template($L("#{name} is offline. What would you like to do?"));
            var dialogMessage = template.evaluate({name: selectedTransport.displayName}); 
            this.$.buddyOfflineDialog.openAtCenter();
            this.$.buddyOfflineDialog.setTitle($L("Recipient is offline."));
            this.$.buddyOfflineDialog.setMessage(dialogMessage);
            this.$.buddyOfflineDialog.setAcceptButtonCaption($L("Send Anyway"));
		} else {
			this.sendMessage();
		} 
		/*todo: CDMA only
		 else {
			var segments = this.characterCounter.getSegmentData();
			if (segments.segmentCount) {
				for (var x = 0; x < segments.segmentCount; x++) {
					this.sendMessage(segments.segments[x]);
				}
				this.resetTextBox(true);
				this.revealBottomHack(); // snap to the bottom when the user sends a message
			} else {
				Mojo.Log.warn("Segment count is zero or not set."); // This should not happen
			}
		}*/
	},
	// Explicit send button (right of the input, webOS 2.2.x style). Same gate as Enter/checkKey:
	// send when there is text or a staged attachment; ignore an empty tap.
	sendButtonClicked: function() {
		var messageText = this.$.richText.getValue();
		if (messageText || (this.outboundAttachment && this.outboundAttachment.path)) {
			this.considerForSend();
		}
	},
	// Attachment send ---------------------------------------------------------
	// Open the system file picker. Only IM transports can actually transmit a file (the libpurple
	// transport handles filePath; SMS/MMS does not), so guard against staging one on an SMS thread.
	openAttachmentPicker: function() {
		var selectedTransport = transportPicker.getSelectedTransport();
		if (selectedTransport && enyo.messaging.utils.isTextMessage(selectedTransport.serviceName)) {
			enyo.warn("ConversationList.openAttachmentPicker: attachments are only supported on IM transports");
			return;
		}
		this.$.attachmentPicker.pickFile();
	},
	// FilePicker callback: stash the chosen file and show the chip. inFiles is an array of
	// {name, fullPath, iconPath, attachmentType, size} (see enyo FilePicker).
	attachmentChosen: function(inSender, inFiles) {
		if (!inFiles || inFiles.length === 0) {
			return;
		}
		var file = inFiles[0];
		this.outboundAttachment = {
			path: file.fullPath,
			name: file.name,
			type: file.attachmentType
		};
		// Picked-file chip: plain thumb + label, no audio preview player.
		if (this.$.attachmentChipPlayer) { this.$.attachmentChipPlayer.setShowing(false); this.$.attachmentChipPlayer.setContent(""); }
		this.$.attachmentChipLabel.setShowing(true);
		this.$.attachmentChipLabel.setContent(file.name || file.fullPath);
		// Thumb: preview an image inline (local path -> file URL, the actual picked photo); for video and
		// documents use the stock FilePicker's own category icon (icn-videos / icn-documents) so the
		// staged chip matches the "Select A File" picker the user just came from (loading a .mp4/.docx as
		// an <img> src just shows a broken image). The picker allows image/video/document.
		if (this.$.attachmentChipThumb.setSrc) {
			var thumb;
			if (file.attachmentType === "image") {
				thumb = this.fileUrlFromPath(file.fullPath);
			} else if (file.attachmentType === "video") {
				thumb = "images/icn-videos.png";
			} else {
				thumb = "images/icn-documents.png";
			}
			this.$.attachmentChipThumb.setSrc(thumb);
		}
		this.$.attachmentChip.setShowing(true);
	},
	// Drop the staged attachment (decline icon on the chip).
	clearAttachment: function() {
		this.outboundAttachment = undefined;
		// stop any voice-note preview that is playing, and tear the player down
		if (this.$.attachmentChipPlayer) {
			var n = this.$.attachmentChipPlayer.hasNode();
			var au = n && n.getElementsByTagName ? n.getElementsByTagName("audio")[0] : null;
			if (au) { try { au.pause(); } catch (e) {} }
			this.$.attachmentChipPlayer.setShowing(false);
			this.$.attachmentChipPlayer.setContent("");
		}
		if (this.$.attachmentChipLabel) { this.$.attachmentChipLabel.setShowing(true); }
		this.$.attachmentChip.setShowing(false);
	},
	// Voice-note preview play/pause (the chip's inline player). Mirrors ConversationItem's audio-toggle:
	// tap the button -> toggle the sibling <audio>; progress/time are driven by the global
	// enyo.messaging.message.audioMeta/audioTime/audioEnded handlers on the <audio> element.
	chipPlayerTapped: function(inSender, inEvent) {
		var node = inEvent && (inEvent.target || (inEvent.domEvent && inEvent.domEvent.target));
		var root = this.$.attachmentChipPlayer && this.$.attachmentChipPlayer.hasNode();
		while (node && node !== root) {
			if (node.getAttribute && node.getAttribute("data-audio-toggle")) {
				var box = node.parentNode;
				var audio = box && box.getElementsByTagName ? box.getElementsByTagName("audio")[0] : null;
				if (audio) {
					if (audio.paused) {
						if (audio.ended || (audio.duration && audio.currentTime >= audio.duration - 0.15)) {
							try { audio.currentTime = 0; } catch (e) {}
						}
						audio.play();
						node.className = "msg-audio-btn playing";
					} else {
						audio.pause();
						node.className = "msg-audio-btn";
					}
				}
				return true;
			}
			node = node.parentNode;
		}
	},
	// Build a file:// URL from an absolute device path for local <img> preview.
	fileUrlFromPath: function(path) {
		if (!path) {
			return "";
		}
		return (path.indexOf("file://") === 0) ? path : ("file://" + path);
	},
	// ===== Voice messages ================================================================
	// Record via the native mediaserver (MediaCaptureV3 "audio:" -> clean 8kHz WAV), then stage the WAV
	// as the outbound attachment; the transport transcodes it to an Ogg/Opus voice note on send (see
	// LibpurpleAdapter::sendFile / OpusEncoder). Tap the mic to start, tap again to stop.
	micButtonClicked: function() {
		if (this.vnRecording) { this.stopVoiceNote(); return; }
		var t = transportPicker.getSelectedTransport();
		if (t && enyo.messaging.utils.isTextMessage(t.serviceName)) {
			enyo.warn("ConversationList.micButtonClicked: voice notes are only supported on IM transports");
			return;
		}
		this.startVoiceNote();
	},
	startVoiceNote: function() {
		if (this.vnRecording) { return; }
		this.vnRecording = true;
		this.vnEndpoint = null;
		this.vnPath = "/media/internal/.im-attachments/voicenote_" + (new Date()).getTime() + ".wav";
		this._vnUpdateUi(true);
		this._vnStartTimer();
		// Fresh capture session (subscription held open until we tear it down on stop).
		this.vnSession = this.createComponent({
			kind: "PalmService", service: "palm://com.palm.mediad/service/", method: "captureV3",
			subscribe: true, onSuccess: "vnSessionReady", onFailure: "vnCmdFailed"
		});
		this.vnSession.call({});
	},
	vnSessionReady: function(inSender, inResponse) {
		if (!this.vnRecording) { return; }
		var loc = inResponse && inResponse.location;
		if (!loc || this.vnEndpoint) { return; } // ignore repeat subscription updates
		this.vnEndpoint = String(loc).replace(/\/+$/, "");
		// Load the front mic, then start capturing to our WAV path (args are positional per the API).
		this.$.vnCmd.call({ args: ["audio:", { deviceUri: "audio:" }] },
			{ service: this.vnEndpoint + "/", method: "load", onSuccess: "vnLoaded" });
	},
	vnLoaded: function() {
		if (!this.vnRecording || !this.vnEndpoint) { return; }
		this.$.vnCmd.call({ args: [this.vnPath, { duration: 0, size: 0, mimetype: "audio/vnd.wave", samplerate: 8000, channels: 1, codecs: "1" }] },
			{ service: this.vnEndpoint + "/", method: "startAudioCapture", onSuccess: "vnStarted" });
	},
	vnStarted: function() { /* recording; UI already reflects it */ },
	stopVoiceNote: function() {
		if (!this.vnRecording) { return; }
		this.vnRecording = false;
		this.vnDurationSec = this.vnStartMs ? Math.floor(((new Date()).getTime() - this.vnStartMs) / 1000) : 0;
		this._vnStopTimer();
		this._vnUpdateUi(false);
		if (this.vnEndpoint) {
			this.$.vnCmd.call({ args: [] },
				{ service: this.vnEndpoint + "/", method: "stopAudioCapture", onSuccess: "vnStopped" });
		} else {
			this._vnCleanup(); // session never opened
		}
	},
	vnStopped: function() {
		// Release the loaded mic device with `unload` BEFORE dropping the captureV3 subscription. The
		// stock MediaCaptureProxyHelper does exactly this ("for unload also terminate the subscription");
		// skipping unload leaks a mediaserver capture session per recording -> mediaserver runs out of
		// file descriptors and SIGABRTs (the "mediaserver freaks out" crashes). unload also finalizes the
		// WAV; we tear the subscription down in its callback (_vnCleanup) regardless of success/failure.
		if (this.vnEndpoint) {
			this.$.vnCmd.call({ args: [] },
				{ service: this.vnEndpoint + "/", method: "unload", onSuccess: "_vnCleanup", onFailure: "_vnCleanup" });
		} else {
			this._vnCleanup();
		}
		// Stage the recording as the outbound attachment; the user presses Send to transmit it. Show the
		// recorded duration on the chip so it reads like "Voice message  0:12".
		var label = $L("Voice message");
		if (this.vnDurationSec > 0) { label += "  " + this._vnFmt(this.vnDurationSec); }
		this.outboundAttachment = { path: this.vnPath, name: label, type: "audio" };
		// Left of the chip: the music-notes glyph. Then an inline preview player (play/pause + progress),
		// same markup + handlers as a received voice note (utils.js audioMeta/audioTime/audioEnded). The
		// recording is a WAV -> type audio/wav. The plain label is hidden in favour of the player.
		if (this.$.attachmentChipThumb.setSrc) { this.$.attachmentChipThumb.setSrc("images/voice-message-icon.png"); }
		this.$.attachmentChipLabel.setShowing(false);
		var url = this.fileUrlFromPath(this.vnPath);
		this.$.attachmentChipPlayer.setContent(
			'<div class="msg-audio-player">' +
				'<div class="msg-audio-btn" data-audio-toggle="1"></div>' +
				'<div class="msg-audio-body">' +
					'<div class="msg-audio-track"><div class="msg-audio-fill"></div></div>' +
					'<div class="msg-audio-time">' + this._vnFmt(this.vnDurationSec || 0) + '</div>' +
				'</div>' +
				'<audio class="msg-audio" preload="none"' + // preload="none": don't spawn a media-pipeline until play (fd-leak safe)
					' onloadedmetadata="enyo.messaging.message.audioMeta(this)"' +
					' ontimeupdate="enyo.messaging.message.audioTime(this)"' +
					' onended="enyo.messaging.message.audioEnded(this)">' +
					'<source src="' + url + '" type="audio/wav"></source>' +
				'</audio></div>');
		this.$.attachmentChipPlayer.setShowing(true);
		this.$.attachmentChip.setShowing(true);
	},
	vnCmdFailed: function(inSender, inResponse) {
		enyo.warn("ConversationList voice note LS2 failure: ", inResponse);
		this.vnRecording = false;
		this._vnStopTimer();
		this._vnUpdateUi(false);
		// If the device got as far as `load`, release it (unload) before tearing the subscription down,
		// so a failed recording doesn't leak a mediaserver capture session either.
		if (this.vnEndpoint) {
			this.$.vnCmd.call({ args: [] },
				{ service: this.vnEndpoint + "/", method: "unload", onSuccess: "_vnCleanup", onFailure: "_vnCleanup" });
		} else {
			this._vnCleanup();
		}
	},
	_vnCleanup: function() {
		if (this.vnSession) { try { this.vnSession.destroy(); } catch (e) {} this.vnSession = null; }
		this.vnEndpoint = null;
	},
	_vnUpdateUi: function(recording) {
		if (this.$.micButton) {
			// swap to the RED mic while recording (and pulse it via the .recording class), back to the
			// normal dark mic when idle.
			if (this.$.micButton.setIcon) {
				this.$.micButton.setIcon(recording ? "images/menu-icon-mic-rec.png" : "images/menu-icon-mic.png");
			}
			if (this.$.micButton.addRemoveClass) {
				this.$.micButton.addRemoveClass("recording", !!recording);
			}
		}
		if (this.$.vnTimer) {
			if (recording) { this.$.vnTimer.setContent("0:00"); }
			this.$.vnTimer.setShowing(!!recording);
		}
	},
	_vnFmt: function(s) {
		var mm = Math.floor(s / 60), ss = s % 60;
		return mm + ":" + (ss < 10 ? "0" : "") + ss;
	},
	_vnStartTimer: function() {
		this.vnStartMs = (new Date()).getTime();
		var self = this;
		this._vnTimer = window.setInterval(function() {
			var s = Math.floor(((new Date()).getTime() - self.vnStartMs) / 1000);
			if (self.$.vnTimer) { self.$.vnTimer.setContent(self._vnFmt(s)); }
			if (s >= 300) { self.stopVoiceNote(); } // 5-minute safety cap
		}, 500);
	},
	_vnStopTimer: function() {
		if (this._vnTimer) { window.clearInterval(this._vnTimer); this._vnTimer = null; }
	},
	sendMessage: function() {
		//safty net to clear unread count for current chat thread in case system crashes
		if (this.chatThread && this.chatThread._id) {
			this.doClearUnreadCount(this.chatThread._id);
		}
		var selectedTransport = transportPicker.getSelectedTransport();
		var recipient = {
			name: selectedTransport.displayName,
			addr: selectedTransport.replyAddress
		};
		//todo: following edge cases are inhired from previous code, might not needed here, but won't hurt to keep it for now
		// Edge cases:
		// 1. If the user has a partial number stored in contacts, and we are using the replyAddress to send, the moment that they 
		//    send or receive on a different transport in the same chat, we will have lost the phone number that was stored in the chat address
		//    switching back to the phone number that was being used previously will fail to send 
		// 2. If the transport picker contains a valid short code that happens to be a subset of a different phone number in the transport picker
		//    Then it is possible for us to send using the replyAddress when we should really use what is in the transport picker
		if (enyo.messaging.utils.isTextMessage(selectedTransport.serviceName) &&
			enyo.messaging.utils.isTextMessage(this.chatThread.serviceName) && this.chatThread.replyAddress) { 
			var chatNum = enyo.messaging.utils.cleanPhoneNumber(this.chatThread.replyAddress);
			var transportNum = enyo.messaging.utils.cleanPhoneNumber(recipient);
			if (transportNum.length >= 7 && chatNum.length > transportNum.length) {
				var isMatch = true;
				for (var i = 1; i <= transportNum.length && isMatch; i++) {
					if (transportNum[transportNum.length - i] !== chatNum[chatNum.length - i]) {
						isMatch = false;
					}
				}
				if (isMatch) {
					recipient.addr = this.chatThread.replyAddress;
				}
			}
		}
		var deliveryReport = false;
/*todo: might not needed
  
 		if( this.Messaging.messagingPrefs.getUseDeliveryReceipts() && enyo.messaging.utils.isTextMessage(selectedTransport.serviceName) ) {
			deliveryReport = true;
		}
*/		
		var params = {
			folder: enyo.messaging.message.FOLDERS.OUTBOX,
			status: "pending",
			conversations: [this.chatThread._id],
			flags: { 
				read: true,
				visible: true,
				deliveryReport: deliveryReport
			},
			to: [recipient],
			messageText: this.composeBodyText(),
			serviceName: selectedTransport.serviceName
		};
		
		// Native reply: stamp structured quote metadata on the outgoing row from the message being replied
		// to (captured by enterReply). quotedMessageId is the original's serviceMessageId ("<chatId>:<id>"
		// for Telegram); the transport passes it to the prpl to set a real reply_to so OTHER clients thread
		// the reply, and the fields render the local echo's inline quote card (buildQuote in ConversationItem).
		if (this.replyToMessage) {
			var qsrc = enyo.messaging.message.unescapeText(this.replyToMessage.messageText || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ");
			params.quotedText = qsrc;
			params.quotedFrom = (this.replyToMessage.from && this.replyToMessage.from.name) ? this.replyToMessage.from.name : "";
			params.quotedMessageId = this.replyToMessage.serviceMessageId || "";
		}

		// For IM accounts, the account's username is set to our IM username so
		// put that into the from address.
		// This isn't the case for SMS, which uses the Palm Profile account.
		//todo: might need new api for >1 number associate with device (sms)
		if (selectedTransport.account !== undefined && selectedTransport.account.capabilitySubtype === "IM") {
			params.from = {
				name: selectedTransport.account.alias,
				addr: selectedTransport.account.username
			};
			params.username = selectedTransport.account.username;
		}

		if (recipient.addr === undefined || recipient.addr.length === 0) {
			enyo.error("ConversationList.sendMessage recipient missing address ", recipient);
		}
		var kind;
		if (!enyo.messaging.utils.isTextMessage(params.serviceName) && selectedTransport.account !== undefined) {
			kind = selectedTransport.account.dbkinds.immessage;
		}
		else {
			// SMS
			kind = enyo.messaging.message.SMS.dbKind;
			params.serviceName = "sms";
		}
		// Attachment send: carry the staged file's absolute path on the outgoing immessage. Only IM
		// transports can transmit it (the libpurple transport reads "filePath"); SMS/MMS ignores it,
		// so never stamp it on a text-message record.
		if (this.outboundAttachment && this.outboundAttachment.path &&
			!enyo.messaging.utils.isTextMessage(params.serviceName)) {
			params.filePath = this.outboundAttachment.path;
		}

		// Manually add the message to the thread and update the chat thread record
		// since it takes too long to load the chatthreader.
		var conversation = enyo.messaging.thread.create({_id: this.chatThread._id});
		conversation.updateFromNewMessage(params, recipient);
		conversation.save();

		this.sendMessageHelper(params, kind);
	},
	// The outgoing message body. Native reply metadata (quotedText/quotedFrom/quotedMessageId, stamped
	// on the outgoing row in sendMessage) now carries the quote, so we no longer fold "> ..." into the
	// text: the local echo renders an inline quote card and the transport sets a real reply_to so other
	// clients thread it too. Just return the typed body.
	composeBodyText: function(){
		return this.$.richText.getValue();
	},
	sendMessageHelper: function(params, kind) {
		params._kind = kind;
		params.localTimestamp = Date.now();
		this.$.messageServicePutOutbox.call({objects: [params]});//revealListBottom
		this.$.richText.setValue("");
		this.cancelReply();
		// Attachment send: the staged file has been committed to this message; clear the chip.
		if (this.outboundAttachment) {
			this.clearAttachment();
		}
		
		// play a sound for sending message
		this.playSoundNotification({ isSent: true });
		
//todo: keep it to remind something similiar
//		MessagingUtils.checkAirplaneMode(params);

		if (kind === enyo.messaging.message.SMS.dbKind && !this.phoneConnected) {
			// this call is needed for devices that lack of SMS capability
			// phone is not connected, so prompt the user to connect to the phone
			this.$.connectPhoneDialog.openAtCenter();
		}
	},
	playSoundNotification: function(inParams) {
		var prefs = enyo.application.prefsHandler.getPrefs();
		if (prefs && prefs.enableNotification 
				&& (prefs.notificationSound === "system" || prefs.notificationSound === "ringtone")) {
			// play sound notification when user enables sound notification in preferences
			var soundPath = enyo.messaging.utils.getAppRootPath() + (inParams.isSent ? enyo.messaging.message.SOUND_PATHS.SENT : enyo.messaging.message.SOUND_PATHS.RECEIVED);
			if (!window.PalmSystem)
			{
				console.log("We don't have PalmSystem, so not playing back sounds");
			}
			else
			{
				window.PalmSystem.playSoundNotification(enyo.messaging.message.SOUND_CLASSES.RINGTON, soundPath);
			}
		}
	},
//todo: check if this message has more than one converstions (chatthread Id)
	swipeDelete: function(inSender, inIndex) {
		enyo.messaging.keyboard.setKeyboardAutoMode();
		var record = this.$.list.fetch(inIndex);
		if (record && record._id) {
			this.$.dbDelete.call({
				ids: [record._id]
			});
		}
	},
	// A sender name on a group message was tapped: resolve the row's message and bubble up a "person"
	// (routable id + display name) so ChatView can open/create a 1:1 with that sender.
	senderRowSelected: function(inSender, inEvent){
		var message = this.$.list.fetch(inEvent.rowIndex);
		if (!message || !message.from || !message.from.addr) {
			return true;
		}
		this.doSelectSender({
			username: message.from.addr,
			serviceName: message.serviceName,
			displayName: (message.from.name || message.from.addr)
		});
		return true;
	},
	// A message attachment chip/link was tapped (ConversationItem.messageTapped). Play it in the
	// stock video player - it hardware-decodes video and, now that we've backported a gstreamer-0.10
	// Opus plugin (libgstopus + opus-aware libgstogg) into the system media pipeline, it plays
	// WhatsApp/Telegram/Signal voice notes (Opus-in-Ogg) natively too. Launched (NOT opened - it
	// lives on the luna bus and reads params.target); streams remote http(s) or plays local file://.
	openAttachment: function(inSender, inEvent){
		var target = inEvent && inEvent.target;
		if (!target) { return true; }
		var kind = (inEvent.kind || "").toLowerCase();
		var title = target.split("?")[0].split("#")[0];
		title = title.substring(title.lastIndexOf("/") + 1);
		try { title = decodeURIComponent(title); } catch (e) {}
		// Audio/video play in the stock video player (Atlas media pipeline).
		if ((kind === "audio" || kind === "video") && this.$.appLauncher) {
			this.$.appLauncher.call({id: "com.palm.app.videoplayer", params: {target: target, videoTitle: title || $L("Attachment")}});
			return true;
		}
		// LOCAL documents: launch the registered viewer app directly with the file. applicationManager
		// "open" browser-opens a file:// document (it lands in Atlas + its pdf.js, which is very slow),
		// so we bypass it and launch the real app, which reads params.target/fileName: pdf -> Adobe
		// Reader, Word/Excel/PowerPoint -> QuickOffice. ONLY for file:// though - Adobe/QuickOffice open
		// LOCAL files, so a REMOTE doc URL (a Teams/OneDrive share link, which can't be downloaded) must
		// fall through to the browser, where the user's signed-in session can open it (Office Online).
		var docApp = { pdf: "com.quickoffice.ar", doc: "com.quickoffice.webos", xls: "com.quickoffice.webos", ppt: "com.quickoffice.webos" }[kind];
		if (docApp && /^file:/i.test(target) && this.$.appLauncher) {
			this.$.appLauncher.call({id: docApp, params: {target: target, fileName: title}});
			return true;
		}
		// Images, remote docs (Teams/OneDrive), anything else: the system resource handler / browser.
		if (this.$.launchApp) {
			this.$.launchApp.call({ target: target });
		}
		return true;
	},
	// Short TAP on a message => open the quick reaction emoji row (was: the message menu, which now
	// lives behind the row's "..." button / a short right-swipe also opens the row - handleReactSwipe).
	handleMessageTap: function(inSender, inEvent){
		enyo.messaging.keyboard.setKeyboardAutoMode();
		if (inEvent.target.nodeName == "A") {
			return;
		}
		var index = inEvent.rowIndex;
		var message = this.$.list.fetch(index);
		this.selectedMessage = message;
		if (message._kind === enyo.messaging.message.MMS.dbKind) {
			return;
		}
		if (message.folder === enyo.messaging.message.FOLDERS.INBOX || message.folder === enyo.messaging.message.FOLDERS.OUTBOX) {
			// Tapping an existing reaction badge toggles MY reaction for that emoji (remove if it's
			// mine, otherwise add/switch to it) instead of opening the picker.
			var badgeEmoji = this.reactionBadgeAt(inEvent.target);
			if (badgeEmoji) {
				this.toggleMyReaction(message, badgeEmoji);
			} else {
				this.openReactRow(inEvent);
			}
		}
	},
	// Walk up from a tapped node to a reaction badge; return its emoji (data-reaction) or null.
	reactionBadgeAt: function(node){
		var n = node, hops = 0;
		while (n && n.getAttribute && hops < 8) {
			var v = n.getAttribute("data-reaction");
			if (v) { return v; }
			n = n.parentNode; hops++;
		}
		return null;
	},
	// Add / switch / remove MY reaction (optimistic sender "me"): if I already reacted with this emoji
	// remove it; otherwise drop any prior reaction of mine and set this one. Merges onto the row's
	// reactions array (transmitting to the network is the transport sendReaction verb, later increment).
	toggleMyReaction: function(message, emoji){
		if (!message || !emoji) { return; }
		var rx = (message.reactions && message.reactions.slice) ? message.reactions.slice() : [];
		var out = [], mineWasThis = false;
		for (var i = 0; i < rx.length; i++) {
			if (rx[i] && rx[i].sender === "me") {
				if (rx[i].emoji === emoji) { mineWasThis = true; }
				// drop my previous reaction; re-added below unless we're toggling this one off
			} else {
				out.push(rx[i]);
			}
		}
		// Don't add an optimistic badge for an emoji this network can't take (mapped to "" for the
		// service) - it would never reach the network, leaving a phantom local-only badge. (Removing an
		// existing one is still fine.) The picker already hides these, but guard other tap paths too.
		if (!mineWasThis && message.serviceName &&
				this.mapReactionForNetwork(emoji, message.serviceName) === null) {
			return;
		}
		if (!mineWasThis) { out.push({emoji: emoji, sender: "me"}); }
		message.reactions = out;
		this.$.dbMerge.call({objects: [{_id: message._id, reactions: out}]});
		this.$.list.refresh();
		// Transmit to the network. The emoji is ALWAYS sent (even when removing, so backends that drop a
		// specific reaction know which one); mineWasThis == the user is toggling this emoji back off.
		this.sendReactionCommand(message, emoji, mineWasThis);
	},
	// Write the imcommand row the transport picks up to actually send/remove the reaction. Only
	// possible for messages that carry the prpl's own id (serviceMessageId); otherwise it stays a
	// local-only optimistic badge. me/peer flip with the message direction. remove=true removes my
	// `emoji` reaction, else adds it.
	sendReactionCommand: function(message, emoji, remove){
		if (!message || !message.serviceMessageId || !message.serviceName || !emoji) { return; }
		// Networks curate their own reaction sets (e.g. the picker's 😆/😮 aren't valid Telegram
		// reactions). Translate the picked emoji to the service's equivalent per the account template's
		// "reactions" map; a "" mapping means unsupported => keep the local badge but don't transmit.
		var netEmoji = this.mapReactionForNetwork(emoji, message.serviceName);
		if (!netEmoji) { return; }
		var inbox = (message.folder === enyo.messaging.message.FOLDERS.INBOX);
		var me   = inbox ? (message.to && message.to[0] && message.to[0].addr) : (message.from && message.from.addr);
		// The reaction targets the CONVERSATION the message lives in. For a 1:1 that is the peer
		// person (from.addr on a received msg, to.addr on a sent one). For a GROUP/GUILD CHANNEL that
		// is the CHANNEL, not a person - from/to.addr there is the sender/recipient, so the transport
		// would route the reaction to the wrong place (Discord returns "Unknown Message" reacting in
		// the wrong channel). Use the channel id (channelName) for groupchat messages.
		var peer = (message.chatType === "groupchat" && message.channelName) ?
			message.channelName :
			(inbox ? (message.from && message.from.addr) : (message.to && message.to[0] && message.to[0].addr));
		if (!me || !peer) { return; }
		// The imcommand kind mirrors the message's immessage kind (e.g. com.palm.immessage.libpurple:1
		// -> com.palm.imcommand.libpurple:1), so the right transport watches it. Derive it from the
		// message _kind rather than via accountService (which isn't reachable from here).
		var imcommandKind = (message._kind && message._kind.indexOf("immessage") >= 0) ?
			message._kind.replace("immessage", "imcommand") : "com.palm.imcommand.libpurple:1";
		var cmd = {
			_kind: imcommandKind,
			command: "sendReaction",
			handler: "transport",
			status: "pending",
			fromUsername: me,
			targetUsername: peer,
			serviceName: message.serviceName,
			// targetSender = the ORIGINAL message's sender (from.addr is the sender on a received msg
			// AND ourselves on a sent msg, so it's correct both ways). The transport hands it to the
			// backend so a reaction can be built even when the plugin's in-memory message cache has no
			// entry for the target (after a transport restart/crash, or a message older than the cache).
			// Without it whatsmeow has to GUESS the sender (wrong for your own 1:1 msgs and group msgs).
			params: {
				targetServiceMessageId: message.serviceMessageId,
				emoji: netEmoji,
				remove: !!remove,
				targetSender: (message.from && message.from.addr) || ""
			}
		};
		this.$.reactionCommand.call({objects: [cmd]});
	},
	// Translate a picker emoji entity to the one the given service accepts, using the per-service
	// "reactions.map" from the account template (see accountService.getReactions). No policy or no
	// entry => pass the emoji through unchanged; an entry mapping to "" => unsupported (returns null).
	mapReactionForNetwork: function(emoji, serviceName){
		try {
			var as = enyo.application.accountService;
			var rx = (as && as.getReactions) ? as.getReactions(serviceName) : null;
			if (!rx || !rx.map || !rx.map.hasOwnProperty(emoji)) { return emoji; }
			var mapped = rx.map[emoji];
			return mapped === "" ? null : mapped;
		} catch (e) {
			enyo.warn("mapReactionForNetwork failed, passing emoji through: ", e);
			return emoji;
		}
	},
	// Short RIGHT-swipe on a message => reply/quote it (tap already covers react, so swipe = reply).
	handleReactSwipe: function(inSender, inIndex){
		enyo.messaging.keyboard.setKeyboardAutoMode();
		var message = this.$.list.fetch(inIndex);
		if (!message) { return; }
		this.selectedMessage = message;
		if (message.folder === enyo.messaging.message.FOLDERS.INBOX || message.folder === enyo.messaging.message.FOLDERS.OUTBOX) {
			this.enterReply(message);
		}
	},
	// Enter reply mode: show the quote bar above the input (with an X to cancel) instead of stuffing
	// the quote into the text box. On send, the quote is prepended (increment 1) / attached as native
	// reply metadata (later). replyToMessage is cleared by cancelReply or after a successful send.
	enterReply: function(message){
		if (!message) { return; }
		this.replyToMessage = message;
		var q = enyo.messaging.message.unescapeText(message.messageText || "");
		q = q.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ");
		if (q.length > 90) { q = q.substring(0, 90) + "…"; }
		var who = (message.from && message.from.name) ? message.from.name : "";
		var html = (who ? '<b>' + enyo.string.escapeHtml(who) + '</b> ' : '') +
			enyo.messaging.message.emojify(enyo.string.escapeHtml(q));
		this.$.replyBarText.setContent(html);
		this.$.replyBar.setShowing(true);
		if (this.$.richText.forceFocus) { this.$.richText.forceFocus(); }
	},
	cancelReply: function(){
		this.replyToMessage = null;
		if (this.$.replyBar) { this.$.replyBar.setShowing(false); }
	},
	openReactRow: function(inEvent){
		// Emoji content is set in setupReactEmoji via the popup's onBeforeOpen (fires after the buttons
		// are created but before first render), so the FIRST open already shows them.
		if (inEvent && this.$.reactRow.openAtEvent) { this.$.reactRow.openAtEvent(inEvent); }
		else { this.$.reactRow.openAtCenter(); }
	},
	// Render the picker emoji as inline images (emojify turns the &#NNNNN; entity into an <img>) so
	// astral emoji show up instead of tofu. Done lazily on first open - at create() time the Popup's
	// child controls aren't populated yet, so the contents never got set (showed empty buttons).
	setupReactEmoji: function(){
		if (!this.$.reactRowBox || !this.$.reactRowBox.getControls) { return; }
		var picks = this.$.reactRowBox.getControls();
		var service = this.chatThread && this.chatThread.replyService;
		for (var p = 0; p < picks.length; p++) {
			var rv = picks[p].reactionValue;
			if (!rv) { continue; } // the "..." more button has no emoji
			// Content (emojify -> inline <img>) only needs setting once.
			if (!this._reactEmojiReady) {
				picks[p].setContent(enyo.messaging.message.emojify(rv));
			}
			// Hide emoji this network can't take (mapped to "" in the account template's reactions map,
			// e.g. 🙏 on Teams) so the picker only offers reactions that will actually send. Re-evaluated
			// every open because the conversation's service can differ.
			picks[p].setShowing(this.mapReactionForNetwork(rv, service) !== null);
		}
		this._reactEmojiReady = true;
	},
	// An emoji in the quick row was tapped: react. Increment 1 is optimistic-only (merge onto the
	// row's reactions array so the badge shows immediately); actually transmitting the reaction to the
	// network is the transport sendReaction verb + per-plugin wiring (later increments).
	reactPicked: function(inSender, inEvent){
		this.$.reactRow.close();
		var emoji = inSender && inSender.reactionValue;
		if (emoji && this.selectedMessage) {
			this.toggleMyReaction(this.selectedMessage, emoji);
		}
	},
	// The "..." button in the reaction row: open the full message menu (Reply / Forward / Copy / Delete).
	reactMore: function(inSender, inEvent){
		this.$.reactRow.close();
		this.openMessageMenu();
	},
	openMessageMenu: function(){
		var message = this.selectedMessage;
		if (!message) { return; }
		var popupItems = [
			{caption: $L("Reply"), value: "reply-cmd"},
			{caption: $L("Forward"), value: "forward-cmd"},
			{caption: $L("Forward Via Email"), value: "forward-as-email-cmd"},
			{caption: $L("Copy Text"), value: "copy-cmd"},
			{caption: $L("Delete"), value: "delete-cmd"}
		];
		if(message.errorCategory && (message.status === enyo.messaging.message.MESSAGE_STATUS.FAILED || message.status === enyo.messaging.message.MESSAGE_STATUS.UNDELIVERABLE)) {
			popupItems.push( {caption: $L("View Error"), value: "view-error"} );
		}
		this.$.popupSelect.setItems(popupItems);
		this.$.popupSelect.openAtCenter();
	},
	popupMenuSelect: function(inSender, inSelected) {
		var value = inSelected.getValue();
		if (value === "reply-cmd") {
			this.enterReply(this.selectedMessage);
		} else if (value === "forward-cmd") {
			var composeParams = {
				messageText: enyo.messaging.message.unescapeText(this.selectedMessage.messageText)
			};
			this.doSelectThread(null);
			this.doOpenComposeView(composeParams);
		} else if (value === "forward-as-email-cmd") {
			this.$.launchApp.call({id: "com.palm.app.email", params: {text: this.selectedMessage.messageText}});

		} else if (value === "copy-cmd") {
			enyo.dom.setClipboard(enyo.messaging.message.unescapeText(this.selectedMessage.messageText));
		} else if (value === "delete-cmd") {
//todo: also need check multiple converstions (chatthreadId)
			this.$.dbDelete.call({ids: [this.selectedMessage._id]});
			
		} else if (value === "view-error") {
			this.handleMessageErrorPopup(this.selectedMessage);
		}
	},
	showErrorDialog: function(inSender, inMessage){
		this.selectedMessage = inMessage;
		this.handleMessageErrorPopup(inMessage);
	},
	handleMessageErrorPopup: function(messageData) {
		var title = "";
		// if the message is not really in an error state then just return		
		if (messageData.errorCategory === undefined || messageData.errorCategory === null || (messageData.status !== enyo.messaging.message.MESSAGE_STATUS.FAILED && messageData.status !== enyo.messaging.message.MESSAGE_STATUS.UNDELIVERABLE)) {
			enyo.error("*** Warning got into handleMessageErrorPopup but the message isn't in an error. status= ", messageData.status," , error= ", messageData.errorCategory);
			return;
		}
        
		// For some reason only MMS errors have title text
		if (messageData._kind === enyo.messaging.message.MMS.dbKind) {
			if (messageData.folder === enyo.messaging.message.FOLDERS.OUTBOX) {
				title = $L("Unable To Send Message");
			} else {
				title = $L("Unable to Download Message");
			}
		}
						
    	this.$.errorDialog.openAtCenter();

		// Reset the shared dialog's accept ("Send again") button, which a previous UNDELIVERABLE
		// message would have hidden for good (no re-show otherwise) -- so retryable failures always
		// offer the resend action.
		this.$.errorDialog.showAcceptButton();
		// Offer a resend for any FAILED message AND for an IM "permanent-fail" (UNDELIVERABLE): an IM
		// permanent-fail (e.g. SendIMErr_generic_error -- a Teams/WhatsApp/etc transport or network
		// hiccup) is typically cleared by resending, unlike a true SMS/MMS undeliverable (bad number),
		// which stays unretryable. IM = not the SMS/MMS kind.
		var isSmsMms = (messageData._kind === enyo.messaging.message.SMS.dbKind ||
		                messageData._kind === enyo.messaging.message.MMS.dbKind);
		if (messageData.status === enyo.messaging.message.MESSAGE_STATUS.FAILED ||
		    (!isSmsMms && messageData.status === enyo.messaging.message.MESSAGE_STATUS.UNDELIVERABLE)) {
			if (messageData.folder === enyo.messaging.message.FOLDERS.OUTBOX) {
				this.$.errorDialog.setAcceptButtonCaption($L("Send again"));
			// incoming MMS can also fail
			} else if (messageData._kind === enyo.messaging.message.MMS.dbKind) {
				this.$.errorDialog.setAcceptButtonCaption($L("Retry message fetch"));
			}
		} else if (messageData.status === enyo.messaging.message.MESSAGE_STATUS.UNDELIVERABLE) {
			// true SMS/MMS undeliverable (e.g. invalid number) -- resending won't help
			this.$.errorDialog.hideAcceptButton();
		}
		
        if (title !== "") {
            this.$.errorDialog.setTitle(title);
    	} else {
    		this.$.errorDialog.setTitle($L("Error"));
    	}
        
        this.$.errorDialog.setMessage(enyo.messaging.message.getMessageErrorFromCode(messageData.errorCategory, messageData));
	},
	retryMessage: function(){
		 // Retry puts the message back to status=pending so the service will try sending it again
		var object = { _id:this.selectedMessage._id, status:"pending", errorCategory:null, retryCount:0 };
		this.$.dbMerge.call({objects: [object]});
	},	
	sendAny: function()	{
		this.forceSendIfOffline = true;
		this.sendMessage();
	},
	promptDelete: function() {
		enyo.messaging.keyboard.setKeyboardAutoMode();
	    this.$.deleteDialog.openAtCenter();
	    this.$.deleteDialog.setTitle($L("Delete Conversation"));
	    this.$.deleteDialog.setMessage($L("Are you sure you want to delete this conversation? You cannot undo this action."));
	    this.$.deleteDialog.setAcceptButtonCaption($L("Delete"));
	}, 
	deleteConversation: function() {
		this.$.deleteService.setId(this.chatThread._id);
		this.$.deleteService.deleteThread();
		this.closeConversation(this.chatThread._id, true);
		this.doSelectThread(null);
		this.doCloseConversationList();
	},
	promptBlock: function() {
		enyo.messaging.keyboard.setKeyboardAutoMode();
		this.$.blockDialog.openAtCenter();
		this.$.blockDialog.setTitle($L("Block Sender"));                                                                                          
        this.$.blockDialog.setMessage($L("Are you sure you want to block this sender?"));
	    this.$.blockDialog.setAcceptButtonCaption($L("Block Sender"));
	},
	blockSender: function() {
		this.$.blockService.setThread(this.chatThread);
		this.$.blockService.blockPerson();
		this.deleteConversation();
	},
	// webOS: the transport the user currently has selected in the header dropdown - what the call buttons
	// and the compose bar act on. Falls back to the conversation's own reply service/address before the
	// picker is populated (e.g. the first updateVideoButton() during setupNewChatThread). Kept in sync so
	// switching service in the dropdown re-targets the phone icon AND the actual dial (transportChange
	// re-runs updateVideoButton; voicecall reads this), instead of freezing on the open-time replyService.
	currentCallTarget: function(){
		var t = transportPicker.getSelectedTransport && transportPicker.getSelectedTransport();
		return {
			serviceName: (t && t.serviceName) || (this.chatThread && this.chatThread.replyService),
			address:     (t && t.replyAddress) || (this.chatThread && this.chatThread.replyAddress)
		};
	},
	// Show the header call buttons (video + voice) only for a 1:1 conversation.
	updateVideoButton: function(){
		var show = !!(this.chatThread && !this.chatThread.groupChatId);
		// Video stays for every non-group chat (it uses a universal WebRTC join-link, not the transport).
		if (this.$.videoCallButton) { this.$.videoCallButton.setShowing(show); }
		// Voice call launches com.palm.app.phone with the SELECTED transport, so only show it for
		// phone-capable services (SMS/MMS + the phone-number/voice IM services WhatsApp, Signal, Telegram);
		// hide it for username-only IM (Discord, Facebook, Teams, Google Chat, IRC, ...). Reads the current
		// dropdown selection so switching service updates the icon (see transportChange -> updateVideoButton).
		if (this.$.phoneCallButton) {
			this.$.phoneCallButton.setShowing(show && this.serviceHasVoiceCapability(this.currentCallTarget().serviceName));
		}
	},
	// webOS: which conversation transports can place a voice call via the phone app. Data-driven -
	// accountService reads the "voiceCall" flag off each service's MESSAGING capabilityProvider (plus
	// cellular SMS/MMS), so the phone-capable set auto-extends when a connector declares it. Fallback
	// (before accountService is ready) is cellular text only, never a hardcoded IM list.
	serviceHasVoiceCapability: function(serviceName){
		var as = enyo.application && enyo.application.accountService;
		if (as && as.hasVoiceCapability) { return as.hasVoiceCapability(serviceName); }
		var u = enyo.messaging.utils;
		return !!(u && u.isTextMessage && u.isTextMessage(serviceName));
	},
	// Voice call: hand off to the Phone app's call flow for the current 1:1 peer.
	voicecall: function(){
		if (!this.chatThread || this.chatThread.groupChatId) { return; }
		// Dial via the transport currently selected in the header dropdown (not the open-time replyService),
		// so switching to WhatsApp and tapping the phone icon places a WhatsApp call rather than the original.
		var target = this.currentCallTarget();
		this.$.launchApp.call({id: "com.palm.app.phone", params: {address: target.address, transport: target.serviceName, video: false}});
	},
	dial: function(inSender, inReplyAddress){
		this.$.launchApp.call({id: "com.palm.app.phone", params: {address: inReplyAddress, transport: "com.palm.skype.call", video: false}});
	},
	// webOS: video calling via the Atlas browser's built-in WebRTC (getUserMedia + webrtcbin +
	// ICE/DTLS/SRTP are all confirmed present and working on device). The old skype/phone-app video
	// path is dead, so instead we spin up a unique Jitsi Meet room: invite the peer with the join
	// link (a normal outgoing message they can tap on any platform), then open the room locally in
	// Atlas. No native media code, no signalling server. Self-contained from the current 1:1 thread.
	videocall: function(){
		if (!this.chatThread || this.chatThread.groupChatId) { return; }
		var peer = String(this.chatThread.replyAddress || "call").replace(/[^a-zA-Z0-9]/g, "");
		var room = "webosVC" + peer.slice(-10) + Date.now().toString(36).slice(-4);
		// Lightweight PeerJS WebRTC page (github.com/Herrie82/webos-vc) - Jitsi's SPA OOM-crashes the
		// old browser; this is a ~5KB page. Room rides in ?room= (a query param survives Atlas's launch
		// where a #fragment can be dropped).
		var url = "https://herrie82.github.io/webos-vc/?room=" + room;
		// Best-effort: send the peer the join link through the current conversation transport.
		try {
			this.$.richText.setValue($L("📹 Video call — tap to join: ") + url);
			this.sendMessage();
		} catch (e) {
			enyo.warn("videocall: could not send invite link: " + e);
		}
		// Open in ATLAS explicitly (id) - NOT the default http handler (old com.palm.app.browser).
		// Prefix the target with "atlas-simple:" so the card is BORN in MODE 2 (viewport, 1-screen
		// render buffer -> ~4x less display readback CPU): Atlas BrowserApp.js maps the prefix to
		// _launchSimple, and BrowserServer rebuilds the pre-warmed WebView at mult=1 for it. The call
		// page is a single fixed viewport that never scrolls, so MODE 2 is ideal. (The prefix survives
		// atlasOpenCard where the mode= param does not; the old about:blank warmup no longer defeats it.)
		this.$.launchApp.call({id: "org.webosports.app.atlas", params: {target: "atlas-simple:" + url}});
	},
    gotSystemPrefs: function(from, response) {
        // System preferences (timeFormat) service success response handler.
        // timeFormat should be "HH12" or "HH24"
		if (response.timeFormat !== undefined) {
			var twelveHour = false;
	        this.timeFormat = response.timeFormat;
	
	        if (this.timeFormat === "HH12"){
	        	twelveHour = true;
	        }
	        //Resetting the formatter object with the new system setting
	        Utils._shortTimeFmt=new enyo.g11n.DateFmt({time: "short", twelveHourFormat: twelveHour});
	        //Re-render the list
			if (this.$.list) {
				this.$.list.refresh();
			}
		}
	},
    gotSystemPrefsFailure: function(from, response) {
        // System preferences (timeFormat) service failure response handler.
        enyo.log ("Failed to retrieve system time format.\n\t", response);
    },
	saveMessageToDraft: function(message, chatThreadId) {
		if (message && message.length > 0) {
			// Get the recipient
			var selectedTransport = transportPicker.getSelectedTransport();
			var recipient = {
				addr: selectedTransport.replyAddress
			};
			
			// Build the record, might not need save to and serviceName since only messageText is used after retrieved draft
			var params = {
				to: [recipient],
				messageText: message,
				serviceName: selectedTransport.serviceName
			};
			
			// Handle attachment
			if (this.outboundAttachment !== undefined) {
				params.attachment = this.outboundAttachment;
			}
			params.folder = enyo.messaging.message.FOLDERS.DRAFTS;
			params.flags = { visible: "false" };
			params._kind = enyo.messaging.message.dbKind;
			params.conversations = [chatThreadId];
			params.localTimestamp =  Date.now();
			this.$.messageServicePut.call({objects: [params]});
		}
	},
	gotDraftMessages: function(inSender, inResponse){
		enyo.log("Timing - ConversationList - gotDraftMessages() - It took", (Date.now() - this.startDraftMsgTime), "ms to get any draft message from the Db.");
enyo.error("----enyo.keyboard.isShowing():", enyo.keyboard.isShowing());
		if (enyo.keyboard.isShowing()) {
			this.$.richText.forceFocus();
		}

		if (inResponse.results && inResponse.results[0] && inResponse.results[0].conversations && this.chatThread && inResponse.results[0].conversations[0] === this.chatThread._id) {
			this.$.richText.setValue(inResponse.results[0].messageText);
			this.$.dbDelete.call({
				ids: [inResponse.results[0]._id]
			});
		}
	},
	messagesFailure: function(inSender, inResponse){
		enyo.error("ConversationList::messagesFailure::inResponse:", inResponse);
	},
	windowHiddenHandler: function(){
		if (this.chatThread && this.chatThread._id) {
			this.closeConversation(this.chatThread._id);
			this.doSelectThread(null);
		}
		if (this.$.richText.hasFocus()) {
			this.$.richText.forceBlur();
		}
	},
	windowUnloadHandler: function(){
		if (this.chatThread && this.chatThread._id) {
			this.closeConversation(this.chatThread._id);
		}
		if (enyo.application.telephonyWatcher) {
			enyo.application.telephonyWatcher.unregister();
		}
	},
	setKeyboardMannualMode: function(){
		enyo.messaging.keyboard.setKeyboardMannualMode();
	},
	/***********************************
	 * Functions below are unit tested *
	 ***********************************/
	isDifferent: function(newIds, oldIds){
		if(newIds === undefined && oldIds === undefined){
			return false;
		}
		else if(newIds === undefined || oldIds === undefined){
			return true;
		}
		else if(newIds.length !== oldIds.length){
			return true;
		}
		else{
			var i, isChanged = false;
			newIds.sort();
			oldIds.sort();
			for (i=0; i<newIds.length; i++){
				if(newIds[i]!==oldIds[i]){
					isChanged = true;
					break;
				}
			}
			return isChanged;
		}
	}
});