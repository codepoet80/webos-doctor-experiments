// Pre-initialization for webOS Archive patch.
// Runs in the launcher (index.html) context before AppCatalogLauncher.relaunch()
// so country picker and Terms-of-Use screens are skipped on first launch.
(function () {
    var COUNTRY_KEY = "com.palm.app.findapps.country";
    var TERMS_KEY   = "com.palm.app.findapps.terms";
    var TOS_DATE    = "7th Aug 2009"; // must match findApps.UserSession._TOSDate

    try {
        if (!localStorage.getItem(COUNTRY_KEY)) {
            localStorage.setItem(COUNTRY_KEY, "US");
        }
        if (!localStorage.getItem(TERMS_KEY)) {
            localStorage.setItem(TERMS_KEY, TOS_DATE);
        }
    } catch (e) {
        // localStorage may be unavailable in some contexts; continue anyway.
    }
}());
