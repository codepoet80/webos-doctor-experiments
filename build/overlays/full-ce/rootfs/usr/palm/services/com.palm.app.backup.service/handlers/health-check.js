/*global logger */

function HealthCheckAssistant() {
    this.run = function (future) {
        future.result = { returnValue: true, ack: true };
    };
}
