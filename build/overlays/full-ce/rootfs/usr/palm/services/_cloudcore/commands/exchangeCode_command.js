/*global OAuth2, Adapter, Config, console */
/* exchangeCode - the account VALIDATOR. Called by com.palm.service.accounts (via the
 * customUI auth webview) with the ?code=... captured from the OAuth2 redirect. Returns
 * credentials in the shape the account DB stores and the Adapter later reads, PLUS a
 * username: accounts/handlers/create.js does Assert.require(args.username) and refuses to
 * create the account without one, so we fetch the provider account identity here.
 * GENERIC across all connectors (identity normalised by Adapter.getAccountInfo).
 */
function ExchangeCodeCommandAssistant() {}

ExchangeCodeCommandAssistant.prototype = {
	run: function (future) {
		var args = this.controller.args;
		if (!args.code) {
			future.setException({ returnValue: false, errorCode: "MISSING_CODE" });
			return;
		}
		// args.codeVerifier was returned by getAuthorizeUrl and carried through the auth
		// webview; the generating service process is usually gone by now, so this is the
		// authoritative PKCE verifier (in-memory OAuth2._verifier is only a fallback).
		// Do NOT future.nest(ex): nesting resolves `future` with the RAW token result the
		// moment ex completes, before the .then below can wrap it - so Accounts gets no
		// `credentials`. Resolve `future` ourselves, only with the wrapped shape.
		var ex = OAuth2.exchangeCode(args.code, args.codeVerifier);
		ex.then(this, function () {
			var t;
			try { t = ex.result; }               // throws if ex carried an exception
			catch (e) { future.setException(e); return; }
			var common = {
				accessToken:  t.accessToken,
				refreshToken: t.refreshToken,
				expiresAt:    Date.now() + (t.expiresIn * 1000)
			};
			// Fetch the account identity (email/name) for `username`. Tolerate a failure here
			// (still create the account with a fallback) - we already have valid tokens.
			var info = Adapter.getAccountInfo(common);
			info.then(this, function () {
				var u = {};
				try { u = (info.result && info.result.user) || {}; } catch (e2) { u = {}; }
				future.result = {
					returnValue: true,
					username:    u.emailAddress || (Config && Config.DISPLAY_NAME) || "Cloud account",
					alias:       u.displayName || undefined,
					credentials: { common: common }
				};
			});
		});
	}
};
