function SettingsTcpcongAssistant()
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
	
	this.congestionModel = 
	{
		value: dataHandler.congestion,
		choices: []
	};
	
	this.congestionChoices = [];
	
};

SettingsTcpcongAssistant.prototype.setup = function()
{
	// setup menu
	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, this.menuModel);

	// setup governor list
	this.controller.setupWidget
	(
		'congestion',
		{
			label: $L("TCP Congestion")
		},
		this.congestionModel
	);
	this.congestionChange = this.congestionChange.bindAsEventListener(this);
	this.controller.listen('congestion', Mojo.Event.propertyChange, this.congestionChange);
	
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
	
	this.onGetCongestion  = this.onGetCongestion.bindAsEventListener(this);
	this.onGetAvailable  = this.onGetAvailable.bindAsEventListener(this);

	this.saveCompleteCongestion   = this.saveCompleteCongestion.bindAsEventListener(this);
	
	this.helpTap = this.helpRowTapped.bindAsEventListener(this);
	this.controller.listen(this.controller.get('help-toggle'), Mojo.Event.tap, this.helpButtonTapped.bindAsEventListener(this));
	this.controller.listen(this.controller.get('help-congestion'), Mojo.Event.tap, this.helpTap);
	
	this.onSetParams = this.onSetParams.bindAsEventListener(this);
	
	this.getRequest = false;
	this.setRequest = false;

	// make it so nothing is selected by default
	this.controller.setInitialFocusedElement(null);

	this.reloadSettings();
	
	this.controller.get('congestion-title').innerHTML = $L("TCP Congestion");
	this.controller.get('congestion-control-title').innerHTML = $L("TCP Congestion Control");
	this.backElement = this.controller.get('icon');
	this.backTapHandler = this.backTap.bindAsEventListener(this);
	this.controller.listen(this.backElement, Mojo.Event.tap, this.backTapHandler);
};
SettingsTcpcongAssistant.prototype.backTap = function(event)
{
	this.controller.stageController.popScene();
};
SettingsTcpcongAssistant.prototype.congestionChange = function(event)
{
	//alert('===========');
	//for (e in event) alert(e+' : '+event[e]);
	
	//alert(event.value);
	this.congestionModel.value = event.value;
	if (this.setRequest) this.setRequest.cancel();
	this.setRequest = service.set_tcp_congestion_control(this.onSetParams, this.congestionModel.value);
};

SettingsTcpcongAssistant.prototype.onSetParams = function(payload)
{
	//alert('===========');
	//for (p in payload) alert(p+' : '+payload[p]);
	
	if (payload.returnValue == false) {
		this.errorMessage("Govnah", payload.errorText, payload.stdErr, function(){});
	}

	this.reloadSettings();
};

SettingsTcpcongAssistant.prototype.reloadSettings = function()
{
	if (this.getRequest) this.getRequest.cancel();
	this.getRequest  = service.get_tcp_available_congestion_control(this.onGetAvailable);
};

SettingsTcpcongAssistant.prototype.onGetAvailable = function(payload)
{
	if (payload.returnValue == false) {
		this.errorMessage("Govnah", payload.errorText, payload.stdErr, function(){});
	}
	
	if (payload.stdOut) {
		var tmpParam = payload.stdOut[0];
		
		this.congestionModel.choices = [];
		var data = tmpParam.split(" ");
		if (data.length > 0) {
			for (d = 0; d < data.length; d++) {
				var tmpSched = trim(data[d]);
				if (tmpSched != "") {
					this.congestionModel.choices.push({label:$L(tmpSched), value:tmpSched});
				}
			}
		}
		this.controller.modelChanged(this.congestionModel);
	}

	if (this.getRequest) this.getRequest.cancel();
	this.getRequest  = service.get_tcp_congestion_control(this.onGetCongestion);
};

SettingsTcpcongAssistant.prototype.onGetCongestion = function(payload)
{
	if (payload.returnValue == false) {
		this.errorMessage("Govnah", payload.errorText, payload.stdErr, function(){});
	}
	
	if (payload.stdOut) {
		var tmpParam = payload.stdOut[0];
		
		this.congestionModel.value = trim(tmpParam);
		this.controller.modelChanged(this.congestionModel);
	}
};

SettingsTcpcongAssistant.prototype.helpButtonTapped = function(event)
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
SettingsTcpcongAssistant.prototype.helpRowTapped = function(event)
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
SettingsTcpcongAssistant.prototype.saveButtonPressed = function(event)
{
	if (this.setRequest) this.setRequest.cancel();
	this.setRequest = service.set_tcp_congestion_control(this.saveCompleteCongestion, this.congestionModel.value);
};

SettingsTcpcongAssistant.prototype.saveCompleteCongestion = function(payload)
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

SettingsTcpcongAssistant.prototype.errorMessage = function(title, message, stdErr, okFunction)
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

SettingsTcpcongAssistant.prototype.activate = function(event)
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
SettingsTcpcongAssistant.prototype.handleCommand = function(event)
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

SettingsTcpcongAssistant.prototype.cleanup = function(event)
{
	this.controller.stopListening(this.backElement,  Mojo.Event.tap, this.backTapHandler);
};



// Local Variables:
// tab-width: 4
// End:
