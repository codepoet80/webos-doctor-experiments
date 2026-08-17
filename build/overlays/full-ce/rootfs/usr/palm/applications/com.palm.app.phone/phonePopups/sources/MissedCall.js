/*globals enyo */

enyo.kind({
	name: "MissedCall",
	kind: "VFlexBox",
	pack: "justify",
	className: "missed-call",
	wideWidth: 320,
	statics: {
		kTimeoutMs: 60000
	},
	components: [
		{kind: "CustomButton", name: "lockScreenContent", layoutKind: "VFlexLayout", pack: "center", className: "notification-box", onclick: "openContact", components: [
			{kind: "HFlexBox", pack: "start", components: [
				{kind: "Image", name: "missedCallFrame", style: "margin: 10px;", className: "missed-call-frame"},   
				{kind: "VFlexBox", align: "start", style: "margin: 10px;", components: [
					{name: "missed_message", className: "title truncating-text"},
					{name: "Label1", className: "missed-display-number truncating-text"},
					{kind: "HFlexBox", components: [
						{name: "Label2", className: "missed-display-number truncating-text"},
						{name: "Label2Type", className: "missed-number-type"},
					]},
				]},

			]}
		]},
		{name:"missedbuttonsV", kind: "VFlexBox", components: [
			{kind: "Button", name: "redial_button1", pack: "center", className: "enyo-button-affirmative", label: $L("Call back"), onclick: "redial", flex: 0},
			{kind: "Button", pack: "center", className: "enyo-button-negative notification-button", label: $L("Dismiss"), onclick: "dismiss", flex: 0},
		]},

		//Service calls
		{name: "displayStatusSubscribe", kind: enyo.PalmService, service:"palm://com.palm.display/control/", method: "status", subscribe: true, onSuccess: "onDisplayEvent", onFailure: "onDisplayEvent"},
		
		{kind: "ApplicationEvents", onWindowDeactivated: "windowDeactivatedHandler"},
	],

	create: function() {
		this.inherited(arguments);
		enyo.log("Missed call notification");

		//Workaround: Changed 2nd param to "01" from "", because enyo thinks 2nd param is null and removes the attribute, and has no effect.
		this.$.lockScreenContent.setAttribute("x-palm-popup-content","01"); //informs lunasysmgr the content to show in lock screen
	
		enyo.require(enyo.windowParams.line, "Missed call notification - params missing");

		this.MissedLine = enyo.windowParams.line;
		//enyo.log(enyo.json.stringify(this.MissedLine));

		var call = this.MissedLine.calls[0];
		//call.contact.decorated(function(line) {
			this.contactname = call.contact.name || call.contact.displayName || call.contact.addressFormatted || call.contact.address || $L("Unknown");
			if (call.contact.personId) {
				//missed from known contact
				this.$.Label1.setContent(call.contact.name || call.contact.displayName || $L("Unknown"));
				this.$.Label2.setContent(call.contact.addressFormatted || call.contact.address || "");
				this.$.Label2Type.setContent(call.contact.labelFormatted || "")
				
				if (call.contact.picture.src != undefined) {
					//this.picLoc = "url(" + call.contact.picture.src + ")";
					//this.$.missedCallFrame.applyStyle("background-image", this.picLoc);
					
	    				this.$.missedCallFrame.addClass("missed-call-frame-without-bg");
	    				this.$.missedCallFrame.removeClass("missed-call-frame");
	    				
					this.$.missedCallFrame.setSrc(call.contact.picture.src);
	    			}
			} else {
				//missed from unknown contact
				this.$.Label1.setContent(call.contact.addressFormatted || call.contact.address || "");
				this.$.Label2.setContent(call.contact.locationFormatted || "");
			}
		//});
		
		this.missedPopupMsg = enyo.application.Utils.interpolate((call.video == true) ? $L("Missed Video Call at #{date}") : $L("Missed Call at #{date}"),{ 
			date: enyo.application.Utils.formatShortTime(new Date(this.MissedLine.timestamp)) 
		}); 

		this.$.missed_message.content = this.missedPopupMsg;

		this.acked = false; // this alert has been acknowledged

		if ( !call.contact.canBeCalled() ) {
			this.$.redial_button1.hide();
		}
		
		//note down the time to dismiss this popup on display change event
		this.timeStamp = Date.now();

		// stay up for 1 minute
		this.missedTimeout = window.setTimeout(enyo.hitch(this, "closeWindow"), MissedCall.kTimeoutMs);

		//register for display on/off events		
		this.$.displayStatusSubscribe.call({});			
		
		if (window.PalmSystem && this.throbber == undefined) {
			this.throbber = window.PalmSystem.addNewContentIndicator();
		}
	},

	openContact: function() {
        	this.MissedLine.calls[0].contact.launchInContactsApp();

		//close missed call popup.
		this.acked = true;
		close();
	},

	destroy: function () {
		enyo.log( "destroy missed popup");
		
		if (window.PalmSystem && this.throbber) {
			window.PalmSystem.removeNewContentIndicator(this.throbber);
			this.throbber = undefined;
		}

		if (this.acked === false) {
			enyo.application.CallSynergizer.showMissedDash(this.MissedLine);
		}

		window.clearTimeout(this.missedTimeout);
		this.missedTimeout = undefined;

		this.$.displayStatusSubscribe.cancel();

		this.inherited(arguments);
	},

	windowDeactivatedHandler: function() {
		close();
	},

	redial: function(){
		enyo.log( "onRedial");
		var call = this.MissedLine.calls[0];
		enyo.application.CallSynergizer.dial(call.contact.address, call.isVideo ? true : undefined, undefined, call.transport);
		this.acked = true;
		close();
   	},

	dismiss: function() {
		this.acked = true;
		close();
	},
	
	closeWindow: function () {
		close();
	},
	// if the time is more than the timeout length when the screen goes on
	// minimize this to a dashboard so other notifications are visible
	onDisplayEvent: function(inSender, payload) {
		if (payload.event == 'displayOn') {
			if ( (Date.now() - this.timeStamp) > MissedCall.kTimeoutMs) {
				close();
			}
		}	
	}
});
