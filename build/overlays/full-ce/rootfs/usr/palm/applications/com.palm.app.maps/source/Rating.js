enyo.kind({
	name: "Rating",
	kind: enyo.HFlexBox,
	published: {
		rating: 0
	},
	defaultKind: "Image",
	components: [
		{name: "image0"},
		{name: "image1"},
		{name: "image2"},
		{name: "image3"},
		{name: "image4"}
	],
	create: function() {
		this.inherited(arguments);
		this.ratingChanged();
	},
	setImage: function(inIndex, inState) {
		this.$["image"+inIndex].setSrc("images/star-" + inState + ".png");
	},
	ratingChanged: function() {
		for (var i=0; i<5; i++) {
			this.setImage(i, "empty");
		}
		var r = Math.round(this.rating/2);
		for (var i=0; i<r; i++) {
			if (i+1 == r) {
				var m = this.rating/2 - i;
				if (m > 0.25) {
					this.setImage(i, m > 0.75 ? "full" : "half");
				}
			} else {
				this.setImage(i, "full");
			}
		}
	}
})
