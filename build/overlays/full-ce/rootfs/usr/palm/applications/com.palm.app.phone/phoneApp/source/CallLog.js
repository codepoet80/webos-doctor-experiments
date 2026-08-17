enyo.kind({
	name: "CallLog",
	kind: enyo.VFlexBox,
	curDividerText: "",
	className: "phone-background call-log",
	events: {
		onCall:""
	},
	components: [
		{kind: "Toolbar", className: "phone-command-menu", style: "position: relative;", components: [
			{name: "callLogMenu", kind: "RadioToolButtonGroup", flex: 1, onChange: "viewChanged", components: [
				{content: $L("All calls"), value: "allCalls"},
				{content: $L("Missed calls"), value: "missedCalls"},
			]}
		]},
		{name: "callLogPane", kind:"Pane", flex: 1, onSelectView: "onSelectView", transitionKind:enyo.transitions.Simple, components:[
			{name: "allCalls", kind: "CallLogView", flex: 1, listType: "all", lazy: true},
			{name: "missedCalls", kind: "CallLogView", flex: 1, listType: "missed", lazy: true},
		]}
	],
	create: function() {
		this.inherited(arguments);
		
		this._initializeTimerHandle = setTimeout(enyo.bind(this, "_initialize"), 300);
	},
	destroy: function() {
		if(this._initializeTimerHandle) {
			clearTimeout(this._initializeTimerHandle);
		}
		this.inherited(arguments);
	},
	_initialize: function() {
		if (this._initializeTimerHandle) {
			clearTimeout(this._initializeTimerHandle);
			this._initializeTimerHandle = undefined;
		}

		this.justIntialized = true;

		var params = enyo.windowParams;
		if (params && params.missed === true) {
			this.$.callLogPane.selectViewByName("missedCalls");
			this.$.callLogMenu.setValue("missedCalls");
		} else {
			this.$.callLogPane.selectViewByName("allCalls");
			this.$.callLogMenu.setValue("allCalls");
		}
	},
	
	handleLaunch: function(params) {		
		if (params && params.missed === true) {
			this.$.callLogPane.selectViewByName("missedCalls");
			this.$.callLogMenu.setValue("missedCalls");
		}

		if (params && (params.cleanup === undefined || params.refreshLists === true)) {
			if (this.$.callLogPane.getViewName() === "allCalls") {
				if (this.$.allCalls) {
					if(!enyo.application.isTablet) {
						this.$.allCalls.scrollToTop();
					}/* else {
						enyo.log("scrolling to top re-query's call log database and updates ui - more the log, more the phone tabs switching time");
					}*/
				}
			} else if (this.$.missedCalls) {
				this.$.missedCalls.scrollToTop();
			}
		}
	},
	viewChanged: function(inSender, inValue) {
		this.$.callLogPane.selectViewByName(inValue);
	},
	onSelectView: function(inSrc, inCurView, inLastView) {
		inCurView.scrollToTop(this.justIntialized);

		if (this.justIntialized === true) {
			this.justIntialized = false;
		}
	}
});
