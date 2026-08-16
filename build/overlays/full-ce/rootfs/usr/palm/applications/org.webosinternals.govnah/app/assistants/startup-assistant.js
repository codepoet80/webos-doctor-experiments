function StartupAssistant(changelog)
{
	this.justChangelog = changelog;
	
    // on first start, this message is displayed, along with the current version message from below
    this.firstMessage = $L('Here are some tips for first-timers:<ul><li>We recommend using the WebOS Internals UberKernel</li><li>Please check the Preferences screen for more options</li></ul><b>Note that overclocking your device is likely to void your warranty.</b>');
	
    this.secondMessage = $L('We hope you enjoy being able to take full control over your CPU.<br>Please consider making a <a href=\"https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=L8ALFGFJ7VJVJ\">donation</a> if you wish to show your appreciation.');
	
    // on new version start
    this.newMessages =
	[
	 // Don't forget the comma on all but the last entry
 	 { version: '1.3.9',log: [ 'Added support for the ondemand-ng Pre 2 kernels' ] },
 	 { version: '1.3.8',log: [ 'Add default warthog Pre 3 profile' ] },
 	 { version: '1.3.7',log: [ 'Fixed voltage adjustment granularity on Veer and Pre 3' ] },
 	 { version: '1.3.6',log: [ 'Fixed voltage adjustment on Veer, Pre 3, TouchPad' ] },
 	 { version: '1.3.3',log: [ 'Reverted an incorrect voltage settings change' ] },
 	 { version: '1.3.2',log: [ 'Added support for the ondemand-ng TouchPad kernels' ] },
 	 { version: '1.3.1',log: [ 'Added support for the ondemand-ng Veer kernels' ] },
 	 { version: '1.3.0',log: [ 'Fixed a major bug in profile saving' ] },
 	 { version: '1.2.9',log: [ 'Added help text for ondemand-ng parameters' ] },
 	 { version: '1.2.8',log: [ 'Added support for ondemandtcl with screenstate (known as ondemand-ng)' ] },
 	 { version: '1.2.7',log: [ 'Added support for the new Veer 1.4GHz UberKernel' ] },
 	 { version: '1.2.6',log: [ 'Added support for the Veer A-4 Skyhawk kernel' ] },
 	 { version: '1.2.5',log: [ 'Added support for the Pre 3 UberKernel and Warthog kernel' ] },
 	 { version: '1.2.4',log: [ 'Added support for the Pre 3 A-1 Skyraider kernel' ] },
 	 { version: '1.2.3',log: [ 'Added support for TouchPad webOS 3.0.4 Warthog kernel' ] },
 	 { version: '1.2.2',log: [ 'Added support for TouchPad webOS 3.0.4 F15C and F4 kernels' ] },
 	 { version: '1.2.1',log: [ 'Added support for TouchPad webOS 3.0.4 kernel defaults' ] },
 	 { version: '1.2.0',log: [ 'Added support for the new TouchPad governors' ] },
 	 { version: '1.1.1',log: [ 'Added Veer 1.2GHz support' ] },
 	 { version: '1.1.0',log: [ 'Added recognition of the F4 kernel' ] },
 	 { version: '1.0.9',log: [ 'Added support for Veer' ] },
 	 { version: '1.0.8',log: [ 'Added support for System Voltage frequencies on the Pre/Pre+' ] },
 	 { version: '1.0.7',log: [ 'Added support for UberKernel on the Pre3' ] },
 	 { version: '1.0.6',log: [ 'Modifications for Pre3' ] },
 	 { version: '1.0.5',log: [ 'Reinstated screenstate3 1100 profile for UberKernel/Pre2' ] },
 	 { version: '1.0.3',log: [ 'Removed the unused screenstate3 150/1100 profile' ] },
 	 { version: '1.0.2',log: [ 'Fixed TouchPad exhibition mode graph width' ] },
 	 { version: '1.0.1',log: [ 'Improved the sampling rate quantisation' ] },
 	 { version: '1.0.0',log: [ 'Full support for all released webOS devices' ] },
 	 { version: '0.9.9',log: [ 'Added back button to graph scene for TouchPad' ] },
 	 { version: '0.9.8',log: [ 'Robustified the dual core handling on reset' ] },
 	 { version: '0.9.7',log: [ 'Fixed back button in preferences scene' ] },
 	 { version: '0.9.6',log: [ 'Added dual core support',
							   'Removed unimplemented dashboard preference',
							   'Removed manual settings preference' ] },
 	 { version: '0.9.5',log: [ 'Added profile support for IO schedulers' ] },
 	 { version: '0.9.4',log: [ 'Added support for TouchPad overclocking' ] },
 	 { version: '0.9.3',log: [ 'Added the missing device stylesheet' ] },
 	 { version: '0.9.2',log: [ 'Added back buttons for devices without a gesture area' ] },
 	 { version: '0.9.1',log: [ 'Added the Palm Default profile for the TouchPad' ] },
 	 { version: '0.9.0',log: [ 'Added support for the TouchPad, using the full screen area',
							   'Added CPU high temperature scaleback speed support' ] },
 	 { version: '0.8.12',log: [ 'Add battery temperature support for Veer and TouchPad' ] },
	 { version: '0.8.8',log: [ 'Added battery current support for the TouchPad' ] },
	 { version: '0.8.6',log: [ 'Added battery current support for the Veer' ] },
	 { version: '0.8.5',log: [ 'Added more detail in the help for various settings' ] },
	 { version: '0.8.3',log: [ 'Small fix in profile for the Pre AV8B experimental kernel and the Pre F102A stable kernel' ] },
	 { version: '0.8.2',log: [ 'Small fix in profile for the Pre 2 SR71 experimental kernel' ] },
	 { version: '0.8.1',log: [ 'Only set new voltages if the user actually changes them' ] },
	 { version: '0.8.0',log: [ 'On settings save, only set those parameters that have been modified by the user' ] },
	 { version: '0.7.30',log: [ 'Updated the units for charger and vdemand polling rates' ] },
	 { version: '0.7.29',log: [ 'Small fix in profile for the Pre 2 F104A experimental kernel' ] },
	 { version: '0.7.28',log: [ 'Updated profiles for the Pre 2 F104A experimental kernel' ] },
	 { version: '0.7.27',log: [ 'Display raw value as well as actual voltage for cpu and system' ] },
	 { version: '0.7.26',log: [ 'Updated profiles for the F104A experimental kernel' ] },
	 { version: '0.7.25',log: [ 'Added support for 10MB, 12MB and 14MB compcache limits' ] },
	 { version: '0.7.24',log: [ 'Added support for 8MB compcache lower limit' ] },
	 { version: '0.7.23',log: [ 'Added support for Pre 2 screenstate in SR71' ] },
	 { version: '0.7.22',log: [ 'Added support for the 1.2GHz Pre 2 SR71 experimental kernel' ] },
	 { version: '0.7.21',log: [ 'Added support for the F102B experimental kernel' ] },
	 { version: '0.7.20',log: [ 'Selects correct default profiles when switching kernels' ] },
	 { version: '0.7.19',log: [ 'Added support for the F14 Tomcat experimental kernel' ] },
	 { version: '0.7.18',log: [ 'Added default profiles for experimental kernels' ] },
	 { version: '0.7.17',log: [ 'Now supports display of experimental kernel versions' ] },
	 { version: '0.7.16',log: [ 'Added the active kernel version to the main scene' ] },
	 { version: '0.7.15',log: [ 'Gracefully handle governors that do not have governor-specific parameters' ] },
	 { version: '0.7.14',log: [ 'More aggressive error reporting' ] },
	 { version: '0.7.13',log: [ 'Display active kernel on the main scene' ] },
	 { version: '0.7.12',log: [ 'Added support for screenstate-v2 governor' ] },
	 { version: '0.7.11',log: [ 'Fixed Profile bug' ] },
	 { version: '0.7.10',log: [ 'Added support for UberKernel System Voltage control' ] },
	 { version: '0.7.9',log: [ 'Added voltage selector scene for CPU Voltage and System Voltage vdemand governor settings' ] },
	 { version: '0.7.8',log: [ 'Added support for the vdemand governor' ] },
	 { version: '0.7.7',log: [ 'Added default profiles for the Pre 2',
							   'Updated german translations, courtesy of Markus Leutwyler (swisstomcat) and Frank Adler (Ice8lue)' ] },
	 { version: '0.7.6',log: [ 'Updated the UberKernel Default profile' ] },
	 { version: '0.7.5',log: [ 'Added a Changelog button to the Help scene' ] },
	 { version: '0.7.4',log: [ 'Added "Generate Support Email" option to help scene',
							   'Added "Disable Profile" option to app-menu of profile list',
							   'Improved the help text.'] },
	 { version: '0.7.3',log: [ 'Improved the help text.'] },
	 { version: '0.7.2',log: [ 'Improved profile exact matching. Initial help mode implementation.'] },
	 { version: '0.7.1',log: [ 'Reversed the order of the voltage popup, and fixed the profile saving'] },
	 { version: '0.7.0',log: [ 'Added voltage selection screen, and improved compcache settings handling'] },
	 { version: '0.6.9',log: [ 'Added more support for the latest cpufreq override module features'] },
	 { version: '0.6.8',log: [ 'Localization support and added French translations (courtesy of Yannick LE NY)'] },
	 { version: '0.6.7',log: [ 'Added Screenstate 500/1000 default profile for Uber1G'] },
	 { version: '0.6.6',log: [ 'Added profile support for the voltage selection parameters'] },
	 { version: '0.6.4',log: [ 'Added profile support for the cpufreq override module'] },
	 { version: '0.6.3',log: [ 'Initial support for the cpufreq override module'] },
	 { version: '0.6.1',log: [ 'Rolled up all the 0.5.x alpha releases into a new public release',
							   'Major new features include current monitoring, and a revamped Advanced Settings screen now located in the Profiles area'] },
	 { version: '0.5.9',log: [ 'Renamed the battery current display and inverted the polarity again',
				 			   'Disabled the compcache settings scene if compcache is not available'] },
	 { version: '0.5.8',log: [ 'Fixed memory leak, suspected of causing the eventual hang bug'] },
	 { version: '0.5.7',log: [ 'Revamped current draw display, including inverting the polarity',
							   'Added io schedulers and tcp congestion control (no profile support yet)'] },
	 { version: '0.5.6',log: [ 'Improved current graphing on main screen'] },
	 { version: '0.5.5',log: [ 'First pass at adding current monitoring support'] },
	 { version: '0.5.0',log: [ 'Rolled up all the 0.4.x alpha releases into a new public release',
							   'Major new features include Pixi support, memory reporting and compcache configuration'] },
	 { version: '0.4.17',log: [ 'Added Compcache configuration to saved profiles'] },
	 { version: '0.4.16',log: [ 'Fixed the obscure bug in applying a profile ' +
							    '(new min greater than current max, new max less than current min)'] },
	 { version: '0.4.15',log: [ 'Added the UberKernel Default profile'] },
	 { version: '0.4.14',log: [ 'Fixed the duplicate profiles bug'] },
	 { version: '0.4.13',log: [ 'Set the Palm Default profile back to 600MHz max'] },
	 { version: '0.4.12',log: [ 'Added getProfiles and setProfile methods to the service'] },
	 { version: '0.4.11',log: [ 'Updates settings screen after settings are applied',
							    'Fixed serious bug in compcache enable handling',
							    'Fixed some obscure error cases ' +
							    '(new min greater than current max, new max less than current min)'] },
	 { version: '0.4.10',log: [ 'Updates main screen values whenever the card is activated',
							    'New visually segmented advanced settings screen' ] },
	 { version: '0.4.9', log: [ 'Fixed the profile save bug, please recreate any custom profiles',
							    'Added support in the service for sticky compcache settings'] },
	 { version: '0.4.8', log: [ 'Robustified parameter display and profile handling' ] },
	 { version: '0.4.7', log: [ 'Added Pixi temperature and available frequency support',
							    'Created default and fixed speed 600 profiles for Pixi'] },
	 { version: '0.4.6', log: [ 'Now detects whether configurable compcache support is available' ] },
	 { version: '0.4.5', log: [ 'Added error reporting for compcache configuration' ] },
	 { version: '0.4.4', log: [ 'Report correct compcache memory limit' ] },
	 { version: '0.4.3', log: [ 'Added memory usage and compcache control' ] },
	 { version: '0.4.2', log: [ 'Fixed the unknown profile problem' ] },
	 { version: '0.4.1', log: [ 'Added the startup splash screen and some initial default profiles' ] },
	 { version: '0.4.0', log: [ 'Select a profile to have it automatically reapplied on each clean reboot' ] },
	 { version: '0.3.1', log: [ 'Added support for launch parameters',
							    'Fixed ignore_nice_load always shows true on profile screen bug' ] },
	 { version: '0.3.0', log: [ 'Added support for profiles' ] },
	 { version: '0.2.5', log: [ 'Now only stores the latest 5 minutes of temperature data in memory' ] },
	 { version: '0.2.4', log: [ 'Graphing updates' ] },
	 { version: '0.2.3', log: [ 'Initial full-screen graphs' ] },
	 { version: '0.2.2', log: [ 'Major graphing overhaul' ] },
	 { version: '0.1.4', log: [ 'Fixed governor-specific controls, and added loadavg to the service' ] },
	 { version: '0.1.3', log: [ 'Initial version that is able to make changes' ] },
	 { version: '0.1.2', log: [ 'Update current governor on activate' ] },
	 { version: '0.1.1', log: [ 'Display of current governor and frequency' ] },
	 { version: '0.1.0', log: [ 'Fleshed out all the service methods' ] },
	 { version: '0.0.7', log: [ 'Better graphing' ] },
	 { version: '0.0.6', log: [ 'Added periodic updating when the app is open' ] },
	 { version: '0.0.5', log: [ 'First Public Release' ] }
	 ];
	
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
	
    // setup command menu
    this.cmdMenuModel =
	{
	    visible: false, 
	    items:
	    [
		    {},
		    {
				label: $L("Ok, I've read this. Let's continue ..."),
				command: 'do-continue'
		    },
		    {}
	     ]
	};
};

