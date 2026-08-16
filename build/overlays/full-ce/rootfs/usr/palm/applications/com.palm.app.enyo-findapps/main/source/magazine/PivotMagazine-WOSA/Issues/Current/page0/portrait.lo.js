[
	{kind: "VFlexBox", style: "background:#2c2f36 url('{$portraitBg}') no-repeat scroll 0px -55px", className:"page0 portrait", pack: "start", components: [
		{kind: "HFlexBox", style: "padding:25px 50px 0 50px", components: [
			{kind: "Image", src: "{$coverTitleImg}", className: "headline"}
		]},
		{kind: "VFlexBox", style: "padding:0 50px 0 50px; height:200px;",components: [
			{kind: "HFlexBox", content: "{$introLine1}", className:"introLine1", style: "background:transparent url({$hpBag}) no-repeat scroll 0 0"},
			{kind: "HFlexBox",components: [
				{content: "{$introParagraph1}", flex:1, className:"introParagraph1"}
			]},
			
		]},
		
		{kind: "VFlexBox", className: "ac-buttons", style: "padding: 5px 33px", components: [
			{kind: "HFlexBox", components: [
				{kind: "VFlexBox", className: "acButton", style: "background-image: url({$button_1_background})", 
				 target: "searchlist", onclick: "goToTargetAction",
				 runtimeParams: {title: "{$button_1_searchTitle}", qid: "{$button_1_searchQid}", queryFragment: "{$button_1_searchQueryFragment}"},
				 components: [
					{content: "{$button_1_headline}", className: "acButtonHeadline"},
					{content: "{$button_1_description}", className: "acButtonDescription"}					
				]},
				{kind: "VFlexBox", className: "acButton", style: "background-image: url({$button_2_background})",  
				 target: "searchlist", onclick: "goToTargetAction",
				 runtimeParams: {title: "{$button_2_searchTitle}", qid: "{$button_2_searchQid}", queryFragment: "{$button_2_searchQueryFragment}"},
			
				 components: [
					{content: "{$button_2_headline}", className: "acButtonHeadline"},
					{content: "{$button_2_description}", className: "acButtonDescription"}					
				]}
			]},
			{kind: "HFlexBox", components: [
				{kind: "VFlexBox", className: "acButton", style: "background-image: url({$button_3_background})", 
				 target: "searchlist", onclick: "goToTargetAction",
				 runtimeParams: {title: "{$button_3_searchTitle}", qid: "{$button_3_searchQid}", queryFragment: "{$button_3_searchQueryFragment}"},
				 components: [
					{content: "{$button_3_headline}", className: "acButtonHeadline"},
					{content: "{$button_3_description}", className: "acButtonDescription"}					
				]},
				{kind: "VFlexBox", className: "acButton", style: "background-image: url({$button_4_background})", 
				 target: "searchlist", onclick: "goToTargetAction",
				 runtimeParams: {title: "{$button_4_searchTitle}", qid: "{$button_4_searchQid}", queryFragment: "{$button_4_searchQueryFragment}"},
				 components: [
					{content: "{$button_4_headline}", className: "acButtonHeadline"},
					{content: "{$button_4_description}", className: "acButtonDescription"}					
				]}
			]}
		]},
		
		
		{kind: "HFlexBox", style: "position:relative;	top: -12px; padding: 0 5px;", components: [
			{kind: "VFlexBox", style: "position:relative; top:10px", flex:1, components: [
				{kind: "VFlexBox", className:"largeTooltip", style: "background-image: url({$tooltipBG})" ,components:[
					
					{className: "body" ,content: "{$magazineTxt}"}
				]},
				{className: "carat", style:"background:transparent url('{$tooltipCarat}') no-repeat scroll bottom center"}
			]},
			{kind: "VFlexBox", flex:1, components:  [
				{kind: "VFlexBox", className:"largeTooltip", style: "background-image: url({$tooltipBG})" ,components:[
					
					{className: "body" ,content: "{$categoriesTxt}"}
				]},
				{className: "carat", style:"background:transparent url('{$tooltipCarat}') no-repeat scroll bottom center"}
			]},
			
			{kind: "VFlexBox", flex:1, style: "position:relative; top:10px", components: [
				{kind: "VFlexBox", className:"largeTooltip", style: "background-image: url({$tooltipBG})" ,components:[
					
					{className: "body" ,content: "{$savedTxt}"}
				]},
				{className: "carat", style:"background:transparent url('{$tooltipCarat}') no-repeat scroll bottom center"}
			]},
			{kind: "VFlexBox", flex:1, components: [
				{kind: "VFlexBox", className:"largeTooltip", style: "background-image: url({$tooltipBG})" ,components:[
				
					{className: "body" ,content: "{$searchTxt}"}
				]},
				{className: "carat", style:"background:transparent url('{$tooltipCarat}') no-repeat scroll bottom center"}
			]}
			
		]}
		
	]}
	
]
