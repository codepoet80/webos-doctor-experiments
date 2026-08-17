/*global Adapter, AccountCreds, Config, console */
/* upload - the Photos AGGREGATOR photo-upload contract (device->cloud). The stock
 * com.palm.service.photos AlbumManageAssistant.uploadPhotoToCloud() calls
 *   <serviceName>/upload  { accountId, albumId, path }
 * where `path` is the LOCAL file on the device and `albumId` is the cloud album folder id
 * (the `aid` surfaced by listAlbums). It expects a reply { returnValue:true, pid }.
 *
 * This is the photo-domain twin of uploadFile: it maps path->localPath and albumId->folderId,
 * then returns the new cloud file id as `pid`. GENERIC across all connectors. Like
 * listAlbums/listPhotos it carries NO allowedAppIds - the aggregator calls it over the bus
 * with no app identity, so there is nothing to allow-list against.
 */
function UploadPhotoCommandAssistant() {}

UploadPhotoCommandAssistant.prototype = {
	run: function (future) {
		var self = this, args = this.controller.args || {};
		var localPath = args.path || args.localPath;
		if (!localPath) {
			future.setException({ returnValue: false, errorCode: "MISSING_ARGS",
				detail: "need path" });
			return;
		}
		var name = args.name || localPath.split("/").pop();
		var credF = AccountCreds.resolve(args);
		credF.then(this, function () {
			var creds;
			try { creds = credF.result; }
			catch (e) { future.setException(e); return; }

			function doUpload(folderId) {
				var renewed = null;
				var call = Adapter.uploadFile(creds, folderId, localPath, name, args.mimeType,
					function (nc) { renewed = nc; });
				call.then(self, function () {
					var meta;
					try { meta = call.result || {}; }
					catch (e2) { future.setException(e2); return; }
					if (renewed && args.accountId) { AccountCreds.save(args.accountId, renewed); }
					future.result = { returnValue: true, pid: String(meta.id),
						name: meta.name, size: meta.size };
				});
			}

			// albumId is the cloud album folder id. If the caller passed one, upload straight
			// into it. If it's empty (album folder not yet created), resolve/create the named
			// album folder so the photo lands in the right place instead of the bare root.
			var albumId = args.albumId || args.folderId;
			if (albumId) { doUpload(albumId); return; }
			if (typeof Adapter.ensureAlbumFolder === "function") {
				var ensure = Adapter.ensureAlbumFolder(creds,
					(Config && Config.PHOTO_ALBUM_NAME) || "Pictures");
				ensure.then(self, function () {
					var fid;
					try { fid = ensure.result; }
					catch (e3) { future.setException(e3); return; }
					doUpload(fid);
				});
			} else {
				doUpload(null);
			}
		});
	}
};
