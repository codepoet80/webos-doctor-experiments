var GetTokenCommandAssistant = Class.create({
					
	run: function(future){
		var dbService = new PalmProfileDBService();
		var dbFuture = dbService.getAccountToken();
		
		dbFuture.then(function () {
            return PalmProfileUtil.handleThenResult(this, "GetTokenCommandAssistant", future, dbFuture, function(){
				if (dbFuture.result.results.length === 0) {
					PalmProfileUtil.sendError(future, "NO_TOKEN", "Token could not be fetched");
				} else {
					
					var result = dbFuture.result.results[0];
					
					if (result.token) { // it can be undefined!
						future.result = {
							"accountAlias": result.alias,
							// webOS Archive: the member's chosen public handle.
							// This is THE way other apps get it — they already
							// call getAccountToken for the token itself. Falls
							// back to the alias so callers can use it directly
							// without a null check (pre-username profiles and
							// accounts that never set one).
							"accountUsername": result.username || result.alias,
							"token": result.token,
							"accountState": result.state,
							"uniqueId": result.uniqueId,
							"jabberId": result.jabberId,
							"randomAttribute" : result.randomAttribute
						};
					} else {
						PalmProfileUtil.sendError(future, "NO_TOKEN", "Token could not be fetched");
					}
				}
			});	
		});	
	}
	
});