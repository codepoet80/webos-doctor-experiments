// All of this complex logic is in a separate static class for easier unit testing.
// Read unit tests to understand
AbstractCallButtons = {
	// PUBLIC function that returns buttons for a given line in allLines
	getButtons: function(line, allLines) {
		// CASE: single line
		if ( allLines.length == 1 ) {
			return this._generateButtonsSingleLine(line);
			
		// CASE: more than 2 lines: we don't handle this
		} else if ( allLines.length > 2 ) {
			return line.state == enyo.application.CallSynergizer.STATES.ACTIVE ? this.buttonsMergeDisabled : this.buttonsSwapDisabled;
			
		// CASE: 2 lines, but all of same transport (eg all til or all skype)
		} else if ( this._allLinesHaveSameTransport(allLines) ) {
			return this._generateButtonsMultiLineSameTransport(line, allLines);
			
		// CASE: 2 lines, mixed transports (eg one til and one skype)
		} else {
			return this._generateButtonsMultiLineMixedTransports(line, allLines);
		}
	},
	// PUBLIC function that returns true if we should show the "End All Calls" button given all lines
	shouldShowHangupAllButton: function(allLines) {
		var transport = enyo.application.CallSynergizer.transports[allLines[0].calls[0].transport];
		return transport && transport.hangupAffectsAll && this._allLinesHaveSameTransport(allLines);
	},
	// helper returns true if all lines are of same transport
	// assumes that all calls in line are of same transport
	_allLinesHaveSameTransport: function(allLines) {
		var i;
		for (i=0; i<allLines.length; i++) {
			if ( allLines[0].calls[0].transport !== allLines[i].calls[0].transport ) {
				return false;
			}
		}
		return true;
	},
	_generateButtonsSingleLine: function(line) {
		if ( line.state == enyo.application.CallSynergizer.STATES.DISCONNECTED 
				|| line.state == enyo.application.CallSynergizer.STATES.DISCONNECTPENDING ) {
			return this.singleFullHangupDisabled;
			
		} else if ( line.state == enyo.application.CallSynergizer.STATES.HOLD ) {
			return this.singleFullResume;
			
		} else {
			return this.singleFullHangup;
		}
	},
	// returns buttons if more than one line and _all_ lines have the same transport
	_generateButtonsMultiLineSameTransport: function(line, allLines) {
		var transport = enyo.application.CallSynergizer.transports[line.calls[0].transport];
		if ( transport.legacySwap ) {
			return this._generateButtonsMultiLineSameTransportLegacySwappable(line, allLines);
		} else {
			return this._generateButtonsMultiLineSameTransportSimple(line, allLines);
		}
	},
	// buttons for multiple calls but of same transport (simple case)
	_generateButtonsMultiLineSameTransportSimple: function(line, allLines) {
		var transport = enyo.application.CallSynergizer.transports[line.calls[0].transport]
		var allLinesConnected = this._allLinesAreConnected(allLines);
		var indexOfOtherLine = allLines.indexOf(line) === 0 ? 1 : 0; // assumes 2 lines, enforced above
		
		// CASE: call on hold
		if ( line.state != enyo.application.CallSynergizer.STATES.HOLD ) {
			if ( line.state == enyo.application.CallSynergizer.STATES.DISCONNECTED
				|| line.state == enyo.application.CallSynergizer.STATES.DISCONNECTPENDING ) {
				return this.buttonsMergeDisabledAll;
				
			} else if ( line.state != enyo.application.CallSynergizer.STATES.ACTIVE ) {
				return this.buttonsMergeDisabled;
				
			// dont allow if the merge will result in a conference call over max lines
			} else if ( transport.maxConfParticipants 
				&& (allLines[indexOfOtherLine].calls.length >= transport.maxConfParticipants
					|| line.calls.length >= transport.maxConfParticipants) ) {
				return this.buttonsMergeDisabled;
				
			} else if ( ! allLinesConnected ) {
				return this.buttonsMergeDisabled;
				
			// we don't support merging conference calls (skype rule)
			} else if ( this._allLinesAreConferenced(allLines) ) {
				return this.buttonsMergeDisabled;
				
			} else {
				return this.buttonsMerge;
			}
			
		// CASE: call not on hold
		} else {
			if ( line.state == enyo.application.CallSynergizer.STATES.DISCONNECTED
				|| line.state == enyo.application.CallSynergizer.STATES.DISCONNECTPENDING ) {
				return this.buttonsSwapDisabledAll;
				
			} else if ( ! allLinesConnected ) {
				return this.buttonsSwapDisabled;
				
			} else {
				return this.buttonsSwap;
			}
		}
	},
	// helper returns true if all lines have multiple calls
	_allLinesAreConferenced: function(allLines) {
		var i;
		for (i=0; i<allLines.length; i++) {
			if ( allLines[i].calls.length < 2 ) {
				return false;
			}
		}
		return true;
	},
	// helper returns true if all lines either active or hold
	_allLinesAreConnected: function(allLines) {
		var i;
		for (i=0; i<allLines.length; i++) {
			if ( allLines[i].state != enyo.application.CallSynergizer.STATES.HOLD
				 && allLines[i].state != enyo.application.CallSynergizer.STATES.ACTIVE ) {
				return false;
			}
		}
		return true;
	},
	// returns buttons for single transport if it supports "legacy swappable" (eg CDMA)
	_generateButtonsMultiLineSameTransportLegacySwappable: function(line, allLines) {
		var transport, isActive, legacySwap, isLegacySwappable, showHangup;
		
		transport = enyo.application.CallSynergizer.transports[line.calls[0].transport];
		isActive = (line.state != enyo.application.CallSynergizer.STATES.HOLD);
		legacySwap = transport.legacySwap;
		isLegacySwappable = legacySwap && this._isLegacySwappable(allLines);
		showHangup = !transport.hangupAffectsAll;
		
		if ( !isActive && !isLegacySwappable ) {
			return (showHangup ? this.buttonsMerge : this.buttonsFullMerge);
			
		} else if ( !isActive && isLegacySwappable ) {
			return (showHangup ? this.buttonsSwap : this.buttonsFullSwap);
			
		} else {
			return this.buttonsNone;
		}
	},
	// Returns true if the current state of the lines is "legacy swappable".
	// Legacy swappable is the CDMA-specific rule where calls can only be swapped
	// if the second TIL call was incoming. This is hacky, but then again, so is the CDMA spec.
	_isLegacySwappable: function(allLines) {
		var i, call, tilLineCount = 0;
		for(i = 0; i < allLines.length; i++) {
			call = allLines[i].calls[0];
			// if second til call
			if ( call.transport == enyo.application.CallSynergizer.TRANSPORTS.TIL && (++tilLineCount == 2) ) {
				return call.origin == enyo.application.CallSynergizer.ORIGINS.INCOMING;
			}
		}
		return false;
	},
	_generateButtonsMultiLineMixedTransports: function(line, allLines) {
		// TODO handle calls of different transports
		return this.singleFullHangup;
	},
	// BUTTON CONSTANTS -------------------------------------
	
	// single call buttons
	singleFullHangup: [
		{kind: "CustomButton", allowDrag: true, className: "single-call-hangup", onmousedown: "disconnectCall"}
	],
	singleFullHangupDisabled: [
		{kind: "CustomButton", allowDrag: true, disabled: true, className: "single-call-hangup"}
	],
	singleFullResume: [
		{name: "footer", kind: "HFlexBox", className: "dartfish-width", components: [
			{kind: "CustomButton", allowDrag: true, flex: 1, className: "multicall-disconnect-button", onclick: "disconnect"},
			{kind: "CustomButton", allowDrag: true, flex: 1, className: "multicall-resume-button", onclick: "swap"}
		]}
	],
	
	// multicall buttons
	buttonsFullMerge:[
		{name: "footer", kind: "HFlexBox", components: [
			{kind: "CustomButton", flex: 1, className: "multicall-merge-button-full", onclick: "merge"}
		]}
	],
	buttonsFullSwap:[
		{name: "footer", kind: "HFlexBox", components: [
			{kind: "CustomButton", flex: 1, className: "multicall-switch-button-full", onclick: "swap"}
		]}
	],
	buttonsMerge:[
		{name: "footer", kind: "HFlexBox", className: "dartfish-width", components: [
			{kind: "CustomButton", flex: 1, className: "multicall-disconnect-button", onclick: "disconnect"},
			{kind: "CustomButton", flex: 1, className: "multicall-merge-button", onclick: "merge"}
		]}
	],
	buttonsMergeDisabled:[
		{name: "footer", kind: "HFlexBox", className: "dartfish-width", components: [
			{kind: "CustomButton", flex: 1, className: "multicall-disconnect-button", onclick: "disconnect"},
			{kind: "CustomButton", flex: 1, disabled: true, className: "multicall-merge-button"}
		]}
	],
	buttonsMergeDisabledAll:[
		{name: "footer", kind: "HFlexBox", className: "dartfish-width", components: [
			{kind: "CustomButton", flex: 1, disabled: true, className: "multicall-disconnect-button", onclick: "disconnect"},
			{kind: "CustomButton", flex: 1, disabled: true, className: "multicall-merge-button"}
		]}
	],
	buttonsSwap:[
		{name: "footer", kind: "HFlexBox", className: "dartfish-width", components: [
			{kind: "CustomButton", flex: 1, className: "multicall-disconnect-button", onclick: "disconnect"},
			{kind: "CustomButton", flex: 1, className: "multicall-switch-button", onclick: "swap"}
		]}
	],
	buttonsSwapDisabled:[
		{name: "footer", kind: "HFlexBox", className: "dartfish-width", components: [
			{kind: "CustomButton", flex: 1, className: "multicall-disconnect-button", onclick: "disconnect"},
			{kind: "CustomButton", flex: 1, disabled: true, className: "multicall-switch-button"}
		]}
	],
	buttonsSwapDisabledAll:[
		{name: "footer", kind: "HFlexBox", className: "dartfish-width", components: [
			{kind: "CustomButton", flex: 1, disabled: true, className: "multicall-disconnect-button", onclick: "disconnect"},
			{kind: "CustomButton", flex: 1, disabled: true, className: "multicall-switch-button"}
		]}
	],
	buttonsResume:[
		{name: "footer", kind: "HFlexBox", className: "dartfish-width", components: [
			{kind: "CustomButton", flex: 1, className: "multicall-disconnect-button", onclick: "disconnect"},
			{kind: "CustomButton", flex: 1, className: "multicall-resume-button", onclick: "swap"}
		]}
	],
	buttonsNone: [
		{name: "footer", kind: "HFlexBox", className:"glass-footer"}
	],
	
};
