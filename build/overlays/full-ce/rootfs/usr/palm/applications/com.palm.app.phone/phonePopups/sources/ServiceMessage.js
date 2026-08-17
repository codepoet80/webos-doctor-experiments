enyo.kind({
	name: "ServiceMessage",
	kind: "VFlexBox",
	pack: "justify",
	className: "popups-bg",
	components: [
		{layoutKind: "VFlexLayout", name: "lockScreenContent", pack: "center", className: "notification-box", components: [
			{layoutKind: "HFlexLayout", pack: "justify", align: "center", flex: 1, components: [
				{layoutKind: "VFlexLayout", align: "start", flex: 1, components: [
					{content: $L("Network Message"), className: "title"},
					{name: "service_message", className: "msg-text"},					
				]}
			]}
		]},
		{kind: "CustomButton", name: "cancel_button", layoutKind: "VFlexLayout", pack: "center", className: "notification-button", caption: $L("Ok"), onclick: "onCancel"},
	],

	create: function() {
		this.inherited(arguments);
		
		enyo.log("ServiceMessage popup");

		enyo.require(enyo.windowParams.message, "Params missing");
		
		//Workaround: Changed 2nd param to "01" from "", because enyo thinks 2nd param is null and removes the attribute, and has no effect.
		this.$.lockScreenContent.setAttribute("x-palm-popup-content","01"); //informs lunasysmgr the content to show in lock screen		
		
		this.updateFields(enyo.windowParams.message || $L(""));
		//this.windowName = "servicemessage";
	},

	updateFields: function(text) {
		this.$.service_message.content = text;
	},

	onCancel: function () {
		close();
	}
});


