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
exports.RoleReactionService = void 0;
var fs_1 = require("fs");
var path_1 = require("path");
var RoleReactionService = /** @class */ (function () {
    function RoleReactionService(guild, channel) {
        var _this = this;
        this.guild = guild;
        this.channel = channel;
        this.filePath = path_1.default.resolve('src/config/roles.json');
        var json = fs_1.default.existsSync(this.filePath) ? JSON.parse(fs_1.default.readFileSync(this.filePath, 'utf-8')) : {};
        this.roles = new Map();
        Object.entries(json).forEach(function (_a) {
            var name = _a[0], data = _a[1];
            _this.roles.set(name, { name: name, roleId: data.roleId, emoji: data.emoji, icon: data.icon });
        });
        console.log('[RoleReactionService] Loaded roles:', Array.from(this.roles.keys()));
        this.registerReactionListeners();
    }
    RoleReactionService.prototype.registerReactionListeners = function () {
        var _this = this;
        var handleReaction = function (reaction, user) { return __awaiter(_this, void 0, void 0, function () {
            var err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        if (!this.message)
                            return [2 /*return*/];
                        if (!reaction.partial) return [3 /*break*/, 2];
                        return [4 /*yield*/, reaction.fetch()];
                    case 1:
                        reaction = _a.sent();
                        _a.label = 2;
                    case 2:
                        if (!reaction.message || reaction.message.id !== this.message.id)
                            return [2 /*return*/];
                        if (user.bot)
                            return [2 /*return*/];
                        console.log("[RoleReactionService] Syncing roles for ".concat(user.tag));
                        return [4 /*yield*/, this.syncMemberRoles(user)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        err_1 = _a.sent();
                        console.error('❌ Error handling reaction:', err_1);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        this.guild.client.on('messageReactionAdd', handleReaction);
        this.guild.client.on('messageReactionRemove', handleReaction);
    };
    RoleReactionService.prototype.syncMemberRoles = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var member, userReactions, _i, _a, role, hasRole, shouldHave, err_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.message)
                            return [2 /*return*/];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 9, , 10]);
                        return [4 /*yield*/, this.guild.members.fetch(user.id)];
                    case 2:
                        member = _b.sent();
                        userReactions = this.message.reactions.cache
                            .filter(function (r) { return r.users.cache.has(user.id); })
                            .map(function (r) { return r.emoji.name; });
                        _i = 0, _a = this.roles.values();
                        _b.label = 3;
                    case 3:
                        if (!(_i < _a.length)) return [3 /*break*/, 8];
                        role = _a[_i];
                        hasRole = member.roles.cache.has(role.roleId);
                        shouldHave = userReactions.includes(role.emoji);
                        if (!(shouldHave && !hasRole)) return [3 /*break*/, 5];
                        return [4 /*yield*/, member.roles.add(role.roleId).catch(console.error)];
                    case 4:
                        _b.sent();
                        console.log("\u2705 Added role ".concat(role.name, " to ").concat(member.user.tag));
                        return [3 /*break*/, 7];
                    case 5:
                        if (!(!shouldHave && hasRole)) return [3 /*break*/, 7];
                        return [4 /*yield*/, member.roles.remove(role.roleId).catch(console.error)];
                    case 6:
                        _b.sent();
                        console.log("\u274C Removed role ".concat(role.name, " from ").concat(member.user.tag));
                        _b.label = 7;
                    case 7:
                        _i++;
                        return [3 /*break*/, 3];
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        err_2 = _b.sent();
                        console.error('❌ Failed to sync member roles:', err_2);
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    RoleReactionService.prototype.postReactionRoleMessage = function (existingMessageId) {
        return __awaiter(this, void 0, void 0, function () {
            var embed, fetchedMessages, existing, previous, _i, _a, msg, _b, currentReactions, _c, _d, role;
            var _this = this;
            var _e, _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        console.log('[RoleReactionService] Posting reaction role message...');
                        embed = {
                            title: 'Self-Assign Event Roles',
                            description: 'React to get/remove roles for events!',
                            color: 0x3498db,
                            fields: Array.from(this.roles.values()).map(function (role) { return ({
                                name: "".concat(role.emoji, " ").concat(role.name),
                                value: '\u200b',
                                inline: true,
                            }); }),
                        };
                        return [4 /*yield*/, this.channel.messages.fetch({ limit: 50 })];
                    case 1:
                        fetchedMessages = _g.sent();
                        console.log("[RoleReactionService] Fetched ".concat(fetchedMessages.size, " messages from channel"));
                        // Try reuse by existingMessageId
                        if (existingMessageId) {
                            existing = fetchedMessages.get(existingMessageId);
                            if (existing)
                                this.message = existing;
                        }
                        // Else try first previous bot embed
                        if (!this.message) {
                            previous = fetchedMessages.find(function (m) { var _a; return m.author.id === ((_a = _this.guild.client.user) === null || _a === void 0 ? void 0 : _a.id) && m.embeds.length > 0; });
                            if (previous)
                                this.message = previous;
                        }
                        _i = 0, _a = fetchedMessages.values();
                        _g.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                        msg = _a[_i];
                        if (!(msg.author.id === ((_e = this.guild.client.user) === null || _e === void 0 ? void 0 : _e.id) && msg.id !== ((_f = this.message) === null || _f === void 0 ? void 0 : _f.id))) return [3 /*break*/, 4];
                        return [4 /*yield*/, msg.delete().catch(function () { })];
                    case 3:
                        _g.sent();
                        console.log("[RoleReactionService] Deleted old bot message ".concat(msg.id));
                        _g.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        if (!this.message) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.message.edit({ embeds: [embed] })];
                    case 6:
                        _g.sent();
                        console.log("[RoleReactionService] Edited existing embed message ".concat(this.message.id));
                        return [3 /*break*/, 9];
                    case 7:
                        _b = this;
                        return [4 /*yield*/, this.channel.send({ embeds: [embed] })];
                    case 8:
                        _b.message = _g.sent();
                        console.log("[RoleReactionService] Sent new embed message ".concat(this.message.id));
                        _g.label = 9;
                    case 9:
                        currentReactions = this.message.reactions.cache.map(function (r) { return r.emoji.name; });
                        _c = 0, _d = this.roles.values();
                        _g.label = 10;
                    case 10:
                        if (!(_c < _d.length)) return [3 /*break*/, 13];
                        role = _d[_c];
                        if (!!currentReactions.includes(role.emoji)) return [3 /*break*/, 12];
                        return [4 /*yield*/, this.message.react(role.emoji).catch(console.error)];
                    case 11:
                        _g.sent();
                        console.log("[RoleReactionService] Reacted with ".concat(role.emoji));
                        _g.label = 12;
                    case 12:
                        _c++;
                        return [3 /*break*/, 10];
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    RoleReactionService.prototype.addRole = function (name, roleId, emoji, icon) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.roles.set(name, { name: name, roleId: roleId, emoji: emoji, icon: icon });
                        fs_1.default.writeFileSync(this.filePath, JSON.stringify(Object.fromEntries(this.roles), null, 2), 'utf-8');
                        console.log("[RoleReactionService] Added role ".concat(name));
                        return [4 /*yield*/, this.postReactionRoleMessage((_a = this.message) === null || _a === void 0 ? void 0 : _a.id)];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    RoleReactionService.prototype.getAllRoles = function () {
        return Array.from(this.roles.values());
    };
    return RoleReactionService;
}());
exports.RoleReactionService = RoleReactionService;
