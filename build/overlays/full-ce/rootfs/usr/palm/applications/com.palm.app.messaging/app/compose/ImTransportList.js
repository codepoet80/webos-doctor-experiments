enyo.kind({
	name: "ImTransportList",
	kind: enyo.Control,
	published: {
		loginStates: [],
		input: ""
	},
	shortcode: "",
	events: {
		onSelect: ""
	},
	chrome: [
//		{kind: "Divider", caption: $L("SHORT CODE")}, 
//		{name: "sms", kind: enyo.Item, tapHighlight: true, align: "center", layoutKind: "HFlexLayout", onclick: "itemClick"}, 
		{name: "imDivider", kind: "Divider", caption: $L("IM USING:")}, 
		{name: "transports", kind: enyo.Item, tapHighlight: true, align: "center", layoutKind: "HFlexLayout"}
	],
	create: function(){
		this.inherited(arguments);
//		this.$.divider.hide();
//		this.$.sms.hide();
	},
	inputChanged: function(){
		if (this.input.length > 0) {
/*			this.shortcode = this.toPhonepadNumber(this.input);
			if (this.shortcode) {
				this.$.sms.setContent(this.input + " (" + this.shortcode + ")");
				this.$.divider.show();
				this.$.sms.show();
			} else {
				this.$.divider.hide();
				this.$.sms.hide();
			}*/
            var template = new enyo.g11n.Template($L("IM with \"#{input}\" using:"));
           	var userinput = template.evaluate({input: this.input}); 
			this.$.imDivider.setCaption(userinput.toUpperCase());

			if (this.loginStates.length > 0) {
				if (this.imItems === undefined) {
					this.loginStatesChanged();
				} else if(this.imItems.length>0) {
					this.$.imDivider.show();
					this.$.transports.show();
				} else {
					this.$.imDivider.hide();
					this.$.transports.hide();
				}
			} else {
				this.$.imDivider.hide();
				this.$.transports.hide();
			}
		} else {
//			this.$.divider.hide();
//			this.$.sms.hide();
			this.$.imDivider.hide();
			this.$.transports.hide();
		}
	},
	loginStatesChanged: function(){
		if (this.loginStates.length > 0 && this.input.length > 0) {
			var state, icon;
			var items = [];
			var serviceNameHash = {};
			for (var i = 0; i < this.loginStates.length; i++) {
				state = this.loginStates[i];
				if(state.state === "online" && enyo.application.accountService.getChatWithNonBuddies(state.serviceName) !== false){
					icon = enyo.application.accountService.getIcons(state.serviceName);
					if (icon && icon.splitter && !serviceNameHash[state.serviceName]) {
						serviceNameHash[state.serviceName] = state.serviceName;
						items.push({name: state.serviceName, kind: "Image", src: icon.splitter, style: "display: block", onclick: "itemClick"});
					}
				}
			}
			this.imItems = items;
			if (items.length > 0) {
				this.$.transports.destroyControls();
				this.$.transports.createComponents(items, {owner: this});
				this.$.transports.components = items;
				this.render();
				
				this.$.imDivider.show();
				this.$.transports.show();
			} else {
				this.$.imDivider.hide();
				this.$.transports.hide();
			}
		} else {
			this.$.imDivider.hide();
			this.$.transports.hide();
		}
	},
	itemClick: function(inSender){
		if (inSender.name === "sms") {
			this.doSelect(this.input+"("+this.shortcode+")", this.shortcode, inSender.name);
		} else {
			this.doSelect(this.input, this.input, inSender.name);
		}
		this.input = "";
		this.inputChanged();
	},
	toPhonepadNumber: function(str){
		var smsAccount = enyo.application.accountService.getAccount("sms");
		if (!smsAccount){ 
			return null;
		} 
		return this.getNumberString(str);
	},
	
	/***********************************
	 * Functions below are unit tested *
	 ***********************************/
	getNumberString: function(str){
		var is = true;
		var numChar = "-1";
		var numberStr = "";
		for (var i = 0; i < str.length; i++) {
			numChar = this.translateToPhonepadDigit(str.charAt(i));
			if (numChar == "-1") {
				is = false;
				break;
			} else {
				numberStr += numChar;
			}
		}
		
		if (is) {
			return numberStr;
		} else {
			return null;
		}
	},
	
	translateToPhonepadDigit: function(letter){
		var number = -1;
		letter = letter.toLowerCase();
		switch (letter) {
			case "a":
			case "b":
			case "c":
				number = 2;
				break;
			case "d":
			case "e":
			case "f":
				number = 3;
				break;
			case "g":
			case "h":
			case "i":
				number = 4;
				break;
			case "j":
			case "k":
			case "l":
				number = 5;
				break;
			case "m":
			case "n":
			case "o":
				number = 6;
				break;
			case "p":
			case "q":
			case "r":
			case "s":
				number = 7;
				break;
			case "t":
			case "u":
			case "v":
				number = 8;
				break;
			case "w":
			case "x":
			case "y":
			case "z":
				number = 9;
				break;
		}
		return number;
	}
});