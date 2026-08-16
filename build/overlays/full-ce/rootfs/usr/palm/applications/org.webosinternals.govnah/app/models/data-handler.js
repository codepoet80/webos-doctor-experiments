function dataHandlerModel()
{
	/* this tells the settings scenes what nice name to give some settings,
	 * and what widget type it should use to render it. if it doesn't exist
	 * in this list, it will be rendered as a text box */
	this.settings = 
	{
		'scaling_min_freq':				{ type: 'listFreq',			nice: $L("min freq")		},
		'scaling_max_freq':				{ type: 'listFreq',			nice: $L("max freq")		},
		'scaling_setspeed':				{ type: 'listFreq',			nice: $L("setspeed")		},
		'up_threshold':					{ type: 'listPcnt'			},
		'down_threshold':				{ type: 'listPcnt'			},
		'down_differential':			{ type: 'listDownDiff'		},
		'freq_step':					{ type: 'listPcnt'			},
		'sampling_rate':				{ type: 'listSamp'			},
		'sampling_down_factor':			{ type: 'listSampDown'		},
		'powersave_bias':				{ type: 'listPowr'			},
		'ignore_nice_load':				{ type: 'toggleTF'			},
		'io_is_busy':					{ type: 'toggleTF'			},
		'power_saver':					{ type: 'toggleTF'			},
		'turbo_mode':					{ type: 'toggleTF'			},
		'max_tickle_window':			{ type: 'listWindow'		},
		'max_floor_window':				{ type: 'listWindow'		},
		'compcache_enabled':			{ type: 'toggleTF'			},
		'compcache_memlimit':			{ type: 'listMem',			status: 'compcache_enabled' },
		'vdd':							{ type: 'sceneVoltsCpuFreq',nice: $L("CPU Voltage")	},
		'vdd1_vsel':					{ type: 'sceneVoltsCpuFreq',nice: $L("CPU Voltage")	},
		'vdd2_vsel':					{ type: 'sceneVoltsSysFreq',nice: $L("System Voltage")	},
		'cpu_hightemp_reset':			{ type: 'listTemp',			nice: $L("temp reset")		},
		'cpu_hightemp_alarm':			{ type: 'listTemp',			nice: $L("temp limit")		},
		'cpu_hightemp_scaleback_speed':	{ type: 'listFreq',			nice: $L('temp scaleback')	},
		'battery_scaleback_percent':	{ type: 'listPcnt', 		nice: $L("batt low thresh")	},
		'battery_scaleback_speed':		{ type: 'listFreq',			nice: $L("batt low speed")	},
		'override_charger':				{ type: 'toggleTF'			},
		'charger_override':				{ type: 'toggleTF'			},
		'charger_poll_rate':			{ type: 'listSeconds'		},
		'vdemand_factor':				{ type: 'listFactor'		},
		'vdemand_enable':				{ type: 'toggleTF'			},
		'vdemand_poll_rate':			{ type: 'listMilliSeconds'	},
		'vdemand_vsel_vdd1':			{ type: 'sceneVoltsLoad',	nice: $L("CPU Voltage")},
		'vdemand_vsel_vdd2':			{ type: 'sceneVoltsLoad',	nice: $L("System Voltage")},
		'ondemand_enable':				{ type: 'toggleTF'			},
		'screenstate_enable':			{ type: 'toggleTF'			},
		'screen_off_max_freq':			{ type: 'listFreq',			nice: $L("screen off max freq")		},
	};
	
	this.mainAssistant = false;
	this.graphAssistant = false;
	this.settingsAssistant = false;
	this.dockAssistant = false;
	
	this.currentMode = "card";
	
	this.updatingParams = false;
	
	this.governor = false;
	this.compcache = false;
	this.profile = false;
	this.settingsStandard = [];
	this.settingsSpecific = [];
	this.settingsOverride = [];
	this.settingsCompcache = [];
	this.ioScheduler = false;
	this.congestion = false;
	
	this.scalingFrequencyChoices = [];
	this.cpuFrequencyChoices = [];
	this.systemFrequencyChoices = [];
	this.currentLimits = {min:false, max:false}; 
	
	this.iconDirty = false;
	
	this.lineData = $H();
	this.barData = {};
	
	this.timer = false;
	this.rate = parseInt(prefs.get().cardPollSpeed) * 1000;
	this.cutoff = 300;
	
	this.timerHandler = this.timerFunction.bind(this);
	
    this.freq1Handler  = this.freqHandler.bindAsEventListener(this, 1);
	this.freq2Handler  = this.freqHandler.bindAsEventListener(this, 2);
    this.tempHandler  = this.tempHandler.bindAsEventListener(this);
    this.currHandler  = this.currHandler.bindAsEventListener(this);
    this.loadHandler  = this.loadHandler.bindAsEventListener(this);
    this.memHandler   = this.memHandler.bindAsEventListener(this);
    this.stateHandler = this.stateHandler.bindAsEventListener(this, 1);
	
	this.graphs = $H();
	this.graphs["freq1"] = false;
	this.graphs["freq2"] = false;
	this.graphs["temp"] = false;
	this.graphs["curr"] = false;
	this.graphs["load"] = false;
	this.graphs["mem"] = false;
	this.graphs["state"] = false;
	
	this.strokes = $H();
	this.strokes["freq1"]  = "rgba(255, 153, 153, .4)";
	this.strokes["freq2"]  = "rgba(255, 153, 153, .4)";
	this.strokes["temp"]  = "rgba(153, 205, 153, .4)";
	this.strokes["curr1"] = "rgba(153, 205, 153, .4)";
	this.strokes["curr2"] = "rgba(255, 153, 153, .4)";
	this.strokes["load"]  = "rgba(153, 153, 255, .4)";
	this.strokes["mem"]   = "rgba(153, 153, 255, .4)";
	this.strokes["state"] = "rgba(153, 153, 153, .4)";

	this.fills = $H();
	this.fills["freq1"]    = "rgba(255, 153, 153, .2)";
	this.fills["freq2"]    = "rgba(255, 153, 153, .2)";
	this.fills["temp"]    = "rgba(153, 205, 153, .2)";
	this.fills["curr1"]   = "rgba(153, 205, 153, .2)";
	this.fills["curr2"]   = "rgba(255, 153, 153, .2)";
	this.fills["load"]    = "rgba(153, 153, 255, .2)";
	this.fills["mem"]     = "rgba(153, 153, 255, .2)";
	this.fills["state"]   = "rgba(153, 153, 153, .2)";

	this.updateReq  = false;
	this.freq1Req  = false;
	this.freq2Req  = false;
	this.tempReq  = false;
	this.currReq = false;
	this.loadReq  = false;
	this.memReq   = false;
	this.stateReq = false;
	
	this.fullGraph = false;
	
    this.getParamsStandard		= this.getParamsHandler.bindAsEventListener(this, 1);
    this.getParamsSpecific		= this.getParamsHandler.bindAsEventListener(this, 2);
    this.getParamsOverride		= this.getParamsHandler.bindAsEventListener(this, 3);
    this.getParamsCompcache		= this.getParamsHandler.bindAsEventListener(this, 4);
    this.getParamsIoScheduler	= this.getIoScheduler.bindAsEventListener(  this, 5);
    this.getParamsTcpCongestion = this.getTcpCongestion.bindAsEventListener(this, 6);
	
};

