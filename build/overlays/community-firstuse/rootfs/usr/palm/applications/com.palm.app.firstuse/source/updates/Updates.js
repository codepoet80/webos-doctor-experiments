	enyo.kind({
    name: "Updates", 
    kind: "VFlexBox",
	published:{
		forceSwUpdate:false
		
	}, 
	
    events: {
        onFinish: ""
    }, 
	 create: function() {
        this.inherited(arguments);
		if (this.getForceSwUpdate()) {
			this.$.crossapp.params.backupRestore = "true";
		}
		this.log("CREATE - params:"+JSON.stringify(this.$.crossapp.params));

    },
		
    components: [
        {name: "uptodate", kind: "ModalDialog", lazy: false, scrim: true, modal: true, style: "width: 351;", components: [
            {kind: "VFlexBox", pack: "end", components: [
                {content: rb.$L("No Update Available")},
                {content: ""},
            ]},
            {kind: "Spacer"},
            {kind: "VFlexBox", pack: "end", components: [
                {kind: "Button", caption: rb.$L("Cancel"), onclick: "handleCancelClick"}
            ]}
        ]},

        {name: "updatesApp", className: "enyo-view", lazy: false, components: [	      
            {kind: "CrossAppUI",name: "crossapp", params:{"firstUse":true, "locale": enyo.g11n.currentLocale().locale}, app:"com.palm.app.updates", path: "index.html", onResult: "handleResult"},
        ]},            
        
        {kind: "UpdateDaemonService",onFailure: "handleCheckForUpdateFailure",onSuccess: "handleCheckForUpdate",
            components: [
                {name: "checkForUpdate",method: "CheckForUpdate"}
        ]}
    ],
    
   
    
    dataRestored: function(){
        console.info("Data restored called by Parent...");
    },

    
    rendered: function() {
        this.inherited(arguments);
        this.log();
//        var that = this;
//        setTimeout(function(){
//          that.$.pane.selectViewByName("updatesApp");
//        }, 5000);

    },

    handleResult: function(inSender, msg) {
        this.log(JSON.stringify(msg));
        
        this.doFinish(msg);
//        if (msg.status == "UpToDate") {
//            this.$.uptodate.openAtCenter();
//            this.doFinish({"status": "uptodate"});
//        } else if (msg.status == "Complete") {
//            this.doFinish({"status": "complete"});
//        } else if (msg.status == "Background") {
//            this.doFinish({"status": "background"});
//        }
        window.close();
    },
    
    handleCancelClick: function() {
        this.log();
        this.$.uptodate.close();
        this.doFinish();
        window.close();
    }
});


enyo.kind({
    name: "UpdateDaemonService",
    kind: "PalmService",
    service: "palm://com.palm.update/"
});

