label_dialog_googleTnc = rb.$L("Google Terms & Conditions");


label_popup_google_header = rb.$L("Do you accept?");
label_popup_google_body = rb.$L("If you decline Google's Terms of Service, your device will be unable to determine your current location. To enable this feature in the future, go to the Location Services preference.");

label_button_continue = rb.$L("Continue");
label_button_accept = rb.$L("Accept");
label_button_decline = rb.$L("Decline");

label_checkbox_google = rb.$L("I accept the terms and conditions");
label_checkbox_googleBackgoundCollection = rb.$L("Allow Google's location service to collect anonymous and aggregate location data. Collection will occur regardless of whether any applications are active.");

Label_dialog_autolocate = rb.$L("Auto Locate");
label_autolocate_body = rb.$L("You'll be asked for permission when an application wants your location. For your convenience, you may enable Auto Locate, which will automatically provide your location for applications without asking each time. You may change this setting at any time in the Location Services preference.");

enyo.kind({
	name: "Google",
	kind: enyo.VFlexBox,
	align:"center",
	pack:"justify",
	className: "terms",
	events: {onFinish: ""},
	components: [{name: "GoogleTCs", kind: enyo.VFlexBox, className: 'section', height:"100%", components: [
	                   {kind: enyo.Control,	name: "GoogleTCs.title", className: 'title', content: label_dialog_googleTnc},
						{kind: enyo.Scroller, name: "GoogleTCs.content", className: 'box', flex:1, components: [
							{name: "google", allowHtml: true, kind: "HtmlContent"}
						]
	                   },
	                   {kind: enyo.Control, layoutKind:"HFlexLayout", style:"margin:0 0 10px 0", align: 'center', components: [
	                        {name: "googleCheckBox", kind: enyo.CheckBox,checked: false},
	                        {content: label_checkbox_google, style:"margin:0 0 0 10px"}
	                        ]
	                   },
	                   {kind: enyo.Control, layoutKind:"HFlexLayout", style:"margin:0 0 10px 0",	components: [
	                        {name: "googleBackgroundDataCheckBox", kind: enyo.CheckBox, checked: true},
	                        {content: label_checkbox_googleBackgoundCollection, flex:1, style:"margin:5px 0 0 10px"}
	                        ]
	                   },
	                   {kind: enyo.Control,	name: "AutoLocate.content", className: 'box', components: [
	                        {content: Label_dialog_autolocate, style: "font-size:16px"},
	                        {content: label_autolocate_body, style: "font-size:14px;margin:15px 0 10px;"},
	                        {name: "autoLocateToggle", kind: enyo.ToggleButton, onLabel: rb.$L("On"), offLabel: rb.$L("Off")}
	                        ]
	                   },
	                   {kind: enyo.HFlexBox, pack:"justify", components: [
	                        {kind: enyo.Spacer},
	                        {kind: enyo.Button, onclick: "continueButtonClick", className:"enyo-button-affirmative", caption: label_button_continue}
	                        ]
	                   }
	                   ]
				},
				{kind: "StartOver"},
				
				{name: "googlePopup", kind: "ModalDialog", lazy: false, className: "popup",
				    caption: label_popup_google_header,
				    components: [
				       {content: label_popup_google_body, className: "enyo-text-body"}, 			
				       {kind: "Button", caption: label_button_accept, style: "margin-bottom:10px;", className: "enyo-button-affirmative", onclick: "googleAccepted"},
				       {kind: "Button", caption: label_button_decline, className:"enyo-button-negative", onclick: "googleDeclined"},
				       ]
				},
				{kind: "Scrim", layoutKind: "VFlexLayout", align: "center", pack: "center", components: [
				     {kind: "SpinnerLarge", name: "spinner", showing: false}
				]},
				                                                                   				
				{kind: "LocationService", onFailure: "handleGenericFailure", onSuccess: "handleGenericSuccess",
					components:[
						{name:"autoLocate", method: "setAutoLocate", onResponse:"setAutoLocateResponse"},
						{name:"acceptTermsOfUse", method: "acceptTermsOfUse", onResponse:"acceptTermsOfUseResponse"},
						{name:"rejectTermsOfUse", method: "rejectTermsOfUse", onResponse:"rejectTermsOfUseResponse"},
						{name:"BackgroundDataCollection", method: "setUseBackgroundDataCollection", onResponse:"setUseBackgroundDataCollectionResponse"},
					]	
				}
	],
	
	create: function(){
        this.inherited(arguments);
        //this.$.google.setContent("<h3>Location Services</h3><p>Location Services lets applications find your current position. Maps, Navigation, Camera, and Just Type use Location Services. The App Catalog contains additional applications which use Location Services. To find your current position, your phone may use Google's location service. To allow applications to find your current position you must agree to the following Terms of Service.</p><h3>Mobile Terms of Service</h3><p>By using Google's mobile products and services (\"Services\"), you:<ol><li><p>Agree to be bound by these terms and a) the YouTube Terms of Use (m.google.com/tos_youtube) for YouTube-related Services, b) the Google Maps Terms and Conditions (m.google.com/tos_maps) for mapping, local and location-based Services, and c) the Google Terms of Service (m.google.com/utos) for all other Services, as updated from time to time.</p><p> You may use the Services only as set forth in these agreements. Do not usewhile driving.</p></li><li><p>Acknowledge and agree that third parties may offer Services, and that youmay be subject to third party terms and that third parties may enforce termsagainst you. Google is not responsible for third party changes to theServices.</p></li><li><p>Consent to the collection, use, sharing, and onward transfer of yourdata, including but not limited to voice and location data, as outlined inthe Mobile Privacy Policy (m.google.com/privacy). Location data may be frommixed sources and may not be accurate. Use at your own risk.</p></li><li><p>Acknowledge that certain Services require phone service, data access ortext messaging capability. Except as otherwise noted, Google does not chargefor the Services, but carrier rates for phone, data and text messaging mayapply. The Services may contain third party content. Any requiredattribution or notice for the third party content may be found atm.google.com/legalnotices. For a web version of this, please go to<a href=\"#\">m.google.com/static/tos.html</a></p></li></ol><h3>Google Privacy Policy</h3><p>The Google Privacy Policy and our various product-specific privacy notices describe how we treat personal information when you use Google's products and services, including any of Google's mobile products and services. In addition, the following describes our mobile privacy practices.</p>");
        this.$.google.setContent(enyo.application.FirstUse.getGoogleTerms());
    },
    
    continueButtonClick: function() {
    	if(this.$.googleCheckBox.getChecked())
    		this.enableLocationServices();
    	else
    		this.$.googlePopup.openAtCenter();
    },
    
    enableLocationServices: function() {
    	if(this.$.googleCheckBox.getChecked())
    		this.$.acceptTermsOfUse.call();
    	else
    		this.$.rejectTermsOfUse.call();
    	
    	this.$.BackgroundDataCollection.call({"useBackgroundDataCollection":this.$.googleBackgroundDataCheckBox.getChecked()});
    	this.$.autoLocate.call({"autoLocate":this.$.autoLocateToggle.getState()});
    	this.doFinish();
    },
    
    googleAccepted: function(){
		this.$.googleCheckBox.setChecked(true);
		this.$.googlePopup.close();
		this.enableLocationServices();
	},
	
	googleDeclined: function(inSender, inResponse){
		this.$.googlePopup.close();
		this.enableLocationServices();
	},
	
	acceptTermsOfUseResponse: function(inSender, inResponse){
		console.info("acceptTermsOfUseResponse: " + JSON.stringify(inResponse));
	},
	
	rejectTermsOfUseResponse: function(inSender, inResponse){
		console.info("rejectTermsOfUseResponse: " + JSON.stringify(inResponse));
	},
	
	setAutoLocateResponse: function(inSender, inResponse){
		console.info("setAutoLocateResponse: " + JSON.stringify(inResponse));
	},
	
	setUseBackgroundDataCollectionResponse: function(inSender, inResponse){
		console.info("setUseBackgroundDataCollectionResponse: " + JSON.stringify(inResponse));
	}
});