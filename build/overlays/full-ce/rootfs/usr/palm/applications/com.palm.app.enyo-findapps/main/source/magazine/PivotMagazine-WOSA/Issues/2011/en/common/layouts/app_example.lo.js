[
	{kind: "VFlexBox", style: "font-size: 10px;",components: [
    	{kind: "Image", src: "{$image}", target: "appdetails", onclick: "goToTargetAction"
    	 , runtimeParams: {publicApplicationId: "{$_app_id}"}
		},
		{kind: "Stars", stars: "{$rating}"},
		{content: "{$reviewCount} reviews", className: "app-num-reviews-text"},
        {kind: "findApps.downloadsavebutton", style: "position: relative; left: -24px;", appItem: {
			appId: "{$_app_id}",
			price: "{$price}"
		}}
    ]}
]
