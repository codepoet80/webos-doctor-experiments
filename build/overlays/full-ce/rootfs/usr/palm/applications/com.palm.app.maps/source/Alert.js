enyo.kind({
	name: "Alert",
	kind: "ModalDialog",
	published: {
		message: ""
	},
	components: [
		{name: "message", className: "enyo-item-secondary", style: "text-align: center;"},
		{kind: "VFlexBox", flex: 1, components: [
			{kind: "Button", label: $L("OK"),onclick: "close", className: "enyo-button-light", style: " margin-top: 10px;"}
		]}
	],
                    
	componentsReady: function() {
		this.inherited(arguments);
		this.messageChanged();
	},
	messageChanged: function() {
		if (!this.lazy) {
			this.$.message.setContent(this.message);
		}
	},
	showMessage: function(inMessage) {
		this.setMessage(inMessage);
		this.openAtCenter();
	}
});
