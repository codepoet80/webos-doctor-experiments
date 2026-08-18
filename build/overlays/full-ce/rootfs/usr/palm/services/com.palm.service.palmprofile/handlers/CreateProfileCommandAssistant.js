var CreateProfileCommandAssistant = Class.create({
					
	run: function(future){
		this.args = this.controller.args;
		
		//Used to make a default account if firstuse is skipped
		if(this.args.createDefaultAccount){
			ServiceLog.log("Attempting to create default account");
			future.now(function(){
				return PalmCall.call("palm://com.palm.service.accounts", "listAccounts", {"templateId": "com.palm.palmprofile"});
			});
			future.then(this, function(){
	            return PalmProfileUtil.handleThenResult(this, "CreateProfileCommandAssistant-listAccounts", future, future, function(){
					var results = future.result.results;
					if(results.length === 0){
						PalmProfileUtil.createLocalAccount("webOS User", function(){});
						return {"accountCreated":true};
					} else {	
						// handles OTA migration
						var fileUtil = new FileUtil();
						fileUtil.createAccountCreatedFlag();
						return {"accountCreated":false};
					}
				});
			});
			return;
		}
		
		if(this.validateRequest() === false) {
			PalmProfileUtil.sendError (future, "INVALID_REQUEST", "One or more request params are missing");
			return;
		}
		
		this.getDeviceProfile (future);
	},
	
	validateRequest: function () {
		if(!(this.args.email) || !(this.args.password) || !(this.args.firstName) || 
			!(this.args.language) || !(this.args.country)) {
			return false;	
		}
		return true;
	},
	
	getDeviceProfile: function (future) {
		var profileFuture = PalmCall.call("palm://com.palm.deviceprofile/", "getDeviceProfile", {});	
		profileFuture.then(this, function() { 
            return PalmProfileUtil.handleThenResult(this, "getDeviceProfile", future, profileFuture, function(){
				var result = profileFuture.result;
				ServiceLog.log("Got device profile");
				if(result.returnValue && result.returnValue === true) {
					// Convert device props into the format that the server expects
					var info = result.deviceInfo;
					ServiceLog.log("Got device profile: ---- info -----"+JSON.stringify(info));
					this.createProfile(future, info);
					return;
				}
				
				PalmProfileUtil.sendError(future, "DEVICE_PROFILE_ERROR", "Could not read device profile");
			});	
		});	
	},
	
	createProfile: function (future, info) {
		var deviceParams = "";
		try {
			deviceParams = PalmProfileUtil.getDeviceParams(info);
		} catch (e) {
			PalmProfileUtil.sendError("DEVICE_PROFILE_ERROR", "Could not read device profile");
			return;
		}	
					
		var romTokens = "";
		try {
			romTokens = PalmProfileUtil.getROMTokens (info);
		} catch (e) {	
			PalmProfileUtil.sendError("DEVICE_PROFILE_ERROR", "Could not read device profile");
			return;
		}
		
		var acctParams = this.getAccountParams(deviceParams, romTokens, true);
		ServiceLog.log("********acctparams******** "+JSON.stringify(this.getAccountParams(deviceParams, romTokens, false)));
		this.sendRequestToServer (future, acctParams);
	},
	
	getAccountParams: function (deviceParams, romTokens, includeSecureInfo) {
		var accountParams = {
			"InCreateDeviceAccount": {
				"account": {
					"email": this.args.email,
					"firstName": this.args.firstName,
					"lastName": this.args.lastName || '',
					"language": this.args.language,
					"country": this.args.country
				},
				"password": (includeSecureInfo) ? this.args.password : "?????",
				"device": deviceParams,
				"romToken": romTokens,
				"response": {
					"questionID": this.args.questionId,
					"response": (includeSecureInfo) ? this.args.response : "?????"
				}
			}	
		};
		return accountParams;
	},
	
	sendRequestToServer: function (future, acctParams) {
		var profileFuture = PalmProfileUtil.postRequest("createDeviceAccount", acctParams, future, "ACCOUNT_CREATION_ERROR");
		profileFuture.then(this, function() { 
            return PalmProfileUtil.handleThenResult(this, "createDeviceAccount", future, profileFuture, function(){
				var result = profileFuture.result.responseJSON,
					username = this.args.firstName + (this.args.lastName ? " " + this.args.lastName : "");
				ServiceLog.log("---------- profileFuture result ---------"+JSON.stringify(result.AuthenticateInfoEx));
				
				if(result.AuthenticateInfoEx) {
					//should not return until saveAccountToken and createLocalAccount have completed
					//Ideally these should be completed concurrently but for simplicity they are done one after another
					var saveAccountTokenCallback = PalmProfileUtil.saveAccountToken.bind(PalmProfileUtil, result.AuthenticateInfoEx, future, "ACCOUNT_CREATION_ERROR");
					PalmProfileUtil.createLocalAccount(username, saveAccountTokenCallback);
					
					//We will name the device based on user input, in assignDeviceName
					//PalmProfileUtil.setDeviceName(username, this.args.language, this.args.country);
					return;
				}
				
				if (result.JSONException) {
					this.sendError(future, "ACCOUNT_CREATION_ERROR", result.JSONException);
					return;
				}
				
				ServiceLog.error("ACCOUNT_CREATION_ERROR details below");
				ServiceLog.error("  URL: ",PalmProfileUtil.getServerUrl()+'createDeviceAccount');
				ServiceLog.error("  profileFuture.result.responseText: ",profileFuture.result.responseText);
				ServiceLog.error("  profileFuture.result.responseJSON: ",profileFuture.result.responseJSON);
				ServiceLog.error("  requestBody: ",requestBody);
				
				PalmProfileUtil.sendError(future, "ACCOUNT_CREATION_ERROR", "Can't create profile");
			}); 
		}); 
	},
	
	sendError: function (future, errorCode, errorResponse) {
		if (errorResponse.errorCodes) {
			future.exception = {
				"errorCode": errorResponse.errorCodes,
				"errorText": errorResponse.message
			}
		} else {
			PalmProfileUtil.sendError(future, "ACCOUNT_CREATION_ERROR", "Can't create profile");
		}	
	}
	
});
