enyo.kind({
	name: "DBAssistant",
	kind: enyo.Control,
	events: {
		onGotCallGroup: "",
		onGotCallHistory: "",
		onGotPerson: "",
		onGotVisualVoicemail: "",
	},
	components: [
		{name: "dbPhoneCallGroup", kind: "DbService", dbKind: "com.palm.phonecallgroup:1", components: [
			{name: "dbDeleteCallLog", method: "del", onSuccess: "onDeleteCallLogSuccess"},
		]},
		{name: "dbGetCallLog", kind: enyo.DbService, method: "find", dbKind: "com.palm.phonecallgroup:1", onSuccess: "gotCallLogGroup", subscribe: true, onWatch: "gotCallLogGroup"},
		{name: "dbPhoneCall", kind: "DbService", dbKind: "com.palm.phonecall:1", components: [
			{name: "dbGetCallHistory", method: "find", onSuccess: "gotCallHistory"},
			{name: "dbDeleteCallHistory", method: "del",},
			{name: "_getPhonecalls", method: "find", onSuccess: "_onGotPhonecalls"},
		]},
		{name: "personLookupQuery", kind:"Utils.PersonFind", onSuccess: "_gotPerson", onFailure: "_gotPerson"},
		{name: "dbVisualVM", kind: "DbService", dbKind: "com.palm.vvm.voicemessages:1", components: [
			{name: "dbGetVisualVMs", method: "find", subscribe: true, onSuccess: "gotVisualVoicemail", onWatch: "gotVisualVoicemail",},
			{name: "dbDeleteVisualVMs", method: "del",},
		]},
		// _onlyDeleteCallLog is needed since dbDeleteCallLog's callback onDeleteCallLogSuccess has special logic that we want to avoid
		{name: "_onlyDeleteCallLog", kind: "DbService", method: "del"},
		{name: "smartMerge", kind: "DBModels.SmartMerge"}
	],
	
 	getVisualVoicemail: function() {
		// luna-send -a com.palm.app.phone -n 1 luna://com.palm.db/find '{"query":{"from":"com.palm.vvm.voicemessages:1"}, orderBy: "timestamp", "desc": true}'
		var q = {
			"orderBy": "timestamp",
			"desc": true,
		};
		this.$.dbGetVisualVMs.call({query: q});
  	},

	getVisualVoicemail_DL: function(inQuery) {
		// luna-send -a com.palm.app.phone -n 1 luna://com.palm.db/find '{"query":{"from":"com.palm.vvm.voicemessages:1"}, orderBy: "timestamp", "desc": true}'
		var q = inQuery;
			q.orderBy = "timestamp";
		return this.$.dbGetVisualVMs.call({query: q});
	},
	
	gotVisualVoicemail: function(inSender, inResponse, inRequest) {
		this.doGotVisualVoicemail(inResponse, inRequest);
	},

	deleteVisualVoicemail: function(inId) {
		this.$.dbDeleteVisualVMs.call({"ids": [inId]});
	},
	
	getCallLogGroup: function(inValue, inQuery) {
		var q = inQuery;
			q.orderBy = "timestamp";
			q.where = [{"prop":"type","op":"=","val":inValue}];
		return this.$.dbGetCallLog.call({query: q});
	},

	deleteCallLogGroup: function(inCallLogGroupId) {
		this.callLogGroupIdToDelete = inCallLogGroupId;
		this.$.dbDeleteCallLog.call({"ids": [this.callLogGroupIdToDelete] });
	},

	// After the CallLogGroup sucessfully deletes from the database.
	// This logic is highly specific and slightly redundant for performance consideration.
	// Logic:
	// If type = 'all':
	//		1. delete group
	//		2. delete calls associated with this group
	//		3. delete related 'missed' group if exists (since it can only contain now-deleted entries)
	// Else (type = 'missed')
	//		1. delete group
	//		2. delete calls associated with this group
	//		3. update 'all group' with remaining phone calls associated with that group	
	onDeleteCallLogSuccess: function() {
		// delete associated calls
		this.deleteCallHistory(this.callLogGroupIdToDelete);

		// CASE ALL
		if (this.callLogGroupIdToDelete.lastIndexOf("_all", this.callLogGroupIdToDelete.length - 3) > 0) {
			// delete 'missed' group
			var missedGroupId = DBModels.PhoneCallGroup.getRelatedId(DBModels.PhoneCallGroup.TYPES.ALL, this.callLogGroupIdToDelete);
			this.$._onlyDeleteCallLog.call({"ids": [missedGroupId] });
		}
		// CASE MISSED
		else {
			// find all calls for 'all' group, _onGotPhonecalls will then update the all callgroup or if there are no more calls delete it
			this.allGroupId = DBModels.PhoneCallGroup.getRelatedId(DBModels.PhoneCallGroup.TYPES.MISSED, this.callLogGroupIdToDelete);
			var q = {
				"where": [{"prop":"groups","op":"=","val":this.allGroupId}],
				"orderBy":"timestamp",
				"desc":true
			};
			this.$._getPhonecalls.call({query: q}); // More logic about updating (or deleting) is in _onGotPhonecalls
		}
	},

	gotCallLogGroup: function(inSender, inResponse, inRequest) {
		this.doGotCallGroup(inResponse, inRequest);
	},

	getCallHistory: function(callLogId) {
		var q = {
			"where": [{"prop":"groups","op":"=","val":callLogId}],
			"orderBy":"timestamp",
			"desc":true
		};
		this.$.dbGetCallHistory.call({query: q}); 
	},

	gotCallHistory: function(inSender, inResponse, inRequest) {
        if (inResponse.fired == true) {
            // Should never be true since subscribe = false
			// TODO: Notify anyone interested that the Call History has changed
        } else {
			this.doGotCallHistory((inResponse && inResponse.results) || []); 
		}
	},
	
	deleteCallHistory: function(inCallLogGroupId) {
		this.$.dbDeleteCallHistory.call(
			{"query": { "from":"com.palm.phonecall:1",
						"where":[{"prop":"groups","op":"=","val":inCallLogGroupId}]
					  },
			 "purge":false});
	},
	
	getPerson: function(personId, fallbackAddress, fallbackService) {
		this.$.personLookupQuery.findById(personId, fallbackAddress, fallbackService);
	},
	
	_gotPerson: function(inSender, inResponse) {
		this.doGotPerson((inResponse && inResponse.person) || undefined);
	},

	_onGotPhonecalls: function(inSender, inResponse, inRequest) {
		var phoneCalls = (inResponse && inResponse.results) || [];

		// CASE: no calls left in 'all calls', delete it
		if ( phoneCalls.length === 0 ) {
			this.$._onlyDeleteCallLog.call({"ids": [this.allGroupId] });
		
		// CASE: update calls in 'all calls'
		} else {
			var propsCallback;
			
			propsCallback = function(group) {
				return {
					callcount: phoneCalls.length,
					timestamp: phoneCalls[0].timestamp,
					recentcall_address: DBModels.PhoneCall.getRemoteAddress(phoneCalls[0]),//future.result[0]),
					recentcall_type: phoneCalls[0].type
				};
			}.bind(phoneCalls);
			
			this.$.smartMerge.execute(DBModels.PhoneCallGroup.dbKindId, this.allGroupId, propsCallback, null);
		}
	},
	
	updateVvmReadMessage: function(id) {
		var propsCallback = function(vvm) {
			vvm.readMessage = true;
			return vvm;
		};
		
		var callback = enyo.hitch(this, function() {
			enyo.log("smartMerge completed.");
		});

		this.$.smartMerge.execute(DBModels.Voicemail.dbKindId, id, propsCallback, callback);
	},
	
	updateVvmSaveMessage: function(id) {
		var propsCallback = function(vvm) {
			vvm.saveMessage = true;
			return vvm;
		};

		var callback = enyo.hitch(this, function() {
			enyo.log("smartMerge completed.");
		});

		this.$.smartMerge.execute(DBModels.Voicemail.dbKindId, id, propsCallback, callback);
	},
	
	clearVvmSaveMessage: function(id) {
		var propsCallback = function(vvm) {
			vvm.saveMessageResult = "none";
			return vvm;
		};

		var callback = enyo.hitch(this, function() {
			enyo.log("smartMerge completed.");
		});

		this.$.smartMerge.execute(DBModels.Voicemail.dbKindId, id, propsCallback, callback);
	},
	
	clearVvmErrorCode: function(id) {
		var propsCallback = function(mailbox) {
			mailbox.error = "";
			return mailbox;
		};

		var callback = enyo.hitch(this, function() {
			enyo.log("smartMerge completed.");
		});

		this.$.smartMerge.execute(DBModels.Voicemail.mailBoxDbKindId, id, propsCallback, callback);
	},
})
