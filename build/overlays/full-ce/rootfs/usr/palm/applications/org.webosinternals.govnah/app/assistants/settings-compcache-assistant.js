function SettingsCompcacheAssistant()
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
	
	this.settingsModel = {};
	this.settingsLocation = {};

	this.memoryChoices = [];
	this.memoryChoices.push({label:  "8MB", value:  8*1024});
	this.memoryChoices.push({label: "10MB", value: 10*1024});
	this.memoryChoices.push({label: "12MB", value: 12*1024});
	this.memoryChoices.push({label: "14MB", value: 14*1024});
	this.memoryChoices.push({label: "16MB", value: 16*1024});
	this.memoryChoices.push({label: "24MB", value: 24*1024});
	this.memoryChoices.push({label: "32MB", value: 32*1024});
	this.memoryChoices.push({label: "48MB", value: 48*1024});
	this.memoryChoices.push({label: "64MB", value: 64*1024});
	this.memoryChoices.push({label: "96MB", value: 96*1024});
	this.memoryChoices.push({label:"128MB", value:128*1024});
	
};

SettingsCompcacheAssistant.prototype.setup = function()
{
	// setup menu
	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, this.menuModel);
	
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
	
	this.forms = new Array();
	this.forms['compcache'] = this.controller.get('compcache_config');

	this.groups = new Array();
	this.groups['compcache'] = this.controller.get('compcache_group');
	this.groups['compcache'].style.display = 'none';

	this.onGetParamsCompcache = this.onGetParams.bindAsEventListener(this, "compcache");
	
	this.helpTap = this.helpRowTapped.bindAsEventListener(this);
	this.controller.listen(this.controller.get('help-toggle'), Mojo.Event.tap, this.helpButtonTapped.bindAsEventListener(this));

	this.saveCompleteCompcache = this.saveCompleteCompcache.bindAsEventListener(this);
	
	this.onSetParams = this.onSetParams.bindAsEventListener(this);
	
	this.getRequest = false;
	this.setRequest = false;

	// make it so nothing is selected by default
	this.controller.setInitialFocusedElement(null);

	this.reloadSettings();
	
	this.controller.get('compressed-swap-title').innerHTML = $L("Compressed Swap");
	this.controller.get('compcache-configuration-title').innerHTML = $L("Compcache Configuration");
	this.backElement = this.controller.get('icon');
	this.backTapHandler = this.backTap.bindAsEventListener(this);
	this.controller.listen(this.backElement, Mojo.Event.tap, this.backTapHandler);
};
SettingsCompcacheAssistant.prototype.backTap = function(event)
{
	this.controller.stageController.popScene();
};

SettingsCompcacheAssistant.prototype.onSetParams = function(payload)
{
	//alert('===========');
	//for (p in payload) alert(p+' : '+payload[p]);
	
	if (payload.returnValue == false) {
		this.errorMessage("Govnah", payload.errorText, payload.stdErr, function(){});
	}

	this.reloadSettings();
};

SettingsCompcacheAssistant.prototype.reloadSettings = function()
{
	this.settingsModel = {};
	this.settingsLocation = {};
	
	if (this.getRequest) this.getRequest.cancel();
	this.getRequest = service.get_compcache_config(this.onGetParamsCompcache);
};

SettingsCompcacheAssistant.prototype.onGetParams = function(payload, location)
{
	if (payload.returnValue == false) {
		this.errorMessage("Govnah", payload.errorText, payload.stdErr, function(){});
	}
	
	/*
	alert('=========== ' + location);
	for (var p in payload) {
		if (p == "params") {
			alert('params:');
			for (var a = 0; a < payload.params.length; a++) {
				tmpParam = payload.params[a];
				for (var b in tmpParam) {
					alert('    ' + b + " : " + tmpParam[b]);
				}
			}
		} else {
			alert(p+' : '+payload[p]);
		}
	}
	*/
	
	var newHTML = '';
	var newCount = 0;

	if (payload.params)
	{
		// only loop
		for (var param = 0; param < payload.params.length; param++)
		{
			tmpParam = payload.params[param];

			if (tmpParam.writeable)
			{
				//alert('-----');
				//for (p in tmpParam) alert(p + " : " + tmpParam[p]);
				
				if (dataHandler.settings[tmpParam.name])
				{
					switch(dataHandler.settings[tmpParam.name].type)
					{
						case 'listFreq':
							newHTML += Mojo.View.render({object: {id: tmpParam.name}, template: 'settings/listselect-widget'});
							newCount++;
							this.settingsModel[tmpParam.name] = tmpParam.value;
							this.settingsLocation[tmpParam.name] = location;
							this.controller.setupWidget
							(
								tmpParam.name,
								{
									label: dataHandler.settingLabel(tmpParam.name),
									modelProperty: tmpParam.name,
									choices: this.scalingFrequencyChoices
								},
								this.settingsModel
							);
							break;
						case 'listPcnt':
							newHTML += Mojo.View.render({object: {id: tmpParam.name}, template: 'settings/listselect-widget'});
							newCount++;
							this.settingsModel[tmpParam.name] = tmpParam.value;
							this.settingsLocation[tmpParam.name] = location;

							this.controller.setupWidget
							(
								tmpParam.name,
								{
									label: dataHandler.settingLabel(tmpParam.name),
									modelProperty: tmpParam.name,
									choices: this.percentChoices
								},
								this.settingsModel
							);
							break;
						case 'listPowr':
							newHTML += Mojo.View.render({object: {id: tmpParam.name}, template: 'settings/listselect-widget'});
							newCount++;
							this.settingsModel[tmpParam.name] = tmpParam.value;
							this.settingsLocation[tmpParam.name] = location;
							this.controller.setupWidget
							(
								tmpParam.name,
								{
									label: dataHandler.settingLabel(tmpParam.name),
									modelProperty: tmpParam.name,
									choices: this.powersaveChoices
								},
								this.settingsModel
							);
							break;
						case 'listSamp':
							newHTML += Mojo.View.render({object: {id: tmpParam.name}, template: 'settings/listselect-widget'});
							newCount++;
							this.settingsModel[tmpParam.name] = tmpParam.value;
							this.settingsLocation[tmpParam.name] = location;
							var samplingChoices = [];
							if (this.samplingRates.max !== false && this.samplingRates.min !== false)
							{
								for (var s = this.samplingRates.min; s <= 2000000; s = s + 100000)
								{
									var sec = (s / 1000000);
									var display = sec+' Sec';
									samplingChoices.push({label:display, value:s});
								}
								for (var s = 3000000; s <= 10000000; s = s + 1000000)
								{
									var sec = (s / 1000000);
									var display = sec+' Sec';
									samplingChoices.push({label:display, value:s});
								}
								for (var s = 20000000; s <= this.samplingRates.max; s = s + 10000000)
								{
									var min = 0;
									var sec = (s / 1000000);
									if (sec / 60 >= 1)
									{
										min = Math.floor(sec / 60);
										sec = (sec % 60);
									}
									var display = '';
									if (min > 0) display += min+' Min';
									display += ' ';
									if (sec > 0) display += sec+' Sec';
									samplingChoices.push({label:display, value:s});
								}
							}
							else
							{
								samplingChoices.push({label:$L(tmpParam.value), value:tmpParam.value});
							}
							this.controller.setupWidget
							(
								tmpParam.name,
								{
									label: dataHandler.settingLabel(tmpParam.name),
									modelProperty: tmpParam.name,
									choices: samplingChoices
								},
								this.settingsModel
							);
							break;
						case 'listSampDown':
							newHTML += Mojo.View.render({object: {id: tmpParam.name}, template: 'settings/listselect-widget'});
							newCount++;
							this.settingsModel[tmpParam.name] = tmpParam.value;
							this.settingsLocation[tmpParam.name] = location;
							this.controller.setupWidget
							(
								tmpParam.name,
								{
									label: dataHandler.settingLabel(tmpParam.name),
									modelProperty: tmpParam.name,
									choices: this.samplingDownChoices
								},
								this.settingsModel
							);
							break;
						case 'listMem':
							newHTML += Mojo.View.render({object: {id: tmpParam.name}, template: 'settings/listselect-widget'});
							newCount++;
							this.settingsModel[tmpParam.name] = tmpParam.value;
							this.settingsLocation[tmpParam.name] = location;
							
							this.settingsModel[tmpParam.name+'_status'] = false;
							this.settingsLocation[tmpParam.name+'_status'] = 'IGNORE';
							if (dataHandler.settings[tmpParam.name].status)
							{
								if (this.settingsModel[dataHandler.settings[tmpParam.name].status] == 1)
								{
									this.settingsModel[tmpParam.name+'_status'] = true;
								}
								else
								{
									this.settingsModel[tmpParam.name+'_status'] = false;
								}
							}
							
							this.controller.setupWidget
							(
								tmpParam.name,
								{
									label: dataHandler.settingLabel(tmpParam.name),
									modelProperty: tmpParam.name,
									disabledProperty: tmpParam.name+'_status',
									choices: this.memoryChoices
								},
								this.settingsModel
							);
							break;
							
						case 'toggleTF':
							newHTML += Mojo.View.render({object: {label:dataHandler.settingLabel(tmpParam.name), id: tmpParam.name}, template: 'settings/toggle-widget'});
							newCount++;
							this.settingsModel[tmpParam.name] = tmpParam.value;
							this.settingsLocation[tmpParam.name] = location;
							this.controller.setupWidget
							(
								tmpParam.name,
								{
						  			trueLabel: $L("True"),
									trueValue: '1',
						 			falseLabel: $L("False"),
									falseValue: '0',
									modelProperty: tmpParam.name
								},
								this.settingsModel
							);
							break;

						case 'listWindow':
							newHTML += Mojo.View.render({object: {id: tmpParam.name}, template: 'settings/listselect-widget'});
							newCount++;
							this.settingsModel[tmpParam.name] = tmpParam.value;
							this.settingsLocation[tmpParam.name] = location;
							this.controller.setupWidget
							(
								tmpParam.name,
								{
									label: dataHandler.settingLabel(tmpParam.name),
									modelProperty: tmpParam.name,
									choices: this.windowChoices
								},
								this.settingsModel
							);
							break;
					}
				}
				else
				{
					newHTML += Mojo.View.render({object: {label:tmpParam.name.replace(/_/g, " "), id: tmpParam.name}, template: 'settings/textfield-widget'});
					newCount++;
					this.settingsModel[tmpParam.name] = tmpParam.value;
					this.settingsLocation[tmpParam.name] = location;
					this.controller.setupWidget
					(
						tmpParam.name,
						{
							modelProperty: tmpParam.name,
							multiline: false,
							enterSubmits: false,
							changeOnKeyPress: true,
							maxLength: 25,
							textCase: Mojo.Widget.steModeLowerCase,
							focusMode: Mojo.Widget.focusSelectMode,
							modifierState: Mojo.Widget.numLock,
							charsAllow: this.onlyNumbers.bind(this)
						},
						this.settingsModel
					);
				}
			}
		}
	}

	this.forms[location].innerHTML = newHTML;
	this.groups[location].style.display = ((newCount == 0)?'none':'block');
	this.controller.instantiateChildWidgets(this.forms[location]);		
	
	// update form styles so list looks OK
	var rows = this.forms[location].querySelectorAll('div.palm-row');
	for (var r = 0; r < rows.length; r++) {
		if (r == 0) rows[r].className = 'palm-row first';
		else if (r == rows.length-1) rows[r].className = 'palm-row last';
		else rows[r].className = 'palm-row';
	}
	
	var helps = this.forms[location].querySelectorAll('div.help-overlay');
	for (var h = 0; h < helps.length; h++) {
		this.controller.listen(helps[h], Mojo.Event.tap, this.helpTap);
	}

	if (location == "compcache") {
		if (this.getRequest) this.getRequest.cancel();
		this.getRequest = false;
	}
};

