/*globals enyo $L */

enyo.kind({
	name: "MultiLineView",
	kind: "VFlexBox",
	className: "single-call-simple multi-line-call",
	components: [
		
	],
	create: function() {
		var transport;
		this.inherited(arguments);
		enyo.require(this.lines, "MultilineCall needs lines");
		
		this.lines.forEach(function(line) {
			if ( line.calls.length == 1 ) {
				this.createContainedComponent({kind: "MiniSingleCall", flex: 1, line: line, activeLines: this.lines});
			} else if ( line.calls.length > 1 ) {
				this.createContainedComponent({kind: "MiniConferenceCall", flex: 1, line: line, activeLines: this.lines});
			}
		}, this);
		
		if ( AbstractCallButtons.shouldShowHangupAllButton(this.lines) ) {
			this.createComponent({kind:"DisconnectAllButton", onclick:"hangupAll"},{owner:this});
		}
	},
	hangupAll: function() {
		enyo.application.CallSynergizer.disconnectAllCalls();
	}
});

enyo.kind({
	name: "MiniSingleCall",
	kind: "SingleCall",
	height: 'auto',
});

enyo.kind({
	name: "MiniConferenceCall",
	kind: "AbstractCall",
	height: 'auto',
	create: function() {
		this.inherited(arguments);
		this.$.header.setTitle($L("Conference Call"));
		
		this.$.header.createContainedComponent({name:"timer", kind:"LineState"})
		this.$.timer.setClassName("");
		this.$.timer.setLine(this.line);
	}
});

enyo.kind({
	name: "DisconnectAllButton",
	kind: "CustomButton",
	layoutKind: "VFlexLayout",
	pack: "end",
	align: "center",
	className: "disconnect-all-button",
	components: [
		{content: $L("End all calls")}
	]
});
