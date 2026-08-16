enyo.kind({
    name: "findApps.StorageUtil",
    kind: enyo.Object,
    
    /**
     * keyPrefix is used to identify localStorage entries belonging to this insatance
     */
    keyPrefix: "findApps.StorageUtil.",
    
    constructor: function(keyPrefix){
        this.inherited(arguments);
        this.keyPrefix = keyPrefix;
    },
    
    /**
     * a function to set a key/value pair in localStorage
     * that adds support for storing objects as well
     */
    set: function(key, value){
        if(typeof value === "object"){
            value = JSON.stringify(value);
        }
        localStorage.setItem(this.keyPrefix + key, value);
    },
    
    /**
     * a function to retrieve a value from localStorage
     * that adds support for retrieving objects as well
     */
    get: function(key){
        var rawItem = localStorage.getItem(this.keyPrefix + key);
        if(rawItem && rawItem.charAt(0)==="{"){
            return JSON.parse(rawItem);
        }else{
            return rawItem;
        }
    },
    
    /**
     * a function to remove a localStorage entry that belongs to this instance
     */
    remove: function(key){
        localStorage.removeItem(this.keyPrefix + key);
    },
    
    /**
     * a function to clear all entries that were created by this instance
     */
    clear: function(){
        for(var key in localStorage){
            if(findApps.StorageUtil.startsWith(key, this.keyPrefix)){
                localStorage.removeItem(key);
            }
        }
    }
});

/**
 * a helper function to check whether a string starts with a specific value
 */
findApps.StorageUtil.startsWith = function(subject, query){
    if(enyo.isString(subject) && enyo.isString(query)){
        if(subject.substr(0, query.length) === query){
            return true;
        }
    }
    return false;
};

/**
 * a static function to manage instances of findApps.StorageUtil
 */
findApps.StorageUtil.getInstance = function(keyPrefix){
    keyPrefix = keyPrefix || "_singleton";
    findApps.StorageUtil._pool = findApps.StorageUtil._pool || [];
    findApps.StorageUtil._pool[keyPrefix] = findApps.StorageUtil._pool[keyPrefix] || new findApps.StorageUtil(keyPrefix);
    return findApps.StorageUtil._pool[keyPrefix];
}
