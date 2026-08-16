enyo.kind({
    name: "findApps.ResetEmailSentPrompt",
    kind: enyo.Control,
    events: {
        onSubmit: "",
    },
    components: [{
        content: $L("Password Reset"),
		className: "enyo-text-header",
        style: "text-align:center;"
    }, {
        kind: "Spacer"
    }, {
        name: "description",
        content: "",
        className: "enyo-paragraph"
    }, {
        kind: "VFlexBox",
        style: "padding-top: 6px;",
        components: [{
            kind: "Button",
            caption: $L("Done"),
            onclick: "doSubmit"
        }, ]
    }],
    prepareDisplay: function(email) {
        //		var desc = "Follow the instructions we sent to " + email 
        //			+ " to reset your password or <a href=\"http://www.palm.com/webos-contact\">contact customer support</a>.";
        var emailAddr, desc;
        if (email && email.length > 0) {
            var resetTemp = new enyo.g11n.Template($L("Follow the instructions we sent to #{emailAddr} to reset your password or visit http://www.palm.com/webos-contact to contact customer support."));
            desc = resetTemp.evaluate({
                emailAddr: email
            });
        } else {
            desc = $L("Follow the instructions we sent to your HP webOS Account email to reset your password or visit http://www.palm.com/webos-contact to contact customer support.");
        }
        this.$.description.setContent(desc);
    },
    setDescription: function() {
        var desc = $L("Please visit http://www.palm.com/webos-contact to contact customer support for assistance.");
        this.$.description.setContent(desc);
    },
    //	done: function(inSender) {
    //		inSender.manager.close();
    //	}
});
