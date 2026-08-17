enyo.kind({
	name: "PhoneTabsMenu", 
	className: "phone-command-menu",
	kind: "RadioToolButtonGroup", 
	components: [
		{icon: "../images/menu-icon-Phone.png", label: $L("PHONE"), value: "dialpad_card"},
		//comment out for video discoveribility
		{icon: "../images/menu-icon-video.png",label: $L("VIDEO"), value: "contactlookup"},
		//{icon: "../images/menu-icon-contacts.png", label: $L("CONTACTS"), value: "contactlookup"}, // comment out for video discoveribility value: "allcontactlookup"},
		{icon: "../images/menu-icon-favorites.png", label: $L("FAVORITES"),value: "favorites"},
		{icon: "../images/menu-icon-call-log.png", label: $L("CALL LOG"), value: "calllog"},   
		//re-enable this for Dubonnet		
		{icon: "../images/menu-icon-voicemail.png", label: $L("VOICEMAIL"), value: "voicemail", className: "voicemail-icon", components: [
			{name: "voicemailCountWrapper",  className: "voicemail-count-wrapper", showing: false, components: [
				{name: "voicemailCount", className: "voicemail-count"},
				{kind: "Image", src: "../images/voicemail-play-icon.png", name: "unknownpositiveCountImg"},
			]}
		]}
	],
	disableTabs: function(disable) {
		try {
			var len = this.controls.length;
			for(i = 1; i <= len; i++){
				num = ( i === 1 ? "" : i );
				this.$["radioToolButton"+num].setDisabled(disable);
			}
		} catch(e) {
			enyo.error("Exception");
		}
	}
});
