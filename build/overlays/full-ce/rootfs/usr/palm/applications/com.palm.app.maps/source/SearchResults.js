enyo.kind({
	name: "SearchResults",
	kind: enyo.VFlexBox,
	events: {
		onSelect: ""
	},
	components: [
		{name: "list", kind: "VirtualList", flex: 1, onSetupRow: "listSetupRow", components: [
			{kind: "Item", layoutKind: "HFlexLayout", onclick: "itemClick", className: "searchresults-item", tapHighlight: true, components: [
				{name: "indicator", kind: "VFlexBox", className: "searchresults-item-indicator", components: [
					{name: "num", className: "searchresults-item-num"}
				]},
				{kind: "VFlexBox", components: [
					{name: "title", style: "font-weight: bold; font-size: 15px"},
					{name: "address", style: "color: #7a7a7a;"}
				]}
			]}
		]}
	],
	clear: function() {
		this.renderResults([]);
	},
	renderResults: function(inResults) {
		this.results = inResults;
		this._selected = null;
		this.$.list.refresh();
	},
	listSetupRow: function(inSender, inRow) {
		var r = this.results && this.results[inRow];
		if (r) {
			var n = inRow + 1;
			var cleanTitle = enyo.mapsApp.unMicrosoftString(r.Title);
			var cleanAddress = enyo.mapsApp.unMicrosoftString(r.Address);
			this.$.num.setContent(n);
			this.$.title.setContent(cleanTitle);
			this.$.address.setContent(cleanAddress);
			this.$.indicator.addRemoveClass("selected", this._selected == inRow);
			return true;
		}
	},
	selectItem: function(inRow) {
		this._selected = inRow;
		this.$.list.refresh();
	},
	itemClick: function(inSender, inEvent, inRow) {
		this.selectItem(inRow);
		this.doSelect(this.results[inRow], inRow);
	}
})
