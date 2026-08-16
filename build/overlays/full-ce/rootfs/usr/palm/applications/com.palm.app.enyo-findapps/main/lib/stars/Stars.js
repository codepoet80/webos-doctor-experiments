//* @protected
enyo.kind({
    name: "enyo.Stars",
    kind: enyo.Control,
    published: {
        stars: 2.5,
        starWidth: 18
    },
    chrome: [{
        name: "redStars",
        className: " enyo-stars-red"
    }],
    className: "enyo-ib enyo-stars",
    create: function() {
        this.inherited(arguments);
        this.starsChanged();
    },
    starsChanged: function() {
        var w = Math.floor(this.stars * this.starWidth) + "px"
        this.$.redStars.applyStyle("width", w);
    }
});
