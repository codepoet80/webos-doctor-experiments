enyo.kind({
	name: "BlockPersonService",
	kind: "enyo.Component",
	published: {
		thread: null
	},
	components: [
		{kind: "DbService", components:[
			{name: "messageFinder", dbKind: "com.palm.message:1", method: "find", onSuccess: "gotMessage"},
			{name: "dbAdder", dbKind: "com.palm.imcommand:1", method: "put"}
		]}
	],
	blockPerson: function() {
		this.$.messageFinder.call({
			query: {
				where: [{
					      prop: "conversations",
					      op: "=",
					      val: this.thread._id
				       }],
				select: [
				        "username"
				       ]
			}
		});
	},
	gotMessage: function(inSender, inResponse) {
		this.addBlockBuddy(inResponse.results[0]);
	},
	addBlockBuddy: function(data) {
		enyo.log("BlockPersonService::addBlockBuddy::thread: ",this.thread);
		this.$.dbAdder.call({
			objects: [{
				_kind: enyo.application.accountService.getImCommandKind(this.thread.replyService),
				command: "blockBuddy",
				params: { block: true },
				handler: "transport",
				targetUsername: this.thread.replyAddress,
				fromUsername: data.username,
				serviceName: this.thread.replyService
			}]
		});
	}
});
