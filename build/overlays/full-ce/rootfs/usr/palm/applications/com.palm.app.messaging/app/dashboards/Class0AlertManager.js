enyo.kind({
	name: "Class0AlertManager",
	kind: "enyo.Component",
	dialogName: "messaging-class0Alert-stage",
	components: [
		{kind: "DbService", onFailure: "fail", components: [
			{dbKind: "com.palm.carrierdb.settings.current:1", components: [
				{name: "carrierFinder", method: "find", onSuccess: "gotCarriers", subscribe: true, resubscribe: true, reCallWatches: true}
			]}
		]},
		{name: "messageAdder", kind: "DbService", dbKind: "com.palm.message:1", method: "put"}
	],
	create: function() {
		this.inherited(arguments);
		this.$.carrierFinder.call();
	},
	gotCarriers: function(inSender, inResponse) {
		var carrier;
		
		enyo.log("Class0AlertManager.gotCarriers(), got carrier settings: ", inResponse);
		if (inResponse && inResponse.results && inResponse.results.length > 0) {
			this.carrierSettings = inResponse.results[0];
		}
	},
	fail: function(inSender, inResponse) {
		enyo.error("Failed to get carrier db settings: ", inResponse);
	}, 
	handleNotification: function(params) {
		enyo.log("Class0Manager.handleNotification(), parmas: ", params);

		var dialog = enyo.windows.fetchWindow(this.dialogName);
		var layer = this.getAlertLayer(params);

		//show banner
		this.putUpBanner(layer);
		// show alert dialog
		if (!dialog) {
			enyo.log("Class0Manager.handleNotification(), creating class0 dialog with: ", layer);
			enyo.windows.openPopup("app/dashboards/class0/class0.html", this.dialogName, layer, undefined, "135px");
		}
		else {
			enyo.log("Class0Manager.handleNotification(), activating class0 dialog with: ", layer);
			enyo.windows.activate(undefined, this.dialogName, layer);
		}
	},
	getAlertLayer: function(params) {
		var layer = {};
		layer.message = params.message;
		layer.text = enyo.string.removeHtml(layer.message.messageText);
		
		layer.message.carrierName = "carrier";
		if (this.carrierSettings) {
			layer.message.carrierName = this.carrierSettings.qOperatorLongName;
		}
		var template = new enyo.g11n.Template($L("Message from #{name}"));
		layer.title = layer.message.alertTitle = template.evaluate({name: layer.message.carrierName});
		
		return layer;
	},
	putUpBanner: function(layer) {
		// put up banner
		var bannerMessage = layer.title + ": " + enyo.string.removeHtml(layer.text);
		enyo.windows.addBannerMessage(bannerMessage, "{}", "images/notification-small.png", "notifications");
	},
	addClass0Message: function(message) {
		// add message to MojoDB
	
		// set dbkind to message
		message._kind = "com.palm.smsmessage:1";
		this.$.messageAdder.call({
			objects: [message]
		});
	},
	closeDialog: function() {
		var dialog = enyo.windows.fetchWindow(this.dialogName);
		if (dialog) {
			dialog.close();
		}
	}
});
