enyo.kind({
	name: "InviteDashboardManager",
	kind: DashboardManager,
	create: function() {
		this.name = "invite";
		this.inherited(arguments);
		this.$.newMessagesFinder.dbKind = "com.palm.iminvitation:1";
	}
});