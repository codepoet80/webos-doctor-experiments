enyo.kind({
	name: "PrefsHandler",
	kind: enyo.Component,
	published: {
		prefs: undefined
	},
	components: [
		{kind: "DbService", dbKind: "com.palm.app.messagingprefs:1", components: [
			{name: "prefsGetter", method: "find", onSuccess: "_gotPrefs", subscribe: true, resubscribe: true, reCallWatches: true},
			{name: "prefsPutter", method: "put"},
			{name: "prefsMerger", method: "merge"}
		]},
		{name: "mockDbFinder", kind: "MockDb", dbKind: "prefs/com.palm.app.messagingprefs:1", method: "find", onSuccess: "_gotPrefs", subscribe: true, resubscribe: true, reCallWatches: true}
	],
	create: function() {
		this.inherited(arguments);
		this._getPrefs();
		this._notifier = new Notifier(this.prefs);
	},
	_getPrefs: function() {
		if (window.PalmSystem) {
			this.$.prefsGetter.cancel();
			this.$.prefsGetter.call();
		} else {
			this.$.mockDbFinder.call();
		}
	},
	_gotPrefs: function(inSender, inResponse){
		if (!inResponse || !inResponse.results || inResponse.results.length === 0) {
			// no preferences exist, so create a default preferences record in db.
			enyo.log("******** Messaging prefs doesn't exist in database, so create default prefs in database");
			
			this.prefs = this._getDefaultPrefs();
			this._putPrefs();
		} else {
			this.prefs = inResponse.results[0];
			// remove db system properties
			delete this.prefs._kind;
			delete this.prefs._rev;
			delete this.prefs._sync;
			
			// migrate first launch mode setting from preferences into account service
			if (this.prefs.firstUseMode !== undefined && this.prefs.firstUseMode !== null) {
				enyo.application.firstLaunchHandler.migratePrefsSettingIntoAccountService(this.prefs);
			}
			
			this._notify();
		}
	},
	_getDefaultPrefs: function() {
		return {
			"_kind": "com.palm.app.messagingprefs:1",
			"enableNotification": true,
			"notificationSound":"system",
			"notifyMaxAgeMinutes": 60,
			"ringtone": {},
			"isHistoryViewSelected": true,
			"showOnlineBuddiesOnly": true,
			"useImmediateMmsRetrieval": true,
			"firstUseMode": true
		};
	},
	prefsChanged: function() {
		this.$.prefsMerger.call({
			objects: [this.prefs]
		});
	},
	_putPrefs: function() {
		this.$.prefsPutter.call({
			objects: [this.prefs]
		});
	},
	_notify: function() {
		//enyo.log("------------##### notifying prefs changes: ", this.prefs);
		this._notifier.notify(this.prefs);
	},
	register: function(listener, callback) {
		this._notifier.register(listener, callback);
	},
	unregister: function(listener) {
		this._notifier.unregister(listener);
	}
});
