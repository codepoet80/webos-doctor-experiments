enyo.kind({
	name: "EmailSelectionPrompt",
	kind: enyo.Dialog,
	scrim: true,
	events: {
		onAccept: "",
		onCancel: "",
	},
	chrome: [
		{name: "animator", kind: enyo.Animator, onAnimate: "animate", onEnd: "finishAnimate"},
		{name: "title", className: "enyo-dialog-prompt-title", content: $L("Select an email to reply")},
		{kind: "HFlexBox", components: [
			{className: "enyo-picker-label", content: $L("emails")},
			{name: "emailPicker", kind: "Picker", style: "text-transform: none", textAlign: "left"},
		]},
		{kind: "Button", caption: $L("OK"), onclick: "selectOK"},
		{kind: "Button", caption: $L("Cancel"), onclick: "selectCancel"}
	],
	
	setEmails: function(emails) {
		if (emails.length > 0) {
			var items = [];
			// show max 5 email accounts
			for (var email = 0; email < emails.length && email < 5; email++) {
				items.push(emails[email].value);
			};
			this.$.emailPicker.setItems(items);
			this.$.emailPicker.setValue(emails[0].value);
		}	
	},
	
	selectOK: function() {
		var selectedEmail = this.$.emailPicker.getValue();
		
		this.close();

		this.doAccept(selectedEmail);
	},

	selectCancel: function() {
		this.close();
		
		this.doCancel();
	},
});

