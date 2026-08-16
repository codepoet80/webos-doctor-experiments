enyo.kind({
	name: "TitleBox",
	kind: enyo.Popup,
	published: {
		title: "",
		location: ""
	},
	className: "enyo-popup titlebox",
	components: [
		{name: "title", className: "titlebox-title"}
	],
	componentsReady: function() {
		this.inherited(arguments);
		this.titleChanged();
	},
	titleChanged: function() {
		if (!this.lazy) {
			this.$.title.setContent(this.title);
		}
	}
});
