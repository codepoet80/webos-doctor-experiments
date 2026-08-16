enyo.kind({
    name: "findApps.NavigationBar",
    kind: enyo.Control,
	style: "-webkit-transform: translate3d(0px, 0px, 0px);",
    published: {
        selectedView: "",
        allowNavigation: true
    },
    selectedViewChanged: function() {
        if (this.allowNavigation) {
            switch (this.selectedView) {
            case "Issue":
                this.$.navigationButtons.setValue(0);
                break;
            case "Browser":
                this.$.navigationButtons.setValue(1);
                break;
            case "Saved":
                this.$.navigationButtons.setValue(2);
                break;
            case "Search":
                this.$.navigationButtons.setValue(3);
                break;
            default:
                this.$.navigationButtons.setValue(0);
                break;
            }
        }
    },
    create: function() {
        //TODO have this NavigationBar Kind as a footer rather than a separate kind for each scene as every scene has a separate instance of NavigationBar
        this.inherited(arguments);
        var savedList = enyo.application.savedList;
        savedList.attach(this);
        this.updateBookmarkCaption(savedList._list.length);
    },
    components: [
    // Bottom commands
    // 	    {name: "navigationButtons", height:"54px", kind: "RadioGroup", onChange: "navigationChange", 
    // 	    	
    // 	    	components: [
    // {label: $L("Featured"), icon: "images/menu/issue-icon.png", className: "icon-with-text"}, 
    // 	      {label: $L("Categories"), icon: "images/menu/browser-icon.png", className: "icon-with-text"},
    // 	      {label: $L("Saved"), icon: "images/menu/saved-icon.png", className: "icon-with-text"},
    // 	      {label: $L("Search"), icon: "images/menu/search-icon.png", className: "icon-with-text"}
    // 	    ]}
    {
        className: "bottom-shadow",
        style: "margin-top:-9px;"
    }, {
        name: "navigationButtons",
        onChange: "navigationChange",
        className: "navigation-bar",
        kind: "TabGroup",
        components: [{
            label: $L("Featured"),
            icon: "images/menu/icon-featured.png",
            className: "icon-with-text"
        }, {
            label: $L("Categories"),
            icon: "images/menu/icon-browse.png",
            className: "icon-with-text"
        }, {
            label: $L("Bookmarks"),
            icon: "images/menu/icon-saved.png",
            className: "icon-with-text",
            name: "bookmarks"
        }, {
            label: $L("Search"),
            icon: "images/menu/icon-search.png",
            className: "icon-with-text"
        }]
    }],
    // Event handlers
    navigationChange: function(inSender) {
        if (this.allowNavigation) {
            this.switchToView(inSender.getValue());
        }
    },
    saveListChanged: function(appId, action, count) {
        this.updateBookmarkCaption(count);
    },
    updateBookmarkCaption: function(count) {
        //if (typeof(count) != "undefined" && count === 0) {
        if (count === undefined) {
            //this.log("skipping updating bookmark caption");
        } else if (count === 0) {
            this.$.bookmarks.setCaption($L("Bookmarks"));
        } else {
            this.$.bookmarks.setCaption($L("Bookmarks") + " (" + count + ")");
        }
    },
    // Helper methods
    switchToView: function(selectedNavigation) {
        var newView;
        switch (selectedNavigation) {
        case 0:
            // Magazine Issue
            newView = findApps.ViewLibrary.getView("MAGAZINE");
            //newView.reset();
            break;
        case 1:
            // Browse
            newView = findApps.ViewLibrary.getView("BROWSER");
            //newView.reset();
            break;
        case 2:
            // Saved
            newView = findApps.ViewLibrary.getView("SAVEDAPPS");
            //newView.reset();
            break;
        case 3:
            // Search
            newView = findApps.ViewLibrary.getView("SEARCHAPPS");
            newView.setParams({
                "comingFrom": ""
            });
            //newView.reset();
            break;
        default:
            newView = findApps.ViewLibrary.getView("BROWSER");
            //newView.reset();
            break;
        }
    }
});
