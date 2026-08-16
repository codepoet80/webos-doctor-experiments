/* This kind helps to provide the select app functionality required in the expert review page.

   It was implemented with the following goals in mind:

   1) Impose as few constraints as possible about how the page looks (colors, structure, etc.)
   
   2) Provide a simple interaction model for the layout author (Marketing Team), so She/He could
      provide which elements trigger the select app action, etc.
      
   There are several things that could be improved or replaced by less complex mechanisms:
   
   1) The select selectApp function is inkoved indirectly from the default.lo.js by calling 
      the delegate function of the BindableLayout and passing the target "this.$.expertReview.selectApp"
      
      Therefore within the selectApp function the variable "this" points to the BindableLayout instance, 
      forcing to get a reference for the expertReview object (myself) through its parent.
      
   It would be nice if any given control in the default.lo.js could call directly the selectApp function.
   
   2) The selection mechanism work by re-positioning the pre-determined "selectorImg" to the corresponding target. 
      A more fancy animation could be implemented here.
*/
enyo.kind({
    name: "enyo.FindApps.Magazine.ExpertReview",
    kind: enyo.Control,
    appIdViewIndexLookup: {},
    create: function() {
        this.inherited(arguments);
        var paneViewKind = this.appDetails.appDetailsKind || "enyo.FindApps.Magazine.BindableLayout";
        // dynamically creating the pane for app details.
        // NOTE: it didn't work using a static definition
        this.createComponent({
            owner: this,
            name: "appDetailContainer",
            kind: "Pane",
            defaultKind: paneViewKind
        });
        this._createAppDetailsPane();
    },
    _createAppDetailsPane: function() {
        var i, appId, bindingPath;
        var defaultTemplate = this.appDetails.defaultTemplatePath || "";
        var apps = this.appDetails.apps || [];
        var appDetailContainer = this.$.appDetailContainer;
        for (i = 0; i < apps.length; i++) {
            appId = apps[i].appId;
            bindingPath = apps[i].bindingPath;
            this.appIdViewIndexLookup[appId] = i;
            appDetailContainer.createComponent({
                owner: this,
                templatePath: defaultTemplate,
                bindingPath: bindingPath,
                topLayout: false
            });
        }
        appDetailContainer.selectViewByIndex(0);
        this.render();
    },
    selectApp: function(inSender) {
        var myself = inSender.owner.$.expertReview;
        var selectorImgStyle = inSender.selectorImgStyle;
        var selectorImg = inSender.owner.$.selectorImg;
        // very simple mechanism to re-position the selector image.
        // a more fancy animation logic could be used here.
        if (selectorImg && selectorImgStyle) {
            selectorImg.setStyle(selectorImgStyle);
        }
        // looking up the corresponding view index by app id
        var viewIndex = myself.appIdViewIndexLookup[inSender.appId];
        myself.$.appDetailContainer.selectViewByIndex(viewIndex);
    }
});
