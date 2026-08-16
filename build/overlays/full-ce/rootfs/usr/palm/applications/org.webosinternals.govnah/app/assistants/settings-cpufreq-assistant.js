function SettingsCpufreqAssistant()
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
	
	this.governorModel = 
	{
		value: dataHandler.governor,
		choices: []
	};
	
	this.settingsModel = {};
	this.settingsLocation = {};
	this.settingsModified = {};
	
	this.scalingFrequencyChoices = dataHandler.scalingFrequencyChoices;
	
	this.cpuFrequencyChoices = dataHandler.cpuFrequencyChoices;
	this.systemFrequencyChoices = dataHandler.systemFrequencyChoices;

	this.samplingRates = {min:false, max:false}; 
	
	this.samplingDownChoices = [];
	for (var x = 1; x <= 10; x++)
	{
		this.samplingDownChoices.push({label:x, value:x});
	}
			
	this.downDifferentialChoices = [];
	for (var x = 1; x <= 30; x++)
	{
		this.downDifferentialChoices.push({label:x, value:x});
	}
			
	this.percentChoices = [];
	for (var x = 0; x <= 100; x = x + 5)
	{
		this.percentChoices.push({label:x + ' %', value:x});
	}
	
	this.powersaveChoices = [];
	for (var x = 0; x <= 10; x++)
	{
		this.powersaveChoices.push({label:x, value:x});
	}
	for (var x = 20; x <= 1000; x = x + 10)
	{
		this.powersaveChoices.push({label:x, value:x});
	}
			
	this.windowChoices = [];
	for (var x = 1; x <= 10; x++)
	{
		this.windowChoices.push({label:x + " Sec", value:x*1000});
	}
			
	this.tempChoices = [];
	for (var x = 40; x <= 60; x = x + 1)
	{
		this.tempChoices.push({label:x + ' C', value:x});
	}
	
	this.cpuVoltageLimits = {min:false, max:false}; 
	this.sysVoltageLimits = {min:false, max:false}; 
	
	this.factorChoices = [];
	this.factorChoices.push({label:"Low", value:1});
	this.factorChoices.push({label:"Medium", value:2});
	this.factorChoices.push({label:"High", value:3});
	this.factorChoices.push({label:"OMG?", value:4});
	
	this.jiffiesChoices = [];
	this.jiffiesChoices.push({label:90, value:90});
	for (var x = 100; x < 1000; x += 100)
	{
		this.jiffiesChoices.push({label:x, value:x});
	}
	for (var x = 1000; x < 10000; x = x + 1000)
	{
		this.jiffiesChoices.push({label:x, value:x});
	}
	
	this.secondsChoices = [];
	for (var x = 1; x < 10; x += 1)
	{
		this.secondsChoices.push({label:x + " Sec", value:x});
	}
	for (var x = 10; x <= 60; x += 10)
	{
		this.secondsChoices.push({label:x + " Sec", value:x});
	}
	
	this.milliSecondsChoices = [];
	for (var x = 100; x <= 1500; x += 100)
	{
		this.milliSecondsChoices.push({label:x/1000 + " Sec", value:x});
	}
	
};

SettingsCpufreqAssistant.prototype.setup = function()
{
	// setup menu
	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, this.menuModel);

	// setup governor list
	this.controller.setupWidget
	(
		'governor',
		{
			label: $L("Governor")
		},
		this.governorModel
	);
	this.governorChange = this.governorChange.bindAsEventListener(this);
	this.controller.listen('governor', Mojo.Event.propertyChange, this.governorChange);
	
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
	this.forms['standard']  = this.controller.get('governor_freq');
	this.forms['specific']  = this.controller.get('governor_params');
	this.forms['override']  = this.controller.get('governor_override');

	this.groups = new Array();
	this.groups['standard'] = this.controller.get('frequency_group');
	this.groups['standard'].style.display = 'block';
	this.groups['specific'] = this.controller.get('governor_group');
	this.groups['specific'].style.display = 'none';
	this.groups['override'] = this.controller.get('override_group');
	this.groups['override'].style.display = 'none';

	this.onGetParamsStandard  = this.onGetParams.bindAsEventListener(this, "standard");
	this.onGetParamsSpecific  = this.onGetParams.bindAsEventListener(this, "specific");
	this.onGetParamsOverride  = this.onGetParams.bindAsEventListener(this, "override");
	
	this.helpTap = this.helpRowTapped.bindAsEventListener(this);
	this.controller.listen(this.controller.get('help-toggle'), Mojo.Event.tap, this.helpButtonTapped.bindAsEventListener(this));
	this.controller.listen(this.controller.get('help-governor'), Mojo.Event.tap, this.helpTap);

	this.saveCompleteCpufreq   = this.saveCompleteCpufreq.bindAsEventListener(this);
	
	this.onSetParams = this.onSetParams.bindAsEventListener(this);
	
	this.getRequest = false;
	this.setRequest = false;

	// make it so nothing is selected by default
	this.controller.setInitialFocusedElement(null);

	this.reloadSettings();
	
	this.controller.get('cpu-frequency-title').innerHTML = $L("CPU Frequency");
	this.controller.get('governor-selection-title').innerHTML = $L("Governor Selection");
	this.controller.get('frequency-selection-title').innerHTML = $L("Frequency Selection");
	this.controller.get('governor-parameters-title').innerHTML = $L("Governor Parameters");
	this.controller.get('override-parameters-title').innerHTML = $L("Override Parameters");
	this.backElement = this.controller.get('icon');
	this.backTapHandler = this.backTap.bindAsEventListener(this);
	this.controller.listen(this.backElement, Mojo.Event.tap, this.backTapHandler);
};
SettingsCpufreqAssistant.prototype.backTap = function(event)
{
	this.controller.stageController.popScene();
};
SettingsCpufreqAssistant.prototype.governorChange = function(event)
{
	//alert('===========');
	//for (e in event) alert(e+' : '+event[e]);
	
	//alert(event.value);
	this.governorModel.value = event.value;
	if (this.setRequest) this.setRequest.cancel();
	this.setRequest = service.set_cpufreq_params(this.onSetParams, [{name:'scaling_governor', value:this.governorModel.value}], [], [], (Mojo.Environment.DeviceInfo.modelNameAscii.indexOf("TouchPad") == 0) ? 1 : 0);
};

SettingsCpufreqAssistant.prototype.onSetParams = function(payload)
{
	//alert('===========');
	//for (p in payload) alert(p+' : '+payload[p]);
	
	if (payload.returnValue == false) {
		this.errorMessage("Govnah", payload.errorText, payload.stdErr, function(){});
	}

	this.reloadSettings();
};

SettingsCpufreqAssistant.prototype.reloadSettings = function()
{
	this.settingsModel = {};
	this.settingsLocation = {};
	this.settingsModified = {};
	
	if (this.getRequest) this.getRequest.cancel();
	this.getRequest  = service.get_cpufreq_params(this.onGetParamsStandard);
};

SettingsCpufreqAssistant.prototype.onGetParams = function(payload, location)
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
	
	this.forms[location].update('');
	var newCount = 0;

	if (payload.params)
	{
		// initial loop
		for (var param = 0; param < payload.params.length; param++)
		{
			tmpParam = payload.params[param];
			
			//alert('-----');
			//for (p in tmpParam) alert(p + " : " + tmpParam[p]);

			switch(tmpParam.name)
			{
				case 'scaling_available_governors':
					this.governorModel.choices = [];
					var data = tmpParam.value.split(" ");
					if (data.length > 0)
					{
						for (d = 0; d < data.length; d++)
						{
							var tmpGov = trim(data[d]);
							if (tmpGov != "")
							{
								this.governorModel.choices.push({label:$L(tmpGov), value:tmpGov});
							}
						}
					}
					this.controller.modelChanged(this.governorModel);
					break;
				case 'scaling_governor':
					this.governorModel.value = "";
					this.governorModel.value = trim(tmpParam.value);
					this.controller.modelChanged(this.governorModel);
					break;
				
				case 'scaling_min_freq':
					dataHandler.currentLimits.min = trim(tmpParam.value);
					break;
				
				case 'scaling_max_freq':
					dataHandler.currentLimits.max = trim(tmpParam.value);
					break;
				
				case 'scaling_available_frequencies':
					this.scalingFrequencyChoices = [];
					var data = tmpParam.value.split(" ");
					if (data.length > 0)
					{
						for (d = 0; d < data.length; d++)
						{
							var tmpFreq = parseInt(trim(data[d]));
							if (tmpFreq)
							{
								if ((tmpFreq / 1000) >= 1000)
								{
									this.scalingFrequencyChoices.push({label:((tmpFreq/1000)/1000) + ' GHz', value:tmpFreq});
								}
								else
								{
									this.scalingFrequencyChoices.push({label:(tmpFreq/1000) + ' MHz', value:tmpFreq});
								}
							}
						}
					}
					break;
					
				case 'sampling_rate_max':
					this.samplingRates.max = parseInt(trim(tmpParam.value));
					//alert(this.samplingRates.max);
					break;
				case 'sampling_rate_min':
					this.samplingRates.min = parseInt(trim(tmpParam.value));
					//alert(this.samplingRates.min);
					break;

				case 'vdd_freqs':
				case 'vdd1_freqs':
					this.cpuFrequencyChoices = [];
					var data = tmpParam.value.split(" ");
					if (data.length > 0) {
						for (d = 0; d < data.length; d++) {
							var tmpFreq = parseInt(trim(data[d]));
							if (tmpFreq) {
								if ((tmpFreq) >= 1000) {
									this.cpuFrequencyChoices.push({label:((tmpFreq)/1000) + ' GHz', value:tmpFreq});
								}
								else {
									this.cpuFrequencyChoices.push({label:(tmpFreq) + ' MHz', value:tmpFreq});
								}
							}
						}
					}
					break;
					
				case 'vdd_max':
				case 'vdd1_vsel_max':
					this.cpuVoltageLimits.max = parseInt(trim(tmpParam.value));
					//alert(this.cpuVoltageLimits.max);
					break;

				case 'vdd_min':
				case 'vdd1_vsel_min':
					this.cpuVoltageLimits.min = parseInt(trim(tmpParam.value));
					//alert(this.cpuVoltageLimits.min);
					break;

				case 'vdd2_freq': // yes, reverse of what you would expect for singular name
					this.systemFrequencyChoices = [];
					var data = tmpParam.value.split(" ");
					if (data.length > 0) {
						for (d = 0; d < data.length; d++) {
							var tmpFreq = parseInt(trim(data[d]));
							if (tmpFreq) {
								if ((tmpFreq) >= 1000) {
									this.systemFrequencyChoices.push({label:((tmpFreq)/1000) + ' GHz', value:tmpFreq});
								}
								else {
									this.systemFrequencyChoices.push({label:(tmpFreq) + ' MHz', value:tmpFreq});
								}
							}
						}
					}
					break;
					
				case 'vdd2_freqs': // yes, reverse of what you would expect for plural name
					this.systemFrequencyChoices = [];
					var data = tmpParam.value.split(" ");
					if (data.length > 0) {
						var tmpFreq = parseInt(trim(data[0]));
						if (tmpFreq) {
							if ((tmpFreq) >= 1000) {
								this.systemFrequencyChoices.push({label:((tmpFreq)/1000) + ' GHz', value:tmpFreq});
							}
							else {
								this.systemFrequencyChoices.push({label:(tmpFreq) + ' MHz', value:tmpFreq});
							}
						}
					}
					break;
					
				case 'vdd2_vsel_max':
					this.sysVoltageLimits.max = parseInt(trim(tmpParam.value));
					//alert(this.sysVoltageLimits.max);
					break;
				case 'vdd2_vsel_min':
					this.sysVoltageLimits.min = parseInt(trim(tmpParam.value));
					//alert(this.sysVoltageLimits.min);
					break;
			}
		}
		
		
		// second loop
		for (var param = 0; param < payload.params.length; param++)
		{
			tmpParam = payload.params[param];

			if (tmpParam.writeable && tmpParam.name != 'scaling_governor')
			{
				//alert('-----');
				//for (p in tmpParam) alert(p + " : " + tmpParam[p]);
				
				if (dataHandler.settings[tmpParam.name])
				{
					switch(dataHandler.settings[tmpParam.name].type)
					{
						case 'listFreq':
							this.forms[location].insert({bottom: Mojo.View.render({object: {id: tmpParam.name}, template: 'settings/listselect-widget'})});
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
							this.controller.listen(tmpParam.name, Mojo.Event.propertyChange,
												   this.modifiedSetting.bindAsEventListener(this));
							break;
						case 'listPcnt':
							this.forms[location].insert({bottom: Mojo.View.render({object: {id: tmpParam.name}, template: 'settings/listselect-widget'})});
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
							this.controller.listen(tmpParam.name, Mojo.Event.propertyChange,
												   this.modifiedSetting.bindAsEventListener(this));
							break;
						case 'listPowr':
							this.forms[location].insert({bottom: Mojo.View.render({object: {id: tmpParam.name}, template: 'settings/listselect-widget'})});
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
							this.controller.listen(tmpParam.name, Mojo.Event.propertyChange,
												   this.modifiedSetting.bindAsEventListener(this));
							break;
						case 'listSamp':
							this.forms[location].insert({bottom: Mojo.View.render({object: {id: tmpParam.name}, template: 'settings/listselect-widget'})});
							newCount++;
							this.settingsModel[tmpParam.name] = tmpParam.value;
							this.settingsLocation[tmpParam.name] = location;
							var samplingChoices = [];
							if (this.samplingRates.max !== false && this.samplingRates.min !== false)
							{
								for (var s = 10000; s <= 90000; s = s + 10000) {
									if (s >= this.samplingRates.min) {
										var sec = (s / 1000000);
										var display = sec+' Sec';
										samplingChoices.push({label:display, value:s});
									}
								}
								for (var s = 100000; s <= 2000000; s = s + 100000) {
									if (s >= this.samplingRates.min) {
										var sec = (s / 1000000);
										var display = sec+' Sec';
										samplingChoices.push({label:display, value:s});
									}
								}
								for (var s = 3000000; s <= 10000000; s = s + 1000000) {
									var sec = (s / 1000000);
									var display = sec+' Sec';
									samplingChoices.push({label:display, value:s});
								}
								for (var s = 20000000; s <= 100000000; s = s + 10000000) {
									if (s <= this.samplingRates.max) {
										var min = 0;
										var sec = (s / 1000000);
										if (sec / 60 >= 1) {
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
							this.controller.listen(tmpParam.name, Mojo.Event.propertyChange,
												   this.modifiedSetting.bindAsEventListener(this));
							break;
						case 'listSampDown':
							this.forms[location].insert({bottom: Mojo.View.render({object: {id: tmpParam.name}, template: 'settings/listselect-widget'})});
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
							this.controller.listen(tmpParam.name, Mojo.Event.propertyChange,
												   this.modifiedSetting.bindAsEventListener(this));
							break;
						case 'listDownDiff':
							this.forms[location].insert({bottom: Mojo.View.render({object: {id: tmpParam.name}, template: 'settings/listselect-widget'})});
							newCount++;
							this.settingsModel[tmpParam.name] = tmpParam.value;
							this.settingsLocation[tmpParam.name] = location;
							this.controller.setupWidget
							(
								tmpParam.name,
								{
									label: dataHandler.settingLabel(tmpParam.name),
									modelProperty: tmpParam.name,
									choices: this.downDifferentialChoices
								},
								this.settingsModel
							);
							this.controller.listen(tmpParam.name, Mojo.Event.propertyChange,
												   this.modifiedSetting.bindAsEventListener(this));
							break;
						case 'listMem':
							this.forms[location].insert({bottom: Mojo.View.render({object: {id: tmpParam.name}, template: 'settings/listselect-widget'})});
							newCount++;
							this.settingsModel[tmpParam.name] = tmpParam.value;
							this.settingsLocation[tmpParam.name] = location;
							this.controller.setupWidget
							(
								tmpParam.name,
								{
									label: dataHandler.settingLabel(tmpParam.name),
									modelProperty: tmpParam.name,
									choices: this.memoryChoices
								},
								this.settingsModel
							);
							this.controller.listen(tmpParam.name, Mojo.Event.propertyChange,
												   this.modifiedSetting.bindAsEventListener(this));
							break;
							
						case 'toggleTF':
							this.forms[location].insert({bottom: Mojo.View.render({object: {label:dataHandler.settingLabel(tmpParam.name), id: tmpParam.name}, template: 'settings/toggle-widget'})});
							newCount++;
							this.settingsModel[tmpParam.name] = tmpParam.value;
							this.settingsLocation[tmpParam.name] = location;
							this.controller.setupWidget
							(
								tmpParam.name,
								{
						  			trueLabel: $L('True'),
									trueValue: '1',
						 			falseLabel: $L('False'),
									falseValue: '0',
									modelProperty: tmpParam.name
								},
								this.settingsModel
							);
							this.controller.listen(tmpParam.name, Mojo.Event.propertyChange,
												   this.modifiedSetting.bindAsEventListener(this));
							break;

						case 'listWindow':
							this.forms[location].insert({bottom: Mojo.View.render({object: {id: tmpParam.name}, template: 'settings/listselect-widget'})});
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
							this.controller.listen(tmpParam.name, Mojo.Event.propertyChange,
												   this.modifiedSetting.bindAsEventListener(this));
							break;


						case 'listTemp':
							this.forms[location].insert({bottom: Mojo.View.render({object: {id: tmpParam.name}, template: 'settings/listselect-widget'})});
							newCount++;
							this.settingsModel[tmpParam.name] = tmpParam.value;
							this.settingsLocation[tmpParam.name] = location;
							this.controller.setupWidget
							(
								tmpParam.name,
								{
									label: dataHandler.settingLabel(tmpParam.name),
									modelProperty: tmpParam.name,
									choices: this.tempChoices
								},
								this.settingsModel
							);
							this.controller.listen(tmpParam.name, Mojo.Event.propertyChange,
												   this.modifiedSetting.bindAsEventListener(this));
							break;
							
						case 'sceneVoltsCpuFreq':
							this.forms[location].insert({bottom: Mojo.View.render({object: {id: tmpParam.name, name: dataHandler.settingLabel(tmpParam.name), value: tmpParam.value}, template: 'settings/scene-widget'})});
							newCount++;
							this.settingsModel[tmpParam.name] = tmpParam.value;
							this.settingsLocation[tmpParam.name] = location;
							this.controller.listen(this.controller.get(tmpParam.name), Mojo.Event.tap, function(e, name)
							{
								this.controller.stageController.pushScene({name: 'settings-voltage'}, {name: name, value: this.settingsModel[name], group: $L('Frequencies'), labels: this.scalingFrequencyChoices, limits:this.cpuVoltageLimits}, this);
							}.bindAsEventListener(this, tmpParam.name));
							break;
							
						case 'sceneVoltsSysFreq':
							this.forms[location].insert({bottom: Mojo.View.render({object: {id: tmpParam.name, name: dataHandler.settingLabel(tmpParam.name), value: tmpParam.value}, template: 'settings/scene-widget'})});
							newCount++;
							this.settingsModel[tmpParam.name] = tmpParam.value;
							this.settingsLocation[tmpParam.name] = location;
							this.controller.listen(this.controller.get(tmpParam.name), Mojo.Event.tap, function(e, name)
							{
								this.controller.stageController.pushScene({name: 'settings-voltage'}, {name: name, value: this.settingsModel[name], group: $L('Frequencies'), labels: this.systemFrequencyChoices, limits:this.sysVoltageLimits}, this);
							}.bindAsEventListener(this, tmpParam.name));
							break;
							
						case 'sceneVoltsLoad':
							this.forms[location].insert({bottom: Mojo.View.render({object: {id: tmpParam.name, name: dataHandler.settingLabel(tmpParam.name), value: tmpParam.value}, template: 'settings/scene-widget'})});
							newCount++;
							this.settingsModel[tmpParam.name] = tmpParam.value;
							this.settingsLocation[tmpParam.name] = location;
							this.controller.listen(this.controller.get(tmpParam.name), Mojo.Event.tap, function(e, name)
							{
								this.controller.stageController.pushScene({name: 'settings-voltage'}, {name: name, value: this.settingsModel[name], group: $L('CPU Load'), labels: [{label: $L('Max')}, {label: $L('Mid')}, {label: $L('Low')}], limits:this.cpuVoltageLimits}, this);
							}.bindAsEventListener(this, tmpParam.name));
							break;

						case 'listFactor':
							this.forms[location].insert({bottom: Mojo.View.render({object: {id: tmpParam.name}, template: 'settings/listselect-widget'})});
							newCount++;
							this.settingsModel[tmpParam.name] = tmpParam.value;
							this.settingsLocation[tmpParam.name] = location;
							this.controller.setupWidget
							(
								tmpParam.name,
								{
									label: dataHandler.settingLabel(tmpParam.name),
									modelProperty: tmpParam.name,
									choices: this.factorChoices
								},
								this.settingsModel
							);
							this.controller.listen(tmpParam.name, Mojo.Event.propertyChange,
												   this.modifiedSetting.bindAsEventListener(this));
							break;

						case 'listJiffies':
							this.forms[location].insert({bottom: Mojo.View.render({object: {id: tmpParam.name}, template: 'settings/listselect-widget'})});
							newCount++;
							this.settingsModel[tmpParam.name] = tmpParam.value;
							this.settingsLocation[tmpParam.name] = location;
							this.controller.setupWidget
							(
								tmpParam.name,
								{
									label: dataHandler.settingLabel(tmpParam.name),
									modelProperty: tmpParam.name,
									choices: this.jiffiesChoices
								},
								this.settingsModel
							);
							this.controller.listen(tmpParam.name, Mojo.Event.propertyChange,
												   this.modifiedSetting.bindAsEventListener(this));
							break;

						case 'listMilliSeconds':
							this.forms[location].insert({bottom: Mojo.View.render({object: {id: tmpParam.name}, template: 'settings/listselect-widget'})});
							newCount++;
							this.settingsModel[tmpParam.name] = tmpParam.value;
							this.settingsLocation[tmpParam.name] = location;
							this.controller.setupWidget
							(
								tmpParam.name,
								{
									label: dataHandler.settingLabel(tmpParam.name),
									modelProperty: tmpParam.name,
									choices: this.milliSecondsChoices
								},
								this.settingsModel
							);
							this.controller.listen(tmpParam.name, Mojo.Event.propertyChange,
												   this.modifiedSetting.bindAsEventListener(this));
							break;

						case 'listSeconds':
							this.forms[location].insert({bottom: Mojo.View.render({object: {id: tmpParam.name}, template: 'settings/listselect-widget'})});
							newCount++;
							this.settingsModel[tmpParam.name] = tmpParam.value;
							this.settingsLocation[tmpParam.name] = location;
							this.controller.setupWidget
							(
								tmpParam.name,
								{
									label: dataHandler.settingLabel(tmpParam.name),
									modelProperty: tmpParam.name,
									choices: this.secondsChoices
								},
								this.settingsModel
							);
							this.controller.listen(tmpParam.name, Mojo.Event.propertyChange,
												   this.modifiedSetting.bindAsEventListener(this));
							break;
					}
				}
				else
				{
					this.forms[location].insert({bottom: Mojo.View.render({object: {label:tmpParam.name.replace(/_/g, " "), id: tmpParam.name}, template: 'settings/textfield-widget'})});
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
					this.controller.listen(tmpParam.name, Mojo.Event.propertyChange,
										   this.modifiedSetting.bindAsEventListener(this));
				}
			}
		}
	}

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
	
	if (location == "standard") {
		if (this.getRequest) this.getRequest.cancel();
		this.getRequest  = service.get_cpufreq_params(this.onGetParamsSpecific, this.governorModel.value);
	}
	else if (location == "specific") {
		if (this.getRequest) this.getRequest.cancel();
		this.getRequest  = service.get_cpufreq_params(this.onGetParamsOverride, "override");
	}
	else if (location == "override") {
		if (this.getRequest) this.getRequest.cancel();
		this.getRequest = false;
	}
};

SettingsCpufreqAssistant.prototype.modifiedSetting = function(event)
{
	this.settingsModified[event.property] = true;
	//alert(event.property+" changed to "+event.value);
};

SettingsCpufreqAssistant.prototype.helpButtonTapped = function(event)
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
SettingsCpufreqAssistant.prototype.helpRowTapped = function(event)
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

SettingsCpufreqAssistant.prototype.saveButtonPressed = function(event)
{
	//alert('-------');
	//for (var m in this.settingsModel) alert(m+" : "+this.settingsModel[m]);
	//for (var m in this.settingsLocation) alert(m+" : "+this.settingsLocation[m]);
	
	var standardParams = [];
	var specificParams = [];
	var overrideParams = [];
	
	standardParams.push({name:"scaling_governor", value:this.governorModel.value});

	for (var m in this.settingsModel) {
		if (this.settingsModified[m]) {
			if (this.settingsLocation[m] == "standard") {
				if ((m == "scaling_min_freq") &&
					(parseFloat(this.settingsModel[m]) > parseFloat(dataHandler.currentLimits.max))) {
					alert("newmin: "+this.settingsModel[m]+" greater than oldmax: "+dataHandler.currentLimits.max);
					// Push the max frequency first to allow for the new min
					standardParams.push({name:"scaling_max_freq", value:String(this.settingsModel["scaling_max_freq"])});
				}
				if ((m == "scaling_max_freq") &&
					(parseFloat(this.settingsModel[m]) < parseFloat(dataHandler.currentLimits.min))) {
					alert("newmmax: "+this.settingsModel[m]+" less than oldmin: "+dataHandler.currentLimits.min);
					// Push the min frequency first to allow for the new max
					standardParams.push({name:"scaling_min_freq", value:String(this.settingsModel["scaling_min_freq"])});
				}
				standardParams.push({name:m, value:String(this.settingsModel[m])});
			}
			else if (this.settingsLocation[m] == "specific") {
				specificParams.push({name:m, value:String(this.settingsModel[m])});
			}
			else if (this.settingsLocation[m] == "override") {
				overrideParams.push({name:m, value:String(this.settingsModel[m])});
			}
		}
	}
	
	if (this.setRequest) this.setRequest.cancel();
	this.setRequest = service.set_cpufreq_params(this.saveCompleteCpufreq,
												 standardParams,
												 specificParams,
												 overrideParams,
												 (Mojo.Environment.DeviceInfo.modelNameAscii.indexOf("TouchPad") == 0) ? 1 : 0);
};

SettingsCpufreqAssistant.prototype.saveCompleteCpufreq = function(payload)
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

SettingsCpufreqAssistant.prototype.errorMessage = function(title, message, stdErr, okFunction)
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

SettingsCpufreqAssistant.prototype.activate = function(event)
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
SettingsCpufreqAssistant.prototype.handleCommand = function(event)
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

SettingsCpufreqAssistant.prototype.onlyNumbers = function (charCode)
{
	if (charCode > 47 && charCode < 58) {
		return true;
	}
	return false;
}

SettingsCpufreqAssistant.prototype.cleanup = function(event)
{
	this.controller.stopListening(this.backElement,  Mojo.Event.tap, this.backTapHandler);
};



// Local Variables:
// tab-width: 4
// End:
