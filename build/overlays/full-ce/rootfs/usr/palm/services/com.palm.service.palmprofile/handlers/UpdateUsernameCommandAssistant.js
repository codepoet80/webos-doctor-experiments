/* webOS Archive — not part of HP's webOS.
 *
 * palm://com.palm.accountservices/updateUsername {username: "<handle>"}
 *
 * Sets the account's public username (the handle shown in the Accounts app where
 * HP put the security question). Authenticated with the device's stored account
 * token, like every other profile edit — the password is never re-sent.
 *
 * On success the new handle is written back into the local db8 profile, so
 * getAccountToken starts returning it immediately and every other app on the
 * device sees the change without waiting for the next sign-in.
 */
var UpdateUsernameCommandAssistant = Class.create({

	run: function (future) {
		this.args = this.controller.args;

		if (!(this.args.username)) {
			PalmProfileUtil.sendError(future, "INVALID_REQUEST", "username is required");
			return;
		}

		var dbService = new PalmProfileDBService();
		var dbFuture = dbService.getAccountToken();

		dbFuture.then(this, function () {
			return PalmProfileUtil.handleThenResult(this, "UpdateUsernameCommandAssistant", future, dbFuture, function () {
				if (dbFuture.result.results.length > 0) {
					var acctToken = dbFuture.result.results[0];
					if (acctToken.token) {
						this.updateUsername(future, acctToken.token);
						return;
					}
				}
				PalmProfileUtil.sendError(future, "ACCOUNT_INFO_ERROR", "Could not get account info");
			});
		});
	},

	updateUsername: function (future, token) {
		var requestObject = {
			"InUpdateUsername": {
				"authToken": token,
				"username": this.args.username
			}
		};

		var ajaxFuture = PalmProfileUtil.postRequest("updateUsername", requestObject, future, "UPDATE_USERNAME_ERROR");

		ajaxFuture.then(this, function () {
			return PalmProfileUtil.handleThenResult(this, "updateUsername", future, ajaxFuture, function () {
				var result = ajaxFuture.result.responseJSON;
				// The server echoes the stored handle — trust it over our input,
				// so a no-op save reports what is actually on the account.
				var username = (result && result.OutUpdateUsername && result.OutUpdateUsername.username)
					? result.OutUpdateUsername.username
					: this.args.username;

				this.saveUsername(username);
				future.result = { "returnValue": true, "username": username };
			});
		});
	},

	// Best-effort local cache update. The server is already authoritative at this
	// point, so a db8 failure must not turn a successful rename into an error —
	// the next sign-in re-reads it from AuthenticateInfoEx anyway.
	// updateProfile() returns a Future: db8 failures (e.g. merge rejected) land on
	// dbFuture.exception asynchronously, NOT as a synchronous throw, so a bare
	// try/catch around the call never sees them. Chain onto the Future so a failed
	// local cache write is at least logged instead of vanishing silently.
	saveUsername: function (username) {
		try {
			var dbService = new PalmProfileDBService();
			var dbFuture = dbService.updateProfile({ "username": username });
			dbFuture.then(this, function () {
				if (dbFuture.exception) {
					ServiceLog.log("updateUsername: could not cache username locally: " + JSON.stringify(dbFuture.exception));
				}
			});
		} catch (e) {
			ServiceLog.log("updateUsername: could not cache username locally: " + e);
		}
	}
});
