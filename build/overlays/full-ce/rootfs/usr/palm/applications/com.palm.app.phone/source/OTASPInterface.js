enyo.kind({
	name: "OTASPInterface",
	kind: enyo.Component,
	components: [
		{name: "telephony", kind: enyo.PalmService, service: "palm://com.palm.telephony/", subscribe: true, onSuccess: "", onFailure: ""},
		{name: "display", kind: enyo.PalmService, service: "palm://com.palm.display/control/", method : "setState", onSuccess: "", onFailure: ""},
		{name: "subscribePreference", kind: enyo.PalmService, service: "palm://com.palm.systemservice/", method : "getPreferences", subscribe: true, onSuccess: "onSubscribePreference", onFailure: "onSubscribePreference"},
	],
	published: {
		//OTASP Status Notification
		otaspNotifications: {
			"initialprogrammingrequired": $L("Initial programming required"),
			"programminginprogress": $L("Programming in progress"),
			"splunlocked": $L("SPL unlocked"),
			"prldownloaded": $L("PRL downloaded"),
			"commitsucceeded": $L("Commit succeeded"),
			"programmingsucceeded": $L("Programming succeeded"),
			"namdownloaded": $L("NAM downloaded"),
			"mdndownloaded": $L("MDN downloaded"),
			"programmingfailed": $L("Programming unsuccessful. Call customer service.")
		},

		// translations for displaying the above otasp notification as a banner message,
		// format: <message>: [<banner title>, <banner message>]
		// default: [Messages.otaspMessageTitle, <notification message>]
		otaspNotificationsDashboardTranslations: {
			"programmingfailed": [$L("Programming unsuccessful"), $L("Call customer service")]
		}
	},
	create: function() {
		this.inherited(arguments);

		this.otaspMessageTitle = $L("Network update");
		this.otaspNumber = "";
		this.otaspCustomerServiceNumber = "";		

		this.$.telephony.call({
			"events":"otasp"
		}, {
			method : "subscribe",
			onSuccess: "onOtaspEvent",
			onFailure: "onOtaspEvent"
		});
		
		this.$.subscribePreference.call({
		        'keys': ["otaspNumber", "otaspFailedCustomerServiceNumber" ]
		        });

	},
	
	onSubscribePreference: function(inSender, payload) {	        
	        if(payload.returnValue) {
	                if(payload["otaspNumber"]) {
	                        this.otaspNumber = payload["otaspNumber"];
	                }
	                
	                 if(payload["otaspFailedCustomerServiceNumber"]) {
	                        var otaspFailureBanner = $L("Programming unsuccessful.  Call #{value}");
        		        var otaspFailureWithInfoBody = $L("Call #{value}");
        		        
	                        this.otaspCustomerServiceNumber = payload["otaspFailedCustomerServiceNumber"];
	                        
	                        this.otaspNotifications["programmingfailed"] = enyo.application.Utils.interpolate(otaspFailureBanner ,{"value": this.otaspCustomerServiceNumber});
                		this.otaspNotificationsDashboardTranslations["programmingfailed"][1] = enyo.application.Utils.interpolate(otaspFailureWithInfoBody, {"value": this.otaspCustomerServiceNumber});
	                 }
	        }
                //enyo.log(this.otaspNumber + " " + this.otaspCustomerServiceNumber);
	},

	onOtaspEvent: function(inSender, response) {
		if (response && response.eventOtasp && response.eventOtasp.status) {
			this.announceOtasp(response.eventOtasp.status);
		}
	},
	
	getOtaspNumber: function() {
	        return this.otaspNumber;
	},
	
	getOtaspCustomerServiceNumber: function() {
	        return this.otaspCustomerServiceNumber;
	},

	announceOtasp: function(message) {
		
		// If in firstuse, send the update to active call assistant to show the message in the notification area.
		/*if (PalmSystem.isMinimal) {
			var stageProxy = this.appControl.getStageController("PhoneApp");
			if(stageProxy) {
				stageProxy.delegateToSceneAssistant('handleOTASPNotification', message);
			}
			return;
		}*/
		
		var dialCustomerCare = "";

		// turn display on
		this.$.display.call({
			"state": "on"
		});
		
		// play sound if necessary
		switch (message) {
			case 'programmingfailed':
				dialCustomerCare = this.otaspCustomerServiceNumber;
			case 'programmingsucceeded':
        			if (window.PalmSystem) {
					window.PalmSystem.playSoundNotification("notifications");
				}
				break;
			default:
				break;
		}
		
		// get localized message
		var bannerMessage = this.otaspNotifications[message] || message;

		// show in banner
		enyo.windows.addBannerMessage(bannerMessage, "{}");
		
		var dashboardTranslation = this.otaspNotificationsDashboardTranslations[message];
		var dashboardTitle = (dashboardTranslation ? dashboardTranslation[0] : this.otaspMessageTitle);
		var dashboardMessage = (dashboardTranslation ? dashboardTranslation[1] : bannerMessage);
		
		// show in dashboard
		this.addOTASPdash(dashboardTitle, dashboardMessage, dialCustomerCare);
	},
	
	addOTASPdash: function(dashTitle, dashText, dashInfo) {
		enyo.log("addOTASPdash " + dashText);

		if(this.otaspdash != undefined) {
        		this.otaspdash.setLayers([]);
			this.otaspdash.destroy();
			this.otaspdash = undefined;
		}
		
		// delay creating new component under same name after destory
		setTimeout(enyo.bind(this, function() {
			this.otaspdash = this.createComponent({
				name: "otaspEnyoDashabord",
				kind:"enyo.Dashboard",
				smallIcon: "images/notification-small-ignored.png",
				onTap: "otaspDashTap"
			}, {"owner": this});
		
			this.otaspdash.setLayers([{"icon": "images/notification-large-info.png", "title":dashTitle, "text":dashText, "customerCare": dashInfo}]);
			
		}), 1000);
	},
	otaspDashTap: function (inSender, layer, event) {
		if(layer.customerCare != "") {
			enyo.application.CallSynergizer.dial(layer.customerCare, false, enyo.application.CallSynergizer.TRANSPORTS.TIL);
			this.otaspdash.pop();
		}
	},

	handleOTASPNotification: function(msg) {
		enyo.log( "Phone App - ActiveCall handleOTASPNotification" + msg);
		window.clearInterval(this.handleOTASPNotificationTimer);
		
		var dispMsg = this.otaspNotifications[msg] || msg.unescapeHTML();
/*
		var info = Mojo.View.render({object: {otaspUpdate:dispMsg},template: 'activecall/firstusebanner'});
        	this.controller.get('otasptarget').update(info);
		
		var element = this.controller.get('otasptarget').select('.phone-banner-text').first();
		var offset = element.scrollWidth - element.getWidth();
		
		// scroll if necessary
		if ( offset > 0 ) {
			this.handleOTASPNotificationTimer = window.setInterval(function() {
				const RIGHT_BUFFER = 30; // pixel boundary bordering right side of text
				var offsetinterval = 0;
				
				return function() {
					offsetinterval += 10;
					element.style.marginLeft = (-(offsetinterval % (offset + RIGHT_BUFFER))) + 'px';	
				}.bind(this);
			}(), 500);
		}
*/
	},
});