SettingsCompcacheAssistant.prototype.helpButtonTapped = function(event)
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
SettingsCompcacheAssistant.prototype.helpRowTapped = function(event)
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

SettingsCompcacheAssistant.prototype.saveButtonPressed = function(event)
{
	var compcacheConfig = [];
	
	for (var m in this.settingsModel)
	{
		if (this.settingsLocation[m] == "compcache")
		{
			compcacheConfig.push({name:m, value:String(this.settingsModel[m])});
		}
	}

	if (compcacheConfig.length) {
		if (this.setRequest) this.setRequest.cancel();
		this.setRequest = service.set_compcache_config(this.saveCompleteCompcache, compcacheConfig);
	}
	else {
		this.saveCompleteCompcache();
	}
};

SettingsCompcacheAssistant.prototype.saveCompleteCompcache = function(payload)
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

SettingsCompcacheAssistant.prototype.errorMessage = function(title, message, stdErr, okFunction)
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

SettingsCompcacheAssistant.prototype.activate = function(event)
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
SettingsCompcacheAssistant.prototype.handleCommand = function(event)
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

SettingsCompcacheAssistant.prototype.onlyNumbers = function (charCode)
{
	if (charCode > 47 && charCode < 58) {
		return true;
	}
	return false;
}

SettingsCompcacheAssistant.prototype.cleanup = function(event)
{
	this.controller.stopListening(this.backElement,  Mojo.Event.tap, this.backTapHandler);
};



// Local Variables:
// tab-width: 4
// End:
