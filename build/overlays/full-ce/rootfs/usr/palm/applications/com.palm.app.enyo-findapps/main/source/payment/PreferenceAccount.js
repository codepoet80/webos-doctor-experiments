// PreferenceAccount.js
findApps.PreferenceAccount = findApps.PreferenceAccount || {};
findApps.PreferenceAccount.paDescriptionOBCC = $L("A carrier account or credit card is required to purchase items. Specify your default payment method below.");
findApps.PreferenceAccount.paDescriptionCC = $L("A credit card is required to purchase items.");
findApps.PreferenceAccount.paPasswordRFrequency = [{
    caption: $L("Once Every 4 Hours"),
    value: "Once Every 4 Hours"
}, {
    caption: $L("Every Purchase"),
    value: "Every Purchase"
}];
enyo.kind({
    name: "findApps.PreferenceAccount",
    kind: "VFlexBox",
    height: "100%",
    modalMode: false,
    components: [
    //Scrim control
    {
        kind: "Scrim",
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
        kind: "ModalDialog",
        name: "emailNotValidPrompt",
        components: [{
            name: "emailInvalidTitle",
            className: "enyo-item enyo-first",
            content: $L("Email must be in valid format."),
            style: "padding: 12px"
        }, {
            kind: "Button",
            className: "enyo-button-light",
            value: "ok",
            caption: $L("OK"),
            onclick: "dismissEmailInvalidPrompt"
        }]
    }, {
        kind: "Popup",
        name: "embargoedPrompt",
        components: [{
            name: "embargoedEmailTitle",
            className: "enyo-item enyo-first",
            content: $L("The United States Government prohibits HP from allowing you to use this email address."),
            style: "padding: 12px"
        }, {
            kind: "Button",
            className: "enyo-button-light",
            value: "ok",
            caption: $L("OK"),
            onclick: "dismissEmbargoedPrompt"
        }]
    }, {
        name: "verifyEmailPopup",
        kind: "ModalDialog",
        scrim: true,
        modal: false,
        onBeforeOpen: "initVerifyEmailPopup",
        components: [{
            kind: "findApps.VerifyEmailAddressPrompt",
            name: "verifyEmailPrompt",
            onOK: "handleEmailVerified",
            onChangeEmailAddress: "showChangeEmailAddrPrompt"
        }]
    }, {
        name: "changeEmailAddrPop",
        kind: "ModalDialog",
        scrim: true,
        modal: false,
        components: [{
            kind: "findApps.ChangeEmailAddressPrompt",
            name: "changeEmailAddrPrompt",
            onEmailChanged: "handleEmailChanged",
            onCancel: "cancelChangeEmailAddr"
        }]
    }, {
        name: "errorHandler",
        kind: "findApps.Error"
    }, {
        name: "userAuthenticator",
        kind: "findApps.UserAuthenticator",
        onUserValid: "handleValidUserResponse"
    }, {
        name: "paymentSetup",
        components: [{
            kind: "PageHeader",
            pack: 'center',
            style: 'height:54px;text-align:center',
            content: $L('Payment Setup')
        }, {
            className: "box-center",
            height: "100%",
            components: [{
                name: "description",
				className: "description",
                style: "padding:15px 5px 5px 5px; font-size: 16px",
                "allowHtml": true,
                domStyles: "linePadding",
                content: $L("You must setup a payment method to make purchases. <br><br>Payment information is stored by a secure third-party payment service, not by HP or on your device.<br><br>Tap a button below to set up your payment method.")
            },
			{
				kind: "VFlexBox",
				className: "button-group",
				components: [
					{
		                name: "obButton",
		                kind: "Button",
		                className: "enyo-button-affirmative",
		                caption: $L("Setup Carrier Account"),
		                onclick: "OBItemClick"
		            }, {
		                name: "ccButton",
		                kind: "Button",
		                caption: $L("Setup Credit Card"),
		                className: "enyo-button-dark",
		                onclick: "creditCardItemClick"
		            }, {
		                name: "paymentSetupBackButton",
		                kind: "Button",
		                caption: $L("Back"),
		                onclick: "backFromPaymentSetup"
		            }, {
		                name: "paymentSetupBackFromModal",
		                kind: "Button",
		                showing: false,
		                caption: $L("Done"),
		                onclick: "closeAndExit"
		            }
				]
			}]
        }]
    }, {
        kind: 'VFlexBox',
        name: "acctPrefs",
        flex: 1,
        components: [{
            kind: "PageHeader",
            pack: 'center',
            style: 'height:54px;text-align:center',
            content: $L('Preferences & Accounts')
        //{name: "prefHeaderImg", kind: enyo.Image, className: 'header-bar-image', src:"../icon.png", width:"32px", height:"32px"},
        //{kind: enyo.Control, content: $L('Preferences & Accounts')}]
        }, {
            name:"contentScroller", 
            kind: enyo.Scroller, 
            flex: 1, 
            components: [{
                className: "box-center",
                components: [{
                    kind: "Item",
                    style: 'border:none',
                    components: [{
                        content: findApps.PreferenceAccount.paDescriptionOBCC,
                        style: "font-size:18;px;margin:14px;",
                        name: "paDescriptionContent"
                    }, {
                        name: "defaultGroup",
                        kind: findApps.DefaultPaymentType,
                        showing: false,
                        onTypeSelected: "changeDefaultType"
                    }, {
                        kind: "RowGroup",
                        caption: $L("Accounts"),
                        components: [{
                            kind: "Item",
                            layoutKind: "HFlexLayout",
                            onclick: "creditCardItemClick",
                            components: [{
                                name: "addCreditCardString",
                                content: $L("+ Add Credit Card")
                            },
                            // {name: "creditCardChecker", showing: false, kind: "CheckBox", disabled: true, checked: true},
                            {
                                name: "creditCardImage",
                                showing: false,
                                "allowHtml": true,
                                content: 'MasterCard <img src="images/payment-mastercard.png"/>'
                            }, {
                                flex: 1,
                                kind: "Spacer"
                            }, {
                                name: "creditCardNumber",
                                showing: false,
                                content: ""
                            }, ]
                        }, {
                            name: "obItem",
                            kind: "Item",
                            layouKind: "HFlexLayout",
                            onclick: "OBItemClick",
                            components: [{
                                name: "addCarrierAccountString",
                                content: $L("+ Add Carrier Account")
                            }, {
                                name: "carrierAccountState",
                                showing: false,
                                content: $L("Carrier Account")
                            }, ]
                        }]
                    }, {
                        kind: "RowGroup",
                        caption: $L("Password Is Required"),
                        components: [{
                            name: "passwordRF",
                            kind: "CustomListSelector",
                            items: findApps.PreferenceAccount.paPasswordRFrequency,
                            value: "Once Every 4 Hours",
                            onChange: "selectPasswordFrequency"
                        }]
                    }, {
                        name: "sendReceipts",
                        kind: "RowGroup",
                        showing: "false",
                        caption: $L("Send Receipts"),
                        components: [{
                            name: "receiptEmail",
                            kind: "findApps.SmartInput",
                            hint: $L("yourname@domain.com"),
                            onchange: "saveInvoiceEmail"
                        }]
                    }]
                }, ]
            }]
        }, {
	        kind: 'Toolbar',
	        className: 'enyo-toolbar-light',
	        components: [{
	            name: "backButton",
	            kind: "Button",
	            style: 'width:300px',
	            className: "enyo-button-affirmative",
	            caption: $L("Done"),
	            onclick: "doneButtonClick"
	        }]
	     }
        ]
        }, {
        name: "closeModal",
        kind: "PalmService",
        service: "palm://com.palm.systemmanager/",
        method: "dismissModalApp",
        onSuccess: "doNothing",
        onFailure: "handleError",
        subscribe: true
    },
    {
    	name: "noPaymentTypesMsg",
        kind: "VFlexBox",
        flex: 2,
        height: "100%",
        style: 'text-align:center',
        components: [{
            kind: "PageHeader",
            pack: 'center',
            style: 'height:54px;text-align:center',
            content: $L('Preferences & Accounts')
       },{
            kind: "Spacer"
        }, {
            
            kind: enyo.Control,
            "allowHtml": true,
            height: '105px',
            content: $L("Your App Catalog country does not support any payment options."),
            flex: 2
        }, {
        	kind: 'Toolbar',
            className: 'enyo-toolbar-light',
            components: [{
                name: "noPaymentTypesButton",
                kind: "Button",
                style: 'width:300px',
                className: "enyo-button-affirmative",
                caption: $L("Back"),
                onclick: "noPaymentTypesButtonClick"
            }]
        }]
    }
    ],
    goBackHandler: function(returnVal) {
		findApps.ViewLibrary.goBack();
	    // If payment set up is shown while downloading a purchased app
	    // and user cancels the set up.
	    // Return false so that the download is canceled
	    if (this.callback == true && this.callBackFn) {
	        this.callback = false;
	        this.callBackFn({
	            accountValid: returnVal
	        });
	    }
	},
    noPaymentTypesButtonClick: function() {
		this.goBackHandler(false);
	}
	,
    create: function() {
        this.inherited(arguments);
        this.$.acctPrefs.hide();
        this.$.paymentSetup.hide();
        this.$.obItem.hide();
        this.$.obButton.hide();
    },
    selectPasswordFrequency: function(inSender, inEvent) {
        findApps.UserPreferences.setPaymentLogin(this.$.passwordRF.getValue());
    },
    handleEmbargoAcc: function() {
        var newEmail = this.$.receiptEmail.getValue();
        var ext = newEmail.substring(newEmail.lastIndexOf(".") + 1);
        var isEmbargoed = findApps.AccountServices.embargoedList.indexOf(ext) != -1;
        if (isEmbargoed) {
            this.$.embargoedPrompt.openAtCenter();
        //self.controller.get("invoiceEmail").focus();
        } else {
            this.invoiceEmail = newEmail;
            
            findApps.BaseServer.getPMTServer().setInvoiceEmail(this.invoiceEmail, "setInvoiceEmail", {
                onSuccess: "processResponse",
                onFailure: "handleFailure",
                scope: this
            });
        }
    },
    dismissEmbargoedPrompt: function() {
        this.$.embargoedPrompt.close();
    },
    dismissEmailInvalidPrompt: function() {
        this.$.emailNotValidPrompt.close();
    },
    saveInvoiceEmail: function() {
        var newEmail = this.$.receiptEmail.getValue();
        var ext = newEmail.substring(newEmail.indexOf(".") + 1);
        if (newEmail.search(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i) == -1) {
            this.$.emailNotValidPrompt.openAtCenter();
        } else {
            if (findApps.AccountServices.embargoedList) {
                this.handleEmbargoAcc();
            } else {
                findApps.BaseServer.getPMTServer().getEmbargoedEmailExtensions("embargoedExt", {
                    onSuccess: "processResponse",
                    onFailure: "handleFailure",
                    scope: this
                });
            }
        }
    },
    //this is called only when both ob and cc already exist
    changeDefaultType: function(inSender, inValue) {
        var paymentId = "";
        if (inValue == "OB") {
            paymentId = this._myOBPaymentInfo[0].paymentInfoId;
        }
        else if (inValue == "CC") {
            paymentId = this._myCCPaymentInfo.paymentInfoId;
        }
        findApps.BaseServer.getPMTServer().setDefaultPaymentInfo(paymentId, "defaultType", {
            onSuccess: "processResponse",
            onFailure: "handleFailure",
            scope: this
        });
    },
    backFromPaymentSetup: function() {
        // If payment set up is shown while downloading a purchased app
        // and user cancels the set up.
        // Return false so that the download is canceled
    	this.goBackHandler(false);
    },
    receiveResponse: function(event, success, errors) {
    	if(event === "paymentTypes") {
    		enyo.application.sessionManager.removeListener(this, "paymentTypes");
	    	if(success) {
	    		this.refreshStatus();
	    	}
	    	else {
	    		this.$.scrim.hide();
	            this.$.spinner.setShowing(false);
	    		errors.push("LOC03009");
	    		this.$.errorHandler.displayError(errors);
	    	}
    	}
    },
    refreshStatus: function() {
    	this.$.noPaymentTypesMsg.setShowing(false);
    	// Pre-requisite - getPaymentTypes call is not yet complete
    	if(!findApps.UserProfile.validPaymentTypes) {
    		// Call has not been made yet or call is not yet complete
            var paymentTypesStatus = enyo.application.sessionManager.triggerInitPaymentTypes(this);
            if(paymentTypesStatus && paymentTypesStatus.status === "inprogress") {
            	this.$.scrim.show();
                this.$.spinner.setShowing(true);
            	// Wait for the paymentTypes call to be over
            	return;
            }
    	}
    	// No payment types supported for this user
    	if (findApps.UserProfile.validPaymentTypes && findApps.UserProfile.validPaymentTypes.length == 0) {
    		this.$.scrim.hide();
            this.$.spinner.setShowing(false);
    		this.$.noPaymentTypesMsg.setShowing(true);
    		return;
    	}
        // Get Password frequency setting if present
        findApps.UserProfile.prf = enyo.getCookie("findapps.paymentPref");
        if (findApps.UserProfile.prf) {
            this.$.passwordRF.setValue(findApps.UserProfile.prf);
        }
        //This apparently will disable auto-capitalization
        this.$.receiptEmail.$.input.setAttribute('x-palm-disable-auto-cap');
        this.isObEnabled = findApps.UserProfile.obEnabled;
        this.$.scrim.show();
        this.$.spinner.setShowing(true);
        var profilePaymentInfo = false;
        if (findApps.UserProfile.validPayment && findApps.UserProfile.validPayment.OutGetPaymentInfos) {
            profilePaymentInfo = true;
        }
        if (profilePaymentInfo == true) {
            // We know we want to show the payment set up page directly
            // findApps.UserProfile.validPayment will have the required payment details already
            this.populatePaymentDetails();
        } else {
            this.verifyPaymentSetup();
        }
    },
    verifyPaymentSetup: function() {
        findApps.BaseServer.getPMTServer().verifyPaymentSetup("verifyPaymentSetup1", {
                onSuccess: "processResponse",
                onFailure: "handleFailure",
                scope: this
            });
    },
    
    // This method is invoked by downloadstates.js when a callback function has to be registered
    // downloadstates.js calles upon this view when a paid application is to be purchased before downloading
    // and no credit card / OB is set up.  
    setCallback: function(callback) {
        this.callback = true;
        this.callBackFn = callback;
    },
    setShowPaymentSetup: function(showPaymentSetup) {
        this.showPaymentSetup = showPaymentSetup;
    },
    processResponse: function(inSender, inResponse, inRequest, inProps) {
        this.$.scrim.hide();
        this.$.spinner.setShowing(false);
        if (inResponse.OutGetPaymentInfos) {
            this.handlePaymentPopulate(inSender, inProps, inResponse, inRequest);
        } else if (inResponse.OutGetEmbargoedEmailExtensions) {
            findApps.AccountServices.embargoedList = inResponse.OutGetEmbargoedEmailExtensions.embargoedEmailExtensions;
            this.handleEmbargoAcc();
        } else if (inProps.service == "defaultType") {
            this.handleUpdateDefault(inResponse);
        } else if (inResponse.OutSetUserInfo) {
            if (findApps.UserProfile.validPayment.OutGetPaymentInfos) {
                findApps.UserProfile.validPayment.OutGetPaymentInfos.invoiceEmail = this.$.receiptEmail.getValue();
            }
        }
    },
    handleUpdateDefault: function(inResponse) {
        if (inResponse && inResponse.OutSetDefaultPaymentInfo) {
            var defaultPayemntId = inResponse.OutSetDefaultPaymentInfo.paymentInfoId;
            if (this._myOBPaymentInfo[0].paymentInfoId == defaultPayemntId) {
                findApps.UserProfile.validPayment.OutGetPaymentInfos.obPaymentInfos[0]["default"] = true;
                findApps.UserProfile.validPayment.OutGetPaymentInfos.ccPaymentInfos[0]["default"] = false;
            } else if (this._myCCPaymentInfo.paymentInfoId == defaultPayemntId) {
                findApps.UserProfile.validPayment.OutGetPaymentInfos.obPaymentInfos[0]["default"] = false;
                findApps.UserProfile.validPayment.OutGetPaymentInfos.ccPaymentInfos[0]["default"] = true;
            }
        }
    },
    handleFailure: function(inSender, inResponse, inRequest, inProps, errors) {
        //Something unexpected happened
        this.$.scrim.hide();
        this.$.spinner.setShowing(false);
        var err = inResponse && inResponse.JSONException && inResponse.JSONException.errorCode ? inResponse.JSONException.errorCode : inResponse;
        if (err == "PMT04800") {
            errors.push("LOC02053");
        } else {
            switch (inProps.service) {
                case "verifyPaymentSetup1":
                    errors.push("LOC02054");
                    break;
                case "verifyPaymentSetup2":
                    //popup ok
                    errors.push("LOC02067");
                    break;
                default:
                    errors.push("LOC02068");
                    break;
            }
        }
        this.$.errorHandler.displayError(errors);
    },
    handlePaymentPopulate: function(inSender, inService, inResponse, inRequest) {
        var self = this;
        findApps.UserProfile.validPayment = inResponse;
        this.populatePaymentDetails();
    },
    populatePaymentDetails: function() {
        this.$.scrim.hide();
        this.$.spinner.setShowing(false);
        var myCCPaymentInfos = findApps.UserProfile.validPayment.OutGetPaymentInfos.ccPaymentInfos;
        var myOBPaymentInfos = findApps.UserProfile.validPayment.OutGetPaymentInfos.obPaymentInfos;
        this.invoiceEmail = findApps.UserProfile.validPayment.OutGetPaymentInfos.invoiceEmail;
        if (this.showPaymentSetup && this.showPaymentSetup == true) {
            this.$.paymentSetup.show();
            this.$.acctPrefs.hide();
            if (this.isObEnabled && this.isObEnabled == true) {
                this.$.obButton.show();
            } else {
                this.$.obButton.hide();
            }
        } else {
            this.$.paymentSetup.hide();
            this.$.acctPrefs.show();
            //FIXME: there maybe more than one paymentinfos on cc and ob
            if (myCCPaymentInfos[0]) {
                this.editCC = true;
                this._myCCPaymentInfo = myCCPaymentInfos[0];
                this.$.addCreditCardString.hide();
                //this.$.creditCardChecker.show();
                if (this._myCCPaymentInfo.creditCard.type == "MC") {
                    this.$.creditCardImage.setContent(this._masterCardDisplay);
                    this.$.creditCardImage.show();
                } else if (this._myCCPaymentInfo.creditCard.type == "VISA") {
                    this.$.creditCardImage.setContent(this._visaDisplay);
                    this.$.creditCardImage.show();
                }
                this.$.creditCardNumber.setContent(this._myCCPaymentInfo.creditCard.number);
                this.$.creditCardNumber.show();
            } else {
                this.editCC = false;
                this.$.addCreditCardString.show();
                //this.$.creditCardChecker.hide();
                this.$.creditCardImage.hide();
                this.$.creditCardNumber.hide();
            }
            if (this.invoiceEmail && this.invoiceEmail != "") {
                this.$.receiptEmail.setValue(this.invoiceEmail);
                this.$.sendReceipts.show();
            } else {
                this.$.sendReceipts.hide();
            }
            if (this.isObEnabled && this.isObEnabled == true) {
                this.$.obItem.show();
                this.$.paDescriptionContent.setContent(findApps.PreferenceAccount.paDescriptionOBCC);
                
                if (myOBPaymentInfos[0]) {
                    this._myOBPaymentInfo = myOBPaymentInfos;
                    this.editOB = true;
                    this.$.addCarrierAccountString.hide();
                    this.$.carrierAccountState.show();
                } else {
                    this.editOB = false;
                    this.$.addCarrierAccountString.show();
                    this.$.carrierAccountState.hide();
                }
            } else {
                this.$.obItem.hide();
                this.$.paDescriptionContent.setContent(findApps.PreferenceAccount.paDescriptionCC);
            }
            if ((myOBPaymentInfos && myOBPaymentInfos[0]) && (myCCPaymentInfos && myCCPaymentInfos[0]) && this.isObEnabled && this.isObEnabled == true) {
                var checkVal = "";
                if (myOBPaymentInfos[0]["default"]) checkVal = "OB"
                else if (myCCPaymentInfos[0]["default"]) checkVal = "CC"
                this.$.defaultGroup.setSelected(checkVal);
                this.$.defaultGroup.show();
            } else this.$.defaultGroup.hide();
        }
        // Reset the value of the showPaymentSetup flag
        this.showPaymentSetup = false;
    },
    closePopup: function(inSender) {
        inSender.manager.close();
    },
    doneButtonClick: function() {
        enyo.setCookie("findapps.paymentPref", this.$.passwordRF.getValue());
        enyo.setCookie("findapps.rmail", this.$.receiptEmail.getValue());
        
        // If the download of an app is in progress
        // Flow is: user taps to download a paid app, no account set up, so the 
        // payment set up screen is shown
        // User opens Prefs and Accounts scene from menu while on Payment set up
        // In this flow, clicking on Done button should return the correct response 
        // to the callback so that the download the user had started will be canceled
        this.goBackHandler(false);
    },
    OBItemClick: function() {
        this.CCClicked = false;
        this.OBClicked = true;
        var paymentInfos = findApps.UserProfile.validPayment;
        if (paymentInfos.OutGetPaymentInfos.obPaymentInfos && paymentInfos.OutGetPaymentInfos.obPaymentInfos.length > 0) {
            this.editOB = true;
            this.addOB = false;
        } else {
            this.addOB = true;
            this.editOB = false;
        }
        this.$.userAuthenticator.showProfilePassword();
    },
    creditCardItemClick: function() {
        this.CCClicked = true;
        this.OBClicked = false;
        var paymentInfos = findApps.UserProfile.validPayment;
        if (paymentInfos.OutGetPaymentInfos.ccPaymentInfos && paymentInfos.OutGetPaymentInfos.ccPaymentInfos.length > 0) {
            this.editCreditCard = true;
            this.addCreditCard = false;
        } else {
            this.addCreditCard = true;
            this.editCreditCard = false;
        }
        this.$.userAuthenticator.showProfilePassword();
    },
    initVerifyEmailPopup: function() {
        this.$.verifyEmailPrompt.setProfileEmail((this.invoiceEmail && this.invoiceEmail != "") ? this.invoiceEmail : findApps.UserProfile.email);
    },
    // This method is called when user's password is validated successfully
    handleValidUserResponse: function() {
        if (this.CCClicked) {
            // Case is Edit CC 
            //in case it is editing CC or add CC but OB is already setup
            if (this.editCC || this.editOB) {
                this.showCreditCardScreen()
            }
            //add credit card case (no OB set up)
            else {
                // Show "Verify Email Address" prompt
                this.$.verifyEmailPopup.openAtCenter();
            }
        } else if (this.OBClicked) {
            // Case is Edit OB 
            //in either case whether editing OB or add OB , show ob set up
            //I it is editing, email change field will nto come in Ob set up screen.
            // If it is being added for first time. It willshow up there
            this.showOBScreen()
        }
    },
    handleEmailVerified: function() {
        this.$.verifyEmailPopup.close();
        this.showAddScreen();
    },
    handleEmailChanged: function() {
        this.$.changeEmailAddrPop.close();
        this.showAddScreen();
    },
    cancelChangeEmailAddr: function() {
        this.$.changeEmailAddrPop.close();
        // Show "Verify Email Address" prompt (DFISH-24061)
        this.$.verifyEmailPopup.openAtCenter();
    },
    showAddScreen: function() {
        if (this.OBClicked) this.showOBScreen();
        else if (this.CCClicked) {
            this.showCreditCardScreen();
        }
    },
    showCreditCardScreen: function() {
        var nextView = findApps.ViewLibrary.getView("CCSETUP");
        if (this.callback && this.callback == true) {
            this.callback = false;
            nextView.setCallback(this.callBackFn);
        }
        if (this.modalMode && this.modalMode === true) {
            nextView.setModalMode(this.modalMode);
        }
    },
    showOBScreen: function() {
        var nextView = findApps.ViewLibrary.getView("OBSETUP");
        if (this.callback && this.callback == true) {
            this.callback = false;
            nextView.setCallback(this.callBackFn);
        }
        if (this.modalMode && this.modalMode === true) {
            nextView.setModalMode(this.modalMode);
        }
    },
    showChangeEmailAddrPrompt: function() {
        this.$.verifyEmailPopup.close();
        this.$.changeEmailAddrPop.openAtCenter();
        this.$.changeEmailAddrPrompt.reset();
    },
    setParams: function(params) {
        if (params && params.initialView) {
            this.$.paymentSetupBackButton.hide();
            this.$.paymentSetupBackFromModal.show();
            this.modalMode = params.modalMode;
            this.showPaymentSetup = params.showPaymentSetup;
        } else {
            this.modalMode = false;
        }
    },
    closeAndExit: function() {
        if (this.modalMode && this.modalMode === true) {
            var paymentSetup = false;
            var paymentInfos = findApps.UserProfile.validPayment;
            if (paymentInfos != undefined && paymentInfos.OutGetPaymentInfos.ccPaymentInfos && paymentInfos.OutGetPaymentInfos.ccPaymentInfos.length > 0) {
                paymentSetup = true;
            } else {
                //this.log("Closing the dialog payment setup, payment Not set up ");
            }
            var responseString = JSON.stringify({
                "resultCode": paymentSetup
            });
            var closeModalParams = {
                "returnMessage": responseString,
                "params": {}
            };
            findApps.ViewLibrary._container.closeModalAndExit(closeModalParams);
        } else {
            //this.log("INAPP Ignoring modal dialog close event ");
        }
    },
    _masterCardDisplay: '<div style="position:relative;margin-top:-40px">MasterCard <img src="images/payment-mastercard.png" style="position:absolute;top:-5px;left:100px" /></div>',
    _visaDisplay: '<div style="position:relative;margin-top:-40px">Visa <img src="images/payment-visa.png" style="position:absolute;top:-5px;left:40px"/></div>'
});
