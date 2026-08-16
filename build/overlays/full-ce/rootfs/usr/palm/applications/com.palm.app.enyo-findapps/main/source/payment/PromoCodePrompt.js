/**
 * PromoCodePrompt.js
 */
enyo.kind({
    name: "findApps.PromoCodePrompt",
    kind: "ModalDialog",
    //className: 'enyo-popup',
    published: {
        params: {
            appid: "",
            version: "",
            title: "",
            promoCode: "",
            errCode: ""
        }
    },
    promoCodeValue: "",
    events: {
        onPromoCodeConfirmed: "",
        onPromoCodeCanceled: ""
    },
    components: [{
        name: "title",
        className: 'enyo-modaldialog-title',
        style: 'padding-bottom:5px',
        content: $L("Enter Promo Code")
    }, {
        name: "promoCodeDiscript",
        className: 'enyo-text-body',
        style: 'padding-bottom:5px',
        content: $L("Enter promo code to download this application.")
    }, {
        name: "promoCode",
        kind: "Input",
        hint: $L("Promo Code")
    }, {
        name: "errorTips",
        showing: false,
        content: $L("Invalid promo code."),
        style: "font-size: 16px; padding: 6px; color: red"
    }, {
        kind: "VFlexBox",
        style: "padding-top: 6px;",
        components: [{
            kind: "Button",
            caption: $L("Use Promo Code"),
            className: "enyo-button-affirmative",
            onclick: "_checkPromoCodeStatus"
        }, {
            kind: "Button",
            caption: $L("Cancel"),
            onclick: "doPromoCodeCanceled"
        }]
    }],
    paramsChanged: function() {
        if (this.params.errCode != "") {
            this._displayErrors(true, this.params.errCode);
        } else {
            this._displayErrors(false, "");
        }
        this.$.promoCodeDiscript.setContent(enyo.macroize($L('Enter promo code to download {$title}.'), {
            title: this.params.title
        }));
        this.$.promoCode.setValue(this.params.promoCode);
    },
    _displayErrors: function(show, errorCode) {
        var errMessage;
        var errorMessages = {
            "INVALID": $L("This promo code is invalid."),
            "PMTPROMO70101": $L("This promo code has reached its limit and is no longer valid."),
            "PMTPROMO70102": $L("This promotion has been cancelled."),
            "PMTPROMO70103": $L("This promo code has expired."),
            "PMTPROMO70104": $L("This promotion has been cancelled."),
            "PMTPROMO70105": $L("This promotion has not started yet. Please try again later."),
            "PMTPROMO70106": $L("This promo code cannot be used in your country."),
            "PMTPROMO70107": $L("This promo code cannot be used with <CARRIER NAME>."),
            "PMTPROMO70108": $L("This apps price is higher than the value of the promo code."),
            "PMTPROMO70109": $L("This promo code is not valid for this app or version."),
            "PMTPROMO70110": $L("This promo code is not valid for this app or version."),
            "PMTPROMO70113": $L("The item costs more than the amount remaining in this promo code."),
            "PMTPROMO70010": $L("This promo code is invalid.")
        };
        //errorCode = "PMTPROMO70107";// test
        //errorCode = "error";
        if (show) {
            this.$.errorTips.setShowing(true);
            if (errorCode == "PMTPROMO70107") {
                //** TO DO need to verify get carrier
                // Get carrier id first for show
                var self = this;
                self.getCarrierSuccess = function(inSender, inResponse) {
                    var _carrier = status ? carrier : 'ROW';
                    errMessage = enyo.macroize($L('This promo code cannot be used with {$carrierName}.'), {
                        carrierName: _carrier
                    });
                    this.$.errorTips.setContent(enyo.macroize($L('{$error}'), {
                        error: errMessage
                    }));
                    self.$.systemproperties.destroy();
                };
                self.getCarrierFailure = function(inSender, inResponse) {
                    var _carrier = 'this carrier';
                    errMessage = enyo.macroize($L('This promo code cannot be used with {$carrierName}.'), {
                        carrierName: _carrier
                    });
                    this.$.errorTips.setContent(enyo.macroize($L('{$error}'), {
                        error: errMessage
                    }));
                    self.$.systemproperties.destroy();
                };
                self.createComponent({
                    name: "systemproperties",
                    kind: "findApps.SystemProperties"
                });
                self.$.systemproperties.getCarrier("getCarrierSuccess", "getCarrierFailure");
            } else {
                errMessage = errorMessages[errorCode];
                if (errMessage) {
                    // Show inline message			        
                    this.$.errorTips.setContent(enyo.macroize($L('{$error}'), {
                        error: errMessage
                    }));
                }
            }
            this.$.promoCode.forceFocus();
        } else {
            this.$.errorTips.setShowing(false);
        }
    },
    checkPromoCodeStatusSuccess: function(inSender, inResponse, inRequest, inProps) {
        var self = this;
        if (inResponse && inResponse.OutCheckPromoCodeStatus) {
            if (inResponse.OutCheckPromoCodeStatus.valid == "true") {
                this._displayErrors(false);
                this.doPromoCodeConfirmed({
                    promoCodeValid: true,
                    status: inResponse.OutCheckPromoCodeStatus.status,
                    promoCode: this.promoCodeValue
                });
            } else if (inResponse.OutCheckPromoCodeStatus.valid == "false") {
                // invalid code error
                this.$.promoCodeDiscript.setContent(enyo.macroize($L('Enter promo code to download {$title}.'), {
                    title: self.params.title
                }));
                if (inResponse.OutCheckPromoCodeStatus.errorCode) {
                    this._displayErrors(true, inResponse.OutCheckPromoCodeStatus.errorCode);
                } else {
                    this._displayErrors(true, "INVALID");
                }
            }
        }
    },
    checkPromoCodeStatusFailure: function(inSender, inResponse, inRequest, inProps, errors) {
        var self = this;
        if (inResponse.JSONException.errorCode && inResponse.JSONException.errorCode == "PMTPROMO70010") {
            // invalid code error		
            this.$.promoCodeDiscript.setContent(enyo.macroize($L('Enter promo code to download {$title}.'), {
                title: this.params.title
            }));
            this._displayErrors(true, inResponse.errorCode);
            this.$.promoCode.doFocus();
        } else if (inResponse.JSONException.errorCode) {
            var err = inResponse.JSONException.errorCode;
            this._displayErrors(true, err);
        }
    },
    _checkPromoCodeStatus: function() {
        this._verifyAttemptCount++;
        this.promoCodeValue = this.$.promoCode.getValue();
        // Filter space
        this.promoCodeValue = this.promoCodeValue.replace(/ /g, '');
        var appid = this.params.appid;
        var version = this.params.version;
        //sample on sbdev
        //promoCode = "21e6db8c-092c-48a7-a686-acf8e0ac6e3d";//GP code 
        if ((this.promoCodeValue.length < 1) || (this.promoCodeValue.length > 64)) {
            this._displayErrors(true, "INVALID");
        } else if (!enyo.application.connectionManager.isOnline()) {
            this._displayErrors(false);
        } else {
            findApps.BaseServer.getPMTServer().checkPromoCodeStatus(this.promoCodeValue, appid, version, "", {
                onSuccess: "checkPromoCodeStatusSuccess",
                onFailure: "checkPromoCodeStatusFailure",
                scope: this
            });
        }
    },
    focusPromoInput: function() {
        if(this.$.promoCode.getValue().length>0) {
            this.$.promoCode.forceSelect();
        } else {
            this.$.promoCode.forceFocus();
        }
    }
});