StartupAssistant.prototype.setup = function()
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
    this.titleContainer = this.controller.get('title');
    this.dataContainer =  this.controller.get('data');
	
	this.backElement = this.controller.get('header');
	
    // set title
	if (this.justChangelog)
	{
		this.titleContainer.innerHTML = $L('Changelog');
		// setup back tap
		this.backTapHandler = this.backTap.bindAsEventListener(this);
		this.controller.listen(this.backElement, Mojo.Event.tap, this.backTapHandler);
	}
	else
	{
	    if (vers.isFirst) {
			this.titleContainer.innerHTML = $L('Welcome To Govnah');
	    }
	    else if (vers.isNew) {
			this.titleContainer.innerHTML = $L('Govnah Changelog');
	    }
	}
	
	
    // build data
    var html = '';
	if (this.justChangelog)
	{
		for (var m = 0; m < this.newMessages.length; m++) 
		{
		    html += Mojo.View.render({object: {title: 'v' + this.newMessages[m].version}, template: 'startup/changeLog'});
		    html += '<ul>';
		    for (var l = 0; l < this.newMessages[m].log.length; l++)
			{
				html += '<li>' + this.newMessages[m].log[l] + '</li>';
		    }
		    html += '</ul>';
		}
	}
	else
	{
		if (vers.isFirst)
		{
			html += '<div class="text">' + this.firstMessage + '</div>';
		}
	    if (vers.isNew)
		{
			if (!this.justChangelog)
			{
				html += '<div class="text">' + this.secondMessage + '</div>';
			}
			for (var m = 0; m < this.newMessages.length; m++) 
			{
			    html += Mojo.View.render({object: {title: 'v' + this.newMessages[m].version}, template: 'startup/changeLog'});
			    html += '<ul>';
			    for (var l = 0; l < this.newMessages[m].log.length; l++)
				{
					html += '<li>' + this.newMessages[m].log[l] + '</li>';
			    }
			    html += '</ul>';
			}
	    }
	}
    
    // set data
    this.dataContainer.innerHTML = html;
	
	
    // setup menu
    this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, this.menuModel);
	
	if (!this.justChangelog)
	{
	    // set command menu
	    this.controller.setupWidget(Mojo.Menu.commandMenu, { menuClass: 'no-fade' }, this.cmdMenuModel);
	}
	
    // set this scene's default transition
    this.controller.setDefaultTransition(Mojo.Transition.zoomFade);
};

StartupAssistant.prototype.activate = function(event)
{
	if (!this.justChangelog) {
		// start continue button timer
		this.timer = this.controller.window.setTimeout(this.showContinue.bind(this), 5 * 1000);
	}
};

StartupAssistant.prototype.showContinue = function()
{
    // show the command menu
    this.controller.setMenuVisible(Mojo.Menu.commandMenu, true);
};

StartupAssistant.prototype.backTap = function(event)
{
    if (this.justChangelog) {
		this.controller.stageController.popScene();
    }
};

StartupAssistant.prototype.handleCommand = function(event)
{
    if (event.type == Mojo.Event.command) {
	switch (event.command) {
	case 'do-continue':
	this.controller.stageController.swapScene({name: 'main', transition: Mojo.Transition.crossFade});
	break;
			
	case 'do-prefs':
	this.controller.stageController.pushScene('preferences');
	break;
			
	case 'do-help':
	this.controller.stageController.pushScene('help');
	break;
	}
    }
};

// Local Variables:
// tab-width: 4
// End:
