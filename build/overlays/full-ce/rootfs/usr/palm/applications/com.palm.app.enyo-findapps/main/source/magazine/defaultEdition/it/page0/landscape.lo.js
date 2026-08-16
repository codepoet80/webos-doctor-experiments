[
	{kind: "VFlexBox", style: "background:#2c2f36 url('{$landscapeBg}')  no-repeat scroll 0 0", className:"page0 landscape", pack: "start", components: [
		{kind: "HFlexBox", style: "padding:50px 30px 0px 30px", components: [
			{kind: "Image", src: "{$coverTitleImg}", className: "headline"}
		]},
		{kind: "HFlexBox", components: [
		
			{kind: "VFlexBox", className: "introParagraphs", style: "padding:40px 50px 0 30px; width:340px", components: [
			
				{kind: "HFlexBox", content: "{$introLine1}", className:"introLine1", style: "background:transparent url({$hpBag}) no-repeat scroll 0 0"},
				{kind: "HFlexBox", content: "{$introParagraph1}", className:"introParagraph1"}
		
			]},
			
			{kind: "VFlexBox", className: "ac-buttons", style: "padding: 40px 0", components: [
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
			]}
		]}	
	]}	
]
