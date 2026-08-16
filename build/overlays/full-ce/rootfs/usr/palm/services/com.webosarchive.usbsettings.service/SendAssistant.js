// send -- app -> daemon. Most commands write one whitelisted word to the control
// file; "watch-on" instead refreshes a keepalive file (a timestamp) that tells
// the daemon to run the device monitor while the panel is open, and "watch-off"
// deletes it to stop the monitor at once.
//
// Why watch-off exists: the device monitor GRABS input devices exclusively
// (EVIOCGRAB) to show the "input received" indicator, and a grabbed controller
// delivers events to nobody else -- so a game launched while this panel is still
// watching gets a dead pad. Letting the keepalive merely go stale would leave
// the grab in place for the staleness window, which is long enough to lose the
// race with a game starting right behind us. Deleting the file releases on the
// daemon's very next tick.
if (typeof require === "undefined") { require = IMPORTS.require; }
var fs = require("fs");

var CONTROL = "/media/internal/.usbctl-control";
var WATCH   = "/media/internal/.usbctl-watch";
var ALLOWED = {
    "otg-host": 1, "otg-peripheral": 1,
    "power-on": 1, "power-off": 1,
    "mount": 1, "unmount": 1,
    "reset": 1, "refresh": 1
};

var SendAssistant = function() {};

SendAssistant.prototype.run = function(future) {
    var cmd = this.controller.args && this.controller.args.command;

    // keepalive: refresh the watch file with epoch-seconds; not a daemon command
    if (cmd === "watch-on") {
        try {
            fs.writeFileSync(WATCH, String(Math.floor((new Date()).getTime() / 1000)));
            future.result = { returnValue: true, command: cmd };
        } catch (e) {
            future.result = { returnValue: false, errorText: String(e) };
        }
        return;
    }

    // Release now: drop the keepalive so the daemon stops the monitor (and with
    // it the exclusive grab) on its next tick. Treat "already gone" as success --
    // this gets called on every deactivate, including ones where we never
    // started watching.
    if (cmd === "watch-off") {
        try {
            if (fs.existsSync(WATCH)) { fs.unlinkSync(WATCH); }
            future.result = { returnValue: true, command: cmd };
        } catch (e) {
            future.result = { returnValue: false, errorText: String(e) };
        }
        return;
    }

    if (!cmd || !ALLOWED[cmd]) {
        future.result = { returnValue: false, errorText: "unknown command" };
        return;
    }
    try {
        fs.writeFileSync(CONTROL, cmd);
        future.result = { returnValue: true, command: cmd };
    } catch (e) {
        future.result = { returnValue: false, errorText: String(e) };
    }
};
