[
	{kind: "VFlexBox", className: "landscape", style: "background-image: url({$landscapeBgImage});width:1024px;height:768px;", components: [
        {kind: 'enyo.FindApps.Magazine.BindableLayout',
         templatePath: "{$landscapeHeaderTemplate}", bindingPath: "{$headerTemplateBindings}"
        },

    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "shutter-app1", templatePath: "{$appTemplate}", bindingPath: "{$app1Bindings}"},
    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "shutter-app2", templatePath: "{$appTemplate}", bindingPath: "{$app2Bindings}"},
    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "shutter-app3", templatePath: "{$appTemplate}", bindingPath: "{$app3Bindings}"},
    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "shutter-app4", templatePath: "{$appTemplate}", bindingPath: "{$app4Bindings}"},
    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "shutter-app5", templatePath: "{$appTemplate}", bindingPath: "{$app5Bindings}"}
	]}
]
