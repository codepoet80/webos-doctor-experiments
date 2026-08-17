/*globals enyo $L */

enyo.kind({
	name: "SingleCall",
	kind: "AbstractCall",

	components: [
		{name: "pauseWait", kind: "SingleConferenceCallPauseWaitButton", value: "", showing: false, onclick: "pauseWaitDial"},												
		{name:"timer", kind:"LineState"}
	],
	create: function() {
		this.inherited(arguments);
		this.$.timer.setLine(this.line);
		this.call = this.line.calls[0];
		
		// ensure that the contact is done popuating before we use it
		this.call.contact.decorated(enyo.bind(this,"updateWithCall"));
		
		//register for late updates from network
		//enyo.log("CNAP: Active call registers for late updates");
		this._updatecontact = enyo.bind(this,"updatecontacts");
		this.call.contact.addContactUpdateListener(this._updatecontact);
	},
	destroy: function() {
		//enyo.log("CNAP: Active call unregisters late updates");
		if(this.call.contact) {
			this.call.contact.removeContactUpdateListener(this._updatecontact);
		}
		this.inherited(arguments);
	},
	updateWithCall: function() {
		if ( ! this.destroyed ) { // make sure this object wasn't destroyed
			this.callChanged();
		}
	},
	updatecontacts: function() {
		//enyo.log("CNAP: Active call gets updatecontacts");
		this.updateWithCall();
	},
	disconnectCall: function() {
		enyo.application.CallSynergizer.callDisconnect(this.call.id, this.call.transport);
	},
	callChanged: function() {
		// CASE: known person: show name, number, and number label
		if ( this.call.contact.name || this.call.contact.displayName) {
			this.$.header.setTitle(this.call.contact.name || this.call.contact.displayName);
			this.$.header.setSubtitle(this.call.contact.addressFormatted);
			this.$.header.setLabel(this.call.contact.labelFormatted);
			
		// CASE: unknown person: show number and location
		} else {
			this.$.header.setTitle(this.call.contact.addressFormatted);
			this.$.header.setSubtitle(this.call.contact.locationFormatted);
		}
		
		this.$.header.setContactAddable(this.call.contact.canBeAddedToContacts());		
		this.$.header.adjustLayout();
		
		if (this.call.pauseWaitDigits && (this.line.state == enyo.application.CallSynergizer.STATES.ACTIVE
		|| this.line.state == enyo.application.CallSynergizer.STATES.HOLD )) {
			if (this.call.pauseWaitDigits.length > 1 && this.capabilities) {
				this.processPauseWaitDigits(this.call.pauseWaitDigits);
			}
		}		
	}, 
	processPauseWaitDigits: function (pauseWaitDigits) {
		//enyo.log(pauseWaitDigits);
		if (this.pwDigitsProcessed == undefined) {
			this.pwDigitsProcessed = ""; 
		}
		var len = pauseWaitDigits.length; 

		for (var i = 0; i < len; i++) {
			switch (pauseWaitDigits.charAt(i)) {
				case this.capabilities.pauseCode[0]:
					this.pwDigitsProcessed += this.capabilities.pauseCode[0]; 
					this.checkpwDigitsStatus(this.pwDigitsProcessed); 				
					pauseWaitDigits = pauseWaitDigits.substring(i + 1);
					this.pauseTimeout = setTimeout(enyo.bind(this, "processPauseWaitDigits", pauseWaitDigits), 2500);
					return;
					
				case this.capabilities.waitCode[0]:
					this.pwDigitsProcessed += this.capabilities.waitCode[0];
					this.checkpwDigitsStatus(this.pwDigitsProcessed); 				
					if (i == len - 1) 
						return;
					this.pauseWaitString = pauseWaitDigits.substring(i + 1);
					if (this.$.pauseWait) {
						this.$.pauseWait.setShowing(true);
						this.$.pauseWait.setValue(this.pauseWaitString);
					}
					return;
					
				default:
				//DTMF tone to be played
				this.sendShortDTMF(pauseWaitDigits.charAt(i));
				this.pwDigitsProcessed += pauseWaitDigits.charAt(i);
				this.checkpwDigitsStatus(this.pwDigitsProcessed); 
				this.waitButtonChanged("", false); 						
				pauseWaitDigits = pauseWaitDigits.substring(i + 1);
				this.pauseTimeout = setTimeout(enyo.bind(this, "processPauseWaitDigits", pauseWaitDigits), 600);
				return;							
			}
		}	
	},	
	
	//we don't know when we finished the processing of the pausewaitdigit information since the 
	//digit can be something like p123w456p789, see if the stored string match here to determine
	checkpwDigitsStatus: function(digits) {	
		if (digits == this.call.pauseWaitDigits) {
			this.call.pauseWaitDigits = "";
		}
	}, 
	
	waitButtonChanged: function(caption, showing) {
		if (this.$.pauseWait) {		
			this.$.pauseWait.setShowing(showing); 
			this.$.pauseWait.setValue(caption); 
		}
	}, 
	
	pauseWaitDial: function(inSender) {
		//prevent this get processed while the call in on hold
		if (this.line.state == enyo.application.CallSynergizer.STATES.ACTIVE) {
			this.$.pauseWait.setShowing(false);
			this.processPauseWaitDigits(this.pauseWaitString);
		}
	},
	
	sendShortDTMF: function(value) {
		enyo.application.CallSynergizer.callDtmf(value, false);	
	}	
});


enyo.kind({
	name: "SingleLineSingleCall",
	kind: "SingleCall",
	className: "single-call-simple enyo-fit",
	height: "auto",
	create: function() {
		this.inherited(arguments);
		// TODO: Once skype is updated, modify this to check for
		// (this.capabilities.videoFormat && this.capabilities.videoFormat !== "none")
		this.videoSupported(this.capabilities.videoFormat && this.capabilities.videoFormat !== "none");
		this.$.header.adjustLayout();
	},
	videoSupported: function(isVideoSupported) {
		this.$.header.videoSupported(isVideoSupported);
	},
	callChanged: function() {
		this.inherited(arguments);
				
		// has picture
		if ( this.call.contact.picture.src ) {
			// CASE: stamp sized
//			if ( this.isSmallImage(this.call.contact.picture.obj) ) {
				this.removeClass("single-call-fullscreen");
				this.addClass("single-call-simple");
				
				this.$.timer.destroy();
				this.createComponents([
					{flex: 1, layoutKind: "VFlexLayout", align: "center", pack: "center", className: "single-call-glass-client", components: [
						{style: "margin-top: 15px; position:relative;", components: [
							{className: "single-call-image", domStyles: {"background-image":"url(" + this.call.contact.picture.src + ")"}},
							{className: "single-call-stamp-frame"}
						]}
					]},
					{name:"timer", kind:"LineState",  className: "single-call-stamp-timer-position", line:this.line}
				]);
				this.$.timer.lineChanged();
				this.setClientFlex(1);
				this.render();
				
			// CASE: full
			// } else {
			// 			this.removeClass("single-call-simple");
			// 			this.addClass("single-call-fullscreen");
			// 			this.applyStyle("background-image", "url(" + this.call.contact.picture.src + ")");
			// 		}
			// TODO: Check videoFormat instead of serviceName
			if(this.capabilities.serviceName === "type_skype") {
				//enyo.log("Defaulting to a video call for demo");
				//this.changeToVideoCall();
			}
		}
	},
	
	isSmallImage: function(image) {
		if ( image.width > image.height ) {
			return image.height <= 140;
		} else {
			return image.width <= 170;
		}
	}
});

enyo.kind({
	name: "SingleConferenceCallPauseWaitButton",
	kind: "Control",
	className: "single-call-pausewait",
	published: {
		value: ""
	},
	create: function() {
		this.inherited(arguments);
		this.valueChanged();
	},
	valueChanged: function() {
		this.setContent(enyo.application.Utils.interpolate($L("Dial #{address}"),{address: this.value}));
	}
});

enyo.kind({
	name: "SingleConferenceCall",
	kind: "AbstractCall",
	className: "single-call-simple",
	clientFlex: 1,
	components: [
		{kind: "FadeScroller", flex: 1, className: "single-call-glass-client enyo-view", autoVertical: true, components: [
			{name: "simpleList", kind: "VirtualRepeater", onSetupRow: "getListCall", components: [
				{kind: "Item", layoutKind: "VFlexLayout", pack: "center", align: "stretch", className: "conference-call-list-item", components: [
					{kind: "HFlexBox", align: "center", pack: "center", name: "displayName", onclick: "toggleDrawer", className: "conference-call-display-name"},
					{name: "drawer", kind: "Drawer", open: false, components: [
						{kind: "HFlexBox", pack: "center", components: [
							{name:"disconnect", kind: "CustomButton", className: "conference-call-list-hangup", onclick: "hangupCall"},
							{name:"extract", kind: "CustomButton", className: "conference-call-list-extract", onclick: "extractCall"}
						]}
					]}
				]}
			]}
		]}
	],
	create: function() {
		this.inherited(arguments);
		
		this.$.header.setTitle($L("Conference Call"));
		this.$.header.adjustLayout();
		this.$.header.createContainedComponent({name:"timer", kind:"LineState"});
		this.$.timer.setLine(this.line);
		
		// hide conference participants if we can't hang up or extract them individually
		var capabilities = enyo.application.CallSynergizer.transports[this.line.calls[0].transport];
		if ( ! capabilities || (!capabilities.conferenceHangupIndividual && !capabilities.conferenceCanExtract) ) {
			this.$.simpleList.hide();
		}
	},
	toggleDrawer: function(inSender) {
		// before opening drawer, conditionally disable buttons
		var index = this.$.simpleList.fetchRowIndex();
		this.$.simpleList.prepareRow(index);
		if ( ! this.$.drawer.getOpen() ) {
			var call = this.line.calls[index];
			var capabilities = enyo.application.CallSynergizer.transports[call.transport];
			this.$.disconnect.setDisabled(!(capabilities && capabilities.conferenceHangupIndividual));
			this.$.extract.setDisabled(!(capabilities && capabilities.conferenceCanExtract));
			
			// only show drawer if at least one button is enabled
			if ( ! this.$.disconnect.getDisabled() || ! this.$.extract.getDisabled() ) {
				this.$.drawer.setOpen(true);

				// close the last open item if applicable before resetting this.lastOpen
				if (this.lastOpen != null) {
					this.$.simpleList.prepareRow(this.lastOpen);
					this.$.drawer.setOpen(false);
				}
				
				// remember this item as the last open item
				this.lastOpen = index;
			}
		} else {
			this.$.drawer.setOpen(false);
			this.lastOpen = null;
		}
		return true;
	},
	hangupCall: function(inSender) {
		var call = this.line.calls[ this.$.simpleList.fetchRowIndex() ];
		enyo.application.CallSynergizer.callDisconnect(call.id, call.transport);
		return true; // prevent click from bubbling to list item
	},
	extractCall: function(inSender) {
		enyo.require(this.line.conferenceId, "to extract from a conference call the line must have conferenceId");
		var call = this.line.calls[ this.$.simpleList.fetchRowIndex() ];
		enyo.application.CallSynergizer.callExtract(call.id, call.transport);
		return true; // prevent click from bubbling to list item
	},
	getListCall: function(inSender, inIndex) {		
		var call = this.line.calls[inIndex];
		if (call) {
			this.$.displayName.setContent(call.contact.name || call.contact.addressFormatted);

			if (inIndex === 0) {
				this.$.item.removeClass("enyo-last");
				this.$.item.addClass("enyo-first");
			} else if (inIndex === (this.line.calls.length - 1)) {
				this.$.item.addClass("enyo-last");
				this.$.item.removeClass("enyo-first");
			} else {
				this.$.item.removeClass("enyo-first");
				this.$.item.removeClass("enyo-last");
			}
			return true;
		}
	},
	disconnectCall: function() {
		enyo.require(this.line.conferenceId, "to disconnect a conference call the line must have conferenceId");
		enyo.application.CallSynergizer.callDisconnect(this.line.conferenceId, this.line.calls[0].transport);
	}
});
