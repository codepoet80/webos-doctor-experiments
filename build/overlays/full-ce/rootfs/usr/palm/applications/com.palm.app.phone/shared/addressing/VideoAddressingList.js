/**
	Wish list:
	* Add persistent mru support
*/
enyo.kind({
	name: "VideoAddressingList",
	kind: enyo.VFlexBox,
	flex: 1,
	published: {
		/* Address types as defined by the contacts schema that should be
		 * returned for each contact.
		 *
		 * Options are one or more of "emails", "phoneNumbers", and "ims"
		 */
		addressTypes: null,
		imTypes: null,
		selected: null,
		showVideo: false
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
		//{kind: "DbPages", onQuery: "dbPagesQuery", onReceive: "receiveDbPage", size: 20},

		//favorites
		{kind: "DbService", dbKind: "com.palm.person:1", name: "findTempDB", method: "find", onSuccess: "gotTempDBFavSearchResults", onFailure: "gotFailure", subcribe: true, onWatch: "watchfavoritesChange"},

		// Other PHONE-capable IM transports (whatsapp/telegram/teams/...) have no presence/
		// video-capability cache like Skype's imbuddystatus table -- list every contact-point
		// for a currently callable type unconditionally (see gotOtherImContacts), same
		// generalization CallSynergizer.getCallableImTypes()/Dialer.js already apply to voice.
		{kind: "DbService", dbKind: "com.palm.person:1", name: "findOtherImContacts", method: "find", onSuccess: "gotOtherImContacts", onFailure: "gotFailure"},

		{kind: enyo.TempDbService, dbKind: "com.palm.imbuddystatus.skypem:1", onSuccess: "querySuccess", onFailure: "gotFailure", components: [
			{name: "find", method: "find", onSuccess: "VCgotSkypeBuddies"},
			{name: "search", method: "search", onSuccess: "VCgotSkypeBuddies"},
			{name: "get", method: "get"}
		]},
		//{kind: "GalService", onSuccess: "gotGalResults", onFailure: "gotFailure"},
		{name: "list", flex: 1, kind: "VirtualList",
			/*onAcquirePage: "listAcquirePage", onDiscardPage: "listDiscardPage",*/ onSetupRow: "listSetupRow", pageSize: 20, components: [
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
		]},
		
		{name: "dbSkypeBuddiesVC", kind: enyo.TempDbService, dbKind: "com.palm.imbuddystatus.skypem:1", method: "find", subscribe: false, onSuccess: "VCgotSkypeBuddies"},
	],
	favoriteHtml: '<div class="enyo-addressing-favorite"></div>',
	create: function() {
		this.inherited(arguments);

		this.data = [];
		if (!this.addressTypes) {
			this.addressTypes = ["emails"];
		}
		// FIXME: see fixme at "listRowToPage"
		//this.$.list.rowToPage = enyo.bind(this, "listRowToPage");
		this.addressTypesChanged();

		//Get favorites from database
		this.tempDBFavdata = [];
		var query = {
			from: "com.palm.person:1",
			orderBy: "sortKey",
			desc: false,
			select: ["_id", "favorite", "ims"],
			where: [{prop: "favorite", op: "=", val: true}],
		}
		this.$.findTempDB.call({query: query});

		// Other PHONE-capable IM transports, merged alongside the Skype buddy list below.
		this.skypeVideoContacts = [];
		this.otherImContacts = [];
		this.$.findOtherImContacts.call({query: {from: "com.palm.person:1", select: ["_id", "displayName", "ims"]}});

		//subscribe to skype availability status change
		this.tempdbContacts = [];
		this._updateBuddyStatusAddressing = enyo.hitch(this, "updateBuddyStatusAddressing");
		// webOS: Skype gone -> skypeBuddyCache may be absent; guard so this doesn't NPE (see Dialer.js).
		if (enyo.application.Cache.skypeBuddyCache) {
			enyo.application.Cache.skypeBuddyCache.registerBuddyStatus(this._updateBuddyStatusAddressing);
		}
		
		//Get skype temp db contacts
		//this.$.dbSkypeBuddiesVC.call();

	},
	destroy: function () {
	
		//this.$.dbSkypeBuddiesVC.cancel();
	
		if(enyo.application.Cache.skypeBuddyCache) {
			enyo.application.Cache.skypeBuddyCache.unregisterBuddyStatus(this._updateBuddyStatusAddressing);
		}
		this.cancelSearch();
				
		this.inherited(arguments);
	},
	watchfavoritesChange: function() {
		//dont do anything here 
	},
	gotTempDBFavSearchResults: function(inSender, inResponse) {
		this.tempDBFavdata = (inResponse && inResponse.results) || [];
		this.updateBuddyStatusAddressing();
	},
	// Provider-agnostic: match by username across any IM type (whatsapp/telegram/signal/teams/skype/...),
	// not just type_skype - so favorites work the same for every video-capable transport.
	getFavoriteFromUsername: function(username) {
		for (var i = 0; i < this.tempDBFavdata.length; i++) {
			for (var j = 0; j < this.tempDBFavdata[i].ims.length; j++) {
				if(this.tempDBFavdata[i].ims[j].value == username) {
					return true;
				}
			}
		}
		return false;
	},
	updateBuddyStatusAddressing: function () {
		if (this.isFiltering) {
			this.searchForFilterLocal(this.searchString, false, 200);
		}
		else {
			this.$.dbSkypeBuddiesVC.call();
		}
	},
	VCgotSkypeBuddies: function(inSender, inResponse, inRequest) {

		var contactsData = (inResponse && inResponse.results) || [];

		this.toggleNoResults(contactsData.length)
		var itemsArrayFav = [];
		var itemsArraynonFav = [];
		if (contactsData && contactsData.length > 0) {
			//contactsData.forEach(function(row) {
			var skypeBuddiesTotal = contactsData.length;
			for (var i = 0; i < skypeBuddiesTotal; i++) {
				//enyo.error(enyo.json.stringify(contactsData[i]));
				if (contactsData[i].hasVideoCapability === true && contactsData[i].offline === false) {
					contactsData[i].favorite = this.getFavoriteFromUsername(contactsData[i].username);
					contactsData[i].displayAddresses = [{
						"type": contactsData[i].serviceName,
						"label": "Skype",
						"formattedValue": contactsData[i].username,
						"value": contactsData[i].username
					}];
					if(contactsData[i].favorite) {
						itemsArrayFav.push(contactsData[i]);
					} else {
						itemsArraynonFav.push(contactsData[i]);
					}

				}
			}
		}
		this.skypeVideoContacts = itemsArrayFav.concat(itemsArraynonFav);
		this.tempdbContacts = this.skypeVideoContacts.concat(this.otherImContacts || []);
		this.$.list.refresh();
	},
	// Other PHONE-capable IM transports (whatsapp/telegram/teams/...): no presence/video-capability
	// cache like Skype's imbuddystatus table exists for these, so list every contact-point for a
	// currently callable type unconditionally -- the peer's own client decides whether it can
	// actually receive video, same as it already does for voice.
	gotOtherImContacts: function(inSender, inResponse) {
		var callableTypes = enyo.application.CallSynergizer.getCallableImTypes();
		var results = (inResponse && inResponse.results) || [];
		var itemsArrayFav = [];
		var itemsArraynonFav = [];
		for (var i = 0; i < results.length; i++) {
			var c = results[i];
			if (!c.ims) { continue; }
			for (var j = 0; j < c.ims.length; j++) {
				var im = c.ims[j];
				if (!im || im.type === "type_skype") { continue; } // Skype already covered above
				if (callableTypes.indexOf(im.type) === -1) { continue; }
				var row = {
					personId: c._id,
					displayName: c.displayName,
					favorite: this.getFavoriteFromUsername(im.value),
					// updateSelection() (below) reads these flat, same shape as a skype row,
					// not displayAddresses -- keep both in sync.
					username: im.value,
					serviceName: im.type,
					displayAddresses: [{
						"type": im.type,
						"label": im.type.replace("type_", ""),
						"formattedValue": im.value,
						"value": im.value
					}]
				};
				(row.favorite ? itemsArrayFav : itemsArraynonFav).push(row);
			}
		}
		this.otherImContacts = itemsArrayFav.concat(itemsArraynonFav);
		this.tempdbContacts = (this.skypeVideoContacts || []).concat(this.otherImContacts);
		this.toggleNoResults(this.tempdbContacts.length);
		this.$.list.refresh();
	},
	addressTypesChanged: function() {
		this.querySelect =
			[
				"_id",
				"hasVideoCapability",
				"offline",
				"personId",
				"displayName",
				"serviceName",
				"personAvailability",
				"username"
			];
	},
	updateSelection: function(inEvent) {
		var i = this.$.list.fetchRowIndex();
		var vi = inEvent.rowIndex;
		var r = this.fetchRow(i);
		this.setSelected({personId: r.personId, address: {value: r.username, type:r.serviceName}});
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
		this.isFiltering = this.searchString = inSearch.toLowerCase() || "";
		// first get favorites...
		this.updateBuddyStatusAddressing();
		//this.searchForFavorites();
	},
	cancelSearch: function() {
		this.data = [];
		this.setSelected(null);
		this.defaultSelection = true;
		this.$.find.cancel();
		this.$.search.cancel();
		//this.$.galService.cancel();
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
		this.searchForFilterLocal(this.searchString, true, null, {onSuccess: "gotFavorites"});
	},
	gotFavorites: function(inSender, inResponse) {
		//enyo.log("debug-and-remove: gotFavo "+enyo.json.stringify(inResponse.results));
		this.data = inResponse.results;
		enyo.log("debug-and-remove: this.data has "+this.data.length);
		// Show the list, we don't know if we will have results in the future
		this.toggleNoResults(true);
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
		//enyo.log("debug-and-remove: searchForFilter");
		this.toggleNoResults(true);
		this.showGalSpinner(true);
		//this.$.galService.call({filterString: this.searchString, addressTypes: this.addressTypes});
		this.searchForFilterLocal(this.searchString, false, 200);
	},
	searchForFilterLocal: function(inSearch, inFavorites, inLimit, inRequestInfo) {
		//enyo.log("debug-and-remove: searchForFilterLocal ");
		var query = {
			select: this.querySelect,
			where: []
		}
		if (inLimit) {
			query.limit = inLimit;
		}
		if (inSearch) {
			query.where.push({prop: "username", op: "%", val: inSearch});
		}
		//query.where.push({prop: "favorite", op: "=", val: inFavorites || false});
		this.$.search.call({query: query});
	},
	gotSearchResults: function(inSender, inResponse, inRequest) {
		this.showGalSpinner(false);
		this.data = this.data.concat(inResponse.results);
		enyo.log("debug-and-remove: data length "+this.data.length);
		//if (this.sortbyStatus) {
			//this.sortbyStatus();
		//}
		this.toggleNoResults(this.data.length)
		this.$.list.refresh();
	},
	/*sortbyStatus: function(){
		var online = [];
		var offline = []; 
		
		for (var i = 0; i<this.data.length; i++){
			var d = this.data[i];
			if (d) {
				enyo.addressing.appendContactDisplayAddresses(d, this.addressTypes, this.imTypes, this.searchString);
				var bShow = false;
				
				if (d.displayAddresses && d.displayAddresses.length) {
					//enyo.log("debug-and-remove: d.displayAddresses.length "+d.displayAddresses.length);
					for (var i = 0; i < d.displayAddresses.length; i++) {
						var itemAddress = d.displayAddresses[i];
						if (itemAddress && itemAddress.type === this.imTypes[0]  && enyo.application.Cache.skypeBuddyCache) {
							//enyo.log("debug-and-remove1: skype contact " + itemAddress.value);
							var buddy = enyo.application.Cache.skypeBuddyCache.getBuddyInfoFromUsername(itemAddress.value);
							if (buddy) {
								//enyo.log("debug-and-remove1: skype buddy username " + buddy.username);
								if (buddy.personAvailability == 0 ||  buddy.personAvailability == 2) {
									online[online.length] = this.data[i]; 
									//enyo.log("debug-and-remove: buddy online " + itemAddress.value);
									
								} else {
									offline[offline.length] = this.data[i]; 
									if (buddy.hasVideoCapability === true) {
										offline[offline.length].video = true;
									}									
									//enyo.log("debug-and-remove: buddy offline " + itemAddress.value);
								}
							}
						} else {
							enyo.log("debug-and-remove: what is the type of ims "+itemAddress.type);
						}
					}
				}
			}			
		}
		if (online.length !== 0){
			this.sortresults(online);
		}
		if (offline.length !== 0){
			this.sortresults(offline); 
		}
		this.data = online.concat(offline); 
	},
	sortresults: function(data) {
		var sortable = [];
		data.forEach(function(a) {
			var va = a.displayName ? a : enyo.addressing.generateDisplayName(a);
			sortable[va] = a; 
		});
		data.sort(function(a, b) {
			var an = a.displayName ? a : enyo.addressing.generateDisplayName(a);
			var bn = b.displayName ? b : enyo.addressing.generateDisplayName(b);
			
			var va = an.displayName, vb = bn.displayName;
			return sortable[vb] - sortable[va];
		});
	}, 

	gotGalResults: function(inSender, inResponse) {
		this.showGalSpinner(false);
		this.data = this.data.concat(inResponse.results);
		this.toggleNoResults(this.data.length)
	},*/
	toggleNoResults: function(inResults) {
		//enyo.log("debug-and-remove: toggle "+inResults);
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
		//enyo.log("debug-and-remove: gotPageResults "+enyo.json.stringify(inResponse)+ " inRequest ");
		this.$.dbPages.queryResponse(inResponse, inRequest);
		this.$.list.refresh();
	},
	// FIXME: VirtualList could expose an api for this...
	// since paged list contains non-paged data, we need to adjust
	// the calculation of rowToPage
	listRowToPage: function(inRowIndex) {
		//enyo.log("debug-and-remove: listRowToPage "+inRowIndex + " data length "+ this.data.length);
		var pageIndex = Math.floor((inRowIndex - this.data.length) / this.$.list.pageSize);
		return pageIndex;
	},
	listAcquirePage: function(inSender, inPage) {
		//enyo.log("debug-and-remove: listAcquirePage "+inPage);
		if (this.allowListPaging) {
			this.$.dbPages.require(inPage);
		}
	},
	listDiscardPage: function(inSender, inPage) {
		//enyo.log("debug-and-remove: listDiscardPage "+inPage);
		if (this.allowListPaging) {
			this.$.dbPages.dispose(inPage);
		}
	},
	// data processing for list
	fetchRow: function(inIndex) {
		enyo.log("debug-and-remove: fetchRow db total "+this.tempdbContacts.length);
		if (inIndex < this.tempdbContacts.length) {
			return this.tempdbContacts[inIndex];
		} 
		return null; 
	},
	listSetupRow: function(inSender, inIndex) {
	
		if(!this.tempdbContacts || inIndex < 0 || inIndex > this.tempdbContacts.length) {
			return;
		}
		
		var d = this.tempdbContacts[inIndex];
		
		//enyo.error("&&&&&&&&&&&&&&&&&&&&&& video addressing listSetupRowTempDb :" + enyo.json.stringify(d));
		var showHeader = Boolean(this.isFiltering && inIndex == 0);
		this.$.client.canGenerate = showHeader;
		
		if (d) {
			this.repeaterPerson = d;
			// if there's more than one address, show a divider
			if (d.displayAddresses && d.displayAddresses.length){
				var dn = d.displayName;
				this.$.addressList.canGenerate = true;
				this.$.divider.canGenerate = true;
				this.$.divider.show();
				dn = enyo.string.removeHtml(dn).unescapeHTML(); 
				if (this.searchString) {
					dn = enyo.string.applyFilterHighlight(enyo.string.escapeHtml(dn), this.searchString, this.filterHighlightClassName);
				}
				if (d.favorite) {
					dn += this.favoriteHtml;
				}
				//enyo.log("Divider Caption = " + dn);
				this.$.divider.setCaption(dn);
				// setup selection
				if (!this.selected && this.isFiltering) {
					this.selected = {personId: d.personId, address: {value: d.username, type:d.serviceName}};
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
		if(!this.repeaterPerson) {
			return;
		}
		var displayAddresses = this.repeaterPerson.displayAddresses;
		var itemAddress = displayAddresses[inIndex];
		//enyo.error(inIndex + " Row address =  " + enyo.json.stringify(itemAddress));
		if (itemAddress) {
			var s = inIndex == 0 ? "border-top: 0;" : "";
			s += (inIndex == displayAddresses.length-1 ? "border-bottom: 0;" : "");
			this.$.item.addStyles(s);
			this.$.item.addRemoveClass("enyo-addressing-item-selected", 
			this.selected && (this.repeaterPerson == this.selected.person) && (itemAddress == this.selected.address));
								
			//enyo.log("address.formattedValue = " + itemAddress.formattedValue + "; address.label = " + itemAddress.label);
			this.$.videoEnabledIcon.show();
			this.$.address.setContent(itemAddress.formattedValue);
			this.$.addressType.setContent(itemAddress.label);
			if (itemAddress.type === "type_skype") {
				
				statusStr = "";
				var color = "#888";
				if (this.repeaterPerson.personAvailability == 0) { // online
					statusStr = "(" + $L("Available") + ")";
					color = "#7FBB55";
					
				}else if (this.repeaterPerson.personAvailability == 2) { // busy
					statusStr = "(" + $L("Busy") + ")";
					color = "#AAA";
						
				} else if (this.repeaterPerson.personAvailability == 4) { // offline
					statusStr = "(" + $L("Offline") + ")";
					
				}
				
				this.$.status.setContent(statusStr);
				this.$.status.applyStyle('color', color);
			}

			return true;
		}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
	}
});

String.prototype.unescapeHTML = function() {
	return this.replace(/&amp;/g,'&');//.replace(/&lt;/g,'<').replace(/&gt;/g,'>');
};
