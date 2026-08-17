enyo.kind({
	name: "DefaultView",
	kind: enyo.VFlexBox,
	className: "composeview",
	components: [
		{kind: "VFlexBox", flex: 1, components: [
			{kind: "Toolbar", className:"enyo-toolbar-light conversation-header", layoutKind: "HFlexLayout"},
			{className:"header-shadow"},
			{kind: "VFlexBox", className: "body-placeholder", flex: 1, pack: "center", align: "center", components: [
			    {kind:"Spacer", flex:1},
				{kind: "Image", src: "images/icon-165x165.png"},
				{kind:"Spacer"}
			]}
		]},
		{className:"footer-shadow footer-app-shadow"},
		{kind: "Toolbar", className:"enyo-toolbar-light conversation-bottom", layoutKind: "HFlexLayout", components: [
			{name: "slidingDrag", slidingHandler: true, kind: "GrabButton" }/*,
			{name: "richText", kind: "RichText", hint: $L("Enter message here..."), flex: 1, disabled: true}*/
		]}
	]
});