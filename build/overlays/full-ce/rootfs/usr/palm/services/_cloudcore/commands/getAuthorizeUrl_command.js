/*global OAuth2, Config, console */
/* getAuthorizeUrl - returns the OAuth2 consent URL for the auth webview to load.
 * client_id / redirect_uri / scope / token_access_type all live in the service config
 * (single source of truth), so the app never needs to know them. GENERIC across all
 * connectors; the caller allow-list comes from Config.AUTH_APP_IDS.
 */
function GetAuthorizeUrlCommandAssistant() {}

GetAuthorizeUrlCommandAssistant.prototype = {
	allowedAppIds: (typeof Config !== "undefined" && Config.AUTH_APP_IDS) || [],

	run: function (future) {
		var args = this.controller.args || {};
		try {
			// buildAuthorizeUrl generates the PKCE verifier; return it so the auth webview can
			// hand it back to exchangeCode. The service is idle-killed during the web login, so
			// relying on the in-memory verifier would lose it (=> token failure).
			var url = OAuth2.buildAuthorizeUrl(args.state || (Config && Config.STATE) || "cloud");
			future.result = {
				returnValue:  true,
				url:          url,
				codeVerifier: OAuth2._verifier
			};
		} catch (e) {
			future.setException(e);   // e.g. NO_CRYPTO
		}
	}
};
