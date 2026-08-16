[
	{kind: "VFlexBox", className: "portrait", style: "background-image: url({$portraitBgImage});height:1024px;width:768px;", components: [
        {kind: 'enyo.FindApps.Magazine.BindableLayout',
         templatePath: "{$portraitHeaderTemplate}", bindingPath: "{$headerTemplateBindings}"
        },

    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "index-app1", templatePath: "{$appTemplate}", bindingPath: "{$app1BindingsPortrait}"},
    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "index-app2", templatePath: "{$appTemplate}", bindingPath: "{$app2BindingsPortrait}"},
    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "index-app3", templatePath: "{$appTemplate}", bindingPath: "{$app3BindingsPortrait}"},
    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "index-app4", templatePath: "{$appTemplate}", bindingPath: "{$app4BindingsPortrait}"},
    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "index-app5", templatePath: "{$appTemplate}", bindingPath: "{$app5BindingsPortrait}"},
    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "index-app6", templatePath: "{$appTemplate}", bindingPath: "{$app6BindingsPortrait}"},
    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "index-app7", templatePath: "{$appTemplate}", bindingPath: "{$app7BindingsPortrait}"},
    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "index-app8", templatePath: "{$appTemplate}", bindingPath: "{$app8BindingsPortrait}"},
    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "index-app9", templatePath: "{$appTemplate}", bindingPath: "{$app9BindingsPortrait}"},
    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "index-app10", templatePath: "{$appTemplate}", bindingPath: "{$app10BindingsPortrait}"},

		{content: "", className: "index-new",
		 target: "searchlist", onclick: "goToTargetAction",
		 runtimeParams: {title: "{$newArrivalsLinkTitle}", qid: "{$newArrivalsLinkQid}", queryFragment: "{$newArrivalsLinkQueryFragment}"}
        },
		{content: "", className: "index-paid",
		 target: "searchlist", onclick: "goToTargetAction",
		 runtimeParams: {title: "{$topPaidLinkTitle}", qid: "{$topPaidLinkQid}", queryFragment: "{$topPaidLinkQueryFragment}"}
        },
		{content: "", className: "index-featured hidden",
			target: "searchlist", onclick: "goToTargetAction",
		 	runtimeParams: {title: "{$featuredLinkTitle}", qid: "{$featuredLinkQid}", queryFragment: "{$featuredLinkQueryFragment}"}
		},
		{content: "", className: "index-free",
			target: "searchlist", onclick: "goToTargetAction",
		 	runtimeParams: {title: "{$topFreeLinkTitle}", qid: "{$topFreeLinkQid}", queryFragment: "{$topFreeLinkQueryFragment}"}
		}
	]}
]
