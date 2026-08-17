/*jslint white: false, onevar: false, nomen:false, plusplus: false */
/*global enyo */

enyo.kind({
	name: "FirstLaunchScene",  // abstracted out so we can handle different firstLaunch scenes for products
	kind: "VFlexBox",
	//className: "phone-background",
	style: "min-height: 344px", // Support broadway(400),  424px", // Screen (480px) - System bar (28px) - Notification (28px) = 424px
	published: {
		tabsShowing: true
	},
	components: [
		{kind:"Pane", className: "panes", name: "pane", flex: 1, style: "text-align: center", transitionKind:enyo.transitions.Simple, components:[
			{name:"firstlaunch_card", kind: "FirstLaunch", onFirstLaunchDone: "handleFirstLaunchDone"}
		]},
	],
	create: function() {
		this.inherited(arguments);
	},
	handleLaunch: function () {
		//Required
	},
	tabsShowingChanged: function() {
 		//Keep this too
        },
	selectViewByName: function(name, params) {
		this.setTabsShowing(enyo.application.isTablet || name != "activeCall");

                if ( name == "firstlaunch_card" ){
                    enyo.log("cool. we got a request to selectByView FirstLaunch here");
                }

		this.$.pane.selectViewByName(name,true);

		if ( this.$[name].handleLaunch ) {
			this.$[name].handleLaunch(params || {});
		}
	},
	resizeHandler: function(event) {
		this.inherited(arguments);
		return this.delegateToActiveView("resize", event);
	},
	back: function(event) {
		return this.delegateToActiveView("back", event);
	},
	keyup: function(event) {
		return this.delegateToActiveView('keyup', event);
	},
	keydown: function(event) {
		return this.delegateToActiveView('keydown', event);
	},
	// delegates the named event type to the active scene
	// if the scene's handler returns true, it was handled and it default prevented
	delegateToActiveView: function(eventType, event) {
		var activePaneObj = this.$[this.$.pane.getViewName()];
		var handled = activePaneObj && activePaneObj[eventType] && activePaneObj[eventType].apply(activePaneObj, enyo.cloneArray(arguments).slice(1));
		if ( handled ) {
			event.preventDefault();
		}
		return handled;
	},
	getCurrentViewName: function() {
		return this.$.pane.getViewName();
	}, 
        handleFirstLaunchDone: function() {
                enyo.log("DO button got called");
                enyo.application.UI.enter('contactlookup');
        }
});
