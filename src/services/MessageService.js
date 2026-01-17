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
exports.MessageService = void 0;
var discord_js_1 = require("discord.js");
var MessageService = /** @class */ (function () {
    function MessageService(channel) {
        this.channel = channel;
    }
    /**
     * Creates or replaces a global notify message ONLY if the event changed.
     * Uses Discord relative timestamps so messages do not need polling updates.
     */
    MessageService.prototype.sendOrReplace = function (state, current, next, role) {
        return __awaiter(this, void 0, void 0, function () {
            var old, _a, embeds, durationMin, msg;
            var _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        // If nothing changed, do nothing
                        if (state &&
                            state.currentKey === ((_b = current === null || current === void 0 ? void 0 : current.key) !== null && _b !== void 0 ? _b : null) &&
                            state.nextKey === next.key) {
                            return [2 /*return*/, state];
                        }
                        if (!(state === null || state === void 0 ? void 0 : state.messageId)) return [3 /*break*/, 5];
                        _f.label = 1;
                    case 1:
                        _f.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.channel.messages.fetch(state.messageId)];
                    case 2:
                        old = _f.sent();
                        return [4 /*yield*/, old.delete()];
                    case 3:
                        _f.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        _a = _f.sent();
                        return [3 /*break*/, 5];
                    case 5:
                        embeds = [];
                        /* ---------------- CURRENT EVENT ---------------- */
                        if (current) {
                            embeds.push(new discord_js_1.EmbedBuilder()
                                .setTitle("\uD83D\uDFE2 Current: ".concat(current.name))
                                .setDescription("\u23F1 **Ends:** <t:".concat(Math.floor(current.endTime.getTime() / 1000), ":R>\n") +
                                "\uD83D\uDD70 **Ends at:** <t:".concat(Math.floor(current.endTime.getTime() / 1000), ":F>"))
                                .setThumbnail((_c = current.icon) !== null && _c !== void 0 ? _c : null)
                                .setFooter({ text: current.map }));
                        }
                        durationMin = Math.round((next.endTime.getTime() - next.startTime.getTime()) / 60000);
                        embeds.push(new discord_js_1.EmbedBuilder()
                            .setTitle("\uD83D\uDD1C Next: ".concat(next.name))
                            .setDescription("\uD83D\uDD52 **Starts:** <t:".concat(Math.floor(next.startTime.getTime() / 1000), ":R>\n") +
                            "\uD83D\uDD70 **Starts at:** <t:".concat(Math.floor(next.startTime.getTime() / 1000), ":F>\n") +
                            "\uD83D\uDD70 **Ends at:** <t:".concat(Math.floor(next.endTime.getTime() / 1000), ":F>\n") +
                            "\u23F1 **Duration:** ".concat(durationMin, "m"))
                            .setThumbnail((_d = next.icon) !== null && _d !== void 0 ? _d : null)
                            .setFooter({ text: next.map }));
                        return [4 /*yield*/, this.channel.send({
                                content: "".concat(role),
                                embeds: embeds,
                            })];
                    case 6:
                        msg = _f.sent();
                        return [2 /*return*/, {
                                messageId: msg.id,
                                currentKey: (_e = current === null || current === void 0 ? void 0 : current.key) !== null && _e !== void 0 ? _e : null,
                                nextKey: next.key,
                            }];
                }
            });
        });
    };
    /**
     * Role ping (spam is intentional)
     */
    MessageService.prototype.sendPing = function (event, role) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.channel.send("".concat(role, " **").concat(event.name, "** is starting soon on **").concat(event.map, "**!"))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return MessageService;
}());
exports.MessageService = MessageService;
