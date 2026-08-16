

enyo.kind({
    name: "findApps.SessionManager",
    kind: enyo.Object,

    listeners: {
        "userSession": [],
        "paymentTypes": []
    },

    initSessionInProgress: false,
    initPaymentTypesInProgress: false,
    paymentTypesError: false,
    sessionError: false,
    // Can this be made singleton?
    constructor: function() {
        // user/session call
        this.initSessionInProgress = false;
        this.sessionError = false;
		
        // payment types call
        this.initPaymentTypesInProgress = false;
        this.paymentTypesError = false;
		
        this.inherited(arguments);
    },
	
    // Make the /user/session call
    initSession: function() {
        if(this.initSessionInProgress === false) {
            this.initSessionInProgress = true;
            findApps.BaseServer.getACServer().getSession("SessionService", {
                onSuccess: "handleSessionResponse",
                onFailure: "handleSessionFailure",
                scope: this
            });
        }
    }
    ,
    triggerInitSession: function(listener) {
        if(this.initSessionInProgress === true) {
            // /user/session call is in progress, do nothing
            // add callee as a listener
            if(listener)
                this.addListener(listener, "userSession");
            return {
                "status": "inprogress"
            };
        }
        // previous /user/session call has errored out or session has never been retrieved yet
        if(this.sessionError === true || findApps.UserSession._session == null) {
            this.initSession();
            // add callee as a listener
            if(listener)
                this.addListener(listener, "userSession");
            return {
                "status": "inprogress"
            };
        }
        // user/session response is available already
        return {
            "status": "complete"
        };
    }
    ,
    initPaymentTypes: function() {
        this.initPaymentTypesInProgress = true;
        findApps.BaseServer.getPMTServer().getPaymentTypes("paymentTypesService", {
            onSuccess: "handlePaymentResp",
            onFailure: "handlePaymentError",
            scope: this
        });
    }
    ,
    triggerInitPaymentTypes: function(listener) {
        if(this.initPaymentTypesInProgress === true) {
            // /getPaymentTypes call is in progress, do nothing
            // add callee as a listener
            if(listener)
                this.addListener(listener, "paymentTypes");
            return {
                "status": "inprogress"
            };
        }
        // previous paymentTypes call has errored out or paymenttype has never been retrieved yet
        if(this.paymentTypesError === true || !findApps.UserProfile.validPayments) {
            // add callee as a listener
            if(listener){
                this.addListener(listener, "paymentTypes");
            }
            this.initPaymentTypes();
            return {
                "status": "inprogress"
            };
        }
        // paymenttypes response is available already
        return {
            "status": "complete"
        };
    }
    ,
    // Listener methods
    addListener: function(listener, event) {
        if(this.listeners[event])
            this.listeners[event].push(listener);
    }
    ,
    removeListener: function(listener, event) {
        if(this.listeners[event]) {
            for(var i in this.listeners[event]) {
                if((this.listeners[event])[i] === listener) {
                    this.listeners[event].splice(i, 1);
                }
            }
        }
    }
    ,
    broadcastResponse: function(event, success, errors) {
        if(this.listeners[event]) {
            // observers is a clone of listeners. This ensures that even if the listeners remove themselves while this 
            // list is being iterated over, things work fine.
            // Otherwise - simultaneous removal from the listeners list can interfere with the iteration
            var observers = (this.listeners[event]).splice(0);
            var numListeners = observers.length;
            for (var i = 0; i < numListeners; i++) {
                if(observers[i].receiveResponse) {
                    observers[i].receiveResponse(event, success, errors);
                }
            }
            observers = null;
        }
    }
    ,
    handleSessionResponse: function(inSender, inResponse, inRequest, props) {
        findApps.UserSession._sessionError = false;
        findApps.UserSession._session = inResponse.results.body.response;
         
        if(findApps.UserSession._session && findApps.UserSession._session.accountInfo && findApps.UserSession._session.accountInfo.isUserAllowedUpdateCountry == "false") {
            var c = findApps.UserSession._session.deviceProperties?findApps.UserSession._session.deviceProperties.country:"";
            findApps.UserSession.setActivationCountry(c);
        }
        if (findApps.UserSession._session.accountInfo) {
            findApps.UserSession._accountId = findApps.UserSession._session.accountInfo.accountId;
        }
        findApps.BaseServer.buildCategoriesMap();
        this.sessionError = false;
        this.initSessionInProgress = false;
           
        this.broadcastResponse("userSession", true, []);
    },
    handleSessionFailure: function(inSender, inResponse, inRequest, props, errors) {
        this.sessionError = true;
        this.initSessionInProgress = false;
        // Propagate error to listeners
        this.broadcastResponse("userSession", false, errors);
    }
    ,
    handlePaymentResp: function(inSender, inResponse, inRequest, props) {
        this.paymentTypesError = false;
        this.initPaymentTypesInProgress = false;
        findApps.UserProfile.validPaymentTypes = inResponse.OutGetPaymentTypes.paymentTypes;
        findApps.UserProfile.obEnabled = false;
        var paymentTypes = findApps.UserProfile.validPaymentTypes;
        for (var t in paymentTypes) {
            if (paymentTypes[t].code === "OB") {
                findApps.UserProfile.obEnabled = true;
            }
        }
        this.broadcastResponse("paymentTypes", true, []);
    },
    handlePaymentError: function(inSender, inResponse, inRequest, props, errors) {
        this.paymentTypesError = true;
        this.initPaymentTypesInProgress = false;
        // Propagate error to listeners
        // If the error is due to no internet connection, show offline error message
        errors.push("LOC03001");
        this.broadcastResponse("paymentTypes", false, errors);
    }
});
