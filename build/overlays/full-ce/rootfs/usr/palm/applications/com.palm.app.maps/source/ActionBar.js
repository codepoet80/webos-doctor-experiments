enyo.kind({
	name: "ActionBar",
	kind: enyo.Toolbar,
	published: {
		locationOn: false
	},
	events: {
		onSearch: "",
		onRoute: "",
		onCurrentLocation: "",
		onMenu: "",
		onSaves: "",
		onModeChange: "",
		onInputFocus: "",
		onInputClear: "",
		onInputAssistOpen: "",
		onSaveRecent: ""
	},
	components: [
		{kind: "RadioGroup", value: 0, className: "actionbar-search-mode", onChange: "modeChange", components: [
			{icon: "images/topbar-search-icon.png", value: 0, className: "enyo-radiobutton-dark"},
			{icon: "images/topbar-direct-icon.png", value: 1, className: "enyo-radiobutton-dark"}
		]},
		{kind: "HFlexBox", flex: 1, components: [
			{name: "searchInput", kind: "LocationSearchInput", width: "220px", hint: $L("Search or Address"), changeOnInput: true, onkeydown: "inputKeydown", onfocus: "inputFocus", onchange: "inputChange", onCancel: "inputChange"},
			{name: "routeMenu", kind: "HFlexBox", showing: false, components: [
				{name: "startInput", kind: "LocationInput", width: "220px", hint: $L("Start"), changeOnInput: true, onkeydown: "inputKeydown", onfocus: "inputFocus", onchange: "inputChange"},
				{kind: "ToolButton", onclick: "swapClick", icon:"images/menu-icon-swap.png", className:"map-tool-button"},
				{name: "endInput", kind: "LocationInput", width: "220px", hint: $L("End"), changeOnInput: true, onkeydown: "inputKeydown", onfocus: "inputFocus", onchange: "inputChange"}
			]}
		]},
		{kind: "ToolButton", icon: "images/menu-icon-info.png", onclick: "doMenu"},
		{kind: "ToolButton", icon: "images/menu-icon-bookmark.png", onclick: "doSaves"},
		{name: "locationButton", kind: "ToolButton", icon: "images/menu-icon-mylocation.png", onclick: "currentLocationClick"},
		{kind: "InputAssist", width: "230px", onSelect: "inputAssistSelect", onOpen: "inputAssistOpen"}
	],
	resizeHandler: function() {
		var node = this.hasNode();
		var w = node.clientWidth < 960 ? "180px" : "220px";
		this.$.startInput.hasNode().style.width = w;
		this.$.endInput.hasNode().style.width = w;
	},
	locationOnChanged: function() {
		//this.$.locationButton.setDepressed(this.locationOn);
	},
	inputFocus: function(inSender) {
		inSender.forceSelect();
		this.$.inputAssist.input = inSender;
		var n = inSender.hasNode();
		var o = enyo.dom.calcNodeOffset(n);
		this.$.inputAssist.openAt({left: o.left - 5, top: 40});
		this.doInputFocus(inSender);
	},
	inputAssistSelect: function(inSender, inInput, inValue) {
		this.setInputValue(inInput, inValue);
		this.closeInputAssist();
		this.doInputClear();
	},
	closeInputAssist: function() {
		this.$.inputAssist.close();
	},
	inputAssistOpen: function(inSender) {
		this.doInputAssistOpen(inSender);
	},
	isStartInputEmpty: function() {
		return !this.$.startInput.getValue();
	},
	isEndInputEmpty: function() {
		return !this.$.endInput.getValue();
	},
	isStartInputMyLocationPin: function() {
		return this.$.startInput.getValue() == enyo.mapsApp.myLocation;
	},
	isEndInputMyLocationPin: function() {
		return this.$.endInput.getValue() == enyo.mapsApp.myLocation;
	},
	isStartInputDroppedPin: function() {
		return this.$.startInput.getValue() == enyo.mapsApp.dropPin;
	},
	isEndInputDroppedPin: function() {
		return this.$.endInput.getValue() == enyo.mapsApp.dropPin;
	},
	isStartInputUserKeypressed: function() {
		return this.$.startInput.isUserKeypressed();
	},
	isEndInputUserKeypressed: function() {
		return this.$.endInput.isUserKeypressed();
	},
	setInputValue: function(inInput, inValue) {
		inInput.setLocation(inValue);
		inInput.styleInput();
		if (inInput == this.$.searchInput) {
			this.search(this.$.searchInput);
		} else if (this.$.startInput.value && this.$.endInput.value) {
			this.route();
		}
	},
	setSearchInputValue: function(inValue) {
		this.setInputValue(this.$.searchInput, inValue);
	},
	setStartInputValue: function(inValue) {
		this.setInputValue(this.$.startInput, inValue);
	},
	setEndInputValue: function(inValue) {
		this.setInputValue(this.$.endInput, inValue);
	},
	routeOrFocusInput: function() {
		if (this.$.startInput.value && this.$.endInput.value) {
			this.route();
		} else if (!this.$.startInput.value) {
			this.$.startInput.forceFocus();
		} else if (!this.$.endInput.value){
			this.$.endInput.forceFocus();
		}
	},
	getMode: function() {
		return this.$.radioGroup.getValue();
	},
	setMode: function(inMode) {
		var oldMode = this.$.radioGroup.getValue();
		if (oldMode != inMode) {
			this.$.radioGroup.setValue(inMode);
			this.modeChange(null, inMode);
		}
	},
	modeChange: function(inSender, inValue) {
		this.$.searchInput.setShowing(!inValue);
		this.$.routeMenu.setShowing(inValue);
		this.doModeChange(inValue);
	},
	inputKeydown: function(inSender, inEvent) {
		this.closeInputAssist();
		if (inEvent.keyCode == 13) {
			if (inSender == this.$.searchInput) {
				inEvent.preventDefault();
				this.search(this.$.searchInput);
				inSender.forceBlur();
			} else if (inSender == this.$.endInput && this.$.startInput.value) {
				inEvent.preventDefault();
				this.route();
				inSender.forceBlur();
			} else if (inSender == this.$.startInput && this.$.endInput.value) {
				inEvent.preventDefault();
				this.route();
				inSender.forceBlur();
			}
		}
	},
	inputChange: function(inSender) {
		inSender.clearLocation();
		inSender.styleInput();
		if (!inSender.value || inSender.value.length == 1) {
			this.doInputClear();
		}
	},
	getSearchInputDisplayValue: function() {
		return this.$.searchInput.getValue();
	},
	swapClick: function() {
		this.$.startInput.swapValues(this.$.endInput);
		this.route();
	},
	route: function() {
		this.doRoute(this.$.startInput.getRealValue(), this.$.endInput.getRealValue(), this.$.startInput.getValue(), this.$.endInput.getValue());
		this.saveRecent(this.$.startInput);
		this.saveRecent(this.$.endInput);
	},
	search: function(inSender, inValue) {
		this.doSearch(inSender.getRealValue(), inSender.getLocation());
		this.saveRecent(inSender);
	},
	currentLocationClick: function(inSender) {
		this.doCurrentLocation(inSender.depressed);
	},
	saveRecent: function(inInput) {
		var v = inInput.getValue();
		if (inInput.isUserKeypressed() && v) {
			this.doSaveRecent(v);
		}
	}
});
