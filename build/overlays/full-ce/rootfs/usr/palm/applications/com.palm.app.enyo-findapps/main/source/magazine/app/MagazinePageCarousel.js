enyo.kind({
    name: "enyo.FindApps.Magazine.MagazinePageCarousel",
    kind: enyo.Carousel,
    events: {
        onDispatchGoToTarget: "",
        onDispatchDownloadApp: "",
        onDispatchLayoutRendered: "",
        onDispatchLayoutError: ""
    },
    handleEvent: function(eventName, params) {
        switch (eventName) {
        case "resize":
            /*var width = params.width;
            var height = params.height;
            var left = this.fetchView("left");
            var right = this.fetchView("right");
            if(left)
            this.fetchView("left").orientationChanged(width, height);
            this.fetchView("center").orientationChanged(width, height);
            if(right)
            this.fetchView("right").orientationChanged(width, height);
            break;*/
        default:
            ;
        }
    },
    //* @protected
    sizeControls: function(inWidth, inHeight, inReset) {
        // Resize the controls only if magazine view is the current view
        if (findApps.ViewLibrary._container.isTopView(this.owner.owner)) {
            for (var i = 0, c$ = this.getControls(), c; c = c$[i]; i++) {
                inWidth && c.applyStyle("width", inWidth);
                inHeight && c.applyStyle("height", inHeight);
                if (this.findView(c)) {
                    if (inWidth != inHeight) this.findView(c).orientationChanged(inWidth, inHeight)
                }
                inReset && this.resetView(i);
            }
        }
    }
});
