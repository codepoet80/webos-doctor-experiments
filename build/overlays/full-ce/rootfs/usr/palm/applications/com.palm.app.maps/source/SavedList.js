enyo.kind({
	name: "SavedList",
	kind: enyo.VFlexBox,
	published: {
		showDroppedPin: false,
		showMyLocationPin: false
	},
	events: {
		onSelect: "",
		onEmpty: ""
	},
	chrome: [
		{kind: "DbService", onFailure: "dbFail", components: [
			{name: "dbFind", method: "find", subscribe: true, onSuccess: "queryResponse", onWatch: "queryWatch"},
			{name: "dbDel", method: "del"},
			{name: "dbPut", method: "put"}
		]},
		{name: "list", kind: "DbList", flex: 1, onQuery: "listQuery", onSetupRow: "listSetupRow", components: [
			{name: "item", kind: "SwipeableItem", tapHighlight: true, confirmCaption: $L("Delete"), onConfirm: "deleteItem", onclick: "itemClick", components: [
				{name: "title", className: "savedlist-item-title"},
				{name: "details", className: "savedlist-item-details"}
			]}
		]}
	],
	droppedPinItem: {title: enyo.mapsApp.dropPin},
	myLocationPinItem: {title: enyo.mapsApp.myLocation},
	create: function() {
		this.createComponent({kind: "MockDb", dbKind: this.dbKind, onSuccess: "queryResponse", onWatch: "queryWatch", owner: this});
		this.inherited(arguments);
		this.$.dbService.dbKind = this.dbKind;
		this.items = [];
		this.mockDataAvail = this.$.mockDb.data;
	},
	reset: function() {
		this.$.list.reset();
	},
	queryForEmtpy: function() {
		var request = this.listQuery(null, {desc: false, limit: 10});
		request.index = 0;
	},
	isEmpty: function() {
		return !this.items || this.items.length == 0;
	},
	listQuery: function(inSender, inQuery) {
		this.updateQuery(inQuery);
		if (window.PalmSystem || enyo.WebosConnect) {
			return this.$.dbFind.call({query: inQuery});
		} else if (this.mockDataAvail) {
			return this.$.mockDb.call({query: inQuery}, {method: "find"});
		}
	},
	updateQuery: function(inQuery) {
	},
	queryResponse: function(inSender, inResponse, inRequest) {
		var resp = inResponse;
		if (inRequest.index == 0) {
			this.items = inResponse.results;
			if (this.isEmpty()) {
				this.doEmpty();
			}
			this.showDroppedPinChanged();
			this.showMyLocationPinChanged();
			resp = {results: enyo.clone(this.items)};
		}
		this.$.list.queryResponse(resp, inRequest);
	},
	queryWatch: function() {
		this.$.list.reset();
	},
	listSetupRow: function(inSender, inItem, inIndex) {
		this.$.title.content = inItem.title;
		var b = enyo.mapsApp.isReservedLabel(this.$.title.content);
		this.$.title.addRemoveClass("reserved-labeled-value", b);
		this.$.item.setSwipeable(!b);
		this.$.details.content = inItem.address || "";
	},
	itemClick: function(inSender, inEvent) {
		var r = this.$.list.fetch(inEvent.rowIndex)
		this.doSelect(r.location || r.address || r.title, r.title, r.address);
	},
	generateItem: function(inTitle, inLocation) {
		return {
			_kind: this.dbKind,
			title: inTitle,
			address: inLocation ? inLocation.getAddress() : null,
			location: inLocation ? inLocation.getValue() : null
		};
	},
	addItem: function(inTitle, inLocation) {
		var r = this.generateItem(inTitle, inLocation);
		if (window.PalmSystem || enyo.WebosConnect) {
			this.$.dbPut.call({objects: [r]});
		} else if (this.mockDataAvail) {
			r._id = this.$.mockDb.generateId();
			this.$.mockDb.call({objects: [r]}, {method: "put"});
		}
	},
	deleteItem: function(inSender, inIndex) {
		var r = this.$.list.fetch(inIndex);
		r.deleted = true;
		if (window.PalmSystem || enyo.WebosConnect) {
			this.$.dbDel.call({ids: [r._id]});
		} else if (this.mockDataAvail) {
			this.$.mockDb.call({ids: [r._id]}, {method: "del"});
		}
	},
	deleteAllItems: function() {
		var q = {
			from: this.dbKind
		}
		if (window.PalmSystem || enyo.WebosConnect) {
			this.$.dbDel.call({query: q});
		} else if (this.mockDataAvail) {
			this.$.mockDb.data.splice(0, this.$.mockDb.data.length);
			this.$.list.refresh();
		}
	},
	showDroppedPinChanged: function() {
		var i = this.items.indexOf(this.droppedPinItem);
		if (this.showDroppedPin && i < 0) {
			this.items.splice(0, 0, this.droppedPinItem);
		} else if (i > -1) {
			this.items.splice(i, 1);
		}
	},
	showMyLocationPinChanged: function() {
		var i = this.items.indexOf(this.myLocationPinItem);
		if (this.showMyLocationPin && i < 0) {
			this.items.splice(0, 0, this.myLocationPinItem);
		} else if (i > -1) {
			this.items.splice(i, 1);
		}
	}
});
