/**
 * This kind is used to display the application summary information on the application Details page.
 * Following information will be shown if available:
 1. Compatible
 2. Version
 3. Updated
 4. Size
 5. Works with Messagining, Email, Calendar, Contacts, Universal Search, Dock mode
 6. Uses Location Services
 
 */
enyo.kind({
    name: "findApps.AppSummary",
    kind: "VFlexBox",
    showMoreButton: false,
    published: {
        appDetails: null
    },
    components: [
/* Possible attributes of an application:
	     			        1. Compatible
	     			        2. Version
	     			        3. Updated
	     			        4. Size
	     			        5. Works with <Connectors>, Universal Search, Dock mode
	     			        6. Uses Location Services
	     			        */
    {
        className: "application-info",
        name: "compatibleContainer",
        kind: "VFlexBox",
        components: [{
            className: "application-info-label",
            content: $L("Compatible: ")
        }, {
            kind: enyo.Control,
            name: "compatibleLbl",
            content: $L("")
        }]
    }, {
        className: "application-info",
        name: "versionContainer",
        kind: "VFlexBox",
        components: [{
            className: "application-info-label",
            content: $L("Version: ")
        }, {
            kind: enyo.Control,
            name: "versionLbl",
            content: $L("")
        }]
    }, {
        className: "application-info",
        name: "updatedContainer",
        kind: "VFlexBox",
        components: [{
            className: "application-info-label",
            content: $L("Updated:  ")
        }, {
            kind: enyo.Control,
            name: "updatedLbl",
            content: $L("")
        }]
    }, {
        className: "application-info",
        name: "sizeContainer",
        kind: "VFlexBox",
        components: [{
            className: "application-info-label",
            content: $L("Size:  ")
        }, {
            kind: enyo.Control,
            name: "sizeLbl",
            content: $L("")
        }]
    }, {
        className: "application-info",
        name: "locContainer",
        kind: "VFlexBox",
        components: [{
            name: "locationLbl",
            className: "application-info-label",
            content: $L("Uses Location Services  ")
        }, {
            kind: enyo.Control,
            content: $L(""),
            name: "locationText"
        }]
    }, {
        className: "application-info",
        kind: "LabeledContainer",
        label: $L("Works With: "),
        name: "worksWithContainer",
        components: [{
            kind: enyo.Control,
            name: "contacts",
            content: $L("Contacts")
        }, {
            kind: enyo.Control,
            name: "calendar",
            content: $L("Calendar")
        }, {
            kind: enyo.Control,
            name: "messaging",
            content: $L("Messaging")
        }, {
            kind: enyo.Control,
            name: "email",
            content: $L("Email")
        }, {
            kind: enyo.Control,
            name: "universalSearch",
            content: $L("Universal Search")
        }, {
            kind: enyo.Control,
            name: "dockMode",
            content: $L("Dock Mode")
        }]
    }, {
        className: "application-info",
        name: "moreButton",
        onclick: "showMore",
        className: "moreButton",
        components: [{
            name: "moreButtonContent",
            kind: "Pushable",
            style: "display:inline-block;margin: 0 0 0 0;",
            content: $L("More")
        }, {
            name: "upArrow",
            style: "display:inline-block;margin: 0 0 0 4px;align:center;",
            kind: "Image",
            src: "images/menu/arrow_up.png"
        }, {
            name: "downArrow",
            style: "display:inline-block;margin: 0 0 0 4px;align:center;",
            kind: "Image",
            src: "images/menu/arrow_down.png"
        }]
    }, {
        name: "utcdate",
        kind: "findApps.UTCDate"
    }],
    /*
    published: {
        appDetails: null
    },
    */
    appDetailsChanged: function(oldDetails) {
        this.showLess();
    },
    showLess: function() {
        // Compatible
        if (this.appDetails.supportedDevices) {
            if (typeof(this.appDetails.supportedDevices) === "string") {
                this.$.compatibleLbl.setContent(this.appDetails.supportedDevices);
            } else {
                var compatText = this.appDetails.supportedDevices[0];
                for (var i in this.appDetails.supportedDevices) {
                    if (i == 0) continue;
                    compatText = compatText + ", " + this.appDetails.supportedDevices[i];
                }
                this.$.compatibleLbl.setContent(compatText);
            }
            this.$.compatibleContainer.show();
        } else {
            this.$.compatibleContainer.hide();
        }
        // Version
        if (this.appDetails.version) {
            this.$.versionContainer.show();
            this.$.versionLbl.setContent(this.appDetails.version);
        } else {
            this.$.versionContainer.hide();
        }
        // Updated time
        if (this.appDetails.lastModifiedTime) {
            this.$.updatedContainer.show();
            var date = this.$.utcdate.parse(this.appDetails.lastModifiedTime);
            var str = findApps.Utilities.Formatter.formatLongDate(date);
            this.$.updatedLbl.setContent(str);
        } else {
            this.$.updatedContainer.hide();
        }
        // Size in mb
        if (this.appDetails.installSize) {
            this.$.sizeContainer.show();
            // calculate the size in MB
            var formattedAppSize = (this.appDetails.installSize / (1024 * 1024)) + 1;
            formattedAppSize = findApps.Utilities.Formatter.formatRound(formattedAppSize) + " " + $L("MB");
            this.$.sizeLbl.setContent(formattedAppSize);
        } else {
            this.$.sizeContainer.hide();
        }
        if ((this.appDetails.attributes && this.appDetails.attributes.provides && (this.appDetails.attributes.provides.dockMode || this.appDetails.attributes.provides.universalSearch)) || this.appDetails.islocationbased) {
            this.$.moreButton.show();
            this.$.moreButtonContent.setContent($L("More"));
            this.showMoreButton = true;
            this.$.moreButton.onclick = "showMore";
            this.$.upArrow.hide();
            this.$.downArrow.show();
        } else {
            this.$.moreButton.hide();
            this.showMoreButton = false;
        }
        // Hide remaining parameters
        this.$.dockMode.hide();
        this.$.universalSearch.hide();
        this.$.worksWithContainer.hide();
        this.$.locationLbl.hide();
        this.$.locationText.hide();
    },
    showMore: function() {
        if (this.appDetails.attributes.provides) {
            var provides = this.appDetails.attributes.provides;
            var showWorksWith = false;
            var worksWithContacts = false,
                worksWithEmail = false,
                worksWithMessaging = false,
                worksWithCalendar = false;
            if (provides.dockMode) {
                showWorksWith = true;
                this.$.dockMode.show();
            } else {
                this.$.dockMode.hide();
            }
            if (provides.universalSearch) {
                showWorksWith = true;
                this.$.universalSearch.show();
            } else {
                this.$.universalSearch.hide();
            }
            if (provides.connectors) {
                for (var i in provides.connectors) {
                    if (provides.connectors[i] == "CONTACTS") {
                        this.$.contacts.show();
                        worksWithContacts = true;
                        showWorksWith = true;
                    } else if (provides.connectors[i] == "EMAIL") {
                        this.$.email.show();
                        worksWithEmail = true;
                        showWorksWith = true;
                    } else if (provides.connectors[i] == "MESSAGING") {
                        this.$.messaging.show();
                        worksWithMessaging = true;
                        showWorksWith = true;
                    } else if (provides.connectors[i] == "CALENDAR") {
                        this.$.calendar.show();
                        worksWithCalendar = true;
                        showWorksWith = true;
                    }
                }
            }
            if (showWorksWith) this.$.worksWithContainer.show();
            else this.$.worksWithContainer.hide();
            if (worksWithContacts == false) {
                this.$.contacts.hide();
            }
            if (worksWithCalendar == false) {
                this.$.calendar.hide();
            }
            if (worksWithEmail == false) {
                this.$.email.hide();
            }
            if (worksWithMessaging == false) {
                this.$.messaging.hide();
            }
        } else {
            this.$.worksWithContainer.hide();
        }
        if (this.appDetails.islocationbased) {
            this.$.locationLbl.show();
        } else {
            this.$.locationLbl.hide();
        }
        //programType
        //releaseStatus
        // Change label of more to less
        this.$.moreButtonContent.setContent($L("Less"));
        this.$.upArrow.show();
        this.$.downArrow.hide();
        this.$.moreButton.onclick = "showLess";
    }
});
