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
const abyss_battle_inputs_1 = require("./abyss-battle.inputs");
const abyss_battle_model_1 = require("./abyss-battle.model");
const abyss_battle_service_1 = require("./abyss-battle.service");
let AbyssBattleResolver = class AbyssBattleResolver {
    constructor(abyssBattleService) {
        this.abyssBattleService = abyssBattleService;
    }
    abyssBattles(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            const all = yield this.abyssBattleService.list(filter);
            return all;
        });
    }
    abyssStats(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            const stats = yield this.abyssBattleService.aggregate(filter);
            return stats;
        });
    }
};
__decorate([
    graphql_1.Query(() => [abyss_battle_model_1.AbyssBattle]),
    __param(0, graphql_1.Args('filter', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [abyss_battle_inputs_1.ListAbyssBattleInput]),
    __metadata("design:returntype", Promise)
], AbyssBattleResolver.prototype, "abyssBattles", null);
__decorate([
    graphql_1.Query(() => [abyss_battle_model_1.AbyssStats]),
    __param(0, graphql_1.Args('filter', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [abyss_battle_inputs_1.ListAbyssBattleInput]),
    __metadata("design:returntype", Promise)
], AbyssBattleResolver.prototype, "abyssStats", null);
AbyssBattleResolver = __decorate([
    graphql_1.Resolver(() => abyss_battle_model_1.AbyssBattle),
    __metadata("design:paramtypes", [abyss_battle_service_1.AbyssBattleService])
], AbyssBattleResolver);
exports.AbyssBattleResolver = AbyssBattleResolver;
//# sourceMappingURL=abyss-battle.resolver.js.map