// ChooseBackupPage.js
//
// Displays a list of devices that have backups on the user's account. The user can pick a device and restore
// the backup, or skip the restore.

enyo.kind({
    ROW_HEIGHT: 120,
    MAX_VISIBLE_ROWS: 2.5,
    
    name: "ChooseBackupPage",
    kind: "HFlexBox",
	align: "start",
	pack:"center",	
    published: {
        devices: {},
		inCompatibleVersion:""
    },
    events: {
        onRestore: "",
        onSkip: "",
		onSwUpdate: ""
    },
    
    create: function() {
        this.inherited(arguments);
        this.enableButtons();
        this.timeoutDurationArray =[];
		this.log("TEST-softwareUpdateAvailable:"+this.owner.softwareUpdateAvailable);
    },
    
    components: [
	{kind: "VFlexBox", className: "devices", components: [
		{ className: "title", content: rb.$L("What do you want to copy?") },
			{ className: "subtitle", content: rb.$L('Select a device in the list. You can copy your applications, accounts, data and settings to your TouchPad or just the applications.') },
			{ name: "deviceListContainer",kind: "Control", className: "box", components: [
			{ name: "deviceList", kind: "VirtualList", className: "list", onSetupRow: "setupRow", onclick: "selectDevice", components: [
				{ name: "deviceItem", kind: "Item", layoutKind: "HFlexLayout", align: "center", pack: "justify", components: [
					{ kind: "Control", flex: 1, components: [
					    { kind: "Control", layoutKind: "HFlexLayout", components: [
					    	{ name: "msgIcon", kind: "Image" ,showing:false, src: "images/bg_message.png", style: "margin-right: 3px" },
							{ name: "deviceName", className: "name" }
						]},
						{ name: "backupDate"},
						
					]},
					{ kind: "Control", layoutKind: "VFlexLayout", className: "image", pack: "center", align: "center", components: [
						{ name: "deviceImage", kind: "Image" , onerror: "imageErrorHandler" }
					]}
				]}
			]}
			]},
			{ name: "restoreButton", kind: "Button", caption: rb.$L("Copy Everything"), onclick: "restoreClicked", className: "enyo-button-affirmative", style: "margin:0 20px 15px;"},
			{ kind: "Button", caption: rb.$L("Applications Only"), onclick: "doSkip",  style: "margin:0 20px 15px;"},
			{
				kind: "ModalDialog",
				caption: rb.$L("Cannot Restore"),
				name: "noOtaPopup",				
				modal: "true",
				lazy: true,				
				className: "popup",
				components: [{
					name: "noOtaModContent",
					content: "",
					className: "enyo-text-body"
				}, 
				{
					kind: "Button",
					caption: rb.$L("OK"),
					flex: 1,
					onclick: "closeNoOtaPopup",
					style: "margin-bottom:10px"
				}]
			},
			{
				kind: "ModalDialog",
				caption: rb.$L("Software Update"),
				name: "swUpdatePopup",				
				modal: true,
				lazy: true,				
				className: "popup",
				components: [{
					name : "swModContent",
					content: "",
					className: "enyo-text-body"
				}, 
				{layoutKind: "HFlexLayout", pack: "center", components: [
					{
						kind: "Button",
						caption: rb.$L("Cancel"),
						flex: 1,
						onclick: "closeswuPopup",
						style: "margin-right:10px"
					},
					{
						kind: "Button",
						className: 'enyo-button-affirmative',
						caption: rb.$L("OK"),
						flex: 1,
						onclick: "updateSoftware"
					}
					
					]}
				]}
					
		    ]}
    ],
	
	closeNoOtaPopup: function(){
		this.selectedRow = undefined;
		this.$.deviceList.refresh();
		this.$.noOtaPopup.close();
	},
	closeswuPopup: function(){
		this.log("Inside closeswPopup");
		this.$.swUpdatePopup.close();
	},
	updateSoftware:function(){
		this.log("Inside swUpdatePopup");
		this.doSwUpdate();
	},
    
    // Refreshes the device list with the newly-set list of devices
    devicesChanged: function() {
        this.log("Inside devicesChanged");
        this.currentTimeMillis = Date.parse(this.getDevices().date);        
        this.selectedRow = undefined;
        // if the current device is in the list, select it by default
        var devices = this.getDevices().devices;
        for (var i = 0; i < devices.length; i++) {
            if (devices[i].currentDevice) {
                this.log("Selected device", devices[i], "by default because it's the current device");
                this.selectedRow = i;
                break;
            }
        }
        
        // make the device list the proper size to show the number of devices, up to the maximum visible rows
        var listHeight = Math.min(this.MAX_VISIBLE_ROWS, devices.length) * this.ROW_HEIGHT;
        this.$.deviceList.setStyle("height: " + listHeight + "px");
        this.timeoutDurationArray =[]; // Empty the timeout list so that can re-calculate the loading time.
        this.$.deviceList.refresh();
        
        // make the buttons enable when the default value set.
        this.enableButtons();
    },
    
    // Fires the onRestore event when the user taps the Restore button
    restoreClicked: function() {
        this.log("Inside restoreClicked- selectedDeviceName  "+JSON.stringify(this.getSelectedDevice()));
		var version=this.getSelectedDevice().backups[0].dbVersion;
		if (version >= this.getInCompatibleVersion()) {
			  this.$.swUpdatePopup.validateComponents();
			  this.$.swModContent.setContent("This device's software must be updated to restore data from "+this.getSelectedDevice().deviceName	+". Would you like to update now?");
			  this.$.swUpdatePopup.openAtCenter();
		}
		else {
			this.doRestore(this.getSelectedDevice());
		}
    },
	
	// Fires the onRestore event when the user taps the updateButton button
    swupdateClicked: function() {
        this.log("Inside swupdateClicked");
        this.doSwUpdate();
    },
    
    // Selects a device based on the DOM event
    selectDevice: function(inSender, inEvent) {
        this.selectedRow = inEvent.rowIndex;
        this.log("Selected row:", this.selectedRow);
        this.timeoutDurationArray =[]; // Empty the timeout list so that can re-calculate the loading time.
        this.$.deviceList.refresh();
        this.enableButtons();
        return true;
    },
    
    // Returns the descriptor of the currently selected device
    getSelectedDevice: function() {
        if (this.selectedRow === null || 
                this.selectedRow === undefined ||
                !this.getDevices().devices ||
                this.getDevices().devices.length <= this.selectedRow) {
            return undefined;
        } else {
            return this.getDevices().devices[this.selectedRow];
        }
    },
    
    // Configures the Flyweight used in the list to stamp the next row
    setupRow: function(inSender, inIndex) {
        if (inIndex >= 0 && this.getDevices().devices && inIndex < this.getDevices().devices.length) {
            var device = this.getDevices().devices[inIndex];
            this.$.deviceName.setContent(device.deviceName);
			var devbackup=device.backups[0];
            this.$.backupDate.setContent(rb.$L("Backed up ") + this.getElapsedTime(device.backups[0].date)+this.getVersionString(device.osVersion));
			var version = device.backups[0].dbVersion;
			console.info("softwareUpdateAvailable:"+this.owner.softwareUpdateAvailable);
            
			if (version && version >= this.getInCompatibleVersion()) {				
				if (!this.owner.softwareUpdateAvailable) {
					this.$.msgIcon.show();
				}					
		    }
			this.$.deviceImage.setSrc(device.deviceImageUrl);
			this.$.deviceItem.addRemoveClass("selected", (inIndex == this.selectedRow));
			this.$.deviceItem.addRemoveClass("first", (inIndex == 0));
			this.$.deviceItem.addRemoveClass("last", (inIndex == this.getDevices().devices.length - 1));
            return true;
        }
    },
	getVersionString: function(osVersion){
		if (osVersion === undefined || osVersion.major === undefined) {
			return "";
		}
		var vString=rb.$L(", webOS #{major}.#{minor}.#{revision}");		
		return this.getLocString(vString,{major:osVersion.major,minor: osVersion.minor, revision:osVersion.revision});
	},
    
    // Enables/disables the Restore button depending on whether a backup is selected
    enableButtons: function() {
      if(this.selectedRow === undefined){
        	this.$.restoreButton.setDisabled(true);
			return;
	  }
      this.$.restoreButton.setDisabled(false);
	  var version = this.getSelectedDevice().backups[0].dbVersion;
          if (version && version >= this.getInCompatibleVersion()) {
		  	if (!this.owner.softwareUpdateAvailable) {
		  		this.$.restoreButton.setDisabled(true);
				this.showNoOta();
//				this.selectedRow = undefined;
//				this.$.deviceList.refresh();
		  	}
		  }
    },
	showNoOta: function(){
		this.$.noOtaPopup.validateComponents();
		var t = rb.$L("This device's software must be updated to restore data from #{deviceName}. However, the updated software is not yet available. Please choose a different device to restore from.");
		this.$.noOtaModContent.setContent(this.getLocString(t,{deviceName: this.getSelectedDevice().deviceName}));
		this.$.noOtaPopup.openAtCenter();
		
	},
    
    // Returns a user-presentable string stating how long before the current time the given time is.
    // For example: '12 hours ago'
    getElapsedTime: function(dateString) {
        var HOUR = 1000 * 60 * 60;
        var HOUR_THRESHOLD = HOUR * 36;
        var DAY = HOUR * 24;
        
        var dateMillis = Date.parse(dateString);
        var diff = this.currentTimeMillis - dateMillis;
        
        if (diff < HOUR) {
            return rb.$L("Less than an hour ago");
        } else if (diff < HOUR_THRESHOLD) {
            var hours = Math.round(diff / HOUR);
            return this.formatChoice(rb.$L("1#1 hour ago|1>##{num} hours ago"), hours, { num: hours });
        } else {
            var days = Math.round(diff / DAY);
            return this.formatChoice(rb.$L("1#1 day ago|1>##{num} days ago"), days, { num: days });
        }
    },
    
    formatChoice: function(localizedText, number, params) {
        return new enyo.g11n.Template(localizedText).formatChoice(number, params);
    },
    
	getLocString: function(localizedText, params) {
        return new enyo.g11n.Template(localizedText).evaluate( params);
    },
    
    imageErrorHandler: function( inSender, inEvent ){
    	var imageSrc = inSender.src;
    	var index = inEvent.rowIndex;
    	this.log("Failed to load image: " + imageSrc); 
    	this.log("Row #: " + index);
    
    	if (this.timeoutDurationArray[index] === undefined || this.timeoutDurationArray[index] === null){
    		this.timeoutDurationArray[index] = 2;
    	}
    	var waitingTime = this.timeoutDurationArray[index];
    	
    	var devliceList =this.$.deviceList;
    	if (waitingTime< 5*60){ 
    		this.log("Retry loading row #"+ index + " after: " + waitingTime + "s");
    		setTimeout(function() { devliceList.updateRow(index);}, waitingTime*1000); 
    		this.timeoutDurationArray[index] += waitingTime;
    	}else{
    		this.log("Retry timeout, cann't load image: " + imageSrc);
    	}
    }
});
