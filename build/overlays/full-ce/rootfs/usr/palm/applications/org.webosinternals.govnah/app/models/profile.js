function profilesModel()
{
	this.cookie =		new Mojo.Model.Cookie('profiles');
	this.cookieData =	false;
	
	this.controller = false;

	this.profiles =		[];
	
	this.kernel = false;
	this.kernelVersion = false;

	this.load();
	this.fixModelName();
	
	this.setRequests = new Array();
	this.setRequests["cpufreq"]  = false;
	this.setRequests["compcache"] = false;
	this.setRequests["iosched"] = false;
	
	this.applyCompleteCpufreq  = this.applyComplete.bindAsEventListener(this, "cpufreq");
	this.applyCompleteCompcache  = this.applyComplete.bindAsEventListener(this, "compcache");
	this.applyCompleteIoSched  = this.applyComplete.bindAsEventListener(this, "iosched");

	this.stickRequests = new Array();
	this.stickRequests["cpufreq"]  = false;
	this.stickRequests["compcache"] = false;
	this.stickRequests["iosched"] = false;

	this.stickCompleteCpufreq  = this.stickComplete.bindAsEventListener(this, "cpufreq");
	this.stickCompleteCompcache  = this.stickComplete.bindAsEventListener(this, "compcache");
	this.stickCompleteIoSched  = this.stickComplete.bindAsEventListener(this, "iosched");
};
profilesModel.prototype.findProfile = function(governor, settingsStandard, settingsSpecific, settingsOverride, settingsCompcache, ioScheduler)
{
	if (this.profiles.length > 0)
	{
		for (var p = 0; p < this.profiles.length; p++)
		{
			if (this.profiles[p] &&
				this.profiles[p].kernels &&
				(this.profiles[p].kernels.indexOf(profiles.kernel) != -1))
			{

				alert("Profile: "+JSON.stringify(this.profiles[p]));
				alert("governor: "+governor);
				alert("settingsStandard: "+JSON.stringify(settingsStandard));
				alert("settingsSpecific: "+JSON.stringify(settingsSpecific));
				alert("settingsOverride: "+JSON.stringify(settingsOverride));
				alert("settingsCompcache: "+JSON.stringify(settingsCompcache));
				alert("ioScheduler: "+ioScheduler);

				// look for exact match
				if (this.profiles[p].governor == governor &&
					((!this.profiles[p].settingsStandard && settingsStandard.length == 0) ||
					  (this.profiles[p].settingsStandard && this.profiles[p].settingsStandard.length == settingsStandard.length)) &&
					((!this.profiles[p].settingsSpecific && settingsSpecific.length == 0) || 
					  (this.profiles[p].settingsSpecific && this.profiles[p].settingsSpecific.length == settingsSpecific.length)) &&
					((!this.profiles[p].settingsOverride && settingsOverride.length == 0) ||
					  (this.profiles[p].settingsOverride && this.profiles[p].settingsOverride.length == settingsOverride.length)) &&
					((!this.profiles[p].settingsCompcache && settingsCompcache.length == 0) ||
					  (this.profiles[p].settingsCompcache && this.profiles[p].settingsCompcache.length == settingsCompcache.length)) &&
					((!this.profiles[p].ioScheduler && !ioScheduler) || (this.profiles[p].ioScheduler == ioScheduler)))
				{
					var match = true;
					
					alert("Checking exact match");
					
					if (this.profiles[p].settingsStandard && this.profiles[p].settingsStandard.length > 0)
					{
						alert("Checking settingsStandard");

						for (var s = 0; s < this.profiles[p].settingsStandard.length; s++)
						{
							if (this.profiles[p].settingsStandard[s].name != settingsStandard[s].name ||
								this.profiles[p].settingsStandard[s].value != settingsStandard[s].value)
							{
								match = false;
							}
						}
					}
					if (this.profiles[p].settingsSpecific && this.profiles[p].settingsSpecific.length > 0)
					{
						alert("Checking settingsSpecific");

						for (var s = 0; s < this.profiles[p].settingsSpecific.length; s++)
						{
							if (this.profiles[p].settingsSpecific[s].name != settingsSpecific[s].name ||
								this.profiles[p].settingsSpecific[s].value != settingsSpecific[s].value)
							{
								match = false;
							}
						}
					}
					if (this.profiles[p].settingsOverride && this.profiles[p].settingsOverride.length > 0)
					{
						alert("Checking settingsOverride");

						for (var s = 0; s < this.profiles[p].settingsOverride.length; s++)
						{
							if (this.profiles[p].settingsOverride[s].name != settingsOverride[s].name ||
								this.profiles[p].settingsOverride[s].value != settingsOverride[s].value)
							{
								match = false;
							}
						}
					}
					if (this.profiles[p].settingsCompcache && this.profiles[p].settingsCompcache.length > 0)
					{
						alert("Checking settingsCompcache");

						for (var s = 0; s < this.profiles[p].settingsCompcache.length; s++)
						{
							if (this.profiles[p].settingsCompcache[s].name != settingsCompcache[s].name ||
								this.profiles[p].settingsCompcache[s].value != settingsCompcache[s].value)
							{
								match = false;
							}
						}
					}
					
					if (match)
					{
						return this.profiles[p];
					}
				}
			}
		}
		
		for (var p = 0; p < this.profiles.length; p++)
		{
			if (this.profiles[p] &&
				this.profiles[p].kernels &&
				(this.profiles[p].kernels.indexOf(profiles.kernel) != -1)) 
			{
				alert(this.profiles[p].governor);

				// look for fuzzy match
				if (this.profiles[p].governor == governor &&
					(!this.profiles[p].settingsStandard || !this.profiles[p].settingsStandard.length ||
					 (this.profiles[p].settingsStandard.length == settingsStandard.length)) &&
					(!this.profiles[p].settingsSpecific || !this.profiles[p].settingsSpecific.length || 
					 (this.profiles[p].settingsSpecific.length == settingsSpecific.length)) &&
					(!this.profiles[p].settingsOverride || !this.profiles[p].settingsOverride.length ||
					 (this.profiles[p].settingsOverride.length == settingsOverride.length)) &&
					(!this.profiles[p].settingsCompcache || !this.profiles[p].settingsCompcache.length ||
					 (this.profiles[p].settingsCompcache.length == settingsCompcache.length)) &&
					(!this.profiles[p].ioScheduler || (this.profiles[p].ioScheduler == ioScheduler)))
				{
					var match = true;
					
					alert("Checking fuzzy match");
					
					if (this.profiles[p].settingsStandard && this.profiles[p].settingsStandard.length > 0)
					{
						alert("Checking settingsStandard");

						for (var s = 0; s < this.profiles[p].settingsStandard.length; s++)
						{
							if (this.profiles[p].settingsStandard[s].name != settingsStandard[s].name ||
								this.profiles[p].settingsStandard[s].value != settingsStandard[s].value)
							{
								match = false;
							}
						}
					}
					if (this.profiles[p].settingsSpecific && this.profiles[p].settingsSpecific.length > 0)
					{
						alert("Checking settingsSpecific");

						for (var s = 0; s < this.profiles[p].settingsSpecific.length; s++)
						{
							if (this.profiles[p].settingsSpecific[s].name != settingsSpecific[s].name ||
								this.profiles[p].settingsSpecific[s].value != settingsSpecific[s].value)
							{
								match = false;
							}
						}
					}
					if (this.profiles[p].settingsOverride && this.profiles[p].settingsOverride.length > 0)
					{
						alert("Checking settingsOverride");

						for (var s = 0; s < this.profiles[p].settingsOverride.length; s++)
						{
							if (this.profiles[p].settingsOverride[s].name != settingsOverride[s].name ||
								this.profiles[p].settingsOverride[s].value != settingsOverride[s].value)
							{
								match = false;
							}
						}
					}
					if (this.profiles[p].settingsCompcache && this.profiles[p].settingsCompcache.length > 0)
					{
						alert("Checking settingsCompcache");

						for (var s = 0; s < this.profiles[p].settingsCompcache.length; s++)
						{
							if (this.profiles[p].settingsCompcache[s].name != settingsCompcache[s].name ||
								this.profiles[p].settingsCompcache[s].value != settingsCompcache[s].value)
							{
								match = false;
							}
						}
					}
					
					if (match)
					{
						return this.profiles[p];
					}
				}
			}
		}
	}
	else
	{
		return false;
	}
};
profilesModel.prototype.getProfileArrayKey = function(id)
{
	if (this.profiles.length > 0)
	{
		for (var p = 0; p < this.profiles.length; p++)
		{
			if (this.profiles[p].id == id)
			{
				return p;
			}
		}
	}
	return false;
};
profilesModel.prototype.getProfileFromId = function(id)
{
	if (this.profiles.length > 0)
	{
		for (var p = 0; p < this.profiles.length; p++)
		{
			if (this.profiles[p].id == id)
			{
				return this.profiles[p];
			}
		}
	}
	return false;
};
profilesModel.prototype.getProfileFromName = function(name)
{
	if (this.profiles.length > 0)
	{
		for (var p = 0; p < this.profiles.length; p++)
		{
			if (this.profiles[p].name == name)
			{
				return this.profiles[p];
			}
		}
	}
	return false;
};
profilesModel.prototype.deleteProfilesByName = function(name)
{
	if (this.profiles.length > 0)
	{
		for (var p = 0; p < this.profiles.length; p++)
		{
			if (this.profiles[p].name == name)
			{
				this.deleteProfile(this.profiles[p].id);
			}
		}
	}
	return;
};
profilesModel.prototype.getListObjects = function()
{
	var returnArray = [];
	if (this.profiles.length > 0)
	{
		for (var p = 0; p < this.profiles.length; p++)
		{
			if (this.profiles[p]) 
			{
				var profile = this.profiles[p].getListObject();
				if (profile) returnArray.push(profile);
			}
		}
	}
	return returnArray;
};

