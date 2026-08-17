enyo.kind({
	name: "Launcher",
	kind: "Component",
	published: {
		app: undefined
	},
	components: [
		{kind: "LauncherRequest"}
	],
	launch: function(inParams) {
		if (!this.app) {
			enyo.warn("App to launch is not defined");
			return;
		}
		
		if (inParams) {
			this.$.launcherRequest.call({id: this.app, params: inParams});
		} else {
			this.$.launcherRequest.call({id: this.app});
		}
	}
});

enyo.kind({
	name: "LauncherRequest",
	kind: "PalmService",
	service: "palm://com.palm.applicationManager/", 
	method: "open"
});
