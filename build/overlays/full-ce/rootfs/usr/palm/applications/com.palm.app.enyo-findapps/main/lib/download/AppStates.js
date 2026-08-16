
// use findApps.AppState.Initial until we find out the correct state
enyo.kind({
    name: "findApps.AppState.Initial",
    kind: enyo.Control,
    init: function(app, args) {
        app._progressPillModel.state = "initial";
        app._progressPillModel.titleRight = undefined;
        app._progressPillModel.icon = undefined;
        app._progressPillModel.image = undefined;
        app._progressPillModel.value = undefined;
        app._progressPillModel.title = app.getFormattedPrice();
        //hack - why is this required?
        if (app.price == 0 || !app.price) {
            app._progressPillModel.title = $L("FREE");
        }
        app.enableSave = true;
        app.disabledClass = null;
        app.updateClass = null;
        app.activeClass = null;
        app.resumeClass = null;
        app.pauseClass = null;
        app.warningClass = null;
    },
    updateFromServer: function(app) {
        this._update(app);
    },
    updateFromInstalledAppsList: function(app) {
        this._update(app);
    },
    _update: function(app) {
        var state = "findApps.AppState.Download";
        if (app.purchasedVersion) {
            state = 'findApps.AppState.Purchased';
        }
        if (app.installedVersion) {
            state = 'findApps.AppState.Installed';
            if (app.serverVersion && findApps.Utilities.VersionCheck.compare(app.installedVersion, app.serverVersion) == -1) {
                state = "findApps.AppState.UpdateAvailable";
            }
        }
        app.setState(state);
    },
    toString: function() {
        return "findApps.AppState.Initial";
    },
    defaultAction: function(app) {
        app.setState("findApps.AppState.Download");
        app.defaultAction();
    }
    ,
    removeFromMyApps: function() {
        return true;
    }
});
/*
 * Transitional states
 * 
 * object is in a transitional state while we
 * are waiting for a inResponse from appInstallService. While object is in
 * these states user can't perform almost any action (except deleting an app)
 * transitional states: findApps.AppState.Pausing, deleting, findApps.AppState.Resuming, findApps.AppState.Canceling, findApps.AppState.InitiatingDownload
 *  
 */
