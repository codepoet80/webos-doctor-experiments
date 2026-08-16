enyo.kind({
    name: "findApps.PMTServer",
    kind: "findApps.BaseServer",
   
    getCCTypes: function(binCountry, service, inProps, urlError) {
		if(urlError) {
	    	this.handleNullPaymentServerUrl(service, inProps, ["LOC02034"]);
	    }
		else {
	        // Check if the account parameters are available
	    	var paramsAvailable = this.isAccountParamsAvail();
	    	if(paramsAvailable) {
	    		if (!findApps.UserSession._paymentServerUrl) {
		            this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom));
		        }
	    		else {
	    			// Everything is available: account parameters + payment server url
				    var method = "getCCTypes";
				    var params = {
				        InGetCCTypes: {
				            authToken: findApps.UserSession._token,
				            accountAlias: findApps.UserSession._email,
				            deviceId: findApps.UserSession._deviceId,
				            billToCountry: binCountry
				        }
				    };
			        var inParams = {
			            url: findApps.UserSession._paymentServerUrl + method,
			            body: params,
			            service: service
			        };
			        this.callServer(inParams, inProps);
			    }
	        }
	    	else
	    		this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
		}
    },
    setDefaultPaymentInfo: function(infoId, service, inProps, urlError) {
    	if(urlError) {
    		this.handleNullPaymentServerUrl(service, inProps, ["LOC02035"]);
    	}
    	else {
	        // Check if the account parameters are available
	    	var paramsAvailable = this.isAccountParamsAvail();
	    	if(paramsAvailable) {
	    		if (!findApps.UserSession._paymentServerUrl) {
	 	            this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom));
	 	        }
	    		else {
			        var method = "setDefaultPaymentInfo";
			        var params = {
			            InSetDefaultPaymentInfo: {
			                authToken: findApps.UserSession._token,
			                accountAlias: findApps.UserSession._email,
			                deviceId: findApps.UserSession._deviceId,
			                paymentInfoId: infoId
			            }
			        };
			        var inParams = {
			                url: findApps.UserSession._paymentServerUrl + method,
			                body: params,
			                service: service
			        };
			        this.callServer(inParams, inProps);
	    		}
	    	}
	    	else
	    		this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
    	}
    },
    setInvoiceEmail: function(emailAdd, service, inProps, urlError) {
    	if (urlError) 
    		this.handleNullPaymentServerUrl(service, inProps, ["LOC02036"]);
    	else {
	        // Check if the account parameters are available
	    	var paramsAvailable = this.isAccountParamsAvail();
	    	if(paramsAvailable) {
    		    if (!findApps.UserSession._paymentServerUrl) {
		            this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom));
		        }
    		    else {
    		    	var method = "setUserInfo";
			        var params = {
			            InSetUserInfo: {
			                authToken: findApps.UserSession._token,
			                accountAlias: findApps.UserSession._email,
			                deviceId: findApps.UserSession._deviceId,
			                invoiceEmail: emailAdd
			            }
			        };
		       
			        var inParams = {
		                url: findApps.UserSession._paymentServerUrl + method,
		                body: params,
		                service: service
		            };
		            this.callServer(inParams, inProps);
		        }
	    	}
	    	else
	    		this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
    	}
    },
    
    _gotCarrierInfo: function(inSender, inResponse, inRequest, inProps, urlError) {
    	this.log("getPaymentTypes gotCarrierInfo: ", inResponse);
    	if (urlError) 
    		this.handleNullPaymentServerUrl(inProps.successProps.service, inProps.successProps.props, ["LOC02037"]);
    	else {
	        // Check if the account parameters are available
	    	var paramsAvailable = this.isAccountParamsAvail();
	    	if(paramsAvailable) {
	    		if (!findApps.UserSession._paymentServerUrl) {
	                this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom));
	            } 
	    		else {
			        var method = "getPaymentTypes";
			        var params = {
			            InGetPaymentTypes: {
			                authToken: findApps.UserSession._token,
			                accountAlias: findApps.UserSession._email,
			                deviceId: findApps.UserSession._deviceId
			            //mcc: inResponse.results[0].mcc, // 310 works
			            //mnc: inResponse.results[0].mnc, // 0 works
			            //carrier: inResponse.results[0].qOperatorShortName // "sprint" works
			            }
			        };
			        if (inResponse && inResponse.results[0] && inResponse.results[0].mcc && inResponse.results[0].mnc && inResponse.results[0].qOperatorShortName) {
			            params.InGetPaymentTypes.mcc = inResponse.results[0].mcc;
			            params.InGetPaymentTypes.mnc = inResponse.results[0].mnc;
			            params.InGetPaymentTypes.carrier = inResponse.results[0].qOperatorShortName;
			        }
			        var inParams = {
			            url: findApps.UserSession._paymentServerUrl + method,
			            body: params,
			            service: inProps.successProps.service
			        };
			        this.callServer(inParams, inProps.successProps.props);
		    	}
	    	}
	    	else
	    		this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
    	}
    },
    _getCarrierFailure: function(inSender, inResponse, inRequest, inProps) {
        this.log("getPaymentTypes getCarrierFailure ", inResponse);
        this.handleNullPaymentServerUrl(inProps.successProps.service, inProps.successProps.props, ["LOC02038"]);
    },
    getPaymentTypes: function(service, inProps) {
        findApps.DeviceProfile.getInstance().getCarrierIdentification({
            onSuccess: "_gotCarrierInfo", 
            onFailure: "_getCarrierFailure", 
            scope: this,
            successProps: {// adding an extra level to avoid overwriting service property of the first call
                service: service,
                props: inProps
            }
        });
    },
    getBillToCountries: function(service, inProps, urlError) {
    	if(urlError)
    		this.handleNullPaymentServerUrl(service, inProps, ["LOC02039"]);
    	else {
	        // Check if the account parameters are available
	    	var paramsAvailable = this.isAccountParamsAvail();
	    	if(paramsAvailable) {
	    	    if (!findApps.UserSession._paymentServerUrl) {
	    	    	this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom));
			    } 
	    	    else {
			        var method = "getBillToCountries";
			        var params = {
			            InGetBillToCountries: {
			                authToken: findApps.UserSession._token,
			                accountAlias: findApps.UserSession._email,
			                deviceId: findApps.UserSession._deviceId
			            }
			        };
			       var inParams = {
		                url: findApps.UserSession._paymentServerUrl + method,
		                body: params,
		                service: service
		            };
		            this.callServer(inParams, inProps);
	    	    }
	    	}
	    	else
	    		this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
    	}
    },
    verifyPaymentSetup: function(service, inProps, urlError) {
    	if (urlError) 
    		this.handleNullPaymentServerUrl(service, inProps, ["LOC02040"]);
    	else {
	        // Check if the account parameters are available
	    	var paramsAvailable = this.isAccountParamsAvail();
	    	if(paramsAvailable) {
	    		if (!findApps.UserSession._paymentServerUrl) {
		            this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom));
	            }
	    		else {
			        var method = "getPaymentInfos";
			        var params = {
			            InGetPaymentInfos: {
			                authToken: findApps.UserSession._token,
			                accountAlias: findApps.UserSession._email,
			                deviceId: findApps.UserSession._deviceId
			            }
			        };
			        var inParams = {
		                url: findApps.UserSession._paymentServerUrl + method,
		                body: params,
		                service: service
		            };
		            this.callServer(inParams, inProps);
	    		}
	    	}
	    	else
	    		this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
    	}
    },
    addAccount: function(address, ccInfo, service, inProps, urlError) {
    	if(urlError)
    		this.handleNullPaymentServerUrl(service, inProps, ["LOC02041"]);
    	else {
	        // Check if the account parameters are available
	    	var paramsAvailable = this.isAccountParamsAvail();
	    	if(paramsAvailable) {
	    		if (!findApps.UserSession._paymentServerUrl) {
		            this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom));
		        }
	    		else {
			        var method = "addCCPaymentInfo";
			        var params = {
			            InAddCCPaymentInfo: {
			                authToken: findApps.UserSession._token,
			                accountAlias: findApps.UserSession._email,
			                deviceId: findApps.UserSession._deviceId,
			                billTo: address,
			                creditCard: ccInfo
			            }
			        };
			        var inParams = {
			                url: findApps.UserSession._paymentServerUrl + method,
			                body: params,
			                service: service
			        };
			        this.callServer(inParams, inProps);
	    		 }
	    	}
	    	else
	    		this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
    	}
    },
    
    _addOBAccountOnCarrierInfo: function(inSender, inResponse, inRequest, inProps, urlError) {
    	if(urlError)
    		this.handleNullPaymentServerUrl(inProps.sucessProps.service, inProps.sucessProps.props, ["LOC02042"]);
    	else {
	        // Check if the account parameters are available
	    	var paramsAvailable = this.isAccountParamsAvail();
	    	if(paramsAvailable) {
	    		if (!findApps.UserSession._paymentServerUrl) {
		            this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom));
		        }
	    		else {
	    			var method = "addOBPaymentInfo";
			        var params = {
			            InAddOBPaymentInfo: {
			                authToken: findApps.UserSession._token,
			                accountAlias: findApps.UserSession._email,
			                deviceId: findApps.UserSession._deviceId,
			                address: inProps.successProps.address,
			                mcc: inResponse.results[0] && inResponse.results[0].mcc,
			                mnc: inResponse.results[0] && inResponse.results[0].mnc,
			                carrier: inResponse.results[0] && inResponse.results[0].qOperatorShortName
			            }
			        };
		            var inParams = {
		                url: findApps.UserSession._paymentServerUrl + method,
		                body: params,
		                service: inProps.successProps.service
		            };
		            this.callServer(inParams, inProps.successProps.props);
	    		}
	    	}
	    	else
	    		this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
    	}
    },
    _addOBAccountOnCarrierInfoFail: function() {
    	this.error("_addOBAccountOnCarrierInfoFail for service ",inProps.successProps.service);
    	this.handleNullPaymentServerUrl(inProps.successProps.service, inProps.successProps.props, ["LOC02069"]);
    },
    addOBAccount: function(address, service, inProps) {
        findApps.DeviceProfile.getInstance().getCarrierIdentification({
            onSuccess:"_addOBAccountOnCarrierInfo", 
            onFailure:"_addOBAccountOnCarrierInfoFail", 
            scope: this,
            successProps: {
                address: address,
                service: service,
                props: inProps
            }
        });
    },
    getOBCountries: function(service, inProps, urlError) {
    	if(urlError) 
    		this.handleNullPaymentServerUrl(service, inProps, ["LOC02043"]);
    	else {
	        // Check if the account parameters are available
	    	var paramsAvailable = this.isAccountParamsAvail();
	    	if(paramsAvailable) {
	    		if (!findApps.UserSession._paymentServerUrl) {
		            this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom));
		        }
	    		else {
			        var method = "getOBCountries";
			        var params = {
			            InGetOBCountries: {
			                authToken: findApps.UserSession._token,
			                accountAlias: findApps.UserSession._email,
			                deviceId: findApps.UserSession._deviceId
			            }
			        };
			        
			        var inParams = {
			                url: findApps.UserSession._paymentServerUrl + method,
			                body: params,
			                service: service
			            };
			        this.callServer(inParams, inProps);
		        }
	    	}
	    	else
	    		this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
    	}
    },
    updateAccount: function(address, ccInfo, service, inProps, urlError) {
    	if(urlError)
    		this.handleNullPaymentServerUrl(service, inProps, ["LOC02044"]);
    	else {
	        // Check if the account parameters are available
	    	var paramsAvailable = this.isAccountParamsAvail();
	    	if(paramsAvailable) {
	    		if (!findApps.UserSession._paymentServerUrl) {
		            this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom));
		        }
	    		else {
			        var method = "updateCCPaymentInfo";
			        var params = {
			            InUpdateCCPaymentInfo: {
			                authToken: findApps.UserSession._token,
			                accountAlias: findApps.UserSession._email,
			                deviceId: findApps.UserSession._deviceId,
			                paymentInfoId: ccInfo.paymentInfoId,
			                billTo: address,
			                creditCard: ccInfo
			            }
			        };
			        var inParams = {
			                url: findApps.UserSession._paymentServerUrl + method,
			                body: params,
			                service: service
			        };
			        this.callServer(inParams, inProps);
	    		}
	    	}
	    	else
	    		this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
    	}
    },
    updateOBAccount: function(address, paymentInfoId, service, inProps, urlError) {
    	if(urlError)
    		this.handleNullPaymentServerUrl(service, inProps, ["LOC02045"]);
    	else {
	        // Check if the account parameters are available
	    	var paramsAvailable = this.isAccountParamsAvail();
	    	if(paramsAvailable) {
	    		if (!findApps.UserSession._paymentServerUrl) {
		            this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom));
		        }
	    		else {
			        var method = "updateOBPaymentInfo";
			        var params = {
			            InUpdateOBPaymentInfo: {
			                authToken: findApps.UserSession._token,
			                accountAlias: findApps.UserSession._email,
			                deviceId: findApps.UserSession._deviceId,
			                paymentInfoId: paymentInfoId,
			                address: address
			            }
			        };
			        
			        var inParams = {
			                url: findApps.UserSession._paymentServerUrl + method,
			                body: params,
			                service: service
			        };
			        this.callServer(inParams, inProps);
	    		}
	    	}
	    	else
	    		this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
    	}
    },
    
    _getOBInfosOnCarrierInfo: function(inSender, inResponse, inRequest, inProps, urlError) {
    	if (urlError)
            this.handleNullPaymentServerUrl(inProps.successProps.service, inProps.successProps.props, ["LOC02046"]);
        else {
	        // Check if the account parameters are available
	    	var paramsAvailable = this.isAccountParamsAvail();
	    	if(paramsAvailable) {
	    		if (!findApps.UserSession._paymentServerUrl) {
		            this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom));
		        } 
	    		else {
			        var method = "getOBInfos";
			        var params = {
			            InGetOBInfos: {
			                authToken: findApps.UserSession._token,
			                accountAlias: findApps.UserSession._email,
			                deviceId: findApps.UserSession._deviceId,
			                mcc: inResponse.results[0] && inResponse.results[0].mcc,
			                mnc: inResponse.results[0] && inResponse.results[0].mnc,
			                carrier: inResponse.results[0] && inResponse.results[0].qOperatorShortName
			            }
			        };
			        var inParams = {
			                url: findApps.UserSession._paymentServerUrl + method,
			                body: params,
			                service: "GetOnInfoService"
		            };
		            this.callServer(inParams, inProps.successProps.props);
	    		}
	    	}
	    	else
	    		this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
        }
    },
        
    getOBInfos: function(service, inProps) {
        findApps.DeviceProfile.getInstance().getCarrierIdentification({
            onSuccess: "_getOBInfosOnCarrierInfo", 
            onFailure: "_getOBInfosOnCarrierInfoFail", 
            scope: this,
            successProps: {
                service: service,
                props: inProps
            }
        });
    },
    _getOBInfosOnCarrierInfoFail: function(inSender, inResponse, inRequest, inProps) {
    	this.error("_getOBInfosOnCarrierInfoFail for service ",inProps.successProps.service);
    	this.handleNullPaymentServerUrl(inProps.successProps.service, inProps.successProps.props, ["LOC02070"]);
    },
    removeAccount: function(paymentInfoId, isCC, service, inProps, urlError) {
    	if(urlError)
    		this.handleNullPaymentServerUrl(service, inProps, ["LOC02047"]);
    	else {
	        // Check if the account parameters are available
	    	var paramsAvailable = this.isAccountParamsAvail();
	    	if(paramsAvailable) {
	    		if (!findApps.UserSession._paymentServerUrl) {
		            this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom));
		        }
	    		else {
			        var inputMethod = isCC ? "InRemoveCCPaymentInfo" : "InRemoveOBPaymentInfo";
			        //var outputMethod = isCC ? "OutRemoveCCPaymentInfo" : "OutRemoveOBPaymentInfo";
			        var method = isCC ? "removeCCPaymentInfo" : "removeOBPaymentInfo";
			        var inputPayload = {
			            authToken: findApps.UserSession._token,
			            accountAlias: findApps.UserSession._email,
			            deviceId: findApps.UserSession._deviceId,
			            paymentInfoId: paymentInfoId
			        }
			        var params = {};
			        params[inputMethod] = inputPayload;
			        
			       var inParams = {
		                url: findApps.UserSession._paymentServerUrl + method,
		                body: params,
		                service: service
		            };
		            this.callServer(inParams, inProps);
			       
	    		}
	    	}
	    	else
	    		this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
    	}
    },
    capturePayment: function(orderObj, service, inProps, urlError) {
    	if(urlError)
    		this.handleNullPaymentServerUrl(service, inProps, ["LOC02048"]);
    	else {
	        // Check if the account parameters are available
	    	var paramsAvailable = this.isAccountParamsAvail();
	    	if(paramsAvailable) {
	    		if (!findApps.UserSession._paymentServerUrl) {
			         this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom));
			    } 
	    		else {
			        if (!orderObj.obSessionId) delete orderObj.obSessionId;
			        var method = "capturePayment";
			        var params = {
			            InCapturePayment: {
			                authToken: findApps.UserSession._token,
			                accountAlias: findApps.UserSession._email,
			                deviceId: findApps.UserSession._deviceId,
			                order: orderObj
			            }
			        };
			       
			        var inParams = {
			                url: findApps.UserSession._paymentServerUrl + method,
			                body: params,
			                service: service
			        };
			        this.callServer(inParams, inProps);
	    		}
	    	}
	    	else
	    		this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
    	}
    },
    getOrderStatus: function(orderNo, service, inProps, urlError) {
    	if(urlError)
    		this.handleNullPaymentServerUrl(service, inProps, ["LOC02049"]);
    	else {
	        // Check if the account parameters are available
	    	var paramsAvailable = this.isAccountParamsAvail();
	    	if(paramsAvailable) {
	    		if (!findApps.UserSession._paymentServerUrl) {
		            this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom));
		        } 
	    		else {
			        var method = "getOrderStatus";
			        var params = {
			            InGetOrderStatus: {
			                authToken: findApps.UserSession._token,
			                accountAlias: findApps.UserSession._email,
			                deviceId: findApps.UserSession._deviceId,
			                orderNo: orderNo
			            }
			        };
			        
			        var inParams = {
			                url: findApps.UserSession._paymentServerUrl + method,
			                body: params,
			                service: service
			        };
			        this.callServer(inParams, inProps);
	    		}
	    	}
	    	else
	    		this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
    	}
    },
    getEmbargoedEmailExtensions: function(service, inProps, urlError) {
    	if(urlError)
    		this.handleNullPaymentServerUrl(service, inProps, ["LOC02050"]);
    	else {
	        // Check if the account parameters are available
	    	var paramsAvailable = this.isAccountParamsAvail();
	    	if(paramsAvailable) {
	    		if (!findApps.UserSession._paymentServerUrl) {
			        this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom));
			    }
	    		else {
			        var method = "getEmbargoedEmailExtensions";
			        var params = {
			            InGetEmbargoedEmailExtensions: {
			                authToken: findApps.UserSession._token,
			                accountAlias: findApps.UserSession._email,
			                deviceId: findApps.UserSession._deviceId
			            }
			        };
			        var inParams = {
			                url: findApps.UserSession._paymentServerUrl + method,
			                body: params,
			                service: service
			        };
			        this.callServer(inParams, inProps);
	    		}
	    	}
	    	else
	    		this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
    	}
    },
    // promo code: getCodeType from server
    getCodeInfos: function(promocode, service, inProps, urlError) {
    	if(urlError)
    		this.handleNullPaymentServerUrl(service, inProps, ["LOC02051"]);
    	else {
	        // Check if the account parameters are available
	    	var paramsAvailable = this.isAccountParamsAvail();
	    	if(paramsAvailable) {
	    		if (!findApps.UserSession._paymentServerUrl) {
		            this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom));
		        } 
	    		else {
			        var method = "getPromoCodeInfos";
			        var params = {
			            InGetPromoCodeInfos: {
			                authToken: findApps.UserSession._token,
			                accountAlias: findApps.UserSession._email,
			                deviceId: findApps.UserSession._deviceId,
			                code: promocode
			            }
			        };
			        var inParams = {
			                url: findApps.UserSession._paymentServerUrl + method,
			                body: params,
			                service: service
			        };
			        this.callServer(inParams, inProps);
	    		}
	    	}
	    	else
	    		this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
    	}
    },
    checkPromoCodeStatus: function(code, appid, version, service, inProps, urlError) {
    	if(urlError)
    		this.handleNullPaymentServerUrl(service, inProps, ["LOC02052"]);
    	else {
	        // Check if the account parameters are available
	    	var paramsAvailable = this.isAccountParamsAvail();
	    	if(paramsAvailable) {
	    		if (!findApps.UserSession._paymentServerUrl) {
		            this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom));
		        } 
	    		else {
			        var method = "checkPromoCodeStatus";
			        var params = {
			            InCheckPromoCodeStatus: {
			                authToken: findApps.UserSession._token,
			                accountAlias: findApps.UserSession._email,
			                deviceId: findApps.UserSession._deviceId,
			                code: code,
			                id: appid,
			                version: version
			            }
			        };
			        var inParams = {
			                url: findApps.UserSession._paymentServerUrl + method,
			                body: params,
			                service: service
			        };
			        this.callServer(inParams, inProps);
	    		}
	    	}
	    	else
	    		this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
    	}
    },
    
    initOBSession: function(obInfos, service, inProps, urlError) {
        // This hits an XML API on the aggregator's servers
        // Since we can't use weave, we need to do our own call and management.
    	if (urlError) {
            this.handleNullPaymentServerUrl(service, inProps, ["LOC02066"]);
        } 
    	else if (!findApps.UserSession._paymentServerUrl) {
            this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom));
        } 
    	else {
    		var wapProxy = obInfos.wapProxy;
            var headers = {};
           
            var isWanSvcConnected = enyo.application.connectionManager.isWanSvcConnected;
            var ipAddress = enyo.application.connectionManager.ipAddress;
            var isWanInterface = enyo.application.connectionManager.wanInterface;
            
            var makeCall = true;
            
            if (wapProxy && isWanSvcConnected && ipAddress) {
                // Use proxy for WAP
                this.log("isWanSvcConnected", isWanSvcConnected, "ipAddress ", ipAddress);
                headers = {
                    "X-webOS-NetworkInterface": ipAddress
                };
                var proxyAddr = wapProxy;
                var reg = /^http:\/\/([A-Za-z0-9\.-]+):([0-9]+)$/; // look for domain and port
                var matches = reg.exec(proxyAddr);
                headers["X-webOS-proxyaddr"] = matches[1];
                headers["X-webOS-proxyport"] = matches[2];
            }
            else {
    	        if(isWanInterface) {
    				headers = {
    					"X-webOS-NetworkInterface": enyo.application.connectionManager.wanInterface
    				};
    	        }
    	        else 
    	        	makeCall = false;
            }
            
            if(makeCall === true) {
            	var inParams = {
     	          url: obInfos.initSession.URL,
     	          service: service,
     	          wapProxy: obInfos.wapProxy,
     	          headers: headers
     	        }
     	        this.callServer3(inParams, inProps);
            }
            else {
            	// Report failure - no proxy and no wan interface
            	this.handleNoWanConnection(service, inProps);
            }
        }
    },
    handleNoWanConnection: function(service, inProps) {
       var errors = ["nowan"];
       var failureArgs = [this, null, null, inProps, errors];
            
       (inProps.scope[inProps.onFailure]).apply(inProps.scope, failureArgs);
    },
    handleNullPaymentServerUrl: function(service, inProps, errors) {
        var inResponse = {
            JSONException: {
                errorCode: "PMT_catchAll"
            }
        };
        errors.push("LOC02053");
        var failureArgs = [this, inResponse, null, inProps, errors];
        
        (inProps.scope[inProps.onFailure]).apply(inProps.scope, failureArgs);
    },
    _gotPaymentUrl: function(inSender, inResponse, inRequest, inProps) {
        findApps.UserSession._paymentServerUrl = inResponse.parameterInfos.value;
        this[inProps.callback].apply(this, inProps.args);
    },
    _gotPaymentUrlError: function(inSender, inResponse, inRequest, inProps) {
        this.error("Error in getting payment server url", inResponse);
        var argsArr = Array.prototype.slice.apply(inProps.args);
		// true for urlError
		argsArr.push(true);
		this[inProps.callback].apply(this, argsArr);
    },
    getPaymentServerUrl: function(args, callback) {
        findApps.AccountServices.getInstance().getPaymentServerUrl({
            onSuccess: "_gotPaymentUrl", 
            onFailure: "_gotPaymentUrlError",
            scope: this,
            args: args, 
            callback: callback
        });
    },
    handleAccountParamsError: function(service, inProps) {
    	var errors = ["LOC07007"];
    	// dummy response
		var inResponse = {
	            JSONException: {
	                errorCode: "LOC07007"
	            }
	     };
		var failureArgs = [this, inResponse, null, inProps, errors];
        (inProps.scope[inProps.onFailure]).apply(inProps.scope, failureArgs);
    },
    isAccountParamsAvail: function(){
	 	return findApps.UserSession.getAccountToken() ? true : false;
	}
});
