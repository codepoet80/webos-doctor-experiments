enyo.kind({
	name: "DeleteBuddyService",
	kind: "enyo.Component",
	published: {
		buddy: undefined
	},
	events: {
		onDeleteThread: ""
	},
	components: [
		{kind: "DbService", onFailure: "fail", components: [
		    {name: "personFinder", method: "get", onSuccess: "gotPerson"},
			{name: "contactFinder", method: "get", onSuccess: "gotContacts"},
			{name: "threadFinder", dbKind: enyo.messaging.thread.dbKind, method: "find", onSuccess: "gotThreads"}
		]},
		{name: "deleteService", kind: "DeleteThreadService"}
	],
	deleteBuddy: function() {
		if (this.buddy.person && this.buddy.person.contactIds) {
			// get all the contact records that are linked for this person
			this.$.contactFinder.call({
				ids: this.buddy.person.contactIds
			});
		} else {
			if (this.buddy.personId) {
				this.$.personFinder.call({
					ids: [this.buddy.personId]
				});
			} else {
				enyo.error("Can't delete buddy", this.buddy._id, "with no personId!");
			}
		}
	},
	gotPerson: function(inSender, inResponse) {
		if (inResponse.results.length > 0) {	
			var person = inResponse.results[0];	
			// get all the contact records that are linked for this person
			this.$.contactFinder.call({
				ids: person.contactIds
			});
		} else {
			enyo.error("Can't delete buddy", this.buddy._id, "with no person record!");
		}
	},
	gotContacts: function(inSender, inResponse) {
		var contacts = inResponse.results;
		contacts.forEach(this.addDeleteBuddy.bind(this));
		this.deleteBuddyThreads();
	},
	addDeleteBuddy: function(contact) {
		if (contact.imBuddy) {
			new DeleteBuddyCommand().deleteContact(contact, enyo.application.accountService);
		}
	},
	deleteBuddyThreads: function() {
		this.$.threadFinder.call({
			query: {
				where: [{
					      prop: "personId",
					      op: "=",
					      val: this.buddy.personId
				       }],
				select: [
				          "_id"
				        ]
			}
		});
	},
	gotThreads: function(inSender, inResponse){
		var results = inResponse.results;
		// set the thread id to each deleted buddy 	
		for (i = 0; i < results.length; i++) {
			var thread = results[i];
			this.deleteThread(thread);
		}
	}, 
	deleteThread: function(thread) {
		this.$.deleteService.setId(thread._id);
		this.$.deleteService.deleteThread();
		this.doDeleteThread(thread);
	}
});

enyo.kind({
	name: "DeleteBuddyCommand",
	kind: "enyo.Component",
	components: [
		{kind: "DbService", onFailure: "fail", components: [
			{name: "accountFinder", method: "get", onSuccess: "gotAccount"},
			{name: "deleteCommand", dbKind: "com.palm.imcommand:1", method: "put"}
		]}
	],
	deleteContact: function(contact, accountService) {
		this.contact = contact;
		this.accountService = accountService;
		
		// get IM account so that we can get the value for 'fromUsername'
		this.$.accountFinder.call({
			ids: [this.contact.accountId]
		});
	},
	gotAccount: function(inSender, inResponse) {
		var account = inResponse.results[0];
		var ims  = this.contact.ims;
		 
		for (var i = 0; ims && i < ims.length; i++) {
			this.doDeleteCommand(ims[i].value, ims[i].type, account.username);	
		}
	}, 
	doDeleteCommand: function(targetUsername, serviceName, fromUsername) {
		enyo.log("Creating ImCommand to delete buddy: {", targetUsername, ", ", serviceName, ", ", fromUsername, "}");
		if (!targetUsername || !serviceName || !fromUsername) {
			enyo.warn("Found invalid parameter to delete a buddy");
			return;
		}
		
		// create IM command to delete the contact
		this.$.deleteCommand.call({
			objects: [{
				_kind: this.accountService.getImCommandKind(serviceName), 
				command: "deleteBuddy",
				handler: "transport",
				targetUsername: targetUsername,
				fromUsername: fromUsername,  
				serviceName: serviceName
			}]
		});
	}
});
