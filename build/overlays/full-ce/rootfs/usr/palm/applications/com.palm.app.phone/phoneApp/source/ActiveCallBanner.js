enyo.kind({
	name: "ActiveCallBanner",
	kind: enyo.Component,
	image: "images/notification-small-active.png",
	published: {
		showing: false
	},
	create: function() {
		this.inherited(arguments);
		this._updateFunc = enyo.hitch(this,"_update");
		enyo.application.CallSynergizer.registerCallStateQuery(this._updateFunc);
	},
	destroy: function() {
		enyo.application.CallSynergizer.unregisterCallStateQuery(this._updateFunc);
		this.setShowing(false);
		this.inherited(arguments);
	},
	showingChanged: function(oldValue) {
		var params;
		if ( this.showing ) {
			if ( enyo.application.CallSynergizer.activeLine() ) {
				params = this._message(enyo.application.CallSynergizer.lines());
				if ( window && window.PalmSystem ) {
					PalmSystem.addActiveCallBanner(this.image, params.text, params.startTime);
				}
			}
		} else if ( window && window.PalmSystem ) {
			PalmSystem.removeActiveCallBanner();
		}
	},
	_update: function(lines) {
		var params;
		if ( this.showing ) {
			if ( ! enyo.application.CallSynergizer.activeLine() ) {
				this.setShowing(false);
			} else {
				params = this._message(lines);
				if ( window && window.PalmSystem ) {
					PalmSystem.updateActiveCallBanner(this.image, params.text, params.startTime);
				}
			}
		}
	},
	_message: function(lines) {
		var activeLines = [], displayString;
		
		// collect active lines
		lines.forEach(function(line) {
			if ( line.state != enyo.application.CallSynergizer.STATES.DISCONNECTED && line.state != enyo.application.CallSynergizer.STATES.INCOMING) {
				activeLines.push(line);
			}
		});
		
		if ( activeLines.length > 1 ) {
			displayString = enyo.application.Utils.formatChoice($L("1#1 call|##{n} calls"), activeLines.length, {n: activeLines.length});
		} else {
			if((activeLines[0].conferenceId)) {
				displayString = $L("Conference call");
			} else {
				displayString = activeLines[0].calls[0].contact.name || activeLines[0].calls[0].contact.addressFormatted;
			}
		}
		
		return {
			text: displayString,
			startTime: activeLines[0].calls[0].startTime
		};
	}
});
