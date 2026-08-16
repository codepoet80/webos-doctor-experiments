// @@@LICENSE
//
//      Copyright (c) 2026 webOS Archive
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// LICENSE@@@

/*
 * The USERNAME row of the profile editor, where the original had the security question.
 * Accounts are created with the username set to the member's email address;
 * this lets them pick a public handle instead, which the device then publishes
 * to other apps through getAccountToken.
 */
enyo.kind({
	name: "MyApps.PalmID.UsernameDialog",
	kind: "ModalDialog",
	caption: $L("Username"),
	showKeyboardWhenOpening: true,
	components: [
		{
			kind: "PalmService",
			name: "setUsername",
			service: "palm://com.palm.accountservices/",
			method: "updateUsername",
			onSuccess: "setSuccess",
			onFailure: "setFailure"
		},
		{
			className: "enyo-paragraph",
			content: $L("Choose a username. Other members see this instead of your email address. You can still sign in with either one.")
		},
		{
			kind: "RowGroup",
			caption: $L("USERNAME"),
			components: [
				{ kind: "Input", name: "username",
				  autoCapitalize: "lowercase", autocorrect: false, autocomplete: false, spellcheck: false,
				  onfocus: "setTextKeyboard"
				},
			],
		},
		{ name: "error", content: "", className: "enyo-paragraph enyo-text-error", showing: false},
		{kind:"HFlexBox", components:[
			{ kind: "Button", caption: $L("Cancel"), flex:1, onclick: "close" },
			{ kind: "Button", caption: $L("Update"), flex:1, onclick: "saveToServer" }
		]},
		{kind: "MyApps.PalmID.CommErrorDialog", name: "errorDialog"},
		{kind: "MyApps.PalmID.SpinnerOverlayPopup", name: "spinnerOverlay"},
	],

	// Mirrors device_username_error() in WebService/device.php. Kept in sync by
	// hand; the server is authoritative and rejects anything this lets through.
	USERNAME_PATTERN: /^[A-Za-z0-9][A-Za-z0-9._-]{2,31}$/,

	openThisDialog: function(username) {
		this.username = username || "";
		this.openAtCenter();
	},
	prepareOpen: function() {
		var r = this.inherited(arguments);
		this.$.username.setValue(this.username);
		this.$.error.setShowing(false);
		return r;
	},
	afterOpen: function() {
		var r = this.inherited(arguments);
		this.$.username.forceSelect();
		return r;
	},
	close: function() {
		var r = this.inherited(arguments);
		enyo.keyboard.hide();
		enyo.keyboard.setManualMode(false);
		return r;
	},

	setTextKeyboard: function() {
		enyo.keyboard.show(enyo.keyboard.typeText);
	},

	showError: function(message) {
		this.$.error.setContent(message);
		this.$.error.setShowing(true);
		this.$.username.forceFocus();
	},

	saveToServer: function() {
		var util = new PalmIdUtilities();
		var username = util.trim(this.$.username.getValue());

		this.$.error.setShowing(false);

		// An untouched field is the most likely "edit", so treat it as a cancel
		// rather than a round trip that reports success.
		if (username === this.username) {
			this.close();
			return;
		}
		if (username.length === 0) {
			this.showError($L("Please enter a username."));
			return;
		}
		if (!this.USERNAME_PATTERN.test(username)) {
			this.showError($L("Usernames are 3-32 characters: letters, numbers, and . _ - only, starting with a letter or number."));
			return;
		}

		this.newUsername = username;
		this.$.spinnerOverlay.openAtCenter();
		this.$.setUsername.call({username: username});
	},

	setSuccess: function(inSender, inResponse) {
		this.$.spinnerOverlay.close();
		// Show what the server actually stored, not what we asked for.
		var stored = (inResponse && inResponse.username) ? inResponse.username : this.newUsername;
		this.username = stored;
		this.owner.usernameChanged(stored);
		this.close();
	},

	setFailure: function(inSender, inResponse) {
		this.$.spinnerOverlay.close();
		// The three username rejections are the user's to fix, so they belong
		// inline next to the field rather than in the generic error popup.
		var inline = inResponse ? PALMIDUTILS_USERNAME_ERROR_CODES[inResponse.errorCode] : undefined;
		if (inline) {
			this.showError(inline);
		} else {
			this.$.errorDialog.openAtCenter(inResponse);
		}
	},

});
