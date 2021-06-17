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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const graphql_1 = require("@nestjs/graphql");
const mongoose_2 = require("@nestjs/mongoose");
const player_character_model_1 = require("../player-character/player-character.model");
const player_model_1 = require("../player/player.model");
let PartyStats = class PartyStats {
};
__decorate([
    graphql_1.Field(() => [Number]),
    __metadata("design:type", Array)
], PartyStats.prototype, "party", void 0);
__decorate([
    graphql_1.Field(() => Number),
    __metadata("design:type", Number)
], PartyStats.prototype, "count", void 0);
PartyStats = __decorate([
    graphql_1.ObjectType()
], PartyStats);
exports.PartyStats = PartyStats;
let AbyssStats = class AbyssStats {
};
__decorate([
    graphql_1.Field(() => [[PartyStats]]),
    __metadata("design:type", Array)
], AbyssStats.prototype, "party_stats", void 0);
__decorate([
    graphql_1.Field(() => String),
    __metadata("design:type", String)
], AbyssStats.prototype, "floor_level", void 0);
AbyssStats = __decorate([
    graphql_1.ObjectType()
], AbyssStats);
exports.AbyssStats = AbyssStats;
let AbyssBattle = class AbyssBattle {
};
__decorate([
    graphql_1.Field(() => String),
    __metadata("design:type", mongoose_1.Schema.Types.ObjectId)
], AbyssBattle.prototype, "_id", void 0);
__decorate([
    graphql_1.Field(() => String),
    mongoose_2.Prop({ required: true }),
    __metadata("design:type", String)
], AbyssBattle.prototype, "floor_level", void 0);
__decorate([
    graphql_1.Field(() => Number),
    mongoose_2.Prop({ required: true }),
    __metadata("design:type", Number)
], AbyssBattle.prototype, "battle_index", void 0);
__decorate([
    graphql_1.Field(() => String),
    mongoose_2.Prop({
        type: mongoose_1.Schema.Types.ObjectId,
        ref: player_model_1.Player.name,
        required: true,
    }),
    __metadata("design:type", mongoose_1.Schema.Types.ObjectId)
], AbyssBattle.prototype, "player", void 0);
__decorate([
    graphql_1.Field(() => [String]),
    mongoose_2.Prop({
        type: [mongoose_1.Schema.Types.ObjectId],
        ref: player_character_model_1.PlayerCharacter.name,
        required: true,
    }),
    __metadata("design:type", Array)
], AbyssBattle.prototype, "party", void 0);
AbyssBattle = __decorate([
    graphql_1.ObjectType(),
    mongoose_2.Schema({ timestamps: true })
], AbyssBattle);
exports.AbyssBattle = AbyssBattle;
exports.AbyssBattleSchema = mongoose_2.SchemaFactory.createForClass(AbyssBattle);
exports.default = mongoose_1.default.model(AbyssBattle.name, exports.AbyssBattleSchema);
//# sourceMappingURL=abyss-battle.model.js.map