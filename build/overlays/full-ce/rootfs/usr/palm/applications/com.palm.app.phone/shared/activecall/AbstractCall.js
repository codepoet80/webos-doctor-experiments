enyo.kind({
	name: "AbstractCall",
	kind: "VFlexBox",
	published: {
		line: "",
		buttons: "",
		clientFlex: "",
		clientLayoutKind: ""
	},
	chrome: [
		{name: "header", kind: "GlassCallHeader", onChangeToVideoCall:"changeToVideoCall", onAddContact:"addContact"},
		{name: "glass", kind: "VFlexBox", flex: 1, pack: "end", align: "stretch", className: "single-call-glass", components: [
			{name:"client"}
		]},
		{name:"callButtons"},

		{name:"addToContactsService", kind:"PalmService", service: enyo.palmServices.application, method: "open", },
		{name:"changeMedia", kind:"PalmService", method: "changeMedia", onSuccess: "changeMediaSuccess", onFailure: "changeMediaFailure"}
	],
	create: function() {
		this.inherited(arguments);
				
		this.$.header.$.changeToVideoButton.setDisabled(false);
		this.capabilities = enyo.application.CallSynergizer.transports[this.line.calls[0].transport];		
		this.clientFlexChanged();
		this.clientLayoutKindChanged();
		this.setButtons(AbstractCallButtons.getButtons(this.line, this.activeLines));
	},
	destroy: function() {
		this.capabilities = null;		
		this.inherited(arguments);
	},
	clientFlexChanged: function() {
		this.$.client.flex = this.clientFlex;
	},
	clientLayoutKindChanged: function() {
		this.$.client.setLayoutKind(this.clientLayoutKind);
	},
	buttonsChanged: function() {
		if ( this.buttons ) {
			this.$.callButtons.createContainedComponents(this.buttons);
			this.$.callButtons.render();
		}
	},
	// button actions
	// There seem to be timing issues with starting video.  Placing 5 seconds
	// between the two calls
	changeToVideoCall: function() {
		enyo.log("Enabling outgoing and incoming video");
                enyo.application.Cache.userOverrideToVideo = false;
		this.$.header.$.changeToVideoButton.setDisabled(true);
		var id = this.line.calls[0].id;
		var address = this.line.calls[0].address;
		var transport = this.line.calls[0].transport;
		var service = enyo.application.CallSynergizer.transports[transport].implementation;
		var params = {
			id: id,
			incomingVideo:true,
			outgoingVideo:true
		};
		this.$.changeMedia.call(params,{
			service: service
		});
		enyo.application.Cache.authorizedForVideo[address] = true;
		enyo.application.closePhoneAppPopup("videoRequestPopup");
	},
	changeMediaSuccess: function(inSender, payload) {
		enyo.log("Video enabled successfully");
	},
	changeMediaFailure: function(inSender, payload) {
		enyo.log("Video failed");
	},
	merge: function() {
		var mergeDetails = AbstractCall.mergeLines(this.line, this.activeLines);
		enyo.application.CallSynergizer.callMerge(mergeDetails.ids, mergeDetails.to, this.line.calls[0].transport);
	},
	swap: function() {
		enyo.application.CallSynergizer.callSwap((this.line.conferenceId || this.line.calls[0].id), this.line.calls[0].transport);
	},
	disconnect: function() {
		enyo.log("hangup button tapped"); // temp logging for CFISH-6235
		enyo.application.CallSynergizer.callDisconnect((this.line.conferenceId || this.line.calls[0].id), this.line.calls[0].transport);
	},
	addContact: function() {
		var address = this.line.calls[0].address;
		if (address == undefined || address.length == 0) {
			enyo.error("unable to add contact with phone number " + address);
		}
		else {
			this.$.addToContactsService.call({
				"id": "com.palm.app.contacts",
				"params": {
					"contact": {
						"phoneNumbers": [{
							"value": address
						}]
					},
					"launchType": "pseudo-card"
				}
			});
		}
	}
});

// logic separated for unit testing
AbstractCall.mergeLines = function(line, allLines) {
	// this is a bit hacky and designed for skype at the moment
	// basically we use the following logic: 
	// 1) the 'to' (destination) of the merge is always this line. Use the conferenceId if it exists,
	//		else use the id of the only call
	// 2) the 'ids' (lines to merge) is the conferenceId or first call id of the other line. AbstractCallButtons
	//		enforces that there will only be one line and it will be of the same transport.	
	var indexOfOtherLine = allLines.indexOf(line) === 0 ? 1 : 0;
	var source = allLines[indexOfOtherLine].conferenceId || allLines[indexOfOtherLine].calls[0].id;
	var destination = line.conferenceId || line.calls[0].id;
	
	return {
		ids: [source],
		to: destination
	};
};
