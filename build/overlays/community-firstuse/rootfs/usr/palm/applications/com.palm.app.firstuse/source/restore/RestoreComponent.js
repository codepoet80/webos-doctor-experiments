// RestoreComponent.js 
//
//Coordinates the screens and logic of the First Use Restore flow.

enyo.kind({
    name: "RestoreComponent",
    kind: "VFlexBox",
    pack: "justify",
	align:"center",
	INCOMPATIBLE_VERSION : 300,
    published: {
        devices: null
		
    },
    events: {
        onRestoreStarted: "",
        onFinish: ""
    },
    components: [
				{ name: "getRestoreDevices", kind: "BackupService", onSuccess: "getRestoreDevicesSuccess", onFailure: "getRestoreDevicesFailure" },
				{ name: "eraseVar", kind: "PalmService", service: "palm://com.palm.storage/erase/", method: "EraseVar", onResponse: "eraseVarResponse" },
				{ kind: "Pane", flex: 1, transitionKind: "enyo.transitions.Fade", className: "restore", components: [
						{ name: "chooseBackupPage", kind: "ChooseBackupPage", onRestore: "startRestore", onSkip: "skipRestore",onSwUpdate: "launchUpdate", showing : false},
						{ name: "restoringPage", kind: "RestoringPage", onFinish: "restoreFinished", onStartOver: "startOver" }
				]},
			{kind: "StartOver", name: "startOverButton"}
    ],
    
    create: function() {
        this.inherited(arguments);
        this.log("Inside create()");
        if (this.devices) {
            this.devicesChanged();
        } else {
            // This is only here for testing purposes. Normally the RestoreComponent will be created with devices
            // already set
            this.log("No devices set, calling getRestoreDevices()");
            this.$.getRestoreDevices.call({});
        }
    },
    
    getRestoreDevicesSuccess: function(inSender, inResponse) {
        this.log("Inside getRestoreDevicesSuccess, response:", inResponse);
        this.setDevices(inResponse);
    },
    
    getRestoreDevicesFailure: function(inSender, inResponse) {
        this.log("Inside getRestoreDevicesFailure, response:", inResponse);
    },

    
    requirementLost: function(requirement) {
        this.log("Inside requirementLost:", requirement);
        if ("data" === requirement && this.isRestoring()) {
            this.$.restoringPage.setConnected(false);
        }
    },
    
    requirementRestored: function(requirement) {
        this.log("Inside requirementRestored:", requirement);
        if ("data" === requirement && this.isRestoring()) {
            this.$.restoringPage.setConnected(true);
        }
    },
    
    isRestoring: function() {
        return this.$.pane.getView() == this.$.restoringPage;
    },
	
	
    
    devicesChanged: function() {
        this.log("Inside devicesChanged, devices:", this.devices+"   softwareUpdateAvailable: "+this.softwareUpdateAvailable);
        var devicesWithBackups = this.getDevicesWithBackups();
        if ((this.getDevices().autoRestore === true ) && 
		    (devicesWithBackups[0].backups!==undefined && devicesWithBackups[0].backups[0].dbVersion < this.INCOMPATIBLE_VERSION)) {
            this.log("There's only one backup but it could  be  from any device, so we'll automatically restore it");
            this.startRestore(null, devicesWithBackups[0]);
        } else {
            this.$.chooseBackupPage.setShowing(true);
			this.$.chooseBackupPage.setInCompatibleVersion(this.INCOMPATIBLE_VERSION);
            this.$.chooseBackupPage.setDevices({
                date: this.getDevices().date,
                devices: devicesWithBackups
            });
        }
    },
    
    // From the given list of devices, extracts a list of the devices that contain backups. If the current
    // device is in the list, puts it at the top, and sorts the rest by the device name.
    getDevicesWithBackups: function() {
        var devicesWithBackups = this.getDevices().devices.filter(function(device) {
            return device.backups && device.backups.length > 0;
        });
        
        // For pre-Dartfish hardware, returns a default device name based on the hardware type
        var getDefaultDeviceName = function(hardwareType) {
            switch(hardwareType) {
            case "castle":
                return rb.$L("Palm Pre");
            case "pixie":
                return rb.$L("Palm Pixi");
            case "roadrunner":
                return rb.$L("Palm Pre 2");
            case "broadway":
                return rb.$L("HP Veer");
		//shortterm solution to avoid codename - need to think of long term solution to avoid codenames fully.		
            case "manta"+"ray":
                return rb.$L("HP Pre3");
            default:
                return rb.$L("Phone");
            }
        };

        devicesWithBackups.forEach(function(device) {
            if (!device.deviceName) {
                device.deviceName = getDefaultDeviceName(device.hardwareType);
            }
        });
        
        devicesWithBackups = devicesWithBackups.sort(function(a, b) {
            if (a.currentDevice && !b.currentDevice) {
                return -1;
            } else if (b.currentDevice && !a.currentDevice) {
                return 1;
            } else {
                var aName = a.deviceName.toLowerCase();
                var bName = b.deviceName.toLowerCase();
                
                // TODO: Need to use a collator so that the sort works properly in other languages
                if (aName < bName) {
                    return -1;
                } else if (aName > bName) {
                    return 1;
                } else {
                    return 0;
                }
            }
        });
        
        return devicesWithBackups;
    },
    
    startRestore: function(inSender, device) {
        var nduId = device.nduId;
        this.log("Inside startRestore(), device:", device);
        this.sameDevice = device.currentDevice === true;
        this.log("Firing restoreStarted event");
        this.doRestoreStarted();
		this.$.startOverButton.setShowing(this.isRestoring());
        this.$.pane.selectViewByName("restoringPage");
        this.$.restoringPage.setNduId(nduId);
    },
    
    skipRestore: function(inSender) {
        var ret = {
                skipped: true,
                sameDevice: false
        };
        
        this.log("Inside skipRestore(), ret:", ret);
        this.doFinish(ret);
    },
	
	launchUpdate: function(inSender, inResponse) {
        this.log("Inside launchUpdate() ");
        this.log("Firing force software update event");	
		var ret = { 
		   swupdate: true
		};
        this.doFinish(ret);
	},
    
    restoreFinished: function(inSender) {
        var ret = {
                skipped: false,
                sameDevice: this.sameDevice
        };
                
        this.log("Inside restoreFinished(), ret:", ret);
        this.doFinish(ret);
    },
    
    startOver: function(inSender) {
        this.log("Resetting device");
        enyo.scrim.show();
        this.$.eraseVar.call();
    },
    
    eraseVarResponse: function(inSender, inResponse) {
        this.log("eraseVar response:", inResponse);
    }
	

});
