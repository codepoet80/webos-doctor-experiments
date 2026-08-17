enyo.kind({
	name: "voipCustomDialogPrompt",
	kind: "ModalDialog",
	scrim: true,
	lazy: false,
	published: {
		title: "",
		message: "",
		acceptButtonCaption: $L("OK"),
		audioButtonCaption:  $L("Audio"),
		cancelButtonCaption: $L("Cancel")
	},
	events: {
		onAccept: "",
		onCancel: ""
	},
	//* @protected
	components: [
                {name:"changeMedia", kind:"PalmService", method: "changeMedia", onSuccess: "changeMediaSuccess", onFailure: "changeMediaFailure"},
		{components: [
			{name: "title"},
			{className: "", components: [
				{name: "message", className: "enyo-header-dark", style: "text-align: center"},
				{name: "acceptButton", kind: "Button", className:"enyo-button-affirmative", onclick: "acceptClick"},
				{name: "audioButton", kind: "Button",  className:"enyo-button-negative", onclick: "audioClick"},
				{name: "cancelButton", kind: "Button", className:"enyo-button-light", onclick: "cancelClick"}
			]}
		]}
	],
	create: function() {
		this.inherited(arguments);
		this.titleChanged();
		this.messageChanged();
		this.acceptButtonCaptionChanged();
		this.audioButtonCaptionChanged();
		this.cancelButtonCaptionChanged();
                //this._callId = {};
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
		       this.$.message.setContent($L("The network you're using is having issues that can cause poor call performance. What would you like to do?"));

                }
                else {
		    this.$.message.setContent(this.message);
                }
	},
	acceptButtonCaptionChanged: function() {
		this.$.acceptButton.setCaption(this.acceptButtonCaption);
		this.$.acceptButton.setShowing(this.acceptButtonCaption);
	},
	audioButtonCaptionChanged: function() {
                enyo.log("**** Audio Button changed to " + !this._isAudioCall);
		this.$.audioButton.setCaption(this.audioButtonCaption);
		this.$.audioButton.setShowing(!this._isAudioCall);
	},
	cancelButtonCaptionChanged: function() {
		this.$.cancelButton.setCaption(this.cancelButtonCaption);
		this.$.cancelButton.setShowing(this.cancelButtonCaption);
	},
	audioClick: function() {
                // change media to use audio only
                enyo.log("Audio Click called - calling change media");

                this.$.changeMedia.call({
                     id: this._callId,
                     outgoingVideo: false,
                     incomingVideo: false
                 }, {
                     service: enyo.application.CallSynergizer.transports[this._transport].implementation
                 });

                enyo.log("change media called");
		this.close();
	},
	changeMediaSuccess: function() {
	        enyo.log("change media success -- trigger callback to convert to audio call");
                enyo.application.CallSynergizer.dispatchConvertToAudioCall();
	},
	changeMediaFailure: function() {
	        enyo.log("change media failure");
        }
});

enyo.kind({
	name: "PoorVoipConnectionPrompt",
	kind: "voipCustomDialogPrompt",

	message: $L("Poor connection detected. Do you want to continue?"),
	acceptButtonCaption: $L("Continue Call"),
	audioButtonCaption:  $L("Change To Audio"),
	cancelButtonCaption: $L("End Call"),
	create: function() {
		this.inherited(arguments);
                this._callId = {};
                this._transport = undefined;
                this._isAudioCall = false;
	},
	destroy: function() {
		this._callId = null;
                this._transport = null;
                this._isAudioCall = null;
		this.inherited(arguments);
	},
	open: function(inTitle, inMessage, inAcceptButtonCaption, inCancelButtonCaption) {
		this.inherited(arguments);
	},
	acceptClick: function() {
                enyo.log("debug-remove: Accept Click called CALLER ID IS " + this._callId);
		this.close();
	},
	cancelClick: function() {
                enyo.log("debug-remove: Cancel Click called CALLER ID for Ending IS " + this._callId);
                //enyo.application.CallSynergizer.geniusDisconnect();
                enyo.application.CallSynergizer.callDisconnect(this._callId, this._transport);
		this.close();
	},
        setCallId: function(callId) {
                this._callId  = callId;
                enyo.log("debug-remove: setCallId: CALLER ID IS " + this._callId);
        },
        // which transport (whatsapp/telegram/signal/teams/...) this call quality prompt is for - needed
        // to target changeMedia/disconnect at the right per-transport service instead of the old
        // hard-coded "com.palm.skype" (which doesn't exist as a transport anymore)
        setTransport: function(transport) {
                this._transport = transport;
        },
        setMediaType: function(isAudioCall) {
                this._isAudioCall = isAudioCall;
                enyo.log("debug-remove: AUDIO CALL IS " + this._isAudioCall);
		this.audioButtonCaptionChanged();
        }
});

