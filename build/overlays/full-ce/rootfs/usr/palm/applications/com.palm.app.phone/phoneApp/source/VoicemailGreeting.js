enyo.kind({
	name: "VoicemailGreeting",
	kind: enyo.VFlexBox,
	components: [
		{name: "viewPane", kind:"Pane", flex: 1, transitionKind:enyo.transitions.Simple, components: [ 
			{name: "vmFrontpage", kind: enyo.VFlexBox, components: [
				{kind: "PageHeader", components: [
					{name: "vmTitleIcon", kind: enyo.Image, src: "../images/voicemail-icon.png" },
					{content: $L("Voicemail Greeting"), style: "margin-left: 10px;" }
				]},
				{name: "vmLabel", flex: 1, content: $L("You are currently using a default greeting."), className: "vmg-text"},
				{name: "vmAudioControl", flex: 1, kind: "AudioPlayer.DrawerItem", style: "margin: 10px"},
				{className: "footer-div"},
				{name: "recordgreeting", content: $L("Record New Greeting"), kind: enyo.Button, className: "footer-button-container", onclick: "onPlayRerecord" }
			]},
			{name: "vmRecorder", kind: "VoicemailGreetingRecorder", onSuccess: "onRecordOK"},
			{name: "vmPlayback", kind: "VoicemailGreetingPlayback", onConfirm: "onPlayConfirm", onRerecord: "onPlayRerecord", onKeepCurrent: "onPlayKeepCurrent"},
		]},
		{name: "palmService", kind: enyo.PalmService},
		{name: "smartMerge", kind: "DBModels.SmartMerge"},
	],

	greetingPath: null,
	create: function() {
		this.inherited(arguments);

		this.greetingPath = enyo.application.VoicemailService.getGreetingPath();
		
		this.goFrontpage();
	},
	
	handleLaunch: function(params) {
		enyo.log("handleLaunch(): params = " + params);
		if ( params.cleanup ) {
			this.deactivating();
		}
		else
		{
			if ('vmFrontpage' == params) {
				this.goFrontpage();
			}
			else if ('vmRecorder' == params) {
				this.goRecorder();
			}
			else if ('vmPlayback' == params) {
				this.goPlayer();
			}
		}
	},
	
	goBack: function() {
		var curView = this.$.viewPane.view;
		var lastView = this.$.viewPane.lastView;
		enyo.log("goBack(): curView.name = " + (curView) ? curView.name: "null" + ", lastView.name = " + (lastView) ? lastView.name:"null");
		if (curView && (curView.name == "vmFrontpage")) {
			this.$.vmAudioControl.cleanup();
			enyo.application.UI.enter("voicemail");
		}
		else {
			if (curView && (curView.name == 'vmRecorder')) {
				this.$.vmRecorder.cleanup();
				this.goFrontpage();
			}
			else if (curView && (curView.name == 'vmPlayback')) {
				this.$.vmPlayback.cleanup();
				this.goRecorder();
			}
//			this.$.viewPane.back();
		}
	},
	
	goFrontpage: function() {
		if (this.greetingPath) {
			this.$.vmLabel.hide();
			this.$.vmAudioControl.show();
			this.$.vmAudioControl.audioPath = this.greetingPath;
		}
		else {
			this.$.vmLabel.show();
			this.$.vmAudioControl.hide();
		}
		this.$.vmLabel.render();
		this.$.vmAudioControl.render();
		this.$.viewPane.selectView(this.$.vmFrontpage);
	},
	
	goRecorder: function() {
		var filePath = "/media/internal/.voicemessages/sfr/greetings/greeting_" + Date.now() + ".wav";
		this.$.vmRecorder.filePath = filePath;
		this.$.vmRecorder.maxDuration = 3 * 60 /*3 minutes*/;
		this.$.vmRecorder.initialize();
		this.$.viewPane.selectView(this.$.vmRecorder);
	},
	
	goPlayback: function() {
		this.$.viewPane.selectView(this.$.vmPlayback);
	},
	
	onRecordOK: function(inSrc, filePath, elapsedTime) {
		enyo.log("filePath = " + filePath + ", elapsedTime = " + elapsedTime);
		
		this.$.vmPlayback.setFilePath(filePath);
		this.$.vmPlayback.elapsedTime = elapsedTime;
		this.$.viewPane.selectView(this.$.vmPlayback);
	},
	
	onPlayConfirm: function() {
		enyo.log("onGreetingConfirm");

		// don't set the same recording
		if ( this.greetingPath != this.$.vmRecorder.filePath ) {
			this.saveRecording(this.$.vmRecorder.filePath);
			
			this.$.vmAudioControl.audioPath = this.$.vmRecorder.filePath;
		}

		this.$.vmLabel.hide();
		this.$.vmAudioControl.show();
		this.$.viewPane.selectView(this.$.vmFrontpage);
	},

	saveRecording: function(greetingPathOrNull) {
		var service = enyo.application.VoicemailService.getMailboxServiceName();
		if (service == "sfr" /* this may not be right */ ) {
			enyo.application.VoicemailService.setGreeting(greetingPathOrNull);
			this.onSaveRecordingOK(greetingPathOrNull);
		}
		else {
			enyo.log("Unsupported service: " + service);
		}
	},
	
	onSaveRecordingOK: function(newGreetingPath) {
		if ( this.greetingPath ) {
			this.deleteFile(this.greetingPath);
			this.greetingPath = newGreetingPath;
		}
		else {
			this.greetingPath = newGreetingPath;
			this.saveFile(this.greetingPath);
		}
	},

	onSaveRecordingError: function() {
		enyo.error($L("Failed to save voicemail greeting"));
	},
	
	deleteFile: function(filePath) {
		enyo.log("Delete greeting path = " + filePath);
		this.$.palmService.call({}, {
			service: "palm://com.palm.deletemanager/",
			method: "deleteFile",
			params: { path: filePath },
			onSuccess: "onDeleteFileOK",
			onFailure: "onDeleteFileError",
		});
	},
	
	saveFile: function(filePath) {
		var propsCallback = function(mailbox) {
			mailbox.greetingPath = filePath;
			return mailbox;
		}.bind(this);

		var callback = enyo.hitch(this, function() {
			enyo.log("smartMerge completed.");
		});

		enyo.log("Save greeting path = " + filePath);
		var mailboxId = enyo.application.VoicemailService.getMailboxId();
		this.$.smartMerge.execute(DBModels.Voicemail.mailBoxDbKindId, mailboxId, propsCallback, callback);
	},
	
	onDeleteFileOK: function() {
		this.saveFile(this.greetingPath);
	},
	
	onDeleteFileError: function() {
		enyo.error("File deletion is failed.");

		this.saveFile(this.greetingPath);
	},
	
	onPlayRerecord: function() {
		this.$.vmAudioControl.cleanup();
		this.goRecorder();
	},
	
	onPlayKeepCurrent: function() {
		if (this.greetingPath) {
			this.$.vmLabel.hide();
			this.$.vmAudioControl.show();
		}
		else {
			this.$.vmLabel.show();
			this.$.vmAudioControl.hide();
		}
		this.$.viewPane.selectView(this.$.vmFrontpage);
	},
	
	deactivating: function() {
		this.$.vmAudioControl.cleanup();
		this.$.vmRecorder.cleanup();
		this.$.vmPlayback.cleanup();
	},
});
