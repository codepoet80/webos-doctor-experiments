enyo.kind({
	name: "SimpleTextDrawerItem",
	kind: enyo.VFlexBox,
	published: {
		displayName: "",
		displayLabel: "",
		displayLabelRight: "",
	},
	events: {
		onDisplayContentClicked: "",
	},
	className: "drawerItem",
	components: [
		{name: "displayArea", kind: enyo.HFlexBox, className: "draweritem-displayArea", components: [
			{kind: enyo.HFlexBox, className: "draweritem-displayContent", onclick: "onDisplayContentClick", components: [
				{kind: enyo.VFlexBox, className: "drawerItem-displayDetails", components: [
					{name: "displayNm"},
					{kind: enyo.HFlexBox, components:[
						{name: "displayLbl", className: "drawerItem-displayLbl"},
						{name: "displayLblRight", className: "draweritem-displayLblRight"}
					]}
				]},
			]},
		]},
	],
	
	create: function() {
		this.inherited(arguments);
		
		this.displayNameChanged();
		this.displayLabelChanged();
		this.displayLabelRightChanged();
	},
	
	displayNameChanged: function() {
		this.$.displayNm.setContent(this.displayName);
	},

	displayLabelChanged: function() {
		this.$.displayLbl.setContent(this.displayLabel);
	},

	displayLabelRightChanged: function() {
		this.$.displayLblRight.setContent(this.displayLabelRight);
	},
	
	onDisplayContentClick: function() {
		this.doDisplayContentClicked();
	},
});

enyo.kind({
	name: "BubbleDrawerItem",
	kind: enyo.VFlexBox,
	published: {
		displayName: "",
		displayNumber: 0,
	},
	events: {
		onDisplayContentClicked: "",
	},
	className: "drawerItem",
	components: [
		{kind: enyo.HFlexBox, className: "draweritem-displayArea", onclick: "onDisplayContentClick", components: [
			{name: "displayName"},
			{name: "displayNumber", className: "folder-number"},
		]},
	],
	
	create: function() {
		this.inherited(arguments);
		
		this.displayNameChanged();
		this.displayNumberChanged();
	},
	
	displayNameChanged: function() {
		this.$.displayName.setContent(this.displayName);
	},

	displayNumberChanged: function() {
		this.$.displayNumber.setShowing(this.displayNumber > 1);
		if (this.displayNumber > 1) {
			this.$.displayNumber.setContent(this.displayNumber);
		}
	},

	onDisplayContentClick: function() {
		this.doDisplayContentClicked();
	},
});

