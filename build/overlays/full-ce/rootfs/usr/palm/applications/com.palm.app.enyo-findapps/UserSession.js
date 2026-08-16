var findApps = findApps || {};

findApps.UserSession = {
    _session: null,
    _sessionError: false,
    _accountInfo: null,
    _accountId: null,
    _serverUrl: null,
    _server2Url: null,
    _deviceId: null,
    _softwareBuildBranch: null,
    _token: null,
    _email: null,
    _authHeaders: null,
    _paymentServerUrl: null,
    _paymentServerError: false,
    _callerVersion: null,
	_TOSDate : "7th Aug 2009",
    cleanup: function() {
		this._session = null;
	},
    
    getSession: function() {
        return this._session;
    },
    getAccountInfo: function() {
        return this._accountInfo;
    },
    setAccountInfo: function(acctInfo) {
        this._accountInfo = acctInfo;
    },
    //Need to grab the activation country instead of enyo.g11n.formatLocale()
    getActivationCountry: function() {
        return localStorage.getItem("com.palm.app.findapps.country");
    },
    // Store the activation country in local storage
    setActivationCountry: function(country) {
        var deviceInfo = this._session.deviceProperties;
        deviceInfo.country = country;
        findApps.UserSession._activationCountrySet = true;
        localStorage.setItem("com.palm.app.findapps.country", country);
    },
    isActivationCountrySet: function() {
        var acCountry = localStorage.getItem("com.palm.app.findapps.country");
        return acCountry ? true : false;
    },
   
    getAccountToken: function() {
        if(!this._accountToken) {
            if(findApps.UserSession._deviceId && findApps.UserSession._token && findApps.UserSession._email)
                this._accountToken = {
                    "token" : findApps.UserSession._token,
                    "email" : findApps.UserSession._email,
                    "deviceId": findApps.UserSession._deviceId
                };
        }
        return this._accountToken;
    },
    isTermsAccepted : function() {
        var termsAcceptedDate = localStorage.getItem("com.palm.app.findapps.terms");
        return termsAcceptedDate ? true : false;
    },
    setTermsAccepted: function() {
        localStorage.setItem("com.palm.app.findapps.terms", this._TOSDate);
    }
  
};