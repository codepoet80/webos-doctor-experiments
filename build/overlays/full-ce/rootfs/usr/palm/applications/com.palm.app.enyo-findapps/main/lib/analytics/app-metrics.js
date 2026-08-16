function AppMetrics(accountId) {
    var self = {};
    var googleAnalytics = new GoogleAnalytics(accountId);
    self.setInternetConnection = function(status) {
        googleAnalytics.setInternetConnection(status);
    };
    self.setAccountId = function(accountId) {
        googleAnalytics.setAccountId(accountId);
    };
    self.trackEvent = function() {
        googleAnalytics.trackEvent.apply(googleAnalytics, arguments);
    };
    self.trackLaunch = function(appVersion) {
        googleAnalytics.trackEvent('Launch', 'Version', appVersion);
    };
    self.trackNewScene = function(sceneName) {
        googleAnalytics.trackPageview(sceneName);
    };
    self.trackRegistration = function(appVersion) {
        if (!localStorage) {
            return;
        }
        var registeredVersion = localStorage.getItem("com.palm.app.findapps.RegistrationKey");
        if (registeredVersion != appVersion) {
            self.trackEvent('Registration', appVersion);
            localStorage.setItem("com.palm.app.findapps.RegistrationKey", appVersion);
        }
        AppMetrics.registrationKey = registeredVersion;
    };
    return self;
}
AppMetrics.registrationKey = 'AppMetrics__Registration';
