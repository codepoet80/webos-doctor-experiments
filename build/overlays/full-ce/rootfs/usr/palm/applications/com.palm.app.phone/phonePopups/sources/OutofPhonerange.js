/*globals enyo */

enyo.kind({
	name: "OutofPhoneRange",
	kind: "VFlexBox",
	pack: "start",
	className: "popups-bg",
	components: [
		{layoutKind: "VFlexLayout", name: "lockScreenContent", pack: "center", className: "notification-text-container", components: [
					{content:$L("Phone Out of Range"), className: "title"},
					{name: "message", className: "msg-text"},					
		]},
		{kind: "Button", layoutKind: "VFlexLayout", pack: "center", className: "enyo-button-dark", label: "OK", onclick: "onOK"},	

		//Service calls
		{name: "displayOn", kind:enyo.PalmService, service:"palm://com.palm.display/control/", method: "setState"}
	],

	create: function() {
		this.inherited(arguments);
				
		//Workaround: Changed 2nd param to "01" from "", because enyo thinks 2nd param is null and removes the attribute, and has no effect.
		this.$.lockScreenContent.setAttribute("x-palm-popup-content","01"); //informs lunasysmgr the content to show in lock screen		
		
		// turn display on
		this.$.displayOn.call({"state": "on"});
		
		this.$.message.content = $L("No longer connected to phone\nbecause devices are out of range\nor not turned on. Until devices\nare connected, you cannot place\nor receive phone calls.");
	},

	onOK: function () {
		close();
	}
});
