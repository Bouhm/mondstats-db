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
const artifact_set_model_1 = require("../artifact-set/artifact-set.model");
let Artifact = class Artifact {
};
__decorate([
    graphql_1.Field(() => String),
    __metadata("design:type", mongoose_1.Schema.Types.ObjectId)
], Artifact.prototype, "_id", void 0);
__decorate([
    graphql_1.Field(() => Number),
    mongoose_2.Prop({ required: true, unique: true }),
    __metadata("design:type", Number)
], Artifact.prototype, "oid", void 0);
__decorate([
    graphql_1.Field(() => String),
    mongoose_2.Prop({ required: true }),
    __metadata("design:type", String)
], Artifact.prototype, "icon", void 0);
__decorate([
    graphql_1.Field(() => String),
    mongoose_2.Prop({ required: true }),
    __metadata("design:type", String)
], Artifact.prototype, "name", void 0);
__decorate([
    graphql_1.Field(() => Number),
    mongoose_2.Prop({ required: true }),
    __metadata("design:type", Number)
], Artifact.prototype, "pos", void 0);
__decorate([
    graphql_1.Field(() => String),
    mongoose_2.Prop({ required: true }),
    __metadata("design:type", String)
], Artifact.prototype, "pos_name", void 0);
__decorate([
    graphql_1.Field(() => Number),
    mongoose_2.Prop({ required: true }),
    __metadata("design:type", Number)
], Artifact.prototype, "rarity", void 0);
__decorate([
    graphql_1.Field(() => String),
    mongoose_2.Prop({
        type: mongoose_1.Schema.Types.ObjectId,
        ref: artifact_set_model_1.ArtifactSet.name,
        required: true,
    }),
    __metadata("design:type", mongoose_1.Schema.Types.ObjectId)
], Artifact.prototype, "set", void 0);
Artifact = __decorate([
    graphql_1.ObjectType(),
    mongoose_2.Schema({ timestamps: true })
], Artifact);
exports.Artifact = Artifact;
exports.ArtifactSchema = mongoose_2.SchemaFactory.createForClass(Artifact);
exports.default = mongoose_1.default.model(Artifact.name, exports.ArtifactSchema);
//# sourceMappingURL=artifact.model.js.map