function MainAssistant()
{
	// subtitle random list
	this.randomSub = 
	[
		{weight: 30, text: $L('The Advanced CPU Controller')},
		{weight: 30, text: $L('Take Control Of Your CPU')},
		{weight: 15, text: $L('Turn It Up To 11')},
		{weight: 15, text: $L('Ludicrous Speed')},
		{weight:  6, text: $L("<a href=\"https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=L8ALFGFJ7VJVJ\">Donated</a> To WebOS Internals Lately?")},
		{weight:  5, text: $L('Much Better Than Arnie')},
		{weight:  2, text: $L('Random Taglines Are Awesome')},
		{weight:  2, text: $L('I Would Like To Make Some Overclock')},
		{weight:  2, text: $L('Now With More Cowbell')},
		{weight:  2, text: $L('MOAR')}
	];
	
	// setup list model
	this.mainModel = {items:[]};
	
	// setup search model
	this.searchModel = { value: '' };
	this.searchText = '';
	
	// setup menu
	this.menuModel =
	{
		visible: true,
		items:
		[
			{
				label: $L("Preferences"),
				command: 'do-prefs'
			},
			{
				label: $L("Help"),
				command: 'do-help'
			}
		]
	};
	
	this.isVisible = false;
};

MainAssistant.prototype.setup = function()
{
	// set theme because this can be the first scene pushed
	var deviceTheme = '';
	if (Mojo.Environment.DeviceInfo.modelNameAscii == 'Pixi' ||
		Mojo.Environment.DeviceInfo.modelNameAscii == 'Veer')
		deviceTheme += ' small-device';
	if (Mojo.Environment.DeviceInfo.modelNameAscii.indexOf('TouchPad') == 0 ||
		Mojo.Environment.DeviceInfo.modelNameAscii == 'Emulator')
		deviceTheme += ' no-gesture';
	this.controller.document.body.className = prefs.get().theme + deviceTheme;
	
	// get elements
	this.iconElement =		this.controller.get('icon');
	this.titleElement =		this.controller.get('main-title');
	this.versionElement =	this.controller.get('version');
	this.kernelElement =	this.controller.get('kernel');
	this.subTitleElement =	this.controller.get('subTitle');
	this.profileRow =		this.controller.get('profileRow');
	this.profileCurrent =	this.controller.get('profileCurrent');
	
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
	this.stateRow =			this.controller.get('stateRow');
	
	// set version string random subtitle
	this.titleElement.innerHTML = Mojo.Controller.appInfo.title;
	this.versionElement.innerHTML = "v" + Mojo.Controller.appInfo.version;
	this.kernelElement.innerHTML = '';
	this.subTitleElement.innerHTML = this.getRandomSubTitle();
	
	// setup menu
	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, this.menuModel);
	
	
	this.profileTapHandler = this.profileTap.bindAsEventListener(this);
	
	this.controller.listen(this.profileRow, Mojo.Event.tap, this.profileTapHandler);
	
	
	this.controller.listen(this.freq1Row, Mojo.Event.tap, this.graphTap.bindAsEventListener(this, 'freq1'));
	this.controller.listen(this.freq2Row, Mojo.Event.tap, this.graphTap.bindAsEventListener(this, 'freq2'));
	this.controller.listen(this.tempRow, Mojo.Event.tap, this.graphTap.bindAsEventListener(this, 'temp'));
	this.controller.listen(this.currRow, Mojo.Event.tap, this.graphTap.bindAsEventListener(this, 'curr'));	
	this.controller.listen(this.loadRow, Mojo.Event.tap, this.graphTap.bindAsEventListener(this, 'load'));
	this.controller.listen(this.memRow,  Mojo.Event.tap, this.graphTap.bindAsEventListener(this, 'mem' ));
	//this.controller.listen(this.stateRow, Mojo.Event.tap, this.graphTap.bindAsEventListener(this, 'state'));
	
	
	this.visible = this.visible.bindAsEventListener(this);
	this.invisible = this.invisible.bindAsEventListener(this);
	this.controller.listen(this.controller.stageController.document, Mojo.Event.stageActivate,   this.visible);
	this.controller.listen(this.controller.stageController.document, Mojo.Event.stageDeactivate, this.invisible);
	
	this.visible();
	
	this.controller.get('main-scene-profile').innerHTML = $L("Profile");
	if (Mojo.Environment.DeviceInfo.modelNameAscii.indexOf("TouchPad") == 0) {
		this.controller.get('main-scene-frequency1').innerHTML = $L("CPU 1 Frequency");
		this.controller.get('main-scene-frequency2').innerHTML = $L("CPU 2 Frequency");
	}
	else {
		this.controller.get('main-scene-frequency1').innerHTML = $L("CPU Frequency");
		this.freq2Row.style.display = 'none';
	}
	if (Mojo.Environment.DeviceInfo.modelNameAscii == "Veer" ||
		Mojo.Environment.DeviceInfo.modelNameAscii == "Pre3" ||
		Mojo.Environment.DeviceInfo.modelNameAscii.indexOf("TouchPad") == 0) {
		this.controller.get('main-scene-temperature').innerHTML = $L("Battery Temperature");
	}
	else {
		this.controller.get('main-scene-temperature').innerHTML = $L("CPU Temperature");
	}
	this.controller.get('main-scene-battery-current').innerHTML = $L("Battery Current");
	this.controller.get('main-scene-load-average').innerHTML = $L("Load Average");
	this.controller.get('main-scene-memory-swap').innerHTML = $L("Memory / Swap");
	this.controller.get('main-scene-time-in-state').innerHTML = $L("CPU Time In State");
};


MainAssistant.prototype.profileTap = function(event)
{
	this.controller.stageController.pushScene('profiles');
}
MainAssistant.prototype.graphTap = function(event, display)
{
	this.controller.stageController.pushScene({name: 'graph', disableSceneScroller: true}, display);
}

MainAssistant.prototype.activate = function(event)
{
	dataHandler.setMainAssistant(this);
	dataHandler.start();
	
	if (Mojo.Environment.DeviceInfo.modelNameAscii.indexOf('TouchPad') == 0) {
		this.controller.window.onresize = this.handleOrientation.bind(this);
		this.handleOrientation();
	}
	
	if (this.controller.stageController.setWindowOrientation)
	{
		if (Mojo.Environment.DeviceInfo.modelNameAscii.indexOf('TouchPad') != 0 &&
			Mojo.Environment.DeviceInfo.modelNameAscii != 'Emulator') {
			this.controller.stageController.setWindowOrientation("up");
		}
	}
	
	if (this.firstActivate)
	{
		dataHandler.updateParams();
		dataHandler.delayedTimer(1000);
	}
	else
	{
	}
	this.firstActivate = true;
};
MainAssistant.prototype.deactivate = function(event)
{
};
MainAssistant.prototype.visible = function(event)
{
	if (!this.isVisible)
	{
		this.isVisible = true;
	}
	
	dataHandler.updateParams();
	dataHandler.delayedTimer(1000);
};
MainAssistant.prototype.invisible = function(event)
{
	this.isVisible = false;
};

MainAssistant.prototype.handleOrientation = function() {
	
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

MainAssistant.prototype.getRandomSubTitle = function()
{
	// loop to get total weight value
	var weight = 0;
	for (var r = 0; r < this.randomSub.length; r++)
	{
		weight += this.randomSub[r].weight;
	}
	
	// random weighted value
	var rand = Math.floor(Math.random() * weight);
	//alert('rand: ' + rand + ' of ' + weight);
	
	// loop through to find the random title
	for (var r = 0; r < this.randomSub.length; r++)
	{
		if (rand <= this.randomSub[r].weight)
		{
			return this.randomSub[r].text;
		}
		else
		{
			rand -= this.randomSub[r].weight;
		}
	}
	
	// if no random title was found (for whatever reason, wtf?) return first and best subtitle
	return this.randomSub[0].text;
};

MainAssistant.prototype.handleCommand = function(event)
{
	if (event.type == Mojo.Event.command)
	{
		switch (event.command)
		{
			case 'do-prefs':
				this.controller.stageController.pushScene('preferences');
				break;
				
			case 'do-help':
				this.controller.stageController.pushScene('help');
				break;
		}
	}
};

MainAssistant.prototype.cleanup = function(event)
{
	this.controller.stopListening(this.profileRow, Mojo.Event.tap, this.profileTapHandler);
	
	/*
	this.controller.stopListening(this.freq1Row, Mojo.Event.tap, this.graphTap.bindAsEventListener(this, 'freq1'));
	this.controller.stopListening(this.freq2Row, Mojo.Event.tap, this.graphTap.bindAsEventListener(this, 'freq2'));
	this.controller.stopListening(this.tempRow, Mojo.Event.tap, this.graphTap.bindAsEventListener(this, 'temp'));
	this.controller.stopListening(this.currRow, Mojo.Event.tap, this.graphTap.bindAsEventListener(this, 'curr'));	
	this.controller.stopListening(this.loadRow, Mojo.Event.tap, this.graphTap.bindAsEventListener(this, 'load'));
	this.controller.stopListening(this.memRow,  Mojo.Event.tap, this.graphTap.bindAsEventListener(this, 'mem' ));
	*/
	
	this.controller.stopListening(this.controller.stageController.document, Mojo.Event.stageActivate,   this.visible);
	this.controller.stopListening(this.controller.stageController.document, Mojo.Event.stageDeactivate, this.invisible);
};

// Local Variables:
// tab-width: 4
// End:
