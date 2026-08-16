// Stubs loaded BEFORE enyo-build.js, UserSession.js, and build.js.

// enyo-build.js is the compiled Enyo framework. It extends an existing `enyo`
// object rather than creating it — that bootstrapping is normally done by
// enyo.js. We replicate the minimum here so enyo-build.js can parse cleanly.
window.enyo = window.enyo || {};
enyo.args = {};
// enyoPath is read at parse time by the dependency-loader section of
// enyo-build.js to populate enyo.path.paths.enyo. Point it at our vendor dir.
enyo.enyoPath = '/PivotMagazine-WOSA/Tools/preview/vendor';

// enyo.g11n checks PalmSystem to determine platform. Providing it makes
// g11n use 'device' mode and pick up PalmSystem.locale as the locale.
window.PalmSystem = {
    locale: 'en_us',
    localeRegion: 'us',
    phoneRegion: 'us',
    identifier: 'com.palm.app.findapps 0',
    isActivated: true,
    deviceInfo: JSON.stringify({ modelName: 'TouchPad', platformVersion: '3.0.5' }),
    stageReady: function() {},
    setWindowOrientation: function() {},
    activate: function() {},
    deactivate: function() {},
    show: function() {},
    hide: function() {},
    setWindowProperties: function() {}
};

// build.js calls $L("...") at parse time for UI strings.
window.$L = function(s) { return s; };

// palmGetResource is a webOS native for loading package resources.
window.palmGetResource = function() { return null; };

// PalmServiceBridge is the native luna IPC bridge. Stub it so PalmService
// and DbService can be instantiated without crashing (calls are silently dropped).
window.PalmServiceBridge = function() {
    this.onservicecallback = null;
    this.call = function() {};
    this.cancel = function() {};
};

// Ensure the country localStorage key is set so UserSession.getActivationCountry()
// returns a non-null string (it reads this key directly).
localStorage.setItem('com.palm.app.findapps.country', 'US');
