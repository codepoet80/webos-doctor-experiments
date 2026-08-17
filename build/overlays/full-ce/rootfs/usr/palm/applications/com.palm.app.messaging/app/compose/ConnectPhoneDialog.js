var msg_cpd_windowHeight = "220px";
if (enyo.g11n.currentLocale().language == "fr") msg_cpd_windowHeight = "250px";
if (enyo.g11n.currentLocale().language == "de") msg_cpd_windowHeight = "270px";

enyo.kind({
	name: "ConnectPhoneDialog",
	kind: "ModalDialog",
	caption: $L("Message Can't Be Sent"),
	height: msg_cpd_windowHeight,
	contentClassName: "enyo-paragraph",
	components: [
		{kind: "ApplicationEvents", onWindowHidden: "close", onUnload: "close", onWindowActivated: "windowActivatedHandler"},
		{name: "message", content: $L("A phone must be connected to this device via Bluetooth in order to send a text message.")},
		{name: "buttonOrientation", layoutKind: "VFlexLayout", components: [
			{name: "connectButton", kind: "Button", flex:1, caption: $L("Connect Phone"), className:"enyo-button-dark", onclick: "connectButtonClick"},
			{name: "closeButton", kind: "Button", flex:1, caption: $L("OK"), onclick: "close"}			
		]},
		{name: "launchApp", kind: "Launcher", app: "com.palm.app.bluetooth"}
	],
    renderOpen: function() {
		this.inherited(arguments);
		if (enyo.application.telephonyWatcher) {
			enyo.application.telephonyWatcher.register(this, this.connectionUpdated.bind(this));
		}
	},
	connectionUpdated: function(connected) {
		this.connected = connected;
	},
	connectButtonClick: function() {
		this.$.launchApp.launch();
	},
	windowActivatedHandler: function() {
		if (this.isOpen && this.connected) {
			this.close();
		}
	},
	close: function() {
		this.inherited(arguments);
		if (this.isOpen && enyo.application.telephonyWatcher) {
			enyo.application.telephonyWatcher.unregister(this);
		}
	}
});
