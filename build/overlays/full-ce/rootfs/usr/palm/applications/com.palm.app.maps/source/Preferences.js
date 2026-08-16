enyo.kind({
	name: "Preferences",
	kind: enyo.Component,
	cookieName: "enyo-maps-preferences",
	create: function() {
		this.inherited(arguments);
		this.fetch();
	},
	fetch: function() {
		this.preferences = this._fetch();
		return this.preferences;
	},
	_fetch: function() {
		var s = enyo.getCookie(this.cookieName), p = {};
		if (s) {
			var prefs = s.split(";");
			for (var i=0, pref; pref=prefs[i]; i++) {
				var j = pref.indexOf("=");
				p[pref.substring(0, j)] = pref.substring(j+1);
			}
		}
		return p;
	},
	save: function() {
		var s = "";
		for (var p in this.preferences) {
			s += (p + "=" + this.preferences[p] + ";");
		}
		enyo.setCookie(this.cookieName, s);
	},
	get: function(inName) {
		return this.preferences[inName];
	},
	set: function(inPrefs) {
		for (var p in inPrefs) {
			this.preferences[p] = inPrefs[p];
		}
		this.save();
	},
	clear: function() {
		this.preferences = {};
		enyo.setCookie(this.cookieName, "");
	}
});
