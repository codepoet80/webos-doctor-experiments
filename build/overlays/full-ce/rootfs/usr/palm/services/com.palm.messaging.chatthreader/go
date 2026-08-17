#!/usr/bin/env node

/*jslint debug: true, white: true, onevar: true, undef: true, eqeqeq: true, bitwise: true,
regexp: true, newcap: true, immed: true, nomen: false, maxerr: 500 */

/*global console, exports, global, IMPORTS:true, palmGetResource, MojoLoader: true, include */

try {
    var require = IMPORTS.require;
} catch (e) {
    IMPORTS = {require: require};
    var require = IMPORTS.require;
}

if (!process.env.NODE_PATH || process.env.NODE_PATH.indexOf("/usr/palm/frameworks") === -1) {
    console.error("go says: /usr/palm/frameworks is *not* in your NODE_PATH; this may be a very short trip.");
}

if (global.exports === undefined) {
    global.exports = {};
    console.log("'exports' was not defined: " + JSON.stringify(exports));
} else {
    console.log("'exports' was already defined: " + JSON.stringify(exports));
}

function fetchGlobalOrRequire(name) {
    return global[name] ? global[name] : require(name);
}

var fs = fetchGlobalOrRequire('fs');
var webos = fetchGlobalOrRequire('webos');
var path = require('path');

MojoLoader = require('mojoloader');

var loadall;

function fileExists(filename) {
    var stat;
    try {
        stat = fs.statSync(filename);
    } catch (e) {
//      console.log("fileExists(): error: " + JSON.stringify(e));
        return false;
    }
    return stat.isFile();
}

function loadMocks() {
    try {
        var i,
            mockRoot = "spec/unit/source/mock/",
            mockFiles = fs.readdirSync(mockRoot);

        mockFiles = mockFiles.filter(function (file) {
            var oneMock = path.join(mockRoot, file);
            return fileExists(oneMock);
        });
        for (i = 0; i < mockFiles.length; ++i) {
            webos.include(path.join(mockRoot, mockFiles[i]));
        }
    } catch (e) {
        console.log("No loadable mock files. (" + (e.stack || e._stack || e.toString()) + ")");
    }
}

function loadManifest() {
    var manifest = JSON.parse(fs.readFileSync("manifest.json")),
        i,
        entry,
        files = manifest.files.javascript;

    // console.log("manifest: " + JSON.stringify(manifest));
    loadall = true;

    for (i = 0; i < files.length; ++i) {
        // console.log("include(" + files[i] + ")");
        entry = "javascript/" + files[i];
        console.log("Loading source: " + entry);
        webos.include(entry);
    }

    IMPORTS.require = IMPORTS.require || require;
}

function loadSources() {
    var sources = JSON.parse(fs.readFileSync("sources.json")),
        i,
        file,
        libname;

    for (i = 0; i < sources.length; ++i) {
        file = sources[i];
        if (file.source) {
            console.log("Loading source: " + file.source);
            webos.include(file.source);
        } else if (file.library) {
            console.log("Loading library: " + JSON.stringify(file));
            libname = MojoLoader.builtinLibName(file.library.name, file.library.version);
            if (!global[libname]) {
                IMPORTS[file.library.name] = MojoLoader.require(file.library)[file.library.name];
            }
            else
            {
                IMPORTS[file.library.name] = global[libname];
            }
        } else {
            console.log("Unknown element: " + JSON.stringify(file));
        }
    }

    IMPORTS.require = IMPORTS.require || require;
}

if (!loadall) {
    loadall = true;

    loadMocks();
    if (fileExists("sources.json")) {
        loadSources();
    } else if (fileExists("manifest.json")) {
        loadManifest();
    } else {
        console.error("Failed to specify either sources.json or manifest.json!");
    }
}

require('jasmine-node/lib/jasmine-node/cli.js');