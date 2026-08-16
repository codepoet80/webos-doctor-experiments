/**
Maps application.

Accepts the following window params:

	query: The query used to search for places or location.
	address: The address location used to center the map view.
	location: 
		lat: The latitude of the location used to center the map view.
		lng: The longitde of the location used to center the map view.
	route:
		startAddress: The address of the starting waypoint for a route.
		endAddress: The address of the ending waypoint for a route.
	zoom: The zoom level of the map view.
	mapType: The map type of the map view.  Valid map types are aerial, auto, birdseye, collinsBart, mercator, ordnanceSurvey and road.
	target: mapto or maploc with address in URL encoded format, e.g. mapto://303%20Second%20Street%2C%20San%20Francisco

*/
enyo.kind({
	name: "MapsApp", 
	kind: enyo.VFlexBox,
	components: [
		{name: "placesSearch", kind: "PlacesSearchService",
			onSuccess: "placesSearchSuccess", 
			onFailure: "placesSearchFailure"},
		{name: "locationSearch", kind: "LocationSearchService", 
			onSuccess: "locationSearchSuccess", 
			onFailure: "locationSearchFailure"},
		{name: "pinLocationSearch", kind: "LocationSearchService", 
			onSuccess: "pinLocationSearchSuccess"},
		{name: "currentLocation", kind: "LocationService",
			method: "getCurrentPosition",
			onSuccess: "currentLocationSuccess",
			onFailure: "currentLocationFailure"},
		{name: "trackLocation", kind: "LocationService",
			method: "startTracking",
			subscribe: true,
			onSuccess: "currentLocationSuccess",
			onFailure: "currentLocationFailure"},
		{name: "connectionStatus", kind: "PalmService",
			service: "palm://com.palm.connectionmanager/",
			method: 'getstatus',
			subscribe: true,
			onSuccess: "connectionStatusSuccess"},
		{name: "openApp", kind: "PalmService",
			service: enyo.palmServices.application,
			method: "open"},
		{kind: "ApplicationEvents", onWindowParamsChange: "windowParamsChange", onWindowActivated: "windowActivated", onWindowDeactivated: "windowDeactivated"},
		{kind: "ActionBar", onSearch: "placesSearch", onRoute: "route", onMenu: "showSettings", onSaves: "showSaves", onCurrentLocation: "currentLocation", onModeChange: "modeChange", onSaveRecent: "saveRecent", onInputClear: "clearAll"},
		{name: "map", kind: "FancyMap", flex: 1, className: "maps", onPinClick: "pinLocationSearch",  onMapMousedown: "mapMousedown", onMapMousemove: "mapMousemove", onViewChangeEnd: "mapViewChangeEnd", onViewChangeEndIdle: "mapViewChangeEndIdel"},
		{name: "noWifi", showing: false, flex: 1, className: "no-wifi"},
		{className: "bing-logo-mask"},
		{kind: "InfoFooter", showing: false, onSelect: "infoSelect", onInfoClick: "infoClick", onResultsClick: "resultsClick"},
		{name: "rightPullout", kind: "Pullout", style: "width: 320px; top: 56px; bottom: 0;", className: "enyo-bg", flyInFrom: "right", onOpen: "pulloutToggle", onClose: "closeRightPullout", components: [
			{name: "rightPane", kind: "Pane", flex: 1, components: [
				{kind: "Settings", flex: 1, onShowTraffic: "trafficToggle", onDropPinToggle: "dropPinToggle", onMapTypeChange: "mapTypeChange", onClearAll: "clearAll"},
				{kind: "Saves", flex: 1, onSelect: "savesSelect"}
			]}
		]},
		{name: "leftPullout", kind: "Pullout", style: "width: 320px; top: 56px; bottom: 0;", className: "enyo-bg", flyInFrom: "left", onOpen: "pulloutToggle", onClose: "closeLeftPullout", onBypassClose: "leftPulloutBypassClose", components: [
			{name: "leftPane", kind: "Pane", flex: 1, components: [
				{kind: "SearchResults", onSelect: "searchResultSelect"},
				{kind: "Route", onReceive: "routeReceive", onItinerarySelect: "routeItinerarySelect", onModeChange: "routeModeChange"}
			]}
		]},
		{kind: "InfoBox", onFromDirection: "infoBoxFromDirection", onToDirection: "infoBoxToDirection", onBookmark: "infoBoxBookmark", onPhone: "infoBoxPhone"},
		{kind: "TitleBox"},
		{kind: "Alert"},
		{kind: "BookmarkPrompt", onSave: "saveBookmark"},
		{kind: "LocationServicesPrompt", onLocationServicesLaunched: "locationServicesLaunched", onCancel: "LocateMeCancel"},
		{kind: "MyLocationPrompt", onLocateMe: "locateMeAndRoute", onCancel: "LocateMeCancel"},
		{kind: "DirectionPrompt", onFromDirection: "promptFromDirection", onToDirection: "promptToDirection"},
		{kind: "Helpers.Updater", name: "updater", handleUI: false, onUpdateFound: "updateFound"},
		{kind: "AppMenu", components: [
			{caption: $L("Check for Updates"), onclick: "checkForUpdates"},
			{caption: $L("Microsoft Terms of Use"), onclick: "microsoftLicenseClick"},
			{caption: $L("Bing Maps Terms of Use"), onclick: "bingLicenseClick"},
			{caption: $L("Help"), onclick: "helpClick"}
		]}
	],
	bingMapAppId: "Ah2oavKf-raTJYVgMxnxJg9E2E2_53Wb3jz2lD4N415EFSKwFlhlMe9U2dJpMZyJ",  // Bing Maps
	bingApiAppId: "D7819411124F1FE57C72D3DB61E03F47470F143A",  // Bing API
	create: function() {
		this.inherited(arguments);
		enyo.keyboard.setResizesWindow(false);
		this.$.map.setCredentials(this.bingMapAppId);
		this.$.route.setCredentials(this.bingMapAppId);
		this.$.updater.CheckForUpdate("Maps");
	},
	rendered: function() {
		this.checkInternetConnection();
		this.inherited(arguments);
	},
	windowParamsChange: function() {
		var params = window.PalmSystem ? enyo.windowParams : this.processQueryString();
		if (this.$.map && params) {
			//this.log(enyo.json.to(params));
			var lc = true;
			enyo.mapsApp.processLaunchParamsTarget(params);
			if (params.query) {
				this.searchMap(params.query);
			} else if (params.address) {
				this.searchMap(params.address);
			} else if (params.location) {
				this.searchMap(params.location.lat + ", " + params.location.lng);
			} else if (params.route) {
				this.routeMap(params.route.startAddress, params.route.endAddress);
			} else {
				lc = false;
			}
			if (params.zoom) {
				this.launchZoom = params.zoom;
				this.$.map.setZoom(params.zoom);
			}
			params.mapType && this.$.map.setMapType(params.mapType);
			setTimeout(enyo.hitch(this, function() {
				if (!lc && this.$.map.hasMap() && this.$.map.showing) {
					enyo.asyncMethod(this, "locateMe");
				}
			}), 3000);
		}
	},
	processQueryString: function() {
		var q = location.search.slice(1), queryArgs = {};
		if (q) {
			var args = q.split("&");
			for (var i=0, a, nv; a=args[i]; i++) {
				var nv = args[i] = a.split("=");
				if (nv) {
					queryArgs[nv[0]] = unescape(nv[1]);
				}
			}
		}
		return queryArgs;
	},
	windowActivated: function() {
		this.currentLocatonDeactivated = false;
		if (this.needRouteAfter) {
			this.needRouteAfter = false;
			this.locateMeAndRoute();
		}
	},
	windowDeactivated: function() {
		this.currentLocatonDeactivated = true;
	},
	searchMap: function(inSearchValue) {
		this.$.actionBar.setMode(0);
		this.$.actionBar.setSearchInputValue(inSearchValue);
	},
	routeMap: function(inStartValue, inEndValue) {
		inStartValue && this.$.actionBar.setStartInputValue(inStartValue);
		inEndValue && this.$.actionBar.setEndInputValue(inEndValue);
		this.$.actionBar.setMode(1);
	},
	checkInternetConnection: function() {
		if (window.PalmSystem) {
			this.$.connectionStatus.call();
		} else {
			if (!window["Microsoft"] && !Microsoft.Maps) {
				this.connectionStatusSuccess(null, {isInternetConnectionAvailable: false});
			}
		}
	},
	connectionStatusSuccess: function(inSender, inResponse) {
		var avail = inResponse.isInternetConnectionAvailable;
		this.$.map.setShowing(avail);
		this.$.noWifi.setShowing(!avail);
		if (avail) {
			this.$.connectionStatus.cancel();
			if (this._noInternet) {
				this._noInternet = false;
				this.$.alert.close();
				this.reloadMap();
			}
		} else {
			this._noInternet = true;
		}
	},
	reloadMap: function() {
		window.location.reload();
	},
	checkMap: function() {
		if (this.$.map.showing) {
			return true;
		}
		this.$.alert.showMessage($L("No Internet Connection."));
	},
	mapMousedown: function() {
		this.closePopups();
		this.closePulloutsExceptRoute();
	},
	mapMousemove: function() {
		this._centerCurrentLocation = false;
	},
	mapViewChangeEnd: function() {
		if (this.$.infoBox.isOpen) {
			this.$.infoBox.close();
			this.openInfoBoxAt();
		} else if (this.$.titleBox.isOpen) {
			this.$.titleBox.close();
			this.openTitleBoxAt();
		}
	},
	mapViewChangeEndIdel: function() {
		this.setActiveSearchPin(this._lastSearchPushpin, true); 
	},
	closePopups: function() {
 		this.$.infoBox.close();
		this.$.titleBox.close();
		this.$.actionBar.closeInputAssist();
		this.$.alert.close();
	},
	openRightPullout: function(inViewName) {
		this.closeLeftPullout();
		var vn = enyo.isString(inViewName) ? inViewName : "";
		this.$.rightPullout.open();
		this.$.rightPane.selectViewByName(vn || "settings");
	},
	closeRightPullout: function() {
		this.$.rightPullout.close();
		this.pulloutToggle();
	},
	openLeftPullout: function(inViewName) {
		this.closeRightPullout();
		this.$.leftPullout.open();
		this.$.leftPane.selectViewByName(inViewName);
	},
	closeLeftPullout: function() {
		this.$.leftPullout.close();
		this.pulloutToggle();
	},
	closePullouts: function() {
		this.closeLeftPullout();
		this.closeRightPullout();
	},
	closePulloutsExceptRoute: function() {
		this.closeRightPullout();
		if (!this.$.actionBar.getMode()) {
			this.closeLeftPullout();
		}
	},
	leftPulloutBypassClose: function(inSender, inEvent) {
		if (inEvent && inEvent.dispatchTarget == this.$.map) {
			return true;
		}
	},
	pulloutToggle: function() {
		this.$.infoFooter.setShowing(!this.$.rightPullout.isOpen && !this.$.leftPullout.isOpen);
	},
	calcPulloutBounds: function() {
		var b = {};
		if (this.$.rightPullout.isOpen) {
			b = this.$.rightPullout.getBounds();
		} else if (this.$.leftPullout.isOpen) {
			b = this.$.leftPullout.getBounds();
		}
		return b;
	}, 
	showSettings: function() {
		if (!this.$.rightPullout.showing || this.$.rightPane.getViewName() !== "settings") {
			this.openRightPullout("settings");
		} else {
			this.closeRightPullout();
		}
	},
	showSaves: function() {
		this.$.saves.setShowMyLocationPin(!this.neverUseCurrentLocation);
		if (!this.$.rightPullout.showing || this.$.rightPane.getViewName() !== "saves") {
			this.openRightPullout("saves");
		} else {
			this.closeRightPullout();
		}
	},
	modeChange: function(inSender, inValue) {
		this.$.leftPullout.close();
		if (inValue == 1) {
			if (!this.neverUseCurrentLocation && this.$.actionBar.isStartInputEmpty()) {
				this.$.actionBar.setStartInputValue(enyo.mapsApp.myLocation);
			}
			this.updateInputsForMyLocation();
			if (this._lastSearchPushpin && !this.dropPinDirection) {
				this.$.actionBar.setEndInputValue(enyo.mapsApp.createLocation(this._lastSearchPushpin));
			}
			this.dropPinDirection = false;
			this.$.actionBar.routeOrFocusInput();
		} else {
			this.clearRoute();
			this.$.infoFooter.setInfos("SearchResultsInfo", this.$.searchResults.results);
			this._lastSearchPushpin && this.$.infoFooter.setInfoByIndex(this._lastSearchPushpin.index);
		}
	},
	mapTypeChange: function(inSender, inValue) {
		this.closePullouts(); 
		this.$.map.setMapType(inValue);
	},
	clearAll: function() {
		this.$.map.clearAll([this.currLocPushpin, this.trafficTileLayer]);
		this.$.searchResults.clear();
		this.$.route.clear();
		this._lastSearchPushpin = null;
		this.routeItineraryPin = null;
		this.$.infoFooter.clear();
		this._centerCurrentLocation = false;
	},
	clearRoute: function() {
		this.$.route.clear();
		this.$.map.removeEntities(this.routeLines);
		this.$.map.removeEntities(this.routeItineraryPin);
		this.$.map.removeEntities(this.startPushpin);
		this.$.map.removeEntities(this.endPushpin);
		this.routeItineraryPin = null;
		this.startPushpin = null;
		this.endPushpin = null;
		this._centerCurrentLocation = false;
	},
	clearSearchResults: function() {
		if (this.searchResultPushpins) {
			for (var i=0, p; p=this.searchResultPushpins[i]; i++) {
				this.$.map.removeEntities(p);
			}
			this.searchResultPushpins = [];
			this.$.searchResults.clear();
			this._lastSearchPushpin = null;
		}
	},
	toSearchableString: function(inValue) {
		this.showLocationSearchResultPin = false;
		if (inValue == enyo.mapsApp.dropPin) {
			return this.pinAddress;
		} else if (inValue == enyo.mapsApp.myLocation) {
			if (!this.currLocPushpin && !this.neverUseCurrentLocation) {
				this.$.myLocationPrompt.openAtCenter();
				return;
			}
			var l = this.currLocPushpin.getLocation();
			return l.latitude + ", " + l.longitude;
		}
		this.showLocationSearchResultPin = true;
		return inValue;
	},
	saveRecent: function(inSender, inValue) {
		this.$.saves.addRecent(inValue);
	},
	setActiveSearchPin: function(inPushpin, inActive, inOptions) {
		if (!inPushpin) {
			return;
		}
		var icon = inActive ? "images/poi_active.png" : "images/poi_search.png";
		var zIndex = inActive ? 1 : null;
		var options = enyo.mixin({icon: icon, height: 48, width: 48, zIndex: zIndex}, inOptions);
		inPushpin.setOptions(options);
	},
	openInfoBox: function(inHighlight, e) {
		if (inHighlight) {
			this.highlightPushpin(e.target);
		}
		this.$.infoBox.setInfo(e.target);
		e.originalEvent && e.originalEvent.stopPropagation && e.originalEvent.stopPropagation();
		if (inHighlight && this.$.actionBar.getMode()) {
			this.infoBoxToDirection(this.$.infoBox);
			this.openTitleBoxAt(e.target.getLocation(), e.target.title);
		} else {
			this.openInfoBoxAt();
		}
	},
	openInfoBoxAt: function() {
		this.openPopupAt(this.$.infoBox, this.$.infoBox.info.getLocation());
	},
	openTitleBoxAt: function(inLocation, inTitle) {
		inTitle && this.$.titleBox.setTitle(inTitle);
		inLocation && this.$.titleBox.setLocation(inLocation);
		if (inTitle) {
			this.openPopupAt(this.$.titleBox, this.$.titleBox.location);
		}
	},
	openPopupAt: function(inPopup, inLocation) {
		var pix = this.$.map.hasMap().tryLocationToPixel(inLocation, Microsoft.Maps.PixelReference.control);
		var d = {left: pix.x + 15, top: pix.y, width: 30};
		inPopup.openNear(d);
	},
	infoBoxFromDirection: function(infoBox) {
		this.infoBoxDirection(infoBox, "Start");
	},
	infoBoxToDirection: function(infoBox) {
		this.infoBoxDirection(infoBox, "End");
	},
	infoBoxDirection: function(infoBox, inDirection) {
		var loc = infoBox.getLocation();
		this.$.actionBar["set" + inDirection + "InputValue"](loc);
		if (this.$.actionBar.getMode()) {
			this.$.actionBar.routeOrFocusInput();
		} else {
			this.dropPinDirection = (loc.title == enyo.mapsApp.dropPin);
			this.$.actionBar.setMode(1);
		}
		this.$.infoBox.close();
	},
	infoBoxBookmark: function(infoBox) {
		this.$.infoBox.close();
		var loc = infoBox.getLocation();
		this.$.bookmarkPrompt.openAtCenter();
		this.$.bookmarkPrompt.setValue(loc.getSavedName());
		this.$.bookmarkPrompt.setLocation(loc);
	},
	infoBoxPhone: function(inSender, inPhoneNumber) {
		this.$.openApp.call({id: "com.palm.app.phone", params: {
			number: inPhoneNumber
		}});
	},
	saveBookmark: function(inSender) {
		this.$.saves.addBookmark(inSender.getValue(), inSender.getLocation());
	},
	savesSelect: function(inSender, inValue, inTitle, inAddr) {
		var m = this.$.actionBar.getMode();
		var v = inTitle ? enyo.mapsApp.createLocation({title: inTitle, address: inAddr, location: enyo.mapsApp.parseLocation(inValue)}) : inValue;
		if (m) {
			this.$.directionPrompt.setValue(v);
			this.$.directionPrompt.openAtCenter();
		} else {
			this.$.actionBar.setSearchInputValue(v);
			this.closePullouts();
		}
	},
	promptFromDirection: function(inSender) {
		this.$.actionBar.setStartInputValue(inSender.value);
		this.afterPromptDirection(inSender);
	},
	promptToDirection: function(inSender) {
		this.$.actionBar.setEndInputValue(inSender.value);
		this.afterPromptDirection(inSender);
	},
	afterPromptDirection: function(inSender) {
		this.closePullouts();
		inSender.close();
		this.clearAll();
	},
	dropPinToggle: function(inSender, inValue) {
		this.closePullouts();
		var loc = this.$.map.hasMap().getCenter();
		this.$.map.setCenter(loc.latitude, loc.longitude);
		this.$.map.setShowPin(inValue);
		if (inValue) {
			this.pinLocationSearch(null, null, loc);
		}
	},
	pinLocationSearch: function(inSender, e, inLocation) {
		var loc = e ? e.target.getLocation() : inLocation;
		var params = {
			key: this.bingMapAppId,
			latitude: loc.latitude,
			longitude: loc.longitude
		}
		var res = this.$.pinLocationSearch.call(params);
		res.e = e;
	},
	pinLocationSearchSuccess: function(inSender, inResponse, inRequest) {
		// Set the map view using the returned bounding box
		var name = inResponse.name;
		this.pinAddress = name;
		var e = inRequest.e;
		if (e) {
			e.target.title = e.target.title || enyo.mapsApp.dropPin;
			e.target.address = name;
			e.target.location = {latitude: inResponse.point.coordinates[0], longitude: inResponse.point.coordinates[1]};
			e.target.rating = -1;
			this.openInfoBox(false, e);
		}
	},
	placesSearch: function(inSender, inValue, inLocation) {
		if (!this.checkMap()) {
			return;
		}
		this.clearAll();
		var latitude = this.$.map.hasMap().getCenter().latitude;
		var longitude = this.$.map.hasMap().getCenter().longitude;
		var q = this.searchValue = this.toSearchableString(inValue);
		this.searchLocation = inLocation;
		var params = {
			AppId: this.bingApiAppId,
			Latitude: latitude,
			Longitude: longitude,
			Query: q
		};
		var r = this.$.placesSearch.call(params);
	},
	placesSearchSuccess: function(inSender, inResponse) {
		var result = inResponse.SearchResponse;
		if (result && result.Phonebook && result.Phonebook.Results) {
			var res = result.Phonebook.Results, firstPin;
			this.searchResultPushpins = [];
			for (var i=0, r; r=res[i]; i++) {
				var options = {
					text: String(i+1),
					icon: "images/poi_search.png",
					height: 48,
					width: 48
				};
				var props = {
					title: enyo.mapsApp.unMicrosoftString(r.Title),
              		address: r.Address,
					city: r.City,
					stateOrProvince: r.StateOrProvince,
					phoneNumber: r.PhoneNumber,
					link: r.DisplayUrl,
					rating: r.UserRating,
					index: i
				}
				var pushpin = this.$.map.createPushpin(r.Latitude, r.Longitude, options, props);
				this.searchResultPushpins.push(pushpin);
				if (i == 0) {
					this.$.map.ensureLocationInView(pushpin.getLocation(), this.calcPulloutBounds());
					firstPin = pushpin;
				}
				r.pushpin = pushpin;
				r.index = i;
              	Microsoft.Maps.Events.addHandler(pushpin, 'click', enyo.hitch(this, "openInfoBox", true));
			}
			this.$.searchResults.renderResults(res);
			this.$.infoFooter.setInfos("SearchResultsInfo", res);
			this.highlightPushpin(firstPin);
			this.pulloutToggle();
			this.$.map.saveLocation();
		} else {
			this.$.searchResults.renderResults([]);
			this.$.infoFooter.setInfos("SearchResultsInfo", []);
			this.locationSearch(this.searchValue);
		}
	},
	placesSearchFailure: function(inSender, inResponse) {
		console.log("Places Search failure.");
	},
	locationSearch: function(inValue) {
		var params = {
			query: inValue,
			key: this.bingMapAppId
		};
		this.$.locationSearch.call(params);
	},
	locationSearchSuccess: function(inSender, inResponse, inRequest) {
		// Set the map view using the returned bounding box
		var res = inResponse;
		if (!this.isValidLocationSearchResponse(inResponse, inRequest)) {
			return;
		}
		var bbox = res.bbox;
		var viewBoundaries = Microsoft.Maps.LocationRect.fromLocations(
			new Microsoft.Maps.Location(bbox[0], bbox[1]), 
			new Microsoft.Maps.Location(bbox[2], bbox[3])
		);
		this.$.map.hasMap().setView({
			bounds: viewBoundaries
		});
		if (res.entityType == "GeoEntity" && this.launchZoom) {
			this.$.map.setZoom(this.launchZoom);
			this.launchZoom = null;
		}
		// Add a pushpin at the found location
		if (this.showLocationSearchResultPin) {
			var t = res.entityType == "GeoEntity" ? this.$.actionBar.getSearchInputDisplayValue() : res.name;
			var props = {
				title: this.searchLocation && this.searchLocation.addr ? this.searchLocation.title : "",
				address: this.searchLocation && this.searchLocation.addr ? this.searchLocation.addr : t
			};
			var pushpin = this.$.map.createPushpin(res.point.coordinates[0], res.point.coordinates[1], null, props);
			Microsoft.Maps.Events.addHandler(pushpin, 'click', enyo.hitch(this, "openInfoBox", true));
			this.highlightPushpin(pushpin);
		}
		this.$.map.saveLocation();
	},
	locationSearchFailure: function(inSender, inResponse) {
		console.log("Location Search failure.");
	},
	isValidLocationSearchResponse: function(inResponse, inRequest) {
		if (!inResponse || !inResponse.bbox) {
			if (inRequest && inRequest.xhr && !inRequest.xhr.status) {
				thsi.$.alert.showMessage($L("No Internet Connection."))
			} else {
				this.$.alert.showMessage($L("No results found."));
			}
			return false;
		}
		return true;
	},
	locateMeAndRoute: function() {
		this.locateMe("routeAfterLocateMe");
	},
	routeAfterLocateMe: function() {
		if (this.$.actionBar.getMode()) {
			this.$.actionBar.routeOrFocusInput();
		}
	},
	locateMe: function(inCallback) {
		if (this.$.map.showing) {
			this.$.actionBar.setLocationOn(true);
			this.currentLocation(null, inCallback);
		}
	},
	LocateMeCancel: function() {
		this.neverUseCurrentLocation = true;
		this.updateInputsForMyLocation();
	},
	updateInputsForMyLocation: function(inRemove) {
		if (this.neverUseCurrentLocation || inRemove) {
			if (this.$.actionBar.isStartInputMyLocationPin()) {
				this.$.actionBar.setStartInputValue("");
			}
			if (this.$.actionBar.isEndInputMyLocationPin()) {
				this.$.actionBar.setEndInputValue("");
			}
		}
	},
	currentLocation: function(inSender, inCallback) {
		if (!this.checkMap()) {
			this.$.actionBar.setLocationOn(false);
			return;
		}
		if (!this.currLocPushpin) {
			var r = this.$.currentLocation.call({accuracy: 3, responseTime: 1});
			r._callbackMethod = inCallback;
		} else {
			var l = this.currLocPushpin.getLocation();
			this.$.map.setCenter(l.latitude, l.longitude);
			this._centerCurrentLocation = true;
		}
	},
	stopCurrentLocation: function() {
		this.$.trackLocation.cancel();
		if (this.currLocPushpin) {
			this.$.map.removeEntities(this.currLocPushpin);
			this.currLocPushpin = null;
		}
	},
	currentLocationSuccess: function(inSender, inResponse, inRequest) {
		//this.log("Current Location success. errorCode: " + inResponse.errorCode);
		// errorCode should be 0, if not, don't handle it
		if (inResponse.errorCode != 0 || this.currentLocatonDeactivated) {
			return;
		}
		//this.log("received current location, going to adjust location pin.");
		this.neverUseCurrentLocation = false;
		if (!this.currLocPushpin) {
			this._centerCurrentLocation = true;
			this.$.map.setCenter(inResponse.latitude, inResponse.longitude);
			if (this.$.map.getZoom() < 14) {
				this.$.map.setZoom(14);
			}
			this.currLocPushpin = this.$.map.createPushpin(inResponse.latitude, inResponse.longitude,
				{icon: "images/mylocation.png", height: 48, width: 48, anchor: new Microsoft.Maps.Point(24, 24)},
				{title: enyo.mapsApp.myLocation});
			Microsoft.Maps.Events.addHandler(this.currLocPushpin, 'click', enyo.hitch(this, "pinLocationSearch", false));
		} else {
			var location = new Microsoft.Maps.Location(inResponse.latitude, inResponse.longitude);
			this.currLocPushpin.setLocation(location);
			if (this._centerCurrentLocation) {
				this.$.map.setCenter(inResponse.latitude, inResponse.longitude);
			}
		}
		//this.log("location response: latitude: " + inResponse.latitude + ", longitude: " + inResponse.longitude);
		if (inSender.method == "getCurrentPosition" && window.PalmSystem) {
			//this.log("start tracking");
			this.$.trackLocation.call();
		}
		if (inRequest._callbackMethod) {
			enyo.call(this, inRequest._callbackMethod);
			inRequest._callbackMethod = null;
		}
		this.$.map.saveLocation();
	},
	currentLocationFailure: function(inSender, inResponse) {
		console.log("Current Location failure. errorCode: " + inResponse.errorCode);
		// errorCode 4 means not ready yet — retry on next poll, do nothing now.
		// errorCode 1 is a recoverable transient failure.
		// All other codes (5 = service dead, 8 = permanently disabled, etc.)
		// mean the location hardware is not available on this device.
		if (inResponse.errorCode != 4) {
			this.$.actionBar.setLocationOn(false);
			this.stopCurrentLocation();
			var isPermanent = (inResponse.errorCode !== 1);
			this.neverUseCurrentLocation = isPermanent;
			if (isPermanent) {
				// Palm location is dead — try IP geolocation as a silent fallback
				this.tryIPGeolocation();
			} else if (window.PalmSystem) {
				this.$.locationServicesPrompt.openAtCenter();
			} else {
				this.$.alert.showMessage($L("Your current location is unavailable."));
				this.updateInputsForMyLocation(true);
			}
		}
	},
	tryIPGeolocation: function() {
		var self = this;
		var xhr = new XMLHttpRequest();
		// Call ip-api.com directly from the device — free, no key, CORS-enabled,
		// plain HTTP (no TLS issues on older webOS WebKit).
		xhr.open("GET", "http://ip-api.com/json?fields=status,lat,lon", true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState !== 4) return;
			if (xhr.status === 200) {
				try {
					var data = JSON.parse(xhr.responseText);
					if (data.status === "success" && (data.lat || data.lat === 0) && (data.lon || data.lon === 0)) {
						self.currentLocationSuccess(null, {
							errorCode: 0,
							latitude:  data.lat,
							longitude: data.lon
						}, {});
						return;
					}
				} catch (e) {}
			}
			// IP geolocation also failed — leave map at default view, no pin.
			self.updateInputsForMyLocation(true);
		};
		xhr.send();
	},
	locationServicesLaunched: function() {
		this.needRouteAfter = true;
	},
	searchResultSelect: function(inSender, inResult) {
		this.$.leftPullout.close();
		this.openInfoBox(true, {target: inResult.pushpin});
	},
	searchResultInfoSelect: function(inSender, inResult) {
		this.highlightPushpin(inResult.pushpin);
	},
	highlightPushpin: function(inPushpin) {
		this.setActiveSearchPin(this._lastSearchPushpin, false);
		this.setActiveSearchPin(inPushpin, true);
		this._lastSearchPushpin = inPushpin;
		if (!this.$.actionBar.getMode() && inPushpin.index !== undefined) {
			this.$.searchResults.selectItem(inPushpin.index);
			this.$.infoFooter.setInfoByIndex(inPushpin.index);
		}
		var loc = inPushpin.getLocation();
		this._centerCurrentLocation = false;
		this.$.map.ensureLocationInView(loc, this.calcPulloutBounds(), {x: 50, y: 50});
	},
	routeModeChange: function() {
		this.clearRoute();
	},
	route: function(inSender, inStart, inEnd, inStartLabel, inEndLabel) {
		this.clearRoute();
		this.$.route.setStartAddress(this.toSearchableString(inStart));
		this.$.route.setStartLabel(inStartLabel || inStart);
		this.$.route.setEndAddress(this.toSearchableString(inEnd));
		this.$.route.setEndLabel(inEndLabel || inEnd);
		this.$.route.route();
	},
	routeReceive: function(inSender, inResponse, inItineraryItems, inStartAddress, inEndAddress) {
		var bbox = inResponse && inResponse.bbox;
		if (!bbox) {
			this.$.infoFooter.setInfos("ItineraryInfo", inItineraryItems);
			if (!inItineraryItems || inItineraryItems.length == 0) {
				this.$.alert.showMessage($L("No route information."));
				this.clearAll();
			}
			this.pulloutToggle();
			return;
		}
		// Set the pushpins
		this.setRoutePushpins(inResponse.routeLegs[0], inStartAddress, inEndAddress);
		// Set the map view
		this.routeBoundaries = Microsoft.Maps.LocationRect.fromLocations(
			new Microsoft.Maps.Location(bbox[0], bbox[1]), 
			new Microsoft.Maps.Location(bbox[2], bbox[3])
		);
		this.$.map.ensureBoundariesInView(this.routeBoundaries);
		// Draw the route
		var routeline = inResponse.routePath.line;
		var routepoints = new Array();
		for (var i = 0; i < routeline.coordinates.length; i++) {
			routepoints[i] = new Microsoft.Maps.Location(
				routeline.coordinates[i][0], routeline.coordinates[i][1]);
		}
		// Remove Route Itinerary Pin
		this.$.map.removeEntities(this.routeLines);
		this.$.map.removeEntities(this.routeItineraryPin);
		this.routeItineraryPin = null;
		// Draw the route on the map
		this.routeLines = new Microsoft.Maps.Polyline(routepoints, {
			strokeColor: new Microsoft.Maps.Color(200, 0, 0, 200)});
		this.$.map.hasMap().entities.push(this.routeLines);
		// Info Footer
		this.$.infoFooter.setInfos("ItineraryInfo", inItineraryItems);
		this.pulloutToggle();
	},
	shouldShowRoutePushpins: function() {
		return this.searchResultPushpins && this.searchResultPushpins.length;
	},
	setRoutePushpins: function(inLeg, inStartAddress, inEndAddress) {
		if (!this.$.actionBar.isStartInputDroppedPin()) {
			var coords = inLeg.startLocation ? inLeg.startLocation.point.coordinates : enyo.mapsApp.parseLocationToCoords(inStartAddress);
			this.startPushpin = this.$.map.updatePushpin(this.startPushpin,
				coords[0], coords[1],
				{icon: "images/poi_active.png", height: 48, width: 48, visible: this.shouldShowRoutePushpins()});
		}
		if (!this.$.actionBar.isEndInputDroppedPin()) {
			var coords = inLeg.endLocation ? inLeg.endLocation.point.coordinates : enyo.mapsApp.parseLocationToCoords(inEndAddress);
			this.endPushpin = this.$.map.updatePushpin(this.endPushpin,
				coords[0], coords[1],
				{icon: "images/poi_active.png", height: 48, width: 48, visible: this.shouldShowRoutePushpins()});
			if (this.shouldShowRoutePushpins() && this._lastSearchPushpin) {
				this.openTitleBoxAt(this._lastSearchPushpin.getLocation(), this._lastSearchPushpin.title);
			}
		}
	},
	routeItinerarySelect: function(inSender, inItinerary) {
		if (!inItinerary.maneuverPoint) {
			this.$.map.ensureBoundariesInView(this.routeBoundaries);
			this.$.infoFooter.setInfoByIndex(inItinerary.index);
			this.$.map.removeEntities(this.routeItineraryPin);
			this.routeItineraryPin = null;
			return;
		}
		if (inItinerary.index == 1) {
			this.clearSearchResults();
			if (!this.$.actionBar.isStartInputDroppedPin()) {
				this.startPushpin.setOptions({visible: true});
			}
			if (!this.$.actionBar.isEndInputDroppedPin()) {
				this.endPushpin.setOptions({visible: true});
			}
		}
		var coords = inItinerary.maneuverPoint.coordinates;
		var location = {latitude: coords[0], longitude: coords[1]};
		var options = {
			text: String(inItinerary.index),
			icon: "images/poi_direction_step.png",
			height: 28, width: 28
		};
		this.routeItineraryPin = this.$.map.updatePushpin(this.routeItineraryPin,
			location.latitude, location.longitude, options);
		this._centerCurrentLocation = false;
		this.$.map.setCenter(location.latitude, location.longitude);
		if (this.$.map.getZoom() < 14) {
			this.$.map.setZoom(14);
		}
		this.$.infoFooter.setInfoByIndex(inItinerary.index);
	},
	infoSelect: function(inSender, inInfo, inInfoKind) {
		if (inInfoKind == "SearchResultsInfo") {
			this.searchResultInfoSelect(inSender, inInfo);
		} else if (inInfoKind == "ItineraryInfo") {
			this.routeItinerarySelect(inSender, inInfo);
		}
	},
	resultsClick: function(inSender) {
		var infoKind = inSender.info.kindName;
		this.openLeftPullout(infoKind == "SearchResultsInfo" ? "searchResults" : "route");
	},
	infoClick: function(inSender, inValue) {
		var infoKind = inSender.info.kindName;
		if (infoKind == "ItineraryInfo") {
			this.clearRoute();
			this.$.route.setTravelMode(inValue);
			this.$.route.route();
		}
	},
	trafficToggle: function(inSender, inValue) {
		this.closePullouts();
		this.$.map.setShowTraffic(inValue);
	},
	checkForUpdates: function() {
		this.$.updater.CheckForUpdate("Maps");
	},
	updateFound: function() {
		enyo.windows.addBannerMessage($L("Update available in App Museum"), "{}");
	},
	helpClick: function() {
		this.$.openApp.call({id: "com.palm.app.help", params: {
			target: "http://help.palm.com/maps/index.json"
		}});
	},
	microsoftLicenseClick: function() {
		this.$.openApp.call({id: "com.palm.app.browser", params: {
			target: "http://www.microsoft.com/maps/assets/docs/terms.aspx"
		}});
	},
	bingLicenseClick: function() {
		this.$.openApp.call({id: "com.palm.app.browser", params: {
			target: "http://www.microsoft.com/maps/product/terms.html"
		}});
	}
});