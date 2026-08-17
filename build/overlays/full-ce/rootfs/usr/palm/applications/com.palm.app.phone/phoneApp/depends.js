enyo.depends(
	// load rest of framework
	//"$enyo-lib/addressing/"
	//"$enyo-lib/networkalerts/"
	"$enyo-lib/contactsui/"
	//,"$enyo-lib/mediacapture/"	
	
	// device-specific theme
	,"theme"
	
	// temp framework patches
	,"../shared/patches.js"
	
	// shared resources
	,"../shared/base.css"
	,"../shared/dialer/all"
	,"../shared/activecall/all"
	,"../shared/voicedialing/all"
	,"../shared/addressing/all"
	
	,"../source/DBModels.js"
	,"../source/utils/all"
	
		// pre-dartfish
		,"../shared/phoneprefs/all"
		
		// dartfish
		//,"../platforms/topaz/shared/phoneprefs/all"
	
		// app source
		,"source/PhoneAppCard.js"
		
		//pre-dartfish first launch
		,"source/firstLaunch/all"
		
		// dartfish first launch
		//,"../platforms/topaz/phoneApp/source/firstLaunch/all"
		
		//pre-dartfish phone tabs menu
		,"source/PhoneTabsMenu.js"        
		
		//dartfish phone tabs menu
		//,"../platforms/topaz/phoneApp/source/PhoneTabsMenu.js"       
	 
	,"source/PhoneTabs.js"
	,"source/AppMenu.js"
	
	,"source/BacktoActiveCallControl.js"	
	,"source/ContactLookup.js"	
	//,"source/AllContactLookup.js"	
	
	//pre-dartfish phone tabs menu
	,"source/ContactLookupInput.css"
	
	//dartfish phone tabs menu
	//,"../platforms/topaz/phoneApp/source/ContactLookupInput.css"
	
	,"source/CallLog.js"

	//pre-dartfish call log entry
	,"source/CallLogEntry.js"    
	
	//dartfish call log entry
	//,"../platforms/topaz/phoneApp/source/source/CallLogEntry.js"

	,"source/CallLogView.js"
	,"source/Favorites.js"
	,"source/Voicemail.js"
	// ,"source/Voicemail_DL.js"
	// ,"source/VoicemailDrawerItem.js"
	,"source/SubItems.js"
	,"source/DBAssistant.js"
	,"source/PersonsCaches.js"
	,"source/SkypebuddyCache.js"
	
        //pre-dartfish drawerItem
       ,"source/FavoritesDrawerItem.css"
		
		//dartfish draweritem
  	//	,"../platforms/topaz/phoneApp/source/FavoritesDrawerItem.css"
		
	,"source/AudioPlayer.js"
	,"source/StreamingAudioPlayer.js"
	,"source/ActiveCallBanner.js"
	,"source/VoicemailGreeting.js"
	,"source/VoicemailGreetingRecorder.js"
	,"source/VoicemailGreetingPlayback.js"
	,"source/VoicemailError.js"
	,"source/ListDecorator.js"
	,"source/VoicemailPopupMenu.js"
	,"source/NoVoicemailNumberPrompt.js"
	,"source/PoorVoipConnectionPrompt.js"
	,"source/media.js"
	,"source/PreferredPhSvcDlg.js"
	,"source/OtaspFailurePrompt.js"

	// list components
	,"source/controls/DrawerItemOpenStateManager.js"
	,"source/controls/BaseList.js"
	,"source/controls/DrawerItem.js"
	,"source/controls/ImageToggleButton.js"
	,"source/controls/CustomDivider.js"
	,"source/controls/EmailSelectionPrompt.js"
	
	// "Favorites Add" (TODO: Remove once contacts.ui is available)
	,"source/FavoritesAdd.js"
	,"source/FavoritesAdd.css"
	
		// pre-dartfish styles
		,"source/styles.css"                 	
		,"source/styles-overrides.css"
		// dartfish tablet styles file
		//, "../platforms/topaz/phoneApp/source/styles-overrides.css"
		//, "../platforms/broadway/phoneApp/source/styles-overrides.css"
		//, "../platforms/mantaray/phoneApp/source/styles-overrides.css"
);

//dev only
//enyo.application.isTablet = true
