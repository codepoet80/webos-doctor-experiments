// A wrapper for media library's audio recorder that takes a filePath, maxDuration, and onDone callback.
// filePath will be deleted if user cancels recording, or if recording is interrupted (eg a phone call)
// onDone is called with true if the file is written. It's called when the user is done recording OR when
// the user explicitly cancels. It is NOT called when another event (eg phonecall) interrupts the recording.
// onDone should immediately transition to another state as the audio recorder scene will now be blank.
enyo.kind({
	name: "UIStates.AudioRecordingState",
	kind: UIStates.AbstractState,
	setup: function(filePath, maxDuration, onDone) {
			var ARLibrary;
			this.filePath = filePath;
			this.onDone = onDone;
			this.deleteFileOnCleanup = true; // indicates that the filePath needs to be cleaned up after a cancelled recording

			enyo.require( ! PalmSystem.isMinimal, "Should never be in audio recording in minimal state");
//			enyo.require( UI.previousState.name == UI.VOICEMAILGREETING, "audio recording can only be entered from 'voicemailgreeting' state");

			// this.stageController = Mojo.Controller.getAppController().getStageController("PhoneApp");	
			var ARLibrary = MojoLoader.require({ name: "metascene.audiorecorder", version: "1.0" })["metascene.audiorecorder"];
			if (ARLibrary)
			{
				// ARLibrary.Push(null /*this.stageController*/, ARLibrary.Record, {
				// 	filePath: filePath,
				// 	maxDuration: maxDuration
				// });
				ARLibrary.Push(this.controller.stageController, ARLibrary.Record, {
					filePath: filePath,
					maxDuration: maxDuration
				});
			}
			// if (this.stageController) {
			// 	// TODO: shim!
			// 	// push shim first to capture return from audio recorder
			// 	this.stageController.pushScene("audiorecordershim", function(returnValue) {
			// 		if ( returnValue && returnValue.filePath ) {
			// 			this.deleteFileOnCleanup = false;
			// 			this.onDone(true);
			// 		} else {
			// 			this.onDone();
			// 		}
			// 	}.bind(this));
			// 
			// 	if (ARLibrary) {
			// 		enyo.log("JKB>> Call ARLibrary.Push().");
			// 		ARLibrary.Push(this.stageController, ARLibrary.Record, {
			// 			filePath: filePath,
			// 			maxDuration: maxDuration
			// 		});
			// 	}
			// 	else {
			// 		enyo.log("JKB>> media library load failed.");
			// 	}
			// }
			// else {
			// 	enyo.log("JKB>> stageController is null.");
			// }
		// } catch (err) {
		// 	enyo.log("JKB>> error: " + err.toString());
		// }
	},
	cleanup: function() {
		if ( this.deleteFileOnCleanup ) {
			Utils.FileUtils.deleteFile(this.filePath);
		}
		// since we can currently only be launched from voicemailgreeting always pop all Contacts-managed scenes back to it
		this.stageController.popScenesTo("audiorecordershim");
		this.stageController.popScene();
	},
	event_back: function(commandEvent) {
		if ( this.stageController.topScene().sceneName == "record" ) {
			this.onDone();
			
			// make sure we don't double call
			this.onDone = function() {};
		}
	},
	event_emergency: function(isEnabled) {
		if ( isEnabled ) {
			UI.enter("emergency_card");
		} else {
			enyo.error("unexpected event_emergency event received in AudioRecordingState")
		}
	},
	event_closed: function() {
		UI.enter("voicemailgreeting", undefined, true);
	},
	event_dial: function(params) {
		UI.enter('dialpad_card', params);
	},
	event_activecall: function(params) {
		UI.enter("activecall_card", params);
	}
});

