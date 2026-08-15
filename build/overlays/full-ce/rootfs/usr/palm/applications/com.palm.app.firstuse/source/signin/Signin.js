//Header labels
label_header1_signin = rb.$L("webOS Account");
label_header2_signin = rb.$L("A webOS Account connects this device to the community-run webOS App Museum.");
label_header3_signin = rb.$L("If you already have an App Museum account, you can sign in now.");

label_header1_createProfile = rb.$L("Create a webOS Account");

label_header1_deviceManagement = rb.$L("Name your device");
label_header2_deviceManagement = rb.$L("Create a unique name for your device. This will help you if you ever need to identify it in a list.");


//Field labels
label_field_name = rb.$L("First and Last Name");
label_field_email = rb.$L("Email");
label_field_confirmEmail = rb.$L("Confirm Email");
label_field_password = rb.$L("Password");
label_field_confirmPassword = rb.$L("Confirm Password");
label_field_verifyPassword = rb.$L("Verify Password");
label_field_securityQuestion = rb.$L("Security Question");
label_field_securityAnswer = rb.$L("Answer");
label_field_deviceName = rb.$L("Name Your Device:");



//Button labels
label_button_signIn = rb.$L("Sign In");
label_button_forgotLogin = rb.$L("Forgot Email or Password?");
label_button_newProfile = rb.$L("Create New Account");
label_button_create = rb.$L("Create");
label_button_cancel = rb.$L("Cancel");
label_button_whatIsPalmProfile = rb.$L("What's a webOS Account?");
label_button_done = rb.$L("Finish Setup");
label_button_next = rb.$L("Next");
label_button_close = rb.$L("Close");
label_button_help = rb.$L("Help");
label_button_forgotPassword = rb.$L("Forgot Password");
label_button_forgotAnswer = rb.$L("Forgot Answer");



//Popup labels
label_popup_header_existingProfile = rb.$L("Existing webOS Account");
label_popup_body_existingProfile = rb.$L("There is already an account associated with that email address. Please sign in now or choose a new email address");

label_popup_header_palmProfile = rb.$L("About webOS Account");
label_popup_body_palmProfile = rb.$L("A webOS Account is the free community account used by the webOS App Museum. It lets you:<ul><li>Sign in on this device and on the App Museum website</li><li>Use community services as they come online</li></ul></p>");

label_popup_header_forgotEmail = rb.$L("Forgot Email?");
label_popup_body1_forgotEmail = rb.$L("Visit webosarchive.org for assistance.");
//label_popup_body2_forgotEmail = rb.$L("Open Device Info");
//label_popup_body3_forgotEmail = rb.$L("Your email address is listed under webOS Account. Need more help finding your email address? Visit http://hpwebos.com/support.");

label_popup_header_forgotPassword = rb.$L("Forgot Password?");
label_popup_body1_forgotPassword = rb.$L("Please enter the email address you used to create your webOS Account.");

label_popup_header_recoverPassword = rb.$L("Recover Password");
label_popup_body1_recoverPassword = rb.$L("Answer your security question to recover your password.");
label_popup_body2_recoverPassword = rb.$L("Security Question:");

label_popup_header_recoverPwdSentEmailPopup = rb.$L("Recover Password");
label_popup_body1_recoverPwdSentEmailPopup = rb.$L("Follow the link in that email to reset your password.");
label_popup_body2_recoverPwdSentEmailPopup = rb.$L("If you're unable to reset your password, visit webosarchive.org for more help.");

label_popup_header_newPwdPopup = rb.$L("New Password");
label_popup_body1_newPwdPopup = rb.$L("Create a new password for your webOS account.");

label_popup_header_embargoedEmailPopup = rb.$L("Invalid Email Address");
label_popup_body1_embargoedEmailPopup = rb.$L("This email address cannot be used to set up a webOS Account.");

label_popup_header_embargoedEmailHelpPopup = rb.$L("Invalid Email Address");
label_popup_body1_embargoedEmailHelpPopup = rb.$L("You can visit webosarchive.org for additional information.");
label_popup_body2_embargoedEmailHelpPopup = rb.$L("You may return your device where you purchased it in accordance with the applicable return poilicy.");

//Error texts
label_error_invalidSignInEmailText = rb.$L("Please enter a valid email address.");
label_error_invalidSignInPassword = rb.$L("The password you entered is incorrect. Try again.");
label_error_noProfileFoundText = rb.$L("We couldn't find a webOS account associated with that email address.");
label_error_unableToSignInText = rb.$L("We were unable to sign you in. Please try again in a few minutes. If the problem continues, visit webosarchive.org for help.");
// webOS Archive: our backend answers a bad login the SAME way regardless of
// whether the email or the password was wrong (verifyDeviceLogin treats both
// identically, on purpose, so a failed attempt can't be used to probe which
// emails have accounts). HP's PAMS1100 ("your password is incorrect") assumed a
// backend that COULD tell the two apart -- ours can't, so reusing that string
// here would be a confident, specific-sounding claim we cannot actually back up.
label_error_invalidCredentials = rb.$L("Incorrect email or password. Please try again.");
label_error_unableToCreateAccountText = rb.$L("We are unable to create an account for you. Please try again in a few minutes. If the problem continues, visit webosarchive.org for help.");
label_error_unableToCreateAccountTextNetworkingIssue = rb.$L("We are unable to create a new account right now. Please try again in a few minutes. If the problem continues, visit webosarchive.org for help.");
label_error_noNameText = rb.$L("Please enter your name.");
label_error_nameLengthText = rb.$L("Name must be less than 50 characters.");
label_error_emailInvalidText = rb.$L("Please enter a valid email address.");
label_error_emailMismatchText = rb.$L("Email addresses do not match.");
label_error_passwordMismatchText = rb.$L("Passwords do not match.");
label_error_passwordLengthText = rb.$L("Password must be at least 8 characters.");
label_error_answerText = rb.$L("Please answer the security question.");
label_error_answerLength = rb.$L("Security answer must be less than 50 characters.");
label_error_nameDeviceLengthText = rb.$L("Device name is limited to 256 characters. Shorten name and try again.");
label_error_wrongAnswer = rb.$L("Answer is incorrect. Try again.");
label_error_emailLengthText = rb.$L("Email must be less than 100 characters.");


