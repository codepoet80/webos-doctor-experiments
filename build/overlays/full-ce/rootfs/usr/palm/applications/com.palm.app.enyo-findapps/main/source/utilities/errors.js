enyo.kind({
    name: "findApps.TapMessage",
    kind: "Control",
    events: {
        onclick: "clickHandler"
    },
    published: {
        hiddenMsg: ""
    },
    hiddenMsgChanged: function() {
        function wrapHiddenMsg(hiddenMsg, wrapCount) {
            var wrappedResult = "";
            var hiddenMsgArray = hiddenMsg.split(",");
            if (hiddenMsgArray.length > wrapCount) {
                for (var idx = 0; idx < hiddenMsgArray.length; idx++) {
                    if (wrappedResult !== "" && idx !== 0) {
                        wrappedResult += ",";
                    }
                    if (idx % wrapCount === 0 && idx !== 0) {
                        wrappedResult += "<br/>";
                    }
                    wrappedResult += hiddenMsgArray[idx];
                }
            } else {
                wrappedResult = hiddenMsg;
            }
            return wrappedResult;
        }
        var wrapCount = 3;
        this.hiddenMsg = "<small>" + wrapHiddenMsg(this.hiddenMsg, wrapCount) + "</small>";
    },
    clickHandler: function(inSender) {
        if (this.hiddenMsg) {
            var msg = this.getContent();
            this.setContent(this.hiddenMsg);
            this.hiddenMsg = msg;
        }
    }
});
enyo.kind({
    name: "findApps.Error",
    kind: "Control",
    events: {
        onSubmit: "",
        onCancel: ""
    },
    submitHandler: null,
    cancelHandler: null,
    published: {
        session: null
    },
    components: [{
        kind: "ModalDialog",
        "animateShowing": false,
        name: "popup",
        scrim: true,
        modal: true,
        components: [{
            name: "popup_error_title",
            className: "",
            pack: 'center',
            style: "font-size:20px;text-align:center;",
            "allowHtml": true
        }, {
            name: "popup_error_message",
            kind: "findApps.TapMessage",
            className: "",
            style: "font-size:16px;padding-top: 6px;",
            "allowHtml": true
        }, {
            kind: "HFlexBox",
            name: "popup_choices",
            style: "padding-top: 6px;"
        }]
    }],
    submitPopup: function(inSender) {
        this.$.popup.close();
        this.doSubmit(inSender.value);
    },
    cancelPopup: function(inSender) {
        this.$.popup.close();
        this.doCancel(inSender.value);
    },
    cancel: function() {
        this.$.popup.close();
    },
    showPalmProfileError: function() {
        this.displayError("invalidtoken");
    },
    //TODO remove the extra arguments - can't yet as some modules are still using it - after merging to trunk <- CreditCardInfo#displayError
    displayError: function(errors, args) {
        var that = this;
        var global = that.$;
        //FIXME refactor the popup into its own kind
        var showPopup = function(errorObject, errorCodesStackStr) {
            function destroyChoices() {
                var components = that.getComponents();
                for (var i in components) {
                    if (components[i].name.search(/button/) >= 0) {
                        components[i].destroy();
                    }
                }
            }
            // delete all the current options
            destroyChoices();
            if (global.popup.lazy === true) {
                global.popup.validateComponents();
            }
            if (!enyo.application.connectionManager.isOnline()) {
                var offlineError = findApps.Utilities._dialogErrors["noNetwork"];
                global.popup_error_title.setContent(offlineError.title);
                global.popup_error_message.setContent(offlineError.message);
            } else {
                global.popup_error_title.setContent(errorObject.title);
                global.popup_error_message.setContent(errorObject.formattedMessage ? errorObject.formattedMessage : errorObject.message);
            }
            global.popup_error_message.setHiddenMsg(errorCodesStackStr);
            if (!errorObject.choices || errorObject.choices.length === 0) {
                // Add a default "OK" button
                global.popup_choices.createComponent({
                    kind: "Button",
                    flex: 1,
                    caption: $L("OK"),
                    onclick: "cancelPopup",
                    owner: that
                });
            } else {
                for (var i in errorObject.choices) {
                    var clickAction = errorObject.choices[i].type === "dismiss" ? "cancelPopup" : "submitPopup";
                    global.popup_choices.createComponent({
                        kind: "Button",
                        flex: 1,
                        value: errorObject.choices[i].value,
                        caption: errorObject.choices[i].label,
                        onclick: clickAction,
                        owner: that
                    });
                }
            }
            global.popup.render();
            global.popup.openAtCenter();
        };
        //FIXME refactor this function into the fatal page itself
        var displayErrorPage = function(errorObject, errorCodesStackStr) {
            var showFatalError = function() {
                if (!errorObject.message) {
                    // Show default error message
                    errorObject.message = $L("The action could not be completed.<br/>Try again later.");
                }
                var errorMessage = errorObject.formattedMessage ? errorObject.formattedMessage : errorObject.message;
                var isOnline = enyo.application.connectionManager.isOnline();
                if (!isOnline) {
                    var offlineError = findApps.Utilities._dialogErrors["noNetwork"];
                    errorMessage = offlineError.message;
                }
                var errorView = findApps.ViewLibrary.getView("FULLSCREENERROR");
                errorView.setParams({
                    "errorMessage": errorMessage,
                    "hiddenErrorCodes": errorCodesStackStr,
                    "online": isOnline
                });
            };
            if (errorCode === "invalidtoken") {
                // If we receive a bad authentication token we must inform the system and popup a dialog (not pop to an error screen)
                // Always felt the error screen was better.
                findApps.AccountServices.getInstance().notifyAuthenticationFailure({
                    onSuccess: "showPalmProfileError", 
                    onFailure: "showPalmProfileError", 
                    scope: this
                });
            } else {
                showFatalError();
            }
        };
        var logStackTrace = function() {
            //log the stack trace
            try {
                var paneView = findApps.ViewLibrary._container.$.pane && findApps.ViewLibrary._container.$.pane.view;
                that.error("In", paneView, "errorcode: ", errorCode, "stack:", errorCodesStackStr);
                throw e; // deliberate throwing of an undefined variable so that the stacktrace can be captured in the catch block
            } catch (e) {
                var myStackTrace = e.stack || e.stacktrace || "";
                if (myStackTrace) {
                    myStackTrace = myStackTrace.replace(/file:\/.*enyo-findapps/g, "").replace(/file:\/.*enyo-build\.js/g, "enyo-build.js").replace(/\n/g, "").replace(/ +/g, " ");
                }
                that.error(findApps.UserSession._callerVersion, "stacktrace", myStackTrace);
            }
        };
        var getErrorMessage = function(errorObject) {
            var result = (errorObject && errorObject.message) || "";
            var idx = -1;
            if (errors.indexOf("RESP0002") > 0) { //Server Exception
                idx = errors.indexOf("RESP0002");
            } else if (errors.indexOf("RESP0008") > 0) { //General server exception thrown
                idx = errors.indexOf("RESP0008");
            } else if (errors.indexOf("RESP0009") > 0) {
                idx = errors.indexOf("RESP0009");
            }
            var serverExceptionIdx = idx - 1;
            if (serverExceptionIdx >= 0) {
                var serverExceptionCode = errors[serverExceptionIdx];
                if (serverExceptionCode) {
                    that.log("Attempting to use serverExceptionExceptionCode", serverExceptionCode);
                    //must be pre-defined localized server error code in errors.js
                    //if there is a server exception and ACC has a localized string <- then use it
                    var serverExceptionObject = findApps.Utilities._dialogErrors[serverExceptionCode];
                    //is this object re-using some other error's definition?
                    if (serverExceptionObject) {
                        if (serverExceptionObject.reuseDefinition) {
                            serverExceptionObject = findApps.Utilities._dialogErrors[serverExceptionObject.reuseDefinition];
                        }
                        var serverExceptionLocalizedMessage = serverExceptionObject.message;
                    }
                }
            }
            if (serverExceptionLocalizedMessage && serverExceptionLocalizedMessage !== "") {
                result = serverExceptionLocalizedMessage;
            }
            return result;
        };
        var errorCode = "";
        if (errors && enyo.isArray(errors) && errors.length > 0) {
            //if errors is an array <- which it should be!
            //The last element in the array is the most interesting one because the error code is typically coming from a user view
            // and should thereby define the behavior of the error handling
            errorCode = errors[errors.length - 1];
        } else if (errors) {
            errors = [errors];
            //if errors is not an array <- old way <- attempting to deprecate
            // Create a new error code and throw this error code at the source if this type of error is caught...
            errors.push("LOC01000");
            if (errors.toString().indexOf("PMT") >= 0) {
                errors.push("PMT_catchAll");
            }
        } else {
            //if errors is not defined <- fall back to a full page error
            errorCode = "failure";
            errors = [];
            errors.push("LOC01001");
            errors.push(errorCode);
        }
        // If the errorCode doesn't exist in the findApps.Utilities._dialogErrors, then we need to fall back to the top most errorCode
        // in the error stack which has a valid definition. If there is no valid errorCode present in the error stack,
        // then show the "Unknown Error" using the appropriate error code
        var errorObject = findApps.Utilities._dialogErrors[errorCode];
        if (!findApps.Utilities._dialogErrors[errorCode] && enyo.isArray(errors) && errors.length > 0) {
            for (var x = errors.length - 1; x > -1; x--) {
                var tempErrorObject = findApps.Utilities._dialogErrors[errors[x]];
                if (tempErrorObject) {
                    x = -1; //exit now!
                    errorObject = tempErrorObject;
                }
            }
            errors.push("LOC01003");
        }
        //The generic error codes thrown by the application will have the following properties
        // 1. The type of display of the error - popup or full page
        // 2. The generic error code will be mapped to the display text.
        // 3. Tapping on the display text will show the generic error code.
        // 4. Server errors will take precedence in this particular error code.
        // 5. Does a last minute check for network connection within the popup / full page error.
        //      If so, change only the text that the network connection will be required.
        //
        // The popup error can be dismissed by one action - "Cancel"
        // The full page error can be dismissed by one action - "Retry"
        if (errorObject && errorObject.reuseDefinition) {
            errorObject = findApps.Utilities._dialogErrors[errorObject.reuseDefinition];
        }
        //Fall back to a default errorObject if the reuseDefinition didn't exist <- most likely a programmer typo
        if (!errorObject) {
            errors.push("LOC01002");
            errorObject = findApps.Utilities._dialogErrors["LOC01002"]; //LOC01002 does not have reuseDefinition logic!
        }
        // Set the error code in args parameter if not present
        args = (typeof(args) === 'object') ? args : {};
        if (!args.errCode || args.errCode === "") {
            args.errCode = errorCode;
        }
        // Set the display text as well as the formatted text
        var msg = getErrorMessage(errorObject);
        errorObject.message = msg;
        errorObject.formattedMessage = enyo.macroize(msg, args);
        // Get the appropriate errorCodesStackStr which will show the error stack
        var errorCodesStackStr = (errors && errors.toString()) || errors;
        logStackTrace();
        // Decide the type of display
        if (errorObject.page || errorObject.incompatible_page) {
            displayErrorPage(errorObject, errorCodesStackStr);
        } else if (errorObject.dialog) {
            showPopup(errorObject, errorCodesStackStr);
        }
    }
});
