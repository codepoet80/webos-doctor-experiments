// "Delete Account Data" page. Lists the com.palm.imretaineddata:1 markers the IM transport writes when
// an account is removed with "keep this account's data on this device" ticked. Built to match the main
// accounts view: a Scroller > box-center > RowGroup (accounts-group) that sizes to its rows. Rows are
// created individually as SwipeableItems (real per-row components, so swipe/confirm maps to the right
// row): swipe to reveal Delete -> palm://com.palm.imlibpurple/purgeRetainedData wipes that account's kept
// data and drops the marker.
enyo.kind({
	name: "Accounts.RetainedDataView",
	kind: "VFlexBox",
	className: "enyo-bg",
	events: {
		onRetainedData_Done: ""
	},
	components: [
		{kind: "Toolbar", className: "enyo-toolbar-light accounts-header", pack: "center", components: [
			{kind: "Image", src: "images/acounts-48x48.png"},
			{kind: "Control", content: $L("Delete Account Data")}
		]},
		{kind: "Scroller", flex: 1, components: [
			{kind: "Control", className: "box-center", components: [
				{className: "accounts-body-text", style: "padding: 12px 16px 6px; line-height: 1.4; opacity: 0.8;",
				 content: $L("These accounts were removed but kept their messages, contacts and media on this device. Swipe an entry and tap Delete to erase its data.")},
				{name: "lblEmpty", showing: false, className: "accounts-body-text", style: "padding: 24px 16px; text-align: center; opacity: 0.7;",
				 content: $L("No removed accounts have data kept on this device.")},
				{name: "listGroup", kind: "RowGroup", className: "accounts-group", caption: $L("REMOVED ACCOUNTS"), showing: false, components: [
					{name: "rowWrap", className: "accounts-rowgroup-item"}
				]}
			]}
		]},
		{kind: "Toolbar", className: "enyo-toolbar-light", pack: "center", components: [
			{kind: "Button", caption: $L("Done"), className: "enyo-button-affirmative", style: "width: 300px;", onclick: "onDone"}
		]},
		{name: "findService", kind: "PalmService", service: "palm://com.palm.db/", method: "find",
		 onSuccess: "gotRecords", onFailure: "findFailed"},
		{name: "purgeService", kind: "PalmService", service: "palm://com.palm.imlibpurple/", method: "purgeRetainedData",
		 onSuccess: "purgeDone", onFailure: "purgeFailed"}
	],

	create: function() {
		this.inherited(arguments);
		this.records = [];
		this._rows = [];
		this._iconMap = {};
	},

	// Called by the owner (AccountManager) each time the view is shown. templates gives the service icons;
	// accounts is the list of currently-active accounts, so a re-added account is filtered out of the
	// delete list (its data is live again, not "removed").
	load: function(templates, accounts) {
		this._iconMap = {};
		if (templates) {
			for (var i = 0; i < templates.length; i++) {
				var t = templates[i];
				if (t && t.templateId && t.icon && (t.icon.loc_32x32 || t.icon.loc_48x48))
					this._iconMap[t.templateId] = t.icon.loc_32x32 || t.icon.loc_48x48;
			}
		}
		this._activeKeys = {};
		if (accounts) {
			for (var k = 0; k < accounts.length; k++) {
				var a = accounts[k];
				if (a && a.templateId)
					this._activeKeys[this.acctKey(a.templateId, a.username)] = true;
			}
		}
		this.records = [];
		this.rebuildRows();
		this.$.findService.call({query: {from: "com.palm.imretaineddata:1"}});
	},

	// Normalized key (templateId + username alphanumerics) so a retained marker matches its account
	// despite formatting differences (e.g. "+31..." vs "31...").
	acctKey: function(templateId, username) {
		return (templateId || "") + "|" + String(username || "").toLowerCase().replace(/[^a-z0-9]/g, "");
	},

	gotRecords: function(inSender, resp) {
		var all = (resp && resp.results) || [];
		var self = this;
		// Drop markers whose account has been re-added (matches a currently-active account).
		this.records = all.filter(function(r) { return !self._activeKeys[self.acctKey(r.templateId, r.username)]; });
		this.records.sort(function(a, b) { return (b.deletedAt || 0) - (a.deletedAt || 0); });
		this.rebuildRows();
	},
	findFailed: function(inSender, resp) {
		this.records = [];
		this.rebuildRows();
	},

	// Rebuild the SwipeableItem rows inside the RowGroup so the rounded group sizes to the item count.
	rebuildRows: function() {
		var j;
		for (j = 0; j < this._rows.length; j++)
			this._rows[j].destroy();
		this._rows = [];

		for (j = 0; j < this.records.length; j++) {
			var r = this.records[j];
			// Match the accounts list's per-row position classes (border/corner handling within the group).
			var pos = (this.records.length === 1) ? "enyo-single" : (j === 0 ? "enyo-first" : (j === this.records.length - 1 ? "enyo-last" : "enyo-middle"));
			var row = this.$.rowWrap.createComponent({
				kind: "SwipeableItem", layoutKind: "HFlexLayout", align: "center", tapHighlight: false,
				className: "accounts-list-item enyo-text-ellipsis " + pos, style: "min-height:0; margin-top:-8px; margin-bottom:-8px;", onConfirm: "onConfirmDelete",
				components: [
					{kind: "Image", className: "icon-image", src: this._iconMap[r.templateId] || "images/acounts-48x48.png"},
					{kind: "HFlexBox", align: "center", style: "width: 420px;", components: [
						{content: enyo.string.escapeHtml(r.alias || r.serviceName || r.accountId || $L("Account")), className: "enyo-text-ellipsis"},
						{content: enyo.string.escapeHtml(r.username || r.serviceName || ""), flex: 1, className: "email-address enyo-text-ellipsis"}
					]}
				]
			}, {owner: this});
			row.record = r;
			this._rows.push(row);
		}

		var has = this.records.length > 0;
		this.$.listGroup.setShowing(has);
		this.$.lblEmpty.setShowing(!has);
		this.$.listGroup.render();
	},

	// Swipe -> Delete confirmed for a row. Purge that account's kept data (and the marker) via the transport.
	onConfirmDelete: function(inSender, inIndex) {
		var r = inSender && inSender.record;
		if (!r)
			return;
		this._pendingRecord = r;
		this.$.purgeService.call({
			accountId: r.accountId,
			username: r.username,
			serviceName: r.serviceName
		});
	},
	purgeDone: function(inSender, resp) {
		if (this._pendingRecord) {
			var idx = this.records.indexOf(this._pendingRecord);
			if (idx >= 0)
				this.records.splice(idx, 1);
			this._pendingRecord = null;
		}
		this.rebuildRows();
	},
	purgeFailed: function(inSender, resp) {
		this._pendingRecord = null;
	},

	onDone: function() {
		this.doRetainedData_Done();
	}
});