dataHandlerModel.prototype.setupModels = function()
{
	
};

dataHandlerModel.prototype.start = function()
{
	this.timerHandler();
};

dataHandlerModel.prototype.setMainAssistant = function(assistant)
{
	this.mainAssistant = assistant;
	this.currentMode = "card";
	this.rate = parseInt(prefs.get().cardPollSpeed) * 1000;
	
	this.graphs["freq1"] = new lineGraph
	(
		this.mainAssistant.controller.get('freq1Canvas'),
		{
			renderWidth: 320,
			renderHeight: 30,
			padding: {top: 1}
		}
	);
	if (Mojo.Environment.DeviceInfo.modelNameAscii.indexOf("TouchPad") == 0) {
		this.graphs["freq2"] = new lineGraph
			(
			 this.mainAssistant.controller.get('freq2Canvas'),
			 {
				 renderWidth: 320,
				 renderHeight: 30,
				 padding: {top: 1}
			 }
			 );
	}
	this.graphs["temp"] = new lineGraph
	(
		this.mainAssistant.controller.get('tempCanvas'),
		{
			renderWidth: 320,
			renderHeight: 30,
			padding: {top: 1}
		}
	);
	this.graphs["curr"] = new lineGraph
	(
		this.mainAssistant.controller.get('currCanvas'),
		{
			renderWidth: 320,
			renderHeight: 30,
			padding: {top: 1}
		}
	);
	this.graphs["load"] = new lineGraph
	(
		this.mainAssistant.controller.get('loadCanvas'),
		{
			renderWidth: 320,
			renderHeight: 30,
			padding: {top: 1}
		}
	);
	this.graphs["mem"] = new lineGraph
	(
		this.mainAssistant.controller.get('memCanvas'),
		{
			renderWidth: 320,
			renderHeight: 30,
			padding: {top: 1}
		}
	);
	this.graphs["state"] = new barGraph
	(
		this.mainAssistant.controller.get('stateCanvas'),
		{
			height: 27,
			width: 320
		}
	);
};
dataHandlerModel.prototype.setGraphAssistant = function(assistant)
{
	this.graphAssistant = assistant;
	this.currentMode = "graph";
	this.rate = parseInt(prefs.get().cardPollSpeed) * 1000;
	
	this.fullGraph = new lineGraph
	(
		this.graphAssistant.controller.get('graphCanvas'),
		{
			renderWidth:	320,
			renderHeight:	452,
			padding:
			{
				clear:		true,
				top:		60,
				bottom:		12,
				left:		0
			},
			yaxis:
			{
				/*min:		0,*/
				tics:		11,
				ticStroke:	false,
				ticFill:	"rgba(125, 125, 125, .08)"
			}
		},
		this.graphAssistant.controller.get('graphLabels')
	);
};
dataHandlerModel.prototype.setSettingsAssistant = function(assistant)
{
	this.settingsAssistant = assistant;
};
dataHandlerModel.prototype.setDockAssistant = function(assistant)
{
	this.dockAssistant = assistant;
	this.currentMode = "dock";
	this.rate = parseInt(prefs.get().dockPollSpeed) * 1000;
	//this.rate = 0.5 * 1000;
	
	this.graphs["freq1"] = new lineGraph
	(
		this.dockAssistant.controller.get('freq1Canvas'),
		{
			renderWidth: 320,
			renderHeight: 60,
			padding: {top: 1}
		}
	);
	if (Mojo.Environment.DeviceInfo.modelNameAscii.indexOf("TouchPad") == 0) {
		this.graphs["freq2"] = new lineGraph
			(
			 this.dockAssistant.controller.get('freq2Canvas'),
			 {
				 renderWidth: 320,
				 renderHeight: 60,
				 padding: {top: 1}
			 }
			 );
	}
	this.graphs["temp"] = new lineGraph
	(
		this.dockAssistant.controller.get('tempCanvas'),
		{
			renderWidth: 320,
			renderHeight: 60,
			padding: {top: 1}
		}
	);
	this.graphs["curr"] = new lineGraph
	(
		this.dockAssistant.controller.get('currCanvas'),
		{
			renderWidth: 320,
			renderHeight: 60,
			padding: {top: 1}
		}
	);
	this.graphs["load"] = new lineGraph
	(
		this.dockAssistant.controller.get('loadCanvas'),
		{
			renderWidth: 320,
			renderHeight: 60,
			padding: {top: 1}
		}
	);
	this.graphs["mem"] = new lineGraph
	(
		this.dockAssistant.controller.get('memCanvas'),
		{
			renderWidth: 320,
			renderHeight: 60,
			padding: {top: 1}
		}
	);
};

