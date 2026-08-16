enyo.mapsApp = {
	myLocation: $L("Current Location"),
	dropPin: $L("Dropped Pin"),
	bingLocale: enyo.g11n.currentLocale().getLocale().replace("_","-"),
	bingScript: "http://ecn.dev.virtualearth.net/mapcontrol/mapcontrol.ashx?v=7.0&mkt="+this.bingLocale,
	isReservedLabel: function(inValue) {
		return inValue == this.dropPin || inValue == this.myLocation;
	},
	createLocation: function(inInfo) {
		return new Location({
			title: inInfo.title,
			addr: inInfo.address,
			city: inInfo.city,
			state: inInfo.stateOrProvince,
			latitude: inInfo.location && inInfo.location.latitude,
			longitude: inInfo.location && inInfo.location.longitude
		});
	},
	parseLocation: function(inValue) {
		var lat = inValue.substring(0, inValue.indexOf(","));
		var long = inValue.substring(inValue.indexOf(",")+1).replace(" ", "");
		if (!isNaN(Number(lat)) && !isNaN(Number(long))) {
			return {latitude: lat, longitude: long};
		}
	},
	parseLocationToCoords: function(inValue) {
		var loc = this.parseLocation(inValue);
		return [loc.latitude, loc.longitude];
	},
	processLaunchParamsTarget: function(inParams) {
		var t = inParams.target, r;
		if (t) {
			t = decodeURIComponent(t);
			var addr;
			if (t.indexOf("mapto:") == 0) {
				r = true;
				addr = t.substring(6);
			} else if (t.indexOf("maploc:") == 0) {
				addr = t.substring(7);
			}
			if (addr) {
				addr = addr.replace(/^\/\//g, '');
				if (r) {
					inParams.route = {endAddress: addr};
				} else {
					inParams.address = addr;
				}
			} else if (t.match(/^(http|https):\/\/maps\.google\./i)) {
				var g = new GoogleURL(t);
				if (g.routeRequest) {
					inParams.route = {
						startAddress: g.routeRequest.start || '',
						endAddress:   g.routeRequest.end   || ''
					};
				} else if (g.search) {
					inParams.query = g.search;
				} else if (g.coordinates) {
					// old app expects params.location as {lat, lng}
					inParams.location = {lat: g.coordinates.latitude, lng: g.coordinates.longitude};
				} else if (g.near) {
					inParams.address = g.near;
				}
			}
		}
		// Strip Yelp-style trailing coordinates from query (e.g. "Coffee@37.7,-122.4")
		if (inParams.query && inParams.query.match(/@-?\d+\.\d+,-?\d+\.\d+$/)) {
			inParams.query = inParams.query.replace(/@-?\d+\.\d+,-?\d+\.\d+$/, '');
		}
	},
	//Returns a clean string, free of any unicode private use range characters
	//E000: <b>
	//E001: </b>
	unMicrosoftString: function(dirty){
		return dirty.replace(/[\uE000\uE001]/g, "");
	}
}
