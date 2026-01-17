"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventRole = void 0;
var EventRole = /** @class */ (function () {
    function EventRole(role) {
        this.id = role.id;
        this.name = role.name;
    }
    EventRole.fromGuild = function (roleName, roles) {
        var role = roles.find(function (r) { return r.name === roleName; });
        return role ? new EventRole(role) : null;
    };
    Object.defineProperty(EventRole.prototype, "mention", {
        get: function () {
            return "<@&".concat(this.id, ">");
        },
        enumerable: false,
        configurable: true
    });
    return EventRole;
}());
exports.EventRole = EventRole;
