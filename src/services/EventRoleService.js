"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventRoleService = void 0;
var fs_1 = require("fs");
var path_1 = require("path");
var defaultEmojis = ['🌑', '🛡️', '❄️', '🌙', '⚡', '🔥', '🌊', '💀', '🪐', '🔒', '🟢', '🔴'];
var EventRoleService = /** @class */ (function () {
    function EventRoleService(guild, roleReactionService) {
        this.guild = guild;
        this.rolesFile = path_1.default.resolve('src/config/roles.json');
        this.roles = fs_1.default.existsSync(this.rolesFile)
            ? JSON.parse(fs_1.default.readFileSync(this.rolesFile, 'utf-8'))
            : {};
        this.roleReactionService = roleReactionService;
    }
    EventRoleService.prototype.resolve = function (eventName, icon) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, role, _a, emoji;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        existing = this.roles[eventName];
                        role = null;
                        if (!(existing === null || existing === void 0 ? void 0 : existing.roleId)) return [3 /*break*/, 4];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.guild.roles.fetch(existing.roleId)];
                    case 2:
                        role = _b.sent();
                        if (!role)
                            delete this.roles[eventName];
                        return [3 /*break*/, 4];
                    case 3:
                        _a = _b.sent();
                        role = null;
                        delete this.roles[eventName];
                        return [3 /*break*/, 4];
                    case 4:
                        if (!!role) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.guild.roles.create({ name: eventName, mentionable: true })];
                    case 5:
                        role = _b.sent();
                        emoji = (existing === null || existing === void 0 ? void 0 : existing.emoji) || defaultEmojis[Object.keys(this.roles).length % defaultEmojis.length];
                        this.roles[eventName] = { roleId: role.id, emoji: emoji, icon: icon };
                        fs_1.default.writeFileSync(this.rolesFile, JSON.stringify(this.roles, null, 2), 'utf-8');
                        if (!this.roleReactionService) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.roleReactionService.addRole(eventName, role.id, emoji, icon)];
                    case 6:
                        _b.sent();
                        _b.label = 7;
                    case 7: return [2 /*return*/, role.id];
                }
            });
        });
    };
    EventRoleService.prototype.ensureRolesExist = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, name_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _i = 0, _a = Object.keys(this.roles);
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        name_1 = _a[_i];
                        return [4 /*yield*/, this.resolve(name_1, this.roles[name_1].icon)];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    EventRoleService.prototype.getAllRoles = function () {
        return this.roles;
    };
    return EventRoleService;
}());
exports.EventRoleService = EventRoleService;
