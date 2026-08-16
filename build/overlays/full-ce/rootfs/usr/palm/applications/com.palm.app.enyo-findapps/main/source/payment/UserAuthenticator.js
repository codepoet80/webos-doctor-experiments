var uaProfile = uaProfile || {};
enyo.kind({
    name: "findApps.UserAuthenticator",
    kind: enyo.Control,
    events: {
        onUserValid: ""
    },
    components: [
    // servicess
    {
        name: "errorHandler",
        kind: "findApps.Error"
    },
    // pop up controls 
    {
        kind: "ModalDialog",
        scrim: true,
        modal: false,
        name: "profilePwdPopup",
        components: [{
            kind: "findApps.ProfilePasswordPrompt",
            name: "profilePwdPrompt",
            onSubmit: "passwordCheck",
            onForgetPassword: "forgotPassword",
            onCancel: "cancelProfilePwdPopup"
        }]
    }, {
        kind: "ModalDialog",
        scrim: true,
        modal: true,
        name: "forgotPwdPopup",
        components: [{
            name: "forgotpasswordprompt",
            kind: "findApps.ForgotPasswordPrompt",
            onSubmit: "submitSecurityAnswer",
            onCancel: "cancelForgotPwdPopup"
        }]
    }, {
        kind: "ModalDialog",
        scrim: true,
        modal: true,
        name: "pwdResetPopup",
        components: [{
            name: "passwordresetprompt",
            kind: "findApps.PasswordResetPrompt",
            onSubmit: "resetPassword"
        }]
    }, {
        kind: "ModalDialog",
        scrim: true,
        modal: true,
        name: "resetEmailPopup",
        components: [{
            name: "resetEmailSentPrompt",
            kind: "findApps.ResetEmailSentPrompt",
            onSubmit: "resetDone"
        }]
    }],
    create: function() {
        this.inherited(arguments);
        var topContainer = findApps.ViewLibrary._container;
        if (topContainer && topContainer.registerObserver) {
            topContainer.registerObserver("resize", this);
        }
    },
    update: function(eventName) {
       if (eventName == "resize") {
    	   if(this.$.profilePwdPopup && this.$.profilePwdPopup.isOpen) {
    		   this.$.profilePwdPopup.resizeHandler();
    	   }
    	   else if(this.$.forgotPwdPopup && this.$.forgotPwdPopup.isOpen) {
    		   this.$.forgotPwdPopup.resizeHandler();
    	   }
    	   else if(this.$.pwdResetPopup && this.$.pwdResetPopup.isOpen) {
    		   this.$.pwdResetPopup.resizeHandler();
    	   }
    	   else if(this.$.resetEmailPopup && this.$.resetEmailPopup.isOpen) {
    		   this.$.resetEmailPopup.resizeHandler();
    	   }
        }
    },
    passwordCheck: function(inSender) {
        this.$.profilePwdPrompt.showScrim();
        uaProfile.password = this.$.profilePwdPrompt.getPassword();
        uaProfile.deviceId = findApps.UserSession._deviceId;
        uaProfile.email = findApps.UserSession._email;
        this._loginAttemptCount++;
        if ((uaProfile.password.length < 6) || (uaProfile.password.length > 20)) {
            this.$.profilePwdPrompt.hideScrim();
            this.$.profilePwdPrompt.showLengthError();
            return;
        }
        // Check to skip the password check on browser
        if (enyo.application.onBrowser) {
            this.isUserValidSuccess();
        } else {
        	// TODO: why is this check here? This is handled now in a generic fashion in error handling? Revisit
            if (enyo.application.connectionManager.isOnline()) {
                findApps.AccountServices.getInstance().isUserValid(uaProfile.email, uaProfile.password.replace(/ /g, ""), uaProfile.deviceId, {
                    onSuccess: "isUserValidSuccess", 
                    onFailure: "isUserValidFailure", 
                    scope: this
                });
            } else {
                this.$.profilePwdPrompt.hideScrim();
                this.cancelProfilePwdPopup();
                this.genericFailure(inSender);
            }
        }
    },
    changePwdSuccess: function(inSender, inResponse) {
        this.log("UserAuthenticator: changePassword Success Response: ", inResponse);
        this.$.passwordresetprompt.hideScrim();
        this.$.pwdResetPopup.close();
        if (inResponse.returnValue) {
            findApps.UserPreferences.setLoginTime();
            this.doUserValid();
            if (this.callbackFnSet == true) {
                this.callbackFnSet = false;
                this.callback({
                    passwordValid: true,
                    passwordChanged: true
                });
            }
        }
    },
    changePwdFail: function(inSender, inResponse) {
        this.error("UserAuthenticator: changePwdFail Response: ", inResponse);
        this.$.passwordresetprompt.hideScrim();
        this.$.pwdResetPopup.close();
        var errors = ["LOC02027"];
        this.genericFailure(inSender, inResponse, errors);
        this.answerCallback(false);
    },
    genericFailure: function(inSender, inResponse, errors) {
        if (!errors || !enyo.isArray(errors)) {
            errors = [];
        }
        errors.push("LOC02024");
        this.$.errorHandler.displayError(errors);
    },
    isUserValidSuccess: function(inSender, inResponse) {
        this.$.profilePwdPrompt.hideScrim();
        if (enyo.application.onBrowser || inResponse.isValid) {
            this.$.profilePwdPopup.close();
            if (inResponse && inResponse.passwordResetFlag) {
                this.$.pwdResetPopup.openAtCenter();
                this.$.passwordresetprompt.focusInput();
            } else {
                findApps.UserPreferences.setLoginTime();
                this.doUserValid();
                
                // make purchase
                // Call the callback function if it is set
                if (this.callbackFnSet == true) {
                    this.callbackFnSet = false;
                    this.callback({
                        passwordValid: true
                    });
                }
                
            }
        } else {
            // If we have no security question, fetch it
            if (uaProfile.questionId == -2) {
                this.$.profilePwdPrompt.showScrim();
                var loc = enyo.g11n.currentLocale();
                uaProfile.locale = loc.locale;
                findApps.AccountServices.getInstance().getAccountSecurityQuestions(uaProfile.email, uaProfile.locale, {
                    onSuccess: "getAccountSecurityQuestionsSuccess", 
                    onFailure: "getAccountSecurityQuestionsFailure", 
                    scope: this
                });
            } else {
                this.loginError();
            }
        }
    },
    isUserValidFailure: function(inSender, inResponse) {
        this.error("isUserValid call failed. ", inResponse);
        this.$.profilePwdPrompt.hideScrim();
        this.cancelProfilePwdPopup();
        var errors = ["LOC02025"];
        this.genericFailure(inSender, inResponse, errors);
    },
    requestPasswordResetEmailSuccess: function(inSender, inResponse) {
        this.log("UserAuthenticator: requestPasswordResetEmailSuccess Response ", inResponse);
        this.$.resetEmailPopup.openAtCenter();
        this.$.resetEmailSentPrompt.prepareDisplay(uaProfile.email);
    },
    requestPasswordResetEmailFailure: function(inSender, inResponse) {
        this.error("UserAuthenticator: requestPasswordResetEmailFailure Response ", inResponse);
        var errors = ["LOC02026"];
        this.genericFailure(inSender, inResponse, errors);
        this.answerCallback(false);
    },
    getAccountSecurityQuestionsSuccess: function(inSender, inResponse) {
        this.log("UserAuthenticator: getAccountSecurityQuestionsSuccess Response ", inResponse);
        this.$.profilePwdPrompt.hideScrim();
        response = inResponse;
        if (response.id !== undefined) {
            uaProfile.questionId = response.id;
            uaProfile.questionText = response.question;
        } else {
            uaProfile.questionId = -1;
        }
        this.loginError();
    },
    getAccountSecurityQuestionsFailure: function(inSender, inResponse) {
        this.error("UserAuthenticator: getAccountSecurityQuestionsFailure Response ", inResponse);
        this.$.profilePwdPrompt.hideScrim();
        findApps.UserProfile.questionId = -1;
        this.loginError();
    },
    handleSecurityAnswerSucc: function(inSender, inResponse, inRequest) {
        this.log("UserAuthenticator: handleSecurityAnswerSuccess Response ", inResponse);
        this.$.forgotpasswordprompt.hideScrim();
        if (inResponse.returnValue == true) {
            uaProfile.idToken = inResponse.idToken;
            this.$.forgotPwdPopup.close();
            this.$.pwdResetPopup.openAtCenter();
            this.$.passwordresetprompt.focusInput();
        } else {
            uaProfile.questionId = -1;
            this.$.forgotpasswordprompt.showWrongResponseMessages();
        }
    },
    handleSecurityAnswerErr: function(inSender, inResponse, inRequest) {
        this.error("UserAuthenticator: handleSecurityAnswerError Response ", inResponse);
        this.$.forgotpasswordprompt.hideScrim();
        var self = this;
        if (self.attemptCount <= 3) {
            this.$.forgotpasswordprompt.showWrongResponseMessages();
        } else {
            this.cancelForgotPwdPopup();
            findApps.AccountServices.getInstance().requestPasswordResetEmail(uaProfile.email, {
                onSuccess: "passwordResetEmailSent", 
                onFailure: "failToSentMail", 
                scope: this
            });
        }
    },
    passwordResetEmailSent: function(inSender, inResponse) {
        this.$.resetEmailPopup.openAtCenter();
        this.$.resetEmailSentPrompt.prepareDisplay(uaProfile.email);
    },
    failToSentMail: function(inSender, inResponse) {
        this.$.resetEmailPopup.openAtCenter();
        this.$.resetEmailSentPrompt.setDescription();
    },
    loginError: function() {
        this.$.profilePwdPrompt.hideScrim();
        if (this._loginAttemptCount >= 3) {
            this.$.profilePwdPopup.close();
            if (uaProfile.questionId >= 0) {
                this.forgotPassword();
            } else {
                findApps.AccountServices.getInstance().requestPasswordResetEmail(uaProfile.email, {
                    onSuccess: "requestPasswordResetEmailSuccess", 
                    onFailure: "requestPasswordResetEmailFailure", 
                    scope: this
                });
            }
        } else {
            if (uaProfile.questionId >= 0) {
                this.$.profilePwdPrompt.showForgetPasswordButton();
            }
            this.$.profilePwdPrompt.showIncorrectError();
        }
    },
    forgotPassword: function(inSender) {
        this.$.profilePwdPopup.close();
        this.$.forgotPwdPopup.openAtCenter();
        this.$.forgotpasswordprompt.setParams({
            questionText: uaProfile.questionText
        });
        this.attemptCount = 0;
        this.$.forgotpasswordprompt.resetAnswer();
        this.$.forgotpasswordprompt.focusInput();
    },
    resetPassword: function(inSender) {
        this.$.passwordresetprompt.showScrim();
        this.newPassword = this.$.passwordresetprompt.getNewPassword();
        findApps.AccountServices.getInstance().changePassword(this.newPassword.replace(/ /g, ''), uaProfile.questionId, undefined, uaProfile.idToken, true, {
            onSuccess: "changePwdSuccess", 
            onFailure: "changePwdFail", 
            scope: this
        });
    },
    resetDone: function(inSender) {
        this.$.resetEmailPopup.close();
        this.answerCallback(false);
    },
    submitSecurityAnswer: function(inSender) {
        var myAnswer = inSender.getMyAnswer();
        this.attemptCount++;
        this.$.forgotpasswordprompt.showScrim();
        findApps.AccountServices.getInstance().authenticateAccountFromSecurityQuestion(uaProfile.email, uaProfile.questionId, myAnswer, {
            onSuccess: "handleSecurityAnswerSucc", 
            onFailure: "handleSecurityAnswerErr", 
            scope: this
        });
    },
    showProfilePassword: function() {
        uaProfile.questionId = -2;
        this._loginAttemptCount = 0;
        this.$.profilePwdPopup.openAtCenter();
        this.$.profilePwdPrompt.resetPassword();
        this.$.profilePwdPrompt.focusInput();
    },
    setNextView: function(nextViewName) {
        this.nextViewName = nextViewName;
    },
    setOwner: function(owner) {
        this.owner = owner;
    },
    setCallback: function(callback) {
        this.callback = callback;
        if (callback != null) this.callbackFnSet = true;
        else this.callbackFnSet = false;
    },
    setParams: function(params) {
        this.env_app = params.app;
        this.env_inResponse = params.inResponse;
        this.env_force = params.force;
        this.env_callback = params.callback;
    },
    cancelProfilePwdPopup: function(inSender) {
        this.$.profilePwdPopup.close();
        // Call the callback function if it is set (user is purchasing an app, callback fn will be set 
        // by downloadstates.js). 
        this.answerCallback(false);
    },
    cancelForgotPwdPopup: function(inSender) {
        this.$.forgotPwdPopup.close();
        // Call the callback function if it is set (user is purchasing an app, callback fn will be set 
        // by downloadstates.js). 
        this.answerCallback(false);
    },
    
    answerCallback: function(value) {
    
        if (this.callbackFnSet == true) {
            this.callbackFnSet = false;
            this.callback({
                passwordValid: value
            });
        }
    }
});
