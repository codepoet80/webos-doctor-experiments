var VvmErrorCode = {
	NO_ERROR: 0,
	NETWORK_ERROR: 2,
	BAD_PASSWORD: 3,
	MAILBOX_LOCKED: 4,
	MAILBOX_INUSE: 5,
	COOKIE_EXPIRED: 6,
	NO_DATA_CONNECTION: 8,
	MAILBOX_NOT_INIT: 10,		// this is referring to the mailbox on the server, not the one on the device.
	OUT_OF_MEMORY: 16,
	PROVISION_IN_PROGRESS: 20,
	NOT_VVM_CUSTOMER: 21,
	ALMOST_MAX_MESSAGES: 32,	//  new -- in order to inform the user that they are getting close to the limit.
	OUT_OF_SPACE: 34,			// space on device
	MAX_MESSAGES: 35,
	ALMOST_MAX_STORAGE: 36,		// on the server
	SAVE_FAILED: 37,
	MAX_STORAGE: 38,			// storage on server
	CORRUPT_XML: 50,
	MESSAGE_CORRUPT: 51,
	COULD_NOT_DOWNLOAD_MESSAGE: 52,
	// these might be useful for internal debugging.
	NO_MAILBOX_ON_DEVICE: 210,
	ALREADY_PROVISIONED: 220,	// if onEnabled is called and there's already a mailbox record.
	NO_SUCH_MESSAGE: 250,		// defined because Verizon defines it.
	INCOMPLETE_XML_REQUEST: 251,	// in xml
	INVALID_VM_LOCATION: 252,	// this is the LOC field in the XML to the server
	UNKNOWN_ERROR: 999
};

var VoicemailErrorAction = {
	NO_ACTION: 0,
	MANUAL_REFRESH: 1,
	SET_PIN: 2,
};

enyo.kind({
	name:"VoicemailError",
	kind: enyo.Control,
	started: false,
	oldErrorCode: 0,
	components: [
		{name: "VvmErrorWatch", kind: "DbService", method: "find", onSuccess: "onVoicemailError", subscribe: true, reCallWatches: true},
		{name: "VvmErrorWatchStop", kind: "DbService", method: "find", onSuccess: "onVoicemailError", subscribe: false, reCallWatches: false},
		{name: "voicemailErrorPrompt", kind: "DialogPrompt", cancelButtonCaption: $L("")},
		{name: "launchApplication", kind: "PalmService", service: enyo.palmServices.application, method: "launch"},
		{name: "networkAlerts", kind: "NetworkAlerts", onTap: "onTapHandlerFn"},
		{name: "sysService", kind: enyo.PalmService, service: enyo.palmServices.system},
		{name: "callsDBAssistant", kind: "DBAssistant"},
	],
	
	create: function() {
		this.inherited(arguments);
	},
	
	start: function() {
		if (!this.started) {
			this.started = true;
			this.$.VvmErrorWatch.call(DBModels.Voicemail.getMailBoxWatchQuery());
		}
	},
	
	stop: function() {
		if (this.started) {
			this.started = false;
			this.$.VvmErrorWatch.cancel();
		}
	},
	
	getVvmErrorString: function(errorCode) {
		var errorString = {"title":"", "message":""};

		var currentTime = enyo.application.Utils.formatShortTime(new Date());
		switch(errorCode) {
			case VvmErrorCode.NETWORK_ERROR:
				errorString.title = $L("Voicemail Activities Received");
				errorString.message = $L("Cannot Update Mailbox. Try again later.");
				break;
			case VvmErrorCode.BAD_PASSWORD:
			case VvmErrorCode.NOT_VVM_CUSTOMER:
				// errorString.title = "Voicemail Activities Received";
				// errorString.message = "Invalid Password. Select to login again. " + currentTime;
				// break;
				return null;
			case VvmErrorCode.MAILBOX_LOCKED:
			case VvmErrorCode.MAILBOX_INUSE:
			case VvmErrorCode.COOKIE_EXPIRED:
			case VvmErrorCode.MAILBOX_NOT_INIT:
			case VvmErrorCode.CORRUPT_XML:
			case VvmErrorCode.INCOMPLETE_XML_REQUEST:
			case VvmErrorCode.INVALID_VM_LOCATION:
				errorString.title = $L("Voicemail Activities Received");
				errorString.message = $L("Cannot Update Mailbox. Try again later.");
				break;
			case VvmErrorCode.NO_DATA_CONNECTION:
				errorString.title = $L("No Internet Connection");
				errorString.message = $L("Enable networking to receive voicemail messages.");
				break;
			case VvmErrorCode.PROVISION_IN_PROGRESS:
				errorString.title = $L("Provision is in progress");
				errorString.message = $L("Please try again later.");
				break;
			case VvmErrorCode.ALMOST_MAX_MESSAGES:
				errorString.title = $L("Voicemail Inbox is 90% Full");
				errorString.message = $L("Your inbox is 90% Full. Please delete or save your voicemail messages. You cannot receive new voicemail messages when your inbox is full.");
				break;
			case VvmErrorCode.MAX_MESSAGES:
				errorString.title = $L("Voicemail Inbox is Full");
				errorString.message = $L("You cannot receive new voicemail messages when your inbox is full.");
				break;
			case VvmErrorCode.ALMOST_MAX_STORAGE:
				errorString.title = $L("Voicemail Inbox is almost Full");
				errorString.message = $L("Your inbox is almost Full. You cannot receive new voicemail messages when your device is full.");
				break;
			case VvmErrorCode.SAVE_FAILED:
				errorString.title = $L("Saving a voicemail was failed");
				errorString.message = $L("Please try again.");
				break;
			case VvmErrorCode.MAX_STORAGE:
				errorString.title = $L("Storage on the server is Full");
				errorString.message = $L("Please delete old voicemail messages.");
				break;
			case VvmErrorCode.OUT_OF_SPACE:
				errorString.title = $L("Device is Full");
				errorString.message = $L("You cannot receive new voicemail messages until you create more space on your device.");
				break;
			case VvmErrorCode.NO_ERROR:
			case VvmErrorCode.OUT_OF_MEMORY:
			case VvmErrorCode.MESSAGE_CORRUPT:
			case VvmErrorCode.UNKNOWN_ERROR:
			case VvmErrorCode.COULD_NOT_DOWNLOAD_MESSAGE:
			case VvmErrorCode.NO_MAILBOX_ON_DEVICE:
			case VvmErrorCode.ALREADY_PROVISIONED:
			case VvmErrorCode.NO_SUCH_MESSAGE:
			default:
				return null;
		}

		return errorString;
	},
	
	onVoicemailError: function(inSender, payload) {
		if (!this.started) { return; }
		
		var mailboxes = payload.results || [];

		mailboxes.forEach(function(mailbox) {
			if (mailbox.service == "sfr" || mailbox.service == "verizon") {
				if ((mailbox.error !== VvmErrorCode.NO_ERROR) && (this.oldErrorCode !== mailbox.error)) {
					enyo.log("phoneapp>> vvm error code = " + mailbox.error);
					this.popupVoicemailErrorPrompt(this.getVvmErrorString(mailbox.error));
					// if (mailbox.err != 0) {
					// 	this.$.callsDBAssistant.clearVvmErrorCode(mailbox._id);
					// }
				}
				this.oldErrorCode = mailbox.error;
			}
		}.bind(this));
	},
	
	popupVoicemailErrorPrompt: function(errorString) {
		if (errorString == null) {
			return;
		}
		this.$.voicemailErrorPrompt.setTitle(errorString.title);
		this.$.voicemailErrorPrompt.setMessage(errorString.message);
		this.$.voicemailErrorPrompt.open();
	}
});

