import { Model } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { ListArtifactSetInput } from './artifact-set.inputs';
import { ArtifactSet, ArtifactSetDocument } from './artifact-set.model';

@Injectable()
export class ArtifactSetService {
  constructor(
    @InjectModel(ArtifactSet.name)
    private artifactSetModel: Model<ArtifactSetDocument>,
  ) {}

  list(filters: ListArtifactSetInput) {
    return this.artifactSetModel.find({ ...filters }).exec();
  }
}