enyo.kind({
    name: "Signin",
    events: {
        onFinish: ""
    },
	kind: "HFlexBox",
	pack: 'justify',
	published: {
		acctToken: "",
		acctAlias: "",
		deviceId:"",
		nduId:"",
		questionId: "", 
		questionCaption: "",
		newToken: "",
		currentServiceCall: "",
		deviceNamed: true,
		isErrorDisplayed: false,
		wrongPasswordCount: 0,
		wrongAnswerCount: 0,
    },

    components: [
		{name: "pane", kind: "Pane", flex: 1, transitionKind: "enyo.transitions.Simple", components: [
					{name: "introView", kind:"Scroller", components: [
						{kind:"Control", layoutKind: "VFlexLayout", className: 'login', align: 'center', flex:1, components:[
							{kind: "Control", layoutKind: "VFlexLayout", align:'center', className:"contentDefaults", pack: 'justify', components: [
								{content: rb.$L("Let's get started"), className: "title"},
								{content: rb.$L("If you already have a webOS App Museum account, tap Sign In. Otherwise, create a new account."), className: "subtitle"},
								{kind: enyo.Control, className: "box", style: "margin: 0; padding: 10px 45px; -webkit-border-image: none ", components: [
										{kind: "Button", caption: rb.$L("Sign In"), flex:1, className: "enyo-button-light", onclick: "createSignInView"},
										{kind: "Button", caption: rb.$L("Create New Account"), flex:1, style:"margin-top: 20px", className: "enyo-button-light", onclick: "createAccountView"},
								]},
								{kind: "Control", className: "link-button", content: rb.$L("Why do I need an account?"), onclick: "openPalmProfilePopup"},
								// webOS Archive: account setup must stay optional under OOBE too — there is no
								// separate "skip" chrome there like a standalone launch gets from the card/window
								// system, so the intro card itself needs an explicit way out.
								{kind: "Control", className: "link-button skip-setup", content: rb.$L("Skip Account Setup"), onclick: "skipSetup"},
								{name: "unableToCreateAccountTextNetworkingIssue", style: "margin-top: 15px", content: label_error_unableToCreateAccountTextNetworkingIssue, className: "message", showing: false},
							]},
							{name: "serverError3", content: "Server error", className: "errorcode", showing: false, ondblclick:"errorCode3DoubleClk"}
	       				 ]},
					]},
					 
					{name: "signInView", kind:"Scroller", components: [
						{kind:"Control", layoutKind: "VFlexLayout", className: 'login', align: 'center', flex:1, components:[
							{kind: "Control", layoutKind: "VFlexLayout", align:'center', className:"contentDefaults2", pack: 'justify', components: [
								{content: rb.$L("Sign In"), className: "title"},
								{content: rb.$L("Sign in to your webOS Account to connect this device to the App Museum."), className: "subtitle"},
								{kind: "Control", className: "box", style:"margin-top: 15px", components: [
									{kind: "Control", className: "form-row", components: [
										{content: label_field_email, className: "label"},
										{name: "signInEmail",kind: "Input", inputType: "email",  onblur: "signInEmailOnBlur", oninput: "signInEmailOnInput", onkeydown: "signInEmailOnKeyPress", onchange:"signInEmailOnChange", changeOnKeypress: true, className: "field", hint: "", autoCapitalize: "lowercase", autocorrect: false, spellcheck: false},
										{name: "invalidSignInEmailLengthText", content: label_error_emailLengthText, className: "message", showing: false},
										{name: "invalidSignInEmailText", content: label_error_invalidSignInEmailText, className: "message", showing: false},
									]},
									{kind: "Control", className: "form-row", components: [
										{content: label_field_password, className: "label"},
										{name: "signInPassword", kind: "Input", inputType: "password", oninput: "signInPasswordOnInput", onkeydown: "signInPasswordOnKeyPress", onblur: "signInPasswordOnBlur", onchange: "signInPasswordOnChange", changeOnKeypress: false, className: "field", hint: "", disabled: false},
										{name: "signInPasswordLengthText", content: label_error_passwordLengthText, className: "message", showing: false},
									]},								
									{name: "invalidSignInPassword", content: label_error_invalidSignInPassword, className: "message", showing: false},
									{name: "noProfileFoundText", content: label_error_noProfileFoundText, className: "message", showing: false},
									{name: "unableToSignInText", content: label_error_unableToSignInText, className: "message", showing: false},
									{name: "invalidCredentials", content: label_error_invalidCredentials, className: "message", showing: false},
									{name: "unableToCreateAccountText", content: label_error_unableToCreateAccountText, className: "message", showing: false},
									{name: "signInButton", kind: "Button", className: "enyo-button-affirmative", caption: label_button_signIn, onclick: "signIn", disabled: true},
	 								{kind: "Button",  className: "enyo-button-light", caption: label_button_cancel, onclick: "goBack"}
								]},
								{kind: "Control", className: "link-button", content: label_button_forgotLogin, onclick: "forgotLogin"},
								{name: "serverError", content: "Server error", showing: false, className: "errorcode", ondblclick:"errorCodeDoubleClk"},
           					]}
           				]}
					]},
						
					{name: "createView", kind:"Scroller", components: [
						{kind:"Control", layoutKind: "VFlexLayout", className: 'login', align: 'center', flex:1, components:[
							{kind: "Control", layoutKind: "VFlexLayout", align:'center', className:"contentDefaults2", style:"550px", pack: 'justify', components: [
								{content: label_header1_createProfile, className: "title"},
								{content: rb.$L("Create a free webOS Account to connect this device to the App Museum community."), className: "subtitle"},
								{kind: "Control", className: "box", components: [
									{kind: "Control", className: "form-row", components: [
										{content: label_field_name, className: "label"},
										{name: "nameInput", kind: "Input", hint: "", className: "field", onblur: "nameOnBlur", oninput: "nameOnInput", onkeydown: "nameOnKeyPress", onchange: "nameOnChange", changeOnKeypress: false, focused: true, spellcheck: false, autocorrect: false, autoCapitalize: "title"},
										{name: "nameError", content: label_error_noNameText, className: "message", showing: false},
									]},
									{kind: "Control", className: "form-row", components: [
										{content: label_field_email, className: "label"},
										{name:"createEmail", kind: "Input", inputType: "email", hint: "", className: "field", onblur: "createEmailOnBlur", oninput: "createEmailOnInput", onkeydown: "createEmailOnKeyPress", onchange: "createEmailOnChange", changeOnKeypress: false, autoCapitalize: "lowercase", autocorrect: false, spellcheck: false},
										{name: "emailText", content: label_error_emailInvalidText, className: "message", showing: false},
										{name: "invalidEmailLengthText", content: label_error_emailLengthText, className: "message", showing: false},
									]},
									{kind: "Control", className: "form-row", components: [
										{content: label_field_confirmEmail, className: "label"},
										{name: "createEmailConfirm", kind: "Input", inputType: "email", hint: "", className: "field", onblur: "createEmailConfirmOnBlur", oninput: "createEmailConfirmOnInput", onkeydown: "createEmailConfirmOnKeyPress", onchange: "createEmailConfirmOnChange", changeOnKeypress: false, autoCapitalize: "lowercase", autocorrect: false, spellcheck: false},
										{name: "confirmEmailText", content: label_error_emailMismatchText, className: "message", showing: false},
									]},
									{kind: "Control", className: "form-row", components: [
										{content: label_field_password, className: "label"},
										{name: "createPassword", kind: "Input", inputType: "password", hint: "", className: "field", onkeydown: "createPasswordOnKeyPress", onblur:"createPasswordOnBlur",oninput: "createPasswordOnInput", onchange: "createPasswordOnChange", changeOnKeypress: false},
										{name: "passwordLengthText", content: label_error_passwordLengthText, className: "message", showing: false},
									]},
									{kind: "Control", className: "form-row", components: [
										{content: label_field_confirmPassword, className: "label"},
										{name: "createPasswordConfirm", kind: "Input", inputType: "password", hint: "", className: "field", oninput: "createPasswordConfirmOnInput", onkeydown: "createPasswordConfirmOnKeyPress", onblur:"createPasswordConfirmOnBlur", onchange: "createPasswordConfirmOnChange", changeOnKeypress: false,},
										{name: "passwordConfirmText", content: label_error_passwordMismatchText, className: "message", showing: false},
									]},
									// webOS Archive: security question dropped — the server never stored
									// it and recovery is handled by the Archive, not on-device. The
									// components stay (hidden) so the create payload keeps its shape.
									{kind: "Control", className: "form-row", showing: false, components: [
										{content: label_field_securityQuestion, className: "label"},
										{kind: "Group", components: [
										{name: "listSelector", kind: "ListSelector", className: "list-selector", style: "padding:5px 13px", value: "", /*onChange: "questionSelected",*/ items: [
											{"caption": "", "value": "", hideItem: true}
										]}]}
									]},
									{kind: "Control", className: "form-row", showing: false, components: [
										{content: label_field_securityAnswer, className: "label"},
										{name: "createAnswer", kind: "Input", hint: "", className: "field", onblur: "createAnswerOnBlur", onchange: "createAnswerOnChange", oninput: "createAnswerOnInput", onkeydown: "createAnswerOnKeyPress", changeOnKeypress: false, autoCapitalize: "lowercase", autocorrect: false, spellcheck: false},
										{name: "answerText", content: label_error_answerText, className: "message", showing: false},
									]},
	
									{name: "unableToSignInText2", content: label_error_unableToCreateAccountText, className: "message", showing: false},
	
									{name: "createButton", kind: "Button",  className: "enyo-button-affirmative", style:"margin-bottom:15px", caption: label_button_create, onclick: "createAccount"},
									{kind: "Button",  className: "enyo-button-light", caption: label_button_cancel, onclick: "goBack"}
									//{name: "defaultButton", kind: "Button",  className: "enyo-button-light", caption: label_button_whatIsPalmProfile, onclick: "openPalmProfilePopup"}
								]},
								{name: "serverError2", content: "Server error", className: "errorcode2", showing: false, ondblclick:"errorCode2DoubleClk"}
							]}
						]}
					]},
							

		]},
		{kind: "StartOver", showing: true},
		{name: "profileExistsPopup", kind: "ModalDialog", lazy: false, className: "popup",
		 caption: label_popup_header_existingProfile, 
		 components: [
			{content: label_popup_body_existingProfile, className: "enyo-text-body"}, 
			{kind: "Button", caption: label_button_signIn, className: 'enyo-button-dark', flex: 1, onclick: "profileExistsSignIn"},
			{kind: "Button", caption: label_button_close, flex: 1, onclick: "profileExistsClose"}
			]
		},
		
		{name: "palmProfilePopup", kind: "ModalDialog", lazy: false, className: "popup",
		 caption: label_popup_header_palmProfile, 
		 components: [
			{content: label_popup_body_palmProfile, className: "enyo-text-body"}, 
			{kind: "Button", caption: label_button_close, className: 'enyo-button-dark', flex: 1, onclick: "closePalmProfilePopup"}
			]
		},
		
		{name: "backupIssuesPopup", kind: "ModalDialog", lazy: false, className: "popup",
		 caption: rb.$L("Problem Locating Backups"), 
		 components: [
			{content: rb.$L("We cannot restore your backup data. If you continue, we will sign into your account and your applications (but not data) will be restored to this device."), className: "enyo-text-body"}, 
			{kind: "Button", caption: rb.$L("Continue"), className: 'enyo-button-dark', flex: 1, onclick: "continueBackupIssues"},
			{kind: "Button", caption: rb.$L("Cancel"), className: 'enyo-button-light', flex: 1, onclick: "cancelBackupIssues"}
			]
		},
		
		{name: "forgotEmailPopup", kind: "ModalDialog", lazy: false, className: "popup", width: (enyo.g11n.currentLocale().language != "en" ? "450px" : "320px"),
			events: {onFinish: ""}, 
		    caption: label_popup_header_forgotEmail, 
			components: [
				{content: label_popup_body1_forgotEmail, className: "enyo-text-body"}, 
				{kind: "Button", flex: 1, caption: label_button_forgotPassword, onclick: "forgotPassword", style:"margin-bottom:10px", className: 'enyo-button-dark'},
				{kind: "Button", flex: 1, caption: label_button_close, onclick: "closeForgotEmailPopup"}
				]
		},
		
		{name: "forgotPwdPopup", kind: "ModalDialog", lazy: false, className: "popup", events: {onFinish: ""},
		 caption: label_popup_header_forgotPassword, 
		 scrim: true,
		 components: [
			{content: label_popup_body1_forgotPassword, className: "enyo-text-body"},
			{kind: "Control", className: "form-row", components: [
			         {content: rb.$L("Email"), className: "label"},
			         {name: "forgotPwdPopupEmail", kind: "Input", inputType: "email", onfocus:"forgotPwdPopupEmailOnFocus", oninput: "forgotPwdPopupEmailOnInput", onkeydown: "forgotPwdPopupEmailOnKeyPress", changeOnKeypress: false, className: "field", autoCapitalize: "lowercase", autocorrect: false, spellcheck: false, hint: "", value: ""},
			]},
			
			{name: "invalidEmailText", content:label_error_emailInvalidText, className: "message", showing: false},
			{kind: "Control", layoutKind: "HFlexLayout", components: [
				{kind: "Button", caption: label_button_close, flex: 1, onclick: "closeForgotPwdPopup", style:"margin-right:10px"},
				{name: "forgotPwdNxtButton", kind: "Button", flex: 1, caption: label_button_next, className: 'enyo-button-dark', onclick: "forgotPwdPopupEmailOnValidateAndNext", disabled: true}
			]},
			
			{name: "popUpSpinnerForgotPassword", kind: "MyApps.FirstUse.SpinnerOverlayPopup"},

		 ]
		},
		
		{name: "recoverPwdPopup", kind: "ModalDialog", lazy: false, className: "popup",
			events: {onFinish: ""}, 
		    caption: label_popup_header_recoverPassword, 
			components: [
				{content: label_popup_body1_recoverPassword, className: "enyo-text-body"},
				{kind: "Control", className: "form-row", components: [
					{content: label_popup_body2_recoverPassword,  className: "label"},
					{name:"accountSecurityQuestionText", content: rb.$L("What is the name of your favorite animal?"), style:"font-size:18px;margin:3px 3px 0;"}, // this needs to be fixed
				
				]},
				{kind: "Control", className: "form-row", components: [
				     {content: label_field_securityAnswer, className: "label"},
				     {name: "answer", kind: "Input", onkeydown: "answerOnKeyPress", onblur: "answerOnBlur", onfocus: "answerOnFocus", onchange: "answerOnChange", oninput: "answerOnInput", onkeydown: "answerOnKeyPress", answerOnKeypress: false, className: "field", autoCapitalize: "lowercase", autocorrect: false, spellcheck: false, hint: "", value: ""},
				     {name: "wrongAnswer", content: "", className: "message", showing: false},
				 
				 ]},
				
				
				{name: "recoverPwdPopupNextButton", kind: "Button", flex: 1, caption: label_button_next, className: 'enyo-button-dark', style: "margin-bottom:10px", onclick: "newPassword", disabled: true},
				{kind: "Button", flex: 1, caption: label_button_forgotAnswer, onclick: "forgotAnswer"},

				{name: "popUpSpinnerRecoverPassword", kind: "MyApps.FirstUse.SpinnerOverlayPopup"},

			]
		},
		
		{name: "recoverPwdSentEmailPopup", kind: "ModalDialog", lazy: false, className: "popup",
			events: {onFinish: ""}, 
		    caption: label_popup_header_recoverPwdSentEmailPopup, 
			components: [
				{name: "sentEmailText", allowHtml: true, content: "",  className: "enyo-text-body"},
				{content: label_popup_body1_recoverPwdSentEmailPopup,  className: "enyo-text-body"},
				{content: label_popup_body2_recoverPwdSentEmailPopup, className: "enyo-text-body"},
				
				{kind: "Button", flex: 1, caption: label_button_close, onclick: "closeRecoverPwdSentEmailPopup"},
				]
		},
		
		{name: "newPwdPopup", kind: "ModalDialog", lazy: false, className: "popup",
		     caption: label_popup_header_newPwdPopup, 
			 components: [
					{content: label_popup_body1_newPwdPopup, className: "enyo-text-body"},
					
					{kind: enyo.VFlexBox, align: 'start', pack:'justify', className: "form-row", components: [
						{content: label_field_password, className: "label"},
						{name: "newPasswordInput", kind: "Input", inputType: "password", onblur: "newPasswordInputOnBlur", onfocus: "newPasswordInputOnFocus", onchange: "newPasswordInputOnChange", oninput: "newPasswordInputOnInput", onkeydown: "newPasswordInputOnKeyPress", changeOnKeypress: false, className: "field", hint: "", value: ""},
						{name: "pwdLengthText", content: label_error_passwordLengthText, className: "message", showing: false},
					]},	
					
					{kind: enyo.VFlexBox, align: 'start', pack:'justify', className: "form-row", components: [
						{content: label_field_verifyPassword, className: "label"},
						{name: "newConfirmPasswordInput", kind: "Input", inputType: "password", onkeydown: "newConfirmPasswordInputOnKeyPress", onblur: "newConfirmPasswordInputOnBlur", onfocus: "newConfirmPasswordInputOnFocus", onchange: "newConfirmPasswordInputOnChange", oninput: "newConfirmPasswordInputOnInput", changeOnKeypress: false, className: "field", hint: "", value: ""},
						{name: "confirmPwdDontMatchText", content: label_error_passwordMismatchText, className: "message", showing: false},
					]},
					{name: "signInWithPwdButton", kind: "Button", className: "enyo-button-dark", flex: 1, caption: label_button_signIn, onclick: "signInWithPassword", disabled: true},

					{name: "popUpSpinnerPwdPopUp", kind: "MyApps.FirstUse.SpinnerOverlayPopup"},

				]
		},
		
		{name: "embargoedEmailPopup", kind: "ModalDialog", lazy: false, className: "popup",
		    caption: label_popup_header_embargoedEmailPopup, 
			components: [
		             {content: label_popup_body1_embargoedEmailPopup, className: "enyo-text-body"}, 
		             {kind: "Button", caption: label_button_help, flex: 1, onclick: "embargoedEmailPopupHelp"},
		             {kind: "Button", caption: label_button_close, flex: 1, onclick: "embargoedEmailPopupClose"}
		    ]
		},
		
		{name: "embargoedEmailHelpPopup", kind: "ModalDialog", lazy: false, className: "popup",
		    caption: label_popup_header_embargoedEmailHelpPopup, 
			components: [
		             {content: label_popup_body1_embargoedEmailHelpPopup, className: "enyo-text-body"}, 
		             {content: label_popup_body2_embargoedEmailHelpPopup, className: "enyo-text-body"},
		             {kind: "Button", caption: label_button_close, flex: 1, onclick: "embargoedEmailHelpPopupClose"}
		    ]															   
		},
		{kind: "Scrim", layoutKind: "VFlexLayout", align: "center", pack: "center", 
			components: [
            	{kind: "SpinnerLarge", name: 'spinner', showing: false}
        	]
		},
		
		{kind: "AccountServicesService", onFailure: "handleGenericFailure", onSuccess: "handleGenericSuccess",
			components:[
				{name: "signIn", method: "authenticateAccount", onSuccess: "signInSuccess", onFailure: "signInFailure"},
				{name: "createAccount", method: "createNovaAccount", onSuccess: "createAccountSuccess", onFailure: "createAccountFailure"},
				{name: "getSecurityQuestions", method: "getAllSecurityQuestions", onSuccess: "getSecurityQuestionsSuccess", onFailure: "getSecurityQuestionsFailure"},
				{name: "getSecurityQuestionsSpinner", method: "getAllSecurityQuestions", onSuccess: "getSecurityQuestionsSuccess", onFailure: "getSecurityQuestionsFailureSpinner"},
				{name: "getToken", method: "getAccountToken", onResponse: "getTokenResponse"},
				{name: "assignDeviceName", method: "assignDeviceName", onSuccess: "assignDeviceNameSuccess", onFailure: "assignDeviceNameFailure"},
				{name: "getChallengeQuestion", method: "getAccountSecurityQuestion", onSuccess: "getChallengeQuestionSuccess", onFailure: "getChallengeQuestionFailure"},
				{name: "authFromChallengeQuestion", method: "authenticateAccountFromSecurityQuestion", onSuccess: "authFromChallengeQuestionSuccess", onFailure: "authFromChallengeQuestionFailure"},
				{name: "changePassword", method: "changePassword", onSuccess: "changePasswordSuccess", onFailure: "changePasswordFailure"},
				{name: "requestPasswordResetEmail", method: "requestPasswordResetEmail", onSuccess: "requestPasswordResetEmailSuccess", onFailure: "requestPasswordResetEmailFailure"},
				{name: "isEmailAvailable", method: "isEmailAvailable", onSuccess:"isEmailAvailableSuccess", onFailure:"isEmailAvailableFailure"},
				// webOS Archive: push this device's own name up to the account after
				// sign-in, so the account's device list shows something recognisable
				// instead of a hardware SKU. onResponse (not onSuccess/onFailure) — it is
				// best-effort and must not branch the sign-in flow either way.
				{name: "syncDeviceName", method: "syncDeviceName", onResponse: "syncDeviceNameResponse"}
			]	
		},
		
		{kind: "DeviceProfileService", onFailure: "handleGenericFailure", onSuccess: "handleGenericSuccess",
			components:[
				{name: "getDevice", method: "getDeviceProfile", onResponse: "getDeviceResponse"},
			]	
		},
	],
	
	
	create: function(){
    	this.inherited(arguments);
		this.initializeView(); 
    },
    
	/***********Start SignIn field validations ***********/
    signInEmailOnChange: function(){
    	if(this.$.signInEmail.getValue() != ""){
    		if (!this.verifyEmail(this.$.signInEmail.getValue())) {
				this.$.invalidSignInEmailText.setShowing(true);
				this.$.signInButton.setDisabled(true);
			} else {
				this.$.invalidSignInEmailText.setShowing(false);
				
				if(!this.verifyEmailLength(this.$.signInEmail.getValue())){
	    			this.$.invalidSignInEmailLengthText.setShowing(true);
	    			this.$.signInButton.setDisabled(true);
	    		}else{
	    			this.$.invalidSignInEmailLengthText.setShowing(false);
	    			if (this.$.signInPassword.getValue().length < 1){
						this.$.signInButton.setDisabled(true);
					} else {
						this.$.signInButton.setDisabled(false);
					}
	    		}
				
			}
		} else {
	    	this.$.signInButton.setDisabled(true);
		}
    },
	
	signInEmailOnInput: function(inSender, inResponse){
    	this.$.invalidSignInEmailText.setShowing(false);
    	this.$.invalidSignInEmailLengthText.setShowing(false);
		if (this.verifyEmail(this.$.signInEmail.getValue()) && this.verifyEmailLength(this.$.signInEmail.getValue()) ) {
			if (this.$.signInPassword.getValue().length < 1){
				this.$.signInButton.setDisabled(true);
			} else {
				this.$.signInButton.setDisabled(false);
			}
		} else {
			this.$.signInButton.setDisabled(true);
		}
	},

	signInEmailOnKeyPress: function(inSender, inResponse){
 		//console.log("************* key pressed:"+inResponse.keyCode+"  ***************");
    	var l = this.$.signInPassword.getValue().length;
     	if(inResponse.keyCode == 13) {
			this.signInEmailOnChange();
			if (this.verifyEmail(this.$.signInEmail.getValue()) && this.verifyEmailLength(this.$.signInEmail.getValue()) ) {
    			this.$.signInPassword.forceFocus();
    			this.$.signInPassword.forceSelect();
			}
		}
	},
    
	signInEmailOnBlur: function(){
	},
	
	signInPasswordOnChange: function(inSender, inResponse){
		this.$.signInPasswordLengthText.setShowing(false);
		var passEmpty = this.trim(this.$.signInPassword.getValue()).length == 0;
		if (passEmpty) {
			this.$.signInPassword.setValue("");
		};

		if(!passEmpty) {
			var l = this.$.signInPassword.getValue().length;
			if (l < 1) {
				this.$.signInPasswordLengthText.setShowing(true);
				this.$.signInButton.setDisabled(true);
			} else if (passEmpty) {
				this.$.signInButton.setDisabled(true);
			} else {
				this.$.signInPasswordLengthText.setShowing(false);
				if (this.verifyEmail(this.$.signInEmail.getValue()) && this.verifyEmailLength(this.$.signInEmail.getValue()) ) {
					if (this.$.signInPassword.getValue().length < 1 || passEmpty){
						this.$.signInButton.setDisabled(true);
					} else {
						this.$.signInButton.setDisabled(false);
					}
				} else {
					this.$.signInButton.setDisabled(true);
				}
			}
		} else {
			this.$.signInButton.setDisabled(true);
		}
	},
	
	signInPasswordOnInput: function(inSender, inResponse) {
		this.$.signInPasswordLengthText.setShowing(false);
		this.$.invalidSignInPassword.setShowing(false);
		var passEmpty = this.trim(this.$.signInPassword.getValue()).length == 0;
		
		if (this.verifyEmail(this.$.signInEmail.getValue()) && this.verifyEmailLength(this.$.signInEmail.getValue()) ) {
			if (this.$.signInPassword.getValue().length < 1 || passEmpty){
				this.$.signInButton.setDisabled(true);
			} else {
				this.$.signInButton.setDisabled(false);
			}
		} else {
			this.$.signInButton.setDisabled(true);
		}
	},

	signInPasswordOnKeyPress: function(inSender, inResponse){
		if (inResponse.keyCode == 13) {
			var passEmpty = this.trim(this.$.signInPassword.getValue()).length == 0;
			this.signInPasswordOnChange();
			if (this.verifyEmail(this.$.signInEmail.getValue()) && this.verifyEmailLength(this.$.signInEmail.getValue())) {
				this.$.signInButton.doClick();
			} else if (this.$.signInPassword.getValue().length < 1 || passEmpty) {
				this.$.signInPassword.forceFocus();
				this.$.signInPassword.forceSelect();
			} else {
				this.$.signInEmail.forceFocus();
				this.$.signInEmail.forceSelect();
			}
		} 

	},
	signInPasswordOnBlur: function(){
	},
	
	/***********Start Create account field validations ***********/
	nameOnChange: function(inSender, inResponse){
		var length = this.trim(this.$.nameInput.getValue()).length;
		/*if(length < 1){
			this.$.nameError.setContent(label_error_noNameText);
			//this.$.nameInput.forceFocus();
			this.isErrorDisplayed = true;
			this.$.nameError.setShowing(true);
			this.toggleCreateButton(false);
		}
		else if (length > 50){
			this.$.nameError.setContent(label_error_nameLengthText);
			//this.$.nameInput.forceFocus();
			this.isErrorDisplayed = true;
			this.$.nameError.setShowing(true);
			this.toggleCreateButton(false);
		}*/
		
		if (this.validateInputFields()){
			this.clearAllMessages();
			this.toggleCreateButton(true);
		}
	},
	
	nameOnInput: function() {
    	this.$.nameError.setShowing(false);
    	this.isErrorDisplayed = false;
		if (this.validateInputFields()){
			this.clearAllMessages();
			this.toggleCreateButton(true);
		} else {
			this.toggleCreateButton(false);
		}
	},

	nameOnKeyPress: function(inSender, inResponse){
		if(inResponse.keyCode == 13){
			this.$.createEmail.forceFocus();
			this.$.createEmail.forceSelect();
		}
	},
	nameOnBlur: function(){
	},
	
	validateCreateAndConfirmEmail: function(){
		var email1 = this.trim(this.$.createEmail.getValue());
		var email2 = this.trim(this.$.createEmailConfirm.getValue());
		var status = false; 
		if(this.verifyEmail(email1) && this.verifyEmailLength(email1) ){
			if(email2.length>0){
				if(this.verifyEmail(email2) && this.verifyEmailLength(email2)){
					status = true;
				}else
					status= false;
			}else
				status=true;
		}
		return status; 
	},
	
	validateEmail: function(email){
		var email1 = this.trim(email);
		var status = false; 
		if(this.verifyEmail(email1) && this.verifyEmailLength(email1) ){
			status=true;
		}
		return status; 
	},
	
	createEmailOnChange: function(inSender, inResponse){
		console.log("createEmailOnChange: "  + this.$.createEmail.getValue());

		this.$.createEmail.setValue(this.trim(this.$.createEmail.getValue()).toLowerCase());
		if (this.validateEmail(this.$.createEmail.getValue())){
			this.$.emailText.setShowing(false);
			this.isErrorDisplayed = false;
			this.$.isEmailAvailable.call({"email": this.$.createEmail.getValue()});
		} else {
			this.isErrorDisplayed = true;
			if (!this.verifyEmail(this.trim(this.$.createEmail.getValue()))) {
				this.$.emailText.setContent(label_error_emailInvalidText);
			} else {
				this.$.emailText.setContent(label_error_emailLengthText);
			}
			this.$.emailText.setShowing(true); 
			this.toggleCreateButton(false);
		}
		
		if(this.$.createEmailConfirm.getValue().length>0){
			var email1 = this.trim(this.$.createEmail.getValue()).toLowerCase();
			var email2 = this.trim(this.$.createEmailConfirm.getValue()).toLowerCase();
			if(email1 != email2){
				if(!this.isErrorDisplayed){
					this.$.confirmEmailText.setContent(label_error_emailMismatchText);
					this.$.confirmEmailText.setShowing(true);
					this.toggleCreateButton(false);
					this.isErrorDisplayed= true; 
				}
			}else{
				this.$.confirmEmailText.setShowing(false);
				this.toggleCreateButton(false);
				this.isErrorDisplayed= false; 
			}
		}
		
		if (this.validateInputFields()){
			this.clearAllMessages();
			this.toggleCreateButton(true);
		}
	},
	
	createEmailOnInput: function() {
		this.$.emailText.setShowing(false);
		this.isErrorDisplayed = false;
		if (this.validateInputFields()){
			this.clearAllMessages();
			this.toggleCreateButton(true);
		} else {
			this.toggleCreateButton(false);
		}
	},
	
	createEmailOnKeyPress: function(inSender, inResponse) {
		if(inResponse.keyCode == 13){
			this.createEmailOnChange()
			if (this.validateEmail(this.$.createEmail.getValue())) {
				this.$.createEmailConfirm.forceFocus();
				this.$.createEmailConfirm.forceSelect();
			}
		}
	},
	
	createEmailOnBlur: function(){
	},
	
	createEmailConfirmOnChange: function(inSender, inResponse){
		var email1 = this.trim(this.$.createEmail.getValue());
		this.$.createEmailConfirm.setValue(this.trim(this.$.createEmailConfirm.getValue()).toLowerCase());
		var email2 = this.$.createEmailConfirm.getValue();
		console.info(email1 + " " + email2);
		if(!this.verifyEmail(email2)){
			this.isErrorDisplayed = true;
			this.$.confirmEmailText.setContent(label_error_emailInvalidText);
			this.$.confirmEmailText.setShowing(true);
			this.toggleCreateButton(false);
		} else if(email2 != email1){
			this.$.confirmEmailText.setContent(label_error_emailMismatchText);
			this.isErrorDisplayed = true;
			this.$.confirmEmailText.setShowing(true);
			this.toggleCreateButton(false);
		}else if(!this.verifyEmailLength(email1) || !this.verifyEmailLength(email2)){ 
			this.isErrorDisplayed = true;
			this.$.confirmEmailText.setContent(label_error_emailLengthText);
			this.$.confirmEmailText.setShowing(true);
			this.toggleCreateButton(false);
		
		}else {
			this.$.confirmEmailText.setShowing(false);
			this.isErrorDisplayed = false;
		}
		
		if (this.validateInputFields()){
			this.clearAllMessages();
			this.toggleCreateButton(true);
		}
	},
	
	createEmailConfirmOnInput: function() {
		this.$.confirmEmailText.setShowing(false);
		this.isErrorDisplayed = false;
		
		if (this.validateInputFields()) {
			this.clearAllMessages();
			this.toggleCreateButton(true);
		} else {
			this.toggleCreateButton(false);
		}
	},
	
	createEmailConfirmOnKeyPress: function(inSender, inResponse) {
		if(inResponse.keyCode == 13){
			this.createEmailConfirmOnChange();
			if (this.validateEmail(this.$.createEmailConfirm.getValue())){
				this.$.createPassword.forceFocus();
				this.$.createPassword.forceSelect();
			}
		}
	},

	createEmailConfirmOnBlur: function(){
	},
	
	createPasswordOnChange: function(inSender, inResponse){
		var l = this.$.createPassword.getValue().length;
		var cl = this.$.createPasswordConfirm.getValue().length;

		var passEmpty = this.trim(this.$.createPassword.getValue()).length == 0;
		if (passEmpty) {
			this.$.createPassword.setValue("");
			this.toggleCreateButton(false);
		} else if(l < 8) {
			this.isErrorDisplayed = true;
			this.$.passwordLengthText.setShowing(true);
			this.toggleCreateButton(false);
		/* This really happens only if the passwords do not match which is why this is commented out.
		} else if(cl > 0 && (cl < 6 || cl > 20)) {
			this.isErrorDisplayed = true;
			this.$.passwordLengthText.setShowing(true);
			this.toggleCreateButton(false);
		*/
		} else if(cl > 0 && this.$.createPassword.getValue() != this.$.createPasswordConfirm.getValue()){
			this.isErrorDisplayed = true;
			this.$.passwordConfirmText.setContent(label_error_passwordMismatchText);
			this.$.passwordConfirmText.setShowing(true);
			this.toggleCreateButton(false);			
		} else {
			this.$.passwordLengthText.setShowing(false);
			this.isErrorDisplayed = false;
		}
		
		if (this.validateInputFields()){
			this.clearAllMessages();
			this.toggleCreateButton(true);
		}
	},
	
	createPasswordOnInput: function(){
		this.$.passwordConfirmText.setShowing(false);
		this.$.passwordLengthText.setShowing(false);
		this.isErrorDisplayed = false;

		if (this.validateInputFields()) {
			this.clearAllMessages();
			this.toggleCreateButton(true);
		} else {
			this.toggleCreateButton(false);
		}

	},
	
	createPasswordOnKeyPress: function(inSender, inResponse){
		if(inResponse.keyCode == 13){
			if (this.$.createPassword.getValue().length > 0) {
				this.$.createPasswordConfirm.forceFocus();
				this.$.createPasswordConfirm.forceSelect();
			}
		}
	},
	
	createPasswordOnBlur: function(inSender, inResponse){
	},
	
	createPasswordConfirmOnChange: function(inSender, inResponse){
		var pl = this.$.createPassword.getValue().length;
		var l = this.$.createPasswordConfirm.getValue().length;
		var passEmpty = this.trim(this.$.createPasswordConfirm.getValue()).length == 0;
		
		if (passEmpty) {
			this.$.createPasswordConfirm.setValue("");
			this.toggleCreateButton(false);
		} else if(this.$.createPassword.getValue() != this.$.createPasswordConfirm.getValue()){
			this.isErrorDisplayed = true;
			this.$.passwordConfirmText.setContent(label_error_passwordMismatchText);
			this.$.passwordConfirmText.setShowing(true);
			this.toggleCreateButton(false);			
		} else if(l < 8 || (pl > 0 && pl < 8)) {
			this.isErrorDisplayed = true;
			this.$.passwordConfirmText.setContent(label_error_passwordLengthText);
			this.$.passwordConfirmText.setShowing(true);
			this.toggleCreateButton(false);
		} else {
			this.$.passwordConfirmText.setShowing(false);
			this.isErrorDisplayed = false;
		}
		
		if (this.validateInputFields()){
			this.clearAllMessages();
			this.toggleCreateButton(true);
		}
	},
	
	createPasswordConfirmOnInput: function(inSender, inResponse){
		this.$.passwordConfirmText.setShowing(false);
		this.$.passwordLengthText.setShowing(false);
		this.isErrorDisplayed = false;

		if (this.validateInputFields()) {
			this.clearAllMessages();
			this.toggleCreateButton(true);
		} else {
			this.toggleCreateButton(false);
		}

	},
		
	createPasswordConfirmOnKeyPress: function(inSender, inResponse){
		if(inResponse.keyCode == 13){
			var l = this.$.createPasswordConfirm.getValue().length;
			if (l > 0) {
				this.$.createAnswer.forceFocus();
				this.$.createAnswer.forceSelect();
			}
		}
	},
	createPasswordConfirmOnBlur: function(){
	},
	
	createAnswerOnChange: function(inSender, inResponse){
		var length = this.trim(this.$.createAnswer.getValue()).length;
		if(length < 1){
			this.$.answerText.setContent(label_error_answerText);
			//this.$.createAnswer.forceFocus();
			this.isErrorDisplayed = true;
			this.$.answerText.setShowing(true);
			this.toggleCreateButton(false);
		}
		else if (length > 50){
			this.$.answerText.setContent(label_error_answerLength);
			//this.$.createAnswer.forceFocus();
			this.isErrorDisplayed = true;
			this.$.answerText.setShowing(true);
			this.toggleCreateButton(false);
		}
		
		if (this.validateInputFields()){
			this.clearAllMessages();
			this.toggleCreateButton(true);
		}
	},
	
	createAnswerOnInput: function(inSender, inResponse){
		this.isErrorDisplayed = false;
		this.$.answerText.setShowing(false);

		if (this.validateInputFields()) {
			this.clearAllMessages();
			this.toggleCreateButton(true);
		} else {
			this.toggleCreateButton(false);
		}
		
	},
		
	createAnswerOnKeyPress: function(inSender, inResponse){
		if(inResponse.keyCode == 13){
			this.createAnswerOnChange();
			if(this.validateInputFields()){
				this.toggleCreateButton(true);
				this.createAccount();
			}
		}

	},
	createAnswerOnBlur: function(){
	},
	
	validateInputFields: function(){
		if(this.trim(this.$.nameInput.getValue()).length < 1 || this.trim(this.$.nameInput.getValue()).length > 50)
			return false;
		if(!this.verifyEmails(this.$.createEmail.getValue(), this.$.createEmailConfirm.getValue()))
			return false;
		if(!this.verifyPasswords(this.$.createPassword.getValue(), this.$.createPasswordConfirm.getValue()))
			return false;
		// webOS Archive: security answer no longer collected — not validated.
		if(!this.verifyEmailLength(this.$.createEmail.getValue()) || !this.verifyEmailLength(this.$.createEmailConfirm.getValue()) )
			return false;
		console.info("All input fields valid");
		return true;	
	},
	
	toggleCreateButton: function(value){
		console.info("Set createButton disabled: " + !value);
		this.$.createButton.setDisabled(!value);
	},
	
	isEmailAvailableSuccess: function(inSender, inResponse){
		
		if(!(inResponse.isEmailAvailable === undefined)){
			if(inResponse.isEmailAvailable){
				if (this.validateInputFields()) {
					this.toggleCreateButton(true);
				}
			}else if(!inResponse.isEmailAvailable){
				this.$.profileExistsPopup.openAtCenter();
			}
		}else if(!(inResponse.errorCode.length === undefined)){
			console.info("Is Email available failure: " + JSON.stringify(inResponse));
			this.$.serverError2.setContent(inResponse.errorText);
			this.serverError2ErrorText = null;
			this.$.serverError2.setShowing(false); //(RS: should we show this????)
		}
		
	},
	
	isEmailAvailableFailure: function(inSender, inResponse){
		console.info("Is Email available failure: " + JSON.stringify(inResponse));
		this.serverError2ErrorText = inResponse.errorText;
		this.$.serverError2.setContent(inResponse.errorCode);
		this.$.serverError2.setShowing(true);
		//this.$.profileExistsPopup.openAtCenter();
	},

	/***********End Create account validations *********/
	clearAllInputFields: function(){
		this.$.nameInput.setValue("");
		this.$.createEmail.setValue("");
		this.$.createEmailConfirm.setValue("");
		this.$.createPassword.setValue("");
		this.$.createPasswordConfirm.setValue("");
		this.$.listSelector.setValue("");
		this.$.createAnswer.setValue("");
		this.toggleCreateButton(false);
	},
	
	clearAllMessages: function(){
		this.$.nameError.setShowing(false);
		this.$.emailText.setShowing(false);
		this.$.invalidEmailLengthText.setShowing(false);
		this.$.confirmEmailText.setShowing(false);
		this.$.passwordConfirmText.setShowing(false);
		this.$.passwordLengthText.setShowing(false);
		this.$.answerText.setShowing(false);
	},
	
	clearAllSignInErrorMessages: function(){
		this.$.noProfileFoundText.setShowing(false);
		this.$.invalidSignInEmailText.setShowing(false);
		this.$.invalidSignInPassword.setShowing(false);
		this.$.unableToSignInText.setShowing(false);
		this.$.invalidCredentials.setShowing(false);
		this.$.unableToSignInText2.setShowing(false);
		this.$.unableToCreateAccountText.setShowing(false);
		this.$.unableToCreateAccountTextNetworkingIssue.setShowing(false);
		this.$.serverError.setShowing(false);
		this.$.serverError2.setShowing(false);
		this.$.serverError3.setShowing(false);
		this.serverErrorErrorText = undefined;
		this.serverError2ErrorText = undefined;
		this.serverError3ErrorText = undefined;

	},
	
	clearAllSignInInputFields: function(){
		this.$.signInEmail.setValue("");
		this.$.signInPassword.setValue("");
	},
	
	/****
	 * Handle connection drops and make required service call when restored 
	 */
	
	dataRestored: function(){
    	console.info("Data restored called by Parent...");
    	if(enyo.application.FirstUse.currentServiceCall != ""){
    		console.info("Found a pending call: " + enyo.application.FirstUse.currentServiceCall);
    		enyo.application.FirstUse.currentServiceCall();
    	} else {
    		console.log("No pending calls exist.")
    	}
    },
	
	signIn: function() {
		var lenPW = this.$.signInPassword.getValue().length;
		var passEmpty = this.trim(this.$.signInPassword.getValue()) == "";

		if (!passEmpty && lenPW >= 1 && this.verifyEmail(this.$.signInEmail.getValue()) && this.verifyEmailLength(this.$.signInEmail.getValue())) {
			this.blurSignInInputFields();
			this.clearAllSignInErrorMessages();
			this.$.scrim.show();
			this.$.spinner.setShowing(true);
			
			if(enyo.application.FirstUse.getDataConnection()){
				this.$.signIn.call({
					"email" : this.$.signInEmail.getValue(),
					"password": this.$.signInPassword.getValue(),
					"application": "ASClient" 
				});
				enyo.application.FirstUse.currentServiceCall = "";
			} else {
				enyo.application.FirstUse.currentServiceCall = enyo.hitch(this, "signIn");
				console.info("Data not available. Registered " + enyo.application.FirstUse.currentServiceCall + "to be called after data restored");
			}
		} else {
			this.signInPasswordOnChange();
			this.signInEmailOnChange();
		}
},
	
	signInSuccess: function(inSender, inResponse){
		//this.$.scrim.hide();
		console.info("Signed in successfully");
		this.doPostSignInChecks();
		//this.doFinish();
	},
	
	signInFailure: function(inSender, inResponse){
		enyo.application.FirstUse.currentServiceCall = "";
		console.info("Sign in failed: " + JSON.stringify(inResponse));
		this.$.scrim.hide();
		this.$.spinner.setShowing(false);

		if(inResponse.errorCode == "PAMS1106"){
			this.$.noProfileFoundText.setShowing(true);
		} else if (inResponse.errorCode == "PAMS1100"){
			this.$.invalidSignInPassword.setShowing(true);		
		} else if (inResponse.errorCode == "PAMS1101"){
			this.$.invalidSignInPassword.setShowing(false);
			this.$.forgotPwdPopupEmail.setValue(this.$.signInEmail.getValue());
			this.recoverPassword();
		} else if (inResponse.errorCode == "LOGIN_ERROR"){
			// webOS Archive: what our backend actually sends for "wrong email OR
			// wrong password" (authenticateFromDevice -> {authFailed:true} ->
			// LoginProfileCommandAssistant's fallback sendError). Previously fell
			// through to the generic unableToSignInText branch below, which reads
			// like a server outage ("try again in a few minutes") rather than what
			// it almost always is: a typo in the email or password just entered.
			this.$.invalidCredentials.setShowing(true);
		} else {
			console.info("Sign in failure: " + JSON.stringify(inResponse));
			this.$.unableToSignInText.setShowing(true);
			this.serverErrorErrorText = inResponse.errorText
			this.$.serverError.setContent("[" + inResponse.errorCode +"]"); // no need to localize, this is for diagnostics.
			this.$.serverError.setShowing(true);
		}
	},
	
	createAccount: function(){
		this.clearAllMessages();
		this.$.unableToSignInText2.setShowing(false);
		this.$.serverError2.setShowing(false);

		this.blurCreateAccountInputFields();
		this.$.scrim.show();
		this.$.spinner.setShowing(true);
		if(enyo.application.FirstUse.getDataConnection()){
			//NO NO NO, DO NOT DO INTERNATIONALIZE this to pare first/last name becuase you throw away stuff.
			//It is not a 'user name' Name but an 'account name' that happpens to get split by a space.
			//var nameObj = new enyo.g11n.Name();
			
			var trim = function (str) {
				  return str.replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1");
			};
			
			var getFirstName = function(fullName){
				fullName = trim(fullName);
				var splitName = fullName.split(" ");
				return trim(splitName[0]);
			};
			
			var getLastName = function(fullName){
				fullName = trim(fullName);
				var splitName = fullName.split(" ");
				var lastName = "";
				for(i = 1; i < splitName.length; i++)
					lastName = lastName + " " + splitName[i];
				return trim(lastName);
			};
			
			
			var firstName = getFirstName(this.trim(this.$.nameInput.getValue()));
			enyo.application.FirstUse.setFirstName(firstName);
			var lastName = getLastName(this.trim(this.$.nameInput.getValue()));;
			var email = this.trim(this.$.createEmail.getValue());
			var password = this.$.createPassword.getValue();
			var answer = this.trim(this.$.createAnswer.getValue());
			var locale = enyo.g11n.currentLocale();
			this.$.createAccount.call({
					"country":locale.region,
					"email":email,
					"firstName":firstName,
					"language":locale.language,
					"lastName":lastName,
					"password":password,
					"questionId":this.$.listSelector.getValue(),
					"response":answer},
					{method: "createNovaAccount", onSuccess: "createAccountSuccess", onFailure: "createAccountFailure"});
			enyo.application.FirstUse.currentServiceCall = "";
		} else {
			enyo.application.FirstUse.currentServiceCall = enyo.hitch(this, "createAccount");
			console.info("Data not available. Registered " + enyo.application.FirstUse.currentServiceCall + "to be called after data restored");
		}
	},
	
	createAccountSuccess: function(inSender, inResponse){
		//this.$.scrim.hide();
		if(inResponse.returnValue) {
			console.info("Account created successfuly");
			enyo.application.FirstUse.setCreateProfile(true);
			this.doPostSignInChecks();
			//this.doFinish();
		} else {
			console.info("Account creation failed" + JSON.stringify(inResponse));
		}
	},
	
	createAccountFailure: function(inSender, inResponse){
		enyo.application.FirstUse.currentServiceCall = "";
		this.$.scrim.hide();
		this.$.spinner.setShowing(false);
		if (inResponse.errorCode == "PAMS1008") {//Email already exists
			this.$.profileExistsPopup.openAtCenter();
		} else if (inResponse.errorCode == "PAMS9998"){ //Embargoed email
			this.$.embargoedEmailPopup.openAtCenter();
		} else {
			//enyo.application.FirstUse.currentServiceCall = enyo.hitch(this, "createAccount"); if we get a wifi error here I don't think we just awant to blindly resubmit, may get odder errors with multiple accounts being created?
			console.info("Error creating account: " + JSON.stringify(inResponse));
			this.$.unableToSignInText2.setShowing(true);
			this.serverError2ErrorText = inResponse.errorText;
			this.$.serverError2.setContent("[" + inResponse.errorCode + "]");
			this.$.serverError2.setShowing(true);
			
			if (inResponse.errorCode == "PAMS1006") { 
				// humm, the security questions were blank, lets get them again.
				this.retryQuestionOnce = true;
				this.getQuestionsSpinner();	
			}

			//WE NOW STAY ON THIS PAGE AND SHOW THIS ERROR HERE.
			//this.$.unableToSignInText.setShowing(true);
			//this.$.pane.selectViewByName("signInView").render(); 
		}
	},
	
	resetBeforeViewNav: function(args){
		this.clearAllMessages();
		this.$.unableToSignInText.setShowing(false);

		if (args.getQuestions) {
			this.retryQuestionOnce=true;
			this.getQuestionsSpinner();
		}
		
		this.clearAllInputFields();
	},
    
	initializeView: function() {
		if (!this.viewSelectedOnce)	 {
			//Try to preload these questions.
			this.retryQuestionOnce=true;
			this.getQuestions();
			this.viewSelectedOnce = false;
		}
	},
	
	createAccountView: function(){
		this.resetBeforeViewNav({getQuestions: true});
		this.$.pane.selectViewByName("createView").render();
    },
	
	createSignInView:function(){
		this.resetBeforeViewNav({getQuestions: false});
		this.$.pane.selectViewByName("signInView").render();
    },
	
	profileExistsSignIn: function(){
		this.$.signInEmail.setValue(this.$.createEmail.getValue());
		this.$.profileExistsPopup.close();
		//this.$.justScrim.hide();
		this.$.pane.selectViewByName("signInView").render();
		this.$.signInPassword.forceFocus();
		this.$.signInPassword.forceSelect();
	},
	
	profileExistsClose: function(){
		//this.$.justScrim.hide();
		this.$.profileExistsPopup.close();
	},
	
	getQuestionsSpinnerCommon: function(showSpinner){
		// webOS Archive: the security-question fields are hidden, so don't fetch
		// the question list at all — one less network round-trip on card open.
		return;
		var locale = enyo.g11n.currentLocale();
		if (this.$.listSelector.items == null || this.$.listSelector.items.length <= 1) {
			if(enyo.application.FirstUse.getDataConnection()){
				console.info("Data available, getting questions in: " + locale);
				if (showSpinner) {
					this.$.scrim.show();
					this.$.spinner.setShowing(true);
					this.$.getSecurityQuestionsSpinner.call({"locale": locale.locale});
				} else {
					this.$.getSecurityQuestions.call({"locale": locale.locale});
				}
				enyo.application.FirstUse.currentServiceCall = "";
			} else {
				enyo.application.FirstUse.currentServiceCall = enyo.hitch(this, (showSpinner) ?  "getQuestionsSpinner" : "getQuestions"); //Set this so that network restore retrieves questions again
				console.info("Data not available. Registered " + enyo.application.FirstUse.currentServiceCall + "to be called after data restored");
			}
		} else {
			//Call only once since user can't change language unless he reboots the device
			enyo.application.FirstUse.currentServiceCall = "";
			this.$.scrim.hide();
			this.$.spinner.setShowing(false);
		}
	},

	getQuestionsSpinner: function() {
		this.getQuestionsSpinnerCommon(true);
	},
	
	getQuestions: function(){
		this.getQuestionsSpinnerCommon(false);
	},
	
	getSecurityQuestionsFailureCommon: function(inSender, inResponse, showSpinner){
		console.info("getSecurityQuestions error:" + JSON.stringify(inResponse));
			
		if(enyo.application.FirstUse.getDataConnection()){ 
			//CWS-3050 4/42/2011 comment
			enyo.application.FirstUse.currentServiceCall = "";
			if (this.retryQuestionOnce) {
				this.retryQuestionOnce = false;	
				if (showSpinner) {
					this.getQuestionsSpinner();
				} else {
					this.getQuestions();
				}
			} else {
				if (showSpinner) {
					this.$.scrim.hide();
					this.$.spinner.setShowing(false);
				}
				if (this.$.pane.getViewName() == "createView") {
					//We only use this on the create view.
					this.goBack();
					this.$.unableToCreateAccountTextNetworkingIssue.setShowing(true);
					this.serverError3ErrorText = inResponse.errorText;
					this.$.serverError3.setContent("[" + inResponse.errorCode + "]");
					this.$.serverError3.setShowing(true);
				}
			}
		} else {
			enyo.application.FirstUse.currentServiceCall = enyo.hitch(this, (showSpinner) ?  "getQuestionsSpinner" : "getQuestions"); //Set this so that network restore retrieves questions again
		}
	},
		
	getSecurityQuestionsFailureSpinner: function(inSender, inResponse){
		this.getSecurityQuestionsFailureCommon(inSender, inResponse, true);
	},
		
	getSecurityQuestionsFailure: function(inSender, inResponse){
		this.getSecurityQuestionsFailureCommon(inSender, inResponse, false);
	},
	
	getSecurityQuestionsSuccess: function(inSender, inResponse){
		var questions = inResponse.challengeQuestions;
		var listItems = [], i = 0, a = undefined, len = questions.length;

		for(;i < len; i++){
			a = questions[i];
			listItems.push({caption: a.question, value: a.id});
		}
		this.$.listSelector.setItems(listItems);
		if (len) {
			this.$.listSelector.setValue(questions[0].id);
		} 

		this.$.scrim.hide();
		this.$.spinner.setShowing(false);
	},
	
	questionSelected: function(){
		if(this.$.listSelector.getValue() != -1)
			this.$.createAnswer.setDisabled(false);
		else{
			this.$.createAnswer.setValue("");
			this.$.createAnswer.setDisabled(true);
			if(this.validateInputFields())
				this.toggleCreateButton(true);
			else{
				this.toggleCreateButton(false);
			}
		}
	},
	
	nameDeviceOnFocus: function(){
		this.$.nameDeviceLengthText.setShowing(false);
	},
	
	nameDevice: function(){
		if(this.$.deviceName.getValue().length < 256){
			this.$.scrim.show();
			this.$.spinner.setShowing(true);
			this.assignDeviceName();
		} else {
			this.$.nameDeviceLengthText.setShowing(true);
		}
	},
	
	assignDeviceName: function(){
		if(this.getAcctAlias() != "" && this.getAcctToken() != "" && this.getNduId() != ""){
			console.info("We have all token and device data to name the device");
			if(enyo.application.FirstUse.getDataConnection()){
				console.info("Data available...");
				var locale = enyo.g11n.currentLocale();
				var language = locale.language;
				var region = locale.region;

				this.$.assignDeviceName.call({"alias":this.getAcctAlias(), "token":this.getAcctToken(),	"nduId":this.getNduId(), "name":this.$.deviceName.getValue(),"language": language, "country": region});
				enyo.application.FirstUse.currentServiceCall = "";
			} else {
				enyo.application.FirstUse.currentServiceCall = enyo.hitch(this, "assignDeviceName");
				console.info("Data not available. Registered " + enyo.application.FirstUse.currentServiceCall + "to be called after data restored");
			}
		} else {
			this.setDeviceNamed(false);
			console.info("We dont have all info, Waiting before we call assignDeviceName");
		}
	},
	
	assignDeviceNameSuccess: function(inSender, inResponse){
		this.$.scrim.hide();
		this.$.spinner.setShowing(false);
		console.info("Successfully named device: " + JSON.stringify(inResponse));
		this.doFinish();
	},
	
	assignDeviceNameFailure: function(inSender, inResponse){
		console.info("Name device failure: " + JSON.stringify(inResponse));
		
		if(enyo.application.FirstUse.getDataConnection()){
			enyo.application.FirstUse.currentServiceCall = "";
			if (!this.stopTryingToRenameDevice) {
				this.assignDeviceName();
				this.stopTryingToRenameDevice = true; //just retry one then give up
			} else {
				console.info("Give up, could not name device...just keep on going");
				this.$.scrim.hide();
				this.$.spinner.setShowing(false);
				this.doFinish();
			}
		} else {
			enyo.application.FirstUse.currentServiceCall = enyo.hitch(this, "assignDeviceName");
		}
	},
	
/**
 * Forgot password flow
 */	
	
	forgotPwdPopupEmailOnFocus: function (inSender, inResponse) {
		enyo.keyboard.show(4); // email
	},
	
	forgotPwdPopupEmailOnInput: function (inSender, inResponse) {
		this.$.invalidEmailText.setShowing(false);
		
		if(this.verifyEmail(this.trim(this.$.forgotPwdPopupEmail.getValue())) && this.verifyEmailLength(this.trim(this.$.forgotPwdPopupEmail.getValue())) ){
			this.$.forgotPwdNxtButton.setDisabled(false);
		} else {
			this.$.forgotPwdNxtButton.setDisabled(true);
		}
	},
		
	forgotPwdPopupEmailOnValidateAndNext: function(inSender, inResponse){
		if (this.verifyEmail(this.trim(this.$.forgotPwdPopupEmail.getValue())) && this.verifyEmailLength(this.trim(this.$.forgotPwdPopupEmail.getValue())) ){
			this.$.invalidEmailText.setShowing(false);
			this.$.forgotPwdNxtButton.setDisabled(false);
			this.$.forgotPwdPopupEmail.forceBlur();
			this.recoverPasswordModal();
		} else {
			if (!this.verifyEmail(this.trim(this.$.forgotPwdPopupEmail.getValue()))) {
				this.$.invalidEmailText.setContent(label_error_emailInvalidText);
			} else {
				this.$.invalidEmailText.setContent(label_error_emailLengthText);
			}
			this.$.invalidEmailText.setShowing(true);
			this.$.forgotPwdNxtButton.setDisabled(true);
		}
	},
	
	forgotPwdPopupEmailOnKeyPress: function (inSender, inResponse) {
		if(inResponse.keyCode == 13){
			this.forgotPwdPopupEmailOnValidateAndNext();
		}
	},
	
	forgotPwdPopupEmailOnBlur: function(){
	},
	
		
	answerOnChange: function(){
		this.$.wrongAnswer.setShowing(false); 
		var length = this.trim(this.$.answer.getValue()).length;
		console.info("Answer length is: " + length);

		if(length > 0 && length < 50) {
			this.$.recoverPwdPopupNextButton.setDisabled(false);
		} else {
			this.$.wrongAnswer.setContent(label_error_answerLength);
			this.$.wrongAnswer.setShowing(true); 
			this.$.recoverPwdPopupNextButton.setDisabled(true);
		}
	},
	
	
	answerOnInput: function(inSender, inResponse){
		this.$.wrongAnswer.setShowing(false);

		if (this.validateInputFields()) {
			this.clearAllMessages();
			this.$.recoverPwdPopupNextButton.setDisabled(true);
		} else {
			this.$.recoverPwdPopupNextButton.setDisabled(false);
		}
	},
		
	answerOnKeyPress: function(inSender, inResponse){
		if(inResponse.keyCode == 13){
			this.answerOnChange();
			var length = this.trim(this.$.answer.getValue()).length;
			if(length > 0 && length < 50){
				this.$.answer.forceBlur();
				this.newPassword();
			}
		}
	},


	answerOnBlur: function(){
	},
	answerOnFocus: function(){
		enyo.keyboard.show(1);
	},

	
	newPasswordInputOnChange: function(inSender, inResponse){
		var pl = this.$.newPasswordInput.getValue().length;
		var cl = this.$.newConfirmPasswordInput.getValue().length;
		
		if(cl>0){
			if (this.$.newConfirmPasswordInput.getValue() != this.$.newPasswordInput.getValue()){
				this.$.confirmPwdDontMatchText.setShowing(true);
			}else{
				this.$.confirmPwdDontMatchText.setShowing(false);
			}
		}
		if (pl < 8) {
			this.$.pwdLengthText.setShowing(true);
		} else {
			this.$.pwdLengthText.setShowing(false);
		}
		
		if (pl < 8 || cl < 8) {
			this.$.signInWithPwdButton.setDisabled(true);
		} else {
			this.$.signInWithPwdButton.setDisabled(false);
		}
		


	},
	
	newPasswordInputOnInput: function(inSender, inResponse) {
		this.$.pwdLengthText.setShowing(false);
		this.$.confirmPwdDontMatchText.setShowing(false);

		var pl = this.$.newPasswordInput.getValue().length;
		var cl = this.$.newConfirmPasswordInput.getValue().length;
		if (pl < 8 || cl < 8) {
			this.$.signInWithPwdButton.setDisabled(true);
		} else {
			this.$.signInWithPwdButton.setDisabled(false);
		}
	},

	newPasswordInputOnKeyPress: function(inSender, inResponse) {
		if(inResponse.keyCode == 13){
			this.newPasswordInputOnChange();
			var pl = this.$.newPasswordInput.getValue().length;
			if (pl >= 8) {
				this.$.newConfirmPasswordInput.forceFocus();
				this.$.newConfirmPasswordInput.forceSelect();
			} 
		}
	},
	
	newPasswordInputOnFocus: function(){
		enyo.keyboard.show(1);
	},

	newPasswordInputOnBlur: function(){
		var pl = this.$.newPasswordInput.getValue().length;
		var cl = this.$.newConfirmPasswordInput.getValue().length;
		if (pl < 8) {
			this.$.pwdLengthText.setShowing(true);
			this.$.signInWithPwdButton.setDisabled(true);
		} else if(cl>0){
			if(cl >= 8){
				if(this.$.newPasswordInput.getValue() != this.$.newConfirmPasswordInput.getValue()){
					this.$.confirmPwdDontMatchText.setShowing(true);
					this.$.signInWithPwdButton.setDisabled(true);
				}else
					this.$.signInWithPwdButton.setDisabled(false);
			}
		}else {
			//Do nothing. wait for user to input confirm password
		}
	},

	newConfirmPasswordInputOnChange: function(inSender, inResponse){
		this.$.pwdLengthText.setShowing(false);
		this.$.confirmPwdDontMatchText.setShowing(false);
		if(this.$.newConfirmPasswordInput.getValue() == this.$.newPasswordInput.getValue()){
			this.$.signInWithPwdButton.setDisabled(false);
		}else{
			this.$.confirmPwdDontMatchText.setShowing(true);
			this.$.signInWithPwdButton.setDisabled(true);
		}
	},
	
	newConfirmPasswordInputOnInput: function(inSender, inResponse) {
		this.$.pwdLengthText.setShowing(false);
		this.$.confirmPwdDontMatchText.setShowing(false);
		if(this.$.newConfirmPasswordInput.getValue() == this.$.newPasswordInput.getValue()) {
			this.$.signInWithPwdButton.setDisabled(false);
		} else { 
			this.$.signInWithPwdButton.setDisabled(true);
		}
	},
		
	newConfirmPasswordInputOnKeyPress: function(inSender, inResponse) {
		if(inResponse.keyCode == 13){
			if(this.$.newConfirmPasswordInput.getValue() == this.$.newPasswordInput.getValue()){
				this.$.newConfirmPasswordInput.forceBlur();
				this.signInWithPassword();
			} else {
				this.$.confirmPwdDontMatchText.setShowing(true);
			}
		}
	},
	
	newConfirmPasswordInputOnFocus: function(){
		enyo.keyboard.show(1);
	},

	newConfirmPasswordInputOnBlur: function(){
		var pl = this.$.newPasswordInput.getValue().length;
		var cl = this.$.newConfirmPasswordInput.getValue().length;
		if (this.$.newConfirmPasswordInput.getValue() != this.$.newPasswordInput.getValue()){
			this.$.confirmPwdDontMatchText.setShowing(true);
		} else if( pl < 8 || cl < 8 ){
			this.$.pwdLengthText.setShowing(true);
			this.$.signInWithPwdButton.setDisabled(true);
		}else {
			this.$.signInWithPwdButton.setDisabled(false);
		}
	},
	
	openPalmProfilePopup: function(){
		//this.$.justScrim.show();
		this.$.palmProfilePopup.openAtCenter();	
	},
	
	closePalmProfilePopup: function(){
		//this.$.justScrim.hide();
		this.$.palmProfilePopup.close();
	},
	
	forgotLogin: function(){
		//this.$.justScrim.show();
		this.clearAllSignInErrorMessages();
		//this.$.noProfileFoundText.setShowing(false);
		this.$.forgotEmailPopup.openAtCenter();
	},
	
	forgotPassword: function(){
		this.$.forgotEmailPopup.close();
		
		if (this.verifyEmail(this.$.signInEmail.getValue())) {
			this.$.forgotPwdNxtButton.setDisabled(false);
			this.$.forgotPwdPopupEmail.setValue(this.$.signInEmail.getValue());
		} else {
			this.$.forgotPwdPopupEmail.setValue("");
		}
		this.$.invalidEmailText.setShowing(false);
		enyo.keyboard.setManualMode(true);
		enyo.keyboard.show(4); // email
		setTimeout(enyo.bind(this, function() { // delay for keyboard to show.
			this.$.forgotPwdPopup.openAtCenter();
			this.$.forgotPwdPopupEmail.forceFocus(); 
			this.$.forgotPwdPopupEmail.forceSelect();
			}), 500)
	},
		
	closeForgotEmailPopup: function() {
		//this.$.justScrim.hide();
		enyo.keyboard.hide();
		enyo.keyboard.setManualMode(false);
		this.$.forgotEmailPopup.close();
	},
	
	recoverPasswordModal: function(){
		this.calledFromForgotPasswordPopup = true;
		this.getAccountSecurityQuestion();
	},
	recoverPassword: function(){
		this.calledFromForgotPasswordPopup = false;
		this.getAccountSecurityQuestion();
	},
	
	getAccountSecurityQuestion: function(){
		if (this.calledFromForgotPasswordPopup) {
			this.$.forgotPwdPopup.setScrim(false);
			this.$.popUpSpinnerForgotPassword.openAtCenter();
		} else {
			this.$.scrim.show();
			this.$.spinner.setShowing(true);
		}
		var locale = enyo.g11n.currentLocale();
		if(enyo.application.FirstUse.getDataConnection()){
			console.info("Data available...");
			this.$.getChallengeQuestion.call({"email": this.$.forgotPwdPopupEmail.getValue(),"locale":locale.locale});
			enyo.application.FirstUse.currentServiceCall = "";
		} else {
			enyo.application.FirstUse.currentServiceCall = enyo.hitch(this, "getAccountSecurityQuestion");
			console.info("Data not available. Registered " + enyo.application.FirstUse.currentServiceCall + "to be called after data restored");
		}
		
	},
	
	getChallengeQuestionSuccess: function(inSender, inResponse){
		if (this.calledFromForgotPasswordPopup) {
			this.$.forgotPwdPopup.setScrim(true);
			this.$.popUpSpinnerForgotPassword.close()
		} else {
			this.$.scrim.hide();
			this.$.spinner.setShowing(false);
		}
		this.$.forgotPwdPopup.close();

		console.info("Account question from server: " + inResponse.id + " " + inResponse.question);
		this.setQuestionId(inResponse.id);
		this.setQuestionCaption(inResponse.question);
		this.$.accountSecurityQuestionText.setContent(this.getQuestionCaption());
		
		this.$.answer.setValue("");
		this.$.wrongAnswer.setShowing(false);
		enyo.keyboard.show(1);
		this.$.recoverPwdPopup.openAtCenter();
		this.$.answer.forceFocus();
	},
	
	getChallengeQuestionFailure: function(inSender, inResponse){
		
		console.info("Error: " + JSON.stringify(inResponse));
		this.$.forgotPwdPopupEmail.forceSelect();
		this.$.invalidEmailText.setContent(label_error_noProfileFoundText);
		this.$.invalidEmailText.setShowing(true);
		if (this.calledFromForgotPasswordPopup) {
			enyo.application.FirstUse.currentServiceCall = enyo.hitch(this, "getAccountSecurityQuestion");
			this.$.forgotPwdPopup.setScrim(true)
			this.$.popUpSpinnerForgotPassword.close()
		} else {
			enyo.application.FirstUse.currentServiceCall = "";
			this.$.scrim.hide();
			this.$.spinner.setShowing(false);
		}
	},
	
	closeForgotPwdPopup: function(){
		this.$.forgotPwdPopupEmail.setValue("");
		//this.$.justScrim.hide();
		enyo.keyboard.hide();
		enyo.keyboard.setManualMode(false);
		this.$.forgotPwdPopup.close();	
	},
	
	
	newPassword: function(){
		this.$.popUpSpinnerRecoverPassword.openAtCenter();;
		console.info("Validating answer: " + this.$.forgotPwdPopupEmail.getValue() + " " + this.getQuestionId());
		if(enyo.application.FirstUse.getDataConnection()){
			console.info("Data available...");
			this.$.authFromChallengeQuestion.call({"email":this.$.forgotPwdPopupEmail.getValue(),
												"questionId": this.getQuestionId(),
												"response":this.$.answer.getValue()}
			);
			enyo.application.FirstUse.currentServiceCall = "";
		} else {
			enyo.application.FirstUse.currentServiceCall = enyo.hitch(this, "newPassword");
			console.info("Data not available. Registered " + enyo.application.FirstUse.currentServiceCall + "to be called after data restored");
		}
			
	},
	
	authFromChallengeQuestionSuccess: function(inSender, inResponse){
		this.$.recoverPwdPopup.close();
		this.$.popUpSpinnerRecoverPassword.close();;
		this.setNewToken(inResponse.idToken);
		
		this.$.newPasswordInput.setValue("");
		this.$.newConfirmPasswordInput.setValue("");
		this.$.newPwdPopup.openAtCenter();
		this.$.newPasswordInput.forceFocus();
		this.$.newPasswordInput.forceSelect();
	},
	
	authFromChallengeQuestionFailure: function(inSender, inResponse){
		enyo.application.FirstUse.currentServiceCall = "";
		console.info("authFromChallengeQuestionFailure: " + JSON.stringify(inResponse));
		this.$.popUpSpinnerRecoverPassword.close();
		if(inResponse.errorCode == "PAMS1018"){
			this.$.wrongAnswer.setContent(label_error_wrongAnswer);
			this.$.wrongAnswer.setShowing(true);
			this.$.recoverPwdPopup.openAtCenter();
			this.$.answer.forceSelect();
		} else if(inResponse.errorCode == "PAMS1101"){
			console.info("Account locked, send email and finish");
			this.forgotAnswer();
		}else {
			//enyo.application.FirstUse.currentServiceCall = enyo.hitch(this, "newPassword"); // we don't want to do this here because auto-retrying this could force a recover mode,...not good
			this.$.wrongAnswer.setContent(label_error_unableToSignInText);
			this.$.wrongAnswer.setShowing(true);
		}
		
	},
	
	signInWithPassword: function(){
		if(enyo.application.FirstUse.getDataConnection()){
			this.$.popUpSpinnerPwdPopUp.openAtCenter();

			console.info("Data available...");
			this.$.changePassword.call({"isResetPassword":true, 
				"newPassword": this.$.newPasswordInput.getValue(), 
				"idToken":this.getNewToken()}
			 );
			enyo.application.FirstUse.currentServiceCall = "";
		} else {
			enyo.application.FirstUse.currentServiceCall = enyo.hitch(this, "signInWithPassword");
			console.info("Data not available. Registered " + enyo.application.FirstUse.currentServiceCall + "to be called after data restored");
		}
		
	},
	
	changePasswordSuccess: function(inSender, inResponse){
		this.$.newPwdPopup.close();
		this.$.popUpSpinnerPwdPopUp.close();
		enyo.keyboard.hide();
		enyo.keyboard.setManualMode(false);
			
		this.$.scrim.show();
		this.$.spinner.setShowing(true);
		var email = this.$.forgotPwdPopupEmail.getValue();
		var password = this.$.newPasswordInput.getValue();
		console.info("Signing in after changing password with: " + email);
		if(enyo.application.FirstUse.getDataConnection()){
			console.info("Data available...");
			this.$.signIn.call({
				"email" : email,
				"password": password,
				"application": "ASClient" 
				});
			enyo.application.FirstUse.currentServiceCall = "";
		} else {
			enyo.application.FirstUse.currentServiceCall = enyo.hitch(this, "changePasswordSuccess");
			console.info("Data not available. Registered " + enyo.application.FirstUse.currentServiceCall + "to be called after data restored");
		}
	},
	
	changePasswordFailure: function(){
		enyo.application.FirstUse.currentServiceCall = ""; //Need to show the error on this dialog to uncomment this code and then we would not close the dialog
		this.$.popUpSpinnerPwdPopUp.close();
		this.$.unableToSignInText.setShowing(true);
		this.$.newPwdPopup.close();
		enyo.keyboard.hide();
		enyo.keyboard.setManualMode(false);
	},
	
	forgotAnswer: function(){
		console.info("Sending email to: " + this.$.forgotPwdPopupEmail.getValue());
		if(enyo.application.FirstUse.getDataConnection()){
			console.info("Data available...");
			this.$.requestPasswordResetEmail.call({"email":this.$.forgotPwdPopupEmail.getValue()});
			enyo.application.FirstUse.currentServiceCall = "";
		} else {
			enyo.application.FirstUse.currentServiceCall = enyo.hitch(this, "forgotAnswer");
			console.info("Data not available. Registered " + enyo.application.FirstUse.currentServiceCall + "to be called after data restored");
		}
	},
	
	requestPasswordResetEmailSuccess: function(inSender, inResponse){
		this.$.wrongAnswer.setShowing(false);
		enyo.keyboard.hide();
		enyo.keyboard.setManualMode(false);
		this.$.recoverPwdPopup.close();
		var template = new enyo.g11n.Template($L("We sent an email to #{email}. If you don't receive the email shortly check your junk email folder."));
        this.$.sentEmailText.setContent(template.evaluate({
            email: enyo.string.escapeHtml(this.$.forgotPwdPopupEmail.getValue())
        }));
		this.$.recoverPwdSentEmailPopup.openAtCenter();
	},
	
	requestPasswordResetEmailFailure: function(inSender, inResponse){
		enyo.application.FirstUse.currentServiceCall = "" // would need a cancel button on this dialog to uncomment this.
		console.info("Error sending pwd rest email: " + JSON.stringify(inResponse));
		this.$.wrongAnswer.setShowing(false);
		enyo.keyboard.hide();
		enyo.keyboard.setManualMode(false);
		this.$.recoverPwdPopup.close();
		var template = new enyo.g11n.Template($L("We tried to send an email to #{email} but it failed. Please contact HP support."));
        this.$.sentEmailText.setContent(template.evaluate({
            email: enyo.string.escapeHtml(this.$.forgotPwdPopupEmail.getValue())
        }));
		this.$.recoverPwdSentEmailPopup.openAtCenter();
	},
	
	closeRecoverPwdSentEmailPopup: function(){
		this.$.recoverPwdSentEmailPopup.close();
		//this.$.justScrim.hide();
		this.$.signInEmail.setValue("");
		this.$.signInPassword.setValue("");
		this.$.pane.selectViewByName("signInView").render();
		this.$.signInEmail.forceFocus();
		this.$.signInEmail.forceSelect();
	},
    
	defaultButtonClick: function() {
		this.$.defaultDialog.toggleOpen();
	},
	defaultButtonClose: function() {
		this.$.defaultDialog.toggleOpen();
	},
	
	goBack: function(){
		this.clearAllSignInInputFields();
		this.clearAllSignInErrorMessages();
		this.$.pane.selectViewByName("introView").render();
	},

	// webOS Archive: account setup is optional, both standalone and under OOBE.
	// Reuses the same safe-close path as a completed setup — no erase, no reset,
	// no shutdown — so this behaves identically to skipping OOBE steps that have
	// their own skip button.
	skipSetup: function(){
		enyo.application.FirstUse.wosaSkipSetup();
	},

	postLoginSettings: function(){
		console.info("in Post login setings....");
	},
	
	verifyPasswords: function(pwd1, pwd2){
		if(pwd1.length < 8 || pwd2.length < 8 || pwd1 != pwd2)
			return false;
		return true;
	},
	
	verifyEmails: function(email1, email2){
		var status = false;     
		var emailRegEx = /^[A-Z0-9]+[A-Z0-9._%+-]*@(?:[A-Z0-9-]+\.)+[A-Z]{2,4}$/i;
     	if (email1.search(emailRegEx) == -1) {
          	console.info("Enter a valid email address");
     	}
     	else if (email1 != email2) {
        	console.info("Email addresses do not match");
     	}
     	else {
        	//console.info("valid email");
          	status = true;
     	}
     	return status;
	},
	
	verifyEmail: function(email1){
		var status = false;     
		var emailRegEx = /^[A-Z0-9]+[A-Z0-9._%+-]*@(?:[A-Z0-9-]+\.)+[A-Z]{2,4}$/i;
     	if (email1.search(emailRegEx) == -1) {
          	//console.info("Enter a valid email address");
     	}
		else {
        	//console.info("valid email");
          	status = true;
     	}
     	return status;
	},
	
	verifyEmailLength : function(email){
		email = this.trim(email);
		var status = false;
		if(email.length <=100){
			status = true;
		}
		return status;
	},
	
	trim: function (str) {
		  return str.replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1");
	},
	
	deviceNameEntered: function(){
		this.$.nameDeviceButton.setDisabled(false);
	},
	
	embargoedEmailPopupHelp: function(){
		this.$.embargoedEmailHelpPopup.openAtCenter();
	},
	
	embargoedEmailPopupClose: function(){
		this.$.embargoedEmailPopup.close();
		this.$.createEmail.setValue("");
		this.$.createEmailConfirm.setValue("");
		this.$.createPassword.setValue("");
		this.$.createPasswordConfirm.setValue("");
	},
	
	embargoedEmailHelpPopupClose: function(){
		this.embargoedEmailPopupClose();
		this.$.embargoedEmailHelpPopup.close();
	},
	
	//Call this after sign in success or create account success, these details are required to name the device
	getTokenDetails: function(){
		console.info("making call for token and device");
		this.$.getToken.call();
		this.$.getDevice.call();
		//this.doFinish();
	},
	
	getTokenResponse: function(inSender, inResponse){
		console.info("getToken Response");
		if(inResponse.returnValue){
			this.setAcctAlias(inResponse.accountAlias);
			this.setAcctToken(inResponse.token);
			//console.info("Setting token and device");
			//This is needed if restore is called where the device needs to be named again
			console.info("Setting alias and token in FU")
			enyo.application.FirstUse.setAcctAlias(inResponse.accountAlias);
			enyo.application.FirstUse.setAcctToken(inResponse.token);
			//console.info("alias set: " + enyo.application.FirstUse.getAcctAlias());
			//console.info("token set: " + enyo.application.FirstUse.getAcctToken());
			//If device info returned before me do finish
			if(this.getNduId() != "" && !this.getDeviceNamed){
				console.info("Calling doFinish from getToken success");
				this.doFinish();
			//	this.assignDeviceName();
			}else{
				console.info("tokenresponse Not calling finish");
			}
			
		} else {
			console.info("Could not get token info");
		}
	},
	
	getDeviceResponse: function(inSender, inResponse){
		console.info("getToken Response");
		if(inResponse.returnValue){
			this.setDeviceId(inResponse.deviceInfo.deviceId);
			this.setNduId(inResponse.deviceInfo.nduId);
			
			//This is needed if restore is called where the device needs to be named again
			console.info("Setting nduid and deviceid in FU")
			enyo.application.FirstUse.setDeviceId(inResponse.deviceInfo.deviceId);
			enyo.application.FirstUse.setNduId(inResponse.deviceInfo.nduId);
			
			//If token info returned before me I need to do finish
			if(this.getAcctAlias() != "" && this.getAcctToken() != "" && !this.getDeviceNamed){
				console.info("Calling doFinish from getDevice success");
				this.doFinish();
				//this.assignDevicename();
			}
		} else {
			console.info("Could not get device info");
		}
	},
		
	blurSignInInputFields: function(){
		this.$.signInEmail.forceBlur();
		this.$.signInPassword.forceBlur();
	},
	
	blurCreateAccountInputFields: function(){
		this.$.nameInput.forceBlur();
		this.$.createEmail.forceBlur();
		this.$.createEmailConfirm.forceBlur();
		this.$.createPassword.forceBlur();
		this.$.createPasswordConfirm.forceBlur();
		//this.$.listSelector.forceBlur();
		this.$.createAnswer.forceBlur();
	},
	
	syncDeviceNameResponse: function(inSender, inResponse) {
		console.info("WOSA: device name sync: " + JSON.stringify(inResponse));
	},

	doPostSignInChecks: function(){
		// webOS Archive: skip the stock post-sign-in checks. PostSignIn runs an OTA
		// software-update check (no update service exists -> hangs) and a backup-devices
		// check (dead HP backend). The account + token are already written by
		// accountservices, so go straight to finish. Handles both sign-in and create.
		console.info("WOSA: skipping PostSignIn OTA/backup checks — finishing sign-in.");
		this.$.scrim.hide();
		this.$.spinner.setShowing(false);
		// The account + token are already in db8 by this point (both the sign-in and
		// the create path land here), which is what syncDeviceName reads, so this is
		// the earliest safe place to publish the device name.
		this.$.syncDeviceName.call({});
		this.doFinish();
	},
	
	postSignInDone: function(){	
		this.$.scrim.hide();
		this.$.spinner.setShowing(false);
		this.backupIssuesPopupIsOpen=false;

		if (!enyo.application.FirstUse.getCreateProfile() && enyo.application.FirstUse.getIsBackupAvailableFailed()) {
			//^^^^^ Test above means, we were on the SIGNIN (and not create account page) and the backup check failed.
			this.backupIssuesPopupIsOpen=true;
			this.$.backupIssuesPopup.openAtCenter();
			
		} else {
			this.doFinish();
		}	
	},
	
	cancelIfWifiCameAndWent: function() {
		//Hack called from first use to prevent a hang if the wifi dialog came and went.
		if (this.backupIssuesPopupIsOpen) {
			this.cancelBackupIssues();
		}
	},
	
	continueBackupIssues: function() {
			this.backupIssuesPopupIsOpen = false;
			this.$.backupIssuesPopup.close();
			enyo.application.FirstUse.setIsBackupAvailable(false);
			this.doFinish();
	},
	
	cancelBackupIssues: function() {
			this.backupIssuesPopupIsOpen = false;
			this.$.backupIssuesPopup.close();
			this.clearAllSignInErrorMessages();
			this.$.unableToSignInText.setShowing(true);

			this.serverErrorErrorText = "Checking for backup failed.";
			this.$.serverError.setContent("[BAC001]");

			this.$.serverError.setShowing(true);

			enyo.application.FirstUse.setIsBackupAvailableFailed(false); 
	},
	
	genericFailure: function(inSender, inResponse, inRequest){
        console.info("Got generic failure " + JSON.stringify(inResponse));
    },
	
	
	errorCodeDoubleClk: function (inSender, inResponse) {
		if (this.serverErrorErrorText) {
			this.$.serverError.setContent(this.$.serverError.getContent() + " " +  this.serverErrorErrorText); // no need to localize, this is for diagnostics.
			this.serverErrorErrorText = null; // no need to localize, this is for diagnostics.
		}
	},
	
	errorCode2DoubleClk: function (inSender, inResponse) {
		if (this.serverError2ErrorText) {
			this.$.serverError2.setContent(this.$.serverError.getContent() + " " +  this.serverError2ErrorText); // no need to localize, this is for diagnostics.
			this.serverError2ErrorText = null; // no need to localize, this is for diagnostics.
		}
	},
	
	errorCode3DoubleClk: function (inSender, inResponse) {
		if (this.serverError3ErrorText) {
			this.$.serverError3.setContent(this.$.serverError.getContent() + " " +  this.serverError3ErrorText); // no need to localize, this is for diagnostics.
			this.serverError3ErrorText = null; // no need to localize, this is for diagnostics.
		}
	}
	
});

