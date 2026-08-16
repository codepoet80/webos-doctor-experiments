enyo.kind({
    name: "findApps.SavedList",
    kind: findApps.Model,
    _list: [],
    
    constructor: function() {
    	this.inherited(arguments);
    	this.init();
    }
    ,
    init: function() {
        this._list = JSON.parse(localStorage.getItem('com.palm.findapps.appList')) || [];
    },
    saveApp: function(appId) {
        if (!this.isSaved(appId)) {
            this._list.push(appId);
            localStorage.setItem('com.palm.findapps.appList', JSON.stringify(this._list));
            this.notify("saveListChanged", [appId, "add", this._list.length]);
        } else {
            //this.log("error: !! application already saved !! : " + appId);
        }
    },
    updateList: function(updatedList) {
        this._list = updatedList;
        localStorage.setItem('com.palm.findapps.appList', JSON.stringify(this._list));
        this.notify("saveListChanged", [null, "update", this._list.length]);
    },
    getList: function() {
        return this._list;
    },
    removeApp: function(appId, installing) {
        var index = this._list.indexOf(appId);
        if (index != -1) {
            this._list.splice(index, 1);
            localStorage.setItem('com.palm.findapps.appList', JSON.stringify(this._list));
            this.notify("saveListChanged", [appId, "remove", this._list.length]);
            // Check if list has become empty
            // Raise an event, which is caught by SavedApps screen to show empty instructions
            // when saved list becomes empty
            if (this._list.length === 0 && !installing) {
                this.notify("saveListEmpty", []);
            }
        }
    },
    isSaved: function(appId) {
        return (this._list.indexOf(appId) != -1);
    }
});
