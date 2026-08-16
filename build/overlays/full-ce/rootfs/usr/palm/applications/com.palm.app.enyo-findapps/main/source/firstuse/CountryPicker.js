enyo.kind({
    name: "findApps.CountryPicker",
    kind: enyo.VFlexBox,
    height: "100%",
    width: "100%",
    published: {},
    className: "terms",
    countries: [],
    countryOffset: 0,
    //countries: [{"id":23,"code":"US","name":"UNITED STATES"},{"id":1,"code":"AT","name":"AUSTRIA"},{"id":2,"code":"BE","name":"BELGIUM"},{"id":3,"code":"BR","name":"BRAZIL"},{"id":4,"code":"CA","name":"CANADA"},{"id":5,"code":"DK","name":"DENMARK"},{"id":6,"code":"FI","name":"FINLAND"},{"id":7,"code":"FR","name":"FRANCE"},{"id":8,"code":"DE","name":"GERMANY"},{"id":9,"code":"HK","name":"HONG KONG"}],
    components: [
    // scrim
    {
        name: "scrim",
        kind: "Scrim",
        layoutKind: "VFlexLayout",
        align: "center",
        pack: "center",
        components: [{
            kind: "SpinnerLarge",
            name: "spinner",
            showing: false
        }]
    },
    // error
    {
        kind: "findApps.Error",
        name: "error",
        onSubmit: "submitError",
        onCancel: "cancelError"
    }, {
        layoutKind: "HFlexLayout",
        pack: 'center',
        components: [{
            kind: "Spacer", name: "spacerleft"
        }, {
            name: "header",
            className: "terms-header",
            content: $L("Choose your shopping country:")
        }, {
            kind: "Spacer", name: "spacerright"
        }]
    }, {
        flex: 1,
        name: "list",
        kind: "VirtualList",
        layoutKind: "VFlexLayout",
        className: "enyo-scroller box country-box",
        onSetupRow: "listSetupRow",
        components: [{
            kind: "Item",
            onclick: "itemClick",
            components: [{
                name: "country",
                className: "country-item"
            }]
        }]
    }, {
        layoutKind: "HFlexLayout",
        components: [{
            kind: "Spacer"
        }, {
            name: "description",
            style: "width:460px",
            content: $L("Choose the country where you reside or where your billing address is located. If you choose \"Other\" you will only be able to download free apps. Once you choose a country, you cannot change it later.")
        }, {
            kind: "Spacer"
        }]
    }, {
        layoutKind: "HFlexLayout",
        style: "padding-top:20px",
        components: [{
            kind: "Spacer"
        }, {
            name: "continueButton",
            kind: "Button",
            style: "width:276px",
            caption: $L("Continue"),
            disabled: true,
            onclick: "openConfirmPopup"
        }, {
            kind: "Spacer"
        }]
    }, {
        layoutKind: "HFlexLayout",
        components: [{
            kind: "Spacer"
        }, {
            name: "footer",
            style: "width:460px",
            content: $L("Once you’ve chosen a Shopping Country, you cannot change it.")
        }, {
            kind: "Spacer"
        }]
    }, {
        kind: "ModalDialog",
        name: "confirmPopup",
        components: [{
            name:"confirmContent", 
            className: "enyo-paragraph", 
            style: "padding: 0 10px 6px 10px;", 
            allowHtml:true,
            content: $L("")
        }, {
            name:"confirm", 
            kind: "Button",
            caption: $L("YES"),
            onclick: "handleConfirm", 
            className: "enyo-button-affirmative"
        }, {
            name:"back", 
            kind: "Button",
            caption: $L("Go Back"),
            onclick: "closeConfirmPopup"
        }]
    }
    ],
    create: function() {
        this.inherited(arguments);
        var topContainer = findApps.ViewLibrary._container;
        if (topContainer && topContainer.registerObserver) {
            topContainer.registerObserver("resize", this);
        }
        // initialize to 0
        this.countryOffset = 0;
        this.refresh();
    },
    refresh: function() {
    	this.$.scrim.show();
        this.$.spinner.setShowing(true);
        
        // Check that /user/session call is made
        var sessionStatus = enyo.application.sessionManager.triggerInitSession(this);
        if(sessionStatus && sessionStatus.status === "complete") {
        	this.processSessionResponse();
        }
    },
    
    receiveResponse: function(event, success, errors) {
    	if(event === "userSession") {
    		enyo.application.sessionManager.removeListener(this, "userSession");
	    	if(success) {
	    		this.processSessionResponse();
	    	}
	    	else {
	    		errors.push("LOC03008");
	    		 this.$.scrim.hide();
	    	     this.$.spinner.setShowing(false);
	    	     this.$.error.displayError(errors);
	    	}
    	}
    },
    
    processSessionResponse: function() {
    	if(findApps.UserSession._session && findApps.UserSession._session.accountInfo && findApps.UserSession._session.accountInfo.isUserAllowedUpdateCountry == "true")
    		findApps.BaseServer.getACServer().getCountryList("getCountryList",{
				    onSuccess: "handleServerResponse",
				    onFailure: "handleServerFailure",
				    scope: this
        	});
    	else {
    		// AC Country is set already
    		this.storeACCountry(findApps.UserSession._session.deviceProperties.country);
    		this.showNextView();
    	}
    }
    ,
    // function invoked by container when screen is resized
    update: function() {
        this.$.list.resized();
    },
    submitError: function(sender, value) {
        switch (value) {
            case "tryGetCountryList":
                this.tryGetCountryList();
                break;
        }
    },
    tryGetCountryList: function() {
        this.$.error.cancel();
        findApps.BaseServer.getACServer().getCountryList("getCountryList",{
            onSuccess: "handleServerResponse",
            onFailure: "handleServerFailure",
            scope: this
        });
        this.$.scrim.hide();
        this.$.scrim.show();
        this.$.spinner.setShowing(true);
    },
    cancelError: function() {
        this.$.error.cancel();
    },
    listSetupRow: function(inSender, inIndex) {
        if (this.countries) {
            if (inIndex >= (this.countries.length - this.countryOffset)) {
                return false;
            }
            // index is calculated this way because the default selected country from /user/session response has to be shown
            // in the view. For that purpose, the first item shown in the virtual list is the default selected country
            // In case of virtual list, concept of an index is virtual. Need to calculate the right index in the array
            // based on the inIndex
            var index = (parseInt(inIndex) + parseInt(this.countryOffset)) % this.countries.length; //inIndex; //
            if (this.countries[index]) {
                this.record = this.countries[index];
                if (this.record && this.record.name) {
                    //this.$.item.applyStyle("background-color", inSender.isSelected(index) ? "lightblue" : null);
                    this.$.item.addRemoveClass("enyo-item-selected", inSender.isSelected(index) ? true : false);
                    this.$.country.setContent(this.record.name);
                    return true;
                }
            }
        }
    },
    itemClick: function(inSender, inEvent, inRowIndex) {
        // index is calculated this way because the default selected country from /user/session response has to be shown
        // in the view. For that purpose, the first item shown in the virtual list is the default selected country
        // In case of virtual list, concept of an index is virtual. Need to calculate the right index in the array
        // based on the inRowIndex
        var index = (parseInt(inRowIndex) + parseInt(this.countryOffset)) % this.countries.length;
        this.selectedItem = this.countries[index];
        this.$.list.select(index);
        this.$.continueButton.setDisabled(false);
        this.update();
        // update the description content for show different strings for in which country user can purchase or not.
        this.updateHeaderDescription(index);
    },
    handleAccept: function(inSender, inResponse) {
        if (this.selectedItem && this.selectedItem.code) {
            // Store AC Country
    		this.storeACCountry(this.selectedItem.code);
            findApps.BaseServer.getACServer().setCountryCode(this.selectedItem.code, "setCountryCode", {
                onSuccess: "handleServerResponse",
                onFailure: "handleServerFailure",
                scope: this
            });
        } else {
            // If user selected country, move handleAppCatLaunch() to after setCountryCode()
            //var magView = findApps.ViewLibrary.getView("MAGAZINE");        
            findApps.ViewLibrary._container.handleAppCatLaunch();
        }
    },
    handleCountryListResponse: function(inSender, inItem, inResponse, inRequest) {
        this.$.scrim.hide();
        this.$.spinner.setShowing(false);
        if (inResponse && inResponse.body && inResponse.body.response && inResponse.body.response.countries) {
            this.countries = inResponse.body.response.countries;
            // Set the country in the user/session as selected by default
            if (findApps.UserSession.getSession() && findApps.UserSession.getSession().deviceProperties && findApps.UserSession.getSession().deviceProperties.country) {
                var defaultSelectedCountry = findApps.UserSession.getSession().deviceProperties.country;
                // Take the localized string for the country name
                for (var i in this.countries) {
                    this.countries[i].name = $L(this.countries[i].name);
                }
                // Then sort it (this is done separate before so that we have the right indexes after sorting)
                this.countries.sort(this.compareCountries);
                for (var i in this.countries) {
                    if (this.countries[i].code == defaultSelectedCountry) {
                        this.selectedItem = this.countries[i];
                        this.$.list.select(i);
                        // To show the selected country in view always. Need to generate the effect of scrolling to that
                        // item.
                        this.countryOffset = i;
                        this.$.continueButton.setDisabled(false);
                        // update the description content for show different strings for in which country user can purchase or not.
                        this.updateHeaderDescription(i);
                    }
                }
            }
            //this.countries.push({id:-1, code: "", name: $L("Other Country")});
            this.$.list.resized();
        }
    },
 
    storeACCountry: function(code) {
        findApps.UserSession.setActivationCountry(code);
    },
    
    showNextView: function() {
    	// Check if terms of use is accepted
	   if(!findApps.UserSession.isTermsAccepted()) {
		   // Change the viewToLoad parameter in scene parameters to TERMSCONDITIONS. Rest should be kept as is
		   this.sceneParams.viewToLoad = "TERMSCONDITIONS";
		   findApps.ViewLibrary._container.showView(this.sceneParams);
	   }
	   // Terms of use are also accepted. Show the user selected view now
	   else {
		   var viewParams = this.sceneParams.nextViewParams || {};
		   viewParams.viewToLoad = this.sceneParams.nextView;
		   findApps.ViewLibrary._container.showView(viewParams);
	   }
	   this.$.scrim.hide();
	   this.$.spinner.setShowing(false);
    },
    handleServerResponse: function(inSender, inResponse, inRequest, props) {
        switch (props.service) {
            case "getCountryList":
                this.handleCountryListResponse(inSender, props, inResponse, inRequest);
                break;
            case "setCountryCode":
               this.storeACCountry(this.selectedItem.code);
               this.showNextView();
                break;
        }
    },
    handleServerFailure: function(inSender, inResponse, inRequest, props , errors) {
        switch (props.service) {
            case "getCountryList":
                errors.push("LOC03006");
                break;
            case "setCountryCode":
                errors.push("LOC03007");
                break;
        }
        this.$.scrim.hide();
        this.$.spinner.setShowing(false);
        this.$.error.displayError(errors);
    },
    setParams: function(params) {
    	this.sceneParams = params;
        if (params && params.modalMode) {
            this.$.spacerleft.hide();
            this.$.spacerright.hide();
            this.$.header.setClassName("terms-header-modal");
        }
    },
    compareCountries: function(a, b) {
        return a.name.localeCompare(b.name);
    },
    updateHeaderDescription: function(inIndex) {
        var index = inIndex;
        this.selectedItem = this.countries[index];
        if (this.selectedItem.useForPurchase) {
            // can purchase the paid apps or download the free apps
            //sample "The {$selectedCountry} App Catalog has free and paid apps. To purchase apps, you must have a billing address in {$country1}, {$country2}, {$countryEtc} or {$countryLast}"
            // Per DFISH-21532:
            //     change the localized string to
            //     "You must have a billing address in one of these places to purchase apps: United States, Canada, Mexico, US Territories."
            var countries = [];
            var paidAndFreeAppsString;
            // get billing countries
            for (var i in this.selectedItem.billingCountries) {
                var country = this.selectedItem.billingCountries[i];
                var name = country.name;
                countries.push($L(name));
            }
            if (countries.length == 0) {
                var freeAppsTemp = new enyo.g11n.Template($L("The #{selectedCountry} App Catalog has free and paid apps. "));
                paidAndFreeAppsString = freeAppsTemp.evaluate({selectedCountry:$L(this.selectedItem.name)});
            }else {
                var freeAppsTemp = new enyo.g11n.Template($L("You must have a billing address in one of these places to purchase apps: #{countries}."));
                paidAndFreeAppsString = freeAppsTemp.evaluate({
                    countries: countries.join($L(", "))
                });
            }
            
            this.$.description.setContent(paidAndFreeAppsString);
        } else {
            // can only download free apps
            var freeAppsTemp = new enyo.g11n.Template($L("The #{selectedCountry} App Catalog has free apps only."));
            var freeAppsOnlyString = freeAppsTemp.evaluate({
                selectedCountry: this.selectedItem.name
            });
            this.$.description.setContent(freeAppsOnlyString);
        }
    }
    ,
    getAppMenuOptions: function() {
    	return {
    		softwareManager: {disabled: false, show: true},
    		helpMenu: {disabled: false, show: true}
    	}
		  }
    ,
    openConfirmPopup: function() {
        this.$.confirmPopup.openAtCenter();
        var template = new enyo.g11n.Template($L("You have selected #{selectedCountry} Country as your shopping country. Are you sure? This cannot be changed."));
        var templateString = template.evaluate({
            selectedCountry: this.selectedItem.name
        });
        this.$.confirmContent.setContent(templateString);
    }
    ,
    closeConfirmPopup: function(){
        this.$.confirmPopup.close();
    }
    ,
    handleConfirm: function() {        
            this.handleAccept();
            this.closeConfirmPopup();
    }
});
