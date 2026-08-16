[
	{kind: "VFlexBox", className: "portrait", style: "background-image: url({$portraitBgImage});height:1024px;width:768px;", components: [
        {kind: 'enyo.FindApps.Magazine.BindableLayout',
         templatePath: "{$portraitHeaderTemplate}", bindingPath: "{$headerTemplateBindings}"
        },

        {content: "", className: "toc-feature", target: "{$targetFeature1}", onclick: "goToTargetAction"},
        {content: "", className: "toc-feature1", target: "{$targetFeature1}", onclick: "goToTargetAction"},
        {content: "", className: "toc-shutter", target: "{$targetShutter}", onclick: "goToTargetAction"},
        {content: "", className: "toc-shutter1", target: "{$targetShutter}", onclick: "goToTargetAction"},
        {content: "", className: "toc-index", target: "{$targetIndex}", onclick: "goToTargetAction"},
        {content: "", className: "toc-index1", target: "{$targetIndex}", onclick: "goToTargetAction"},
        {content: "", className: "toc-teaser", target: "{$targetTeaser}", onclick: "goToTargetAction"},
        {content: "", className: "toc-teaser1", target: "{$targetTeaser}", onclick: "goToTargetAction"}
	]}
]
