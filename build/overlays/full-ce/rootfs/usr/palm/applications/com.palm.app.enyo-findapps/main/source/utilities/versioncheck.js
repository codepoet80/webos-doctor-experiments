/* Copyright 2009 Palm, Inc.  All rights reserved. */
enyo.kind({
    name: "findApps.VersionCheck",
    kind: enyo.Control,
    components: [],
/*
	 * This matches the Java version on the server.
	 * Return 0 is equal, NEG if s1 < s2, POS if s1 > s2
	 */
    compare: function(s1, s2) {
        if (s1 == null && s2 == null) {
            return 0;
        } else if (s1 == null) {
            return -1;
        } else if (s2 == null) {
            return 1;
        }
        var a1 = ('' + s1).split(/[^a-zA-Z0-9]+/);
        var a2 = ('' + s2).split(/[^a-zA-Z0-9]+/);
        var max = Math.min(a1.length, a2.length);
        for (var ii = 0; ii <= max; ii++) {
            if (ii == a1.length) {
                return (ii == a2.length ? 0 : -1);
            } else if (ii == a2.length) {
                return 1;
            }
            var i1 = this._parseInt(a1[ii]);
            var i2 = this._parseInt(a2[ii]);
            if (i1 != i2) {
                var r = i1 - i2;
                return r < 0 ? -1 : r > 0 ? 1 : 0;
            }
            i1 = a1[ii].toLowerCase();
            i2 = a2[ii].toLowerCase();
            if (i1 < i2) {
                return -1;
            } else if (i1 > i2) {
                return 1;
            }
        }
        return 0;
    },
    _parseInt: function(str) {
        if (str.search(/[^\D]/)) {
            return null;
        } else {
            return parseInt(str, 10);
        }
    }
});
findApps.Utilities.VersionCheck = findApps.Utilities.VersionCheck || new findApps.VersionCheck();
