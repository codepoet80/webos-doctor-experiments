/*jslint white: false, onevar: false, nomen:false, plusplus: false */
/*global window, console, kit, SystemService, TelephonyService, _, ContactsUI, ContactsLib, Class, App, enyo, $L, $H, $break, Event, Future, MojoDB, mapReduce, MainStageName, setTimeout, clearTimeout, Messaging, AudioTag, Image, PalmSystem, TransportPickerModel, Template, CharacterCounter, MessagingDB, MessagingUtils, MessagingMojoService, ChatFlags, BucketDateFormatter, CONSTANTS, MenuWrapper, SetTopicAssistant*/
/* Copyright 2010 Palm, Inc.  All rights reserved. */
var Messages = {

	// blocked/unknown caller id
	blockedNumber: $L("Blocked number"),
	
	defaultErrorIndex: 0,
	// common service errors
	serviceErrors: {
		"-1": $L("TelephonyService not connected to radio."),
		0: " ",
		1: $L("Phone is off."),
		2: $L("Phone number must be 10 digits"),
		99: $L("Unknown method."),
		100: $L("Invalid parameter."),
		101: $L("General error."),
		102: $L("Network failure."),
		103: $L("Not supported by this network type."),
		104: $L("Authorization failed."),
		105: $L("SIM phonebook not ready."),
		106: $L("SIM has bad file."),
		107: $L("Command timed out."),
		108: $L("Fixed dialing-restricted."),
		109: $L("SIM card is full.  Can't add more entries."),
		110: $L("Entry is too long to fit on SIM card.")
	},
	
	fwdActivated: $L("(activated)"),
	fwdNotActivated: $L("(not activated)"),
	
	// call failure messages
	callFailErrorMessageDefault: $L("Call failed."),
	
	callFailErrorMessage: {
		0: $L("Call failed."),
		1: $L("Call failed: Phone is off."),
		2: $L("Call failed: Phone is locked."),
		3: $L("Call failed: No service."),
		4: $L("Call failed: Not on fixed dialing list."),
		5: $L("Call failed: Not an emergency call."),
		6: $L("Call failed: No free lines."),
		7: $L("Call failed: Phone is PIN locked."),
		8: $L("Call failed: Phone is PUK locked."),
		4242: $L("The network is unavailable.")
	},

	// call dropped messages (for abnormal disconnects)
	disconnectErrorMessageDefault: $L("Call dropped."),
	
	disconnectErrorMessageCdma: {
		0: $L("Call dropped."),
		//22: $L("Call faded: out of range."),
		22: $L("Call dropped: signal faded."),
		// TODO: remove before shipping
		6969: $L("Call dropped: baseband crashed.")
	},
	
	disconnectErrorMessageGsm: {
		0: $L("Call dropped."),
		4242: $L("Call dropped: out-of-range."),
		6969: $L("Baseband crashed.")
	},
	
	answerError: {
		0: $L("Answer failed."),
		2: $L("Answer failed: invalid call id")
	},
	
	conferenceError: {
		0: $L("Conference failed."),
		2: $L("Conference failed: need at least 2 calls.")
	},
	 
	extractError: {
		0: $L("Extract failed."),
		2: $L("Extract failed: no conference."),
		3: $L("Extract failed: no free lines.")
	},
	
	akeyError: {
		0: $L("Akey set failed."),
		2: $L("Akey and checksum are not correct.")
	},
	
	enablePinError: {
		0: $L("Unable to change PIN status."),
		2: $L("Unable to change PIN status: bad format."),
		3: $L("Unable to change PIN status: PUK locked."),
		4: $L("Unable to change PIN status: SIM locked.")
	},
	
	pinChangeError: {
		0: $L("Unable to change PIN."),
		2: $L("Unable to change PIN: PIN not correct."),
		3: $L("Unable to change PIN: PUK locked."),
		4: $L("Unable to change PIN: SIM locked."),	
		5: $L("Unable to change PIN: enable PIN first."),
		6: $L("Unable to change PIN: PINs don't match.")
	},
	
	pukUnlockError: {
		0: $L("Unable to unlock PUK."),
		2: $L("Unable to unlock PUK: bad or incorrect PUK."),
		3: $L("Unable to unlock PUK: new PIN not valid."),
		4: $L("Unable to unlock PUK: SIM locked."),	
		5: $L("Unable to unlock PUK: PINs don't match.")
	},
	
	unlockTelephonyError: {
		0: $L("Unable to unlock."),
		2: $L("Unable to unlock: bad format."),
		3: $L("Unable to unlock: PUK locked.")
	}, 
	
	fdnEnableError: {
		0: $L("Unable to change FDN status."),
		2: $L("Unable to change FDN status: bad or incorrect pin.")
	},

	pin2VerifyError: {
		0: $L("Unable to verify PIN2."),
		2: $L("Unable to verify PIN2: bad format."),
		3: $L("Unable to verify PIN2: PUK locked.")
	},


	// dashboard message titles
	serviceMessageTitle: $L("Network message"),
	basebandDebugMessageTitle: $L(" "),
	otaspMessageTitle: $L("Network update"),
	missedMessage: $L("Missed call"),
	voicemailTitle: $L("Voicemail"),
	missedCallLabel: $L("Missed call "),
	callEndedBanner: $L(" ended"),
	
	// active call labels
	waitDigitsLabel: $L("Dial "),
	voicemailContact: $L("Voicemail"),
	emergencyCallContact: $L("Emergency call"),
	
	// dialpad messages
	voicemailNumberNotFound: $L("Unable to find voicemail number."),
	messageDialogOk: $L("Ok"),
	dialOnPowerPending: $L("Connecting to network to dial..."),
	dialOnPowerFail: $L("Unable to complete call."),
	
	// mmi-related
	mmiPending: $L("Sending your request..."),
	mmiTimeout: $L("Request failed to complete before timeout."),
	noServiceError: $L("No service."),
	
	// cdma activation
	activationQuery: $L("Getting activation info..."),
	activationDoneLabel: $L("Done"),
	activationSuccess: $L("Success"),
	
	mslPrompt: $L("Enter MSL then tap Done."),
	mslDone: $L("Done"),
	mslEmptyError: $L("Error: MSL value is empty."),	
	cdmaProgrammingInProgress: $L("Programming..."),
	cdmaProgrammingUnknownError: $L("Unknown error."),
	
	akeySuccess: $L("Success"),
	prevSuccess: $L("Success"),
	
	voicePrivacyOn: $L("Voice privacy enabled."),
	voicePrivacyOff: $L("Voice privacy disabled."),
	
	// call formatting
	unknownNumber: $L("Unknown number"), // should NOT have a period at the end
	conferenceCall: $L("Conference call"),
	callStateDialing: $L("Dialing"),
	callStateEnding: $L("Ending"),
	callStateEnded: $L("Ended"),
	callStateHold: $L("Hold"),
	
	// emergency mode
	emergencyModeDialFailure: $L("Emergency call failed."),
	
	// call log
	logIncoming: $L("Incoming call"),
	logMissed: $L("Missed call"),
	logOutgoing: $L("Placed call"),
	
	// low-level errors:
	noTelephonyServiceError: $L("No telephony server"),
	noLunabusServiceError: $L("Failed to register for TelephonyService status."),
	generalServiceError: $L("Error occurred."),
	// TODO: probably dead.
	pin1RetryError: $L("Failure. Tries left : "),
	pin1GeneralError: $L("Failure. "),

	// audio route
	audioRouteNormal: $L("Normal"),
	audioRouteBluetooth: $L("Bluetooth"),
	audioRouteSpeaker: $L("Speaker"),
	audioRouteWiredHeadset: $L("Wired headset"),
};
