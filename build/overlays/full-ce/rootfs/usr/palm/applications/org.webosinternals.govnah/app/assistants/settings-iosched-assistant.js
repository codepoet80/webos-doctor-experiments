function SettingsIoschedAssistant()
{
	// setup menu
	this.menuModel =
	{
		visible: true,
		items:
		[
			{
				label: $L("Help"),
				command: 'do-help'
			}
		]
	};
	
	this.schedulerModel = 
	{
		value: dataHandler.ioScheduler,
		choices: []
	};
	
	this.schedulerChoices = [];
	
};

SettingsIoschedAssistant.prototype.setup = function()
{
	// setup menu
	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, this.menuModel);

	// setup governor list
	this.controller.setupWidget
	(
		'scheduler',
		{
			label: $L("IO Scheduler")
		},
		this.schedulerModel
	);
	this.schedulerChange = this.schedulerChange.bindAsEventListener(this);
	this.controller.listen('scheduler', Mojo.Event.propertyChange, this.schedulerChange);
	
	this.controller.setupWidget
	(
		'saveButton',
		{
			type: Mojo.Widget.activityButton
		},
		{
			buttonLabel: $L("Apply Settings")
		}
	);
	this.saveButtonElement = this.controller.get('saveButton');
	this.saveButtonPressed = this.saveButtonPressed.bindAsEventListener(this);
	this.controller.listen('saveButton', Mojo.Event.tap, this.saveButtonPressed);
	
	this.onGetScheduler  = this.onGetScheduler.bindAsEventListener(this);

	this.saveCompleteScheduler   = this.saveCompleteScheduler.bindAsEventListener(this);
	
	this.helpTap = this.helpRowTapped.bindAsEventListener(this);
	this.controller.listen(this.controller.get('help-toggle'), Mojo.Event.tap, this.helpButtonTapped.bindAsEventListener(this));
	this.controller.listen(this.controller.get('help-scheduler'), Mojo.Event.tap, this.helpTap);
	
	this.onSetParams = this.onSetParams.bindAsEventListener(this);
	
	this.getRequest = false;
	this.setRequest = false;

	// make it so nothing is selected by default
	this.controller.setInitialFocusedElement(null);

	this.reloadSettings();
	
	this.controller.get('io-scheduler-title').innerHTML = $L("I/O Scheduler");
	this.controller.get('scheduler-selection-title').innerHTML = $L("Scheduler Selection");
	this.backElement = this.controller.get('icon');
	this.backTapHandler = this.backTap.bindAsEventListener(this);
	this.controller.listen(this.backElement, Mojo.Event.tap, this.backTapHandler);
};
SettingsIoschedAssistant.prototype.backTap = function(event)
{
	this.controller.stageController.popScene();
};

SettingsIoschedAssistant.prototype.schedulerChange = function(event)
{
	//alert('===========');
	//for (e in event) alert(e+' : '+event[e]);
	
	//alert(event.value);
	this.schedulerModel.value = event.value;
	if (this.setRequest) this.setRequest.cancel();
	this.setRequest = service.set_io_scheduler(this.onSetParams, this.schedulerModel.value);
};

SettingsIoschedAssistant.prototype.onSetParams = function(payload)
{
	//alert('===========');
	//for (p in payload) alert(p+' : '+payload[p]);
	
	if (payload.returnValue == false) {
		this.errorMessage("Govnah", payload.errorText, payload.stdErr, function(){});
	}

	this.reloadSettings();
};

SettingsIoschedAssistant.prototype.reloadSettings = function()
{
	if (this.getRequest) this.getRequest.cancel();
	this.getRequest  = service.get_io_scheduler(this.onGetScheduler);
};

SettingsIoschedAssistant.prototype.onGetScheduler = function(payload)
{
	if (payload.returnValue == false) {
		this.errorMessage("Govnah", payload.errorText, payload.stdErr, function(){});
	}
	
	if (payload.stdOut) {
		var tmpParam = payload.stdOut[0];
		
		this.schedulerModel.choices = [];
		var data = tmpParam.split(" ");
		if (data.length > 0) {
			for (d = 0; d < data.length; d++) {
				var tmpSched = trim(data[d]);
				if (tmpSched != "") {
					alert("scheduler "+tmpSched);
					if (tmpSched.indexOf("[") == 0) {
						this.schedulerModel.value = tmpSched.substr(1,tmpSched.length-2);
						tmpSched = this.schedulerModel.value;
					}
					this.schedulerModel.choices.push({label:$L(tmpSched), value:tmpSched});
				}
			}
		}
		this.controller.modelChanged(this.schedulerModel);
	}
};

SettingsIoschedAssistant.prototype.helpButtonTapped = function(event)
{
	if (this.controller.get('container').hasClassName('help'))
	{
		this.controller.get('container').removeClassName('help');
		event.target.removeClassName('selected');
	}
	else
	{
		this.controller.get('container').addClassName('help');
		event.target.addClassName('selected');
	}
}
SettingsIoschedAssistant.prototype.helpRowTapped = function(event)
{
	event.stop();
	event.stopPropagation();
	event.preventDefault();
	
	var lookup = event.target.id.replace(/help-/, '');
	var help = helpData.get(lookup);
	
	if (lookup && help)
	{
		this.controller.stageController.pushScene('help-data', help);
	}
}

SettingsIoschedAssistant.prototype.saveButtonPressed = function(event)
{
	if (this.setRequest) this.setRequest.cancel();
	this.setRequest = service.set_io_scheduler(this.saveCompleteScheduler, this.schedulerModel.value);
};

SettingsIoschedAssistant.prototype.saveCompleteScheduler = function(payload)
{
	//alert('===========');
	//for (p in payload) alert(p+' : '+payload[p]);
	
	this.saveButtonElement.mojo.deactivate();

	if (payload.returnValue == false) {
		this.errorMessage("Govnah", payload.errorText, payload.stdErr, function(){});
		this.reloadSettings();
	}
	else {
		this.controller.stageController.popScene();
	}
};

SettingsIoschedAssistant.prototype.errorMessage = function(title, message, stdErr, okFunction)
{
	if (stdErr && stdErr.length) {
		message = message + '<br>' + stdErr.join('<br>');
	}

	this.controller.showAlertDialog(
	{
		allowHTMLMessage:	true,
		preventCancel:		true,
	    title:				title,
	    message:			message,
	    choices:			[{label:$L("Ok"), value:'ok'}],
	    onChoose:			okFunction.bindAsEventListener(this)
    });
};

SettingsIoschedAssistant.prototype.activate = function(event)
{
	if (this.controller.stageController.setWindowOrientation)
	{
		if (Mojo.Environment.DeviceInfo.modelNameAscii.indexOf('TouchPad') != 0 &&
			Mojo.Environment.DeviceInfo.modelNameAscii != 'Emulator')
			this.controller.stageController.setWindowOrientation("up");
	}
	
	if (this.firstActivate)
	{
		
	}
	this.firstActivate = true;
};
SettingsIoschedAssistant.prototype.handleCommand = function(event)
{
	if (event.type == Mojo.Event.command)
	{
		switch (event.command)
		{
			case 'do-help':
				this.controller.stageController.pushScene('help');
				break;
		}
	}
};

SettingsIoschedAssistant.prototype.cleanup = function(event)
{
	this.controller.stopListening(this.backElement,  Mojo.Event.tap, this.backTapHandler);
};



// Local Variables:
// tab-width: 4
// End:
