enyo.kind({
	name: "StartOver",
	kind: enyo.Control,
	// webOS CE: hidden outside OOBE — "Start Over" means "re-run first use",
	// which is meaningless from the launcher icon. Belt and braces with the
	// guard in restartFirstUse below.
	create: function() {
		this.inherited(arguments);
		try {
			this.setShowing(!!enyo.application.FirstUse.wosaIsOobe);
		} catch (e) { console.info("WOSA StartOver mode probe failed: " + e); }
	},
	style: "position:fixed;height:60px;width:150px;bottom:0;left:0;",
	components: [
		{kind: enyo.IconButton,
	     name: "startOverButton",
		 onclick: "postConfirm",
		 className: "restart",
		 caption: rb.$L("Start Over"),
		 icon: "images/btn_start_over.png"
		},

		{name: "confirmDialog", kind: "ModalDialog", lazy: false, className: "popup",
		 caption: rb.$L("Confirm"), 
		 components: [
			{content: rb.$L("Would you like to start over from the beginning?"), className: "enyo-text-body"}, 
			{kind: "Control", layoutKind: "HFlexLayout", 
			 components: [
				{kind: "Button", caption: rb.$L("No"), flex: 1, style:"margin-right:10px", onclick: "closeConfirm"},
				{kind: "Button", caption: rb.$L("Yes"), flex: 1, className: "enyo-button-affirmative", onclick: "restartFirstUse"}
			 ],
			}
							
		 ]
		},

		{
			kind: "WiFiService",
			onFailure: "handleWiFiResetDone",
			onSuccess: "handleWiFiResetDone",
			components: [{
				name: "getStatus",
				method: "getstatus",
				onSuccess: "handleWiFiGetStatus",
				onFailure: "handleWiFiResetDone"
			}, {
				name: "deleteProfile",
				method: "deleteprofile",
				onSuccess: "handleWiFiResetDone",
				onFailure: "handleWiFiResetDone"
			}, ]
		},
	],
	
	
	postConfirm: function() {
		this.$.confirmDialog.openAtControl(this, {top: -60, left: 10});
	},
	
	closeConfirm: function() {
		this.$.confirmDialog.close();
	},
	
	restartFirstUse: function() {
		enyo.application.FirstUse.currentServiceCall = "";
		// webOS CE: under OOBE "start over" legitimately forgets the Wi-Fi network
		// joined during setup, so the wizard can be re-run from a clean slate. On a
		// launcher launch that is destruction with no upside: it deletes the saved
		// profile of the network the device is CONNECTED to, credentials included,
		// so the user drops offline and has to re-enter their Wi-Fi key — from a
		// button that only promises to restart the wizard. Standalone, just reload.
		if (!enyo.application.FirstUse.wosaIsOobe) {
			console.info("WOSA: standalone Start Over — reloading WITHOUT touching Wi-Fi.");
			this.handleWiFiResetDone();
			return;
		}
		console.log("get wifi status...");
		this.$.getStatus.call({});

	},
	
	handleWiFiGetStatus:  function(inSource, inResponse) {
		if (inResponse.returnValue && inResponse.networkInfo && inResponse.networkInfo.profileId) {
			console.log("getWifiProfile: " + inResponse.networkInfo.profileId);
			this.$.deleteProfile.call({profileId: inResponse.networkInfo.profileId});
		} else {
			this.handleWiFiResetDone();	
		}
	}, 
	
	handleWiFiResetDone: function() {
		console.log("restart firstuse...");
        enyo.application.FirstUse.startAllOver();
	},
	
	relaunchSuccess: function() {
		console.log("relaunchSuccess" );
	},
	
	relaunchFailure: function() {
		console.log("relaunchFailure");
	},
	
	
	
});
