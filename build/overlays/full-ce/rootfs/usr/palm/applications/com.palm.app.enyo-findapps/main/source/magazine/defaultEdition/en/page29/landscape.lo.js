[
	{kind: "VFlexBox", className: "landscape", style: "background-image: url({$landscapeBgImage});width:1024px;height:768px;", components: [
        {kind: 'enyo.FindApps.Magazine.BindableLayout',
         templatePath: "{$landscapeHeaderTemplate}", bindingPath: "{$headerTemplateBindings}"
        },

    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "index-app1", templatePath: "{$appTemplate}", bindingPath: "{$app1BindingsLandscape}"},
    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "index-app2", templatePath: "{$appTemplate}", bindingPath: "{$app2BindingsLandscape}"},
    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "index-app3", templatePath: "{$appTemplate}", bindingPath: "{$app3BindingsLandscape}"},
    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "index-app4", templatePath: "{$appTemplate}", bindingPath: "{$app4BindingsLandscape}"},
    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "index-app5", templatePath: "{$appTemplate}", bindingPath: "{$app5BindingsLandscape}"},
    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "index-app6", templatePath: "{$appTemplate}", bindingPath: "{$app6BindingsLandscape}"},
    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "index-app7", templatePath: "{$appTemplate}", bindingPath: "{$app7BindingsLandscape}"},
    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "index-app8", templatePath: "{$appTemplate}", bindingPath: "{$app8BindingsLandscape}"},
    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "index-app9", templatePath: "{$appTemplate}", bindingPath: "{$app9BindingsLandscape}"},

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
