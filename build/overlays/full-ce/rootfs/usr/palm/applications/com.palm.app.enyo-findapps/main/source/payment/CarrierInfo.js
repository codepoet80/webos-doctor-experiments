// CarrierInfo.js
var stateItems = ["California", "Masuchusa"];
enyo.kind({
    name: "findApps.CarrierInfo",
    kind: "VFlexBox",
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
        name: "errorHandler",
        kind: "findApps.Error",
        onSubmit: "submitError",
        onCancel: "cancelError"
    }, {
        kind: "PageHeader",
        name: "headerTitle",
        pack: "center",
        components: [
    // {name: "headerImage", kind: enyo.Image, src: "../icon.png", className:"header-bar-image"},
    // {name: "headerTitle", kind: enyo.Control, content: ""}
    ]
    }, {
        kind: "Scroller",
        height: "100%",
        components: [{
            name: "creditCardInfoBody",
            className: "box-center",
            height: "100%",
            components: [{
                name: "country",
                kind: "RowGroup",
                caption: $L("Billing Country"),
                showing: false,
                components: [{
                    name: "billingCountry",
                    kind: "CustomListSelector",
                    onChange: "billCountryChange",
                    items: ""
                }, ]
            }, {
                name: "stateRow",
                kind: "RowGroup",
                caption: $L("State"),
                showing: false,
                components: [{
                    name: "state",
                    kind: "CustomListSelector",
                    onChange: "_enableDisableSave"
                }, ]
            }, {
                name: "errorMessage",
                showing: false,
                content: "",
                style: "font-size: 16px; padding: 6px; color: red"
            }, {
                name: "invoiceemailRow",
                kind: "RowGroup",
                showing: false,
                caption: $L("Send Receipts"),
                components: [{
                    name: "invoiceemail",
                    kind: "findApps.SmartInput",
                    autocorrect: false,
                    hint: $L("Email Address...")
                }]
            }, {
				kind: "VFlexBox",
				className: "button-group",
				components: [{
	                name: "submitButton",
	                kind: "Button",
	                className: "enyo-button-affirmative",
	                caption: $L("Done"),
	                onclick: "submitButtonClick"
	            }, {
	                name: "removeButton",
	                kind: "Button",
	                className: "enyo-button-negative",
	                showing: false,
	                caption: $L("Remove"),
	                onclick: "removeButtonClick"
	            }, {
	                kind: "Button",
	                className: "enyo-button-light",
	                caption: $L("Cancel"),
	                onclick: "cancelButtonClick"
	            }]
			}]
        }]
    }, {
        kind: "ModalDialog",
        name: "removeOBPrompt",
        components: [{
            name: "removeOBTitle",
            className: "enyo-text-header",
            style: "text-align: center;",
            content: $L("Remove Carrier Account")
        }, {
            name: "removeOBMsg",
            className: "enyo-paragraph",
            content: $L("Are you sure you want to remove this carrier account?")
        }, {
			kind: "VFlexBox",
			className: "button-group",
			components: [
				{
		            kind: "Button",
		            className: "enyo-button-negative",
		            value: "remove",
		            caption: $L('Remove'),
		            onclick: "removeOB"
		        }, {
		            kind: "Button",
		            className: "enyo-button-light",
		            value: "cancel",
		            caption: $L("Cancel"),
		            onclick: "cancelRemoveOB"
		        }
			]
		}]
    }, ],
    cancelButtonClick: function() {
        this.goBack(false);
    },
    submitButtonClick: function() {
        this._setErrors(0);
        this.showScrim();
        var email = this.$.invoiceemail.value;
        if (this.invoiceShown && email != findApps.UserProfile.email) {
            if (email.search(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i) == -1) {
                this._setErrors(1);
            } else if (findApps.AccountServices.embargoedList) {
                this.handleEmbargoAcc();
            } else {
                findApps.BaseServer.getPMTServer().getEmbargoedEmailExtensions("embargoedExt", {
                    onSuccess: "processResponse",
                    onFailure: "handleFailure",
                    scope: this
                });
            }
        } else this.saveCarrier();
    },
    handleEmbargoAcc: function() {
        var email = this.$.invoiceemail.value;
        var ext = email.substring(email.lastIndexOf(".") + 1);
        var isEmbargoed = findApps.AccountServices.embargoedList.indexOf(ext) != -1;
        if (isEmbargoed) {
            this._setErrors(2);
        } else {
            this._changeEmail(email);
        }
    },
    _changeEmail: function(email) {
        //Right the carrier account is added even if there is failur eon settign invoice email
        // Need to check with HI whether it is needed to show any error and continue with setting carrier account.
        findApps.BaseServer.getPMTServer().setInvoiceEmail(email, "InvoiceEmail", {
            onSuccess: "processResponse",
            onFailure: "handleFailure",
            scope: this
        });
        this.saveCarrier();
    },
    saveCarrier: function() {
        var state = this.stateShown ? this.$.state.value : '';
        var country = this.$.billingCountry.value;
        var email = '';
        var addressParam = {};
        //editing card
        if (this.isEditMode) {
            var updateAddress = false;
            if (state !== undefined && this._obinfo.address.state !== undefined && state.toUpperCase() != this._obinfo.address.state.toUpperCase()) {
                addressParam.state = state;
            }
            //Always adding country for update sinc epayment server returning error if country not sent in update
            /*if (country !== undefined && this._obinfo.address.country !== undefined && country.toUpperCase() != this._obinfo.address.country.toUpperCase()) {
                addressParam.country = country;
            }*/
            for (var k in addressParam) {
                updateAddress = true;
                //This shouldn't be required ideally but if not sent in update payment server giving error
                // {"JSONException":{"message":"Mandatory field \"country\" does not exist or is empty","errorCode":"PMT02000"}. Update after
                // checking with Thieu.
                if (country !== undefined) {
                    addressParam.country = country;
                }
                break;
            }
            if (updateAddress) {
                this.$.submitButton.disabled = true;
                this.$.submitButton.addClass("enyo-button-disabled");
                findApps.BaseServer.getPMTServer().updateOBAccount(addressParam, this._obinfo.paymentInfoId, "updateOBAccount", {
                    onSuccess: "processResponse",
                    onFailure: "handleFailure",
                    scope: this
                });
            }
        }
        //saving card
        else {
            addressParam = {
                state: state,
                country: country
            };
            this.$.submitButton.disabled = true;
            this.$.submitButton.addClass("enyo-button-disabled");
            findApps.BaseServer.getPMTServer().addOBAccount(addressParam, "addOBAccount", {
                onSuccess: "processResponse",
                onFailure: "handleFailure",
                scope: this
            });
        }
    },
    _setErrors: function(errno) {
        switch (errno) {
            case 0:
                this.$.errorMessage.setContent("");
                this.$.errorMessage.hide();
                break;
            case 1:
                this.hideScrim();
                this.$.errorMessage.setContent(emailNotValidError);
                this.$.errorMessage.show();
                break;
            case 2:
                this.hideScrim();
                this.$.errorMessage.setContent(embargoedAddError);
                this.$.errorMessage.show();
                break;
            default:
                break;
        }
    },
    _handleRemoveOBPaymentInfo: function(inSender, inService, inResponse, inRequest) {
        this.goBack(false);
    },
    removeButtonClick: function() {
        this.$.removeOBPrompt.openAtCenter();
    },
    removeOB: function() {
        this.$.removeOBPrompt.close();
        this.showScrim();
        findApps.BaseServer.getPMTServer().removeAccount(this._obinfo.paymentInfoId, false, "removeOBAccount", {
            onSuccess: "processResponse",
            onFailure: "handleFailure",
            scope: this
        });
    },
    cancelRemoveOB: function() {
        this.$.removeOBPrompt.close();
    },
    billCountryChange: function(inSender, inValue, inOldValue) {
        this.selectedCountry = inValue;
        var clearField = !(this.binCountry == this.selectedCountry);
        this._setupState();
        this._enableDisableSave();
        //this.fieldCompleteCheck();
        // To build focus map
        this.setupFocusMap();
    },
    showScrim: function() {
        this.$.scrim.show();
        this.$.spinner.show();
    },
    hideScrim: function() {
        this.$.scrim.hide();
        this.$.spinner.hide();
    },
    enterHandler: function(inSender, inEvent) {
        if (inSender.nextFocuser) {
            inSender.nextFocuser.forceFocus();
        }
    },
    setupFocusMap: function() {
    //ToDo
    },
    create: function() {
        this.inherited(arguments);
        this.callback = false;
        this.callBackFn = null;
    },
    refreshStatus: function() {
        // Check if this is add credit card / edit credit card mode
        var paymentInfos = findApps.UserProfile.validPayment;
        if (paymentInfos && paymentInfos.OutGetPaymentInfos && paymentInfos.OutGetPaymentInfos.obPaymentInfos && paymentInfos.OutGetPaymentInfos.obPaymentInfos.length > 0) {
            this._obinfo = paymentInfos.OutGetPaymentInfos.obPaymentInfos[0];
            this.isEditMode = true;
            this.$.headerTitle.setContent($L("Edit Carrier Payment"));
        } else {
            this.isEditMode = false;
            this.$.headerTitle.setContent($L("Setup Carrier Payment"));
            this._obinfo = undefined;
        }
        this._enableDisableSave();
        if (findApps.UserProfile.validPayment && findApps.UserProfile.validPayment.OutGetPaymentInfos && findApps.UserProfile.validPayment.OutGetPaymentInfos.invoiceEmail) {
            this._invoiceEmail = findApps.UserProfile.validPayment.OutGetPaymentInfos.invoiceEmail;
        }
        // Clear the cache - we might be changing this
        findApps.UserProfile.validPayment = undefined;
        this._setupBillCountry();
        this._setupInvoice();
    },
    // This method is invoked by downloadstates.js when a callback function has to be registered
    // downloadstates.js calles upon this view when a paid application is to be purchased before downloading
    // and no credit card / OB is set up.  
    setCallback: function(callback) {
        this.callBackFn = callback;
        if (this.callBackFn) this.callback = true;
    },
    setModalMode: function(inModalMode) {
        this.modalMode = inModalMode;
    },
    /*
    * All service calls respond through here
    */
    processResponse: function(inSender, inResponse, inRequest, inProps) {
        switch (inProps.service) {
            case "billToCountries":
                this.hideScrim();
                this._hasCountryBill(inSender, inProps, inResponse, inRequest);
                break;
            case "addOBAccount":
                this.hideScrim();
                this._handleAddUpdateResponse("add", inSender, inProps, inResponse, inRequest);
                break;
            case "updateOBAccount":
                this.hideScrim();
                this._handleAddUpdateResponse("update", inSender, inProps, inResponse, inRequest);
                break;
            case "removeOBAccount":
                this.hideScrim();
                this._handleRemoveOBPaymentInfo(inSender, inProps, inResponse, inRequest);
                break;
            case "embargoedExt":
                if (inResponse.OutGetEmbargoedEmailExtensions) {
                    findApps.AccountServices.embargoedList = inResponse.OutGetEmbargoedEmailExtensions.embargoedEmailExtensions;
                    this.handleEmbargoAcc();
                }
                break;
        //not needed as findApps.UserProfile.validPayment is cleared
        /*case "InvoiceEmail":
            if (inResponse.OutSetUserInfo) {
                if(findApps.UserProfile.validPayment.OutGetPaymentInfos) {
                    findApps.UserProfile.validPayment.OutGetPaymentInfos.invoiceEmail = this.$.invoiceemail.value;
                }
            }
            break;*/
        }
    },
    // requestType can be add or update
    _handleAddUpdateResponse: function(requestType, inSender, inService, response, inRequest) {
        var resObject = undefined;
        if (requestType == "add") resObject = response.OutAddOBPaymentInfo;
        else if (requestType = "update") resObject = response.OutUpdateOBPaymentInfo;
        var paymentInfoId = resObject.paymentInfoId;
        // Potential error condition?
        if (!paymentInfoId) {
            this.error("### Error in saving/updating OB account.");
        } else this.goBack(true);
    },
    goBack: function(retVal) {
        if (this.modalMode && this.modalMode === true) {
            var responseString = JSON.stringify({
                "resultCode": retVal
            });
            var closeModalParams = {
                "returnMessage": responseString,
                "params": {}
            };
            findApps.ViewLibrary._container.closeModalAndExit(closeModalParams);
        } else { /* If callback function is set, notify failure */
            if (this.callback == true && this.callBackFn) {
                // Remove "Payment set up" scren from history
                findApps.ViewLibrary.popViewsFromHistory(1);
            }
            findApps.ViewLibrary.goBack();
            if (this.callback == true && this.callBackFn) {
                this.callback = false;
                this.callBackFn({
                    accountValid: retVal
                });
            }
        }
    },
    //To do fix errors
    handleFailure: function(inSender, inResponse, inRequest, inProps, errors) {
        this.hideScrim();
        switch (inProps.service) {
            case "billToCountries":
                errors.push("LOC02056");
                break;
            case "addAccount":
                errors.push("LOC02057");
                break;
            case "updateAccount":
                errors.push("LOC02058");
                break;
            case "removeAccount":
                errors.push("LOC02059");
                break;
            default:
                errors.push("LOC02060");
                break;
        }
        this.$.errorHandler.displayError(errors);
    },
    // Retrieve billcountry info from server and set related fields
    _setupBillCountry: function() {
        var activationCountry = "";
        this.choices = [];
        this.showScrim();
        findApps.BaseServer.getPMTServer().getOBCountries("billToCountries", {
            onSuccess: "processResponse",
            onFailure: "handleFailure",
            scope: this
        });
    },
    _hasCountryBill: function(inSender, inService, inResponse, inRequest) {
        var binCountries = inResponse.OutGetOBCountries.obCountries;
        this.choices = []; // CWS-2538: clear it before everytime reflash from server data
        if (binCountries) {
            var activationCountry;
            for (var i = 0; i < binCountries.length; i++) {
                var formatedName = binCountries[i].name ? binCountries[i].name.toUpperCase() : "";
                this.choices.push({
                    caption: $L(formatedName),
                    value: binCountries[i].code
                });
                if (binCountries[i].activation) activationCountry = "US" //binCountries[i].code;
            }
            this.choices.sort(function sortCompare(a, b) {
                return a.caption.localeCompare(b.caption);
            });
            this.binCountry = this.isEditMode ? this._obinfo.address.country : activationCountry;
            this.selectedCountry = this.binCountry;
            this.$.billingCountry.setItems(this.choices);
            this.$.billingCountry.setValue(this.selectedCountry);
            if (activationCountry != "US") {
                this.$.country.show();
            } else this.$.country.hide();
            this._setupState();
        } else {
            this.$.errorHandler.displayError(["LOC02061"]);
        }
    },
    _enableDisableSave: function() {
        var sameStateSelected = (this.stateShown && (this._obinfo && this._obinfo.address && this._obinfo.address.state === this.$.state.value));
        var defaultStateSelected = (this.stateShown && this.$.state.value === "STATE");
        if (sameStateSelected || defaultStateSelected || !this.$.billingCountry.value) {
            this.$.submitButton.disabled = true;
            this.$.submitButton.addClass('enyo-button-disabled');
        } else {
            this.$.submitButton.disabled = false;
            this.$.submitButton.removeClass('enyo-button-disabled');
        }
        if (this.isEditMode && this._obinfo && this._obinfo.paymentInfoId) { //cannot remove a non-existent ob payment
            this.$.removeButton.disabled = false;
            this.$.removeButton.removeClass('enyo-button-disabled');
        } else {
            this.$.removeButton.disabled = true;
            this.$.removeButton.addClass('enyo-button-disabled');
        }
    },
    _setupInvoice: function() {
        if (!this.isEditMode && !this._invoiceEmail) {
            this.invoiceShown = true;
            this.$.invoiceemail.setValue(findApps.UserProfile.email);
            this.$.invoiceemailRow.show();
            this.$.removeButton.hide();
        } else {
            this.invoiceShown = false;
            this.$.invoiceemailRow.hide();
            this.$.removeButton.show();
        }
    },
    _setupState: function(clearField) {
        //if country is US or Canada, set state picker
        if (this.selectedCountry == "US" || this.selectedCountry == "CA") {
            var stateChoices = findApps.States.getStates(this.selectedCountry);
            this.$.state.setItems(stateChoices);
            this.$.state.setValue(this.isEditMode && !clearField ? this._obinfo.address.state : "STATE");
            this.$.stateRow.show();
            this.stateShown = true;
        } else {
            this.$.stateRow.hide();
            this.stateShown = false;
        }
        this._enableDisableSave();
    },
    fieldCompleteCheck: function() {
    /*var info = this._getInfo();
        if (this._localCardCheck(info.address, info.card, this.isEditMode ? "check" : "new")) {
            this.$.submitButton.disabled = true;
            this.$.submitButton.addClass("enyo-button-disabled");
            //this.$.submitButton.removeClass("enyo-button-affirmative");
        }
        else {
            this.$.submitButton.disabled = false;
            this.$.submitButton.removeClass("enyo-button-disabled");
            //this.$.submitButton.addClass("enyo-button-affirmative");
        }*/
    }
});
