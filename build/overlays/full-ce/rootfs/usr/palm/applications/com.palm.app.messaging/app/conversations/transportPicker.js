/* Copyright 2010 Palm, Inc.  All rights reserved. */
transportPicker = {
	_selectedTransport: -1,
	_transports: [{disabled: true, caption:$L("Send message to...")}],
	_buddyStatusHash: {},
	availabilityIcons: [
		"images/status-available.png",
		"images/status-available.png",
		"images/status-away.png",
		"images/status-offline.png",
		"images/status-offline.png",
		"images/status-offline.png",
		"images/status-offline.png"
	],
	getSelectedTransport: function() {
		enyo.log("transportPicker::getSelectedTransport::this._selectedTransport:", this._selectedTransport);
		if (this._selectedTransport < 1 || this._selectedTransport >= this._transports.length) {
			enyo.error("****************************** Invalid transport selection=", this._selectedTransport);
			//enyo.error("Available options are: %j", this._transports);
			return {};
		}

		return this._transports[this._selectedTransport];
	},

	getTransports: function() {
		return this._transports;
	},
	setTransportsByChatThread: function(chatThread, listSelectorObj) {
		this._transportSelectorObj = listSelectorObj;
		this._selectedTransport = -1;
		var displayName, secondaryLabel;
		if (!chatThread.replyAddress) {
			displayName = $L("Unknown");
		} else if (enyo.messaging.utils.isTextMessage(chatThread.replyService)) {
			var phonefmt = new enyo.g11n.PhoneFmt({style: "default"});
			displayName = phonefmt.format(new enyo.g11n.PhoneNumber(chatThread.replyAddress));
			secondaryLabel = $L("Text"); //assume it is Mobile since the number isn't associated with a contact
		} else {
			displayName = chatThread.replyAddress; //enyo.string.escapeHtml(chatThread.replyAddress); 
		}
		
		var account = enyo.application.accountService.getAccount(chatThread.replyService);

		if (account) {
			secondaryLabel = account.loc_shortName;
		}
		else{
			enyo.warn("transportPicker::setTransposByChatThread::can't find account based on replyService:", chatThread.replyService);
		}
		
		var transportCommand = this.getTransportId(chatThread.replyAddress, chatThread.replyService);
		
		this._transports = [
		{disabled: true, caption:$L("Send message to...")},
		{kind: "Divider", caption: enyo.messaging.utils.isTextMessage(chatThread.replyService)? $L("SMS ACCOUNT"): secondaryLabel},
		{
			label: secondaryLabel,
			caption: displayName, //enyo.string.escapeHtml(displayName),
			displayName: displayName, //enyo.string.escapeHtml(displayName),
			value: transportCommand,//displayName,
			replyAddress: chatThread.replyAddress,
			normalizedValue: chatThread.normalizedAddress,
			serviceName: chatThread.replyService,
			secondaryLabel: secondaryLabel,
			//availability: enyo.messaging.im.availability.NO_PRESENCE,
			//className: "status-offline",
			icon: this.availabilityIcons[enyo.messaging.im.availability.NO_PRESENCE],
			account: account,
			id: transportCommand
		}];

		this._selectedTransport = 2;
		listSelectorObj.setItems(this._transports);
		listSelectorObj.setValue(this._transports[this._selectedTransport].id);
		if (this._transports[this._selectedTransport].label !== undefined) {
			listSelectorObj.setLabel(this._transports[this._selectedTransport].label);
		}
		else{//edge case: accout was sent from is removed.
			listSelectorObj.setLabel((this._transports[this._selectedTransport].serviceName).slice(5));
		}
	},
	
	setTransportsByPerson: function(headerStatusObj, listSelectorObj, person, chatThread, selectIMTransport, selectIMBuddyStatus ) {
		this._headerStatusObj = headerStatusObj;
		this._transportSelectorObj = listSelectorObj;
		//TODO: if a list of transports already exists and a selection is set, we need to remember that selection
		//and make sure it is still selected after the update
		this._transports = [{disabled: true, caption:$L("Send message to...")}];
		this._selectedTransport = -1;
		
		var i, addr, transport, headerName;
		var validAccountTypes = enyo.application.accountService.getMyAccountTypesHash();
		if(!validAccountTypes){
			enyo.warn("transportPicker::setTransportsByPerson::can't find validAccountTypes");
			setTimeout(this.setTransportsByPerson.bind(this,headerStatusObj, listSelectorObj, person, chatThread, selectIMTransport, selectIMBuddyStatus ), 10);
			return;
		}
		
		//phone numbers
		if (validAccountTypes.sms === undefined) {
			enyo.warn("TransportPicker skipping phone numbers because IMAccounts.getMyAccountTypesHash doesn't contain an SMS entry.");
		} else {
			if (person.phoneNumbers.length > 0) {
				this._transports.push({
					kind: "Divider",
					caption: $L("SMS ACCOUNT")
				});
			}
			for (i = 0; i < person.phoneNumbers.length; ++i) {
				addr = person.phoneNumbers[i];
				if (!addr.value) {
					enyo.error("setTransportsByPerson ignoring person because phone value property is missing");
				} else {
					this._transports.push({
						label: $L("Text"),//enyo.messaging.utils.phoneNumberLabels[addr.type] == undefined ? $L("Text"): enyo.messaging.utils.phoneNumberLabels[addr.type],//ContactsLib.PhoneNumber.Labels.getLabel(addr.type),
						caption: enyo.messaging.utils.formatAddress(addr.value, addr.type),
						displayName: enyo.messaging.utils.formatAddress(addr.value, addr.type),
						value: this.getTransportId(addr.value, "sms"),//addr.value,
						replyAddress: addr.value,
						normalizedValue: enyo.messaging.utils.normalizeAddress(addr.value, addr.type),
						serviceName: "sms", //TODO get this from IMAccounts
						secondaryLabel: ContactsLib.PhoneNumber.Labels.getLabel(addr.type),
						//availability: enyo.messaging..Availability.NO_PRESENCE,
						//className: "status-offline",
						icon: this.availabilityIcons[enyo.messaging.im.availability.NO_PRESENCE],
						account: {},//TODO add "account" property
						id: this.getTransportId(addr.value, "sms")
					});
				}
			}
		}
		
		if (person.ims.length > 0 && person.contactIds.length > 0) {
			//need build IM transport in ConversationList::gotContacts
		}
		else {
			this._headerStatusObj.setClassName("status status-no-presence");
			this.selectBestTransport(chatThread.replyService, chatThread.replyAddress, chatThread.normalizedAddress, listSelectorObj, selectIMTransport, selectIMBuddyStatus);
		}
	},
	setTransportsByContacts: function(headerStatusObj, listSelectorObj, contacts, chatThread, selectIMTransport, selectIMBuddyStatus/*, allowVideo*/){
		enyo.log("transportpicker::setTransportsByContacts contacts.length:", contacts.length);
//todo: need test out
		this._headerStatusObj = headerStatusObj;
		var i, j, contact;
		var validAccountTypes = enyo.application.accountService.getMyAccountTypesHash();
		if(!validAccountTypes){
			enyo.warn("transportpicker::setTransportsByContacts:: can't find validAccountTypes");
			setTimeout(this.setTransportsByContacts.bind(this,headerStatusObj, listSelectorObj, contacts, chatThread, selectIMTransport, selectIMBuddyStatus/*, allowVideo*/), 10);
			return;
		}
		for (i = 0; i < contacts.length; i++) {
			contact = contacts[i];
			for (j = 0; contact.ims && j < contact.ims.length; j++) {
				addr = contact.ims[j];
				if (!addr.value) {
					enyo.error("transportpicker::setTransportsByContacts ignoring contact because IM value property is missing");
					continue;
				}
				// Reach this address on whatever account we have. Prefer the buddy contact's own
				// account (correct when several accounts share one service); otherwise fall back to
				// any account for the address's service type, so a recipient is reachable on a service
				// we have an account for even when they aren't a synced buddy there (e.g. Signal /
				// Telegram / WhatsApp to a phone number). Previously this required contact.imBuddy plus
				// a matching contact.accountId, so only synced buddies (Facebook here) were offered.
				var account = (contact.imBuddy && validAccountTypes[contact.accountId]) || validAccountTypes[addr.type];
				if (!account) {
					enyo.error("setTransportsByContacts ignoring service=", addr.type, " because we don't have an account for it.");
					continue;
				}
				var serviceName = addr.type;
				var normalizedValue = enyo.messaging.utils.normalizeAddress(addr.value, addr.type);
				// de-dupe: the same service+address can be attached to more than one linked contact
				var already = false, di;
				for (di = 0; di < this._transports.length; di++) {
					if (this._transports[di].serviceName === serviceName && this._transports[di].normalizedValue === normalizedValue) {
						already = true;
						break;
					}
				}
				// webOS Telegram: a single user often exposes two identifiers - the numeric "id<userId>"
				// and an "@username" alias (or duplicate id forms across re-syncs) - which otherwise land
				// as two entries for one person. Collapse to a single Telegram entry, preferring the
				// canonical numeric id (always routable) over an alias.
				if (!already && serviceName === "type_telegram") {
					for (di = 0; di < this._transports.length; di++) {
						if (this._transports[di].serviceName !== "type_telegram") {
							continue;
						}
						var existingIsId = /^id\d+$/.test(this._transports[di].normalizedValue);
						var newIsId = /^id\d+$/.test(normalizedValue);
						if (newIsId && !existingIsId) {
							this._transports.splice(di, 1); // drop the alias; add the canonical id below
						} else {
							already = true; // keep the existing (canonical, or first-seen) Telegram entry
						}
						break;
					}
				}
				if (already) {
					continue;
				}
				// Show a human-readable address (WhatsApp/Signal phone number instead of the routable
				// JID/UUID); replyAddress/value below keep the routable id so sending is unaffected.
				var displayAddr = enyo.messaging.utils.formatAddress(addr.value, serviceName);
				var transportEntry = {
					label: account.loc_shortName,
					caption: displayAddr,
					displayName: displayAddr,
					value: this.getTransportId(addr.value, serviceName, account.accountId),
					replyAddress: addr.value,
					normalizedValue: normalizedValue,
					serviceName: serviceName,
					phone: serviceName === "type_skype" ? true : undefined,
					video: serviceName === "type_skype" ? true : undefined,
					icon: this.availabilityIcons[enyo.messaging.im.availability.NO_PRESENCE],
					account: account,
					id: this.getTransportId(addr.value, serviceName, account.accountId)
				};
				// group transports of the same service under a single divider
				var handled = false, k;
				for (k = 0; k < this._transports.length; k++) {
					if (this._transports[k].serviceName === serviceName) {
						this._transports.splice(k + 1, 0, transportEntry);
						handled = true;
						break;
					}
				}
				if (!handled) {
					this._transports.push({
						kind: "Divider",
						caption: account.loc_shortName
					});
					this._transports.push(transportEntry);
				}
			}
		}
		if (this._transports.length > 1) {
//todo: for im only, should not check this._transports.length, instead should be buddy's length, can also move out of transportPicker or in for obj?
			enyo.warn("transportPicker::setTransportsByContacts::call selectBestTransport");
			this.selectBestTransport(chatThread.replyService, chatThread.replyAddress, chatThread.normalizedAddress, listSelectorObj, selectIMTransport, selectIMBuddyStatus);
		}
		else{
			this.setTransportsByChatThread(chatThread, listSelectorObj);
		}
	},
	selectTransportById: function(id) {
		//enyo.log("TransportPickerModel.selectTransportById id=", id);
		if (this._transports.length > 0) {
			var transport = undefined;
			var found = false;
			var i = 0;
			while (found !== true && i < this._transports.length) {
				transport = this._transports[i];
				if (transport.id === id) {
					enyo.log("TransportPickerModel.selectTransportById transport found ", transport.id);
					found = true;
				} else {
					i++;
				}
			}
			
			if (found === true && this._selectedTransport !== i) {
				//enyo.log("TransportPickerModel.selectTransportById old=", this._selectedTransport,", new=" ,i);
				this._selectedTransport = i;
			}
		}
	},

	//TODO: selectBestTransport needs a healthy cleanup to work better with bedlam 
	// TODO: this could be further improved to choose an online transport over one that is offline
	//       when no exact matches are found
	// @param selectIMTransport if set to true, the most online IM address in the transport will be selected
	selectBestTransport: function(serviceName, chatAddress, normalizedChatAddress, listSelectorObj, selectIMTransport, selectIMBuddyStatus) {
	enyo.log("transportpicker::selectBestTransport:serviceName:", serviceName, " chatAddress:", chatAddress, " normalizedChatAddress:", normalizedChatAddress, " selectIMTransport:", selectIMTransport);
		var selectedTransport = -1;
		var data = this._transports;
		if (data.length > 0) {
			var i, transport;
			var serviceIsSms = enyo.messaging.utils.isTextMessage(serviceName);
			if (serviceIsSms && serviceName !== "sms") {
				serviceName = "sms";
			}

			if (!normalizedChatAddress) {
				normalizedChatAddress = enyo.messaging.utils.normalizeAddress(chatAddress, serviceName);
				//enyo.warn("Normalized chat address not supplied, estimating as %s", normalizedChatAddress);
			}
			
			// Special case where the chatview was launched from the buddy list, but the latest
			// chat over a phone number. HI wants this to switch to a IM transport so choose the
			// IM transport with the best availability
			if (selectIMTransport === true) {
				for (i = 0; i < data.length; i++) {
					transport = data[i];
					if (!transport.kind && !transport.disabled) {
						if (transport.serviceName === selectIMBuddyStatus.serviceName && transport.value === selectIMBuddyStatus.username) {
							//enyo.log("match found %i", i);
							selectedTransport = i;
							break;
						}
					}
				}
			}
			
			if (selectedTransport === -1) {
				// selected transport is a phone number
				if (serviceIsSms === true) {
					//enyo.log("TransportPickerModel.selectBestTransport: looking for phone number");
					for (i = 0; i < data.length; i++) {
						transport = data[i];
						if (!transport.kind && !transport.disabled) {
							if (enyo.messaging.utils.isTextMessage(transport.serviceName) === true) {
								// The transport may have a longer normalized phone number (eg, including area code)
								// so just see if the two strings match up to the length of normalizedChatAddress.
								if (transport.normalizedValue.indexOf(normalizedChatAddress) === 0) {
									//enyo.log("match found %i", i);
									selectedTransport = i;
									break;
								}
							}
						}
					}
				}
				else { // transport is IM
					//enyo.log("TransportPickerModel.selectBestTransport: looking for IM addr");
					for (i = 0; i < data.length; i++) {
						transport = data[i];
						if (transport.serviceName === serviceName && transport.normalizedValue === normalizedChatAddress) {
							selectedTransport = i;
							//enyo.log("TransportPicker.selectBestTransport: found IM addr selectedTransport:",selectedTransport," this._selectedTransport:",this._selectedTransport);
							break;
						}
					}
				}
			}
		
			// if there was no match, use a transport of the same type
			// else: just use the first transport as a last resort
			if (selectedTransport === -1) {
				enyo.warn("Unable to match transport that the chat was launched with. Choosing the best one.");
				var foundMatch = false;
				var backupChoice = -1;
				for (i = 0; i < data.length && !foundMatch; i++) {
					transport = data[i];
					if (!transport.kind && !transport.disabled) {
						// match if both are phone numbers (serviceName == sms) or match where the serviceNames are the same (same IM transport)
						if (serviceName === transport.serviceName) {
							//enyo.log("match found %i", i);
							selectedTransport = i;
							foundMatch = true;
						}
						// backup match: both are an IM transport.  We will use this if we cannot match another IM transport with the same serviceName
						if (serviceIsSms === false && enyo.messaging.utils.isTextMessage(transport.serviceName) === false) {
							backupChoice = i;
						}
					}
				}
	
				if (selectedTransport === -1) {
					if (backupChoice !== -1) {
						//enyo.log("No match found. Using backup IM choice %i", i);
						selectedTransport = backupChoice; // use the backup if we have one
					} else {
						//enyo.log("No match found. Selecting first item in list");
						selectedTransport = 2; // only other option is to use the first transport in the array
					}
				}
			}
		} else {
			enyo.error("transportpicker::selectBestTransport::Error, the transport list is empty.");
			selectedTransport = 0;
			this._transports = [{
				username: "Error",
				serviceName: "error",
				availability: enyo.messaging.im.availability.NO_PRESENCE
			}];
		}
		if (selectedTransport !== -1 && this._selectedTransport !== selectedTransport) {
			this._selectedTransport = selectedTransport;
enyo.log("--------transportPicker::selectBestTransports::this._transports:", this._transports[this._selectedTransport]);
			listSelectorObj.setItems(this._transports);
			if (this._transports[this._selectedTransport]) {
				listSelectorObj.setValue(this._transports[this._selectedTransport].id);
				listSelectorObj.setLabel(this._transports[this._selectedTransport].label);
			}
		}
	},
	
	_getBuddyHashKey: function(serviceName, address) {
		return serviceName+(address.toLowerCase());
	},
	
	getBuddyAvailability: function(serviceName, address) {
		var availability = enyo.messaging.im.availability.NO_PRESENCE;
		if (enyo.messaging.utils.isTextMessage(serviceName) === false) {
			var buddy = this._buddyStatusHash[this._getBuddyHashKey(serviceName, address)];
			if (buddy === undefined || buddy.availability === undefined) {
				availability = enyo.messaging.im.availability.OFFLINE;
			} else {
				availability = buddy.availability;
			}
		}
		return availability;
	},
	
	getTransportId: function(addr, serviceName, accountId) {
		var id;
		if (enyo.messaging.utils.isTextMessage(serviceName)) {
			id = "phone_"+addr;
		} else {
			id = "IM_"+addr+":"+serviceName;
		}
		return (accountId ? id+accountId: id);
	},
	
	gotStatus: function(inResponse, statusChangedFn){
		this._buddyStatusHash = {};
		if(inResponse.returnValue && inResponse.results && inResponse.results.length > 0){
			var i, buddy;
			var transportUpdateFn = function(transport) {
				if (transport.serviceName === buddy.serviceName && transport.caption === buddy.username) {
					transport.availability = this.getBuddyAvailability(transport.serviceName, transport.caption);
					transport.icon = this.availabilityIcons[transport.availability];
				}
			}.bind(this);

			for(i = 0; i < inResponse.results.length; ++i) {
				buddy = inResponse.results[i];
				this._buddyStatusHash[this._getBuddyHashKey(buddy.serviceName, buddy.username)] = buddy;
				// Whenever a buddy changes, update the transport for that buddy (copy over availability)
				this._transports.forEach(transportUpdateFn);
				var selection = this._transports[this._selectedTransport];
				if(	selection && selection.serviceName === buddy.serviceName && 
						selection.caption === buddy.username) {
						this._headerStatusObj.setClassName("status status-"+enyo.messaging.im.buddyAvailabilities[this.getBuddyAvailability(buddy.serviceName, buddy.username)]);
						//update buddy status in converstaion list
						statusChangedFn({
							serviceName: buddy.serviceName,
							username: buddy.username,
							availability: this.getBuddyAvailability(buddy.serviceName, buddy.username),
							status: buddy.status,
							_kind: buddy._kind
						});
				}
			}
			this._transportSelectorObj.setItems(this._transports);
		}
		else {
			enyo.error("transportPicker::gotStatus:Failed to get status:payload: ", inResponse.results);
			this._headerStatusObj.setClassName("status status-no-presence");
		}
	}
};

