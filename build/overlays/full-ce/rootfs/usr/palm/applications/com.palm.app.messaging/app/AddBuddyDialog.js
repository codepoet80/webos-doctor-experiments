enyo.kind({
	name: "AddBuddyDialog",
	kind: "ModalDialog",
	caption: $L("Add Buddy"),
	style: "height: 402px",
	contentHeight: "402px",
	events: {
		onclosed: ""
	},
	components: [	
		{kind: "ApplicationEvents", onWindowHidden: "close"},
	    {name: "addBuddyPane", kind: "Pane", components: [         
	        {name: "defaultView", layoutKind: "enyo.VFlexLayout", components:[
        		{kind: "RowGroup", caption: $L("IM Service"),  style: "margin:5px;", components: [
        			{name: "service", kind: "AccountSelector", onChange: "serviceChanged"}
        		]},
        		    
        		{name: "skypeBuddyNameRow", kind: "RowGroup", style: "height:25px;margin:5px;", caption: $L("Buddy Name"), components: [ 	
        		    {name: "skypeName", kind: "CustomButton", caption: $L("Search for a contact"), onclick: "startSkypeSearch"}   					        			
        		]},  
        		
        		{name: "buddyNameRow", kind: "RowGroup", style: "height:25px;margin:5px;", caption: $L("Buddy Name"), components: [ 
        			{name: "name", kind: "Input", hint: $L("Enter a buddy name"), oninput: "updateAddButton", onchange: "focusMessage", changeOnKeypress: true, autoCapitalize: "lowercase", autocorrect: false, inputType: "email"}	        			
        		]},      		
        		/*
    			{kind: "RowGroup", caption: $L("Add To Buddy Group"), components: [
    				{name: "group", kind: "ListSelector", items: [
    					{caption: "Buddies", value:"buddies"},
    					{caption: "Family", value:"family"},
    					{caption: "Friends", value: "friends"}
    				]}
    			]},
    			*/		   		
        		{kind: "RowGroup", caption: $L("Invitation Message"),  style: "margin:5px;", components: [
        			{name: "message", kind: "Input", onkeypress: "messageKeyPressed", changeOnKeypress: true, hint: $L("Enter a message")}
        		]},
        		
        		{layoutKind: "enyo.HFlexLayout",  style: "margin:5px;",  components: [
        			{name: "cancelButton", kind: "Button", caption: $L("Cancel"), flex:1, onclick: "cancelClicked"},
        			{name: "addButton", kind: "Button", caption: $L("Add Buddy"), flex:1, className:"enyo-button-dark", onclick: "addBuddyClicked"}
        		]}
        	]},
        	
        	{name: "skypeSearchUI", kind: "CrossAppUI", lazy: true, layoutKind: "enyo.VFlexLayout", onResult: "handleSkypeSearchResult"}
        	    
	    ]},	    	
		
		{kind: "DbService", onFailure: "fail", components: [
			{name: "buddyAdder", dbKind: "com.palm.imcommand:1", method: "put", onSuccess: "addedBuddy"}
		]}
		
	],
    renderOpen: function() {
		this.inherited(arguments);
		this.registerAccountService();
		this.updateAccountSelector();
		if (enyo.g11n.currentLocale().language == "de") {
			this.$.addButton.flex = 1.75;
		}
	},
	accountsChanged: function() {
		this.accounts = this.accountService.getImAccounts();
		
		this.updateAccountSelector();
		this.updateInputs();
		this.updateAddButton();
	},
	updateAccountSelector: function() {		
		var items = [];
		
		//enyo.log("List of IM accounts: ", this.accounts);
		for (var i = 0; i < this.accounts.length; i++) {
			items.push({
				caption: this.accounts[i].loc_shortName,
				value: this.accounts[i]._id,
				username: this.accounts[i].username
			});
		}
		
		this.$.service.setItems(items);
		this.updateNameHintText(this.$.service.getValue());
	},
	updateInputs: function() {
		var disabled = this.accounts.length === 0;
		this.$.name.setDisabled(disabled);
		this.$.message.setDisabled(disabled);
	},
	updateAddButton: function() {
		var nameValue = this.$.name.getValue();
		
		nameValue = nameValue.replace(/^\s\s*/, '').replace(/\s\s*$/, '');  // trim name value
		if (nameValue.length === 0 || this.accounts.length === 0) {
			this.disableAddButton();
		} else {
			this.enableAddButton();
		}
	},
	serviceChanged: function(inSender, inValue, inOldValue) {
		this.updateNameHintText(inValue);
	},
	updateNameHintText: function(accountId) {
		var account = this.getAccount(accountId);
		
		if (account && account.serviceName === "type_skype") {
		    this.$.buddyNameRow.hide();
		    this.$.skypeBuddyNameRow.show();
	    } else {
	        this.$.skypeBuddyNameRow.hide();
	        this.$.buddyNameRow.show();
	    }
		
		if (account && account.serviceName === "type_gtalk") {
			// gtalk requires entire email address for adding a buddy, so change the hint text to reflect that
			this.$.name.setHint($L("Email address..."));
		} else {
			this.$.name.setHint($L("Enter a buddy name"));
		}
	},
	focusMessage: function(inSender, inEvent) {
		this.$.message.forceFocus();
	},
	disableAddButton: function() {
		this.$.addButton.setDisabled(true);
	},
	enableAddButton: function() {
		this.$.addButton.setDisabled(false);
	},
	messageEntered: function() {
		this.$.message.forceBlur();
		this.addBuddy();
		this.closeDialog();
	},
	messageKeyPressed: function(inSender, inEvent) {
		if (inEvent.keyCode === 13 && (this.$.name.getValue() && this.$.name.getValue().replace(/\s*$/, "").length > 0)) {
			this.messageEntered();
		}
	},
	addBuddyClicked: function(inSender, inResponse) {
		this.addBuddy();
		this.closeDialog();
	},
	getData: function() {
		this.data = {};
		this.data.accountId = this.$.service.getValue();
		this.data.buddyName = this.$.name.getValue();
		this.data.message = this.$.message.getValue();
	},
	addBuddy: function() {
		this.getData();
		
		if (!this.data.buddyName || this.data.buddyName.replace(/\s*$/, "").length === 0) {
			enyo.warn("@@@@@@@@@@@@@@ Cannot add a buddy if no name is specified");
			return;
		}
		
		var account = this.getAccount(this.data.accountId);
		if (!account) {
			enyo.warn("@@@@@@@@@@@@@@ Cannot find account to add buddy");
			return;
		}
		
		enyo.log("Adding a buddy to account ", this.data.accountId, " using service ", account.serviceName);
		var imcommand = enyo.application.accountService.getImCommandKind(account.serviceName);		
		this.$.buddyAdder.call({
			objects:[{
				_kind: imcommand,
				command: "sendBuddyInvite",
				params: {
					message: this.data.message
				},
				handler: "transport",
				serviceName: account.serviceName,
				fromUsername: account.username,
				targetUsername: this.data.buddyName
			}]
		});
	},
	getAccount: function(id) {
		var account;
		for (var i = 0; i < this.accounts.length; i++) {
			if (this.accounts[i]._id === id) {
				account = this.accounts[i];
				break;
			}
		}
		return account;
	},
	cancelClicked: function(inSender, inResponse) {
		this.closeDialog();
	},
	closeDialog: function() {
		this.$.name.setValue("");
		this.$.message.setValue("");
		this.$.skypeName.setCaption($L("Search for a contact"));
		this.disableAddButton();
		this.unregisterAccountService();
		
		this.close();
	},
	registerAccountService: function() {
		this.accountService = enyo.application.accountService;
		if (this.accountService) {
			this.accountService.register(this, this.accountsChanged.bind(this));
		}
		if (this.$.service.items.length > 0) {
			// reset selection position
			this.$.service.setValue(this.$.service.items[0].value);
		}
	},
	unregisterAccountService: function() {
		if (this.accountService) {
			this.accountService.unregister(this);
			this.accountService = undefined;
		}
	},
	startSkypeSearch: function() {   
	    var account = this.getAccount(this.$.service.getValue());
	    if(account && account.serviceName === "type_skype") {
			// create skype search UI view
			if (!this.$.skypeSearchUI) {
				this.$.addBuddyPane.createView("skypeSearchUI");
			}
			   
	        this.$.skypeSearchUI.setApp("com.palm.app.skype");
            this.$.skypeSearchUI.setPath("directorySearch.html");
            this.$.skypeSearchUI.setParams({});
            this.$.addBuddyPane.selectViewByName("skypeSearchUI");
            this.setCaption($L("Search for a contact"));
            this.$.addBuddyPane.addClass("skype-directory-search");  
                  
        }
	},
	handleSkypeSearchResult: function(inSender, inResult) {
	    if(inResult.value !== undefined && inResult.value !== "") {
	        
	        this.$.name.setValue(inResult.value);
	        this.$.skypeName.setCaption(inResult.value);
	        this.enableAddButton();
	    }
	    this.$.addBuddyPane.removeClass("skype-directory-search");
	    this.setCaption($L("Add Buddy"));
        this.$.addBuddyPane.selectViewByName("defaultView");      
    }
    
});

enyo.kind({
	name: "AccountSelector",
	kind: enyo.CustomListSelector,
	itemKind: "AccountItem",
	setItemProps: function(inItem) {
		this.item.setCaption(inItem.caption);
		this.item.setUsername(inItem.username);
		this.item.setValue(inItem._id);
	}
});

enyo.kind({
	name: "AccountItem",
	kind: enyo.MenuCheckItem,
	published: {
		caption: "",
		username: ""
	},
	chrome: [
		{name: "item", kind: enyo.Item, tapHighlight: true, align: "center", 
				className: "enyo-menuitem", layoutKind: "HFlexLayout", onclick: "itemClick", 
				components: [
			{name: "icon", kind: "Image", className: "enyo-menuitem-icon"},
			{name: "account", layoutKind: "VFlexLayout", components: [
				{name: "caption"},
				{name: "user", className: "account-username-text"}
			]},
			{name: "arrow", kind: enyo.CustomButton, toggling: true, className: "enyo-menucheckitem-arrow"}
		]}
	],
	create: function() {
		this.inherited(arguments);
		this.captionChanged();
		this.usernameChanged();
	},
	captionChanged: function() {
		this.$.caption.setContent(this.caption);
	},
	usernameChanged: function() {
		this.$.user.setContent(this.username);
	}
});