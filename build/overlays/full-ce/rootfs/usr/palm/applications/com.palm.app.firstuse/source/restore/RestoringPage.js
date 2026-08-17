// RestoringPage.js
//
// Shows the user a progress bar indicating the state of the restore.

enyo.kind({
    name: "RestoringPage",
    kind: "VFlexBox",
	pack: "justify",
    published: {
        nduId: "",
        connected: true
    },
    events: {
        onFinish: "",
        onStartOver: ""
    },
    
    components: [
		{name: "pane", kind: "Pane", flex: 1, transitionKind: "enyo.transitions.Fade", components: [
			{kind:"VFlexBox", align: 'center', flex:1, components:[
				{name: "restore", kind: "BackupService", subscribe: true, onSuccess: "restoreSuccess", onFailure: "restoreFailure" },
						 
				{ className: "title", content: rb.$L("Making progress") },
				{ className: "subtitle box-center", content: rb.$L("We are copying your data and applications to your TouchPad. This may take a few minutes.")},
				{kind: "Control", className: "box", components: [
					{name: "progressBar", className: "restore-progress", kind: "ProgressBar"}
				]},
				
				{name: "errorPopup", kind: "ModalDialog", lazy: false,dismissWithClick:false,modal:false,
				 className: "popup",
				 caption: rb.$L("Error Restoring Data"),
				 components: [
					{className: "enyo-text-body", content: rb.$L("An error occurred while restoring your data. Please try again in a few minutes.") },
					{kind: "Control", layoutKind: "VFlexLayout", pack: "justify", components: [
					{kind: "Button", caption: rb.$L("Try Again"), flex: 1, className: "enyo-button-affirmative", onclick: "tryAgainClick", style: "padding-bottom: 10px; margin-bottom:5px;"},
					{kind: "Button", caption: rb.$L("Start Over"), flex: 1, className: "enyo-button-negative", onclick: "startOverClick", style: "padding-bottom: 10px;"}
					]}
				]}
			]}
		]}
    ],
    
    nduIdChanged: function() {
        this.log("Inside nduIdChanged, nduId=" + this.nduId);
        this.startRestore();
    },
    
    startRestore: function() {
        this.log("Inside startRestore");
        this.$.progressBar.setPositionImmediate(0);
        this.$.errorPopup.close();
        this.$.restore.call({ nduId: this.nduId });
    },
    
    restoreSuccess: function(inSender, inResponse) {
        this.log("Inside restoreSuccess, response:", inResponse);
        var status = inResponse.STATUS;
        switch (status) {
        case "InProgress":
            this.$.progressBar.setPosition(inResponse.percent);
            break;
        case "Complete":
            this.$.progressBar.setPosition(100);
            if (!inResponse.fired) {
                // make sure we only fire the event on the final 'Complete', because there's also
                // a 'Complete' event from the subscription
                this.doFinish();
            }
            break;
        case "Failed":
            if (408 === inResponse.error) {
                this.log("Restore failed due to dropped network connection");
                if (this.connected) {
                    this.log("Looks like we have a connection now, trying again...");
                    this.startRestore();
                } else {
                    this.log("Waiting for connection to come back");
                    this.failedDueToDroppedConnection = true;
                }
            } else {
                this.$.errorPopup.openAtCenter();
            }
        }
    },
    
    restoreFailure: function(inSender, inResponse) {
        this.error("Inside restoreFailure, response:", inResponse);
        this.$.errorPopup.openAtCenter();
    },
    
    tryAgainClick: function() {
        this.log("Try Again button clicked");
        this.startRestore();
    },
    
    startOverClick: function() {
        this.log("Start Over button clicked");
        this.$.errorPopup.close();
        this.doStartOver();
    },
    
    connectedChanged: function() {
        this.log("Inside connectedChanged, connected:", this.connected);
        if (this.connected && this.failedDueToDroppedConnection) {
            this.failedDueToDroppedConnection = false;
            this.startRestore();
        }
    }
    
});
