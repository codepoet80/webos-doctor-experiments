/* Copyright 2009 Palm, Inc.	All rights reserved. */

/*globals Mojo MojoLoader exports root setTimeout MediaError*/
/*globals DisconnectedState DisconnectingState ConnectingState CannotPlayBufferingState CanPlayBufferingState
PlayingState PausedState StoppedState EmptiedState ErrorState*/

var StreamingPlayEngine = function(player, mediaExt, app, url, initialPos, setBlockPlayEvents) {
	this.app = app;
	this.url = url;
	this.player = player;
	this.mediaExt = mediaExt;
	this.initialPos = initialPos;
	this.blockPlayEvents = !!setBlockPlayEvents;
	this.pendingLoad = false;

	this._initializeStates(player, app);

	this.player.addEventListener ('canplay', this._canPlayHandler.bind(this), false);
	this.player.addEventListener ('canplaythrough', this._canPlayThroughHandler.bind(this), false);
	this.player.addEventListener ('play', this._playEventHandler.bind(this), false);
	this.player.addEventListener ('pause', this._pauseEventHandler.bind(this), false);
	this.player.addEventListener ('waiting', this._waitingHandler.bind(this), false);
	this.player.addEventListener ('error', this._errorHandler.bind(this), false);
	this.player.addEventListener ('emptied', this._emptiedHandler.bind(this), false);
	this.player.addEventListener ('dataunavailable', this._dataUnavailableHandler.bind(this), false);
	this.player.addEventListener ('canshowcurrentframe', this._canShowCurrentFrameHandler.bind(this), false);
	this.player.addEventListener ('x-palm-disconnect', this.mediaServerDisconnect.bind(this), false);
	this.player.addEventListener ('x-palm-connect', this.mediaServerConnect.bind(this), false);
	this.player.addEventListener ('x-palm-watchdog-triggered', this.mediaServerWatchdog.bind(this), false);
	
	setTimeout(function(){
			this.load(initialPos);
	}.bind(this), 0);
};