dataHandlerModel.prototype.updateParams = function(num)
{
	if (!num)
	{
		if (!this.updatingParams)
		{
			this.updatingParams = true;
			
			this.governor = false;
			this.profile = false;
			this.settingsStandard = [];
			this.settingsSpecific = [];
			this.settingsOverride = [];
			this.settingsCompcache = [];
			this.ioScheduler = false;
			
			if (this.updateReq) this.updateReq.cancel();
			this.updateReq = service.get_cpufreq_params(this.getParamsStandard);
		}
	}
	else if (num == 1)
	{
		if (this.updateReq) this.updateReq.cancel();
		this.updateReq = service.get_cpufreq_params(this.getParamsSpecific, this.governor);
	}
	else if (num == 2)
	{
		if (this.updateReq) this.updateReq.cancel();
		this.updateReq = service.get_cpufreq_params(this.getParamsOverride, "override");
	}
	else if (num == 3)
	{
		if (this.updateReq) this.updateReq.cancel();
		this.updateReq = service.get_compcache_config(this.getParamsCompcache);
	}
	else if (num == 4)
	{
		if (this.updateReq) this.updateReq.cancel();
		this.updateReq = service.get_io_scheduler(this.getParamsIoScheduler);
	}
	else if (num == 5)
	{
		if (this.updateReq) this.updateReq.cancel();
		this.updateReq = service.get_tcp_congestion_control(this.getParamsTcpCongestion);
	}
	else if (num == 6)
	{
		this.profile = profiles.findProfile(this.governor,
											this.settingsStandard,
											this.settingsSpecific,
											this.settingsOverride,
											this.settingsCompcache,
											this.ioScheduler);
		if (this.mainAssistant && this.mainAssistant.controller)
		{
			if (profiles.kernel) {
				this.mainAssistant.kernelElement.innerHTML = profiles.kernel;
				if (profiles.kernelVersion) {
					this.mainAssistant.kernelElement.innerHTML += '-'+profiles.kernelVersion;
				}
			}

			if (this.profile)
			{
				this.mainAssistant.profileCurrent.innerHTML = this.profile.name;
			}
			else
			{
				this.mainAssistant.profileCurrent.innerHTML = '<span class="unknown">Unknown</span>';
			}
		}
		if (this.settingsAssistant && this.settingsAssistant.controller)
		{
			this.settingsAssistant.updateList();
		}
		
		this.updatingParams = false;
	}
};
dataHandlerModel.prototype.getParamsHandler = function(payload, num)
{
	if (payload.params)
	{
		for (var param = 0; param < payload.params.length; param++)
		{
			tmpParam = payload.params[param];
			
			if (tmpParam.name == 'scaling_governor')
			{
				this.governor = trim(tmpParam.value);
			}
			else if (tmpParam.writeable)
			{
				if (num == 1)
				{
					if (tmpParam.name == 'scaling_min_freq') {
						this.currentLimits.min = trim(tmpParam.value);
					}
					if (tmpParam.name == 'scaling_max_freq') {
						this.currentLimits.max = trim(tmpParam.value);
					}
					if ((tmpParam.name != 'scaling_setspeed') ||
						(tmpParam.value != '<unsupported>')) {
						this.settingsStandard.push({name:tmpParam.name, value:String(tmpParam.value)});
					}
				}
				else if (num == 2)
				{
					this.settingsSpecific.push({name:tmpParam.name, value:String(tmpParam.value)});
				}
				else if (num == 3)
				{
					if (tmpParam.name == 'vdd2_freq') {
						this.systemFrequencyChoices = [{label:parseInt(tmpParam.value/1000) + ' MHz', value:parseInt(tmpParam.value)}];
					}
					this.settingsOverride.push({name:tmpParam.name, value:String(tmpParam.value)});
				}
				else if (num == 4)
				{
					if (tmpParam.name == 'compcache_enabled')
					{
						this.compcache = (tmpParam.value==1?$L("Enabled"):$L("Disabled"));
					}
					this.settingsCompcache.push({name:tmpParam.name, value:String(tmpParam.value)});
				}
			}
		}
	}
	else
	{
		//error
	}
	
	this.updateParams(num);
	
};
dataHandlerModel.prototype.getIoScheduler = function(payload, num)
{
	if (payload.stdOut) {
		tmpParam = payload.stdOut[0];
			
		var data = tmpParam.split(" ");
		if (data.length > 0) {
			for (d = 0; d < data.length; d++) {
				var tmpSched = trim(data[d]);
				if (tmpSched != "") {
					if (tmpSched.indexOf("[") == 0) {
						this.ioScheduler = tmpSched.substr(1,tmpSched.length-2);
					}
				}
			}
		}
	}
	else
	{
		//error
	}
	
	this.updateParams(num);
	
};
dataHandlerModel.prototype.getTcpCongestion = function(payload, num)
{
	if (payload.stdOut) {
		tmpParam = payload.stdOut[0];
		this.congestion = trim(tmpParam);
	}
	else
	{
		//error
	}
	
	this.updateParams(num);
	
};

