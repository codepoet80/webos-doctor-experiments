enyo.kind({
	name: "LocationService",
	kind: enyo.PalmService,
	service: "palm://com.palm.location/"
});

enyo.kind({
	name: "LocationService.GeolocationRequest",
	kind: enyo.Request,
	destroy: function() {
		if (this._watchId) {
			navigator.geolocation.clearWatch(this._watchId);
		}
		this.inherited(arguments);
	},
	call: function() {
		this._watchId = navigator.geolocation.watchPosition(
			enyo.hitch(this, "geolocationSuccess"),
			enyo.hitch(this, "geolocationFailure"),
			{maximumAge:600000, timeout: 10000});
	},
	isFailure: function(inResponse) {
		return this._isFailure;
	},
	geolocationSuccess: function(inPos) {
		this._isFailure = false;
		this.receive({
			errorCode: 0,
			latitude: inPos.coords.latitude,
			longitude: inPos.coords.longitude
		});
	},
	geolocationFailure: function() {
		this._isFailure = true;
		this.receive({errorCode: 1});
	}
});

if (!window.PalmSystem) {
	LocationService.prototype.requestKind = "LocationService.GeolocationRequest";
}
