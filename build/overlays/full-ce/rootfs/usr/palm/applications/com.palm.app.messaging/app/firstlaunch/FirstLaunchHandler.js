enyo.kind({
	name: "FirstLaunchHandler",
	kind: enyo.Component,
	showFirstLaunch: true,
	components: [
		{name: "checkFirstLaunch", kind: "Accounts.checkFirstLaunch", onCheckFirstLaunchResult: "gotFirstLaunchResult"}
	],
	create: function() {
		this.inherited(arguments);
		this.$.checkFirstLaunch.shouldFirstLaunchBeShown({appId: "com.palm.app.messaging"});
	},
	gotFirstLaunchResult: function(inSender, inResponse) {
		if (inResponse) {
			this.showFirstLaunch = inResponse.showFirstLaunch;
		}
	},
	shouldShowFirstLaunch: function() {
		return this.showFirstLaunch;
	}, 
	migratePrefsSettingIntoAccountService: function(prefs) {
		if (prefs) {
			enyo.log("Migrating first launch setting from messaging app's preferences in to account service");
			if (prefs.firstUseMode === false) {
				// we only need to migrate the preferences setting only when 
				// the app was previously passed first launch and the app used 
				// preferences to keep track of first launch mode.
				this.passedFirstLaunch(); // mark first launch shown
			}
			
			// then clear the first use mode setting 
			prefs.firstUseMode = null;
			enyo.application.prefsHandler.setPrefs(prefs);
		}
	},
	passedFirstLaunch: function() {
		this.showFirstLaunch = false;
		// tell account services that messaging app has shown first launch.
		this.$.checkFirstLaunch.firstLaunchHasBeenShown(true);
	}
});
