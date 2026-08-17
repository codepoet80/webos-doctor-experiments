label_error_nameDeviceLength = rb.$L("Device name is limited to 256 characters. Shorten name and try again.");
label_error_nameDeviceEmpty = rb.$L("Please enter a name for your device.");
enyo.kind({
    name: "Namedevice",
    kind: enyo.HFlexBox,
	align: 'start',
	pack: 'justify',
	published: {currentServiceCall: "unknown",
				acctToken: "",
				acctAlias: "",
				deviceId:"",
				nduId:"",
	},
	events: {
        onFinish: ""
    },
    components: [
		{name: "pane", kind: "Pane", flex: 1, transitionKind: "enyo.transitions.Fade", components: [
          {name: "nameDeviceView", kind: "Control", layoutKind: "VFlexLayout", align: 'center', pack: "start", flex:1, components: [
	            {kind:"Control", width:"500px", components:[
	                  {kind:"Control", layoutKind: "VFlexLayout", align:'center', pack: 'justify', components: [
	                        {content: label_header1_deviceManagement, className: "title" },
	                        {content: label_header2_deviceManagement, className: "subtitle"}
	                        ]
	                  },
	                  {kind: "Control", className: "box", components: [
	                        {kind: "Control",  layoutKind: "VFlexLayout" , align: 'start', className: 'form-row', style:"margin:0 0 15px 0", components: [
	                              {content: label_field_deviceName, className: "label"},
	                              {name: "deviceName", kind: "Input", onblur: "nameDeviceOnBlur", oninput: "deviceNameOnInput", onchange: "nameDeviceOnChange", onkeydown: "deviceNameOnKeyPress", spellcheck: false, autocorrect: false, autoCapitalize: "title", hint: "", className: "field"},
	                              {name: "nameDeviceError", content: label_error_nameDeviceEmpty, className: "message", showing: false},
	                              ]
	                        },
	                        {name: "nameDeviceButton", kind: "Button", caption: label_button_done, onclick: "nameDevice", disabled: true}
	                        ]}
				]}
			]},
			{kind: "StartOver"}
		  ]},
          {kind: "Scrim", layoutKind: "VFlexLayout", align: "center", pack: "center", 
  			components: [
              	{kind: "SpinnerLarge", name: "spinner", showing: false}
          	]
  		  },
  		  {kind: "AccountServicesService", onFailure: "handleGenericFailure", onSuccess: "handleGenericSuccess",
  			components:[
  				{name: "assignDeviceName", method: "assignDeviceName", onResponse: "assignDeviceNameResponse"},
  				{name: "getToken", method: "getAccountToken", onResponse: "getTokenResponse"},
  			]	
  		  },
  		  {kind: "DeviceProfileService", onFailure: "handleGenericFailure", onSuccess: "handleGenericSuccess",
  			components:[
  				{name: "getDevice", method: "getDeviceProfile", onResponse: "getDeviceResponse"},
  			]	
  		  },
	],
	
	create: function(){
        this.inherited(arguments);
        this.setSuggestedDeviceName();
		
		//these calls aqre local, but the results may happen asynchronously!
        this.$.getToken.call();
		this.$.getDevice.call();
    },
	
    dataRestored: function(){
    	console.info("Data restored called by Parent...");
    	if(enyo.application.FirstUse.currentServiceCall != "" && enyo.application.FirstUse.currentServiceCall != "unknown")
    		this.assignDeviceName();
    },
	
	nameDevice: function(){
		this.$.scrim.show();
		this.$.spinner.setShowing(true);
		this.assignDeviceName();
	},
	
	assignDeviceName: function(){
		if(this.getAcctAlias() != "" && this.getAcctToken() != "" && this.getNduId() != ""){
			console.info("We have all token and device data to name the device");
			if(enyo.application.FirstUse.getDataConnection()){
				console.info("Data available...");
				var locale = enyo.g11n.currentLocale();
				var language = locale.language;
				var region = locale.region;

				this.$.assignDeviceName.call({"alias":this.getAcctAlias(), "token":this.getAcctToken(),	"nduId":this.getNduId(), "name":this.$.deviceName.getValue(), "language": language, "country": region, "userChosen":true});
				enyo.application.FirstUse.currentServiceCall = "";
			} else {
				enyo.application.FirstUse.currentServiceCall = enyo.hitch(this, "assignDeviceName");
				console.info("Data not available. Registered " + enyo.application.FirstUse.currentServiceCall + "to be called after data restored");
			}
		} else {
			if (this.tokenResponse && this.deviceResponse) {
				console.info("We had an issue...just don't assign a name and proceed along.");
				this.$.scrim.hide();
				this.$.spinner.setShowing(false);
				this.doFinish();
			} else {
				console.info("We dont have all info, Waiting before we call assignDeviceName");
				this.retryWhenDataIsAvailable = true;
			}
		}
	},
	
	assignDeviceNameResponse: function(inSender, inResponse){
		enyo.application.FirstUse.currentServiceCall = "";
		this.$.scrim.hide();
		this.$.spinner.setShowing(false);
		console.info("Successfully named device: " + JSON.stringify(inResponse));
		this.doFinish();
	},
	
	getTokenResponse: function(inSender, inResponse){
		console.info("getToken Response");
		if(inResponse.returnValue){
			this.setAcctAlias(inResponse.accountAlias);
			this.setAcctToken(inResponse.token);
		} else {
			console.info("Could not get token info");
		}
		this.tokenResponse = true;
		if (this.retryWhenDataIsAvailable)  {
			this.assignDeviceName();	
		}
	},
	
	getDeviceResponse: function(inSender, inResponse){
		console.info("getDevice Response");
		if(inResponse.returnValue){
			this.setDeviceId(inResponse.deviceInfo.deviceId);
			this.setNduId(inResponse.deviceInfo.nduId);
		} else {
			console.info("Could not get device info");
		}
		this.deviceResponse = true;
		if (this.retryWhenDataIsAvailable)  {
			this.assignDeviceName();	
		}
	},
	
	
	
	nameDeviceOnChange: function(){
		if(this.$.deviceName.getValue().length < 1){ 
			this.$.nameDeviceError.setContent(label_error_nameDeviceEmpty);
			this.$.nameDeviceError.setShowing(true);
			this.$.nameDeviceButton.setDisabled(true);
		} else if (this.$.deviceName.getValue().length > 256){
			this.$.nameDeviceError.setContent(label_error_nameDeviceLength);
			this.$.nameDeviceError.setShowing(true);
			this.$.nameDeviceButton.setDisabled(true);
		} else {
			this.$.nameDeviceButton.setDisabled(false);
		}
	},
	
	deviceNameOnInput: function() {
		this.$.nameDeviceError.setShowing(false);
		if(this.$.deviceName.getValue().length < 1 || this.$.deviceName.getValue().length > 256){
			this.$.nameDeviceButton.setDisabled(true);
		} else {
			this.$.nameDeviceButton.setDisabled(false);
		}
	},
		
	deviceNameOnKeyPress: function(inSender, inResponse) {
		if(inResponse.keyCode == 13) {
			this.nameDeviceOnChange();
			var theName = this.$.deviceName.getValue();
			if (theName.length > 0 && theName.length <= 256) {
				this.$.deviceName.forceBlur();
				this.$.nameDeviceButton.doClick();
			}
		}
		
	},
	
	
	setSuggestedDeviceName: function(){
		var firstName = enyo.application.FirstUse.getFirstName();
		var machineName = enyo.application.FirstUse.getMachineName();
		var locale = enyo.g11n.currentLocale();
		var language = enyo.g11n.Locale.prototype.getLanguage();
		var deviceName = "";
		
		if(language === 'en' && firstName && firstName.length > 0){
			var lastLetter = firstName.charAt(firstName.length - 1);
			if (lastLetter === 's' || lastLetter === 'S'){
				deviceName = firstName + "' ";
			} else {
				deviceName = firstName + "'s ";
			}
		}else{
			//deviceName = deviceName + firstName + " - ";
		}
		
		var theName = deviceName + machineName;
		var nameLen = theName.length;
		
		this.$.deviceName.setValue(deviceName + machineName);
		this.$.deviceName.forceSelect();
		this.$.deviceName.forceFocus();
		
		if (theName.length > 0 && theName.length <= 256) {
			this.$.nameDeviceButton.setDisabled(false);
		}

	}
});