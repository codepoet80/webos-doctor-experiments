// get the cookies
var prefs = new preferenceCookie();
var vers =  new versionCookie();

// stage names
var mainStageName = 'govnah-main';
var dockStageName = 'govnah-dock';

var dataHandler = new dataHandlerModel();
var profiles = new profilesModel();

function AppAssistant() {}

AppAssistant.prototype.handleLaunch = function(params)
{
	
	/*
	alert('--------------------------');
	if (params)
		for (var p in params)
			if (typeof(params[p]) != 'function')
				alert(p+': '+params[p]);
	*/
	
	try
	{
		// launch from launcher tap
		if (!params) 
		{
			var mainStageController = this.controller.getStageController(mainStageName);
	        if (mainStageController) 
			{
				mainStageController.popScenesTo('main');
				mainStageController.activate();
			}
			else
			{
				this.controller.createStageWithCallback({name: mainStageName, lightweight: true}, this.launchFirstScene.bind(this));
			}
		}
		// launch dockmode
		else if (params.dockMode)
		{
			var dockStageController = this.controller.getStageController(dockStageName);
	        if (!dockStageController)
			{
				this.controller.createStageWithCallback({name: dockStageName, lightweight: true}, this.launchDockScene.bind(this), "dockMode");
			}
		}
		// launch and return parameters
		else if (params.type == 'get-profiles' && params.returnid != '')
		{
			var profs = [];
			if (profiles.profiles.length > 0)
			{
				for (var p = 0; p < profiles.profiles.length; p++)
				{
					profs.push({id: profiles.profiles[p].id, name: profiles.profiles[p].name});
				}
			}
			var req = new Mojo.Service.Request
			(
				'palm://com.palm.applicationManager',
				{
					method: 'launch',
					parameters:
					{
						id: params.returnid,
						params:
						{
							type: 'govnah-profiles',
							profiles: profs
						}
					}
				}
			);
		}
		else if (params.type == 'set-profile')
		{
			var prof = false;
			if (params.profileid)
			{
				prof = profiles.getProfileFromId(params.profileid);
			}
			else if (params.profilename)
			{
				prof = profiles.getProfileFromName(params.profilename);
			}
			if (prof)
			{
				prof.apply();
			}
		}
	}
	catch (e)
	{
		Mojo.Log.logException(e, "AppAssistant#handleLaunch");
	}
};

AppAssistant.prototype.launchFirstScene = function(controller)
{
    vers.init();
    if (vers.showStartupScene()) {
		controller.pushScene('startup');
    }
    else {
		controller.pushScene('main');
	}
};
AppAssistant.prototype.launchDockScene = function(controller)
{
	controller.pushScene('dock');
};

AppAssistant.prototype.cleanup = function(event)
{
	dataHandler.resetIcon();
	alert('AppAssistant#cleanup');
};


// Local Variables:
// tab-width: 4
// End:
