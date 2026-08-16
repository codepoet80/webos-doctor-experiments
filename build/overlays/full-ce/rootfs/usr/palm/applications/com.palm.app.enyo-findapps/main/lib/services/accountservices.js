/* methods used from accounts services:
   getServerUrl
   getPaymentServerUrl
   getAccountToken
   getAccountInfo
   updateAccountInfo
   getGoogleAnalyticsWebPropertyID
   notifyAuthenticationFailure
   isUserValid
   getAllSecurityQuestions
   getAccountSecurityQuestions
   resendVerificationEmail
   requestPasswordResetEmail
   authenticateAccountFromSecurityQuestion
   changeEmail
   changePassword
   authenticateAccount
   */
enyo.kind({
    name: "findApps.AccountServices",
    kind: findApps.PalmService,
    service: "palm://com.palm.accountservices/",
    /*
	 *Sample response: {
	 *	  "serverUrl": "https://ps.qa.palm.com/palmcsext/services/deviceJ/",
	 *	  "returnValue": true
	 *	}
	 */
    getServerUrl: function(inProps) {
        if(AppCatalog.Config.DummyConfig){
            inProps.scope[inProps.onSuccess].call(inProps.scope, this, {
                serverUrl: AppCatalog.Config.DummyConfig._env._serverUrl
            }, {}, inProps);
            return;
        }
        var inParams = {};
        inProps = enyo.mixin((inProps?inProps:{}), {
            service: this.service, 
            method: "getServerUrl"
        });
        this.sendRequest(inParams, inProps);
    },
    /*
	 *Sample response: {
		  "parameterInfos": {
		    "category": "SETTINGS",
		    "key": "PAYMENT_URL",
		    "value": "https://pmt.qa.palm.com/palmcspmtext/services/paymentJ/"
		  },
		  "size": 1,
		  "returnValue": true
		}
	 */
    getPaymentServerUrl: function(inProps) {
        if(AppCatalog.Config.DummyConfig){
            inProps.scope[inProps.onSuccess].call(inProps.scope, this, {
                parameterInfos: {
                    value: AppCatalog.Config.DummyConfig._env._paymentServerUrl
                }
            }, {}, inProps);
            return;
        }
        if (findApps.UserSession._paymentServerUrl == null) {
            var inParams = {
                appName: "PAYMENT"
            };
            inProps = enyo.mixin((inProps?inProps:{}),{
                service: this.service, 
                method: "getPreferences"
            });
            this.sendRequest(inParams, inProps);
        }
    },
    /*
	 *Sample response: {
		  "accountAlias": "mamta2000@gmail.com",
		  "token": "7BD9755A4BF60F8C73CA294B74CB09B67",
		  "accountState": "A",
		  "uniqueId": "AD2E2700082CC380046C48F86BC72061E",
		  "jabberId": {
		    "port": 5222,
		    "service": "j001.qa.palmws.com",
		    "url": "j001.qa.palmws.com",
		    "user": "7fe37b54cf95a978c569"
		  },
		  "returnValue": true
		}
	 */
    getAccountToken: function(inProps) {
        if(AppCatalog.Config.DummyConfig){
            inProps.scope[inProps.onSuccess].call(inProps.scope, this, {
                token: AppCatalog.Config.DummyConfig._token,
                accountAlias: AppCatalog.Config.DummyConfig._email
            }, {}, inProps);
            return;
        }
        var inParams = {};
        inProps = enyo.mixin((inProps?inProps:{}), {
            service: this.service, 
            method: "getAccountToken"
        });
        this.sendRequest(inParams, inProps);
    },
    /*
	 *Sample response: {
		  "accountState": "A",
		  "accountType": "CONSUMER",
		  "country": "US",
		  "email": "mamta2000@gmail.com",
		  "firstName": "M",
		  "hasCR": true,
		  "id": -1,
		  "jabberId": "7fe37b54cf95a978c569",
		  "language": "en",
		  "lastName": "J",
		  "postalCode": "",
		  "uniqueId": "AD2E2700082CC380046C48F86BC72061E",
		  "returnValue": true
		}
	 */
    getAccountInfo: function(inProps) {
        if (findApps.UserSession.getAccountInfo() == null) {
            var inParams = {};
            inProps = enyo.mixin((inProps?inProps:{}), {
                service: this.service, 
                method: "getAccountInfo"
            });
            this.sendRequest(inParams, inProps);
        } else {
            return findApps.UserSession.getAccountInfo();
        }
    },
    updateAccountInfo: function(fistName, lastName, password, email, languageCode, countryCode, inProps) {
        var inParams = {
            'firstName': firstName,
            'lastName': lastName,
            'password': password,
            'email': email,
            'languageCode': languageCode,
            'countryCode': countryCode
        };
        inProps = enyo.mixin((inProps?inProps:{}), {
            service: this.service, 
            method: "updateAccountInfo"
        });
        this.sendRequest(inParams, inProps);
    },
    getGoogleAnalyticsWebPropertyID: function(inProps) {
        var inParams = {
            appName: ["APP_DISCO"]
        };
        inProps = enyo.mixin((inProps?inProps:{}), {
            service: this.service, 
            method: "getPreferences"
        });
        this.sendRequest(inParams, inProps);
    },
    notifyAuthenticationFailure: function(inProps) {
        var inParams = {};
        inProps = enyo.mixin((inProps?inProps:{}), {
            service: this.service, 
            method: "notifyAuthenticationFailure"
        });
        this.sendRequest(inParams, inProps);
    },
    isUserValid: function(email, password, deviceId, inProps) {
        var inParams = {
            'email': email,
            'password': password,
            "deviceId": deviceId
        };
        inProps = enyo.mixin((inProps?inProps:{}), {
            service: this.service, 
            method: "isUserValid"
        });
        this.sendRequest(inParams, inProps);
    },
    getLocale: function(inProps) {
        var inParams = {
            "keys": ["locale"]
        };
        inProps = enyo.mixin((inProps?inProps:{}), {
            service: this.service, 
            method: "getPreferences"
        });
        this.sendRequest(inParams, inProps);
    },
    getAllSecurityQuestions: function(userLocale, inProps) {
        var inParams = {
            subscribe: false,
            locale: userLocale
        };
        inProps = enyo.mixin((inProps?inProps:{}), {
            service: this.service, 
            method: "getAllSecurityQuestions"
        });
        this.sendRequest(inParams, inProps);
    },
    getAccountSecurityQuestions: function(email, locale, inProps) {
        var inParams = {
            "email": email,
            "locale": locale
        };
        inProps = enyo.mixin((inProps?inProps:{}), {
            service: this.service, 
            method: "getAccountSecurityQuestion"
        });
        this.sendRequest(inParams, inProps);
    },
    resendVerificationEmail: function(inProps) {
        var inParams = {};
        inProps = enyo.mixin((inProps?inProps:{}), {
            service: this.service, 
            method: "requestResendVerificationEmail"
        });
        this.sendRequest(inParams, inProps);
    },
    requestPasswordResetEmail: function(emailAddress, inProps) {
        var inParams = {
            "email": emailAddress,
            "subscribe": false
        };
        inProps = enyo.mixin((inProps?inProps:{}), {
            service: this.service, 
            method: "requestPasswordResetEmail"
        });
        this.sendRequest(inParams, inProps);
    },
    authenticateAccountFromSecurityQuestion: function(email, questionId, response, inProps) {
        var inParams = {
            'email': email,
            'questionId': questionId,
            'response': response
        };
        inProps = enyo.mixin((inProps?inProps:{}), {
            service: this.service, 
            method: "authenticateAccountFromSecurityQuestion"
        });
        this.sendRequest(inParams, inProps);
    },
    changeEmail: function(email, inProps) {
        var inParams = {
            "email": email
        };
        inProps = enyo.mixin((inProps?inProps:{}), {
            service: this.service, 
            method: "changeEmail"
        });
        this.sendRequest(inParams, inProps);
    },
    changePassword: function(newPassword, questionId, answer, idToken, isResetPassword, inProps) {
        var inParams = {
            "newPassword": newPassword,
            "questionId": questionId,
            "answer": answer,
            "idToken": idToken,
            "isResetPassword": isResetPassword
        };
        inProps = enyo.mixin((inProps?inProps:{}), {
            service: this.service, 
            method: "changePassword"
        });
        this.sendRequest(inParams, inProps);
    },
    authenticateAccount: function(email, password, inProps) {
        var inParams = {
            'email': email,
            'password': password,
            'application': 'ASClient'
        };
        inProps = enyo.mixin((inProps?inProps:{}), {
            service: this.service, 
            method: "authenticateAccount"
        });
        this.sendRequest(inParams, inProps);
    }
});
enyo.mixin(findApps.AccountServices, {
    getInstance: function(){
        findApps.AccountServices._singleton = findApps.AccountServices._singleton || new findApps.AccountServices();
        return findApps.AccountServices._singleton;
    },
    destroy: function() {
        findApps.AccountServices._singleton = null;
    }
});
