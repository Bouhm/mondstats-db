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
let Player = class Player {
};
__decorate([
    graphql_1.Field(() => String),
    __metadata("design:type", mongoose_1.Schema.Types.ObjectId)
], Player.prototype, "_id", void 0);
__decorate([
    graphql_1.Field(() => Number),
    mongoose_2.Prop({ required: true, unique: true }),
    __metadata("design:type", Number)
], Player.prototype, "uid", void 0);
__decorate([
    graphql_1.Field(() => Number),
    mongoose_2.Prop({ required: true }),
    __metadata("design:type", Number)
], Player.prototype, "total_star", void 0);
Player = __decorate([
    graphql_1.ObjectType(),
    mongoose_2.Schema({ timestamps: true })
], Player);
exports.Player = Player;
exports.PlayerSchema = mongoose_2.SchemaFactory.createForClass(Player);
exports.default = mongoose_1.default.model(Player.name, exports.PlayerSchema);
//# sourceMappingURL=player.model.js.map