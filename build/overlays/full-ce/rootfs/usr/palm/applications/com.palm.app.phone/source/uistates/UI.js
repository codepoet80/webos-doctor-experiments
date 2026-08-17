/**
  * A simple finite state machine to handle the phone app's complex scene transition logic.
  * States must be added in the constructor. State classes may implement 'setup' and 'cleanup' methods.
  * In addition, they may choose to implement event handler functions named event_<eventname>.
  * 
  * Currently handled events:
  *  back - mojo back gesture
  *  hangup - a call has been hung up
  *  closed - (main card only) card has been flicked off the screen
  *  launch - phone icon tapped
  *  lock - device unlocked/locked state, parameter true is for locked
  *  emergency - emergency mode enabled or disabled (if params === false)
  *  focus - tells the state to focus its stage
  *  dial - request for a new dial message
  *  activecall - request to show activecall scene
  *  voicedialing - request to show voicedialing
  *  voicemail - request to show voicemail
  *  missedcall - request to show missedcall scene
  *  displayon - display was turned on
  *  windowActivate - called when window activated
  *  windowDeactivate - called when window deactivated
  *  preferences - request to show phone preferences
  *  flightModeOn - request to handle airplane mode
  *  flightModeOff - request to get back to normal state
  * 
  * Example:
  * var s = new UI();
  * s.enter("dialpad") // switches to dialpad state and calls setup()
  * s.event("back") // calls dialpad state's event_back() function if it exists
  */
enyo.kind({
	name: "UI",
	kind: enyo.Object,
	statics: {
		START: 'start',
		PIN: 'pin',
		PROVISIONING: 'provisioning',

		ACTIVE_CARD: 'activecall_card',
		ACTIVE_EMERGENCY: 'activecall_emergency',
		ACTIVE_PIN: 'activecall_pin',
		ACTIVE_PIN_EMERGENCY: 'activecall_pin_emergency',

		EMERGENCY_CARD: 'emergency_card',
		EMERGENCY_PIN: 'emergency_pin',

		DIALPAD_CARD: 'dialpad_card',
		DIALPAD_EMERGENCY: 'dialpad_emergency',
		DIALPAD_PIN: 'dialpad_pin',
		DIALPAD_PIN_EMERGENCY: 'dialpad_pin_emergency',

		PREFERENCES_CARD: 'preferences_card',
		PREFERENCES_PIN: 'preferences_pin',

		FIRSTLAUNCH_CARD: 'firstlaunch_card',
		
		// the following are all considered 'card' only states
		CONTACTLOOKUP: 'contactlookup',
		//ALLCONTACTLOOKUP: 'allcontactlookup', //comment out for video discoveribility
		VOICEMAIL: 'voicemail',
		VOICEMAILGREETING: 'voicemailgreeting',
		//AUDIORECORDING: 'audiorecording',
		CALLLOG_ALL: 'calllog',
		CALLLOG_MISSED: 'calllogmissed',
		FAVORITES: 'favorites',
		FAVORITESADD: 'favoritesadd',
		VOICEDIALING: 'voicedialing',
		VOICEDIALINGPIN: 'voicedialing_pin'
	},
	constructor: function() {
		this.inherited(arguments);
		
		this._states = {};
		this._states[UI.START] = UIStates.StartState;
		this._states[UI.PIN] = UIStates.PinState;
		//this._states[UI.PROVISIONING] = UIStates.ProvisioningState;
		
		this._states[UI.ACTIVE_CARD] = UIStates.ActiveCallStateCard;
		this._states[UI.ACTIVE_EMERGENCY] = UIStates.ActiveCallEmergencyState;
		this._states[UI.ACTIVE_PIN] = UIStates.ActiveCallPinState;
		this._states[UI.ACTIVE_PIN_EMERGENCY] = UIStates.ActiveCallPinEmergencyState;
		
		this._states[UI.DIALPAD_CARD] = UIStates.DialpadCardState;

		this._states[UI.DIALPAD_EMERGENCY] = UIStates.DialpadEmergencyState;
		this._states[UI.DIALPAD_PIN] = UIStates.DialpadPinState;
		this._states[UI.DIALPAD_PIN_EMERGENCY] = UIStates.DialpadPinEmergencyState;
		
		this._states[UI.FIRSTLAUNCH_CARD] = UIStates.FirstlaunchCardState;

		this._states[UI.EMERGENCY_CARD] = UIStates.EmergencyModeCardState;
		this._states[UI.EMERGENCY_PIN] = UIStates.EmergencyModePinState;
		
		this._states[UI.PREFERENCES_CARD] = UIStates.PreferencesCardState;
		this._states[UI.PREFERENCES_PIN] = UIStates.PreferencesPinState;
		
		// all of these are card-only (and in first use)
		this._states[UI.CONTACTLOOKUP] = UIStates.ContactLookupState;
		//this._states[UI.ALLCONTACTLOOKUP] = UIStates.AllContactLookupState; //comment out for video discoveribility
		this._states[UI.VOICEMAIL] = UIStates.VoicemailState;
		this._states[UI.VOICEMAILGREETING] = UIStates.VoicemailGreetingState;
		//this._states[UI.AUDIORECORDING] = UIStates.AudioRecordingState;		
		this._states[UI.CALLLOG_ALL] = UIStates.CallLogAllState;
		this._states[UI.CALLLOG_MISSED] = UIStates.CallLogMissedState;
		this._states[UI.FAVORITES] = UIStates.FavoritesState;
		this._states[UI.FAVORITESADD] = UIStates.FavoritesAddState;
		
		//voice dialing
		this._states[UI.VOICEDIALING] = UIStates.VoicedialingState;
		this._states[UI.VOICEDIALINGPIN] = UIStates.VoicedialingPinState;

		// instantiate
		for ( state in this._states ) {
			this._states[state] = new this._states[state]( state, this );
		}
		
		// start
		this.enter(UI.START);
	},

	/**
	 * Changes the current state of the machine to the given state and passes params to that state.
	 * Can't will return if already in state being entered.
	 * @param {string} statename
	 * @param {...*} var_args
	 */
	enter: function(statename) {
		var state = this._states[statename];
		enyo.require(state, "Trying to enter unknown state: " + statename);
		
		// can't go into the same state
		if ( this.currentState === state) {
			enyo.warn("Already in state " + statename);
			return;
		}
		
		// todo change back to info logging
		enyo.error("Entering state " + statename);
		
		if ( this.currentState && this.currentState.cleanup ) {
			this.currentState.cleanup();
		}
		
		this.previousState = this.currentState;
		this.currentState = state;
		
		if ( this.currentState.setup ) {
			this.currentState.setup.apply(this.currentState, enyo.cloneArray(arguments).slice(1));
		}
	},

	/**
	  * Sends an event to the current state
	  */
	event: function(event, params) {
		// todo change back to info logging
		enyo.error("Event received: '" + event + "', current state: '" + (this.currentState && this.currentState.name) + "'");
		
		var fn = "event_" + event;
		if ( enyo.isFunction(this.currentState[fn]) ) {
			this.currentState[fn](params);
		} else {
			enyo.log("No handler for event " + event);
		}
	},
	
	getCurrentState: function () {
		return this.currentState && this.currentState.name; 
	},

	getPreviousState: function () {
		return this.previousState && this.previousState.name;
	}
});
