/**
 * ForgotPasswordPrompt.js
 * 
 * Please keep the style of this prompt in sync with In-App Payment:
 * subversion.palm.com/main/nova/palm/enyo-apps/com.palm.payment/trunk/app/src/ForgotPasswordPrompt.js
 */
enyo.kind({
    name: "findApps.ForgotPasswordPrompt",
    kind: enyo.Control,
    published: {
        params: {
            questionText: ""
        }
    },
    events: {
        onSubmit: "",
        onCancel: "",
    },
    components: [{
        kind: "Scrim",
        "animateShowing": false,
        name: "scrim",
        layoutKind: "VFlexLayout",
        align: "center",
        pack: "center",
        components: [{
            kind: "SpinnerLarge",
            name: 'spinner',
            showing: false
        }]
    }, {
        content: $L("Security Question"),
		className: "enyo-text-header",
        style: "text-align:center;"
    }, {
        name: "questionText",
		className: "enyo-text-subheader",
		style: "padding: 10px 0;",
		alwaysLooksFocused: true,
        content: $L("Your security question.")
    }, {
        name: "myAnswer",
        kind: "Input",
        hint: $L("Type your answer here"),
		alwaysLooksFocused: true,
        onkeyup: "answerKeyupHandler",
        autoCapitalize: "lowercase"
    }, {
        name: "noResponseMessage",
        showing: false,
        content: $L("Please enter an answer."),
		className: "enyo-text-error",
        style: "padding: 3px 0;"
    }, {
        name: "wrongResponse",
        showing: false,
        content: $L("Your answer is incorrect. Try again."),
		className: "enyo-text-error",
        style: "padding: 3px 0;"
    },{
        kind: "VFlexBox",
        style: "padding-top: 6px;",
        components: [ {
            kind: "Button",
			className: "enyo-button-affirmative",
            flex: 1,
            caption: $L("OK"),
            onclick: "submitAnswer"
        }, {
            kind: "Button",
            flex: 1,
            caption: $L("Cancel"),
            onclick: "doCancel"
        },]
    }],
    focusInput: function() {
        this.$.myAnswer.forceFocus();
    },
    answerKeyupHandler: function(inSender, inEvent) {
        if (inEvent.keyCode == "13") {
            inSender.forceBlur();
            this.submitAnswer();
        }
    },
    paramsChanged: function() {
        this.$.questionText.setContent(this.params.questionText);
    },
    getMyAnswer: function() {
        return this.$.myAnswer.getValue();
    },
    showWrongResponseMessages: function() {
        this.$.wrongResponse.setShowing(true);
        this.$.myAnswer.forceSelect();
    },
    clearErrorMessages: function() {
        this.$.noResponseMessage.setShowing(false);
        this.$.wrongResponse.setShowing(false);
    },
    resetAnswer: function() {
        this.clearErrorMessages();
        this.$.myAnswer.setValue("");
        this.$.myAnswer.forceFocus();
    },
    showScrim: function() {
        this.$.scrim.show();
        this.$.spinner.setShowing(true);
    },
    hideScrim: function() {
        this.$.scrim.hide();
        this.$.spinner.setShowing(false);
    },
    submitAnswer: function() {
        this.clearErrorMessages();
        if (this.getMyAnswer() == "" || this.getMyAnswer() == undefined) {
            this.$.noResponseMessage.setShowing(true);
            this.$.myAnswer.forceFocus();
        } else {
            this.doSubmit();
        }
    }
});
