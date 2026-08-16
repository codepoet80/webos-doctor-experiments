/* Catalog.appStates
  
  Global objects that represent all possible states for
  a catalog application's download process.
  
  State and Flyweight patterns combined.
  That is, State objects are flyweight.
  
  All per-download information like application id, price, location etc
  is saved in an instance of appdownload object. State objects are shared
  between all appdownload instances. They contain no extrinsic state.
  
  Client (e.g. details scene) obtains an instance of appdownload object 
  from the appdownloadmanager. This will be either an existing download or 
  new download object. Client then makes calls on this download object for example:
  
  appdownload->install
  
  appdownload object delegates the call to it's current state passing 
  itself as an argument:
  
  appdownload::install 
  {
  		this->_currentState->install(this);
  }
  
  
  Client subscribes as a listener on appdownload object.
  When state of the download changes, appdownload object notifies 
  all its current listeners which can then update their UI from the 
  download object model.
  
  
  State interface:
  
  
   initializes app's internal data based on the current state
    for example, progress pill model and css classes used in MyApps scene
     are changed with every state change
      
     init(app) 
     updates internal data from app details
     installed state, refreshing data from the server might cause it
     to switch to "installed update available" state if server's version is 
      higher
       
      updateFromServer(app)
      updates internal state from app details
      returned from palm://com.palm.applicationManager/listApps.
      For example: if app was in "findApps.AppState.Initial" state this will cause it
      to switch to "installed" state
      
      updateFromInstalledAppsList(app)
      called by details scene when user taps the progress pill.
	 Each state defines this method and depending on the current state 
	 of the object different thing will happen. If app is installed, 
	 it will be launched, if it's downloading it will be paused etc 
	defaultAction(app)
	
	 called by myapps scene when user taps the list item icon.
	 Each state defines this method and depending on the current state 
	 of the object different thing will happen. if app is downloading 
	 it will be paused etc 
	myAppsDefaultAction(app)
	
	 canceles download
	 only some states define this method (e.g "downloadprogress")
	cancelDownload: function(app)
	
	 uninstalls the application
	 only some states define this method, (e.g "installed" state)
	uninstall: function(app)
	
	 resets the state of the object usually on error
	 it will forget about the current error and return the object back to
	 "download", "purchased" or "installed" state
	_reset: function(app)
	
	 resets the state of the object upon uninstalled notification
	_remove: function(app)
	
	 installs the application
	install: function(app)
	
	 returns true if download object in the current state should
	 be saved to myapps list maintained by appdownloadmanager.
	 appdownloadmanager listens for state changes on all existing
	 download objects and decides which ones should be saved to myApps list.
	 The general rule is: any downloads in progress + installed applications
	saveToMyApps: function()
	
	 returns true if download object in the current state should
	 be removed from myapps list maintained by appdownloadmanager.
	 appdownloadmanager listens for state changes on all existing
	 download objects and decides which ones should be saved/removed to/from myApps list.
	 The general rule is: any downloads in progress + installed applications
	 if user decides to give up on a download (due to an error for example)
	 app will be reset back to "download" state and removed from myApps list
	removeFromMyApps: function()
	
	 returns current state's string identifier
	toString: function()
 */
