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

    if (queryFilter) {
      const { oids } = filter;
      if (oids && oids.length > 0) {
        queryFilter['oid'] = { $in: oids };
      }
    }

    return this.artifactModel.find(queryFilter).exec();
  }
}
