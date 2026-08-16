[
	{kind: "VFlexBox", className: "portrait", style: "background-image: url({$portraitBgImage});height:1024px;width:768px;", components: [
        {kind: 'enyo.FindApps.Magazine.BindableLayout',
         templatePath: "{$portraitHeaderTemplate}", bindingPath: "{$headerTemplateBindings}"
        },
        {content: '<a class="letter-email" href="mailto:{$email}"></a>'},
        {content: "{$version}", className: "version hidden"}
	]}
]
