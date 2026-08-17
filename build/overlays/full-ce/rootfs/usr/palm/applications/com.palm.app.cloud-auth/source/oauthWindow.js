/*global enyo, window, navigator */
/*
 * OAuthWindow — hosts an OAuth2 sign-in page on builds that have no NPAPI browser plugin.
 *
 * Legacy webOS renders the sign-in page inline in an Atlas-routed enyo.BasicWebView. LuneOS
 * (WAM/Chromium) has no NPAPI at all, so that control can never paint there — and an <iframe>
 * is not a substitute either: Google answers the authorize URL with X-Frame-Options: DENY, and
 * Microsoft's login page frame-busts, navigating the host app's own window away. What LuneOS
 * does have is window.open(), which builds a real top-level WAM window that neither restriction
 * applies to.
 *
 * Capturing the redirect needs two mechanisms, because providers split into two kinds:
 *
 *   http/https redirect_uri (every cloud connector)
 *       WAM runs with --disable-web-security, so the opener can read the popup's cross-origin
 *       location. Poll it until it starts with the expected redirect_uri.
 *
 *   native scheme (Teams: msauth.<client>://auth)
 *       The engine cannot load that scheme, so it aborts the navigation and location never
 *       changes — polling alone would wait forever. WAM instead reports the URL to the page as
 *       a 'webOSExternalProtocol' event (WebPageBlink::NotifyExternalProtocolNavigation), which
 *       is the LuneOS counterpart of BrowserServer-atlas's actionData("oauthRedirect").
 *
 * Both are armed at once and whichever fires first wins, so a caller does not have to know
 * which kind of redirect its provider uses.
 */
(function () {
	var OAuthWindow = {

		// enyo.BasicWebView renders an NPAPI <object>, so it only works where the plugin exists.
		// Test the capability rather than the OS: LuneOS reports no mime types at all, and the
		// deviceInfo that older code checked carries no OS name (modelName is the machine, e.g.
		// "qemux86-64", so a `modelName === "LuneOS Device"` test matches nothing).
		hasPluginWebView: function () {
			try {
				return !!(navigator.mimeTypes && navigator.mimeTypes["application/x-palm-browser"]);
			} catch (e) {
				return false;
			}
		},

		// A redirect matches when it starts with the expected redirect_uri. With no prefix to go
		// on, fall back to "carries an OAuth result", which is what the native-scheme providers
		// give us — the engine reports those URLs verbatim.
		matches: function (url, prefix) {
			if (!url) { return false; }
			if (prefix) { return url.indexOf(prefix) === 0; }
			return url.indexOf("code=") >= 0 || url.indexOf("error=") >= 0;
		},

		/*
		 * Open the sign-in page and watch for the redirect.
		 *
		 *   url             authorize URL to load
		 *   redirectPrefix  expected redirect_uri; omit to match any URL carrying code=/error=
		 *   onRedirect(url) called once, with the captured redirect URL
		 *   onError(msg)    called once, on failure/timeout/user-closed
		 *   timeoutMs       overall deadline (default 240s, matching the inline WebView flow)
		 *
		 * Returns a handle with close(), safe to call more than once.
		 */
		open: function (opts) {
			opts = opts || {};
			var self = this,
				done = false,
				win = null,
				poll = null,
				deadline = null;

			function cleanup() {
				if (poll) { window.clearInterval(poll); poll = null; }
				if (deadline) { window.clearTimeout(deadline); deadline = null; }
				try { window.removeEventListener("webOSExternalProtocol", onExternal, false); } catch (e) {}
				if (win) {
					try { win.close(); } catch (e2) {}
					win = null;
				}
			}

			function hit(url) {
				if (done) { return; }
				done = true;
				cleanup();
				if (opts.onRedirect) { opts.onRedirect(url); }
			}

			function fail(msg) {
				if (done) { return; }
				done = true;
				cleanup();
				if (opts.onError) { opts.onError(msg); }
			}

			function onExternal(ev) {
				var url = ev && ev.detail && ev.detail.url;
				if (self.matches(url, opts.redirectPrefix)) { hit(url); }
			}

			// Arm the native-scheme path before opening, so a redirect that lands immediately
			// (a cached Microsoft session signs in without showing a page) is not missed.
			window.addEventListener("webOSExternalProtocol", onExternal, false);

			try {
				win = window.open(opts.url, opts.name || "oauth", opts.features || "width=800,height=600");
			} catch (e) {
				win = null;
			}
			if (!win) {
				fail("Could not open the sign-in window.");
				return { close: function () { cleanup(); } };
			}

			poll = window.setInterval(function () {
				if (done) { return; }

				var here = null;
				// Reading a cross-origin location is allowed here (--disable-web-security); a throw
				// just means it is not readable yet, which is not an error.
				try { here = String(win.location.href); } catch (e) {}
				if (self.matches(here, opts.redirectPrefix)) { hit(here); return; }

				// WAM also stamps the aborted native-scheme URL onto the window, which covers a
				// redirect that fired before the listener was attached.
				var stamped = null;
				try { stamped = win.webOSExternalProtocolUrl || window.webOSExternalProtocolUrl; } catch (e2) {}
				if (self.matches(stamped, opts.redirectPrefix)) { hit(stamped); return; }

				var closed = false;
				try { closed = win.closed; } catch (e3) {}
				if (closed) { fail("Sign-in was cancelled."); }
			}, 400);

			deadline = window.setTimeout(function () {
				fail("Sign-in timed out — please try again.");
			}, opts.timeoutMs || 240000);

			return { close: function () { cleanup(); } };
		}
	};

	window.OAuthWindow = OAuthWindow;
}());
