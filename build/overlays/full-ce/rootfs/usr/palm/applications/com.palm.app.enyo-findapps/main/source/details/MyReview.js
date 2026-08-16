/**
 * This kind is used to submit / update / show the user's review of an application
 */
enyo.kind({
    name: "findApps.Details.MyReview",
    kind: "enyo.Control",
    published: {
        // JSON object: {"appid":"", "packageid":""}
        appDetails: null
    },
    // JSON object
    // {"reviewed": true / false, "myRatingData":{<my review details from server>}, "appid": "", "packageid": ""}
    myReviewDetails: null,
    events: {
        onRenderSuccess: "",
        onMyReviewResized: ""
    },
    components: [
    //Error dialog
    {
        kind: "findApps.Error"
    }, {
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
    // Add Review section
    {
        name: "addReview",
        kind: "Group",
        className: "addReview",
        components: [{
            layoutKind: "HFlexLayout",
            flex: 1,
            components: [{
                kind: enyo.Control,
                className: "app-details-rate-app-header",
                content: $L("Rate This App:")
            },
            // 5 rating stars
            {
                flex: 3,
                layoutKind: "HFlexLayout",
                components: [{
                    name: "addReviewStarImg1",
                    className: 'add-review-star-img',
                    kind: enyo.Image,
                    src: 'images/star-large-single-gray.png',
                    onclick: "onClickAddReviewStarImg1"
                }, {
                    name: "addReviewStarImg2",
                    className: 'add-review-star-img',
                    kind: enyo.Image,
                    src: 'images/star-large-single-gray.png',
                    onclick: "onClickAddReviewStarImg2"
                }, {
                    name: "addReviewStarImg3",
                    className: 'add-review-star-img',
                    kind: enyo.Image,
                    src: 'images/star-large-single-gray.png',
                    onclick: "onClickAddReviewStarImg3"
                }, {
                    name: "addReviewStarImg4",
                    className: 'add-review-star-img',
                    kind: enyo.Image,
                    src: 'images/star-large-single-gray.png',
                    onclick: "onClickAddReviewStarImg4"
                }, {
                    name: "addReviewStarImg5",
                    className: 'add-review-star-img',
                    kind: enyo.Image,
                    src: 'images/star-large-single-gray.png',
                    onclick: "onClickAddReviewStarImg5"
                }]
            }, ]
        },
        // Comments (to be shown only when the user selects rating value
        {
            layoutKind: "HFlexLayout",
            flex: 2,
            name: "addReviewComment",
            className: "add-review-comment",
            components: [{
                flex: 1,
                name: "addReviewTextField",
                components: [{
                    kind: "InputBox",
                    name: "addReviewCommentInputBox",
                    components: [{
                        name: "scroller",
                        kind: "BasicScroller",
                        autoVertical: true,                        
                        flex: 1,
                        style: "height:100px;",
                        components: [{
                            style: "padding:10px;",
                            components: [{
                                kind: "RichText",
                                flex: 1,
                                name: "addReviewCommentInput",
                                className: "add-review-comment-input",
                                style: "min-height:90px;border-width:0px;border-style:none;",
                                hint: $L("Tap here to begin typing")
                            }]
                        }]
                    }]
                }]
            }]
        }, {
            layoutKind: "HFlexLayout",
            flex: 1,
            align: "center",
            name: "submitCancelReview",
            components: [
            // Name drop down
            {
                kind: "CustomListSelector",
                name: "nameSelector",
                style: "margin:0 14px 0 14px;"
            },
            //Submit Review button
            {
                kind: "Button",
                name: "submitAReviewButton",
                className: "enyo-button-light",
                caption: $L("Submit"),
                onclick: "onClickSubmitAReview"
            },
            // Cancel Review button
            {
                kind: "Button",
                name: "cancelReviewButton",
                className: "enyo-button-light",
                caption: $L("Cancel"),
                onclick: "onClickCancelReview"
            }]
        }]
    },
    // My Review section
    {
        name: "myReview",
        components: [{
            caption: $L("My Review")
        }, {
            components: [{
                name: "myReviewItem",
                kind: "VFlexBox",
                className: "my-review enyo-row",
                components: [{
                    layoutKind: "HFlexLayout",
                    components: [{
                        flex: 1,
                        layoutKind: "HFlexLayout",
                        className: "my-review-items",
                        components: [{
                            name: "myReviewItemStar",
                            className: "my-review-stars",
                            kind: enyo.Image,
                            src: ''
                        }, {
                            name: "author",
                            className: "my-review-name",
                            kind: enyo.Control
                        }]
                    }, {
                        flex: 1,
                        components: [{
                            name: "myReviewItemDate",
                            className: "my-review-date"
                        }]
                    }]
                }, {
                    name: "myReviewItemComment",
                    className: "my-review-comment-text",
                    allowHtml: true
                }, {
                    kind: "Button",
                    name: "updateAReviewButton",
                    className: "enyo-button-light my-review-update-comment-button",
                    caption: $L("Update"),
                    onclick: "onClickUpdateMyReview"
                }, ]
            }]
        }, ]
    }],
    create: function() {
        this.inherited(arguments);
        this.appdownloadmgr = enyo.application.appdownloadManager;
        this.myReviewDetails = null;
        // Attach this kind as a listener for application state changes
        var accntInfo = findApps.AccountServices.getInstance().getAccountInfo({
            onSuccess: "accountInfoSuccess", 
            onFailure: "accountInfoFailure", 
            scope: this
        });
        if (accntInfo) {
            this.accountInfoSuccess(null, accntInfo);
        }
    },
    destroy: function() {
    	if(this.appDownload)
    		this.appDownload.detach(this);
    	this.inherited(arguments);
    },
    // User of this kind should call setAppDetails to pass the appid, packageid information to this
    // kind.
    // Whenever setAppDetails is called, the MyReview kind will try to fetch the user's review for this 
    // application from the server
    appDetailsChanged: function(oldData) {
    	// detach from older / previous appDownload object if present
    	if(this.appDownload)
    		this.appDownload.detach(this);
        this.appDownload = this.appdownloadmgr.getAppDownload(this.appDetails.packageid, this);
        // Get the user rating
        this.getMyRatingFromServer();
    },
    // Observer method for download state changes
    // if application got installed allow user to submit a review
    updateDownloadState: function(app) {
        if (this.appDownload.isInstalled()) {
            this.doMyReviewResized();
            this.renderReviewFromModel(this.myReviewDetails);
        }
    },
    // This method shows the "Add Review" or "My Review" section based on the data
    renderReviewFromModel: function(reviewDetails) {
        // User has reviewed the application
        // show the MyReview section, hide Add Review
        if (reviewDetails && reviewDetails.reviewed == true) {
            // Show My Review section
            this.showMyReview(reviewDetails.myRatingData);
        } else {
            // Show add review section only if application is installed
            // and first name / last name are available
            if ((this.appDownload && this.appDownload.isInstalled()) && (this.fullName != "" || this.firstInitial != "")) {
                // Show add review section
                this.showAddReview();
            } else {
                this.disallowAddReview();
            }
        }
        // My Review kind successfully rendered
        // Generate an event.
        this.doRenderSuccess();
    },
    // This method is used to show an empty "Add Review" section (initial UI)
    showAddReview: function() {
        // Hide My Review section
        this.$.myReview.hide();
        this.$.addReview.show();
        this.$.submitCancelReview.hide();
        this.$.addReviewComment.hide();
        this.$.addReviewCommentInput.setValue("");
        this.renderRatingStars(0);
        this.doMyReviewResized();
    },
    disallowAddReview: function() {
        // Hide all the controls
        this.$.myReview.hide();
        this.$.addReview.hide();
    },
    // This method shows the "My Review" section
    showMyReview: function(myRatingData) {
        // Hide Add Review section
        this.$.addReview.hide();
        // Hide submit cancel button section
        this.$.submitCancelReview.hide();
        // Show My Review section
        this.$.myReview.show();
        // Update My Review section
        this.$.myReviewItemComment.setContent(myRatingData.comment);
        if (!myRatingData.isAnonymous) {
            this.$.author.setContent("By: " + myRatingData.creator);
        }
        var starImgUrl = "images/stars/stars-medium-" + myRatingData.score + ".png";
        this.$.myReviewItemStar.setSrc(starImgUrl);
        this.$.myReviewItemDate.setContent(this.formatDate(myRatingData.creationtime));
        this.$.updateAReviewButton.show();
        this.doMyReviewResized();
    },
    // This method is used to display the Review comments field and the buttons for submit / cancel
    // These fields are to be displayed when the user selects some rating value, or when the user clicks on "Update My Review"
    displayReviewComment: function() {
        if (!this.$.addReview.showing) this.$.addReview.show();
        if (!this.$.submitCancelReview.showing) {
            // Show submit review
            this.$.submitCancelReview.show();
            // Show "Comments" label and text field
            this.$.addReviewComment.show();
            this.$.addReviewCommentInput.show();
            this.$.nameSelector.show();
            this.$.addReviewTextField.show();
            if (this.myReviewDetails && this.myReviewDetails.myRatingData) {
                if (this.myReviewDetails.myRatingData.comment) this.$.addReviewCommentInput.setValue(this.myReviewDetails.myRatingData.comment);
                if (this.myReviewDetails.myRatingData.isAnonymous) this.$.nameSelector.setValue(1);
                else {
                    var createdBy = this.myReviewDetails.myRatingData.creator;
                    if (createdBy && createdBy == this.firstInitial) this.$.nameSelector.setValue("firstinitial");
                    else this.$.nameSelector.setValue("fullname");
                }
                // Show the rating stars
                if (this.myReviewDetails.myRatingData.score) this.renderRatingStars(this.myReviewDetails.myRatingData.score);
            }
        }
        this.doMyReviewResized();
    },
    // Event handlers
    onClickUpdateMyReview: function() {
        // Update My Review button clicked
        this.$.myReview.hide();
        this.displayReviewComment();
    },
    onClickAddReviewStarImg1: function() {
        this.renderRatingStars(1);
        this.displayReviewComment();
    },
    onClickAddReviewStarImg2: function() {
        this.renderRatingStars(2);
        this.displayReviewComment();
    },
    onClickAddReviewStarImg3: function() {
        this.renderRatingStars(3);
        this.displayReviewComment();
    },
    onClickAddReviewStarImg4: function() {
        this.renderRatingStars(4);
        this.displayReviewComment();
    },
    onClickAddReviewStarImg5: function() {
        this.renderRatingStars(5);
        this.displayReviewComment();
    },
    onClickSubmitAReview: function() {
        var userComment = this.$.addReviewCommentInput.value;
        if (!this.score || this.score < 1) {
            this.showAlertPopup($L("App Rating"), $L("Rate the Application by tapping the stars."));
        } else {
            userComment = enyo.string.trim(userComment);
            var todayDate = new Date();
            var createdDate = this.formatDate(todayDate);
            var anonymous = false;
            var creator = "";
            if (this.$.nameSelector.value == 1) {
                anonymous = true;
            } else {
                if (this.$.nameSelector.getValue() == "firstinitial") creator = this.firstInitial;
                else if (this.$.nameSelector.getValue() == "fullname") creator = this.fullName;
            }
            this.myRatingData = {
                comment: userComment,
                isAnonymous: anonymous,
                creationtime: createdDate,
                score: this.score,
                creator: anonymous == true ? "" : creator,
                id: (this.myReviewDetails.myRatingData && this.myReviewDetails.myRatingData.id) ? this.myReviewDetails.myRatingData.id : ""
            };
            this.$.submitAReviewButton.disabled = true;
            this.$.submitAReviewButton.addClass('enyo-button-disabled');
            this.addUserRating(this.myRatingData);
        }
    },
    onClickCancelReview: function() {
        // Revert back to old review details
        this.myReviewDetails = this.oldMyReviewDetails;
        if (this.myReviewDetails && this.myReviewDetails.myRatingData) {
            this.showMyReview(this.myReviewDetails.myRatingData);
        } else {
            this.showAddReview();
        }
    },
    // Utility methods
    renderRatingStars: function(ratingVal) {
        this.score = ratingVal;
        if (ratingVal >= 1) this.$.addReviewStarImg1.setSrc("images/star-large-single-orange.png");
        else this.$.addReviewStarImg1.setSrc("images/star-large-single-gray.png");
        if (ratingVal >= 2) this.$.addReviewStarImg2.setSrc("images/star-large-single-orange.png");
        else this.$.addReviewStarImg2.setSrc("images/star-large-single-gray.png");
        if (ratingVal >= 3) this.$.addReviewStarImg3.setSrc("images/star-large-single-orange.png");
        else this.$.addReviewStarImg3.setSrc("images/star-large-single-gray.png");
        if (ratingVal >= 4) this.$.addReviewStarImg4.setSrc("images/star-large-single-orange.png");
        else this.$.addReviewStarImg4.setSrc("images/star-large-single-gray.png");
        if (ratingVal >= 5) this.$.addReviewStarImg5.setSrc("images/star-large-single-orange.png");
        else this.$.addReviewStarImg5.setSrc("images/star-large-single-gray.png");
    },
    formatDate: function(dateString) {
        var dateObj = new Date(dateString);
        return (dateObj.getMonth() + 1) + "/" + dateObj.getDate() + "/" + dateObj.getFullYear();
    },
    displayError: function(errors) {
        // Only if details view is at the top
        if (findApps.ViewLibrary._container.isTopView(this.owner.owner)) {
            this.$.error.displayError(errors);
        }
    },
    // Error dialog methods
    submitError: function() {
        this.$.error.cancel();
    },
    cancelError: function() {
        this.$.error.cancel();
    },
    // Server methods
    getMyRatingFromServer: function() {
        findApps.BaseServer.getACServer().getMyRating(this.appDetails.appid, this.appDetails.packageid, "getMyRatingService", {
            onSuccess: "handleServerResponse",
            onFailure: "handleServerError",
            scope: this
        })
    },
    addUserRating: function(myRatingData) {
        if (myRatingData.id && myRatingData.id != "") {
            // Update an existing review
            findApps.BaseServer.getACServer().updateUserReview(this.appDetails.appid, this.appDetails.packageid, this.appDetails.version, enyo.g11n.currentLocale().toISOString(), myRatingData.id, myRatingData.comment, myRatingData.score, myRatingData.creator, "updateUserRatingService", {
                onSuccess: "handleServerResponse",
                onFailure: "handleServerError",
                scope: this
            });
        } else {
            findApps.BaseServer.getACServer().addUserReview(this.appDetails.appid, this.appDetails.packageid, this.appDetails.version, enyo.g11n.currentLocale().toISOString(), myRatingData.comment, myRatingData.score, myRatingData.creator, "addUserRatingService", {
                onSuccess: "handleServerResponse",
                onFailure: "handleServerError",
                scope: this
            });
        }
    },
    setNameOptions: function() {
        var accountInfo = findApps.UserSession.getAccountInfo();
        if (accountInfo != null) {
            this.fullName = accountInfo.firstName + " " + accountInfo.lastName;
            this.firstInitial = accountInfo.firstName + " " + accountInfo.lastName.substring(0, 1);
        } else {
            this.fullName = "";
            this.firstInitial = "";
        }
        // Setting items
        // If first initial == first name, show only one option
        if (this.fullName.trim() == this.firstInitial.trim()) this.$.nameSelector.setItems([{
            caption: this.firstInitial,
            value: "firstinitial"
        }]);
        else this.$.nameSelector.setItems([{
            caption: this.firstInitial,
            value: "firstinitial"
        }, {
            caption: this.fullName,
            value: "fullname"
        }]);
        // Select the first initial by default
        this.$.nameSelector.setValue("firstinitial");
        this.$.nameSelector.render();
    },
    // Server callback methods
    // Server callback
    accountInfoSuccess: function(inSender, accountInfo) {
        // Store the account info in the global object
        if (findApps.UserSession.getAccountInfo() == null) findApps.UserSession.setAccountInfo(accountInfo);
        this.setNameOptions();
    },
    accountInfoFailure: function(inSender, inResponse) {
        this.error("Review : Could not fetch first name / last name. getAccountInfo failure. ", inResponse);
        this.setNameOptions();
    },
    handleServerResponse: function(inSender, inResponse, inRequest, props) {
        this.$.submitAReviewButton.disabled = false;
        this.$.submitAReviewButton.removeClass('enyo-button-disabled');
        switch (props.service) {
            case "getMyRatingService":
                if (inResponse.UserRating) {
                    // Fetch the user review from response
                    this.myReviewDetails = {
                        "reviewed": true,
                        "myRatingData": inResponse.UserRating,
                        "appid": this.appDetails.appid,
                        "packageid": this.appDetails.packageid
                    };
                } else {
                    this.myReviewDetails = {
                        "reviewed": false,
                        "appid": this.appDetails.appid,
                        "packageid": this.appDetails.packageid
                    };
                }
                // Initialize old review details with the current one.
                this.oldMyReviewDetails = this.myReviewDetails;
                this.renderReviewFromModel(this.myReviewDetails);
                break;
            case "addUserRatingService":
                this.myReviewDetails.reviewed = true;
                this.myReviewDetails.myRatingData = this.myRatingData;
                // Response contains the review id. Store it for future updates
                this.myReviewDetails.myRatingData.id = inResponse.response.id;
                // Update the old review details object
                this.oldMyReviewDetails = this.myReviewDetails;
                // Show the "My Review" section
                this.showMyReview(this.myReviewDetails.myRatingData);
                break;
            case "updateUserRatingService":
                // Make old review details = new review details
                this.myReviewDetails.reviewed = true;
                this.myReviewDetails.myRatingData = this.myRatingData;
                // Update the old review details object
                this.oldMyReviewDetails = this.myReviewDetails;
                // Show the "My Review" section
                this.showMyReview(this.myReviewDetails.myRatingData);
                break;
        }
    },
    handleServerError: function(inSender, inResponse, inRequest, props, errors) {
        switch (props.service) {
            case "getMyRatingService":
                // Special case for getMyRating - returns empty response when no reviews are present
                if (inResponse === "") {
                    // Treat this case as no review added yet (success case)
                    this.myReviewDetails = {
                        "reviewed": false,
                        "appid": this.appDetails.appid,
                        "packageid": this.appDetails.packageid
                    };
                    // Initialize old review details with the current one.
                    this.oldMyReviewDetails = this.myReviewDetails;
                    this.renderReviewFromModel(this.myReviewDetails);
                } else if (inResponse.JSONException) {
                    this.myReviewDetails = {
                        "reviewed": false,
                        "appid": this.appDetails.appid,
                        "packageid": this.appDetails.packageid
                    };
                    // Initialize old review details with the current one.
                    this.oldMyReviewDetails = this.myReviewDetails;
                    this.renderReviewFromModel(this.myReviewDetails);
                } else {
                    // Do not show any review UI
                    this.disallowAddReview();
                }
                break;
            case "addUserRatingService":
            case "updateUserRatingService":
                this.$.submitAReviewButton.disabled = false;
                this.$.submitAReviewButton.removeClass('enyo-button-disabled');
                errors.push("LOC07101");
                this.displayError(errors);
                break;
        }
    },
    showAlertPopup: function(title, message) {
        // Only if details view is at the top
        if (findApps.ViewLibrary._container.isTopView(this.owner.owner)) {
            this.$.alertPrompt.openAtCenter();
            this.$.alertTitle.setContent(title);
            this.$.alertMessage.setContent(message);
        }
    },
    dismissAlertPopup: function() {
        this.$.alertPrompt.close();
    }
});
