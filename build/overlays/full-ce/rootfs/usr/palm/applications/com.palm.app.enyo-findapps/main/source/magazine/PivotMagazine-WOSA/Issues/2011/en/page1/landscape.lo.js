[
	{kind: "VFlexBox", className: "landscape", style: "background-image: url({$landscapeBgImage});width:1024px;height:768px;", components: [
        {kind: 'enyo.FindApps.Magazine.BindableLayout',
         templatePath: "{$landscapeHeaderTemplate}", bindingPath: "{$headerTemplateBindings}"
        },
        {content: '<a class="letter-email" href="mailto:{$email}"></a>'},
        {content: "{$version}", className: "version hidden"}
	]}
]
