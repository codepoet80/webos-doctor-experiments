enyo.kind({
	name: "VoicemailGreetingRecorder",
	kind: enyo.VFlexBox,
	flex: 1,
	className: "vmg-backdrop",
	events: {
		onSuccess: "",
	},
	components: [
		{kind: "ButtonHeader", content: $L("Audio Recorder"), className: "vmg-record-header"},
		{name: "vmRecordTimer", className: "vmg-record-timer-text"},
		{name: "mediaCapture", kind: "MediaCapture",
			onCaptureStart: "handleAudioCaptureStart",
			onCaptureComplete: "handleAudioCaptureComplete",
			onCaptureChange: "handleDurationChange",
			onCaptureError: "handleError"},
		{name: "canvas", nodeTag: "canvas", className: "vmg-canvas-position"},
		{name: "recordIcon", className: "record-button", onclick: "onRecordIconClick" },
	],
	appState: "idle",
	filePath: 0,
	maxDuration: 0,
	maxSize: 0,

	initialize: function() {
		this.setupCapture();
		this.setupCanvas();

		this.appState = "idle";

		this.$.vmRecordTimer.content = enyo.application.Utils.getSeparatedDurationString(0);
		this.$.vmRecordTimer.render();

		this.$.recordIcon.domAttributes.className = 'record-button';
		this.$.recordIcon.render();
	},
	
	setupCapture: function() {
		this.$.mediaCapture.initialize();

		this.$.mediaCapture.addEventListener('audiocapturestart', enyo.bind(this, "handleAudioCaptureStart"), 0);
		this.$.mediaCapture.addEventListener('audiocapturecomplete', enyo.bind(this, "handleAudioCaptureComplete"), 0);
		this.$.mediaCapture.addEventListener('durationchange', enyo.bind(this, "handleDurationChange"), 0);
		this.$.mediaCapture.addEventListener('ready', enyo.bind(this, "handleReady"), 0);
		this.$.mediaCapture.addEventListener('error', enyo.bind(this, "handleError"), 0);
	},
	
	onRecordIconClick: function() {
		if(this.$.mediaCapture.propertyValues_.audioCapture && this.appState == "recording"){
			this.appState = "idle";
			this.$.mediaCapture.stopAudioCapture_();
		} else if(!this.$.mediaCapture.propertyValues_.audioCapture && this.appState == "idle"){
			this.appState = "recording";
			this.$.mediaCapture.startAudioCapture_(this.filePath, {duration:this.maxDuration, size: this.maxSize});
		} else {
			//app and mediaserver are out of sync
			//it might be best to ignore this request
			enyo.error("Error: app and mediaserver are out of sync!");
		}
	},
	
	handleAudioCaptureStart: function() {
		enyo.log("handleAudioCaptureStart");

		this.appState = "recording";
		this.$.recordIcon.domAttributes.className = 'record-button stop';
		this.$.recordIcon.render();

		this.startUpdates();
	},
	
	handleAudioCaptureComplete: function() {
		enyo.log("handleAudioCaptureComplete: this.appState = " + this.appState);

		if (this.appState != "cleanup") {
			this.appState = "idle";
		
			this.cleanup();

			this.doSuccess(this.$.mediaCapture.propertyValues_.lastAudioPath, this.$.mediaCapture.propertyValues_.elapsedTime);
		}
		else {
			enyo.log("cleanup() is going on.");
		}
	},
	
	handleDurationChange: function() {
		enyo.log("handleDurationChange");

		this.updateCounters();
	},
	
	handleReady: function() {
		enyo.log("handleReady");
	},
	
	handleError: function() {
		enyo.log("handleError");

		this.appState = "error";
		enyo.log(this.$.mediaCapture.error);

		this.$.errorPrompt.open();
	},
	
	startUpdates: function() {
		//prevTime is used to keep track of our current place in the recording
		this.prevTime = 0;
		this.update();
	},

	update: function(){
		this.updateTimeoutId = setTimeout(this.update.bind(this), 100);

		//updating only if a whole second has passed
		if(Math.floor(this.$.mediaCapture.propertyValues_.elapsedTime) > this.prevTime){
			this.prevTime = Math.floor(this.$.mediaCapture.propertyValues_.elapsedTime);
			this.updateCounters();
		}

		var vuData = this.$.mediaCapture.propertyValues_.vuData;
		if (vuData && vuData.length > 0) {
			this.drawCanvas(vuData[vuData.length - 1].peak[0]);
		}
		else {
			enyo.log("no voice data");
		}
	},

	stopUpdates: function(){
		clearTimeout(this.updateTimeoutId);
		this.clearCanvas();

		this.$.vmRecordTimer.content = enyo.application.Utils.getSeparatedDurationString(0);
		this.$.vmRecordTimer.render();
	},

	updateCounters: function(){
		this.$.vmRecordTimer.content = enyo.application.Utils.getSeparatedDurationString(this.$.mediaCapture.propertyValues_.elapsedTime);
		this.$.vmRecordTimer.render();
	},
	
	cleanup: function() {
		this.appState = "cleanup";
		this.stopUpdates();
		
		this.$.mediaCapture.unload();
	},

	setupCanvas: function() {
		this.ui = {
			// History of column heights that gets shifted
			// at each drawing loop
			colHeights : [],

			// Number of rows/cols of squares
			ROWS : 35,
			COLS : 35,

			// Padding between adjacent squares in pixels
			SQUARE_PADDING : 3,

			// Dimensions of rectangle to clear on each
			// drawing loop
			CANVAS_HEIGHT : 340,
			CANVAS_WIDTH : 320,

			SQUARE_SIDE_LENGTH : 6,
			
			boxImage: new Image(),
		};

		var n = this.$.canvas.hasNode();
		this.ui.ctx = n && n.getContext('2d');
		this.$.canvas.node.width = this.ui.CANVAS_WIDTH;
		this.$.canvas.node.height = this.ui.CANVAS_HEIGHT;

		this.ui.SQUARE_FULL_WIDTH = this.ui.SQUARE_PADDING + this.ui.SQUARE_SIDE_LENGTH;

		function init() {
			for( var col = 0; col < this.ui.COLS; col++ ) {
				this.ui.colHeights.push(0);
			}
			
			this.ui.boxImage.src = "images/VoicemailGreeting/box.png";
		}

		init.call(this);
	},
	
	clearCanvas: function() {
		this.ui.ctx.clearRect( 0, 0, this.ui.CANVAS_WIDTH, this.ui.CANVAS_HEIGHT );
	},
	
	drawCanvas: function(volume) {
		this.clearCanvas();

		this.ui.colHeights.shift();
		//volume is always a float between 0 and 1
		this.ui.colHeights.push( Math.round( volume * this.ui.ROWS ) );
		
		var col, row;
		
		for( row = 0; row < this.ui.ROWS; row++ ) {
			for( col = this.ui.COLS - this.ui.colHeights[row]; col < this.ui.COLS; col++ ) {
				this.ui.ctx.drawImage( this.ui.boxImage,
					this.ui.SQUARE_FULL_WIDTH * row + this.ui.SQUARE_PADDING + 1,
					this.ui.SQUARE_FULL_WIDTH * col + this.ui.SQUARE_PADDING,
					this.ui.SQUARE_SIDE_LENGTH,
					this.ui.SQUARE_SIDE_LENGTH);
			}
		}
	},	
});
