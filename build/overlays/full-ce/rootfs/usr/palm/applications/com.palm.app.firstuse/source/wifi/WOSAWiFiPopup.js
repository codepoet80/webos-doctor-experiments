// webOS Archive: ConMan's own internet-reachability probe on a freshly-joined
// network commonly takes ~25s to converge. Stock WiFiConfig.handleNetworkStatusResponse
// treats "wifi connected but the probe still says no" exactly like a dead
// network and fires a "NoInternet" view change on the very first such report,
// so the popup jumps straight to "No Internet Connection: Try another
// network" -- which then just gets closed out from under the user once
// FirstUse's own connection tracking (conManCallback/requirementRestored)
// notices the real internet connection has arrived. During OOBE, with no
// window chrome to hint anything else is going on, that reads as a false
// alarm indistinguishable from a real dead network.
//
// Fix scoped to our own OOBE flow only (this subclasses WiFiPopup, not the
// shared $enyo-lib/wifi framework file itself, so the system's own Wi-Fi
// Settings app is untouched): debounce the "NoInternet" transition. The
// framework already defines a "TestingInternet" view ("Checking internet
// connectivity...") that nothing ever wires up -- use it for the grace
// window, and only escalate to the real warning if the probe is still
// stuck once the window elapses. A genuinely bad network still gets the
// same warning as before, just after giving normal convergence room to work.
enyo.kind({
	name: "MyApps.FirstUse.WiFiPopup",
	kind: "WiFiPopup",

	wosaNoInternetGraceMs: 30000,

	updatePopup: function(inSender, inViewName) {
		var args = arguments;
		if ("NoInternet" === inViewName) {
			if (this.wosaNoInternetTimer) {
				return; // already waiting out the grace window
			}
			this.wosaNoInternetTimer = setTimeout(enyo.bind(this, function() {
				this.wosaNoInternetTimer = null;
				this.inherited(args, [inSender, "NoInternet"]);
			}), this.wosaNoInternetGraceMs);
			return this.inherited(args, [inSender, "TestingInternet"]);
		}
		this.wosaClearNoInternetTimer();
		return this.inherited(args);
	},

	wosaClearNoInternetTimer: function() {
		if (this.wosaNoInternetTimer) {
			clearTimeout(this.wosaNoInternetTimer);
			this.wosaNoInternetTimer = null;
		}
	},

	destroy: function() {
		this.wosaClearNoInternetTimer();
		this.inherited(arguments);
	}
});
