enyo.depends(
	"$enyo/palm/list2/",
	"$enyo/g11n/phone/",

	"$enyo-lib/systemui/",
	"$enyo-lib/accounts/",
	"$enyo-lib/contactsui/",
	"$enyo-lib/addressing/",
	"$enyo-lib/networkalerts/",
	
	"data/accountService.js",
	"data/TelephonyService.js",
	"utilities/utils.js",
	
	"app/AppInit.js",
	"app/AddBuddyDialog.js",
	"app/ChatButton.js",
	"app/DefaultView.js",
//	"app/ImStatus.js",
	"app/MessagingApp.js",
	"app/Messaging.js",
	"app/PopupDialog.js",
	"app/ChatView.js",

	"app/buddies/BuddyConstants.js",
	"app/buddies/BuddyItem.js",
	"app/buddies/BuddyList.js",
	"app/buddies/BuddyService.js",
	"app/buddies/DeleteBuddyService.js",

	"app/compose/ComposeView.js",
	"app/compose/ConnectPhoneDialog.js",
	"app/compose/ImTransportList.js",

	"app/conversations/BlockPersonService.js",
	"app/conversations/ConversationItem.js",
	"app/conversations/ConversationList.js",
	"app/conversations/ConversationService.js",
	"app/conversations/InviteResponseService.js",
	"app/conversations/TransportSelector.js",
	"app/conversations/transportPicker.js",
	
	"app/dashboards/BannerThrottler.js",
	"app/dashboards/Class0AlertManager.js",
	"app/dashboards/DashboardManager.js",
	"app/dashboards/FailedMessageDashboardManager.js",
	"app/dashboards/InviteDashboardManager.js",
	"app/dashboards/InviteWatcher.js",
	"app/dashboards/MessageDashboardManager.js",
	"app/dashboards/MessageDashboardUtil.js",
	
	"app/firstlaunch/FirstLaunchConstants.js",
	"app/firstlaunch/ConnectPhone.js",
	"app/firstlaunch/FirstLaunch.js",
	"app/firstlaunch/FirstLaunchHandler.js",
	
	"app/favorites/FavoriteConstants.js",
	"app/favorites/FavoriteItem.js",
	"app/favorites/FavoriteList.js",
	"app/favorites/FavoriteService.js",
	
	"app/imstatus/AccountStatuses.js",
	"app/imstatus/AccountLoginState.js",
	"app/imstatus/AccountLoginStatesPopup.js",
	"app/imstatus/ImStatus.js",
	"app/imstatus/LoginStateServices.js",

	"app/preferences/PrefsHandler.js",
	"app/preferences/PreferencesView.js",

	"app/threads/DeleteThreadService.js",
	"app/threads/ThreadItem.js",
	"app/threads/ThreadList.js",
	"app/threads/ThreadService.js",

	"app/servers/ServersMockDb.js",
	"app/servers/ServerService.js",
	"app/servers/ServerItem.js",
	"app/servers/ChannelItem.js",
	"app/servers/ChannelList.js",
	"app/servers/ServerList.js",

	"utilities/UtilsFormatter.js",
	"utilities/BucketDateFormatter.js",
	"utilities/Notifier.js",
	"utilities/Launcher.js",
	
	"stylesheets/app.css",
	"stylesheets/conversation.css",
	"stylesheets/preferences.css"
);
