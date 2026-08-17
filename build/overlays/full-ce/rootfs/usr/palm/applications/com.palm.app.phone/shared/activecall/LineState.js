enyo.kind({
	name: "LineState",
	kind: "HFlexBox",
	className: "single-call-timer",
	align: "center",
	pack: "center",
	components: [
		{name: "prefixLbl", style: "font-weight: bold; margin-right: 5px;", content: $L("MUTE"), showing: false},
		{name: "timerLbl"}
	],
	published: {
		line: ''
	},
	create: function() {
		this.inherited(arguments);
	},
	lineChanged: function() {
		// todo get start time from multi lines?
		this.startTime = this.line.calls[0].startTime;
		
		if (this.line.state == enyo.application.CallSynergizer.STATES.ACTIVE ) {
			this.$.timerLbl.setContent(enyo.application.Utils.getElaspedTime(this.startTime));
			this.callTimer = window.setInterval(enyo.hitch(this, "timer"), 1000);
			
		} else if ( this.line.state == enyo.application.CallSynergizer.STATES.DIALING
			 	|| this.line.state == enyo.application.CallSynergizer.STATES.DIALPENDING ) {
			this.$.timerLbl.setContent($L("Connecting"));
			
		} else if ( this.line.state == enyo.application.CallSynergizer.STATES.DISCONNECTPENDING ) {
			this.$.timerLbl.setContent($L("Ending"));
		
		} else if ( this.line.state == enyo.application.CallSynergizer.STATES.HOLD ) {
			this.$.timerLbl.setContent($L("On hold"));
			
		} else if ( this.line.state == enyo.application.CallSynergizer.STATES.DISCONNECTED ) {
			this.$.timerLbl.setContent($L("Ended"));
			
		} else {
			enyo.error("unknown state: " + this.line.state)
		}
	},
	destroy: function() {
		window.clearInterval(this.callTimer);
		this.inherited(arguments);
	},
	timer: function() {
		if(enyo.application.Cache.muteStatus) {
			if (!this.$.prefixLbl.getShowing())
				this.$.prefixLbl.setShowing(true);
		} else {
			if (this.$.prefixLbl.getShowing())
				this.$.prefixLbl.setShowing(false);
		}

		this.$.timerLbl.setContent(enyo.application.Utils.getElaspedTime(this.startTime));
	},
});