enyo.kind({
    name: "findApps.AppState.InitiatingDownload",
    kind: enyo.Control,
    init: function(app) {
        app._progressPillModel.state = "initiating_download";
        app._progressPillModel.titleRight = undefined;
        app._progressPillModel.icon = undefined;
        app._progressPillModel.image = undefined;
        app._progressPillModel.title = $L('Downloading...');
        app._progressPillModel.value = 0;
        app.enableSave = false;
        app.disabledClass = "disabled";
        app.updateClass = null;
        app.activeClass = "active";
        app.resumeClass = null;
        app.pauseClass = null;
        app.warningClass = null;
    },
    _reset: function(app) {
        this.owner.$.downloadStateManager._reset(app);
    },
    _remove: function(app) {
        this.owner.$.downloadStateManager._remove(app);
    },
    saveToMyApps: function() {
        return true;
    },
    toString: function() {
        return "findApps.AppState.InitiatingDownload";
    }
});
enyo.kind({
    name: "findApps.AppState.Pausing",
    kind: enyo.Control,
    init: function(app) {
        app._progressPillModel.state = "pausing";
        app._progressPillModel.titleRight = undefined;
        app._progressPillModel.icon = undefined;
        app._progressPillModel.image = undefined;
        app._progressPillModel.title = $L('Pausing...');
        app.enableSave = false;
        app.disabledClass = "disabled";
    },
    // after we send pause request we are in 
    // "Pausing..." state, at that point we ignore additional 
    // progress updates that come before the final "paused" state
    _allowTransition: function(newState) {
        if (newState == "findApps.AppState.Downloading") return false;
        return true;
    },
    _reset: function(app) {
        this.owner.$.downloadStateManager._reset(app);
    },
    _remove: function(app) {
        this.owner.$.downloadStateManager._remove(app);
    },
    saveToMyApps: function() {
        return true;
    },
    toString: function() {
        return "findApps.AppState.Pausing";
    }
});
enyo.kind({
    name: "findApps.AppState.Resuming",
    kind: enyo.Control,
    init: function(app) {
        app._progressPillModel.state = "resuming";
        app._progressPillModel.titleRight = undefined;
        app._progressPillModel.icon = undefined;
        app._progressPillModel.image = undefined;
        app._progressPillModel.title = $L('Resuming...');
        app.enableSave = false;
        app.disabledClass = "disabled";
    },
    _reset: function(app) {
        this.owner.$.downloadStateManager._reset(app);
    },
    _remove: function(app) {
        this.owner.$.downloadStateManager._remove(app);
    },
    saveToMyApps: function() {
        return true;
    },
    toString: function() {
        return "findApps.AppState.Resuming";
    }
});
enyo.kind({
    name: "findApps.AppState.Removing",
    kind: enyo.Control,
    init: function(app) {
        app._progressPillModel.state = "removing";
        app._progressPillModel.titleRight = undefined;
        app._progressPillModel.icon = undefined;
        app._progressPillModel.image = undefined;
        app._progressPillModel.title = $L('Removing...');
        app._progressPillModel.value = 1;
        app.enableSave = false;
        app.disabledClass = "disabled";
        app.updateClass = null;
        app.activeClass = null;
        app.resumeClass = null;
        app.pauseClass = null;
        app.warningClass = null;
    },
    // after we send remove request we are in 
    // "Removing..." state, at that point we ignore additional 
    // progress updates from appInstallService 
    // that come before the final "removed" state
    _allowTransition: function(newState) {
        if (newState == "findApps.AppState.Downloading") return false;
        return true;
    },
    _reset: function(app) {
        this.owner.$.downloadStateManager._reset(app);
    },
    _remove: function(app) {
        this.owner.$.downloadStateManager._remove(app);
    },
    saveToMyApps: function() {
        return true;
    },
    toString: function() {
        return "findApps.AppState.Removing";
    }
});
enyo.kind({
    name: "findApps.AppState.Canceling",
    kind: enyo.Control,
    init: function(app) {
        app._progressPillModel.state = "canceling";
        app._progressPillModel.titleRight = undefined;
        app._progressPillModel.icon = undefined;
        app._progressPillModel.image = undefined;
        app._progressPillModel.title = $L('Canceling...');
        app.enableSave = false;
        app.disabledClass = "disabled";
    },
    // after we send cancel request we are in 
    // "Canceling..." state, at that point we ignore additional 
    // progress updates that come before the final "canceled" state
    _allowTransition: function(newState) {
        if (newState == "findApps.AppState.Downloading") return false;
        return true;
    },
    _reset: function(app) {
        this.owner.$.downloadStateManager._reset(app);
    },
    _remove: function(app) {
        this.owner.$.downloadStateManager._remove(app);
    },
    saveToMyApps: function() {
        return true;
    },
    toString: function() {
        return "findApps.AppState.Canceling";
    }
});
// default / starting state for all apps
// once we obtain app details from the server
enyo.kind({
    name: "findApps.AppState.Download",
    kind: enyo.Control,
    init: function(app, args) {
        app._progressPillModel.state = "download";
        app._progressPillModel.titleRight = undefined;
        app._progressPillModel.icon = undefined;
        app._progressPillModel.image = undefined;
        app._progressPillModel.value = undefined;
        app._progressPillModel.title = app.getFormattedPrice();
        app.enableSave = true;
        // check code status from cookie store
        var cookieStoredPC = enyo.getCookie("findapps.promocode");
        // set promo tag on download button
        if (findApps.UserProfile.promoLink && app.price != 0 && cookieStoredPC && cookieStoredPC.length > 0) {
            app._progressPillModel.icon = undefined;
            app._progressPillModel.image = undefined;
        }
        //hack - why is this required?
        if (app.price == 0 || !app.price) {
            app._progressPillModel.title = $L("FREE");
        }
        app.progress = 0;
        app.disabledClass = null;
        app.updateClass = null;
        app.activeClass = null;
        app.resumeClass = null;
        app.pauseClass = null;
        app.warningClass = null;
    },
    updateFromInstalledAppsList: function(app) {
        if (app.installedVersion) {
            if (app.serverVersion && findApps.Utilities.VersionCheck.compare(app.installedVersion, app.serverVersion) == -1) {
                app.setState("findApps.AppState.UpdateAvailable");
            } else {
                app.setState("findApps.AppState.Installed");
            }
        }
    },
    updateFromServer: function(app) {
        var state = "findApps.AppState.Download";
        if (app.purchasedVersion) {
            state = 'findApps.AppState.Purchased';
        }
        if (app.installedVersion) {
            state = 'findApps.AppState.Installed';
            if (findApps.Utilities.VersionCheck.compare(app.installedVersion, app.serverVersion) == -1) {
                state = "findApps.AppState.UpdateAvailable";
            }
        }
        app.setState(state);
    },
    removeFromMyApps: function() {
        return true;
    },
    defaultAction: function(app) {
        app.install();
    },
    
    processAppDetails: function(app) {
        var self = this;
        this.owner.$.downloadStateManager._checkNotEmbargoed(app, function(status) {
            if (status) {
                self.owner.$.downloadStateManager._handleLocationServices(app, function(status) {
                    if (status) {
                        self.owner.$.downloadStateManager.validateInstallSpace(app, "validate_space_default_single", function(status) {
                            if (status) {
                                self.owner.$.downloadStateManager.validateDownloadConnection(function(status) {
                                    if (status) {
                                        if (app.price > 0) {
                                            self.owner.$.downloadStateManager._handleVerifyPayment(app, !findApps.UserPreferences.isLoginTimedOut(), null, function(status) {
                                                if (status) {
                                                    self.owner.$.downloadStateManager._install(app);
                                                } else {
                                                    // reset back in case of error
                                                    app.setState("findApps.AppState.Download");
                                                }
                                            });
                                        } else {
                                            self.owner.$.downloadStateManager._install(app);
                                        }
                                    } else {
                                        app.setState("findApps.AppState.Download");
                                    }
                                });
                            } else {
                                app.setState("findApps.AppState.Download");
                            }
                        });
                    } else {
                        app.setState("findApps.AppState.Download");
                    }
                });
            } else {
                app.setState("findApps.AppState.Download");
            }
        });
    }
    ,
    
    install: function(app) {
        var self = this;
        
        // Do not start the download process
        // if price is n/a or N/A
        // This case will ideally not happen - but this case could be seen in the magazine
        // If magazine refers to some application, but that application has been revoked now
        if (app.price && (app.price == "n/a" || app.price == "N/A")) {
            return;
        }
        // Show purchasing state only if it is a paid app and has not been purchased already
        if(app.price && app.price > 0 && !findApps.BaseServer.isPurchased(app.publicApplicationId))
            app.setState("findApps.AppState.Purchasing");
        else
            app.setState("findApps.AppState.InitiatingDownload");
        // Check if app details are available, if not, make the server call to fetch app details
        if(!app.packageSize || !app.installSize || (app.islocationbased === undefined)|| !app.title) {
            this.owner.$.downloadStateManager._fetchAppDetails(app, function(status) {
                if (status) {
                    var state = "";
                    if (app.purchasedVersion) {
                        state = 'findApps.AppState.Purchased';
                    }
                    if (app.installedVersion) {
                        state = 'findApps.AppState.Installed';
                        if (app.serverVersion && findApps.Utilities.VersionCheck.compare(app.installedVersion, app.serverVersion) == -1) {
                            state = "findApps.AppState.UpdateAvailable";
                        }
                    }
                    if(state!== "") {
                        app.setState(state);
                        app.defaultAction();
                    }
                    else
                        self.processAppDetails(app);
                } else {
                    // reset back in case of error
                    app.setState("findApps.AppState.Initial");
                }
            });
        }
        // Details are already available
        else {
            this.processAppDetails(app);
        }
        
    },
    toString: function() {
        return "findApps.AppState.Download";
    }
});
// Entered when download manager send the first 
// valid progress amount and active until download is active
// that is, we receive progress updates
enyo.kind({
    name: "findApps.AppState.Downloading",
    kind: enyo.Control,
    init: function(app, args) {
        app._progressPillModel.state = "downloading";
        app._progressPillModel.titleRight = undefined;
        app._progressPillModel.icon = 'images/download-indicator-pause.png';
        app._progressPillModel.image = 'images/download-indicator-pause.png';
        app._progressPillModel.title = $L('Downloading...');
        app.enableSave = false;
        app._progressPillModel.value = app.progress / 100;
        app.disabledClass = null;
        app.updateClass = null;
        app.activeClass = "active";
        app.resumeClass = null;
        app.pauseClass = "show";
        app.warningClass = null;
    },
    updateFromServer: function(app) {
        // force a refresh
        app.setState("findApps.AppState.Downloading");
    },
    updateFromInstalledAppsList: function(app) {
        // force a refresh
        app.setState("findApps.AppState.Downloading");
    },
    defaultAction: function(app) {
        this.pauseDownload(app);
    },
    myAppsDefaultAction: function(app) {
        this.pauseDownload(app);
    },
    pauseDownload: function(app) {
        this.owner.$.downloadStateManager._pause(app);
    },
    cancelDownload: function(app) {
        this.owner.$.downloadStateManager._cancel(app);
    },
    uninstall: function(app) {
        this.owner.$.downloadStateManager._uninstall(app);
    },
    _reset: function(app) {
        this.owner.$.downloadStateManager._reset(app);
    },
    _remove: function(app) {
        this.owner.$.downloadStateManager._remove(app);
    },
    saveToMyApps: function() {
        return true;
    },
    toString: function() {
        return "findApps.AppState.Downloading";
    }
});
enyo.kind({
    name: "findApps.AppState.Paused",
    kind: enyo.Control,
    init: function(app, args) {
        app._progressPillModel.state = "paused";
        app._progressPillModel.titleRight = undefined;
        app._progressPillModel.icon = 'images/download-indicator-resume.png';
        app._progressPillModel.value = app.progress / 100;
        app._progressPillModel.image = undefined;
        app._progressPillModel.title = $L('Resume');
        app.enableSave = false;
        app.disabledClass = null;
        app.updateClass = null;
        app.activeClass = "active";
        app.resumeClass = "show";
        app.pauseClass = null;
        app.warningClass = null;
    },
    updateFromServer: function(app) {
        // force a refresh
        app.setState("findApps.AppState.Paused");
    },
    updateFromInstalledAppsList: function(app) {
        // force a refresh
        app.setState("findApps.AppState.Paused");
    },
    myAppsDefaultAction: function(app) {
        app.resumeDownload();
    },
    defaultAction: function(app) {
        app.resumeDownload();
    },
    cleanupInResumeDownload: function(rand) {
        this.$["temperror" + rand] && this.$["temperror" + rand].destroy();
        findApps.Utilities.delFunc(this, "OnCancel", rand);
        this.$["catalogServer" + rand] && this.$["catalogServer" + rand].destroy();
        findApps.Utilities.delFunc(this, "detailscb", rand);
    },
    
    detailscb: function(inSender, inResponse, inRequest, props, errors) {
        //If we paused one app's downloading, then quit the appcatalog, then start the appcatalog again,
        // and if start to resume downloading from the category list, the app.packageSize is undefined, because the 
        // appdownload was got from "updateFromInstalledAppsList", so we need to get the details from server for
        // validate install space.
        var self = this;
        if (errors && errors.length && errors.length > 0) {//errors exist
            var rand = findApps.Utilities.getRandNumber();
            self["OnCancel" + rand] = function() {
                self.cleanupInResumeDownload(rand);
            };
            self.createComponent({
                name: "temperror" + rand,
                kind: "findApps.Error",
                onCancel: "OnCancel" + rand,
                owner: self
            }).displayError(errors);
        } else {
            props.app.updateFromServer(inResponse.OutGetAppDetailV2.appDetail);
            this.owner.$.downloadStateManager.validateInstallSpace(props.app, "validate_space_default_single", function(status) {
                if (status) {
                    self.owner.$.downloadStateManager._resume(props.app);
                }
            });
        }
    },
    resumeDownload: function(app) {
        // Add the validate install apace logic , in case the user paused the downloading, then do some other
        // actions to fill the device space to full, then the user resume the downloading, there should be some
        // check and show user the no space notification.
        var that = this;
        if ((app.packageSize != undefined) && (app.installSize != undefined)) {
            that.owner.$.downloadStateManager.validateInstallSpace(app, "validate_space_default_single", function(status) {
                if (status) {
                    that.owner.$.downloadStateManager._resume(app);
                }
            });
        } else {
            //If we paused one app's downloading, then quit the appcatalog, then start the appcatalog again,
            // and if start to resume downloading from the category list, the app.packageSize is undefined, because the 
            // appdownload was got from "updateFromInstalledAppsList", so we need to get the details from server for
            // validate install space.
            findApps.BaseServer.getACServer().getApplicationDetails(app.id, app.publicApplicationId, enyo.g11n.currentLocale().toISOString(), "DSDownloadFailedAppDetails", true, {
                onResponse: "detailscb",
                scope: this,
                app: app
            });
        }
    },
    cancelPausedDownload: function(app) {
        this.owner.$.downloadStateManager._cancel(app);
    },
    uninstall: function(app) {
        this.owner.$.downloadStateManager._uninstall(app);
    },
    _reset: function(app) {
        this.owner.$.downloadStateManager._reset(app);
    },
    _remove: function(app) {
        this.owner.$.downloadStateManager._remove(app);
    },
    saveToMyApps: function() {
        return true;
    },
    toString: function() {
        return "findApps.AppState.Paused";
    }
});
enyo.kind({
    name: "findApps.AppState.DownloadFailed",
    kind: enyo.Control,
    components: [{
        name: "appinstallservice",
        kind: "findApps.AppInstallService"
    }],
    init: function(app) {
        app._progressPillModel.state = "download_failed";
        app._progressPillModel.titleRight = undefined;
        app._progressPillModel.icon = 'images/icon-warning.png';
        app._progressPillModel.image = undefined;
        app._progressPillModel.value = undefined;
        app._progressPillModel.title = $L('Failed');
        app.enableSave = true;
        app.progress = 0;
        app.disabledClass = null;
        app.updateClass = null;
        app.activeClass = "warning";
        app.resumeClass = null;
        app.pauseClass = null;
        app.warningClass = "show";
    },
    updateFromServer: function(app) {
        // force a refresh
        app.setState("findApps.AppState.DownloadFailed");
    },
    updateFromInstalledAppsList: function(app) {
        // force a refresh
        app.setState("findApps.AppState.DownloadFailed");
    },
    defaultAction: function(app) {
        this._defaultAction(app);
    },
    myAppsDefaultAction: function(app) {
        this._defaultAction(app);
    },
    cleanupInDefaultActionDF: function(rand) {
        this.$["temperror" + rand] && this.$["temperror" + rand].destroy();
        findApps.Utilities.delFunc(this, "OnSubmit", rand);
        findApps.Utilities.delFunc(this, "OnCancel", rand);
    },
    cleanupInInstall: function(rand) {
        this.$["catalogServer" + rand] && this.$["catalogServer" + rand].destroy();
        findApps.Utilities.delFunc(this, "detailscb", rand);
    },
    _defaultAction: function(app) {
        var that = this;
        var rand = findApps.Utilities.getRandNumber();
        var errors = [];
        errors.push("LOC04015");
        that["OnSubmit" + rand] = function() {
            app.install();
            that.cleanupInDefaultActionDF(rand);
        };
        that["OnCancel" + rand] = function() {
            that.owner.$.downloadStateManager._cancel(app);
            that.cleanupInDefaultActionDF(rand);
        };
        that.createComponent({
            name: "temperror" + rand,
            kind: "findApps.Error",
            onSubmit: "OnSubmit" + rand,
            onCancel: "OnCancel" + rand,
            owner: that
        }).displayError(errors, {
            errCode: app.errorCode
        })
    },
    cancelDownload: function(app) {
        this.owner.$.downloadStateManager._cancel(app);
    },
    uninstall: function(app) {
        this.owner.$.downloadStateManager._uninstall(app);
    },
    _reset: function(app) {
        this.owner.$.downloadStateManager._reset(app);
    },
    _remove: function(app) {
        this.owner.$.downloadStateManager._remove(app);
    },
    
    detailscb: function(inSender, inResponse, inRequest, props, errors) {
        var self = this;
        if (errors && errors.length && errors.length > 0) {//errors exist
            var rand = findApps.Utilities.getRandNumber();
            props.app.setState(props.oldState);
            errors.push("LOC04002");
            self["OnCancel" + rand] = function() {
                self.cleanupInInstall(rand);
            };
            self.createComponent({
                name: "temperror" + rand,
                kind: "findApps.Error",
                onCancel: "OnCancel" + rand,
                owner: self
            }).displayError(errors);
        } else {
            props.app.updateFromServer(inResponse.OutGetAppDetailV2.appDetail);
            this.owner.$.downloadStateManager.validateInstallSpace(props.app, "validate_space_default_single", function(status) {
                if (status) {
                    self.owner.$.downloadStateManager.validateDownloadConnection(function(status) {
                        if (status) {
                            self.installcb = function(inSender, inResponse) {};
                            self.failurecb = function(inSender, inResponse) {
                                if (props.app.stateToString() == "findApps.AppState.InitiatingDownload") props.app.setState(props.oldState);
                            };
                            self.$.appinstallservice.install(props.app, "installcb", "failurecb")
                        } else {
                            props.app.setState(props.oldState);
                        }
                    });
                } else {
                    props.app.setState(props.oldState);
                }
            });
        }
    },
    
    install: function(app) {
        var oldState = app.stateToString();
        app.setState("findApps.AppState.InitiatingDownload");
        
        findApps.BaseServer.getACServer().getApplicationDetails(app.id, app.publicApplicationId, enyo.g11n.currentLocale().toISOString(), "DSFailedAppDetails", true, {
            onResponse: "detailscb",
            scope: this,
            app: app,
            oldState: oldState
        });
    },
    saveToMyApps: function() {
        return true;
    },
    toString: function() {
        return "findApps.AppState.DownloadFailed";
    }
});
enyo.kind({
    name: "findApps.AppState.Purchasing",
    kind: enyo.Control,
    init: function(app, args) {
        app._progressPillModel.state = "purchasing";
        app._progressPillModel.titleRight = undefined;
        app._progressPillModel.icon = undefined;
        app._progressPillModel.image = undefined;
        app._progressPillModel.value = undefined;
        app._progressPillModel.title = $L('Purchasing...');
        app.enableSave = true;
    },
    toString: function() {
        return "findApps.AppState.Purchasing";
    },
    saveToMyApps: function() {
        return true;
    }
});
enyo.kind({
    name: "findApps.AppState.Purchased",
    kind: enyo.Control,
    init: function(app, args) {
        app._progressPillModel.state = "purchased";
        if (!args || (args && !args.transitional)) {
            app._progressPillModel.titleRight = undefined;
            app._progressPillModel.icon = undefined;
            app._progressPillModel.image = undefined;
            app._progressPillModel.value = undefined;
            app._progressPillModel.title = $L("FREE");
            app.enableSave = true;
        }
        app.progress = 0;
        if (args && args.version) app.purchasedVersion = args.version;
    },
    updateFromServer: function(app) {},
    updateFromInstalledAppsList: function(app) {
        if (app.installedVersion) {
            if (app.serverVersion && findApps.Utilities.VersionCheck.compare(app.installedVersion, app.serverVersion) == -1) {
                app.setState("findApps.AppState.UpdateAvailable");
            } else {
                app.setState('findApps.AppState.Installed');
            }
        }
    },
    saveToMyApps: function() {
        return true;
    },
    defaultAction: function(app) {
        app.install();
    },
    install: function(app) {
        var self = this;
        this.owner.$.downloadStateManager.validateInstallSpace(app, "validate_space_default_single", function(status) {
            if (status) self.owner.$.downloadStateManager._install(app);
        });
    },
    toString: function() {
        return "findApps.AppState.Purchased";
    }
});
enyo.kind({
    name: "findApps.AppState.PurchaseFailed",
    kind: enyo.Control,
    init: function(app, args) {
        app._progressPillModel.state = "purchase_failed";
        app._progressPillModel.titleRight = undefined;
        app._progressPillModel.icon = 'images/icon-warning.png';
        app._progressPillModel.image = undefined;
        app._progressPillModel.value = undefined;
        app._progressPillModel.title = $L('Failed');
        app.enableSave = true;
        app.errorStack = [];
        if (args && args.errorStack) {
            if (enyo.isArray(args.errorStack)) {
                app.errorStack = args.errorStack;
            } else {
                app.errorStack.push(args.errorStack.toString());
            }
        }
        app.displayErrorCode = (app.errorStack.length > 0 && app.errorStack[app.errorStack.length - 1]) || "";
    },
    updateFromServer: function(app) {},
    cleanupInDefaultActionPF: function(rand) {
        this.$["temperror" + rand] && this.$["temperror" + rand].destroy();
        findApps.Utilities.delFunc(this, "OnSubmit", rand);
        findApps.Utilities.delFunc(this, "OnCancel", rand);
    },
    defaultAction: function(app) {
        var that = this;
        var rand = findApps.Utilities.getRandNumber();
        var failover = "";
        var errors = app.errorStack;
        switch (app.paymentType) {
            case "ob":
                failover = "cc";
                errors.push("LOC04012");
                break;
            case "cc":
                if (findApps.UserProfile.obEnabled) {
                    failover = "ob";
                    errors.push("LOC04013");
                }
                break;
            default:
                errors.push("LOC04014");
                break;
        }
        // passing failover as "" for Topaz wifi
        // if failover=cc, the user is given the option to try purchase with credit card
        // if failover=ob, user is given an option to try purchasing with carrier account
        // if failover=empty, user is not shown any failover option. This will be the case for Topaz wifi device
        that["OnSubmit" + rand] = function() {
            that.cleanupInDefaultActionPF(rand);
            if (failover) {
                that.owner.$.downloadStateManager._forcePaymentType(app, failover);
            }
        };
        that["OnCancel" + rand] = function() {
            that.cleanupInDefaultActionPF(rand);
            that._reset(app);
        };
        that.createComponent({
            name: "temperror" + rand,
            kind: "findApps.Error",
            onSubmit: "OnSubmit" + rand,
            onCancel: "OnCancel" + rand,
            owner: that
        }).displayError(errors, {
            errCode: app.displayErrorCode
        });
    },
    _reset: function(app) {
        app.setState("findApps.AppState.Download");
    },
    _remove: function(app) {
        app.setState("findApps.AppState.Download");
    },
    toString: function() {
        return "findApps.AppState.PurchaseFailed";
    }
});
enyo.kind({
    name: "findApps.AppState.PurchasePending",
    kind: "findApps.AppState.PurchaseFailed",
    init: function(app, args) {
        app._progressPillModel.state = "purchase_pending";
        app._progressPillModel.titleRight = undefined;
        app._progressPillModel.icon = 'images/icon-warning.png';
        app._progressPillModel.image = undefined;
        app._progressPillModel.value = undefined;
        app._progressPillModel.title = $L('Pending');
        app.enableSave = true;
        app.errorStack = [];
        if (args && args.errorStack) {
            if (enyo.isArray(args.errorStack)) {
                app.errorStack = args.errorStack;
            } else {
                app.errorStack.push(args.errorStack.toString());
            }
        }
        app.displayErrorCode = (app.errorStack.length > 0 && app.errorStack[app.errorStack.length - 1]) || "";
        this.defaultAction(app);
    },
    defaultAction: function(app) {
        var rand = findApps.Utilities.getRandNumber();
        var errors = app.errorStack;
        errors.push("LOC04011");
        var self = this;
        this["OnClick" + rand] = function() {
            self.$["temperror" + rand] && self.$["temperror" + rand].destroy();
            findApps.Utilities.delFunc(self, "OnClick", rand)
        };
        this.createComponent({
            name: "temperror" + rand,
            kind: "findApps.Error",
            onSubmit: "OnClick",
            onCancel: "OnClick",
            owner: this
        }).displayError(errors, {
            errCode: app.displayErrorCode
        });
    },
    toString: function() {
        return "findApps.AppState.PurchasePending";
    }
});
enyo.kind({
    name: "findApps.AppState.Installing",
    kind: enyo.Control,
    init: function(app, args) {
        app._progressPillModel.state = "installing";
        app._progressPillModel.titleRight = undefined;
        app._progressPillModel.icon = undefined;
        app._progressPillModel.image = undefined;
        app._progressPillModel.value = 1;
        app._progressPillModel.title = $L('Installing...');
        app.progress = 100;
        app.enableSave = false;
        app.disabledClass = null;
        app.updateClass = null;
        app.activeClass = "active";
        app.resumeClass = null;
        app.pauseClass = null;
        app.warningClass = null;
    },
    updateFromInstalledAppsList: function(app) {
        // force a refresh
        app.setState("findApps.AppState.Installing");
    },
    _reset: function(app) {
        this.owner.$.downloadStateManager._reset(app);
    },
    _remove: function(app) {
        this.owner.$.downloadStateManager._remove(app);
    },
    saveToMyApps: function() {
        return true;
    },
    toString: function() {
        return "findApps.AppState.Installing";
    }
});
enyo.kind({
    name: "findApps.AppState.Installed",
    kind: enyo.Control,
    init: function(app, args) {
        app._progressPillModel.state = "installed";
        app._progressPillModel.titleRight = undefined;
        app._progressPillModel.icon = undefined;
        app._progressPillModel.image = undefined;
        app._progressPillModel.value = undefined;
        app._progressPillModel.title = $L('Launch');
        app.enableSave = false;
        app.disabledClass = null;
        app.updateClass = null;
        app.activeClass = null;
        app.resumeClass = null;
        app.pauseClass = null;
        app.warningClass = null;
    },
    updateFromServer: function(app) {
        this._update(app);
    },
    updateFromServerUpdatesList: function(app) {
        this._update(app);
    },
    _update: function(app) {
        //To Do**
        //Mojo.assert(app.installedVersion, "ERROR: app.installedVersion undefined when app is in installed state");
        // See if update is available
        if (app.serverVersion && findApps.Utilities.VersionCheck.compare(app.installedVersion, app.serverVersion) == -1) {
            app.setState("findApps.AppState.UpdateAvailable");
        } else {
            // force a refresh
            app.setState("findApps.AppState.Installed");
        }
    },
    saveToMyApps: function() {
        return true;
    },
    defaultAction: function(app) {
        app.launch();
    },
    launchcb: function(inSender, inResponse) {},
    launchfailurecb: function(inSender, inResponse) {},
    launch: function(app) {
        var self = this;
        findApps.ApplicationManager.getInstance().openApplication(app.publicApplicationId, undefined, true, "launchcb", "launchfailurecb", this)
    },
    uninstall: function(app) {
        this.owner.$.downloadStateManager._uninstall(app);
    },
    _reset: function(app) {
        this.owner.$.downloadStateManager._reset(app);
    },
    _remove: function(app) {
        this.owner.$.downloadStateManager._remove(app);
    },
    toString: function() {
        return "findApps.AppState.Installed";
    }
});
enyo.kind({
    name: "findApps.AppState.UpdateAvailable",
    kind: enyo.Control,
    components: [{
        name: "appinstallservice",
        kind: "findApps.AppInstallService"
    }],
    init: function(app, args) {
        app._progressPillModel.state = "update_available";
        app._progressPillModel.titleRight = undefined;
        app._progressPillModel.icon = undefined;
        app._progressPillModel.image = undefined;
        app._progressPillModel.value = undefined;
        app._progressPillModel.title = $L('Update');
        app.enableSave = false;
        app.disabledClass = null;
        app.updateClass = "update";
        app.activeClass = null;
        app.resumeClass = null;
        app.pauseClass = null;
        app.warningClass = null;
    },
    saveToMyApps: function() {
        return true;
    },
    defaultAction: function(app) {
        app.install();
    },
    myAppsDefaultAction: function(app) {
        app.install();
    },
    install: function(app) {
        var self = this;
        self.owner.$.downloadStateManager.validateInstallSpace(app, "validate_space_default_single", function(status) {
            if (status) {
                self.owner.$.downloadStateManager._install(app);
            } else {
                app.setState("findApps.AppState.UpdateAvailable");
            }
        });
    },
    // called when updates are installed in a bulk
    // all checks (install capacity, network..) are done
    // once for the whole batch
    installUpdate: function(app) {
        var self = this;
        var oldState = app.stateToString();
        app.setState("findApps.AppState.InitiatingDownload");
        self.installcb = function(inSender, inResponse) {};
        self.failurecb = function(inSender, inResponse) {
            if (app.stateToString() == "findApps.AppState.InitiatingDownload") app.setState(oldState);
        };
        self.$.appinstallservice.install(app, "installcb", "failurecb");
    },
    updateFromInstalledAppsList: function(app) {
        this._update(app);
    },
    updateFromServerUpdatesList: function(app) {
        this._update(app);
    },
    _update: function(app) {
        if (app.serverVersion && findApps.Utilities.VersionCheck.compare(app.installedVersion, app.serverVersion) == -1) {
            // force a refresh
            app.setState("findApps.AppState.UpdateAvailable");
        } else {
            app.setState("findApps.AppState.Installed");
        }
    },
    uninstall: function(app) {
        this.owner.$.downloadStateManager._uninstall(app);
    },
    _reset: function(app) {
        this.owner.$.downloadStateManager._reset(app);
    },
    _remove: function(app) {
        this.owner.$.downloadStateManager._remove(app);
    },
    toString: function() {
        return "findApps.AppState.UpdateAvailable";
    }
});
enyo.kind({
    name: "findApps.AppState.InstallFailed",
    kind: enyo.Control,
    components: [{
        name: "appinstallservice",
        kind: "findApps.AppInstallService"
    }],
    init: function(app) {
        app._progressPillModel.state = "install_failed";
        app._progressPillModel.titleRight = undefined;
        app._progressPillModel.icon = 'images/icon-warning.png';
        app._progressPillModel.image = undefined;
        app._progressPillModel.value = undefined;
        app._progressPillModel.title = $L('Failed');
        app.enableSave = false;
        app.disabledClass = null;
        app.updateClass = null;
        app.activeClass = "warning";
        app.resumeClass = null;
        app.pauseClass = null;
        app.warningClass = "show";
    },
    updateFromServer: function(app) {
    // do nothing, let user retry to install
    },
    updateFromInstalledAppsList: function(app) {
        // force refresh
        app.setState("findApps.AppState.InstallFailed");
    },
    defaultAction: function(app) {
        this._defaultAction(app);
    },
    myAppsDefaultAction: function(app) {
        this._defaultAction(app);
    },
    _defaultAction: function(app) {
        var that = this;
        var rand = findApps.Utilities.getRandNumber();
        // TODO Add retryInstall back once NOV-83315 is implemented and there
        // is an "intelligent" retry, for now always download from scratch
        var totalInstallSize;
        if (app.installSize) {
            totalInstallSize = (app.installSize / (1024 * 1024)) + 1;
            totalInstallSize = findApps.Utilities.Formatter.formatRound2(totalInstallSize) + " " + $L("MB");
        } else {
            totalInstallSize = $L("unknown MB");
        }
        var revertableApp = this.owner.getDetailsRevertableApp(app.publicApplicationId);
        that.cleanup = function(rand) {
            that.$["catalogServer1" + rand] && that.$["catalogServer1" + rand].destroy();
            findApps.Utilities.delFunc(that, "OnRevert", rand);
            findApps.Utilities.delFunc(that, "OnCancel", rand);
            findApps.Utilities.delFunc(that, "OnRetry", rand);
        };
        that["OnRevert" + rand] = function() {
            app.pendingRevert = true;
            that.owner.$.downloadStateManager._restore(app);
            that.cleanup(rand);
        };
        that["OnCancel" + rand] = function() {
            that.owner.$.downloadStateManager._cancel(app);
            that.cleanup(rand);
        };
        that["OnRetry" + rand] = function() {
            app.install();
            that.cleanup(rand);
        };
        var errors = [];
        if (app.errorCode) {
            errors.push(app.errorCode);
        }
        if (revertableApp) {
            errors.push("LOC04009");
            that.createComponent({
                name: "temperror" + rand,
                kind: "findApps.Error",
                onSubmit: "OnRevert" + rand,
                onCancel: "OnCancel" + rand,
                owner: that
            }).displayError(errors, {
                installSize: totalInstallSize,
                title: app.title
            });
        } else {
            errors.push("LOC04010");
            that.createComponent({
                name: "temperror" + rand,
                kind: "findApps.Error",
                onSubmit: "OnRetry" + rand,
                onCancel: "OnCancel" + rand,
                owner: that
            }).displayError(errors, {
                installSize: totalInstallSize
            });
        }
    },
    cancelDownload: function(app) {
        this.owner.$.downloadStateManager._cancel(app);
    },
    uninstall: function(app) {
        this.owner.$.downloadStateManager._uninstall(app);
    },
    _reset: function(app) {
        this.owner.$.downloadStateManager._reset(app);
    },
    _remove: function(app) {
        this.owner.$.downloadStateManager._remove(app);
    },
    
    detailscb: function(inSender, inResponse, inRequest, props, errors) {
        var self = this;
        if (errors && errors.length && errors.length > 0) {//errors exist
            var rand = findApps.Utilities.getRandNumber();
            props.app.setState(props.oldState);
            errors.push("LOC04003");
            this["OnCancel" + rand] = function() {
                self.$["temperror" + rand] && self.$["temperror" + rand].destroy();
                findApps.Utilities.delFunc(self, "OnCancel", rand)
            };
            this.createComponent({
                name: "temperror" + rand,
                kind: "findApps.Error",
                onCancel: "OnCancel" + rand,
                owner: this
            }).displayError(errors);
        } else {
            props.app.updateFromServer(inResponse.OutGetAppDetailV2.appDetail);
            this.owner.$.downloadStateManager.validateInstallSpace(props.app, "validate_space_default_single", function(status) {
                if (status) {
                    self.owner.$.downloadStateManager.validateDownloadConnection(function(status) {
                        if (status) {
                            self.installcb = function(inSender, inResponse) {};
                            self.failurecb = function(inSender, inResponse) {
                                if (props.app.stateToString() == "findApps.AppState.InitiatingDownload") props.app.setState(props.oldState);
                            };
                            self.$.appinstallservice.install(props.app, "installcb", "failurecb")
                        } else {
                            props.app.setState(props.oldState);
                        }
                    });
                } else {
                    props.app.setState(props.oldState);
                }
            });
        }
    },
    
    install: function(app) {
        var oldState = app.stateToString();
        app.setState("findApps.AppState.InitiatingDownload");

        findApps.BaseServer.getACServer().getApplicationDetails(app.id, app.publicApplicationId, enyo.g11n.currentLocale().toISOString(), "DSInstallFailedAppDetails", true, {
            onResponse: "detailscb",
            scope: this,
            app: app,
            oldState: oldState
        });
    },
    saveToMyApps: function() {
        return true;
    },
    toString: function() {
        return "findApps.AppState.InstallFailed";
    }
});