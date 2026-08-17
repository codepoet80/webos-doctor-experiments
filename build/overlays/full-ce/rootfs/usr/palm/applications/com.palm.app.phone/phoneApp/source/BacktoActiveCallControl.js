enyo.kind({
	name: "BacktoActiveCallControl",
	kind: enyo.VFlexBox,
	pack: "center",
	height: "40px",
	className: "current-call-nav-button", 
	published: {
		visible: false
	},
	create: function() {
		this.inherited(arguments);
		this.content = "";
		this._updateFunc = enyo.hitch(this,"_update");
		enyo.application.CallSynergizer.registerCallStateQuery(this._updateFunc);
	},
	destroy: function() {
		window.clearInterval(this.callTimer);
		this.callTimer = undefined;
		enyo.application.CallSynergizer.unregisterCallStateQuery(this._updateFunc);
		this.setVisible(false);
		this.inherited(arguments);
	},
	visibleChanged: function(oldValue) {
		if ( this.visible ) {
			if ( enyo.application.CallSynergizer.activeLine() ) {
				var msg = this._message(enyo.application.CallSynergizer.lines());
				this.setShowing(true);
				if ( window.PalmSystem ) {
					this.setShowing(true);
					this.setContent(msg);
				}
			}
		} else if ( window.PalmSystem ) {
			this.setContent("");
			this.setShowing(false);
			window.clearInterval(this.callTimer);
			this.callTimer = undefined; 
		}
	},
	_update: function(lines) {
		if ( this.visible ) {
			if ( ! enyo.application.CallSynergizer.activeLine() ) {
				this.setContent("");
				this.setShowing(false);
			} else {
				var msg = this._message(lines);
				if ( window.PalmSystem ) {
					this.setShowing(true);
					this.setContent(msg);
				}				
			}
		}
	},
	_message: function(lines) {
		var activeLines = [], displayString;
		
		// collect active lines
		lines.forEach(function(line) {
			if ( line.state != enyo.application.CallSynergizer.STATES.DISCONNECTED ) {
				activeLines.push(line);
			}
		});
		
		if ( activeLines.length > 0 ) {
			var i, msg, callDetails; 
			var foundit = false;
			if (activeLines.length > 1) {				 
				for (i = 0; i < activeLines.length; i++) {
					if (activeLines[i].state == enyo.application.CallSynergizer.STATES.ACTIVE) {
						callDetails = activeLines[i].calls[0];
						foundit = true; 
						break; 
					}
				}
			}		
			
			if (!foundit) {
				callDetails = activeLines[0].calls[0]; 
			}

			if (callDetails) {
				this.startTime = callDetails.startTime;
				if(activeLines[0].conferenceId) {
					this.callName = $L("Conference ");
				} else {
					this.callName = callDetails.contact.name || callDetails.contact.addressFormatted;
				}
				var elapsedTime = enyo.application.Utils.getElaspedTime(this.startTime);
				content = this.startTime ? "(" + elapsedTime + ")" : "";
				
				if (!this.callTimer) {
					this.callTimer = window.setInterval(enyo.hitch(this, "timer"), 1000);
				}
			}	
			var callInfoWithTimer = $L("#{msg} Call in progress #{msgtime}");
			displayString = enyo.application.Utils.interpolate(callInfoWithTimer, {
			    "msg": this.callName,
			    "msgtime": content
			});			
		}		
		
		return displayString; 
	},
	timer: function() {
		var elapsedTime = enyo.application.Utils.getElaspedTime(this.startTime);
		var content = this.startTime ? "(" + elapsedTime + ")" : "";
							
		var callInfoWithTimer = $L("#{msg} Call in progress #{msgtime}");
		var displayString = enyo.application.Utils.interpolate(callInfoWithTimer, {
		    "msg": this.callName,
		    "msgtime": content
		});

		this.setContent(displayString);
	},	
});
