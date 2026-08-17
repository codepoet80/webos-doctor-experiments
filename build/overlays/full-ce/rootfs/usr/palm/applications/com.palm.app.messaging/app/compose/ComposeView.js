/*globals enyo */

enyo.kind({
	name: "ComposeView",
	kind: enyo.VFlexBox,
	className: "composeview",
	published: {
		loginStates:[],
		params:"",
		input:""
	},
	events: {
		onOpenConversation: ""
	},
	components: [
		{kind: "ApplicationEvents", onUnload: "windowUnloadHandler", onWindowHidden:"windowHiddenHandler"},
		{layoutKind: "HFlexLayout", className: "enyo-row", components: [
			/* Watch keyup because the default action of a key (printing/deleting a character)
			 * is done before keyup, which means the input will have resized.
			 * Watch keypress because pressing & holding a key generates
			 * multiple presses but never a keyup
			 */
			{kind: "AddressingPopup", onkeyup: "addressingPopupKeyup", onBeforePopupOpen: "onBeforePopupOpenHandler", flex: 1, addressTypes: ["ims", "phoneNumbers"], components: [
				{kind: "ImTransportList", onSelect: "chatUsingTransport"}
			]}
		]},
		
		{flex: 1},
		{className:"footer-shadow"},
		{kind: "Toolbar", className:"enyo-toolbar-light conversation-bottom", components: [
			{name: "slidingDrag", slidingHandler: true, kind: "GrabButton" },
			/* Watch keyup because the default action of a key (printing/deleting a character)
			 * is done before keyup, which means the input will have resized.
			 * Watch keypress because pressing & holding a key generates
			 * multiple presses but never a keyup
			 */
			{name: "scroller", kind: "BasicScroller", style: "max-height: 155px;", flex: 1, horizontal: false, autoHorizontal: false,  components: [
			    {name: "richText", kind: "RichText", hint: $L("Enter message here..."), richContent: false, onkeyup: "checkInputHeight", alwaysLooksFocused:true, onkeydown: "checkKey", autoEmoticons: true}
			]}
		]},
		{name: "errorDialog", kind: "PopupDialog"},
		{name: "connectPhoneDialog", kind: "ConnectPhoneDialog", onClose: "openConversationAfterPaired"},
		{name: "messageServiceWatch", kind: "DbService", dbKind: "com.palm.message:1",  method: "find", subscribe: true, resubscribe: true, reCallWatches: true, onSuccess: "gotMessage"},
		{name: "messageService", kind: "DbService", dbKind: enyo.messaging.message.dbKind, onFailure: "messagesFailure", components: [
			{name: "messageServiceFind", method: "find", onSuccess: "gotDraftMessages"},
			{name: "messageServiceDelete", method: "del", onSuccess: "deletedDraftMessages"},
			{name: "messageServicePut", method: "put", onSuccess: "onInsertMessage"}
		]}		
	],
	create: function() {
		this.inherited(arguments);
		
		if (enyo.application.telephonyWatcher) {
			enyo.application.telephonyWatcher.register(this, this.connectionUpdated.bind(this));
		}
		this.getDraft();
	},
	getDraft: function(){
			this.$.messageServiceFind.call({
				query: {
					where: [{
						prop: "conversations",
						op: "=",
						val: "_compose"
					}, {
						prop: "folder",
						op: "=",
						val: enyo.messaging.message.FOLDERS.DRAFTS
					}],
					select: [
						"contacts",     
						"conversations",
						"messageText"
					]					
				}
			});
	},
	gotDraftMessages: function(inSender, inResponse){
		if (inResponse.results[0] && inResponse.results[0].conversations && inResponse.results[0].conversations[0] === "_compose") {
			this.$.richText.setValue(inResponse.results[0].messageText);
			var contacts = inResponse.results[0].contacts;
			if( contacts && contacts.length>0){
				this.$.addressingPopup.setContacts(contacts);
			}
			this.$.messageServiceDelete.call({
				query: {
					from: enyo.messaging.message.dbKind,
					where: [{
						prop: "conversations",
						op: "=",
						val: "_compose"
					}, {
						prop: "folder",
						op: "=",
						val: enyo.messaging.message.FOLDERS.DRAFTS
					}]
				}
			});
		}
	},
	connectionUpdated: function(connected) {
		this.phoneConnected = connected;
	},
	onBeforePopupOpenHandler: function(){
//		this.$.addressingPopup.$.popup.validateComponents();
		this.$.imTransportList.setLoginStates(this.loginStates);
		this.$.imTransportList.setInput(this.input);
	},
	addressingPopupKeyup: function(inSender, inEvent) {
		if (this.$.imTransportList) {
			this.$.imTransportList.setInput(inSender.getInputValue());
		}
		this.input = inSender.getInputValue();
	},
	chatUsingTransport: function (inSender, inDisplayName, inValue, inServiceName){
		this.$.addressingPopup.addContact({displayName: inDisplayName, value: inValue, serviceName: inServiceName, type: inServiceName});
	},
	loginStatesChanged: function(oldLoginStates){
		if (this.$.imTransportList) {
			this.$.imTransportList.setLoginStates(this.loginStates);
		}
	},
	paramsChanged: function(inOldParams){
		enyo.log("ComposeView::paramsChanged::params:",this.params, "inOldParams:",inOldParams);
		this.prePopulatedRecipients = [];
		if (this.params !== undefined) {
			var contactAddress;
			if (this.params.personId !== undefined) {
				this.personId = this.params.personId;
			}
			if (this.params.ims !== undefined) {
				for (i = 0; i < this.params.ims.length; i++) {
					contactAddress = this.params.ims[i];
					if (contactAddress.value || contactAddress.addr) {
						this.prePopulatedRecipients.push({
							value: contactAddress.value || contactAddress.addr,
							displayName: contactAddress.displayName || contactAddress.value || contactAddress.addr,
							type: "im",
							serviceName: contactAddress.serviceName || contactAddress.type
						});
					}
				}
			}
			
			if (this.params.phoneNumbers !== undefined) {
				for (i = 0; i < this.params.phoneNumbers.length; i++) {
					contactAddress = this.params.phoneNumbers[i];
					if (contactAddress.value || contactAddress.addr) {
						this.prePopulatedRecipients.push({
							value: contactAddress.value || contactAddress.addr,
							displayName: contactAddress.displayName || contactAddress.value || contactAddress.addr,
							serviceName: contactAddress.serviceName || contactAddress.type || "sms",
							type: "phone"
						});
					}
				}
			}

			//	composeRecipients expects the following:
			//  [
			//		{
			//			"address": <phone number or IM>,
			//			"serviceName": <serviceName or domain> // only required for IM addresses
			//		}, ...
			//  ]
			if(this.params.composeRecipients && this.params.composeRecipients.length) {
				for (i = 0; i < this.params.composeRecipients.length; i++) {
					var recipient = this.params.composeRecipients[i];
					var serviceName;
					if (recipient.serviceName && (recipient.serviceName).indexOf("type_") === 0){
						serviceName = recipient.serviceName;
					}
					else {
						serviceName = recipient.serviceName ? "type_"+recipient.serviceName : '';
					}
					if (recipient.address) {
						this.prePopulatedRecipients.push({
							value: recipient.address,
							displayName: recipient.address,
							type: (recipient.serviceName ? 'im' : 'phone'),
							serviceName: serviceName
						});
					}
				}
			}
			
			if (this.params.messageText !== undefined) {
				this.$.richText.setValue(this.params.messageText);
				setTimeout((function(){
					this.$.addressingPopup.forceFocus();
				}).bind(this), 0);
			}
		}
		
		if (this.prePopulatedRecipients.length > 0) {
			enyo.log("ComposeView::has prePopulatedRecipients");
			var contacts = [], i;
			for (i=0; i < this.prePopulatedRecipients.length; i++){
				contacts.push({displayName:this.prePopulatedRecipients[i].displayName, value: this.prePopulatedRecipients[i].value, serviceName: this.prePopulatedRecipients[i].serviceName});
			}
			this.$.addressingPopup.setContacts(contacts);
		}
	},
	considerForSend: function(){
		var message = this.$.richText.getValue();
		if (message.length > 0) {//todo: check max length?
			var contacts = this.$.addressingPopup.getContacts();
			enyo.log("ComposeView::considerForSend::contacts:",contacts);
			var recipientsArray = [];
			if (contacts && contacts.length > 0) {
				recipientsArray = contacts;
				if (recipientsArray.length > 0) {
					var phoneRecipients = [];
					var imRecipients = [];
					var lastService = null;
					var isGroupChatCandidate = recipientsArray.length > 1;
					// separate the different types of recipients
					for (var x = 0; x < recipientsArray.length; x++) {
						var recipient = recipientsArray[x];
						if (recipient !== undefined) {
							//this.pushReminder(recipient);
							
							var serviceName;
							if(!recipient.serviceName && recipient.type){
								serviceName = recipient.type;
							}
							else{
								serviceName = recipient.serviceName;
							}	
							if (enyo.messaging.utils.isTextMessage(serviceName)) {
								phoneRecipients.push(recipient);
								isGroupChatCandidate = false;
							}
							else {
								// make sure that the serviceName is supported
								enyo.log("ComposeView::ConsiderForSend::recipient.serviceName:", serviceName);
								var account = enyo.application.accountService.getAccount(serviceName);
								
								if (!account) {
									var errorMessage = "";
									//errorMessage = $L("You are attempting to send to an IM type that is not supported.  Please choose a different address.");
									errorMessage = $L("You are attempting to send to an IM type for which you do not have an account to send from.");
									this.$.errorDialog.openAtCenter();
									this.$.errorDialog.setTitle($L("Unable to send"));
									this.$.errorDialog.setMessage(errorMessage);
									this.$.errorDialog.setCancelButtonCaption($L("OK"));
									this.$.errorDialog.hideAcceptButton();
									return;
								}
								else {
									if (lastService === null) {
										lastService = serviceName;
									}
									else 
										if (lastService !== serviceName) {
											isGroupChatCandidate = false;
										}
								}
								if(!recipient.serviceName && recipient.type){ //gtalk has type set, but not serviceName 
									recipient.serviceName = recipient.type;
								}
								imRecipients.push(recipient);
							}
						}
					}
					
					// send to phone recipients
					if (phoneRecipients.length > 0) {
						this.sendMessage(phoneRecipients, message);
					}
					
					if (imRecipients.length > 0) {
						// send to IM recipients if not starting a group chat, don't segment the data for IM
						// we start a group chat if all recipients are IM recipients of the same service, and that
						// service supports group chat.
						if (isGroupChatCandidate && false) {
						/* this.supportsGroupChat(lastService)) {
						 place holder for group logic later 
						 
					 }*/
						}
						else {
							this.sendMessage(imRecipients, message);
							this.sendMessageCount++;
						}
					}
				}
				else {//no recipient from addressingPopup.contacts
						enyo.error("ComposeView::considerForSend:recipientsArray is empty");
				}
			}
 			else{
				enyo.warn("ComposeView::considerForSend:: addressingPopup.getContacts() return 0 contacts, don't do anything.");
			}
		}
		else{
			enyo.warn("ComposeView::considerForSend:: messagingText is empty, don't do anything.");
		}
	},

	sendMessage: function(recipientsArray, message) {
		enyo.log("ComposeView::sendMessage: no. recip:", recipientsArray.length, " message:", message);

		var kind;
		for( var i=0; i<recipientsArray.length; i++ ){
			kind = undefined; // ensure this starts out undefined each iteration
			var recipient = recipientsArray[i];
			var currentTimestamp = Date.now();
			if(recipient.displayName !== undefined) {
				recipient.displayName = recipient.displayName;
			}
			if(!recipient.serviceName){
				recipient.type = "phone";
			}
			else if(enyo.messaging.utils.isTextMessage(recipient.serviceName)){
				recipient.type = "phone";
			}
			else{
				recipient.type = "im";
			}
			var params = {
				folder: enyo.messaging.message.FOLDERS.OUTBOX,
				status: "pending",
				to: [{
					"addr": enyo.messaging.utils.cleanPhoneNumber(recipient.value, recipient.type),
					"name": recipient.displayName
				}],
				timestamp: currentTimestamp,
				flags: {
					visible: true,
					deliveryReport: false//this.Messaging.messagingPrefs.getUseDeliveryReceipts() && enyo.messaging.utils.isTextMessage(recipient.serviceName)
				},
				localTimestamp: currentTimestamp,
				serviceName: recipient.serviceName,
				messageText: message
			};
			
			if (recipient.type === "im") {
				var dbkinds = enyo.application.accountService.getDbKinds(recipient.serviceName);
				if (dbkinds) {
					kind = dbkinds.immessage;
				}
				else {
					enyo.error("No dbkinds specified for service ", recipient.serviceName);
				}
				
				
				//NOTE: this is a dumb attempt at getting an account. It should really figure out which account
				// is associated with the buddy (recipient.value)
				var account = enyo.application.accountService.getAccount(recipient.serviceName);
				if (account) {
					enyo.error("ComposeView::sendMessage::Recipient is missing sender address. Guessing that account is ok:", account.username);
					params.from = {
						addr: account.username
					};
					params.username = account.username;
				}
				else {
					enyo.error("ComposeView::sendMessage::Recipient ",recipient.value, " is missing sender address and there is no account for serviceName " , recipient.serviceName);
				}
			}
			else {
				kind = "com.palm.smsmessage:1";
				params.serviceName = "sms";
			}
			
			if(kind !== undefined) {
					this.sendMessageHelper(params, kind);
//					MessagingUtils.checkAirplaneMode(params);
			} else {
				enyo.error("ComposeView::sendMessage::Warning! Unsupported recipient: ", recipient);
			}
		}
	},
	sendMessageHelper: function(params, kind){
		params._kind = kind;
		params.folder = "outbox";
		params.localTimestamp = Date.now();

		this.$.messageServicePut.call({objects: [params]});
		this.$.richText.setValue("");
		this.prePopulatedRecipients = [];
		this.$.addressingPopup.setContacts(null);
		
		if (kind === enyo.messaging.message.SMS.dbKind && !this.phoneConnected) {
			// this call is needed for devices that lack of SMS capability
			// phone is not connected, so prompt the user to connect to the phone
			this.$.connectPhoneDialog.openAtCenter();
		}
	},
	onInsertMessage: function(inSender, inResponse){
		if (inResponse.returnValue && inResponse.results && inResponse.results.length > 0) {
			var whereClause = [{"prop":"_id","op":"=","val":inResponse.results[0].id}];
			this.$.messageServiceWatch.cancel();
			this.$.messageServiceWatch.call({
				query: {
					where: whereClause
				}
			});
		}
	},	
	gotMessage: function(inSender, inResponse){
		if (inResponse.returnValue && inResponse.results && inResponse.results.length > 0 && inResponse.results[0].folder !== enyo.messaging.message.FOLDERS.DRAFTS) {
			this.message = inResponse.results[0];
			if (this.message.conversations && this.message.conversations.length) {
				this.$.messageServiceWatch.cancel();
		
				if (this.message._kind !== enyo.messaging.message.SMS.dbKind || this.phoneConnected) {
					//enyo.log("************ opening conversation: ", this.message.conversations[0]);
					this.doOpenConversation(this.message.conversations[0]);
					this.message = undefined;
				}
			}
		}
	},
	openConversationAfterPaired: function() {
		if (this.message && this.message.conversations && this.message.conversations.length > 0) {
			this.doOpenConversation(this.message.conversations[0]);
			this.message = undefined;
		}
	},
	checkKey: function(inSender, inEvent) {
		var messageText;

		// Pressing "enter" should send a message and clear the input
		if (inEvent.keyCode === 13) {
			inEvent.preventDefault();
			messageText = this.$.richText.getValue();

			// Only send non-empty messages
			if (messageText) {
				this.considerForSend();
			}
		}
	},
	windowHiddenHandler: function(){
		this.$.addressingPopup.close();
		if (this.$.richText.hasFocus()) {
			this.$.richText.forceBlur();
		}
	},
	saveDraft: function(){
		var message = this.$.richText.getValue();
		if (message.length > 0) {
			var contacts = this.$.addressingPopup.getContacts();
			
			var params = {
				contacts: contacts,
				messageText: message,
				attachment: this.attachment,
				folder: enyo.messaging.message.FOLDERS.DRAFTS,
				flags: { visible: "false" },
				_kind: enyo.messaging.message.dbKind,
				conversations: ["_compose"],
				localTimestamp:  Date.now()
			};
			
			this.$.messageServicePut.call({objects: [params]});
		}
	},
	messagesFailure: function(inSender, inResponse){
		enyo.error("--------ComposeView::messagesFailure::inResponse:", inResponse);
	},
	windowUnloadHandler: function(){
		if (enyo.application.telephonyWatcher) {
			enyo.application.telephonyWatcher.unregister();
		}
		this.saveDraft();
	}
});