/*globals enyo */

enyo.kind({
	name: "NoCreditSkype",
	kind: "VFlexBox",
	pack: "justify",
	className: "popups-bg",
	IMSTATUS: {
		AVAILABLE: 0
	},
	components: [
		{layoutKind: "VFlexLayout", pack: "center", className: "notification-text-container", style: "-webkit-border-image: none; ", components: [
				{name: "titleText", content:$L("Insufficient Balance"), className: "title"},
				{name: "bodyText", content: $L("To make this call please add credit to your Skype account."),  className: "msg-text"},
                                //luna-send -n 1 luna://com.palm.applicationManager/launch '{"id":"com.palm.app.browser","params":{"url":"mail.yahoo.com"}}'
                                {name: "launchApp", kind: "Launcher", app: "com.palm.app.browser"},
		]},                                                                                                                                                                  
		{kind: "HFlexBox", width: "100%", components: [
			{kind: "Button", flex: 1,  name: "dismiss_button", className: "enyo-button-negative", label: $L("OK"), onclick: "dismiss"},
			{kind: "Button", flex: 1, name: "login_button", className: "enyo-button-affirmative", label: $L("Add Skype Credit"), onclick: "addCreditSkype"},
		]},

	],

	create: function() {
		this.inherited(arguments);
		//this.payload = enyo.windowParams.line;
	},

	addCreditSkype: function(){
            launchParams = "{\"url\": \"http://www.skype.com/intl/en/prices/skype-credit/\"}";
            this.$.launchApp.launch(launchParams);
            close();
   	},
	
	
	dismiss: function(){
		close();
	}
});
