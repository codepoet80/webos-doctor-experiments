var CaptureEvents = function media_events_namespace(){
	var events_ = {};

	var CaptureMode = {
		CAPTURE_MODE_AUDIO: 1, 
		CAPTURE_MODE_IMAGE: 2, 
		CAPTURE_MODE_VIDEO: 3
	};

	events_.recording = function media_events_recording(target, value){
		var type;
		if (value){
			switch (value){
				case CaptureMode.CAPTURE_MODE_VIDEO:
				type = "videocapturestart";
				break;
				
				case CaptureMode.CAPTURE_MODE_IMAGE:
				type = "imagecapturestart";
				break;

				case CaptureMode.CAPTURE_MODE_AUDIO:
				type = "audiocapturestart";
				break;					
			}
		}

		if (type) {
			enyo.log("events_.recording(): Fire event, type = " + type);
			
			var evt = document.createEvent("Events");
			evt.initEvent(type, true, false);
			target.dispatchEvent(evt);
		}
	};
	
	events_.capturecomplete = function media_events_capturecomplete(target, value){
		var type;
		if (value){
			switch(value){
				case CaptureMode.CAPTURE_MODE_VIDEO:
				type = "videocapturecomplete";
				break;
				
				case CaptureMode.CAPTURE_MODE_IMAGE:
				type = "imagecapturecomplete";
				break;

				case CaptureMode.CAPTURE_MODE_AUDIO:
				type = "audiocapturecomplete";
				break;		
			}
		}

		if (type){
			enyo.log("events_.capturecomplete(): Fire event, type = " + type);
			
			var evt = document.createEvent("Events");
			evt.initEvent(type, true, false);
			target.dispatchEvent(evt);
		}
	};
	
	events_.ready = function media_events_ready(target, value){
		enyo.log("events_.ready(): Fire event, type = " + "ready");
		
		var evt = document.createEvent("Events");
		evt.initEvent("ready", true, false);
		target.dispatchEvent(evt);
	};
	
	events_.durationchange = function mediaevents_durationchange(target, value){
		if (value > 0){
			enyo.log("events_.ready(): Fire event, type = " + "durationchange");

			var evt = document.createEvent("Events");
			evt.initEvent("durationchange", true, false);
			target.dispatchEvent(evt);				
		}
	};
	
	events_.error = function mediaevents_error(target, value){
		if (ErrorCode.ERROR_NONE != value){
			enyo.log("events_.ready(): Fire event, type = " + "error");

			var evt = document.createEvent("Events");

			evt.initEvent("error", true, false);
			target.dispatchEvent(evt);
		}
	};
		
	return events_;
}(); // Event namespace

var RequestWrapper = function media_RequestWrapper(){
	var api_ = {};
	var requests_ = [];
	var pendingHandles_ = [];
	var endpointUri_;
	var processRequest_; /*function*/
	var wrapCallback_; /*function*/

	function cleanup_() {
		pendingHandles_.forEach(function(handle) {
			// TODO: how to cancel PalmCall() in enyo
			// mfoundationsRef_.Comms.PalmCall.cancel(handle);
		});
		pendingHandles_ = [];
	};
	
	var pushRequest_ = function requestqueue_queueRequest(cmd, params, callback){
		if (!endpointUri_ || requests_.length){
			// If there are requests in the queue add to the end, so sequence is presevved.
			requests_.push({cmd: cmd, p: params, cb: callback});
		}
		else {
			processRequest_(cmd, params, callback);
		}
	};
	
	var processPendingRequest_ = function requestqueue_processPendingRequest(){
		var r = requests_.shift();
		if (r) {
			// Wrap the callback, so the RequestWrapper gets chance to handle the next element in 
			// the queue when this request has finished.
			processRequest_(r.cmd, r.p, wrapCallback_(r));
		}
		else {
			if (requests_.length) {
				// Util.warn("Was there an airbubble in the request pipeline?");
				processPendingRequest_();
			}
		}
	};
	
	wrapCallback_ = function requestwrapper_wrapcallback(request){
		var _request = request;
		return function(){
			try {
				enyo.log("TODO>> _request.cb.apply() was commented out because of the Util.");
				// _request.cb.apply(this, Util.convertArgs(arguments));
			}catch(e){}
			
			processPendingRequest_();
		};
	};
	
	processRequest_ = function requestwrapper_processRequest(cmd, params, cb){
		// enyo.log("processRequest_PalmService(): service = " + endpointUri_ + ", method = " + cmd + ", params = " + JSON.stringify(params));
		var p = new enyo.PalmService({
			service: endpointUri_, 
			method: cmd, 
			responseSuccess: onProcessOK, 
			responseFailure: onProcessError});
		p.call(params);
	};
	
	function onProcessOK(inRequest) {
		// enyo.log("onProcessOK(): inRequest = " + inRequest);
	};
	
	function onProcessError(inRequest) {
		// enyo.log("onProcessError");
	};
	
	function deleteHandle(handle) {
		var _index = pendingHandles_.indexOf(handle);
		pendingHandles_.splice(_index, 1);
		mfoundationsRef_.Comms.PalmCall.cancel(handle);
		handle = undefined;
		cb.apply(null, Util.convertArgs(arguments));
	};
	
	var connectEndpointUri_ = function requewstwrapper_connectEndpoint(uri){
		endpointUri_ = uri;
	};
	
	var disconnectEndpointUri_ = function requestwrapper_disconnectEndpoint(){
		requests_ = [];
		endpointUri_ = undefined;
	};
	
	api_.pushRequest = pushRequest_;
	api_.processRequests = processPendingRequest_;
	api_.connectEndpoint = connectEndpointUri_;
	api_.disconnectEndpoint = disconnectEndpointUri_;
	api_.cleanup = cleanup_;
	
	return api_;
}; // RequestWrapper

