"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = require("path");
const common_1 = require("@nestjs/common");
const graphql_1 = require("@nestjs/graphql");
const mongoose_1 = require("@nestjs/mongoose");
const abyss_battle_module_1 = require("../abyss-battle/abyss-battle.module");
const artifact_set_module_1 = require("../artifact-set/artifact-set.module");
const artifact_module_1 = require("../artifact/artifact.module");
const character_module_1 = require("../character/character.module");
const player_character_module_1 = require("../player-character/player-character.module");
const player_module_1 = require("../player/player.module");
const weapon_module_1 = require("../weapon/weapon.module");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
dotenv_1.default.config();
const URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.jvgf0.mongodb.net/${process.env.DATABASE}?retryWrites=true&w=majority`;
let AppModule = class AppModule {
};
AppModule = __decorate([
    common_1.Module({
        imports: [
            mongoose_1.MongooseModule.forRoot(URI),
            graphql_1.GraphQLModule.forRoot({
                autoSchemaFile: path_1.join(process.cwd(), 'src/schema.gql'),
                sortSchema: true,
                playground: true,
                debug: false,
            }),
            abyss_battle_module_1.AbyssBattleModule,
            artifact_module_1.ArtifactModule,
            artifact_set_module_1.ArtifactSetModule,
            character_module_1.CharacterModule,
            player_module_1.PlayerModule,
            player_character_module_1.PlayerCharacterModule,
            weapon_module_1.WeaponModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
exports.AppModule = AppModule;
//# sourceMappingURL=app.module.js.map