/*globals enyo */

enyo.kind({
	name: "VideoRequest",
	kind: "VFlexBox",
	pack: "justify",
	className: "popups-bg",
	components: [

		{name: "wrapper", width: "100%", kind: "VFlexBox", className: "", components: [

			{kind: "CustomButton", name: "lockScreenContent", className: "notification-text-container enyo-vflexbox",  layoutKind: "VFlexLayout", onclick: "", pack: "center", components: [
				{layoutKind: "VFlexLayout", pack: "center", components: [
					{content:$L("Switch to video?"), className: "title"},
					{name: "message", pack: "center", className: "msg-text"},					
				]},
			]},
			{kind: enyo.HFlexBox, width: "100%", components: [
				{kind: "Button", name: "reject_button", flex: 1, label: $L("Reject"), className: "enyo-button-negative", onclick: "cancelVideo"},  
				{kind: "Button", name: "answer_button", flex: 1, label: $L("Accept"), className: "enyo-button-affirmative", onclick: "startVideo"}
			]}
		]},
		//Service calls
		{name: "changeMedia", kind:"PalmService",  service: "palm://com.palm.skype/", method: "changeMedia", onSuccess: "changeMediaSuccess", onFailure: "changeMediaFailure"},
		{name: "displayOn", kind:enyo.PalmService, service:"palm://com.palm.display/control/", method: "setState"},
		
		{kind: "ApplicationEvents", onWindowDeactivated: "windowDeactivatedHandler"},
		
	],

	create: function() {
		this.inherited(arguments);
				
		//Workaround: Changed 2nd param to "01" from "", because enyo thinks 2nd param is null and removes the attribute, and has no effect.
		this.$.lockScreenContent.setAttribute("x-palm-popup-content","01"); //informs lunasysmgr the content to show in lock screen		
		
		// turn display on
		this.$.displayOn.call({"state": "on"});
		
		this.call = enyo.windowParams.call;
		
		this.videoRequestMsg = enyo.application.Utils.interpolate($L("#{displayName} wants to start a video call."),{
			displayName: this.call.displayName
		});
		this.$.message.content = this.videoRequestMsg;
	},
	destroy: function () {
		this.$.displayOn.cancel();
		this.inherited(arguments);
	},
	windowDeactivatedHandler: function() {
		close();
	},
	
	changeMedia: function (incoming, outgoing) {
		var params = {
			id:this.call.id,
		};
		if(outgoing !== undefined) {
			params.outgoingVideo = outgoing;
		}
		if(incoming !== undefined) {
			params.incomingVideo = incoming;
		}
		this.$.changeMedia.call(params,{
			service: enyo.application.CallSynergizer.transports[this.call.transport].implementation
		});
	},
	
	startVideo: function () {
		this.changeMedia(true, true);
		this.authorizeVideo(this.call.address);
		close();
	},
	
	cancelVideo: function () {
		this.changeMedia(false, false);
		this.unauthorizeVideo(this.call.address);
		close();
	},
	
	authorizeVideo: function(address) {
		enyo.application.Cache.authorizedForVideo[address] = true;
	},
	
	unauthorizeVideo: function(address) {
		enyo.application.Cache.authorizedForVideo[address] = false;
	},
	
	dismiss: function(){
		close();
	}
});
