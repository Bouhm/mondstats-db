"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const character_model_1 = require("./character.model");
const character_resolver_1 = require("./character.resolver");
const character_service_1 = require("./character.service");
let CharacterModule = class CharacterModule {
};
CharacterModule = __decorate([
    common_1.Module({
        imports: [mongoose_1.MongooseModule.forFeature([{ name: character_model_1.Character.name, schema: character_model_1.CharacterSchema }])],
        providers: [character_service_1.CharacterService, character_resolver_1.CharacterResolver],
    })
], CharacterModule);
exports.CharacterModule = CharacterModule;
//# sourceMappingURL=character.module.js.map