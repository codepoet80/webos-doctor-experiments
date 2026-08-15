var IsEmailAvailableCommandAssistant = Class.create({

	run: function(future){
		// webOS Archive: the stock assistant asked the dead LCN location server
		// (lcn.palmws.com ?email=... -> getdomain) for both server discovery and
		// the availability bit. Server discovery is hardcoded now (WOSA_BASE), so
		// just ask our catalog backend whether the address is taken.
		var args = this.controller.args;

		if(!args.email) {
			PalmProfileUtil.sendError (future, "INVALID_REQUEST", "Email address is not available");
			return;
		}

		var profileFuture = PalmProfileUtil.postRequest("isEmailAvailable", {"email": args.email}, future, "EMAIL_CHECK_ERROR");
		profileFuture.then(this, function() {
			return PalmProfileUtil.handleThenResult(this, "isEmailAvailable", future, profileFuture, function(){
				var result = profileFuture.result.responseJSON;
				ServiceLog.log("---------- isEmailAvailable (WOSA) result ---------" + JSON.stringify(result));
				if(result && typeof result.isEmailAvailable === "boolean") {
					future.result = {
						"isEmailAvailable": result.isEmailAvailable
					};
					return;
				}
				PalmProfileUtil.sendError(future, "SYSTEM_ERROR", "Please try again");
			});
		});
	}
});
