enyo.kind({
    name: "Language",
    events: {
        onFinish: ""
    },
	kind: enyo.HFlexBox, align: 'center', pack: 'justify',
    published: {
		languageCodes: ["en", "es", "fr", "de"],
       
		countryCodes: [],
        //countries: ["United States", "Spain", "France", "Germany"],
		//countryCodes: ["us", "es", "fr", "de"],
		selectedCountry: "",
		selectedCountryCode: "",
		selectedLanguage: "",
		selectedLanguageCode: ""
    },
    languages: [],
    countries: [],
    components: [
		{content: "", style: "width: 100%; display: table; height: 100%;",
		components: [
			{name: "languageScroller", kind: enyo.BasicScroller, style: "display: table-cell; vertical-align: middle;",
			 components: [
				{name: "mainbox",
				kind: enyo.VFlexBox,
				className: "languages", pack: "center", align: "center",
				components: [
				]},
		]}
		]}, 
		
		
		{name: "confirmPopup", kind: "ModalDialog", lazy: false, className: "popup", components: [
					{name: "message", content: "", className: "enyo-text-header", style: "text-align:center"},
					{kind: "HFlexBox", pack: "justify", className: "language-btns", style: "padding:15px 0 0 0;", components: [
							{kind: "IconButton", className: "enyo-button-negative", style: "margin-right:10px;", icon: "images/btn_cancel.png", flex: 1, onclick: "doCancel"},
							{kind: "IconButton", className: "enyo-button-affirmative", icon: "images/btn_confirm.png", flex: 1, onclick: "doConfirm"}
					]},
				]
		}, 
		{kind: "Scrim", layoutKind: "VFlexLayout", align: "center", pack: "center", components: [
            	{kind: "SpinnerLarge", name: "spinner", showing: false}
        		]
		},
		//{name:"justScrim", kind: "Scrim", layoutKind: "VFlexLayout", align: "center", pack: "center"},
		
		{kind: "SystemService", onFailure: "handleGenericFailure", onSuccess: "handleGenericSuccess", 
			components: [
				{name: "getLanguageList", method: "getPreferenceValues", subscribe: true, params: {"key": "locale"}, onSuccess: "gotLanguages"},
				{name: "setTimeFormat", method: "setPreferences", onResponse: "setTimeResponse"},	
				{name: "setLocaleRegion", method: "setPreferences", onResponse:"setLocaleRegionResponse"}
			]
		},
		{kind: "AccountsService", onResponse: "handleAccountsServiceResponse", 
			components: [
                {name: "listAccounts", method: "listAccounts", onResponse: "listAccountsResponse", params: {"templateId":"com.palm.palmprofile"}}, 
				{name: "deleteAccount", method: "deleteAccount", onResponse: "deleteAccountResponse"}
			]
		}
	],
    
    create: function(){
        this.inherited(arguments);
        // webOS CE: this wipes the device's palm profile, and it runs from a
        // constructor — so merely RENDERING this card is destructive. Stock could
        // assume the card only ever appeared on a factory-fresh device; this app is
        // now also the "webOS Account" launcher icon, where deleting the user's
        // account is precisely the wrong thing. Only delete while LunaSysMgr is
        // running us as first use. FirstUse.create() already routes standalone
        // launches past this card — this is the second lock on the same door,
        // because the cost of being wrong here is the user's account.
        var isOobe = true;
        try {
            if (window.PalmSystem && typeof(PalmSystem.isMinimal) === "boolean") {
                isOobe = PalmSystem.isMinimal;
            }
        } catch (e) { console.info("WOSA: isMinimal probe failed: " + e); }
        if (isOobe) {
            this.deleteAnyExistingPalmProfileAccounts();
        } else {
            console.info("WOSA: standalone launch — NOT deleting existing accounts.");
        }
		this.$.getLanguageList.call();
    },
    
    gotLanguages: function(inSender, inResponse){
        
        var languages = new Array();
        var countries = new Array();
		var languageCodes = new Array();
		var countryCodes = new Array();
		var countries = new Array();
        var countryCodes = new Array();
        for (i = 0; i < inResponse.locale.length; i++) {
			languageCodes[i] = inResponse.locale[i].languageCode;
            languages[i] = inResponse.locale[i].languageName;
            countries[i] = new Array(inResponse.locale[i].countries.length);
            countryCodes[i] = new Array(inResponse.locale[i].countries.length);
            for( j= 0; j <inResponse.locale[i].countries.length; j++){
				countryCodes[i][j] = inResponse.locale[i].countries[j].countryCode;
	            countries[i][j] = inResponse.locale[i].countries[j].countryName;
            }
           
        }
		this.setLanguageCodes(languageCodes);
        this.languages=languages;
        this.countries=countries;
		this.setCountryCodes(countryCodes);
		
		this.addDrawers();
		//this.$.langList.render();
        //this.$.pane.selectViewByName("langList").render();
		
    },

    handleGenericFailure: function(inSender){
        console.info("Got generic failure " + inSender);
    },
    
    addDrawers: function ()
    {
    	var intLangIndex = 0, k= 0, newdrawer, countryItem, drawerClass = "enyo-drawer-container ", itemClass = ""; // moved variable instantiation to the top of the function, added class for className so that I can set first and last classes.
    	for (intLangIndex = 0; intLangIndex < this.languages.length; intLangIndex++)
    	{
			drawerClass += (intLangIndex === 0) ? "enyo-first" : ((intLangIndex === this.languages.length) ? "enyo-last" : "enyo-middle");
			newdrawer = this.$.mainbox.createComponent({name:"LangDrawer" + intLangIndex, kind: "Drawer", className: drawerClass, caption: this.languages[intLangIndex], owner: this, open:false,  canChangeOpen: true, align: "center", langIndex: intLangIndex, onclick: "onOpenDrawer", components: []});
    		//this.$.mainbox.contentChanged();
    		for(k =0; k< this.countries[intLangIndex].length; k++){
				itemClass = (k === 0) ? "enyo-first" : ((k === this.countries[intLangIndex].length) ? "enyo-last" : "enyo-middle");
             	countryItem = newdrawer.createComponent({ kind: "Item", className: itemClass, countryIndex: k,langIndex:intLangIndex, owner: this, align: "center", content: this.countries[intLangIndex][k], onclick: "langSelected"});
            }
    		this.$.mainbox.contentChanged(); 		
    	}
    },
    
    onOpenDrawer: function(inSender){
		var remove = this.lastOpenedId == inSender.id;
    	for(var ct=0; ct<this.languages.length; ct++){
			if (remove) {
				if (!inSender.open) {
					inSender.parent.removeClass('open');
				}
			} else {
	    		if(inSender.langIndex!=ct){
	    			this.$["LangDrawer"+ct].close(); 
					inSender.parent.addClass('open');
	    		} 
			}
    	}
		
		if (remove) {
			if (!inSender.open) {
				this.lastOpenedId = undefined;
			}
		} else {
			this.lastOpenedId = inSender.id;
		}
    	
    },
    
    langSelected: function(inSender){
		//this.$.justScrim.show();
    	
        var lastView = this.view;
        var index = inSender.langIndex;
        var rb = new enyo.g11n.Resources({locale: this.languageCodes[index]+"_"+this.countryCodes[index][inSender.countryIndex]});
        var confirmTemp = new enyo.g11n.Template(rb.$L("#{language}, #{country}?"));
        this.view = null;
        
        this.setSelectedCountry(this.countries[index][inSender.countryIndex]);
		this.setSelectedLanguage(this.languages[index]);
		this.setSelectedLanguageCode(this.languageCodes[index]);
		this.setSelectedCountryCode(this.countryCodes[index][inSender.countryIndex]);

		this.$.message.setContent(confirmTemp.evaluate({language: this.languages[index], country: this.countries[index][inSender.countryIndex]}));
		this.$.confirmPopup.setCaption(rb.$L("Confirm"));
		this.$.confirmPopup.openAtCenter();
    },
	
	doConfirm: function(){
		//this.$.justScrim.hide();
		this.$.confirmPopup.close();
		this.$.scrim.show();
		this.$.spinner.setShowing(true);
		enyo.application.FirstUse.setLanguageCode(this.getSelectedLanguageCode());
		console.info("locale and region settings: " + this.getSelectedLanguageCode() + ", " + this.getSelectedLanguage() + ": " + this.getSelectedCountryCode() + ", " + this.getSelectedCountry());
		
		
		this.$.setLocaleRegion.call({
    			"locale": {
        					"languageCode": this.getSelectedLanguageCode(),
        					"countryCode": this.getSelectedCountryCode(),
        					"phoneRegion": {
            								"countryCode": this.getSelectedCountryCode(),
            								"countryName": this.getSelectedCountry() 
        					} 
    			},
    			"region": {
        					"countryCode": this.getSelectedCountryCode(),
        					"countryName": this.getSelectedCountry() 
    			}},{method:"setPreferences", onResponse: "setLocaleRegionResponse"});
		
		//Time format needs to be set based on locale
		var locale = new enyo.g11n.Locale(this.getSelectedLanguageCode() + "_" + this.getSelectedCountryCode());
		var fmts = new enyo.g11n.Fmts({locale: locale});
		this.$.setTimeFormat.call({"timeFormat": fmts.isAmPmDefault() ? "HH12" : "HH24"});
		
		console.log("LOCALE: " + locale);
		
		enyo.g11n.setLocale({
			uiLocale: locale.locale, 
			formatLocale: this.getSelectedCountryCode(), 
			phoneLocale: this.getSelectedCountryCode()
		});
		
		
		window.location = "index.html?locale="+locale.locale+"&country="+this.getSelectedCountryCode();
		
		
		//setTimeout(enyo.bind(this,"loadCustomization"),10);
	},

	setLocaleRegionResponse: function(inSender, inResponse){
		console.info("setLocaleRegionSuccess: " + JSON.stringify(inResponse));	
	},
	
	setCustomizationSuccess: function(inSender, inResponse){
		console.info("Customization populate defaults success: " + JSON.stringify(inResponse));
		this.$.scrim.hide();
		this.$.spinner.setShowing(false);
		this.doFinish();
		
	},
	
	setCustomizationFailure: function(inSender, inResponse) {
		//This should never happen. If it does, work with customization to fix
		console.info("Customization populate defaults failure: " + JSON.stringify(inResponse));
		this.$.scrim.hide();
		this.$.spinner.setShowing(false);
		this.doFinish();	
	},
	
	setTimeResponse: function(inSender, inResponse){
		console.info("setTimeResponse: " + JSON.stringify(inResponse));
	},
	
	doCancel: function(){
		this.$.scrim.hide();
		this.$.spinner.setShowing(false);
		this.$.confirmPopup.close();
	},
	
	deleteAnyExistingPalmProfileAccounts: function(){
		this.$.listAccounts.call();
	},
	
	listAccountsResponse: function(inSender, inResponse){
		if(inResponse.returnValue){
			if(inResponse.results.length > 0){
				for(i = 0; i < inResponse.results.length; i++){
					if(inResponse.results[i].templateId == "com.palm.palmprofile"){
						console.info("Deleting webOS account with Id: " + inResponse.results[i]._id);
						this.$.deleteAccount.call({"accountId" : inResponse.results[i]._id});
					}
				}
			} else {
				console.info("No webOS Account accounts to delete");
			}
		} else {
			console.info("ListAccount exception: " + JSON.stringify(inResponse));
		}
	},
	
	deleteAccountResponse: function(inSender, inResponse){
		console.info("deleteAccountResponse: " + JSON.stringify(inResponse));
	}
});

