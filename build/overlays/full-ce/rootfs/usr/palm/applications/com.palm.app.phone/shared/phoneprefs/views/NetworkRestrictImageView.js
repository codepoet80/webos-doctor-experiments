/*jslint white: false, onevar: false, nomen:false, plusplus: false */
/*global window, console, kit, SystemService, TelephonyService, _, ContactsUI, ContactsLib, Class, App, Mojo, $L, $H, $break, Event, Future, MojoDB, mapReduce, MainStageName, setTimeout, clearTimeout, Messaging, AudioTag, Image, PalmSystem, TransportPickerModel, Template, CharacterCounter, MessagingDB, MessagingUtils, MessagingMojoService, ChatFlags, BucketDateFormatter, CONSTANTS, MenuWrapper, SetTopicAssistant*/
/* Copyright 2010 Palm, Inc.  All rights reserved. */
enyo.kind({
	name: "NetworkRestrictImageView",
	kind: "VFlexBox",
	published: {
		errorImage: "",
		errorText: ""
	},
	components: [
		{kind: "HFlexBox", align: "center", components: [
			{name:"errorImage", kind: "Image"},
			{name:"errorText"}
		]}
	],
	create: function() {
		this.inherited(arguments);
		this.$.errorImage.setSrc(this.errorImage);
		this.$.errorText.setContent(this.errorText);
	}
});
