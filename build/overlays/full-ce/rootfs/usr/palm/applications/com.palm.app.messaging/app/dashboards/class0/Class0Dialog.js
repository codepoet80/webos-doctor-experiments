/**
 * A temporary dialog for Class0 notification.  Once the framework has an Alert
 * widget, we should use that instead of this dialog box.
 */
enyo.kind({
	name: "Class0Dialog",
	kind: enyo.VFlexBox,
	className: "class0",
	showing: true,
	published: {
		/** Array of layer objects specifying contents of alert.*/
		layers: null
	},
	components: 
	[		
		{kind: enyo.HFlexBox, components: [
			{kind: "Image", src:"../../../images/notification-large-messaging.png", className:"notification-icon"},
			{kind: enyo.VFlexBox, className:"notification-text-box", components: [
				{name: "title", className: "notification-subject"},
				{name: "text", className: "notification-body-multi"}
			]}
		]},
		{kind: enyo.HFlexBox, components: [	
			{
				kind:"NotificationButton", name: "dismissBtn", content: $L("Dismiss"),	className: "enyo-notification-button-affirmative button-left", flex:1, onclick: "dismissClicked"
			},
			{
				kind:"NotificationButton", name: "keepBtn", content: $L("Keep"), className: "enyo-notification-button-alternate button-right", flex:1, onclick: "keepClicked"
			}
		]},
		{kind: "ApplicationEvents", onWindowParamsChange: "windowParamsChangeHandler"}
	],
	create: function() {
		this.inherited(arguments);
		this.layers = [];
	},
	dismissClicked: function() {
		this.layers.pop();
		this.updateWindow();
	},
	keepClicked: function() {
		var topLayer = this.layers.pop();
		
		this.updateWindow();
		enyo.application.class0AlertManager.addClass0Message(topLayer.message);
	},
	addLayer: function(layer) {
		this.layers.push(layer);
		this.updateWindow();
	},
	updateWindow: function() {
		if (!this.layers || !this.layers.length) {
			enyo.application.class0AlertManager.closeDialog();
		} else {
			var len = this.layers.length;
			var top = this.layers[len - 1];
			this.$.title.setContent(top.title);
			this.$.text.setContent(top.text);
		}
	},
	windowParamsChangeHandler: function(inSender, event) {		
		var layer = event.params;		
		
		enyo.log("*&*&*&*&* Class0Dialog.windowParamsChangeHandler, window reactivated: ", layer);
		this.addLayer(layer);
		
		return true;
	}
});
