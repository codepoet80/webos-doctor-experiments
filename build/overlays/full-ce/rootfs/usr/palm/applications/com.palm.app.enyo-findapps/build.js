// UserSession.js

var findApps = findApps || {};

findApps.UserSession = {
_session: null,
_sessionError: !1,
_accountInfo: null,
_accountId: null,
_serverUrl: null,
_server2Url: null,
_deviceId: null,
_softwareBuildBranch: null,
_token: null,
_email: null,
_authHeaders: null,
_paymentServerUrl: null,
_paymentServerError: !1,
_callerVersion: null,
_TOSDate: "7th Aug 2009",
cleanup: function() {
this._session = null;
},
getSession: function() {
return this._session;
},
getAccountInfo: function() {
return this._accountInfo;
},
setAccountInfo: function(a) {
this._accountInfo = a;
},
getActivationCountry: function() {
return localStorage.getItem("com.palm.app.findapps.country");
},
setActivationCountry: function(a) {
var b = this._session.deviceProperties;
b.country = a, findApps.UserSession._activationCountrySet = !0, localStorage.setItem("com.palm.app.findapps.country", a);
},
isActivationCountrySet: function() {
var a = localStorage.getItem("com.palm.app.findapps.country");
return a ? !0 : !1;
},
getAccountToken: function() {
return this._accountToken || findApps.UserSession._deviceId && findApps.UserSession._token && findApps.UserSession._email && (this._accountToken = {
token: findApps.UserSession._token,
email: findApps.UserSession._email,
deviceId: findApps.UserSession._deviceId
}), this._accountToken;
},
isTermsAccepted: function() {
var a = localStorage.getItem("com.palm.app.findapps.terms");
return a ? !0 : !1;
},
setTermsAccepted: function() {
localStorage.setItem("com.palm.app.findapps.terms", this._TOSDate);
}
};

// noWindow/source/AppCatalogLauncher.js

enyo.kind({
name: "findApps.AppCatalogLauncher",
kind: "enyo.Object",
constructor: function() {
this.inherited(arguments);
},
startup: function() {
enyo.application.onDevice = navigator.userAgent.toLowerCase().indexOf("wossystem") > -1 || navigator.userAgent.toLowerCase().indexOf("hpwos") > -1 ? !0 : !1, enyo.application.onBrowser = !enyo.application.onDevice;
var a = window.PalmSystem && PalmSystem.launchParams || "{}", b = JSON.parse(a);
this.relaunch(b);
},
launchView: function(a, b, c) {
this.log("launchView viewToLoad ", a, "viewParams ", b, "windowParams ", c), b.viewToLoad = a;
var d = enyo.application.onBrowser ? "main/main.html?debug=true" : "main/main.html";
return enyo.windows.activate(d, "main", b, c), !0;
},
relaunch: function(a) {
this.log("AppCatMain Launch relaunch called with param keys " + a);
var b = function(a) {
var b = /[?&]packageid=([^&]*)(?:&applicationid=(\d*)){0,1}/.exec(a);
return b ? {
packageId: b[1],
applicationId: b[2]
} : {};
}, c = function(a) {
var b = "", c = /[?&]promocode=([^&]*){0,1}/.exec(a);
return b = c ? c[1] : "", b;
}, d = function(a) {
var b = /[?&]initialview=([^&]*){0,1}/.exec(a);
return b ? b[1] : "";
}, e = "default", f = !1, g = {
modalMode: f
}, h = {};
a.createAsModal && (h.window = "modalwindow");
if (a && a.target) {
var i = a.target, j = d(a.target);
if (j && j === "PREFERENCES") g.initialView = !0, g.showPaymentSetup = !0, g.modalMode = !0, g.modalId = a.modalId, f = !0, e = "PREFERENCES"; else {
var k = c(i);
if (!k || k == "") {
var l = b(i);
l && (g.id = l.applicationId, g.publicApplicationId = l.packageId, e = "APPDETAILS");
} else {
var m = k.indexOf('"') < 0 ? k.length : k.indexOf('"');
k = k.substring(0, m), k.length > 0 && (g.promoCode = k, e = "PROMOCODE");
}
}
}
a && a.common && a.common.sceneType && a.common.sceneType == "search" && (enyo.mixin(g, a.common.params), e = "SEARCHAPPS");
if (findApps.UserSession.isActivationCountrySet() === !1) {
var n = {};
enyo.mixin(n, g), g = {
modalMode: f
}, n.modalId && (g.modalId = n.modalId), g.nextViewParams = n, g.nextView = e, e = "COUNTRYPICKER";
} else if (!findApps.UserSession.isTermsAccepted()) {
var n = {};
enyo.mixin(n, g), g = {
modalMode: f
}, n.modalId && (g.modalId = n.modalId), g.nextViewParams = n, g.nextView = e, e = "TERMSCONDITIONS";
}
this.launchView(e, g, h);
}
});
