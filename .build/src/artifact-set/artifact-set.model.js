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
let Affix = class Affix {
};
__decorate([
    graphql_1.Field(() => Number),
    __metadata("design:type", Number)
], Affix.prototype, "activation_number", void 0);
__decorate([
    graphql_1.Field(() => String),
    __metadata("design:type", String)
], Affix.prototype, "effect", void 0);
Affix = __decorate([
    graphql_1.ObjectType()
], Affix);
exports.Affix = Affix;
let ArtifactSet = class ArtifactSet {
};
__decorate([
    graphql_1.Field(() => String),
    __metadata("design:type", mongoose_1.Schema.Types.ObjectId)
], ArtifactSet.prototype, "_id", void 0);
__decorate([
    graphql_1.Field(() => Number),
    mongoose_2.Prop({ required: true, unique: true }),
    __metadata("design:type", Number)
], ArtifactSet.prototype, "oid", void 0);
__decorate([
    graphql_1.Field(() => [Affix]),
    mongoose_2.Prop({ required: true }),
    __metadata("design:type", Array)
], ArtifactSet.prototype, "affixes", void 0);
__decorate([
    graphql_1.Field(() => String),
    mongoose_2.Prop({ required: true }),
    __metadata("design:type", String)
], ArtifactSet.prototype, "name", void 0);
ArtifactSet = __decorate([
    graphql_1.ObjectType(),
    mongoose_2.Schema({ timestamps: true })
], ArtifactSet);
exports.ArtifactSet = ArtifactSet;
exports.ArtifactSetSchema = mongoose_2.SchemaFactory.createForClass(ArtifactSet);
exports.default = mongoose_1.default.model(ArtifactSet.name, exports.ArtifactSetSchema);
//# sourceMappingURL=artifact-set.model.js.map