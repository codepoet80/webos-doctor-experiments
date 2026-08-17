/*global Adapter, AccountCreds, Acl, Config, console */
/* listFolder - browse a folder. args: { accountId | credentials, path | folderId }
 * The locator (`path`/`folderId`) is provider-defined: a real path for path-based providers
 * (Dropbox/Yandex) or an opaque id for id-based ones (Box/OneDrive/Drive). Adapter.listFolder
 * returns ALREADY-NORMALISED entries: { entries:[{ id, type:'folder'|'file', name, size,
 * modified, path, mimeType, googleDoc? }] } where each entry.path is the locator a consumer
 * hands straight back as the next folderId/fileId - keeping consumers provider-generic.
 * GENERIC across all connectors; caller allow-list from Config.FILE_APP_IDS.
 */
function ListFolderCommandAssistant() {}

ListFolderCommandAssistant.prototype = {
	allowedAppIds: (typeof Config !== "undefined" && Config.FILE_APP_IDS) || [],

	run: function (future) {
		if (!Acl.enforce(this, future)) { return; }
		var self = this, args = this.controller.args || {};
		var folderId = args.folderId || args.path || (Config && Config.ROOT_FOLDER) || "root";
		var credF = AccountCreds.resolve(args);
		credF.then(this, function () {
			var creds;
			try { creds = credF.result; }
			catch (e) { future.setException(e); return; }
			var renewed = null;
			var call = Adapter.listFolder(creds, folderId, function (nc) { renewed = nc; });
			call.then(self, function () {
				var data;
				try { data = call.result; }
				catch (e2) { future.setException(e2); return; }
				if (renewed && args.accountId) { AccountCreds.save(args.accountId, renewed); }
				future.result = {
					returnValue: true,
					renewedCredentials: renewed,
					entries: (data && data.entries) || []
				};
			});
		});
	}
};
