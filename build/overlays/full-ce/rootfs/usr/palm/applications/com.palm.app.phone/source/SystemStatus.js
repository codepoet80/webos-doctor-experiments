// generic "service" has the state of the system, as sysmgr knows it
enyo.kind({
	name: "SystemStatus",
	kind: enyo.Component,
	components: [
		{name: "prefService", kind: enyo.PalmService, service: enyo.palmServices.system},
		{name: "lockSubscription", kind:"PalmService", service:"palm://com.palm.systemmanager/", method: "getLockStatus", subscribe: true, onSuccess: "onLockStatusEvent"},
		{name: "DefaultRingtoneSub", kind:"PalmService", service:"palm://com.palm.systemservice/", method: "getPreferences", subscribe: true, onSuccess: "onIncomingCallOnCallSound", onFailure: "onIncomingCallOnCallSound"},
	],
	create: function() {
		this.inherited(arguments);
		this.$.prefService.call({
			"keys": ["phoneisFirstTimeLaunched"]
		},{
			method: "getPreferences",
			onSuccess: "updateFirstTimeLaunchRecord",
			onFailure: "updateFirstTimeLaunchRecord"
		});

		this.kDefaultCallOnCallSound = "/usr/palm/applications/com.palm.app.phone/sounds/incoming-call-active.wav";
		this.$.lockSubscription.call();
		this.$.DefaultRingtoneSub.call({"keys": ["phoneIncomingCallOnCallSound"]});
	},
	updateFirstTimeLaunchRecord: function(inSender, response) {
		enyo.log("phoneApp was launched before? "+enyo.json.stringify(response));		
		if (response && response.returnValue) {
			if (response.phoneisFirstTimeLaunched !== undefined) {
				enyo.application.Cache.isFirstTimeLaunched = response.phoneisFirstTimeLaunched; 
			} 
		} 
	}, 
	
	setFirstTimeLaunchRecord: function(value) {
		this.$.prefService.call({
				"phoneisFirstTimeLaunched": value
			}, {
				method: "setPreferences",
				onSuccess: "onSetPrefResponse",
				onFailure: "onSetPrefResponse"
		});	
	},			
	
	onSetPrefResponse: function(inSender, response){
		enyo.log("setPref "+enyo.json.stringify(response));	
	}, 
	
	onLockStatusEvent: function(inSender, response) {	
		// let current state know we're now unlocked
		this.lockstatus = response && response.locked; 
		if ( ! response.locked ) {
			enyo.application.UI.event('lock', false);
		}
	},
	getLockStatus: function () {
		return this.lockstatus;
	},
	
	//Changes the default phoneIncomingCallSound
	onIncomingCallOnCallSound: function(inSender, response) {
		if ( response && response["phoneIncomingCallOnCallSound"] ) {
			enyo.log("new default sound " + response["phoneIncomingCallOnCallSound"]);
			this.kDefaultCallOnCallSound = response["phoneIncomingCallOnCallSound"];
		}
	},
	
	getDefaultCallOnCallSound: function() {
		return this.kDefaultCallOnCallSound;
	}
	/*onGotAccounts: function(inSender, inResponse) {
        enyo.log("debug:: rui inResponse.accounts.length:"+JSON.stringify(inResponse.accounts.length));
        if (inResponse.templates) {
			this._accountTemplates = inResponse.templates;		
		}
	},
	getAccountList: function() {
		this.$.listAccounts.getAccounts({capability: "PHONE"});		
	},*/ 	
});


