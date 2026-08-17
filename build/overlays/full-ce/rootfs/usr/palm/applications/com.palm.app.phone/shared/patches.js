/* This file includes functions that should be included in the framework */

// enyo needs a way to override global $L package
if ( enyo.application.localeOverride ){
	$L._resources = new enyo.g11n.Resources({locale: enyo.application.localeOverride});
}

enyo.require = function(assertion, message) {
	if ( ! assertion ) {
		enyo.error(message);
		throw message;
	}
};

enyo.assert = function(assertion, message) {
	if ( ! assertion ) {
		enyo.error(message);
	}
};

// workaround DFISH-4343
enyo.gesture.holdDelay = 500;

// workaround DFISH-4578
if ( ! window.PalmSystem ) {
	setTimeout(function() {
		window.frameElement && (window.frameElement.style.display = "");
	},2000)
}

// BIG HACK
// The phone app has a need to create owner-less components such that
// it doesn't need to call destroy() to completely remove references
// to an instance of this component. This is hack to fake out the owner
// of the component and set wantsEvents:false so no global references
// can be stored to this instance.
// Ideal solution: kinds that inherit from this should be used in a way
// that guarantees that destroy() is always called before the reference is lost.
enyo.kind({
	name: "OrphanedComponent",
	kind: enyo.Component,
	wantsEvents: false,
	create: function() {
		this.owner = {
			addComponent: function() {},
			removeComponent: function() {},
			getId: function() { return ""; }
		}
		this.inherited(arguments);
	}
});
