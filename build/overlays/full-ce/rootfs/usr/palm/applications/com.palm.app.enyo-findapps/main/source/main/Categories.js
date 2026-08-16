enyo.kind({
    name: "findApps.Categories",
    published: {
        categories: [],
        currentSelectRowIndex: 0
    },
    events: {
        onCategoryClick: ""
    },
    currentSelectRowIndex: 0,
    kind: "VFlexBox",
    flex: 1,
    horizontal: false,
    autoHorizontal: false,
    components: [
    // {kind: "PageHeader", content: "Categories"},
    {
        className: "top-shadow"
    }, {
        className: "right-shadow"
    }, {
        name: "category_scroller",
        kind: "Scroller",
        flex: 1,
        components: [
        {
            name: "category_list",
            className: "category-list",
            kind: "VirtualRepeater",
            onSetupRow: "categorySetupRow",
            components: [{
                kind: "Item",
                layoutKind: "HFlexLayout",
                tapHighlight: "true",
                onclick: "itemClick",
                components: [{
                    name: "category_icon",
                    kind: "Image"
                }, {
                    name: "category_name",
                    style: "line-height:32px;margin-left:8px;overflow:hidden;text-overflow:ellipsis;"
                }]
            }]
        }]
    }],
    refresh: function() {
        this.$.category_list.render();
    },
    currentSelectRowIndexChanged: function(inOldCurrentSelectRowIndex) {
        if(this.currentSelectRowIndex === inOldCurrentSelectRowIndex) return;
        this.refresh();
    },
    categoriesChanged: function(inOldCategories) {
        if(this.categories === inOldCategories) return;
        this.refresh();
    },
    categorySetupRow: function(inSender, inIndex) {
        var category = this.categories[inIndex];
        if (category) {
            this.$.category_icon.setSrc("images/" + (category.iconLocation || "category-icons/home/") + "category-selector.png");
            if (inIndex == 0) {
                // If index is 0, replace "Home" to "All Apps" by "UI Addendum v4c_2_3_2011.pdf" designation.
                this.$.category_name.setContent($L("All Apps"));
            } else {
                // XXX OLD API compatibility name => label
                this.$.category_name.setContent(category.name || category.label);
            }
            // DFISH-3776: highlight the user selected category
            var isRowSelected = (inIndex == this.currentSelectRowIndex);
            if (isRowSelected) {
                this.$.item.addClass("enyo-held");
            } else {
                this.$.item.removeClass("enyo-held");
            }
            return true;
        }
    },
    itemClick: function(inSender, inEvent) {
        // Note: category id and index of the selected category in the list may not match
        // Pass the selected index, so that the right category from the categories list can be selected
        this.doCategoryClick(inEvent.rowIndex);
        
    //when a category is selected, the AppCatalog.js updates the applications for that category and 
    //then sets the selected index, causing resized to be called on categories. Hence commenting below lines
    // DFISH-3776: record the selected row index and invoke the whole row list render to highlight it
    //this.currentSelectRowIndex = inEvent.rowIndex;
    //this.$.category_list.refresh();
    }
});
