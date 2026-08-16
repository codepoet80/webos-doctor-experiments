var TermsOfUse = {
    _TOSDate: "7th Aug 2009",
    // termsAccepted and selectedCountry fields will only have effect when running from the browser
    // On device, cookies will get used. But with browser, cookies do not get set, hence this workaround
    termsAccepted: false,
    selectedCountry: undefined,
    isAccepted: function() {
        var cookie = enyo.getCookie("com.palm.app.findapps.terms");
        return (cookie == this._TOSDate) || this.termsAccepted || enyo.application.onBrowser;
    },
    setAccepted: function() {
        enyo.setCookie("com.palm.app.findapps.terms", this._TOSDate);
        this.termsAccepted = true;
    },
    isCountrySet: function(code) {
        var cookie = enyo.getCookie("com.palm.app.findapps.country");
        return (cookie == code) || (this.selectedCountry && this.selectedCountry == code);
    },
    setCountry: function(code) {
        enyo.setCookie("com.palm.app.findapps.country", code);
        this.selectedCountry = code;
    }
};
