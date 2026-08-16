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
	name: "MyApps.PalmID.DeviceInfoDialog",
	kind: "ModalDialog", lazy: false, 
	caption: $L("Device Info"),
	scrim: true,
	dismissWithClick: true,
	modal: true,
	components: [
		{
			name: "mainAlert",
			kind: "Control",
			components: [
				{kind: "RowGroup",
				 name: "deviceInfoRowGroup",
				 caption: "DEVICE INFO", // this will never show...hence not localized.
				 components: [
					{
					kind: "enyo.HFlexBox", 
					components: [ 
						{ 
							content: $L("Name"), 
							className:"enyo-label",
							style: "padding-right:30px"
						},
						{
							name: "deviceName",
							className:"enyo-text-ellipsis",
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
								content: $L("Model"), 
								className:"enyo-label",
								style: "padding-right:30px"
							},
							{
								name: "deviceModel",
								className:"enyo-text-ellipsis",
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
								content: $L("Version"),
								className:"enyo-label",
								style: "padding-right:30px"
							},
							{
								name: "deviceSoftware",
								className:"enyo-text-ellipsis",
								style:"text-align:right",
								flex: 1,
							  	components: []
							}
						]
					},
					{
					kind: "enyo.VFlexBox",
					components: [
							{
								content: $L("Device ID"),
								className:"enyo-label",
								style: "padding-right:30px"
							},
							{
								// Not ellipsised and not on one line with its label: a
								// 40-character id needs the full width to be readable,
								// and this is the value someone reads out to match a
								// device or to ask for one to be removed.
								name: "deviceId",
								style:"word-wrap:break-word; font-size:80%; opacity:0.7",
							  	components: []
							}
						]
					},
					]
				},	
		 		{ name: "eraseOption", style: "display: none", kind: "Button", caption: $L("Erase Device"), onclick: "doubleConfirm" },
				{ kind: "Button", caption: $L("Done"), onclick: "close" },
				
				
				{
					name: "deviceEraseConfirmDialog",
					kind: "MyApps.PalmID.DeviceEraseConfirmDialog",
				}

			]
		}
	],
	
	setDevice: function(settings) {
		this.deviceID = settings.device.nudid;
		
		/*
		if (!settings.thisDevice) {
			this.$.eraseOption.applyStyle("display","none");	
		} else {
			this.$.eraseOption.applyStyle("display","block");	
		}
		*/
		
		// The caption used to be deviceType, i.e. the hardware SKU. The device's own
		// name is the thing worth putting at the top; "(this device)" answers the
		// question people actually open this dialog to ask.
		this.$.deviceInfoRowGroup.setCaption(enyo.string.escapeHtml(
			settings.device.deviceName + (settings.thisDevice ? $L(" (this device)") : "")));
		this.$.deviceName.setContent(enyo.string.escapeHtml(settings.device.deviceName));
		this.$.deviceModel.setContent(enyo.string.escapeHtml(settings.device.deviceModel));
		this.$.deviceSoftware.setContent(enyo.string.escapeHtml(settings.device.webOSDisplayName));
		// Full id here — the list row can only show a fragment.
		this.$.deviceId.setContent(enyo.string.escapeHtml(settings.device.nduId));
	},
	
	doubleConfirm: function()
	{
		this.$.deviceEraseConfirmDialog.setDevice(this.deviceId);
		this.$.deviceEraseConfirmDialog.openAtCenter();
    	this.close();
	}

});
