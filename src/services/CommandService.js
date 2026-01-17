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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandService = void 0;
var discord_js_1 = require("discord.js");
var fs_1 = require("fs");
var path_1 = require("path");
var SetupEvents_js_1 = require("./SetupEvents.js");
var MetaforgeService_js_1 = require("./MetaforgeService.js");
var EventMessage_js_1 = require("../domains/EventMessage.js");
var CONFIG_PATH = path_1.default.resolve(process.cwd(), 'src', 'config', 'bot-config.json');
var SETUP_MODAL_ID = 'setup-modal';
var NEXT_EVENT_SELECT_ID = 'next-event-select';
var CommandService = /** @class */ (function () {
    function CommandService(client) {
        this.metaforge = new MetaforgeService_js_1.MetaforgeService();
        this.client = client;
    }
    CommandService.prototype.register = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                this.client.on('interactionCreate', function (interaction) { return __awaiter(_this, void 0, void 0, function () {
                    var err_1;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 11, , 12]);
                                if (!interaction.isChatInputCommand()) return [3 /*break*/, 6];
                                if (!(interaction.commandName === 'next-event')) return [3 /*break*/, 2];
                                return [4 /*yield*/, this.handleNextEvent(interaction)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                            case 2:
                                if (!(interaction.commandName === 'setup')) return [3 /*break*/, 4];
                                return [4 /*yield*/, this.handleSetup(interaction)];
                            case 3:
                                _a.sent();
                                return [2 /*return*/];
                            case 4:
                                if (!(interaction.commandName === 'reset-setup')) return [3 /*break*/, 6];
                                return [4 /*yield*/, this.handleResetSetup(interaction)];
                            case 5:
                                _a.sent();
                                return [2 /*return*/];
                            case 6:
                                if (!interaction.isStringSelectMenu()) return [3 /*break*/, 8];
                                if (!(interaction.customId === NEXT_EVENT_SELECT_ID)) return [3 /*break*/, 8];
                                return [4 /*yield*/, this.handleNextEventSelect(interaction)];
                            case 7:
                                _a.sent();
                                return [2 /*return*/];
                            case 8:
                                if (!interaction.isModalSubmit()) return [3 /*break*/, 10];
                                if (!(interaction.customId === SETUP_MODAL_ID)) return [3 /*break*/, 10];
                                return [4 /*yield*/, this.handleSetupSubmit(interaction)];
                            case 9:
                                _a.sent();
                                return [2 /*return*/];
                            case 10: return [3 /*break*/, 12];
                            case 11:
                                err_1 = _a.sent();
                                console.error('❌ CommandService error:', err_1);
                                return [3 /*break*/, 12];
                            case 12: return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/];
            });
        });
    };
    /* ================================================== */
    /* /next-event                                       */
    /* ================================================== */
    CommandService.prototype.buildSelect = function (events) {
        return __awaiter(this, void 0, void 0, function () {
            var names;
            var _a;
            return __generator(this, function (_b) {
                names = Array.from(new Set(events.map(function (e) { return e.name; }))).sort(function (a, b) { return a.localeCompare(b); });
                return [2 /*return*/, new discord_js_1.ActionRowBuilder().addComponents((_a = new discord_js_1.StringSelectMenuBuilder()
                        .setCustomId(NEXT_EVENT_SELECT_ID)
                        .setPlaceholder('Select an event'))
                        .addOptions.apply(_a, __spreadArray([{ label: 'All', value: 'all' }], names.map(function (name) { return ({
                        label: name,
                        value: name,
                    }); }), false)))];
            });
        });
    };
    CommandService.prototype.handleNextEvent = function (interaction) {
        return __awaiter(this, void 0, void 0, function () {
            var now, events, futureEvents, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = Date.now();
                        return [4 /*yield*/, this.metaforge.fetchEvents()];
                    case 1:
                        events = (_a.sent()).map(function (e) { return new EventMessage_js_1.EventMessage(e); });
                        futureEvents = events.filter(function (e) { return e.startTime.getTime() > now; });
                        if (!!futureEvents.length) return [3 /*break*/, 3];
                        return [4 /*yield*/, interaction.reply({
                                content: '⏳ No upcoming events yet. Waiting for update.',
                                flags: discord_js_1.MessageFlags.Ephemeral,
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                    case 3: return [4 /*yield*/, this.buildSelect(futureEvents)];
                    case 4:
                        row = _a.sent();
                        return [4 /*yield*/, interaction.reply({
                                content: 'Select an event:',
                                components: [row],
                                flags: discord_js_1.MessageFlags.Ephemeral,
                            })];
                    case 5:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    CommandService.prototype.handleNextEventSelect = function (interaction) {
        return __awaiter(this, void 0, void 0, function () {
            var now, events, futureEvents, grouped, _i, futureEvents_1, e, list_1, row, lines, _loop_1, _a, grouped_1, _b, name_1, list_2, embed_1, name, list, nextTime, runs, minsUntil, hours, minutes, durationMinutes, maps, embed;
            var _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        now = Date.now();
                        return [4 /*yield*/, this.metaforge.fetchEvents()];
                    case 1:
                        events = (_e.sent()).map(function (e) { return new EventMessage_js_1.EventMessage(e); });
                        futureEvents = events.filter(function (e) { return e.startTime.getTime() > now; });
                        if (!!futureEvents.length) return [3 /*break*/, 3];
                        return [4 /*yield*/, interaction.update({
                                content: '⏳ No upcoming events.',
                                components: [],
                            })];
                    case 2:
                        _e.sent();
                        return [2 /*return*/];
                    case 3:
                        grouped = new Map();
                        for (_i = 0, futureEvents_1 = futureEvents; _i < futureEvents_1.length; _i++) {
                            e = futureEvents_1[_i];
                            list_1 = (_c = grouped.get(e.name)) !== null && _c !== void 0 ? _c : [];
                            list_1.push(e);
                            grouped.set(e.name, list_1);
                        }
                        return [4 /*yield*/, this.buildSelect(futureEvents)];
                    case 4:
                        row = _e.sent();
                        if (!(interaction.values[0] === 'all')) return [3 /*break*/, 6];
                        lines = [];
                        _loop_1 = function (name_1, list_2) {
                            var nextTime_1 = Math.min.apply(Math, list_2.map(function (e) { return e.startTime.getTime(); }));
                            var runs_1 = list_2.filter(function (e) { return e.startTime.getTime() === nextTime_1; });
                            var minsUntil_1 = Math.floor((nextTime_1 - now) / 60000);
                            var hours_1 = Math.floor(minsUntil_1 / 60);
                            var minutes_1 = minsUntil_1 % 60;
                            var durationMinutes_1 = Math.round((runs_1[0].endTime.getTime() -
                                runs_1[0].startTime.getTime()) /
                                60000);
                            var maps_1 = runs_1.map(function (e) { return e.map; }).join(', ');
                            lines.push("\u2022 **".concat(name_1, "** \u2014 Next in: ").concat(hours_1, "h ").concat(minutes_1, "m \u00B7 Duration: ").concat(durationMinutes_1, "m \u00B7 Maps: ").concat(maps_1));
                        };
                        for (_a = 0, grouped_1 = grouped; _a < grouped_1.length; _a++) {
                            _b = grouped_1[_a], name_1 = _b[0], list_2 = _b[1];
                            _loop_1(name_1, list_2);
                        }
                        embed_1 = new discord_js_1.EmbedBuilder()
                            .setTitle('All Upcoming Events')
                            .setDescription(lines.join('\n'));
                        return [4 /*yield*/, interaction.update({
                                embeds: [embed_1],
                                components: [row],
                            })];
                    case 5:
                        _e.sent();
                        return [2 /*return*/];
                    case 6:
                        name = interaction.values[0];
                        list = grouped.get(name);
                        if (!!list) return [3 /*break*/, 8];
                        return [4 /*yield*/, interaction.update({
                                content: '⏳ Event no longer available.',
                                components: [row],
                            })];
                    case 7:
                        _e.sent();
                        return [2 /*return*/];
                    case 8:
                        nextTime = Math.min.apply(Math, list.map(function (e) { return e.startTime.getTime(); }));
                        runs = list.filter(function (e) { return e.startTime.getTime() === nextTime; });
                        minsUntil = Math.floor((nextTime - now) / 60000);
                        hours = Math.floor(minsUntil / 60);
                        minutes = minsUntil % 60;
                        durationMinutes = Math.round((runs[0].endTime.getTime() -
                            runs[0].startTime.getTime()) /
                            60000);
                        maps = runs.map(function (e) { return e.map; }).join(', ');
                        embed = new discord_js_1.EmbedBuilder()
                            .setTitle(name)
                            .setDescription("\uD83D\uDD52 Next in: **".concat(hours, "h ").concat(minutes, "m**\n") +
                            "\u23F1 Duration: **".concat(durationMinutes, "m**\n") +
                            "\uD83D\uDDFA Maps: **".concat(maps, "**"))
                            .setThumbnail((_d = runs[0].icon) !== null && _d !== void 0 ? _d : null);
                        return [4 /*yield*/, interaction.update({
                                embeds: [embed],
                                components: [row],
                            })];
                    case 9:
                        _e.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /* ================================================== */
    /* SETUP                                             */
    /* ================================================== */
    CommandService.prototype.handleSetup = function (interaction) {
        return __awaiter(this, void 0, void 0, function () {
            var modal;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!!((_a = interaction.memberPermissions) === null || _a === void 0 ? void 0 : _a.has(discord_js_1.PermissionsBitField.Flags.Administrator))) return [3 /*break*/, 2];
                        return [4 /*yield*/, interaction.reply({
                                content: '❌ Only administrators can run setup.',
                                flags: discord_js_1.MessageFlags.Ephemeral,
                            })];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                    case 2:
                        modal = new discord_js_1.ModalBuilder()
                            .setCustomId(SETUP_MODAL_ID)
                            .setTitle('Bot Setup');
                        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder()
                            .setCustomId('guildId')
                            .setLabel('Guild ID')
                            .setStyle(discord_js_1.TextInputStyle.Short)
                            .setRequired(true)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder()
                            .setCustomId('notifyChannelId')
                            .setLabel('Notify Channel ID')
                            .setStyle(discord_js_1.TextInputStyle.Short)
                            .setRequired(true)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder()
                            .setCustomId('roleChannelId')
                            .setLabel('Role Channel ID')
                            .setStyle(discord_js_1.TextInputStyle.Short)
                            .setRequired(true)));
                        return [4 /*yield*/, interaction.showModal(modal)];
                    case 3:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    CommandService.prototype.handleSetupSubmit = function (interaction) {
        return __awaiter(this, void 0, void 0, function () {
            var config;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!interaction.isModalSubmit())
                            return [2 /*return*/];
                        config = {
                            configured: true,
                            guildId: interaction.fields.getTextInputValue('guildId'),
                            notifyChannelId: interaction.fields.getTextInputValue('notifyChannelId'),
                            roleChannelId: interaction.fields.getTextInputValue('roleChannelId'),
                        };
                        fs_1.default.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
                        return [4 /*yield*/, interaction.reply({
                                content: '✅ Setup complete. Applying now…',
                                flags: discord_js_1.MessageFlags.Ephemeral,
                            })];
                    case 1:
                        _a.sent();
                        SetupEvents_js_1.SetupEvents.emit('setup-complete');
                        return [2 /*return*/];
                }
            });
        });
    };
    CommandService.prototype.handleResetSetup = function (interaction) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        fs_1.default.writeFileSync(CONFIG_PATH, JSON.stringify({}, null, 2));
                        return [4 /*yield*/, interaction.reply({
                                content: '🔄 Setup reset. Run /setup again.',
                                flags: discord_js_1.MessageFlags.Ephemeral,
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return CommandService;
}());
exports.CommandService = CommandService;
