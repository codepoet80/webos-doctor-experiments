/* Destination selection.
 *
 * Today the only registered target is local storage. These two methods exist
 * now so the UI's destination row is real from the start, and so adding a
 * Synergy connector later needs no new bus surface.
 */
/*global logger, prefs, targets */

function ListTargetsAssistant() {
    this.run = function (future) {
        var list = targets.list();
        list.then(this, function (f) {
            var result = f.result;
            f.result = {
                returnValue: true,
                targets:     result.targets,
                selected:    result.selected
            };
        });
        future.nest(list);
    };
}

function SetTargetAssistant() {
    this.run = function (future) {
        var targetId = this.controller.args.targetId;
        if (!targetId) {
            throw new Error("targetId is required");
        }
        if (!targets.isKnown(targetId)) {
            throw new Error("Unknown target: " + targetId);
        }

        logger.log("Switching target to", targetId);
        var set = prefs.setTargetId(targetId);
        set.then(this, function (f) {
            var result = f.result;
            f.result = { returnValue: true, selected: targetId };
        });
        future.nest(set);
    };
}
