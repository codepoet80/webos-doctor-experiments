enyo.kind({
    name: "findApps.Details.ThumbnailsScroller",
    kind: "enyo.Control",
    //////- Components Start
    components: [{
        // Image View Pop-up
        name: "imageViewPopup",
        className: "screenshot-thumbnail-popup",
        kind: "Popup",
        layoutKind: "HFlexLayout",
        style: "overflow: hidden",
        height: "fill",
        components: [{
            kind: "findApps.Details.ThumbnailImageView",
            name: "thumbnailImageView",
            flex: 1,
            onCancel: "closePopup"
        }]
    }, {
        name: "thumbnailScroller",
        layoutKind: "HFlexLayout",
        className: "thumbnailScrollerClass",
        autoHorizontal: true,
        horizontal: true,
        autoVertical: false,
        vertical: false,
        kind: enyo.Scroller,
        components: [{
            kind: "HFlexBox",
            flex: 1,
            name: "client"
        }]
    }],
    ///// - Components End
    closePopup: function(inSender) {
        this.$.imageViewPopup.close();
    },
    published: {
        // JSON object
        /*
		 {"mediaLink": <>, "mediaIcon": <>, images: [{
                    	"filename": "48.png",
                    	"height": 48,
                    	"imageKey": "appIcon",
                    	"orientation": "P",
                    	"uri": "https:\/\/web.sbdev.palm.com\/virtual1\/public\/144\/icon\/S\/48.png",
                    	"width": 48
                	}]
         }
		 */
        imageData: null
    },
    create: function() {
        this.inherited(arguments);
        this.appVideo = {
            afterThumbnails: false,
            showVideo: false,
            videoSrc: "",
            videoImg: ""
        }
        /*
		 * this.screenshots should contain array elements as follows:
		 * {
		 *   thumbnailImgUrl: "", //string
		 *   carouselImgUrl: "" //string
		 * }
		 */
        this.screenshots = [];
    },
    imageDataChanged: function(oldData) {
        this.processImageData();
        // Set the scroller position to left
        this.$.thumbnailScroller.setScrollLeft(0);
        this.renderProcessedImages();
    },
    processImageData: function() {
        var aV = this.appVideo;
        var iD = this.imageData;
        aV.showVideo = false;
        if (iD && iD.mediaLink) {
            aV.showVideo = true;
            aV.videoSrc = iD.mediaLink;
            aV.videoImg = iD.mediaIcon;
        }
        this.screenshots = [];
        var imageMap = findApps.Utilities.array2Map(iD.images, "imageKey");
        var thmbImg, carImg;
        var thmbImgUrl, carImgUrl;
        for (var i = 0; i < 5; i++) {
            thmbImg = null;
            carImg = null;
            thmbImgUrl = "";
            carImgUrl = "";
            //thumbnail images - look for landscape highest resolution first
            thmbImg = findApps.Utilities.findFirstMatch(imageMap,[
                "screenshot/" + (i + 1) + "/landscape/480x320/tb",
                "screenshot/" + (i + 1) + "/portrait/320x480/tb",
                "screenshot/" + (i + 1) + "/portrait/320x480",
                "screenshot/" + (i + 1) + "/portrait/96x144",
                "screenshot/" + (i + 1) + "/portrait/75x112",
                "appScaledImage" + (i + 1)
                ]);
            if (thmbImg) {
                thmbImgUrl = thmbImg.uri;
                //carousel images - look for landscape highest resolution first
                carImg = findApps.Utilities.findFirstMatch(imageMap,[
                    "screenshot/" + (i + 1) + "/landscape/768x576/tb",
                    "screenshot/" + (i + 1) + "/landscape/480x320/tb",
                    "screenshot/" + (i + 1) + "/portrait/576x768/tb",
                    "screenshot/" + (i + 1) + "/portrait/320x480/tb"
                    ]);
                carImgUrl = carImg?carImg.uri:thmbImg.uri;
                if(thmbImg.imageKey.indexOf("appScaledImage") >= 0){
                    carImgUrl = carImgUrl?carImgUrl:thmbImg.uri.replace(/\/S\//gi, "/L/");
                }
            }
            if (thmbImgUrl) {
                this.screenshots.push({
                    thumbnailImgUrl: thmbImgUrl,
                    carouselImgUrl: carImgUrl
                });
            }
        }
    },
    renderProcessedImages: function() {
        // Render the thumbnails
        // First destroy any existing dynamic components created earlier
        this.$.client.destroyControls();
        // Create video control, if present, as the first item in the scroller
        var aV = this.appVideo;
        if (aV.showVideo && !aV.afterThumbnails) {
            this.createVideoComponent(aV.videoSrc, aV.videoImg);
        }
        var scrShots = this.screenshots;
        for (var i in scrShots) {
            this.createThumbnailComponent("Thumbnail_" + i, i, scrShots[i]);
        }
        if (aV.showVideo && aV.afterThumbnails) {
            this.createVideoComponent(aV.videoSrc, aV.videoImg);
        }
        this.$.thumbnailScroller.contentChanged();
        this.$.thumbnailScroller.resized();
    },
    createVideoComponent: function(videoSrc, videoImg) {
        this.$.client.createComponent({
            components: [{
                className: 'details-body-video-img',
                kind: "findApps.AppDetailVideoImage",
                src: videoImg,
                mediaLink: videoSrc,
                mediaIcon: videoImg,
                name: "videoControl",
                onclick: "handleVideoClick",
                onerror: "videoImageError"
            }, {
                kind: 'Item',
                name: "videoOverlayItem",
                className: 'video-overlay',
                onclick: "handleVideoClick",
                components: [{
                    kind: 'Image',
                    className: 'video-overlay-play',
                    src: 'images/Video_Icon.png'
                }]
            }],
            owner: this
        });
    },
    createThumbnailComponent: function(name, index, screenshot) {
        if (!screenshot.thumbnailImgUrl) {
            return;
        }
        this.$.client.createComponent({
            components: [{
                owner: this,
                name: name,
                className: 'details-body-thumbnail-img',
                kind: "findApps.AppDetailImage",
                src: screenshot.thumbnailImgUrl,
                onclick: "handleThumbnailClick",
                onerror: "imageError",
                index: index,
                largeImgUrl: screenshot.carouselImgUrl
            }]
        });
    },
    handleThumbnailClick: function(thumbnail) {
        if (!thumbnail || !thumbnail.index) {
            return;
        }
        if (!this.screenshots[thumbnail.index] || !this.screenshots[thumbnail.index].carouselImgUrl) {
            return;
        }
        if (this.$.imageViewPopup.lazy == true) {
            this.$.imageViewPopup.validateComponents();
        }
        //remove elements that has no carousel images
        var carouselImages = [];
        var carouselIndex = 0;
        var scrShots = this.screenshots;
        for (var i = 0; i < scrShots.length; i++) {
            if (scrShots[i].carouselImgUrl) {
                carouselImages.push(scrShots[i]);
                if (thumbnail.index == i) {
                    //set initial center image to the tapped one
                    carouselIndex = carouselImages.length - 1;
                }
            }
        }
        if (carouselImages.length) {
            this.$.thumbnailImageView.setParams({
                images: carouselImages,
                index: carouselIndex
            });
            this.$.imageViewPopup.openAtCenter();
        }
    },
    handleVideoClick: function() {
        // Launch the browser and open the video link
        findApps.ApplicationManager.getInstance().openBrowserPage(this.appVideo.videoSrc, "browserPageOpenSuccess", "browserPageOpenFailure", this);
    },
    browserPageOpenSuccess: function() {
    //this.log("browserPageOpenSuccess");
    },
    browserPageOpenFailure: function() {
    //this.log("browserPageOpenFailure");
    },
    // Method called on all observers for resize event, called by top container
    update: function(eventName, params) {
        if (eventName == "resize") {
            this.$.thumbnailScroller.contentChanged();
            this.$.thumbnailScroller.resized();
        }
    },
    refresh: function() {
        this.$.thumbnailScroller.contentChanged();
        this.$.thumbnailScroller.resized();
    },
    imageError: function(inSender, e) {
        inSender.destroy();
    },
    videoImageError: function(inSender, e) {
        if (this.$.videoOverlayItem) {
            this.$.videoOverlayItem.hide();
        }
        inSender.destroy();
    }
});
enyo.kind({
    name: "findApps.AppDetailImage",
    kind: "enyo.Image",
    published: {
        index: "",
        largeImgUrl: ""
    }
});
enyo.kind({
    name: "findApps.AppDetailVideoImage",
    kind: "enyo.Image",
    published: {
        mediaLink: "",
        mediaIcon: ""
    }
});
