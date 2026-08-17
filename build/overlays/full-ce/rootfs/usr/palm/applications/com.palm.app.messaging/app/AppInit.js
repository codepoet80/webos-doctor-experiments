enyo.kind({
	name: "AppInit",
	kind: "enyo.Component",
	init: function() {
		// set up first launch handler
		enyo.application.firstLaunchHandler = new FirstLaunchHandler();
		// set up preferences handler
		enyo.application.prefsHandler = new PrefsHandler();
		
		// set up account list
		enyo.application.accountService = new accountService();
		enyo.application.accountService.getAccounts();
		
		// set up notification managers
		enyo.application.messageDashboardManager = new MessageDashboardManager();
		enyo.application.inviteDashboardManager = new InviteDashboardManager();
		// Notify + tap-to-resend for outgoing messages that couldn't be sent.
		enyo.application.failedMessageDashboardManager = new FailedMessageDashboardManager();
		enyo.application.class0AlertManager = new Class0AlertManager();
		
		// set up watchers
		//enyo.application.buddyWatcher = new BuddyWatcher();
		enyo.application.inviteWatcher = new InviteWatcher();
		
		enyo.application.telephonyWatcher = new TelephonyService();
	}
});
