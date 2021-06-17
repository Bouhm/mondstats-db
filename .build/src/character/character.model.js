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
let Constellation = class Constellation {
};
__decorate([
    graphql_1.Field(() => String),
    __metadata("design:type", String)
], Constellation.prototype, "effect", void 0);
__decorate([
    graphql_1.Field(() => Number),
    __metadata("design:type", Number)
], Constellation.prototype, "oid", void 0);
__decorate([
    graphql_1.Field(() => String),
    __metadata("design:type", String)
], Constellation.prototype, "name", void 0);
__decorate([
    graphql_1.Field(() => Number),
    __metadata("design:type", Number)
], Constellation.prototype, "pos", void 0);
__decorate([
    graphql_1.Field(() => String),
    __metadata("design:type", String)
], Constellation.prototype, "icon", void 0);
Constellation = __decorate([
    graphql_1.ObjectType()
], Constellation);
exports.Constellation = Constellation;
let Character = class Character {
};
__decorate([
    graphql_1.Field(() => String),
    __metadata("design:type", mongoose_1.Schema.Types.ObjectId)
], Character.prototype, "_id", void 0);
__decorate([
    graphql_1.Field(() => Number),
    mongoose_2.Prop({ required: true, unique: true }),
    __metadata("design:type", Number)
], Character.prototype, "oid", void 0);
__decorate([
    graphql_1.Field(() => [Constellation]),
    mongoose_2.Prop({ required: true }),
    __metadata("design:type", Array)
], Character.prototype, "constellations", void 0);
__decorate([
    graphql_1.Field(() => String),
    mongoose_2.Prop({ required: true }),
    __metadata("design:type", String)
], Character.prototype, "element", void 0);
__decorate([
    graphql_1.Field(() => String),
    mongoose_2.Prop({ required: true }),
    __metadata("design:type", String)
], Character.prototype, "name", void 0);
__decorate([
    graphql_1.Field(() => Number),
    mongoose_2.Prop({ required: true }),
    __metadata("design:type", Number)
], Character.prototype, "rarity", void 0);
__decorate([
    graphql_1.Field(() => String),
    mongoose_2.Prop({ required: true }),
    __metadata("design:type", String)
], Character.prototype, "icon", void 0);
__decorate([
    graphql_1.Field(() => String),
    mongoose_2.Prop({ required: true }),
    __metadata("design:type", String)
], Character.prototype, "image", void 0);
Character = __decorate([
    graphql_1.ObjectType(),
    mongoose_2.Schema({ timestamps: true })
], Character);
exports.Character = Character;
exports.CharacterSchema = mongoose_2.SchemaFactory.createForClass(Character);
exports.default = mongoose_1.default.model(Character.name, exports.CharacterSchema);
//# sourceMappingURL=character.model.js.map