function feedsModel()
{
	// for storing assistants when we get one for certain functions
	this.updateAssistant = false;
	
	// for storing all the feed information
	this.feeds = [];

	// we'll need these for the subscription based methods
	this.subscription = false;
	
};

feedsModel.prototype.loadFeeds = function(updateAssistant, callback)
{
	try {
		// clear out our current data (incase this is a re-update)
		this.feeds = [];
		
		this.updateAssistant = updateAssistant;

		// init feed loading
		this.subscription = IPKGService.list_configs(this.onConfigs.bindAsEventListener(this, callback));
	
	} 
	catch (e) {
		Mojo.Log.logException(e, 'feedsModel#loadFeeds');
	}
};

feedsModel.prototype.getFeedUrl = function(name)
{
	if (name && this.feeds.length > 0)
	{
		for (var f = 0; f <= this.feeds.length; f++)
		{
			if (this.feeds[f].name == name) return this.feeds[f].url;
		}
	}
	return false;
}

// Parse a single line of an ipkg feed config, the way ipkg itself does: fields are
// separated by any run of whitespace, and '#' starts a comment.
//
// Returns the parsed feed, or null for a line there is nothing to parse in (blank
// or a comment), or false for a line that should have been a feed but isn't -- the
// caller reports that one, since it means a feed the user configured won't load.
//
// This lives in one place because it used to be duplicated, and both copies split
// on a single space -- so a tab or a double space shifted every field along and
// silently produced a feed whose url was really the feed name, while a url
// containing a space was truncated at the space rather than reported as broken.
//
// Deliberately avoids String#trim() for the sake of the older browser on webOS 1.x.
feedsModel.parseConfigLine = function(line)
{
	if (!line) return null;

	var trimmed = line.replace(/^\s+/, '').replace(/\s+$/, '');
	if (!trimmed || trimmed.charAt(0) == '#') return null;

	var tokens = trimmed.split(/\s+/);
	if (tokens.length < 3 || tokens[2].indexOf('://') == -1) return false;

	return {
		gzipped:	(tokens[0] == "src/gz" ? true : false),
		name:		tokens[1],
		url:		tokens[2],
		tokens:		tokens,
		line:		trimmed
	};
};

feedsModel.prototype.onConfigs = function(payload, callback)
{
	try {
		
		if (!payload) {
			// i dont know if this will ever happen, but hey, it might
			this.updateAssistant.errorMessage('Preware', $L("Cannot access the service. First try restarting Preware, or reboot your device and try again."), this.updateAssistant.doneUpdating);
		}
		else if (payload.errorCode != undefined) {
			// we probably dont need to check this stuff here,
			// it would have already been checked and errored out of this process
			if (payload.errorText == "org.webosinternals.ipkgservice is not running.") {
				this.updateAssistant.errorMessage('Preware', $L("The service is not running. First try restarting Preware, or reboot your device and try again."), this.updateAssistant.doneUpdating);
			}
			else {
				this.updateAssistant.errorMessage('Preware', payload.errorText, this.updateAssistant.doneUpdating);
			}
		}
		else {
			// clear feeds array
			this.feeds = [];
			
			// load feeds
			for (var x = 0; x < payload.configs.length; x++) {
			    if (payload.configs[x].enabled && payload.configs[x].contents) {
					var tmpSplit1 = payload.configs[x].contents.split('<br>');
					for (var c = 0; c < tmpSplit1.length; c++) {
						var feedObj = feedsModel.parseConfigLine(tmpSplit1[c]);
						if (feedObj === false) {
							// Say so rather than adding a feed we know is wrong
							Mojo.Log.error('feeds#onConfigs: ignoring unparseable line in ' +
										   payload.configs[x].config + ': ' + tmpSplit1[c]);
						}
						if (!feedObj) continue;

						// An ipkg feed line is exactly three fields.  Extra ones mean
						// something unintended got into the url -- that is how an
						// unparsed OS version string leaked into the patch feed url on
						// webOS CE and then got truncated at its first space, looking
						// for all the world like a working feed.  Use it, but say so.
						if (feedObj.tokens.length > 3) {
							Mojo.Log.error('feeds#onConfigs: feed line in ' + payload.configs[x].config +
										   ' has extra fields, url may be truncated: ' + feedObj.line);
						}
						// alert("Adding feed '"+feedObj.name+"' at '"+feedObj.url+"'");
						this.feeds.push(feedObj);
					}
				
			    }
			}
			
			// sort them
			this.feeds.sort(function(a, b) {
					if (a.name && b.name) {
						return ((a.name < b.name) ? -1 : ((a.name > b.name) ? 1 : 0));
					}
					else {
						return -1;
					}
				});
			
			if (callback) {
				callback(this.feeds);
			}
		}
	}
	catch (e) {
		Mojo.Log.logException(e, 'feeds#onFeeds');
		this.updateAssistant.errorMessage('onFeeds Error', e, this.updateAssistant.doneUpdating);
	}
};
// Local Variables:
// tab-width: 4
// End:
