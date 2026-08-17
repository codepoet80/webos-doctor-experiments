enyo.kind({
	name: "AccountLoginStatesPopup",
	kind: "enyo.Menu",
	lazy: false,
	style: "width:330px;",
	published: {
		loginStates: [],
		accountsState: {}
	},
	events: {
		onAvailabilitySet: "",
		onInputCustomMessage: ""
	},

	components: [
		{name: "scroller", kind: "BasicScroller", flex: 1, horizontal: false, autoHorizontal: false,  components: [
		    {name: "allAccountsDivider", kind: "enyo.Divider", caption: $L("ALL ACCOUNTS"),  style: "margin-top:5px;margin-bottom:5px;", showing: false},
		    {name: "allAccounts", kind: "AccountStatuses", onAvailabilityChanged: "changeAccountsAvailability", className: "all-accounts", onInputCustomMessage: "inputAccountsCustomMessage"},
		    {name: "indAccountsDivider", kind: "enyo.Divider", caption: $L("INDIVIDUAL ACCOUNTS"), style: "margin-top:5px;margin-bottom:5px;", showing: false}
		]},
		{name: "db", kind: "BaseLoginStateDB", loginStates: this.loginStates}
	],
	loginStatesChanged: function() {
		this.$.allAccountsDivider.setShowing(this.loginStates.length > 1);
		this.$.indAccountsDivider.setShowing(this.loginStates.length > 1);
		this.checkInvisibilitySupport();
		this.updateAllAccountsAvailability();
		this.updateLoginStateComponents();
		this.$.db.setLoginStates(this.loginStates);
	},
	checkInvisibilitySupport: function () {
		this.$.allAccounts.setInvisibilitySupported(this.shouldShowAllAccountsInvisibleStatus(this.loginStates));
	},
	updateAllAccountsAvailability: function () {
		var availArray = [];
		var availability;
		for (var i=0; i<this.loginStates.length; i++) {
			availArray[i] = enyo.messaging.imLoginState.getAvailability(this.loginStates[i]);
		}
		this.$.allAccounts.setAvailability(availArray);	
	},
	updateLoginStateComponents: function() {
		var loginStateComponents = this.getLoginStateComponents();
		var key;

		if (this.loginStates.length <= 1) {
			for (key in loginStateComponents) {
				this.destroyLoginStateComponent(loginStateComponents[key]);
			}
		} else {
			var component, i;
			var stateIds = {};
			
			for (i = 0; i < this.loginStates.length; i++) {
				component = loginStateComponents[this.loginStates[i]._id];
				stateIds[this.loginStates[i]._id] = true;
				
				if (component) {
					enyo.log("updating login state component");
					component.setLoginState(this.loginStates[i]);
				} else {
					component = this.$.scroller.createComponent({
						name: AccountLoginState.COMPONENT_NAME_PREFIX + this.loginStates[i]._id,
						kind: "AccountLoginState",
						loginState: this.loginStates[i],
						className: "individual-account",
						onAvailabilitySet: "changeAvailability",
						onInputCustomMessage: "inputCustomMessage",
						onDrawerOpened: "drawerOpened"
						}, {owner: this});
					component.render();
				}
				
				if (i != 0) component.applyStyle("border-top", "1px solid rgba(255,255,255,0.5);");
				if (i != this.loginStates.length - 1) component.applyStyle("border-bottom", "1px solid rgba(0,0,0,0.2);");

			}
			
			for (key in loginStateComponents) {
				if (!stateIds[key]) {
					this.destroyLoginStateComponent(loginStateComponents[key]);
				}
			}
		}
	},
	drawerOpened: function(inSender) {
		var loginStateComponents = this.getLoginStateComponents();
		var key;
		for (key in loginStateComponents) {
			if (loginStateComponents[key] != inSender) {
				loginStateComponents[key].closeDrawer();
			}
		}
	},
	getLoginStateComponents: function() {
		var components = {};

		enyo.forEach(this.getComponents(), function(comp) {
			var name = comp.getName();
			if (name.indexOf(AccountLoginState.COMPONENT_NAME_PREFIX) >= 0) {
				var id = name.substring(AccountLoginState.COMPONENT_NAME_PREFIX.length, name.length);
				components[id] = comp;
			}
		});

		return components;
	},
	destroyLoginStateComponent: function(component) {
		component.setShowing(false);
		component.destroy();
	},
	changeAccountsAvailability: function(inSender) {
		this.accountsState.availability = inSender.availability;
		this.doAvailabilitySet(this.$.db, this.accountsState);
		this.close();
	},
	changeAvailability: function(inSender, db, loginState) {
		this.doAvailabilitySet(db, loginState);
		this.close();
	},
	inputAccountsCustomMessage: function(inSender, inEvent) {
		this.doInputCustomMessage(this.$.db, this.accountsState);
		this.close();
	},
	inputCustomMessage: function(inSender, db, loginState) {
		this.doInputCustomMessage(db, loginState);
		this.close();
	},
	close: function() {
		this.inherited(arguments);
		// This will cause all drawers to close
		this.drawerOpened();
	},
	// unit tested functions
	shouldShowAllAccountsInvisibleStatus: function(states) {
		var show = !!states && states.length > 0 && states[0].supportsInvisibleStatus;
		var i = 1, len = states ? states.length : 0;
		for (; show && i < len; i++) {
			show = show && states[i].supportsInvisibleStatus;	
		}
		return show;
	}
});