/*global enyo, console, window */
/*
 * CloudAuth - GENERIC customUI account validator for every _cloudcore connector. ONE app
 * replaces the per-provider *-auth apps (gdrive-auth / dropbox-auth / boxnet-auth /
 * yandexdisk-auth), also covers pCloud. It knows nothing provider-specific; it derives
 * everything from the account template handed in via enyo.windowParams:
 *   - service URI    <- template.validator.address ("palm://com.palm.service.X/exchangeCode")
 *   - redirect prefix<- the redirect_uri embedded in the authorize URL getAuthorizeUrl returns
 *   - window title   <- template.loc_name
 *
 * Flow: the legacy system webview can't render a modern OAuth page (device OpenSSL-0.9.8k), so
 * the sign-in page is hosted in an embedded Atlas WebView (enyo.BasicWebView with its plugin
 * mime swapped to application/x-atlas-browser -> BrowserServer-atlas = WPE + modern TLS 1.3),
 * INLINE here (no separate card). We get the authorize URL + PKCE verifier from the service,
 * navigate the embedded WebView to it (atlas-simple viewport), and watch its navigation events
 * for the provider's redirect_uri (?code=...). We then hand the code (+ PKCE verifier, + any
 * region hints) to the service's exchangeCode and return { returnValue, credentials, template }.
 *
 * REDIRECT CAPTURE: cloud redirect_uris are NOT the msauth.* native scheme (they are per-provider
 * http/https/custom URIs), so the engine's native-scheme oauthRedirect hook (msauth only) does not
 * fire for them. Instead we capture in JS from the WebView's onUrlRedirected / onPageTitleChanged
 * events (URL starts with the redirect prefix) -- exactly what the old Atlas sign-in CARD did in
 * BrowserApp.checkOAuthRedirect. The engineOAuthRedirect() actionData path is also wired for any
 * provider that ever uses a custom (msauth-like) scheme.
 */

// --- Atlas engine embed (inline OAuth2 sign-in) ------------------------------
// Swap enyo.BasicWebView's plugin mime to application/x-atlas-browser so it routes to
// BrowserServer-atlas (WPE, modern WebKit/TLS). actionData("oauthRedirect") (fired by the engine
// for native-scheme redirects) is routed up the owner chain to the validator's engineOAuthRedirect.
// Only applies where the NPAPI plugin exists (legacy webOS). LuneOS has no plugin to re-point and
// hosts the sign-in page in a window.open()ed WAM window instead — see oauthWindow.js and
// startEmbeddedAuth() below.
(function () {
	function patch() {
		if (window.OAuthWindow && !window.OAuthWindow.hasPluginWebView()) { return true; }
		if (!(window.enyo && enyo.BasicWebView && enyo.BasicWebView.prototype)) { return false; }
		if (enyo.BasicWebView.prototype.__atlasPatched) { return true; }
		enyo.BasicWebView.prototype.__atlasPatched = true;
		var origCreate = enyo.BasicWebView.prototype.create;
		enyo.BasicWebView.prototype.create = function () {
			origCreate.apply(this, arguments);
			this.domAttributes.type = "application/x-atlas-browser";
		};
		enyo.BasicWebView.prototype.actionData = function (dataType, data) {
			if (dataType === "oauthRedirect" && data) {
				var c = this, n = 0;
				while (c && n < 12) {
					if (typeof c.engineOAuthRedirect === "function") { c.engineOAuthRedirect(data); break; }
					c = c.owner || c.parent || c.container; n++;
				}
			}
		};
		return true;
	}
	if (!patch() && window.enyo) {
		var t = setInterval(function () { if (patch()) { clearInterval(t); } }, 50);
	}
})();

