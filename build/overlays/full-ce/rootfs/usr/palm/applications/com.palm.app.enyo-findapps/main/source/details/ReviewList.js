/**
 * This kind is used to show the reviews list on App. Details page.
 * App Details page uses two instances of this kind - one to show positive reviews, and second to show negative reviews
 */
enyo.kind({
    name: "findApps.Details.ReviewList",
    kind: "VFlexBox",
    published: {
        noReviewsMessage: "",
        // JSON object:
        // {"reviews":[], "totalCount": <total count of reviews>}
        reviewListInfo: null,
        reviewAuthTemp: new enyo.g11n.Template($L("By: #{author}")),
        reivewHelpTemp: new enyo.g11n.Template($L("#{usefulCnt} of #{totalCnt} found this review helpful."))
    // reviewList will contain the reviews 
    },
    events: {
        onNeedMoreReviews: "",
        onReviewListScroll: ""
    },
    components: [
    // Error dialog
    {
        kind: "findApps.Error"
    },
    //{className:"upper-shadow"}, 
    {
        className: "relief-box light",
        components: [{
            className: "relief-box-inner",
            components: [{
                layoutKind: "VFlexLayout",
                name: "reviewFetchLayout",
                showing: false,
                align: "center",
                pack: "center",
                height: "60px",
                components: [{
                    kind: "Spinner",
                    name: "reviewFetchSpinner",
                    showing: false
                }]
            },{
                height: "500px",
                name: "noReviewList",
                kind: enyo.Control,
                flex: 1,
                style: "color:#aaa; padding:90px 0 0 0; text-align:center;"
            },{
                height: "500px",
                classname: "review-list",
                name: "reviewList",
                accelerated: true,
                kind: "VirtualList",
                flex: 1,
                onSetupRow: "getReview",
                onAcquirePage: "acquireListPage",
                components: [{
                    kind: "VFlexBox",
                    className: "review-list-rows",
                    components: [{
                        layoutKind: "HFlexLayout",
                        components: [{
                            flex: 1,
                            layoutKind: "HFlexLayout",
                            components: [{
                                name: "reviewListItemAuthor",
                                kind: enyo.Control,
                                className: "review-list-author"
                            }]
                        },
                        {
                            name: "reviewListItemDate",
                            className: "review-item-date"
                        },
                        {
                            kind: enyo.Image,
                            name: "reviewListItemStar"
                        }]
                    }, {
                        name: "reviewListItemComment",
                        className: "review-list-comment",
                        allowHtml: true
                    }, {
                        layoutKind: "HFlexLayout",
                        name: "reviewReviewsBox",
                        align: "center",
                        className: "enyo-row",
                        components: [{
                            content: $L("Was this review useful?"),
                            style: "font-style:italic;margin-right:6px;",
                            className: ""
                        },
                        // {kind:"Spacer"},
                        {
                            kind: "Button",
                            name: "reviewUsefulYesButton",
                            className: "enyo-button-light helpful-button",
                            caption: $L("Yes"),
                            onclick: "onClickUsefulYes"
                        }, {
                            kind: "Button",
                            name: "reviewUsefulNoButton",
                            className: "enyo-button-light helpful-button",
                            caption: $L("No"),
                            onclick: "onClickUsefulNo"
                        }]
                    }, {
                        content: "",
                        name: "usefulNessCount",
                        className: "enyo-row"
                    }]
                }]
            } ]
        }]
    }
    //{className:"lower-shadow"}, 
    ],
    //This handles the event issues with appItem
    onClickUsefulYes: function(inSender, inEvent) {
        var index = inEvent.rowIndex;
        if (this.reviews[index]) {
            this.markReviewUsefulness(index, this.reviews[index], true);
        }
    },
    onClickUsefulNo: function(inSender, inEvent) {
        var index = inEvent.rowIndex;
        if (this.reviews[index]) {
            this.markReviewUsefulness(index, this.reviews[index], false);
        }
    },
    getReview: function(inSender, inIndex) {
        var start = (new Date).getTime();
        if (inIndex >= 0 && inIndex < this.reviewListInfo.totalCount) {
            var reviewItem = this.reviews[inIndex];
            if (reviewItem) {
                if (!reviewItem.usefulCount) {
                    reviewItem.usefulCount = 0;
                }
                if (!reviewItem.unusefulCount) {
                    reviewItem.unusefulCount = 0;
                }
                // bind data to item controls
                var star = "images/stars-medium-" + reviewItem.rating + ".png";
                this.$.reviewListItemStar.setSrc(star);
                this.$.reviewListItemAuthor.setContent(this.reviewAuthTemp.evaluate({
                    author: reviewItem.creator
                }))
                //this.$.reviewListItemAuthor.setContent("By: "+reviewItem.creator/*+" : "+inIndex*/);
                this.$.reviewListItemDate.setContent(findApps.Utilities.Formatter.formatShortDate(new Date(reviewItem.created)));
                this.$.reviewUsefulYesButton.disabled = false;
                this.$.reviewUsefulYesButton.removeClass('enyo-button-disabled');
                this.$.reviewUsefulNoButton.disabled = false;
                this.$.reviewUsefulNoButton.removeClass('enyo-button-disabled');
                // If this is the user's own review, do not show Buttons to set review usefulness
                // Only show the helpful count
                if (reviewItem.accountId && findApps.UserSession._accountId && (reviewItem.accountId == findApps.UserSession._accountId)) {
                    this.$.usefulNessCount.setContent(this.reivewHelpTemp.evaluate({
                        usefulCnt: reviewItem.usefulCount,
                        totalCnt: reviewItem.unusefulCount + reviewItem.usefulCount
                    }));
                    //this.$.usefulNessCount.setContent(reviewItem.usefulCount+" of "+(reviewItem.usefulCount + reviewItem.unusefulCount)+" found this review helpful.")
                    this.$.usefulNessCount.show();
                    this.$.reviewReviewsBox.hide();
                } else {
                    // Presence of usefulToMe means that the user has marked this review helpful / unhelpful before
                    if (reviewItem.usefulToMe == true || reviewItem.usefulToMe == false) {
                        this.$.usefulNessCount.setContent(this.reivewHelpTemp.evaluate({
                            usefulCnt: reviewItem.usefulCount,
                            totalCnt: reviewItem.unusefulCount + reviewItem.usefulCount
                        }));
                        this.$.usefulNessCount.show();
                        this.$.reviewReviewsBox.hide();
                    } else {
                        this.$.usefulNessCount.hide();
                        this.$.reviewReviewsBox.show();
                    }
                }
                this.$.reviewListItemComment.setContent(reviewItem.comments);
                return true;
            }
        }
    },
    acquireListPage: function(inSender, inPage) {
        var index = inPage * inSender.pageSize;
        if (index > 0 && index < this.reviewListInfo.totalCount && !this.reviews[index]) {
            this.doNeedMoreReviews({
                offset: index
            });
        }
    },
    reviewListInfoChanged: function(oldListInfo) {
        this.reviews = this.reviewListInfo.reviews;
        this.appDetails = this.reviewListInfo.appDetails;
        if(this.reviews && this.reviews.length){
            this.$.noReviewList.hide();
            this.$.reviewList.show();
            this.$.reviewList.punt();
        // punt rebuilds the component from start state according to code documentation (ScrollingList.js line#79)
        // so no need to call resized afterwards, which is an expensive function
        //this.$.reviewList.resized();
        } else {
            this.$.noReviewList.show();
            this.$.reviewList.hide();
        }
    },
    noReviewsMessageChanged: function(){
        this.$.noReviewList.setContent(this.noReviewsMessage);
    },
    updateReviewList: function(update) {
        this.reviews = this.reviews.concat(update);
        // Starting enyo-0.9 resized has to be called to ensure that the list gets refreshed
        // and re-rendered	  
        this.$.reviewList.resized();
    },
    refresh: function() {
        //refresh is called internally from resized so no need to call refresh
        //this.$.reviewList.refresh();
        this.$.reviewList.resized();
    },
    // TODO: NEEDS MORE WORK - BAD WAY OF MARKING REVIEW USEFUL / UNUSEFUL
    // NEED TO MAKE THIS ITEM INTO A SEPARATE KIND
    markReviewUsefulness: function(index, reviewItem, usefulToMe) {
        var service = "";
        if (usefulToMe == true) {
            service = "ReviewUsefulService:" + index;
        } else {
            service = "ReviewUnusefulService:" + index;
        }
        findApps.BaseServer.getACServer().updateReviewOfReview(this.appDetails.id, this.appDetails.packageid, reviewItem.version, reviewItem.id, usefulToMe, service, {
            onSuccess: "handleServerResponse",
            onFailure: "handleServerError",
            scope: this
        });
        this.$.reviewUsefulYesButton.disabled = true;
        this.$.reviewUsefulYesButton.addClass('enyo-button-disabled');
        this.$.reviewUsefulNoButton.disabled = true;
        this.$.reviewUsefulNoButton.addClass('enyo-button-disabled');
    },
    handleServerResponse: function(inSender, inResponse, inRequest, props) {
        var colonIndex = props.service.indexOf(":");
        var reviewIndex = props.service.substring(colonIndex + 1);
        var serviceType = props.service.substring(0, colonIndex);
        if (serviceType == "ReviewUsefulService") {
            this.reviews[reviewIndex].usefulToMe = true;
            this.reviews[reviewIndex].usefulCount++;
        } else if (serviceType == "ReviewUnusefulService") {
            this.reviews[reviewIndex].usefulToMe = false;
            this.reviews[reviewIndex].unusefulCount++;
        }
        this.refresh();
    },
    handleServerError: function(inSender, inResponse, inRequest, props, errors) {
        // Show error dialog box
        errors.push("LOC07200");
        this.displayError(errors);
    },
    // Utility methods
    displayError: function(errors) {
        // Only if details view is at the top
        if (findApps.ViewLibrary._container.isTopView(this.owner.owner)) this.$.error.displayError(errors);
    },
    // Error dialog methods
    submitError: function() {
        this.$.error.cancel();
    },
    cancelError: function() {
        this.$.error.cancel();
    },
    create: function() {
    	this.inherited(arguments);
    	this.$.reviewList.scrollerScroll = enyo.bind(this, 'scrollerScroll');
    	this.$.reviewList.$.scroller.onScroll = 'scrollerScroll';
    },
    scrollerScroll: function() {
    	this.doReviewListScroll();
    },
    fetchSpinner: function(showing) {
        this.$.reviewFetchLayout.setShowing(showing);
        this.$.reviewFetchSpinner.setShowing(showing);
    }
});
