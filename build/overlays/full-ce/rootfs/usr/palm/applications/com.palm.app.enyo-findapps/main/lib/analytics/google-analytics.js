function GoogleAnalytics(accountId) {
    var self = {};
    var hasNetConnection = false;
    var trackings = [];
    self.accountId = accountId;
    self.trackPageview = function(pageName) {
        trackOrSaveForWhenThereIsAConnection(['_trackPageview', pageName]);
    };
    self.setAccountId = function(accountId) {
        self.accountId = accountId;
        trackOrSaveForWhenThereIsAConnection(['_setAccount', self.accountId]);
        trackOrSaveForWhenThereIsAConnection(['_trackPageview', '/']);
    }
    self.trackEvent = function() {
        var event = ['_trackEvent'];
        event.push.apply(event, arguments);
        trackOrSaveForWhenThereIsAConnection(event)
        ensureArugment(arguments[2], 'label', 'string');
        ensureArugment(arguments[3], 'value', 'number');
    };
    self.setInternetConnection = function(value) {
        hasNetConnection = value;
        if (hasNetConnection && trackings.length > 0) {
            trackings.forEach(function(tracking) {
                console.log("GoogleAnalytics#setInternetConnection: FLUSHED ITEM [%s, %s]", tracking[0], tracking[1]);
                _gaq.push(tracking);
            });
        }
    };
    self.hasInternetConnection = function() {
        return hasNetConnection;
    };
    return self;

    function trackOrSaveForWhenThereIsAConnection(item) {
        if (hasNetConnection) {
            _gaq.push(item);
        } else {
            trackings.push(item);
        }
    }

    function ensureArugment(arg, name, type) {
        if (arg != undefined && typeof arg != type) {
            console.error('GoogleAnalytics#trackEvent: ' + name + ' must be a ' + type + ' - event will not be tracked')
        }
    }
}
