"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
const mongoose_1 = require("mongoose");
const character_model_1 = require("src/character/character.model");
const common_1 = require("@nestjs/common");
const mongoose_2 = require("@nestjs/mongoose");
const abyss_battle_model_1 = require("./abyss-battle.model");
const _compareFloor = (f1, f2) => {
    const f1Strs = f1.floor_level.split('-');
    const f2Strs = f2.floor_level.split('-');
    if (parseInt(f1Strs[0]) === parseInt(f2Strs[0])) {
        return parseInt(f1Strs[1]) - parseInt(f2Strs[1]);
    }
    else {
        return parseInt(f1Strs[0]) - parseInt(f2Strs[0]);
    }
};
let AbyssBattleService = class AbyssBattleService {
    constructor(abyssBattleModel, characterModel) {
        this.abyssBattleModel = abyssBattleModel;
        this.characterModel = characterModel;
    }
    list(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            const queryFilter = {};
            const queryMatch = {};
            if (filter) {
                const { floorLevels, charIds, f2p } = filter;
                if (floorLevels && floorLevels.length > 0) {
                    queryFilter['floor_level'] = { $in: floorLevels };
                }
            }
            return this.abyssBattleModel
                .find(queryFilter)
                .populate({
                path: 'party',
                select: 'oid rarity -_id',
            })
                .exec();
        });
    }
    aggregate(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            const battleIndices = 2;
            const abyssData = [];
            const battles = yield this.list(filter);
            lodash_1.default.forEach(battles, ({ floor_level, battle_index, party }) => {
                if (filter) {
                    if (filter.charIds) {
                        if (lodash_1.default.difference(filter.charIds, party.map((member) => member.oid)).length !== 0) {
                            return;
                        }
                    }
                    if (filter.f2p) {
                        if (lodash_1.default.find(party, ({ oid, rarity }) => {
                            if (filter.charIds) {
                                return !lodash_1.default.includes(filter.charIds, oid) && rarity === 5;
                            }
                            else {
                                return rarity === 5;
                            }
                        }))
                            return;
                    }
                }
                const floorIdx = lodash_1.default.findIndex(abyssData, { floor_level });
                if (floorIdx > -1) {
                    const partyData = abyssData[floorIdx]['party_stats'];
                    const oids = lodash_1.default.map(party, (char) => char.oid).sort();
                    const partyIdx = lodash_1.default.findIndex(partyData[battle_index - 1], (battle) => lodash_1.default.isEqual(battle.party, oids));
                    if (partyIdx > -1) {
                        partyData[battle_index - 1][partyIdx].count++;
                    }
                    else {
                        if (partyData.length) {
                            partyData[battle_index - 1].push({
                                party: oids,
                                count: 1,
                            });
                        }
                        else {
                            partyData[battle_index - 1] = [
                                {
                                    party: oids,
                                    count: 1,
                                },
                            ];
                        }
                    }
                }
                else {
                    abyssData.push({
                        party_stats: new Array(battleIndices).fill([]),
                        floor_level,
                    });
                }
            });
            lodash_1.default.forEach(abyssData, ({ party_stats }) => {
                lodash_1.default.forEach(party_stats, (battle, i) => {
                    party_stats[i] = lodash_1.default.take(lodash_1.default.orderBy(battle, 'count', 'desc'), 10);
                });
            });
            return abyssData.sort(_compareFloor);
        });
    }
};
AbyssBattleService = __decorate([
    common_1.Injectable(),
    __param(0, mongoose_2.InjectModel(abyss_battle_model_1.AbyssBattle.name)),
    __param(1, mongoose_2.InjectModel(character_model_1.Character.name)),
    __metadata("design:paramtypes", [mongoose_1.Model,
        mongoose_1.Model])
], AbyssBattleService);
exports.AbyssBattleService = AbyssBattleService;
//# sourceMappingURL=abyss-battle.service.js.map