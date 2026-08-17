// private widget
enyo.kind({
	name: "Dialer.DialStringWidget",
	kind: enyo.HFlexBox,//"Addressing",
	className: "dialer-addressing dialer-string-empty",
	align: "center",
	published: {
		value: "",
		params: {}
	},
	events: {
		onButtonStatus: "",
		onScrimClick: ""
	},
	components: [
		// Disabled <input>s don't get click events. We need a transparent scrim.
		{name: "clickScrim", className:"dialstring-input-scrim", onclick: "maybeEnableContactLookup"},	
		{name: "client", flex: 1, kind:"Input", className: "dialstring-input", readonly: true, disabled: true},
		{name: "backspaceButton", allowDrag: true, kind:"CustomButton", className: "backspace-button", disabled: false, showing: false, onclick: "handleDelete", onmousehold: "clear", onmouseup: "setButton"},
		{name: "dialingShortcutsSvc", kind: enyo.PalmService, service: enyo.palmServices.system, subscribe: true, method: "getPreferences", onSuccess: "_gotDialingShortcuts", onFailure: "_gotDialingShortcuts"},
		{name:"launchContactsService", kind:"PalmService", service: enyo.palmServices.application, method: "launch", },
	],
	create: function() {
		this.inherited(arguments);
		this.setDefaultText();
		
		this.$.dialingShortcutsSvc.call({"keys": ['4DigitNumber', '5DigitNumber', '6DigitNumber', '7DigitNumber']});
		this.dialingShortcuts = {};
		this.rawString = "";
		this.dialString = "";
		this.lastCallContactData = undefined;
	},
	clear: function() {
		this.setDefaultText();
		this.dialString = "";
		this.rawString = "";
		this.lastCallContactData = undefined;
		this.doButtonStatus(this.dialString != 0);
		this.bShowingContactName = false;
		},
	//separate the button update in onmouseup event to prevent "copy" sign showing up DFISH-6805	
	setButton: function() {
		this.$.backspaceButton.setShowing(this.getValue().length != 0);
		this.$.backspaceButton.setDisabled(this.getValue().length == 0);
	}, 
	setDefaultText: function(){
		this.addClass("dialer-string-empty");	
		this.$.client.$.input.setStyle("");
		this.$.client.setValue($L("Enter number..."));
	},
	setValue: function(inValue) {
		this.rawString = inValue; // the rawString must only contain the digits to be dialed
		this._setValue(this.rawString);
	},
	_setValue: function(inValue, bFormat, bDontShowInContent){
		if (bFormat !== false) {
			inValue = enyo.application.Utils.FormatPhoneNumber(inValue, true);
		}
		this.addClass("dialer-string-empty");
		if (bDontShowInContent !== true) {
			this.doButtonStatus(inValue.length != 0);
		}
		this.$.backspaceButton.setShowing(inValue.length != 0);
		this.$.backspaceButton.setDisabled(false);

		if (!bDontShowInContent)
			this._setDialStringContent(inValue);
			
		this.dialString = inValue;
	},
	setContactName: function(inRecipient) {
		this.bShowingContactName = true;
		this._setValue(inRecipient.addr, true, true);
		this.rawString = inRecipient.addr;
		this._setDialStringContent(inRecipient.name, true);		
		this.personId = inRecipient.personId;
		this.lastCallContactData = inRecipient;
	},
	_setDialStringContent: function(inValue, bTruncateEnd) {
		// TODO: To be tested on a broadway (probably requires changes)...
		var length = inValue.length;
		if(length == 0) {
			this.setDefaultText();                             
			return;
		} else if(length <= 10) {
			this.$.client.$.input.setStyle("font-size: 28px;"); 
		} else if (length >= 11 && length <= 14) {
			this.$.client.$.input.setStyle("font-size: 26px;");
		} else if (length >= 15 && length <= 16) {
			this.$.client.$.input.setStyle("font-size: 24px;");
		} else if (length >= 17 && length <= 18) {
			this.$.client.$.input.setStyle("font-size: 22px;");
		} else if (length >= 19 && length <= 20) {
			this.$.client.$.input.setStyle("font-size: 18px;");
		} else {
			this.$.client.$.input.setStyle("font-size: 18px;");
			if (bTruncateEnd)
				this.leftTruncatedDialString = inValue.slice(0, 20) + "...";
			else
				this.leftTruncatedDialString = "..." + inValue.slice(inValue.length-20, inValue.length);
			this.$.client.setValue(this.leftTruncatedDialString);
			return;
		}

		this.$.client.setValue(inValue);
	},
	getValue: function(){
	    return this.dialString;
	},
	getRawValue: function(){
		return this.rawString; 
	},	
	getLastCallContactData: function() {
		return this.lastCallContactData;
	},
	addChar: function(inChar) {
		if (enyo.application.Cache.contactMatch == true || (enyo.application.Cache.contactMatch == false && enyo.application.Utils.isDTMFKey(inChar))) {		
			this.rawString += inChar;
		}
		this.bShowingContactName = false;
		if (!this._applyShortcuts()) {
			this._setValue(this.rawString);
		}
	},
	maybeEnableContactLookup: function(inSender) {
		//enyo.log("maybeEnableContactLookup "+this.rawString);
		if (!this.rawString || this.rawString === undefined){
			this.doScrimClick();
		}
	},
	handleClick: function(inSender) {
		if ('emergencyFill' in this.params) {
			//emergency mode, don't enter the contactlookup state
			return; 
		}
		enyo.application.UI.enter('contactlookup');
	},
	handleDelete: function(inSender) {
		if (this.bShowingContactName === true) {
		 	this.clear();
			return;
		}

		if (this.dialString && this.dialString.length > 0){
			this.rawString = this.rawString.slice(0, -1);
			if (!this._applyShortcuts())
				this._setValue(this.rawString, true);
		}
		//format string return w and p with an empty space added in the front, temp checking for " "
		//todo: need to figure out why it adds an empty space 
		if (this.dialString == " " || this.dialString == "" || this.dialString == undefined){
			this.clear();
		}
		return true;
	},
	valueChanged: function() {
		this.$.client.setValue(this.value);
	},
	_gotDialingShortcuts: function(inSender, payload) {
		if ( ! payload ) {
			return;
		}

		this.hasShortcuts = false;

		if (payload.returnValue) // The payload sometimes carries returnValue, only remove it if it does
			delete payload.returnValue;

		for (key in payload) {
			if (typeof(payload[key]) == 'string' && enyo.string.trim(payload[key]).length > 0) {
				this.dialingShortcuts[parseInt(key.charAt(0))] = payload[key];
				//enyo.log("Adding dialingShortcut: " + this.dialingShortcuts[parseInt(key.charAt(0))]);
			} else if (this.dialingShortcuts[parseInt(key.charAt(0))]) {
				delete this.dialingShortcuts[parseInt(key.charAt(0))];
				//enyo.log("Remove shortcut at: " + key);
			}
		}

		for (shortcut in this.dialingShortcuts) {
			if (shortcut != false) {
				this.hasShortcuts = true;
				break;
			}
		}
		//enyo.log("this.hasShortcuts = " + this.hasShortcuts);
    },
	_applyShortcuts: function() {
		if (!this.hasShortcuts)
			return false;

		if (this.dialingShortcuts[this.rawString.length]) {
			if (!enyo.application.Utils.isEmergencyNumber(this.rawString) && !(/[\*#]/.test(this.rawString))) {
				this._setValue(this.dialingShortcuts[this.rawString.length] + this.rawString);
				return true; // Indicates that a shortcut was applied
			}
		}
		
		return false;
	},
});
