enyo.kind({
	name: "Route",
	kind: enyo.VFlexBox,
	published: {
		credentials: "",
		startAddress: "",
		startLabel: "",
		endAddress: "",
		endLabel: "",
		travelMode: "Driving"
	},
	events: {
		onCallRoute: "",
		onReceive: "",
		onItinerarySelect: "",
		onModeChange: ""
	},
	components: [
		{name: "route", kind: "WebService", 
			onSuccess: "routeSuccess", 
			onFailure: "routeFailure",
			onResponse: "routeComplete"},
		{name: "travelMode", kind: "RadioGroup", className: "travel-mode-selector",  value: "Driving", onChange: "travelModeChange", components: [
			{icon: "images/button-icon-car.png", value: "Driving"},
			{icon: "images/button-icon-bus.png", value: "Transit"},
			{icon: "images/button-icon-walking.png", value: "Walking"}
		]},
		{name: "routeMsg", allowHtml: true, className: "route-message", onclick: "routeMsgClick"},
		{name: "list", kind: "VirtualList", flex: 1, onSetupRow: "listSetupRow", components: [
			{kind: "Item", layoutKind: "HFlexLayout", onclick: "itemClick", className: "route-itinerary", tapHighlight: true, components: [
				{name: "icon", kind: "RouteManeuverIcon"},
				{kind: "VFlexBox", pack: "center", components: [
					{name: "descriptionElements", width: "256px",  kind: "HFlexBox", components: [
						{name: "itemIndex", allowHtml: true, width: "20px"},
						{name: "description", allowHtml: true, width: "170px"},
						{name: "descriptionStats", allowHtml: true, width: "54px", className: "stats"}
					]}
				]}
			]}
		]}
	],
	culture: enyo.g11n.currentLocale().toISOString().replace("_","-"),
	bingMapsTimeFmt: new enyo.g11n.DateFmt("HH:mm:ss"),
	systemFmt: new enyo.g11n.Fmts(),
	distanceFmt: "mi",
	clear: function() {
		this.$.routeMsg.setContent("");
		this.itineraryItems = [];
		this.$.list.refresh();
	},
	travelModeChanged: function() {
		this.$.travelMode.setValue(this.travelMode);
	},
	travelModeChange: function(inSender, inValue) {
		if (this.startAddress && this.endAddress) {
			this.route();
			this.doModeChange();
		}
	},
	route: function() {
		if (!this.startAddress || !this.endAddress) {
			return;
		}
		this.travelMode = this.$.travelMode.getValue();
		var url = "http://maps.webosarchive.org/REST/v1/Routes/" + this.travelMode;
		this.$.route.setUrl(url);
		var d = new Date();
		if(this.systemFmt.getMeasurementSystem() === "metric"){
			this.distanceFmt = "km"; 
		}else{
			this.distanceFmt = "mi";
		}
		var params = {
			"wp.0": this.startAddress,
			"wp.1": this.endAddress,
			distanceUnit: this.distanceFmt,
			routePathOutput: "Points",
			dateTime: this.bingMapsTimeFmt.format(d),
			timeType: "Departure",
			output: "json",
			c: this.culture,
			key: this.credentials
		}
		this.doCallRoute();
		this.$.route.cancel();
		var req = this.$.route.call(params);
		req._startAddress = this.startAddress;
		req._endAddress = this.endAddress;
	},
	
	statics: {
		WAYPOINTS_MAP: {
			"One or more specified waypoints are not in areas for which we currently offer transit routes.": $L("One or more specified waypoints are not in areas for which we currently offer transit routes."),
			"The route distance is too long to calculate a route.": $L("The route distance is too long to calculate a route."),
			"Walking is a better option.": $L("Walking is a better option.")
		}
	},
	routeSuccess: function(inSender, inResponse, inRequest) {
		if (inResponse &&
			inResponse.resourceSets &&
			inResponse.resourceSets.length > 0 &&
			inResponse.resourceSets[0].resources &&
			inResponse.resourceSets[0].resources.length > 0) {
			
			var result = inResponse.resourceSets[0].resources[0];
			
			var leg = result.routeLegs[0];
			var dist = Math.round(result.travelDistance*10)/10;
			var dura = Math.round(result.travelDuration/60) || 1;
			
			var routeDesc = $L("<b>Route Overview</b><br>");
			if (this.travelMode != "Transit") {
				var regularTmp = new enyo.g11n.Template($L("#{distance} #{distUnit} - #{duration} min"));
				routeDesc += regularTmp.evaluate({
					distance: dist,
					distUnit: (this.distanceFmt === "km") ? $L("kilometers") : $L("miles"),
					duration: dura
				});
			} else {
				var transitTmp = new enyo.g11n.Template($L("#{duration} min"));
				routeDesc += transitTmp.evaluate({
					duration: dura
				});
			}
				
			this.$.routeMsg.setContent(routeDesc);
			
			this.itineraryItems = leg.itineraryItems;
			
			for (var i=0, it; it=this.itineraryItems[i]; i++) {
				var dist = Math.round(it.travelDistance*10)/10 || "< 0.1";
				var dura = Math.round(it.travelDuration/60) || 1;
				var statsTmp = new enyo.g11n.Template($L("#{distance} #{distUnit}"));
				var stats = statsTmp.evaluate({
					distance: dist,
					distUnit: (this.distanceFmt === "km") ? $L("km") : $L("mi"),
					duration: dura
				});
				var index = i+1;
				it.description = it.instruction.text;
				it.stats = stats;
				it.itemIndex = index;
				it.description_footer = "<b>" + index + ". " + it.instruction.text + "</b><br><div>"+ stats + "</div>";
				it.maneuverType = it.instruction.maneuverType;
				it.index = i+1;
			}
			var summaryTmp = new enyo.g11n.Template($L("Directions to #{endPntLbl}"));
			var summary = {
				index: 0,
				travelMode: this.travelMode,
				description: summaryTmp.evaluate({endPntLbl: enyo.mapsApp.unMicrosoftString(this.endLabel)}),
				description_footer: routeDesc
			}
			this.itineraryItems.splice(0, 0, summary);
			
			this.$.list.punt();
			this.$.list.resizeHandler();
			
			this.doReceive(result, this.itineraryItems, inRequest._startAddress, inRequest._endAddress);
		} else if (inResponse && inResponse.errorDetails && inResponse.errorDetails.length > 0) {
			var routeErrMsg = Route.WAYPOINTS_MAP.hasOwnProperty(inResponse.errorDetails[0]) ?
					Route.WAYPOINTS_MAP[inResponse.errorDetails[0]] : inResponse.errorDetails[0];
			this.displayRouteError(routeErrMsg, inResponse.errorDetails.length > 1);
		}
	},
	routeFailure: function(inSender, inResponse, inRequest) {
		if (inResponse && inResponse.errorDetails && inResponse.errorDetails.length > 0) {
			var routeErrMsg = Route.WAYPOINTS_MAP.hasOwnProperty(inResponse.errorDetails[0]) ?
					Route.WAYPOINTS_MAP[inResponse.errorDetails[0]] : inResponse.errorDetails[0];
			this.displayRouteError(routeErrMsg, inResponse.errorDetails.length > 1);
		} else {
			this.displayRouteError($L("No route information."), true);
		}
	},
	displayRouteError: function(inMsg, inError) {
		this.doReceive(null, inError ? [] : [{index: 0, travelMode: this.travelMode, description_footer: inMsg}]);
		this.clear();
		this.$.routeMsg.setContent(inMsg);
	},
	listSetupRow: function(inSender, inRow) {
		var r = this.itineraryItems && this.itineraryItems[inRow];
		if (r) {
			this.$.description.setContent(r.description);
			if(r.stats != undefined){
				this.$.descriptionStats.setContent(r.stats);
				this.$.itemIndex.setContent("<b>" + r.itemIndex + ".</b>");
				this.$.icon.setType(r.maneuverType);
			}
			else{
				this.$.description.setStyle('margin-left: -68px; width: 290px;')
			}
			return true;
		}
	},
	routeMsgClick: function() {
		this.doItinerarySelect(this.itineraryItems[0]);
	},
	itemClick: function(inSender, inEvent) {
		this.doItinerarySelect(this.itineraryItems[inEvent.rowIndex]);
	}
});
