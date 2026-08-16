enyo.kind({
    name: "findApps.UTCDate",
    kind: enyo.Component,
    components: [],
    parse: function(date) {
        var d = new Date();
        d.setUTCFullYear(date.substring(0, 4) - 0, date.substring(5, 7) - 1, date.substring(8, 10) - 0);
        d.setUTCHours(date.substring(11, 13));
        d.setUTCMinutes(date.substring(14, 16));
        return d;
    },
    shortDate: function(d) {
        return "" + d.getUTCFullYear() + (d.getUTCMonth() + 1).toPaddedString(2) + d.getUTCDate().toPaddedString(2) + d.getUTCHours().toPaddedString(2) + d.getUTCMinutes().toPaddedString(2) + d.getUTCSeconds().toPaddedString(2);
    }
});
