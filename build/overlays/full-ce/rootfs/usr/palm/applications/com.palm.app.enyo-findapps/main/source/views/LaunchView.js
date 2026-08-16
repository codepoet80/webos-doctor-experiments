enyo.kind({
    name: "findApps.LaunchView",
    kind: "VFlexBox",
    height: "100%",
    className: "splash-background",
    align: "center",
    imageIndex: 0,
    splashImages: ["images/splash/splash001.png", "images/splash/splash002.png", "images/splash/splash003.png", "images/splash/splash004.png", "images/splash/splash005.png", "images/splash/splash006.png", "images/splash/splash007.png", "images/splash/splash008.png", "images/splash/splash009.png"],
    components: [{
        kind: "Spacer"
    }, {
        kind: enyo.Image,
        src: "images/splash/splash001.png",
        name: "splashImage",
        style: "display:block;margin:auto"
    }, {
        kind: "Spacer"
    }],
    create: function() {
        this.inherited(arguments);
        this.t = setTimeout(enyo.bind(this, this.changeSplashImage), 5);
    },
    changeSplashImage: function() {
        this.imageIndex = (this.imageIndex + 1) % (this.splashImages.length);
        this.$.splashImage.setSrc(this.splashImages[this.imageIndex]);
        if (findApps.ViewLibrary._container.isTopView(this)) {
            // set the next time out
            this.t = setTimeout(enyo.bind(this, this.changeSplashImage), 100);
        } else clearTimeout(this.t);
    },
    resizeHandler: function() {
        if (findApps.ViewLibrary._container.isTopView(this)) {
            this.inherited(arguments);
        }
    }
    ,
   getAppMenuOptions: function() {
    	return {
    		softwareManager: {disabled: false, show: true},
    		helpMenu: {disabled: false, show: true}
		}
	}
});
