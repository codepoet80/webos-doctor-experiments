[
	{kind: "VFlexBox", className: "landscape", style: "background-image: url({$landscapeBgImage});width:1024px;height:768px;", components: [
        {kind: 'enyo.FindApps.Magazine.BindableLayout',
         templatePath: "{$landscapeHeaderTemplate}", bindingPath: "{$headerTemplateBindings}"
        },

    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "calendar-app1", templatePath: "{$appTemplate}", bindingPath: "{$app1Bindings}"},
    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "calendar-app2", templatePath: "{$appTemplate}", bindingPath: "{$app2Bindings}"},
    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "calendar-app3", templatePath: "{$appTemplate}", bindingPath: "{$app3Bindings}"},
    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "calendar-app4", templatePath: "{$appTemplate}", bindingPath: "{$app4Bindings}"},
    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "calendar-app5", templatePath: "{$appTemplate}", bindingPath: "{$app5Bindings}"},
    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "calendar-app6", templatePath: "{$appTemplate}", bindingPath: "{$app6Bindings}"},
    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "calendar-app7", templatePath: "{$appTemplate}", bindingPath: "{$app7Bindings}"},
    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "calendar-app8", templatePath: "{$appTemplate}", bindingPath: "{$app8Bindings}"},
    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "calendar-app9 hidden", templatePath: "{$appTemplatePLACEHOLDER}", bindingPath: "{$appBindingsPLACEHOLDER}"}
	]}
]
