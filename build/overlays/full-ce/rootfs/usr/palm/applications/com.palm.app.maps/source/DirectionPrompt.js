enyo.kind({
	name: "DirectionPrompt",
	kind: enyo.Popup,
	published: {
		value: ""
	},
	events: {
		onFromDirection: "",
		onToDirection: ""
	},
	className: "enyo-popup popup",
	scrim: true,
	components: [
		{kind: "Button", caption: $L("Direction From Here"), onclick: "doFromDirection"},
		{kind: "Button", caption: $L("Direction To Here"), onclick: "doToDirection"},
		{kind: "Button", caption: $L("Cancel"), onclick: "close"}
	]
});