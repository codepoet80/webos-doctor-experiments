enyo.kind({
    name: "findApps.CommonHandler",
    kind: enyo.Component,
    handleCommand: function(event, app) {
        var url = this._generateAppURL(app);
        if (url) {
            switch (event) {
                case "email":
                    var params = {
                        summary: $L("Check out this HP webOS app"),
                        text: this._generateEmailMessageText(app, url)
                    }
                    findApps.ApplicationManager.getInstance().launchApplication("com.palm.app.email", params, "emailLaunchSuccess", "emailLaunchFailure", this);
                    break;
                case "text":
                    var params = {
                        compose: {
                            messageText: this._generateSMSMessageText(app, url)
                        }
                    }
                    // APPC-6855: Current messaging application(enyo version) installed on topaz named with "com.palm.app.messaging", 
                    // after talk with QA, to unblock the test process of QA, change it to the correct name although it's name rule 
                    // is different with other enyo applications.
                    findApps.ApplicationManager.getInstance().launchApplication("com.palm.app.messaging", params, "smsLaunchSuccess", "smsLaunchFailure", this);
                    break;
            }
        }
    },
    smsLaunchSuccess: function() {
    //console.log("smsLaunchSuccess");
    },
    smsLaunchFailure: function() {
    //console.log("smsLaunchFailure");
    },
    emailLaunchSuccess: function() {
    //console.log("emailLaunchSuccess");
    },
    emailLaunchFailure: function() {
    //console.log("emailLaunchFailure");
    },
    _generateAppURL: function(appDetail) {
        if (appDetail && appDetail.publicApplicationId && appDetail.id) {
            return "http://developer.palm.com/appredirect/?packageid=" + appDetail.publicApplicationId + "&applicationid=" + appDetail.id;
        } else {
            return null;
        }
    },
    _generateEmailMessageText: function(appDetail, url) {
        var shareData = {
            appURL: url
        };
        if (appDetail && appDetail.title) {
            shareData.title = appDetail.title;
        } else {
            shareData.title = url;
        }
        var likeTemp = new enyo.g11n.Template($L("Here's an app I think you'll like:  <a href='#{appURL}'> #{title}</a>"));
        var likeTempMsg = likeTemp.evaluate({
            appURL: url,
            title: appDetail.title
        });
        return (likeTempMsg);
    },
    _generateSMSMessageText: function(appDetail, url) {
        var appTitle = url;
        if (appDetail && appDetail.title) {
            appTitle = appDetail.title;
        }
        //return $L("Check out #{title}: #{url}").interpolate({title: appTitle, url: url});	
        var chkTemp = new enyo.g11n.Template($L("Check out #{title}: #{url}"));
        var chkTempMsg = chkTemp.evaluate({
            title: appTitle,
            url: url
        });
        return (chkTempMsg);
    },
    _embargolistSuccess: function(inSender, inResponse, inRequest, inProps) {
        var edit = inProps.edit;
        var callback = inProps.callback;
        if (inResponse && inResponse.OutGetEmbargoedEmailExtensions) {
            findApps.AccountServices.embargoedList = inResponse.OutGetEmbargoedEmailExtensions.embargoedEmailExtensions;
            findApps.UserProfile.isEmbargoed = findApps.AccountServices.embargoedList.indexOf(ext) != -1;
            this._handleEmbargoAcc(edit, callback);
        }
    },
    _embargolistFailure: function(inSender, inResponse, inRequest, inProps, errors) {
        this.OnSubmit = function() {
            this.$.error.cancel();
            this.$.error.destroy();
        };
        this.createComponent({
            name: "error",
            kind: "findApps.Error",
            onSubmit: "OnSubmit",
            onCancel: "OnSubmit",
            owner: this
        });
        errors.push("LOC02055");
        this.$.error.displayError(errors);
    }, 
    doEmbargoCheck: function(edit, callback) {
        if (findApps.UserProfile.isEmbargoed !== undefined) {
            this._handleEmbargoAcc(edit, callback);
        } else {
            var ext = findApps.UserProfile.email.substring(findApps.UserProfile.email.lastIndexOf(".") + 1);
            if (findApps.AccountServices.embargoedList) {
                findApps.UserProfile.isEmbargoed = findApps.AccountServices.embargoedList.indexOf(ext) != -1;
                this._handleEmbargoAcc(edit, callback);
            } else {
                findApps.BaseServer.getPMTServer().getEmbargoedEmailExtensions("CommonEmbargoedEmailExtensiosn", {
                    onSuccess: "_embargolistSuccess",
                    onFailure: "_embargolistFailure",
                    scope: this,
                    edit: edit,
                    callback: callback
                });
            }
        }
    },
    _handleEmbargoAcc: function(edit, callback) {
        var self = this;
        if (!edit && findApps.UserProfile.isEmbargoed) {
            self.OnSubmit = function() {
                self.$.error.cancel();
                self.$.error.destroy();
                findApps.ApplicationManager.getInstance().openApplication('com.palm.app.help', {
                    target: online ? 'http://help.palm.com/app_catalog/appcatalog_download_error.html' : 'no-network'
                });
            }
            self.OnCancel = function() {
                self.$.error.cancel();
                self.$.error.destroy();
            };
            self.createComponent({
                name: "error",
                kind: "findApps.Error",
                owner: self
            });
            self.$.error.displayError(["LOC02065"]);
        } else {
            callback(edit);
        }
    },
    capWords: function(word) {
        var words = word.split(" ");
        for (var i = 0; i < words.length; i++) {
            words[i] = words[i].capitalize();
        }
        return words.join(" ");
    },
    filterSpace: function(value) {
        if (value === Mojo.Char.spaceBar) {
            return false;
        }
        return true;
    },
    //check whether JSON object is empty
    isEmpty: function(jsonObj) {
        for (var prop in jsonObj) {
            return false;
        }
        return true;
    },
    // Date formatter and timezone localization, for example: "20101230122331" --> "Dec 30, 2010"
    formatDateStr: function(dateRawStr) {
        if (!dateRawStr || dateRawStr.length < 8) {
            return "";
        }
        var year = dateRawStr.substr(0, 4);
        var month = dateRawStr.substr(4, 2);
        var day = dateRawStr.substr(6, 2);
        var hour = dateRawStr.substr(8, 2);
        var min = dateRawStr.substr(10, 2);
        var sec = dateRawStr.substr(12, 2)
        var dateObj = new Date(year, month - 1, day, hour, min, sec);
        var dateObjTime = dateObj.getTime();
        // change to local timezone
        var clDate = new Date();
        localOffset = clDate.getTimezoneOffset() * 60000;
        var ld = new Date(dateObjTime - localOffset);
        return enyo.date.format(ld, "MMM d, yyyy");
    }
});
enyo.kind({
    name: "findApps.SmartInput",
    kind: enyo.Input,
    events: {
        onSubmit: "",
        onkeyup: "keyupHandler"
    },
    keyupHandler: function(inSender, inEvent) {
        if (inEvent.keyCode == "13") {
            this.handleEnter();
        }
    },
    handleEnter: function() {
        this.doSubmit();
        this.forceBlur();
    }
});
