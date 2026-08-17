enyo.kind({
	name: "ImageToggleButton",
	kind: enyo.Control,
	style: "position:relative;",
	published: {
		state: false,
		imgSrc: "",
		pillcount: 0,
	},
	events: {
		onChange: ""
	},
	components: [
		{name: "img", kind: enyo.Image, className: "image-toggle-button-avatar-image"},  
		{name: "toggleImg", className: "avatar-frame unOpened"},
		{ name: "pillCountLbl", className: "image-toggle-button-pillCountLbl", content: "2", showing: false}
	],

	create: function() {
		this.inherited(arguments);
		this.imgSrcChanged();
		this.pillcountChanged();
		//this.stateChanged();
	},

	stateChanged: function() {
		this.$.toggleImg.setClassName("avatar-frame " + ((this.state == true) ? "Opened" : "unOpened"));
	},

	imgSrcChanged: function() {
		this.$.img.setSrc(this.imgSrc);
	},

	stateTrueClassNameChanged: function() {
		this.stateChanged();
	},

	stateFalseClassNameChanged: function() {
		this.stateChanged();
	},
	
	pillcountChanged: function() {
		if (this.pillcount > 1) {
			this.$.pillCountLbl.content = this.pillcount.toString();
			this.$.pillCountLbl.setShowing(true);
		}
	},

	clickHandler: function() {
		this.setState(!this.getState());
		this.doChange(this.state);
	}
});
