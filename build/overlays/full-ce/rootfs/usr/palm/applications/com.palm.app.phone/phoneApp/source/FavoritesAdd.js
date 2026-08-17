enyo.kind({
	name: "FavoritesAdd",
	kind: enyo.VFlexBox,
	className: "phone-background favorite-add",	
	published: {
	},
	events: {
		onFilterContacts: "",
	},
	components: [
		// UI
		{kind: enyo.HFlexBox, className: "details-header", components: [
			{name: "headerIcon", kind: enyo.Image, className: "add-favorites-header-icon", src: "../phoneApp/images/FavoritesAdd/icon-add-fav.png"},
			{kind: enyo.VFlexBox, components: [
				{name: "headerLabel", kind: enyo.Label, className: "add-favorites-header-label", content: $L("Add To Favorites")},
				{name: "headerSubLabel", kind: enyo.Label, className: "subtitle", showing: false, content: $L("Choose a default number")},
			]}
		]},
		// searchField Needed becuase showSearchBar: true of com.palm.library.contactsui.personListWidget isn't working in phone
		{name: "_srchField", className: "search fav-add-searchField", width:"100%", kind: "enyo.Input", onchange: "onchangeFilter", hint: $L("Search"), 
			autoCapitalize: "lowercase", autocorrect: false, spellcheck: false, disabled: false, changeOnInput: true,
			components: [
				{name: "searchImg", kind: "Image", src: "$palm-themes-Onyx/images/search-icon.png", style: "display: block", onclick: "onSearchIconClicked"}
		]},
		{name: "personList", flex: 1, height: "100%", kind: "com.palm.library.contactsui.personListWidget", 
			showSearchBar: true, showAddButton: false, showIMStatuses: false, showFavStars: false,
			mode: "noFavoritesOnly", onContactClick: "onContactClick"},
		// TODO: phoneList is temporary until we have a "default contact point picker" from the ContactsUI, remove it and relevant associated code once it is available
		{name: "phoneScroller", kind: "Scroller", flex: 1, showing: false, components: [
			{name: "phoneList", kind: "VirtualRepeater", onSetupRow: "getPhoneListItem", components: [
				{name: "phoneItem", kind: enyo.Item, className: "palm-row-wrapper", onclick: "onPhoneItemClick", components: [
					{kind: "HFlexBox", style: "font-size: 18px;", components: [
						{name: "phoneLabel", className: "phoneNumberLabel", wantsEvents: false},
						{name: "phoneType", className: "phoneNumberType rightAligned", wantsEvents: false},
					]},
				]},
			]},
		]},
		{name: "cancelFavoriteAdd", kind: "Button", content: $L("Cancel"), showing: true, onclick: "handleCancelFavoriteAdd"},

		// Services
		{name:"favoritePersonPersonService", kind:"PalmService", service: "palm://com.palm.service.contacts/", method: "favoritePerson", subscribe: false, onSuccess: "setFavPersonSuccess", onFailure: "setFavPersonFailed",},
		{name:"setFavoriteDefaultService", kind:"PalmService", service: "palm://com.palm.service.contacts/", method: "setFavoriteDefault", subscribe: false, onSuccess: "setFavDefaultSuccess", onFailure: "setFavDefaultFailed",}
	],
	create: function(params) {
		this.inherited(arguments);
		this.$.personList.addClass("fav-add-list");
		this.$.personList.$.list.$.photo.addClass("contactlist-item-photo");
		this.$.personList.$.list.$.photoMask.setClassName("contactlist-mask");
		this.$.personList.$.searchField.hide(); // Hide it in case it comes back
		this.handleLaunch();
	},
	handleLaunch: function() {
		this.skypeIMs = [];
		var params = enyo.windowParams;
		if (params.context.person) {
			this.person = params.context.person;
			var len = this.person.ims.length;
			for (var i = 0; i < len; i++) {
				if (this.person.ims[i].type === "type_skype") {
					this.skypeIMs.push(this.person.ims[i]);
				}
			}
			this.showSetDefaultPhNumberUI();
		}
	},
	onchangeFilter: function (inSender, inEvent) {
		this.searchString = this.$._srchField.getValue();
		this.$.personList.$.list.setSearchString(this.searchString);
		this.$.personList.refresh();
	},
	showSetDefaultPhNumberUI: function() {
		this.$.phoneScroller.setShowing(true);
		this.$.personList.setShowing(false);
		this.$._srchField.hide();
		this.$.headerIcon.setShowing(false);
		this.$.headerLabel.setContent(enyo.application.Utils.PersonDisplayName(this.person));
		this.$.headerSubLabel.setShowing(true);
		this.$.phoneList.render();
	},
	getPhoneListItem: function(inSender, inIndex) {
		if (this.person) {
			var phNumbersLen = this.person.phoneNumbers.length;
			if (inIndex < phNumbersLen) {
				this.$.phoneLabel.setContent(enyo.application.Utils.FormatPhoneNumber(this.person.phoneNumbers[inIndex].value));
				this.$.phoneType.setContent(enyo.application.Utils.getPhoneNumberType(this.person.phoneNumbers[inIndex].type));
				return true;
			} else if (inIndex < (phNumbersLen + this.skypeIMs.length)) {
				this.$.phoneLabel.setContent(this.skypeIMs[inIndex - phNumbersLen].value);
				this.$.phoneType.setContent(enyo.application.Utils.contactPointLabels["type_skype"][0]);
				return true;
			}
		}
	},
	onContactClick: function(inSender, person) {
		this.person = person;
		this.$.favoritePersonPersonService.call({
			'personId': person._id
		});
		
		// For a better user experience don't wait for the call to favoritePersonPersonService to return success or failure
		// Go ahead and determine the next screen transition now.
		var bShowFavorites = false;
		var nPhone = this.person.phoneNumbers.length;
		if (nPhone <= 1) {
			// The user has 0 or 1 phone number then there is no default number to set
			bShowFavorites = true;
		}
		else if (nPhone > 1) {
			var nPhoneIndex = 0;
			while (nPhoneIndex < nPhone) {
				var phoneNumber = this.person.phoneNumbers[nPhoneIndex];
				if (phoneNumber.favoriteData["com.palm.app.phone"]) {
					// There is a default number, go back to the favorites view
					bShowFavorites = true;
					break;
				}
				nPhoneIndex++;
			}
		}
		
		if (bShowFavorites === true) {
			enyo.application.UI.enter("favorites");
		} else {
			this.showSetDefaultPhNumberUI();
		}
	},
	onPhoneItemClick: function(inSender, inEvent) {
		var address;
		var contactPtType;
		var phNumbersLen = this.person.phoneNumbers.length;
		if (inEvent.rowIndex < phNumbersLen) {
			address = this.person.phoneNumbers[inEvent.rowIndex].value;
			contactPtType = "contact_point_type_phoneNumber";
		} else if (inEvent.rowIndex < (phNumbersLen + this.skypeIMs.length)) {
			address = this.skypeIMs[inEvent.rowIndex - phNumbersLen].value
			contactPtType = "contact_point_type_imAddress";
		}

		if (address) {
			this.$.setFavoriteDefaultService.call({
				defaultData: { value: address, listIndex: inEvent.rowIndex, contactPointType: contactPtType},
				personId: this.person._id
			});
		}

		// Neither setFavDefaultSuccess or setFavDefaultFailed is being called, even though the service call completes sucessfully.  Thefore go back to the favorites view here.
		enyo.application.UI.enter("favorites");
	},
	setFavPersonSuccess: function() {		
		this.setFavPersonComplete();		
	},
	setFavPersonFailed: function(inSender, response) {
		// TODO: Display a error message to the user?????
		// Go ahead and go back to the favorites scene for now, on the latest phone Build we are getting the following error (but the contact is still tagged as an favorite)
		// 2010-12-16T17:38:54.396525Z [12264] qemux86 user.notice LunaSysMgr: {LunaSysMgrJS}: com.palm.app.phone: Encountered an error: {"errorText":"palm://com.palm.db/find {\"query\":{\"from\":\"com.palm.person.speeddialbackup:1\",\"where\":[{\"prop\":\"contactBackupHash\",\"op\":\"=\",\"val\":\"Local|~~:(!)~~++HMXRcKGCtr2hAB\"}]}}: db: permission denied","errorCode":-3963,"exception":{"message":"palm://com.palm.db/find {\"query\":{\"from\":\"com.palm.person.speeddialbackup:1\",\"where\":[{\"prop\":\"contactBackupHash\",\"op\":\"=\",\"val\":\"Local|~~:(!)~~++HMXRcKGCtr2hAB\"}]}}: db: permission denied","stack":"Error: palm://com.palm.db/find {\"query\":{\"from\":\"com.palm.person.speeddialbackup:1\",\"where\":[{\"prop\":\"contactBackupHash\",\"op\":\"=\",\"val\":\"Local|~~:(!)~~++HMXRcKGCtr2hAB\"}]}}: db: permission denied\n    at Object.create (/usr/palm/frameworks/foundations/version/1.0/javascript/structure/err.js:5:17)\n    at /usr/palm/frameworks/foundations/version/1.0/javascript/comms/palmcall.js:156:16\n    at Future.<anonymous> (/usr/palm/fram
		this.setFavPersonComplete();
		enyo.log("Encountered an error: " + (response ? JSON.stringify(response) : ""));
	},
	setFavPersonComplete: function() {
		var bShowFavorites = false;
		var nPhone = this.person.phoneNumbers.length;
		if (nPhone <= 1) {
			// The user has 0 or 1 phone number then there is no default number to set
			bShowFavorites = true;
		}
		else if (nPhone > 1) {
			var nPhoneIndex = 0;
			while (nPhoneIndex < nPhone) {
				var phoneNumber = this.person.phoneNumbers[nPhoneIndex];
				if (phoneNumber.favoriteData["com.palm.app.phone"]) {
					// There is a default number, go back to the favorites view
					bShowFavorites = true;
					return;
				}
				nPhoneIndex++;
			}
		}

		if (bShowFavorites)
			enyo.application.UI.enter("favorites");
		else
			this.showSetDefaultPhNumberUI();
	},
	setFavDefaultSuccess: function() {
		enyo.application.UI.enter("favorites");
	},
	setFavDefaultFailed: function() {
		// TODO: Display a error message to the user?????
		enyo.application.UI.enter("favorites");
	},
	handleCancelFavoriteAdd: function() {
		var searchStr = this.$._srchField.getValue();
		if ( searchStr && searchStr.length > 0 ) {
			this.$._srchField.setValue("");
			this.onchangeFilter();
		}			
		enyo.application.UI.enter("favorites");
	}
});
