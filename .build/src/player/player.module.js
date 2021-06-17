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
const player_model_1 = require("./player.model");
const player_resolver_1 = require("./player.resolver");
const player_service_1 = require("./player.service");
let PlayerModule = class PlayerModule {
};
PlayerModule = __decorate([
    common_1.Module({
        imports: [mongoose_1.MongooseModule.forFeature([{ name: player_model_1.Player.name, schema: player_model_1.PlayerSchema }])],
        providers: [player_service_1.PlayerService, player_resolver_1.PlayerResolver],
    })
], PlayerModule);
exports.PlayerModule = PlayerModule;
//# sourceMappingURL=player.module.js.map