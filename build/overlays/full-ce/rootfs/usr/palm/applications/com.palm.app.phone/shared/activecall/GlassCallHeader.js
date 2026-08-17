/*globals enyo */

enyo.kind({
	name: "GlassCallHeader",
	kind: "HFlexBox",
	className: "single-call-header",
	pack: "center",
	published: {
		contactAddable: false,
		title: "",
		subtitle: "",
		label: ""
	},
	events: {
		onChangeToVideoCall: "",
		onAddContact: ""
	},
	chrome: [
		{name: "changeToVideoButtonContainer", components:[
			{name: "changeToVideoButton", kind: "IconButton", showing:false, icon: "../shared/images/voice_to_video.png", className: "change-to-video-button add-contact-button", onclick: "doChangeToVideoCall"},
		]},
		{name: "titleArea", kind: "VFlexBox", components: [
			{kind: "HFlexBox", style: "width:98%;", pack: "center", components: [
			{name: "title", style: "width:95%;", className: "single-call-display-name"},
			]},
			{kind: "HFlexBox", align: "center", pack: "center", className: "single-call-info", style: "min-height: 20px; width:95%;", components: [
				{name: "client", className: "single-call-address", components: [
					{name:"subtitle", className: "single-call-address"},
				]},
				{name: "label", className: "single-call-label", showing: false}
			]}
		]},
		{name: "addContactButton", kind: "IconButton", icon: "../shared/images/menu-icon-addcontact.png", className: "add-contact-button add-contact-button-dartfish", onclick: "doAddContact"}
	],
	create: function() {
		this.inherited(arguments);
		this.contactAddableChanged();
		this.titleChanged();
		this.subtitleChanged();
		this.labelChanged();
	},
	contactAddableChanged: function() {
		// TODO: Logic needs to be modified to support Broadway and Topaz
		if (!enyo.application.isTablet) this.$.addContactButton.setStyle(this.contactAddable ? "width:10%;" : "width:0%;");
		this.$.addContactButton.setShowing(this.contactAddable);
	},
	titleChanged: function() {
		this.$.title.setContent(this.title || '');
	},
	subtitleChanged: function() {
		this.$.subtitle.setContent(this.subtitle || '');
	},
	labelChanged: function() {
		this.$.label.setContent(this.label || '');
		this.$.label.setShowing(this.label);
	},
	videoSupported: function(isVideoSupported) {
                if (true == enyo.application.Cache.IsSkypeoutCall) {
                    //enyo.log("Skypeout: no video");
                    isVideoSupported = false;
                }
		this.isVideoSupported = isVideoSupported;
		this.$.changeToVideoButton.setShowing(isVideoSupported);
		this.adjustLayout();
	},
	adjustLayout: function() {
		// TODO: Logic needs to be modified to support Broadway and Topaz
		var titleAreaWidth = 0;
		if (!this.contactAddable)
			titleAreaWidth += 10;
			
		this.contactAddableChanged();
		
		if(this.isVideoSupported === true) {
			this.$.changeToVideoButton.setShowing(true);
			this.$.changeToVideoButtonContainer.setStyle("width:17%;top:-5px;" + (this.contactAddable ? "left:-17px;" : "left:-4px;"));
			titleAreaWidth += 71;
			this.$.titleArea.setStyle("width:" + titleAreaWidth + "%;margin-top:7px;");   
		} else {
			this.$.changeToVideoButton.setShowing(false);
			this.$.changeToVideoButtonContainer.setStyle("width:0px;");
			titleAreaWidth += 90;
			this.$.titleArea.setStyle("width:" + titleAreaWidth + "%;");   
		}
	}
});
