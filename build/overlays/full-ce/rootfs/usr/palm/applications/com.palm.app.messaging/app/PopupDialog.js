enyo.kind({
	name: "PopupDialog",
	kind: "ModalDialog",
	height: "190px",
	events: {
		onAccept: ""
	},
	components: [
		{kind: "ApplicationEvents", onWindowHidden: "close"},
		{layoutKind: "VFlexLayout", components:[
			{name: "message", content: "", className:"enyo-paragraph"},
			{name: "buttonOrientation", layoutKind: "HFlexLayout", components: [
				{name: "cancelButton", kind: "Button", flex:1, caption: $L("Cancel"), onclick: "close"},
				{name: "acceptButton", kind: "Button", flex:1, caption: $L("OK"), className:"enyo-button-negative", onclick: "acceptButtonClick"}
			]}
		]}
	],
	setTitle: function(title) {
	    if (title !== undefined) {
	        this.setCaption(title);
        }
	},	
	setMessage: function(message) {
	    if (message !== undefined) {
	        this.$.message.setContent(message);
        } 
	},	
	setAcceptButtonCaption: function(caption) {
	    if (caption !== undefined) {
	        this.$.acceptButton.setCaption(caption);
        }
	},		
	setCancelButtonCaption: function(caption) {
    	if (caption !== undefined) {
    	    this.$.cancelButton.setCaption(caption);
        }
    },    
    hideAcceptButton: function() {
        this.$.acceptButton.hide();
    },
    // The dialog is a shared singleton, so a prior hideAcceptButton() (e.g. an undeliverable message)
    // would otherwise persist and swallow the "Send again" button on a later retryable failure.
    showAcceptButton: function() {
        this.$.acceptButton.show();
    },
    hideCancelButton: function() {
        this.$.cancelButton.hide();
    },
    acceptButtonClick: function() {
        this.doAccept();
        this.close();
    }
});