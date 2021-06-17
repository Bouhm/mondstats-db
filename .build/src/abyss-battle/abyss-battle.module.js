"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const character_model_1 = require("src/character/character.model");
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const abyss_battle_model_1 = require("./abyss-battle.model");
const abyss_battle_resolver_1 = require("./abyss-battle.resolver");
const abyss_battle_service_1 = require("./abyss-battle.service");
let AbyssBattleModule = class AbyssBattleModule {
};
AbyssBattleModule = __decorate([
    common_1.Module({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: abyss_battle_model_1.AbyssBattle.name, schema: abyss_battle_model_1.AbyssBattleSchema },
                { name: character_model_1.Character.name, schema: character_model_1.CharacterSchema },
            ]),
        ],
        providers: [abyss_battle_service_1.AbyssBattleService, abyss_battle_resolver_1.AbyssBattleResolver],
    })
], AbyssBattleModule);
exports.AbyssBattleModule = AbyssBattleModule;
//# sourceMappingURL=abyss-battle.module.js.map