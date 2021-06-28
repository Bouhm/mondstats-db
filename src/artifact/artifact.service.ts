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

  list(filter: ListArtifactInput) {
    const queryFilter = {};

    if (filter) {
      const { ids } = filter;
      if (ids && ids.length > 0) {
        queryFilter['id'] = { $in: ids };
      }
    }

    return this.artifactModel.find(queryFilter).lean().exec();
  }
}
