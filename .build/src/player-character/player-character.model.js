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
const artifact_model_1 = require("../artifact/artifact.model");
const character_model_1 = require("../character/character.model");
const player_model_1 = require("../player/player.model");
const weapon_model_1 = require("../weapon/weapon.model");
let BuildWeapon = class BuildWeapon {
};
__decorate([
    graphql_1.Field(() => Number),
    __metadata("design:type", Number)
], BuildWeapon.prototype, "oid", void 0);
__decorate([
    graphql_1.Field(() => Number),
    __metadata("design:type", Number)
], BuildWeapon.prototype, "count", void 0);
BuildWeapon = __decorate([
    graphql_1.ObjectType()
], BuildWeapon);
exports.BuildWeapon = BuildWeapon;
let BuildSet = class BuildSet {
};
__decorate([
    graphql_1.Field(() => Number),
    __metadata("design:type", Number)
], BuildSet.prototype, "oid", void 0);
__decorate([
    graphql_1.Field(() => Number),
    __metadata("design:type", Number)
], BuildSet.prototype, "activation_number", void 0);
BuildSet = __decorate([
    graphql_1.ObjectType()
], BuildSet);
exports.BuildSet = BuildSet;
let BuildStats = class BuildStats {
};
__decorate([
    graphql_1.Field(() => Number),
    __metadata("design:type", Number)
], BuildStats.prototype, "buildId", void 0);
__decorate([
    graphql_1.Field(() => [BuildWeapon]),
    __metadata("design:type", Array)
], BuildStats.prototype, "weapons", void 0);
__decorate([
    graphql_1.Field(() => [BuildSet]),
    __metadata("design:type", Array)
], BuildStats.prototype, "artifacts", void 0);
__decorate([
    graphql_1.Field(() => Number),
    __metadata("design:type", Number)
], BuildStats.prototype, "count", void 0);
BuildStats = __decorate([
    graphql_1.ObjectType()
], BuildStats);
exports.BuildStats = BuildStats;
let CharacterStats = class CharacterStats {
};
__decorate([
    graphql_1.Field(() => Number),
    __metadata("design:type", Number)
], CharacterStats.prototype, "oid", void 0);
__decorate([
    graphql_1.Field(() => [BuildStats]),
    __metadata("design:type", Array)
], CharacterStats.prototype, "builds", void 0);
__decorate([
    graphql_1.Field(() => [Number]),
    __metadata("design:type", Array)
], CharacterStats.prototype, "constellations", void 0);
__decorate([
    graphql_1.Field(() => Number),
    __metadata("design:type", Number)
], CharacterStats.prototype, "total", void 0);
CharacterStats = __decorate([
    graphql_1.ObjectType()
], CharacterStats);
exports.CharacterStats = CharacterStats;
let PlayerCharacter = class PlayerCharacter {
};
__decorate([
    graphql_1.Field(() => String),
    __metadata("design:type", mongoose_1.Schema.Types.ObjectId)
], PlayerCharacter.prototype, "_id", void 0);
__decorate([
    graphql_1.Field(() => Number),
    mongoose_2.Prop({ required: true }),
    __metadata("design:type", Number)
], PlayerCharacter.prototype, "oid", void 0);
__decorate([
    graphql_1.Field(() => String),
    mongoose_2.Prop({
        type: mongoose_1.Schema.Types.ObjectId,
        ref: character_model_1.Character.name,
        required: true,
    }),
    __metadata("design:type", mongoose_1.Schema.Types.ObjectId)
], PlayerCharacter.prototype, "character", void 0);
__decorate([
    graphql_1.Field(() => String),
    mongoose_2.Prop({
        type: mongoose_1.Schema.Types.ObjectId,
        ref: player_model_1.Player.name,
        required: true,
    }),
    __metadata("design:type", mongoose_1.Schema.Types.ObjectId)
], PlayerCharacter.prototype, "player", void 0);
__decorate([
    graphql_1.Field(() => [String]),
    mongoose_2.Prop({
        type: [mongoose_1.Schema.Types.ObjectId],
        ref: artifact_model_1.Artifact.name,
        required: true,
    }),
    __metadata("design:type", Array)
], PlayerCharacter.prototype, "artifacts", void 0);
__decorate([
    graphql_1.Field(() => Number),
    mongoose_2.Prop({ required: true }),
    __metadata("design:type", Number)
], PlayerCharacter.prototype, "constellation", void 0);
__decorate([
    graphql_1.Field(() => Number),
    mongoose_2.Prop({ required: true }),
    __metadata("design:type", Number)
], PlayerCharacter.prototype, "fetter", void 0);
__decorate([
    graphql_1.Field(() => Number),
    mongoose_2.Prop({ required: true }),
    __metadata("design:type", Number)
], PlayerCharacter.prototype, "level", void 0);
__decorate([
    graphql_1.Field(() => String),
    mongoose_2.Prop({
        type: mongoose_1.Schema.Types.ObjectId,
        ref: weapon_model_1.Weapon.name,
        required: true,
    }),
    __metadata("design:type", mongoose_1.Schema.Types.ObjectId)
], PlayerCharacter.prototype, "weapon", void 0);
PlayerCharacter = __decorate([
    graphql_1.ObjectType(),
    mongoose_2.Schema({ timestamps: true })
], PlayerCharacter);
exports.PlayerCharacter = PlayerCharacter;
exports.PlayerCharacterSchema = mongoose_2.SchemaFactory.createForClass(PlayerCharacter);
exports.default = mongoose_1.default.model(PlayerCharacter.name, exports.PlayerCharacterSchema);
//# sourceMappingURL=player-character.model.js.map