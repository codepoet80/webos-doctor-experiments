function SettingsVoltageAssistant(param, parent)
{
	this.param =	param;
	this.parent =	parent;
	
	this.voltages = this.param.value.split(' ');
	this.voltageModel = {};
	
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
	
	this.voltageModified = false;

};

SettingsVoltageAssistant.prototype.setup = function()
{
	// setup menu
	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, this.menuModel);
	
	this.controller.get('voltage-title').update(dataHandler.settingLabel(this.param.name));
	this.controller.get('voltage-selection-title').update(this.param.group);
	
	this.group = this.controller.get('volt_group');
	this.group.update('');
	
	for (var num = 0; num < this.param.labels.length; num++)
	{
		this.group.insert({bottom: Mojo.View.render({object: {id: 'volt_'+num, rowClass: (num == 0 ? 'first' : (num == this.param.labels.length-1 ? 'last' : ''))}, template: 'settings/listselect-widget'})});
		this.voltageModel['volt_'+num] = this.voltages[num];
		
		var voltageChoices = [];
		if (this.param.limits.max !== false && this.param.limits.min !== false)
		{
			var voltMin = parseInt(this.voltages[num])-5;
			var voltMax = parseInt(this.voltages[num])+5;
			if (Mojo.Environment.DeviceInfo.modelNameAscii == "Veer" ||
				Mojo.Environment.DeviceInfo.modelNameAscii == "Pre3") {
				voltMin = parseInt(this.voltages[num])-125000;
				voltMax = parseInt(this.voltages[num])+125000;
			}
			if (Mojo.Environment.DeviceInfo.modelNameAscii.indexOf("TouchPad") == 0) {
				voltMin = parseInt(this.voltages[num])-62500;
				voltMax = parseInt(this.voltages[num])+62500;
			}
			if (voltMin < this.param.limits.min) voltMin = this.param.limits.min;
			if (voltMax > this.param.limits.max) voltMax = this.param.limits.max;
			for (var s = voltMax; s >= voltMin; s--)
			{
				var display = ((s * 12.5) + 600) +' mV ('+s+')';
				if (Mojo.Environment.DeviceInfo.modelNameAscii == "Veer" ||
					Mojo.Environment.DeviceInfo.modelNameAscii == "Pre3" ||
					Mojo.Environment.DeviceInfo.modelNameAscii.indexOf("TouchPad") == 0) {
					display = s/1000 +' mV';
				}
				voltageChoices.push({label: display, value: s});
				if (Mojo.Environment.DeviceInfo.modelNameAscii == "Veer" ||
					Mojo.Environment.DeviceInfo.modelNameAscii == "Pre3") {
					s -= 24999;
				}
				if (Mojo.Environment.DeviceInfo.modelNameAscii.indexOf("TouchPad") == 0) {
					s -= 12499;
				}
			}
		}
		else
		{
			var voltMin = parseInt(this.voltages[num])-5;
			var voltMax = parseInt(this.voltages[num])+5;
			if (Mojo.Environment.DeviceInfo.modelNameAscii == "Veer" ||
				Mojo.Environment.DeviceInfo.modelNameAscii == "Pre3") {
				voltMin = parseInt(this.voltages[num])-125000;
				voltMax = parseInt(this.voltages[num])+125000;
			}
			if (Mojo.Environment.DeviceInfo.modelNameAscii.indexOf("TouchPad") == 0) {
				voltMin = parseInt(this.voltages[num])-62500;
				voltMax = parseInt(this.voltages[num])+62500;
			}
			for (var s = voltMax; s >= voltMin; s--)
			{
				var display = ((s * 12.5) + 600) +' mV ('+s+')';
				if (Mojo.Environment.DeviceInfo.modelNameAscii == "Veer" ||
					Mojo.Environment.DeviceInfo.modelNameAscii == "Pre3" ||
					Mojo.Environment.DeviceInfo.modelNameAscii.indexOf("TouchPad") == 0) {
					display = s/1000 +' mV';
				}
				voltageChoices.push({label: display, value: s});
				if (Mojo.Environment.DeviceInfo.modelNameAscii == "Veer" ||
					Mojo.Environment.DeviceInfo.modelNameAscii == "Pre3") {
					s -= 24999;
				}
				if (Mojo.Environment.DeviceInfo.modelNameAscii.indexOf("TouchPad") == 0) {
					s -= 12499;
				}
			}
		}
		
		this.controller.setupWidget
		(
			'volt_'+num,
			{
				label: this.param.labels[num].label,
				modelProperty: 'volt_'+num,
				choices: voltageChoices
			},
			this.voltageModel
		);
		
		this.controller.listen('volt_'+num, Mojo.Event.propertyChange, this.freqVoltChanged.bindAsEventListener(this, num));
	}
	this.backElement = this.controller.get('icon');
	this.backTapHandler = this.backTap.bindAsEventListener(this);
	this.controller.listen(this.backElement, Mojo.Event.tap, this.backTapHandler);
};
SettingsVoltageAssistant.prototype.backTap = function(event)
{
	this.controller.stageController.popScene();
};
SettingsVoltageAssistant.prototype.freqVoltChanged = function(event, num)
{
	this.voltageModified = true;
	//alert(this.getNewString());
};

SettingsVoltageAssistant.prototype.getNewString = function()
{
	var string = '';
	for (var x in this.voltageModel)
	{
		//alert('** - ' + x + ': ' + this.voltageModel[x]);
		if (string != '') string += ' ';
		string += this.voltageModel[x];
	}
	return string;
};

SettingsVoltageAssistant.prototype.activate = function(event)
{
	
};
SettingsVoltageAssistant.prototype.handleCommand = function(event)
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

SettingsVoltageAssistant.prototype.cleanup = function(event)
{
	this.parent.settingsModel[this.param.name] = this.getNewString();
	this.parent.settingsModified[this.param.name] = this.voltageModified;
	//alert(this.param.name+" changed to "+this.parent.settingsModel[this.param.name]);
	this.controller.stopListening(this.backElement,  Mojo.Event.tap, this.backTapHandler);
};



// Local Variables:
// tab-width: 4
// End:
