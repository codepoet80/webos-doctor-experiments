// Stubs loaded AFTER build.js. Patches kinds and globals so the Magazine
// can render standalone in a browser without live catalog or luna services.

// Give ViewLibrary a container stub so MagazinePageCarousel.sizeControls
// doesn't throw when checking isTopView.
findApps.ViewLibrary._container = {
    isTopView: function() { return true; },
    setView: function() {},
    popViewsFromHistory: function() {},
    goBack: function() {}
};

// editionsMgrHelper.getEdition() fires a luna PalmService call to schedule
// a background edition download. We don't need that — no-op it.
enyo.FindApps.Magazine.EditionsMgrHelper.prototype.getEdition = function() {};

// Stub enyo.application singletons that catalog buttons reference.
// downloadsavebutton and genericDownloadButton both reach into these.
enyo.application = enyo.application || {};
enyo.application.savedList = {
    attach: function() {},
    detach: function() {},
    isSaved: function() { return false; },
    saveApp: function() {},
    removeApp: function() {},
    getList: function() { return []; },
    contains: function() { return false; }
};
enyo.application.appdownloadManager = {
    attach: function() {},
    detach: function() {},
    myAppsListIsReady: function() { return false; },
    belongToMyApp: function() { return null; },
    getAppDownload: function() { return null; },
    MYAPPS_ALL: 'all'
};
enyo.application.sessionManager = {
    triggerInitSession: function() { return { status: 'complete' }; }
};
enyo.application.connectionManager = {
    isConnected: function() { return true; },
    monitor: function() {}
};

// Replace downloadsavebutton with a silent placeholder so app-grid pages
// render without triggering catalog service calls.
enyo.kind({
    name: 'findApps.downloadsavebutton',
    kind: enyo.Control,
    published: { appItem: {} },
    create: function() {
        this.inherited(arguments);
        this.applyStyle('font-size', '9px');
        this.applyStyle('color', '#888');
        this.applyStyle('padding', '2px 4px');
        var id = this.appItem && this.appItem.appId ? this.appItem.appId : '';
        this.setContent(id);
    },
    appItemChanged: function() {
        var id = this.appItem && this.appItem.appId ? this.appItem.appId : '';
        this.setContent(id);
    },
    setButton: function() {},
    disableMe: function() {},
    updateFromServer: function() {}
});

// AppInfoService fetches live app ratings/prices from the catalog. Return
// empty data so app cards render without errors.
enyo.FindApps.Magazine.AppInfoService.prototype.getAppList = function() {
    this._returnResponse([]);
};

// MagazinePage.generateLayout() calls orientationChanged(window.innerWidth,
// window.innerHeight) which picks up the desktop browser window size rather
// than the viewport div.  Override it to always use the viewport element so
// portrait/landscape tracks what the toolbar sets, not the browser window.
enyo.FindApps.Magazine.MagazinePage.prototype.orientationChanged = function(a, b) {
    var vp = document.getElementById('viewport');
    var w = vp ? vp.offsetWidth  : parseInt(a);
    var h = vp ? vp.offsetHeight : parseInt(b);
    if (this.hasCustomLandscapeLayout) {
        var landscape = w > h;
        if (landscape && !this.landscapeMode) {
            this.landscapeMode = true;
        } else if (!landscape && this.landscapeMode) {
            this.landscapeMode = false;
        }
    }
    this._selectOrientView();
};

// Override loadDraftEdition to use fetch() instead of enyo.WebService.
// The Enyo WebService XHR chain doesn't run cleanly outside the webOS
// runtime (PalmSystem stubs, path.rewrite, requestKind resolution).
// fetch() is simpler and guaranteed to work in a desktop browser.
enyo.FindApps.Magazine.Magazine.prototype.loadDraftEdition = function() {
    var self = this;
    var url = AppCatalog.Config.draftEditionDir + '/manifest.json';
    console.log('[Magazine] fetching manifest via fetch():', url);
    fetch(url)
        .then(function(r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        })
        .then(function(data) {
            console.log('[Magazine] manifest loaded, files:', (data.results || data.fileset || []).length);
            self.drafEditionFilesetLoaded(null, data);
        })
        .catch(function(err) {
            console.error('[Magazine] manifest fetch failed:', err);
            self.drafEditionFilesetNotLoaded(null, null);
        });
};

// ── Diagnostics ──────────────────────────────────────────────────────────────
// Wrap key Magazine loading methods so the browser console shows exactly
// how far execution gets. Remove once the preview is working.
(function () {
    var M = enyo.FindApps.Magazine.Magazine.prototype;

    var origCreate = M.create;
    M.create = function () {
        console.log('[Magazine] create — draftEditionDir:', AppCatalog.Config.draftEditionDir);
        origCreate.apply(this, arguments);
    };

    var origLoad = M.loadDraftEdition;
    M.loadDraftEdition = function () {
        console.log('[Magazine] loadDraftEdition — fetching manifest');
        origLoad.apply(this, arguments);
    };

    var origLoaded = M.drafEditionFilesetLoaded;
    M.drafEditionFilesetLoaded = function (sender, response) {
        var files = (response && (response.fileset || response.results)) || [];
        console.log('[Magazine] drafEditionFilesetLoaded — files:', files.length);
        origLoaded.apply(this, arguments);
    };

    var origNotLoaded = M.drafEditionFilesetNotLoaded;
    M.drafEditionFilesetNotLoaded = function () {
        console.error('[Magazine] drafEditionFilesetNotLoaded — manifest XHR failed');
        origNotLoaded.apply(this, arguments);
    };

    var origProcess = M.processEditionFileSet;
    M.processEditionFileSet = function (fileSet) {
        console.log('[Magazine] processEditionFileSet — entries:', fileSet && fileSet.length);
        origProcess.apply(this, arguments);
    };

    var origGetView = M.getView;
    M.getView = function (page) {
        console.log('[Magazine] getView — page:', page);
        return origGetView.apply(this, arguments);
    };
})();
