enyo.kind({
	name: "PhoneAppCard",
	kind: enyo.VFlexBox,
	components: [
		{name: "pane", kind: "Pane", transitionKind:enyo.transitions.Simple, onSelectView: "handleDestroyOnUnload", height: "100%", components: [
			{name:"phoneTabs", kind: "PhoneTabs", lazy:true},
			{name:"phonePrefs", kind:"PhonePrefs", lazy:true, destroyOnUnload:true /*see handleDestroyOnUnload*/},
			{name:"favoritesAdd", kind:"FavoritesAdd", lazy:true, destroyOnUnload:true},
			{name:"voiceDialing", kind: "VoiceDialing", lazy:true, destroyOnUnload:true},
			{name:"voicemailgreeting", kind: "VoicemailGreeting", lazy:true, destroyOnUnload:true},
			// topaz only
			{name:"firstlaunch", kind:"FirstLaunchScene", lazy:true, destroyOnUnload:true},			
		]},
		{name:"appMenu", kind:"phoneAppMenu", onCopy:"copy", onPaste:"paste", onClose: "closeAppMenuHandler", onLaunchingPreferences: "preferencesLaunching"},
		{name:"activeCallBanner", kind:"ActiveCallBanner"},
		
		{kind: "ApplicationEvents", onLoad: "loadHandler", onUnload: "unloadHandler", onError: "errorHandler", onWindowActivated: "windowActivatedHandler", onWindowDeactivated: "windowDeactivatedHandler", onWindowParamsChange: "windowParamsChangeHandler", onApplicationRelaunch: "", onWindowRotated: "", onOpenAppMenu: "openAppMenuHandler", onCloseAppMenu: "closeAppMenuHandler", onWindowHidden: "phoneAppHideHandler", onWindowShown: "phoneAppShowHandler", onKeyup: "keyupHandler", onKeydown:"keydownHandler", onKeypress: "",onBack:"backHandler"}
	],
	loadHandler: function() {
		enyo.log("Loading phone app.................");
	},
	// if this window is closed twice in 5 sec it will get destroyed.
	// we need all our components to unregister themselves with the
	// headless part of the app so nothing gets orphaned.
	// also reset the app to the start state
	unloadHandler: function() {
	        enyo.log("Unloading phone app.................");
		enyo.application.Cache.phoneAppLoaded = false;
		enyo.application.Cache.pinView = false;
		enyo.application.Cache.dialParams = undefined;
		
		enyo.application.Cache.incomingCallPopupLoading = false;
	
		enyo.application.UI.enter('start');
		enyo.application.CallSynergizer.disconnectAllCalls();
		this.destroy();
		
		if(enyo.application.isTablet) {
			enyo.error("PhoneAppCard - close main card");
			enyo.application.closeMainCard();
		}
	},
	destroy: function() {
		if(this.dialParamTimeout) {
			window.clearTimeout(this.dialParamTimeout);
		}
		this.inherited(arguments);
	},
	errorHandler: function() {
		enyo.error("Error loading window.....");
	},
	// called when app is opened or reopened from parent
	windowParamsChangeHandler: function() {
		this.handleLaunch();
	},
	handleLaunch: function() {
		

	        enyo.log("phone app handle launch.................");
	        if(enyo.application.Cache.phoneAppLoaded == false) {
        		enyo.application.Cache.phoneAppLoaded = true;
        		
	       		//Hack: Need 1s delay - User might have already closed the phone app when launching..
			this.dialParamTimeout = window.setTimeout(enyo.bind(this, function () {
				if(enyo.application.Cache.dialParams && enyo.application.Cache.dialParams.address) {
					var params = enyo.application.Cache.dialParams;
					enyo.application.Cache.dialParams = undefined;
					enyo.log("dial request....");
					enyo.application.CallSynergizer.dial(params.address, params.video, undefined, params.service, params.personId);
				}
			}), 1000);
		}
		
		var params = enyo.windowParams;
                //enyo.log("=== Handle Launch called with " + JSON.stringify(params));
        
		if ( 'autoDismiss' in params ) {
			// must defer this call or else sysmgr won't re-show the quick-launch bar when card is gone
			enyo.asyncMethod(this, function() {
				PalmSystem.hide();
			});
			
		} else if ('preferences' in params) {
			// TODO: use enyo.depends with callback to also load phoneprefs kinds at this point
			this.$.pane.selectViewByName("phonePrefs");
			this.$.phonePrefs.handleLaunch(params.params);
			
		} else if ('firstlaunch' in params) {
			this.$.pane.selectViewByName("firstlaunch");
			this.$.firstlaunch.handleLaunch(params.params);
			
		} else if ('activecall' in params) {
			if (!enyo.application.hidden) {
				this.$.pane.selectViewByName("phoneTabs",true); // show tabs
				setTimeout(enyo.hitch(this, function () {
					this.$.phoneTabs.selectViewByName("activeCall", params.params);
				}), 100);
			}			
		} else if ('scene' in params) {
            if (params.scene === "firstlaunch_card") {			
				//enyo.log("Trying to launch the firstlaunch scene\n");
				this.$.pane.selectViewByName("firstlaunch");
				this.$.firstlaunch.handleLaunch(params.params);
			}
			else {
				this.$.pane.selectViewByName("phoneTabs", true); // show tabs
				setTimeout(enyo.hitch(this, function () {
					this.$.phoneTabs.selectViewByName(params.scene, params.params);		
				}), 100);
			}
			
		} else if ('voicedialing' in params) {
	        this.$.pane.selectViewByName("voiceDialing");
			this.$.voiceDialing.handleLaunch(params.params);
			
		} else if ('favoritesAdd' in params) {
			this.$.pane.selectViewByName("favoritesAdd");

		} else if ('voicemailgreeting' in params) {
			this.$.pane.selectViewByName("voicemailgreeting", true);
			this.$.voicemailgreeting.handleLaunch(params.params);
		} else if ('voicemailgreeting_back' in params) {
			this.$.voicemailgreeting.goBack();
		}
		
		if ('showActiveCallBanner' in params) {
			if (this.$.activeCallBanner) {
				this.$.activeCallBanner.setShowing(params.showActiveCallBanner);
			}
		}
		if ('windowDeactivate' in params) {
			this.delegateToActiveView('windowDeactivate');
		} else 	if ('windowActivate' in params) {
			this.delegateToActiveView('windowActivate');
		}
	},
	// destroy views (flagged by destroyOnUnload:true) that we don't want to keep
	// around because they are rarely accessed and/or too expensive to keep in the DOM
	handleDestroyOnUnload: function(inSender, inView, inPreviousView) {
		if ( inPreviousView && inPreviousView.destroyOnUnload && inView !== inPreviousView ) {
			inPreviousView.destroy();
		}
	},
	// dispatched automatically by framework when back gesture received
	backHandler: function(inSender, event) {
		if ( ! this.delegateToActiveView("back", event) ) {
			// if not handled by active scene, see if state machine wants it
			enyo.application.UI.event('back', event);
		}
	},
	keyupHandler: function(inSender, event) {
		this.delegateToActiveView('keyup', event);
	},
	keydownHandler: function(inSender, event) {
		this.delegateToActiveView('keydown', event);
	},
	copy: function() {
		this.delegateToActiveView('copy');
	},
	paste: function() {
		this.delegateToActiveView('paste');
	},
	preferencesLaunching: function() {
		// Don't let the user tap any tabs while we are loading the preferences pane
		if(this.$.phoneTabs) {//phonetabs not loaded in firstlaunch scene
			this.$.phoneTabs.disableTabsMenu(true);
			setTimeout(enyo.hitch(this, function() {
				this.$.phoneTabs.disableTabsMenu(false);
			}), 3000);
		}
	},
	// delegates the named event type to the active scene
	// if the scene's handler returns true, it was handled and it default prevented
	delegateToActiveView: function(eventType, event) {
		var activePaneObj = this.$[this.$.pane.getViewName()];
		var handled = activePaneObj && activePaneObj[eventType] && activePaneObj[eventType].apply(activePaneObj, enyo.cloneArray(arguments).slice(1));
		if ( handled && event ) {
			event.preventDefault();
		}
		return handled;
	},
	// dispatched automatically by framework when app menu is triggered
	openAppMenuHandler: function() {
		if(this.$.phoneTabs) {//phonetabs not loaded in firstlaunch scene
			this.$.phoneTabs.disableTabsMenu(true);
			this.$.appMenu.openMenu(enyo.application.UI.getCurrentState() == "calllog", this.$.phoneTabs.getCurrentViewName() == "voicemail");
		} else {
			this.$.appMenu.openMenu();
		}
	},
	// dispatched automatically by framework when app menu is hidden
	closeAppMenuHandler: function() {
		if(this.$.phoneTabs) {//phonetabs not loaded in firstlaunch scene
			this.$.phoneTabs.disableTabsMenu(false);
		}
		if(this.$.appMenu) {
			this.$.appMenu.close();
		}
	},
	windowActivatedHandler: function() {
		enyo.application.isCarded = false; 
		if (enyo.application.Cache.hasVoipAcct === false && !enyo.application.Cache.hasPairedPhone) {
			enyo.application.UI.enter('firstlaunch_card');
		}
		else {
			enyo.application.UI.event('windowActivate');
		}		
		enyo.application.UI.event('windowActivate');
	},
	windowDeactivatedHandler: function() {
		enyo.application.isCarded = true;
		enyo.application.UI.event('windowDeactivate');
	},
	// special handlers for phone app
	phoneAppShowHandler: function() {
		//transition always simple
		//this.$.pane.setTransitionKind(enyo.transitions.Fade);
	},
	phoneAppHideHandler: function() {	
		// disable transitions while phone app is hidden
		// we do this so scenes come up immediately when it is relaunched (and
		// so we're not wasting cpu cycles performing css transitions while hidden)
		//this.$.pane.setTransitionKind(enyo.transitions.Simple);
		
		// disconnect all calls
		enyo.application.CallSynergizer.disconnectAllCalls();
	}
});
