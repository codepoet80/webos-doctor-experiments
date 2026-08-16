/**
 NOTES:
 - This file is meant to hold all hacks used to make teh app operational.
 
 TODOs:
 - File enyo Framework bug for HACK_ENYO_DEFAULT_GUI_EVENT_HANDLER.
 **/
var HACKS = {
    HACK_ENYO_DEFAULT_GUI_EVENT_HANDLER: function HACK_ENYO_DEFAULT_GUI_EVENT_HANDLER(handler) {
        /*	NOTE:

			This HACK ensures that enyo will use the specified handler as
			its default GUI event handler by modifying the enyo.master
			components list so that the specified handler is first.

			This is necessary because as of version 0.5 enyo still defaults
			to the first created component to handle "back" and "appMenu"
			events and it's unreasonable to expect app author's to
			continuously reorder/defer component instantiation to ensure
			that the designed component will be used.

			Problematic code exists at enyo.Scrim:13 and enyo.Dispatcher:48.
		*/
        var m = enyo.master,
            mcs = handler && m.getComponents(),
            end = mcs ? mcs.length : 0,
            nxt = -1;
        while ((++nxt < end) && (mcs[nxt] != handler)) { // While the list isn't empty and handler hasn't been found
            m.removeComponent(mcs[nxt]); // move the next component
            m.addComponent(mcs[nxt]); // to the back of the list.
        }
    } //END:HACK_ENYO_DEFAULT_GUI_EVENT_HANDLER()
}; //END:HACKS={...}
