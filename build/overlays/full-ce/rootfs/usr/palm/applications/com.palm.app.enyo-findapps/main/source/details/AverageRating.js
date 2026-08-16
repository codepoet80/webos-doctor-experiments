/*
 *
 *  findApps.AverageRating
 *
 * */
enyo.kind({
    name: "findApps.AverageRating",
    kind: "VFlexBox",
    className: "average-rating",
    width: "220px",
    published: {
        appRatingData: null
    },
    components: [{
        kind: "HFlexBox",
        pack: "center",
        height: "90px",
        style: "margin-bottom:4px;",
        components: [{
            width: "64px",
            components: [{
                name: "positive_rating",
                height: "64px",
                className: "small-bubble small-positive-rating",
                components: [{
                    name: "positive_rating_value",
                    className: "value"
                }]
            }, {
                content: $L("positive"),
                style: "text-transform:lowercase;color:#60913d;font-size:16px;text-align:right;margin-right:4px;"
            }]
        }, {
            width: "64px",
            components: [{
                name: "negative_rating",
                height: "64px",
                className: "small-bubble small-negative-rating",
                components: [{
                    name: "negative_rating_value",
                    className: "value"
                }]
            }, {
                content: $L("negative"),
                style: "text-transform:lowercase;color:#911d21;font-size:16px;text-align:left;margin-left:4px;"
            }]
        }]
    }, {
        kind: "HFlexBox",
        components: [{
            kind: "Image",
            src: "images/stars/stars-mono-5.png"
        }, {
            kind: "ProgressBar",
            flex: 1,
            position: "0",
            name: "five_stars",
            domStyles: {
                color: "gray"
            },
            className: "grey-progress"
        }, {
            name: "star_count5",
            content: "0",
            style: "margin-left:20px;"
        }]
    }, {
        kind: "HFlexBox",
        components: [{
            kind: "Image",
            src: "images/stars/stars-mono-4.png"
        }, {
            kind: "ProgressBar",
            flex: 1,
            position: "0",
            name: "four_stars",
            className: "grey-progress"
        }, {
            name: "star_count4",
            content: "0",
            style: "margin-left:20px;"
        }]
    }, {
        kind: "HFlexBox",
        components: [{
            kind: "Image",
            src: "images/stars/stars-mono-3.png"
        }, {
            kind: "ProgressBar",
            flex: 1,
            position: "0",
            name: "three_stars",
            className: "grey-progress"
        }, {
            name: "star_count3",
            content: "0",
            style: "margin-left:20px;"
        }]
    }, {
        kind: "HFlexBox",
        components: [{
            kind: "Image",
            src: "images/stars/stars-mono-2.png"
        }, {
            kind: "ProgressBar",
            flex: 1,
            position: "0",
            name: "two_stars",
            className: "grey-progress"
        }, {
            name: "star_count2",
            content: "0",
            style: "margin-left:20px;"
        }]
    }, {
        kind: "HFlexBox",
        components: [{
            kind: "Image",
            src: "images/stars/stars-mono-1.png"
        }, {
            kind: "ProgressBar",
            flex: 1,
            position: "0",
            name: "one_star",
            className: "grey-progress"
        }, {
            name: "star_count1",
            content: "0",
            style: "margin-left:20px;"
        }]
    }],
    
    reset: function(){
        this.$.positive_rating.setClassName("small-bubble small-positive-rating");
        this.$.positive_rating_value.setContent("");
        
        this.$.negative_rating.setClassName("small-bubble small-negative-rating");
        this.$.negative_rating_value.setContent("");
        
        this.$.star_count5.setContent(0);
        this.$.star_count4.setContent(0);
        this.$.star_count3.setContent(0);
        this.$.star_count2.setContent(0);
        this.$.star_count1.setContent(0);
        
        this.$.five_stars.setPosition(0);
        this.$.four_stars.setPosition(0);
        this.$.three_stars.setPosition(0);
        this.$.two_stars.setPosition(0);
        this.$.one_star.setPosition(0);
    },

    // FIXME: there is probably a better way to do this
    setRatingBubbles: function() {
        if (this.appRatingData.percentPositive == this.appRatingData.percentNegative) {
            this.$.positive_rating.setClassName("big-bubble big-positive-rating");
            this.$.negative_rating.setClassName("big-bubble big-negative-rating");
        }
        if (this.appRatingData.percentPositive > this.appRatingData.percentNegative) {
            this.$.positive_rating.setClassName("big-bubble big-positive-rating");
            this.$.negative_rating.setClassName("small-bubble small-negative-rating");
        }
        if (this.appRatingData.percentPositive < this.appRatingData.percentNegative) {
            this.$.positive_rating.setClassName("small-bubble small-positive-rating");
            this.$.negative_rating.setClassName("big-bubble big-negative-rating");
        }
    },
    appRatingDataChanged: function() {
        //var percentFmt = new enyo.g11n.NumberFmt({style: "percent"});
        this.setRatingBubbles();
        if(this.appRatingData.percentPositive !== undefined)
            this.$.positive_rating_value.setContent(findApps.Utilities.Formatter.formatPercent(this.appRatingData.percentPositive));
        if(this.appRatingData.percentNegative !== undefined)
            this.$.negative_rating_value.setContent(findApps.Utilities.Formatter.formatPercent(this.appRatingData.percentNegative));
        // setting numbers
        if (this.appRatingData.stars) {
            this.$.star_count5.setContent(this.appRatingData.stars["5"]);
            this.$.star_count4.setContent(this.appRatingData.stars["4"]);
            this.$.star_count3.setContent(this.appRatingData.stars["3"]);
            this.$.star_count2.setContent(this.appRatingData.stars["2"]);
            this.$.star_count1.setContent(this.appRatingData.stars["1"]);
            // setting progress pills
            this.$.five_stars.setPosition(Math.round((this.appRatingData.stars["5"] * 100) / this.appRatingData.totalCount));
            this.$.four_stars.setPosition(Math.round((this.appRatingData.stars["4"] * 100) / this.appRatingData.totalCount));
            this.$.three_stars.setPosition(Math.round((this.appRatingData.stars["3"] * 100) / this.appRatingData.totalCount));
            this.$.two_stars.setPosition(Math.round((this.appRatingData.stars["2"] * 100) / this.appRatingData.totalCount));
            this.$.one_star.setPosition(Math.round((this.appRatingData.stars["1"] * 100) / this.appRatingData.totalCount));
        }
    }
});
