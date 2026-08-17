enyo.kind({
	name: "CustomDialogPrompt",
	kind: "ModalDialog",
	scrim: true,
	lazy: false,
	published: {
		title: "",
		message: "",
		acceptButtonCaption: $L("OK"),
		cancelButtonCaption: $L("Cancel")
	},
	events: {
		onAccept: "",
		onCancel: ""
	},
	//* @protected
	components: [
		{components: [
			{name: "title"},
			{className: "", components: [
				{name: "message", className: "enyo-header-dark", style: "text-align: center"},
				{name: "acceptButton", kind: "Button", className:"enyo-button-affirmative", onclick: "acceptClick"},
				{name: "cancelButton", kind: "Button", onclick: "cancelClick"}
			]}
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
	open: function(inTitle, inMessage, inAcceptButtonCaption, inCancelButtonCaption) {
		if (inTitle) {
			this.setTitle(inTitle);
		}
		if (inMessage) {
			this.setMessage(inMessage);
		}
		if (inAcceptButtonCaption) {
			this.setAcceptButtonCaption(inAcceptButtonCaption);
		}
		if (inCancelButtonCaption != undefined) {
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

                if (enyo.application.isTablet == true) {
                    if ((enyo.application.Cache.hasVoipAcct) && (!enyo.application.Cache.hasPairedPhone)) {
		        this.$.message.setContent($L("Skype Voicemail is not currently supported. Connect a phone to access your voicemails."));
                    } else if ((!enyo.application.Cache.hasVoipAcct) && (enyo.application.Cache.hasPairedPhone)) {
		        this.$.message.setContent($L("Unable to find voicemail number"));
                    } else {
		        this.$.message.setContent($L("Unable to find voicemail number"));
                    } 
                }
                else {
		    this.$.message.setContent(this.message);
                }
	},
	acceptButtonCaptionChanged: function() {
		this.$.acceptButton.setCaption(this.acceptButtonCaption);
		this.$.acceptButton.setShowing(this.acceptButtonCaption);
	},
	cancelButtonCaptionChanged: function() {
		this.$.cancelButton.setCaption(this.cancelButtonCaption);
		this.$.cancelButton.setShowing(this.cancelButtonCaption);
	},        
});

enyo.kind({
	name: "NoVoicemailNumberPrompt",
	kind: "CustomDialogPrompt", 
	message: $L("Unable to find voicemail number."),
	acceptButtonCaption: "",
	cancelButtonCaption: $L("OK"),
	create: function() {
		this.inherited(arguments);
	},
	open: function(inTitle, inMessage, inAcceptButtonCaption, inCancelButtonCaption) {
		if ((enyo.application.Cache.platformType == "cdma") || (enyo.application.Cache.platformType == "none") || ((enyo.application.isTablet == true) && (enyo.application.Cache.platformType == "gsm"))) {
			this.setAcceptButtonCaption("");
		}
		else {
			this.setAcceptButtonCaption($L("Set Voicemail Number"));
		}

		this.inherited(arguments);
	},
	acceptClick: function() {
		var params = {launchType: "VoicemailNumber"};
		enyo.application.UI.enter('preferences_card', params);
		this.close();
	},
	cancelClick: function() {
		this.close();
	},
});
