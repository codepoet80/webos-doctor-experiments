/* Target registry.
 *
 * Owns the list of available backup destinations and hands the engines the one
 * the user selected. Adding a Synergy cloud target later is a matter of
 * implementing TargetBase and adding one entry to FACTORIES — the backup and
 * restore handlers never learn that anything changed.
 */
/*global Future, LocalTarget, logger, prefs, mapFuture */

var targets = (function () {
    var that = {};

    /**
     * id -> factory. A factory takes the prefs object and returns a target.
     */
    var FACTORIES = {
        local: function (preferences) {
            return new LocalTarget(preferences.localRoot);
        }
        // synergy: function (preferences) { return new SynergyTarget(...); }
    };

    var DEFAULT_ID = "local";

    /**
     * The target the user selected, falling back to local if their choice is
     * no longer registered (an uninstalled connector, say).
     */
    that.getCurrent = function () {
        var future = prefs.get();
        future.then(this, function (f) {
            var preferences = f.result;
            var id = preferences.targetId || DEFAULT_ID;
            var factory = FACTORIES[id];

            if (!factory) {
                logger.warn("Unknown target", id + ", falling back to", DEFAULT_ID);
                factory = FACTORIES[DEFAULT_ID];
            }
            f.result = factory(preferences);
        });
        return future;
    };

    /**
     * Every registered target with its availability, for the destination
     * picker.
     */
    that.list = function () {
        var ids = [];
        for (var id in FACTORIES) {
            if (FACTORIES.hasOwnProperty(id)) {
                ids.push(id);
            }
        }

        var preferences;
        var selectedId;

        var future = prefs.get();
        future.then(this, function (f) {
            preferences = f.result;
            selectedId = preferences.targetId || DEFAULT_ID;

            f.nest(mapFuture(ids, function (targetId) {
                var target = FACTORIES[targetId](preferences);
                var available = target.isAvailable();
                available.then(this, function (af) {
                    var isAvailable = af.result;
                    af.result = {
                        id:          target.id,
                        label:       target.label,
                        description: target.getDescription(),
                        available:   isAvailable === true,
                        selected:    target.id === selectedId
                    };
                });
                return available;
            }));
        });
        future.then(this, function (f) {
            var result = f.result;
            f.result = { targets: result, selected: selectedId };
        });
        return future;
    };

    that.isKnown = function (id) {
        return FACTORIES.hasOwnProperty(id);
    };

    return that;
}());