enyo.kind({
    name: "findApps.DownloadStateManager",
    kind: enyo.Control,
    components: [{
        name: "appinstallservice",
        kind: "findApps.AppInstallService"
    }, {
        name: "applicationinstaller",
        kind: "findApps.ApplicationInstaller"
    }, {
        name: "userAuthenticator",
        kind: "findApps.UserAuthenticator"
    }],
    _1xCarrierDialog: function(carrier) {
        var randomNum = "";
        if (carrier) {
            if (carrier == "sprint") {
                randomNum = this._createPopup($L("No 3G Data Network"), $L("The app will download slowly because a high-speed network is not available. You can download later when you have a 3G or Wi-Fi data connection. If you paid for the app, you will not be charged again."), $L("Download Now"), $L("Download Later"));
            }
        } else {
            randomNum = this._createPopup($L("No 3G Data Network"), $L("You will be unable to receive phone calls while the application is downloading. You can download later when you have a 3G or Wi-Fi data connection. If you paid for the app, you will not be charged again."), $L("Download Now"), $L("Download Later"));
        };
        return randomNum;
    },
    create: function() {
    	this.inherited(arguments);
    	var topContainer = findApps.ViewLibrary._container;
        if (topContainer && topContainer.registerObserver) {
            topContainer.registerObserver("resize", this);
        }
    },
    update: function(eventName) {
       if (eventName == "resize") {
    	   if(this.$.promocodeeditor && this.$.promocodeeditor.isOpen) {
    		   this.$.promocodeeditor.resizeHandler();
    	   }
        }
    },
    _createPopup: function(title, message, caption1, caption2) {
        var rand = findApps.Utilities.getRandNumber();
        this.createComponent({
            kind: "ModalDialog",
            modal: true,
            scrim: true,
            name: "popupPrompt" + rand,
            components: [{
                className: "",
                content: title,
                className: "enyo-text-header",
                style: "text-align:center;"
            }, {
                className: "",
                content: message,
                className: "enyo-paragraph"
            }, {
                kind: "VFlexBox",
                style: "padding-top: 6px;",
                components: [
                {
                    kind: "Button",
                    className: "enyo-button-affirmative",
                    value: "submit",
                    caption: caption1,
                    onclick: "submit" + rand
                }, {
                    kind: "Button",
                    className: "enyo-button-light",
                    value: "cancel",
                    caption: caption2,
                    onclick: "submit" + rand
                }
                ]
            }],
            owner: this
        });
        return rand;
    },
    _verifyPaymentSetupSuccess: function(inSender, inResponse, inRequest, inProps) {
        findApps.UserProfile.validPayment = inResponse;
        inProps.callback(true, inResponse);
    },
    _verifyPaymentSetupFailure: function(inSender, inResponse, inRequest, inProps, errors) {
        inProps.callback(false, inResponse, errors);
    },
    _verifyPaymentSetup: function(callback) {
        // Note: This had to be commented out so that the payment status is verified each time
        /*if (findApps.UserProfile.validPayment !== undefined)
		{
			callback(true, findApps.UserProfile.validPayment);
		}
		else
		{*/
        // another state while checking payment setup?
        // but that step is not very critical, so what if we check it twice
        findApps.BaseServer.getPMTServer().verifyPaymentSetup("DsVerifyPaymentSvc", {
            onSuccess: "_verifyPaymentSetupSuccess",
            onFailure: "_verifyPaymentSetupFailure",
            scope: this,
            callback: callback
        });
    //}
    },
    // Get promo code from on-device database: 'promoDB'
    // callback: function(promocode)
    _getPromoFromDBExt: function(callback) {
        callback(true, enyo.getCookie("findapps.promocode"));
    },
    // Get promo code from on-device database: 'promoDB'
    // callback: function(promocode)
    _savePromoFromDBExt: function(promoCode) {
        enyo.setCookie("findapps.promocode", promoCode);
    },
    _capturePaymentPromoSuccess: function(inSender, inResponse, inRequest, inProps) {
        var app = inProps.app;
        // Payment successful - download
        app.setState("findApps.AppState.Purchased", {
            version: app.serverVersion,
            transitional: true
        });
        if (inResponse && inResponse.OutCapturePayment && inResponse.OutCapturePayment.promoCodeStatus == "R") {
            enyo.setCookie("findapps.promocode", "");
        }
        inProps.callback(true);
    },
    _capturePaymentPromoFailure: function(inSender, inResponse, inRequest, inProps, errors) {
        var app = inProps.app;
        app.setState("findApps.AppState.PurchaseFailed", {
            errorStack: errors
        });
    },
    // To purchase the application with promo code then start download
    _purchaseWithPromoCode: function(app, code, inResponse, callback) {
        // User has validate the purchase - we make it now.
        var d = app;
        var now = new Date();
        var ms = '' + now.getMilliseconds();
        while (ms.length < 3) { // pad out to 3 places
            ms = '0' + ms;
        }
        var timestamp = findApps.Utilities.Formatter.serverTimeFormat(now) + ms; // Format yyyyMMddHHmmssSSS
        var orderObj = {
            timestamp: timestamp,
            currency: d.currency,
            items: [{
                type: d.priceType,
                promoCode: code,
                quantity: "1",
                sku: d.sku,
                unitPrice: d.price
            }]
        };
        app.setState("findApps.AppState.Purchasing");
        
        findApps.BaseServer.getPMTServer().capturePayment(orderObj, "DsCapturePaymentSvc", {
            onSuccess: "_capturePaymentPromoSuccess",
            onFailure: "_capturePaymentPromoFailure",
            scope: this,
            app: app,
            callback: callback
        });
    },
    /// To go to promo code dialog to let user edit the promo code
    _gotoPromoCodeDialog: function(app, pcode, eCode, inResponse, force, callback) {
        var self = this;
        this.promoCodeConfirmed = function(inSender, info) {
            if (info.promoCodeValid) {
                self.owner.$.downloadStateManager._purchaseWithPromoCode(app, info.promoCode, inResponse, callback);
            } else {
                self.owner.$.downloadStateManager._makePurchase(app, inResponse, force, callback);
            }
            popup.close();
            popup.destroy();
        };
        this.promoCodeCanceled = function() {
            popup.close();
            popup.destroy();
            app.setState("findApps.AppState.Download");
            callback(false);
        };
        var theParams = {
            appid: app.publicApplicationId,
            version: app.serverVersion,
            title: app.title,
            promoCode: pcode,
            errCode: eCode
        };
        if (this.$.promocodeeditor == undefined) {
            this.createComponent({
                lazy: false,
                name: "promocodeeditor",
                kind: "findApps.PromoCodePrompt",
                onPromoCodeConfirmed: "promoCodeConfirmed",
                onPromoCodeCanceled: "promoCodeCanceled",
                owner: this
            });
        }
        var popup = this.$.promocodeeditor;
        popup.setParams(theParams);
        popup.render();
        popup.openAtCenter();
        popup.focusPromoInput();
        
    },
    _checkPromoCodeStatusSuccess: function(inSender, inResponse, inRequest, inProps) {
        var app = inProps.app;
        var force = inProps.force;
        var callback = inProps.callback;
        var promoCode = inProps.promoCode;
        var errorCode = inProps.errorCode;
        var gotoPromoCodeEditor = inProps.gotoPromoCodeEditor;
        var delPromoCode = inProps.delPromoCode;
        
        if (inResponse && inResponse.OutCheckPromoCodeStatus) {
            if (inResponse.OutCheckPromoCodeStatus.valid == "true") {
                // Promo code is valid, start to purchase 
                this.owner.$.downloadStateManager._purchaseWithPromoCode(app, promoCode, inResponse, callback);
            } else if (inResponse.OutCheckPromoCodeStatus.valid == "false") {
                // Promo code is invalid, go to editor
                gotoPromoCodeEditor = true;
                errorCode = inResponse.OutCheckPromoCodeStatus.errorCode;
                if ((errorCode == "PMTPROMO70101") || (errorCode == "PMTPROMO70102") || (errorCode == "PMTPROMO70103") || (errorCode == "PMTPROMO70104")) {
                    // If error is redeemed, revoked, expired,suspended,to delete the promo code from database.
                    delPromoCode = true;
                }
            }
        }
        if (gotoPromoCodeEditor) {
            // Promo code is invalid, go to editor
            this.owner.$.downloadStateManager._gotoPromoCodeDialog(app, promoCode, errorCode, inResponse, force, callback);
        }
        if (delPromoCode) {
            this.owner.$.downloadStateManager._savePromoFromDBExt("");
        }
    },
    _checkPromoCodeStatusFailure: function(inSender, inResponse, inRequest, inProps, errors) {
        var app = inProps.app;
        var force = inProps.force;
        var callback = inProps.callback;
        var promoCode = inProps.promoCode;
        var errorCode = inProps.errorCode;
        
        if (inResponse.JSONException && inResponse.JSONException.errorCode) {
            errorCode = inResponse.JSONException.errorCode;
        }
        // Promo code is invalid, go to editor
        this.owner.$.downloadStateManager._gotoPromoCodeDialog(app, promoCode, errorCode, inResponse, force, callback);
        this.owner.$.downloadStateManager._savePromoFromDBExt("");
    },
    // To verify the promo code then start download
    _verifyPromoCode: function(app, inResponse, force, callback) {
        var self = this;
        var gotoPromoCodeEditor = false;
        var delPromoCode = false;
        var errorCode = "";
        var promoCode = "";
        // Get promo code from cookie
        self.owner.$.downloadStateManager._getPromoFromDBExt(function(status, code) {
            promoCode = code;
            //test
            //promoCode = "invalidcode";
            //promoCode = "21e62270-96e1-4172-8b37-6559925f244b";
            if ((promoCode != undefined) && (promoCode != "")) {
                findApps.BaseServer.getPMTServer().checkPromoCodeStatus(promoCode, app.publicApplicationId, app.serverVersion, "DsCheckPromoCodeSvc", {
                    onSuccess: "_checkPromoCodeStatusSuccess",
                    onFailure: "_checkPromoCodeStatuscbFailure",
                    scope: self,
                    app: app,
                    force: force,
                    callback: callback,
                    promoCode: promoCode,
                    errorCode: errorCode,
                    gotoPromoCodeEditor: gotoPromoCodeEditor,
                    delPromoCode: delPromoCode
                });
            } else {
                // Promo code is empty, go to editor
                promoCode = "";
                errorCode = "";
                self.owner.$.downloadStateManager._gotoPromoCodeDialog(app, promoCode, errorCode, inResponse, force, callback);
            }
        });
    },
    _makePurchase: function(app, inResponse, force, callback) {
        var self = this;
        // inResponse is from getPaymentInfos
        var cc = (inResponse.OutGetPaymentInfos.ccPaymentInfos && inResponse.OutGetPaymentInfos.ccPaymentInfos.length > 0) ? inResponse.OutGetPaymentInfos.ccPaymentInfos[0] : null;
        var ob = (inResponse.OutGetPaymentInfos.obPaymentInfos && inResponse.OutGetPaymentInfos.obPaymentInfos.length > 0) ? inResponse.OutGetPaymentInfos.obPaymentInfos[0] : null;
        if (force) {
            // Forcing a payment type
            // Null out the other
            if (force == "cc") {
                ob = null;
            } else {
                cc = null;
            }
        }
        if (cc && ob) {
            // Both types of payment are set up: choose the default by nulling the other
            if (cc["default"]) {
                ob = null;
            } else {
                cc = null;
            }
        }
        if (cc) {
            app.paymentType = "cc";
        } else if (ob) {
            app.paymentType = "ob";
        } else {
            app.setState("findApps.AppState.Download");
            callback(false);
            return;
        }
        if (!enyo.application.connectionManager.isOnline()) {
            app.setState("findApps.AppState.Download");
            callback(false);
            return;
        }
        var accountName = (cc ? "credit card" : "carrier account");
        var rand = findApps.Utilities.getRandNumber();
        this["confirmPurchase" + rand] = function() {
            self.$["purchaseconfirm" + rand].close();
            self.cleanupInMakePurchase(rand);
            // User has validate the purchase - we make it now.
            // Set the state as "findApps.AppState.Purchasing"
            app.setState("findApps.AppState.Purchasing");
            if (ob) {
                self._startOBPayment(app, ob, callback);
            } else {
                self._capturePayment(app, cc, callback);
            }
        };
        this["confirmPromo" + rand] = function() {
            self.$["purchaseconfirm" + rand].close();
            self.cleanupInMakePurchase(rand);
            self.owner.$.downloadStateManager._verifyPromoCode(app, inResponse, force, callback);
        };
        this["cancelDialog" + rand] = function() {
            self.$["purchaseconfirm" + rand].close();
            self.cleanupInMakePurchase(rand);
            app.setState("findApps.AppState.Download");
            callback(false);
        };
        this.cleanupInMakePurchase = function(rand) {
            self.$["purchaseconfirm" + rand] && self.$["purchaseconfirm" + rand].destroy();
            findApps.Utilities.delFunc(self, "confirmPurchase", rand);
            findApps.Utilities.delFunc(self, "confirmPromo", rand);
            findApps.Utilities.delFunc(self, "cancelDialog", rand);
        };
        this.createComponent({
            lazy: false,
            name: "purchaseconfirm" + rand,
            kind: "findApps.PurchaseConfirmPrompt",
            account: accountName,
            title: app.title,
            onPurchase: "confirmPurchase" + rand,
            onPromo: "confirmPromo" + rand,
            onCancel: "cancelDialog" + rand,
            owner: this
        });
        this.$["purchaseconfirm" + rand].render();
        this.$["purchaseconfirm" + rand].openAtCenter();
    },
    _initOBSessionSuccess: function(inSender, inResponse, inRequest, inProps) {
        var app = inProps.app;
        var ob = inProps.ob;
        var callback = inProps.callback;
        var obInfos = inProps.obInfos;
        // Sample:
        //<?xml version="1.0" encoding="UTF-8" standalone="yes"?><session xmlns="http://payment.openmarket.com/appbilling/v1" state="ACTIVE" phoneNumber="14084314136" id="YEp10McY27uY4038ar08"><carrier id="383">ATT</carrier></session>
        //
        this.log("xml", inResponse);
        var xmlparser = new DOMParser();
        var xmlResponse = xmlparser.parseFromString(inResponse, "text/xml");
        // Get ID from XML and add to paymentInfo
        ob.obSessionId = xmlResponse.getElementsByTagName("session")[0].getAttribute("id");
        // Add polling info to ob info
        ob.devicePoll = obInfos.devicePoll;
        this._capturePayment(app, ob, callback);
    },
    _initOBSessionFailure: function(inSender, inResponse, inRequest, inProps, errors) {
        var app = inProps.app;
        var errorCode;
        var err;
        if (inResponse && inResponse.getElementsByTagName && inResponse.getElementsByTagName("error")) {
            errorCode = inResponse.getElementsByTagName("error")[0].getAttribute("code");
        }
        if(errorCode) {
            errors.push(errorCode);
            if (errorCode === 2045 || errorCode === 2126) {
                // Use PMT05213, carrier not supported for these OpenMarket errors
                err = "PMT05213";
            } else {
                err = errorCode ? ("PMTINIT" + errorCode) : undefined;
            }
            errors.push("errCode:" + errorCode); //pushing this for diagnostics purposes
            if(err)
                errors.push(err);
        }
        app.setState("findApps.AppState.PurchaseFailed", {
            errorStack: errors
        });
    },
    _getOBInfosSuccess: function(inSender, inResponse, inRequest, inProps) {
        var app = inProps.app;
        var ob = inProps.ob;
        var callback = inProps.callback;
        var obInfos = inResponse.OutGetOBInfos;
        // Sample:
        //{"OutGetOBInfos": {"devicePoll": {"period": 1, "timeout": 5}, "initSession": {"submitMethod": "POST", "URL": "http://payment-cie.openmarket.com/appbilling/v1/session"}}}
        //
        
        findApps.BaseServer.getPMTServer().initOBSession(obInfos, "initOBSessioncb", {
            onSuccess: "_initOBSessionSuccess",
            onFailure: "_initOBSessionFailure",
            scope: this,
            app: app,
            ob: ob,
            callback: callback,
            obInfos: obInfos
        });
    },
    _getOBInfosFailure: function(inSender, inResponse, inRequest, inProps, errors) {
        inProps.app.setState("findApps.AppState.PurchaseFailed", {
            errorStack: errors
        });
    },
    _startOBPayment: function(app, ob, callback) {
        // getOBInfos gets a URL
        // initSession hits that URL and gets a sessionID
        // Capturepayment sends the sessionID
        findApps.BaseServer.getPMTServer().getOBInfos("", {
            onSuccess: "_getOBInfosSuccess",
            onFailure: "_getOBInfosFailure",
            scope: this,
            app: app,
            ob: ob,
            callback: callback
        });
    },
    cleanupInCapturePayment: function(rand) {
        this.$["paymentserver" + rand] && this.$["paymentserver" + rand].destroy();
        findApps.Utilities.delFunc(this, "capturePaymentFailure", rand);
        findApps.Utilities.delFunc(this, "capturePaymentSuccess", rand);
        this.$["temperror" + rand] && this.$["temperror" + rand].destroy();
        findApps.Utilities.delFunc(this, "OnCancel", rand);
    },
    _capturePaymentSuccess: function(insender, inResponse, inRequest, inProps) {
        var app = inProps.app;
        var paymentInfo = inProps.paymentInfo;
        var callback = inProps.callback;
        // Payment successful - download
        if (paymentInfo.devicePoll) {
            // We need to poll for order completion
            /* Sample: {"OutCapturePayment": {"orderNo": 427}} */
            var orderNo = inResponse.OutCapturePayment.orderNo;
            var pollingEnds = new Date().getTime() + (paymentInfo.devicePoll.timeout * 1000);
            var pollingInterval = (paymentInfo.devicePoll.period * 1000);
            this._pollForOrderStatus(app, orderNo, pollingEnds, pollingInterval, callback);
        } else {
            // Order successful
            app.setState("findApps.AppState.Purchased", {
                version: app.serverVersion,
                transitional: true
            });
            callback(true);
        }
    },
    _capturePaymentFailure: function(insender, inResponse, inRequest, inProps, errors) {
        var app = inProps.app;
        errors = ["LOC04007"];
        var serverErrCode = (inResponse && inResponse.JSONException && inResponse.JSONException.errorCode) ? inResponse.JSONException.errorCode : inResponse;
        if (serverErrCode !== "") errors.push(serverErrCode);
        if (serverErrCode === "PMT03037") { // You have already purchased this app
            app.setState("findApps.AppState.Purchased", {
                version: app.serverVersion,
                transitional: true
            });
            app.install();
            var rand = findApps.Utilities.getRandNumber();
            var that = this;
            this["OnCancel" + rand] = function() {
                that.cleanupInCapturePayment(rand);
            };
            this.createComponent({
                name: "temperror" + rand,
                kind: "findApps.Error",
                onCancel: "OnCancel" + rand,
                owner: this
            }).displayError(errors);
        } else {
            app.setState("findApps.AppState.PurchaseFailed", {
                errorStack: errors
            });
        }
    },
    _capturePayment: function(app, paymentInfo, callback) {
        var d = app;
        var now = new Date();
        var ms = '' + now.getMilliseconds();
        while (ms.length < 3) { // pad out to 3 places
            ms = '0' + ms;
        }
        var timestamp = findApps.Utilities.Formatter.serverTimeFormat(now) + ms; // Format yyyyMMddHHmmssSSS
        var orderObj = {
            paymentInfoId: paymentInfo.paymentInfoId,
            obSessionId: paymentInfo.obSessionId,
            timestamp: timestamp,
            currency: d.currency,
            items: [{
                type: d.priceType,
                quantity: "1",
                sku: d.sku,
                unitPrice: d.price
            }]
        };
        
        findApps.BaseServer.getPMTServer().capturePayment(orderObj, "", {
            onSuccess: "_capturePaymentSuccess",
            onFailure: "_capturePaymentFailure",
            scope: this,
            app: app,
            paymentInfo: paymentInfo,
            callback: callback
        });
    },
    cleanupPollForOrderStatus: function(rand) {
        this.$["paymentserver" + rand] && this.$["paymentserver" + rand].destroy();
        findApps.Utilities.delFunc(this, "getOrderStatuscb", rand);
        findApps.Utilities.delFunc(this, "getOrderStatuscbFailure", rand);
    },
    _getOrderStatusSuccess: function(insender, inResponse, inRequest, inProps) {
        var app = inProps.app;
        var orderNo = inProps.orderNo;
        var pollingEnds = inProps.pollingEnds;
        var pollingInterval = inProps.pollingInterval;
        var callback = inProps.callback;
        var errors = [];
        switch (inResponse.OutGetOrderStatus.status) {
            case "NEW":
            case "RENEWED":
                // More polling
                if (new Date().getTime() < pollingEnds) {
                    setTimeout(this._pollForOrderStatus.bind(this, app, orderNo, pollingEnds, pollingInterval, callback), pollingInterval);
                } else {
                    errors.push("LOC04016");
                    // Timed out
                    app.setState("findApps.AppState.PurchasePending", {
                        errorStack: errors
                    });
                    callback(false);
                }
                break;
            case "CLOSED":
                // Success
                app.setState("findApps.AppState.Purchased", {
                    version: app.serverVersion,
                    transitional: true
                });
                callback(true);
                break;
            case "DECLINED":
                // Declined
                errors.push("LOC04017");
                errors.push(inResponse.OutGetOrderStatus.code || inResponse);
                app.setState("findApps.AppState.PurchaseFailed", {
                    errorStack: errors
                });
                break;
            default:
                // Undefined behaviour
                errors.push("LOC04018");
                app.setState("findApps.AppState.PurchasePending", {
                    errorStack: errors
                });
        }
    },
    _getOrderStatusFailure: function(insender, inResponse, inRequest, inProps, errors) {
        var app = inProps.app;
        errors.push("LOC04019");
        // Failure
        app.setState("findApps.AppState.PurchasePending", {
            errorStack: errors
        });
    },
    _pollForOrderStatus: function(app, orderNo, pollingEnds, pollingInterval, callback) {
        findApps.BaseServer.getPMTServer().getOrderStatus(orderNo, "", {
            onSuccess: "_getOrderStatusSuccess",
            onFailure: "_getOrderStatusFailure",
            scope: this,
            app: app,
            orderNo: orderNo,
            pollingEnds: pollingEnds,
            pollingInterval: pollingInterval,
            callback: callback
        });
    },
    // set only the current state of this function, "validating_cc"
    // in case of error it's up to the caller to restore previous state
    _handleVerifyPayment: function(app, valid, force, callback) {
        var self = this;
        var outerCallback = callback;
        this.owner.$.downloadStateManager._verifyPaymentSetup(function(status, inResponse, errors) {
            if (status) {
                if ((inResponse.OutGetPaymentInfos.ccPaymentInfos && inResponse.OutGetPaymentInfos.ccPaymentInfos.length > 0) || (inResponse.OutGetPaymentInfos.obPaymentInfos && inResponse.OutGetPaymentInfos.obPaymentInfos.length > 0)) {
                    // check if user needs to enter password
                    if (!valid) {
                        self.owner.$.downloadStateManager.$.userAuthenticator.setNextView(undefined);
                        self.owner.$.downloadStateManager.$.userAuthenticator.setCallback(function(ret) {
                            if (ret.passwordValid) {
                                self.owner.$.downloadStateManager._makePurchase(app, inResponse, force, callback);
                            } else {
                                callback(false);
                            }
                        });
                        self.owner.$.downloadStateManager.$.userAuthenticator.showProfilePassword();
                    } else {
                        self.owner.$.downloadStateManager._makePurchase(app, inResponse, null, callback);
                    }
                } else {
                    // forward to set up account
                    if (findApps.UserProfile.promoLink) {
                        self.okHandler = function() {
                            promoCodePopup.close();
                            promoCodePopup.destroy();
                            findApps.UserProfile.promoLink = false;
                            this.showPaymentSetup(app, callback, null)
                        };
                        var promoCodePopup = self.createComponent({
                            lazy: false,
                            name: "promoCodeConfirm",
                            kind: "findApps.PromoCodeConfirmPrompt",
                            title: app.title,
                            onOK: "okHandler",
                            owner: self
                        });
                        promoCodePopup.render();
                        promoCodePopup.openAtCenter();
                    } else {
                        // User needs to set up payment before item can be purchased
                        var prefView = findApps.ViewLibrary.getView("PREFERENCES");
                        prefView.setShowPaymentSetup(true);
                        prefView.setCallback(function(ret) {
                            if (ret.accountValid) {
                                self.owner.$.downloadStateManager._handleVerifyPayment(app, true, null, callback);
                            } else {
                                callback(false);
                            }
                        });
                    }
                }
            } else {
                self.owner.$.downloadStateManager.OnCancel = function(inSender, value) {
                    self.owner.$.downloadStateManager.$.temperror.destroy();
                    if(value == "help") {
                        findApps.ApplicationManager.getInstance().openApplication('com.palm.app.help', {
                            target: enyo.application.connectionManager.isOnline() ? 'http://help.palm.com/app_catalog/appcatalog_download_error.html' : 'no-network'
                        });
                    }
                };
                self.owner.$.downloadStateManager.createComponent({
                    name: "temperror",
                    kind: "findApps.Error",
                    onSubmit: "OnCancel",
                    onCancel: "OnCancel",
                    owner: self.owner.$.downloadStateManager
                });
                errors.push("LOC04006");
                var errorCode = "";
                if (inResponse.JSONException && inResponse.JSONException.errorCode) {
                    errorCode = inResponse.JSONException.errorCode;
                    errors.push(errorCode);
                }
                self.owner.$.downloadStateManager.$.temperror.displayError(errors);
                outerCallback(false);
            }
        });
    },
    cleanupInHandleEmbargoAcc: function(rand) {
        this.$["temperror" + rand] && this.$["temperror" + rand].destroy();
        findApps.Utilities.delFunc(this, "OnSubmit", rand);
        findApps.Utilities.delFunc(this, "OnCancel", rand);
    },
    _handleEmbargoAcc: function(app, callback) {
        var that = this;
        var rand = findApps.Utilities.getRandNumber();
        if (findApps.UserProfile.isEmbargoed) {
            var errors = ["LOC04008"];
            that["OnSubmit" + rand] = function() {
                findApps.ApplicationManager.getInstance().openApplication('com.palm.app.help', {
                    target: enyo.application.connectionManager.isOnline() ? 'http://help.palm.com/app_catalog/appcatalog_download_error.html' : 'no-network'
                });
                that.cleanupInHandleEmbargoAcc(rand);
            };
            that["OnCancel" + rand] = function() {
                that.cleanupInHandleEmbargoAcc(rand);
            };
            that.createComponent({
                name: "temperror" + rand,
                kind: "findApps.Error",
                onSubmit: "OnSubmit" + rand,
                onCancel: "OnCancel" + rand,
                owner: that
            }).displayError(errors);
            callback(false);
        } else {
            callback(true);
        }
    },
    cleanupInCheckNotEmbargoed: function(rand) {
        this.$["paymentserver" + rand] && this.$["paymentserver" + rand].destroy();
        findApps.Utilities.delFunc(this, "embargolistcb", rand);
        findApps.Utilities.delFunc(this, "embargolistcbFailure", rand);
        this.$["temperror" + rand] && this.$["temperror" + rand].destroy();
        findApps.Utilities.delFunc(this, "OnCancel", rand);
    },
    _embargolistSuccess: function(inSender, inResponse, inRequest, inProps) {
        var app = inProps.app;
        var callback = inProps.callback;
        var ext = inProps.ext;
        findApps.AccountServices.embargoedList = inResponse.OutGetEmbargoedEmailExtensions.embargoedEmailExtensions;
        findApps.UserProfile.isEmbargoed = findApps.AccountServices.embargoedList.indexOf(ext) !== -1;
        this._handleEmbargoAcc(app, callback);
    },
    _embargolistFailure: function(inSender, inResponse, inRequest, inProps, errors) {
        errors.push("LOC04005");
        var rand = findApps.Utilities.getRandNumber();
        var that = this;
        this["OnCancel" + rand] = function() {
            //TODO can the following cleanup never be called by clicking outside the modal box
            that.cleanupInCheckNotEmbargoed(rand);
        };
        this.createComponent({
            name: "temperror" + rand,
            kind: "findApps.Error",
            onCancel: "OnCancel" + rand,
            owner: this
        }).displayError(errors);
                        
        // Callback with false
        inProps.callback(false);
    },
    _checkNotEmbargoed: function(app, callback) {
        if (app.price > 0 || app.isEncrypted) {
            if (findApps.UserProfile.isEmbargoed !== undefined) {
                this._handleEmbargoAcc(app, callback);
            } else {
                var ext = findApps.UserProfile.email.substring(findApps.UserProfile.email.lastIndexOf(".") + 1);
                if (findApps.AccountServices.embargoedList) {
                    findApps.UserProfile.isEmbargoed = findApps.AccountServices.embargoedList.indexOf(ext) !== -1;
                    this._handleEmbargoAcc(app, callback);
                } else {
                    findApps.BaseServer.getPMTServer().getEmbargoedEmailExtensions("DSEmbargoedExtnsSvc", {
                        onSuccess: "_embargolistSuccess",
                        onFailure: "_embargolistFailure",
                        scope: this,
                        app: app,
                        callback: callback,
                        ext: ext
                    });
                }
            }
        } else callback(true);
    },
    _forcePaymentType: function(app, type) {
        var self = this;
        var callback = function(status) {
            if (status) {
                self.owner.$.downloadStateManager._install(app);
            } else {
                // reset back in case of error
                app.setState("findApps.AppState.Download");
            }
        };
        app.setState("findApps.AppState.Download");
        if (type == "cc") {
            if (findApps.UserProfile.validPayment.OutGetPaymentInfos.ccPaymentInfos && findApps.UserProfile.validPayment.OutGetPaymentInfos.ccPaymentInfos.length > 0) {
                // Have a valid CC
                this._makePurchase(app, findApps.UserProfile.validPayment, "cc", callback)
            } else {
                //set up cc
                this.showPaymentSetup(app, callback, "cc");
            }
        } else { // type == "ob"
            if (findApps.UserProfile.validPayment.OutGetPaymentInfos.obPaymentInfos && findApps.UserProfile.validPayment.OutGetPaymentInfos.obPaymentInfos.length > 0) {
                // Have a valid OB
                this._makePurchase(app, findApps.UserProfile.validPayment, "ob", callback)
            } else {
                // Set up OB
                this.showPaymentSetup(app, callback, "ob");
            }
        }
    },
    showPaymentSetup: function(app, callback, force) {
        //set up cc
        var prefView = findApps.ViewLibrary.getView("PREFERENCES");
        prefView.setShowPaymentSetup(true);
        var self = this;
        prefView.setCallback(function(ret) {
            if (ret.accountValid) {
                self._handleVerifyPayment(app, true, force, callback);
            } else {
                callback(false);
            }
        });
    },
    cleanupInLocationServices: function(random) {
        this.$["popupPrompt" + random] && this.$["popupPrompt" + random].destroy();
        findApps.Utilities.delFunc(this, "submit", random);
    }
    ,
    _handleLocationServices: function(app, callback) {
        var self = this;
        if (app.islocationbased) {
            var random = this._createPopup($L('Location Services'), $L('This application will request your current location for some functions.'), $L("Continue"), $L("Cancel"));
            this["submit" + random] = function(inSender, e) {
                self.$["popupPrompt" + random].close();
                if (inSender.value == "submit") {
                    callback(true);
                } else if (inSender.value == "cancel") {
                    callback(false);
                }
                self.cleanupInLocationServices(random);
            };
            
            this.$["popupPrompt" + random].render();
            this.$["popupPrompt" + random].openAtCenter();
        } else {
            callback(true);
        }
    },
    cleanupInValidateInstallSpace: function(rand) {
        findApps.Utilities.delFunc(this, "validateInstallSuccess", rand);
        findApps.Utilities.delFunc(this, "validateInstallFailure", rand);
        this.$["temperror" + rand] && this.$["temperror" + rand].destroy();
        findApps.Utilities.delFunc(this, "OnSubmit", rand);
        findApps.Utilities.delFunc(this, "OnCancel", rand);
    },
    validateInstallSpace: function(app, showError, callback) {
        var that = this;
        var rand = findApps.Utilities.getRandNumber();
        that["validateInstallSuccess" + rand] = function(inSender, inResponse) {
            
            that.log("In validateInstallSuccess ", inResponse.result);
            if (inResponse.result == 0 || inResponse.result == 4 || (enyo.application.onBrowser)) {
                callback(true);
                that.cleanupInValidateInstallSpace(rand);
            } else {
                that["validateInstallFailure" + rand](inSender, inResponse);
            }
        };
        that["validateInstallFailure" + rand] = function(inSender, inResponse) {
            that.error("validInstallFailure ", inResponse);
            var totalInstallSize;
            if (inResponse && inResponse.spaceNeededInKB) {
                totalInstallSize = parseInt(inResponse.spaceNeededInKB);
                totalInstallSize = totalInstallSize >= 1024 ? (findApps.Utilities.Formatter.formatRound2(totalInstallSize / 1024) + " " + $L("MB")) : totalInstallSize + " " + $L("KB");
            } else {
                totalInstallSize = $L("unknown MB");
            }
            that["OnSubmit" + rand] = function() {
                var online = enyo.application.connectionManager.isOnline();
                findApps.ApplicationManager.getInstance().openApplication('com.palm.app.help', {
                    target: online ? 'http://help.palm.com/basics/manage_applications/basics_delete_app_from_launcher.html' : 'no-network'
                });
                that.cleanupInValidateInstallSpace(rand);
            };
            that["OnCancel" + rand] = function() {
                that.cleanupInValidateInstallSpace(rand);
            };
            var errors = [];
            errors.push(showError);
            that.createComponent({
                name: "temperror" + rand,
                kind: "findApps.Error",
                onSubmit: "OnSubmit" + rand,
                onCancel: "OnCancel" + rand,
                owner: that
            }).displayError(errors, {
                installSize: totalInstallSize
            });
            callback(false);
        };
        that.$.applicationinstaller.validateInstall(app.publicApplicationId, app.packageSize, app.installSize, "validateInstallSuccess" + rand, "validateInstallFailure" + rand);
    },
    validateDownloadConnectionCleanup: function(rand) {
    
        this.$["popupPrompt" + rand] && this.$["popupPrompt" + rand].destroy();
        findApps.Utilities.delFunc(this, "submit", rand);
    }
    ,
    validateDownloadConnection: function(callback) {
        if (enyo.application.connectionManager.isOn1x()) {
            if (this.owner.canAllow1xDownload()) {
                // user already decided to allow 1x download
                callback(true);
            } else {
                var self = this;
                
                // Show the correct pop-up based on carrier
                var random = this._1xCarrierDialog(findApps.UserProfile.carrier);
                this["submit" + random] = function(inSender, e) {
                    self.$["popupPrompt" + random].close();
                    
                    if (inSender.value == "submit") {
                        self.owner.allow1xDownload(true, function(status) {
                            callback(status);
                        });
                    } else if (inSender.value == "cancel") {
                        callback(false);
                    }
                    
                    self.validateDownloadConnectionCleanup(random);
                };
                
	            
                this.$["popupPrompt" + random].render();
                this.$["popupPrompt" + random].openAtCenter();
            }
        } else if (enyo.application.connectionManager.isOnline()) {
            callback(true);
        } else {
            callback(false);
        }
    },
    _install: function(app) {
        var self = this;
        this.owner.$.downloadStateManager.validateDownloadConnection(function(status) {
            var oldState = app.stateToString();
            if (status) {
                app.setState("findApps.AppState.InitiatingDownload");
                self.installcb = function(inSender, inResponse) {};
                self.installfail = function(inSender, inResponse) {
                    // if we are still waiting revert to old state
                    if (app.stateToString() == "findApps.AppState.InitiatingDownload") app.setState(oldState)
                };
                self.$.appinstallservice.install(app, "installcb", "installfail");
            }
        //else
        //{
        //	// force refresh
        //	if (app.stateToString() == oldState)
        //		app.setState(oldState);
        //}
        });
    },
    _revert: function(app, revertableApp) {
        this.revertcb = function(inSender, inResponse) {};
        this.$.appinstallservice.installLocal(revertableApp, null, "revertcb");
    },
    _pause: function(app) {
        var oldState = app.stateToString();
        app.setState("findApps.AppState.Pausing");
        this.pausecb = function(inSender, inResponse) {
            // if we are still waiting revert to old state
            if (app.stateToString() == "findApps.AppState.Pausing") app.setState(oldState)
        };
        this.$.appinstallservice.pause(app.publicApplicationId, null, "pausecb");
    },
    _resume: function(app) {
        var self = this;
        self.owner.$.downloadStateManager.validateDownloadConnection(function(status) {
            if (status) {
                var oldState = app.stateToString();
                app.setState("findApps.AppState.Resuming");
                self.resumecb = function(inSender, inResponse) {
                    // if we are still waiting revert to old state
                    if (app.stateToString() == "findApps.AppState.Resuming") app.setState(oldState)
                };
                self.$.appinstallservice.resume(app.publicApplicationId, null, "resumecb");
            }
        });
    },
    _cancel: function(app) {
        var self = this;
        var oldState = app.stateToString();
        app.setState("findApps.AppState.Canceling");
        this.cancelcb = function(inSender, inResponse) {
            // if we are still waiting revert to old state
            if (app.stateToString() == "findApps.AppState.Canceling") app.setState(oldState)
        };
        this.$.appinstallservice.cancel(app.publicApplicationId, null, "cancelcb");
    },
    _uninstall: function(app) {
        var self = this;
        var oldState = app.stateToString();
        app.setState("findApps.AppState.Removing");
        this.uninstallremovecb = function(inSender, inResponse) {
            // if we are still waiting revert to old state
            if (app.stateToString() == "findApps.AppState.Removing") app.setState(oldState)
        };
        this.$.appinstallservice.remove(app.publicApplicationId, null, "uninstallremovecb");
    },
    _restore: function(app) {
        var self = this;
        if (app.errorCode == "FAILED_IPKG_INSTALL") {
            var oldState = app.stateToString();
            this.removecb = function(inSender, inResponse) {
                // if we are still waiting revert to old state
                if (app.stateToString() == "findApps.AppState.InstallFailed") app.setState(oldState)
            };
            self.$.appinstallservice.remove(app.publicApplicationId, null, "removecb");
        } else {
            self.owner.$.downloadStateManager._cancel(app);
        }
    },
    _reset: function(app) {
        if (app.installedVersion) {
            // we were installing an update
            if (app.serverVersion && findApps.Utilities.VersionCheck.compare(app.installedVersion, app.serverVersion) == -1) {
                app.setState("findApps.AppState.UpdateAvailable");
            } else {
                app.setState("findApps.AppState.Installed");
            }
        } else if (app.price && app.price > 0) {
            app.setState("findApps.AppState.Purchased");
        } else {
            app.setState("findApps.AppState.Download");
        }
    },
    _remove: function(app) {
        app.installedVersion = null;
        if (app.pendingRevert) {
            app.pendingRevert = false;
            app.setState("findApps.AppState.Download");
            // var newapp = null; //this.owner.getAppDownload(app.publicApplicationId);
            this.owner.$.downloadStateManager._revert(null, this.owner.getDetailsRevertableApp(app.publicApplicationId));
        } else {
            //app.icon = null;
            if (app.price && app.price > 0) {
                app.setState("findApps.AppState.Purchased");
            } else {
                app.setState("findApps.AppState.Download");
            }
        }
    }
    ,
    cleanupInFetchAppDetails: function(rand) {
        this.$["catalogServer" + rand] && this.$["catalogServer" + rand].destroy();
        findApps.Utilities.delFunc(this, "detailscb", rand);
        
        this.$["temperror" + rand] && this.$["temperror" + rand].destroy();
        findApps.Utilities.delFunc(this, "OnCancel", rand);
    },
    
    detailscb: function(inSender, inResponse, inRequest, props, errors) {
        if (errors && errors.length && errors.length > 0) {//errors exist
            errors.push("LOC04004");
            var rand = findApps.Utilities.getRandNumber();
            var that = this;
            this["OnCancel" + rand] = function() {
                that.cleanupInFetchAppDetails(rand);
            };
                
            this.createComponent({
                kind: "findApps.Error",
                name: "temperror" + rand, 
                onCancel: "OnCancel" + rand,
                owner: that
            }).displayError(errors);
            props.callback(false);
        } else {
            props.app.updateFromServer(inResponse.OutGetAppDetailV2.appDetail);
            props.callback(true);
        }
            
    },
    
    _fetchAppDetails: function(app, callback) {
        findApps.BaseServer.getACServer().getApplicationDetails(null, app.publicApplicationId, enyo.g11n.currentLocale().toISOString(), "GDBAppDetailsSvc", true, {
            onResponse: "detailscb",
            scope: this,
            app: app,
            callback: callback
        });
    }
});
