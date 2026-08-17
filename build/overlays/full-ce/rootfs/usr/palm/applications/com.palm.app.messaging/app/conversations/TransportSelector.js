enyo.kind({
	name: "TransportSelector",
	kind: enyo.CustomListSelector,
	events: {
		onPhoneClick: "",
		onVideoClick: ""
	},
	itemKind: "TransportMenuCheckItem",
	setItemProps: function(inItem) {
		this.item.setCaption(inItem.caption);
		this.item.setPhone(inItem.phone);
		this.item.setVideo(inItem.video);
		this.item.setSecondaryLabel(inItem.secondaryLabel);
	},
	makePopup: function() {
		this.popup = this.createComponent({
			kind: "TransportPopupSelect",
			onSelect: "popupSelect",
 			onBeforeOpen: "popupBeforeOpen",
 			defaultKind: this.itemKind,
			onPhoneClick: "doPhoneClick",
			onVideoClick: "doVideoClick"
		});
	},
	closePopup: function() {
		this.popup.close();
	}
});
enyo.kind({
	name: "TransportPopupSelect",
	kind: enyo.PopupSelect,
	events: {
		onPhoneClick: "",
		onVideoClick: ""
	},
	itemsChanged: function() {
	        this.selected = null;
	        this.inherited(arguments);
	},
	phoneClick: function(inSender) {
		return this.doPhoneClick(inSender.replyAddress, inSender.serviceName);
	},
	videoClick: function(inSender) {
		return this.doVideoClick(inSender.replyAddress, inSender.serviceName);
	}
});

enyo.kind({
	name: "TransportMenuCheckItem",
	kind: enyo.MenuCheckItem,
	className: "transport-picker",
	published: {
		phone: "",
		video: "",
		secondaryLabel:""
	},
	events: {
		onPhoneClick: "phoneClick",
		onVideoClick: "videoClick"
	},
	chrome: [
		{name: "item", kind: enyo.Item, tapHighlight: true, align: "center", className: "enyo-menuitem", 
				layoutKind: "HFlexLayout", onclick: "itemClick", components: [
			{name: "phone", kind: "IconButton", onclick: "doPhoneClick", icon: "images/phone-icon.png"/*, className: "transport-picker-dial-icon"*/},
			{name: "video", kind: "IconButton", onclick: "doVideoClick", icon: "images/video-icon2.png"/*, className: "transport-picker-video-icon"*/},
			{name: "icon", kind: "Image", className: "enyo-menuitem-icon"},
			{flex: 1, components: [
				{name: "caption", flex: 1, className: "enyo-menucheckitem-caption"},
				{name: "secondaryLabel", flex: 1, className:"transport-picker-phoneLabel"}]},
			{name: "arrow", kind: enyo.CustomButton, toggling: true, showing: false, className: "enyo-menuitem-arrow"}
		]}
	],
	create: function() {
		this.inherited(arguments);
		this.phoneChanged();
		this.videoChanged();
		this.secondaryLabelChanged();
	},
	setCaptionControl: function() {
    	this.captionControl = this.$.caption;
	},
   	secondaryLabelChanged: function() {
			this.$.secondaryLabel.setContent(this.secondaryLabel);
		if (this.secondaryLabel && this.secondaryLabel.length > 0) {
			this.$.secondaryLabel.setShowing(true);
			this.$.secondaryLabel.setContent(this.secondaryLabel.toUpperCase());
		}
		else{
			this.$.secondaryLabel.setShowing(false);
		}
	},
   	phoneChanged: function() {
		this.$.phone.setShowing(!this.hideIcon && this.phone);
	},
	videoChanged: function() {
		this.$.video.setShowing(!this.hideIcon && this.video);
	}
});