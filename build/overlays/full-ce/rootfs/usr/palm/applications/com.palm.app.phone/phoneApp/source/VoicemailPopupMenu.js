enyo.kind({
	name: "VoicemailPopupMenu",
	kind: enyo.Control,
	showing: false,
	popupVVM: null,
	events: {
		onDeleteMenuItem: "",
		onSaveMenuItem: "",
	},
	components: [
		{name: "popup",	className: "voicemail-popup", kind: "Menu", components: [
			{name: "menuReply", caption: $L("Reply"), kind: "MenuItem", className: "", collapsed: true, components: [
				{name: "menuReplyEmail", caption: $L("via Email"), className: "", onclick: "onPopupReplyEmail", showing: false},
				{name: "menuReplyMessaging", caption: $L("via Messaging"), className: "", onclick: "onPopupReplyMessaging", showing: false},
			]},
			{name: "menuForward", caption: $L("Forward"), kind: "MenuItem", className: "", collapsed: true, components: [
				{name: "menuForwardEmail", caption: $L("via Email"), className: "", onclick: "onPopupForwardEmail"},
			]},
			{name: "menuSave", caption: $L("Save"), className: "", onclick: "onPopupSave", showing: false},
			{caption: $L("Delete"), className: "", onclick: "onPopupDelete"}
		]},
		{name: "launchApplication", kind: "PalmService", service: enyo.palmServices.application, method: "launch"},
		{name: "selectEmailPrompt", kind: "EmailSelectionPrompt", onAccept: "selectEmailOK"},
		{name: "callsDBAssistant", kind: "DBAssistant", onGotPerson: "onGotPerson"},
		{name: "deleteVoicemailPrompt", kind: "DialogPrompt", 
			title: $L("Delete Voicemail"),
			message: $L("Are you sure you want to delete voicemail message?"),
			acceptButtonCaption: $L("Delete"),
			cancelButtonCaption: $L("Cancel"),
			onAccept: "onPopupDeleteAccept",
		},
	],
	
	launch: function(vvm) {
		if (!vvm) return;
		
		// no reply/forward/save menu items for fax messages.

		this.popupVVM = vvm;
		if (this.isValidAddr() && !this.isFax()) {
			this.$.menuReplyMessaging.setShowing(this.popupVVM.from.addr);
			this.$.menuReply.setShowing(this.popupVVM.from.addr);
			this.$.menuReply.setOpen(false);
		} else {
			this.$.menuReply.setShowing(false);
		}

		// Forwarding is not allowed for private messages.
		this.$.menuForward.setShowing(!this.popupVVM.private && !this.isFax());
		this.$.menuForward.setOpen(false);

		// Save menuitem is only available only for verizon
		this.$.menuSave.setShowing(this.popupVVM.service === "verizon" && !this.isFax());

		this.$.popup.openAtCenter();

		// Async query person info
		if (this.popupVVM.from.personId && !this.isFax()) {
			this.$.callsDBAssistant.getPerson(this.popupVVM.from.personId);
		}
		else {
			this.$.menuReplyEmail.setShowing(false);
		}
	},
	
	isValidAddr: function() {
		if (this.popupVVM.from.addr && 
			!(this.popupVVM.from.addr === "blocked" || this.popupVVM.from.addr === "blocked caller" || 
			  this.popupVVM.from.addr === "unknown" || this.popupVVM.from.addr === "unknown caller")) {
			return true;
		} else {
			return false;
		}
	},
	
	isFax: function() {
		return (this.popupVVM.messagetype === "fax");
	},
	
	close: function() {
		this.$.popup.close();
	},

	onGotPerson: function(inSrc, inPerson) {
		if (inPerson) {
			this.$.menuReplyEmail.setShowing(inPerson.emails.length > 0);
			this.$.menuReply.setShowing(inPerson.emails.length > 0 || this.isValidAddr());

			this.$.selectEmailPrompt.setEmails(inPerson.emails);
		}
		// else { No person info found }
	},

	onPopupReplyEmail: function() {
		if (this.popupVVM) {
			this.$.selectEmailPrompt.open();
		}
	},
	
	selectEmailOK: function(inSrc, selectedEmail) {
		var name = ((this.popupVVM.from.name == null) ? enyo.application.Utils.FormatPhoneNumber(this.popupVVM.from.addr) : this.popupVVM.from.name);
		this.emailLaunch(selectedEmail, null, enyo.application.Utils.interpolate($L("Re: Voicemail from #{name}"), {"name": name}));
	},

	onPopupReplyMessaging: function() {
		if (this.popupVVM) {
			this.messagingLaunch(this.popupVVM.from.addr, this.popupVVM.service)

			// for forwarding message
			// this.messagingLaunch(null, popupVVM.service, null, popupVVM.audioPath, "audio/3gpp");
		}
	},

	onPopupForwardEmail: function() {
		if (this.popupVVM) {
			var name = ((this.popupVVM.from.name == null) ? enyo.application.Utils.FormatPhoneNumber(this.popupVVM.from.addr) : this.popupVVM.from.name);
			this.emailLaunch(null, this.popupVVM.audioPath, enyo.application.Utils.interpolate($L("Fw: Voicemail from #{name}"), {"name": name}));
		}
	},

	emailLaunch: function(email, attachment, summary /*optional*/) {
		var params = {};
		if ( email ) {
			params.recipients = [{
				role: "to",
				value: email,
			}];
		}
		if ( attachment ) {
			params.attachments = [{fullPath: attachment}];
		}
		if ( summary ) {
			params.summary = summary;
		}

		this.$.launchApplication.call({
			id: "com.palm.app.email",
			params: params
		});
	},
	
	messagingLaunch: function(address, service, personId /*optional*/, attachment /*optional*/, attachmentMimeType /*optional*/) {
		var composeParams = {};

		if ( personId ) {
			composeParams.personId = personId;
		}
		
		if ( attachment ) {
			composeParams.attachments = [{
				mimeType: attachmentMimeType,
				path: attachment
			}];
		}
		
		if ( service === "type_skype" ) {
			composeParams.ims = [{value: address, serviceName: "type_skype"}];
		}
		else {
			composeParams.phoneNumbers = [{value: address}];		
		}

		this.$.launchApplication.call({
			id: "com.palm.app.messaging",
			params: {
				compose: composeParams
			}
		});
	},

	onPopupSave: function(inSender, inSelected) {
		if (this.popupVVM) {
			if (this.onSaveMenuItem == "") {
				this.$.callsDBAssistant.updateVvmSaveMessage(this.popupVVM._id);
			} else {
				this.doSaveMenuItem(this.popupVVM._id);
			}
		}
		else {
			enyo.error("Invalid voicemail info to save voicemail message");
		}
	},
	
	onPopupDelete: function(inSender, inSelected) {
		if (this.popupVVM) {
			this.$.deleteVoicemailPrompt.open();
		}
	},
	
	onPopupDeleteAccept: function() {
		if (this.popupVVM) {
			if (this.onDeleteMenuItem == "") {
				this.$.callsDBAssistant.deleteVisualVoicemail(this.popupVVM._id);
				this.popupVVM = null;
			} else {
				this.doDeleteMenuItem(this.popupVVM);
			}
		}
	},
});

