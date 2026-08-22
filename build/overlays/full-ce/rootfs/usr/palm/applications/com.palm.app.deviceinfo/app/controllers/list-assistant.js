/* Copyright 2009 Palm, Inc.  All rights reserved. */

var ListAssistant = Class.create({
    initialize: function(screen, params){
		this.GmBuild = 1;
        this.currentScreen = screen;
        this.params = params || {};
		this.isSceneActive = false;
    },
    
    setup: function(){
   		var timing = Mojo.Timing;
		timing.resume('scene#list#setup');
		
		this.COMMAND_MENU = {
	      loadQuickTest: {command:'cmdQuickTest',target: this.loadQuickTest.bind(this)},
		  loadInteractiveTest: {command:'cmdInteractiveTest',target: this.loadInteractiveTest.bind(this)},
		  loadCertMgr: {command:'cmdCertMgr',target: this.loadCertMgr.bind(this)},
		  loadDefaultApps: {command:'cmdDefaultApp', target: this.pushDefaultApp.bind(this)},
		  runHiddenApp: {command:'cmdHiddenApp', target: this.pushHiddenApp.bind(this)},
		  loadAbout: {command:'cmdAbout', target: this.pushAbout.bind(this)} 
	    };  
		
		var quickTestItem = {label:$L('Quick Tests...'), command:this.COMMAND_MENU.loadQuickTest.command, checkEnabled:true};
		var interactiveTestItem = {label:$L('Interactive Tests...'), command:this.COMMAND_MENU.loadInteractiveTest.command, checkEnabled:true};
		var certMgrItem = {label:$L('Certificate Manager...'), command:this.COMMAND_MENU.loadCertMgr.command, checkEnabled:true};
		var defaultAppItem = {label:$L('Default Applications'), command:this.COMMAND_MENU.loadDefaultApps.command, checkEnabled:true};
	//	var testSubmenuItem = {label: $L('Tests'), submenu: 'testsmenu', items:[quickTestItem, interactiveTestItem]};
		var diagnosticItem = {label: $L('Diagnostics...'), command:this.COMMAND_MENU.loadInteractiveTest.command, checkEnabled:true};
		var hiddenAppItem = {label: $L('Custom Application...'), command:this.COMMAND_MENU.runHiddenApp.command, checkEnabled:true};
		var aboutItem = {label: $L('About'), command:this.COMMAND_MENU.loadAbout.command, checkEnabled:true};
				
		this.appMenuModel = {
            visible: true,
            items: [defaultAppItem, certMgrItem, diagnosticItem, hiddenAppItem, aboutItem, Mojo.Menu.helpItem]
        }; 
		
        this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, this.appMenuModel);

        this.nameModel = {
            'deviceName': '',
			'listTitle':$L('Device')
        }; 
        // Default values for fields should be set here.
        this.fields = {
            //"system": "&nbsp;",
			//"phoneNumber": "&nbsp;"
        };
        this.softwareModel = {
            items: [],
			'listTitle':$L('Device')
        };
        
        this.controller.setupWidget('softwareList', {
            itemTemplate: 'list/item',
			listTemplate: 'list/listcontainer'
        }, this.softwareModel);

        this.controller.setupWidget('deviceName', {
            modelProperty: "deviceName",
            maxLength: 50,
			autoReplace: false
        }, this.nameModel);
        
        // This initializes any default values in this.fields
        this.updateFields(this.softwareItems, this.softwareModel);
		
        // Catch property change events, which the TruncTextField widget generates.
        this.controller.get('deviceName').observe(Mojo.Event.propertyChanged, this.deviceNameChanged.bindAsEventListener(this));
		this.controller.get('softwareList').observe(Mojo.Event.listTap, this.listSelectionHandler.bindAsEventListener(this));
		
        this.controller.get('erase-button').observe(Mojo.Event.tap, this.eraseButtonHandler.bindAsEventListener(this));
		this.controller.get('more-button').observe(Mojo.Event.tap, this.moreButtonHandler.bindAsEventListener(this));

	// handle activate events, every time the app gets focus %
        Mojo.Event.listen(this.controller.document, Mojo.Event.activate, this.hasFocus.bind(this),false);
	Mojo.Log.info("% handled activate event 2.56");
    
        var props = [{
            key: "com.palm.properties.GMFLAG"
        }, {
            key: "com.palm.properties.storageCapacity"
        }, {
            key: "com.palm.properties.storageFreeSpace"
        }, {
            key: "com.palm.properties.PalmSN"
        }, {
            key: "com.palm.properties.buildNumber"
        }, {
            key: "com.palm.properties.buildMark"
        }, {
            key: "com.palm.properties.version"
        }, {
	         key: "com.palm.properties.ProductSKU"
	    },];
        
        // Make service requests to get information.
        this.propertyGet = [];

		$A(props).each(function(a, index){
			//console.log(Object.toJSON(a));
		 	this.propertyGet[index] = AppAssistant.propertiesService.get(a, this.takeProperties.bind(this), this.controller);
        }.bind(this));
		
		this.emailQuery = AppAssistant.accountService.getEmail(this.takeAccountEmail.bind(this));
        this.mdnQuery = AppAssistant.telephonyService.mdnQuery(this.takeMyNumber.bind(this), this.controller);
		
		// Subscribe to Battery Power Notifications
		this.powerNotificationSession = new Mojo.Service.Request('palm://com.palm.lunabus/signal/', {
			method: 'addmatch',
			parameters: {"category":"/com/palm/power","method":"batteryStatus"},
			onSuccess: this.handlePowerNotifications.bind(this)});

		// Request the Initial Value for Battery Power
		new Mojo.Service.Request('palm://com.palm.power/com/palm/power/', {
			method: 'batteryStatusQuery',});

		this.systemPrefQuery = AppAssistant.systemPrefService.getPrefs(["customizationBuild", "deviceName"], this.takeSysPref.bind(this), this.controller);
		
		this.controller.setInitialFocusedElement(null);
		
		timing.pause('scene#list#setup');

		//get everything
		// console.log("Get all properties");
		// 		function listAll(payload){
		// 			for(var i=0;i<payload.length;i++){
		// 				console.log("property " + Object.toJSON(payload[i]));
		// 			}
		// 			//console.log("properties " + Object.toJSON(payload));
		// 		}
		// 		AppAssistant.propertiesService.allo({}, listAll, this.controller);
    },

	listSelectionHandler: function(event) {		
		var item = event.item;
		Mojo.Log.info("listSelectionHandler", Object.toJSON(item));
		
		this.controller.get('deviceName').mojo.blur();
		
		if (item.field == 'system') {
			if (item.title == $L('Version')) {
				item.title = $L('Build');
				item.data = this.fields.buildNumber;
			} else if (item.title == $L('Build')) {
				item.title = $L('Version');
				item.data = this.fields.system;
			}
			
			this.controller.modelChanged(this.softwareModel, this);
		}
	},
	
	handlePowerNotifications: function(response) {
		Mojo.Log.info("handlePowerNotifications " + Object.toJSON(response));	
		
		if ("percent_ui" in response) {
			this.fields.battery = Mojo.Format.formatPercent(response["percent_ui"]);
		}
		this.updateFields(this.softwareItems, this.softwareModel);
	},
	  
	takeSysPref: function(payload) {
		Mojo.Log.info("takeSysPref " + Object.toJSON(payload));
		if(!payload)
			return;		
		if(("customizationPackageVersion" in payload))
			this.fields.carrier = payload["customizationPackageVersion"];
			
		if(("customizationBuild" in payload) && (this.GmBuild == 0))
			this.fields.carrierBuild = payload["customizationBuild"];

		if (("deviceName" in payload)) {
			this.deviceName = this.nameModel.deviceName = payload['deviceName'];
            this.controller.modelChanged(this.nameModel);            
		}
		
		this.updateFields(this.softwareItems, this.softwareModel);
	},
	
    takeMyNumber: function(payload){
		Mojo.Log.info("takeMyNumber " + Object.toJSON(payload));
        if (!payload) 
            return;
        if (!("extended" in payload)) 
            return;
        if (!("number" in payload.extended)) 
            return;
		
		try{
			var globalizationLib = MojoLoader.require({name: "globalization", version: "1.0"})["globalization"];
		} catch (error) {
			Mojo.Log.logException(error, "failed to load Globalization library");
		}
			
		this.fields.phoneNumber = globalizationLib.Globalization.Format.formatPhoneNumber(globalizationLib.Globalization.Phone.parsePhoneNumber(payload.extended.number));
		this.updateFields(this.softwareItems, this.softwareModel);
    },
    
    takeAccountEmail: function(email){
		Mojo.Log.info("profile email is %s" + email);
        this.controller.get('acctEmail').innerHTML = email;
	},
    
    takeValue: function(item, payload){
		Mojo.Log.info("takeValue " + item + " " + Object.toJSON(payload));
        if (!payload) 
            return;
        if (!("extended" in payload)) 
            return;
        if (!("value" in payload.extended)) 
            return;
        this.fields[item] = payload.extended.value;
        this.updateFields(this.softwareItems, this.softwareModel);
    },
    
    takeProperties: function(payload){
		Mojo.Log.info("takeProperties " + Object.toJSON(payload));
        if (!payload) 
            return;
        if ("com.palm.properties.storageCapacity" in payload) {
			var capacity = (payload["com.palm.properties.storageCapacity"] /
							1000.0 / 1000 /	1000).toFixed(0);
			Mojo.Log.info("takeProperties cap " + capacity);
			this.fields.totalMem = capacity + $L(" GB");
		}

        if ("com.palm.properties.storageFreeSpace" in payload) {
			var memory = (payload["com.palm.properties.storageFreeSpace"] /
  				          1024.0 / 1024 / 1024).toFixed(1);
			Mojo.Log.info("takeProperties mem " + memory);
            this.fields.availableMem = Mojo.Format.formatNumber(new Number(memory), 1) + $L(" GB");
		 }
        if ("com.palm.properties.PalmSN" in payload) 
            this.fields.serial = payload["com.palm.properties.PalmSN"].toUpperCase();
				
		
		if ("com.palm.properties.version" in payload)
			this.fields.system = payload["com.palm.properties.version"];
			
		if ("com.palm.properties.ProductSKU" in payload)
			this.fields.productSKU = payload["com.palm.properties.ProductSKU"];
				
		// webOS CE: the Build row shows the CE BUILDMARK when the image has one
		// (/etc/prefs/properties/buildMark). CE leaves BUILDNUMBER at the stock
		// value -- the OTA fingerprint keys on it -- and bumps BUILDMARK once per
		// bake, so the mark is what identifies a CE image. Stock is the fallback.
		if ("com.palm.properties.buildNumber" in payload)
			this.stockBuildNumber = payload["com.palm.properties.buildNumber"].toUpperCase();
		
		if ("com.palm.properties.buildMark" in payload)
			this.buildMark = payload["com.palm.properties.buildMark"].toUpperCase();
		
		if (this.buildMark || this.stockBuildNumber)
			this.fields.buildNumber = this.buildMark || this.stockBuildNumber;
		
		if ("com.palm.properties.GMFLAG" in payload)
			this.GmBuild = payload["com.palm.properties.GMFLAG"];
        
        this.updateFields(this.softwareItems, this.softwareModel);
    },
    
    updateFields: function(list, model){
		model.items = [];
        var index = 0;
        for (var i=0; i<list.length;i++ ) {
            var item = list[i];
			if (item.field in this.fields) {
				
				if(item.field != 'buildNumber') {
	                model.items[index] = {
						field: item.field,
	                    title: item.title,
	                    data: this.fields[item.field]
	                };
	                if ("upper" in item) {
	                    model.items[index].data = model.items[index].data.toUpperCase();
	                }
	                index++;
				}
            }
        }
        this.controller.modelChanged(model, this);
    },
    
    
    hasFocus: function(){
   		var timing = Mojo.Timing;
		timing.resume('scene#list#activate');

        // Refresh disk space when we get focus.
	Mojo.Log.info("% 2.56 inside func activate.handled activate event");
 		if (this.isSceneActive) {
			AppAssistant.propertiesService.get({
				"key": "com.palm.properties.storageFreeSpace"
			}, this.takeProperties.bind(this), this.controller);
		}
		this.isSceneActive = true;
		timing.pause('scene#list#activate');
    },
    
//    deviceNameCb: function(payload){
//		Mojo.Log.info("deviceNameCb: ", Object.toJSON(payload));
//        if (!payload) 
//            return;
//			
//        if (payload.returnValue) {
//			this.deviceName = this.nameModel.deviceName = payload.name;
//            this.controller.modelChanged(this.nameModel);            
//        }
//    },
    
    deviceNameChanged: function(event){
		Mojo.Log.info("deviceNameChanged", event.value, this.nameModel.deviceName);
        if (!event.value || event.value == '') {
			Mojo.Log.info("deviceNameChanged empty value");
			this.nameModel.deviceName = this.deviceName;
            this.controller.modelChanged(this.nameModel);
			return;
		}
		
		this.deviceName = event.value;
		this.systemPrefQuery = AppAssistant.systemPrefService.setPrefs({"deviceName":this.deviceName} , function(payload){Mojo.Log.info(Object.toJSON(payload))}, this.controller);
		AppAssistant.accountService.setDeviceNameInProfile(this.deviceName);
		AppAssistant.accountService.assignDeviceName(this.deviceName);
        //this.btRequest = AppAssistant.btService.setLocalDeviceName(event.value, this.controller);
    },
    
    deactivate: function(){
    },
    
    cleanup: function(){
    },
	
	handleCommand: function(event) {
		if(event.type == Mojo.Event.command) {
			// determine if we have a target function for this command
	      	var menu = $H(this.COMMAND_MENU);
		    	menu.keys().each(function(key) {
			        var menuCommand = menu.get(key);
			        if (menuCommand.command == event.command) {
			          menuCommand.target();
			          Event.stop(event);
			          throw $break;
			        }
		      	});
			if (event.command == Mojo.Menu.helpCmd) {
				Event.stop(event);
				var openParams = {
					target: 'http://help.palm.com/device_info/index.html'
				};
				this.controller.serviceRequest('palm://com.palm.applicationManager', {
					method: 'open',
					parameters: {
						id: 'com.palm.app.help',
						params: openParams
					}
				});
			}
		} else if (event.type == Mojo.Event.commandEnable && 
		         (event.command == Mojo.Menu.helpCmd)) {
			event.stopPropagation();
		}
	},

    
    setSceneHeader: function(text){
        this.controller.get('prefheader').update(text);
    },
    
    eraseButtonHandler: function(event){
        this.controller.stageController.pushScene('erase');
    },
	
	moreButtonHandler: function(event){
        this.controller.stageController.pushScene('more');
    },
	
	loadQuickTest: function() {  // obsolete
		Mojo.Log.info("loadQuickTest");
		var args = {
			appId: "com.palm.app.crotest",
			name: "automatedtests"
		};
		this.controller.stageController.pushScene(args, {});	
	},
	
	loadInteractiveTest: function() {
		Mojo.Log.info("loadInteractiveTest");
		this.controller.serviceRequest('palm://com.palm.applicationManager', {
			method: 'open',
			parameters: {
				id: 'com.palm.app.crotest',
				params: {}
			}
		});
	
	},
	
	loadCertMgr: function() {
		Mojo.Log.info("loadCertMgr");
		var args = {
			appId: "com.palm.app.certificate",
			name: "list"
		};
		this.controller.stageController.pushScene(args, {});	  
	},
    
	pushDefaultApp: function() {
		this.controller.stageController.pushScene("defaultapps");
	},

	pushHiddenApp: function() {
		this.controller.stageController.pushScene("customapp");
	},

	pushAbout: function() {
		this.controller.stageController.pushScene("about");
	},

	softwareItems: [{
        title: $L("Number"),
        field: "phoneNumber"
    },{
        title: $L("Battery"),
        field: "battery"
    },{
        title: $L("Memory"),
        field: "totalMem"
    },{
        title: $L("Available"),
        field: "availableMem"
    },{
        title: $L("Version"),
        field: "system"
    },{
        title: $L("Build"),
        field: "buildNumber"
    },{
        title: $L("Configuration"),
        field: "carrier"
    },{
        title: $L("Configuration build"),
        field: "carrierBuild"
    },{
        title: $L("Serial number"),
        field: "serial"
    },{
        title: $L("Product Number"),
       	field: "productSKU"
	 }],



});



