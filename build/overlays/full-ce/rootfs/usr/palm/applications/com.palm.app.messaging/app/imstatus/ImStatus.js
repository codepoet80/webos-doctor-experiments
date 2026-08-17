enyo.kind({
	name: "ImStatus",
	kind: "HFlexBox",
	events: {
		onLoginStatesChange: "",
		onAddAccount: ""
	},
	components: [
		{name: "availabilityContainer", flex:1, components: [
			{layoutKind: "HFlexLayout", onclick: "availabilityClicked", align:"center" , components: [
				{name: "status", className: "status status-buddy", style: "margin-top:-1px;margin-left:0px;"},
				{name: "spinner", className: "status-spinner", kind: "Spinner", style: "margin-left:-10px;", spinning: true, shownWhenSpinning: true},
				{name: "availability", content: "Offline", className:"availability-text enyo-text-ellipsis"},
				{name: "arrow", className: "enyo-listselector-arrow"}
			]}
		]},		
		{name: "customStatusContainer", flex: 1, showing: false, components: [
			{name: "inputBox", kind:"InputBox", className:"enyo-middle", style:"width:320px;margin-left:-4px;",/*style:"-webkit-border-image:none;border-width:0;",*/ components: [
                {name: "customMessageStatus", style: "margin-top:2px;", className: "status status-buddy"},                                                                                                                         
				{name: "customMessage", kind: "Input", onblur: "customMessageBlur", onchange: "customMessageChanged", className:"custom-status-input", style:"margin-left:-20px;vertical-align:middle;", flex:1, styled: false, changeOnKeypress: true, selectAllOnFocus: true}
             ]},
		     {layoutKind: "HFlexLayout", style:"margin-left:-6px;padding-left: 10px;padding-right:10px;", components: [
			     {name: "cancelButton", kind: "Button", flex: 1, caption: "Cancel", onclick: "cancelButtonClicked"},
				 {name: "setButton", kind: "Button", flex: 1, className:"enyo-button-dark", caption: "Set Status", onclick: "setButtonClicked"}
		     ]}	
		]},
		{name: "accounts", kind: "AccountLoginStatesPopup", onAvailabilitySet: "availabilitySet", onInputCustomMessage: "inputCustomMessage"},
		{name: "loginStateFinder", kind: "DbService", dbKind: enyo.messaging.imLoginState.dbKind, method: "find", onSuccess: "gotLoginStates", subscribe: true, resubscribe: true, reCallWatches: true},
		{name: "loginStateSetter", kind: "DbService", dbKind: enyo.messaging.imLoginState.dbKind, method: "merge", onSuccess: "changedLoginState"},
	 	{name: "networkAlerts", kind: "NetworkAlerts", onTap: "onNetworkAlertsTapFn"},
		{name: "mockDbFinder", kind: "MockDb", dbKind: "loginstates/com.palm.imloginstate:3", method: "find", onSuccess: "gotLoginStates", subscribe: true, resubscribe: true, reCallWatches: true}
	],
	create: function() {
		this.inherited(arguments);
		this.fetchLoginStates();
	},
	showHideStatusSpinner: function(inShow) {
		this.$.status.setShowing(!inShow);
		this.$.spinner.setShowing(inShow);
		this.$.availability.addRemoveClass("adjust-text-for-no-spinner", !inShow);
	},
	fetchLoginStates: function() {
		this.$.loginStateFinder.cancel();
		if (window.PalmSystem) {
			this.$.loginStateFinder.call();
		} else {
			this.$.mockDbFinder.call();
		}
	},
	gotLoginStates: function(inSender, inResponse) {
		this.loginStates = this.getLoginStates(inResponse);
		//enyo.log("%%%%%%%%%%%%%%% this.loginStates", JSON.stringify(this.loginStates));
		this.doLoginStatesChange(this.loginStates);
		
		this.accountsState = enyo.messaging.imLoginState.getAggregatedLoginState(this.loginStates);
		this.setStatusIndicator(this.accountsState);
		this.$.accounts.setLoginStates(this.loginStates);
		this.$.accounts.setAccountsState(this.accountsState);
	},
	getLoginStates: function(inResponse) {
		if (!inResponse || !inResponse.results) {
			return [];
		}
		
		var loginStates = inResponse.results;
		for (var i = 0; i < loginStates.length; i++) {
			loginStates[i].accountTypeName = this.getAccountTypeName(loginStates[i]);
			// The check for type_yahoo can be removed once the supportsInvisibleStatus flag is added to the Yahoo account template
			loginStates[i].supportsInvisibleStatus = (this.supportsInvisibleStatus(loginStates[i]) || loginStates[i].serviceName === "type_yahoo");
		}		
		loginStates.sort(function(a, b) {
			return a.accountTypeName > b.accountTypeName || (a.accountTypeName === b.accountTypeName && a.username > b.username);
        });
		
		return loginStates;
	},
	getAccountTypeName: function(loginState) {
		//enyo.log("%%%%%%%%%%%% loginState: ", loginState);
		var account = enyo.application.accountService.getAccount(loginState.serviceName, loginState.username);
		return account ? account.loc_name : "";
	},
	supportsInvisibleStatus: function(loginState) {
		var account = enyo.application.accountService.getAccount(loginState.serviceName, loginState.username);
		return !!account && account.supportsInvisibleStatus;
	},
	changedLoginState: function(inSender, inResponse) {
		if (inResponse.count > 0) {
			this.showHideStatusSpinner(false);
			this.$.availability.setContent(this.status);
			this.fetchLoginStates();
		}
	},
	setStatusIndicator: function(accountsState) {
		if (!accountsState) {
			this.setStatusNoAccount();		
		} else {
			this.setAllAccountsStatus(accountsState);
		}		
	},
	setStatusNoAccount: function() {
		this.status = enyo.messaging.im.availabilityCaptions["offline"];
		this.showHideStatusSpinner(false);
		this.updateStatusClass("status-offline");
		this.$.availability.setContent(this.status);
	},
	setAllAccountsStatus: function(accountsState) {
		var currentStatus = enyo.messaging.im.availabilityClasses[accountsState.bestAvailability];
		this.status = enyo.messaging.im.availabilityCaptions[currentStatus];
		if (accountsState.hasPending) {
			this.setStatusPendingAccount();			
		} else {			
			this.setStatusHaveAccount(accountsState, currentStatus);
		}
	},
	setStatusPendingAccount: function() {
		this.showHideStatusSpinner(true);
		this.$.availability.setContent($L("Signing in..."));
		this.startLoginTimer();
		
		// if AccountLoginStatesPopup is opened, close it.
		if (this.$.accounts.isOpen) {
			this.$.accounts.close();
		}
	},
	// This function can be used to get a sign in caption for individual or all accounts sign in.
	getSignInCaption: function() {
		var accountName = undefined;
		for (var i=0; i<this.loginStates.length; i++) {
			if (this.loginStates[i].state === enyo.messaging.imLoginState.TRANSPORT_STATE.LOGGING_ON ||
				this.loginStates[i].state === enyo.messaging.imLoginState.TRANSPORT_STATE.RETRIEVING_DATA) {
				if (accountName === undefined) {
					accountName = this.loginStates[i].accountTypeName;
				} else {
					return $L("Signing into all accounts...");
				}
			}
		}
		if (accountName === undefined) {
			return $L("Signing in...");
		} else {
			//FIXME: the following line can't be localized correctly since it uses the wrong method for localization. 
			return $L("Signing into "+accountName+"...");
		}
	},
	setStatusHaveAccount: function(accountsState, currentStatus) {
		this.showHideStatusSpinner(false);	
		this.updateStatusClass(this.getStatusClass(currentStatus));
		if (accountsState.bestAvailability === enyo.messaging.im.availability.OFFLINE) {
			this.$.availability.setContent(this.status);
		} else if (!accountsState.identicalAvailabilities || !accountsState.identicalStates || !accountsState.identicalCustomMessages) {
			this.$.availability.setContent($L("Custom Availability"));
		} else {			
			if (accountsState.customMessage) {
				this.$.availability.setContent(accountsState.customMessage);
			} else {
				this.$.availability.setContent(this.status);
			}
		}		
		this.stopLoginTimer();
	},
	updateStatusClass: function(newStatusClass) {
		if (this.statusClass) {
		    this.$.status.removeClass(this.statusClass);
		}
		this.statusClass = newStatusClass;
		this.$.status.addClass(this.statusClass);
	},
	startLoginTimer: function() {
		if (!this.loginTimer) {
			// Fallback if an account is stuck genuinely CONNECTING (LOGGING_ON) for too long. This USED to
			// force availability=OFFLINE on ALL accounts (saveAvailability has no where-clause), which both
			// lied about accounts that were actually online / retrieving-buddies (showing "Offline" while
			// messages still flowed) AND made the transport log them off - needsToLogoff() fires whenever
			// availability=OFFLINE. Do NOT mutate the DB: just drop the spinner and re-render the real
			// aggregated state. With retrieving-buddies now treated as online (see utils.js), this timer
			// effectively only ever covers a genuinely stuck LOGGING_ON.
			this.loginTimer = setTimeout(function() {
				this.loginTimer = undefined;
				this.showHideStatusSpinner(false);
				this.fetchLoginStates();
			}.bind(this), 90000);
		}
	},
	stopLoginTimer: function() {
		if (this.loginTimer) {
			clearTimeout(this.loginTimer);
			this.loginTimer = undefined;
		}		
	},
	saveAvailability: function(value) {
		this.$.loginStateSetter.call({
			"props": {
				"availability": value
			},
			"query": {
				"from": "com.palm.imloginstate:1"
			}
		});
	},
	onNetworkAlertsTapFn:function(inSender, inResponse){
		enyo.log("ImStatus:onNetworkAlertsTapFn:inResponse:", inResponse);
	},
	availabilityClicked: function(inSender, inEvent) {
		enyo.messaging.keyboard.setKeyboardAutoMode();
		if (this.loginStates.length === 0) {
			this.doAddAccount();
		} else {
			// Open the account selector even while an account is still "Signing in..." (spinner
			// showing). Previously this was gated on !spinner.getShowing(), so a slow or looping
			// sign-in on ONE account blocked the user from opening the list to manage or log into
			// any OTHER account.
			this.$.accounts.openAtControl(inSender);
			this.$.accounts.setLoginStates(this.loginStates);
			this.$.accounts.setAccountsState(this.accountsState);
		}
	},
	availabilitySet: function(inSender, db, loginState) {
		this.$.networkAlerts.push({type: "data"});
		db.updateAvailability(loginState.availability);
	},
	inputCustomMessage: function(inSender, db, loginState) {
		this.db = db;
		if (loginState._id === undefined) {
			var status = enyo.messaging.im.availabilityClasses[loginState.bestAvailability];
			this.updateCustomMessageStatusClass(this.getStatusClass(status));
		} else {
			this.updateCustomMessageStatusClass(this.getStatusClass(enyo.messaging.im.buddyAvailabilities[enyo.messaging.imLoginState.getAvailability(loginState)]));
		}
		if (this.accountsState.customMessage && this.accountsState.customMessage !== "") {
			this.$.customMessage.setValue(this.accountsState.customMessage);
		} else if (loginState.customMessage && loginState.customMessage !== "") {		
			this.$.customMessage.setValue(loginState.customMessage);
		} else {
			this.$.customMessage.setValue("");
		}
		this.showCustomMessageInput(true);
		this.$.customMessage.forceFocus();
	},
	updateCustomMessageStatusClass: function(newStatusClass) {
		if (this.customMessageStatusClass) {
		    this.$.customMessageStatus.removeClass(this.customMessageStatusClass);
		}
		this.customMessageStatusClass = newStatusClass;
		this.$.customMessageStatus.addClass(this.customMessageStatusClass);
	},
	customMessageBlur: function(saveMsg) {
        if (saveMsg === true) {
    		this.db.updateCustomMessage(this.$.customMessage.getValue());
    		this._handledCustomMessage();
        } else {
        	this.showCustomMessageInput(false);
        }     
	},
	customMessageChanged: function() {
        if(this.$.customMessage.hasFocus()) {
        	this.customMessageBlur(true);
        }
	},
	cancelButtonClicked: function(inSender, inEvent) {
		this._handledCustomMessage();
	}, 
	setButtonClicked: function(inSender, inEvent) {
		this.customMessageBlur(true);
	},
	_handledCustomMessage: function() {
		this.$.customMessage.setValue("");
		this.$.customMessage.forceBlur();
		this.db = undefined;
		this.showCustomMessageInput(false);
	},
	showCustomMessageInput: function(show) {
		this.$.availabilityContainer.setShowing(!show);
		this.$.customStatusContainer.setShowing(show);
	},
	windowHiddenHandler: function() {
		if(this.$.customStatusContainer.showing) {
			this._handledCustomMessage();
		}
	},
	/***********************************
	 * Functions below are unit tested *
	 ***********************************/
	getStatusClass: function(value) {
		return value && value !== "offline" ?
				"status-" + value :
				"status-offline";
	}
});