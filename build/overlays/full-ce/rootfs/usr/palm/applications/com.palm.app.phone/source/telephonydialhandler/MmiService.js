enyo.kind({
	name: "MmiService",
	kind: enyo.PalmService,
	service: enyo.palmServices.telephony,
	timeout: 65000, // 65 seconds
	send: function(arg, cmd, mmi) {
		enyo.application.UI.event('dial',{dialog:true, message:Messages.mmiPending, hideButton:true});
		return this.call(arg,{
			method: cmd,
			mmi: mmi // pass to callback
		});
	},
	isServiced: function() {
		return true; // TODO
	},
	response: function(inRequest) {
		if ( inRequest.didTimeout ) {
			this.showDialog(Messages.mmiTimeout);
			return;
		}
		
		var payload = inRequest.response;
		var success = !!payload.returnValue;
		var mmi = inRequest.mmi;
		var msg = MmiService.MmiResponses[mmi.serviceCode][mmi.action];
		
		// mod the error message if we don't have service
		if ( ! this.isServiced() && ! success ) {
		    //enyo.log("DialStringParser::interpretDialString", "no service on MMI error");
		    payload.errorText = enyo.application.Messages.noServiceError;
		} else {
		    //enyo.log("DialStringParser::interpretDialString", "getting error string because serviced: ", this.isServiced(), " and success:", success);
		    if ( enyo.application.Messages.serviceErrors[payload.errorCode] !== undefined ) {
		        payload.errorText = enyo.application.Messages.serviceErrors[payload.errorCode];
		    } else {
		        payload.errorText = enyo.application.Messages.serviceErrors[enyo.application.Messages.defaultErrorIndex];
		    }
		}
		
		// TODO FIXME: WORKAROUND TO HANDLE ARRAY IN FORWARDQUERY
		if (mmi.cmd == "forwardQuery" && success && payload.extended && payload.extended.status) {
		    var status = payload.extended.status;
		    var catStatus = "";
		    for (var i = 0; i < status.length; i++) {
		        var bearer = MmiService.MmiBearers[status[i].bearer] || $L(status[i].bearer);
		        catStatus += bearer + ": "
		        	+ (status[i].activated ? enyo.application.Messages.fwdActivated: enyo.application.Messages.fwdNotActivated)
		        	+ " " + status[i].number + ";";
		    }
			
		    if (catStatus.length > 0) {
		    	payload.extended.status = catStatus.substr(0, catStatus.length - 1);
			}
		}
		
		if (mmi.ic && mmi.ic[2]) {
		    mmi.ic[2] = MmiService.MmiBearers[mmi.ic[2]] || $L(mmi.ic[2]);
		}
		
		if (mmi.ic && mmi.ic[1]) {
		    mmi.ic[1] = MmiService.MmiBearers[mmi.ic[1]] || $L(mmi.ic[1]);
		}
		
		// Put all the response and mmi codes into a single object (and flatten them) for interpolation to happen correctly
		var data = {};
		this.addObject(data, payload);
		this.addObject(data, mmi);
		
		/*enyo.log("PhoneApp: DialStringParser::interpretDialString Mojo payload= %j", payload);
		enyo.log("PhoneApp: DialStringParser::interpretDialString mmiResponses= %j", msg);
		enyo.log("PhoneApp: DialStringParser::interpretDialString data = %j", data);*/
		var j, outerKeys = Object.keys(msg);
		for (j = 0; j < outerKeys.length; j++) {
			var key = outerKeys[j];
		    // Does the object exist in the payload?
		    if (data[key] != undefined) {
				var i, value, keys = Object.keys(msg[key]);
				for (i = 0; i < keys.length; i++) {
					value = keys[i];
		            // Perform regular expression matching (which matches plain vanilla strings too)
		            if (data[key].toString().match(RegExp(value))) {
		                //enyo.log("DialStringParser::interpretDialString", "match!!! msg=", Object.toJSON(msg[key][value]));
		                // Perform parameter substitution
		                msg = enyo.application.Utils.interpolate(msg[key][value], data);
						
						// show dialpad with message dialog
						this.showDialog(msg);
						return;
		            }
		        };
		    }
		};
	},
	// TODO refactor
    addObject: function(src, add) {
        Object.keys(add).forEach(function(key){
            if (src[key] == undefined) {
                if (typeof(add[key]) == 'object' && !(add[key] instanceof Array)) {
                    this.addObject(src, add[key]);
                } else {
                    src[key] = add[key];
				}
            }
        }, this);
    },
	// implementation separate for unit testing
	showDialog: function(msg) {
        enyo.application.UI.event('dial',{dialog:true, message:msg});
	},
	statics: {
		// This is the service code object.  There are 5 possible actions (activate, deactivate, register, unregister and 
		// interrogate) based on the prefix of the number entered by the user. The Supplementary Information is parsed
		// and stored as si1, si2, si3 and si4.  The bearer services (infoClass) corresponding to these siX values are also
		// stored.  These values are melded into the commands before they are sent. 
		MmiServiceCodes: {
		    "04": {
		        register: {
		            cmd: "pin1Change",
		            oldPin: "#{si.1}",
		            newPin: "#{si.2}",
		            newPinConfirm: "#{si.3}"
		        }
		    },
		    "042": {
		        register: {
		            cmd: "pin2Change",
		            oldPin: "#{si.1}",
		            newPin: "#{si.2}",
		            newPinConfirm: "#{si.3}"
		        }
		    },
		    "05": {
		        register: {
		            cmd: "pin1Unblock",
		            puk: "#{si.1}",
		            newPin: "#{si.2}",
		            newPinConfirm: "#{si.3}"
		        }
		    },
		    "052": {
		        register: {
		            cmd: "pin2Unblock",
		            puk2: "#{si.1}",
		            newPin2: "#{si.2}",
		            newPinConfirm: "#{si.3}"
		        }
		    },
		    "002": {
		        activate: {
		            cmd: "forwardActivate",
		            condition: "allforwarding",
		            bearer: "#{ic.2}",
		            activate: true
		        },
		        deactivate: {
		            cmd: "forwardActivate",
		            condition: "allforwarding",
		            bearer: "#{ic.2}",
		            activate: false
		        },
		        register: {
		            cmd: "forwardRegister",
		            number: "#{si.1}",
		            condition: "allforwarding",
		            bearer: "#{ic.2}",
		            time: "#{si.3}"
		        },
		        unregister: {
		            cmd: "forwardRegister",
		            number: "",
		            condition: "allforwarding",
		            bearer: "#{ic.2}",
		            time: "#{si.3}"
		        },
		        interrogate: {
		            cmd: "forwardQuery",
		            condition: "allforwarding",
		            bearer: "#{ic.2}"
		        }
		    },
		    "004": {
		        activate: {
		            cmd: "forwardActivate",
		            condition: "allconditional",
		            bearer: "#{ic.2}",
		            activate: true
		        },
		        deactivate: {
		            cmd: "forwardActivate",
		            condition: "allconditional",
		            bearer: "#{ic.2}",
		            activate: false
		        },
		        register: {
		            cmd: "forwardRegister",
		            number: "#{si.1}",
		            condition: "allconditional",
		            bearer: "#{ic.2}",
		            time: "#{si.3}"
		        },
		        unregister: {
		            cmd: "forwardRegister",
		            number: "",
		            condition: "allconditional",
		            bearer: "#{ic.2}",
		            time: "#{si.3}"
		        },
		        interrogate: {
		            cmd: "forwardQuery",
		            condition: "allconditional",
		            bearer: "#{ic.2}"
		        }
		    },
		    "21": {
		        activate: {
		            cmd: "forwardActivate",
		            condition: "unconditional",
		            bearer: "#{ic.2}",
		            activate: true
		        },
		        deactivate: {
		            cmd: "forwardActivate",
		            condition: "unconditional",
		            bearer: "#{ic.2}",
		            activate: false
		        },
		        register: {
		            cmd: "forwardRegister",
		            number: "#{si.1}",
		            condition: "unconditional",
		            bearer: "#{ic.2}",
		            time: "#{si.3}"
		        },
		        unregister: {
		            cmd: "forwardRegister",
		            number: "",
		            condition: "unconditional",
		            bearer: "#{ic.2}",
		            time: "#{si.3}"
		        },
		        interrogate: {
		            cmd: "forwardQuery",
		            condition: "unconditional",
		            bearer: "#{ic.2}"
		        }
		    },
		    "61": {
		        activate: {
		            cmd: "forwardActivate",
		            condition: "noreply",
		            bearer: "#{ic.2}",
		            activate: true
		        },
		        deactivate: {
		            cmd: "forwardActivate",
		            condition: "noreply",
		            bearer: "#{ic.2}",
		            activate: false
		        },
		        register: {
		            cmd: "forwardRegister",
		            number: "#{si.1}",
		            condition: "noreply",
		            bearer: "#{ic.2}",
		            time: "#{si.3}"
		        },
		        unregister: {
		            cmd: "forwardRegister",
		            number: "",
		            condition: "noreply",
		            bearer: "#{ic.2}",
		            time: "#{si.3}"
		        },
		        interrogate: {
		            cmd: "forwardQuery",
		            condition: "noreply",
		            bearer: "#{ic.2}"
		        }
		    },
		    "62": {
		        activate: {
		            cmd: "forwardActivate",
		            condition: "unreachable",
		            bearer: "#{ic.2}",
		            activate: true
		        },
		        deactivate: {
		            cmd: "forwardActivate",
		            condition: "unreachable",
		            bearer: "#{ic.2}",
		            activate: false
		        },
		        register: {
		            cmd: "forwardRegister",
		            number: "#{si.1}",
		            condition: "unreachable",
		            bearer: "#{ic.2}",
		            time: "#{si.3}"
		        },
		        unregister: {
		            cmd: "forwardRegister",
		            number: "",
		            condition: "unreachable",
		            bearer: "#{ic.2}",
		            time: "#{si.3}"
		        },
		        interrogate: {
		            cmd: "forwardQuery",
		            condition: "unreachable",
		            bearer: "#{ic.2}"
		        }
		    },
		    "67": {
		        activate: {
		            cmd: "forwardActivate",
		            condition: "mobilebusy",
		            bearer: "#{ic.2}",
		            activate: true
		        },
		        deactivate: {
		            cmd: "forwardActivate",
		            condition: "mobilebusy",
		            bearer: "#{ic.2}",
		            activate: false
		        },
		        register: {
		            cmd: "forwardRegister",
		            number: "#{si.1}",
		            condition: "mobilebusy",
		            bearer: "#{ic.2}",
		            time: "#{si.3}"
		        },
		        unregister: {
		            cmd: "forwardRegister",
		            number: "",
		            condition: "mobilebusy",
		            bearer: "#{ic.2}",
		            time: "#{si.3}"
		        },
		        interrogate: {
		            cmd: "forwardQuery",
		            condition: "mobilebusy",
		            bearer: "#{ic.2}"
		        }
		    },
		    "43": {
		        activate: {
		            cmd: "callWaitingSet",
		            bearer: "#{ic.1}",
		            enable: true
		        },
		        deactivate: {
		            cmd: "callWaitingSet",
		            bearer: "#{ic.1}",
		            enable: false
		        },
		        register: {
		            cmd: "callWaitingSet",
		            bearer: "#{ic.1}",
		            enable: true
		        },
		        unregister: {
		            cmd: "callWaitingSet",
		            bearer: "#{ic.1}",
		            enable: false
		        },
		        interrogate: {
		            cmd: "callWaitingQuery",
		            bearer: "#{ic.1}"
		        }
		    },
		    "03": {
		        activate: {
		            cmd: "barringPasswordChange",
		            condition: "#{bs.1}",
		            oldpassword: "#{si.2}",
		            newpassword: "#{si.3}",
		            newpasswordconfirm: "#{si.4}"
		        },
		        register: {
		            cmd: "barringPasswordChange",
		            condition: "#{bs.1}",
		            oldpassword: "#{si.2}",
		            newpassword: "#{si.3}",
		            newpasswordconfirm: "#{si.4}"
		        }
		    },
		    "33": {
		        activate: {
		            cmd: "barringSet",
		            condition: "baralloutgoing",
		            bearer: "#{ic.2}",
		            password: "#{si.1}",
		            enable: true
		        },
		        deactivate: {
		            cmd: "barringSet",
		            condition: "baralloutgoing",
		            bearer: "#{ic.2}",
		            password: "#{si.1}",
		            enable: false
		        },
		        register: {
		            cmd: "barringSet",
		            condition: "baralloutgoing",
		            bearer: "#{ic.2}",
		            password: "#{si.1}",
		            enable: true
		        },
		        unregister: {
		            cmd: "barringSet",
		            condition: "baralloutgoing",
		            bearer: "#{ic.2}",
		            password: "#{si.1}",
		            enable: false
		        },
		        interrogate: {
		            cmd: "barringQuery",
		            condition: "baralloutgoing",
		            bearer: "#{ic.2}"
		        }
		    },
		    "331": {
		        activate: {
		            cmd: "barringSet",
		            condition: "baroutgoingint",
		            bearer: "#{ic.2}",
		            password: "#{si.1}",
		            enable: true
		        },
		        deactivate: {
		            cmd: "barringSet",
		            condition: "baroutgoingint",
		            bearer: "#{ic.2}",
		            password: "#{si.1}",
		            enable: false
		        },
		        register: {
		            cmd: "barringSet",
		            condition: "baroutgoingint",
		            bearer: "#{ic.2}",
		            password: "#{si.1}",
		            enable: true
		        },
		        unregister: {
		            cmd: "barringSet",
		            condition: "baroutgoingint",
		            bearer: "#{ic.2}",
		            password: "#{si.1}",
		            enable: false
		        },
		        interrogate: {
		            cmd: "barringQuery",
		            condition: "baroutgoingint",
		            bearer: "#{ic.2}"
		        }
		    },
		    "332": {
		        activate: {
		            cmd: "barringSet",
		            condition: "baroutgoingintextohome",
		            bearer: "#{ic.2}",
		            password: "#{si.1}",
		            enable: true
		        },
		        deactivate: {
		            cmd: "barringSet",
		            condition: "baroutgoingintextohome",
		            bearer: "#{ic.2}",
		            password: "#{si.1}",
		            enable: false
		        },
		        register: {
		            cmd: "barringSet",
		            condition: "baroutgoingintextohome",
		            bearer: "#{ic.2}",
		            password: "#{si.1}",
		            enable: true
		        },
		        unregister: {
		            cmd: "barringSet",
		            condition: "baroutgoingintextohome",
		            bearer: "#{ic.2}",
		            password: "#{si.1}",
		            enable: false
		        },
		        interrogate: {
		            cmd: "barringQuery",
		            condition: "baroutgoingintextohome",
		            bearer: "#{ic.2}"
		        }
		    },
		    "35": {
		        activate: {
		            cmd: "barringSet",
		            condition: "barallincoming",
		            bearer: "#{ic.2}",
		            password: "#{si.1}",
		            enable: true
		        },
		        deactivate: {
		            cmd: "barringSet",
		            condition: "barallincoming",
		            bearer: "#{ic.2}",
		            password: "#{si.1}",
		            enable: false
		        },
		        register: {
		            cmd: "barringSet",
		            condition: "barallincoming",
		            bearer: "#{ic.2}",
		            password: "#{si.1}",
		            enable: true
		        },
		        unregister: {
		            cmd: "barringSet",
		            condition: "barallincoming",
		            bearer: "#{ic.2}",
		            password: "#{si.1}",
		            enable: false
		        },
		        interrogate: {
		            cmd: "barringQuery",
		            condition: "barallincoming",
		            bearer: "#{ic.2}"
		        }
		    },
		    "351": {
		        activate: {
		            cmd: "barringSet",
		            condition: "barincomingroaming",
		            bearer: "#{ic.2}",
		            password: "#{si.1}",
		            enable: true
		        },
		        deactivate: {
		            cmd: "barringSet",
		            condition: "barincomingroaming",
		            bearer: "#{ic.2}",
		            password: "#{si.1}",
		            enable: false
		        },
		        register: {
		            cmd: "barringSet",
		            condition: "barincomingroaming",
		            bearer: "#{ic.2}",
		            password: "#{si.1}",
		            enable: true
		        },
		        unregister: {
		            cmd: "barringSet",
		            condition: "barincomingroaming",
		            bearer: "#{ic.2}",
		            password: "#{si.1}",
		            enable: false
		        },
		        interrogate: {
		            cmd: "barringQuery",
		            condition: "barincomingroaming",
		            bearer: "#{ic.2}"
		        }
		    },
		    "330": {
		        activate: {
		            cmd: "barringSet",
		            condition: "barallbarring",
		            bearer: "#{ic.2}",
		            password: "#{si.1}",
		            enable: true
		        },
		        deactivate: {
		            cmd: "barringSet",
		            condition: "barallbarring",
		            bearer: "#{ic.2}",
		            password: "#{si.1}",
		            enable: false
		        },
		        register: {
		            cmd: "barringSet",
		            condition: "barallbarring",
		            bearer: "#{ic.2}",
		            password: "#{si.1}",
		            enable: true
		        },
		        unregister: {
		            cmd: "barringSet",
		            condition: "barallbarring",
		            bearer: "#{ic.2}",
		            password: "#{si.1}",
		            enable: false
		        },
		        interrogate: {
		            cmd: "barringQuery",
		            condition: "barallbarring",
		            bearer: "#{ic.2}"
		        }
		    },
		    "333": {
		        activate: {
		            cmd: "barringSet",
		            condition: "baroutgoing",
		            bearer: "#{ic.2}",
		            password: "#{si.1}",
		            enable: true
		        },
		        deactivate: {
		            cmd: "barringSet",
		            condition: "baroutgoing",
		            bearer: "#{ic.2}",
		            password: "#{si.1}",
		            enable: false
		        },
		        register: {
		            cmd: "barringSet",
		            condition: "baroutgoing",
		            bearer: "#{ic.2}",
		            password: "#{si.1}",
		            enable: true
		        },
		        unregister: {
		            cmd: "barringSet",
		            condition: "baroutgoing",
		            bearer: "#{ic.2}",
		            password: "#{si.1}",
		            enable: false
		        },
		        interrogate: {
		            cmd: "barringQuery",
		            condition: "baroutgoing",
		            bearer: "#{ic.2}"
		        }
		    },
		    "353": {
		        activate: {
		            cmd: "barringSet",
		            condition: "barincoming",
		            bearer: "#{ic.2}",
		            password: "#{si.1}",
		            enable: true
		        },
		        deactivate: {
		            cmd: "barringSet",
		            condition: "barincoming",
		            bearer: "#{ic.2}",
		            password: "#{si.1}",
		            enable: false
		        },
		        register: {
		            cmd: "barringSet",
		            condition: "barincoming",
		            bearer: "#{ic.2}",
		            password: "#{si.1}",
		            enable: true
		        },
		        unregister: {
		            cmd: "barringSet",
		            condition: "barincoming",
		            bearer: "#{ic.2}",
		            password: "#{si.1}",
		            enable: false
		        },
		        interrogate: {
		            cmd: "barringQuery",
		            condition: "barincoming",
		            bearer: "#{ic.2}"
		        }
		    },
		    "30": {
		        activate: {
		            cmd: "clipSet",
		            restrict: false
		        },
		        deactivate: {
		            cmd: "clipSet",
		            restrict: true
		        },
		        interrogate: {
		            cmd: "clipQuery"
		        }
		    },
		    "31": {
		        activate: {
		            cmd: "clirSet",
		            restrict: true
		        },
		        deactivate: {
		            cmd: "clirSet",
		            restrict: false
		        },
		        register: {
		            cmd: "clirSet",
		            restrict: true
		        },
		        unregister: {
		            cmd: "clirSet",
		            restrict: false
		        },
		        interrogate: {
		            cmd: "clirQuery"
		        }
		    },
		    "300": {
		        interrogate: {
		            cmd: "cnapQuery"
		        }
		    },
		    "06": {
		        interrogate: {
		            cmd: "imeiQuery"
		        }
		    },
		},
		
		MmiBearers: {
			"defaultbearer": $L("all basic services"),
			"default": $L("all basic services"),
			"voice": $L("voice"),
			"data": $L("data"),
			"fax":$L("fax"),
			"sms":$L("SMS"),
			"datacircuitsync":$L("synchronous circuit data"),
			"datacircuitasync":$L("asynchronous circuit data"),
			"packetaccess":$L("packet access"),
			"padaccess":$L("PAD access"),
			"allsyncservices":$L("all synchronous services"),
			"allasyncservices":$L("all asynchronous services"),
			"auxiliarytelephony":$L("auxiliary telephony"),
			"alldataCDSServices":$L("synchronous circuit data switch"),
			"alldataCDAServices":$L("asynchronous circuit data switch")
		},
		
		// The responses to the MMI codes are interpreted.  The messages are listed in the order that the parameters should be
		// looked at.  Once a match is found, processing is stopped and the message is displayed.  You can use regular
		// expressions to match values (look at "04" below").  Values from both the user entered data (siX and icX) and
		// the returned JSON object are available for comparision and interpolation. 
		MmiResponses: {
		    "04": {
		        register: {
		            returnValue: {
		                "true": $L("PIN change successful.")
		            },
		            errorCode: {
		                5: $L("PIN must be enabled before change is allowed.")
		            },
		            attemptsRemaining: {
		                "[0-9]*": $L("Unable to change PIN. #{attemptsRemaining} attempts remaining.")
		            },
		            serviceCode: {
		                "04": $L("Unable to change PIN.")
		            }
		        }
		    },
		    "042": {
		        register: {
		            returnValue: {
		                "true": $L("PIN2 change successful.")
		            },
		            errorCode: {
		                5: $L("PIN2 must be enabled before change is allowed.")
		            },
		            attemptsRemaining: {
		                "[0-9]*": $L("Unable to change PIN2. #{attemptsRemaining} attempts remaining.")
		            },
		            serviceCode: {
		                "042": $L("Unable to change PIN2.")
		            }
		        }
		    },
		    "05": {
		        register: {
		            returnValue: {
		                "true": $L("PIN reset successful.")
		            },
		            attemptsRemaining: {
		                "[0-9]*": $L("PIN reset failed. #{attemptsRemaining} attempts remaining.")
		            },
		            errorCode: {
		                ".*": $L("Unable to reset PIN.")
		            }
		        }
		    },
		    "052": {
		        register: {
		            returnValue: {
		                "true": $L("PIN2 reset successful.")
		            },
		            attemptsRemaining: {
		                "[0-9]*": $L("Unable to reset PIN2. #{attemptsRemaining} attempts remaining.")
		            },
		            errorCode: {
		                ".*": $L("Unable to reset PIN2.")
		            }
		        }
		    },
		    "002": {
		        activate: {
		            returnValue: {
		                "true": $L("Call forwarding activated for all-forwarding: #{ic.2}."),
		                "false": $L("Call forwarding activation failed. #{errorText}")
		            }
		        },
		        deactivate: {
		            returnValue: {
		                "true": $L("Call forwarding deactivated for all-forwarding: #{ic.2}."),
		                "false": $L("Call forwarding deactivation failed. #{errorText}")
		            }
		        },
		        register: {
		            returnValue: {
		                "true": $L("Call forwarding registered for #{si.1} for all-forwarding: #{ic.2}."),
		                "false": $L("Call forwarding registration failed. #{errorText}")
		            }
		        },
		        unregister: {
		            returnValue: {
		                "true": $L("Call forwarding unregistered for all-forwarding: #{ic.2}."),
		                "false": $L("Call forwarding unregistration failed. #{errorText}")
		            }
		        },
		        interrogate: {
		            returnValue: {
		                "true": $L("Call forwarding (all-forwarding) status: #{status}"),
						"false": $L("Operation failed: Call forwarding (all-forwarding) query. #{errorText}")
		            },
		        }
		    },
		    "004": {
		        activate: {
		            returnValue: {
		                "true": $L("Call forwarding activated for all-conditional: #{ic.2}."),
		                "false": $L("Call forwarding activation failed. #{errorText}")
		            }
		        },
		        deactivate: {
		            returnValue: {
		                "true": $L("Call forwarding deactivated for all-conditional: #{ic.2}."),
		                "false": $L("Call forwarding deactivation failed. #{errorText}")
		            }
		        },
		        register: {
		            returnValue: {
		                "true": $L("Call forwarding registered for #{si.1} for all-conditional: #{ic.2}."),
		                "false": $L("Call forwarding registration failed. #{errorText}")
		            }
		        },
		        unregister: {
		            returnValue: {
		                "true": $L("Call forwarding unregistered for all-conditional: #{ic.2}."),
		                "false": $L("Call forwarding unregistration failed. #{errorText}")
		            }
		        },
		        interrogate: {
		            returnValue: {
		               	"true": $L("Call forwarding (all-conditional) status: #{status}"),
					    "false": $L("Operation failed: Call forwarding (all-conditional). #{errorText}")
		            },

		        }
		    },
		    "21": {
		        activate: {
		            returnValue: {
		                "true": $L("Call forwarding activated for unconditional: #{ic.2}."),
		                "false": $L("Call forwarding activation failed. #{errorText}")
		            }
		        },
		        deactivate: {
		            returnValue: {
		                "true": $L("Call forwarding deactivated for unconditional: #{ic.2}."),
		                "false": $L("Call forwarding deactivation failed. #{errorText}")
		            }
		        },
		        register: {
		            returnValue: {
		                "true": $L("Call forwarding registered for #{si.1} for unconditional: #{ic.2}."),
		                "false": $L("Call forwarding registration failed. #{errorText}")
		            }
		        },
		        unregister: {
		            returnValue: {
		                "true": $L("Call forwarding unregistered for unconditional: #{ic.2}."),
		                "false": $L("Call forwarding unregistration failed. #{errorText}")
		            }
		        },
		        interrogate: {
		            returnValue: {
		                "true": $L("Call forwarding (unconditional) status: #{status}"),
						"false": $L("Operation failed: Call forwarding (unconditional) #{errorText}")
		            },
		        }
		    },
		    "61": {
		        activate: {
		            returnValue: {
		                "true": $L("Call forwarding activated for no reply: #{ic.2}."),
		                "false": $L("Call forwarding activation failed. #{errorText}")
		            }
		        },
		        deactivate: {
		            returnValue: {
		                "true": $L("Call forwarding deactivated for no reply: #{ic.2}."),
		                "false": $L("Call forwarding deactivation failed. #{errorText}")
		            }
		        },
		        register: {
		            returnValue: {
		                "true": $L("Call forwarding registered for #{si.1} for no reply: #{ic.2}."),
		                "false": $L("Call forwarding registration failed. #{errorText}")
		            }
		        },
		        unregister: {
		            returnValue: {
		                "true": $L("Call forwarding unregistered for no reply: #{ic.2}."),
		                "false": $L("Call forwarding unregistration failed. #{errorText}")
		            }
		        },
		        interrogate: {
		            returnValue: {
		                "true": $L("Call forwarding (no reply) status: #{status}"),
						"false": $L("Operation failed: Call forwarding (no reply). #{errorText}")
		            },
		        }
		    },
		    "62": {
		        activate: {
		            returnValue: {
		                "true": $L("Call forwarding activated for unreachable: #{ic.2}."),
		                "false": $L("Call forwarding activation failed. #{errorText}")
		            }
		        },
		        deactivate: {
		            returnValue: {
		                "true": $L("Call forwarding deactivated for unreachable: #{ic.2}."),
		                "false": $L("Call forwarding deactivation failed. #{errorText}")
		            }
		        },
		        register: {
		            returnValue: {
		                "true": $L("Call forwarding registered for #{si.1} for unreachable: #{ic.2}."),
		                "false": $L("Call forwarding registration failed. #{errorText}")
		            }
		        },
		        unregister: {
		            returnValue: {
		                "true": $L("Call forwarding unregistered for unreachable: #{ic.2}."),
		                "false": $L("Call forwarding unregistration failed. #{errorText}")
		            }
		        },
		        interrogate: {
		            returnValue: {
		                "true": $L("Call forwarding (unreachable) status: #{status}"),
						"false": $L("Operation failed: Call forwarding (unreachable) query. #{errorText}")
		            },
		        }
		    },
		    "67": {
		        activate: {
		            returnValue: {
		                "true": $L("Call forwarding activated for mobile busy: #{ic.2}."),
		                "false": $L("Call forwarding activation failed. #{errorText}")
		            }
		        },
		        deactivate: {
		            returnValue: {
		                "true": $L("Call forwarding deactivated for mobile busy: #{ic.2}."),
		                "false": $L("Call forwarding deactivation failed. #{errorText}")
		            }
		        },
		        register: {
		            returnValue: {
		                "true": $L("Call forwarding registered for #{si.1} for mobilebusy: #{ic.2}."),
		                "false": $L("Call forwarding registration failed. #{errorText}")
		            }
		        },
		        unregister: {
		            returnValue: {
		                "true": $L("Call forwarding unregistered for mobile busy: #{ic.2}."),
		                "false": $L("Call forwarding unregistration failed. #{errorText}")
		            }
		        },
		        interrogate: {
		            returnValue: {
						"true": $L("Call forwarding (mobile busy) status: #{status}"),
		                "false": $L("Operation failed: Call forwarding (mobile busy) query. #{errorText}")
		            },
		        }
		    },
		    "43": {
		        activate: {
		            returnValue: {
		                "true": $L("Call waiting is enabled for #{ic.1}."),
		                "false": $L("Call waiting activation failed. #{errorText}")
		            }
		        },
		        deactivate: {
		            returnValue: {
		                "true": $L("Call waiting is disabled for #{ic.1}."),
		                "false": $L("Call waiting deactivation failed. #{errorText}")
		            }
		        },
		        register: {
		            returnValue: {
		                "true": $L("Call waiting is enabled for #{ic.1}."),
		                "false": $L("Call waiting registration failed. #{errorText}")
		            }
		        },
		        unregister: {
		            returnValue: {
		                "true": $L("Call waiting is disabled for #{ic.1}."),
		                "false": $L("Call waiting unregistration failed. #{errorText}")
		            }
		        },
		        interrogate: {
		            returnValue: {
		                "false": $L("Call waiting query failed. #{errorText}")
		            },
		            enabled: {
		                "true": $L("Call waiting for #{ic.1} is active."),
		                "false": $L("Call waiting is not active.")
		            }
		        }
		    },
		    "03": {
		        activate: {
		            returnValue: {
		                "true": $L("Call barring password change was successful."),
		                "false": $L("Call barring password change failed. #{errorText}")
		            }
		        },
		        register: {
		            returnValue: {
		                "true": $L("Call barring password change was successful."),
		                "false": $L("Call barring password change failed. #{errorText}")
		            }
		        }
		    },
		    "33": {
		        activate: {
		            returnValue: {
		                "true": $L("Call barring (bar all outgoing) enabled for #{ic.2}."),
		                "false": $L("Call barring activation failed for #{ic.2}. #{errorText}")
		            }
		        },
		        deactivate: {
		            returnValue: {
		                "true": $L("Call barring (bar all outgoing) disabled for #{ic.2}."),
		                "false": $L("Call barring deactivation failed for #{ic.2}. #{errorText}")
		            }
		        },
		        register: {
		            returnValue: {
		                "true": $L("Call barring (bar all outgoing) enabled for #{ic.2}."),
		                "false": $L("Call barring registration failed for #{ic.2}. #{errorText}")
		            }
		        },
		        unregister: {
		            returnValue: {
		                "true": $L("Call barring (bar all outgoing) disabled for #{ic.2}."),
		                "false": $L("Call barring unregistration failed for #{ic.2}. #{errorText}")
		            }
		        },
		        interrogate: {
		            returnValue: {
		                "false": $L("Operation failed: Call barring (bar all outgoing) query for #{ic.2}. #{errorText}")
		            },
		            enabled: {
		                "true": $L("Call barring (bar all outgoing) is enabled for #{ic.2}."),
		                "false": $L("Call barring (bar all outgoing) is disabled for #{ic.2}.")
		            }
		        }
		    },
		    "331": {
		        activate: {
		            returnValue: {
		                "true": $L("Call barring (bar outgoing international) enabled for #{ic.2}."),
		                "false": $L("Call barring activation failed for #{ic.2}. #{errorText}")
		            }
		        },
		        deactivate: {
		            returnValue: {
		                "true": $L("Call barring (bar outgoing international) disabled for #{ic.2}."),
		                "false": $L("Call barring deactivation failed for #{ic.2}. #{errorText}")
		            }
		        },
		        register: {
		            returnValue: {
		                "true": $L("Call barring (bar outgoing international) enabled for #{ic.2}."),
		                "false": $L("Call barring registration failed for #{ic.2}. #{errorText}")
		            }
		        },
		        unregister: {
		            returnValue: {
		                "true": $L("Call barring (bar outgoing international) disabled for #{ic.2}."),
		                "false": $L("Call barring unregistration failed for #{ic.2}. #{errorText}")
		            }
		        },
		        interrogate: {
		            returnValue: {
		                "false": $L("Operation failed: Call barring (bar outgoing international) query for #{ic.2}. #{errorText}")
		            },
		            enabled: {
		                "true": $L("Call barring (bar outgoing international) is enabled for #{ic.2}."),
		                "false": $L("Call barring (bar outgoing international) is disabled for #{ic.2}.")
		            }
		        }
		    },
		    "332": {
		        activate: {
		            returnValue: {
		                "true": $L("Call barring (bar outgoing international except to home country) enabled for #{ic.2}."),
		                "false": $L("Call barring activation failed for #{ic.2}. #{errorText}")
		            }
		        },
		        deactivate: {
		            returnValue: {
		                "true": $L("Call barring (bar outgoing international except to home country) disabled for #{ic.2}."),
		                "false": $L("Call barring deactivation failed for #{ic.2}. #{errorText}")
		            }
		        },
		        register: {
		            returnValue: {
		                "true": $L("Call barring (bar outgoing international except to home country) enabled for #{ic.2}."),
		                "false": $L("Call barring registration failed for #{ic.2}. #{errorText}")
		            }
		        },
		        unregister: {
		            returnValue: {
		                "true": $L("Call barring (bar outgoing international except to home country) disabled for #{ic.2}."),
		                "false": $L("Call barring unregistration failed for #{ic.2}. #{errorText}")
		            }
		        },
		        interrogate: {
		            returnValue: {
		                "false": $L("Operation failed: Call barring (bar outgoing international except to home country) query for #{ic.2}. #{errorText}")
		            },
		            enabled: {
		                "true": $L("Call barring (bar outgoing international except to home) is enabled for #{ic.2}."),
		                "false": $L("Call barring (bar outgoing international except to home) is disabled for #{ic.2}.")
		            }
		        }
		    },
		    "35": {
		        activate: {
		            returnValue: {
		                "true": $L("Call barring (bar all incoming) enabled for #{ic.2}."),
		                "false": $L("Call barring activation failed for #{ic.2}. #{errorText}")
		            }
		        },
		        deactivate: {
		            returnValue: {
		                "true": $L("Call barring (bar all incoming) disabled for #{ic.2}."),
		                "false": $L("Call barring deactivation failed for #{ic.2}. #{errorText}")
		            }
		        },
		        register: {
		            returnValue: {
		                "true": $L("Call barring (bar all incoming) enabled for #{ic.2}."),
		                "false": $L("Call barring registration failed for #{ic.2}. #{errorText}")
		            }
		        },
		        unregister: {
		            returnValue: {
		                "true": $L("Call barring (bar all incoming) disabled for #{ic.2}."),
		                "false": $L("Call barring unregistration failed for #{ic.2}. #{errorText}")
		            }
		        },
		        interrogate: {
		            returnValue: {
		                "false": $L("Operation failed: Call barring (bar all incoming) query for #{ic.2}. #{errorText}")
		            },
		            enabled: {
		                "true": $L("Call barring (bar all incoming) is enabled for #{ic.2}."),
		                "false": $L("Call barring (bar all incoming) is disabled for #{ic.2}.")
		            }
		        }
		    },
		    "351": {
		        activate: {
		            returnValue: {
		                "true": $L("Call barring (bar incoming roaming) enabled for #{ic.2}."),
		                "false": $L("Call barring activation failed for #{ic.2}. #{errorText}")
		            }
		        },
		        deactivate: {
		            returnValue: {
		                "true": $L("Call barring (bar incoming roaming) disabled for #{ic.2}."),
		                "false": $L("Call barring deactivation failed for #{ic.2}. #{errorText}")
		            }
		        },
		        register: {
		            returnValue: {
		                "true": $L("Call barring (bar incoming roaming) enabled for #{ic.2}."),
		                "false": $L("Call barring registration failed for #{ic.2}. #{errorText}")
		            }
		        },
		        unregister: {
		            returnValue: {
		                "true": $L("Call barring (bar incoming roaming) disabled for #{ic.2}."),
		                "false": $L("Call barring unregistration failed for #{ic.2}. #{errorText}")
		            }
		        },
		        interrogate: {
		            returnValue: {
		                "false": $L("Operation failed: Call barring (bar incoming roaming) query for #{ic.2}. #{errorText}")
		            },
		            enabled: {
		                "true": $L("Call barring (bar incoming roaming) is enabled for #{ic.2}."),
		                "false": $L("Call barring (bar incoming roaming) is disabled for #{ic.2}.")
		            }
		        }
		    },
		    "330": {
		        activate: {
		            returnValue: {
		                "true": $L("Call barring (bar all barring) enabled for #{ic.2}."),
		                "false": $L("Call barring activation failed for #{ic.2}. #{errorText}")
		            }
		        },
		        deactivate: {
		            returnValue: {
		                "true": $L("Call barring (bar all barring) disabled for #{ic.2}."),
		                "false": $L("Call barring deactivation failed for #{ic.2}. #{errorText}")
		            }
		        },
		        register: {
		            returnValue: {
		                "true": $L("Call barring (bar all barring) enabled for #{ic.2}."),
		                "false": $L("Call barring registration failed for #{ic.2}. #{errorText}")
		            }
		        },
		        unregister: {
		            returnValue: {
		                "true": $L("Call barring (bar all barring) disabled for #{ic.2}."),
		                "false": $L("Call barring unregistration failed for #{ic.2}. #{errorText}")
		            }
		        },
		        interrogate: {
		            returnValue: {
		                "false": $L("Operation failed: Call barring (bar all barring) query for #{ic.2}. #{errorText}")
		            },
		            enabled: {
		                "true": $L("Call barring (bar all barring) is enabled for #{ic.2}."),
		                "false": $L("Call barring (bar all barring) is disabled for #{ic.2}.")
		            }
		        }
		    },
		    "333": {
		        activate: {
		            returnValue: {
		                "true": $L("Call barring (bar outgoing) enabled for #{ic.2}."),
		                "false": $L("Call barring activation failed for #{ic.2}. #{errorText}")
		            }
		        },
		        deactivate: {
		            returnValue: {
		                "true": $L("Call barring (bar outgoing) disabled for #{ic.2}."),
		                "false": $L("Call barring deactivation failed for #{ic.2}. #{errorText}")
		            }
		        },
		        register: {
		            returnValue: {
		                "true": $L("Call barring (bar outgoing) enabled for #{ic.2}."),
		                "false": $L("Call barring registration failed for #{ic.2}. #{errorText}")
		            }
		        },
		        unregister: {
		            returnValue: {
		                "true": $L("Call barring (bar outgoing) disabled for #{ic.2}."),
		                "false": $L("Call barring unregistration failed for #{ic.2}. #{errorText}")
		            }
		        },
		        interrogate: {
		            returnValue: {
		                "false": $L("Operation failed: Call barring (bar outgoing) query for #{ic.2}. #{errorText}")
		            },
		            enabled: {
		                "true": $L("Call barring (bar outgoing) is enabled for #{ic.2}."),
		                "false": $L("Call barring (bar outgoing) is disabled for #{ic.2}.")
		            }
		        }
		    },
		    "353": {
		        activate: {
		            returnValue: {
		                "true": $L("Call barring (bar incoming) enabled for #{ic.2}."),
		                "false": $L("Call barring activation failed for #{ic.2}. #{errorText}")
		            }
		        },
		        deactivate: {
		            returnValue: {
		                "true": $L("Call barring (bar incoming) disabled for #{ic.2}."),
		                "false": $L("Call barring deactivation failed for #{ic.2}. #{errorText}")
		            }
		        },
		        register: {
		            returnValue: {
		                "true": $L("Call barring (bar incoming) enabled for #{ic.2}."),
		                "false": $L("Call barring registration failed for #{ic.2}. #{errorText}")
		            }
		        },
		        unregister: {
		            returnValue: {
		                "true": $L("Call barring (bar incoming) disabled for #{ic.2}."),
		                "false": $L("Call barring unregistration failed for #{ic.2}. #{errorText}")
		            }
		        },
		        interrogate: {
		            returnValue: {
		                "false": $L("Operation failed: Call barring query (bar incoming) for #{ic.2}. #{errorText}")
		            },
		            enabled: {
		                "true": $L("Call barring (bar incoming) is enabled for #{ic.2}."),
		                "false": $L("Call barring (bar incoming) is disabled for #{ic.2}.")
		            }
		        }
		    },
		    "30": {
		        activate: {
		            returnValue: {
		                "true": $L("Incoming caller ID presentation enabled."),
		                "false": $L("Incoming caller ID presentation not provisioned.")
		            }
		        },
		        deactivate: {
		            returnValue: {
		                "true": $L("Incoming caller ID presentation disabled."),
		                "false": $L("Incoming caller ID presentation not provisioned.")
		            }
		        },
		        interrogate: {
		            returnValue: {
		                "false": $L("Incoming caller ID presentation query failed. #{errorText}")
		            },
		            provisioned: {
		                "false": $L("Incoming caller ID presentation not provisioned.")
		            },
		            restricted: {
		                "true": $L("Incoming caller ID presentation disabled."),
		                "false": $L("Incoming caller ID presentation enabled.")
		            }
		        }
		    },
		    "31": {
		        activate: {
		            returnValue: {
		                "true": $L("Outgoing caller ID restricted."),
		                "false": $L("Outgoing caller ID restricted failed.")
		            }
		        },
		        deactivate: {
		            returnValue: {
		                "true": $L("Outgoing caller ID enabled."),
		                "false": $L("Outgoing caller ID enable failed.")
		            }
		        },
		        register: {
		            returnValue: {
		                "true": $L("Outgoing caller ID restricted."),
		                "false": $L("Outgoing caller ID restricted failed.")
		            }
		        },
		        unregister: {
		            returnValue: {
		                "true": $L("Outgoing caller ID enabled."),
		                "false": $L("Outgoing caller ID enable failed.")
		            }
		        },
		        interrogate: {
		            returnValue: {
		                "false": $L("Outgoing Caller ID restriction query failed.")
		            },
		            provisioned: {
		                "false": $L("Outgoing Caller ID restriction not provisioned.")
		            },
		            restricted: {
		                "true": $L("Outgoing caller ID restricted."),
		                "false": $L("Outgoing caller ID enabled.")
		            }
		        }
		    },
		    "300": {
		        interrogate: {
		            returnValue: {
		                "false": $L("CNAP query failed.")
		            },
		            provisioned: {
		                "false": $L("CNAP not provisioned.")
		            },
		            enabled: {
		                "true": $L("CNAP enabled."),
		                "false": $L("CNAP disabled.")
		            }
		        }
		    },
		    "06": {
		        interrogate: {
		            value: {
		                ".*": $L("IMEI: #{value}")
		            },
		            returnValue: {
		                "false": $L("IMEI query failed.")
		            }
		        }
		    },
		},

		// Basic service group (info class)
		MmiInfoClass: {
		    "11": "voice",
		    "12": "data",
		    "13": "fax",
		    "16": "sms",
		    "21": "allasyncservices",
		    "22": "allsyncservices",
		    "24": "datacircuitsync",
		    "25": "datacircuitasync",
		    "26": "packetaccess",
		    "27": "padaccess",
		    "89": "auxiliarytelephony"
		},

		MmiInfoClassDefault: "defaultbearer",

		// Call barring type
		MmiCallBarringType: {
		    "33": "baralloutgoing",
		    "331": "baroutgoingint",
		    "332": "baroutgoingintextohome",
		    "35": "barallincoming",
		    "351": "barincomingroaming",
		    "330": "barallbarring",
		    "333": "baroutgoing",
		    "353": "barincoming"
		},

		MmiCallBarringTypeDefault: "barallservices"
	}
});
