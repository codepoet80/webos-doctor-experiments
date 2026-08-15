/* webOS Archive — not part of HP's webOS.
 *
 * palm://com.palm.accountservices/signOut {}
 *
 * Signs this device out: revokes the account token on the server, then clears it
 * from the local db8 profile.
 *
 * Deliberately NOT the stock dissociateCurrentDevice, which posts HP's
 * dissociateAccountFromDevice and then leaves the local profile fully intact —
 * i.e. it detaches server-side while the device still believes it is signed in,
 * which is the worst of both.
 *
 * Two deliberate choices:
 *
 * 1. The local clear happens even when the server call fails. The user asked to
 *    sign out; refusing because the device is offline would strand them signed in
 *    with no way out. The response reports serverTokenRevoked so a caller can say
 *    so, and the stranded token can still be revoked from another device once
 *    "remove this device" exists.
 *
 * 2. The local ACCOUNT record is renamed rather than deleted. Deleting it would be
 *    the true inverse of createLocalAccount, but com.palm.app.accounts reads
 *    palmProfileAccount.username/.icon unguarded in onAccountsAvailable, and a
 *    device with no palmprofile account at all is a state nothing else on the
 *    system has been tested against — the activation bypass creates one precisely
 *    so it is never absent. Renaming keeps the structure valid.
 *
 *    It MUST be renamed, though, not just left: the record stores the signed-in
 *    member's display name, so leaving it means handing the tablet to someone else
 *    with the previous owner's name still sitting in db8 and on the Accounts
 *    screen. It is set to a neutral "Local User" here rather than being papered
 *    over in the UI, so there is one truth and no personal data survives a
 *    sign-out.
 */
var SignOutCommandAssistant = Class.create({

	run: function (future) {
		var dbService = new PalmProfileDBService();
		var dbFuture = dbService.getAccountToken();

		dbFuture.then(this, function () {
			var token = null;
			try {
				var results = dbFuture.result && dbFuture.result.results;
				if (results && results.length > 0) { token = results[0].token; }
			} catch (e) {
				ServiceLog.log("signOut: could not read the local profile: " + e);
			}

			if (!token) {
				// Already signed out — but still fall through to the rename rather
				// than returning here. A sign-out that cleared the token and then
				// failed to rename would otherwise be unrepairable by retrying,
				// leaving the previous member's name on the device permanently.
				this.renameLocalAccount(future, false);
				return;
			}
			this.revokeOnServer(future, token);
		});
	},

	revokeOnServer: function (future, token) {
		// device.php?m=deauthenticate — takes {token}, idempotent, always 200.
		var f = PalmProfileUtil.postRequest("deauthenticate", { "token": token }, future, "SIGNOUT_ERROR");
		f.then(this, function () {
			var revoked = false;
			// Not handleThenResult: that aborts the whole command on a server
			// error, and here a server error must NOT stop the local sign-out.
			try {
				var r = f.result;
				revoked = !!(r && r.responseJSON && r.responseJSON.deauthenticated);
			} catch (e) {
				ServiceLog.log("signOut: server revoke failed, clearing locally anyway: " + e);
			}
			this.clearLocalToken(future, revoked);
		});
	},

	clearLocalToken: function (future, revoked) {
		try {
			var dbService = new PalmProfileDBService();
			// Blank the fields that say "signed in". The record itself stays; the
			// next sign-in upserts over it (see createLocalAccount).
			var dbFuture = dbService.updateProfile({
				"token": "", "alias": "", "state": "", "uniqueId": "", "username": ""
			});
			dbFuture.then(this, function () {
				try { dbFuture.result; } catch (e) {
					ServiceLog.log("signOut: db8 clear reported an error: " + e);
				}
				this.renameLocalAccount(future, revoked);
			});
		} catch (e) {
			ServiceLog.log("signOut: could not clear the local token: " + e);
			this.renameLocalAccount(future, revoked);
		}
	},

	// Strip the previous member's name off the local account record. Mirrors
	// createLocalAccount's upsert, in reverse.
	renameLocalAccount: function (future, revoked) {
		var self = this;
		var finish = function (renamed) {
			future.result = {
				"returnValue": true,
				"serverTokenRevoked": revoked,
				"localAccountRenamed": renamed
			};
		};

		try {
			var listFuture = PalmCall.call("palm://com.palm.service.accounts/", "listAccounts", {});
			listFuture.then(function () {
				var existing = null, i, res = null;
				try { res = listFuture.result; } catch (e) {
					ServiceLog.log("signOut: listAccounts failed: " + e);
				}
				if (res && res.results) {
					for (i = 0; i < res.results.length; i++) {
						if (res.results[i].templateId === "com.palm.palmprofile") {
							existing = res.results[i];
							break;
						}
					}
				}
				if (!existing) {
					ServiceLog.log("signOut: no palmprofile account to rename.");
					finish(false);
					return;
				}
				if (existing.username === SignOutCommandAssistant.LOCAL_USER) {
					finish(true);   // already neutral
					return;
				}
				var modFuture = PalmCall.call("palm://com.palm.service.accounts/", "modifyAccount", {
					"accountId": existing._id,
					"object": { "username": SignOutCommandAssistant.LOCAL_USER }
				});
				modFuture.then(function () {
					var ok = true;
					try {
						modFuture.result;
					} catch (e) {
						ok = false;
						// Worth being loud about: the sign-out otherwise looks
						// complete while the previous owner's name is still on screen.
						ServiceLog.log("signOut: could NOT rename the local account: " + e);
					}
					finish(ok);
				});
			});
		} catch (e) {
			ServiceLog.log("signOut: rename step failed outright: " + e);
			finish(false);
		}
	}
});

// Neutral name left on the device account after a sign-out. Deliberately not
// localised: it is stored data, and it would otherwise be frozen in whatever
// locale happened to be active when the user signed out.
SignOutCommandAssistant.LOCAL_USER = "Local User";
