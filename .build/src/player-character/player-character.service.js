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
const artifact_set_model_1 = require("src/artifact-set/artifact-set.model");
const common_1 = require("@nestjs/common");
const mongoose_2 = require("@nestjs/mongoose");
const player_character_model_1 = require("./player-character.model");
function _getActivationNumber(count, affixes) {
    const activations = lodash_1.default.map(affixes, (effect) => effect.activation_number);
    let activation = 0;
    lodash_1.default.forEach(activations, (activation_num) => {
        if (count >= activation_num) {
            activation = activation_num;
        }
    });
    return activation;
}
let PlayerCharacterService = class PlayerCharacterService {
    constructor(playerCharacterModel) {
        this.playerCharacterModel = playerCharacterModel;
    }
    list(filter) {
        const queryFilter = {};
        const queryMatch = {};
        if (filter) {
            const { charIds, uids, f2p } = filter;
            if (charIds && charIds.length > 0) {
                queryFilter['charIds'] = { $in: charIds };
            }
            if (uids && uids.length > 0) {
                queryFilter['uid'] = { $in: uids };
            }
            if (f2p) {
                queryMatch['rarity'] = { $lt: 5 };
            }
        }
        return this.playerCharacterModel
            .find(queryFilter)
            .populate({
            path: 'weapon',
            select: 'oid rarity -_id',
            match: queryMatch,
        })
            .populate({
            path: 'artifacts',
            populate: {
                path: 'set',
                model: artifact_set_model_1.ArtifactSet.name,
                select: 'oid affixes -_id',
            },
        })
            .exec();
    }
    aggregate(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            const characterData = [];
            const playerCharacters = yield this.list(filter);
            lodash_1.default.forEach(playerCharacters, ({ oid, weapon, artifacts, constellation, level }) => {
                const charWeapon = weapon;
                const playerSets = {};
                lodash_1.default.forEach(artifacts, (relic) => {
                    if (playerSets.hasOwnProperty(relic['set'].oid)) {
                        playerSets[relic['set'].oid].count++;
                    }
                    else {
                        playerSets[relic['set'].oid] = {
                            count: 1,
                            affixes: relic['set'].affixes,
                        };
                    }
                });
                if (lodash_1.default.keys(playerSets).length > 2)
                    return;
                let buildIdNum = -1;
                const artifactSetCombinations = [];
                lodash_1.default.forIn(playerSets, (set, oid) => {
                    const activationNum = _getActivationNumber(set.count, set.affixes);
                    buildIdNum += parseInt(oid) * activationNum;
                    if (activationNum > 1) {
                        artifactSetCombinations.push({
                            oid: parseInt(oid),
                            activation_number: activationNum,
                        });
                    }
                });
                const charIdx = lodash_1.default.findIndex(characterData, { oid });
                if (charIdx > -1) {
                    characterData[charIdx].constellations[constellation]++;
                    const buildIdx = lodash_1.default.findIndex(characterData[charIdx].builds, { buildId: buildIdNum });
                    if (buildIdx < 0) {
                        characterData[charIdx].builds.push({
                            buildId: buildIdNum,
                            weapons: [{ oid: charWeapon.oid, count: 1 }],
                            artifacts: artifactSetCombinations,
                            count: 1,
                        });
                    }
                    else {
                        const weaponIdx = lodash_1.default.findIndex(characterData[charIdx].builds[buildIdx].weapons, {
                            oid: charWeapon.oid,
                        });
                        if (weaponIdx < 0) {
                            characterData[charIdx].builds[buildIdx].weapons.push({ oid: charWeapon.oid, count: 1 });
                        }
                        else {
                            characterData[charIdx].builds[buildIdx].weapons[weaponIdx].count++;
                        }
                        characterData[charIdx].builds[buildIdx].count++;
                    }
                    characterData[charIdx].total++;
                }
                else {
                    const constellations = new Array(7).fill(0);
                    constellations[constellation] = 1;
                    characterData.push({
                        oid,
                        constellations,
                        builds: [
                            {
                                buildId: buildIdNum,
                                weapons: [{ oid: charWeapon.oid, count: 1 }],
                                artifacts: artifactSetCombinations,
                                count: 1,
                            },
                        ],
                        total: 1,
                    });
                }
            });
            lodash_1.default.forEach(characterData, ({ builds }, i) => {
                characterData[i].builds = lodash_1.default.take(lodash_1.default.orderBy(builds, 'count', 'desc'), 10);
            });
            return characterData;
        });
    }
};
PlayerCharacterService = __decorate([
    common_1.Injectable(),
    __param(0, mongoose_2.InjectModel(player_character_model_1.PlayerCharacter.name)),
    __metadata("design:paramtypes", [mongoose_1.Model])
], PlayerCharacterService);
exports.PlayerCharacterService = PlayerCharacterService;
//# sourceMappingURL=player-character.service.js.map