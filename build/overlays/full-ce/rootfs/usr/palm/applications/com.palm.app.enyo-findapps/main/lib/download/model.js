enyo.kind({
    name: "findApps.Model",
    kind: enyo.Object,
    constructor: function() {
        this._observers = new Array();
        this.inherited(arguments);
    },
    // adds observer to the list
    attach: function(observer) {
        this._observers.push(observer);
    },
    // removes observer from the list
    detach: function(observer) {
        for (var i = 0; i < this._observers.length; i++) {
            if (this._observers[i] === observer) {
                this._observers.splice(i, 1);
            }
        }
    },
    notify: function(methodName, args) {
        for (var i = 0; i < this._observers.length; i++) {
            var target = this._observers[i]
            if (target && target[methodName]) target[methodName].apply(target, args)
        }
    }
});
