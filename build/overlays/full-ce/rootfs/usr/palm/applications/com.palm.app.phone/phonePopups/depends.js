enyo.depends(
	// temp framework patches
	"../shared/patches.js"
	
	// device-specific theme
	,"theme"
	
	,"sources/MissedCall.js"
	
	//pre-dartfish styles
	,"missed.css"
	
	//dartfish style
	//,"../platforms/topaz/phonePopups/missed.css"
	
	
	,"sources/IncomingCallImpl.js"

	//pre-dartfish style
	,"sources/IncomingCall.js"

	//dartfish style
	//,"../platforms/topaz/phonePopups/sources/IncomingCall.js"

	//pre-dartfish style
	,"incoming.css"
	
	//dartfish-styles
	//,"../platforms/topaz/phonePopups/incoming.css"

	,"sources/DroppedCall.js"
	,"sources/DialFail.js"
	,"sources/DataRoaming.js"

	//telephony out of network notification
	,"sources/OutOfNetwork.js"
	,"sources/OutofPhonerange.js"
	,"sources/NetworkSwitch.js"
	
	//pre-dartfish styles
	,"popupStyle.css"

	//dartfish styles
	//,"../platforms/topaz/phonePopups/popupStyles.css"
	
	,"sources/AirplaneMode.js"	
	,"sources/ServiceMessage.js"	
	,"sources/NotloggedinSkype.js"
	,"sources/NoCreditSkype.js"
	,"sources/Launcher.js"

	,"sources/VideoRequest.js"	
);
