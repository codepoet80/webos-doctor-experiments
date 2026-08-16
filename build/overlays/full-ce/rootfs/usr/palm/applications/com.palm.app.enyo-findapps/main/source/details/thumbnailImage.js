enyo.kind({
    name: "findApps.Details.ThumbnailImageView",
    kind: enyo.Control,
    published: {
        params: {
            images: [],
            index: 0
        }
    },
    images: [],
    index: 0,
    events: {
        onCancel: ""
    },
    components: [{
        kind: "findApps.Error",
        name: "error"
    }, {
        kind: "Carousel",
        name: "screenshots",
        flex: 1,
        onclick: "doCancel",
        onGetLeft: "getLeft",
        onGetRight: "getRight",
        onSnapFinish: "snapFinish"
    }],
    create: function() {
        this.inherited(arguments);
    },
    paramsChanged: function() {
        this.images = this.params.images;
        this.index = this.params.index;
        this.$.screenshots.setCenterView(this.getView(this.index));
    },
    resizeHandler: function() {
        //this.inherited(arguments);
        this.$.screenshots.resize();
    },
    getImageUrl: function(inIndex) {
        var img = this.images[inIndex];
        if (img && img.carouselImgUrl) {
            return img.carouselImgUrl;
        }
    },
    getView: function(inIndex) {
        if (inIndex >= 0 && inIndex < this.images.length) {
            var src = this.getImageUrl(inIndex);
            if (src) {
                return {
                    kind: findApps.CarouselImage,
                    src: src,
                    autoSize: false,
                    onImageLoaded: "imageLoaded",
                    onImageFailed: "imageFailed"
                };
            }
        }
    },
    snapFinish: function(){
        var currView = this.$.screenshots.fetchCurrentView();
        if(currView && currView._failed){
            this.doCancel();
            this.$.error.displayError(["LOC07102"]);
        }
    },
    getLeft: function(inSender, inSnap) {
        inSnap && this.index--;
        return this.getView(this.index - 1);
    },
    getRight: function(inSender, inSnap) {
        inSnap && this.index++;
        return this.getView(this.index + 1);
    },
    imageLoaded: function(img){
        img.stopSpinner();
    },
    imageFailed: function(img){
        //img.setSrc("images/icon-warning.png");
        img.stopSpinner();
        this.snapFinish();
    }
});

enyo.kind({
    name: "findApps.CarouselImage",
    kind: enyo.ViewImage,
    published: {
        timeout: AppCatalog.Config.wsTimeout
    },
    events: {
        onImageFailed: ""
    },
    components: [{
        kind: enyo.Control,
        flex: 1,
        layoutKind: "VFlexLayout",
        align: "center",
        pack: "center",
        components: [{
            kind: "Spinner",
            name: "spinner",
            showing: true
        }]
    }],
    clearTimer: function(){
        if(this._timer){
            clearTimeout(this._timer);
            this._timer = undefined;
        }
    },
    srcChanged: function(){
        this.inherited(arguments);
        this._failed = false;
        this.clearTimer();
        var self = this;
        this._timer = setTimeout(function(){
            self.imageError();
        }, this.timeout);
    },
    stopSpinner: function(){
        this.$.spinner.stop();
        this.$.spinner.hide();
    },
    imageLoaded: function(){
        if(!this._failed){
            this.clearTimer();
            this.inherited(arguments);
        }
    },
    imageError: function(){
        this._failed = true;
        this.clearTimer();
        this.doImageFailed();
    }
});
