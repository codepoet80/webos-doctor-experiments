/*jslint white: false, onevar: false, nomen:false, plusplus: false */
/*global DBModels, document DialingShortcuts, window, console, kit, SystemService, TelephonyService, _, ContactsUI, ContactsLib, Class, App, enyo, $L, $H, $break, Event, Future, MojoDB, mapReduce, MainStageName, setTimeout, clearTimeout, Messaging, AudioTag, Image, PalmSystem, TransportPickerModel, Template, CharacterCounter, MessagingDB, MessagingUtils, MessagingMojoService, ChatFlags, BucketDateFormatter, CONSTANTS, MenuWrapper, SetTopicAssistant*/
/* Copyright 2010 Palm, Inc.  All rights reserved. */
enyo.kind({
	name: "CallLogLinker", 
	kind: enyo.Component, 
	pending: {},
	components: [
		{name: "find", kind: "DbService", dbKind: "com.palm.phonecall:1", method: "find", onSuccess: "findCallback", subscribe: true, reCallWatches: false, onWatch: "watchDBChange"},
		{name: "merge", kind: "DbService", dbKind: "com.palm.phonecall:1", method: "merge", onSuccess: "writeCallback"},
		{name: "smartMerge", kind: "DBModels.SmartMerge"}
	],
	create: function() {
		this.inherited(arguments);
		this.$.find.call(DBModels.PhoneCall.getWatchQuery());
	},

	watchDBChange: function(inSender, payload) {
		if(payload && payload.fired == true) {
			this.$.find.cancel();
			this.$.find.call(DBModels.PhoneCall.getWatchQuery());
		}
	},
	
	findCallback: function(inSender, payload) {
		// Found unlinked call(s)
		payload.results.forEach(this.linkOrphanedCall, this);
	},
	
	linkOrphanedCall: function(phonecall) {
		// used in the case that phonecalls are added faster than they can be operated on (such as by a script)
		if ( phonecall._id in this.pending ) {
			return;
		}
		this.pending[phonecall._id] = true;

		this.createOrUpdateCallGroups(phonecall, enyo.bind(this,function(){ 
			var params = {objects:[phonecall]};
			this.$.merge.call(params);
		}));
	},
	
	writeCallback: function(inSender, payload) {
		if(payload.results) {
			// DbService sometimes removes the leading underscore from property names in the response object
			var id = payload.results[0].id ? payload.results[0].id : payload.results[0]._id;
			if(id !== undefined) {
				delete this.pending[id];
			}
		}
	},
	
	createOrUpdateCallGroups: function(phonecall, callback) {
		this.linkCallToGroup(DBModels.PhoneCallGroup.TYPES.ALL, phonecall, enyo.bind(this, function() {
			// if a missed call, also create and link to a missed group
			if ( phonecall.type === DBModels.PhoneCall.TYPES.MISSED ) {
				this.linkCallToGroup(DBModels.PhoneCallGroup.TYPES.MISSED, phonecall, callback);
			} else {
				callback();
			}
		}));
	},
	
	linkCallToGroup: function(type, phonecall, callback) {
		var groupid, address, propsCallback;
		
		groupid = DBModels.PhoneCallGroup.generateId(type, phonecall);
		
		if ( ! phonecall.groups ) {
			phonecall.groups = [];
		}
		phonecall.groups.push(groupid); // will merge to db later
		
		address = DBModels.PhoneCall.getRemoteAddress(phonecall);
		
		propsCallback = function(group) {
			var props = {};
			props.type = type;
			
			// increment or set callcount
			if ( group === undefined ) {
				props.callcount = 1;
			} else {
				props.callcount = group.callcount + 1;				
			}
			
			// order not guaranteed, so make sure we're not overwriting a more recent call
			if ( group === undefined || group.timestamp <= phonecall.timestamp ) {
				props.timestamp = phonecall.timestamp;
				delete address._id; // don't need id
				props.recentcall_address = address;
				props.recentcall_type = phonecall.type;
				props.recentcall_address.isVideo = phonecall.isVideo;
			}
			
			return props;
		};

		this.$.smartMerge.execute(DBModels.PhoneCallGroup.dbKindId, groupid, propsCallback, callback);
	}
	
});
