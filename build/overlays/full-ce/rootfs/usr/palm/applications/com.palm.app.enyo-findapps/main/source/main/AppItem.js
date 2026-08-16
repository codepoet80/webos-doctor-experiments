enyo.kind({
    name: "findApps.AppItem",
    kind: "Item",
    tapHighlight: true,
    isSaveList: false,
    layoutKind: "HLayout",
    components: [{
    		name: "app_icon",
    		height: "64px",
    		width: "64px",
    		kind: "Image"
    }, {
    	kind: "Control",
    	flex: 2,
    	style: "padding-left: 10px;",
    	components: [{
    		name: "app_title",
    		style: "margin-left:0px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"
    	}, {
    		name: "app_author",
    		style: "font-size: 14px; color:#40454c;margin-left:0px;white-space:nowrap;text-overflow: ellipsis;overflow:hidden;"
    	}, {
           kind: "HFlexBox",
    	   style: "margin-left:0px;white-space:nowrap;text-overflow: ellipsis;overflow:hidden;",
           className: "item-box",
    	   align: "baseline",
    	   components: [{
    		   layoutKind: "HLayout",
    			components: [{
    				kind: enyo.Image,
    				name: "avgRatingImg1",
    				width: "12px",
    				height: "12px"
    			}, {
    				kind: enyo.Image,
    				name: "avgRatingImg2",
    				width: "12px",
    				height: "12px"
    			}, {
    				kind: enyo.Image,
    				name: "avgRatingImg3",
    				width: "12px",
    				height: "12px"
    			}, {
    				kind: enyo.Image,
    				name: "avgRatingImg4",
    				width: "12px",
    				height: "12px"
    			}, {
    				kind: enyo.Image,
    				name: "avgRatingImg5",
    				width: "12px",
    				height: "12px"
    			}]
    			}, 
    			{
    				name: "app_reviews",
    				style: "color:#363636;font-size: 14px; padding-left: 10px;"
    			}]
    		}, {
    			name: "app_summary",
    			showing: false,
    			style: "font-size: 14px;"
    		}]
    	}, {
    		kind: "Control",
    		style: "height: 85px; width: 185px; position: absolute; right: 8px; top: 0px; padding-left: 10px; overflow: hidden;",
    		components: [{
    			name: "badges",
    			style: "position: absolute; bottom: 48px; right: 0px; text-align:right; margin-right:9px",
    			className: "enyo-subtext"
    		}, {
    			kind: "HFlexBox",
    			style: "position: absolute; bottom: 8px; padding-left: 10px;",
    			className: "item-buttons",
    			align: "center",
    			components: [{
    				name: "app_save_parent",
    				components: [{
    					name: "app_save",
    					kind: "findApps.SaveButton",
    					onclick: "saveApp",
    					toggling: true
    				}]
    			}, {
	    		flex: 1,
	    		components: [{
	    			   name: "app_price",
    					kind: "findApps.ProgressPill",
    					onTap: "_handleDownloadBar",
    					onCancel: "_progressCancelled"
    				}]
    			}]
    		}]
    }],
    /*
	* We have to set the buttonClick attribute on the buttons due ot the fact
  * that the appItem often has an onClick event assigned to it, and returning true/false
  * doesn't cancel the 2nd handler.
	*/
    create: function() {
        this.inherited(arguments);
    },
    saveApp: function(inSender, inEvent) {
        this.saveClick = true;
        this.tapHighlight = false;
    },
    /*buyItem: function()
	{
		this.buyClick = true;
	},
	removeItem: function()
	{
		//This is for the saved list ot handle the removing of items
		this.doRemoveItem();	
	},*/
    setAppItem: function(appItem) {
        if(enyo.application.appcatwindow._orientation == "portrait"){
            this.$.app_title.applyStyle("width", "325px");
        }else if(enyo.application.appcatwindow._orientation == "landscape"){
            this.$.app_title.applyStyle("width", "575px");
        }
        this.$.app_title.content = appItem.title;
        this.$.app_author.content = appItem.author;
        var badges = appItem.badges;
        if (badges) badges = badges instanceof Array ? badges : [badges];
        if (badges && findApps.Utilities.contains(badges, "touchpad_exclusive")) {
            this.$.badges.content = $L("For TouchPad");
        }
        var n = appItem.ratingCount;
        if (n == 0) {
            this.$.app_reviews.setContent($L("No Reviews"));
        } else {
            var reviewTemplate;
            if (n > 1) reviewTemplate = new enyo.g11n.Template($L("#{num} reviews"));
            else reviewTemplate = new enyo.g11n.Template($L("#{num} review"));
            this.$.app_reviews.setContent(reviewTemplate.evaluate({
                num: n
            }));
        }
        var imageMap = findApps.Utilities.array2Map(appItem.images, "imageKey");
        var appIcon = findApps.Utilities.findFirstMatch(imageMap, [
            "icon/64x64",
            "icon/48x48"
            ]);
        var appIconUri = appIcon?appIcon.uri:appItem.appIcon;
        this.$.app_icon.setSrc(appIconUri);
        if (!appItem.averageRating) appItem.averageRating = 0;
        var doubleRating = appItem.averageRating * 2;
        this.$.avgRatingImg1.setSrc("images/stars/star-" + findApps.Utilities.formatStar(doubleRating, 0) + ".png");
        this.$.avgRatingImg2.setSrc("images/stars/star-" + findApps.Utilities.formatStar(doubleRating, 1) + ".png");
        this.$.avgRatingImg3.setSrc("images/stars/star-" + findApps.Utilities.formatStar(doubleRating, 2) + ".png");
        this.$.avgRatingImg4.setSrc("images/stars/star-" + findApps.Utilities.formatStar(doubleRating, 3) + ".png");
        this.$.avgRatingImg5.setSrc("images/stars/star-" + findApps.Utilities.formatStar(doubleRating, 4) + ".png");
        //var price = appItem.price == "Free" ? "Free" : "$"+appItem.price;
        this.updateDowloadButton(appItem);
        this.updateSaveButton(appItem);
        // Store the app id
        this.appId = appItem.publicApplicationId;
    },
    updateDowloadButton: function(appItem) {
        if (appItem._appDownload) {
            this.$.app_price.setParams(appItem._appDownload._progressPillModel);
        } else {
            this.$.app_price.setParams({
                value: 0,
                title: this.formatPrice(appItem.publicApplicationId, appItem.price)
            });
        }
    },
    updateSaveButton: function(appItem) {
        if (appItem._appDownload && !appItem._appDownload.enableSave) {
            this.$.app_save_parent.hide();
        } else {
            this.$.app_save_parent.show();
            this.$.app_save.setButton(appItem);
        /*var state = this.$.app_save.disabled ? "Saved" : "Save";
  	state = isSaved ? "Remove" : state;
  	this.$.app_save.setContent(state);*/
        }
    },
    formatPrice: function(packageId, price) {
        if (price == "n/a") return price;
        else {
            // The input price is Object from featured ,such as: 9,0.99,Free, so sync with genericdownloadbutton formatPrice
            if (price == 0 || price == "Free" || findApps.BaseServer.isPurchased(packageId)) {
                return $L("FREE");
            } else {
                var parsedPrice = parseFloat(price);
                var loc = findApps.UserSession.getActivationCountry();
                return findApps.Utilities.Formatter.formatCurrency(parsedPrice, loc);
            }
        }
    },
    _progressCancelled: function(event) {
        this.progressCancelled = true;
        this.tapHighlight = false;
    },
    _handleDownloadBar: function(sender, event) {
        this.buyClick = true;
        this.tapHighlight = false;
    }
});
