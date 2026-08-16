enyo.kind({
	name: "Recents",
	kind: SavedList,
	published: {
		hideClearButton: false
	},
	dbKind: "com.palm.mapsrecents:1",
	components: [
		{kind: "HFlexBox", components: [
			{flex: 1},
			{kind: "Button", caption: $L("Clear"), onclick: "deleteAllItems"}
		]}
	],
	create: function() {
		this.inherited(arguments);
		this.hideClearButtonChanged();
		this.$.list.setDesc(true);
	},
	hideClearButtonChanged: function() {
		this.$.button.setShowing(!this.hideClearButton);
	},
	updateQuery: function(inQuery) {
		inQuery.orderBy = "date";
	},
	generateItem: function(inTitle, inLocation) {
		var r = this.inherited(arguments);
		return enyo.mixin(r, {date: (new Date()).getTime()})
	},
	addItem: function(inTitle, inLocation) {
		var q = {
			from: this.dbKind,
			where: [{prop:"title",op:"=",val:inTitle}]
		}
		if (window.PalmSystem || enyo.WebosConnect) {
			this.$.dbDel.call({query: q});
		} else {
			for (var i=0, r; r=this.$.mockDb.data[i]; i++) {
				if (r.title == inTitle) {
					this.$.mockDb.data.splice(i, 1);
					break
				}
			}
		}
		this.inherited(arguments);
	}
})