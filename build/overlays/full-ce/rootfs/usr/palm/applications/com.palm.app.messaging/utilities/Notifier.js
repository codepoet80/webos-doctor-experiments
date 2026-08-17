var Notifier = function(data) {
	this._listeners = {};
	this._data = data;
};

Notifier.prototype.register = function(listener, callback) {
	this._listeners[listener] = callback;
	callback(this._data);
};

Notifier.prototype.unregister = function(listener) {
	if (this._listeners[listener]) {
		delete this._listeners[listener];
	}
};

Notifier.prototype.notify = function(data){
	this._data = data;
	for (key in this._listeners) {
		try {
			this._listeners[key](this._data);
		} 
		catch (e) {
			enyo.warn("Unable to notify preferences listener");
		}
	}
};
