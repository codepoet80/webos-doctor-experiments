findApps.Utilities = {
    oneSecond: 1000,
    oneMinute: 1000 * 60,
    oneHour: 1000 * 60 * 60,
    oneDay: 1000 * 60 * 60 * 24,
    
    formatStar: function(halfstars, idx) {
        halfstars -= 2 * idx;
        if (halfstars > 0) {
            if (halfstars > 1) {
                return 'full';
            } else {
                return 'half';
            }
        } else {
            return 'empty';
        }
    },
    contains: function(arr, val) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] == val) return true;
        }
        return false;
    },
    //this function is convert array of objects to a Map (associative array)
    array2Map: function(arr, mapKey) {
        var map = [];
        if (arr && arr.length) {
            for (var i=0;i<arr.length;i++) {
                var obj = arr[i];
                map[obj[mapKey]] = obj;
            }
        }
        return map;
    },
    findFirstMatch: function(map, keyArr){
        var match;
        var l = keyArr.length;
        for(var i=0;((i<l)&&!match);i++){
            match = map[keyArr[i]];
        }
        return match;
    },
    
    /**
     * best performance, collisions are likely to occure
     */
    getUUID: function(){
        return new Date().getTime() + Math.floor(Math.random()*0x1000000);
    },
    
    /**
     * moderate performance, very few collisions
     */
    getUUID2: function(){
        var s = [];
        var hexDigits = "0123456789ABCDEF";
        for (var i = 0; i < 32; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[12] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
        s[16] = hexDigits.substr((s[16] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
        var uuid = s.join("");
        return uuid;
    },
    
    /**
     * poor performance, collision chance is 1 in 2^^122
     */
    getUUID3: function(){
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    },
    
    getHashCode: function(str){
        var hash = 0;
        if (str.length == 0) return hash;
        for (var i=0;i<str.length;i++) {
            var ch = str.charCodeAt(i);
            hash = ((hash<<5)-hash)+ch;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    },
    getRandNumber: function() {
        return this.getUUID();
    },
    delFunc: function(scope, name, rand) {
        if (typeof scope[name + rand] === 'function') {
            delete scope[name + rand];
        }
    },
    
    Formatter: {
        formatCurrency: function(amount, locale) {
            if(locale) {
                locale = locale.toLowerCase();
                if (typeof(findApps.Utilities.Formatter._currencyFmt) === 'undefined' || locale !== findApps.Utilities.Formatter.purchasingLocale) {
                    findApps.Utilities.Formatter._currencyFmt = new enyo.g11n.NumberFmt({
                        locale: locale,
                        fractionDigits: 2,
                        style: "currency"
                    });
                    findApps.Utilities.Formatter.purchasingLocale = locale;
                }
                return findApps.Utilities.Formatter._currencyFmt.format(amount, {
                    style: "currency"
                });
            }
            else 
                return amount;
        },
        formatLongDate: function(date) {
            if (typeof(findApps.Utilities.Formatter._longDateFmt) === 'undefined') {
                findApps.Utilities.Formatter._longDateFmt = new enyo.g11n.DateFmt({
                    date: "long"
                });
            }
            return findApps.Utilities.Formatter._longDateFmt.format(date);
        },
        formatShortDate: function(date) {
            if (typeof(findApps.Utilities.Formatter._shortDateFmt) === 'undefined') {
                findApps.Utilities.Formatter._shortDateFmt = new enyo.g11n.DateFmt({
                    date: "short"
                });
            }
            return findApps.Utilities.Formatter._shortDateFmt.format(date);
        },
        formatRound: function(number) {
            if (typeof(findApps.Utilities.Formatter._roundFmt) === 'undefined') {
                findApps.Utilities.Formatter._roundFmt = new enyo.g11n.NumberFmt({
                    fractionDigits: 1
                });
            }
            return findApps.Utilities.Formatter._roundFmt.format(number);
        },
        formatRound2: function(number) {
            if (typeof(findApps.Utilities.Formatter._roundFmt) === 'undefined') {
                findApps.Utilities.Formatter._roundFmt = new enyo.g11n.NumberFmt({
                    fractionDigits: 2
                });
            }
            return findApps.Utilities.Formatter._roundFmt.format(number);
        },
        formatPercent: function(number) {
            if (typeof(findApps.Utilities.Formatter._percentFmt) === 'undefined') {
                findApps.Utilities.Formatter._percentFmt = new enyo.g11n.NumberFmt({
                    style: "percent"
                });
            }
            if (!number || number == undefined) number = 0;
            return findApps.Utilities.Formatter._percentFmt.format(number, {
                style: "percent"
            });
        },
        serverTimeFormat: function(date) {
            if (typeof(findApps.Utilities.Formatter._serverFmt) === 'undefined') {
                findApps.Utilities.Formatter._serverFmt = new enyo.g11n.DateFmt("yyyyMMddHHmmss");
            }
            return findApps.Utilities.Formatter._serverFmt.format(date);
        },
        getFullYear: function(date) {
            if (typeof(findApps.Utilities.Formatter._dateFullYear) === 'undefined') {
                findApps.Utilities.Formatter._dateFullYear = new enyo.g11n.DateFmt("yyyy");
            }
            return findApps.Utilities.Formatter._dateFullYear.format(date);
        },
        getLongMonth: function(date) {
            if (typeof(findApps.Utilities.Formatter._dateMonth) === 'undefined') {
                findApps.Utilities.Formatter._dateMonth = new enyo.g11n.DateFmt("MMM");
            }
            return findApps.Utilities.Formatter._dateMonth.format(date);
        },
        formatPhoneNumber: function(phoneNumber) {
            if (typeof(findApps.Utilities.Formatter._phoneFmt) === 'undefined') {
                findApps.Utilities.Formatter._phoneFmt = new enyo.g11n.PhoneFmt();
            }
            return findApps.Utilities.Formatter._phoneFmt.format(phoneNumber);
        },
        getShortMonth: function(date, format) {
            if (typeof(findApps.Utilities.Formatter._dateShortMonth) === 'undefined') {
                findApps.Utilities.Formatter._dateShortMonth = new enyo.g11n.DateFmt("MM");
            }
            return findApps.Utilities.Formatter._dateShortMonth.format(date);
        }
    }
};

findApps.Utilities.CommonHandler = findApps.Utilities.CommonHandler || new findApps.CommonHandler();