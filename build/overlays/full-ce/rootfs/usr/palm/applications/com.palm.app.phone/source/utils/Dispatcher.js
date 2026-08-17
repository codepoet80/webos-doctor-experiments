// helper stores a collection of callbacks
enyo.kind({
	name:"Utils.Dispatcher",
	kind: enyo.Component,
	published: {
		// delays dipatching a call. If two dispatches happen within this window, only the second
		// will be actually dispatched. This only works if you know that the second call will have
		// all the information of the first, such as broadcasting 
		delay: 0
	},
	create: function() {
		this.inherited(arguments);
		this.callbacks = [];
	},
	destroy: function() {
		enyo.job.stop(this.id + "delayDispatch");
		this.inherited(arguments);
	},
	add: function(cb) {
		this.callbacks.push(cb);
	},
	remove: function(cb) {
		enyo.remove(cb, this.callbacks);
	},
	dispatch: function(/*variable arguments*/) {
		if ( this.delay ) {
			//if ( enyo.job._jobs[this.id + "delayDispatch"] ) {
			//	enyo.log("ignoring previous dispatch")
			//}
			enyo.job(this.id + "delayDispatch", enyo.bind(this, function(args){
				this._dispatch.apply(this,args);
			}, arguments), this.delay);
		} else {
			this._dispatch.apply(this,arguments);
		}
		
	},
	_dispatch: function(/*variable arguments*/) {
		var args = enyo.cloneArray(arguments);
		this.callbacks.forEach(function(cb) {
			cb.apply(undefined, args)
		});
	}
});
