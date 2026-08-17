// Abstracts handling of the launch parameter 'action' that allows external apps to perform
// call control functions. Examples:
// luna-send -n 1 palm://com.palm.applicationManager/launch '{"id":"com.palm.app.phone","params":{"action":"dial", "address":"4157773456","personId":"1x323"}}'
// luna-send -n 1 palm://com.palm.applicationManager/launch '{"id":"com.palm.app.phone","params":{"action":"dial", "address":"4157773456", "transport":"com.palm.skype"}}'
// luna-send -n 1 palm://com.palm.applicationManager/launch '{"id":"com.palm.app.phone","params":{"action":"voicemail"}}'
// luna-send -n 1 palm://com.palm.applicationManager/launch '{"id":"com.palm.app.phone","params":{"action":"reject"}}'
// luna-send -n 1 palm://com.palm.applicationManager/launch '{"id":"com.palm.app.phone","params":{"action":"answer"}}'
// luna-send -n 1 palm://com.palm.applicationManager/launch '{"id":"com.palm.app.phone","params":{"action":"extract", "id":"1"}}' (does NOT work for skype)
// luna-send -n 1 palm://com.palm.applicationManager/launch '{"id":"com.palm.app.phone","params":{"action":"merge"}}'
// luna-send -n 1 palm://com.palm.applicationManager/launch '{"id":"com.palm.app.phone","params":{"action":"swap"}}'
// luna-send -n 1 palm://com.palm.applicationManager/launch '{"id":"com.palm.app.phone","params":{"action":"dtmf", "tone":"1"}}'
// luna-send -n 1 palm://com.palm.applicationManager/launch '{"id":"com.palm.app.phone","params":{"action":"activecall"}}'
// luna-send -n 1 palm://com.palm.applicationManager/launch '{"id":"com.palm.app.phone","params":{"action":"voicecommand"}}'
LaunchActionHandler = {
	handle: function(params) {
		var uppercaseAction = params.action.slice(0,1).toUpperCase() + params.action.slice(1);
		var handler = this['handle' + uppercaseAction];
		handler && handler(params);
	},
	handleVoicemail: function() {
		enyo.application.UI.event("dial",{voicemail:true});
	},
	handleAnswer: function(params) {
		var incomingLine = enyo.application.CallSynergizer.incomingLine();
		if ( incomingLine ) {
			enyo.application.CallSynergizer.callAnswered(incomingLine, incomingLine.calls[0].id, incomingLine.calls[0].transport);
		}
	},
	// reject is also 'hangup' if there is an active call
	handleReject: function(params) {
		var incomingOrActiveLine = enyo.application.CallSynergizer.incomingLine();
		if ( incomingOrActiveLine ) {
			enyo.application.CallSynergizer.callIgnore(incomingOrActiveLine.calls[0]);
		} else {
			incomingOrActiveLine = enyo.application.CallSynergizer.activeLine();
			if ( incomingOrActiveLine ) {
				enyo.application.CallSynergizer.callDisconnect(incomingOrActiveLine.calls[0].id, incomingOrActiveLine.calls[0].transport);
			}
		}
	},
	handleSwap: function(params) {
		// we can only swap two lines (todo: also check same transport - this is that nasty 'swap rule')
		//SKYPE: if swap has no id, it puts all calls on hold. If there is an id, it puts all calls on hold and makes the id active
		//TIL : empty params will swap 2 TIL calls.
		var lines = enyo.application.CallSynergizer.lines();
		for (i = 0; i < lines.length; i++) {
			if ( lines[i].state == enyo.application.CallSynergizer.STATES.HOLD) {

				if(params && params.transport) {
					if(params.transport != lines[i].calls[0].transport) {
						continue;//check for same transport if provided
					}
				}
			
				if(params && params.id ) {
					if(params.id != lines[i].calls[0].id || lines[i].conferenceId) {
						continue;//check for same callid if provided
					}
				}
				
				enyo.application.CallSynergizer.callSwap(lines[i].calls[0].id || lines[i].conferenceId, lines[i].calls[0].transport);
				break;
			}
		}
	},
	handleMerge: function(params) {
		var lines = enyo.application.CallSynergizer.lines(), liveLines = [], haveSameTransport = true, indexOfOtherLine;
		lines.forEach(function(line) {
			if ( line.state != enyo.application.CallSynergizer.STATES.DISCONNECTED ) {
				haveSameTransport &= (lines[0].calls[0].transport == line.calls[0].transport);
				liveLines.push(line);
			}
		});
		
		// only support merging two at the moment (AbstractCallButtons enforces this)
		if ( liveLines.length == 2 && haveSameTransport) {
			var activeLine = enyo.application.CallSynergizer.activeLine();
			var indexOfOtherLine = liveLines.indexOf(activeLine) === 0 ? 1 : 0; // assumes 2 lines, enforced above
			if ( indexOfOtherLine >= 0 ) {
				var idSource = liveLines[indexOfOtherLine].conferenceId || liveLines[indexOfOtherLine].calls[0].id;
				var idDestination = activeLine.conferenceId || activeLine.calls[0].id;
				enyo.application.CallSynergizer.callMerge([idSource], idDestination, activeLine.calls[0].transport);
			}
		}
	},
	handleExtract: function(params) {
		var activeLine = enyo.application.CallSynergizer.activeLine();
		if ( activeLine ) {
			enyo.application.CallSynergizer.callExtract(params.id, activeLine.calls[0].transport)
		}
	},
	handleDtmf: function(params) {
		if ( params.tone ) {
			enyo.application.CallSynergizer.callDtmf(params.tone);
		}
	},
	handleVoicecommand: function(params) {
		enyo.application.UI.event('voicedialing', params);
	},
	// redundant with launch param {"address":"7035551212","transport":"com.palm.telephony"}
	// but included here again so bluetooth only has to use 'action' launch param
	handleDial: function(params) {
		enyo.application.CallSynergizer.dial(params.address, undefined, undefined, params.service, params.personId);
	},
	// sysmgr uses this when user taps on active call banner
	handleActivecall: function() {
		enyo.application.UI.event("activecall", true/*force focus*/);
	}
};
