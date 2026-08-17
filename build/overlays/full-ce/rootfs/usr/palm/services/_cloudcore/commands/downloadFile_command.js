/*global Adapter, AccountCreds, Acl, Config, console */
/* downloadFile - download a remote file to a local path. args:
 *   { accountId | credentials, fileId | path | dropboxPath, localPath, exportMime? }
 * The locator may arrive as fileId OR path OR dropboxPath (consumer-generic). exportMime is
 * honoured only by providers that need it (e.g. Google-native docs); others ignore it.
 * GENERIC across all connectors; caller allow-list from Config.FILE_APP_IDS.
 */
function DownloadFileCommandAssistant() {}

DownloadFileCommandAssistant.prototype = {
	allowedAppIds: (typeof Config !== "undefined" && Config.FILE_APP_IDS) || [],

	run: function (future) {
		if (!Acl.enforce(this, future)) { return; }
		var self = this, args = this.controller.args || {};
		var fileId = args.fileId || args.path || args.dropboxPath;
		var exportMime = args.exportMime || null;
		if (!fileId || !args.localPath) {
			future.setException({ returnValue: false, errorCode: "MISSING_ARGS",
				detail: "need fileId and localPath" });
			return;
		}
		var credF = AccountCreds.resolve(args);
		credF.then(this, function () {
			var creds;
			try { creds = credF.result; }
			catch (e) { future.setException(e); return; }
			var renewed = null;
			var call = Adapter.downloadFile(creds, fileId, args.localPath, exportMime, function (nc) { renewed = nc; });
			call.then(self, function () {
				var res;
				try { res = call.result; }
				catch (e2) { future.setException(e2); return; }
				if (renewed && args.accountId) { AccountCreds.save(args.accountId, renewed); }
				future.result = { returnValue: true, renewedCredentials: renewed, path: res.path };
			});
		});
	}
};
