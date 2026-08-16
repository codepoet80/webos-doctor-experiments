enyo.kind({
	name: "InfoFooter",
	kind: enyo.HFlexBox,
	className: "info-footer-outer",
	events: {
		onSelect: "",
		onResultsClick: "",
		onInfoClick: ""
	},
	components: [
		{kind: "HFlexBox", flex: 1, pack: 'start', className: "info-footer", components:[
			{kind: "HFlexBox", flex: 1, className: "wrapper", components: [
				{kind: "ToolButton", className: "info-footer-button", icon: "images/list-view-icon.png", onclick: "doResultsClick"},
				{name: "info", kind: "HFlexBox", flex: 1, className: "info-footer-detail"},
				{name: "dirButtons", showing: false, kind: "HFlexBox", components: [
					{kind: "ToolButton", className: "info-footer-button", icon: "images/menu-icon-back.png",  onclick: "goBack"},
					{kind: "ToolButton", className: "info-footer-button", icon: "images/menu-icon-forward.png", onclick: "goForward"}
				]},
				{name: "startButton", kind: "ToolButton", className: "info-footer-button", label: $L("Start"), onclick: "goForward"}
			]}
		]}
	],
	showingChanged: function() {
		if (!this.infos || !this.infos.length) {
			this.showing = false;
		}
		this.inherited(arguments);
	},
	clear: function() {
		this.infos = null;
		this.hide();
	},
	setInfos: function(inInfoKind, inInfos) {
		if (this.info) {
			this.info.destroy();
		}
		this.info = this.$.info.createComponent({kind: inInfoKind, flex: 1, onInfoClick: "doInfoClick", owner: this});
		this.$.info.render();
		this.isRouteMode = inInfoKind == "ItineraryInfo";
		this.$.dirButtons.setShowing(!this.isRouteMode);
		this.$.startButton.setShowing(this.isRouteMode);
		this.infos = inInfos;
		this.index = -1;
		if (this.infos && this.infos.length > 0) {
			this.setInfo(this.infos[0], true);
			if (this.isRouteMode) {
				this.$.startButton.setShowing(this.infos.length > 1);
			}
		} else {
			this.hide();
		}
	},
	setInfo: function(inInfo, inIgnoreSelect) {
		if (inInfo) {
			this.info.setInfo(inInfo);
			var d = this.index != inInfo.index;
			this.index = inInfo.index;
			if (d && !inIgnoreSelect) {
				this.doSelect(inInfo, this.info.kindName);
			}
			return true;
		}
	},
	setInfoByIndex: function(inIndex) {
		if (this.setInfo(this.infos[inIndex]) && this.isRouteMode) {
			this.$.dirButtons.setShowing(inIndex>0);
			this.$.startButton.setShowing(inIndex<=0);
		}
	},
	goBack: function() {
		this.setInfoByIndex(this.index-1);
	},
	goForward: function() {
		this.setInfoByIndex(this.index+1);
	}
});

enyo.kind({
	name: "SearchResultsInfo",
	kind: enyo.VFlexBox,
	components: [
		{name: "title", className: "searchresults-info-title"},
		{name: "address"}
	],
	setInfo: function(inInfo) {
		var fmt = new enyo.g11n.AddressFmt(); 
	
		var cleanTitle = enyo.mapsApp.unMicrosoftString(inInfo.Title);
		var cleanAddress = enyo.mapsApp.unMicrosoftString(inInfo.Address);
		var cleanCity = enyo.mapsApp.unMicrosoftString(inInfo.City);
		this.$.title.setContent(cleanTitle);
		this.$.address.setContent(fmt.format({
				streetAddress: cleanAddress,
				locality: cleanCity
			}));
	}
});

enyo.kind({
	name: "ItineraryInfo",
	kind: enyo.HFlexBox,
	events: {
		onInfoClick: ""
	},
	align: "center",
	components: [
		{name: "travelMode", kind: "RadioGroup", className: "travel-mode", value: "Driving", onChange: "travelModeChange", components: [
			{icon: "images/footer-button-icon-car.png", value: "Driving", className: "enyo-radiobutton-dark"},
			{icon: "images/footer-button-icon-bus.png", value: "Transit", className: "enyo-radiobutton-dark"},
			{icon: "images/footer-button-icon-walking.png", value: "Walking", className: "enyo-radiobutton-dark"}
		]},
		{width: "10px"},
		{name: "icon", kind: "RouteManeuverIcon", showing: false, className: "itinerary-maneuver-icon"},
		{name: "description", allowHtml: true, flex: 1, className: "itinerary-info-description"}
	],
	setInfo: function(inInfo) {
		this.$.travelMode.setShowing(inInfo.index == 0);
		this.$.description.setContent(inInfo.description_footer);
		this.$.icon.setShowing(inInfo.maneuverType);
		this.$.icon.setType(inInfo.maneuverType);
		this.$.travelMode.setValue(inInfo.travelMode);
	},
	travelModeChange: function(inSender, inValue) {
		this.doInfoClick(inValue);
	}
});
