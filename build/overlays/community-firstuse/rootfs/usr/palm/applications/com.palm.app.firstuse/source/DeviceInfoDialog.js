enyo.kind({
	name: "MyApps.FirstUse.DeviceInfoDialog",
	kind: "ModalDialog",  
	lazy: false,
	showing: false,
	caption: rb.$L("Device Information"),
	//dismissWithClick: true,
	style: "min-width: 350px; color: black",
	components: [
		{
			name: "mainAlert",
			kind: "Control",
			components: [
				{kind: "RowGroup",
				 name: "deviceInfoRowGroup",
				 caption: rb.$L("Device Information"),
				 components: [
					{
					kind: "enyo.HFlexBox",
					onclick: "NduID_Toggle", 
					components: [ 
						{ 
							name: "deviceIDLabel",
							content: rb.$L("Device ID"), 
							className:"enyo-label",
							style: "padding-right:20px"
						},
						{
							name: "deviceID",
							flex: 1,
							className:"enyo-label deviceinfo-textvalues",
						  	components: []
						}
						]
					},
					{
					kind: "enyo.HFlexBox", 
					components: [ 
						{ 
							content: rb.$L("MAC Address"), 
							className:"enyo-label",
							style: "padding-right:30px"
						},
						{
							name: "deviceMAC",
							className:"enyo-label enyo-text-ellipsis deviceinfo-textvalues",
							flex: 1,
						  	components: []
						}
						]
					},
					{
					kind: "enyo.HFlexBox", 
					components: [ 
							{ 
								content: rb.$L("Device Model"),
								className:"enyo-label",
								style: "padding-right:30px"
							},
							{
								name: "deviceModel",
								className:"enyo-label enyo-text-ellipsis deviceinfo-textvalues",
								flex: 1,
							  	components: []
							}
						]
					},
					{
					kind: "enyo.HFlexBox", 
					components: [ 
							{ 
								content: rb.$L("Product Number"),
								className:"enyo-label",
								style: "padding-right:30px"
							},
							{
								name: "deviceProductSKU",
								className:"enyo-label enyo-text-ellipsis deviceinfo-textvalues",
								flex: 1,
							  	components: []
							}
						]
					},
					{
					kind: "enyo.HFlexBox", 
					components: [ 
							{ 
								content: rb.$L("Serial Number"), 
								className:"enyo-label",
								style: "padding-right:30px"
							},
							{
								name: "deviceSerial",
								className:"enyo-label enyo-text-ellipsis deviceinfo-textvalues",
								flex: 1,
							  	components: []
							}
						]
					},
					{
					kind: "enyo.HFlexBox", 
					components: [ 
							{ 
								content: rb.$L("Handset"), 
								className:"enyo-label",
								style: "padding-right:30px"
							},
							{
								name: "deviceHPSerial",
								className:"enyo-label enyo-text-ellipsis deviceinfo-textvalues",
								style:"text-align:right",
								flex: 1,
							  	components: []
							}
						]
					},
					{
					kind: "enyo.HFlexBox", 
					components: [ 
							{ 
								content: rb.$L("Hardware Version"),
								className:"enyo-label",
								style: "padding-right:30px"
							},
							{
								name: "deviceHardwareVersion",
								className:"enyo-label enyo-text-ellipsis deviceinfo-textvalues",
								flex: 1,
							  	components: []
							}
						]
					},
					{
					kind: "enyo.HFlexBox", 
					onclick: "showBuildNumber",
					components: [ 
							{ 
								content: rb.$L("WebOS Version"),
								className:"enyo-label",
								style: "padding-right:30px",
								name: "deviceWebOSVersionLabel"
							},
							{
								name: "deviceWebOSVersion",
								className:"enyo-label enyo-text-ellipsis deviceinfo-textvalues",
								flex: 1,
							  	components: []
							}
						]
					},
					]
				},	
				{ kind: "Button", caption: rb.$L("Done"), onclick: "close" },
				

			]
		},
		
		
		{
			kind: "PalmService",
			name: "getDeviceInfo",
			service: "palm://com.palm.deviceprofile/",
			method: "getDeviceProfile",
			onSuccess: "gotDeviceInfo",
			onFailure: "deviceInfoFailure" 
		},

	],
	
	
	openDeviceInfoDialog: function(){
		this.NduIDShowing = undefined;
		this.deviceBuildNumberShowing = undefined;
		this.$.getDeviceInfo.call({});
	},
	
	gotDeviceInfo: function(inSender, inResponse) {
		console.info("gotDeviceInfo: " + JSON.stringify(inResponse));
		this.deviceInfo = inResponse.deviceInfo;

		this.$.deviceMAC.setContent(inResponse.deviceInfo.WIFIoADDR);
		this.$.deviceSerial.setContent(inResponse.deviceInfo.serialNumber);
		this.$.deviceHPSerial.setContent(inResponse.deviceInfo.HPSerialNumber);
		this.NduID_Toggle(); // sets the device ID field;
		this.$.deviceProductSKU.setContent(inResponse.deviceInfo.productSku);
		this.$.deviceModel.setContent(inResponse.deviceInfo.deviceModel);
		this.$.deviceHardwareVersion.setContent(inResponse.deviceInfo.hardwareVersion);
		this.showBuildNumber();
		
		this.openAtCenter();
	},
	
	deviceInfoFailure: function(inSource, inResponse) {
		console.info("deviceInfoFailure");
	},
	
	showBuildNumber: function(){
		if (this.deviceBuildNumberShowing == undefined) this.deviceBuildNumberShowing = true;
		
		if (this.deviceBuildNumberShowing) {
			this.deviceBuildNumberShowing = true;
			this.$.deviceWebOSVersionLabel.setContent(rb.$L("WebOS Version"));
		 	this.$.deviceWebOSVersion.setContent(this.deviceInfo.softwareBuildBranch);
		} else {
			this.$.deviceWebOSVersionLabel.setContent(rb.$L("WebOS Build"));
		 	this.$.deviceWebOSVersion.setContent(this.deviceInfo.softwareVersion);
		}
		this.deviceBuildNumberShowing = !this.deviceBuildNumberShowing;
	},

	NduID_Toggle: function(nduId) {
		if (this.NduIDShowing == undefined) this.NduIDShowing = true;

		if (this.NduIDShowing &&  (this.deviceInfo.deviceId != null && this.deviceInfo.deviceId.length > 0)) {
			this.$.deviceIDLabel.setContent(rb.$L("Device ID"));
		 	this.$.deviceID.setContent(this.formatDeviceID(this.deviceInfo.deviceId));
			this.$.deviceID.setClassName("enyo-label enyo-text-ellipsis deviceinfo-textvalues");
		} else {
			if ((this.deviceInfo.deviceId != null && this.deviceInfo.deviceId.length > 0)) {
				this.$.deviceIDLabel.setContent(rb.$L("Ndu ID"));
			} else {
				this.$.deviceIDLabel.setContent(rb.$L("Device ID"));
			}
		 	this.$.deviceID.setContent(this.formatDeviceID(this.deviceInfo.nduId));
			this.$.deviceID.setClassName("enyo-label deviceinfo-textvalues deviceinfo-nudidText");
		}
		this.NduIDShowing = !this.NduIDShowing;
	},
	
	formatDeviceID: function(nduId) {
		var val = nduId;
		var result = "";
		while (val.length >= 5) {
			result += val.substr(0, 5);
			val = val.substr(5, val.length-5);
			result += " ";
		}
		if (val.length > 0 && val.length < 5) {
			result += val;
		};

		return result;
		//return result + "\u00A0\u00A0\u00A0\u00A0\u00A0"; // 4 non-breaking spaces
	}


});