dataHandlerModel.prototype.dumpCurrent = function()
{
	var r = '';
	
	r += '<b>Governor:</b> '+this.governor+'<br>';
	r += '<b>Scheduler:</b> '+this.ioScheduler+'<br>';
	r += '<b>Congestion:</b> '+this.congestion+'<br>';
	
	if (this.settingsStandard)
	{
		for (var s = 0; s < this.settingsStandard.length; s++)
		{
			var row = profileModel.prototype.getDataSettingString(this.settingsStandard[s].name, this.settingsStandard[s].value);
			r += '<b>'+row[0]+':</b> '+row[1]+'<br>';
		}
	}
	if (this.settingsSpecific)
	{
		for (var s = 0; s < this.settingsSpecific.length; s++)
		{
			var row = profileModel.prototype.getDataSettingString(this.settingsSpecific[s].name, this.settingsSpecific[s].value);
			r += '<b>'+row[0]+':</b> '+row[1]+'<br>';
		}
	}
	if (this.settingsOverride)
	{
		for (var s = 0; s < this.settingsOverride.length; s++)
		{
			var row = profileModel.prototype.getDataSettingString(this.settingsOverride[s].name, this.settingsOverride[s].value);
			r += '<b>'+row[0]+':</b> '+row[1]+'<br>';
		}
	}
	if (this.settingsCompcache)
	{
		for (var s = 0; s < this.settingsCompcache.length; s++)
		{
			var row = profileModel.prototype.getDataSettingString(this.settingsCompcache[s].name, this.settingsCompcache[s].value);
			r += '<b>'+row[0]+':</b> '+row[1]+'<br>';
		}
	}
	
	return r;
}

dataHandlerModel.prototype.settingLabel = function(name)
{
	return (this.settings[name].nice ? this.settings[name].nice : name.replace(/_/g, " "));
}


dataHandlerModel.prototype.delayedTimer = function(delay)
{
	if (this.timer) clearTimeout(this.timer);
	this.timer = setTimeout(this.timerHandler, delay);
}

dataHandlerModel.prototype.timerFunction = function()
{
	if (this.freq1Req)  this.freq1Req.cancel();
	if (this.freq2Req)  this.freq2Req.cancel();
	if (this.tempReq)  this.tempReq.cancel();
	if (this.currReq)  this.currReq.cancel();
	if (this.loadReq)  this.loadReq.cancel();
	if (this.memReq)   this.memReq.cancel();
	if (this.stateReq) this.stateReq.cancel();

	var keys = this.lineData.keys();
	if (keys.length > this.cutoff)
	{
		for (var k = 0; k < keys.length - this.cutoff; k++)
		{
			this.lineData.unset(keys[k]);
		}
	}
	
	if (Mojo.Environment.DeviceInfo.modelNameAscii == "Pixi") {
		this.tempReq = service.get_tmp105_temp(this.tempHandler);
	}
	else if (Mojo.Environment.DeviceInfo.modelNameAscii == "Veer" ||
			 Mojo.Environment.DeviceInfo.modelNameAscii == "Pre3" ||
			 Mojo.Environment.DeviceInfo.modelNameAscii.indexOf("TouchPad") == 0) {
		this.tempReq = service.get_a6_temp(this.tempHandler);
	}
	else {
		this.tempReq = service.get_omap34xx_temp(this.tempHandler);	
	}

	if (this.currentMode == "card" || this.currentMode == "dock")
	{
		this.freq1Req  = service.get_scaling_cur_freq(this.freq1Handler, 0);
		if (Mojo.Environment.DeviceInfo.modelNameAscii.indexOf("TouchPad") == 0) {
			this.freq2Req  = service.get_scaling_cur_freq(this.freq2Handler, 1);
		}
		if (Mojo.Environment.DeviceInfo.modelNameAscii == "Veer" ||
			Mojo.Environment.DeviceInfo.modelNameAscii == "Pre3" ||
			Mojo.Environment.DeviceInfo.modelNameAscii.indexOf("TouchPad") == 0) {
			this.currReq  = service.get_a6_current(this.currHandler);
		}
		else {
			this.currReq  = service.get_battery_current(this.currHandler);
		}
		this.loadReq  = service.get_proc_loadavg(this.loadHandler);
		this.memReq   = service.get_proc_meminfo(this.memHandler);
		this.stateReq = service.get_time_in_state(this.stateHandler, 0);
	}
	
	this.delayedTimer(this.rate);
};

dataHandlerModel.prototype.tempHandler = function(payload)
{
	if (payload.returnValue) 
	{
		var timestamp = Math.round(new Date().getTime()/1000.0);
		var value = parseInt(payload.value);
		
		this.updateIcon(value);
		if (this.mainAssistant && this.mainAssistant.controller && this.mainAssistant.isVisible)
		{
			this.mainAssistant.iconElement.className = 'icon temp-' + value;
			this.mainAssistant.tempCurrent.innerHTML = value + '<div class="unit">&deg;C</div>';
		}
		if (this.dockAssistant && this.dockAssistant.controller && this.dockAssistant.isVisible)
		{
			this.dockAssistant.tempCurrent.innerHTML = value + ' &deg;C';
		}
		
		var dataObj = this.lineData.get(timestamp)
		if (!dataObj) dataObj = {};
		if (!dataObj.temp)
		{
			dataObj.temp = {total:value, count:1, value:value};
		}
		if (dataObj.temp && dataObj.temp.count)
		{
			dataObj.temp.total = dataObj.temp.total + value;
			dataObj.temp.count++;
			dataObj.temp.value = (dataObj.temp.total / dataObj.temp.count);
		}
		this.lineData.set(timestamp, dataObj);
	}

	this.renderMiniLine("temp");
	this.renderFullGraph("temp");
};
dataHandlerModel.prototype.freqHandler = function(payload, cpu)
{
	var mainValue, dockValue;
	if (cpu == 1) {
		mainValue = this.mainAssistant.freq1Current;
		dockValue = this.dockAssistant.freq1Current;
	}
	if (cpu == 2) {
		mainValue = this.mainAssistant.freq2Current;
		dockValue = this.dockAssistant.freq2Current;
	}

	if (payload.returnValue) 
	{
		var timestamp = Math.round(new Date().getTime()/1000.0);
		var value = parseInt(payload.value);
	
		if (this.mainAssistant && this.mainAssistant.controller && this.mainAssistant.isVisible)
		{
			if ((value / 1000) >= 1000)
			{
				mainValue.innerHTML = ((value / 1000) / 1000) + '<div class="unit">GHz</div>';
			}
			else
			{
				mainValue.innerHTML = (value / 1000) + '<div class="unit">MHz</div>';
			}
		}
		if (this.dockAssistant && this.dockAssistant.controller && this.dockAssistant.isVisible)
		{
			if ((value / 1000) >= 1000)
			{
				dockValue.innerHTML = ((value / 1000) / 1000) + '<div class="unit">GHz</div>';
			}
			else
			{
				dockValue.innerHTML = (value / 1000) + '<div class="unit">MHz</div>';
			}
		}
		
		var dataObj = this.lineData.get(timestamp)
		if (!dataObj) dataObj = {};

		if (cpu == 1) {
			if (!dataObj.freq1) {
				dataObj.freq1 = {total:value, count:1, value:value};
			}
			if (dataObj.freq1 && dataObj.freq1.count) {
				dataObj.freq1.total = dataObj.freq1.total + value;
				dataObj.freq1.count++;
				dataObj.freq1.value = (dataObj.freq1.total / dataObj.freq1.count);
			}
		}
		if (cpu == 2) {
			if (!dataObj.freq2) {
				dataObj.freq2 = {total:value, count:1, value:value};
			}
			if (dataObj.freq2 && dataObj.freq2.count) {
				dataObj.freq2.total = dataObj.freq2.total + value;
				dataObj.freq2.count++;
				dataObj.freq2.value = (dataObj.freq2.total / dataObj.freq2.count);
			}
		}

		this.lineData.set(timestamp, dataObj);
	}

	if (cpu == 1) {
		this.renderMiniLine("freq1");
		this.renderFullGraph("freq1");
	}
	if (cpu == 2) {
		this.renderMiniLine("freq2");
		this.renderFullGraph("freq2");
	}
};
dataHandlerModel.prototype.loadHandler = function(payload)
{
	if (payload.returnValue) 
	{
		var timestamp = Math.round(new Date().getTime()/1000.0);
		var valueArray = String(payload.stdOut).split(' ');
		var value1 =  parseFloat(trim(valueArray[0]));
		var value5 =  parseFloat(trim(valueArray[1]));
		var value15 = parseFloat(trim(valueArray[2]));
		
		if (this.mainAssistant && this.mainAssistant.controller && this.mainAssistant.isVisible)
		{
			this.mainAssistant.loadCurrent.innerHTML = value1 + ' ' + value5 + ' ' + value15;
		}
		if (this.dockAssistant && this.dockAssistant.controller && this.dockAssistant.isVisible)
		{
			this.dockAssistant.loadCurrent.innerHTML = value1 + ' ' + value5 + ' ' + value15;
		}
		
		var dataObj = this.lineData.get(timestamp)
		if (!dataObj) dataObj = {};
		if (!dataObj.load)
		{
			dataObj.load = {total1:  value1,  count1:  1, value1:  value1,
							total5:  value5,  count5:  1, value5:  value5,
							total15: value15, count15: 1, value15: value15};
		}
		if (dataObj.load && dataObj.load.count1)
		{
			dataObj.load.total1 =  dataObj.load.total1  + value1;
			dataObj.load.total5 =  dataObj.load.total5  + value5;
			dataObj.load.total15 = dataObj.load.total15 + value15;
			dataObj.load.count1++;
			dataObj.load.count5++;
			dataObj.load.count15++;
			dataObj.load.value1 =  (dataObj.load.total1  / dataObj.load.count1);
			dataObj.load.value5 =  (dataObj.load.total5  / dataObj.load.count5);
			dataObj.load.value15 = (dataObj.load.total15 / dataObj.load.count15);
		}
		this.lineData.set(timestamp, dataObj);
	}

	this.renderMiniLine("load");
	this.renderFullGraph("load");
};
dataHandlerModel.prototype.memHandler = function(payload)
{
	if (payload.returnValue) 
	{
		var timestamp = Math.round(new Date().getTime()/1000.0);
		var MemTotal = 0;
		var MemFree = 0;
		var SwapTotal = 0;
		var SwapFree = 0;
		for (var line = 0; line < payload.stdOut.length; line++) {
			var items = payload.stdOut[line].split(":");
			if (items[0] == "MemTotal") {
				MemTotal = parseInt(items[1]);
			}
			else if (items[0] == "MemFree") {
				MemFree = parseInt(items[1]);
			}
			else if (items[0] == "SwapTotal") {
				SwapTotal = parseInt(items[1]);
			}
			else if (items[0] == "SwapFree") {
				SwapFree = parseInt(items[1]);
			}
		}
		var value = MemTotal - MemFree + SwapTotal - SwapFree;
		
		if (this.mainAssistant && this.mainAssistant.controller && this.mainAssistant.isVisible)
		{
			this.mainAssistant.memCurrent.innerHTML = Math.floor((MemTotal-MemFree)/1024) + " / " + Math.floor((SwapTotal-SwapFree)/1024) + '<div class="unit">MB</div>';
		}
		if (this.dockAssistant && this.dockAssistant.controller && this.dockAssistant.isVisible)
		{
			this.dockAssistant.memCurrent.innerHTML = Math.floor((MemTotal-MemFree)/1024) + " / " + Math.floor((SwapTotal-SwapFree)/1024) + '<div class="unit">MB</div>';
		}
		
		var dataObj = this.lineData.get(timestamp)
		if (!dataObj) dataObj = {};
		if (!dataObj.mem)
		{
			dataObj.mem =  {total:  value,  count:  1, value:  value};
		}
		if (dataObj.mem && dataObj.mem.count)
		{
			dataObj.mem.total =  dataObj.mem.total  + value;
			dataObj.mem.count++;
			dataObj.mem.value =  (dataObj.mem.total  / dataObj.mem.count);
		}
		this.lineData.set(timestamp, dataObj);
	}

	this.renderMiniLine("mem");
	this.renderFullGraph("mem");
};
dataHandlerModel.prototype.stateHandler = function(payload)
{
	if (payload.returnValue) 
	{
		var dataHash = $H();
		var valueArray = String(payload.stdOut).split(',');
		for (var v = 0; v < valueArray.length; v++)
		{
			if (valueArray[v])
			{
				var dataArray = valueArray[v].split(' ');
				dataHash.set(parseInt(dataArray[0]), parseInt(dataArray[1]));
			}
		}
		if (this.scalingFrequencyChoices.length == 0)
		{
			for (var v = 0; v < valueArray.length; v++)
			{
				if (valueArray[v])
				{
					var dataArray = valueArray[v].split(' ');
					if ((parseInt(dataArray[0]) / 1000) >= 1000)
					{
						this.scalingFrequencyChoices.push({label:((parseInt(dataArray[0])/1000)/1000) + ' GHz', value:parseInt(dataArray[0])});
					}
					else
					{
						this.scalingFrequencyChoices.push({label:(parseInt(dataArray[0])/1000) + ' MHz', value:parseInt(dataArray[0])});
					}
				}
			}
		}

		this.barData.state = dataHash;
	}

	this.renderMiniBar("state");
	this.renderFullGraph("state");
};
dataHandlerModel.prototype.currHandler = function(payload)
{
	if (payload.returnValue) 
	{
		var timestamp = Math.round(new Date().getTime()/1000.0);
		var value = parseInt(payload.value);
	
		if (this.mainAssistant && this.mainAssistant.controller && this.mainAssistant.isVisible)
		{
			this.mainAssistant.currCurrent.innerHTML = Math.round(value / 1000) + '<div class="unit">mA</div>';
		}
		if (this.dockAssistant && this.dockAssistant.controller && this.dockAssistant.isVisible)
		{
			this.dockAssistant.currCurrent.innerHTML = Math.round(value / 1000) + '<div class="unit">mA</div>';
		}
		
		var dataObj = this.lineData.get(timestamp)
		if (!dataObj) dataObj = {};
		if (!dataObj.curr)
		{
			dataObj.curr = {total:value, count:1, value:value};
		}
		if (dataObj.curr && dataObj.curr.count)
		{
			dataObj.curr.total = dataObj.curr.total + value;
			dataObj.curr.count++;
			dataObj.curr.value = (dataObj.curr.total / dataObj.curr.count);
		}
		this.lineData.set(timestamp, dataObj);
	}

	this.renderMiniLine("curr");
	this.renderFullGraph("curr");
};

dataHandlerModel.tempFormat = function(n)
{
	return n + ' &deg;C';
}
dataHandlerModel.freqFormat = function(n)
{
	if ((n / 1000) >= 1000)
	{
		return ((n / 1000) / 1000) + ' GHz';
	}
	else
	{
		return (n / 1000) + ' MHz';
	}
}
dataHandlerModel.memFormat = function(n)
{
	return Math.floor((n)/1024) + ' MB';
}
dataHandlerModel.currFormat = function(n)
{
	return Math.round(n / 1000) + ' mA';
}

dataHandlerModel.prototype.updateIcon = function(temp)
{
	if (this.currentMode == "card" && prefs.get().cardIconUpdate)
	{
		this.iconDirty = true;
		var r = new Mojo.Service.Request
		(
			'palm://com.palm.applicationManager',
			{
				method: 'updateLaunchPointIcon',
				parameters:
				{
					launchPointId:	Mojo.appInfo.id + '_default',
					icon:			Mojo.appPath + 'images/icons/icon-' + temp + '.png'
				}
			}
		);
	}
	else if (this.iconDirty)
	{
		this.iconDirty = false;
		this.resetIcon();
	}
};
dataHandlerModel.prototype.resetIcon = function()
{
	var r = new Mojo.Service.Request
	(
		'palm://com.palm.applicationManager',
		{
			method: 'updateLaunchPointIcon',
			parameters:
			{
				launchPointId:	Mojo.appInfo.id + '_default',
				icon:			Mojo.appPath + 'icon.png'
			}
		}
	);
};

dataHandlerModel.prototype.renderMiniLine = function(item)
{
	if ((this.mainAssistant && this.mainAssistant.controller && this.mainAssistant.isVisible) ||
		(this.dockAssistant && this.dockAssistant.controller && this.dockAssistant.isVisible)) {

		this.graphs[item].clearLines();
		
		var data1 = [];
		var data2 = [];
		
		var avg = 1;
		var points = 80;
		
		var keys = this.lineData.keys();
		var start = 0;
		if (keys.length > points) start = keys.length - points;
		for (var k = start; k < keys.length; k++) {
			var dataObj = this.lineData.get(keys[k]);
			
			if (item =="freq1") {
				if (dataObj.freq1)
					data1.push({x: keys[k], y: dataObj.freq1.value});
			}
			else if (item =="freq2") {
				if (dataObj.freq2)
					data1.push({x: keys[k], y: dataObj.freq2.value});
			}
			else if (item == "temp") {
				if (dataObj.temp)
					data1.push({x: keys[k], y: dataObj.temp.value});
			}
			else if (item =="curr") {
				if (dataObj.curr) {
					if (parseInt(dataObj.curr.value) >= 0) {
						data1.push({x: keys[k], y: dataObj.curr.value});
						data2.push({x: keys[k], y: false});
					}
					else {
						data1.push({x: keys[k], y: false});
						data2.push({x: keys[k], y: Math.abs(dataObj.curr.value)});
					}
				}
			}
			else if (item =="load") {
				if (dataObj.load)
					data1.push({x: keys[k], y: dataObj.load.value1});
			}
			else if (item =="mem") {
				if (dataObj.mem)
					data1.push({x: keys[k], y: dataObj.mem.value});
			}
		}
		
		var minX = Math.round(new Date().getTime()/1000.0) - (points * (this.rate / 1000));
		this.graphs[item].options.xaxis.min = minX;
		
		if (item == "curr")
		{
			if (this.mainAssistant && this.mainAssistant.controller && this.mainAssistant.isVisible) {
				this.graphs[item].addLine({data: data1, stroke: this.strokes[item+'1'], fill: this.fills[item+'1']});
				this.graphs[item].addLine({data: data2, stroke: this.strokes[item+'2'], fill: this.fills[item+'2']});
			}
			if (this.dockAssistant && this.dockAssistant.controller && this.dockAssistant.isVisible) {
				this.graphs[item].addLine({data: data1, stroke: this.strokes[item+'1'], fill: false, width: 3});
				this.graphs[item].addLine({data: data2, stroke: this.strokes[item+'2'], fill: false, width: 3});
			}
		}
		else
		{
			if (this.mainAssistant && this.mainAssistant.controller && this.mainAssistant.isVisible) {
				this.graphs[item].addLine({data: data1, stroke: this.strokes[item], fill: this.fills[item]});
			}
			if (this.dockAssistant && this.dockAssistant.controller && this.dockAssistant.isVisible) {
				this.graphs[item].addLine({data: data1, stroke: this.strokes[item], fill: false, width: 3});
			}
		}
		
		this.graphs[item].render();
		
	}
};

dataHandlerModel.prototype.renderMiniBar = function(item)
{
	if (this.mainAssistant && this.mainAssistant.controller && this.mainAssistant.isVisible) {

		var data = [];
		
		if (item =="state") {
			if (this.barData.state) {
				var keys = this.barData.state.keys();
				for (var k = 0; k < keys.length; k++) {
					var value = this.barData.state.get(keys[k]);
					data.push({key: keys[k], value: value});
				}
			}
		}
				
		this.graphs[item].setData(data, {strokeStyle: this.strokes[item], fillStyle: this.fills[item]});
				
		this.graphs[item].render();
	}
};

dataHandlerModel.prototype.renderFullGraph = function()
{
	if (this.graphAssistant && this.graphAssistant.controller && this.graphAssistant.isVisible) {

		this.fullGraph.clearLines();
		
		var fullData1 = [];
		var fullData2 = [];
		var fullData3 = [];
		
		var avg = 1;
		
		var keys = this.lineData.keys();
		for (var k = 0; k < keys.length; k++) {
			var dataObj = this.lineData.get(keys[k]);
			
			if (dataObj.freq1 && this.graphAssistant.display == "freq1") {
				fullData1.push({x: keys[k], y: dataObj.freq1.value});
			}
			
			if (dataObj.freq2 && this.graphAssistant.display == "freq2") {
				fullData1.push({x: keys[k], y: dataObj.freq2.value});
			}
			
			if (dataObj.temp && this.graphAssistant.display == "temp") {
				fullData1.push({x: keys[k], y: dataObj.temp.value});
			}
			
			if (dataObj.curr && this.graphAssistant.display == "curr") {
				if (parseInt(dataObj.curr.value) >= 0) {
					fullData1.push({x: keys[k], y: dataObj.curr.value});
					fullData2.push({x: keys[k], y: false});
				}
				else {
					fullData1.push({x: keys[k], y: false});
					fullData2.push({x: keys[k], y: Math.abs(dataObj.curr.value)});
				}
			}
			
			if (dataObj.load && this.graphAssistant.display == "load") {
				fullData1.push({x: keys[k], y: dataObj.load.value1});
				fullData2.push({x: keys[k], y: dataObj.load.value5});
				fullData3.push({x: keys[k], y: dataObj.load.value15});
			}

			if (dataObj.mem && this.graphAssistant.display == "mem") {
				fullData1.push({x: keys[k], y: dataObj.mem.value});
			}
		}
		
		this.fullGraph.options.yaxis.ticFill = (this.graphAssistant.controller.document.body.hasClassName('palm-dark') ? "rgba(0, 0, 0, .08)" : "rgba(125, 125, 125, .08)");
		
		if (this.graphAssistant.display == "freq1") {
			this.fullGraph.options.yaxis.ticFormat = dataHandlerModel.freqFormat;
			this.fullGraph.addLine({data: fullData1, stroke: this.strokes[this.graphAssistant.display], fill: this.fills[this.graphAssistant.display]});
		}
		
		if (this.graphAssistant.display == "freq2") {
			this.fullGraph.options.yaxis.ticFormat = dataHandlerModel.freqFormat;
			this.fullGraph.addLine({data: fullData1, stroke: this.strokes[this.graphAssistant.display], fill: this.fills[this.graphAssistant.display]});
		}
		
		if (this.graphAssistant.display == "temp") {
			this.fullGraph.options.yaxis.ticFormat = dataHandlerModel.tempFormat;
			this.fullGraph.addLine({data: fullData1, stroke: this.strokes[this.graphAssistant.display], fill: this.fills[this.graphAssistant.display]});
		}
		
		if (this.graphAssistant.display == "curr") {
			this.fullGraph.options.yaxis.ticFormat = dataHandlerModel.currFormat;
			this.fullGraph.addLine({data: fullData1, stroke: this.strokes[this.graphAssistant.display+'1'], fill: this.fills[this.graphAssistant.display+'1']});
			this.fullGraph.addLine({data: fullData2, stroke: this.strokes[this.graphAssistant.display+'2'], fill: this.fills[this.graphAssistant.display+'2']});
		}
		
		if (this.graphAssistant.display == "load") {
			this.fullGraph.options.yaxis.min = 0;
			this.fullGraph.options.yaxis.ticFormat = function(n){return Math.round(n*100)/100;};
			this.fullGraph.addLine({data: fullData3, stroke: "rgba(75, 75, 205, .4)"});
			this.fullGraph.addLine({data: fullData2, stroke: "rgba(105, 105, 205, .4)"});
			this.fullGraph.addLine({data: fullData1, stroke: this.strokes[this.graphAssistant.display], fill: this.fills[this.graphAssistant.display]});
		}
		
		if (this.graphAssistant.display == "mem") {
			this.fullGraph.options.yaxis.ticFormat = dataHandlerModel.memFormat;
			this.fullGraph.addLine({data: fullData1, stroke: this.strokes[this.graphAssistant.display], fill: this.fills[this.graphAssistant.display]});
		}
		
		this.fullGraph.render();
	}
};



// Local Variables:
// tab-width: 4
// End:
