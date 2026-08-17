/*global Adapter, AccountCreds, console */
/* deletePhoto - remove a single photo from the cloud account. args: { accountId, pid }
 * pid is the provider file locator the aggregator persisted on the media record (from
 * listPhotos: a file id for id-based providers, a "disk:/.." path for path-based ones).
 * The stock Photos aggregator's removePhoto() calls <serviceName>/deletePhoto BEFORE it
 * clears the local cache/DB entry (see ../photos-integration/), so a failure here aborts
 * the local removal too - the photo stays visible rather than silently orphaning the cloud
 * file. GENERIC across connectors (Adapter.deletePhoto does the provider-specific DELETE).
 */
function DeletePhotoCommandAssistant() {}

DeletePhotoCommandAssistant.prototype = {
	// NO allowedAppIds: the Photos aggregator calls this over the private bus with no app
	// identity (like listAlbums/listPhotos/upload), so it stays open (private-bus role gated).

	run: function (future) {
		var self = this, args = this.controller.args || {};
		var pid = args.pid || args.photoId || args.fileId;
		if (pid == null || pid === "") {
			future.setException({ returnValue: false, errorCode: "MISSING_ARGS", detail: "need pid" });
			return;
		}
		if (typeof Adapter.deletePhoto !== "function") {
			future.setException({ returnValue: false, errorCode: "NOT_SUPPORTED",
				detail: "this provider has no deletePhoto" });
			return;
		}
		var credF = AccountCreds.resolve(args);
		credF.then(this, function () {
			var creds;
			try { creds = credF.result; }
			catch (e) { future.setException(e); return; }
			var renewed = null;
			var call = Adapter.deletePhoto(creds, pid, function (nc) { renewed = nc; });
			call.then(self, function () {
				try { call.result; }                 // rethrows if the DELETE failed
				catch (e2) { future.setException(e2); return; }
				if (renewed && args.accountId) { AccountCreds.save(args.accountId, renewed); }
				future.result = { returnValue: true, pid: String(pid) };
			});
		});
	}
};

if (typeof exports !== "undefined") { exports.DeletePhotoCommandAssistant = DeletePhotoCommandAssistant; }
