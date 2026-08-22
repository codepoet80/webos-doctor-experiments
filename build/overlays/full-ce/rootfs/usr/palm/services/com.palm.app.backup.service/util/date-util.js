/* Date formatting helpers.
 *
 * Ported verbatim from com.palm.service.backup/util/date-util.js. Manifests keep
 * the RFC 1123 format so a woce-backup manifest stays comparable with a stock one.
 */
var dateUtil = (function () {
    var that = {};

    var DAYS   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    var pad = function (n) {
        return n < 10 ? '0' + n : n;
    };

    // RFC 1123, the date format used throughout the HTTP spec and in manifests.
    that.formatDateRfc1123 = function (d) {
        if (!d) {
            throw new Error("date can't be null or undefined");
        }
        return DAYS[d.getUTCDay()] + ", " +
            pad(d.getUTCDate()) + " " +
            MONTHS[d.getUTCMonth()] + " " +
            d.getUTCFullYear() + " " +
            pad(d.getUTCHours()) + ":" +
            pad(d.getUTCMinutes()) + ":" +
            pad(d.getUTCSeconds()) + " GMT";
    };

    // ISO 8601, the format the Activity Manager expects for schedules.
    that.formatDateIso8601 = function (d) {
        if (!d) {
            throw new Error("date can't be null or undefined");
        }
        return d.getUTCFullYear() + "-" +
            pad(d.getUTCMonth() + 1) + "-" +
            pad(d.getUTCDate()) + " " +
            pad(d.getUTCHours()) + ":" +
            pad(d.getUTCMinutes()) + ":" +
            pad(d.getUTCSeconds()) + "Z";
    };

    that.isValid = function (d) {
        return d ? !isNaN(d.getTime()) : false;
    };

    return that;
}());
