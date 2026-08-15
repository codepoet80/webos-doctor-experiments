var GetAccountInfoAggregateAssistant = Class.create({
                    
    run: function(future){
    	
        this.args = this.controller.args;

        if(!this.args.locale) {
            this.args.locale = "en_US";
        }
        
        var dbService = new PalmProfileDBService();
        var dbFuture = dbService.getAccountToken();
        var acctInfo;
        
        dbFuture.then(this, function () {
           return PalmProfileUtil.handleThenResult(this, "GetAccountInfoAggregateAssistant-1", future, dbFuture, function(){
	           if (dbFuture.result.results.length > 0) {
	                acctInfo = dbFuture.result.results[0];
	                if (acctInfo.token) {
	                    var rqParams = this.getRequestParams(acctInfo);
	                    this.sendRequestToServer(future, rqParams);
	                    return;
	                }
	            }
  	            ServiceLog.log("---------- profileFuture 4 ---------");
	            PalmProfileUtil.sendError(future, "ACCOUNT_NOT_DEFINED_ERROR", "Could not get local account info");
        	});
        });
    },
    
    getRequestParams: function(acctInfo) {
      var rqParams = {
            "InAccountInfoAggretate": {
                "locale": this.args.locale,
                "token": acctInfo.token,
                "email": acctInfo.alias
            }
        };
        return rqParams;
    },
        
    sendRequestToServer: function (future, rqParams) {
        
       var profileFuture = PalmProfileUtil.postRequest("getAccountInfoAggregate", rqParams, future, "ACCOUNT_AGGTE_ERROR_1");
       profileFuture.then(this, function() {
    	   //ServiceLog.log("---------- profileFuture 99-1 ---------");
           PalmProfileUtil.handleThenResult(this, "ountInfoAggregateAssistant-2", future, profileFuture, function(){
   	       //ServiceLog.log("---------- profileFuture 99 - 2 ---------");

	            var result = profileFuture.result.responseJSON;
	            if(result.OutAccountInfoAggregate) {
	                ServiceLog.log("---------- profileFuture result --------- " + JSON.stringify(result.OutAccountInfoAggregate));
	                // webOS Archive: self-heal the local username cache every time the
	                // Accounts app fetches the server-authoritative profile — not just
	                // on an explicit change. UsernameDialog skips its save round trip
	                // when the field is untouched, so without this, viewing or
	                // re-confirming an already-correct username never refreshes the
	                // local cache getAccountToken serves to every other app.
	                var freshUsername = result.OutAccountInfoAggregate.accountInfo && result.OutAccountInfoAggregate.accountInfo.username;
	                if (freshUsername) {
	                    var cacheFuture = (new PalmProfileDBService()).updateProfile({ "username": freshUsername });
	                    cacheFuture.then(this, function () {
	                        if (cacheFuture.exception) {
	                            ServiceLog.log("GetAccountInfoAggregate: could not refresh cached username: " + JSON.stringify(cacheFuture.exception));
	                        }
	                    });
	                }
	                future.result = result.OutAccountInfoAggregate;
	                return;
	            }
	            PalmProfileUtil.sendError(future, "-9999", "Could not get account info aggregate");
       	   });
        });
    }
    
});