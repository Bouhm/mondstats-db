import { Model } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { ListArtifactInput } from './artifact.inputs';
import { Artifact, ArtifactDocument } from './artifact.model';

@Injectable()
export class ArtifactService {
  constructor(
    @InjectModel(Artifact.name)
    private artifactModel: Model<ArtifactDocument>,
  ) {}

  list(filters: ListArtifactInput) {
    return this.artifactModel.find({ ...filters }).exec();
  }
}
