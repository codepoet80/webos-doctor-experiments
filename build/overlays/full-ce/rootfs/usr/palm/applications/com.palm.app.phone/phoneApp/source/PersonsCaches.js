enyo.kind({
	name: "FavPersonsCache",
	kind: enyo.Component,
	components: [{name: "dbFavoritePersons", kind: "DbService", dbKind: "com.palm.person:1", 
					method: "find", subscribe: true, onSuccess: "_gotFavorites", onWatch: "_gotFavorites"}
	],
	events: {
		onGotFavorites: ""
	},

	create: function() {
		this.inherited(arguments);
		this._getFavorites();
	},
	destroy: function() {
		this.$.dbFavoritePersons.cancel();
		this.inherited(arguments);
	},
	
	_getFavorites: function() {
		var q = {
			where: [{"prop":"favorite","op":"=","val":true}],
			orderBy: "sortKey"
		};
		this.$.dbFavoritePersons.call({query: q});
	},

	_gotFavorites: function(inSender, inResponse, inRequest) {
        if (inResponse.returnValue && inResponse.fired == true) {
			this._getFavorites();
			return;
        } else {	
            var data = (inResponse && inResponse.results) || [];
			this._favorites = [];
			for (var i = 0; i < data.length; i++) {
				var favPerson = data[i];
				// TODO: Right now other source rely on the photoPath, but once they start using the Contact Library the object does not need to be saved
				//       in memory.  Also rename getFavoritePerson to isAFavorite and modify it's usage by other components...
				this._favorites[favPerson._id] = favPerson;
			}

			this.doGotFavorites(data);
        }
	},
	
	getFavoritePerson: function(personId) {
		return this._favorites && this._favorites[personId];
	},
});

enyo.kind({
	name: "PersonsCache",
	kind: enyo.Component,
	events: {
		onPersonCacheReady: "",
	},
	components: [
		{name:"_personQuery", kind:"DbService", method:"get", dbKind: "com.palm.person:1", onSuccess: "_personQuerySuccess", onFailure: "_personQueryFailure"},
	],

	constructor: function() {
		this.inherited(arguments);
		this.resetItems();
	},
	
	resetItems: function() {
		this._personList = [];
		this._idsCollection = [];
	},
	
	addItem: function(inPersonId) {
		if (inPersonId && !this._idsCollection[inPersonId]) {
			this._idsCollection[inPersonId] = inPersonId;
			this._idsCollection.push(inPersonId);
			this.isDirty = true;
		}
	},

	updateCache: function() {
		if (this.isDirty === true) {
			var q = {
				ids: this._idsCollection
			};
			this.$._personQuery.call(q);
		}
	},
	
	getPersonData: function(inPersonId) {
		if (inPersonId) {
			return this._personList[inPersonId];
		}
	},
	
	_personQuerySuccess: function(inSender, inResponse, inRequest) {
		this.isDirty = false;
		var personList = (inResponse && inResponse.results) || [];
		var len = personList.length;
		for (var i = 0; i < len; i++) {
			var person = personList[i];
			// TODO: Replace the photoPath with a call to the contacts library when it is available...????
			var photoPath = (person.photos.listPhotoPath && person.photos.listPhotoPath.length > 0) ? person.photos.listPhotoPath : undefined;

			// Only add the person to the cache if it has relevant data... (Right now the only data needed is the photo path for the person)
			if (photoPath) {
				this._personList[person._id] = { listPhotoPath: photoPath };
			}
		}

		this.doPersonCacheReady();
	},
	
	_personQueryFailure: function(inSender, inResponse, inRequest) {
		this.isDirty = false;
		this._personList = [];
		this.doPersonCacheReady();
	},
});
