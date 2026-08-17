/*globals enyo */

enyo.kind({
	name: "FavoriteItem",
	kind: "SwipeableItem",
	confirmCaption: $L("Remove"),
	layoutKind: "HFlexLayout",
	components: [
		{name: "imageContainer", style: "display: inline-block;", components: [
			{className: "contact-image-border"},
			{name: "contactImage", kind: "Image", className: "contact-image"}
		]},
		{name: "status", className: "status status-buddy"},
		{className:"message-summary", components: [		
			{name: "contactName", className:"contact-name-box contact-name", align: "center"},
			{name: "statusMessage", className: "status-message"},
			{name: "contactMessage", className: "contact-message"}
		]}
	],
	create: function() {
		this.inherited(arguments);
		this.addClass("contactItem"); 
	},
	updateContactName: function(inFavorite) {
		var displayName = enyo.messaging.person.getDisplayName(inFavorite);
		this.$.contactName.setContent(enyo.messaging.message.removeHtml(displayName));
	},
	updateStatus: function(ims) {
		var bestAvailability = this.getBestAvailability(ims);
		var statusClass = "";
		
		if (bestAvailability !== undefined) {
			statusClass = "status-" + enyo.messaging.im.availabilityClasses[bestAvailability];
		}
		
		this.$.status.setClassName("status status-buddy " + statusClass);
		
		// update status message 
		this.$.statusMessage.setContent(enyo.messaging.message.removeHtml(this.getStatusMessage(ims)));
	},
	updateContactImage: function(inPerson) {
		this.$.contactImage.setAttribute("src", enyo.messaging.person.getDisplayImage(inPerson));
	},
	updateAccounts: function(inFavorite) {
		if (enyo.messaging.person.hasMessagingAccounts(inFavorite) || enyo.messaging.person.hasSMSAccounts(inFavorite)) {
			this.$.contactMessage.setContent("");
		} else {
			// if there is no IM/SMS accounts, show the message to let user know to add contact info
			this.$.contactMessage.setContent(FavoriteConstants.NO_IM_ACCOUNS_MESSAGE);
			this.$.statusMessage.setContent("");
			this.$.contactName.setClassName("contact-name contact-name-no-messaging-account");
		}
	},
	setFavorite: function(inFavorite) {
		//enyo.log("#@#@ favorite: ", inFavorite);
		this.updateContactName(inFavorite);
		this.updateContactImage(inFavorite);
		this.updateAccounts(inFavorite);
		this.updateStatus(inFavorite.ims);
	},
	
	/***********************************
	 * Functions below are unit tested *
	 ***********************************/	
	getBestAvailabilityImsIndex: function(ims) {
		var index;
		var bestAvailability;
		if (ims) {
			for (var i = 0; ims && i < ims.length; i++) {
				if (bestAvailability === undefined || ims[i].availability < bestAvailability) {
					index = i;
					bestAvailability = ims[i].availability;
				}
			}
		}
		return index;
	},
	getBestAvailability: function(ims) {
		var bestAvailability;
		if (ims) {
			var index = this.getBestAvailabilityImsIndex(ims);
			bestAvailability = index !== undefined ? ims[index].availability : undefined;
		}
		return bestAvailability;
	},
	getStatusMessage: function(ims) {
		var statusMessage = "";
		if (ims) {
			var index = this.getBestAvailabilityImsIndex(ims);
			if (index !== undefined) {
				statusMessage = ims[index].status || "";
				if (ims[index]._kind === "com.palm.imbuddystatus.libpurple:1") {
					statusMessage = enyo.messaging.message.unescapeText(statusMessage);
				}
			}
		}
		return statusMessage;
	}

});