// @@@LICENSE
//
//      Copyright (c) 2010-2013 LG Electronics, Inc.
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

﻿enyo.kind({
	name: "MyApps.PalmID",
	kind: enyo.Pane,
	published : {
		palmProfileAccount: {},
		initialize: function(parms) {
			this.backToViewCallback = enyo.bind(this, 
				function() {
					//parms.backToView();
					this.doAccountsModify_Done();
		    		this.selectView(this.$.dummy);
					this.render();
					this.$.initialize.destroy()
					this.$.fullProfile.destroy()
				});


			this.createComponents(
				[
					{name: "initialize", kind: "MyApps.PalmID.Initialize"},
					{name: "fullProfile", kind: "MyApps.PalmID.Profile"}
				]
			);
			this.render();
		    this.selectView(this.$.initialize);
			this.$.initialize.initialize({backToViewCallback: this.backToViewCallback, palmProfileAccount: parms.palmProfileAccount});			
			
			this.nameChangeCallback = function(){}; // not passed in anymore.
			this.palmProfileAccount = parms.palmProfileAccount;
		},	
	},
	events: {
		onAccountsModify_Done: "",
	},
	components: [
		{name: "dummy", kind: enyo.VFlexBox, content:" "}
	],

	// State that used to live on the intermediate "accounts" view. That view listed
	// the account so you could pick one, but there is only ever one webOS account,
	// so it was a list of one that existed only to be walked past. Removing it left
	// its two jobs — holding the fetched profile data, and driving the transition
	// into the profile — with no owner; the pane is the natural home, since it
	// already holds palmProfileAccount and backToViewCallback.
	deviceProfile: null,
	accountAggregate: null,

	// Called by Initialize once the aggregate arrives. Populates the profile view
	// and selects it BY NAME: next() would step relative to whatever is currently
	// selected, which is only correct once any in-flight transition has settled.
	loadAccount: function(accountAggregate) {
		this.accountAggregate = accountAggregate;

		var profile = this.$.fullProfile;
		profile.populateName(accountAggregate.accountInfo);
		profile.populateLoginInfo(accountAggregate);
		profile.populateDeviceList(accountAggregate.accountDevices);
		profile.populateAppList(this.palmProfileAccount.capabilityProviders);

		this.selectViewByName("fullProfile");
	}

});

console.log("palm.js");


