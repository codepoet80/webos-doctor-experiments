enyo.kind({
	name: "IncomingCall",
	kind: "IncomingCallImpl",
	className: "incoming-call-small",
	components: [
		{name: "wrapper", kind: "HFlexBox", className: "incoming-call-wrapper", align: "center", components: [
			{kind: "CustomButton", name: "answer_button", className: "incoming-answer-button", onclick: "answerCall"},
		
			{layoutKind: "VFlexLayout", name: "lockScreenContent", flex: 2, components: [
				//todo: Set picture style as background instead of Image kind
				{name: "picContainer", layoutKind: "VFlexLayout", align: "center", components: [
					{name: "incomingCallPic", kind: "Image", align: "center", domStyles: {'border-radius': "4px", "height": "50px", "width": "50px"}/*, flex: 1*/},
				]},
			
				{kind: "CustomButton", align: "center", layoutKind: "VFlexLayout", className: "incoming-text-container", onclick: "openContact", /*flex: 1,*/ pack: "center", components: [
					{name: "displayName", className: "incoming-display-name truncating-text"},
					{name: "displayNumber", className: "incoming-display-number truncating-text"},
					{name: "numberType", className: "incoming-number-type truncating-text"}
				]},
			]},
		
			{kind: "CustomButton", name: "reject_button", className: "incoming-reject-button", onclick: "cancelCall"}
		]}
	]
});

 enyo.kind({
	name: "IncomingCall-bigImage",
	kind: "IncomingCallImpl",
	components: [
		{name: "picContainer", kind: "VFlexBox", align: "center", pack: "center", width: "100%", height: "195px", style: " overflow: hidden;border-radius:8px;", align: "center", components: [
				{name: "incomingCallPic", kind: "Image", domStyles: {"width": "320px"}/*, flex: 1*/},
		]},
		{name: "wrapper", kind: "HFlexBox", height: "80px;", style: "margin-top: 5px;",  className: "incoming-call-wrapper", components: [
			{kind: "CustomButton", name: "answer_button", className: "incoming-answer-button", onclick: "answerCall"},
			{layoutKind: "VFlexLayout", name: "lockScreenContent", flex: 2, components: [
				{kind: "CustomButton", align: "center", layoutKind: "VFlexLayout", className: "incoming-text-container", onclick: "openContact", /*flex: 1,*/ pack: "center", components: [
					{name: "displayName", className: "incoming-display-name truncating-text"},
					{name: "displayNumber", className: "incoming-display-number truncating-text"},
					{name: "numberType", className: "incoming-number-type truncating-text"}
				]},
			]},
			{kind: "CustomButton", name: "reject_button", className: "incoming-reject-button", onclick: "cancelCall"}
		]}
	]
});

