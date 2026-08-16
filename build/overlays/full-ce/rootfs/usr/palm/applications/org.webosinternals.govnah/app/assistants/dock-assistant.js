function DockAssistant()
{
	this.isVisible = true;
};

DockAssistant.prototype.setup = function()
{
	this.controller.document.body.className = "dock";
	
	this.freq1Row =			this.controller.get('freq1Row');
	this.freq1Current =		this.controller.get('freq1Current');
	this.freq2Row =			this.controller.get('freq2Row');
	this.freq2Current =		this.controller.get('freq2Current');
	this.tempRow =			this.controller.get('tempRow');
	this.tempCurrent =		this.controller.get('tempCurrent');
	this.currRow =			this.controller.get('currRow');
	this.currCurrent =		this.controller.get('currCurrent');
	this.loadRow =			this.controller.get('loadRow');
	this.loadCurrent =		this.controller.get('loadCurrent');
	this.memRow =			this.controller.get('memRow');
	this.memCurrent =		this.controller.get('memCurrent');
	
};

DockAssistant.prototype.activate = function(event)
{
	dataHandler.setDockAssistant(this);
	dataHandler.start();
	
	if (Mojo.Environment.DeviceInfo.modelNameAscii.indexOf('TouchPad') == 0) {
		this.controller.window.onresize = this.handleOrientation.bind(this);
		this.handleOrientation();
	}
	
	if (this.controller.stageController.setWindowOrientation)
	{
    	this.controller.stageController.setWindowOrientation("free");
	}
	
	if (this.notFirstActivate)
	{
		
	}
	else
	{
		
	}
	this.notFirstActivate = true;
};

DockAssistant.prototype.handleOrientation = function() {
	
	if (this.controller) {
		this.controller.get('freq1Canvas').width = this.controller.window.innerWidth;
		dataHandler.graphs['freq1'].options.renderWidth  = this.controller.window.innerWidth;
		dataHandler.renderMiniLine('freq1');
		
		this.controller.get('freq2Canvas').width = this.controller.window.innerWidth;
		dataHandler.graphs['freq2'].options.renderWidth  = this.controller.window.innerWidth;
		dataHandler.renderMiniLine('freq2');
		
		this.controller.get('tempCanvas').width  = this.controller.window.innerWidth;
		dataHandler.graphs['temp'].options.renderWidth  = this.controller.window.innerWidth;
		dataHandler.renderMiniLine('temp');
		
		this.controller.get('currCanvas').width  = this.controller.window.innerWidth;
		dataHandler.graphs['curr'].options.renderWidth  = this.controller.window.innerWidth;
		dataHandler.renderMiniLine('curr');
		
		this.controller.get('loadCanvas').width  = this.controller.window.innerWidth;
		dataHandler.graphs['load'].options.renderWidth  = this.controller.window.innerWidth;
		dataHandler.renderMiniLine('load');
		
		this.controller.get('memCanvas').width   = this.controller.window.innerWidth;
		dataHandler.graphs['mem'].options.renderWidth  = this.controller.window.innerWidth;
		dataHandler.renderMiniLine('mem');
		
		//this.controller.get('stateCanvas').width = this.controller.window.innerWidth;
		//dataHandler.graphs['state'].options.renderWidth  = this.controller.window.innerWidth;
		//dataHandler.renderMiniBar('state');
	}
};


DockAssistant.prototype.deactivate = function(event)
{
};

DockAssistant.prototype.handleCommand = function(event)
{
};

DockAssistant.prototype.cleanup = function(event)
{
};

// Local Variables:
// tab-width: 4
// End:
