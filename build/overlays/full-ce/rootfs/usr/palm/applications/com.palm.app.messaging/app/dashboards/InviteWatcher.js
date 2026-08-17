enyo.kind({
	name: "InviteWatcher",
	kind: enyo.Component,
	components: [
		{kind: "DbService", onFailure: "fail", components: [
			{dbKind: "com.palm.imcommand:1", components: [
				{name: "inviteCommandFinder", method: "find", onSuccess: "foundInviteCommands", subscribe: true, resubscribe: true, reCallWatches: true},
				{name: "inviteCommandDeleter", method: "del"}
			]},
			{dbKind: "com.palm.iminvitation:1", components: [
				{name: "invitationFinder", method: "find", onSuccess: "foundInvites"},
				{name: "invitationAdder", method: "put"}
			]}
		]}
	],
	create: function() {
		this.inherited(arguments);
		this.queryIMCommands();
	},
	queryIMCommands: function() { 
		enyo.log("Querying IM commands to find buddy invite");
		
		this.$.inviteCommandFinder.call({
			query: {
				where: [{
					prop: "command",
					op: "=",
					val: "receivedBuddyInvite"
				}, {
					prop: "handler",
					op: "=",
					val: "application"
				}]
			}
		}); // foundInviteCommands
	},
	foundInviteCommands: function(inSender, inResponse) {
		enyo.log("Got invite response: ", (inResponse || inResponse.results));
		delete this.pendingCommands;
		this.pendingCommands = {};
		
		if (inResponse && inResponse.results) {
			for (var i = 0; i < inResponse.results.length; i++) {
				var command = inResponse.results[i];
				this.pendingCommands[command._id] = command;
			}
			
			this.queryImInvitations(this.pendingCommands);
		}
	},
	queryImInvitations: function(pendingCommands) {
		var commandIds = [];
		for (var key in this.pendingCommands) {
			commandIds.push(key);
		}
		
		// try to look up if buddy invites already exist or the given set of imcommand ids
		this.$.invitationFinder.call({
			query: {
				where: [{
					prop: "commandId",
					op: "=",
					val:  commandIds
				}]
			}
		}); // foundInvites
	},
	foundInvites: function(inSender, inResponse) {
		this.removeProcessedCommands(this.pendingCommands, inResponse && inResponse.results);
		this.addPendingInvites(this.pendingCommands);
	},
	removeProcessedCommands: function(pendingCommands, foundInvites) {
		for (var i = 0; foundInvites && i < foundInvites.length; i++) {
			if (pendingCommands[foundInvites[i].commandId]) {
				// if buddy invite has been added already, remove it from
				// the pending invite command so that we won't add the same 
				// buddy invite twice
				delete pendingCommands[foundInvites[i].commandId];
			}
		}
	},
	addPendingInvites: function(pendingCommands) {
		enyo.log("Creating IM invitations for the following pending invite commands: ", pendingCommands);
		var invites = [];
		for (var id in pendingCommands) {
			var command = pendingCommands[id];
			var account = this.getIMAccount(command);
			
			if (account) {
				invites.push(this.createInvite(command, account));
			} else {
				enyo.error("The imcommand for adding buddy '", command.fromUsername, 
					"' can not be processed since an IM account doesn't exist for serive='", 
					command.serviceName, "' and username='", command.targetUsername, 
					"').  So delete this command from database.");
				this.$.inviteCommandDeleter.call({
					ids: [command._id]
				});
			}
		}
		
		if (invites.length > 0) {
			this.$.invitationAdder.call({
				objects: invites
			});
		}
	},
	createInvite: function(command, account) {
		return {
			_kind: "com.palm.iminvitation:1",
			folder: enyo.messaging.message.FOLDERS.INBOX,
			status: "successful",
			serviceName: command.serviceName,
			localTimestamp: Date.now(),
			from: {
				addr: command.fromUsername
			},
			to: [{
				addr: command.targetUsername
			}],
			commandId: command._id,
			accepted: "pending",
			messageText: this.getInviteText(command, account),
			username: account.username,
			accountId: account.accountId
		};
	},
	getInviteText: function(command, account, displayName) {
		var params = command.params;
		var accountName = account ? ", " + account.username + "," : "";
		var messageText = (params && params.message) ? enyo.string.removeHtml(params.message) : undefined;
		var template, text; 
		
		if (params && messageText && displayName) {
			template = new enyo.g11n.Template($L("Your account#{accountName} received an invitation from #{name} #{addr} with the message, \"#{msg}\"."));
			text = template.evaluate({
				accountName: accountName,
				name: displayName,
				addr: command.fromUsername,
				msg: messageText
			});
		} else if (params && messageText) {
			template = new enyo.g11n.Template($L("Your account#{accountName} received an invitation from #{addr} with the message, \"#{msg}\"."));
			text = template.evaluate({
				accountName: accountName,
				addr: command.fromUsername,
				msg: messageText
			});			
		} else if (displayName) {
			template = new enyo.g11n.Template($L("Your account#{accountName} received an invitation from #{name} #{addr}."));
			text = template.evaluate({
				accountName: accountName,
				name: displayName,
				addr: command.fromUsername
			});
		} else {
			template = new enyo.g11n.Template($L("Your account#{accountName} received an invitation from #{addr}."));
			text = template.evaluate({
				accountName: accountName,
				addr: command.fromUsername
			});
		}
		
		return text;
	},
	getIMAccount: function(command){
		var ims = enyo.application.accountService.getCleanedImAccounts();
		var account = undefined;
		for (var i = 0, a; ims && i < ims.length; i++) {
			if (this.isSameIMAccount(command, ims[i])) {
				if (account) {
					// if there are more than one IM account that matches the service name
					// and user name pair, we should not display the account name.
					return undefined;
				} else {
					account = ims[i];
				}
			}
		}
		return account;
	},
	isSameIMAccount: function(command, im) {
		if (command.serviceName !== im.serviceName) {
			return false;
		}
		
		var targetUsername = command.targetUsername;
		var imAccountName = im.username;
		if (targetUsername === imAccountName) {
			return true;
		}
		
		/**
		 * If target user name is not an email address, then we need to use the 
		 * user name prefix of the email address from the IM account and compare
		 * it to the target user name.  So 'bob.dole' should match 'bob.dole@company.com'
		 * but not 'bob@company.com'.     
		 */
		var accountUsername = imAccountName.replace(/\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/, "");
		return targetUsername === accountUsername;
	}
});
