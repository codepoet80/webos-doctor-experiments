/**
	Wish list:
	* Add persistent mru support
*/
enyo.kind({
	name: "enyo.AddressingList",
	kind: enyo.VFlexBox,
	published: {
		/* Address types as defined by the contacts schema that should be
		 * returned for each contact.
		 *
		 * Options are one or more of "emails", "phoneNumbers", and "ims"
		 */
		addressTypes: null,
		imTypes: null,
		selected: null,
		galDelay: 500,
		minGalSearchLimit: 2
	},
	events: {
		/**
		Event fires when an address is selected; in addition to inSender, fires with:
		
		inDisplayAddress {Object} The selected address 

		inAddress {Object} The contact record for the selected address
		*/
		onSelect: "",
		onVideoCall: "",
		onSetupHeader: ""
	},
	filterHighlightClassName: "enyo-text-filter-highlight",
	//* @protected
	components: [
		{kind: "DbPages", onQuery: "dbPagesQuery", onReceive: "receiveDbPage", size: 500},
		{kind: "DbService", dbKind: "com.palm.person:1", onSuccess: "querySuccess", onFailure: "gotFailure", components: [
			{name: "find", method: "find", onSuccess: "gotPageResults"},
			{name: "search", method: "search", onSuccess: "gotSearchResults"},
			{name: "get", method: "get"}
		]},
		{kind: "GalService", onSuccess: "gotGalResults", onFailure: "gotFailure"},
		{name: "list", flex: 1, kind: "VirtualList", className: "enyo-addressing-list", 
			onAcquirePage: "listAcquirePage", onDiscardPage: "listDiscardPage", onSetupRow: "listSetupRow", pageSize: 500, components: [
			{name: "client", canGenerate: false},
			{kind: "Divider", allowHtml: true},
			{name: "addressList", kind: "VirtualRepeater", onSetupRow: "addressGetItem", components: [
				{kind: "Item", tapHighlight: true, onclick: "selectItem", components: [	 
				 	{layoutKind: "HFlexLayout", components: [
                                                {name: "address", className: "enyo-addressing-address enyo-addressing-padding"},
                                                {name: "status", className: "enyo-addressing-address enyo-addressing-padding"},
                                                {kind: "Spacer"},
						{flex: 0, pack: "end", components: [
							{name: "videoEnabledIcon", className: "enyo-addressing-videoOnline", onclick: "videoButtonClick"},
							{name: "addressType", className: "enyo-addressing-type enyo-addressing-padding enyo-label"},
						]}
					]}
				]}
			]}
		]},
		{name:"noResultsMessage", kind:"VFlexBox", showing:false, flex:1, components:[
			{kind:"Spacer"},
			{content:$L("No search results found"), flex:1, className:"enyo-addressing-noresults"},
		]},
		{kind:"HFlexBox", name:"GalMessage", className:"enyo-addressing-GAL", showing:false, components:[
			{content:$L("Global Address Search"), className:"enyo-addressing-GAL-message enyo-addressing-GAL-padding"},
			{kind:"Spacer"},
			{name:"GalSpinner", kind:"Spinner", className:"enyo-addressing-GAL-spinner enyo-addressing-GAL-padding"}
		]}
	],
	favoriteHtml: '<div class="enyo-addressing-favorite"></div>',
	create: function() {
		this.inherited(arguments);
		this.data = [];
		if (!this.addressTypes) {
			this.addressTypes = ["emails"];
		}
		// FIXME: see fixme at "listRowToPage"
		this.$.list.rowToPage = enyo.bind(this, "listRowToPage");
		this.addressTypesChanged();
	},
	destroy: function() {
		this.cancelSearch();
		this.inherited(arguments);
	},
	addressTypesChanged: function() {
		this.querySelect =
			[
				"_id",
				"favorite",
				"name"
			].concat(this.addressTypes || []);
	},
	updateSelection: function(inEvent) {
		var i = this.$.list.fetchRowIndex();
		var vi = inEvent.rowIndex;
		var r = this.fetchRow(i);
		if (r) {
			var vr = r.displayAddresses[vi];
			this.setSelected({person: r, address: vr});
		} else {
			this.setSelected(null);
		}
	},
	refresh: function() {
		this.$.list.refresh();
	},
	selectItem: function(inSender, inEvent) {
		// user selection so not default.
		this.defaultSelection = false;
		this.updateSelection(inEvent);
		var s = this.getSelected();
		if (s) {
			this.doSelect(s);
			//enyo.asyncMethod(this, "doSelect", s);
		}
		this.refresh();
	},
	videoButtonClick: function(inSender, inEvent){
		this.defaultSelection = false;
		this.updateSelection(inEvent);
		var s = this.getSelected();
		if (s){
			this.doVideoCall(s);
		}
		this.refresh();
	}, 
	editContact: function(inSender, inContact) {
		this.$.get.call({
			ids: [inContact.contactId]
		});
	},
	//* @public
	/** 
	Initiate a address search. 
	First, we query for favorites because they should always be shown at the top of the list.
	Then if inSearch is specified we do an un-paged filter search for up to 200 local contacts and 
	add up to 100 gal contacts per account.
	If inSearch is not specified, we do a paged search for all local contacts.
	*/
	search: function(inSearch) {
		this.cancelSearch();
		this.isFiltering = this.searchString = inSearch || "";
		// first get favorites...
		this.searchForFavorites();
	},
	cancelSearch: function() {
		this.data = [];
		this.setSelected(null);
		this.defaultSelection = true;
		this.$.find.cancel();
		this.$.search.cancel();
		enyo.job.stop(this.id + "galCall");
		this.$.galService.cancel();
		this.showGalSpinner(false);
	},
	//* @protected
	showGalSpinner: function(inShowing){
		// always hide noResults, because we don't know if the message is real yet
		this.$.noResultsMessage.hide();
		this.$.GalMessage.setShowing(inShowing);
		this.$.GalSpinner.setShowing(inShowing);
		this.$.list.resized();
	},
	searchForFavorites: function() {
		this.searchForFilterLocal(this.searchString, true, 200, {onSuccess: "gotFavorites"});
	},
	gotFavorites: function(inSender, inResponse) {
		this.data = inResponse.results;
		// Show the list, we don't know if we will have results in the future
		this.hideNoResultsMessage(true);
		// punt the list
		this.allowListPaging  = true;
		this.$.list.$.buffer.flush();
		this.allowListPaging = !this.isFiltering;
		this.$.list.punt();
		// If we're not filtering and therefore paging data, the list will take care of 
		// retrieving its own data pages so do nothing, otherwise do a filter search
		if (this.isFiltering) {
			this.searchForFilter();
		}
	},
	searchForFilter: function() {
		this.hideNoResultsMessage(true);
		if (this.searchString.length >= this.minGalSearchLimit) {
			this.showGalSpinner(true);
			enyo.job(this.id + "galCall", enyo.bind(this, "_searchGAL"), this.galDelay);
		}
		this.searchForFilterLocal(this.searchString, false, 200);
	},
	_searchGAL: function() {
		this.$.galService.call({filterString: this.searchString, addressTypes: this.addressTypes});
	},
	searchForFilterLocal: function(inSearch, inFavorites, inLimit, inRequestInfo) {
		var query = {
			orderBy: "sortKey",
			desc: false,
			select: this.querySelect,
			where: []
		}
		if (inLimit) {
			query.limit = inLimit;
		}
		if (inSearch) {
			query.where.push({prop: "searchProperty", op: "?", val: inSearch, collate: "primary"});
		}
		query.where.push({prop: "favorite", op: "=", val: inFavorites || false});
		this.$.search.call({query: query}, enyo.mixin({favorites: inFavorites}, inRequestInfo));
	},
	gotSearchResults: function(inSender, inResponse, inRequest) {
		this.data = this.data.concat(inResponse.results);
		this.hideNoResultsMessage(Boolean(this.data.length))
		this.$.list.refresh();
	},
	gotGalResults: function(inSender, inResponse) {
		this.showGalSpinner(false);
		this.data = this.data.concat(inResponse.results);
		this.hideNoResultsMessage(Boolean(this.data.length))
	},
	hideNoResultsMessage: function(inResults) {
		if (inResults) {
			this.$.noResultsMessage.hide();
			this.$.list.show();
		} else {
			this.$.noResultsMessage.show();
			this.$.list.hide()
		}
		this.$.list.resized();
	},
	gotFailure: function(inSender, inResponse) {
		this.showGalSpinner(false);
		enyo.error("Contact lookup failed: ", (inResponse && inResponse.errorText));
	},
	// list paging query/response
	dbPagesQuery: function(inSender, inQuery) {
		inQuery.select = this.querySelect;
		inQuery.orderBy = "sortKey";
		inQuery.where = [{prop: "favorite", op: "=", val: false}];
		return this.$.find.call({
			query: inQuery
		});
	},
	gotPageResults: function(inSender, inResponse, inRequest) {
		this.$.dbPages.queryResponse(inResponse, inRequest);
		this.$.list.refresh();
	},
	// FIXME: VirtualList could expose an api for this...
	// since paged list contains non-paged data, we need to adjust
	// the calculation of rowToPage
	listRowToPage: function(inRowIndex) {
		var pageIndex = Math.floor((inRowIndex - this.data.length) / this.$.list.pageSize);
		return pageIndex;
	},
	listAcquirePage: function(inSender, inPage) {
		if (this.allowListPaging) {
			this.$.dbPages.require(inPage);
		}
	},
	listDiscardPage: function(inSender, inPage) {
		if (this.allowListPaging) {
			this.$.dbPages.dispose(inPage);
		}
	},
	// data processing for list
	fetchRow: function(inIndex) {
		//return this.$.dbPages.fetch(inIndex);
		if (inIndex < this.data.length) {
			return this.data[inIndex];
		} else {
			return this.$.dbPages.fetch(inIndex - this.data.length);
		}
	},
	listSetupRow: function(inSender, inIndex) {
		var d = this.fetchRow(inIndex);
		//enyo.log(inIndex + " Row data = " + enyo.json.stringify(d));
		// Show controls only on first row when filtering.
		var showHeader = Boolean(this.isFiltering && inIndex == 0);
		this.$.client.canGenerate = showHeader;
		
		if (showHeader) {
			this.doSetupHeader();
		}
		if (d) {
			enyo.addressing.appendContactDisplayAddresses(d, this.addressTypes, this.imTypes);
			this.repeaterPerson = d;
			// if there's more than one address, show a divider
			if (d.displayAddresses.length) {
				var dn = d.displayName ? d : enyo.addressing.generateDisplayName(d);
				d.displayName = dn.displayName;
				this.$.addressList.canGenerate = true;
				this.$.divider.canGenerate = true;
				this.$.divider.show();
				var dn = d.displayName;
				dn = enyo.string.removeHtml(dn).unescapeHTML(); 
				if (this.searchString) {
					dn = enyo.string.applyFilterHighlight(dn, this.searchString, this.filterHighlightClassName);
				}
				if (d.favorite) {
					dn += this.favoriteHtml;
				}
				//enyo.log("Divider Caption = " + dn);
				this.$.divider.setCaption(dn);
				// setup selection
				if (!this.selected && this.isFiltering) {
					this.selected = {person: d, address: d.displayAddresses[0]};
				}
			} else {				
				this.$.addressList.canGenerate = false;
				this.$.divider.canGenerate = false;
				this.$.divider.hide();
			}
			return true;
		}
		return showHeader;
	},
	addressGetItem: function(inSender, inIndex) {
		var displayAddresses = this.repeaterPerson.displayAddresses;
		var itemAddress = displayAddresses[inIndex];
		//enyo.log(inIndex + " Row address =  " + enyo.json.stringify(itemAddress));
		if (itemAddress) {
			var s = inIndex == 0 ? "border-top: 0;" : "";
			s += (inIndex == displayAddresses.length-1 ? "border-bottom: 0;" : "");
			this.$.item.addStyles(s);
			this.$.item.addRemoveClass("enyo-addressing-item-selected", 
				this.selected && (this.repeaterPerson == this.selected.person) && (itemAddress == this.selected.address));
				
				
			//enyo.log("address.formattedValue = " + itemAddress.formattedValue + "; address.label = " + itemAddress.label);
			this.$.videoEnabledIcon.hide();
			this.$.address.setContent(itemAddress.formattedValue);
			this.$.addressType.setContent(itemAddress.label);
			
			//if the address is a skype type, show the online status and video availability  
			if (itemAddress.type === "type_skype") {
				var buddy;
				if (itemAddress.value && enyo.application.Cache.skypeBuddyCache) {
					buddy = enyo.application.Cache.skypeBuddyCache.getBuddyInfoFromUsername(itemAddress.value);
				}
				if (buddy) {
					if (buddy.hasVideoCapability === true) {
						this.$.videoEnabledIcon.show();
					}

					statusStr = "";   
					var color = "#888";
					if (buddy.personAvailability == 0) { // online
						// enyo.log(buddy.displayName + " is online !!");
						statusStr = "("+$L("Available")+")";
						color = "#7FBB55";

					} else if (buddy.personAvailability == 2) { // busy
						//enyo.log(buddy.displayName + " is busy !!");
						statusStr = "("+$L("Busy")+")";
						color = "#AAA";

					} else if (buddy.personAvailability == 4) { // offline
						//enyo.log(buddy.displayName + " is offline !!");
						statusStr = "("+$L("Offline")+")";

					}

					this.$.status.setContent(statusStr);
					this.$.status.applyStyle('color', color);
				} /*else {
					enyo.error("SKYPE buddy status not available");
				}*/
			} else if (itemAddress.type && itemAddress.type.indexOf("type_") === 0) {
				// Other IM transports (whatsapp/telegram/teams/...) have no per-contact video
				// capability cache like Skype's buddy list -- the peer's own client decides
				// whether it can actually receive video, same as it already does for voice, so
				// just offer the button rather than gating on a capability check we don't have.
				this.$.videoEnabledIcon.show();
			}

			return true;
		}
	}
});

String.prototype.unescapeHTML = function() {
	return this.replace(/&amp;/g,'&');//.replace(/&lt;/g,'<').replace(/&gt;/g,'>');
};
