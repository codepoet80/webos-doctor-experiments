var GetTermsAndConditionsCommandAssistant = Class.create({

        run: function(future){
                this.args = this.controller.args;

                if(this.validateRequest() === false) {
                        PalmProfileUtil.sendError (future, "INVALID_REQUEST", "One or more request params are missing");
                        return;
                }

                this.getTermsAndConditions (future);
        },

        validateRequest: function () {
                if(!(this.args.language) || !(this.args.serverURL))  {
                        return false;
                }
                return true;
        },

        getTermsAndConditions: function (future) {

                var params = this.getParams();
                this.sendRequestToServer (future, params);
        },

        getParams: function () {
                var params = {
                        "InTermsAndConditions": {
                                "langCD": this.args.language}
                };
                return params;
        },

        sendRequestToServer: function (future, params) {
        	
                var profileFuture = this.postRequest(this.args.serverURL, "getTermsAndConditions", params, future, "GET_TNC_ERROR");
                profileFuture.then(this, function() {
             		return PalmProfileUtil.handleThenResult(this, "getTermsAndConditions", future, profileFuture, function(){
                       var result = profileFuture.result.responseJSON;

                        if (result) {
                                ServiceLog.log("---------- getTermsAndConditions result ---------",JSON.stringify(result));
                                future.result = {"GetTermsAndConditions": result}
                                return;
						}

                       if (profileFuture.result.responseText) {
                            ServiceLog.log("---------- getTermsAndConditions encoding issue?, make sure all quotes (single and double) and brackets are HTML ampersand (&####;) encoded ---------",JSON.stringify(profileFuture.result));
					   } else {
					  		ServiceLog.log("---------- getTermsAndConditions MALFORMED result? ---------",JSON.stringify(profileFuture.result));
					   }
                       PalmProfileUtil.sendError(future, "SYSTEM_ERROR", "Please try again");
                	});
                });
        },
        
        postRequest: function(url, methodName, requestObj, errorFuture, errorCode){
        	var messageBody = JSON.stringify(requestObj), 
				headers = {
        			"headers": {
        			"Content-Type": "application/json",
					"Connection": "close"
				}
			};

			// webOS Archive: route through curl (node TLS can't reach our https origin).
			ServiceLog.log("Sending terms request (curl/https) to:", url+methodName);
			return PalmProfileUtil.curlPost(url + methodName, messageBody, headers);
        }
});

