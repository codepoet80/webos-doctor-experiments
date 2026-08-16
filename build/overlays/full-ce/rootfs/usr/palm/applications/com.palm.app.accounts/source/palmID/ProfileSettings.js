// @@@LICENSE
//
//      Copyright (c) 2010-2013 LG Electronics, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// LICENSE@@@

enyo.kind({
	name: "MyApps.PalmID.Profile",
	kind: enyo.VFlexBox,
	className:"enyo-bg",
	components: [
	/*
		{
			kind: "PalmService",
			name: "setApplication",
			service: "palm://com.palm.service.accounts/",
			method: "setApplication",
			onSuccess: "setApplicationSuccess",
			onFailure: "SetApplicationFailure"
		},
	*/	
		{
			kind: "PalmService",
			name: "resendVerificationEmail",
			service: "palm://com.palm.accountservices/",
			method: "requestResendVerificationEmail",
			onSuccess: "resendEmailSuccess",
			onFailure: "resendEmailFailure"
		},
		
    	{name: "modifyAccount", kind: "PalmService", service: enyo.palmServices.accounts, method: "modifyAccount"},

		{kind:"Toolbar", className:"enyo-toolbar-light accounts-header", pack:"center", components: [
			{kind: "Image", src: "images/acounts-48x48.png"},
			{kind: "Control", content: $L("webOS Community Account")}
		]},
		{className:"accounts-header-shadow"},
		{
			name: "profileContent",
			kind: enyo.Scroller,
			flex: 1,
			components: [
				{kind:"Control", className:"box-center", components: [
					{
						name: "nameInfo",
						kind: "RowGroup",
						className:"accounts-group",
						caption: $L("NAME"),
						components: [
						],
						owner: this.owner
					},
					{
						name:"resendVerification", kind: "Button", style:"display: none", className:"accounts-btn", caption: $L("Resend Verification Email"), onclick: "resendVerification"
					},
					{
						name: "loginInfo",
						kind: "RowGroup",
						className:"accounts-group",
						caption: $L("LOGIN INFORMATION"),
						components: [
						],
						owner: this.owner
					},
					{
						name: "deviceList",
				 		kind: "RowGroup",
						className:"accounts-group",
						caption: $L("DEVICES"),
						components: [
						],
						owner: this.owner
					}, 
					{
						name: "appList", 
						kind: "RowGroup",
						className:"accounts-group",
						caption: $L("USE ACCOUNT WITH"),
						components: [
						],
						owner: this.owner
					},
					{
						name: "signOut", kind: "Button", className: "accounts-btn accounts-btn-danger",
						caption: $L("Sign Out"), onclick: "confirmSignOut"
					},
					{
						name: "nameDialog",
						kind: "MyApps.PalmID.NameDialog",
						owner: this.owner
					},
					{
						name: "usernameDialog",
						kind: "MyApps.PalmID.UsernameDialog",
						owner: this.owner
					},
					{
						name: "emailDialog",
						kind: "MyApps.PalmID.EmailDialog",
						owner: this.owner
					},
					{
						name: "passwdDialog",
						kind: "MyApps.PalmID.PasswdDialog",
						owner: this.owner
					},
					{
						name: "deviceInfo",
						kind: "MyApps.PalmID.DeviceInfoDialog",
						owner: this.owner
					},
				]},
			]
		},
		{className:"accounts-footer-shadow"},
		{kind:"Toolbar", className:"enyo-toolbar-light", components:[
			{
				kind: "Button",
				name: "doneButton",
				className:"accounts-toolbar-btn",
				onclick: "done",
				caption : $L("Back")
			}
		]},
		
		
		{ kind: "ModalDialog", lazy: false, name: "verifyEmailDialog", caption: $L("Email Sent"),
          dismissWithClick: false,
          modal: true,

		  components: [
	        { name: "verifyText", className: "enyo-paragraph text-breakword", content: "dummy" },
            { kind: "Button", caption: $L("Done"), onclick: "closeVerifyEmailDialog"},
			],
			scrim: true,
		},

		{kind: "MyApps.PalmID.CommErrorDialog", name: "errorDialog"},
		{kind: "MyApps.PalmID.SpinnerOverlayPopup", name: "spinnerOverlay"},

		{
			kind: "PalmService", name: "signOutCall",
			service: "palm://com.palm.accountservices/", method: "signOut",
			onSuccess: "signOutSuccess", onFailure: "signOutFailure"
		},
		{
			kind: "ModalDialog", lazy: false, name: "signOutConfirm",
			caption: $L("Sign Out"), scrim: true, dismissWithClick: false, modal: true,
			components: [
				{className: "enyo-paragraph", content: $L("Sign out of this webOS Account on this device? Your books, settings and files stay on the device, and you can sign in again at any time.")},
				{kind: "HFlexBox", components: [
					{kind: "Button", caption: $L("Cancel"), flex: 1, onclick: "cancelSignOut"},
					{kind: "Button", caption: $L("Sign Out"), flex: 1, className: "accounts-btn-danger", onclick: "doSignOut"}
				]}
			]
		},
	],
	// The account has ONE name column server-side (display_name). firstName and
	// lastName arrive split only because that is the shape the stock assistant
	// speaks; they are joined for display and re-split on save, so a name of any
	// length round-trips unchanged.
	populateName: function(accountInfo)
	{
		var fullName = [accountInfo.firstName, accountInfo.lastName].join(" ").trim();
		if (this.userName !== fullName) {
			this.userName  = fullName;
			this.firstName = accountInfo.firstName;
			this.lastName  = accountInfo.lastName;
			this.$.nameInfo.destroyControls();
			this.$.nameInfo.createComponent({
				name: "nameItem",
				kind: "MyApps.PalmID.SimpleItem",
				components: [{
					content: enyo.string.escapeHtml(fullName),
					className: "enyo-text-ellipsis",
					flex: 1,
					owner: this,
					onclick: "changeName"
				}]
			});
			this.render();
		}
	},

	populateLoginInfo: function(details)
	{
			this.$.loginInfo.destroyControls();
			
			this.email = details.accountInfo.email;
			this.username = details.accountInfo.username;
			this.details = details;
			
			this.$.resendVerification.applyStyle("display", 
				(details.accountInfo.accountState=='A' || details.accountInfo.accountState=='C') ? "block" : "none");

			var desc = { name: "emailDesc", content: $L("Email"), style:"padding-right:30px"};
			var label = { name: "emailLabel", content: enyo.string.escapeHtml(details.accountInfo.email), flex: 1, className:"enyo-text-ellipsis", style:"text-align:right" };
			this.$.loginInfo.createComponent({ name: "emailItem", kind: "MyApps.PalmID.SimpleItem", components: [ desc, label ], onclick: "changeEmail", owner: this }); 
			
			desc = { name: "passDesc", content: $L("Password"), style:"padding-right:30px" };
			label = { name: "passLabel", content: "**************", flex: 1, className:"enyo-text-ellipsis", style:"text-align:right"};
			handler = this.changePassword;
			this.$.loginInfo.createComponent({ name: "passItem", kind: "MyApps.PalmID.SimpleItem", components: [ desc, label ], onclick: "changePassword", owner: this });       

			// webOS Archive: the username lives where HP put the security
			// question. We store no security questions, and a public handle is
			// something members can actually share instead of their email.
			desc = { name: "usernameDesc", content: $L("Username"), style:"padding-right:30px" };
			label = { name: "usernameLabel", content: enyo.string.escapeHtml(this.username), flex: 1, className:"enyo-text-ellipsis", style:"text-align:right"};
 			this.$.loginInfo.createComponent({ name: "usernameItem", kind: "MyApps.PalmID.SimpleItem", components: [ desc, label ], onclick: "changeUsername", owner: this });
			this.render();

			/*
			desc = { name: "secAnswerDesc", content: $L("Answer"), flex: 1 };
			label = { name: "secAnswerLabel", content: enyo.string.escapeHtml("**************")}; // can't get it as plain text although the UI spec had it like that
 			this.$.loginInfo.createComponent({ name: "secAnswerItem", kind: "MyApps.PalmID.SimpleItem", components: [ desc, label ], onclick: "changeSecAnswer", owner: this });   		
			this.render();
			*/
	},
	changeName: function()
	{
		// No password argument: the re-auth gate is gone and updateAccountInfo
		// authenticates on the device token alone.
		this.$.nameDialog.openThisDialog({
			firstName: this.firstName,
			lastName:  this.lastName,
			email:     this.email,
			country:   this.details.accountInfo.country,
			language:  this.details.accountInfo.language
		});
	},
	changeEmail: function()
	{ 
		this.$.emailDialog.openThisDialog({
			defaultEmail: this.email,
			sentCallback: enyo.bind(this, function(){
				this.details.accountInfo.accountState = 'A';
				//this.$.resendVerification.applyStyle("display", "block");
			})
		}); 
	},
	changePassword: function()
	{
		this.$.passwdDialog.openThisDialog(false);
	},
	changeUsername: function()
	{
		this.$.usernameDialog.openThisDialog(this.username);
	},
	// Called back by UsernameDialog once the server has accepted the new handle.
	usernameChanged: function(username)
	{
		this.username = username;
		this.details.accountInfo.username = username;
		this.$.usernameLabel.setContent(enyo.string.escapeHtml(username));
	},
	// A full nduid is 40 hex characters and a PWA id is a uuid — neither fits a
	// list row, and an ellipsised hash identifies nothing. Show enough of the head
	// to tell two devices apart; the detail dialog carries the whole value.
	shortDeviceId: function(nduId)
	{
		nduId = String(nduId || "");
		return nduId.length > 14 ? nduId.substring(0, 12) + "…" : nduId;
	},
	showDeviceInfo: function(inSender, inResponse, rowIndex)
	{
		this.gotDevice(this.deviceList[inSender.value]);
	},
	gotDevice: function(device)
	{
		// deviceInfo.nduId, not .deviceNduid — the original compared against a
		// property getDeviceProfile does not return, so it was always undefined and
		// "is this the device I am holding" was never true.
		var myNduId = this.owner.deviceProfile.deviceInfo.nduId;
		this.$.deviceInfo.setDevice({device: device, thisDevice: (myNduId === device.nduId)});
		this.$.deviceInfo.openAtCenter();
	},
	populateDeviceList: function(deviceList)
	{
		// The original wrapped a lone device object in an array by testing
		// .length — which also wraps an EMPTY array, producing one row of
		// "undefined". Normalise properly and hide the group when there is
		// nothing to list.
		if (!deviceList) {
			deviceList = [];
		} else if (Object.prototype.toString.call(deviceList) !== "[object Array]") {
			deviceList = [deviceList];
		}
		this.$.deviceList.setShowing(deviceList.length > 0);
 
		
		this.$.deviceList.destroyControls();
		this.deviceList = deviceList;
		for(var i = 0; i < deviceList.length; ++i)
		{
			// Name on the left, device id on the right. The id is what actually
			// distinguishes two devices with the same name, and it replaces the old
			// left-hand column, which showed deviceType — in practice the hardware
			// SKU ("HSTNH-I29C"), which named nothing a person would recognise.
			this.$.deviceList.createComponent({
				name: "deviceItem_"+ i, kind: "MyApps.PalmID.SimpleItem",
				components: [ {content: enyo.string.escapeHtml(deviceList[i].deviceName), flex: 1, className:"enyo-text-ellipsis", style:"padding-right:30px" },
							  {content: enyo.string.escapeHtml(this.shortDeviceId(deviceList[i].nduId)), className:"enyo-text-ellipsis", style:"text-align:right; opacity:0.6"}
							],
				onclick: "showDeviceInfo", 
				value: i, 
				owner: this 
				});
		}
		this.$.deviceList.render();
		
	}, 
	generateItemForAppList: function(capability, appIndex, onChange)
	{
		
		var capName = capability.capability;
		if (capability.loc_name) {
			capName = capability.loc_name;	
		} 
		
		// Shown capabilities are always on and always locked — there is nothing to
		// opt out of while app data storage is the only one listed.
		capability.state = true;

		var label = this.CAPABILITY_LABELS[capability.capability]
			|| AccountsUtil.getCapabilityText(capability.capability);

		var item = {
			kind: "MyApps.PalmID.SimpleItem",
			components: [
				{ content: enyo.string.escapeHtml(label), flex: 1},
				//{ name: "app_" + appIndex, kind: "ToggleButton", state: capability.state, onChange: onChange, value: appIndex, disabled: capability.alwaysOn}
				{ name: "app_" + appIndex, kind: "ToggleButton", state: capability.state, onChange: onChange, value: appIndex, disabled: true}
			],
			owner: this,
		};
		return item; 
	},
		
	// Which of the account's capabilityProviders to actually show. The local
	// account still declares all seven (see palm_profile_util's createLocalAccount),
	// but only app data storage is backed by anything today — listing the rest
	// promised syncing we do not do. Uncomment a line to bring one back once it
	// has a real implementation behind it.
	SHOWN_CAPABILITIES: [
		// "CONTACTS",
		// "CALENDAR",
		// "TASKS",
		// "MEMOS",
		// "MESSAGING",          // shows as "SMS Account"
		// "PHONE",              // shows as "Carrier"
		"LOCAL.FILESTORAGE"
	],

	// Labels we override rather than take from AccountsUtil's framework map.
	CAPABILITY_LABELS: {
		"LOCAL.FILESTORAGE": $L("App data storage")
	},

	populateAppList: function(capabilities)
	{
		this.$.appList.destroyControls();

		var shown = [];
		for (var i = 0; i < capabilities.length; i++) {
			var cap = capabilities[i];
			if (cap && this.SHOWN_CAPABILITIES.indexOf(cap.capability) !== -1) {
				shown.push(cap);
			}
		}

		this.capabilities = shown;
		this.$.appList.setShowing(shown.length > 0);
		for (var j = 0; j < shown.length; j++) {
			this.$.appList.createComponent(this.generateItemForAppList(shown[j], j, "setAppState"));
		};

		this.render();
	},
	
	setAppState: function(inSender, inState) {
		var param = {
			"accountId": this.owner.palmProfileAccount._id,
			"object": {}
		}
		
		this.capabilities[inSender.getName().split("_")[1] - 0].state = inState; //HACK: russ.
		
		// See which capabilities are enabled
		var enabledCapabilities = [];
		for (var i = 0, l = this.capabilities.length; i < l; i++) {
			if (this.capabilities[i].state) 
				enabledCapabilities.push({"id":this.capabilities[i].id});
		}
		param.object.capabilityProviders = enabledCapabilities;
		this.$.modifyAccount.call(param);
	},
	
	setApplicationSuccess: function() {
	},
	
	setAppFailure: function(inSender, inResponse) {
		this.$.errorDialog.openAtCenter(inResponse);
	},
	
	closeAppDialog: function() {
		this.$.errorAppDialog.close();
	},
	
	resendVerification: function() {
		this.$.spinnerOverlay.openAtCenter();
		this.$.resendVerificationEmail.call({});
	},
	
	resendEmailSuccess: function() {
		this.$.spinnerOverlay.close();
		var template = new enyo.g11n.Template($L("A verification email was sent to #{email}.")); 
		this.$.verifyText.setContent(template.evaluate({email: enyo.string.escapeHtml(this.email)}));
		this.$.verifyEmailDialog.openAtCenter();	
	},
	
	resendEmailFailure: function(inSender, inResponse) {
		this.$.spinnerOverlay.close();
		this.$.errorDialog.openAtCenter(inResponse);
	},

	closeVerifyEmailDialog: function() {
		this.$.verifyEmailDialog.close();	
	},
	
				
	confirmSignOut: function()
	{
		this.$.signOutConfirm.openAtCenter();
	},
	cancelSignOut: function()
	{
		this.$.signOutConfirm.close();
	},
	doSignOut: function()
	{
		this.$.signOutConfirm.close();
		this.$.spinnerOverlay.openAtCenter();
		this.$.signOutCall.call({});
	},
	signOutSuccess: function(inSender, inResponse)
	{
		this.$.spinnerOverlay.close();
		// The service clears the local token even when the server revoke fails, so
		// the device really is signed out either way — say so when the token is
		// still live somewhere, rather than pretending it is not.
		if (inResponse && inResponse.serverTokenRevoked === false) {
			console.log("Accounts app: signed out locally, but the server token was not revoked");
		}
		// Back to the account list, which re-probes and will now find no token.
		this.owner.backToViewCallback();
	},
	signOutFailure: function(inSender, inResponse)
	{
		this.$.spinnerOverlay.close();
		this.$.errorDialog.openAtCenter(inResponse);
	},

	create: function()
	{
		this.inherited(arguments);
	},
	done: function()
	{
		this.owner.backToViewCallback();
	}
});

enyo.kind({
	name: "MyApps.PalmID.SimpleItem",
	kind: enyo.Item,
	align: "center",
	tapHighlight: false,
	layoutKind: "HFlexLayout",
	components: [
	]
});
