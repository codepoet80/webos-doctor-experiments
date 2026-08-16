// getStatus -- read the daemon's status file (+ the device monitor's device
// list) and return them to the app.
// Node on webOS is v0.2.x (ES5 only); pull require from IMPORTS.
if (typeof require === "undefined") { require = IMPORTS.require; }
var fs = require("fs");

var STATUS  = "/media/internal/.usbctl-status";
var DEVICES = "/media/internal/.usbctl-devices";
var DEV_FRESH_MS = 6000;   // ignore a stale list if the monitor died/left a file

var GetStatusAssistant = function() {};

GetStatusAssistant.prototype.run = function(future) {
    var out = {
        returnValue: true,
        daemon: false,
        otg: "peripheral",
        power: "off",
        storage: { present: false, mounted: false, dev: "", mountpoint: "" },
        devices: []
    };
    try {
        var raw = fs.readFileSync(STATUS, "utf8");
        var obj = JSON.parse((typeof raw === "string") ? raw : raw.toString());
        out.daemon = true;
        if (obj.otg) { out.otg = obj.otg; }
        if (obj.power) { out.power = obj.power; }
        if (obj.storage) { out.storage = obj.storage; }
    } catch (e) {
        out.daemon = false;
    }

    // device list from usbdevmon -- only if fresh (the monitor runs while the
    // panel is open; a stale file means it stopped, so show nothing).
    try {
        var age = (new Date()).getTime() - fs.statSync(DEVICES).mtime.getTime();
        if (age >= 0 && age < DEV_FRESH_MS) {
            var draw = fs.readFileSync(DEVICES, "utf8");
            var dobj = JSON.parse((typeof draw === "string") ? draw : draw.toString());
            if (dobj && dobj.devices && dobj.devices.length) { out.devices = dobj.devices; }
        }
    } catch (e2) {
        // no/stale/unreadable device file -> empty list
    }

    future.result = out;
};
