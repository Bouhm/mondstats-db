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
const artifact_model_1 = require("./artifact.model");
const artifact_resolver_1 = require("./artifact.resolver");
const artifact_service_1 = require("./artifact.service");
let ArtifactModule = class ArtifactModule {
};
ArtifactModule = __decorate([
    common_1.Module({
        imports: [mongoose_1.MongooseModule.forFeature([{ name: artifact_model_1.Artifact.name, schema: artifact_model_1.ArtifactSchema }])],
        providers: [artifact_service_1.ArtifactService, artifact_resolver_1.ArtifactResolver],
    })
], ArtifactModule);
exports.ArtifactModule = ArtifactModule;
//# sourceMappingURL=artifact.module.js.map