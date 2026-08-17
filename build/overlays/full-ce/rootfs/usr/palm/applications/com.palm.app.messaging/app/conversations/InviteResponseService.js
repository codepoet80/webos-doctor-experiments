enyo.kind({
	name: "InviteResponseService",
	kind: "enyo.Component",
	components: [
		{kind: "DbService", onFailure: "faile", components: [
			{dbKind: "com.palm.imcommand:1", components: [
				{name: "commandMerger", method: "merge", onSuccess: "mergedCommand"}
			]},
			{dbKind: "com.palm.iminvitation:1", components: [
				{name: "inviteMerger", method: "merge", onSuccess: "mergedInvite"}
			]},
			{dbKind: "com.palm.immessage:1", components: [
				{name: "responseAdder", method: "put"}
			]}
		]}
	],
	responseToInvite: function(invite, accepted) {
		this.invite = invite;
		this.accepted = accepted;
		
		// update IMCommand so that transport will process the accepted/rejected buddy invitation
		this.$.commandMerger.call({
			objects: [{
				_id: this.invite.commandId,
				params: { "accept": this.accepted },
				handler: "transport"
			}]
		});
	},
	mergedCommand: function() {
		// update ImInvitation so that messaging app can update the conversation item
		this.$.inviteMerger.call({
			objects: [{
				_id: this.invite._id,
				accepted: this.accepted ? "accepted" : "rejected"
			}]
		});
	},
	mergedInvite: function(inSender, inResponse) {
		var messageText;
		var from = this.invite.from;
		if (!from.name) {
			from.name = "";
		} else {
			from.name = from.name + " ";;
		}
		var template;
		if (this.accepted) {
			template = new enyo.g11n.Template($L("Accepted Invitation from #{name}#{address}"));
		} else {
			template = new enyo.g11n.Template($L("Rejected Invitation from #{name}#{address}"));
		}
		messageText = template.evaluate({name: from.name, address: from.addr});
		
		// also create a acceptance/rejection message back to the person 
		this.$.responseAdder.call({
			objects: [{
				_kind: "com.palm.immessage:1",
				folder: "outbox",
				status: "successful",
				"messageText": messageText,
				"serviceName": this.invite.serviceName,
				"localTimestamp": Date.now(),
				"from": this.invite.to[0],
				"to": [this.invite.from],
				"imType": "system"
			}]
		});
	}
});
