enyo.kind({
    name: "findApps.CacheUtil",
    kind: enyo.Object,
    
    published: {
        enabled: false
    }
    
});

enyo.kind({
    name: "findApps.TransientCache",
    kind: findApps.CacheUtil,
    
    cache: [],
    
    /**
     * a function to clear an entry or the whole cache array
     */
    clear: function(key){
        if(!this.enabled)return;
        
        if(key){
            this.cache[key] = undefined;
        } else {
            this.cache = [];  
        }
    },
    
    /**
     * a function to test if a cache entry has expired
     */
    isExpired: function(key){
        if(!this.enabled)return;
        
        var cached = this.cache[key];
        if(cached){
            if(new Date().getTime() < cached.expires.getTime()){
                return false;
            }else{
                this.clear(key);
            }
        }
        return true;
    },
    
    /**
     * a function to update or create a cache entry
     * 
     * expires param is mandatory to create a new entry
     */
    set: function(key, expires, value){
        if(!this.enabled)return;
        
        if(this.isExpired(key)){
            //if entry does not exist or expired then expires is mandatory
            if(expires && expires.getTime){// check if expires is a valid date object
                this.cache[key] = {
                    expires: expires,
                    value: value
                };
            }
        }else{
            var cached = this.cache[key];
            //if entry already exists then just update values
            cached.expires = expires?expires:cached.expires
            cached.value = value?value:cached.value
        }
    },
    
    /**
     * a function to retrieve a cache entry if not expired
     */
    get: function(key) {
        if(!this.enabled)return;
        
        if(!this.isExpired(key)){
            return this.cache[key].value;
        }
    }
    
});

enyo.kind({
    name: "findApps.PersistentCache",
    kind: findApps.CacheUtil,
    
    constructor: function(cacheId){
        this.inherited(arguments);
        this.storageUtil = findApps.StorageUtil.getInstance(cacheId);
    },
    
    /**
     * a function to clear an entry or the whole cache array
     */
    clear: function(key){
        if(!this.enabled)return;
        
        if(key){
            this.storageUtil.remove(key);
        } else {
            this.storageUtil.clear();  
        }
    },
    
    /**
     * a function to test if a cache entry has expired
     */
    isExpired: function(key){
        if(!this.enabled)return;
        
        var item = this.storageUtil.get(key);
        if(item && item.expires){
            item.expires = new Date(item.expires);
            if(new Date().getTime() < item.expires.getTime()){
                return false;
            }else{
                this.clear(key);
            }
        }
        return true;
    },
    
    /**
     * a function to update or create a cache entry
     * 
     * expires param is mandatory to create a new entry
     */
    set: function(key, expires, value){
        if(!this.enabled)return;
        
        if(this.isExpired(key)){
            //if entry does not exist or expired then expires is mandatory
            if(expires && expires.getTime){// check if expires is a valid date object
                this.storageUtil.set(key, {
                    expires: expires,
                    value: value
                });
            }
        } else {
            //if entry already exists then just update values
            var cached = this.storageUtil.get(key);
            cached.expires = new Date(cached.expires);
            cached.expires = expires?expires:cached.expires;
            cached.value = value?value:cached.value;
            this.storageUtil.set(key, cached);
        }
    },
    
    /**
     * a function to retrieve a cache entry if not expired
     */
    get: function(key) {
        if(!this.enabled)return;
        
        if(!this.isExpired(key)){
            return this.storageUtil.get(key).value;
        }
    }
    
});

findApps.CacheUtil.getInstance = function(cacheId, persistent){
    cacheId = cacheId || "_singleton";
    findApps.CacheUtil._pool = findApps.CacheUtil._pool || [];
    findApps.CacheUtil._pool[cacheId] = findApps.CacheUtil._pool[cacheId] || (persistent?new findApps.PersistentCache(cacheId):new findApps.TransientCache());
    return findApps.CacheUtil._pool[cacheId];
}

findApps.CacheUtil.destroy = function() {
	findApps.CacheUtil._pool = null;
}
