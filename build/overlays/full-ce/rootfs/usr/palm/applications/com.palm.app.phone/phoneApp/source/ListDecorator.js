enyo.kind({
	name: "ListDecorator",
	kind: enyo.Component,
	events: {
		onDecorationComplete: "",
	},
	components: [
		{name:"personQuery", kind:"DbService", method:"get", dbKind: "com.palm.person:1", onSuccess: "personQuerySuccess", onFailure: "personQueryFailure"},
	],

	constructor: function() {
		this.inherited(arguments);
		this.resetItems();
	},
	
	itemsChanged: function() {
		//enyo.asyncMethod(this, "getDecor");
	},
	
	decorate: function() {
		if (this.idsCollection.length > 0) {
			var q = {
				ids: this.idsCollection
			};
			this.$.personQuery.call(q);
		}
	},
	
	personQuerySuccess: function(inSender, inResponse, inRequest) {
		var personList = (inResponse && inResponse.results) || [];
		var len = personList.length;
		for (var i = 0; i < len; i++) {
			var person = personList[i];
			if (this.itemsToBeDecorated[person._id]) {
				var drawerItems = this.itemsToBeDecorated[person._id].drawerItems;
				for (var j = 0; j < drawerItems.length; j++)
				{
					// This really stinks that I can't do this!!
					//drawerItems[j].setIsAFavoriteContact(true);
					//drawerItems[j].render();

					this.itemsToBeDecorated[person._id].favorite = person.favorite;
					
					// TODO: Replace this code from the contacts library when it is available...????
					//person.getPhotos().getPhotoPath(enyo.application.Libs.Contacts.PersonPhotos.TYPE.LIST, true);				
					this.itemsToBeDecorated[person._id].listPhotoPath = (person.photos.listPhotoPath && person.photos.listPhotoPath.length > 0)
																			? person.photos.listPhotoPath
																			: "";

					this.itemsToBeDecorated[person._id].phoneNumbers = person.phoneNumbers;
					
					if (this.itemsToBeDecorated[person._id].favorite === true || this.itemsToBeDecorated[person._id].listPhotoPath || this.itemsToBeDecorated[person._id].phoneNumbers) {
						// The list is currently refilling, cancel the decoration
						if (this.doDecorationComplete(this.itemsToBeDecorated[person._id]) === false)
							break;
					}
				}
			}
		}
	},
	
	personQueryFailure: function(inSender, inResponse, inRequest) {
		enyo.log("personQueryFailure: " + inResponse.errorText);
	},
	
	resetItems: function() {
		this.idsCollection = [];
		this.itemsToBeDecorated = [ ];
	},
	
	addItem: function(inPersonId, inItemIndex, inDrawerItem) {
		if (this.itemsToBeDecorated[inPersonId]) {
			// Just item 
			this.itemsToBeDecorated[inPersonId].drawerItems.push(inDrawerItem);
			this.itemsToBeDecorated[inPersonId].itemIndexes.push(inItemIndex);
		}
		else {
			this.idsCollection.push(inPersonId);
			this.itemsToBeDecorated[inPersonId] = { drawerItems: [inDrawerItem], itemIndexes: [inItemIndex] };
		}
	},
});
