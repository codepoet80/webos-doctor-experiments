enyo.kind({
	name: "ConversationService",
	kind: enyo.Service,
	requestKind: "ConversationRequest",
	events: {
		onWatch: ""
	}});

enyo.kind({
	name: "ConversationRequest",
	kind: enyo.Request,
	events: {
		onWatch: "doWatch"
	},
	components: [
		{kind: "DbService", onFailure: "fail", components: [
			{name: "messages", dbKind: "com.palm.message:1", method: "find", onSuccess: "gotMessages", subscribe: true, onWatch: "doWatch"/*, resubscribe: true, reCallWatches: true*/}
		]}/*,
		{name: "mockMessages", kind: "MockDb", dbKind: "com.palm.message:1", method: "find", onSuccess: "gotMessages", onFailure: "fail", onWatch: "doWatch"}*/
	],
	create: function() {
		this.inherited(arguments);
	},
	/*
	initComponents: function() {
		this.inherited(arguments);
		if (!window.PalmSystem) {
			this.$.messages = this.$.mockMessages;
		}
	},
	*/
	finish: function() {
		// don't destroy automatically, so we can see watches
	},
	call: function() {
		this.$.messages.cancel();
		this.$.messages.call(this.params);
	},
	reply: function() {
		this.receive(this.data);
	},
	fail: function(inSender, inResponse) {
		enyo.log(inResponse);
		this.reply();
	},
	gotMessages: function(inSender, inResponse) {
		this.data = inResponse;
		//update list as soon as got data
		this.reply();
	}
});