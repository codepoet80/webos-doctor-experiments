enyo.kind({
    name: "findApps.CreditCardInfo",
    kind: enyo.VFlexBox,
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
        name: "errorHandler",
        kind: "findApps.Error",
        onSubmit: "submitError",
        onCancel: "cancelError"
    }, {
        kind: "ModalDialog",
        name: "wrongAddressPrompt",
        components: [{
            name: "wrongAddrTile",
            className: "enyo-text-header",
            style: "text-align: center;",
            content: $L("Address Verification")
        }, {
            name: "wrongAddrMessage",
            className: "enyo-paragraph",
            "allowHtml": true
        }, {
            kind: "Button",
            className: "enyo-button-dark",
            value: "change",
            caption: $L("Change Address"),
            onclick: "rejectAddress"
        }, {
            kind: "Button",
            className: "enyo-button-light",
            value: "ok",
            caption: $L("Use What I Entered"),
            onclick: "acceptAddress"
        }]
    }, {
        kind: "ModalDialog",
        name: "addrSuggestionPrompt",
        components: [{
            name: "addrSuggestionTitle",
            className: "enyo-text-header",
            style: "text-align: center;",
            content: $L("Address Verification")
        }, {
            name: "addrSuggestionMsg",
            className: "enyo-paragraph",
            "allowHtml": true
        }, {
            kind: "Button",
            className: "enyo-button-affirmative",
            value: "change",
            caption: $L("Use This Address"),
            onclick: "changeAddress"
        }, {
            kind: "Button",
            className: "enyo-button-light",
            value: "ok",
            caption: $L('Use What I Entered'),
            onclick: "acceptAddress"
        }]
    }, {
        kind: "ModalDialog",
        name: "removeCCPrompt",
        components: [{
            name: "removeCCTitle",
            className: "enyo-text-header",
            style: "text-align: center;",
            content: $L("Remove Credit Card")
        }, {
            name: "removeCCMsg",
            className: "enyo-paragraph",
            content: $L("Are you sure you want to remove this credit card?")
        }, {
			kind: "VFlexBox",
			className: "button-group",
			components: [
				{
		            kind: "Button",
		            className: "enyo-button-negative",
		            value: "remove",
		            caption: $L('Remove'),
		            onclick: "removeCC"
		        }, {
		            kind: "Button",
		            className: "enyo-button-light",
		            value: "cancel",
		            caption: $L("Cancel"),
		            onclick: "cancelRemoveCC"
		        }
			]
		}]
    }, {
        kind: "PageHeader",
        name: "headerTitle",
        pack: "center",
    //components: 
    // [
    // {name: "headerImage", kind: enyo.Image, src: "../icon.png", className:"header-bar-image"},
    //{name: "headerTitle", kind: enyo.Control, content: ""}
    //]
    },
    // Credit card information inside a scroller
    {
        kind: "Scroller",
        height: "100%",
        components: [{
            name: "creditCardInfoBody",
            className: "box-center",
            height: "100%",
            components: [{
                className: "",
                components: [{
                    kind: "RowGroup",
                    caption: $L("Billing Country"),
                    components: [{
                        name: "billingCountry",
                        kind: "CustomListSelector",
                        onChange: "billCountryChange",
                        items: ""
                    }, ]
                },
                // This rowgroup will be dynamically filled up with the credit card type options based on selected billing country
                {
                    kind: "RowGroup",
                    name: "ccTypesGroup",
                    caption: $L("Payment method")
                }, {
                    kind: "RowGroup",
                    caption: $L("Card information"),
                    components: [{
                        name: "ccNumber",
                        kind: "findApps.SmartInput",
                        hint: $L("Card Number..."),
                        spellcheck: false,
                        autocorrect: false,
                        autoCapitalize: "lowercase",
                        onblur: "fieldCompleteCheck",
                        onSubmit: "enterHandler",
                        nextFocuser: ""
                    }, {
                        name: "cvv",
                        kind: "findApps.SmartInput",
                        hint: $L("Security Number..."),
                        inputType: "password",
                        spellcheck: false,
                        autocorrect: false,
                        autoCapitalize: "lowercase",
                        onblur: "fieldCompleteCheck",
                        onSubmit: "enterHandler",
                        nextFocuser: ""
                    }, {
                        name: "expireDate",
                        kind: "DatePicker",
                        label: $L("Expires: "),
                        hideDay: true,
                        onChange: "fieldCompleteCheck"
                    }]
                }, {
                    kind: "RowGroup",
                    name: "addressGroup",
                    caption: $L("Billing address"),
                    components: [{
                        name: "name",
                        kind: "findApps.SmartInput",
                        spellcheck: false,
                        autocorrect: false,
                        hint: $L("Full Name..."),
                        onblur: "fieldCompleteCheck",
                        onSubmit: "enterHandler",
                        nextFocuser: ""
                    }, {
                        name: "address1",
                        kind: "findApps.SmartInput",
                        autocorrect: false,
                        hint: $L("Billing Address 1..."),
                        onblur: "fieldCompleteCheck",
                        onSubmit: "enterHandler",
                        nextFocuser: ""
                    }, {
                        name: "address2",
                        kind: "findApps.SmartInput",
                        autocorrect: false,
                        hint: $L("Billing Address 2..."),
                        onblur: "fieldCompleteCheck",
                        onSubmit: "enterHandler",
                        nextFocuser: ""
                    },
                    // Address 3 to be shown if country = GB
                    {
                        name: "address3",
                        kind: "findApps.SmartInput",
                        autocorrect: false,
                        hint: $L("Billing Address 3..."),
                        onSubmit: "enterHandler",
                        nextFocuser: ""
                    },
                    // Hint text is different based on country
                    {
                        name: "city",
                        kind: "findApps.SmartInput",
                        autocorrect: false,
                        hint: $L("City..."),
                        onblur: "fieldCompleteCheck",
                        onSubmit: "enterHandler",
                        nextFocuser: ""
                    }, {
                        name: "state",
                        kind: "CustomListSelector",
                        onChange: "fieldCompleteCheck"
                    },
                    // Zip field not shown for country IE
                    {
                        name: "zip",
                        kind: "findApps.SmartInput",
                        spellcheck: false,
                        autocorrect: false,
                        hint: $L("Zip Code..."),
                        onblur: "fieldCompleteCheck",
                        showing: true,
                        onSubmit: "enterHandler",
                        nextFocuser: ""
                    }, {
                        name: "phone",
                        kind: "findApps.SmartInput",
                        spellcheck: false,
                        autocorrect: false,
                        hint: $L("Phone Number..."),
                        autoCapitalize: "lowercase",
                        onblur: "fieldCompleteCheck",
                        onSubmit: "enterHandler",
                        nextFocuser: ""
                    }, ]
                }]
            }, {
				kind: "VFlexBox",
				className: "button-group",
				components: [
					{
		                name: "submitButton",
		                kind: "Button",
		                className: "enyo-button-affirmative",
		                caption: $L("Done"),
		                onclick: "submitButtonClick"
		            }, {
		                name: "removeAccountButton",
		                kind: "Button",
		                className: "enyo-button-negative",
		                showing: false,
		                caption: $L("Remove"),
		                onclick: "removeAccountButtonClick"
		            }, {
		                kind: "Button",
		                className: "enyo-button-light",
		                caption: $L("Cancel"),
		                onclick: "cancelButtonClick"
		            }
				]
			}]
        }]
    }, ],
    expirationFmt: new enyo.g11n.DateFmt("MMyyyy"),
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
        this.$.ccNumber.nextFocuser = this.$.cvv;
        this.$.cvv.nextFocuser = this.$.name;
        this.$.name.nextFocuser = this.$.address1;
        this.$.address1.nextFocuser = this.$.address2;
        if ((this.selectedCountry === "GB")||(this.selectedCountry === "AU")||(this.selectedCountry === "NZ")) {
            this.$.address2.nextFocuser = this.$.address3;
        } else {
            this.$.address2.nextFocuser = this.$.city;
        }
        this.$.address3.nextFocuser = this.$.city;
        if (this.selectedCountry !== "IE") {
            this.$.city.nextFocuser = this.$.zip;
        } else {
            this.$.city.nextFocuser = this.$.phone;
        }
        this.$.zip.nextFocuser = this.$.phone;
    },
    create: function() {
        this.inherited(arguments);
        this.$.submitButton.disabled = true;
        this.$.submitButton.addClass('enyo-button-disabled');
        this.callback = false;
        this.callBackFn = null;
        var currentYear = (new Date()).getFullYear();
        this.$.expireDate.setMinYear(currentYear);
        this.$.expireDate.setMaxYear(currentYear + 18);
    },
    refreshStatus: function() {
        // Check if this is add credit card / edit credit card mode
        var paymentInfos = findApps.UserProfile.validPayment;
        if (paymentInfos && paymentInfos.OutGetPaymentInfos && paymentInfos.OutGetPaymentInfos.ccPaymentInfos && paymentInfos.OutGetPaymentInfos.ccPaymentInfos.length > 0) {
            this._ccinfo = paymentInfos.OutGetPaymentInfos.ccPaymentInfos[0];
            this.isEditMode = true;
        } else {
            this.isEditMode = false;
            this._ccinfo = undefined;
            // APPC-7973, on add credit card mode, auto focus on card number field
            this.$.ccNumber.forceFocus();
        }
        // Clear the cache - we might be changing this
        findApps.UserProfile.validPayment = undefined;
        this._setupBillCountry();
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
        this.hideScrim();
        switch (inProps.service) {
            case "billToCountries":
                this._hasCountryBill(inSender, inProps, inResponse, inRequest);
                break;
            case "addAccount":
                this._handleAddUpdateResponse("add", inSender, inProps, inResponse, inRequest);
                break;
            case "updateAccount":
                this._handleAddUpdateResponse("update", inSender, inProps, inResponse, inRequest);
                break;
            case "removeAccount":
                this._handleRemoveCCPaymentInfo(inSender, inProps, inResponse, inRequest);
                break;
            case "ccTypes":
                this._handleCCTypes(inSender, inProps, inResponse, inRequest);
                break;
        }
    },
    handleFailure: function(inSender, inResponse, inRequest, inProps, errors) {
        this.hideScrim();
        switch (inProps.service) {
            case "billToCountries":
                errors.push("LOC02028");
                break;
            case "addAccount":
                errors.push("LOC02029");
                break;
            case "updateAccount":
                errors.push("LOC02030");
                break;
            case "removeAccount":
                errors.push("LOC02031");
                break;
            case "ccTypes":
                errors.push("LOC02032");
                break;
            default:
                errors.push("LOC02033");
                break;
        }
        this.$.errorHandler.displayError(errors);
    },
    // Retrieve billcountry info from server and set related fields
    _setupBillCountry: function() {
        var activationCountry = "";
        this.choices = [];
        this.showScrim();
        findApps.BaseServer.getPMTServer().getBillToCountries("billToCountries", {
            onSuccess: "processResponse",
            onFailure: "handleFailure",
            scope: this
        });
    },
    _hasCountryBill: function(inSender, inService, inResponse, inRequest) {
        var binCountries = inResponse.OutGetBillToCountries.billToCountries;
        this.choices = []; // CWS-2538: clear it before everytime reflash from server data
        if (binCountries) {
            var activationCountry;
            for (var i = 0; i < binCountries.length; i++) {
                var formatedName = binCountries[i].name ? binCountries[i].name.toUpperCase() : "";
                this.choices.push({
                    caption: $L(formatedName),
                    value: binCountries[i].code
                });
                if (binCountries[i].activation) activationCountry = binCountries[i].code;
            }
            this.choices.sort(function sortCompare(a, b) {
                return a.caption.localeCompare(b.caption);
            });
            this.binCountry = this.isEditMode ? this._ccinfo.billTo.country : activationCountry;
            this.selectedCountry = this.binCountry;
            this.$.billingCountry.setItems(this.choices);
            this.$.billingCountry.setValue(this.selectedCountry);
            this._setupCreditCardForm();
        }
    },
    _getCreditCardTypes: function() {
        this.showScrim();
        findApps.BaseServer.getPMTServer().getCCTypes(this.selectedCountry, "ccTypes", {
            onSuccess: "processResponse",
            onFailure: "handleFailure",
            scope: this
        });
    },
    _handleCCTypes: function(inSender, inService, inResponse, inRequest) {
        this.selectedCCType = null;
        this.ccTypeComponents = new Object();
        var ccTypes = inResponse.OutGetCCTypes.ccTypes;
        // First delete all the existing credit card types
        this.$.ccTypesGroup.destroyControls();
        var isChecked;
        for (var i = 0; i < ccTypes.length; i++) {
            isChecked = ccTypes[i].code == ((this._ccinfo && this._ccinfo.creditCard) ? this._ccinfo.creditCard.type : ccTypes[0].code);
            if (isChecked == true) this.selectedCCType = ccTypes[i].code;
            var component = this.$.ccTypesGroup.createComponent({
                kind: "findApps.CCType",
                code: ccTypes[i].code,
                description: ccTypes[i].description,
                selected: isChecked,
                name: ccTypes[i].code + "_ccType",
                onCCTypeSelected: "handleCCTypeSelected",
                owner: this
            });
            this.ccTypeComponents[ccTypes[i].code] = component;
        }
        this.$.ccTypesGroup.contentChanged();
    },
    handleCCTypeSelected: function(inSender, code, selected) {
        if (selected == true) this.selectedCCType = code;
        if (this.ccTypeComponents) {
            for (var i in this.ccTypeComponents) {
                var ccTypeComp = this.ccTypeComponents[i];
                if (ccTypeComp.code != code) {
                    ccTypeComp.setSelected(false);
                }
            }
        }
    },
    getActiveCreditCard: function() {
        return this.selectedCCType;
    },
    _setupCreditCardForm: function() {
        this.$.ccNumber.setValue(this.isEditMode ? this._ccinfo.creditCard.number : "");
        var cardDate = new Date();
        if (this.isEditMode) {
            var expDate = this._ccinfo.creditCard.expDate;
            var expMonth = expDate.substring(0, 2);
            var expYear = expDate.substring(2);
            cardDate.setFullYear(parseInt(expYear, 10), parseInt(expMonth, 10) - 1, 1);
        }
        // if expire year is smaller than current year, set mininum year to expire year, otherwise current year.
        var currentYear = (new Date()).getFullYear();
        var expireYear = (cardDate).getFullYear();
        this.$.expireDate.setMinYear(expireYear < currentYear ? expireYear : currentYear);
        // Store the original card date - this is required when checking if the user has changed the card date
        this.originalCardDate = new Date(cardDate);
        this.$.expireDate.setValue(new Date(cardDate));
        // CVV value
        this.$.cvv.setValue(this.isEditMode ? this._ccinfo.creditCard.cvv : "");
        // Phone number
        // TODO: format phone number enyo.g11n.PhoneFmt not in enyo-build.js, hence not working
        this.$.phone.setValue(this.isEditMode ? this._ccinfo.billTo.phone : "");
        // Card holder name
        var name = "";
        if (this.isEditMode) {
            if (this._ccinfo.billTo.firstName && this._ccinfo.billTo.lastName) name = this._ccinfo.billTo.firstName + " " + this._ccinfo.billTo.lastName;
            else if (this._ccinfo.billTo.firstName) name = this._ccinfo.billTo.firstName;
        }
        this.$.name.setValue(name);
        this._setAddress1(false);
        this.$.address2.setValue(this.isEditMode ? (this._ccinfo.billTo.address2 || "") : "");
        this._setAddress3(false);
        this._setCity(false);
        this._setupState(false);
        this._setZip(false);
        if (this.isEditMode) {
            this.$.headerTitle.setContent($L("Edit Credit Card"));
            this.$.removeAccountButton.show();
        } else {
            this.$.removeAccountButton.hide();
            this.$.headerTitle.setContent($L("Add Credit Card"));
            // Try to fetch the first name, last name to show in the name box
            var accntInfo = findApps.AccountServices.getInstance().getAccountInfo({
                onSuccess: "accountInfoSuccess", 
                onFailure: "accountInfoFailure", 
                scope: this
            });
            if (accntInfo) {
                this.accountInfoSuccess(null, accntInfo);
            }
        }
        // Submit / Save button
        this.$.submitButton.disabled = true;
        this.$.submitButton.addClass('enyo-button-disabled');
        // Get credit card types
        this._getCreditCardTypes();
        //this.controller.get("phoneNumField").addEventListener(Mojo.Event.propertyChange, this._validateAndSubmit);
        this.setupFocusMap();
    },
    _setAddress1: function(clearField) {
        this.$.address1.setValue(this.isEditMode && !clearField ? (this._ccinfo.billTo.address1 ? this._ccinfo.billTo.address1 : "") : "");
    },
    _setAddress3: function(clearField) {
        switch (this.selectedCountry) {
            case "GB":
            case "AU":
            case "NZ":
                this.$.address3.setValue(this.isEditMode && !clearField ? (this._ccinfo.billTo.address3 ? this._ccinfo.billTo.address3 : "") : "");
                // Why 7? Because every control in the item and the container item will occupy different index, weird.
                // This is a bug in enyo0.10 version shipped with Dartfish branch
                if (findApps.UserSession._softwareBuildBranch === "HP webOS 3.0.0" || findApps.UserSession._softwareBuildBranch === "HP webOS 3.0.1") this.$.addressGroup.showRow(7);
                else // This bug has been removed in enyo 0.10 version Duval onwards (hence this else)
                    this.$.addressGroup.showRow(3);
                this.address3Shown = true;
                break;
            default:
                // This is a bug in enyo0.10 version shipped with Dartfish branch
                if (findApps.UserSession._softwareBuildBranch === "HP webOS 3.0.0" || findApps.UserSession._softwareBuildBranch === "HP webOS 3.0.1") this.$.addressGroup.hideRow(7);
                else this.$.addressGroup.hideRow(3);
                this.address3Shown = false;
                break;
        }
    },
    _setCity: function(clearField) {
        switch (this.selectedCountry) {
            case "GB":
                this.$.city.setHint($L("Posttown..."));
                break;
            case "US":
                this.$.city.setHint($L("City..."));
                break;
            default:
                this.$.city.setHint($L("City/Town..."));
                break;
        }
        this.$.city.setValue(this.isEditMode && !clearField ? (this._ccinfo.billTo.city ? this._ccinfo.billTo.city : "") : "");
    },
    _setZip: function(clearField) {
        if (this.selectedCountry != "IE") {
            // This is a bug in enyo0.10 version shipped with Dartfish branch
            if (findApps.UserSession._softwareBuildBranch === "HP webOS 3.0.0" || findApps.UserSession._softwareBuildBranch === "HP webOS 3.0.1") this.$.addressGroup.showRow(10);
            else this.$.addressGroup.showRow(6);
            this.zipShown = true;
            // maxlength = 10
            //var modState = (["US", "MX", "FR", "ES", "NL"].indexOf(this.selectedCountry) != -1) ? Mojo.Widget.numLock : Mojo.Widget.capsLock;
            switch (this.selectedCountry) {
                case "GB":
                case "AU":
                case "NZ":
                    this.$.zip.setHint($L("Postcode..."));
                    break;
                case "US":
                    this.$.zip.setHint($L("Zip..."));
                    break;
                default:
                    this.$.zip.setHint($L("Postal Code..."));
                    break;
            }
            this.$.zip.setValue(this.isEditMode && !clearField ? this._ccinfo.billTo.zip : "");
        } else {
            this.zipShown = false;
            // This is a bug in enyo0.10 version shipped with Dartfish branch
            if (findApps.UserSession._softwareBuildBranch === "HP webOS 3.0.0" || findApps.UserSession._softwareBuildBranch === "HP webOS 3.0.1") this.$.addressGroup.hideRow(10);
            else this.$.addressGroup.hideRow(6);
        }
    },
    _getInfo: function() {
        var address = {};
        var card = {};
        var name = this.$.name.value;
        var namearray = name.split(" ");
        address.lastName = "";
        if (namearray.length > 1) {
            address.firstName = namearray[0];
            for (var i = 1; i < namearray.length; i++) {
                address.lastName += namearray[i];
                if (i < namearray.length - 1) {
                    address.lastName += " ";
                }
            }
        } else {
            if (namearray.length == 1) {
                address.firstName = namearray[0];
                address.lastName = '';
            } else {
                address.firstName = '';
                address.lastName = '';
            }
        }
        address.address1 = this.$.address1.value;
        address.address2 = this.$.address2.value;
        if (this.address3Shown == true) address.address3 = this.$.address3.value;
        address.city = this.$.city.value;
        if (this.stateShown == true) address.state = this.$.state.value;
        if (this.zipShown == true) address.zip = this.$.zip.value;
        var phoneNum = this.$.phone.value;
        if (phoneNum) address.phone = phoneNum.replace(/[. ()-+]/g, '');
        address.company = '';
        address.county = '';
        address.country = this.$.billingCountry.value;
        card.type = this.getActiveCreditCard();
        card.number = this.$.ccNumber.value.replace(/ /g, '');
        // this._ccinfo.expDate = this.cardExpiresModel.time.getMonth() + "/" + this.cardExpiresModel.time.getDay();
        // cybersource api is currently using mmyyyy format while accepting expiration date
        // MMyyyy
        card.expDate = this.expirationFmt.format(this.$.expireDate.getValue());
        card.cvv = this.$.cvv.value;
        card.email = '';
        return {
            address: address,
            card: card
        };
    },
    billCountryChange: function(inSender, inValue, inOldValue) {
        this.selectedCountry = inValue;
        var clearField = !(this.binCountry == this.selectedCountry);
        this.$.ccNumber.setValue(this.isEditMode && !clearField ? this._ccinfo.creditCard.number : "");
        var currDate = new Date();
        // show the expiry date - current month / year or the chosen one in case of edit card
        this.$.expireDate.setValue(currDate);
        this.$.cvv.setValue(this.isEditMode && !clearField ? this._ccinfo.creditCard.cvv : "");
        // TODO: format phone number
        this.$.phone.setValue(this.isEditMode && !clearField ? this._ccinfo.billTo.phone : "");
        this.$.address2.setValue(this.isEditMode && !clearField ? (this._ccinfo.billTo.address2 || "") : "");
        this._setAddress1(clearField);
        this._setAddress3(clearField);
        this._setCity(clearField);
        this._setupState(clearField);
        this._setZip(clearField);
        this._getCreditCardTypes();
        this.fieldCompleteCheck();
        // To build focus map
        this.setupFocusMap();
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
    cancelButtonClick: function() {
        this.goBack(false);
    },
    submitButtonClick: function() {
        this.showScrim();
        this.saveAccount();
    },
    removeAccountButtonClick: function() {
        this.$.removeCCPrompt.openAtCenter();
    },
    removeCC: function() {
        this.$.removeCCPrompt.close();
        this.showScrim();
        findApps.BaseServer.getPMTServer().removeAccount(this._ccinfo.paymentInfoId, true, "removeAccount", {
            onSuccess: "processResponse",
            onFailure: "handleFailure",
            scope: this
        });
    },
    cancelRemoveCC: function() {
        this.$.removeCCPrompt.close();
    },
    _handleRemoveCCPaymentInfo: function(inSender, inService, inResponse, inRequest) {
        this.goBack(false);
    },
    saveAccount: function() {
        var info = this._getInfo();
        // info.address contains address and name information
        // info.card contains card information
        if (this.isEditMode) {
            var addressParam = {};
            var creditCardParam = {};
            var updateAddress = false;
            var updateCard = false;
            //figure out what changed and generate the appropriate params to send to the server
            if (info.address.firstName !== undefined && info.address.firstName.toUpperCase() != this._ccinfo.billTo.firstName.toUpperCase()) {
                addressParam.firstName = info.address.firstName;
            }
            if (info.address.lastName !== undefined && info.address.lastName.toUpperCase() != this._ccinfo.billTo.lastName.toUpperCase()) {
                addressParam.lastName = info.address.lastName;
            }
            if (info.address.address1 !== undefined && info.address.address1.toUpperCase() != this._ccinfo.billTo.address1.toUpperCase()) {
                addressParam.address1 = info.address.address1;
            }
            if (info.address.address2 !== undefined && this._ccinfo.billTo.address2 !== undefined && info.address.address2.toUpperCase() != this._ccinfo.billTo.address2.toUpperCase()) {
                addressParam.address2 = info.address.address2;
            }
            if (info.address.address3 !== undefined && this._ccinfo.billTo.address3 !== undefined && info.address.address3.toUpperCase() != this._ccinfo.billTo.address3.toUpperCase()) {
                addressParam.address3 = info.address.address3;
            }
            if (info.address.city !== undefined && this._ccinfo.billTo.city !== undefined && info.address.city.toUpperCase() != this._ccinfo.billTo.city.toUpperCase()) {
                addressParam.city = info.address.city;
            }
            if (info.address.state !== undefined && this._ccinfo.billTo.state !== undefined && info.address.state.toUpperCase() != this._ccinfo.billTo.state.toUpperCase()) {
                addressParam.state = info.address.state;
            }
            if (info.address.country !== undefined && info.address.country.toUpperCase() != this._ccinfo.billTo.country.toUpperCase()) {
                addressParam.country = info.address.country;
            }
            if (info.address.zip !== undefined && this._ccinfo.billTo.zip !== undefined && info.address.zip.toUpperCase() != this._ccinfo.billTo.zip.toUpperCase()) {
                addressParam.zip = info.address.zip;
            }
            if (info.address.phone !== undefined && info.address.phone.toUpperCase() != this._ccinfo.billTo.phone.toUpperCase()) {
                addressParam.phone = info.address.phone;
            }
            for (var k in addressParam) {
                updateAddress = true;
                break;
            }
            if (info.card.type != this._ccinfo.creditCard.type) {
                creditCardParam.type = info.card.type;
            }
            if (info.card.number != this._ccinfo.creditCard.number) {
                creditCardParam.number = info.card.number;
                // Always need the type if we change the number
                creditCardParam.type = info.card.type;
            }
            var orginialExpDate = findApps.Utilities.Formatter.getShortMonth(this.originalCardDate) + "" + findApps.Utilities.Formatter.getFullYear(this.originalCardDate);
            if (info.card.expDate != orginialExpDate) {
                creditCardParam.expDate = info.card.expDate;
            }
            // Always inclue cvv in the info.card
            creditCardParam.cvv = info.card.cvv;
            for (var k in creditCardParam) {
                //creditCardParam.email = email;
                updateCard = true;
                break;
            }
            //always include the paymentInfoId param
            creditCardParam.paymentInfoId = this._ccinfo.paymentInfoId;
            if (updateAddress || updateCard) {
                // Disable save button
                this.$.submitButton.disabled = true;
                this.$.submitButton.addClass("enyo-button-disabled");
                //this.$.submitButton.removeClass("enyo-button-affirmative");
                // Validate the card info as much as we can, and report errorinal commerces locally when we can
                // Change to check "info.address" , "info.card", because we need to check all these to get correct error,
                // change mode to "check" because "edit" mode "isFieldValueOkay" always return true,
                //var error = this._localCardCheck(updateAddress ? addressParam : null, updateCard ? creditCardParam : null, "edit");
                var error = this._localCardCheck(info.address, info.card, "check", true);
                if (error) {
                    this.hideScrim();
                    var errors = [error.error];
                    this.$.errorHandler.displayError(errors,error.args);
                    return;
                }
                // Store the addressParam and creditCardParam - values will be required if updateAccount fails
                this.savedAddressParam = info.address;
                this.savedCreditCardParam = info.card;
                findApps.BaseServer.getPMTServer().updateAccount(addressParam, creditCardParam, "updateAccount", {
                    onSuccess: "processResponse",
                    onFailure: "handleFailure",
                    scope: this
                });
            } else {
                this.goBack(false);
            }
        } else {
            // Disable save button
            this.$.submitButton.disabled = true;
            this.$.submitButton.addClass("enyo-button-disabled");
            //this.$.submitButton.removeClass("enyo-button-affirmative");
            // Validate the card info as much as we can, and report errors locally when we can
            var error = this._localCardCheck(info.address, info.card, "new", true);
            if (error) {
                this.hideScrim();
                var errors = [error.error];
                this.$.errorHandler.displayError(errors,error.args);
                return;
            }
            // Store the addressParam and creditCardParam - values will be required if updateAccount fails
            this.savedAddressParam = info.address;
            this.savedCreditCardParam = info.card;
            // Add account
            findApps.BaseServer.getPMTServer().addAccount(info.address, info.card, "addAccount", {
                onSuccess: "processResponse",
                onFailure: "handleFailure",
                scope: this
            });
        }
    },
    isFieldValueOkay: function(val, mode) {
        return (mode == "edit") || (val && val != "");
    },
    _localCardCheck: function(addr, card, mode, needFullName) {
        // Make sure all the required lines of the address are there
        var error;
        var args;
        if (addr) {
            if (!(this.isFieldValueOkay(addr.firstName, mode) || this.isFieldValueOkay(addr.lastName, mode) || this.isFieldValueOkay(addr.address1, mode))) {
                error = "PMT02010";
            } else if (!this.isFieldValueOkay(addr.phone, mode)) {
                error = "LOCL0005";
            } else {
                var fields = [];
                if (!(this.isFieldValueOkay(addr.firstName, mode))) {
                    fields.push($L("Full Name"));
                }
                if (!this.isFieldValueOkay(addr.address1, mode)) {
                    fields.push($L("Billing Address 1"));
                }
                if (!this.isFieldValueOkay(addr.city, mode)) {
                    fields.push($L("City"));
                }
                if ((addr.country === "US" || addr.country === "CA" || addr.country === "AU") && (addr.state === "STATE")) {
                    fields.push($L("State"));
                }
                if (addr.country !== "IE" && !this.isFieldValueOkay(addr.zip, mode)) {
                    fields.push($L("Zip"));
                }
                if (fields.length > 0) {
                    error = "LOCL0009";
                    args = {
                        "errCode": error, 
                        "fields":fields.join(", ")
                    };
                } else if (!(this.isFieldValueOkay(addr.firstName, mode) && this.isFieldValueOkay(addr.lastName, mode))) {
                    // If "needFullName" is true, to show the error, else false, to ignore this error 
                    // in the case of check enable or disable the "Done" button
                    if (needFullName) {
                        error = "LOCL0008";
                    }
                }
            }
        }
        if (card && !error) {
            if (!this.isFieldValueOkay(card.number, mode)) {
                error = "PMT02011";
            } else
            //if (mode != "check" &&  (!card.cvv || card.cvv == "")) {
            if ((!card.cvv || card.cvv == "")) {
                error = "LOCL0006";
            } else if ((mode == "new" || card.number) && mode != "check" && !/^\d*$/.test(card.number)) {
                error = "LOCL0003";
            } else if ((mode == "new" || card.cvv) && !/^\d*$/.test(card.cvv)) {
                error = "LOCL0003";
            } else if (!this.isFieldValueOkay(card.type, mode)) {
                error = "LOCL0004";
            }
        }
        if (addr && addr.zip && !error) {
            if (addr.country === "US" && !/^\d{5}$|^\d{5}-\d{4}$/.test(addr.zip)) {
                error = "LOC02018";
            } else if (addr.country === "CA" && !/^[a-zA-Z]{1}\d{1}[a-zA-Z]{1}[ ]{0,1}\d{1}[a-zA-Z]{1}\d{1}$/.test(addr.zip)) {
                error = "LOC02019";
            }else if ((addr.country === "AU" || addr.country === "NZ") && !/^\d{4}$/.test(addr.zip)) {
                error = "LOCL0010";
            }
        }
        if (addr && addr.firstName && !error) {
            if (addr.firstName.length > 60) {
                error = "LOC02020";
            }
        }
        if (addr && addr.lastName && !error) {
            if (addr.lastName.length > 60) {
                error = "LOC02021";
            }
        }
        if (error) {
            return {
                error: error,
                args: args,
            };
        } else {
            return undefined;
        }
    },
    rejectAddress: function() {
        //Since address was saved. So if user reaches this screen, make it an "Edit Credit Card" screen
        this.isEditMode = true;
        this._ccinfo = {
            billTo: this.savedAddressParam,
            creditCard: this.savedCreditCardParam,
            paymentInfoId: this.paymentInfoId
        };
        // Disable save button
        this.$.submitButton.disabled = true;
        this.$.submitButton.addClass('enyo-button-disabled');
        // Close the pop-up
        this.$.wrongAddressPrompt.close();
    },
    acceptAddress: function() {
        // Close the pop-up
        this.$.wrongAddressPrompt.close();
        this.$.addrSuggestionPrompt.close();
        this.goBack(true);
    },
    changeAddress: function() {
        this.$.addrSuggestionPrompt.close();
        this.showScrim();
        findApps.BaseServer.getPMTServer().updateAccount(this.billTo, {
            paymentInfoId: this.paymentInfoId
        }, "updateAccount", {
            onSuccess: "processResponse",
            onFailure: "handleFailure",
            scope: this
        });
    },
    // requestType can be add or update
    _handleAddUpdateResponse: function(requestType, inSender, inService, response, inRequest) {
        var resObject = undefined;
        if (requestType == "add") resObject = response.OutAddCCPaymentInfo;
        else if (requestType = "update") resObject = response.OutUpdateCCPaymentInfo;
        var billTo = resObject.billTo;
        // Save it (may be required later)
        this.paymentInfoId = resObject.paymentInfoId;
        this.billTo = billTo;
        //if result have DAV suggestion or couldn't verify address
        if (billTo !== undefined) {
            // If address cannot be verified by cybersource
            if (billTo == "") {
                var msg = $L("Your address could not be verified. Is it correct?");
                msg = this._formatAddress(msg, this.savedAddressParam);
                this.$.wrongAddressPrompt.openAtCenter();
                this.$.wrongAddrMessage.setContent($L(msg));
            }
            //DAV with suggestion
            else {
                var msg = $L("The billing address you entered was not found. Is this version correct?");
                msg = this._formatAddress(msg, billTo);
                this.$.addrSuggestionPrompt.openAtCenter();
                this.$.addrSuggestionMsg.setContent($L(msg));
            }
        }
        //Success
        else {
            this.goBack(true);
        }
    },
    _formatAddress: function(msg, address) {
        var formattedAdd = msg + "<br/><br/>";
        if (address.address1) formattedAdd += address.address1 + "<br/>";
        if (address.address2) formattedAdd += address.address2 + "<br/>";
        if (address.city) formattedAdd += address.city + ", ";
        if (address.state) formattedAdd += address.state + "<br/>";
        if (address.zip) formattedAdd += address.zip;
        return formattedAdd;
    },
    _setupState: function(clearField) {
        //if country is US or Canada or Australia, set state picker
        switch (this.selectedCountry) {
            case "US":
            case "CA":
            case "AU":
                var stateChoices = findApps.States.getStates(this.selectedCountry);
                stateChoices.sort(function(a,b){
                    if(a.value == "STATE"){
                        return -1;
                    }
                    if(b.value == "STATE"){
                        return 1;
                    }
                    return a.caption.localeCompare(b.caption);
                });
                this.$.state.setItems(stateChoices);
                this.$.state.setValue(this.isEditMode && !clearField ? this._ccinfo.billTo.state : "STATE");
                // This is a bug in enyo0.10 version shipped with Dartfish branch
                if (findApps.UserSession._softwareBuildBranch === "HP webOS 3.0.0" || findApps.UserSession._softwareBuildBranch === "HP webOS 3.0.1") this.$.addressGroup.showRow(11);
                else this.$.addressGroup.showRow(5);
                this.stateShown = true;
                break;
            default:
                // This is a bug in enyo0.10 version shipped with Dartfish branch
                if (findApps.UserSession._softwareBuildBranch === "HP webOS 3.0.0" || findApps.UserSession._softwareBuildBranch === "HP webOS 3.0.1") this.$.addressGroup.hideRow(11);
                else this.$.addressGroup.hideRow(5);
                this.stateShown = false;
                break;
        }
    },
    fieldCompleteCheck: function() {
        var info = this._getInfo();
        if (this._localCardCheck(info.address, info.card, this.isEditMode ? "check" : "new", false)) {
            this.$.submitButton.disabled = true;
            this.$.submitButton.addClass("enyo-button-disabled");
        //this.$.submitButton.removeClass("enyo-button-affirmative");
        } else {
            this.$.submitButton.disabled = false;
            this.$.submitButton.removeClass("enyo-button-disabled");
        //this.$.submitButton.addClass("enyo-button-affirmative");
        }
    },
    //Error dialog methods
    submitError: function(inSender, value) {
        if (value && value == 'help') {
            this.goBack(false);
            findApps.ApplicationManager.getInstance().openApplication('com.palm.app.help', {
                target: 'http://help.palm.com/app_catalog/appcatalog_download_error.html'
            });
        } else if (value && value == 'quit') {
            this.goBack(false);
        }
    },
    cancelError: function() {
        this.$.errorHandler.cancel();
    },
    displayError: function(msg) {
        // Stop the scrim
        this.hideScrim();
        this.$.error.displayError(msg);
    },
    // Server callback
    accountInfoSuccess: function(inSender, accountInfo) {
        // Store the account info in the global object
        if (findApps.UserSession.getAccountInfo() == null) findApps.UserSession.setAccountInfo(accountInfo);
        // Set the name in the Billing Address
        if (this.isEditMode == false) {
            var name = accountInfo.firstName + " " + (accountInfo.lastName ? accountInfo.lastName : "");
            this.$.name.setValue(name);
        }
    },
    accountInfoFailure: function(inSender, inResponse) {
        this.error("CreditCardInfo : Could not fetch first name / last name. getAccountInfo failure. ", inResponse);
    }
});
