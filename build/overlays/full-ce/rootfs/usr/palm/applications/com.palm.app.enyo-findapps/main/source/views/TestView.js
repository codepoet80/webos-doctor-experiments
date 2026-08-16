/**
 * Test View
 */
enyo.kind({
    name: "findApps.TestView",
    kind: enyo.VFlexBox,
    components: [{
        kind: "FadeScroller",
        flex: 1,
        components: [{
            kind: "findApps.Error",
            onSubmit: "submitError",
            onCancel: "cancelError"
        }, {
            kind: enyo.Control,
            content: "Click related button to get into related part of FindApps.",
            domStyles: {
                margin: "10px",
                color: "#B8B6B6"
            }
        }, {
            kind: "Button",
            caption: "Payment",
            onclick: "paymentButtonClick"
        }, {
            kind: "Button",
            caption: "Details",
            onclick: "detailButtonClick"
        }, {
            kind: "Button",
            caption: "Browse Categories and Search",
            onclick: "browseButtonClick"
        }, {
            kind: "Button",
            caption: "Thumbnail Scroller",
            onclick: "testScroller"
        }, {
            kind: "Button",
            caption: "AppSummary kind",
            onclick: "testAppSummary"
        },
        //{kind: "Button", caption: "Open Menu", onclick: "openAppMenuHandler"},
        {
            kind: "HFlexBox",
            components: [{
                kind: "Button",
                flex: 1,
                caption: "Error Popup/Dialog",
                onclick: "displayError"
            }, {
                kind: "CustomListSelector",
                name: "error_type",
                value: 1,
                items: [{
                    caption: "Dialog",
                    value: 1
                }, {
                    caption: "Fullscreen",
                    value: 2
                }]
            }]
        }, {
            kind: "Button",
            caption: "Average Rating",
            onclick: "showAverageRating"
        }]
    }],
    create: function() {
        this.inherited(arguments);
        // Set up dummy token values
        findApps.UserSession._token = AppCatalog.Config.DummyConfig._token;
        findApps.UserSession._email = AppCatalog.Config.DummyConfig._email;
        findApps.UserSession._deviceId = AppCatalog.Config.DummyConfig._deviceId;
        findApps.UserSession._serverUrl = AppCatalog.Config.DummyConfig._env._serverUrl;
        // ACS2 server URL is different than ACS1 server URL
        // Account Services currently returns ACS1 server URL
        // This code is used to compute ACS2 server URL
        // After all ACS calls are moved to ACS2, account services can be updated to return
        // the ACS2 server URL directly
        var matches = /([^&]*):\/\/([^&/]*)\/([^&]*)/.exec(findApps.UserSession._serverUrl);
        findApps.UserSession._server2Url = matches[1] + "://" + matches[2] + "/appcatalog/2.0/";
        findApps.UserSession._paymentServerUrl = AppCatalog.Config.DummyConfig._env._paymentServerUrl;
        findApps.UserSession._accountInfo = {
            "firstName": "Tester",
            "lastName": "Tester"
        };
    },
    paymentButtonClick: function() {
        var prefView = findApps.ViewLibrary.getView("PREFERENCES");
    },
    detailButtonClick: function() {
        var appItem = {
            "publicApplicationId": "com.danp.button0002",
            "id": "152"
        };
        //this.$.app_details.setAppItem(appItem);
        var detailView = findApps.ViewLibrary.getView("APPDETAILS");
        detailView.setAppItem(appItem);
    },
    testScroller: function() {
        var imageData = {
            "images": [{
                "filename": "48.png",
                "height": 48,
                "imageKey": "appScaledImage1",
                "orientation": "P",
                "uri": "https:\/\/web.sbdev.palm.com\/virtual1\/public\/144\/icon\/S\/48.png",
                "width": 48
            }],
            "mediaLink": "http:\/\/www.w3schools.com\/html5\/movie.mp4",
            "mediaIcon": "https:\/\/web.sbdev.palm.com\/virtual1\/public\/144\/icon\/S\/48.png"
        };
        var thumbnailView = this.owner.setView("findApps.Details.ThumbnailsScroller");
        thumbnailView.setImageData(imageData);
    },
    testAppSummary: function() {
        var appDetail = {
            "adultRating": false,
            "appIcon": "http://cdn.downloads.qa.palm.com/public/5668/icon/S/icon_1_5_1.png",
            "appIcon2": "http://cdn.downloads.qa.palm.com/public/5668/icon/S/icon_1_5_1.png",
            "appIconBig": "http://cdn.downloads.qa.palm.com/public/5668/icon/icon_1_5_1.png",
            "appImage": "http://cdn.downloads.qa.palm.com/public/5668/en/images/1/A/angrybirds_pre_shot01.png",
            "appLocation": "https://cdn.downloads.qa.palm.com/apps/5668/files/com.rovio.angrybirds_1.5.1.ipk",
            "appScaledImage1": "http://cdn.downloads.qa.palm.com/public/5668/en/images/1/S/angrybirds_pre_shot01.png",
            "appScaledImage2": "http://cdn.downloads.qa.palm.com/public/5668/en/images/2/S/angrybirds_pre_shot02.png",
            "appScaledImage3": "http://cdn.downloads.qa.palm.com/public/5668/en/images/3/S/angrybirds_pre_shot03.png",
            "appScaledImage4": "http://cdn.downloads.qa.palm.com/public/5668/en/images/4/S/angrybirds_pre_shot04.png",
            "appScaledImage5": "http://cdn.downloads.qa.palm.com/public/5668/en/images/5/S/angrybirds_pre_shot05.png",
            "appSize": 12169952,
            "attributes": {
                "provides": {
                    "dockMode": true,
                    "noApp": false,
                    "universalSearch": true
                }
            },
            "averageRating": 4.5,
            "cntDownloads": 3680,
            "cntRating": 10,
            "copyright": "Copyrightï¿½ 2010 Rovio Mobile Ltd",
            "creationTime": "2010-08-24T07:27:42Z",
            "creator": "Rovio",
            "currency": "USD",
            "custsupportemail": "support@rovio.com",
            "custsupportphonenum": "",
            "description": "ï¿½Lemme tell ya, these ainï¿½t no ordinary finches weï¿½re talkinï¿½ about. These here are the Angry Birds, the ones thatï¿½s gonna kick you in the ï¿½nads. And theyï¿½re the ones on your side. They must be from Galapadapados, or sumptinï¿½.ï¿½ ï¿½ Col. Angus, Bird Expert.\n\nThe survival of the Angry Birds is at stake. Dish out revenge on the green pigs who stole the Birdsï¿½ eggs. Use the unique destructive powers of the Angry Birds to lay waste to the pigsï¿½ fortified castles. \n\nAngry Birds features hours of gameplay, challenging physics-based castle demolition, and lots of replay value. Each of the 225 levels requires logic, skill, and brute force to crush the enemy. \n\nProtect wildlife, or play Angry Birds!",
            "homeURL": "http://www.rovio.com",
            "id": 5668,
            "installSize": 45318144,
            "isEncrypted": false,
            "islocationbased": true,
            "lastModifiedTime": "2011-02-04T19:05:24Z",
            "licenseURL": "",
            "locale": "en_US",
            "mediaIcon": "http://img.youtube.com/vi/1Bk_nqUQ0fc/2.jpg",
            "mediaLink": "http://www.youtube.com/watch?v=1Bk_nqUQ0fc",
            "paymentCategory": "C4323.126",
            "price": 1.99,
            "priceIncludesTax": false,
            "priceType": "OT",
            "primaryCategory": "Games",
            "productCode": "App",
            "programType": "D",
            "publicApplicationId": "com.rovio.angrybirds",
            "purchasedVersion": "",
            "sku": "App-com.rovio.angrybirds-1.5.1",
            "summary": "ï¿½Lemme tell ya, these ainï¿½t no ordinary finches weï¿½re talkinï¿½ about. These here are the Angry Birds, the ones thatï¿½s gonna kick you in the ï¿½nads. And theyï¿½re the ones on your side. They must be from G",
            "supportURL": "http://www.rovio.com",
            "tagString": "games",
            "taxAmount": 0,
            "taxRate": 0,
            "title": "Angry Birds",
            "vendorid": 103029,
            "version": "1.5.1",
            "versionNote": "",
            "weightedRating": 4.082
        };
        var appSummaryView = this.owner.setView("findApps.AppSummary");
        appSummaryView.setAppDetails(appDetail);
    },
    browseButtonClick: function() {
        var mainView = findApps.ViewLibrary.getView("BROWSER");
    },
    /*goToHome: function() {
		this.goToView(0);
	},
	goToView: function(viewIndex) {
		var pane = this.$.pane;
		pane.flow();
		pane.selectViewByIndex(viewIndex);		
	},*/
    displayError: function() {
        this.$.error_type.value == 1 ? this.$.error.displayError("PMT_catchAll", {
            errCode: "0x12321312"
        }) : this.$.error.displayError("invalidtoken");
    },
    submitError: function() {
        console.log("Error submitted");
        this.$.error.cancel();
    },
    cancelError: function() {
        console.log("Error cancelled");
        this.$.error.cancel();
    },
    showConnError: function() {
        console.log('TODO: Show the document error');
    },
    showAverageRating: function() {
        var appRatingData = {
            stars: {
                1: 20,
                2: 30,
                3: 10,
                4: 20,
                5: 20
            },
            // This is the count for each star
            averageRating: 2.9,
            // Not shown anywhere in the UI currently I believe
            positiveCount: 50,
            // Not required to be used right now, since total count is enough  
            negativeCount: 50,
            // Not required to be used right now, since totalCount is enough
            percentPositive: 50,
            // % to be shown on the image
            percentNegative: 50,
            // % to be shown on the image
            totalCount: 100 // This is not to be shown, but you will need this to calculate the bar lengths for the stars,                          // relative to each other
        };
        var avgRatingKind = this.owner.setView("findApps.AverageRating");
        avgRatingKind.setAppRatingData(appRatingData);
    }
});
