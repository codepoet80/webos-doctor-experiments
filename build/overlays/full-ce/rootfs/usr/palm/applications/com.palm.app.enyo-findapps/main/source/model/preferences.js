findApps.UserPreferences = {
    _timeout: 4 * 60 * 60 * 1000,
    // 4 hours
    getPaymentLogin: function() {
        return enyo.getCookie("findapps.paymentPref") || "timeout";
    },
    setPaymentLogin: function(val) {
        enyo.setCookie("findapps.paymentPref", val);
    },
    setLoginTime: function() {
        enyo.setCookie("findapps.loginTime", (new Date().getTime()));
    },
    isLoginTimedOut: function() {
        // Test code
        //return true;
        var paymentPref = enyo.getCookie("findapps.paymentPref");
        if (paymentPref && paymentPref == "Every Purchase") {
            return true;
        }
        var loginTime = enyo.getCookie("findapps.loginTime") || 0;
        var now = new Date().getTime();
        if (now - loginTime > this._timeout) {
            return true;
        } else {
            return false;
        }
    }
};
