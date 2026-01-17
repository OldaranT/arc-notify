"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventMessage = void 0;
var EventMessage = /** @class */ (function () {
    function EventMessage(data) {
        this.name = data.name;
        this.map = data.map;
        this.icon = data.icon;
        this.startTime = new Date(data.startTime);
        this.endTime = new Date(data.endTime);
        this.key = "".concat(this.name, "-").concat(this.startTime.getTime(), "-").concat(this.endTime.getTime());
    }
    return EventMessage;
}());
exports.EventMessage = EventMessage;
