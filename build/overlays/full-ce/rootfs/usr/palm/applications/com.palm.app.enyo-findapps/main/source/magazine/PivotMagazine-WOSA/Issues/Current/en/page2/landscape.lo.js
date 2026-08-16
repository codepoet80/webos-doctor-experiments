[
	{kind: "VFlexBox", className: "landscape", style: "background-image: url({$landscapeBgImage});width:1024px;height:768px;", components: [
        {kind: 'enyo.FindApps.Magazine.BindableLayout',
         templatePath: "{$landscapeHeaderTemplate}", bindingPath: "{$headerTemplateBindings}"
        },

        {content: "", className: "toc-hinge", target: "{$targetHinge}", onclick: "goToTargetAction"},
        {content: "", className: "toc-hinge1", target: "{$targetHinge}", onclick: "goToTargetAction"},
        {content: "", className: "toc-sphere", target: "{$targetSphere1}", onclick: "goToTargetAction"},
        {content: "", className: "toc-sphere1", target: "{$targetSphere1}", onclick: "goToTargetAction"},
        {content: "", className: "toc-sphere2", target: "{$targetSphere2}", onclick: "goToTargetAction"},
        {content: "", className: "toc-sphere3", target: "{$targetSphere3}", onclick: "goToTargetAction"},
        {content: "", className: "toc-sphere4", target: "{$targetSphere4}", onclick: "goToTargetAction"},
        {content: "", className: "toc-sphere5", target: "{$targetSphere5}", onclick: "goToTargetAction"},
        {content: "", className: "toc-sphere6", target: "{$targetSphere6}", onclick: "goToTargetAction"},
        {content: "", className: "toc-sphere7", target: "{$targetSphere7}", onclick: "goToTargetAction"},
        {content: "", className: "toc-sphere8 hidden", target: "{$targetSphere8}", onclick: "goToTargetAction"},

        {content: "", className: "toc-hub", target: "{$targetHub}", onclick: "goToTargetAction"},
        {content: "", className: "toc-hub1", target: "{$targetHub}", onclick: "goToTargetAction"},
        {content: "", className: "toc-orient", target: "{$targetOrient1}", onclick: "goToTargetAction"},
        {content: "", className: "toc-orient1", target: "{$targetOrient1}", onclick: "goToTargetAction"},
        {content: "", className: "toc-orient2", target: "{$targetOrient2}", onclick: "goToTargetAction"},
        {content: "", className: "toc-orient3", target: "{$targetOrient3}", onclick: "goToTargetAction"},
        {content: "", className: "toc-orient4", target: "{$targetOrient4}", onclick: "goToTargetAction"},
        {content: "", className: "toc-toc2", target: "{$targetTOC2}", onclick: "goToTargetAction"}
	]}
]