enyo.kind({
	name: "DrawerItem",
	kind: enyo.SwipeableItem,
	tapHighlight: true,
	published: {
		displayName: "",
		displayNameAreaClassName: "drawerItem-displayNameArea",
		displayDetailsClassName: "drawerItem-displayDetails",
		displayLabel: "",
		displayMiddleLabel: "",
		displayLabelClassName: "",
		displayVideoIcon: false,
		displayLabelRight: "",
		displayIconClassName: "",
		displayIconsClassName: [],
		isAFavoriteContact: false,
		avatarImgSrc: "",
		pillCount: 0,
		drawerItemContainer: null,
		drawerItemContainer2: null,
		open: false,
		drawerItemClassName: "drawerItem",
		displayAreaClassName: "draweritem-displayArea",
		hiddenDrawerItemClassName: "",
		confirmClassName: undefined,
		allowSwipe: true,
		data: null,
	},
	events: {
		onOpenChanged: "",
		onBeforeOpenChanged: "",
		onDisplayContentClicked: "",
		onClickedAndHeld: "",
	},
	components: [
		{
			name: "displayArea",
			kind: enyo.HFlexBox,
			className: "draweritem-displayArea",
			components: [
				{
					name: "displayContent",
					kind: enyo.HFlexBox,
					className: "draweritem-displayContent",
					onclick: "onDisplayContentClick",
					onmousehold: "onClickAndHold",
					components: [
						{
							name: "displayDetails",
							kind: enyo.VFlexBox,
							components: [
								{
									kind: enyo.HFlexBox,
									style: "min-height:22px;",
									components: [
										{name: "displayNameArea", kind: enyo.HFlexBox, components:[
											{name: "displayNm", className: "drawerItem-displayNm"},
											{name: "favoritesIcon", style:"", kind: enyo.Image, src: "./images/icon-fav-list-light.png"},
										]},
										{name: "displayIcon"},
										{kind: enyo.HFlexBox, className: "rightAligned", components: [
											{name: "displayIcon4"},
											{name: "displayIcon3"},
											{name: "displayIcon2"},
											{name: "displayIcon1"},
										]},
									]
								},
								{
									kind: enyo.HFlexBox,
									components:[
										{name: "displayLblContainer", kind: enyo.HFlexBox, style: "width:50%;", components:[
											{name: "displayLbl", className: "drawerItem-displayLbl",},
											{name: "displayVideoIcon", className:"drawerItem-displayVideoIcon", kind: enyo.Image, src: "./images/icon-videocall-list.png", showing: false},
										]},										
										{name: "displayMiddleLbl", className: "drawerItem-displayLbl",},
										{name: "displayLblRight", className: "draweritem-displayLblRight"},
									]
								}
							]
						}
					]
				},
				{
					name: "imgToggleButton",
					kind: "ImageToggleButton",
					onChange: "imgToggleButtonStateChanged",
				}
			]
		},
		{
			name: "HiddenDrawerItem2",
			kind: enyo.Drawer,
			open: false,
			components: [],
		},
		{
			name: "HiddenDrawerItem",
			kind: enyo.Drawer,
			open: false,
			components: [],
		},
	],

	create: function() {
		this.inherited(arguments);
		
		this.displayNameChanged();
		this.displayNameAreaClassNameChanged();
		this.displayDetailsClassNameChanged();
		this.displayLabelChanged();
		this.displayMiddleLabelChanged();
		this.displayVideoIconChanged();
		this.displayLabelRightChanged();
		this.displayIconClassNameChanged();
		this.displayIconsClassNameChanged();
		this.isAFavoriteContactChanged();
		this.avatarImgSrcChanged();
		this.pillCountChanged();
		this.drawerItemContainerChanged();
		this.drawerItemContainer2Changed();
		this.drawerItemClassNameChanged();
		this.displayAreaClassNameChanged();
		this.hiddenDrawerItemClassNameChanged();
		this.confirmClassNameChanged();
		this.allowSwipeChanged();
		//this.openChanged(); // Do not call this here!!!
		
		if (this.open == true) {
			this.open = false; // set to true false so that the call to toggleOpen below works (I know it's a hack...)
			this.toggleOpen();
			this.$.imgToggleButton.setState(this.open);
		}
	},

	imgToggleButtonStateChanged: function(src, bState)
	{
		if (this.onBeforeOpenChanged) {                                                    
													   //src, oldOpenVal, newOpenVal
			var open = this.$.HiddenDrawerItem.getOpen();
			var boolStop = this.onBeforeOpenChanged(this, open, !open);
			if (boolStop != true)
				this.toggleOpen();
		}
		else {
			this.toggleOpen();
		}
	},

	displayNameChanged: function() {
		this.$.displayNm.setContent(this.displayName);
	},
	
	displayNameAreaClassNameChanged: function() {
		this.$.displayNameArea.setClassName(this.displayNameAreaClassName);
	},

	displayLabelChanged: function() {
		this.$.displayLbl.setContent(this.displayLabel);
	},
	
	displayMiddleLabelChanged: function() {
		this.$.displayMiddleLbl.setContent(this.displayMiddleLabel);
	},
	
	displayVideoIconChanged: function() {
		if (this.displayVideoIcon === true) {
			// TODO: There has to be a better way to do this than checking for the length of the string...
			if (this.displayLabel.length > 21)
				this.$.displayLbl.addClass("displayLbl-limited");

			this.$.displayVideoIcon.setShowing(true);
		} else {
			this.$.displayLbl.addClass("displayLbl-full");
		}
	},

	displayDetailsClassNameChanged: function() {
		this.$.displayDetails.setClassName(this.displayDetailsClassName);
	},
	
	displayLabelRightChanged: function() {
		this.$.displayLblRight.setContent(this.displayLabelRight);
	},
	
	displayIconClassNameChanged: function() {                                     
		this.$.displayIcon.setClassName("draweritem-displayicon call-log-icon " + this.displayIconClassName);
	},

	displayIconsClassNameChanged: function() {
		if (this.displayIconsClassName) {
			var icon;
			for (var i = 0; i < this.displayIconsClassName.length; i++){
				if (icon = this.displayIconsClassName[i]) {
					switch (i) {
						case 0:
							this.$.displayIcon1.setClassName(icon);
							break;
						case 1:
							this.$.displayIcon2.setClassName(icon);
							break;
						case 2:
							this.$.displayIcon3.setClassName(icon);
							break;
						case 3:
							this.$.displayIcon4.setClassName(icon);
							break;
					}
				}
				else {
					break;
				}
			}
		}
	},
	
	isAFavoriteContactChanged: function() {
		this.$.favoritesIcon.applyStyle("display", this.isAFavoriteContact ? "inline" : "none");
		this._adjustBounds();
	},

	avatarImgSrcChanged: function() {
		this.$.imgToggleButton.setImgSrc(this.avatarImgSrc);
	},
	
	drawerItemContainerChanged: function() {
		if (this.drawerItemContainer != null)
			this.$.HiddenDrawerItem.addChild(this.drawerItemContainer);
	},
	
	drawerItemContainer2Changed: function() {
		if (this.drawerItemContainer2 != null)
			this.$.HiddenDrawerItem2.addChild(this.drawerItemContainer2);
	},
	
	pillCountChanged: function() {
		this.$.imgToggleButton.setPillcount(this.pillCount);
	},
	
	drawerItemClassNameChanged: function() {
		this.setClassName(this.drawerItemClassName);
	},
	
	displayAreaClassNameChanged: function() {
		this.$.displayArea.setClassName(this.displayAreaClassName);
	},
	
	hiddenDrawerItemClassNameChanged: function() {
		this.$.HiddenDrawerItem.setClassName(this.hiddenDrawerItemClassName);
	},
	
	confirmClassNameChanged: function() {
		if (this.confirmClassName)
			this.$.confirm.setClassName(this.confirmClassName);
	},
	
	allowSwipeChanged: function() {
		this.setSwipeable(this.allowSwipe);
	},
	
	getItemId: function() {
		if (this.data) {
			return this.data._id;
		}
	},

	openChanged: function(oldValue) {
		if (!this.open) {
			if (this.$.HiddenDrawerItem.getOpen()) this.$.HiddenDrawerItem.toggleOpen();
			if (this.drawerItemContainer2 && this.$.HiddenDrawerItem2.getOpen()) this.$.HiddenDrawerItem2.toggleOpen();
		}
		else {
			if (!this.$.HiddenDrawerItem.getOpen()) this.$.HiddenDrawerItem.toggleOpen();
			if (this.drawerItemContainer2 && !this.$.HiddenDrawerItem2.getOpen()) this.$.HiddenDrawerItem2.toggleOpen();
		}
		// Only allow the user to swipe if this item is not open
		this.setSwipeable(this.allowSwipe && !this.$.HiddenDrawerItem.getOpen());
		this.$.imgToggleButton.setState(this.open);
	},
	
	toggleOpen2: function() {
		if (this.open) {
			if (this.$.HiddenDrawerItem.getOpen()) this.$.HiddenDrawerItem.toggleOpen();
			if (this.drawerItemContainer2 && this.$.HiddenDrawerItem2.getOpen()) this.$.HiddenDrawerItem2.toggleOpen();
			this.$.imgToggleButton.setState(!this.open);
		}
		else {
			if (this.drawerItemContainer2 && !this.$.HiddenDrawerItem2.getOpen()) this.$.HiddenDrawerItem2.toggleOpen();
		}
		this.open = !this.open;
		// Only allow the user to swipe if this item is not open
		this.setSwipeable(this.allowSwipe && !this.open);
		if (this.onOpenChanged) {
			this.onOpenChanged(this, this.open);
		}		
	},
	
	toggleOpen: function() {
		if (this.open) {
			if (this.$.HiddenDrawerItem2.getOpen() && !this.$.HiddenDrawerItem.getOpen()) {
				if (!this.$.HiddenDrawerItem.getOpen()) this.$.HiddenDrawerItem.toggleOpen();
				if (this.drawerItemContainer2 && !this.$.HiddenDrawerItem2.getOpen()) this.$.HiddenDrawerItem2.toggleOpen();
				this.open = true;
			}
			else {
				if (this.$.HiddenDrawerItem.getOpen()) this.$.HiddenDrawerItem.toggleOpen();
				if (this.drawerItemContainer2 && this.$.HiddenDrawerItem2.getOpen()) this.$.HiddenDrawerItem2.toggleOpen();
				this.open = false;
			}
		}
		else {
			if (!this.$.HiddenDrawerItem.getOpen()) this.$.HiddenDrawerItem.toggleOpen();
			if (this.drawerItemContainer2 && !this.$.HiddenDrawerItem2.getOpen()) this.$.HiddenDrawerItem2.toggleOpen();
			this.open = true;
		}
		// Only allow the user to swipe if this item is not open
		this.setSwipeable(this.allowSwipe && !this.open);
		if (this.onOpenChanged) {
			this.onOpenChanged(this, this.open);
		}		
	},
	
	onDisplayContentClick: function() {
		this.doDisplayContentClicked(this.getData());
	},
	
	onClickAndHold: function() {
		this.doClickedAndHeld(this.getData());
	},
	
	pulseMouseUpEvent: function() {
		return this.$.imgToggleButton.clickHandler();
	},
	
	adjustBounds: function() {
		if (this.bAdjustBoundsNeeded) {
			this._adjustBounds();
		}
	},
	
	_adjustBounds: function() {
		if (this.isAFavoriteContact) {
			var node = this.$.displayNm.hasNode();
			var width = node ? node.scrollWidth : 0;
			if (width === 0) { // The item hasn't been rendered yet, mark it as needing to adjustments.
				this.bAdjustBoundsNeeded = true;
				return; 
			}

			this.$.displayNm.setClassName((node.scrollWidth > node.offsetWidth) ? "drawerItem-truncated-displayNm" : "");
			this.$.displayNm.render();
		}
	},
});
