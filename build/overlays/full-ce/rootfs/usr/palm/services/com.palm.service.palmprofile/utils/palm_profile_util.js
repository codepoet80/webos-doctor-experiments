/* Copyright 2009 Palm, Inc.  All rights reserved. */

var Util = Class.create ({

	// webOS Archive: single switch for the account backend base URL. The handlers
	// append the endpoint name (e.g. + "createDeviceAccount"), so this must end in
	// a separator the appended name attaches to cleanly (here: "...device.php?m=").
	// HTTPS: the service's own HTTP client (Foundations.Comms.AjaxCall) runs on the
	// stock node 0.4.12 TLS stack, which Cloudflare rejects (socket hang up). We
	// route the account POSTs through the OTA's modern /usr/bin/curl (OpenSSL 1.1.1w,
	// TLS 1.3) via curlPost() below instead — so this base is real HTTPS.
	WOSA_BASE: "https://appcatalog.webosarchive.org/WebService/device.php?m=",

	initialize: function(){
		ServiceLog.log("Initializing palmprofile with a server URL");
		this.ACCOUNTS_URL = this.WOSA_BASE;   // webOS Archive: hardcode our base (LCN/palmws is dead)
		this.GEOIP_URL = this.WOSA_BASE;
		this.urlFuture = this.getServerUrlFromPrefsDb();
		this.urlFuture.then(this, function(urlFuture) {
			if(urlFuture.exception) {
				ServiceLog.log("Problem retreiving url from preferences");
				return this.getServerUrlFromDb();
			}
			
			return urlFuture.result;
		});
	},
	
	getAppName: function(){
		return "ACCT_SRV";
	},
	
	getROMTokens: function(info){
		try {
			var romTokens = {
				"buildVariant": info.dmSets,
				"serverAuthType": info.serverAuthType,
				"serverPwd": info.serverPwd,
				"serverNonce": info.serverNonce,
				"clientCredential": info.clientCredential,
				"clientPwd": info.clientPwd,
				"clientNonce": info.clientNonce,
				"softwareBuildBranch": info.softwareBuildBranch,
				"swUpdateTarget": info.swUpdateTarget,
				"softwareBuildNumber": info.softwareVersion
			};
			return romTokens;
		} 
		catch (err) {
			throw new Error("DEVICE_PROFILE_ERROR");
		}
	},
	
	getDeviceParams: function(info){
		try {
			var deviceId = "";
			(info.deviceId == "") ? deviceId = info.nduId : deviceId = info.deviceId;
			ServiceLog.log("Setting device Id to: " + deviceId);
			var deviceParams = {
				"serialNumber": info.serialNumber,
				"HPSerialNumber": info.HPSerialNumber,
				"carrier": info.carrier,
				"dataNetwork": info.dataNetwork,
				"deviceID": deviceId,
				"phoneNumber": info.phoneNumber,
				"nduID": info.nduId,
				"deviceModel": info.deviceModel,
				"firmwareVersion": info.firmwareVersion,
				"network": info.network,
				"platform": info.platform,
				"macAddress": info.macAddress,
				"homeMcc": info.homeMcc,
				"homeMnc": info.homeMnc,
				"currentMcc": info.currentMcc,
				"currentMnc": info.currentMcc,
				"productSku": info.productSku
			};
			return deviceParams;
		} 
		catch (e) {
			throw new Error("DEVICE_PROFILE_ERROR");
		}
		throw new Error("DEVICE_PROFILE_ERROR");
	},
	
	setServerUrl: function(host){
		// webOS Archive: ignore the dead LCN/palmws host; always target our catalog.
		this.ACCOUNTS_URL = this.WOSA_BASE;
		this.GEOIP_URL = this.WOSA_BASE;
		ServiceLog.log("-------------set Server url (WOSA) -----------" + this.ACCOUNTS_URL);
		return this.ACCOUNTS_URL;
	},
	
	getServerUrl: function () {
		return this.ACCOUNTS_URL;
	},
	
	postRequest: function(methodName, requestObj, errorFuture, errorCode, postType) {
		return this.postRequestInternal(methodName, requestObj, errorFuture, errorCode, ((postType=="GEOIP") ? this.GEOIP_URL : this.ACCOUNTS_URL));
	},

	// webOS Archive: HTTPS POST via the OTA's modern /usr/bin/curl, shelled out
	// with child_process. The stock AjaxCall path uses node 0.4.12's TLS, which
	// can't handshake with our Cloudflare origin; curl (OpenSSL 1.1.1w) can. Returns
	// a Future shaped like AjaxCall.post's: result.responseJSON / result.responseText
	// / result.status, or .exception on transport failure. Body + response go through
	// temp files to avoid any shell-escaping of the JSON payload.
	curlPost: function(fullUrl, body, headers) {
		var future = new Future();
		var cp, fs;
		try { cp = require('child_process'); fs = require('fs'); }
		catch (e) {
			future.exception = { errorCode: -1, errorText: "curlPost: no child_process/fs (" + e + ")" };
			return future;
		}
		Util._curlSeq = (Util._curlSeq || 0) + 1;
		var base   = "/tmp/wosa_" + process.pid + "_" + Util._curlSeq;
		var reqTmp = base + "_req.json";
		var respTmp = base + "_resp.json";
		try { fs.writeFileSync(reqTmp, body || ""); }
		catch (e) {
			future.exception = { errorCode: -1, errorText: "curlPost: temp write failed (" + e + ")" };
			return future;
		}
		// url is our own fixed base + method name (no single quotes); single-quote it
		// so shell leaves ?, &, = literal. -f is intentionally NOT set: device.php
		// returns JSON bodies (e.g. {JSONException}) on 4xx that the handlers read.
		var cmd = "/usr/bin/curl -s -S --max-time 30 "
			+ "-o '" + respTmp + "' -w '%{http_code}' "
			+ "-X POST "
			+ "-H 'Content-Type: application/json' -H 'Connection: close' "
			+ "--data-binary @'" + reqTmp + "' "
			+ "'" + String(fullUrl).replace(/'/g, "") + "'";
		cp.exec(cmd, { timeout: 35000 }, function(error, stdout, stderr) {
			var responseText = "";
			try { responseText = fs.readFileSync(respTmp, "utf8"); } catch (e) {}
			try { fs.unlinkSync(reqTmp); } catch (e) {}
			try { fs.unlinkSync(respTmp); } catch (e) {}
			if (error) {
				future.exception = { errorCode: -1, errorText: "curlPost: curl failed (" + (stderr || error.message || error) + ")" };
				return;
			}
			var status = parseInt(stdout, 10);
			if (isNaN(status)) { status = 0; }
			var json = null;
			try { json = JSON.parse(responseText); } catch (e) { json = null; }
			future.result = { responseText: responseText, responseJSON: json, status: status };
		});
		return future;
	},
	
	postRequestInternal: function(methodName, requestObj, errorFuture, errorCode, THE_URL) {
		var messageBody = JSON.stringify(requestObj), 
			headers = {
					"headers": {
					"Content-Type": "application/json",
					"Connection": "close"
				}
			};

		if(!THE_URL){
			//Deals with the case that the URL was not found in Prefs or in the DB
			if(this.urlFuture.exception && this.urlFuture.exception.errorCode == "NULL_DB_URL"){
				errorFuture.exception = {"errorCode": errorCode, "errorText":"No server url available"};
				return new Future();
			}
			
			ServiceLog.log("Handling race senario."); //this.urlFuture is still going on
			this.urlFuture.then(function(urlFuture){
				try{
					return PalmProfileUtil.curlPost(urlFuture.result.url + methodName, messageBody, headers);
				} catch (err){
					//Error future is used 
					errorFuture.exception = {"errorCode": errorCode, "errorText":"No server url available"};
					return new Future();
				}
			});
			
			return this.urlFuture;
		} else {
			ServiceLog.log("Sending regular request (curl/https) to:", THE_URL);
			ServiceLog.log("Sending regular request to server with method:", methodName);
			return PalmProfileUtil.curlPost(THE_URL + methodName, messageBody, headers);
		}
	},
	
	getServerUrlFromPrefsDb: function () {
		// Get it from prefs
		var future = PalmCall.call("palm://com.palm.systemservice/", "getPreferences", {"keys":["locationHost"]});
		future.then(this, function() {
			var url;

			if(future.exception) {
				ServiceLog.log("----------- Couldn't get url from prefs ------------" +JSON.stringify(future.exception));
			}
			
			if (future.result) {
				var response = future.result;
				if (response.locationHost) {
					var url = this.setServerUrl(response.locationHost);
					
					if (url) {
						return {"url": url};
					} 
				}			
			}
			//if not returned from above
			future.exception = {"errorCode": "NULL_PREFS_URL", "errorText":"Couldn't get url from prefs"};
		});
		return future;
	},
	
	getServerUrlFromDb: function () {
		var dbService = new PalmProfileDBService();
		var dbFuture = dbService.getAccountToken();
		dbFuture.then(this, function() {
			if(dbFuture.exception) {
				ServiceLog.log("----------- Couldn't get url from db ------------" );
			}
			if (dbFuture.result.results.length > 0) {
				acctToken = dbFuture.result.results[0];
				
				// webOS Archive: ignore any stored accountServerUrl — tokens minted in
				// the earlier http-only phase carry an http:// URL that would downgrade
				// us off https. WOSA_BASE is always authoritative.
				this.ACCOUNTS_URL = this.WOSA_BASE;
				if (acctToken.accountServerUrl) {
					dbFuture.result = {
						"url": this.ACCOUNTS_URL
					};
					return;
				}
			}
			dbFuture.exception = {"errorCode": "NULL_DB_URL", "errorText":"Couldn't get url from db"};
		});
		return dbFuture;
	},
	
	getToken: function(authenticateInfo){
		var token = new PalmProfile();
		
		token.alias = authenticateInfo.accountAlias;

		// webOS Archive: the member's public handle, kept in the local profile so
		// any app can read it from getAccountToken without a network round trip.
		// Guarded: an older backend omits it, and writing undefined would blank
		// a username the device already knows.
		if (authenticateInfo.accountUsername) {
			token.username = authenticateInfo.accountUsername;
		}

		token.authenticatedTime = authenticateInfo.authenticationTime;
		token.tokenexpireTime = authenticateInfo.expirationTime;
		token.state = authenticateInfo.accountState;
		token.token = authenticateInfo.token;
		
		if(authenticateInfo.moreData.entry){
			for(i=0; i< authenticateInfo.moreData.entry.length; i++){
				if(authenticateInfo.moreData.entry[i].key == "randomAttribute")
					token.randomAttribute = authenticateInfo.moreData.entry[i].value;
			}
		}
		
		if (authenticateInfo.accountExpirationTime) {
			token.accountexpirationTime = authenticateInfo.accountExpirationTime;
		}
		if (authenticateInfo.jabberId) {
			token.jabberId = authenticateInfo.jabberId;
		}
		if (authenticateInfo.uniqueId) {
			token.uniqueId = authenticateInfo.uniqueId;
		}
		
		token.phoneNumber = "";
		token.accountServerUrl = this.ACCOUNTS_URL;
		return token;
	},
	
	saveAccountToken: function(authenticateInfo, future, errorCode){
		//TODO Have a better way of sending the result
		this.future = future;
		this.errorCode = errorCode;
		ServiceLog.log("Saving account token");
		try {
			var dbService = new PalmProfileDBService();
			var token = this.getToken(authenticateInfo);
			
			var dbFuture = dbService.updateProfile(token, future, errorCode);
			dbFuture.then(function(){
				var result = dbFuture.result;
				ServiceLog.log("--------- db result ------------:" + JSON.stringify(result));
				
				if (!dbFuture.result.errorCode) {
					future.result = {
						"returnValue": true
					};
				}
				else {
					future.exception = {
						"errorCode": errorCode,
						"errorText": future.result.errorText
					};
				}
			});
		} 
		catch (err) {
			ServiceLog.log("----------- Error -----------" + err);
			future.exception = {
				errorCode: err
			};
		}
	},
		
	createLocalAccount: function (username, onComplete) {
		// webOS Archive: UPSERT — never create a second parallel palmprofile
		// account. If one already exists (e.g. the "webOS User"
		// activation-bypass row), rename it in place via modifyAccount; deleting
		// it would run the accounts-service teardown cascade, and duplicates
		// confuse deviceinfo. Only create when no palmprofile account exists.
		var listFuture = PalmCall.call("palm://com.palm.service.accounts/", "listAccounts", {});
		listFuture.then(function(){
			var existing = null, i, res = listFuture.result;
			if (!listFuture.exception && res && res.results) {
				for (i = 0; i < res.results.length; i++) {
					if (res.results[i].templateId === "com.palm.palmprofile") {
						existing = res.results[i];
						break;
					}
				}
			}
			if (existing) {
				if (existing.username === username || username === "webOS User") {
					// The default/bypass create must never rename a real signed-in
					// account — any existing row already satisfies activation.
					ServiceLog.log("WOSA: palmprofile account already present (" + existing.username + ") — no rename needed.");
					onComplete();
					return;
				}
				ServiceLog.log("WOSA: renaming existing palmprofile account '" + existing.username + "' -> '" + username + "'");
				var modFuture = PalmCall.call("palm://com.palm.service.accounts/", "modifyAccount", {
					"accountId": existing._id,
					"object": {"username": username}
				});
				modFuture.then(function(){
					if (modFuture.exception){
						ServiceLog.error("----------- local acct rename failed ------------" + JSON.stringify(modFuture.exception));
					} else {
						ServiceLog.log("----------- local acct renamed successfully ------------");
						var fileUtil = new FileUtil();
						fileUtil.createAccountCreatedFlag();
					}
					onComplete();
				});
				return;
			}

			var account = {
				"templateId": "com.palm.palmprofile",
				"capabilityProviders": [
					{"id": "com.palm.palmprofile.contacts"},
					{"id": "com.palm.palmprofile.calendar"},
					{"id": "com.palm.palmprofile.tasks"},
					{"id": "com.palm.palmprofile.memos"},
					{"id": "com.palm.palmprofile.sms"},
					{"id": "com.palm.palmprofile.voice"},
					{"id": "com.palm.palmprofile.localfilestore"}
				],
				"username": username,
				"credentials": {}
			};
			ServiceLog.log("Creating a palmprofile account with username:" + username);

			var acctFuture = PalmCall.call("palm://com.palm.service.accounts/", "createAccount", account);
			acctFuture.then(function(){
			if (acctFuture.exception){
				ServiceLog.error("----------- local acct creation failed ------------" + JSON.stringify(acctFuture.exception));
			}else{
				if (acctFuture.result) {
					ServiceLog.log("----------- local acct created successfully ------------" + JSON.stringify(acctFuture.result));

					var fileUtil = new FileUtil();
					fileUtil.createAccountCreatedFlag();
				}
			}

			onComplete();
			});
		});
	},
	
	getDeviceName: function(){
		ServiceLog.log("In getDeviceName...");
		return PalmCall.call("palm://com.palm.systemservice/", "getPreferences", {"keys":["deviceName"]});
	},
	
	setDeviceName: function(username, language, country, userChosen){
		var machineName = '', deviceName = '',
		acctFuture = PalmCall.call("palm://com.palm.preferences/systemProperties", "Get", {
				"key":"com.palm.properties.deviceName"
			});
			
		acctFuture.then(this, function(){
           return PalmProfileUtil.handleThenResult(this, "setPreferences-deviceName-1", acctFuture, acctFuture, function() {
				if(acctFuture.result && acctFuture.result.returnValue){
					machineName = acctFuture.result['com.palm.properties.deviceName'];
					
					//We only make the username possessive for English, otherwise the device name is just the machine name
					if(language === 'en' && country === 'us' && username && username.length > 0) {
						var lastLetter = username.charAt(username.length - 1);
						if (lastLetter === 's' || lastLetter === 'S'){
							deviceName = username + "' ";
						} else {
							deviceName = username + "'s ";
						}
					} else {
						deviceName = username + " - ";
					}
					
					if(!userChosen)
						deviceName = deviceName + machineName;
					else
						deviceName = username;
					
					ServiceLog.log("Setting device name to:: " + deviceName);
					acctFuture.deviceName = deviceName;
					return PalmCall.call('palm://com.palm.systemservice/', 'setPreferences', {"deviceName": deviceName});
				} else {
					ServiceLog.log("----------- unable to retreive machine name ------------");
				}
        	});
		});
					
		 acctFuture.then(this, function(){
           return PalmProfileUtil.handleThenResult(this, "setPreferences-deviceName-2", acctFuture, acctFuture, function(){
				var res = acctFuture.result;
				if(acctFuture.result && acctFuture.result.returnValue){
					ServiceLog.log("----------- device name set ------------");
				} else {
					ServiceLog.log("----------- unable to set device ------------");
				}
				acctFuture.result = res;
				return acctFuture;
			});
        });
		
		return acctFuture;
	},
	
	sendError: function (future, errorCode, errorText) {
		this.setErrorFromException(future,{"errorCode":errorCode, "errorText": errorText})
	},
	
	setErrorFromException: function (future, e) {
		future.exception = {
			"errorCode": (e.errorCode) ? e.errorCode :  (e.errorCodes) ? e.errorCodes : "-9999",
			"errorText": (e.errorText) ? e.errorText :  (e.message) ? e.message : "UNKNOWN",
			
			/* ******************************************************************************************
			 * We may have code that looks for either errorCode or errorCodes and errorText or message
			 * ******************************************************************************************/
			"errorCodes": (e.errorCode) ? e.errorCode :  (e.errorCodes) ? e.errorCodes : "-9999",
			"message": (e.errorText) ? e.errorText :  (e.message) ? e.message : "UNKNOWN"
		}
	}, 
	
	handleThenResult: function(context, loginfo, future, serviceFuture, doIt) {
            try {
				if (!future || !serviceFuture) {
                    ServiceLog.log("---------- PALMPROFILE MISSING FUTURE PARMS  ("+loginfo+") ---------");
                	return doIt.call(context)
				} else if (serviceFuture.exception) {
                    ServiceLog.log("---------- PALMPROFILE exception ("+loginfo+") ---------");
                    throw serviceFuture.exception;
                } else if (serviceFuture.result && serviceFuture.result.responseJSON && serviceFuture.result.responseJSON.JSONException) {
					ServiceLog.log("---------- PALMPROFILE JSONException ("+loginfo+") ---------");
                    throw serviceFuture.result.responseJSON.JSONException;
                } else if (serviceFuture.result && serviceFuture.result.status && serviceFuture.result.status != 200) {
					ServiceLog.log("---------- PALMPROFILE status problem ("+loginfo+") status: "+serviceFuture.result.status+" ---------");
					PalmProfileUtil.sendError(future, "STATUS_ERROR", "" + serviceFuture.result.status);
				} else {
                     ServiceLog.log("---------- PALMPROFILE calling handler ("+loginfo+") ---------");
              		return doIt.call(context)
				}
            } catch (e) {
				try {
	                ServiceLog.log("---------- PALMPROFILE exception log ---------" + JSON.stringify(e));
					
					
					try {
						if (serviceFuture && serviceFuture.result && serviceFuture.result.status && serviceFuture.result.status == 200 ) {
		                 	ServiceLog.log("---------- PALMPROFILE ERROR RESULT ---------");
							try {
		                		ServiceLog.log("---------- PALMPROFILE exception log result ---------" + JSON.stringify(serviceFuture.result));
							} catch(e2) {
	                			ServiceLog.log("---------- PALMPROFILE SOMETHING REALLY BAD E2 ---------");
							};
						}
					} catch (e3) {
	                	ServiceLog.log("---------- PALMPROFILE SOMETHING REALLY BAD E3 ---------");
					}
					
					
					if (future) {
	                 	ServiceLog.log("---------- PALMPROFILE SET ERROR ---------");
	               		this.setErrorFromException(future, e);
					} else {
	                	ServiceLog.log("---------- PALMPROFILE MISSING FUTURE ---------");
					}
				} catch(e4) {
	                ServiceLog.log("---------- PALMPROFILE SOMETHING REALLY BAD HAPPENED E4 ---------");
	                ServiceLog.log("---------- PALMPROFILE "  + JSON.stringify(e4));
				}
            }
	}
	
	
	
});
//Initialized in ServiceAssistant, see NOV-99079
var PalmProfileUtil;