enyo.kind({
	name: "VoicemailErrorPrompt",
	kind: enyo.Dialog,
	scrim: true,
	published: {
		title: "",
		message: "",
		messageDetails: "",
		acceptButtonCaption: $L("OK"),
		cancelButtonCaption: $L("Cancel")
	},
	action: null,
	events: {
		onAccept: $L(""),
		onCancel: $L("")
	},
	//* @protected
	components: [
		{name: "client", className: "enyo-dialog-inner", components: [
			{name: "title", className: "enyo-dialog-prompt-title"},
			{kind: enyo.VFlexBox, className: "enyo-dialog-prompt-content", components: [
				{kind: enyo.HFlexBox, className: "draweritem-displayContent", components: [
					{name: "carrierIcon", style:"", kind: enyo.Image, src: "./images/list-avatar-default.jpg"},
					{name: "message", className: "enyo-dialog-prompt-message"}
				]},
				{name: "messageDetails", className: "enyo-dialog-prompt-message"}
			]},
			{name: "acceptButton", kind: "Button", onclick: "acceptClick"},
			{name: "cancelButton", kind: "Button", onclick: "cancelClick"}
		]}
	],
	create: function() {
		this.inherited(arguments);
		this.titleChanged();
		this.messageChanged();
		this.acceptButtonCaptionChanged();
		this.cancelButtonCaptionChanged();
	},
	//* @public
	open: function(inTitle, inMessage, inMessageDetails, inAcceptButtonCaption, inCancelButtonCaption) {
		if (inTitle) {
			this.setTitle(inTitle);
		}
		if (inMessage) {
			this.setMessage(inMessage);
		}
		if (inMessageDetails) {
			this.setMessage(inMessageDetails);
		}
		if (inAcceptButtonCaption) {
			this.setAcceptButtonCaption(inAcceptButtonCaption);
		}
		if (inCancelButtonCaption !== undefined) {
			this.setCancelButtonCaption(inCancelButtonCaption);
		}
		this.inherited(arguments);
	},
	//* @protected
	titleChanged: function() {
		this.$.title.setContent(this.title);
		this.$.title.setShowing(this.title);
	},
	messageChanged: function() {
		this.$.message.setContent(this.message);
	},
	messageDetailsChanged: function() {
		this.$.messageDetails.setContent(this.messageDetails);
	},
	acceptButtonCaptionChanged: function() {
		this.$.acceptButton.setCaption(this.acceptButtonCaption);
	},
	cancelButtonCaptionChanged: function() {
		this.$.cancelButton.setCaption(this.cancelButtonCaption);
		this.$.cancelButton.setShowing(this.cancelButtonCaption);
	},
	acceptClick: function() {
		this.doAccept(this.action);
		this.close();
	},
	cancelClick: function() {
		this.doCancel();
		this.close();
	}
});