MediaListener = function() {};

MediaListener.EventDispatch = function() {
	this.listeners = {};
};

MediaListener.EventDispatch.prototype.listen = function(eventName, callback, nIndex) {
	enyo.require(MediaListener.EventDispatch.EVENTS.indexOf(eventName) >= 0, "MediaListener#addEventListener: invalid event passed " + eventName);
	this.listeners[eventName] = {callback: callback, nIndex: nIndex};
	return this;
};

MediaListener.EventDispatch.prototype.fire = function(eventName) {
	var listener = this.listeners[eventName];
	if ( listener && listener.callback ) {
		listener.callback(listener.nIndex);
	}
	return this;
};

MediaListener.EventDispatch.EVENTS = [
	'audiocapturestart',
	'audiocapturecomplete',
	'durationchange',
	'ready',
	'error',
];

//var MediaCapture = {
enyo.kind({
	name: "MediaCapture",
	kind: enyo.Control,
	events: {
		onCaptureStart: "",
		onCaptureComplete: "",
		onCaptureChange: "",
		onCaptureError: "",
	},
	components: [
		{name: "palmService", kind: enyo.PalmService},
	],
	audioRecorder: null,
	supportedAudioFormatsDefault_: [],
	supportedImageFormatsDefault_: [],
	supportedVideoFormatsDefault_: [],
	captureDevicesDefault_: [],
	connected_: false,
	request_: null,
	previewVideo_: null,
	propertyValues_: [],
	CaptureMode: {
		CAPTURE_MODE_AUDIO: 1, 
		CAPTURE_MODE_IMAGE: 2, 
		CAPTURE_MODE_VIDEO: 3
	},
	InputType: {
		INPUT_TYPE_BAD: 0,
		INPUT_TYPE_AUDIO: 1, 
		INPUT_TYPE_IMAGE: 2,
		INPUT_TYPE_VIDEO: 3 
	},
	CMD: {
		load: "load",
		unload:"unload", 
		propSub:"propertyChange", 

		startAudioCapture: "startAudioCapture", 
		startImageCapture: "startImageCapture", 
		startVideoCapture: "startVideoCapture",

		stopAudioCapture: "stopAudioCapture", 
		stopVideoCapture: "stopVideoCapture" 
	},
	ErrorCode: {
		ERROR_NONE: 0,
		ERROR_BAD_SOURCE: 1,
		ERROR_BAD_MODE: 2, 
		ERROR_NO_SPACE: 3, 
		ERROR_NO_PIPELINE: 4,
		ERROR_RESOURCE_CONFLICT: 5,
		ERROR_TIMEOUT: 6,
		ERROR_OTHER: 7
	},
	FlashMode: {
		FLASH_OFF: 0, 
		FLASH_ON: 1, 
		FLASH_AUTO: 2
	},
	supportedAudioFormatsDefault_: [
	    {mimetype:"audio/vnd.wave", codecs:"1", bitrate:128000, samplerate:8000},
	    {mimetype:"audio/vnd.wave", codecs:"1", bitrate:256000, samplerate:16000},
	    {mimetype:"audio/vnd.wave", codecs:"1", bitrate:7100000, samplerate:44100}],
	supportedImageFormatsDefault_: [
	    {mimetype: "image/jpeg", codecs: "jpeg", width:2032, height:1520}],
	supportedVideoFormatsDefault_: [
	    {mimetype:"video/mp4", codecs:"mp4v.20,mp4a.40", width:640, height:480, bitrate:1100000}],
	mcap_: null,
	isLoaded: false,
	events: null,
	elapsedTime: 0,
	
	create: function() {
		this.inherited(arguments);

		enyo.log("create");
		this.events = new MediaListener.EventDispatch();
	},
	
	initialize: function() {
		this.mcap_ = document.createElement("comment")
		captureDevicesDefault_ = [
		    {inputtype: [this.InputType.INPUT_TYPE_AUDIO], deviceUri:"audio:", description:"Front Microphone"},
		    {inputtype: [this.InputType.INPUT_TYPE_IMAGE, this.InputType.INPUT_TYPE_VIDEO], deviceUri:"video:", description:"Camera/Camcorder"}];

		this.request_ = RequestWrapper();
		if (this.request_) {
			this.request_.cleanup();
		}
		else {
			enyo.log("Request_ is null");
		}
		
		enyo.log("PalmService(): service = palm://com.palm.mediad/service/, method = captureV3");
		this.$.palmService.call({}, {
			service: "palm://com.palm.mediad/service/",
			method: "captureV3",
			subscribe: true,
			onSuccess: "onServiceOK",
			onFailure: "onServiceError",
		});
	},

	addEventListener: function(eventName, callback, nIndex) {
		this.events.listen(eventName, callback, nIndex);
		return this;
	},
	
	onServiceOK: function(inSrc, inResponse, inRequest) {
		enyo.log("onServiceOK: location = " + inResponse.location);

		this.createCallback_(inResponse);
	},
	
	onServiceError: function() {
		enyo.log("onServiceError");
	},
	
	loadCaptureDevices: function() {
		if (!this.isLoaded && this.captureDevices){
			var devIdx = 0;
			var typeIdx;
			var matched = false;
			while ( (!matched) && (devIdx != this.captureDevices.length) ){
				typeIdx = 0;
				while ( (!matched) && (typeIdx != this.captureDevices[devIdx].inputtype.length) ){
					if (this.captureDevices[devIdx].inputtype[typeIdx] != this.InputType.INPUT_TYPE_AUDIO){
						++typeIdx;
					}
					else {
						matched = true;
					}
				}
				if (!matched){
					++devIdx;
				}
			}
		
			if (!matched){
				enyo.log("There is no audio capture input on this device");
			}
			else {
				var deviceUri = this.captureDevices[devIdx].deviceUri;
				// Use default encoding for now.  Might want to explicitly select bitrate/encoding down the line.
				var options = {};

				this.load(deviceUri, options);
				this.isLoaded = true;
			}
		}
		// else {
		// 	enyo.log("A device is already loaded or no CaptureDevices");
		// }
	},

	marshalFlash_: function(mode) {
		switch(mode){
			case this.FlashMode.FLASH_ON:   return "FLASH_ON";
			case this.FlashMode.FLASH_AUTO: return "FLASH_AUTO";
			default: case this.FlashMode.FLASH_OFF:  return "FLASH_OFF";
		}			
	},
	
	unmarshalCaptureDevices_: function(value) {
		if ((value)&&(value.length)){
			var device = value.shift();
			this.propertyValues_.captureDevices = [];
			while(device){
				var types = device.inputtype;
				var itypes = [];
				var type = types.shift();

				while (type){
					switch (type){
						case "INPUT_TYPE_AUDIO": itypes.push(this.InputType.INPUT_TYPE_AUDIO); break;
						case "INPUT_TYPE_IMAGE": itypes.push(this.InputType.INPUT_TYPE_IMAGE); break;
						case "INPUT_TYPE_VIDEO": itypes.push(this.InputType.INPUT_TYPE_VIDEO); break;
					}
					type = types.shift();
				}
				device.inputtype = itypes;
				this.propertyValues_.captureDevices.push(device);
				device = value.shift();
			}
			
			this.captureDevices = this.propertyValues_.captureDevices||captureDevicesDefault_;
		}
		else {
			enyo.log("No valid value");
		}
	},

	load: function(deviceUri, options) {
		//TODO deviceUri is currently part of options, but it needs to be moved out.  This API change is being made this way to avoid a breakage.
		options = options||{};
		options.deviceUri = deviceUri;

		var args = [];
		
		//TODO change to: args.push(deviceUri, options);
		args.push(options);
		
		enyo.log("Load media service");
		this.request_.pushRequest(this.CMD.load, {args:args}, NOOP);
	},

	unload: function(){
		enyo.log("Unload media service");
		this.request_.pushRequest(this.CMD.unload, {args:[]}, NOOP);
	},

	/**
	 * Helper function used to marshal params for the capture start calls. 
	 * 
	 * @param {string} capture type.
	 * @param {string} filename
	 * @param {Object} options
	 *                     options.duration    Size of file to capture in time
	 *                     options.size        Size of file to capture in bytes
	 */
 	startXxxCapture_: function(method, filename, options) {
		var args = [];
		if (filename) {
			args.push(filename);
		}
		else {
			args.push("");
		}

		options = options||{duration: 0, size: 0};							
		
		args.push(options);

		this.request_.pushRequest(method, {args: args}, NOOP);
	},
	
	startAudioCapture_: function(filename, options) {
		captureMode_ = this.CaptureMode.CAPTURE_MODE_AUDIO;						

		this.startXxxCapture_(this.CMD.startAudioCapture, filename, options);
	},

	startImageCapture_: function(filename, options) {
		captureMode_ = this.CaptureMode.CAPTURE_MODE_IMAGE;
		options.flash = marshalFlash_(options.flash);		

		this.startXxxCapture_(this.CMD.startImageCapture, filename, options);
	},
	
	startVideoCapture_: function(filename, options) {
		captureMode_ = this.CaptureMode.CAPTURE_MODE_VIDEO;			
		options.flash = marshalFlash_(options.flash);

		this.startXxxCapture_(this.CMD.startVideoCapture, filename, options);
	},

	stopAudioCapture_: function() {
		this.request_.pushRequest(this.CMD.stopAudioCapture, {args:[]}, NOOP);
	},
	
	stopVideoCapture_: function() {
		this.request_.pushRequest(this.CMD.stopVideoCapture, {args:[]}, NOOP);
	},

	/**
	 * This function is called when the mediaserver first comes up and we get a list of all the
	 * values for the instance from the mediaserver side.  It is used to sync the local copy of the
	 * properties at this side to those in the mediaserver.
	 *  
	 * @param {Object} params  The respnse from the mediaserver:
	 *                            {propertyValues: [{name: value}, ...]
	 */
	initLocalCopy_: function (params) {
		var idx = params.propertyValues.length;
		while (idx){
			--idx;
			this.propertyValues_[params.propertyValues[idx].name] = params.propertyValues[idx].value;
		}
		
		/* 
		 * ********************************************************************* *
		 *  Handle properties that do not come over the bus in 'natural' format.
		 * ********************************************************************* *
		 */
		if (this.propertyValues_.captureDevices){
			this.unmarshalCaptureDevices_(this.propertyValues_.captureDevices);
		}

		if (this.propertyValues_.error){
			var e = this.propertyValues_.error;
			this.propertyValues_.error = this.ErrorCode[e];
		}

		this.request_.connectEndpoint(endpointUri_);
		this.request_.processRequests();
	},

	handlePropertyEvent_: function(params){
		var name = params.propertyChange.name;
		var value = params.propertyChange.value;
		
		this.propertyValues_[name] = value;
		elapsedTime = this.propertyValues_.elapsedTime;
		
		switch(name){
			case "ready":
				// Fire for both true and false.
				this.events.fire('ready');				
				// CaptureEvents.ready(this.mcap_, value);
				break;

			case "audiocapturestart":
				this.events.fire('audiocapturestart');				
				// CaptureEvents.recording(this.mcap_, this.CaptureMode.CAPTURE_MODE_AUDIO);
				break;
			case "imagecapturestart":
				CaptureEvents.recording(this.mcap_, this.CaptureMode.CAPTURE_MODE_IMAGE);
				break;
			case "videocapturestart":
				CaptureEvents.recording(this.mcap_, this.CaptureMode.CAPTURE_MODE_VIDEO);
				break;

			case "audiocapturecomplete":
				this.events.fire('audiocapturecomplete');				
				// CaptureEvents.capturecomplete(this.mcap_, this.CaptureMode.CAPTURE_MODE_AUDIO);
				break;
			case "imagecapturecomplete":
				CaptureEvents.capturecomplete(this.mcap_, this.CaptureMode.CAPTURE_MODE_IMAGE);
				break;
			case "videocapturecomplete":
				CaptureEvents.capturecomplete(this.mcap_, this.CaptureMode.CAPTURE_MODE_VIDEO);
				break;
				
			case "duration":
				this.events.fire('durationchange');				
				// CaptureEvents.durationchange(this.mcap_, value);
				break;
			case "error":
				var error = this.ErrorCode[value]||this.ErrorCode.ERROR_NONE;
				this.propertyValues_.error = error;
				CaptureEvents.error(this.mcap_, error);
				break;
			case "captureDevices":
				unmarshalCaptureDevices_(value);
				break;

			// case "elapsedTime":
			// 	enyo.log("handlePropertyEvent_: elapsedTime = " + params.propertyChange.value);
			//	this.elapsedTime = params.propertyChange.value;

			default:
				break;
		}			
	},

	propertiesCallback_: function(params){
		if (params.propertyValues) {
			this.initLocalCopy_(params);
		}
		else if (params.propertyChange){
			this.handlePropertyEvent_(params);
		}
	},

	createCallback_: function(params) {
		if (params.returnValue){			
			connected_ = true;
			
			endpointUri_ = params.location;
			var subscrParams = {subscribe: true}; 
			
			if (this.previewVideo_){
				// If there is a video object specified then tell it the URI of the capture pipeline.
				this.previewVideo_.src = endpointUri_;
				this.previewVideo_.load();
			}

			// propHandle_ = mfoundationsRef_.Comms.PalmCall.call(endpointUri_, this.CMD.propSub, subscrParams);
			// propHandle_.then(function futureCallback(f){
			// 	propertiesCallback_(f.result);
			// 	f.then(futureCallback);				
			// });
			
			enyo.log("PalmService(): service = " + endpointUri_ + ", method = " + this.CMD.propSub);
			this.$.palmService.call({}, {
				service: endpointUri_,
				method: this.CMD.propSub,
				subscribe: true,
				onSuccess: "onEndpointOK",
				onFailure: "onEndpointError",
			});
		}
		else {
			connected_ = false;
			
			var evt = document.createEvent("Events");
			evt.initEvent('error', true, false);
			this.dispatchEvent(evt);
			
			this.request_.disconnectEndpoint();
		}
	},
	
	onEndpointOK: function(inSrc, inResponse, inRequest) {
		// enyo.log("onEndpointOK(): inResponse = " + enyo.json.stringify(inResponse));

		this.propertiesCallback_(inResponse);
		
		if (this.isLoaded == false){
			this.loadCaptureDevices();
		}
	},
	
	onEndpointError: function(inRequest) {
		// enyo.log("onEndpointError");

		this.propertiesCallback_({propertyValues: false});
	},

	cleanup_: function() {
		// Util.log("Clean-up handler called for MediaCapture object.");
		unload_();

		this.request_.cleanup();
		if (msHandle_) {
			mfoundationsRef_.Comms.PalmCall.cancel(msHandle_);
			msHandle_ = undefined;
		}
		if (propHandle_) {
			mfoundationsRef_.Comms.PalmCall.cancel(propHandle_);
			propHandle_ = undefined;
		}
		this.mcap_ = undefined;
		this.previewVideo_ = undefined;
		createCallback_ = undefined;
		propertiesCallback_ = undefined;
		window_.removeEventListener('unload', cleanup_, false);
		window_ = undefined;
	},
});

var NOOP = function media_NOOP(){};