enyo.kind({
	name: "CloudAuth",
	kind: enyo.VFlexBox,

	components: [
		{ kind: "Toolbar", className: "enyo-toolbar-light accounts-header", pack: "center", components: [
			// Provider icon, shown next to the title to match the IM (AIM/Telegram) add-account
			// header. Hidden until create() resolves the icon from the template.
			{ kind: "Image", name: "headerIcon", className: "accounts-header-icon", showing: false },
			{ kind: "Control", name: "title", content: "Sign In" }
		]},
		// svc.service is set at runtime from the template (see create()).
		{ name: "svc", kind: "PalmService", onFailure: "svcFailure" },
		// Entry view (instructions + Sign In). Hidden while the inline OAuth webview is showing.
		{ name: "entryView", kind: "Scroller", flex: 1, components: [
			{ className: "box-center", components: [
				{ name: "status", className: "accounts-body-text", style: "padding:16px; line-height:1.4;",
					content: "Tap Sign In to sign in right here. After you approve access, you'll be returned automatically." }
			]}
		]},
		// Inline OAuth2 sign-in view. The Atlas-routed WebView is created lazily in performSignIn().
		{ name: "oauthBox", kind: "VFlexBox", flex: 1, showing: false, components: [
			// Thin page-load progress bar (like the Atlas browser's), driven by the WebView's
			// onLoadProgress; the page load has no other indicator and takes ~10s.
			{ name: "oauthProgressWrap", style: "height:3px; background:transparent;", components: [
				{ name: "oauthProgress", style: "height:3px; width:0%; background:#3b82f6;" +
					" -webkit-transition:width 0.25s ease-out;" }
			]},
			{ name: "oauthStatus", className: "accounts-body-text", style: "padding:8px 16px; line-height:1.3;",
				content: "Loading sign-in…" }
		]},
		{ kind: "Toolbar", className: "enyo-toolbar-light", components: [
			{ name: "signInButton", kind: "Button", caption: "Sign In", className: "enyo-button-dark accounts-btn", onclick: "performSignIn" },
			{ kind: "Button", caption: "Cancel", className: "accounts-toolbar-btn", onclick: "cancel" }
		]},
		{ name: "xresult", kind: "enyo.CrossAppResult" }
	],

	create: function () {
		this.inherited(arguments);
		this.done = false;
		this.params = enyo.windowParams || {};
		var tmpl = this.params.template || {};
		// Service URI from the template validator address ("palm://com.palm.service.X/exchangeCode").
		var addr = (tmpl.validator && tmpl.validator.address) || "";
		this.serviceUri = addr.replace(/exchangeCode\/*$/, "");
		// Re-auth (mode:"modify") passes the existing ACCOUNT but NO template, so there's no
		// validator.address. Derive the service from the account's capability-provider implementation
		// ("palm://com.palm.service.X/") instead, so re-authenticating a broken account still works.
		if (!this.serviceUri && this.params.account && this.params.account.capabilityProviders) {
			var cps = this.params.account.capabilityProviders;
			for (var i = 0; i < cps.length; i++) {
				if (cps[i] && cps[i].implementation) { this.serviceUri = cps[i].implementation; break; }
			}
		}
		if (this.serviceUri && this.serviceUri.charAt(this.serviceUri.length - 1) !== "/") {
			this.serviceUri += "/";
		}
		if (this.serviceUri) { this.$.svc.setService(this.serviceUri); }
		// Header reads "Sign In" (matching the IM/AIM add-account header); the provider is identified
		// by the icon, so we don't overwrite the title with the service name.
		// Header icon: the framework hands us an ALREADY-ABSOLUTE icon path in the template
		// (e.g. /usr/palm/public/accounts/com.palm.gdrive/images/gdrive-48x48.png), reachable under
		// the app's file:// origin, so use it directly. Re-auth (modify) passes no template -> stays hidden.
		var iconPath = tmpl.icon && (tmpl.icon.loc_48x48 || tmpl.icon.loc_32x32);
		if (iconPath) {
			this.$.headerIcon.setSrc(iconPath);
			this.$.headerIcon.setShowing(true);
		}
		this.log("cloud-auth: launch params " + enyo.json.stringify(this.params));
		this.log("cloud-auth: serviceUri=" + (this.serviceUri || "(none)"));
	},

	setStatus: function (t) { this.$.status.setContent(t); },

	// Step 1: get the authorize URL (+ PKCE verifier) from the (derived) service.
	performSignIn: function () {
		if (this.done) { return; }
		if (!this.serviceUri) { this.finish({ returnValue: false, errorCode: "NO_SERVICE" }); return; }
		this.$.signInButton.setDisabled(true);
		this.setStatus("Opening sign-in…");
		this.$.svc.call({ state: "cloud" }, {
			method: "getAuthorizeUrl",
			onSuccess: "startEmbeddedAuth",
			onFailure: "svcFailure"
		});
	},

	// Step 2: navigate the inline Atlas WebView to the authorize URL (atlas-simple viewport).
	startEmbeddedAuth: function (inSender, inResponse) {
		if (!inResponse || !inResponse.url) { this.svcFailure(inSender, inResponse); return; }
		this.oauthDone = false;
		this._oauthLoaded = false;
		this._authUrl = inResponse.url;
		// Hold the PKCE verifier across the whole web login: the service that made it gets
		// idle-killed during sign-in, so exchangeCode must be given it explicitly.
		this._codeVerifier = inResponse.codeVerifier;
		// Redirect prefix to watch for = the redirect_uri embedded in the authorize URL (per-provider).
		var m = inResponse.url.match(/[?&]redirect_uri=([^&]+)/);
		this.redirectPrefix = m ? decodeURIComponent(m[1]) : "http://localhost/oauth2callback";
		this.log("cloud-auth: startEmbeddedAuth authUrl=" + (this._authUrl || "").substring(0, 100) +
			" | redirectPrefix=" + this.redirectPrefix);

		// Switch to the inline OAuth webview.
		this.$.entryView.hide();
		this.$.oauthBox.show();
		this.$.oauthStatus.setContent("Loading sign-in…");

		// No NPAPI plugin (LuneOS): host the sign-in page in its own WAM window. Cloud
		// redirect_uris are ordinary http/https URLs, so OAuthWindow captures the result by
		// reading the popup's location once it reaches redirectPrefix — the same match
		// checkOAuthRedirect() makes for the embedded WebView's navigation events.
		if (window.OAuthWindow && !window.OAuthWindow.hasPluginWebView()) {
			this.$.oauthStatus.setContent("Sign in in the window that just opened. " +
				"You'll be returned here automatically.");
			var lune = this;
			this._oauthWindow = window.OAuthWindow.open({
				url: this._authUrl,
				name: "cloudSignIn",
				redirectPrefix: this.redirectPrefix,
				timeoutMs: 240000,
				onRedirect: function (url) { lune.checkOAuthRedirect(url); },
				onError: function (msg) { lune.abortOAuth(msg); }
			});
			return;
		}

		if (!this.$.oauthWeb) {
			this.$.oauthBox.createComponent({
				name: "oauthWeb", kind: "WebView", width: "100%", height: "600px",
				// atlas-simple (MODE-2) viewport: a screen-sized render buffer -> correct tap coordinates,
				// legible layout, AND fast load (no 1024x3072 tall-buffer full readback, which made MODE-1
				// take ~30s vs <10s). Requires the BrowserServer-atlas fix that makes setWindowSize's
				// width-change path respect m_simpleMode (else the buffer desyncs -> onFrame drops -> white).
				// Seed the URL with the marker so the FIRST ensureWebView builds the mult=1 viewport.
				url: "atlas-simple:about:blank",
				onConnected: "oauthConnected", onError: "oauthWebError",
				// Cloud redirect_uris are http/https/custom (not msauth), so capture in JS from these
				// navigation events (URL starts with redirectPrefix) rather than the engine msauth hook.
				onUrlRedirected: "oauthRedirectedNav", onPageTitleChanged: "oauthTitleNav",
				// Page-load progress bar feedback (each of the 3 auth pages fires start/progress/complete).
				onLoadStarted: "oauthLoadStarted", onLoadProgress: "oauthLoadProgress",
				onLoadComplete: "oauthLoadDone", onLoadStopped: "oauthLoadDone"
			}, { owner: this });
			this.$.oauthBox.render();
		} else {
			this.oauthConnected();
		}
		// Fallback if onConnected doesn't fire (enyo 0.10 has no startJob/stopJob -> window timers).
		this.clearOAuthLoadTimer();
		var self = this;
		this._oauthLoadTimer = window.setTimeout(function () { self.oauthConnected(); }, 3000);
		if (this._oauthDeadline) { window.clearTimeout(this._oauthDeadline); }
		this._oauthDeadline = window.setTimeout(function () { self.oauthTimeout(); }, 240000);
	},

	clearOAuthLoadTimer: function () {
		if (this._oauthLoadTimer) { window.clearTimeout(this._oauthLoadTimer); this._oauthLoadTimer = null; }
	},

	clearOAuthTimers: function () {
		this.clearOAuthLoadTimer();
		if (this._oauthDeadline) { window.clearTimeout(this._oauthDeadline); this._oauthDeadline = null; }
	},

	// Adapter connected -> enter atlas-simple viewport then navigate to the authorize URL.
	oauthConnected: function () {
		if (this._oauthLoaded || !this._authUrl || !this.$.oauthWeb) { return; }
		this._oauthLoaded = true;
		this.clearOAuthLoadTimer();
		this.log("cloud-auth: oauthConnected -> openURL atlas-simple:" + (this._authUrl || "").substring(0, 60));
		try {
			this.$.oauthWeb.callBrowserAdapter("openURL", ["atlas-simple:" + this._authUrl]);
		} catch (e) {
			this.log("cloud-auth: openURL failed: " + e);
			this._oauthLoaded = false;
			this.oauthWebError();
		}
	},

	// ---- page-load progress bar --------------------------------------------
	setProgress: function (pct) {
		if (this.$.oauthProgress) { this.$.oauthProgress.applyStyle("width", pct + "%"); }
	},
	oauthLoadStarted: function () {
		if (this.oauthDone) { return; }
		this.setProgress(8);
		if (this.$.oauthStatus) { this.$.oauthStatus.setContent(""); }
	},
	oauthLoadProgress: function (inSender, inProgress) {
		if (this.oauthDone) { return; }
		var p = (inProgress <= 1) ? inProgress * 100 : inProgress;   // normalize 0-1 or 0-100
		if (p < 8) { p = 8; } if (p > 100) { p = 100; }
		this.setProgress(p);
	},
	oauthLoadDone: function () {
		this.setProgress(100);
		var self = this;
		window.setTimeout(function () { self.setProgress(0); }, 350);
	},

	// Navigation-event capture (the primary path for cloud http/https redirect_uris).
	oauthRedirectedNav: function (inSender, inUrl) { this.checkOAuthRedirect(inUrl); },
	oauthTitleNav: function (inSender, inTitle, inUrl) { this.checkOAuthRedirect(inUrl); },
	// actionData("oauthRedirect") capture (native-scheme path, for any custom-scheme provider).
	engineOAuthRedirect: function (url) { this.checkOAuthRedirect(url); },

	// Every navigation is checked against the redirect_uri prefix (mirrors the old Atlas card's
	// BrowserApp.checkOAuthRedirect). On a match carrying ?code=..., stop and exchange.
	checkOAuthRedirect: function (url) {
		if (this.oauthDone || this.done || !url) { return; }
		if (url.indexOf(this.redirectPrefix) !== 0) { return; }   // not the redirect target
		var err = this.queryParam(url, "error");
		var code = this.queryParam(url, "code");
		if (!err && !code) { return; }   // redirect target but no result yet
		this.oauthDone = true;           // guard immediately (this fires from a WebView nav event)
		this.clearOAuthTimers();
		// Region-sharded providers (pCloud) put extra params on the redirect that their exchangeCode
		// needs (hostname / locationid = which data region the account lives in). Capture verbatim;
		// harmless for every other provider - the generic exchangeCode ignores unknown args.
		this.capturedHostname   = this.queryParam(url, "hostname");
		this.capturedLocationId = this.queryParam(url, "locationid");
		// DEFER teardown+exchange OUT of the WebView's own navigation-event callback. Destroying the
		// plugin synchronously from inside its event dispatch re-enters the dying webview and crashes
		// the host (LunaSysMgr restart). setTimeout(0) runs it on a fresh stack after the event unwinds.
		var self = this;
		window.setTimeout(function () {
			self.destroyOAuthWeb();
			if (err) { self.finish({ returnValue: false, errorCode: "OAUTH_DENIED", detail: err }); return; }
			self.exchange(code);
		}, 0);
	},

	oauthWebError: function () {
		if (this.oauthDone || this.done) { return; }
		this.log("cloud-auth: oauth webview error");
		this.abortOAuth("Could not open the sign-in page. Please try again.");
	},

	oauthTimeout: function () {
		if (this.oauthDone || this.done) { return; }
		this.abortOAuth("Sign-in timed out — please try again.");
	},

	// Return to the entry view (on error/timeout) and release the webview.
	abortOAuth: function (msg) {
		this.clearOAuthTimers();
		this.destroyOAuthWeb();
		this.$.oauthBox.hide();
		this.$.entryView.show();
		this.$.signInButton.setDisabled(false);
		this.setStatus(msg || "");
	},

	destroyOAuthWeb: function () {
		this.clearOAuthLoadTimer();
		this._oauthLoaded = false;
		// LuneOS path: drop the sign-in window and its listeners/timers. Safe to call twice —
		// OAuthWindow already tore itself down if it was the one that captured the redirect.
		if (this._oauthWindow) {
			try { this._oauthWindow.close(); } catch (e0) {}
			this._oauthWindow = null;
		}
		if (this.$.oauthWeb) {
			try { this.$.oauthWeb.callBrowserAdapter("disconnectBrowserServer", []); } catch (e) {}
			try { this.$.oauthWeb.destroy(); } catch (e2) {}
			this.$.oauthWeb = null;
		}
	},

	// Step 3: code -> tokens via the (derived) service (which uses the modern curl).
	exchange: function (code) {
		if (!code) { this.finish({ returnValue: false, errorCode: "NO_CODE" }); return; }
		this.$.oauthBox.hide();
		this.$.entryView.show();
		this.setStatus("Signing in…");
		var payload = { code: code, codeVerifier: this._codeVerifier };
		// Forward the region hints only when the redirect carried them (pCloud); other providers
		// never set these, so their exchangeCode call is unchanged.
		if (this.capturedHostname)   { payload.hostname   = this.capturedHostname; }
		if (this.capturedLocationId) { payload.locationid = this.capturedLocationId; }
		this.$.svc.call(payload, {
			method: "exchangeCode",
			onSuccess: "exchangeSuccess",
			onFailure: "exchangeFailure"
		});
	},

	// Step 4: return credentials to Accounts (tag with template on create).
	exchangeSuccess: function (inSender, inResponse) {
		if (this.params && this.params.template) {
			inResponse.templateId = this.params.template.templateId;
			inResponse.template   = this.params.template;
		}
		this.finish(inResponse);
	},

	exchangeFailure: function (inSender, inResponse) {
		this.finish({ returnValue: false, errorCode: "EXCHANGE_FAILED", detail: inResponse });
	},

	svcFailure: function (inSender, inResponse) {
		if (this.done) { return; }
		this.finish({ returnValue: false, errorCode: "SERVICE_UNAVAILABLE", detail: inResponse });
	},

	cancel: function () {
		if (this.done) { return; }
		this.clearOAuthTimers();
		this.destroyOAuthWeb();
		this.finish({});   // empty result => cancelled
	},

	finish: function (result) {
		this.done = true;
		this.clearOAuthTimers();
		this.log("cloud-auth: sending result " + enyo.json.stringify(result));
		this.$.xresult.sendResult(result);
	},

	queryParam: function (url, key) {
		var m = url.match(new RegExp("[?&]" + key + "=([^&#]*)"));
		return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : null;
	}
});
