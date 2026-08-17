enyo.kind({
	name: "TelephonyService",
	kind: enyo.Component,
	connected: false,
	components: [
		{name: "telephony", kind: "PalmService", service: "palm://com.palm.telephony/", method: "platformQuery", onSuccess: "gotPlatformData", subscribe: true}
	],
	create: function() {
		this.inherited(arguments);
		this.$.telephony.call();
		this._notifier = new Notifier(this.connected);
	},
	gotPlatformData: function(inSender, inResponse) {
		enyo.log("------------ platformDate: ", inResponse);
		this.connected = inResponse && inResponse.extended && inResponse.extended.capabilities && inResponse.extended.capabilities.mapcenable;
		this._notify();
	},
	_notify: function() {
		//enyo.log("------------##### notifying phone connected changes: ", this.connected);
		this._notifier.notify(this.connected);
	},
	register: function(listener, callback) {
		this._notifier.register(listener, callback);
	},
	unregister: function(listener) {
		this._notifier.unregister(listener);
	}
});