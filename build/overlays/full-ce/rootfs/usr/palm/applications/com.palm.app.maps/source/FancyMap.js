enyo.kind({
	name: "FancyMap",
	kind: enyo.Map,
	published: {
		showTraffic: false
	},
	events: {
		onMapMousedown: "",
		onMapMousemove: "",
		onViewChangeEnd: "",
		onViewChangeEndIdle: ""
	},
	components: [
		{kind: "Preferences"}
	],
	rendered: function() {
		this.inherited(arguments);
		try {
			this.mousedownEvent = Microsoft.Maps.Events.addHandler(this.map, 'mousedown', enyo.hitch(this, "doMapMousedown"));
			this.mousemoveEvent = Microsoft.Maps.Events.addHandler(this.map, 'mousemove', enyo.hitch(this, "doMapMousemove"));
			this.viewchangeendEvent = Microsoft.Maps.Events.addHandler(this.map, 'viewchangeend', enyo.hitch(this, "doViewChangeEnd"));
			this.viewchangeendIdleEvent = Microsoft.Maps.Events.addThrottledHandler(this.map, "viewchangeend", enyo.hitch(this, "doViewChangeEndIdle"), 500);
			this.useSavedLocation();
		} catch(e) {}
	},
	destroy: function() {
		if (this.mousedownEvent) {
			Microsoft.Maps.Events.removeHandler(this.mapMousedownEvent);
		}
		if (this.mousemoveEvent) {
			Microsoft.Maps.Events.removeHandler(this.mapMousemoveEvent);
		}
		if (this.viewchangeendEvent) {
			Microsoft.Maps.Events.removeHandler(this.viewchangeendEvent);
		}
		if (this.viewchangeendIdleEvent) {
			Microsoft.Maps.Events.removeHandler(this.viewchangeendIdleEvent);
		}
		this.inherited(arguments);
	},
	removeEntities: function(inEntities) {
		this.map.entities.remove(inEntities);
	},
	clearAll: function(inExcludes) {
		this.inherited(arguments);
		if (this.trafficTileLayer) {
			this.map.entities.push(this.trafficTileLayer);
		}
	},
	createPushpin: function(inLatitude, inLongitude, inOptions, inProps) {
		return this.updatePushpin(null, inLatitude, inLongitude, inOptions, inProps);
	},
	updatePushpin: function(inPushpin, inLatitude, inLongitude, inOptions, inProps) {
		var pushpin = inPushpin, location = new Microsoft.Maps.Location(inLatitude, inLongitude);
		if (!pushpin) {
			pushpin = new Microsoft.Maps.Pushpin(location, inOptions);
			this.map.entities.push(pushpin);
		} else {
			pushpin.setOptions(inOptions);
			pushpin.setLocation(location);
		}
		enyo.mixin(pushpin, inProps);
		pushpin.location = {latitude: inLatitude, longitude: inLongitude};
		return pushpin;
	},
	ensureLocationInView: function(inLocation, inPulloutBounds, inMargin) {
		var locPix = this.map.tryLocationToPixel(inLocation, Microsoft.Maps.PixelReference.control);
		var mb = this.getBounds();
		if (!this.map.getBounds().contains(inLocation) || 
				(locPix.x > inPulloutBounds.left && locPix.x < (inPulloutBounds.left + inPulloutBounds.width)) ||
				(inMargin && (locPix.x < inMargin.x || locPix.x + inMargin.x > mb.width || locPix.y < inMargin.y || locPix.y + inMargin.y > mb.height))) {
			this.setCenter(inLocation.latitude, inLocation.longitude);
		}
	},
	ensureBoundariesInView: function(inBoundaries) {
		var b = this.map.getBounds();
		if (!b.contains(inBoundaries.getNorthwest()) ||
				!b.contains(inBoundaries.getSoutheast())) {
			this.map.setView({
				bounds: inBoundaries
			});
		}
	},
	showTrafficChanged: function() {
		if (this.trafficTileLayer) {
			this.map.entities.remove(this.trafficTileLayer);
			this.trafficTileLayer = null;
		}
		if (this.showTraffic) {
			var time = (new Date()).getTime();
			var tileSource = new Microsoft.Maps.TileSource({uriConstructor: 'http://t0.tiles.virtualearth.net/tiles/t{quadkey}?tc=' + time});
			// Construct the layer using the tile source
			this.trafficTileLayer = new Microsoft.Maps.TileLayer({mercator: tileSource, opacity: .7});
			this.map.entities.push(this.trafficTileLayer);
		}
	},
	useSavedLocation: function() {
		var p = this.$.preferences;
		if (p.get("latitude") && p.get("longitude")) {
			this.setCenter(p.get("latitude"), p.get("longitude"));
			this.setZoom(p.get("zoom"));
		}
	},
	saveLocation: function(inLatitude, inLongitude, inZoom) {
		var c = this.map.getCenter();
		this.$.preferences.set({
			latitude: inLatitude || c.latitude,
			longitude: inLongitude || c.longitude,
			zoom: inZoom || this.getZoom()
		});
	}
})
