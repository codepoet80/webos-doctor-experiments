// archive-patch.js
// Bridges com.palm.app.enyo-findapps to the webOS Archive backend.
// Must load AFTER build.js (listed last in main/depends.js).

(function () {
    "use strict";

    // Inject archive-specific CSS rules that can't go through the Enyo build.
    // Details.css is a source file but isn't compiled into build.css without
    // the Enyo toolchain, so all CSS additions live here instead.
    (function () {
        var s = document.createElement("style");
        s.textContent =
            // Re-apply the row separator that was previously on .review-list-rows .enyo-row
            // (the hidden "Was this review useful?" row).  Now on the container itself.
            ".review-list-rows{border-bottom:1px solid #d9d9d9;padding-bottom:9px;}";
        document.head.appendChild(s);
    }());

    var API_BASE = "https://appcatalog.webosarchive.org/WebService/";
    // Each request gets its own unique key so the server always returns full
    // data and never sends back cached-null entries from a prior request.
    function makeKey() {
        return "fap-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    // Updated asynchronously by the getConfig.php call below.
    // All URL construction is lazy (called during XHR callbacks),
    // so config will have arrived before any URL is needed.
    var _imageBase   = "http://appcatalog.webosarchive.org/AppImages/";
    var _packageBase = "appstorage.webosarchive.org/packages";

    // -----------------------------------------------------------------------
    // First-run guard (belt-and-suspenders; also done in pre-init.js)
    // -----------------------------------------------------------------------
    try {
        if (!localStorage.getItem("com.palm.app.findapps.country")) {
            localStorage.setItem("com.palm.app.findapps.country", "US");
        }
        if (!localStorage.getItem("com.palm.app.findapps.terms")) {
            localStorage.setItem("com.palm.app.findapps.terms", "7th Aug 2009");
        }
    } catch (e) {}

    // -----------------------------------------------------------------------
    // Categories
    // -----------------------------------------------------------------------
    var CATEGORIES = [
        {id: 0,  categoryId: "CAT_HOME",   label: "Home",               name: "Home",               iconLocation: "category-icons/home/",               subcategories: []},
        {id: 1,  categoryId: "CAT_BOOKS",  label: "Books",              name: "Books",              iconLocation: "category-icons/books/",              subcategories: []},
        {id: 2,  categoryId: "CAT_BIZ",    label: "Business",           name: "Business",           iconLocation: "category-icons/business/",           subcategories: []},
        {id: 3,  categoryId: "CAT_PICKS",  label: "Curator's Choice",   name: "Curator's Choice",   iconLocation: "category-icons/home/",               subcategories: []},
        {id: 4,  categoryId: "CAT_EDU",    label: "Education",          name: "Education",          iconLocation: "category-icons/education/",          subcategories: []},
        {id: 5,  categoryId: "CAT_ENT",    label: "Entertainment",      name: "Entertainment",      iconLocation: "category-icons/entertainment/",      subcategories: []},
        {id: 6,  categoryId: "CAT_FIN",    label: "Finance",            name: "Finance",            iconLocation: "category-icons/finance/",            subcategories: []},
        {id: 7,  categoryId: "CAT_FOOD",   label: "Food",               name: "Food",               iconLocation: "category-icons/food/",               subcategories: []},
        {id: 8,  categoryId: "CAT_GAMES",  label: "Games",              name: "Games",              iconLocation: "category-icons/games/",              subcategories: []},
        {id: 9,  categoryId: "CAT_HLTH",   label: "Health & Fitness",   name: "Health & Fitness",   iconLocation: "category-icons/health-and-fitness/", subcategories: []},
        {id: 10, categoryId: "CAT_LIFE",   label: "Lifestyle",          name: "Lifestyle",          iconLocation: "category-icons/lifestyle/",          subcategories: []},
        {id: 11, categoryId: "CAT_MUSIC",  label: "Music",              name: "Music",              iconLocation: "category-icons/music/",              subcategories: []},
        {id: 12, categoryId: "CAT_NAV",    label: "Navigation",         name: "Navigation",         iconLocation: "category-icons/navigation/",         subcategories: []},
        {id: 13, categoryId: "CAT_NEWS",   label: "News",               name: "News",               iconLocation: "category-icons/news/",               subcategories: []},
        {id: 14, categoryId: "CAT_PHOTO",  label: "Photography",        name: "Photography",        iconLocation: "category-icons/photography/",        subcategories: []},
        {id: 15, categoryId: "CAT_PROD",   label: "Productivity",       name: "Productivity",       iconLocation: "category-icons/productivity/",       subcategories: []},
        {id: 16, categoryId: "CAT_REF",    label: "Reference",          name: "Reference",          iconLocation: "category-icons/reference/",          subcategories: []},
        {id: 17, categoryId: "CAT_RETRO",  label: "Revisionist History",name: "Revisionist History",iconLocation: "category-icons/home/",               subcategories: []},
        {id: 18, categoryId: "CAT_SOC",    label: "Social Networking",  name: "Social Networking",  iconLocation: "category-icons/social-networking/",  subcategories: []},
        {id: 19, categoryId: "CAT_SPORTS", label: "Sports",             name: "Sports",             iconLocation: "category-icons/sports/",             subcategories: []},
        {id: 20, categoryId: "CAT_TRAVEL", label: "Travel",             name: "Travel",             iconLocation: "category-icons/travel/",             subcategories: []},
        {id: 21, categoryId: "CAT_WTHR",   label: "Weather",            name: "Weather",            iconLocation: "category-icons/weather/",            subcategories: []}
    ];

    var CAT_ID_TO_NAME = {};
    var CAT_STRING_ID_TO_NAME = {};
    CATEGORIES.forEach(function (c) {
        if (c.id > 0) {
            CAT_ID_TO_NAME[c.id] = c.label;
            CAT_STRING_ID_TO_NAME[c.categoryId] = c.label;
        }
    });

    // acquireListPage passes sub_categories.getValue() which returns the string
    // categoryId ("CAT_BOOKS") set by renderSubCategories, while BrowseAppsService
    // from refresh() passes the numeric topCategory.id.  Normalise both to the
    // display name so URL building and the stale-response guard are consistent.
    function toCatName(catId) {
        if (!catId || catId === 0) { return "All"; }
        if (typeof catId === "number") { return CAT_ID_TO_NAME[catId] || "All"; }
        var n = parseInt(catId, 10);
        if (!isNaN(n)) { return CAT_ID_TO_NAME[n] || "All"; }
        return CAT_STRING_ID_TO_NAME[catId] || "All";
    }

    // -----------------------------------------------------------------------
    // Synthetic session
    // -----------------------------------------------------------------------
    // Button order matches the 3-button RadioGroup in build.js: Recommended(0), Newest(1), All(2).
    // queryFragment is the sort mode passed to getMuseumMaster.php:
    //   "recommended" = recommendation_order DESC  (default)
    //   "recent"      = last_modified_time DESC
    //   "alpha"       = alphabetical (A-Z)
    var FAKE_SESSION = {
        categories:    CATEGORIES,
        queryButtons: {
            HOME: [
                {queryId: "HOME-DartfishQuery1", queryFragment: "recommended"},  // Recommended (default)
                {queryId: "HOME-DartfishQuery2", queryFragment: "recent"},       // Newest
                {queryId: "HOME-DartfishQuery3", queryFragment: "alpha"},        // All (A-Z)
                {queryId: "HOME-DartfishQuery4", queryFragment: "recommended"}   // (unused 4th slot)
            ],
            DEFAULT: [
                {queryId: "DEFAULT-DartfishQuery5", queryFragment: "recommended"},  // Recommended (default)
                {queryId: "DEFAULT-DartfishQuery6", queryFragment: "recent"},       // Newest
                {queryId: "DEFAULT-DartfishQuery7", queryFragment: "alpha"},        // All (A-Z)
                {queryId: "DEFAULT-DartfishQuery8", queryFragment: "recommended"}   // (unused)
            ]
        },
        deviceProperties:      {country: "US"},
        accountInfo:           {accountId: 1, isUserAllowedUpdateCountry: "true"},
        supportInfo:           {appFilterOn: false},
        purchasedApplications: {apps: []}
    };

    // -----------------------------------------------------------------------
    // App-summary cache: preserves title/author for detail responses.
    // -----------------------------------------------------------------------
    var _cache = {};

    // Curator star rating (1-5) from the most recent getApplicationDetails response.
    // Stashed here so getAppReviewsList can include it in ratingsBreakdown.
    // Positive reviews are requested from inside handleServerResponse for AppDetailsService,
    // so by the time the mock fires, this variable is already set.
    var _lastStarRating = 0;

    // Related app IDs from the most recent getApplicationDetails response.
    // Used by renderAppDetailsFromModel to conditionally show the Related Apps button.
    var _lastRelatedApps = [];

    // Tracks the total item count returned by the server for the most recent
    // BrowseAppsService request.  appListChanged reads this to extend the sparse
    // array so the VirtualList knows the full scroll height before page 2 loads.
    var _pendingTotalCount = 0;

    // Category name in-flight for BrowseAppsService; used to discard stale
    // GetMoreAppsService callbacks that arrive after the user switched category.
    // Stored as the display name (e.g. "Books") so numeric ids and string
    // categoryIds ("CAT_BOOKS") compare equal via toCatName().
    var _activeCatName = null;

    function makeIconUrl(relPath) {
        if (!relPath) { return ""; }
        if (relPath.indexOf("://") !== -1) { return relPath; }
        return _imageBase + relPath.toLowerCase();
    }

    function transformApp(app) {
        var iconUri = makeIconUrl(app.appIcon);
        var summary = {
            id:                  app.id,
            publicApplicationId: String(app.id),
            title:               app.title   || "",
            author:              app.author  || "",
            creator:             app.author  || "",
            developerName:       app.author  || "",
            summary:             app.summary || "",
            description:         app.summary || "",
            ratingCount:         app.reviewCount || 0,
            averageRating:       app.starRating || 0,
            price:               0,
            free:                true,
            appSize:             0,
            version:             app.version || "",
            appIcon:             iconUri,
            images: [
                {imageKey: "icon/64x64", uri: iconUri},
                {imageKey: "icon/48x48", uri: iconUri}
            ],
            badges: (app.TouchPad && !app.Pre && !app.Pixi && !app.Pre2 && !app.Pre3 && !app.Veer)
                    ? ["touchpad_exclusive"] : []
        };
        _cache[String(app.id)] = summary;
        return summary;
    }

    // -----------------------------------------------------------------------
    // Callback helpers
    // handler signature: (WebServiceComponent, json, requestObj, propsObj, errors)
    // propsObj must carry `service` for switch-on-service handlers.
    //
    // Most callers use onSuccess/onFailure, but DownloadStateManager._fetchAppDetails
    // uses onResponse for both outcomes (single handler, checks errors array length).
    // -----------------------------------------------------------------------
    function callSuccess(inProps, response) {
        var fakeReq = {xhr: {status: 200}, response: response};
        var handler = inProps.onSuccess || inProps.onResponse;
        inProps.scope[handler](null, response, fakeReq, inProps, []);
    }

    function callFailure(inProps, status, errors) {
        var fakeReq = {xhr: {status: status || 0}, response: {}};
        var handler = inProps.onFailure || inProps.onResponse;
        if (handler) {
            inProps.scope[handler](null, {}, fakeReq, inProps, errors || ["ARCHIVE_ERR"]);
        }
    }

    // -----------------------------------------------------------------------
    // DummyConfig — installed synchronously so the Palm service bypasses
    // in accountservices.js and deviceprofile.js are active before the app
    // creates any components or calls getSession.
    // -----------------------------------------------------------------------
    AppCatalog.Config.DummyConfig = {
        _env: {
            _serverUrl:        API_BASE,
            _paymentServerUrl: API_BASE
        },
        _token:               "archive-user",
        _email:               "archive@webosarchive.org",
        _deviceId:            "touchpad-archive",
        _softwareBuildBranch: "open",
        _googlePropertyId:    "",
        _carrier:             {_mcc: "310", _mnc: "410", _shortName: "archive"}
    };

    // -----------------------------------------------------------------------
    // ACServer overrides — also installed synchronously for the same reason.
    // -----------------------------------------------------------------------

    findApps.ACServer.prototype.getSession = function (service, inProps) {
        var resp    = {results: {body: {response: FAKE_SESSION}}};
        var fakeReq = {xhr: {status: 200}, response: resp};
        setTimeout(function () {
            inProps.scope[inProps.onSuccess](null, resp, fakeReq, inProps, []);
        }, 0);
    };

    findApps.ACServer.prototype.getAppList = function (params, service, inProps) {
        inProps.service = service;

        // Normalise to display name so numeric ids and string categoryIds compare equal.
        var catName = toCatName(params.categoryid);
        if (service === "BrowseAppsService") {
            _activeCatName = catName;
        }

        var url;
        if (params.packageIds && params.packageIds.length > 0) {
            // Specific app IDs — used by Related Apps, Saved Apps, etc.
            url = API_BASE + "getMuseumMaster.php?useAppId=true" +
                  "&appIds=" + encodeURIComponent(params.packageIds.join(",")) +
                  "&key=" + makeKey();
        } else if (service === "SearchAppsService" && params.developerId && !params.queryStr) {
            // Developer Apps button — search by vendor ID, not free-text query.
            url = API_BASE + "getMuseumMaster.php?vendorId=" +
                  encodeURIComponent(params.developerId) +
                  "&hide_missing=true&key=" + makeKey();
        } else if (service === "SearchAppsService" || service === "SearchMoreAppsService") {
            url = API_BASE + "getSearchResults.php?app=" +
                  encodeURIComponent(params.queryStr || "");
        } else {
            var pageSize = params.count || AppCatalog.Config.defaultPageSize;
            var page     = Math.floor((params.startPosition || 0) / pageSize);

            // queryFragment carries the sort mode set via the All/Recommended/Newest buttons.
            // Valid values from the API: "alpha", "recommended", "recent".
            var qf = params.queryFragment || "";
            var sortOrder = (qf === "recommended" || qf === "recent" || qf === "alpha")
                            ? qf
                            : "recent";

            url = API_BASE + "getMuseumMaster.php?" +
                  "device=All" +
                  "&category=" + encodeURIComponent(catName) +
                  "&page=" + page +
                  "&count=" + pageSize +
                  "&key=" + makeKey() +
                  "&hide_missing=true" +
                  "&sort=" + sortOrder;
        }

        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onload = function () {
            if (xhr.status === 200) {
                var raw;
                try { raw = JSON.parse(xhr.responseText); } catch (e) {}
                if (raw && raw.data) {
                    // Discard stale GetMoreApps responses that arrived after the
                    // user switched to a different category.
                    if (service === "GetMoreAppsService" && catName !== _activeCatName) {
                        return;
                    }

                    var apps      = raw.data.filter(function (a) { return a && a.id; });
                    var summaries = apps.map(transformApp);

                    // Use the real server total so the VirtualList scroll area
                    // covers the full list.  appListChanged will extend appList to
                    // this length so unloaded slots are sparse (undefined) rather
                    // than absent, letting getAppItem return a blank placeholder and
                    // allowing nextPage/acquireListPage to fire.
                    var total = (raw.extraData && raw.extraData.listCount) || summaries.length;
                    if (service === "BrowseAppsService") {
                        _pendingTotalCount = total;
                    }

                    var listResp = {totalCount: total};
                    if (summaries.length > 0) {
                        listResp.appSummary = summaries.length === 1 ? summaries[0] : summaries;
                    }
                    callSuccess(inProps, {OutGetAppList: {appList: listResp}});
                    return;
                }
            }
            callFailure(inProps, xhr.status, ["CATALOG_FETCH_FAILED"]);
        };
        xhr.onerror = function () { callFailure(inProps, 0, ["CATALOG_NET_ERR"]); };
        xhr.send();
    };

    findApps.ACServer.prototype.getApplicationDetails = function (appId, packageId, locale, service, ignoreCache, inProps) {
        inProps.service = service;
        // Callers supply either (null, publicApplicationId) or (app.id, app.publicApplicationId).
        // After updateFromServer, publicApplicationId is a Palm UUID ("com.palm.app.maps") while
        // app.id is the numeric archive ID.  Prefer whichever of the two is all-digits.
        var _pkg = String(packageId || "");
        var _id  = String(appId     || "");
        var numericId = /^\d+$/.test(_pkg) ? _pkg
                      : /^\d+$/.test(_id)  ? _id
                      : _pkg || _id;
        var url = API_BASE + "getMuseumDetails.php?id=" + encodeURIComponent(numericId);

        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onload = function () {
            if (xhr.status === 200) {
                var raw;
                try { raw = JSON.parse(xhr.responseText); } catch (e) {}
                if (raw) {
                    var cached  = _cache[numericId] || {};
                    var iconUri = cached.appIcon || makeIconUrl(raw.appIcon || "");

                    // Stash for ratingsBreakdown in the upcoming positive-reviews mock call.
                    _lastStarRating    = raw.starRating    || 0;
                    _lastRelatedApps   = (raw.relatedApps && raw.relatedApps.length) ? raw.relatedApps : [];

                    var images = [];
                    if (iconUri) {
                        images.push({imageKey: "icon/64x64", uri: iconUri});
                        images.push({imageKey: "icon/48x48", uri: iconUri});
                    }
                    if (raw.images) {
                        var ssIdx = 0;
                        for (var k in raw.images) {
                            var img = raw.images[k];
                            if (img && img.screenshot) {
                                ssIdx++;
                                var ssUri = makeIconUrl(img.screenshot);
                                var tbUri = makeIconUrl(img.thumbnail || img.screenshot);
                                // ThumbnailImageScroller looks up keys like
                                // "screenshot/1/landscape/480x320/tb" and "screenshot/1/portrait/320x480/tb".
                                // Add both so the scroller finds the image regardless of which it tries first.
                                var lsKey = "screenshot/" + ssIdx + "/landscape/480x320/tb";
                                var psKey = "screenshot/" + ssIdx + "/portrait/320x480/tb";
                                images.push({imageKey: lsKey, uri: tbUri});
                                images.push({imageKey: psKey, uri: tbUri});
                                // Carousel keys (separate resolution slots); fall back to same URL.
                                images.push({imageKey: "screenshot/" + ssIdx + "/landscape/768x576/tb", uri: ssUri});
                                images.push({imageKey: "screenshot/" + ssIdx + "/portrait/576x768/tb",  uri: ssUri});
                            }
                        }
                    }

                    var appLocation = raw.filename ? "http://" + _packageBase + "/" + raw.filename : "";
                    console.log("ARCHIVE-PATCH getApplicationDetails id=" + numericId +
                             " service=" + service +
                             " filename=" + (raw.filename || "(none)") +
                             " appLocation=" + appLocation);

                    callSuccess(inProps, {OutGetAppDetailV2: {appDetail: {
                        id:                  numericId,
                        // publicApplicationId carries the Palm package ID (e.g. "com.palm.app.maps")
                        // so the OS can cross-reference install-state via launchPointChanges.
                        // _fetchAppDetails is overridden below to use app.id (numericId) for
                        // archive API calls instead of this UUID.
                        publicApplicationId: raw.publicApplicationId || numericId,
                        title:               cached.title  || raw.title       || "",
                        creator:             raw.copyright || cached.author   || "",
                        author:              raw.copyright || cached.author   || "",
                        developerName:       raw.copyright || cached.author   || "",
                        description:         raw.description                  || "",
                        version:             raw.version                      || "",
                        versionNote:         raw.versionNote                  || "",
                        lastModifiedTime:    raw.lastModifiedTime              || "",
                        vendorid:            raw.vendorId  || numericId,
                        // Use at least 1 for size fields so AppState.Download.install doesn't
                        // re-call _fetchAppDetails on every tap (it checks !packageSize || !installSize).
                        appSize:             raw.appSize                      || 1,
                        installSize:         raw.installSize                  || 1,
                        // islocationbased: false prevents the undefined-check in AppState.Download.install
                        // from forcing a redundant _fetchAppDetails call on every tap.
                        islocationbased:     false,
                        price:               0,
                        free:                true,
                        averageRating:       raw.starRating                   || 0,
                        ratingCount:         0,
                        supportURL:          raw.supportURL || raw.homeURL    || "",
                        homeURL:             raw.homeURL                      || "",
                        images:              images,
                        appIcon:             iconUri,
                        // appLocation is read by appdownload.js as packageUrl, passed through
                        // our _install override to Preware for the actual on-device installation.
                        appLocation:         appLocation,
                        // and .connectors without guarding; provide a safe stub.
                        attributes: {provides: {noApp: false, services: null, dockMode: false, universalSearch: false, connectors: null}}
                    }}});
                    return;
                }
            }
            callFailure(inProps, xhr.status, ["DETAIL_FETCH_FAILED"]);
        };
        xhr.onerror = function () { callFailure(inProps, 0, ["DETAIL_NET_ERR"]); };
        xhr.send();
    };

    findApps.ACServer.prototype.getCountryList = function (service, inProps) {
        inProps.service = service;
        var resp    = [{id: 23, code: "US", name: "UNITED STATES"}];
        var fakeReq = {xhr: {status: 200}, response: resp};
        setTimeout(function () {
            inProps.scope[inProps.onSuccess](null, resp, fakeReq, inProps, []);
        }, 0);
    };

    findApps.ACServer.prototype.getListOfUpdatableApps = function (packageNames, service, inProps) {
        inProps.service = service;
        var resp    = {OutGetUpdatableApps: {appList: {totalCount: 0, appSummary: []}}};
        var fakeReq = {xhr: {status: 200}, response: resp};
        setTimeout(function () {
            inProps.scope[inProps.onSuccess](null, resp, fakeReq, inProps, []);
        }, 0);
    };

    findApps.ACServer.prototype.getAppReviewsList = function (appid, packageid, sign, offset, count, service, inProps) {
        inProps.service = service;

        // Resolve to the numeric archive ID — same logic as getApplicationDetails.
        var _pkg = String(packageid || "");
        var _id  = String(appid     || "");
        var numericId = /^\d+$/.test(_pkg) ? _pkg
                      : /^\d+$/.test(_id)  ? _id
                      : _pkg || _id;

        var url = API_BASE + "getMuseumReviews.php" +
                  "?id="     + encodeURIComponent(numericId) +
                  "&sign="   + encodeURIComponent(sign || "positive") +
                  "&offset=" + (offset || 0) +
                  "&count="  + (count  || 10);

        function makeResp(raw) {
            // Use the real ratingsBreakdown from the server if available;
            // fall back to the curator star rating for apps with no archived reviews.
            var breakdown = (raw && raw.ratingsBreakdown) ||
                ((sign === "positive" && _lastStarRating > 0)
                    ? {totalCount: 0, averageRating: _lastStarRating}
                    : null);
            return {
                body: {
                    error: "",
                    response: {
                        totalCount:       (raw && raw.totalCount) || 0,
                        reviews:          (raw && raw.reviews)    || [],
                        ratingsBreakdown: breakdown
                    }
                }
            };
        }

        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onload = function () {
            var raw = null;
            if (xhr.status === 200) {
                try { raw = JSON.parse(xhr.responseText); } catch (e) {}
            }
            callSuccess(inProps, makeResp(raw));
        };
        xhr.onerror = function () { callSuccess(inProps, makeResp(null)); };
        xhr.send();
    };

    // -----------------------------------------------------------------------
    // Rename the "All" sort button to "Alphabetic" in both catalog and search
    // views.  The button is the 3rd control (index 2) in the stored_queries
    // RadioGroup, present in both findApps.AppCatalog and findApps.SearchApps.
    // -----------------------------------------------------------------------
    function _renameAllButton(ctx) {
        var btns = ctx.$.stored_queries && ctx.$.stored_queries.controls;
        if (btns && btns[2] && btns[2].setCaption) {
            btns[2].setCaption("Alphabetic");
        }
    }

    var _origACRendered = findApps.AppCatalog.prototype.rendered;
    findApps.AppCatalog.prototype.rendered = function () {
        _origACRendered.call(this);
        _renameAllButton(this);
    };

    var _origSARendered = findApps.SearchApps.prototype.rendered;
    findApps.SearchApps.prototype.rendered = function () {
        _origSARendered.call(this);
        _renameAllButton(this);
    };

    // -----------------------------------------------------------------------
    // ReviewList: hide the "Was this review useful?" Yes/No row — those
    // buttons called a live HP service that no longer exists.
    // -----------------------------------------------------------------------
    var _origGetReview = findApps.Details.ReviewList.prototype.getReview;
    findApps.Details.ReviewList.prototype.getReview = function (inSender, inIndex) {
        var result = _origGetReview.call(this, inSender, inIndex);
        if (result) {
            this.$.reviewReviewsBox.hide();
            this.$.usefulNessCount.hide();
        }
        return result;
    };

    // -----------------------------------------------------------------------
    // Details: conditionally inject a "Related Apps" button below the
    // "Developer Apps" button when the current app has related apps in the
    // museum database.  Re-evaluated on every renderAppDetailsFromModel call
    // (i.e. each time the detail page loads a new app).
    // -----------------------------------------------------------------------
    var _origRenderAppDetails = findApps.Details.prototype.renderAppDetailsFromModel;
    findApps.Details.prototype.renderAppDetailsFromModel = function (appDetails) {
        _origRenderAppDetails.call(this, appDetails);

        var devNode = this.$.developerAppsButton && this.$.developerAppsButton.hasNode();
        if (!devNode) { return; }

        // Remove any stale button from a prior app.
        var existing = devNode.parentNode.querySelector(".archive-related-btn");
        if (existing) { existing.parentNode.removeChild(existing); }

        if (!_lastRelatedApps.length) { return; }

        var ids = _lastRelatedApps.map(function (a) { return a.id; });
        var btn = document.createElement("div");
        btn.className = "enyo-button enyo-button-light linkButton archive-related-btn";
        btn.setAttribute("role", "button");
        btn.textContent = "Related Apps";
        btn.onclick = function () {
            findApps.ViewLibrary.getView("DEVSEARCH").setParams({
                packageIds:      ids,
                hideSearchField: true,
                title:           "Related Apps",
                comingFrom:      "details"
            });
        };
        devNode.parentNode.insertBefore(btn, devNode.nextSibling);
    };

    // -----------------------------------------------------------------------
    // AppSummary: add Version Note display below the version number.
    //
    // AppSummary.showLess is called each time appDetails changes.  We hook it
    // to inject a plain DOM element after versionLbl so the curator's
    // restoration note appears right under the version number.  Direct DOM
    // injection is used because AppSummary's component tree is pre-declared
    // and cannot be extended from a prototype patch without re-rendering.
    // -----------------------------------------------------------------------
    var _origShowLess = findApps.AppSummary.prototype.showLess;
    findApps.AppSummary.prototype.showLess = function () {
        _origShowLess.call(this);
        var versionNode = this.$.versionLbl && this.$.versionLbl.hasNode();
        if (!versionNode) { return; }

        // versionNode.parentNode is the VFlexBox container — always valid.
        var containerNode = versionNode.parentNode;

        // Collapse VFlexBox to a single bold line.
        // containerNode.style.display overrides the -webkit-box class rule inline.
        containerNode.style.display = "block";
        // setAttribute replaces the entire style attr, overriding any Enyo-set styles.
        versionNode.setAttribute("style", "display:inline;font-weight:bold;color:#2e2e2e;");
        // Find the label (first element sibling before versionNode).
        var labelNode = versionNode.previousSibling;
        while (labelNode && labelNode.nodeType !== 1) { labelNode = labelNode.previousSibling; }
        if (labelNode) { labelNode.style.display = "inline"; }

        // Inject or update the version notes block after the container.
        var note = this.appDetails && this.appDetails.versionNote;
        var noteEl = containerNode.nextSibling;

        if (noteEl && noteEl.className === "archive-version-note") {
            noteEl.style.marginTop = "14px";
            noteEl.style.marginLeft = "2px";
            if (note) {
                noteEl.lastChild.innerHTML = note.replace(/\r\n/g, "<br>").replace(/\n/g, "<br>");
                noteEl.style.display = "";
            } else {
                noteEl.style.display = "none";
            }
        } else if (note) {
            noteEl = document.createElement("div");
            noteEl.className = "archive-version-note";
            noteEl.style.marginTop = "14px";
            noteEl.style.marginLeft = "2px";
            // Inline styles on the children so behaviour doesn't depend on CSS cache.
            noteEl.innerHTML =
                '<div style="font-size:13px;font-weight:bold;color:#2e2e2e;margin-bottom:4px;">Version Notes</div>' +
                '<div style="font-size:13px;color:#555;white-space:pre-wrap;">' +
                note.replace(/\r\n/g, "<br>").replace(/\n/g, "<br>") +
                '</div>';
            containerNode.parentNode.insertBefore(noteEl, containerNode.nextSibling);
        }
    };

    // -----------------------------------------------------------------------
    // Pagination infrastructure
    //
    // Problem: the original code capped totalCount at the loaded-page size to
    // avoid a crash when Enyo rendered unloaded list slots with {}→setAppItem({})
    // →setSrc(undefined)→crash.  This prevented scroll-triggered fetches because
    // the VirtualList thought the list ended at item 49.
    //
    // Solution:
    //  1. appListChanged extends the sparse array to the real server total so the
    //     VirtualList scroll area reflects the full list.
    //  2. getAppItem returns true for empty slots by rendering a blank placeholder,
    //     so the VirtualList knows the list continues beyond the loaded page.
    //  3. nextPage/acquireListPage fire normally because !appList[index] is true
    //     for sparse (undefined) slots.
    //  4. appendToList does sparse placement at the first empty slot instead of
    //     concat, so items end up at the correct indices.
    //  5. setAppItem is guarded against missing images/appIcon to prevent any
    //     residual crash from bad data.
    // -----------------------------------------------------------------------

    var _origAppListChanged = findApps.AppList.prototype.appListChanged;
    findApps.AppList.prototype.appListChanged = function () {
        if (_pendingTotalCount > 0 && _pendingTotalCount > this.appList.length) {
            this.appList.length = _pendingTotalCount;
        }
        _pendingTotalCount = 0;
        _origAppListChanged.call(this);
    };

    findApps.AppList.prototype.appendToList = function (list) {
        var al = this.appList;
        var insertAt = 0;
        while (insertAt < al.length && al[insertAt]) { insertAt++; }
        for (var j = 0; j < list.length; j++) { al[insertAt + j] = list[j]; }
        this.appListUpdated();
    };

    var PLACEHOLDER_APP = {
        publicApplicationId: "", title: "", author: "",
        appIcon: "", images: [], ratingCount: 0, averageRating: 0,
        badges: [], price: 0, free: true
    };

    var _origGetAppItem = findApps.AppList.prototype.getAppItem;
    findApps.AppList.prototype.getAppItem = function (inSender, inIndex) {
        if (!this.appList || this.appList.length === 0) { return false; }
        if (inIndex >= 0 && inIndex < this.appList.length && !this.appList[inIndex]) {
            this.$.app_item.setAppItem(PLACEHOLDER_APP);
            return true;
        }
        return _origGetAppItem.call(this, inSender, inIndex);
    };

    var _origSetAppItem = findApps.AppItem.prototype.setAppItem;
    findApps.AppItem.prototype.setAppItem = function (appItem) {
        if (!appItem) { return; }
        if (!appItem.images) { appItem.images = []; }
        if (appItem.appIcon === undefined) { appItem.appIcon = ""; }
        _origSetAppItem.call(this, appItem);
    };

    // -----------------------------------------------------------------------
    // Button label: all archive apps are free, so replace "FREE" with "Install".
    // $L("FREE") is called in three AppStates and in appdownload.getFormattedPrice.
    // -----------------------------------------------------------------------
    if (typeof $L === "function") {
        var _origDollarL = $L;
        window.$L = function (s) {
            if (s === "FREE") { return "Install"; }
            return _origDollarL.apply(this, arguments);
        };
    }

    // -----------------------------------------------------------------------
    // Window-activation hook
    //
    // ApplicationEvents needs to live on a rendered Control to reliably receive
    // onWindowActivated.  We add one to AppCatalogWindow at create time and route
    // the event through a global callback slot so the install path can register
    // a one-shot handler without needing a reference to AppCatalogWindow.
    // -----------------------------------------------------------------------
    var _origACWCreate = findApps.AppCatalogWindow.prototype.create;
    findApps.AppCatalogWindow.prototype.create = function () {
        console.log("ARCHIVE-PATCH AppCatalogWindow.create override running");
        _origACWCreate.call(this);
        this.createComponent({
            kind: "ApplicationEvents",
            onWindowActivated:   "archivePatchWindowActivated",
            onWindowDeactivated: "archivePatchWindowDeactivated",
            onApplicationRelaunch: "archivePatchRelaunch",
            onWindowParamsChange:  "archivePatchParamsChange"
        });
    };
    findApps.AppCatalogWindow.prototype.archivePatchWindowActivated = function () {
        console.log("ARCHIVE-PATCH event: onWindowActivated");
        if (window._archivePatchOnActivated) {
            var cb = window._archivePatchOnActivated;
            window._archivePatchOnActivated = null;
            setTimeout(cb, 0);
        }
    };
    findApps.AppCatalogWindow.prototype.archivePatchWindowDeactivated = function () {
        console.log("ARCHIVE-PATCH event: onWindowDeactivated");
    };
    findApps.AppCatalogWindow.prototype.archivePatchRelaunch = function () {
        console.log("ARCHIVE-PATCH event: onApplicationRelaunch");
        if (window._archivePatchOnActivated) {
            var cb = window._archivePatchOnActivated;
            window._archivePatchOnActivated = null;
            setTimeout(cb, 0);
        }
    };
    findApps.AppCatalogWindow.prototype.archivePatchParamsChange = function () {
        console.log("ARCHIVE-PATCH event: onWindowParamsChange");
    };

    // -----------------------------------------------------------------------
    // Install chain
    // -----------------------------------------------------------------------

    // _fetchAppDetails: numeric-ID detection so either calling convention works.
    //   List-view (before updateFromServer): publicApplicationId = numeric string "1234",
    //     app.id = Enyo's auto-assigned component integer (NOT the archive ID).
    //   Detail-view / retry (after updateFromServer): publicApplicationId = Palm UUID
    //     "com.palm.app.maps", app.id = numeric archive ID string "1234".
    findApps.DownloadStateManager.prototype._fetchAppDetails = function (app, callback) {
        var pub      = String(app.publicApplicationId || "");
        var lookupId = /^\d+$/.test(pub) ? pub
                     : /^\d+$/.test(String(app.id || "")) ? String(app.id) : pub;
        app._archiveNumericId = lookupId;
        console.log("ARCHIVE-PATCH _fetchAppDetails palmId=" + app.publicApplicationId +
                 " lookupId=" + lookupId);
        findApps.BaseServer.getACServer().getApplicationDetails(
            null, lookupId,
            enyo.g11n.currentLocale().toISOString(), "GDBAppDetailsSvc", true, {
                onResponse: "detailscb",
                scope: this,
                app: app,
                callback: callback
            });
    };

    // AppInstallService.install: use Preware (applicationManager/open) instead of
    // com.palm.appInstallService, whose HP/Palm signature verification servers have been
    // offline since 2015.  Overriding the prototype covers every caller with one patch:
    //   - DownloadStateManager._install (normal Get flow)
    //   - AppState.InstallFailed.detailscb (retry flow)
    //
    // On success the button resets to Download ("Install") immediately.
    // Installed state is detected on the next App Catalog launch via the OS app scan.
    findApps.AppInstallService.prototype.install = function (app, successCb, failureCb) {
        var self   = this;
        var ipkUrl = app.packageUrl;
        console.log("ARCHIVE-PATCH AppInstallService.install via Preware ipkUrl=" + ipkUrl +
                 " id=" + app.publicApplicationId);

        if (!ipkUrl) {
            console.log("ARCHIVE-PATCH AppInstallService.install: no packageUrl");
            return;
        }

        var rand    = ("" + Date.now()).slice(-6);
        var svcName = "prewareSvc"  + rand;
        var okName  = svcName + "Ok";
        var errName = svcName + "Err";

        function cleanup() {
            self.owner.$[svcName] && self.owner.$[svcName].destroy();
            delete self.owner[okName];
            delete self.owner[errName];
        }

        // Preware card opened — reset button when App Catalog regains focus.
        // archivePatchWindowActivated (added to AppCatalogWindow.prototype.create above)
        // fires onWindowActivated and calls whatever is in window._archivePatchOnActivated.
        // Also re-keys _myApps from Palm UUID to numeric ID so AppList.serialSearch can
        // find the row (appList items are stored by numeric ID from transformApp, but
        // updateFromServer changed publicApplicationId to the Palm UUID).
        self.owner[okName] = function () {
            console.log("ARCHIVE-PATCH Preware launched; waiting for onWindowActivated");
            cleanup();
            window._archivePatchOnActivated = function () {
                var numId  = app._archiveNumericId ||
                             (/^\d+$/.test(String(app.id || "")) ? String(app.id) : null);
                var palmId = app.publicApplicationId;
                // updateFromServer changed publicApplicationId from the numeric archive ID to the
                // Palm UUID (e.g. "com.palm.webos.appscanner"), but _myApps is still keyed by the
                // numeric ID.  AppDownloadManager.updateDownloadState checks _myApps[publicApplicationId],
                // so APP_DELETED won't fire unless we restore the numeric ID first.
                if (numId && palmId !== numId) {
                    app.publicApplicationId = numId;
                    console.log("ARCHIVE-PATCH restored publicApplicationId: " + palmId + " -> " + numId);
                }
                app.setState("findApps.AppState.Download");
                console.log("ARCHIVE-PATCH setState(Download) called");
            };
        };

        // applicationManager/open failed — Preware is likely not installed.
        self.owner[errName] = function (inSender, inResponse) {
            console.log("ARCHIVE-PATCH Preware launch failed (is Preware installed?): " +
                     JSON.stringify(inResponse));
            app.errorCode = "PREWARE_NOT_FOUND";
            app.setState("findApps.AppState.InstallFailed");
            cleanup();
        };

        self.owner.createComponent({
            name:    svcName,
            kind:    "PalmService",
            service: "palm://com.palm.applicationManager/",
            owner:   self.owner
        });

        self.owner.$[svcName].call(
            { id: "org.webosinternals.preware", params: { type: "install", file: ipkUrl } },
            { method: "open", onSuccess: okName, onFailure: errName }
        );
    };

    // updateFromInstallNotification: the original re-initializes the current state on
    // change="added" without transitioning to Installed.  Override to properly mark the
    // app as installed when launchPointChanges fires after a Preware install.
    var _origUpdateFromInstallNotification =
        findApps.AppDownload.prototype.updateFromInstallNotification;
    findApps.AppDownload.prototype.updateFromInstallNotification = function (appDetails) {
        if (appDetails.change === "added") {
            console.log("ARCHIVE-PATCH updateFromInstallNotification: installed " +
                     this.publicApplicationId);
            if (appDetails.version) { this.installedVersion = appDetails.version; }
            this.serverVersion = this.serverVersion || appDetails.version;
            this.setState("findApps.AppState.Installed");
        } else {
            _origUpdateFromInstallNotification.call(this, appDetails);
        }
    };

    // _appInstallServiceStatusCB: when appInstallService reports a stale "install failed"
    // (left over from FAILED_VERIFY attempts before we switched to Preware), call
    // appInstallService/cancel to clear the record from the daemon's state.  Without this,
    // the daemon re-broadcasts the failure on every App Catalog launch and may show a
    // system-level notification banner the app cannot suppress from JS alone.
    // The original callback is still called; updateFromStatus (overridden below) handles
    // suppressing the in-app state transition.
    findApps.AppDownloadManager.prototype._archivePatchNoop = function () {};

    var _origStatusCB = findApps.AppDownloadManager.prototype._appInstallServiceStatusCB;
    findApps.AppDownloadManager.prototype._appInstallServiceStatusCB = function (inSender, inResponse) {
        var apps = (inResponse && inResponse.status && inResponse.status.apps)
                 ? inResponse.status.apps
                 : (inResponse && inResponse.id ? [inResponse] : []);
        for (var i = 0; i < apps.length; i++) {
            var details = apps[i].details || {};
            if (details.state === "install failed" && apps[i].id) {
                console.log("ARCHIVE-PATCH canceling stale appInstallService failure for " + apps[i].id);
                try {
                    this.$.appinstallservice.cancel(
                        apps[i].id,
                        "_archivePatchNoop",
                        "_archivePatchNoop"
                    );
                } catch (e) {}
            }
        }
        _origStatusCB.call(this, inSender, inResponse);
    };

    // updateFromStatus: suppress stale "install failed" state transitions.
    // The cancel call above clears the daemon record; this is a belt-and-suspenders
    // guard for the in-app button state.
    var _origUpdateFromStatus = findApps.AppDownload.prototype.updateFromStatus;
    findApps.AppDownload.prototype.updateFromStatus = function (id, appDetails) {
        if (appDetails && appDetails.state === "install failed") {
            console.log("ARCHIVE-PATCH updateFromStatus: ignoring stale install failed for " + id);
            return;
        }
        _origUpdateFromStatus.call(this, id, appDetails);
    };

    // -----------------------------------------------------------------------
    // Fetch live config to get the actual image host (load-balanced).
    // Updates _imageBase; image URLs are built lazily so this races fine.
    // -----------------------------------------------------------------------
    var cfgXhr = new XMLHttpRequest();
    cfgXhr.open("GET", API_BASE + "getConfig.php", true);
    cfgXhr.onload = function () {
        if (cfgXhr.status === 200) {
            try {
                var cfg = JSON.parse(cfgXhr.responseText);
                if (cfg && cfg.image_host)   { _imageBase   = "http://" + cfg.image_host + "/"; }
                if (cfg && cfg.package_host) { _packageBase = cfg.package_host; }
            } catch (e) {}
        }
    };
    cfgXhr.send();

    // -----------------------------------------------------------------------
    // Self-update: check the static compatibility manifest served at the
    // domain root. Per webos-catalog-service's own docs, this is the same
    // mechanism the patched HP clients have always self-updated from — kept on
    // plain HTTP on purpose, since it has to work on a freshly-Doctored device
    // before Preware or the community OTA (and its modern TLS) are installed.
    // Best-effort only: any failure here just means no update prompt, never a
    // blocked launch.
    // -----------------------------------------------------------------------
    function isNewerVersion(remoteVersion, localVersion) {
        var r = String(remoteVersion).split(".").map(Number);
        var l = String(localVersion).split(".").map(Number);
        for (var i = 0; i < Math.max(r.length, l.length); i++) {
            var rv = r[i] || 0, lv = l[i] || 0;
            if (rv !== lv) { return rv > lv; }
        }
        return false;
    }

    function installViaPreware(fileUrl) {
        if (!fileUrl) { return; }
        try {
            var bridge = new PalmServiceBridge();
            bridge.call("palm://com.palm.applicationManager/open",
                JSON.stringify({ id: "org.webosinternals.preware", params: { type: "install", file: fileUrl } }));
        } catch (e) {
            console.log("ARCHIVE-PATCH: could not launch Preware install: " + e);
        }
    }

    function showUpdatePrompt(manifest) {
        var overlay = document.createElement("div");
        overlay.setAttribute("style",
            "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);" +
            "z-index:99999;display:flex;align-items:center;justify-content:center;");

        var box = document.createElement("div");
        box.setAttribute("style",
            "background:#2e2e2e;color:#fff;width:80%;max-width:420px;padding:20px;" +
            "border-radius:8px;font-size:15px;line-height:1.4em;box-sizing:border-box;");

        var title = document.createElement("div");
        title.setAttribute("style", "font-weight:bold;font-size:18px;margin-bottom:10px;");
        title.textContent = "Update Available";

        var msg = document.createElement("div");
        msg.innerHTML = "App Catalog " + manifest.version + " is available." +
            (manifest.versionNote ? "<br><br>" + manifest.versionNote : "");

        var buttons = document.createElement("div");
        buttons.setAttribute("style", "display:flex;justify-content:center;gap:16px;margin-top:20px;");

        var laterBtn = document.createElement("button");
        laterBtn.textContent = "Later";
        laterBtn.setAttribute("style", "padding:8px 20px;");
        laterBtn.onclick = function () { document.body.removeChild(overlay); };

        var updateBtn = document.createElement("button");
        updateBtn.textContent = "Update Now";
        updateBtn.setAttribute("style", "padding:8px 20px;font-weight:bold;");
        updateBtn.onclick = function () {
            document.body.removeChild(overlay);
            installViaPreware(manifest.filename);
        };

        buttons.appendChild(updateBtn);
        buttons.appendChild(laterBtn);
        box.appendChild(title);
        box.appendChild(msg);
        box.appendChild(buttons);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    }

    function checkForCatalogUpdate() {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "http://appcatalog.webosarchive.org/appcatalog-touchpad.json", true);
        xhr.onload = function () {
            if (xhr.status !== 200) { return; }
            var manifest;
            try { manifest = JSON.parse(xhr.responseText); } catch (e) { return; }
            if (manifest && manifest.version && isNewerVersion(manifest.version, enyo.fetchAppInfo().version)) {
                showUpdatePrompt(manifest);
            }
        };
        xhr.onerror = function () {};
        xhr.send();
    }

    // Give the launcher window a moment to finish rendering before popping an
    // overlay on top of it.
    setTimeout(checkForCatalogUpdate, 3000);

}());
