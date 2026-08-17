enyo.kind({
	name: "MessageDashboardManager",
	kind: DashboardManager,
	create: function() {
		this.name = "message";
		this.inherited(arguments);
	},
	shouldNotify: function(message) {
		return message._kind !== "com.palm.iminvitation:1" && this.inherited(arguments);
	}
});