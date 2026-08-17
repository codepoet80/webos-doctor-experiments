enyo.kind({
	name: "DeleteThreadService",
	kind: "enyo.Component",
	published: {
		id: null
	},
	components:[
		{name: "dbDelete", kind: "DbService", dbKind: "com.palm.db", method: "del"},
		{name: "dbMerge", kind: "DbService", dbKind: "com.palm.db", method: "merge"},
		{name: "messageServiceFind", kind: "DbService", dbKind: "com.palm.message:1", method: "find", onSuccess: "gotMessageForDelete"}
	],
	deleteThread: function() {
		if (!this.id) {
			enyo.log("Unable to delete chat thread since no id is provided");
			return;
		}	
		
		// Inform the DashboardManagers that this thread has been removed.
		enyo.application.messageDashboardManager.removeThread(this.id);
		enyo.application.inviteDashboardManager.removeThread(this.id);
			
		this.$.dbDelete.call({
				ids: [this.id]
		});		
		this.deleteMessageForThread();
	},
	deleteMessageForThread: function(){
		this.$.messageServiceFind.call({
				query: {
					where: [{
						      prop: "conversations",
						      op: "=",
						      val: this.id
					       }],
					select: [
					          "_id",
					          "_kind",
					          "conversations"
					        ]
				}
			});
	},
	gotMessageForDelete: function(inSender, inResponse){
		if (inResponse.returnValue && inResponse.results && inResponse.results.length > 0) {
			var message;
			for (var i = 0; i < inResponse.results.length; i++) {
				message = inResponse.results[i];
				var params = this.getMergeParams(message);
				if (params && params.objects) {
					this.$.dbMerge.call(params);
				}
				else {
					if (message._kind === "com.palm.mmsmessage:1") {
					//todo: delete attachments for mms on phone 
					//future = enyo.messaging.MMS.deleteAttachments(message._id);
					}
					
					//delete message
					this.$.dbDelete.call({
						ids: [message._id]
					});
				}
			}
		}
	},
	/***********************************
	 * Functions below are unit tested *
	 ***********************************/
	getMergeParams: function(message){
		if (message.conversations.length > 1) {
			//need merge the db by remove chatThreadId
			var newConversations = [];
			for (var j = 0; j < message.conversations.length; j++) {
				if (message.conversations[j] !== this.id) {
					newConversations.push(message.conversations[j]);
				}
			}
			return {
				objects: [{
					"_id": message._id,
					"conversations": newConversations
				}]
			};
		}
		return undefined;
	}
});
