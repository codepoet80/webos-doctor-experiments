enyo.depends(
	"$enyo-lib/systemui/"
	
	// use the Heritage theme
	,"$enyo/palm/themes/Heritage/"
	
	// shared resources
	,"../shared/base.css"
	,"../shared/dialer/all"
	,"../shared/activecall/all"
	,"../shared/voicedialing/all"
	,"../source/DBModels.js"
	
	// temp framework patches
	,"../shared/patches.js" 
	
	// todo lazy load these
	,"../shared/phoneprefs/all"
	
	// main packages
	,"source/PhonePinCard.js"
	,"source/PinUnlock.js"
	,"source/PasswordUnlock.js"
	,"source/SecurityUpgradePrompt.js"
	,"source/SetPasswordDialog.js"
	,"source/styles.css"
);