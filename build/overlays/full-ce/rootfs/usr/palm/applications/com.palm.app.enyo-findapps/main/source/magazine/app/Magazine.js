enyo.kind({
    name: "enyo.FindApps.Magazine.Magazine",
    kind: enyo.VFlexBox,
    events: {
        onMagazineGoToTarget: ""
    },
    DEFAULT_PAGE: 0,
    currentEdition: {},
    // collection of common files grouped by types
    commonFileSet: {
        layout: {},
        image: {},
        css: {},
        binding: {}
    },
    // This is a collection of file entries for the current edition obtained from the Database
    // Database may return results in pages, hence need a data structure to store the retrieved page results
    editionFileSet: [],
    // collection of common files for each magazine page
    fileSetArray: [],
    // convenient handle for current magazine page number
    currentPageNum: 0,
    maxNumPages: 0,
    currentMagazinePage: undefined,
    // working in fallback mode to the default edition.
    usingDefaultEdition: false,
    // well known navigation targets. Dynamic targets for each page will be added at runtime (ex: page0, page1, etc)
    magazineDefinedTarget: {
        "cover": {
            type: "internal",
            pageNum: 0
        },
        "contents": {
            type: "internal",
            pageNum: 1
        },
        "toc": {
            type: "internal",
            pageNum: 1
        },
        "my-account": {
            type: "external"
        },
        "preferences": {
            type: "external"
        },
        "saved": {
            type: "external"
        },
        "appdetails": {
            type: "external"
        },
        "searchlist": {
            type: "external"
        }
    },
    components: [{
        name: "magazineHelper",
        kind: "enyo.FindApps.Magazine.MagazineHelper"
    },
    // Fade transition has been used for the lack of a better one.
    {
        name: "magazineContainer",
        kind: "enyo.FindApps.Magazine.MagazinePageCarousel",
        accelerated: false,
        onGetLeft: "handlePrevPage",
        onGetRight: "handleNextPage",
        defaultKind: "enyo.FindApps.Magazine.MagazinePage"
    }, {
        name: "getEdition",
        kind: "DbService",
        dbKind: "com.palm.appcatalog.editioninfo:3",
        method: "find",
        onSuccess: "gotEdition",
        onFailure: "getEditionFailed"
    }, {
        name: "getEditionFileSet",
        kind: "DbService",
        dbKind: "com.palm.appcatalog.editionfile:2",
        method: "find",
        onSuccess: "gotEditionFileSet",
        onFailure: "getEditionFileSetFailed"
    }, {
        kind: "WebService"
    }, {
        kind: "enyo.FindApps.Magazine.EditionsMgrHelper",
        name: "editionsMgrHelper"
    }, {
        kind: "Scrim",
        name: "scrim",
        animateShowing: false,
        layoutKind: "VFlexLayout",
        align: "center",
        pack: "center",
        components: [{
            kind: "SpinnerLarge",
            name: 'spinner',
            showing: false
        }]
    }],
    create: function() {
        this.inherited(arguments);
        this.showScrim();
        var appCatalog = this.owner;
        var topContainer = findApps.ViewLibrary._container;
        // Trigger the Editions Mgr. Service to fetch new edition if it exists
        // Pass AC Country and device locale
        this.$.editionsMgrHelper.getEdition(findApps.UserSession.getActivationCountry().toUpperCase(), enyo.g11n.currentLocale().toISOString());
        if (AppCatalog.Config.draftEditionDir) {
            this.loadDraftEdition();
        } else {
            // Fetch the current edition for the ac country and current device locale
            this.$.getEdition.call({
                query: {
                    where: [{
                        prop: "version",
                        op: "=",
                        val: "current",
                        "limit": 1,
                        "publishDate": "timestamp",
                        "desc": true
                    }, {
                        prop: "country",
                        op: "=",
                        val: findApps.UserSession.getActivationCountry().toUpperCase()
                    }, {
                        prop: "locale",
                        op: "=",
                        val: enyo.g11n.currentLocale().toISOString()
                    }]
                }
            });
            // Test code - loading default edition always
            /*this.log("Loading default edition for testing");
        	this.loadDefaultEdition();*/
        }
    },

    gotEdition: function(inSender, inResponse, inRequest) {
        var loadDefaultEdition = true;
        var currentEditionNumber;
        if (inResponse.results && inResponse.results.length > 0) {
            this.currentEdition = inResponse.results[0];
            if (this.currentEdition && this.currentEdition.number && this.currentEdition.revision) {
                currentEditionNumber = this.currentEdition.number;
                loadDefaultEdition = false;
                // now retrieving the current edition file set
                // TODO better moved to a separate edition service or helper
                this.$.getEditionFileSet.call({
                    query: {
                        where: [{
                            prop: "edition",
                            op: "=",
                            val: this.currentEdition.number
                        }, {
                            prop: "revision",
                            op: "=",
                            val: this.currentEdition.revision
                        }]
                    }
                });
            }
        }
        if (loadDefaultEdition == true) {
            // load default edition
            this.loadDefaultEdition();
        }
    },
    gotDefaultEditionFileSet: function(inSender, inResponse, inRequest) {
        // Initialize the currentEdition strucutre based on the manifest.json
        this.currentEdition = {
            "_id": "00001",
            "_kind": "com.palm.appcatalog.editioninfo:3",
            "numPages": inResponse.numPages,
            "number": "1",
            "publishDate": inResponse.publishDate
        };
        this.gotEditionFileSet(inSender, inResponse, inRequest, true);
    },
    gotEditionFileSet: function(inSender, inResponse, inRequest, initialize) {
    	
    	if(inRequest.json || initialize) {
    		var requestJSON = undefined;
    		if(inRequest.json) {
	    		try {
	    			
	    			requestJSON = JSON.parse(inRequest.json);
	    		}
	    		catch(e) {
	    			this.error("Request JSON not valid.");
	    			initialize = true;
	    		}
    		}
    		// Initialize the arrays only if:
    		// initialize flag is set to true explicitly (when loading default edition)
    		// OR when the result is the first page of the results (do not reinitialize for subsequent pages)
			if((requestJSON && !requestJSON.query.page) || initialize) {
		    	/* Initialize the edition file sets */
		    	this.commonFileSet = {
			        layout: {},
			        image: {},
			        css: {},
			        binding: {}
		    	};
		    	this.editionFileSet = [];
		    	// collection of common files for each magazine page
		    	this.fileSetArray = [];
			}
    	}
        var nextPageKey = "";
        if (inResponse && inResponse.next) nextPageKey = inResponse.next;
        if (inResponse.results && inResponse.results.length > 0) {
            this.editionFileSet = this.editionFileSet.concat(inResponse.results);
            if (nextPageKey != "") {
                // Next page of results exists, query further to get the complete file set
                this.$.getEditionFileSet.call({
                    query: {
                        page: nextPageKey,
                        where: [{
                            prop: "edition",
                            op: "=",
                            val: this.currentEdition.number
                        }, {
                            prop: "revision",
                            op: "=",
                            val: this.currentEdition.revision
                        }]
                    }
                });
            } else {
                this.processEditionFileSet(this.editionFileSet);
            }
        } else {
            this.error(MagazineErrors.getErrorString(MagazineErrors.EDITION_NOT_LOADED) + " - Empty edition set");
            this.loadDefaultEdition();
        }
    },
    processEditionFileSet: function(fileInfoArray) {
        var successfulEditionLoaded = false;
        if (fileInfoArray && fileInfoArray.length > 0) {
            var i;
            for (i = 0; i < fileInfoArray.length; i++) {
                this.registerEditionFile(fileInfoArray[i]);
            }
            successfulEditionLoaded = true;
        } else {
            this.error("ACC Magazine: Couldn't load file set for current edition " + this.currentEdition._id + " " + this.currentEdition.number);
            this.loadDefaultEdition();
        }
        if (successfulEditionLoaded) {
            // always displaying page 0 by default
            this.currentPageNum = this.DEFAULT_PAGE;
            //this.hideScrim();
            this.$.magazineContainer.setCenterView(this.getView(this.currentPageNum));
        }
    },
    registerEditionFile: function(fileInfo) {
        var pageNum = this.$.magazineHelper.getPageNum(fileInfo.section);
        this.maxNumPages = Math.max(this.maxNumPages, pageNum);
        var targetFileSet;
        // fileInfo belongs to the common section, taking common file set as target
        if (pageNum === -1) {
            targetFileSet = this.commonFileSet;
            // fileInfo belongs to one specific page section, taking page file set as target
        } else {
            if (!this.fileSetArray[pageNum]) {
                this.fileSetArray[pageNum] = {
                    layout: {},
                    image: {},
                    css: {},
                    binding: {},
                    section: ""
                };
            }
            targetFileSet = this.fileSetArray[pageNum];
        }
        if (targetFileSet && targetFileSet[fileInfo.type]) {
            // adding the logical-to-physical path mapping to the corresponding file set collection (layouts, images, etc)
            targetFileSet[fileInfo.type][fileInfo.logicalPath] = fileInfo.physicalPath;
            targetFileSet.section = fileInfo.section;
        } else {
            this.error("Missing file set for pagenum [" + pageNum + "] and section [" + fileInfo.section + "]");
        }
    },
    getView: function(index) {
        if (index >= 0 && index < this.currentEdition.numPages) {
            var pageNum = index;
            //var pane = this.$.magazineContainer;
            // var paneViewIndex = 0;
            var targetName = "page" + pageNum;
            // var viewIndex = this.paneViewIndexArray[pageNum];
            // Haven't displayed the frist page or given page number hasn't beed rendered yet.
            // if (!viewIndex && viewIndex !== 0) {
            // keeping track of the view index were this page will be displayed
            // this.paneViewIndexArray[pageNum] = pane.views.length;
            // creating the page target for future nagivation purposes
            var newMagazineTarget = {
                type: "internal",
                pageNum: pageNum
            };
            // registering the page target
            this.magazineDefinedTarget[targetName] = newMagazineTarget;
            // creating the MagazinePage
            return {
                name: targetName + ((new Date()).getTime()),
                commonFileSet: this.commonFileSet,
                pageFileSet: this.fileSetArray[pageNum],
                onDispatchGoToTarget: "handleGoToTarget",
                onDispatchDownloadApp: "handleDownloadApplication",
                onDispatchLayoutRendered: "handleDispatchLayoutRendered",
                onDispatchLayoutError: "handleDispatchLayoutError",
                pageNum: pageNum
            }
        }
        return null;
    },
    handleNextPage: function(inSender, inSnap) {
        inSnap && this.currentPageNum++;
        return this.getView(this.currentPageNum + 1);
    },
    handlePrevPage: function(inSender, inSnap) {
        inSnap && this.currentPageNum--;
        return this.getView(this.currentPageNum - 1);
    },
    handleGoToTarget: function(inSender, targetName, params) {
        // look up the target info by targetName
        var magazineTarget = this.magazineDefinedTarget[targetName];
        if (magazineTarget) {
            // navigating whithin the magazine
            if (magazineTarget.type === "internal") {
                this.setInternetTargetPage(magazineTarget.pageNum);
                // navigating outside of the magazine
            } else if (magazineTarget.type === "external") {
                this.doMagazineGoToTarget(targetName, params);
            }
        } else {
            var pageNum = this._getPageNumber(targetName);
            if (pageNum > 0) {
                this.setInternetTargetPage(pageNum);
            }
        }
    },
    /**
     * Magazine is based on Carousel kind that always keeps 3 views in memory - center, left, right.
     * This method checks if the target page number is the left or right of the current center page. If it is,
     * there is no need to create a new view, this method in that case only calls the adjustViews method of Carousel
     * to select the right view (right or left).
     * If the target page number is not in memory, setCenterView method of Carousel is called so that the new set of 3 
     * views can be created by Carousel.
     * This distinctio is required to avoid unnecessary creation of views if they are already present in memory and avoid
     * duplicate component errors when jumping from 1 page to another page of the magazine.
     */
    setInternetTargetPage: function(targetPageNum) {
        // Link to the current page - no need to do anything
        if (this.currentPageNum == targetPageNum) {
            return;
        }
        this.currentPageNum = targetPageNum;
        this.$.magazineContainer.setCenterView(this.getView(this.currentPageNum));
    },
    _getPageNumber: function(targetName) {
        var pageNumRegex = /^(page)([0-9]+)$/;
        var groups = pageNumRegex.exec(targetName);
        if (groups && groups[2]) {
            return parseInt(groups[2]);
        } else {
            return -1;
        }
    },
    handleDispatchLayoutRendered: function(inSender, inParams) {
        this.hideScrim();
    },
    handleDispatchLayoutError: function(inSender, inParams) {
        this.hideScrim();
    },
    handleDownloadApplication: function(inSender, appId) {
        // integrate with external API to save a given app.
        //this.log("DOWNLOADING " +  appId);
    },
    getEditionFailed: function() {
        this.error(MagazineErrors.getErrorString(MagazineErrors.EDITION_NOT_LOADED));
        this.loadDefaultEdition();
    },
    getEditionFileSetFailed: function() {
        this.error(MagazineErrors.getErrorString(MagazineErrors.EDITION_FILESET_NOT_LOADED) + this.currentEdition._id + " " + this.currentEdition.number);
        this.loadDefaultEdition();
    },
    loadDefaultEdition: function() {
        // Already using the default edition, bailing out
        if (this.usingDefaultEdition) {
            return this.unableToInitMagazine();
        }
        this.warn(MagazineErrors.getErrorString(MagazineErrors.LOADING_DEFAULT_EDITION));
        this.usingDefaultEdition = true;
        var lang = (enyo.g11n.currentLocale().toISOString()).substring(0, 2);
        if (lang != "de" && lang != "en" && lang != "es" && lang != "fr" && lang != "it") {
            this.log("Going to default language");
            lang = "en";
        }
        this.$.webService.call(null, {
            url: "source/magazine/defaultEdition/" + lang + "/manifest.json",
            handleAs: "json",
            onSuccess: "gotDefaultEditionFileSet",
            onFailure: "unableToInitMagazine"
        });
    },
    unableToInitMagazine: function() {
        this.hideScrim();
        this.error(MagazineErrors.getErrorString(MagazineErrors.UNABLE_TO_INIT_MAGAZINE));
        // TODO decide what to do in this case.
    },
    showScrim: function() {
        if (this.$.scrim) {
            this.$.spinner.setShowing(true);
            this.$.scrim.show();
        }
    },
    hideScrim: function() {
        if (this.$.scrim) {
            this.$.spinner.setShowing(false);
            this.$.scrim.hide();
        }
    },
    update: function(eventName, params) {
/*if (this.currentMagazinePage && this.currentMagazinePage.handleEvent) {
            this.currentMagazinePage.handleEvent(eventName, params);
        }*/
        this.$.magazineContainer.resize();
    },
    loadDraftEdition: function() {
        this.$.webService.call(null, {
            url: AppCatalog.Config.draftEditionDir + "/manifest.json",
            handleAs: "json",
            onSuccess: "drafEditionFilesetLoaded",
            onFailure: "drafEditionFilesetNotLoaded"
        });
    },
    drafEditionFilesetLoaded: function(inSender, inResponse) {
        var fileNames = inResponse.fileset || inResponse.results || [],
            i, fileType;
        var baseDir = AppCatalog.Config.draftEditionDir;
        var helper = this.$.magazineHelper;
        for (i = 0; i < fileNames.length; i++) {
            var fileName = helper.getCanonicalFilename(fileNames[i].path || fileNames[i].logicalPath);
            fileType = helper.getTypeFromFile(fileName);
            if (fileType) {
                var fileInfo = {
                    "_id": "200",
                    "_rev": 2,
                    "_kind": "com.palm.appcatalog.editionfile:2",
                    checksum: "1",
                    edition: "0",
                    section: helper.getSectionFromFile(fileName),
                    type: fileType,
                    logicalPath: fileName,
                    physicalPath: baseDir + "/" + fileName
                };
                this.registerEditionFile(fileInfo);
            }
        }
        this.currentEdition = {
            "_id": "00001",
            "_kind": "com.palm.appcatalog.editioninfo:3",
            "numPages": this.maxNumPages + 1,
            "number": "0",
            "publishDate": "03/31/2011 12:00:00"
        };
        this.currentPageNum = 0;
        this.$.magazineContainer.setCenterView(this.getView(this.currentPageNum));
        //this.renderMagazinePage();
    },
    drafEditionFilesetNotLoaded: function(inSender, inResponse) {
        this.hideScrim();
        this.error("Draft edition could not be loaded ");
    }
});
