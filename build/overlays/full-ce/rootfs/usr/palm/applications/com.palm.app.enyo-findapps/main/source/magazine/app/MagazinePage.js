enyo.kind({
    name: "enyo.FindApps.Magazine.MagazinePage",
    kind: enyo.Control,
    bindingPath: "",
    templatePaths: [],
    bindingObject: {},
    hasCustomLandscapeLayout: false,
    landscapeMode: false,
    published: {
        commonFileSet: {},
        pageFileSet: {},
        name: ""
    },
    events: {
        onNext: "",
        onPrev: "",
        onDispatchGoToTarget: "",
        onDispatchDownloadApp: "",
        onDispatchLayoutRendered: "",
        onDispatchLayoutError: ""
    },
    components: [{
        kind: "WebService"
    }, {
        name: "bindingHelper",
        kind: "enyo.FindApps.Magazine.BindingHelper"
    }, {
        kind: "VFlexBox",
        components: [{
            name: "pageContainer",
            kind: "Pane",
            defaultKind: "enyo.FindApps.Magazine.BindableLayout",
            className: "magazinepage",
            onLayoutRendered: "doDispatchLayoutRendered",
            onLayoutError: "handleLayoutError"
        }]
    }],
    create: function() {
        this.inherited(arguments);
        this.commonFileSet = arguments[0].commonFileSet;
        this.pageFileSet = arguments[0].pageFileSet;
        this.name = arguments[0].name;
        this.lookupBindingPath();
        this.lookupTemplatePaths();
        this.generateLayout();
    },
    lookupBindingPath: function() {
        var fileSet = this.pageFileSet;
        this.bindingPath = undefined;
        if (fileSet && fileSet.binding && fileSet.section) {
            this.bindingPath = this.$.bindingHelper.resolveBindingPath(fileSet);
        }
        if (!this.bindingPath) {
            this.error(MagazineErrors.getErrorString(MagazineErrors.INVALID_PAGE_BINDING));
            this.doDispatchLayoutError();
            //throw MagazineErrors.INVALID_PAGE_BINDING;
        }
    },
    lookupTemplatePaths: function() {
        var fileSet = this.pageFileSet;
        var bindingHelper = this.$.bindingHelper;
        if (fileSet && fileSet.layout && fileSet.section) {
            this.templatePaths = bindingHelper.resolveTemplatePaths(fileSet);
            var numTemplates = this.templatePaths.length || 0;
            this.hasCustomLandscapeLayout = (numTemplates == 2);
        }
        if (!this.templatePaths || this.templatePaths.length == 0) {
            this.error(MagazineErrors.getErrorString(MagazineErrors.INVALID_PAGE_TEMPLATE));
            this.doDispatchLayoutError();
            //throw MagazineErrors.INVALID_PAGE_TEMPLATE;
        }
    },
    generateLayout: function() {
        if (this.commonFileSet) {
            // adding the common section styles
            this.addStyleSheets(this.commonFileSet.css);
        }
        if (this.pageFileSet) {
            // adding page specific styles
            this.addStyleSheets(this.pageFileSet.css);
        }
        var pageContainer = this.$.pageContainer;
        var i;
        for (i = 0; i < this.templatePaths.length; i++) {
            // creating BindableLayout according to templates and binding
            pageContainer.createComponent({
                owner: this,
                templatePath: this.templatePaths[i],
                bindingPath: this.bindingPath,
                topLayout: true,
                onLayoutRendered: "doDispatchLayoutRendered",
                onLayoutError: "handleLayoutError"
            });
        }
        this.orientationChanged(window.innerWidth, window.innerHeight);
        this.render();
    },
    handleLayoutError: function() {
        this.doDispatchLayoutError();
    },
    forwardGoToTarget: function(target, runtimeparams) {
        this.doDispatchGoToTarget(target, runtimeparams);
    },
    forwardDownloadApp: function(appId) {
        this.doDispatchDownloadApp(appId);
    },
    addStyleSheets: function(styles) {
        if (styles) {
            for (var s in styles) {
                if (typeof styles[s] != 'function') {
                    enyo.loadSheet(styles[s]);
                }
            }
        }
    },
    handleEvent: function(eventName, params) {
        switch (eventName) {
        case "resize":
            var width = params.width;
            var height = params.height;
            this.orientationChanged(width, height);
            break;
        default:
            ;
        }
    },
    orientationChanged: function(width, height) {
        var w = parseInt(width);
        var h = parseInt(height);
        if (this.hasCustomLandscapeLayout) {
            var currentLandscapeMode = w > h;
            if (currentLandscapeMode && !this.landscapeMode) {
                this.landscapeMode = true;
            } else if (!currentLandscapeMode && this.landscapeMode) {
                this.landscapeMode = false;
            }
        }
        this._selectOrientView();
    },
    _selectOrientView: function() {
        var view = this.landscapeMode ? 1 : 0;
        this.$.pageContainer.selectViewByIndex(view);
        this.$.pageContainer.render();
    },
    // mock triggers of the portrait and landscape orientation  
    triggerPortrait: function() {
        this.orientationChanged(100, 200);
    },
    triggerLandscape: function() {
        this.orientationChanged(200, 100);
    }
});
