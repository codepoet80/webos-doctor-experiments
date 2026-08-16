enyo.kind({
    name: "enyo.FindApps.Magazine.BindableLayout",
    kind: "Control",
    // template content (text) once template definition has been loaded
    templateContent: "",
    // binding content (object) once binding has been loaded
    bindingObject: {},
    // owner magazine page of this layout
    magazinePage: {},
    // given template and binding paths
    published: {
        templatePath: "",
        bindingPath: "",
        topLayout: false
    },
    stages: {},
    boundAndRendered: false,
    // used to dispatch the nagivation event to the magazine page
    events: {
        onGoToTarget: "",
        onGoToSave: "",
        onLayoutRendered: "",
        onLayoutError: ""
    },
    // handler lookup for each stage (appPrefetch, pathResolve, appInfo)
    stageHandlerByNameLookup: {},
    components: [{
        name: "getLocalFile",
        kind: "WebService"
    }, {
        name: "bindingHelper",
        kind: "enyo.FindApps.Magazine.BindingHelper"
    }, {
        name: "getAppDetailsService",
        kind: "enyo.FindApps.Magazine.AppInfoService",
        onGetAppList: "handleAppDetailsResponse"
    }
    ],
    handleLayoutError: function() {
    	if (this.topLayout) {
    		this.createComponent({
    			kind: "VFlexBox",
    			pack: "center",
    			align: "center",
    		    height: "100%",
    	        name: "pageErrorMsgBox",
    	        components: [
					{
				       kind: enyo.Control,
				       className: "magazine-error-page",
				       content: $L("Page unavailable."),
				       flex: 1
				    }
    	        ]
    	    });
    		
    		this.render();
    	}
    	this.doLayoutError();
    },
    create: function() {
        this.inherited(arguments);
        this._initHandlersLookup();
        // Not sure this wasn't previously mixed in by enyo
        this.templatePath = arguments[0].templatePath;
        this.bindingPath = arguments[0].bindingPath;
        this.magazinePage = this.findMagazinePage();
        this.loadTemplate();
    },
    loadTemplate: function() {
        if (this.templatePath) {
            this.$.getLocalFile.call(null, {
                url: this.templatePath,
                handleAs: "text",
                onSuccess: "templateLoaded",
                onFailure: "templateNotLoaded"
            });
        } else {
            this.error(MagazineErrors.getErrorString(MagazineErrors.TEMPLATE_NOT_PROVIDED));
            this.handleLayoutError();
            //throw MagazineErrors.TEMPLATE_NOT_PROVIDED;
        }
    },
    templateLoaded: function(inSender, inResponse) {
        this.templateContent = inResponse;
        this.loadBinding();
    },
    loadBinding: function() {
        this.$.getLocalFile.call(null, {
            url: this.bindingPath,
            handleAs: "json",
            onSuccess: "bindingLoaded",
            onFailure: "bindingNotLoaded"
        });
    },
    bindingLoaded: function(inSender, inResponse) {
        this.bindingObject = inResponse;
        
        if(enyo.isString(this.bindingObject)) {
	        try {
	        	this.bindingObject = enyo.json.parse(this.bindingObject);
	        }
	        catch(e) {
	        	// Invalid JSON object
	        	this.bindingNotLoaded(inSender, inResponse);
	        	return;
	        }
        }
        var commonFileSet = this.magazinePage.getCommonFileSet();
        var pageFileSet = this.magazinePage.getPageFileSet();
        this.createBindingStages();
    },
    createBindingStages: function() {
        var bindings = this.bindingObject;
        var bindingHelper = this.$.bindingHelper;
        var value;
        var stageName;
        this._initStages();
        var stage;
        var stageItem;
        // processing each key:value of the bindings
        for (var key in bindings) {
            if (typeof bindings[key] != 'function') {
                value = bindings[key];
                stageName = bindingHelper.findResolvingStageName(key, value);
                // stage not identified, probably just an actual literal no resolution needed.
                if (!stageName) {
                    continue;
                }
                stage = this.stages[stageName];
                /* Dynamic stages could be added, just make sure to provide the
				   corresponding handler in stageHandlerByNameLookup */
                if (!stage) {
                    this.stages[stageName] = {
                        pending: false
                    };
                }
                if (stage && !stage.pending) {
                    stage.pending = true;
                    this.stages.pendingStages++;
                }
                var handler = this.stageHandlerByNameLookup[stageName];
                if (handler && handler.buildStage) {
                    handler.buildStage.apply(this, [bindings, key, value, stage]);
                }
            }
        }
        this.processStages();
    },
    processStages: function(m) {
        var stages = this.stages;
        for (var stageName in stages) {
            if (typeof stages[stageName] != 'function') {
                var stage = stages[stageName];
                if (stage.pending) {
                    var handler = this.stageHandlerByNameLookup[stageName];
                    if (handler && handler.handleRequest) {
                        var asynch = handler.handleRequest.apply(this, [stage]);
                        if (asynch) {
                            // asynch processing, we'll continue once we get the response for this stage.
                            break;
                        } else {
                            this.stages.pendingStages--;
                        }
                    }
                }
            }
        }
        if (stages.pendingStages === 0) {
            return this.bindAndRender();
        }
    },
    findMagazinePage: function() {
        var o = this.owner;
        while (o && !(o instanceof enyo.FindApps.Magazine.MagazinePage)) {
            o = o.owner;
        }
        if (!o) {
            this.handleLayoutError();
            //throw MagazineErrors.ROOT_PAGE_NOT_FOUND;
        }
        return o;
    },
    bindAndRender: function(inSender, inResponse) {
        if (!this.boundAndRendered) {
            this.boundAndRendered = true;
            var comps = enyo.macroize(this.templateContent, this.bindingObject);
            //comps = enyo.json.parse(comps);
            try {
            	comps = eval('(' + comps + ')');
            }
            catch(e) {
            	// Error in eval
            	this.error("Error when evaluating javascript in magazine");
            	this.handleLayoutError();
            	return;
            }
            this.createComponents(comps);
            this.render();
            if (this.topLayout) {
                this.doLayoutRendered();
            }
        }
    },
    templateNotLoaded: function(inSender, inResponse) {
        this.error(MagazineErrors.getErrorString(MagazineErrors.TEMPLATE_NOT_LOADED) + " template: " + this.templatePath);
        this.handleLayoutError();
        //throw MagazineErrors.TEMPLATE_NOT_LOADED;
    },
    bindingNotLoaded: function(inSender, inResponse) {
        this.error(MagazineErrors.getErrorString(MagazineErrors.BINDING_NOT_LOADED));
        this.handleLayoutError();
        //throw MagazineErrors.BINDING_NOT_LOADED;
    },
    handleAppDetailsResponse: function(inSender, inResponse) {
        this.handleResponse(STAGES.APP_INFO, inResponse);
    },
    handleResponse: function(stageName, inResponse) {
        var handler = this.stageHandlerByNameLookup[stageName];
        var stage = this.stages[stageName];
        if (stage && handler) {
            handler.handleAsyncResponse.apply(this, [stage, inResponse]);
            this.stages.pendingStages--;
            this.processStages();
        } else {
            this.error("Invalid stageName " + stageName);
        }
    },
    _initHandlersLookup: function() {
        this.stageHandlerByNameLookup[STAGES.PATH_RESOLVE] = pathBindingStageHandler;
        this.stageHandlerByNameLookup[STAGES.APP_PREFETCH] = prefetchBindingStageHandler;
        this.stageHandlerByNameLookup[STAGES.APP_INFO] = appInfoBindingStageHandler;
    },
    /* Just a convenient function to create emty well known stages.
	   Other stages different from (appPrefetch, pathResolve, appInfo) can be added dynamically.
	*/
    _initStages: function() {
        this.stages = {
            pendingStages: 0,
        };
        this.stages[STAGES.PATH_RESOLVE] = {
            pending: false,
            items: []
        };
        this.stages[STAGES.APP_INFO] = {
            pending: false
        };
        this.stages[STAGES.APP_PREFETCH] = {
            pending: false,
            items: []
        }
    },
    goToTargetAction: function(inSender) {
        this.magazinePage.forwardGoToTarget(inSender.target, inSender.runtimeParams);
    },
    downloadAppAction: function(inSender) {
        this.magazinePage.forwardDownloadApp(inSender.appId);
    },
    saveForLater: function(inSender) {
        var appitem = {
            "publicApplicationId": inSender.publicAppId
        };
        inSender.processAction(appitem);
    },
    delegate: function(inSender) {
        if (inSender.target) {
            var handler = eval(inSender.target);
            handler.apply(this, [inSender]);
        }
    }
});
