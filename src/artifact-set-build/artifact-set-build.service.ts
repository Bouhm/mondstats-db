import { Model } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { ArtifactSetBuild, ArtifactSetBuildDocument } from './artifact-set-build.model';

@Injectable()
export class ArtifactSetBuildService {
  constructor(
    @InjectModel(ArtifactSetBuild.name)
    private artifactSetBuildModel: Model<ArtifactSetBuildDocument>,
  ) {}

  async db() {
    return await this.artifactSetBuildModel.find().lean().exec();
  }
}
