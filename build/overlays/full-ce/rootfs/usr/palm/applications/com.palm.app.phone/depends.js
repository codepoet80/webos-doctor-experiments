enyo.depends(
	// temp framework patches
	"shared/patches.js"
	
	// framework libraries
	,"$enyo/g11n/phone/"
	,"$enyo/g11n/name/"
	,"$enyo-lib/accounts/"
	
	// load globals referenced by index.html
	,"source/utils/all"
	,"source/LaunchActionHandler.js"
	,"source/uistates/all"
	,"phoneApp/source/PoorVoipConnectionPrompt.js"
	,"source/CallSynergizer.js"
	,"source/telephonydialhandler/all"
	,"source/CallSynergyContact.js"
	,"source/DBModels.js"
	,"source/CallLogLinker.js"
	,"source/VoicemailService.js"
	,"source/audioInterface.js"
	,"source/SystemStatus.js"
	,"source/puckInterface.js"
	,"source/proxInterface.js"
	,"source/OTASPInterface.js"
	,"source/TelephonyStatusInterface.js"
	,"source/BluetoothService.js"
	,"source/MultimodeInterface.js"
	,"source/wiredHeadsetInterface.js"
	,"source/WifiService.js"
	,"source/Messages.js"
	,"source/DialProxy.js"
);
