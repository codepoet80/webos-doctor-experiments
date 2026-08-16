[
	{kind: "VFlexBox", className: "portrait", style: "background-image: url({$portraitBgImage});height:1024px;width:768px;", components: [
        {kind: 'enyo.FindApps.Magazine.BindableLayout',
         templatePath: "{$portraitHeaderTemplate}", bindingPath: "{$headerTemplateBindings}"
        },

    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "sphere2-app1", templatePath: "{$appTemplate}", bindingPath: "{$app1Bindings}"},
    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "sphere2-app2", templatePath: "{$appTemplate}", bindingPath: "{$app2Bindings}"},
    	{kind: "enyo.FindApps.Magazine.BindableLayout", className: "sphere2-app3", templatePath: "{$appTemplate}", bindingPath: "{$app3Bindings}"}
	]}
]
