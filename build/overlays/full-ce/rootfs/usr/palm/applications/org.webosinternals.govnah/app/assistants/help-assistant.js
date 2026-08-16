function HelpAssistant()
{
	
};

HelpAssistant.prototype.setup = function()
{
	this.controller.get('help-title').innerHTML = $L('Help');
	this.controller.get('help-support').innerHTML = $L('Support');
	
	this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, {visible: false});
	
	this.controller.get('appname').innerHTML = Mojo.appInfo.title;
	this.controller.get('appdetails').innerHTML = Mojo.appInfo.version + $L(' by WebOS Internals');
	
	this.supportModel = 
	{
		items: []
	};
	
	this.supportModel.items.push({
		text: $L('Wiki Page'),
		detail: 'http://www.webos-internals.org/wiki/Application:Govnah',
		Class: 'img_web',
		type: 'web'
	});
	this.supportModel.items.push({
		text: $L('IRC Channel'),
		detail: 'http://webchat.freenode.net?channels=webos-internals',
		Class: 'img_web',
		type: 'web'
	});
	this.supportModel.items.push({
		text: $L('Changelog'),
		Class: 'img_changelog',
		type: 'changelog'
	});
	this.supportModel.items.push({
		text: $L('Generate Email'),
		Class: 'img_email',
		type: 'supportEmail'
	});
	
	this.controller.setupWidget
	(
		'supportList', 
		{
			itemTemplate: "help/rowTemplate",
			swipeToDelete: false,
			reorderable: false
		},
		this.supportModel
	);
	
	this.controller.listen('supportList', Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this));
	this.backElement = this.controller.get('icon');
	this.backTapHandler = this.backTap.bindAsEventListener(this);
	this.controller.listen(this.backElement, Mojo.Event.tap, this.backTapHandler);
	
};
HelpAssistant.prototype.backTap = function(event)
{
	this.controller.stageController.popScene();
};
HelpAssistant.prototype.listTapHandler = function(event)
{
	switch (event.item.type)
	{
		case 'web':
			this.controller.serviceRequest("palm://com.palm.applicationManager", 
			{
				method: "open",
				parameters: 
				{
					id: 'com.palm.app.browser',
					params: 
					{
						target: event.item.detail
					}
				}
			});
			break;
			
		case 'email':
			this.controller.serviceRequest('palm://com.palm.applicationManager', 
			{
				method: 'open',
				parameters: 
				{
					target: 'mailto:' + event.item.address + "?subject=" + Mojo.appInfo.title + " " + event.item.subject
				}
			});
			break;
			
		case 'changelog':
			this.controller.stageController.pushScene('startup', true);
			break;
			
		case 'scene':
			this.controller.stageController.pushScene(event.item.detail);
			break;
			
		case 'supportEmail':
			this.generateEmail();
			break;
	}
};
HelpAssistant.prototype.generateEmail = function()
{
	service.get_proc_version(this.generateEmailHandler.bindAsEventListener(this, 'get_proc_version'));
	service.get_cpufreq_file(this.generateEmailHandler.bindAsEventListener(this, 'get_cpufreq_file'));
	service.get_compcache_file(this.generateEmailHandler.bindAsEventListener(this, 'get_compcache_file'));
	this.generateCallbacks =
	{
		get_proc_version: false,
		get_cpufreq_file: false,
		get_compcache_file: false
	}
};
HelpAssistant.prototype.generateEmailHandler = function(payload, part)
{
	if (payload.returnValue)
	{
		this.generateCallbacks[part] = payload.stdOut;
	}
	else
	{
		this.generateCallbacks[part] = payload.stdErr;
	}
	
	if (this.generateCallbacks.get_proc_version !== false &&
		this.generateCallbacks.get_cpufreq_file !== false &&
		this.generateCallbacks.get_compcache_file !== false)
	{
		var email = '<br><br><br>';
		
		email += '<b>proc_version:</b> '+this.generateCallbacks.get_proc_version;
		
		email += '<h1>Current:</h1>';
		email += '<i>From Service:</i><br>';
		email += dataHandler.dumpCurrent();
		email += '<br><br>';
		
		email += '<h1>Files:</h1>';
		email += '<b>cpufreq_file</b>';
		email += '<pre>';
		if (Object.isArray(this.generateCallbacks.get_cpufreq_file))
		{
			for (var l = 0; l < this.generateCallbacks.get_cpufreq_file.length; l++)
			{
				if (l > 0) email += "\n";
				email += this.generateCallbacks.get_cpufreq_file[l];
			}
		}
		else
		{
			email += this.generateCallbacks.get_compcache_file;
		}
		email += '</pre>';
		email += '<br>';
		email += '<b>compcache_file</b>';
		email += '<pre>';
		if (Object.isArray(this.generateCallbacks.get_compcache_file))
		{
			for (var l = 0; l < this.generateCallbacks.get_compcache_file.length; l++)
			{
				if (l > 0) email += "\n";
				email += this.generateCallbacks.get_compcache_file[l];
			}
		}
		else
		{
			email += this.generateCallbacks.get_compcache_file;
		}
		email += '</pre>';
		email += '<br><br>';
		
		email += '<h1>Profiles:</h1>'
		for (var p = 0; p < profiles.profiles.length; p++)
		{
			email += profiles.profiles[p].dump();
		}
		
		//this.controller.get('test').update(email);
		
		this.controller.serviceRequest
		(
	    	"palm://com.palm.applicationManager",
			{
		        method: 'open',
		        parameters:
				{
		            id: "com.palm.app.email",
		            params:
					{
		                summary: "Govnah Support",
		                text: '<html><body>'+email+'</body></html>'
		            }
		        }
		    }
		);
	}
};

HelpAssistant.prototype.activate = function(event)
{
	if (this.controller.stageController.setWindowOrientation)
	{
		if (Mojo.Environment.DeviceInfo.modelNameAscii.indexOf('TouchPad') != 0 &&
			Mojo.Environment.DeviceInfo.modelNameAscii != 'Emulator')
			this.controller.stageController.setWindowOrientation("up");
	}
};
HelpAssistant.prototype.deactivate = function(event) {};
HelpAssistant.prototype.cleanup = function(event)
{
	this.controller.stopListening(this.backElement,  Mojo.Event.tap, this.backTapHandler);
	this.controller.stopListening('supportList', Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this));
};

// Local Variables:
// tab-width: 4
// End:
