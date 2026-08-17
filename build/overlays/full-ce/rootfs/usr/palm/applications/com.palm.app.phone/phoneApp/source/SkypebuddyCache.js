enyo.kind({
	name: "SkypeBuddyCache",
	kind: enyo.Component,
	components: [{name: "dbSkypeBuddies", kind: enyo.TempDbService, dbKind: "com.palm.imbuddystatus.skypem:1", 
					method: "find", subscribe: true, onSuccess: "_gotSkypeBuddies", reCallWatches: true/*, onWatch: "watchTempDBChange"*/},
		{name:"buddyStatusListeners",    kind:"Utils.Dispatcher"},
	], 
	events: {
		onGotskypeBuddies: ""
	},

	create: function() {
		this.inherited(arguments);
		this.resetItems(); 
		this._getSkypeBuddies();
	},
	
	destroy: function() {
		this._skypeBuddies = null;
		this._videoOnline = null; 
		this.$.dbSkypeBuddies.cancel();
		
		/*if(this.updateTimeout) {
			window.clearTimeout(this.updateTimeout);
		}*/
		this.inherited(arguments);
	},

	resetItems: function() {
		this._skypeBuddies = [];
		this._videoOnline = []; 
	},

	/*watchTempDBChange: function(inSender, inResponse) {
                 if(inResponse && inResponse.fired == true) {
                        this._getSkypeBuddies();
                }
	},*/
	
	_getSkypeBuddies: function() {
		this.$.dbSkypeBuddies.cancel();
		this.$.dbSkypeBuddies.call();
	},

	_gotSkypeBuddies: function(inSender, inResponse, inRequest) {
		//enyo.log("skype buddy information call back ");		
		//if (inResponse.returnValue && inResponse.fired == true) {
			//this._getSkypeBuddies();
		//} else {
		if(inResponse && inResponse.results) {
			var data = (inResponse && inResponse.results) || [];
			this.resetItems();
			
			var skypeBuddiesTotal = data.length; 
			this._videoBuddiesTotal = 0; 
			
			enyo.log("Buddies total: " + skypeBuddiesTotal);
			for (var i = 0; i < skypeBuddiesTotal; i++) {
				var buddy = data[i];				
				if (buddy.username) {
					this._skypeBuddies[buddy.username] = buddy;
					if (buddy.hasVideoCapability === true /*&& (buddy.personAvailability == 0 || buddy.personAvailability == 2)*/){
						this._videoOnline[buddy.username] =  buddy;
						if (buddy.personAvailability == 0 || buddy.personAvailability == 2) {
							this._videoBuddiesTotal++;
						}
					}
				} //else {
					//enyo.log("do we ever have a case that username is not there? user "+buddy.username);
				//}
			}
			
			this.dispatchBuddyStatus();
			
			//if we are at contact lookup page, try update it
			/*if (data.length >0){ 
					if (this.updateTimeout === undefined) {						
						var timeout = 5000; //5 secods for buddies less than 50
						if (skypeBuddiesTotal > 200) {
							timeout = 30000; //30 minute
						} else if (skypeBuddiesTotal > 100) {
							timeout = 20000; //20 secods
						} else if (skypeBuddiesTotal > 50) {
							timeout = 10000; //10 secods
						}
						this.updateTimeout = window.setTimeout(enyo.hitch(this, "updateContactUI"), timeout);
					}
			}
			enyo.log("debug: skype video online total " + this._videoBuddiesTotal);*/
			//this.doGotskypeBuddies(data);
			/*if (enyo.application.UI.getCurrentState() === 'contactlookup') {
				enyo.log("debug: skype update contact view");
				enyo.application.UI.event('updateView', {
					"updateSkype": true
				});
			}*/			
        	}		
	},
	
	/*updateContactUI: function() {	
		enyo.log("debug: timer up");
		this.updateTimeout = undefined;
	
		if (enyo.application.UI.getCurrentState() === 'contactlookup') {
			enyo.log("debug: skype update contact view");
			enyo.application.UI.event('updateView', {
				"updateSkype": true
			});
		} else {
			enyo.application.Cache.skypeCacheDirty = true; 
		}
	},*/	

	getBuddyInfoFromUsername: function(username) {
		return this._skypeBuddies && this._skypeBuddies[username];
	},
	
	getVideoBuddy: function(index) {
		return this._videoOnline && this._videoOnline[index];
	},	
	
	getVideoBuddyTotal: function() {
		return this._videoBuddiesTotal;
	},		
	
	fetchingData: function() {
		if (this.updateTimeout) {
			return true; 
		} else {
			return false; 
		}
	},
	
        dispatchBuddyStatus: function(payload) {
                this.$.buddyStatusListeners.dispatch(payload);
        },

        registerBuddyStatus: function(listener) {
                this.$.buddyStatusListeners.add(listener);
        },

        unregisterBuddyStatus: function(listener) {
                this.$.buddyStatusListeners.remove(listener);
        },
});

