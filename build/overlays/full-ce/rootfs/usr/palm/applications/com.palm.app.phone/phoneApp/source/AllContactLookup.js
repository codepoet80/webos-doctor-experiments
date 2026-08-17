enyo.kind({
	name: "AllContactLookup",
	kind: enyo.VFlexBox,    
	className: "contact-list",
	components: [
		{name: "textInput", kind: "SearchInput", spellcheck: false, autocorrect: false, changeOnKeypress: true, keypressChangeDelay: 200, onchange: "showContacts", onCancel: "showContacts"},
		{kind: "AddressingList", flex: 1, addressTypes: ["phoneNumbers", "ims"], imTypes: ["type_skype"], onSelect: "addressSelected", onSetupHeader: "maybeShowDialButton", components: [
			{name:"divider", kind: "Divider", className: "enyo-addressing-item-divider", caption:$L("Dial")},
			{name:"dialShortcutValue", kind: "Item", className: "enyo-single", onclick:"handleEnterKey", className:"enyo-addressing-item-selected"}
		]}
	],
	handleLaunch: function(params) {
		this.$.textInput.setValue(params.value || "");
		if (enyo.application.Utils.getKeyBoardType() !== undefined) {
			this.$.textInput.forceFocus();
		}
		this.showContacts();
	},
	showContacts: function() {
		// Offer a call row for every enabled PHONE-capable service (whatsapp/telegram/signal/...),
		// not just the legacy hardcoded Skype type. Empty list => only phone numbers are shown.
		this.$.addressingList.imTypes = enyo.application.CallSynergizer.getCallableImTypes();
		this.$.addressingList.search(this.$.textInput.getValue(), false);
	},
	maybeShowDialButton: function(inSender) {
		var curVal = this.$.textInput.getValue();
		var numericEquivalent = this._getNumericKeyboardEquivalent(curVal);
		if ( numericEquivalent ) {
			this.$.divider.canGenerate = this.$.dialShortcutValue.canGenerate = true;
			this.$.dialShortcutValue.setContent(numericEquivalent);
			this.dialButtonValue = numericEquivalent;
			
			// set a bogus list selection so it doesn't add one.
			if (inSender.defaultSelection) {
				inSender.setSelected({});
			}
		} else {
			this.$.divider.canGenerate = this.$.dialShortcutValue.canGenerate = false;
		}
	},
	// helper returns numeric equivalent for str, otherwise false if no numeric equivalent
	_getNumericKeyboardEquivalent: function(str) {
		var i, digits, keyJson, map;
		if ( window.PalmSystem ) {
			digits = []
			for (i=0;i < str.length; i++) {
				keyJson = PalmSystem.getDeviceKeys(str.charCodeAt(i));
				map = enyo.json.parse(keyJson)
				if ( /\d/.test(map.opt) ) {
					digits.push(map.opt);
				} else {
					return false;
				}
			}
			return digits.join("");
		} else { // browser
			return str;
		}
    },
	// The keydown handler prevents the changeOnKeypress in the textInput from firing, therefore we need to async call showContacts as a work-around
	keydown: function(e) {
		if ( e.keyCode == 13 ) { // enter key
			this.handleEnterKey();
		} else {
			if (!this.$.textInput.hasFocus()) {
				this.$.textInput.forceFocus();			
				
				if (e.keyCode === 8) { // backspace key
					var curVal = this.$.textInput.getValue();
					if (curVal.length > 0) {
						this.$.textInput.setValue(curVal.slice(0, -1));
						enyo.asyncMethod(this, "showContacts");
					}
				} else {
					var keyEvent = enyo.application.Utils.keyFromEvent(e);
					if (keyEvent) {
						this.$.textInput.setValue(this.$.textInput.getValue() + keyEvent);
						enyo.asyncMethod(this, "showContacts");
					}
				}
			} else {
				
				// handle backspace when field is empty
				if (e.keyCode === 8 && this.$.textInput.getValue() == "") {
					enyo.application.UI.event('back');
				} else {
					enyo.asyncMethod(this, "showContacts");
				}
			}
			
		}
	},
	handleEnterKey: function() {
		var selected;
		if ( this.$.divider.canGenerate ) {
			enyo.application.CallSynergizer.dial(this.dialButtonValue, undefined, undefined, enyo.application.CallSynergizer.TRANSPORTS.TIL, undefined, true);
		} else {
			selected = this.$.addressingList.getSelected();
			if (selected) {
				this.addressSelected(undefined, selected)
			}
		}
	},
	addressSelected: function(inSender, inSelected) {
		// For an IM contact-point (type_whatsapp/type_telegram/...) dial via its own transport;
		// CallSynergizer.dial() translates the serviceName to the account templateId. Phone numbers
		// leave the transport unset so DialProxy/_guessTransport picks the right one.
		var transport;
		if ( inSelected.address.type && inSelected.address.type.indexOf("type_") === 0 ) {
			transport = inSelected.address.type;
		} else {
			transport = undefined;
		}
		enyo.application.CallSynergizer.dial(inSelected.address.value, undefined, undefined, transport, inSelected.person._id, true);
	},
	back: function() {
		var curVal = this.$.textInput.getValue();
		this.$.addressingList.cancelSearch();
		if (curVal.length > 0) {
			this.$.textInput.setValue('');
			this.showContacts();
			return true; // handled event
		}
	}
});