StreamingPlayEngine.prototype = {

	/*
	 * The various states the state machine can have.
	 */
	STATE_CANNOT_PLAY_BUFFERING: 'cannotPlayBuffering',
	STATE_CAN_PLAY_BUFFERING: 'canPlayBuffering',
	STATE_PLAYING: 'playing',
	STATE_PAUSED: 'paused',
	STATE_STOPPED: 'stopped',
	STATE_CONNECTING: 'connecting',
	STATE_DISCONNECTED: 'disconnected',
	STATE_DISCONNECTING: 'disconnecting',
	STATE_EMPTIED: 'emptied',
	STATE_ERROR: 'error',
	
	/* 
	 * Events that will transition the state machine.
	 */
	EVENT_CAN_PLAY: 'canplay',
	EVENT_CAN_PLAY_THROUGH: 'canplaythrough',
	EVENT_WAITING: 'waiting',
	EVENT_PLAY_BUTTON: 'playbutton',
	EVENT_PAUSE_BUTTON: 'pausebutton',
	EVENT_PLAYING: 'play',
	EVENT_PAUSED: 'pause',
	EVENT_ERROR: 'error',
	EVENT_LOAD: 'load',
	EVENT_EMPTIED: 'emptied',
	EVENT_STOP: 'stop',
	EVENT_CONNECTED: 'connected',
	EVENT_CONNECTING: 'connecting',
	EVENT_DISCONNECT: 'disconnect',
	EVENT_DATA_UNAVAILABLE: 'dataunavailable',
	EVENT_CAN_SHOW_CURRENT_FRAME: 'canshowcurrentframe',
	
	load: function(initialPos){
		if (initialPos){
			this.initialPos = initialPos;
		}
		
		switch (this.currentState){
			case this.STATE_STOPPED:
				this.doLoad();
				break;
			case this.STATE_DISCONNECTED:
				this.pendingLoad = true;
				this._doNotAutoPlay = true;
				this._reconnect();
				break;			
			default:
				this.pendingLoad = true;
		}
 },

	//change the videoPath to a new url
	//useful when we want to view the video we just trimmed
	changePath : function(path){
		this.changeState(this.STATE_STOPPED);
		this.url = path;
		this.initialPos = 0;
		this._doNotAutoPlay = true;
		this.load();
	},

	disconnect: function(){
		if (this.currentState !== this.STATE_DISCONNECTED && 
			this.currentState !== this.STATE_DISCONNECTING &&
			this.currentState !== this.STATE_ERROR){
				
			this.changeState(this.STATE_DISCONNECTING);
		}
 },

 _reconnect: function(){
	this._reconnecting = true;
	
	this.handleEvent(this.EVENT_CONNECTING);		
 },

	doLoad: function(){
		var url = this.url;

		var initialPos = this.initialPos;

		if (!url){
			this.throwError();
			return;
		}

		//prepend the url with 'file://' if no protocol was specified
		if (!this.app.inPalmHost && url[0] == "/"){
			url = "file://" + url;
		}
	
		var previousState = this.player.networkState;

		Mojo.Log.info ("setting src to : " + url);
		// WebKit's supportsType() rejects video/webm; hand it a <source> mime it accepts
		// (video/ogg) so its engine loads, then the media server typefinds and decodes the
		// real WebM. Only webm/mkv are rerouted; every other format keeps its direct src.
		if (/\.(webm|mkv)(\?|#|$)/i.test(url)) {
			this.player.removeAttribute('src');
			while (this.player.firstChild) { this.player.removeChild(this.player.firstChild); }
			var _msrc = this.player.ownerDocument.createElement('source');
			_msrc.setAttribute('src', url);
			_msrc.setAttribute('type', 'video/ogg');
			this.player.appendChild(_msrc);
			this.player.load();
		} else {
			this.player.src = url;
		}

		// safari seems to need this		
		if (previousState !== 0 /* NETWORK_EMPTY */ || this.app.inPalmHost){
			this.player.load();
		}

		this.pendingSeek = this.initialPos; 
		this.player.autoplay = false;
		this.pendingLoad = false;

		this.handleEvent(this.EVENT_LOAD);
	},


	/*
	 *	Remove when NOV-48999 is implemented
	 */
	isRtsp: function(url){
		var result = false;
		
		Mojo.Log.info ("url: " + url);
		// stupid, but check if the url begins with 'rtsp'
		if (url && url[0] != "/" && (url.substr(0, 4) == "rtsp" || url.substr(0, 4) == "mobi")){
			result = true;
		}

		return result;
	},
	

	/**
	 * Create the states for the state machine
	 * 
	 * @param {Object} player the video player in the app
	 * @param {Object} app the video player app
	 */
	_initializeStates: function(player, app){
		this.states = [];
		this.currentState = null;
		
		Mojo.Log.info ("begin setting up states");
		this.states[this.STATE_DISCONNECTED] = new DisconnectedState(this, player, app);
		this.states[this.STATE_DISCONNECTING] = new DisconnectingState(this, player, app);
		this.states[this.STATE_CONNECTING] = new ConnectingState(this, player, app);
		this.states[this.STATE_CANNOT_PLAY_BUFFERING] = new CannotPlayBufferingState(this, player, app);
		this.states[this.STATE_CAN_PLAY_BUFFERING] = new CanPlayBufferingState(this, player, app);
		this.states[this.STATE_PLAYING] = new PlayingState(this, player, app);
		this.states[this.STATE_PAUSED] = new PausedState(this, player, app);
		this.states[this.STATE_STOPPED] = new StoppedState(this, player, app);
		this.states[this.STATE_EMPTIED] = new EmptiedState(this, player, app);
		this.states[this.STATE_ERROR] = new ErrorState(this, player, app);
		
		Mojo.Log.info ("finished setting up states");
		this.changeState(this.STATE_STOPPED);
	},

	setBlockPlayEvents: function(block){
		Mojo.Log.info ("block play events" + block);
		this.blockPlayEvents = block;
	},
	
	handleEvent: function(event) {
		Mojo.Log.info ("state machine handling event: " + event);
		Mojo.Log.info ("current state: " + this.currentState);
		
		if (event === this.EVENT_ERROR) {
			if (this.currentState !== this.STATE_ERROR){
				this.changeState(this.STATE_ERROR);
			}
		} else{
			this.states[this.currentState].onevent(event);	
		}		
		
		Mojo.Log.info ("done handling event");
	},
	
	changeState: function(newState){
		Mojo.Log.info ("change states to " + newState);
		
		if (this.currentState){
			this.states[this.currentState].onexit();
		}
				
		this.currentState = newState;
		this.states[this.currentState].onenter();
		
		if (this.app.notifyStateChange){
			this.app.notifyStateChange(this.currentState);
		}
	},

	getCurrentState: function(){
		return this.currentState;
	},
	
	_canPlayHandler: function(){
		if (this.pendingSeek){
				this.player.currentTime = this.pendingSeek;
				this.pendingSeek = 0;
		}
						
		if (this.mediaExt && this.mediaExt.pausable == 'false'){
				Mojo.Log.info ("signalling pause is unsupported");
				this.app.pauseIsUnsupported();
		}
		
		
		this.handleEvent(this.EVENT_CAN_PLAY);
	},
	
	_canPlayThroughHandler: function(){
		this.handleEvent(this.EVENT_CAN_PLAY_THROUGH);
	},

	_playEventHandler: function(){
			this.handleEvent(this.EVENT_PLAYING);
	},

	_pauseEventHandler: function(){
			this.handleEvent(this.EVENT_PAUSED);
	},
	
	_waitingHandler: function(){
		this.handleEvent(this.EVENT_WAITING);
	},

	_emptiedHandler: function(){
		this.handleEvent(this.EVENT_EMPTIED);
	},

	throwError: function(){
		this.handleEvent(this.EVENT_ERROR);
	},
	

	_errorHandler: function(){
		var code = this.player.error.code;
		//circumvents NOV-100470
		if(this.currentState !== this.STATE_DISCONNECTED && 
			this.currentState !== this.STATE_DISCONNECTING){
			if (code != MediaError.MEDIA_ERR_ABORTED){
					this.handleEvent(this.EVENT_ERROR);			
			}

		}
	},
	
	_dataUnavailableHandler: function(){
		this.handleEvent(this.EVENT_DATA_UNAVAILABLE);
	},
	
	_canShowCurrentFrameHandler: function(){
		this.handleEvent(this.EVENT_CAN_SHOW_CURRENT_FRAME);
	},

	mediaServerDisconnect: function() {
		if (this.currentState === this.STATE_DISCONNECTING){
			this.handleEvent(this.EVENT_DISCONNECT);
		} else {
			// if we were not expecting this event, something went wrong, and it indicates an error
			this.handleEvent(this.EVENT_ERROR);
		}
	}, 

	mediaServerConnect: function() {
		this.handleEvent(this.EVENT_CONNECTED);
	},
		
	mediaServerWatchdog: function() {
		this.handleEvent(this.EVENT_ERROR);			
	}	
};

var _localStrings = root.Mojo.Locale.readStringTable("strings.json", 
		root.Mojo.Locale.current, MojoLoader.root + "resources");
var $LF = function(stringToLocalize){
		return root.Mojo.Locale.localizeString(stringToLocalize, _localStrings);
};

exports.StreamingPlayEngine = StreamingPlayEngine;
root.StreamingPlayEngine = StreamingPlayEngine;

