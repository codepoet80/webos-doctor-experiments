/**
 * This kind shows the Application Description, and handles the More / Less button clicks for the description.
 * It is used on Application Details page.
 */
enyo.kind({
    name: "findApps.AppDescription",
    kind: "enyo.Control",
    components: [{
        content: $L("Description"),
        className: "appDescriptionHeader"
    },
    // Description
    {
        name: "description",
        components: [{
            name: "descriptionText",
            kind: enyo.Control,
            className: "appDescriptionText"
        }, {
            name: "descriptionMore",
            showing: "false",
            kind: enyo.Control,
            className: "MoreLessLink",
            onclick: "onClickDescriptionMore",
            components: [{
                style: "display:inline-block;margin: 0 0 0 0;",
                content: $L("More")
            }, {
                style: "display:inline-block;margin: 0 0 0 4px;align:center;",
                kind: "Image",
                src: "images/menu/arrow_down.png"
            }]
        }, {
            name: "descriptionLess",
            showing: "false",
            kind: enyo.Control,
            className: "MoreLessLink",
            onclick: "onClickDescriptionLess",
            components: [{
                style: "display:inline-block;margin: 0 0 0 0;",
                content: $L("Less")
            }, {
                style: "display:inline-block;margin: 0 0 0 4px;align:center;",
                kind: "Image",
                src: "images/menu/arrow_up.png"
            }]
        }]
    }],
    published: {
        description: null
    },
    listRefresh: undefined,
    // Other properties
    // shortDescription
    descriptionChanged: function(oldDesc) {
        if (this.description.length > 250) {
            this.shortDescription = this.description.substr(0, 250) + "...";
            this.onClickDescriptionLess();
        } else {
            this.$.descriptionMore.hide();
            this.$.descriptionLess.hide();
            this.$.descriptionText.setContent(this.description);
        }
    },
    // Event handlers
    onClickDescriptionMore: function() {
        this.$.descriptionText.setContent(this.description);
        this.$.descriptionMore.hide();
        this.$.descriptionLess.show();
        if (this.listRefresh) this.listRefresh();
    },
    onClickDescriptionLess: function() {
        this.$.descriptionText.setContent(this.shortDescription);
        this.$.descriptionMore.show();
        this.$.descriptionLess.hide();
        if (this.listRefresh) this.listRefresh();
    }
});
