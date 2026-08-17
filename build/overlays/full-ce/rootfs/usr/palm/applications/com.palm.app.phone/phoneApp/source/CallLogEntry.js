enyo.kind({
	name: "CallLogEntry",
	kind: enyo.VFlexBox,
	events: {
		onCallLogDrawerClick: "",
		onCallLogAvatarClick: ""
	}, 
	components: [    
			{className: "icon", components: [
					{name: "photo", kind: "Control", className: "img"},
					{kind: "Control", className: "mask"}
			]},                    
		{ className: "clv-drawerItem-displayDetails", style:"padding-top: 5px", onclick: "DrawerItemClicked", components: [ 
			{layoutKind: enyo.HLayout, components:[
				{name: "displayNm"},
				{name: "pillCountLbltab", className: "image-toggle-button-pillCountLbl", showing: false},
				{name: "favoritesIcon", className: "clv-drawerItem-favoritesIcon", showing: false}
			]},
			{name: "displayIcon"},
			{layoutKind: enyo.HLayout, components:[
				{name: "displayLbl"},
				{name: "displayVideoIcon", showing: false},
			]},
			{name: "displayLblRight", className: "clv-draweritem-displayLblRight" }
		]},
		{ className: "clv-draweritem-avatar", onclick: "AvatarClicked", components: [
			{components: [
				{name: "toggleFrame", className: "avatar-frame unOpened"},
				{name: "pillCountLbl", className: "image-toggle-button-pillCountLbl", showing: false}
			]}
		]}
	],		
	
	create: function() {
		this.inherited(arguments);
	},
	
	DrawerItemClicked: function(inSrc, inEvent) {
		this.doCallLogDrawerClick(inEvent.rowIndex); 
		enyo.stopEvent(inEvent);
	},
	
	AvatarClicked: function(inSrc, inEvent) {
		this.doCallLogAvatarClick(inEvent.rowIndex); 	
		enyo.stopEvent(inEvent);
	}
});
		
