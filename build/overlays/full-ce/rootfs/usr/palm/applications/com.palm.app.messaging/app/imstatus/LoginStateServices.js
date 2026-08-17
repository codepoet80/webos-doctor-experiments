enyo.kind({
	name: "BaseLoginStateDB",
	kind: "enyo.Component",
	published: {
		loginStates: []
	},
	events: {
		onMerged: ""
	},
	components: [
		{kind: "DbService", onFailure: "fail", components: [
			{name: "stateMerger", method: "merge", onSuccess: "doMerged"}
		]}
	],
	updateAvailability: function(avail) {
		this.$.stateMerger.call(this._getAvailabilityMergeString(avail));
	},
	updateCustomMessage: function(message) {
		var mergeItems = [];
		for(var i=0; i<this.loginStates.length; i++) {
			var loginState = this.loginStates[i];
			var availability = enyo.messaging.imLoginState.getAvailability(loginState);
			if(availability <= enyo.messaging.im.availability.BUSY) {
				mergeItems.push({_id: loginState._id, customMessage: message});
			}
		}		
		if (mergeItems.length > 0) {
			this.$.stateMerger.call({objects: mergeItems});
		}
	},
	_getAvailabilityMergeString: function(avail) {
		return {query: {from: enyo.messaging.imLoginState.dbKind}, props: {availability: avail}};
	}
});

enyo.kind({
	name: "AccountLoginStateDB",
	kind: BaseLoginStateDB,
	published: {
		accountId: undefined
	},
	updateCustomMessage: function(message) {
		this.$.stateMerger.call({objects: [{_id: this.accountId, customMessage: message}]});
	},
	_getAvailabilityMergeString: function(avail) {
		return {objects: [{_id: this.accountId, availability: avail}]};
	}
});