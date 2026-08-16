findApps.ViewLibrary = {
    _container: null,
    _views: null,
    // Set the view library
    init: function() {
        this._views = [];
        this._views["MAGAZINE"] = "findApps.MagazineView";
        this._views["BROWSER"] = "findApps.BrowserView";
        this._views["APPDETAILS"] = "findApps.DetailsView";
        this._views["SAVEDAPPS"] = "findApps.SavedView";
        // Search scene instance when user clicks on "Search" in navigation bar
        // (Standard search)
        this._views["SEARCHAPPS"] = "findApps.SearchView";
        // Search scene instance for developer apps search triggered from details
        this._views["DEVSEARCH"] = "findApps.SearchView";
        // Search scene instance for searches triggered from magazine
        this._views["MAGSEARCH"] = "findApps.SearchView";
        this._views["PREFERENCES"] = "findApps.PreferencesView";
        this._views["CCSETUP"] = "findApps.CCSetupView";
        this._views["OBSETUP"] = "findApps.OBSetupView";
        this._views["FULLSCREENERROR"] = "findApps.FatalError";
        this._views["COUNTRYPICKER"] = "findApps.CountryPicker";
        this._views["TERMSCONDITIONS"] = "findApps.AcceptTermsAndConditions";
        this._views["LAUNCHVIEW"] = "findApps.LaunchView";
    },
    setContainer: function(container) {
        this._container = container;
    },
    // this should only be done once
    getView: function(name) {
        // Name used as the key in the this._views array is used as the name 
        // of the view instance
        // For example: to load the standard search scene, use getView("SEARCHAPPS")
        // To load the developer apps search scene, use getView("DEVSEARCH")
        // This will enable creation of multiple instances of the same kind for different
        // purposes
        var newView = this._container.setView(name);
        return newView;
    },
    popViewsFromHistory: function(numItems) {
        this._container.popViewsFromHistory(numItems);
    },
    goBack: function() {
        this._container.goBack();
    },
    cleanup: function() {
    	this._container = null;
    	this._views = null;
    }
};
