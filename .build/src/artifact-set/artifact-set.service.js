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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const common_1 = require("@nestjs/common");
const mongoose_2 = require("@nestjs/mongoose");
const artifact_set_model_1 = require("./artifact-set.model");
let ArtifactSetService = class ArtifactSetService {
    constructor(artifactSetModel) {
        this.artifactSetModel = artifactSetModel;
    }
    list(filter) {
        const queryFilter = {};
        if (queryFilter) {
            const { oids } = filter;
            if (oids && oids.length > 0) {
                queryFilter['oid'] = { $in: oids };
            }
        }
        return this.artifactSetModel.find(queryFilter).exec();
    }
};
ArtifactSetService = __decorate([
    common_1.Injectable(),
    __param(0, mongoose_2.InjectModel(artifact_set_model_1.ArtifactSet.name)),
    __metadata("design:paramtypes", [mongoose_1.Model])
], ArtifactSetService);
exports.ArtifactSetService = ArtifactSetService;
//# sourceMappingURL=artifact-set.service.js.map