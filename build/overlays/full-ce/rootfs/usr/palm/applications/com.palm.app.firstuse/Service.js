/* Copyright 2011 Palm, Inc.  All rights reserved. */

enyo.kind({
    name: "AccountServicesService",
    kind: "PalmService",
    service: "palm://com.palm.accountservices/"
});

enyo.kind({
    name: "DeviceProfileService",
    kind: "PalmService",
    service: "palm://com.palm.deviceprofile/"
});

enyo.kind({
    name: "ConManService",
    kind: "PalmService",
    service: "palm://com.palm.connectionmanager/"
});

enyo.kind({
    name: "DisplayService",
    kind: "PalmService",
    service: "palm://com.palm.display/control/"
});

enyo.kind({
    name: "SystemService",
    kind: "PalmService",
    service: "palm://com.palm.systemservice/"
});

enyo.kind({
    name: "CustomizationService",
    kind: "PalmService",
    service: "palm://com.palm.service.customization/"
});

enyo.kind({
    name: "LocationService",
    kind: "PalmService",
    service: "palm://com.palm.location/"
});

enyo.kind({
    name: "PowerService",
    kind: "PalmService",
    service: "palm://com.palm.power/shutdown/"
});

enyo.kind({
    name: "CollectLogService",
    kind: "PalmService",
    service: "palm://com.palm.logctld/"
});

enyo.kind({
    name: "BusService",
    kind: "PalmService",
    service: "palm://com.palm.bus/signal/"
});

enyo.kind({
    name: "AccountsService",
    kind: "PalmService",
    service: "palm://com.palm.service.accounts/"
});

enyo.kind({
	name: "UpdateService",
	kind: "PalmService",
	service: "palm://com.palm.update/"
});

enyo.kind({
	name: "WiFiService",
	kind: "PalmService",
	service: "palm://com.palm.wifi/"
});

enyo.kind({
	name: "SystemPropertiesService",
	kind: "PalmService",
	service: "palm://com.palm.preferences/systemProperties/"
});

enyo.kind({
    name: "TelephonyService", 
	kind: "PalmService",
	service: "palm://com.palm.telephony/" 
});