enyo.kind({
    name: "findApps.Details",
    kind: enyo.VFlexBox,
    className: "white-background",
    published: {
        appItem: ""
    },
    components: [
    //Scrim control
    {
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
    },{
        kind: "Popup",
        name: "alertPrompt",
        components: [{
            name: "alertTitle",
            className: "enyo-item enyo-first",
            content: "",
            style: "padding: 12px"
        }, {
            name: "alertMessage",
            className: "enyo-item enyo-last",
            content: "",
            style: "padding: 12px; font-size: 14px"
        }, {
            kind: "Button",
            className: "enyo-button-light",
            value: "ok",
            caption: $L("OK"),
            onclick: "dismissAlertPopup"
        }]
    },
    // Error dialog
    {
        kind: "findApps.Error",
        onSubmit: "submitError",
        onCancel: "cancelError"
    }, {
        kind: "enyo.Control",
        name: "headerGroup",
        components: [
        // Header section Start
        {
            name: "detailHeader",
            layoutKind: "HFlexLayout",
            kind: "PageHeader",
            className: 'details-header',
            components: [{
                layoutKind: "HFlexLayout",
                flex: 1,
                // Application image
                components: [{
                    name: "detailHeaderImage",
                    kind: enyo.Image,
                    className: 'details-header-image'
                }, {
                    components: [
                    // Title             
                    {
                        name: "detailHeaderTitle",
                        kind: enyo.Control,
                        className: 'details-header-title'
                    },
                    // Creator name, link to developer site
                    {
                        layoutKind: "HFlexLayout",
                        components: [{
                            name: "detailHeaderCreater",
                            kind: enyo.Control,
                            className: 'details-header-body',
                            onclick: "linkToDeveloperSite"
                        }]
                    },
                    // Average Rating image and number of total reviews
                    {
                        layoutKind: "HFlexLayout",
                        align: "center",
                        style: "height:24px;",
                        components: [{
                            kind: enyo.Image,
                            name: "avgRatingImg1",
                            width: "12px",
                            height: "12px",
                            style: "display:block"
                        }, {
                            kind: enyo.Image,
                            name: "avgRatingImg2",
                            width: "12px",
                            height: "12px",
                            style: "display:block"
                        }, {
                            kind: enyo.Image,
                            name: "avgRatingImg3",
                            width: "12px",
                            height: "12px",
                            style: "display:block"
                        }, {
                            kind: enyo.Image,
                            name: "avgRatingImg4",
                            width: "12px",
                            height: "12px",
                            style: "display:block"
                        }, {
                            kind: enyo.Image,
                            name: "avgRatingImg5",
                            width: "12px",
                            height: "12px",
                            style: "display:block"
                        }, {
                            name: "detailHeaderRatings",
                            kind: enyo.Control,
                            className: 'details-header-reviews'
                        }]
                    }]
                }]
            },
            // Save and Download buttons
            {
                layoutKind: "HFlexLayout",
                components: [
                // Save button kind
                {
                    kind: "findApps.downloadsavebutton",
                    name: "downloadsavebutton",
                    type: "detail"
                }]
            }]
        }]
    },
    // Header section End
    // Body section start
    {
        className: "upper-shadow"
    }, {
        name: "detailBody",
        kind: enyo.Scroller,
        horizontal: false,
        autoHorizontal: false,
        height: "100%",
        components: [{
            kind: "enyo.Control",
            name: "detailsBodyGroup",
            components: [{
                name: "detailBodyBody",
                layoutKind: "HFlexLayout",
                components: [
                // Left pane of the body: App. Info summary, average rating
                {
                    name: "detailBodyLeft",
                    width: "320px",
                    style: "border-right:1px solid #B8B8B8",
                    components: [
                    // Average Rating Kind
                    {
                        kind: "findApps.AverageRating",
                        name: "averageRatings",
                        className: "averageRating"
                    },
                    // App. Info summary
                    {
                        kind: "findApps.AppSummary",
                        name: "appSummary",
                        className: "appSummary"
                    },
                    // Link buttons: Share, Developer Apps, Support, Report a Problem
                    {
                        name: "linkButtons",
                        className: "linkButtonDiv",
                        components: [{
                            kind: "findApps.ShareApp",
                            className: "linkButton",
                            name: "shareAppButton"
                        }, {
                            kind: "Button",
                            className: "enyo-button-light linkButton",
                            caption: $L("Developer Apps"),
                            onclick: "linkToDeveloperApps",
                            name: "developerAppsButton"
                        }, {
                            kind: "Button",
                            className: "enyo-button-light linkButton",
                            caption: $L("Support"),
                            onclick: "linkToSupport",
                            name: "supportButton"
                        }, {
                            kind: "findApps.Details.ReportProblem",
                            className: "linkButton",
                            name: "reportProblemButton"
                        }]
                    }]
                },
                // Right pane of the body: Description, Review section, Review Lists
                {
                    name: "detailBodyRight",
                    flex: 3,
                    components: [
                    //Thumbnail images
                    {
                        className: "thumbnail-scroller-background",
                        name: "thumbnailsScroller",
                        components: [{
                            className: "relief-box",
                            components: [{
                                className: "relief-box-inner",
                                components: [{
                                    name: "detailBodyThumbnails",
                                    className: "detailBodyThumbnails",
                                    kind: "findApps.Details.ThumbnailsScroller"
                                }, ]
                            }]
                        }]
                    }, {
                        kind: "findApps.AppDescription",
                        name: "appDescription"
                    }, {
                        content: "",
                        className: "app-description-review-header"
                    },
                    // Review section: My Review / Add Review
                    {
                        kind: "findApps.Details.MyReview",
                        name: "addReview",
                        onRenderSuccess: "myReviewRenderSuccess",
                        onMyReviewResized: "myReviewResized"
                    },
                    // +ve / -ve review buttons for toggling between the positive and negative reviews
                    {
                        content: $L("Reviews"),
                        className: "app-description-review-header"
                    }, {
                        kind: "Control",
                        className: "review-box",
                        components: [{
                            kind: "TabGroup",
                            onChange: "onChangePositiveNegative",
                            name: "positiveNegativeRadioGroup",
                            components: [{
                                layoutKind: "HFlexLayout",
                                value: 0,
                                align: "center",
                                pack: "center",
                                components: [{
                                    content: $L('Positive'),
                                    name: "positiveReviewLbl"
                                //No review count        
                                //}, {
                                //    content: $L(""),
                                //    className: "review-count-on-button",
                                //    name: "positiveReviewLblCount"
                                }]
                            }, {
                                layoutKind: "HFlexLayout",
                                value: 1,
                                align: "center",
                                pack: "center",
                                components: [{
                                    content: $L('Negative'),
                                    name: "negativeReviewLbl"
                                //No review count        
                                //}, {
                                //    content: $L(""),
                                //    className: "review-count-on-button",
                                //    name: "negativeReviewLblCount"
                                }]
                            }]
                        },
                        // +ve review list
                        {
                            kind: "findApps.Details.ReviewList",
                            style: "clear:both",
                            name: "positiveReviewList",
                            onNeedMoreReviews: "getMorePositiveReviews",
                            onReviewListScroll: "handleReviewListScroll"
                        },
                        // -ve review list
                        {
                            kind: "findApps.Details.ReviewList",
                            name: "negativeReviewList",
                            onNeedMoreReviews: "getMoreNegativeReviews",
                            onReviewListScroll: "handleReviewListScroll" 
                        }]
                    }, ]
                }]
            }]
        }]
    }
    // Body section End    
    ],
    handleReviewListScroll: function() {
        // Set the scroller position to the end of the page
        this.$.detailBody.scrollToBottom();
    },
    
    create: function() {
        // Register with top container to receive orientation change events
        var topContainer = findApps.ViewLibrary._container;
        if (topContainer && topContainer.registerObserver) {
            topContainer.registerObserver("orientationChanged", this);
        }
        this.inherited(arguments);
        this.firstLaunch = true;
        // Initiate the call to get Account info
        var accntInfo = findApps.AccountServices.getInstance().getAccountInfo({
            onSuccess: "accountInfoSuccess", 
            onFailure: "accountInfoFailure", 
            scope: this
        });
        if (accntInfo) {
            // Obtained the account info immediately
            this.accountInfoSuccess(null, accntInfo);
        }
        this.appdownloadmgr = enyo.application.appdownloadManager;
        this.appMetrics = enyo.application.appMetrics;
    },
    initReviewListData: function(sign, reviewCount, reviews) {
        if (sign === "positive") {
            this.$.positiveReviewList.setReviewListInfo({
                "reviews": reviews,
                "totalCount": reviewCount,
                "appDetails": {
                    "id": this._appDetails.id,
                    "packageid": this._appDetails.publicApplicationId,
                    "version": this._appDetails.version
                }
            });
        // No review count
        //            var positiveReviewLblCount = this.$.positiveReviewLblCount;
        //            positiveReviewLblCount.setContent(enyo.macroize(" ({$positiveCount})", {
        //                "positiveCount": reviewCount
        //            }));
        //            positiveReviewLblCount.contentChanged();
        } else {
            this.$.negativeReviewList.setReviewListInfo({
                "reviews": reviews,
                "totalCount": reviewCount,
                "appDetails": {
                    "id": this._appDetails.id,
                    "packageid": this._appDetails.publicApplicationId,
                    "version": this._appDetails.version
                }
            });
        // No review count
        //            var negativeReviewLblCount = this.$.negativeReviewLblCount;
        //            negativeReviewLblCount.setContent(enyo.macroize(" ({$negativeCount})", {
        //                "negativeCount": reviewCount
        //            }));
        //            negativeReviewLblCount.contentChanged();
        }
    },
    // This method should be called to start with a clean slate whenever a new app item is passed to the details page
    initialize: function() {
        this._appDetails = {
            "id": this.appItem.id,
            "publicApplicationId": this.appItem.publicApplicationId,
            "version": ""
        };
        // Set the scroller position to top
        this.$.detailBody.scrollToBottom();
        // Set the averageRatingData to null
        this._averageRatingData = null;
        // Initialize the Save button with the application's package id.
        var appitem = {
            "publicApplicationId": this.appItem.publicApplicationId
        };
        this.$.downloadsavebutton.disableMe(true);
        this.$.downloadsavebutton.setAppItem({
            appId: this.appItem.publicApplicationId
        });
        // Initialize the review lists to empty
        this._negativeReviews = null;
        this._positiveReviews = null;
        this.$.positiveReviewList.setNoReviewsMessage($L(""));
        this.initReviewListData("positive", 0, []);
        this.$.negativeReviewList.setNoReviewsMessage($L(""));
        this.initReviewListData("negative", 0, []);
        // Select Positive reviews by default
        this.$.positiveNegativeRadioGroup.setValue(0);
        this.$.appDescription.listRefresh = enyo.bind(this, this.refreshLists);
    },
    refreshLists: function() {
        if (this.$.positiveReviewList && this.$.negativeReviewList) {
            this.$.positiveReviewList.refresh();
            this.$.negativeReviewList.refresh();
        }
    },
    // This function gets called with anyone calls setAppItem, since appItem is the published property of this kind
    // This function will be the entry point into Details page
    appItemChanged: function() {
        this.$.headerGroup.hide();
        this.$.detailsBodyGroup.hide();
        this.initialize();
        // pre-render detail page
        if(!this.appItem.viewToLoad){
            this.preRenderDetailPage();
        }else{
            this.$.scrim.show();
            this.$.spinner.setShowing(true);
        }
        // get details from server
        this.$.positiveReviewList.fetchSpinner(true);
        this.$.negativeReviewList.fetchSpinner(true);
        this.getApplicationDetailsFromServer();
    },
    // Use appList response data to pre-render the detail page at entry point
    preRenderDetailPage: function() {
        // pre-render header
        this.$.detailHeaderImage.setSrc(this.appItem.appIcon);
        this.$.detailHeaderTitle.setContent(this.appItem.title);
        this.$.detailHeaderCreater.setContent(this.appItem.author);
        this.$.averageRatings.reset();
        this.$.downloadsavebutton.setAppItem({
            appId: this.appItem.publicApplicationId
        });
        this.$.headerGroup.show();
        
        // pre-render app information
        this.$.appSummary.setAppDetails({
            version: this.appItem.appVersion,
            lastModifiedTime: this.appItem.lastModifiedTime
        });
        
        // pre-render buttons
        this.$.shareAppButton.setAppDetail({
            publicApplicationId: this.appItem.publicApplicationId,
            id: this.appItem.id,
            title: this.appItem.title
        });
        // Related data for these button's functionality is not ready yet, disable them now
        this.$.developerAppsButton.disabled = true;
        this.$.developerAppsButton.addClass("enyo-button-disabled");
        this.$.supportButton.disabled = true;
        this.$.supportButton.addClass("enyo-button-disabled");
        this.$.reportProblemButton.disableMe(true);
        
        // pre-render images
        var imageArray = this.appItem.images ? this.appItem.images.slice() : [];
        for(var i = 1; i <= 5; i++) {
            if(this.appItem["appScaledImage" + i] != null) {
                var block = {};
                block.imageKey = "appScaledImage" + i;
                block.uri = this.appItem["appScaledImage" + i];
                imageArray[imageArray.length] = block;
            }
        }
        var imageData = {
            "images": imageArray,
            mediaLink: this.appItem.mediaLink,
            mediaIcon: this.appItem.mediaIcon
        };
        this.$.detailBodyThumbnails.setImageData(imageData);
        
        // pre-render description
        this.$.appDescription.setDescription(this.appItem.summary);
        
        // pre-render add review part
        this.$.addReview.setAppDetails({
            appid: this.appItem.id,
            packageid: this.appItem.publicApplicationId,
            version: this.appItem.appVersion
        });
        
        this.$.detailsBodyGroup.show();
    },
    changeOrientation: function(orientation) {
        if (orientation && orientation == "landscape") {
            this.$.detailHeaderTitle.applyStyle("width","735px");
        } else {
            this.$.detailHeaderTitle.applyStyle("width","475px");
        }
    },
    // Method invoked by Container when user session is received
    update: function(eventName, params) {
        if (eventName == "orientationChanged") {
            this.changeOrientation(params.orientation);
        } else if (eventName == "resize") {
            this.$.positiveReviewList.refresh();
            this.$.negativeReviewList.refresh();
            this.$.detailBody.resized();
            this.$.detailBodyLeft.resized();
            this.$.detailBodyRight.resized();
            this.$.detailBodyThumbnails.refresh();
        }
    },
    renderDetailsPage: function() {
        this.renderAverageRatingFromModel(this._averageRatingData);
        this.renderApplicationReviewsFromModel("positive", this._positiveReviewCount, this._positiveReviews);
        // No full screen scrim for partial render
        //this.$.scrim.hide();
        //this.$.spinner.setShowing(false);
        this.changeOrientation(findApps.ViewLibrary._container._orientation);
    },
    // This method will be called when server responds with application details successfully
    renderAppDetailsFromModel: function(appDetail) {
        if (appDetail) {
            // Initialize the Share button kind with app details
            this.$.shareAppButton.setAppDetail(appDetail);
            // Initialize the Report Problem kind with app details
            this.$.reportProblemButton.setAppDetails(appDetail);
            // Enable these two buttons since related data is ready in appDetail
            this.$.developerAppsButton.disabled = false;
            this.$.developerAppsButton.removeClass("enyo-button-disabled");
            this.$.supportButton.disabled = false;
            this.$.supportButton.removeClass("enyo-button-disabled");
            this.$.reportProblemButton.disableMe(false);
            // Header
            var imageMap = findApps.Utilities.array2Map(appDetail.images, "imageKey");
            var appIcon = findApps.Utilities.findFirstMatch(imageMap, ["icon/64x64", "icon/48x48"]);
            var appIconUri = appIcon ? appIcon.uri : appDetail.appIcon;
            this.$.detailHeaderImage.setSrc(appIconUri);
            this.$.detailHeaderTitle.setContent(appDetail.title);
            this.$.detailHeaderCreater.setContent(appDetail.creator);
            // If images block is empty and appScaledImage[1-5] have values. {
            var imageArray = appDetail.images ? appDetail.images.slice() : [];
            for(var i = 1; i <= 5; i++) {
                if(appDetail["appScaledImage" + i] != null) {
                    var block = {};
                    block.imageKey = "appScaledImage" + i;
                    block.uri = appDetail["appScaledImage" + i];
                    imageArray[imageArray.length] = block;
                }
            }
            //}
            var imageData = {
                "images": imageArray,
                mediaLink: appDetail.mediaLink,
                mediaIcon: appDetail.mediaIcon
            };
            this.$.detailBodyThumbnails.setImageData(imageData);
            //Application information
            this.$.appSummary.setAppDetails(appDetail);
            // description
            this.$.appDescription.setDescription(appDetail.description);
            this.$.headerGroup.show();
            this.$.detailsBodyGroup.show();
            this.$.scrim.hide();
            this.$.spinner.setShowing(false);
        }
    },
    // This method will be called when the server returns user review successfully
    myReviewRenderSuccess: function(inSender, params) {
    // This indicates that the MyReview section was rendered successfully.
    },
    // This method will be invoked when the application is installed, and user review for that application is 
    // enabled for the user
    // When that happens, the user rating section is shown, and hence the space available for the review lists will
    // change. Need to caputre this event so that the review lists can be resized.
    // DFISH-7742
    myReviewResized: function(inSender, params) {
        // Resize the review lists - +ve / -ve
        this.$.positiveReviewList.refresh();
        this.$.negativeReviewList.refresh();
    },
    // This method is used to render the average rating for this application
    renderAverageRatingFromModel: function(averageRatingData) {
        if (averageRatingData) {
            // Show the total number of reviews in the header
            var n = averageRatingData.totalCount;
            if (n == 0) {
                this.$.detailHeaderRatings.setContent($L("No Reviews"));
            } else {
                var ratingTemp;
                if (n > 1) ratingTemp = new enyo.g11n.Template($L("#{num} reviews"));
                else ratingTemp = new enyo.g11n.Template($L("#{num} review"));
                this.$.detailHeaderRatings.setContent(ratingTemp.evaluate({
                    num: n
                }));
            }
            // Show the average rating stars in the header
            if (!averageRatingData.averageRating) averageRatingData.averageRating = 0;
            var doubleRating = averageRatingData.averageRating * 2;
            this.$.avgRatingImg1.setSrc("images/stars/star-" + findApps.Utilities.formatStar(doubleRating, 0) + ".png");
            this.$.avgRatingImg2.setSrc("images/stars/star-" + findApps.Utilities.formatStar(doubleRating, 1) + ".png");
            this.$.avgRatingImg3.setSrc("images/stars/star-" + findApps.Utilities.formatStar(doubleRating, 2) + ".png");
            this.$.avgRatingImg4.setSrc("images/stars/star-" + findApps.Utilities.formatStar(doubleRating, 3) + ".png");
            this.$.avgRatingImg5.setSrc("images/stars/star-" + findApps.Utilities.formatStar(doubleRating, 4) + ".png");
            this.$.averageRatings.show();
            this.$.averageRatings.setAppRatingData(averageRatingData);
        } else {
            this.$.averageRatings.hide();
        }
    },
    // This method is called when server responds with a review list successfully - sign indicates positive or negative list
    renderApplicationReviewsFromModel: function(sign, reviewCount, reviews) {
        this.initReviewListData(sign, reviewCount, reviews);
        this._showingPositiveReviews = (sign === "positive");
        if (this._showingPositiveReviews) {
            // Show positive reviews tab
            this.$.positiveNegativeRadioGroup.setValue(0);
            this.$.positiveReviewList.show();
            this.$.negativeReviewList.hide();
            this.$.positiveReviewList.refresh();
        } else {
            // Show negative reviews tab
            this.$.positiveNegativeRadioGroup.setValue(1);
            this.$.negativeReviewList.show();
            this.$.positiveReviewList.hide();
            this.$.negativeReviewList.refresh();
        }
    },
    // Event handlers
    _showVideoPreview: function() {
        var details = this._appDetails.getDetails();
        var params = {};
        params.target = details.mediaLink;
        params.direct = true;
    },
    linkToDeveloperApps: function() {
        // how to link to browser
        var vendorId = this._appDetails.vendorid;
        var moreAppsTmp = new enyo.g11n.Template($L("More Applications by #{developer}"));
        var searchParams = {
            "developerId": vendorId,
            hideSearchField: true,
            "title": moreAppsTmp.evaluate({
                developer: this._appDetails.creator
            }),
            "comingFrom": "details",
            "appName": this._appDetails.title
        };
        var searchAppsKind = findApps.ViewLibrary.getView("DEVSEARCH");
        searchAppsKind.setParams(searchParams);
    },
    linkToDeveloperSite: function() {
        if(this._appDetails.publicApplicationId && this._appDetails.homeURL) {
            if (this.appMetrics) this.appMetrics.trackEvent("linkToDeveloperSite/" + this._appDetails.publicApplicationId + "?url=" + this._appDetails.homeURL);
            findApps.ApplicationManager.getInstance().openBrowserPage(this._appDetails.homeURL, "browserPageOpenSuccess", "browserPageOpenFailure", this);
        }
    },
    linkToSupport: function() {
        if (this.appMetrics) this.appMetrics.trackEvent("linkToSupport/" + this._appDetails.publicApplicationId + "?url=" + this._appDetails.supportURL);
        findApps.ApplicationManager.getInstance().openBrowserPage(this._appDetails.supportURL, "browserPageOpenSuccess", "browserPageOpenFailure", this);
    },
    browserPageOpenSuccess: function() {
    //this.log("browserPageOpenSuccess");
    },
    browserPageOpenFailure: function() {
    //this.log("browserPageOpenFailure");
    },
    onChangePositiveNegative: function(inSender) {
        if (inSender.getValue() == 0) { // Positive Reviews button clicked
            if (this._showingPositiveReviews == false) {
                this._showingPositiveReviews = true;
                if (!this._positiveReviews) {
                    // Fetch positive reviews
                    this.getApplicationReviewsFromServer("positive", 0, 10, "positiveReviewList");
                }
                this.$.positiveReviewList.show();
                this.$.negativeReviewList.hide();
                this.$.positiveReviewList.refresh();
            }
        } else // negative reviews button clicked
{
            if (this._showingPositiveReviews == true) {
                this._showingPositiveReviews = false;
                if (!this._negativeReviews) {
                    // Fetch negative reviews
                    this.getApplicationReviewsFromServer("negative", 0, 10, "negativeReviewList");
                }
                this.$.positiveReviewList.hide();
                this.$.negativeReviewList.show();
                this.$.negativeReviewList.refresh();
            }
        }
    },
    // Server related methods
    // Fetch application details from Server - Call to appDetail_ext2
    getApplicationDetailsFromServer: function() {
        findApps.BaseServer.getACServer().getApplicationDetails(this.appItem.id, this.appItem.publicApplicationId, enyo.g11n.currentLocale().toISOString(), "AppDetailsService", false, {
            onSuccess: "handleServerResponse",
            onFailure: "handleServerError",
            scope: this
        });
        this.getApplicationReviewsFromServer("negative", 0, 10, "negativeReviewListCnt");
    },
    // Fetch application reviews
    getApplicationReviewsFromServer: function(sign, offset, count, caller) {
        findApps.BaseServer.getACServer().getAppReviewsList(this.appItem.id, this.appItem.publicApplicationId, sign, offset, count, caller, {
            onSuccess: "handleServerResponse",
            onFailure: "handleServerError",
            scope: this
        });
    },
    getMorePositiveReviews: function(inSender, params) {
        var count = 10;
        if ((this._positiveReviewCount - params.offset) < 10) count = this._positiveReviewCount - params.offset;
        this.getApplicationReviewsFromServer("positive", params.offset, count, "morePositiveReviewList");
    },
    getMoreNegativeReviews: function(inSender, params) {
        var count = 10;
        if ((this._negativeReviewCount - params.offset) < 10) count = this._negativeReviewCount - params.offset;
        this.getApplicationReviewsFromServer("negative", params.offset, count, "moreNegativeReviewList");
    },
    updateFirstFetchOfNegativeReviewsAndCount: function(inResponse) {
        this._negativeReviewCount = inResponse.body.response.totalCount;
        if(this._negativeReviewCount === 0) {
            this.$.negativeReviewList.setNoReviewsMessage($L("No negative reviews have been written yet."));
        }
        this._negativeReviews = inResponse.body.response.reviews;
        this.initReviewListData("negative", this._negativeReviewCount, this._negativeReviews);
    },
    handleServerResponse: function(inSender, inResponse, inRequest, props) {
        switch (props.service) {
            case "AppDetailsService":
                if (inResponse.OutGetAppDetailV2) {
                    this._appDetails = inResponse.OutGetAppDetailV2.appDetail;
                    this.$.downloadsavebutton.updateFromServer(this._appDetails);
                    this.$.downloadsavebutton.disableMe(false);
                    // Initialize "My Review" section
                    this.$.addReview.setAppDetails({
                        "appid": this.appItem.id,
                        "packageid": this.appItem.publicApplicationId,
                        "version": this._appDetails.version
                    });
                    this.renderAppDetailsFromModel(this._appDetails);
                    // Fetch application reviews
                    this.getApplicationReviewsFromServer("positive", 0, 10, "positiveReviewList");
                }
                break;
            case "positiveReviewList":
                this.$.positiveReviewList.fetchSpinner(false);
                if (!inResponse || !inResponse.body || inResponse.body.error != "") {
                    //this.showAlertPopup($L("Error"), $L("Could not fetch reviews for the Application."));
                    this.$.positiveReviewList.setNoReviewsMessage($L("Could not fetch reviews for the Application."));
                } else {
                    // Fetch the average rating breakdown for the first time, if it is not already populated
                    if (!this._averageRatingData) {
                        this._averageRatingData = inResponse.body.response.ratingsBreakdown;
                    //Remove this call here because it has been called at following this.renderDetailPage()
                    //this.renderAverageRatingFromModel(this._averageRatingData);
                    }
                    // Fetch the list of positive reviews
                    this._positiveReviewCount = inResponse.body.response.totalCount;
                    if(this._positiveReviewCount === 0) {
                        this.$.positiveReviewList.setNoReviewsMessage($L("No positive reviews have been written yet."));
                    }
                    this._positiveReviews = inResponse.body.response.reviews;
                    this.renderDetailsPage();
                }
                break;
            case "negativeReviewListCnt":
                // Fetch the list of negative reviews
                this.$.negativeReviewList.fetchSpinner(false);
                this.updateFirstFetchOfNegativeReviewsAndCount(inResponse);
                this.initReviewListData("negative", this._negativeReviewCount, this._negativeReviews);
                break;
            case "negativeReviewList":
                // Fetch the list of negative reviews
                this.$.negativeReviewList.fetchSpinner(false);
                this.updateFirstFetchOfNegativeReviewsAndCount(inResponse);
                this.renderApplicationReviewsFromModel("negative", this._negativeReviewCount, this._negativeReviews);
                break;
            case "morePositiveReviewList":
                if (this._positiveReviews)
                    // Append new set of reviews to the list
                    this._positiveReviews.concat(inResponse.body.response.reviews)
                else this._positiveReviews = inResponse.body.response.reviews;
                this._positiveReviewCount = inResponse.body.response.totalCount;
                this.$.positiveReviewList.updateReviewList(inResponse.body.response.reviews);
                break;
            case "moreNegativeReviewList":
                // Append new set of reviews to the list
                if (this._negativeReviews) this._negativeReviews.concat(inResponse.body.response.reviews);
                else this._negativeReviews = inResponse.body.response.reviews;
                this._negativeReviewCount = inResponse.body.response.totalCount;
                this.$.negativeReviewList.updateReviewList(inResponse.body.response.reviews);
                break;
            default:
                // No full screen scrim for partial render
                //if (this.$.scrim) {
                //    this.$.scrim.hide();
                //    this.$.spinner.setShowing(false);
                //}
                break;
        }
    },
    handleServerError: function(inSender, inResponse, inRequest, props, errors) {
        // No full screen scrim for partial render
        //if (this.$.scrim) {
        //    this.$.scrim.hide();
        //    this.$.spinner.setShowing(false);
        //}
        switch (props.service) {
            case "AppDetailsService":
                this._appDetails = null;
                errors.push("LOC07001");
                this.displayError(errors);
                break;
            case "positiveReviewList":
                this.$.positiveReviewList.fetchSpinner(false);
                // On partial render, Show review fetch failure message on review part instead of showing an error screen/dialog
                this.$.positiveReviewList.setNoReviewsMessage($L("Could not fetch reviews for the Application."));
                //errors.push("LOC07002");
                //this.displayError(errors);
                break;
            case "negativeReviewList":
                this.$.negativeReviewList.fetchSpinner(false);
                this.$.negativeReviewList.setNoReviewsMessage($L("Could not fetch reviews for the Application."));
                //errors.push("LOC07003");
                //this.displayError(errors);
                break;
        }
    },
    accountInfoSuccess: function(inSender, accountInfo) {
        // Store the account info in the global object
        if (findApps.UserSession.getAccountInfo() == null) findApps.UserSession.setAccountInfo(accountInfo);
        this.accountInfo = accountInfo;
    },
    accountInfoFailure: function(inSender, inResponse) {
        this.error("Details - Could not fetch first name / last name - getAccountInfo failure. ", inResponse);
        this.accountInfo = null;
    },
    // Utility methods
    displayError: function(errors) {
        // Stop the scrim
        // No full screen scrim for partial render
        //this.$.scrim.hide();
        //this.$.spinner.setShowing(false);
        //TODO when is details not on the top? Not working when 1. wifi is off, 2. click on details from browser view 
        // Only if details is at the top
        //if(findApps.ViewLibrary._container.isTopView(this.owner)) {
        this.$.error.displayError(errors);
    //}
    },
    showAlertPopup: function(title, message) {
        this.$.alertPrompt.openAtCenter();
        this.$.alertTitle.setContent(title);
        this.$.alertMessage.setContent(message);
    },
    dismissAlertPopup: function() {
        this.$.alertPrompt.close();
    }
});
