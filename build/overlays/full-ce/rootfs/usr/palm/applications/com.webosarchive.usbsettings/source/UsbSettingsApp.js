enyo.kind({
	name: "UsbSettingsApp",
	kind: "VFlexBox",
	// Card focus drives whether we hold the controller -- see startWatching().
	applicationEvents: {
		onWindowActivated:   "windowActivated",
		onWindowDeactivated: "windowDeactivated",
		onUnload:            "windowDeactivated"
	},
	DEVROWS: 6,                 // pre-built device slots (populated from status)
	components: [
		{kind: "Toolbar", className: "enyo-toolbar-light accounts-header", pack: "center", components: [
			{kind: "Image", src: "images/usbsettings_48x48.png", className: "icon-image"},
			{kind: "Control", content: $L("USB Settings")},
			{kind: "Spinner", name: "titleSpinner", className: "usb-title-spinner", showing: false}
		]},
		{className: "accounts-header-shadow"},
		{kind: "Scroller", flex: 1, components: [
			{kind: "Pane", flex: 1, components: [
				{kind: "HFlexBox", name: "loadingView", className: "box-center enyo-bg", flex: 1, pack: "center", align: "center", components: [
					{kind: "Spinner", name: "spinner"},
					{content: $L("Loading…")}
				]},
				{kind: "Control", name: "prefView", className: "box-center enyo-bg", components: [

					/* --- daemon-missing warning (hidden unless needed) --- */
					{kind: "RowGroup", name: "warnGroup", className: "accounts-group", showing: false, components: [
						{kind: "Item", tapHighlight: false, components: [
							{name: "warnText", className: "text-truncation",
							 content: $L("Helper not running. Install via Preware and reboot.")}
						]}
					]},

					/* --- USB Host (OTG) --- read-only indicator. The controller is
					   armed once by the daemon (persists across reboots); after that
					   the port follows the cable automatically, so there is nothing
					   for the user to switch. */
					{kind: "RowGroup", className: "accounts-group", caption: $L("USB Host"), components: [
						{kind: "Item", tapHighlight: false, layoutKind: "HFlexLayout", components: [
							{flex: 1, content: $L("On-the-Go Mode")},
							{kind: "ToggleButton", name: "otgToggle", disabled: true}
						]}
					]},
					{className: "accounts-body-text",
					 content: $L("Accessories connect automatically: attach your USB device to a powered OTG cable first, then plug the cable into the TouchPad. This indicator shows when the port is in OTG mode. While hosting, USB charging and computer sync are unavailable — unplug the OTG cable to get them back.")},

					/* --- High power --- */
					{kind: "RowGroup", className: "accounts-group", caption: $L("Power"), components: [
						{kind: "Item", tapHighlight: false, layoutKind: "HFlexLayout", components: [
							{flex: 1, content: $L("High-power devices")},
							{kind: "ToggleButton", name: "powerToggle", onChange: "togglePower"}
						]}
					]},
					{className: "accounts-body-text",
					 content: $L("Allow devices that draw more power than the port normally permits, such as a Playstation 4 controller. Turn on before plugging the device in.")},

					/* --- Connected input devices (live) --- */
					{kind: "RowGroup", className: "accounts-group", caption: $L("Detected Devices"), components: [
						{kind: "Item", name: "devEmpty", tapHighlight: false, components: [
							{className: "usb-dev-empty", content: $L("No USB devices detected.")}
						]},
						{kind: "Item", name: "dev0", tapHighlight: false, showing: false, layoutKind: "HFlexLayout", align: "center", components: [
							{kind: "Image", name: "dev0type", className: "usb-dev-icon", src: "images/icon-dev-generic.png"},
							{flex: 1, name: "dev0name", className: "usb-dev-name text-truncation"},
							{name: "dev0status", className: "usb-dev-status"}
						]},
						{kind: "Item", name: "dev1", tapHighlight: false, showing: false, layoutKind: "HFlexLayout", align: "center", components: [
							{kind: "Image", name: "dev1type", className: "usb-dev-icon", src: "images/icon-dev-generic.png"},
							{flex: 1, name: "dev1name", className: "usb-dev-name text-truncation"},
							{name: "dev1status", className: "usb-dev-status"}
						]},
						{kind: "Item", name: "dev2", tapHighlight: false, showing: false, layoutKind: "HFlexLayout", align: "center", components: [
							{kind: "Image", name: "dev2type", className: "usb-dev-icon", src: "images/icon-dev-generic.png"},
							{flex: 1, name: "dev2name", className: "usb-dev-name text-truncation"},
							{name: "dev2status", className: "usb-dev-status"}
						]},
						{kind: "Item", name: "dev3", tapHighlight: false, showing: false, layoutKind: "HFlexLayout", align: "center", components: [
							{kind: "Image", name: "dev3type", className: "usb-dev-icon", src: "images/icon-dev-generic.png"},
							{flex: 1, name: "dev3name", className: "usb-dev-name text-truncation"},
							{name: "dev3status", className: "usb-dev-status"}
						]},
						{kind: "Item", name: "dev4", tapHighlight: false, showing: false, layoutKind: "HFlexLayout", align: "center", components: [
							{kind: "Image", name: "dev4type", className: "usb-dev-icon", src: "images/icon-dev-generic.png"},
							{flex: 1, name: "dev4name", className: "usb-dev-name text-truncation"},
							{name: "dev4status", className: "usb-dev-status"}
						]},
						{kind: "Item", name: "dev5", tapHighlight: false, showing: false, layoutKind: "HFlexLayout", align: "center", components: [
							{kind: "Image", name: "dev5type", className: "usb-dev-icon", src: "images/icon-dev-generic.png"},
							{flex: 1, name: "dev5name", className: "usb-dev-name text-truncation"},
							{name: "dev5status", className: "usb-dev-status"}
						]}
					]},
					{className: "accounts-body-text",
					 content: $L("Press a button on a controller to confirm it works. “No input” means the device isn’t responding: reconnect it, or use Reset USB below.")},

					/* --- USB Storage --- */
					{kind: "RowGroup", className: "accounts-group", caption: $L("USB Storage"), components: [
						{kind: "Item", tapHighlight: false, layoutKind: "HFlexLayout", components: [
							{flex: 1, content: $L("Drive")},
							{name: "storageStatus", content: $L("None")}
						]},
						{kind: "Item", name: "storageBtnRow", tapHighlight: true, layoutKind: "HFlexLayout", onclick: "toggleStorage", components: [
							{flex: 1, name: "storageBtnLabel", content: $L("Mount")}
						]}
					]},
					{name: "storageHelp", className: "accounts-body-text",
					 content: $L("Plug in a USB flash drive, then tap Mount to browse it. Always unmount before unplugging.")},

					/* --- Reset USB (last resort) --- */
					{kind: "RowGroup", className: "accounts-group", caption: $L("Reset USB"), components: [
						{kind: "Item", name: "resetBtnRow", tapHighlight: true, layoutKind: "HFlexLayout", pack: "center", onclick: "resetUsb", components: [
							{name: "resetBtnLabel", className: "usb-reset-label", content: $L("Reset USB")}
						]}
					]},
					{name: "resetHelp", className: "accounts-body-text",
					 content: $L("A last resort for a device that connects but won’t respond. This fully re-initializes the USB port and reconnects everything.")}
				]}
			]}
		]},

		{kind: "AppMenu", components: [
			{kind: "HelpMenu", target: "https://github.com/webOSArchive/webos-touchpad-accessories"},
			{caption: $L("About"), onclick: "showAbout"}
		]},

		// Single-button (OK only) info dialog; cancelButtonCaption: "" hides Cancel.
		{kind: "DialogPrompt", name: "aboutDialog", cancelButtonCaption: "", allowHtml: true},

		{kind: "PalmService", name: "svc", service: "palm://com.webosarchive.usbsettings.service/", components: [
			{name: "getStatus", method: "getStatus", onSuccess: "handleStatus", onFailure: "handleSvcFail"},
			{name: "send", method: "send", onFailure: "handleSvcFail"}
		]}
	],

	create: function() {
		this.inherited(arguments);
		this.updating = false;
		this.havePrefs = false;
		this.opInFlight = false;
		this.pendingPower = null;   // "on"/"off" while a power change is applying
		this.pendingPowerAt = 0;
		this.prevPresent = null;
		this.prevMounted = null;
		this.mounted = false;       // gate Reset USB
		this.$.spinner.show();
		this.watching = false;
		this.pollTimer = null;
		this.startWatching();
		this.bindLifecycleFallbacks();
	},

	/* --- panel lifecycle: never hold the controller while we're not in front ---
	   The device monitor grabs input devices EXCLUSIVELY (EVIOCGRAB) so it can
	   show the "input received" indicator. A grabbed pad delivers events to
	   nobody else -- so leaving this card open in the background gives every
	   game a dead controller, which is exactly what a user does when they check
	   the pad here and then launch a game. The keepalive is therefore refreshed
	   ONLY while this panel is actually in front. */
	startWatching: function() {
		if (this.watching) { return; }
		this.watching = true;
		this.refresh();
		// 1 Hz: fast enough to catch the ~1.5s "input received" flash, and doubles
		// as the device-monitor keepalive.
		this.pollTimer = window.setInterval(enyo.bind(this, "refresh"), 1000);
	},

	stopWatching: function() {
		if (!this.watching) { return; }
		this.watching = false;
		if (this.pollTimer) { window.clearInterval(this.pollTimer); this.pollTimer = null; }
		// Stopping the timer alone would only let the keepalive go stale, leaving
		// the grab in place for the staleness window -- long enough to lose the
		// race with a game launching right behind us. Say so explicitly.
		this.$.send.call({command: "watch-off"});
	},

	windowActivated:   function() { this.startWatching(); },
	windowDeactivated: function() { this.stopWatching(); },

	// The Enyo application events above are the intended mechanism, but a missed
	// deactivate here is invisible and reads as broken hardware, so also listen
	// for the underlying webOS card events and for unload. Every path funnels
	// into the same idempotent pair, so duplicate delivery is harmless.
	bindLifecycleFallbacks: function() {
		var self = this;
		var on   = function() { self.startWatching(); };
		var off  = function() { self.stopWatching(); };
		try {
			document.addEventListener("stageActivate",   on,  false);
			document.addEventListener("stageDeactivate", off, false);
			window.addEventListener("unload",            off, false);
		} catch (e) {}
	},

	refresh: function() {
		this.$.send.call({command: "watch-on"});   // keep the device monitor alive while open
		this.$.getStatus.call({});
	},

	banner: function(msg) {
		try {
			if (window.PalmSystem && window.PalmSystem.addBannerMessage) {
				window.PalmSystem.addBannerMessage(msg, "{}", "images/mini-icon.png", "");
			}
		} catch (e) {}
	},

	startOp: function() {
		this.opInFlight = true;
		this.$.titleSpinner.show();
	},

	// The kernel names input devices "<Manufacturer> <Product>", and many
	// vendors repeat their name in the product string ("Logitech Logitech(R)
	// Precision..."). If the first word reappears later, drop the leading copy.
	cleanName: function(name) {
		if (!name) { return name; }
		var sp = name.indexOf(" ");
		if (sp > 0) {
			var first = name.substring(0, sp).toLowerCase();
			var rest = name.substring(sp + 1);
			if (rest.toLowerCase().indexOf(first) === 0) { return rest; }
		}
		return name;
	},

	// Official Palm device silhouettes (from com.palm.app.bluetoothtab);
	// generic/storage use the USB trident (Palm's USB iconography).
	typeIcon: function(type) {
		if (type === "gamepad")  { return "images/icon-dev-gamepad.png"; }
		if (type === "keyboard") { return "images/icon-dev-keyboard.png"; }
		if (type === "mouse")    { return "images/icon-dev-mouse.png"; }
		if (type === "storage")  { return "images/icon-dev-storage.png"; }
		return "images/icon-dev-generic.png";
	},

	renderDevices: function(devs) {
		var i, d, row, s, cls;
		this.$.devEmpty.setShowing(devs.length === 0);
		for (i = 0; i < this.DEVROWS; i++) {
			row = this.$["dev" + i];
			if (i < devs.length) {
				d = devs[i] || {};
				this.$["dev" + i + "type"].setSrc(this.typeIcon(d.type));
				this.$["dev" + i + "name"].setContent(this.cleanName(d.name) || $L("USB device"));
				s = ""; cls = "usb-dev-status";
				if (d.state === "needspower")      { s = $L("Needs power");         cls += " needspower"; }
				else if (d.state === "connecting") { s = $L("Connecting…");         cls += " connecting"; }
				else if (d.state === "noinput")    { s = $L("No input"); cls += " noinput"; }
				else if (d.active)                 { s = $L("Input received");       cls += " active"; }
				this.$["dev" + i + "status"].setContent(s);
				this.$["dev" + i + "status"].setClassName(cls);
				row.setShowing(true);
			} else {
				row.setShowing(false);
			}
		}
	},

	handleStatus: function(inSender, r) {
		this.updating = true;
		this.$.warnGroup.setShowing(!r.daemon);
		this.$.otgToggle.setState(r.otg === "host");

		// High-power toggle without the "wiggle": while a change is applying,
		// the toggle stays LATCHED to the user's choice and disabled -- stale
		// polls must not flip it back. Re-enable and show truth once the status
		// confirms the change (or after a timeout if it never does).
		if (this.pendingPower !== null) {
			var confirmed = (r.power === this.pendingPower);
			var timedOut = ((new Date()).getTime() - this.pendingPowerAt) > 6000;
			if (confirmed || timedOut) {
				this.pendingPower = null;
				this.$.powerToggle.setState(r.power === "on");
				this.$.powerToggle.setDisabled(false);
				if (this.opInFlight) { this.opInFlight = false; this.$.titleSpinner.hide(); }
			}
			/* else: leave the latched state showing; keep waiting */
		} else {
			this.$.powerToggle.setState(r.power === "on");
		}

		var devs = r.devices || [];
		this.renderDevices(devs);

		// Banner when a new input device is detected (like the USB-drive banner).
		// Fires the moment usbdevmon sees it in /sys -- ~1s after plug-in, even
		// before it produces an input node. Skipped on the first poll so devices
		// already attached when the panel opens don't all banner at once.
		var names = [], k, m, seen;
		for (k = 0; k < devs.length; k++) { names.push(devs[k].name); }
		if (this.prevDevNames) {
			for (k = 0; k < names.length; k++) {
				seen = false;
				for (m = 0; m < this.prevDevNames.length; m++) {
					if (this.prevDevNames[m] === names[k]) { seen = true; break; }
				}
				if (!seen) { this.banner($L("USB device connected") + ": " + names[k]); }
			}
		}
		this.prevDevNames = names;

		var st = r.storage || {};
		var present = !!st.present, mounted = !!st.mounted;
		this.mounted = mounted;

		if (!present) {
			this.$.storageStatus.setContent($L("None"));
			this.$.storageBtnLabel.setContent($L("Mount"));
			this.$.storageBtnRow.setDisabled(true);
			this.$.storageHelp.setContent($L("Plug in a USB flash drive, then tap Mount to browse it. Always unmount before unplugging."));
		} else {
			this.$.storageStatus.setContent(mounted ? $L("Mounted") : $L("Not mounted"));
			this.$.storageBtnLabel.setContent(mounted ? $L("Unmount") : $L("Mount"));
			this.$.storageBtnRow.setDisabled(false);
			if (mounted && st.mountpoint) {
				this.$.storageHelp.setContent($L("Mounted to ") + st.mountpoint + $L(" — always unmount before unplugging."));
			} else {
				this.$.storageHelp.setContent($L("Drive detected. Tap Mount to browse it."));
			}
		}

		// Reset USB is refused while a drive is mounted (the cycle would yank it).
		this.$.resetBtnRow.setDisabled(mounted);
		this.$.resetBtnLabel.setClassName(mounted ? "usb-reset-label disabled" : "usb-reset-label");
		this.$.resetHelp.setContent(mounted
			? $L("Unmount USB drives before resetting — a reset disconnects the drive too.")
			: $L("A last resort for a device that connects but won’t respond. This fully re-initializes the USB port and reconnects everything."));

		if (this.prevPresent !== null) {
			if (present && !this.prevPresent) { this.banner($L("USB drive detected")); }
			if (!present && this.prevPresent) { this.banner($L("USB drive removed")); }
			if (mounted && !this.prevMounted) {
				this.banner($L("USB drive mounted") + (st.mountpoint ? (" — " + st.mountpoint) : ""));
			}
			if (!mounted && this.prevMounted && present) { this.banner($L("USB drive unmounted")); }
		}
		this.prevPresent = present;
		this.prevMounted = mounted;

		this.updating = false;
		// keep the spinner running while a latched power change is still applying
		if (this.opInFlight && this.pendingPower === null) {
			this.opInFlight = false; this.$.titleSpinner.hide();
		}
		if (!this.havePrefs) {
			this.havePrefs = true;
			this.$.spinner.hide();
			this.$.loadingView.setShowing(false);
			this.$.prefView.setShowing(true);
		}
	},

	handleSvcFail: function(inSender, r) {
		this.$.warnGroup.setShowing(true);
		if (this.pendingPower !== null) {          // release a stuck latch
			this.pendingPower = null;
			this.$.powerToggle.setDisabled(false);
		}
		if (this.opInFlight) { this.opInFlight = false; this.$.titleSpinner.hide(); }
		if (!this.havePrefs) {
			this.havePrefs = true;
			this.$.spinner.hide();
			this.$.loadingView.setShowing(false);
			this.$.prefView.setShowing(true);
		}
	},

	// (No toggleOtg: the host-mode switch is a read-only indicator now. The
	// daemon arms the controller once and the port follows the cable itself.)

	showAbout: function() {
		// Read title/version straight from appinfo.json (enyo.fetchAppInfo) so
		// the dialog can never drift from what's actually installed.
		var info = (enyo.fetchAppInfo && enyo.fetchAppInfo()) || {};
		var title = info.title || $L("USB Settings");
		var version = info.version || "?";
		this.$.aboutDialog.open(title, "Version " + version + " - " + "Copyright 2026 webOS Archive");
	},

	togglePower: function(inSender) {
		if (this.updating || this.pendingPower !== null) { return; }
		// Latch the user's choice: disable the toggle in the chosen state until
		// the daemon confirms it applied (handleStatus re-enables it).
		this.pendingPower = inSender.getState() ? "on" : "off";
		this.pendingPowerAt = (new Date()).getTime();
		this.$.powerToggle.setDisabled(true);
		this.startOp();
		this.$.send.call({command: this.pendingPower === "on" ? "power-on" : "power-off"});
		window.setTimeout(enyo.bind(this, "refresh"), 800);
	},

	toggleStorage: function(inSender) {
		if (this.$.storageBtnRow.getDisabled()) { return; }
		var mount = (this.$.storageBtnLabel.getContent() === $L("Mount"));
		this.startOp();
		this.$.send.call({command: mount ? "mount" : "unmount"});
		window.setTimeout(enyo.bind(this, "refresh"), 1000);
	},

	resetUsb: function(inSender) {
		if (this.$.resetBtnRow.getDisabled() || this.mounted) { return; }
		this.startOp();
		this.$.send.call({command: "reset"});
		// the OTG cycle takes a few seconds; refresh after it settles
		window.setTimeout(enyo.bind(this, "refresh"), 5000);
	}
});