profilesModel.prototype.fixModelName = function()
{
	this.request = service.getMachineName(this.fixModelNameResponse.bindAsEventListener(this));
};

profilesModel.prototype.fixModelNameResponse = function(response)
{
	if (response && response.returnValue === true) {
		if (response.stdOut[0] == "roadrunner") {
			Mojo.Environment.DeviceInfo.modelNameAscii = "Pre2";
		}
	}

	this.getKernelType();
};


profilesModel.prototype.getKernelType = function()
{
	this.request = service.get_proc_version(this.getKernelTypeResponse.bindAsEventListener(this));
};

profilesModel.prototype.getKernelTypeResponse = function(response)
{
	if (response && response.returnValue === true) {
		if (response.stdOut.length && response.stdOut[0].length) {
			var fields = response.stdOut[0].split(' ');
			if (fields.length >= 4) {
				var kernelstring = fields[3];
				var kernelRegExp = new RegExp(/^\((v[0-9.]+)-([0-9]+)@org\.webosinternals\.kernels\.(.+)-kernel-(.+)\)/);
				var match = kernelRegExp.exec(kernelstring);
				if (match) {
					this.kernelVersion = match[2];
					switch (match[3]) {
					case "uber":
						this.kernel = "UberKernel";
						break;
					case "f102a":
						this.kernel = "F102A";
						break;
					case "psycho-a1":
						this.kernel = "A1";
						break;
					case "psycho-a4":
						this.kernel = "A4";
						break;
					case "psycho-f102a":
					case "psycho-f102b":
						this.kernel = "F102B";
						break;
					case "psycho-f104a":
						this.kernel = "F104A";
						break;
					case "psycho-f105":
						this.kernel = "F105";
						break;
					case "psycho-f14":
						this.kernel = "F14";
						break;
					case "psycho-f15c":
						this.kernel = "F15C";
						break;
					case "psycho-f4":
						this.kernel = "F4";
						break;
					case "psycho-sr71":
						this.kernel = "SR71";
						break;
					case "psycho-av8b":
						this.kernel = "AV8B";
						break;
					case "warthog":
						this.kernel = "Warthog";
						break;
					default:
						this.kernel = match[3];
						break;
					}
				}
				else if ((kernelstring == "(na@na)") || (kernelstring.indexOf("reviewdaemon@") != -1)) {
					this.kernel = "Palm";
					this.kernelVersion = false;
				}
				else {
					this.kernel = "unknown";
					this.kernelVersion = false;
				}
			}
		}
	}


	// now we populate our default profiles
	profilesModel.populateDefaults();
	// then we load defaults
	this.loadDefaults();
};

profilesModel.prototype.loadDefaults = function()
{
	try
	{
		var highestVersion = prefs.get().defaultProfileVersion;
		
		for (var d = 0; d < profilesModel.defaultProfiles.length; d++)
		{
			if (profilesModel.defaultProfiles[d].version > prefs.get().defaultProfileVersion)
			{
				var dup = this.getProfileFromId(profilesModel.defaultProfiles[d].id);

				if (dup) {
					this.deleteProfile(dup.id);
				}

				this.newProfile(profilesModel.defaultProfiles[d]);
				
				if (profilesModel.defaultProfiles[d].version > highestVersion)
				{
					highestVersion = profilesModel.defaultProfiles[d].version;
				}
			}
		}
		
		if (highestVersion > prefs.get().defaultProfileVersion)
		{
			prefs.put('defaultProfileVersion', highestVersion);
		}
	} 
	catch (e) 
	{
		Mojo.Log.logException(e, 'profiles#loadDefaults');
	}
};
profilesModel.prototype.load = function()
{
	try
	{
		this.profiles = [];
		
		this.cookieData = this.cookie.get();
		if (this.cookieData)
		{
			if (this.cookieData.profiles && this.cookieData.profiles.length > 0) 
			{
				for (var p = 0; p < this.cookieData.profiles.length; p++) 
				{
					this.loadProfile(this.cookieData.profiles[p]);
				}
			}
		}
		else
		{
			this.cookieData = 
			{
				serial: 0,
				profiles: []
			};
		}
	} 
	catch (e) 
	{
		Mojo.Log.logException(e, 'profiles#load');
	}
};
profilesModel.prototype.loadProfile = function(id)
{
	try
	{
		var profileCookie = new Mojo.Model.Cookie('profile-' + id);
		var profileParams = profileCookie.get();
		if (profileParams)
		{
			profileParams.profiles = this;
			var newProfile = new profileModel(profileParams);
			this.profiles.push(newProfile);
		}
	} 
	catch (e) 
	{
		Mojo.Log.logException(e, 'profiles#loadProfile');
	}
};
profilesModel.prototype.newProfile = function(params)
{
	try
	{
		this.cookieData.serial++;
		this.cookieData.profiles.push(this.cookieData.serial);
		this.cookie.put(this.cookieData);
		
		params.id = this.cookieData.serial;
		var profileCookie = new Mojo.Model.Cookie('profile-' + params.id);
		profileCookie.put(params);
		
		this.loadProfile(params.id);
	}
	catch (e) 
	{
		Mojo.Log.logException(e, 'profiles#newProfile');
	}
};
profilesModel.prototype.deleteProfile = function(id)
{
	try
	{
		this.cookieData.profiles = this.cookieData.profiles.without(id);
		this.cookie.put(this.cookieData);
		
		var profileCookie = new Mojo.Model.Cookie('profile-' + id);
		profileCookie.remove();
		
		var key = this.getProfileArrayKey(id);
		this.profiles[key] = false;
	} 
	catch (e)
	{
		Mojo.Log.logException(e, 'profiles#deleteProfile');
	}
};
profilesModel.prototype.reorderProfiles = function(from, to)
{
	try
	{
		var reorderedProfiles = [];
		var reorderedCookie = [];
		
		//alert("from = "+from+", fromId = "+this.profiles[from].id+", to = "+to+", toId = "+this.profiles[to].id);

		if (from > to) {

			// Then copy all the entries until we find toId
			for (var p = 0; p < to; p++) {
				reorderedProfiles.push(this.profiles[p]);
				reorderedCookie.push(this.profiles[p].id);
				//alert("Copying p = "+p+", id = "+this.profiles[p].id);
			}
			
			// Then insert the fromId entry
			reorderedProfiles.push(this.profiles[from]);
			reorderedCookie.push(this.profiles[from].id);
			//alert("Copying fromEntry, id = "+this.profiles[from].id);
			
			// Then copy all the rest of the entries, skipping fromId
			for (var p = to; p < this.profiles.length; p++) {
				if (p != from) {
					reorderedProfiles.push(this.profiles[p]);
					reorderedCookie.push(this.profiles[p].id);
					//alert("Copying p = "+p+", id = "+this.profiles[p].id);
				}
			}
		}
		else if (from < to) {

			// Then copy all the entries until we find toId, skipping fromId
			for (var p = 0; p <= to; p++) {
				if (p != from) {
					reorderedProfiles.push(this.profiles[p]);
					reorderedCookie.push(this.profiles[p].id);
					//alert("Copying p = "+p+", id = "+this.profiles[p].id);
				}
			}
			
			// Then insert the fromId entry
			reorderedProfiles.push(this.profiles[from]);
			reorderedCookie.push(this.profiles[from].id);
			//alert("Copying fromEntry, id = "+this.profiles[from].id);
			
			// Then copy the rest of the entries
			for (var p = to+1; p < this.profiles.length; p++) {
				reorderedProfiles.push(this.profiles[p]);
				reorderedCookie.push(this.profiles[p].id);
				//alert("Copying p = "+p+", id = "+this.profiles[p].id);
			}
		}
		
		this.profiles = reorderedProfiles;
		this.cookieData.profiles = reorderedCookie;
		
		this.cookie.put(this.cookieData);
		
	} 
	catch (e)
	{
		Mojo.Log.logException(e, 'profiles#reorderProfile');
	}
};
profilesModel.prototype.applyComplete = function(payload, location)
{
	//alert('===========');
	//for (p in payload) alert(p+' : '+payload[p]);

	this.setRequests[location] = false;

	if (!this.setRequests["cpufreq"] &&
		!this.setRequests["compcache"] &&
		!this.stickRequests["cpufreq"] &&
		!this.stickRequests["compcache"] &&
		!this.stickRequests["iosched"] &&
		this.controller &&
		this.controller.stageController) {
		this.controller.stageController.popScene();
	}
};
profilesModel.prototype.stickComplete = function(payload, location)
{
	//alert('===========');
	//for (p in payload) alert(p+' : '+payload[p]);

	this.stickRequests[location] = false;

	if (!this.setRequests["cpufreq"] &&
		!this.setRequests["compcache"] &&
		!this.stickRequests["cpufreq"] &&
		!this.stickRequests["compcache"] &&
		!this.stickRequests["iosched"] &&
		this.controller &&
		this.controller.stageController) {
		this.controller.stageController.popScene();
	}
};


function profileModel(params) 
{
    this.id =				params.id;
	this.name =				params.name;
	
	this.version =			params.version;
	this.locked =			params.locked;
	
	this.governor =			params.governor;
	
	this.settingsStandard  = params.settingsStandard;
	this.settingsSpecific  = params.settingsSpecific;
	this.settingsOverride  = params.settingsOverride;
	this.settingsCompcache = params.settingsCompcache;
	this.ioScheduler	   = params.ioScheduler;

	this.kernels =			params.kernels;

};
profileModel.prototype.apply = function()
{
	var standardParams  = [];
	var specificParams  = [];
	var overrideParams  = [];
	var compcacheConfig = [];

	standardParams.push({name:'scaling_governor', value:this.governor});
	
	for (var s = 0; s < this.settingsStandard.length; s++) {
		if ((this.settingsStandard[s].name == "scaling_min_freq") &&
			(parseFloat(this.settingsStandard[s].value) > parseFloat(dataHandler.currentLimits.max))) {
			alert("newmin: "+this.settingsStandard[s].value+" greater than oldmax: "+dataHandler.currentLimits.max);
			// Push the max frequency first to allow for the new min
			standardParams.push({name:"scaling_max_freq", value:this.settingsStandard[s].value});
		}
		if ((this.settingsStandard[s].name == "scaling_max_freq") &&
			(parseFloat(this.settingsStandard[s].value) < parseFloat(dataHandler.currentLimits.min))) {
			alert("newmax: "+this.settingsStandard[s].value+" less than oldmin: "+dataHandler.currentLimits.min);
			// Push the min frequency first to allow for the new max
			standardParams.push({name:"scaling_min_freq", value:this.settingsStandard[s].value});
		}
		standardParams.push(this.settingsStandard[s]);
	}
	
	if (this.settingsSpecific) {
		for (var s = 0; s < this.settingsSpecific.length; s++) {
			specificParams.push(this.settingsSpecific[s]);
		}
	}

	if (this.settingsOverride) {
		for (var s = 0; s < this.settingsOverride.length; s++) {
			overrideParams.push(this.settingsOverride[s]);
		}
	}

	if (profiles.setRequests['cpufreq']) profiles.setRequests['cpufreq'].cancel();
	profiles.setRequests["cpufreq"] = service.set_cpufreq_params(profiles.applyCompleteCpufreq, standardParams, specificParams, overrideParams, (Mojo.Environment.DeviceInfo.modelNameAscii.indexOf("TouchPad") == 0) ? 1 : 0);
	if (profiles.stickRequests['cpufreq']) profiles.stickRequests['cpufreq'].cancel();
	profiles.stickRequests['cpufreq'] = service.stick_cpufreq_params(profiles.stickCompleteCpufreq, standardParams, specificParams, overrideParams, (Mojo.Environment.DeviceInfo.modelNameAscii.indexOf("TouchPad") == 0) ? 1 : 0);
	
	if (this.settingsCompcache) {
		for (var s = 0; s < this.settingsCompcache.length; s++) {
			compcacheConfig.push(this.settingsCompcache[s]);
		}
		if (profiles.setRequests['compcache']) profiles.setRequests['compcache'].cancel();
		profiles.setRequests["compcache"] = service.set_compcache_config(profiles.applyCompleteCompcache, compcacheConfig);
		if (profiles.stickRequests['compcache']) profiles.stickRequests['compcache'].cancel();
		profiles.stickRequests["compcache"] = service.stick_compcache_config(profiles.stickCompleteCompcache, compcacheConfig);
	}

	if (this.ioScheduler) {
		if (profiles.setRequests['iosched']) profiles.setRequests['iosched'].cancel();
		profiles.setRequests["iosched"] = service.set_io_scheduler(profiles.applyCompleteIoSched, this.ioScheduler);
		if (profiles.stickRequests['iosched']) profiles.stickRequests['iosched'].cancel();
		profiles.stickRequests["iosched"] = service.stick_io_scheduler(profiles.stickCompleteIoSched, this.ioScheduler);
	}
};
profileModel.prototype.getListObject = function()
{
	// Omit incompatible kernels
	if (this.kernels && (this.kernels.indexOf(profiles.kernel) == -1)) {
		return false;
	}

	var tmpName = this.name;
	if (dataHandler.profile && dataHandler.profile.name == this.name) tmpName = '<b>' + this.name + '</b>';
	
	var obj =
	{
		key:	profiles.getProfileArrayKey(this.id),
		id:		this.id,
		name:	tmpName,
		locked:	this.locked,
		
		governor: this.governor,
		data:	this.getDataString()
	};
	
	return obj;
};
profileModel.prototype.getDataString = function()
{
	var data = '<span class="name">Governor</span><span class="value">' + this.governor + '</span>';
	for (var s = 0; s < this.settingsStandard.length; s++) {
		var row = this.getDataSettingString(this.settingsStandard[s].name, this.settingsStandard[s].value);
		data += '<br /><span class="name">' + row[0] + '</span><span class="value">' + row[1] + '</span>';
	}
	if (this.settingsSpecific) {
		for (var s = 0; s < this.settingsSpecific.length; s++) {
			var row = this.getDataSettingString(this.settingsSpecific[s].name, this.settingsSpecific[s].value);
			data += '<br /><span class="name">' + row[0] + '</span><span class="value">' + row[1] + '</span>';
		}
	}
	if (this.settingsOverride) {
		for (var s = 0; s < this.settingsOverride.length; s++) {
			var row = this.getDataSettingString(this.settingsOverride[s].name, this.settingsOverride[s].value);
			data += '<br /><span class="name">' + row[0] + '</span><span class="value">' + row[1] + '</span>';
		}
	}
	if (this.settingsCompcache) {
		for (var s = 0; s < this.settingsCompcache.length; s++) {
			var row = this.getDataSettingString(this.settingsCompcache[s].name, this.settingsCompcache[s].value);
			data += '<br /><span class="name">' + row[0] + '</span><span class="value">' + row[1] + '</span>';
		}
	}
	if (this.ioScheduler) {
		var row = this.getDataSettingString("io_scheduler", this.ioScheduler);
		data += '<br /><span class="name">' + row[0] + '</span><span class="value">' + row[1] + '</span>';
	}
	return data;
};
profileModel.prototype.getDataSettingString = function(name, value)
{
	if (dataHandler.settings[name])
	{
		switch(dataHandler.settings[name].type)
		{
			case 'listFreq':
				if ((parseInt(value) / 1000) >= 1000)
					return [dataHandler.settingLabel(name), ((parseInt(value)/1000)/1000) + ' GHz'];
				else
					return [dataHandler.settingLabel(name), (parseInt(value)/1000) + ' MHz'];
				break;
			case 'listPcnt':
				return [dataHandler.settingLabel(name), value + ' %'];
				break;
			case 'listPowr':
				return [dataHandler.settingLabel(name), value];
				break;
			case 'listSamp':
				var min = 0;
				var sec = (parseInt(value) / 1000000);
				if (sec / 60 >= 1)
				{
					min = Math.floor(sec / 60);
					sec = (sec % 60);
				}
				var display = '';
				if (min > 0) display += min+' Min';
				if (min > 1) display += 's ';
				else display += ' ';
				if (sec > 0) display += sec+' Sec';
				return [dataHandler.settingLabel(name), display];
				break;
			case 'listSampDown':
				return [dataHandler.settingLabel(name), value];
				break;
			case 'listDownDiff':
				return [dataHandler.settingLabel(name), value];
				break;
			case 'listMem':
				return [dataHandler.settingLabel(name), value/1024 + ' MB'];
				break;
			case 'listWindow':
				return [dataHandler.settingLabel(name), value/1000 + ' Sec'];
				break;
				
			case 'toggleTF':
				return [dataHandler.settingLabel(name), (value == 1 ? 'true' : 'false')];
				break;

			case 'listTemp':
				return [dataHandler.settingLabel(name), value + ' C'];
				break;

			case 'sceneVoltsCpuFreq':
			case 'sceneVoltsSysFreq':
			case 'sceneVoltsLoad':
				return [dataHandler.settingLabel(name), value];
				break;
			
			default:
				return [name.replace(/_/g, " "), value];
				break;
		}
	}
	else
	{
		return [name.replace(/_/g, " "), value];
	}
};
profileModel.prototype.dump = function()
{
	var r = '';
	
	r += '<span style="border-top: 1px solid #000;"><b>('+this.id+') '+this.name+' '+(this.version?'v'+this.version:'')+'</b></span><br>';
	r += '<b>Governor:</b> '+this.governor+'<br>';
	
	if (this.settingsStandard)
	{
		for (var s = 0; s < this.settingsStandard.length; s++)
		{
			var row = this.getDataSettingString(this.settingsStandard[s].name, this.settingsStandard[s].value);
			r += '<b>'+row[0]+':</b> '+row[1]+'<br>';
		}
	}
	if (this.settingsSpecific)
	{
		for (var s = 0; s < this.settingsSpecific.length; s++)
		{
			var row = this.getDataSettingString(this.settingsSpecific[s].name, this.settingsSpecific[s].value);
			r += '<b>'+row[0]+':</b> '+row[1]+'<br>';
		}
	}
	if (this.settingsOverride)
	{
		for (var s = 0; s < this.settingsOverride.length; s++)
		{
			var row = this.getDataSettingString(this.settingsOverride[s].name, this.settingsOverride[s].value);
			r += '<b>'+row[0]+':</b> '+row[1]+'<br>';
		}
	}
	if (this.settingsCompcache)
	{
		for (var s = 0; s < this.settingsCompcache.length; s++)
		{
			var row = this.getDataSettingString(this.settingsCompcache[s].name, this.settingsCompcache[s].value);
			r += '<b>'+row[0]+':</b> '+row[1]+'<br>';
		}
	}
	if (this.ioScheduler)
	{
		var row = this.getDataSettingString("io_scheduler", this.ioScheduler);
		r += '<b>'+row[0]+':</b> '+row[1]+'<br>';
	}
	
	return r;
}


// Local Variables:
// tab-width: 4
// End:
