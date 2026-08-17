/*global Config, console */
/* cloudservice.js - generic main service assistant for a cloud connector.
 *
 * This file (and the rest of _cloudcore) is IDENTICAL for every connector and is loaded
 * via "../_cloudcore/..." entries in each service's sources.json. All provider-specific
 * behaviour lives in exactly two per-service files:
 *   - config.js  : endpoints, client id/secret, app-id allow-lists, auth header scheme
 *   - adapter.js : the REST mapping (var Adapter = {...}) - listFolder/downloadFile/
 *                  uploadFile/uploadReplace/getAccountInfo, each returning a normalised shape
 *
 * services.json references this assistant by name ("assistant": "CloudService").
 */
function CloudService() {}
CloudService.prototype = {
	setup: function () {
		var n = (typeof Config !== "undefined" && Config.SERVICE_NAME) ? Config.SERVICE_NAME : "?";
		console.log("CloudService (_cloudcore) setup: " + n);
		return;
	}
};
