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
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("@nestjs/graphql");
const player_character_inputs_1 = require("./player-character.inputs");
const player_character_model_1 = require("./player-character.model");
const player_character_service_1 = require("./player-character.service");
let PlayerCharacterResolver = class PlayerCharacterResolver {
    constructor(playerCharacterService) {
        this.playerCharacterService = playerCharacterService;
    }
    playerCharacters(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.playerCharacterService.list(filter);
        });
    }
    characterStats(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.playerCharacterService.aggregate(filter);
        });
    }
};
__decorate([
    graphql_1.Query(() => [player_character_model_1.PlayerCharacter]),
    __param(0, graphql_1.Args('filter', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [player_character_inputs_1.ListPlayerCharacterInput]),
    __metadata("design:returntype", Promise)
], PlayerCharacterResolver.prototype, "playerCharacters", null);
__decorate([
    graphql_1.Query(() => [player_character_model_1.CharacterStats]),
    __param(0, graphql_1.Args('filter', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [player_character_inputs_1.ListPlayerCharacterInput]),
    __metadata("design:returntype", Promise)
], PlayerCharacterResolver.prototype, "characterStats", null);
PlayerCharacterResolver = __decorate([
    graphql_1.Resolver(),
    __metadata("design:paramtypes", [player_character_service_1.PlayerCharacterService])
], PlayerCharacterResolver);
exports.PlayerCharacterResolver = PlayerCharacterResolver;
//# sourceMappingURL=player-character.resolver.js.map