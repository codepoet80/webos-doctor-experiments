/* webOS Archive — not part of HP's webOS.
 *
 * palm://com.palm.accountservices/syncDeviceName {}
 *
 * Pushes THIS device's current name up to the account, so the account's device
 * list shows something a person recognises instead of a hardware SKU.
 *
 * Deliberately not AssignDeviceNameNoAcctInfoArgsCommandAssistant, which looks
 * like it does this job but does not: it calls PalmProfileUtil.setDeviceName(),
 * which WRITES the local name (composing a possessive "<user>'s TouchPad" and
 * saving it to preferences). Calling that on a sync would rename the device every
 * time. This only ever reads.
 *
 * Safe to call often — on sign-in, and every time the Accounts app opens the
 * profile view. The server upserts by nduid, so a repeat call with an unchanged
 * name is a no-op write.
 */
var SyncDeviceNameCommandAssistant = Class.create({

	// Used when the device has no name of its own. Every device this ships to is a
	// TouchPad; a wrong-but-recognisable name still beats a raw SKU in the list.
	DEFAULT_DEVICE_NAME: "TouchPad",

	run: function (future) {
		var dbService = new PalmProfileDBService();
		var dbFuture = dbService.getAccountToken();

		dbFuture.then(this, function () {
			return PalmProfileUtil.handleThenResult(this, "SyncDeviceNameCommandAssistant", future, dbFuture, function () {
				if (dbFuture.result.results.length > 0) {
					var acct = dbFuture.result.results[0];
					if (acct.token) {
						this.readDeviceName(future, acct.token, acct.alias);
						return;
					}
				}
				PalmProfileUtil.sendError(future, "ACCOUNT_INFO_ERROR", "Could not get account info");
			});
		});
	},

	readDeviceName: function (future, token, alias) {
		var nameFuture = PalmProfileUtil.getDeviceName();
		nameFuture.then(this, function () {
			// A missing preference is not an error here — fall back and carry on.
			var name = "";
			try {
				var r = nameFuture.result;
				if (r && r.deviceName) { name = String(r.deviceName); }
			} catch (e) {
				ServiceLog.log("syncDeviceName: could not read deviceName preference: " + e);
			}
			if (!name) { name = this.DEFAULT_DEVICE_NAME; }
			this.readNduId(future, token, alias, name);
		});
	},

	readNduId: function (future, token, alias, name) {
		var profileFuture = PalmCall.call("palm://com.palm.deviceprofile/", "getDeviceProfile", {});
		profileFuture.then(this, function () {
			return PalmProfileUtil.handleThenResult(this, "syncDeviceName-getDeviceProfile", future, profileFuture, function () {
				var result = profileFuture.result;
				if (result && result.returnValue === true && result.deviceInfo && result.deviceInfo.nduId) {
					this.sendRequestToServer(future, token, alias, result.deviceInfo.nduId, name);
					return;
				}
				PalmProfileUtil.sendError(future, "DEVICE_PROFILE_ERROR", "Could not read device profile");
			});
		});
	},

	sendRequestToServer: function (future, token, alias, nduId, name) {
		var requestObject = {
			"InAssignDeviceName": {
				"alias": alias,
				"nduId": nduId,
				"authToken": token,
				"name": name
			}
		};

		var ajaxFuture = PalmProfileUtil.postRequest("assignDeviceName", requestObject, future, "ASSIGN_DEVICE_NAME_ERROR");
		ajaxFuture.then(this, function () {
			return PalmProfileUtil.handleThenResult(this, "syncDeviceName", future, ajaxFuture, function () {
				var result = ajaxFuture.result.responseJSON;
				// HP used the "In" prefix on the response too.
				var assigned = (result && result.InAssignDeviceName && result.InAssignDeviceName.assignedName)
					? result.InAssignDeviceName.assignedName
					: name;
				future.result = { "returnValue": true, "deviceName": assigned };
			});
		});
	}
});
