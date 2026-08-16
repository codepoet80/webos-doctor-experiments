enyo.kind({
	name: "InfoBox",
	kind: enyo.Popup,
	published: {
		info: "",
		hideDetails: false
	},
	events: {
		onFromDirection: "",
		onToDirection: "",
		onBookmark: "",
		onPhone: ""
	},
	className: "enyo-popup popup",
	components: [
		{name: "title", className: "infobox-title"},
		{name: "details", kind: "VFlexBox", className: "infobox-group", components: [
			{kind: "VFlexBox", className: "infobox-spaced", components: [
				{name: "address"},
				{name: "cityState"},
			]},
			{showing: false, kind: "VFlexBox", className: "infobox-spaced", pack: 'center', components: [
				{name: "link"}
			]},
			{kind: "VFlexBox", className: "infobox-spaced", pack: 'center', components: [
				{name: "phoneNumber", onclick: "phoneNumberClick"},
			]}
		]}, 
		{kind: "HFlexBox", className: "info-actions-row", pack: "Center", components:[
			{kind: "IconButton", className: "enyo-button-dark", icon: "images/direct_topBar.png", onclick: "doToDirection", flex: 1},
			{kind: "IconButton", className: "enyo-button-dark", icon: "images/bookmark-icon.png", onclick: "doBookmark", flex: 1}
		]}
	],
	componentsReady: function() {
		this.inherited(arguments);
		this.infoChanged();
	},
	infoChanged: function() {
		if (!this.info || this.lazy) {
			return;
		}
		var cleanTitle = enyo.mapsApp.unMicrosoftString(this.info.title);
		var cleanAddress = enyo.mapsApp.unMicrosoftString(this.info.address || "");
		var fmt = new enyo.g11n.AddressFmt();
		var fmtArg = {};
		if (this.info.city){
			fmtArg.locality = this.info.city;
		}
		if (this.info.stateOrProvince){
			fmtArg.region = this.info.stateOrProvince;
		}
		this.$.title.setContent(cleanTitle);
		this.$.address.setContent(cleanAddress);
		this.$.cityState.setContent(fmt.format(fmtArg));
		this.$.phoneNumber.setContent(this.info.phoneNumber);
		this.$.phoneNumber.setShowing(this.info.phoneNumber);
		this.$.link.setContent("<a href='" + this.info.link + "' target='_blank'>"+$L("Show More Info")+"</a>");
		this.$.link.setShowing(this.info.link);
	},
	hideDetailsChanged: function() {
		this.$.details.setShowing(!this.hideDetails);
	},
	getTitle: function() {
		return this.info.title;
	},
	getLocation: function() {
		return enyo.mapsApp.createLocation(this.info);
	},
	phoneNumberClick: function() {
		this.doPhone(this.info.phoneNumber);
	}
});
